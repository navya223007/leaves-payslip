require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
// const cors = require("cors"); // Removed unused package
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");
const axios = require('axios');
console.log("========================================");
console.log("🚀 STARTING SERVER VERSION 5.0 🚀");
console.log("========================================");
const PAYSLIP_API_URL = 'http://localhost:7014/api';
const app = express();
app.get("/api/health", (req, res) => res.json({ version: "5.0", status: "ok" }));
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

// ================= MIDDLEWARE =================
// Allow requests from any origin (all devices/IPs on the network)
// In payslip server (server.js)
app.use(cors({
  origin: '*',
  credentials: true,
}));

// In HRMS server (server.js)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(cookieParser());
app.use(express.json());

// 🔥 GLOBAL LOGGER
app.use((req, res, next) => {
  console.log("📡 REQUEST:", req.method, req.url);
  next();
});

// ================= DB CONNECTION =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB Connection Error:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});

// ================= TOKEN VERIFICATION =================
const verifyToken = (req, res, next) => {
  try {
    console.log("🍪 Cookies received:", req.cookies);
    const authHeader = req.headers.authorization;
    let token = req.cookies?.token;

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Access denied. Please login." });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Session expired. Please login again." });
      }

      // 🔥 VERIFY AGAINST DATABASE (TOTAL TAKEN DATABASE)
      db.query(
        "SELECT id, emp_id, name, role, department FROM users WHERE id = ?",
        [decoded.id],
        (dbErr, results) => {
          if (dbErr || results.length === 0) {
            return res
              .status(403)
              .json({ message: "User not found or session invalid" });
          }

          req.user = results[0];
          next();
        },
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Token verification failed" });
  }
};

// ================= AUTH APIs =================
app.post("/login", (req, res) => {
  console.log("🔑 Login Attempt:", req.body);
  const { emp_id, password } = req.body;

  if (!emp_id || !password) {
    return res
      .status(400)
      .json({ message: "Employee ID and Password are required" });
  }

  db.query(
    "SELECT * FROM users WHERE LOWER(emp_id) = LOWER(?) OR LOWER(email) = LOWER(?)",
    [emp_id.trim(), emp_id.trim()],
    (err, result) => {
      if (err) {
        console.log("❌ Login DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res
          .status(401)
          .json({ message: "Invalid Employee ID or Password" });
      }

      const user = result[0];
      if (user.password.trim() !== password.trim()) {
        return res
          .status(401)
          .json({ message: "Invalid Employee ID or Password" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: String(user.role).trim().toLowerCase(),
          emp_id: user.emp_id,
        },
        SECRET_KEY,
        { expiresIn: "1d" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/", // 👈 IMPORTANT ADD THIS
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          emp_id: user.emp_id,
          role: String(user.role).trim().toLowerCase(),
          department: user.department,
        },
      });
    },
  );
});

// 🔥 NEW AUTH VERIFICATION ROUTE
// ✅ Add verifyToken middleware
app.get("/api/auth/verify", verifyToken, (req, res) => {
  console.log("✅ Token verified for user:", req.user.emp_id);
  res.json({ user: req.user });
});

// ✅ Add verifyToken middleware here too
app.get("/auth/verify", verifyToken, (req, res) => {
  console.log("✅ Token verified for user (alias):", req.user.emp_id);
  res.json({ user: req.user });
});

// 🔥 NEW LOGOUT ROUTE
app.post("/api/auth/logout", (req, res) => {
  console.log("🚪 Logging out");
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

app.get("/profile", (req, res) => {
  res.json({ message: "Protected data", user: req.user });
});

// ================= EMPLOYEE APIs =================
app.post("/create-employees", (req, res) => {
  console.log("📝 Create Employee Body:", req.body);
  const userRole = (req.user.role || "").toString().trim().toLowerCase();
  console.log("👤 User Role:", userRole);

  if (userRole !== "admin") {
    return res.status(403).json({
      message: `Access denied. Admin only. Your role: ${userRole}`,
    });
  }

  const d = req.body;

  // ================= VALIDATIONS =================

  if (!d.name || !d.email || !d.password) {
    return res.status(400).json({
      message: "Name, Email and Password are required",
    });
  }

  // EMAIL VALIDATION
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(d.email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  // EMPLOYEE VALIDATION
  if (
    d.role === "employee" &&
    (!d.department || !d.subDepartment || !d.employeeType)
  ) {
    return res.status(400).json({
      message:
        "Department, Sub Department and Employee Type are required for employees",
    });
  }

  // ================= GET LAST EMPLOYEE ID =================

  const getLastIdSql = `
    SELECT emp_id
    FROM users
    WHERE emp_id LIKE 'EMP%'
    ORDER BY CAST(SUBSTRING(emp_id, 4) AS UNSIGNED) DESC
    LIMIT 1
  `;

  db.query(getLastIdSql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    let nextEmpId = "EMP001";

    if (result.length > 0) {
      const lastEmpId = result[0].emp_id;

      const number = parseInt(lastEmpId.replace("EMP", "")) + 1;

      nextEmpId = `EMP${String(number).padStart(3, "0")}`;
    }

    // ================= INSERT USER =================

    const insertSql = `
      INSERT INTO users
      (
        emp_id,
        name,
        email,
        password,
        role,
        department,
        employeeType,
        subDepartment
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [
        nextEmpId,
        d.name.trim(),
        d.email.trim(),
        d.password,
        d.role || "employee",
        d.department || null,
        d.employeeType || null,
        d.subDepartment || null,
      ],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "Email already exists",
            });
          }

          return res.status(500).json(err);
        }

        res.status(201).json({
          message: "Employee created successfully",
          emp_id: nextEmpId,
        });
      },
    );
  });
});

app.get("/employees-reports", (req, res) => {
  db.query(
    "SELECT id, emp_id, name, email, role, department, subDepartment, employeeType FROM users",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    },
  );
});

app.get("/employees/:id", (req, res) => {
  db.query("SELECT * FROM users WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0)
      return res.status(404).json({ message: "Employee not found" });
    res.json(result[0]);
  });
});

app.put("/employees/:id", (req, res) => {
  const d = req.body;
  const sql = `
    UPDATE users 
    SET emp_id=?, name=?, email=?, role=?, department=?, subDepartment=?, employeeType=? 
    WHERE id=?
  `;

  db.query(
    sql,
    [
      d.emp_id,
      d.name,
      d.email,
      d.role,
      d.department,
      d.subDepartment,
      d.employeeType,
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Employee updated successfully" });
    },
  );
});

app.delete("/employees/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee deleted successfully" });
  });
});

// ================= LEAVE APIs =================
app.post("/api/leaves/apply", (req, res) => {
  const d = req.body;
  const sql = `
    INSERT INTO leaves
    (emp_id, name, department, leave_type, sub_type, date, selected_dates, session, reason_type, reason_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      d.emp_id,
      d.name,
      d.department,
      d.leave_type,
      d.sub_type,
      d.date,
      JSON.stringify(d.selected_dates || []),
      d.session,
      d.reason_type,
      d.reason_text,
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Leave applied successfully", id: result.insertId });
    },
  );
});

app.put("/api/leaves/update/:id", (req, res) => {
  const d = req.body;
  const sql = `
    UPDATE leaves 
    SET emp_id=?, name=?, department=?, leave_type=?, sub_type=?,
        date=?, selected_dates=?, session=?, reason_type=?, reason_text=?
    WHERE id=?
  `;

  db.query(
    sql,
    [
      d.emp_id,
      d.name,
      d.department,
      d.leave_type,
      d.sub_type,
      d.date,
      JSON.stringify(d.selected_dates || []),
      d.session,
      d.reason_type,
      d.reason_text,
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Leave updated successfully" });
    },
  );
});

app.get("/api/leaves/employee/:emp_id", (req, res) => {
  db.query(
    "SELECT * FROM leaves WHERE emp_id=? AND (employee_checked IS NULL OR employee_checked=0) ORDER BY id DESC",
    [req.params.emp_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    },
  );
});

app.get("/api/leaves/pending", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM leaves WHERE status='pending' ORDER BY id DESC",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    },
  );
});

app.put("/api/leaves/approve/:id", verifyToken, (req, res) => {
  db.query(
    "UPDATE leaves SET status='approved', action_time=NOW() WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Leave approved" });
    },
  );
});

app.put("/api/leaves/reject/:id", verifyToken, (req, res) => {
  db.query(
    "UPDATE leaves SET status='rejected', reject_reason=?, action_time=NOW() WHERE id=?",
    [req.body.reason, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Leave rejected" });
    },
  );
});

app.put("/api/leaves/mark-read/:id", verifyToken, (req, res) => {
  db.query(
    "UPDATE leaves SET employee_checked=1 WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Marked as read" });
    },
  );
});

app.get("/api/leaves/report", verifyToken, (req, res) => {
  const { role, emp_id, month, status } = req.query;
  let sql = "SELECT * FROM leaves WHERE 1=1";
  const params = [];

  if (role === "employee" || (role === "admin" && emp_id && emp_id !== "all")) {
    sql += " AND emp_id = ?";
    params.push(emp_id);
  }

  if (month && month !== "all") {
    sql += " AND MONTH(created_at) = ?";
    params.push(month);
  }

  if (status && status !== "all") {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY created_at DESC";

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    const data = result.map((r) => ({
      ...r,
      selected_dates: (() => {
        try {
          return typeof r.selected_dates === "string"
            ? JSON.parse(r.selected_dates)
            : r.selected_dates;
        } catch {
          return [];
        }
      })(),
    }));
    res.json(data);
  });
});

// ================= DASHBOARD APIs =================
app.get("/api/dashboard/admin-counts", (req, res) => {
  db.query(
    "SELECT SUM(status='pending') AS pending, SUM(status='approved') AS approved, SUM(status='rejected') AS rejected FROM leaves",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0] || { pending: 0, approved: 0, rejected: 0 });
    },
  );
});

// ================= DAILY STATUS APIs =================
app.post("/api/daily-status", (req, res) => {
  const d = req.body;
  db.query(
    "INSERT INTO daily_status (emp_id, project_name, subtask, assigned_by, status_date, status_month, status_year) VALUES (?, ?, ?, ?, CURDATE(), MONTH(CURDATE()), YEAR(CURDATE()))",
    [d.emp_id, d.project_name, d.subtask, d.assigned_by],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Daily status submitted" });
    },
  );
});

app.get("/api/daily-status/report", (req, res) => {
  const { emp_id, month, status } = req.query;
  let sql =
    "SELECT d.*, u.name, u.department FROM daily_status d LEFT JOIN users u ON d.emp_id=u.emp_id WHERE 1=1";
  const params = [];

  if (emp_id && emp_id !== "all") {
    sql += " AND d.emp_id=?";
    params.push(emp_id);
  }

  if (month && month !== "all") {
    sql += " AND d.status_month=?";
    params.push(Number(month));
  }

  if (status && status !== "all") {
    sql += " AND d.status=?";
    params.push(status);
  }

  sql += " ORDER BY d.status_date DESC";

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.put("/api/daily-status/update/:id", (req, res) => {
  const { project_name, subtask, assigned_by } = req.body;
  const sql =
    "UPDATE daily_status SET project_name=?, subtask=?, assigned_by=? WHERE id=?";
  db.query(sql, [project_name, subtask, assigned_by, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Status updated successfully" });
  });
});

app.put("/api/daily-status/approve/:id", (req, res) => {
  db.query(
    "UPDATE daily_status SET status='approved' WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Approved" });
    },
  );
});

app.put("/api/daily-status/reject/:id", (req, res) => {
  db.query(
    "UPDATE daily_status SET status='rejected' WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Rejected" });
    },
  );
});
// ================= PROXY ROUTES FOR PAYSLIP SERVER =================

// Proxy all employee-related requests to payslip server
app.use('/api/employees', async (req, res) => {
  try {
    // Remove '/api' from originalUrl since PAYSLIP_API_URL already has it
    const pathWithoutApi = req.originalUrl.replace('/api', '');
    const targetUrl = `${PAYSLIP_API_URL}${pathWithoutApi}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from payslip server',
      details: error.message
    });
  }
});

// Proxy all payslip-related requests to payslip server
// In HRMS server, modify the payslip proxy route
// Proxy specific payslip routes
app.get('/api/payslips/employee/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}/payslips/employee/${emp_id}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from payslip server',
      details: error.message
    });
  }
});

app.get('/api/payslips/test', async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}/payslips/test`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from payslip server',
      details: error.message
    });
  }
});
// Proxy payslip generation
app.post('/api/payslip/generate', async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.post(targetUrl, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Payslip generation error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate payslip',
      details: error.message
    });
  }
});

// Proxy payslip PDF generation
app.post('/api/payslip/pdf', async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios({
      method: 'post',
      url: targetUrl,
      data: req.body,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    response.data.pipe(res);
  } catch (error) {
    console.error('❌ PDF generation error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
});

// Proxy payslip save
app.post('/api/payslips/save', async (req, res) => {
  try {
    const pathWithoutApi = req.originalUrl.replace('/api', '');
    const targetUrl = `${PAYSLIP_API_URL}${pathWithoutApi}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    const response = await axios.post(targetUrl, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Payslip save error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to save payslip',
      details: error.message
    });
  }
});

// Proxy payslip update
app.put('/api/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.put(targetUrl, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Payslip update error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to update payslip',
      details: error.message
    });
  }
});

// Proxy payslip delete
app.delete('/api/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.delete(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Payslip delete error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to delete payslip',
      details: error.message
    });
  }
});

// Proxy reports
app.get('/api/reports/monthly/:year/:month', async (req, res) => {
  try {
    const pathWithoutApi = req.originalUrl.replace('/api', '');
    const targetUrl = `${PAYSLIP_API_URL}${pathWithoutApi}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Monthly report error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch monthly report',
      details: error.message
    });
  }
});

app.get('/api/reports/yearly/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Yearly report error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch yearly report',
      details: error.message
    });
  }
});

app.get('/api/reports/employee/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Employee history error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch employee history',
      details: error.message
    });
  }
});

// Proxy BLKPAY Excel download
app.post('/api/employees/download-excel', async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios({
      method: 'post',
      url: targetUrl,
      data: req.body,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    response.data.pipe(res);
  } catch (error) {
    console.error('❌ Excel download error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to download Excel',
      details: error.message
    });
  }
});

// Proxy payment summary PDF
app.post('/api/payment-summary/pdf', async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios({
      method: 'post',
      url: targetUrl,
      data: req.body,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    response.data.pipe(res);
  } catch (error) {
    console.error('❌ Payment summary PDF error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate payment summary PDF',
      details: error.message
    });
  }
});

// Proxy earnings endpoint
app.get('/api/employees/:emp_id/earnings', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Earnings fetch error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch earnings',
      details: error.message
    });
  }
});
// ================= STATIC FILES =================
app.use(express.static(path.join(__dirname, "/build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "./build", "index.html"));
});

// ================= START SERVER =================
const PORT = process.env.BACKEND_PORT || 7015;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
