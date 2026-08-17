require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
// const cors = require("cors"); // Removed unused package
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const cookieParser = require("cookie-parser");
const axios = require("axios");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const archiver = require("archiver");

console.log("archiver =", archiver);
console.log("typeof =", typeof archiver);

try {
  const a = archiver("zip");
  console.log("  TEST OK");
} catch (e) {
  console.log("  TEST FAILED:", e);
}
// navya
console.log("========================================");
console.log("🚀 STARTING SERVER VERSION 5.0 🚀");
console.log("========================================");
const PAYSLIP_API_URL = "http://localhost:8016/api";
const app = express();
app.get("/api/health", (req, res) =>
  res.json({ version: "5.0", status: "ok" }),
);
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

// ================= MIDDLEWARE =================
// Allow requests from any origin (all devices/IPs on the network)
// In payslip server (server.js)
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

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

// ================= MAIL CONFIG =================
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error(" Mail configuration error:", err);
  } else {
    console.log("Mail server is ready");
  }
});

// Your existing code continues

// ================= TOKEN VERIFICATION =================
const verifyToken = (req, res, next) => {
  try {
    console.log(" Cookies received:", req.cookies);
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

      //  VERIFY AGAINST DATABASE (TOTAL TAKEN DATABASE)
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

// ================= ADMIN OTP MAIL =================
const ADMIN_EMAILS = {
  ADMIN001: "bodasunavya24@gmail.com",
  // ADMIN001: "softelectronicsolutions@gmail.com",
  //  ADMIN001: "softelectronics.pvtltd@gmail.com",

  ADMIN002: "bodasunavya24@gmail.com",
  // ADMIN003: "admin3@gmail.com",
};

const otpStore = new Map();

// ===========================
// LOGIN API
// ===========================
app.post("/login", async (req, res) => {
  try {
    const loginStart = Date.now();

    console.log("🔑 Login Attempt:", {
      emp_id: req.body.emp_id,
    });

    const { emp_id, password } = req.body;

    // ===========================
    // VALIDATION
    // ===========================
    if (!emp_id || !password) {
      return res.status(400).json({
        message: "Employee ID and Password are required",
      });
    }

    const loginId = emp_id.trim();
    const loginPassword = password.trim();

    // ===========================
    // GET USER FROM DATABASE
    // ===========================
    db.query(
      "SELECT * FROM users WHERE LOWER(emp_id)=LOWER(?) OR LOWER(email)=LOWER(?)",
      [loginId, loginId],
      async (err, result) => {
        console.log("⏱️ DB query completed:", Date.now() - loginStart, "ms");

        if (err) {
          console.error("❌ DB Error:", err);

          return res.status(500).json({
            message: "Database error",
          });
        }

        console.log("👤 DB Result:", result);

        // ===========================
        // USER NOT FOUND
        // ===========================
        if (!result || result.length === 0) {
          return res.status(401).json({
            message: "Invalid Employee ID or Password",
          });
        }

        const user = result[0];

        // ===========================
        // PASSWORD CHECK
        // ===========================
        if (!user.password || user.password.trim() !== loginPassword) {
          return res.status(401).json({
            message: "Invalid Employee ID or Password",
          });
        }

        // =====================================================
        // ADMIN LOGIN - OTP REQUIRED
        // =====================================================
        if (String(user.role).trim().toLowerCase() === "admin") {
          console.log("👨‍💼 Admin login detected");

          // ===========================
          // GENERATE OTP
          // ===========================
          const otp = Math.floor(100000 + Math.random() * 900000).toString();

          // ===========================
          // STORE OTP
          // ===========================
          otpStore.set(user.emp_id, {
            otp: otp,
            expires: Date.now() + 5 * 60 * 1000,
          });

          console.log("🔐 OTP generated for:", user.emp_id);

          // ===========================
          // GET ADMIN EMAIL
          // ===========================
          const adminEmail = ADMIN_EMAILS[user.emp_id];

          if (!adminEmail) {
            console.error("❌ Admin email not configured for:", user.emp_id);

            return res.status(400).json({
              message: "Admin email not configured",
            });
          }

          console.log("📧 OTP email will be sent to:", adminEmail);

          // =====================================================
          // SEND OTP EMAIL IN BACKGROUND
          // =====================================================
          transporter
            .sendMail({
              from: process.env.MAIL_USER,
              to: adminEmail,
              subject: "Admin Login OTP",
              html: `
                <div style="font-family: Arial, sans-serif;">
                  
                  <h2>Admin Login OTP</h2>

                  <p>Hello <b>${user.name}</b>,</p>

                  <p>Your OTP for Admin Login is:</p>

                  <h1
                    style="
                      font-size: 32px;
                      letter-spacing: 5px;
                      margin: 20px 0;
                    "
                  >
                    ${otp}
                  </h1>

                  <p>
                    This OTP is valid for
                    <b>5 minutes</b>.
                  </p>

                  <p>
                    Please do not share this OTP with anyone.
                  </p>

                  <p>
                    If you did not request this login,
                    please ignore this email.
                  </p>

                </div>
              `,
            })
            .then(() => {
              console.log("✅ OTP email sent successfully to:", adminEmail);

              console.log(
                "📧 Email sending time:",
                Date.now() - loginStart,
                "ms",
              );
            })
            .catch((mailErr) => {
              console.error("❌ OTP email failed:", mailErr.message);

              // Remove OTP if email failed
              otpStore.delete(user.emp_id);

              console.error("🗑️ OTP removed because email failed");
            });

          // =====================================================
          // RESPOND IMMEDIATELY
          // =====================================================

          console.log(
            "🚀 Returning OTP response:",
            Date.now() - loginStart,
            "ms",
          );

          return res.json({
            otpRequired: true,
            emp_id: user.emp_id,
            message: "OTP sent successfully",
          });
        }

        // =====================================================
        // EMPLOYEE LOGIN
        // =====================================================

        console.log("👤 Employee login detected");

        const token = jwt.sign(
          {
            id: user.id,
            role: String(user.role).trim().toLowerCase(),
            emp_id: user.emp_id,
          },
          SECRET_KEY,
          {
            expiresIn: "1d",
          },
        );

        // ===========================
        // SET COOKIE
        // ===========================
        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 24 * 60 * 60 * 1000,
        });

        console.log(
          "✅ Employee login successful:",
          Date.now() - loginStart,
          "ms",
        );

        // ===========================
        // EMPLOYEE RESPONSE
        // ===========================
        return res.json({
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
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  }
});

app.post("/api/admin/verify-otp", (req, res) => {
  const { emp_id, otp } = req.body;

  const data = otpStore.get(emp_id);

  if (!data) {
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  if (Date.now() > data.expires) {
    otpStore.delete(emp_id);

    return res.status(400).json({
      message: "OTP expired",
    });
  }

  if (data.otp !== otp) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  otpStore.delete(emp_id);

  db.query(
    "SELECT id,name,emp_id,role,department FROM users WHERE emp_id=?",
    [emp_id],
    (err, result) => {
      if (err || result.length === 0) {
        return res.status(400).json({
          message: "User not found",
        });
      }

      const user = result[0];

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role.toLowerCase(),
          emp_id: user.emp_id,
        },
        SECRET_KEY,
        {
          expiresIn: "1d",
        },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        user,
      });
    },
  );
});
// 🔥 NEW AUTH VERIFICATION ROUTE
//   Add verifyToken middleware
app.get("/api/auth/verify", verifyToken, (req, res) => {
  console.log("  Token verified for user:", req.user.emp_id);
  res.json({ user: req.user });
});

//   Add verifyToken middleware here too
app.get("/auth/verify", verifyToken, (req, res) => {
  console.log("  Token verified for user (alias):", req.user.emp_id);
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

const designationPrefixMap = {
  TE: "SES-TE",
  SE: "SES-SE",
  HR: "SES-HR",
  TESE: "SES-TST", // Match frontend value "TESE" to backend prefix
  HE: "SES-HE", // Added support for Hardware Engineers
};

// --- CREATE EMPLOYEE ---
app.post("/create-employees", verifyToken, (req, res) => {
  console.log("📝 Create Employee Body:", req.body);
  const userRole = (req.user.role || "").toString().trim().toLowerCase();

  if (userRole !== "admin") {
    return res.status(403).json({
      message: `Access denied. Admin only. Your role: ${userRole}`,
    });
  }

  const d = req.body;

  // VALIDATIONS
  if (!d.name || !d.email || !d.password) {
    return res
      .status(400)
      .json({ message: "Name, Email and Password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(d.email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (
    d.role === "employee" &&
    (!d.department || !d.subDepartment || !d.employeeType)
  ) {
    return res.status(400).json({
      message:
        "Department, Sub Department and Employee Type are required for employees",
    });
  }

  const prefix = designationPrefixMap[d.designation];
  if (!prefix) {
    return res.status(400).json({ message: "Invalid designation selected" });
  }

  // GENERATE NEW ID
  const getLastIdSql = `SELECT emp_id FROM users WHERE emp_id LIKE '${prefix}%' ORDER BY emp_id DESC LIMIT 1`;

  db.query(getLastIdSql, (err, result) => {
    if (err) return res.status(500).json(err);

    let nextEmpId = `${prefix}001`;
    if (result.length > 0) {
      const lastEmpId = result[0].emp_id;
      const lastNumber = parseInt(lastEmpId.replace(prefix, ""));
      const nextNumber = lastNumber + 1;
      nextEmpId = `${prefix}${String(nextNumber).padStart(3, "0")}`;
    }

    const insertSql = `
      INSERT INTO users (emp_id, designation, name, email, password, role, department, employeeType, subDepartment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [
        nextEmpId,
        d.designation,
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
            return res.status(400).json({ message: "Email already exists" });
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

// --- UPDATE EMPLOYEE ---
app.put("/employees/:id", verifyToken, (req, res) => {
  const d = req.body;
  const employeeId = req.params.id;

  // First fetch existing employee record to compare designations
  db.query(
    "SELECT designation, emp_id FROM users WHERE id = ?",
    [employeeId],
    (err, currentRecord) => {
      if (err) return res.status(500).json(err);
      if (currentRecord.length === 0)
        return res.status(404).json({ message: "Employee not found" });

      const existingEmployee = currentRecord[0];
      const prefix = designationPrefixMap[d.designation];

      if (!prefix) {
        return res
          .status(400)
          .json({ message: "Invalid designation selected" });
      }

      // Execution helper to carry out the update statement execution
      const executeUpdate = (finalEmpId) => {
        const sql = `
        UPDATE users 
        SET emp_id=?, designation=?, name=?, email=?, role=?, department=?, subDepartment=?, employeeType=?
        WHERE id=?
      `;
        db.query(
          sql,
          [
            finalEmpId,
            d.designation,
            d.name,
            d.email,
            d.role,
            d.department,
            d.subDepartment,
            d.employeeType,
            employeeId,
          ],
          (err) => {
            if (err) return res.status(500).json(err);
            res.json({
              message: "Employee updated successfully",
              emp_id: finalEmpId,
            });
          },
        );
      };

      // ONLY generate a new ID if the designation has explicitly changed
      if (existingEmployee.designation !== d.designation) {
        const getLastIdSql = `SELECT emp_id FROM users WHERE emp_id LIKE ? ORDER BY emp_id DESC LIMIT 1`;
        db.query(getLastIdSql, [`${prefix}%`], (err, result) => {
          if (err) return res.status(500).json(err);

          let nextEmpId = `${prefix}001`;
          if (result.length > 0) {
            const lastEmpId = result[0].emp_id;
            const lastNumber = parseInt(lastEmpId.replace(prefix, ""));
            const nextNumber = lastNumber + 1;
            nextEmpId = `${prefix}${String(nextNumber).padStart(3, "0")}`;
          }
          executeUpdate(nextEmpId);
        });
      } else {
        // Keep old employee configuration id if designation is unmodified
        executeUpdate(existingEmployee.emp_id);
      }
    },
  );
});

// --- GET ALL REPORTS ---
app.get("/employees-reports", verifyToken, (req, res) => {
  const sql = `SELECT id, emp_id, designation, name, email, password, role, department, subDepartment, employeeType FROM users ORDER BY emp_id ASC`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// --- GET SINGLE EMPLOYEE ---
app.get("/employees/:id", verifyToken, (req, res) => {
  db.query("SELECT * FROM users WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0)
      return res.status(404).json({ message: "Employee not found" });
    res.json(result[0]);
  });
});

// --- DELETE EMPLOYEE ---
app.delete("/employees/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM users WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee deleted successfully" });
  });
});

// ================= CHANGE PASSWORD =================

app.put("/api/change-password", verifyToken, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "New Password and Confirm Password do not match",
    });
  }

  // Get logged-in user
  db.query(
    "SELECT id, password FROM users WHERE id = ?",
    [req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = result[0];

      // Verify current password
      if (user.password.trim() !== currentPassword.trim()) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      // Update password
      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [newPassword.trim(), req.user.id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              message: "Failed to update password",
            });
          }

          res.json({
            message: "Password changed successfully",
          });
        },
      );
    },
  );
});
// ================= LEAVE APIs =================
app.post("/api/leaves/apply", verifyToken, (req, res) => {
  const d = req.body;

  const now = new Date();

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Current time in minutes
  const currentTime = currentHour * 60 + currentMinute;

  const today = new Date().toISOString().split("T")[0];

  const leaveDate = d.date;

  // ======================================
  // TODAY LEAVE VALIDATION
  // ======================================

  if (leaveDate === today) {
    // Full Day Leave
    if (d.leave_type === "full") {
      if (currentTime >= 10 * 60) {
        return res.status(400).json({
          message:
            "Today's Full Day Leave can only be applied before 10:00 AM.",
        });
      }
    }

    // Half Day Leave
    if (d.leave_type === "half") {
      // Morning Session
      if (d.session === "morning" && currentTime >= 10 * 60) {
        return res.status(400).json({
          message:
            "Today's Morning Half Day Leave can only be applied before 10:00 AM.",
        });
      }

      // Afternoon Session
      // Always allowed
    }
  }

  // ======================================
  // EMERGENCY LEAVE
  // ======================================

  const isEmergency = leaveDate === today ? 1 : 0;

  const sql = `
    INSERT INTO leaves
    (
      emp_id,
      name,
      department,
      leave_type,
      sub_type,
      date,
      selected_dates,
      session,
      reason_type,
      reason_text,
      is_emergency
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      isEmergency,
    ],
    async (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database Error",
        });
      }

      // ======================================
      // SEND EMERGENCY MAIL
      // ======================================

      if (isEmergency) {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.OFFICE_MAIL,
            subject: `🚨 Emergency Leave Alert - ${d.name}`,
            html: `
              <h2>Emergency Leave Alert</h2>

              <table border="1" cellpadding="8" cellspacing="0">

                <tr>
                  <td><b>Employee ID</b></td>
                  <td>${d.emp_id}</td>
                </tr>

                <tr>
                  <td><b>Name</b></td>
                  <td>${d.name}</td>
                </tr>

                <tr>
                  <td><b>Department</b></td>
                  <td>${d.department}</td>
                </tr>

                <tr>
                  <td><b>Leave Type</b></td>
                  <td>${d.leave_type}</td>
                </tr>

                <tr>
                  <td><b>Session</b></td>
                  <td>${d.session || "-"}</td>
                </tr>

                <tr>
                  <td><b>Leave Date</b></td>
                  <td>${d.date}</td>
                </tr>

                <tr>
                  <td><b>Reason</b></td>
                  <td>${d.reason_text || d.reason_type}</td>
                </tr>

              </table>

              <br>

              <h3>
                Employee <b>${d.name}</b> has applied for an
                <span style="color:red;">EMERGENCY LEAVE</span>.
              </h3>
            `,
          });

          console.log("Emergency Leave Mail Sent");
        } catch (mailErr) {
          console.log("Mail Error:", mailErr);
        }
      }

      return res.json({
        message: "Leave applied successfully",
        id: result.insertId,
      });
    },
  );
});

app.put("/api/leaves/update/:id", verifyToken, (req, res) => {
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

app.get("/api/leaves/employee/:emp_id", verifyToken, (req, res) => {
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

  // Uses created_at timestamp to accurately capture standard calendar months
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
      // Normalize empty strings to explicit nulls so your frontend filters act reliably
      reason_text:
        r.reason_type === "other" && r.reason_text
          ? r.reason_text.trim()
          : null,
      date:
        r.leave_type === "half" ||
        (r.leave_type === "full" && r.sub_type === "single")
          ? r.date
          : null,

      selected_dates: (() => {
        if (r.leave_type === "full" && r.sub_type === "multi") {
          try {
            return typeof r.selected_dates === "string"
              ? JSON.parse(r.selected_dates)
              : r.selected_dates || [];
          } catch {
            return [];
          }
        }
        return []; // Clean fallback for non-multiple rows
      })(),
    }));

    res.json(data);
  });
});

// 10:00 AM - Tomorrow Morning Reminder
cron.schedule("0 11 * * *", async () => {
  console.log("Running Tomorrow Morning Reminder");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const leaveDate =
    tomorrow.getFullYear() +
    "-" +
    String(tomorrow.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(tomorrow.getDate()).padStart(2, "0");

  console.log("Tomorrow Date:", leaveDate);

  db.query(
    `SELECT * FROM leaves
     WHERE date=?
     AND status='approved'
     AND is_emergency=0
     AND reminder_morning_sent=0`,
    [leaveDate],
    async (err, rows) => {
      if (err) {
        console.log(err);
        return;
      }

      console.log("Rows Found:", rows.length);

      for (const leave of rows) {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.OFFICE_MAIL,
            subject: `🌞 Morning Reminder - ${leave.name} Leave Tomorrow`,
            html: `
              <h2>Morning Reminder</h2>
              <p><b>${leave.name}</b> (${leave.emp_id}) will be on leave tomorrow.</p>

              <table border="1" cellpadding="8">
                <tr><td>Name</td><td>${leave.name}</td></tr>
                <tr><td>Department</td><td>${leave.department}</td></tr>
                <tr><td>Leave Date</td><td>${leave.date}</td></tr>
                <tr><td>Leave Type</td><td>${leave.leave_type}</td></tr>
                <tr><td>Session</td><td>${leave.session || "-"}</td></tr>
                <tr><td>Reason</td><td>${leave.reason_text || leave.reason_type}</td></tr>
              </table>
            `,
          });

          db.query("UPDATE leaves SET reminder_morning_sent=1 WHERE id=?", [
            leave.id,
          ]);
        } catch (e) {
          console.log(e);
        }
      }
    },
  );
});
//  2:00 PM - Tomorrow Afternoon Reminder
cron.schedule("0 15 * * *", async () => {
  console.log("Running Tomorrow Morning Reminder");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const leaveDate =
    tomorrow.getFullYear() +
    "-" +
    String(tomorrow.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(tomorrow.getDate()).padStart(2, "0");

  console.log("Tomorrow Date:", leaveDate);

  db.query(
    `SELECT * FROM leaves
     WHERE date=?
     AND status='approved'
     AND is_emergency=0
     AND reminder_morning_sent=0`,
    [leaveDate],
    async (err, rows) => {
      if (err) {
        console.log(err);
        return;
      }

      console.log("Rows Found:", rows.length);

      for (const leave of rows) {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.OFFICE_MAIL,
            subject: `🌞 Morning Reminder - ${leave.name} Leave Tomorrow`,
            html: `
              <h2>Morning Reminder</h2>
              <p><b>${leave.name}</b> (${leave.emp_id}) will be on leave tomorrow.</p>

              <table border="1" cellpadding="8">
                <tr><td>Name</td><td>${leave.name}</td></tr>
                <tr><td>Department</td><td>${leave.department}</td></tr>
                <tr><td>Leave Date</td><td>${leave.date}</td></tr>
                <tr><td>Leave Type</td><td>${leave.leave_type}</td></tr>
                <tr><td>Session</td><td>${leave.session || "-"}</td></tr>
                <tr><td>Reason</td><td>${leave.reason_text || leave.reason_type}</td></tr>
              </table>
            `,
          });

          db.query("UPDATE leaves SET reminder_morning_sent=1 WHERE id=?", [
            leave.id,
          ]);
        } catch (e) {
          console.log(e);
        }
      }
    },
  );
});

// 6:00 PM - Tomorrow Evening Reminder
cron.schedule("0 18 * * *", async () => {
  console.log("Running Tomorrow Morning Reminder");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const leaveDate =
    tomorrow.getFullYear() +
    "-" +
    String(tomorrow.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(tomorrow.getDate()).padStart(2, "0");

  console.log("Tomorrow Date:", leaveDate);

  db.query(
    `SELECT * FROM leaves
     WHERE date=?
     AND status='approved'
     AND is_emergency=0
     AND reminder_morning_sent=0`,
    [leaveDate],
    async (err, rows) => {
      if (err) {
        console.log(err);
        return;
      }

      console.log("Rows Found:", rows.length);

      for (const leave of rows) {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.OFFICE_MAIL,
            subject: `🌞 Morning Reminder - ${leave.name} Leave Tomorrow`,
            html: `
              <h2>Morning Reminder</h2>
              <p><b>${leave.name}</b> (${leave.emp_id}) will be on leave tomorrow.</p>

              <table border="1" cellpadding="8">
                <tr><td>Name</td><td>${leave.name}</td></tr>
                <tr><td>Department</td><td>${leave.department}</td></tr>
                <tr><td>Leave Date</td><td>${leave.date}</td></tr>
                <tr><td>Leave Type</td><td>${leave.leave_type}</td></tr>
                <tr><td>Session</td><td>${leave.session || "-"}</td></tr>
                <tr><td>Reason</td><td>${leave.reason_text || leave.reason_type}</td></tr>
              </table>
            `,
          });

          db.query("UPDATE leaves SET reminder_morning_sent=1 WHERE id=?", [
            leave.id,
          ]);
        } catch (e) {
          console.log(e);
        }
      }
    },
  );
});
// 9:00 AM - Leave Day Reminder
cron.schedule("0 9 * * *", async () => {
  console.log("Running Leave Day Reminder");

  const now = new Date();

  const today =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  console.log("Today:", today);

  db.query(
    `SELECT * FROM leaves
     WHERE date=?
     AND status='approved'
     AND is_emergency=0
     AND reminder_leaveday_sent=0`,
    [today],
    async (err, rows) => {
      if (err) {
        console.log(err);
        return;
      }

      console.log("Rows Found:", rows.length);

      for (const leave of rows) {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.OFFICE_MAIL,
            subject: `📢 Employee On Leave Today - ${leave.name}`,
            html: `
              <h2>Today's Leave Reminder</h2>

              <p><b>${leave.name}</b> is on leave today.</p>

              <table border="1" cellpadding="8">
                <tr><td>Name</td><td>${leave.name}</td></tr>
                <tr><td>Department</td><td>${leave.department}</td></tr>
                <tr><td>Leave Date</td><td>${leave.date}</td></tr>
                <tr><td>Leave Type</td><td>${leave.leave_type}</td></tr>
                <tr><td>Session</td><td>${leave.session || "-"}</td></tr>
                <tr><td>Reason</td><td>${leave.reason_text || leave.reason_type}</td></tr>
              </table>
            `,
          });

          db.query(
            "UPDATE leaves SET reminder_leaveday_sent=1 WHERE id=?",
            [leave.id],
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log(`Leave Day Reminder Sent for ${leave.name}`);
              }
            },
          );
        } catch (e) {
          console.log("Mail Error:", e);
        }
      }
    },
  );
});
// Approve API

app.get("/api/dashboard/admin-counts", verifyToken, (req, res) => {
  db.query(
    "SELECT SUM(status='pending') AS pending, SUM(status='approved') AS approved, SUM(status='rejected') AS rejected FROM leaves",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0] || { pending: 0, approved: 0, rejected: 0 });
    },
  );
});

app.post("/api/daily-status", verifyToken, (req, res) => {
  const d = req.body;

  // ✅ Allow only today's date
  const today = new Date().toISOString().split("T")[0];

  if (d.status_date !== today) {
    return res.status(400).json({
      message: "Daily Status can be submitted only for today's date.",
    });
  }

  const sql = `
    INSERT INTO daily_status
    (emp_id, project_name, subtask, assigned_by, status_date, status_month, status_year)
    VALUES (?, ?, ?, ?, ?, MONTH(?), YEAR(?))
  `;

  db.query(
    sql,
    [
      d.emp_id,
      d.project_name,
      d.subtask,
      d.assigned_by,
      d.status_date,
      d.status_date,
      d.status_date,
    ],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Already submitted for today",
          });
        }

        return res.status(500).json(err);
      }

      res.json({
        message: "Daily status submitted",
      });
    },
  );
});

app.get("/api/daily-status/report", verifyToken, (req, res) => {
  const { emp_id, month, status } = req.query;

  let sql = `
    SELECT
      d.id,
      d.emp_id,
      d.project_name,
      d.assigned_by,
      d.subtask,
      d.status_date,
      d.status_month,
      d.status,
      d.admin_comment,
      u.name,
      u.department
    FROM daily_status d
    LEFT JOIN users u ON d.emp_id = u.emp_id
    WHERE 1=1
  `;

  const params = [];

  if (emp_id && emp_id !== "all") {
    sql += " AND d.emp_id = ?";
    params.push(emp_id);
  }

  if (month && month !== "all") {
    sql += " AND d.status_month = ?";
    params.push(Number(month));
  }

  if (status && status !== "all") {
    sql += " AND d.status = ?";
    params.push(status);
  }

  sql += " ORDER BY d.status_date DESC";

  db.query(sql, params, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json(result);
  });
});
// UPDATE DAILY STATUS
app.put("/api/daily-status/update/:id", verifyToken, (req, res) => {
  const { project_name, subtask, assigned_by, status_date } = req.body;

  // ✅ Allow only today's date
  const today = new Date().toISOString().split("T")[0];

  if (status_date !== today) {
    return res.status(400).json({
      message: "Daily Status can be updated only for today's date.",
    });
  }

  const sql = `
    UPDATE daily_status
    SET project_name = ?,
        subtask = ?,
        assigned_by = ?,
        status_date = ?,
        status_month = MONTH(?),
        status_year = YEAR(?)
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      project_name,
      subtask,
      assigned_by,
      status_date,
      status_date,
      status_date,
      req.params.id,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Already a record exists for this date. Cannot update.",
          });
        }

        return res.status(500).json({
          message: "Update failed",
        });
      }

      return res.json({
        message: "Updated successfully",
      });
    },
  );
});

app.put("/api/daily-status/approve/:id", verifyToken, (req, res) => {
  console.log("BODY:", req.body);
  console.log("ID:", req.params.id);

  const { admin_comment } = req.body;

  db.query(
    "UPDATE daily_status SET status='approved', admin_comment=? WHERE id=?",
    [admin_comment, req.params.id],
    (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json(err);
      }

      console.log("RESULT:", result);

      res.json({
        message: "Approved Successfully",
      });
    },
  );
});
app.put("/api/daily-status/reject/:id", verifyToken, (req, res) => {
  const { admin_comment } = req.body;

  db.query(
    "UPDATE daily_status SET status='rejected', admin_comment=? WHERE id=?",
    [admin_comment, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Rejected Successfully",
      });
    },
  );
});

//navya
// ======================================================
// CREATE UPLOAD FOLDERS
// ======================================================

const folders = ["uploads", "uploads/aadhaar", "uploads/pan", "uploads/bank"];

for (const folder of folders) {
  fs.mkdirSync(folder, { recursive: true });
}

// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "aadhaar_file") {
      cb(null, "uploads/aadhaar");
    } else if (file.fieldname === "pan_file") {
      cb(null, "uploads/pan");
    } else {
      cb(null, "uploads/bank");
    }
  },

  filename: (req, file, cb) => {
    const safeFileName =
      Date.now() + "-" + file.originalname.replace(/\s/g, "_");

    cb(null, safeFileName);
  },
});

// ======================================================
// FILE FILTER
// ======================================================

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // PDF
      "application/pdf",

      // Images
      "image/png",
      "image/jpg",
      "image/jpeg",

      // ZIP
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Images, and ZIP files allowed"), false);
    }
  },

  // 20MB LIMIT
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// ======================================================
// STATIC FILES
// ======================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================================================
// DATE FORMAT FUNCTIONS
// ======================================================

const formatDate = (dateStr) => {
  if (!dateStr) return null;

  // if already YYYY-MM-DD
  if (dateStr.includes("-")) {
    return dateStr;
  }

  // convert DD/MM/YYYY -> YYYY-MM-DD
  const [dd, mm, yyyy] = dateStr.split("/");

  return `${yyyy}-${mm}-${dd}`;
};

const toMySQLDate = (date) => {
  if (!date) return null;

  return date.toISOString().split("T")[0];
};

// ======================================================
// AUTO FETCH EMPLOYEE DETAILS
// ======================================================

app.get("/api/employee-basic/:emp_id", (req, res) => {
  const sql = `
    SELECT
      emp_id,
      name,
      department,
      subDepartment,
      employeeType
    FROM users
    WHERE emp_id=?
  `;

  db.query(sql, [req.params.emp_id], (err, result) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json(result[0]);
  });
});
// ======================================================
// SAVE EMPLOYEE PERSONAL DETAILS
// ======================================================
app.post(
  "/api/personal-details",
  upload.fields([
    { name: "aadhaar_file", maxCount: 1 },
    { name: "pan_file", maxCount: 1 },
    { name: "bank_file", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const d = req.body;

      console.log("BODY DATA:", d);
      console.log("FILES:", req.files);

      // FORMAT DATES
      const formattedDOB = formatDate(d.date_of_birth);
      const formattedDOJ = formatDate(d.date_of_joining);

      if (!formattedDOJ) {
        return res.status(400).json({
          message: "Invalid Date of Joining",
        });
      }

      const joiningDate = new Date(formattedDOJ);
      const today = new Date();

      if (isNaN(joiningDate.getTime())) {
        return res.status(400).json({
          message: "Invalid Joining Date format after conversion",
        });
      }

      // APPRAISAL LOGIC
      let lastAppraisal = new Date(joiningDate);

      while (lastAppraisal <= today) {
        lastAppraisal.setFullYear(lastAppraisal.getFullYear() + 1);
      }

      const nextAppraisal = new Date(lastAppraisal);
      lastAppraisal.setFullYear(lastAppraisal.getFullYear() - 1);

      // FINAL MYSQL SAFE DATES
      const lastAppraisalDate = toMySQLDate(lastAppraisal);
      const nextAppraisalDate = toMySQLDate(nextAppraisal);

      const sql = `
        INSERT INTO employee_personal_details (
          emp_id,
          emp_name,
          aadhaar_number,
          pan_number,
          date_of_birth,
          date_of_joining,
          bank_account_number,
          ifsc_code,
          aadhaar_file,
          pan_file,
          bank_file,
          last_appraisal_date,
          next_appraisal_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          d.emp_id,
          d.emp_name,
          d.aadhaar_number || null,
          d.pan_number || null,
          formattedDOB,
          formattedDOJ,
          d.bank_account_number || null,
          d.ifsc_code || null,
          req.files?.aadhaar_file?.[0]?.filename || null,
          req.files?.pan_file?.[0]?.filename || null,
          req.files?.bank_file?.[0]?.filename || null,
          lastAppraisalDate,
          nextAppraisalDate,
        ],
        (err, result) => {
          if (err) {
            console.log("FULL DB ERROR:", err.sqlMessage);
            console.log("SQL STATE:", err.sqlState);
            console.log("CODE:", err.code);

            return res.status(500).json({
              message: err.sqlMessage,
              code: err.code,
            });
          }

          return res.status(201).json({
            message: "Personal Details Saved Successfully",
            id: result.insertId,
          });
        },
      );
    } catch (error) {
      console.log("SERVER ERROR:", error);

      return res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  },
);

// ======================================================
// GET ALL EMPLOYEE PERSONAL DETAILS
// ======================================================

app.get(
  "/api/personal-details",

  (req, res) => {
    const sql = `

        SELECT *

        FROM employee_personal_details

        ORDER BY created_at DESC
        `;

    db.query(sql, (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json(result);
    });
  },
);

// ======================================================
// GET SINGLE EMPLOYEE DETAILS
// ======================================================

app.get(
  "/api/personal-details/:emp_id",

  (req, res) => {
    const sql = `

        SELECT *

        FROM employee_personal_details

        WHERE emp_id=?
        `;

    db.query(
      sql,

      [req.params.emp_id],

      (err, result) => {
        if (err) {
          return res.status(500).json(err);
        }

        if (result.length === 0) {
          return res.status(404).json({
            message: "Employee not found",
          });
        }

        res.json(result[0]);
      },
    );
  },
);

// ======================================================
// UPDATE PERSONAL DETAILS
// ======================================================
app.put(
  "/api/personal-details/:emp_id",
  upload.fields([
    { name: "aadhaar_file", maxCount: 1 },
    { name: "pan_file", maxCount: 1 },
    { name: "bank_file", maxCount: 1 },
  ]),
  (req, res) => {
    const d = req.body;

    const getOldSql = "SELECT * FROM employee_personal_details WHERE emp_id=?";

    db.query(getOldSql, [req.params.emp_id], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const old = result[0];

      //   SAFE FILE HANDLING
      const aadhaarFile =
        req.files?.aadhaar_file?.[0]?.filename || old?.aadhaar_file || null;

      const panFile =
        req.files?.pan_file?.[0]?.filename || old?.pan_file || null;

      const bankFile =
        req.files?.bank_file?.[0]?.filename || old?.bank_file || null;

      //   FIX DATE FORMAT ISSUE (IMPORTANT)
      const convertDate = (dateStr) => {
        if (!dateStr) return null;

        // already yyyy-mm-dd
        if (dateStr.includes("-")) {
          return dateStr;
        }

        const [dd, mm, yyyy] = dateStr.split("/");

        return `${yyyy}-${mm}-${dd}`;
      };

      const joiningDate = new Date(convertDate(d.date_of_joining));

      if (isNaN(joiningDate.getTime())) {
        return res.status(400).json({
          message: "Invalid Date of Joining",
        });
      }

      const today = new Date();

      let lastAppraisal = new Date(joiningDate);

      while (lastAppraisal <= today) {
        lastAppraisal.setFullYear(lastAppraisal.getFullYear() + 1);
      }

      const nextAppraisal = new Date(lastAppraisal);
      lastAppraisal.setFullYear(lastAppraisal.getFullYear() - 1);

      const sql = `
        UPDATE employee_personal_details
        SET
          emp_name=?,
          aadhaar_number=?,
          pan_number=?,
          date_of_birth=?,
          date_of_joining=?,
          bank_account_number=?,
          ifsc_code=?,
          aadhaar_file=?,
          pan_file=?,
          bank_file=?,
          last_appraisal_date=?,
          next_appraisal_date=?
        WHERE emp_id=?
      `;

      db.query(
        sql,
        [
          d.emp_name,
          d.aadhaar_number || null,
          d.pan_number || null,
          convertDate(d.date_of_birth),
          convertDate(d.date_of_joining),
          d.bank_account_number || null,
          d.ifsc_code || null,
          aadhaarFile,
          panFile,
          bankFile,
          lastAppraisal,
          nextAppraisal,
          req.params.emp_id,
        ],
        (err2) => {
          if (err2) {
            console.log("SQL ERROR:", err2.sqlMessage);
            return res.status(500).json({
              message: err2.sqlMessage,
            });
          }

          return res.json({
            message: "Updated Successfully",
          });
        },
      );
    });
  },
);
// ======================================================
// DELETE EMPLOYEE PERSONAL DETAILS
// ======================================================

app.delete(
  "/api/personal-details/:emp_id",

  (req, res) => {
    const sql = `

        DELETE FROM employee_personal_details

        WHERE emp_id=?
        `;

    db.query(
      sql,

      [req.params.emp_id],

      (err) => {
        if (err) {
          return res.status(500).json(err);
        }

        res.json({
          message: "Employee Deleted Successfully",
        });
      },
    );
  },
);

// ======================================================
// DOWNLOAD SINGLE FILE
// ======================================================

app.get("/api/download-file/:type/:filename", (req, res) => {
  const { type, filename } = req.params;

  let folder = "";

  if (type === "aadhaar") {
    folder = "uploads/aadhaar";
  }

  if (type === "pan") {
    folder = "uploads/pan";
  }

  if (type === "bank") {
    folder = "uploads/bank";
  }

  const filePath = path.join(__dirname, folder, filename);

  res.download(filePath, filename, (err) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        message: "File download failed",
      });
    }
  });
});

// ======================================================
// DOWNLOAD FULL EMPLOYEE ZIP
// ======================================================

// app.get("/api/download-employee/:emp_id", (req, res) => {
//   const sql = `
//     SELECT *
//     FROM employee_personal_details
//     WHERE emp_id=?
//   `;

//   db.query(sql, [req.params.emp_id], (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json(err);
//     }

//     if (result.length === 0) {
//       return res.status(404).json({
//         message: "Employee not found",
//       });
//     }

//     const emp = result[0];

//     // ZIP FILE NAME
//     const zipName = `${emp.emp_id}.zip`;

//     // IMPORTANT
//     res.attachment(zipName);

//     // CREATE ZIP
//     const archive = archiver("zip", {
//       zlib: { level: 9 },
//     });

//     // ERROR HANDLE
//     archive.on("error", (err) => {
//       throw err;
//     });

//     // SEND ZIP TO RESPONSE
//     archive.pipe(res);

//     // ================= TEXT FILE =================

//     const details = `
// EMPLOYEE DETAILS

// Employee ID : ${emp.emp_id}
// Employee Name : ${emp.emp_name}

// DOB : ${emp.date_of_birth}
// DOJ : ${emp.date_of_joining}

// AADHAAR : ${emp.aadhaar_number}
// PAN : ${emp.pan_number}

// BANK : ${emp.bank_account_number}
// IFSC : ${emp.ifsc_code}

// LAST APPRAISAL : ${emp.last_appraisal_date}
// NEXT APPRAISAL : ${emp.next_appraisal_date}
// `;

//     archive.append(details, {
//       name: "employee-details.txt",
//     });

//     // ================= AADHAAR =================

//     if (emp.aadhaar_file) {
//       const aadhaarPath = path.join(
//         __dirname,
//         "uploads",
//         "aadhaar",
//         emp.aadhaar_file,
//       );

//       if (fs.existsSync(aadhaarPath)) {
//         archive.file(aadhaarPath, {
//           name: emp.aadhaar_file,
//         });
//       }
//     }

//     // ================= PAN =================

//     if (emp.pan_file) {
//       const panPath = path.join(__dirname, "uploads", "pan", emp.pan_file);

//       if (fs.existsSync(panPath)) {
//         archive.file(panPath, {
//           name: emp.pan_file,
//         });
//       }
//     }

//     // ================= BANK =================

//     if (emp.bank_file) {
//       const bankPath = path.join(__dirname, "uploads", "bank", emp.bank_file);

//       if (fs.existsSync(bankPath)) {
//         archive.file(bankPath, {
//           name: emp.bank_file,
//         });
//       }
//     }

//     // FINALIZE ZIP
//     archive.finalize();
//   });
// });

app.get("/api/download-employee/:emp_id", (req, res) => {
  console.log("===== DOWNLOAD EMPLOYEE API =====");
  console.log("archiver:", archiver);
  console.log("typeof archiver:", typeof archiver);

  const sql = `
    SELECT *
    FROM employee_personal_details
    WHERE emp_id=?
  `;

  db.query(sql, [req.params.emp_id], (err, result) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "No Employee Data Found",
      });
    }

    const emp = result[0];

    try {
      const zipName = `${emp.emp_id}.zip`;

      res.attachment(zipName);

      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      archive.on("error", (err) => {
        console.log("ARCHIVE ERROR:", err);
        if (!res.headersSent) {
          res.status(500).json({
            message: "ZIP creation failed",
          });
        }
      });

      archive.pipe(res);

      const details = `
EMPLOYEE DETAILS

Employee ID : ${emp.emp_id}
Employee Name : ${emp.emp_name}

DOB : ${emp.date_of_birth}
DOJ : ${emp.date_of_joining}

AADHAAR : ${emp.aadhaar_number}
PAN : ${emp.pan_number}

BANK : ${emp.bank_account_number}
IFSC : ${emp.ifsc_code}

LAST APPRAISAL : ${emp.last_appraisal_date}
NEXT APPRAISAL : ${emp.next_appraisal_date}
`;

      archive.append(details, {
        name: "employee-details.txt",
      });

      if (emp.aadhaar_file) {
        const aadhaarPath = path.join(
          __dirname,
          "uploads",
          "aadhaar",
          emp.aadhaar_file,
        );

        console.log("AADHAAR:", aadhaarPath);

        if (fs.existsSync(aadhaarPath)) {
          archive.file(aadhaarPath, {
            name: emp.aadhaar_file,
          });
        }
      }

      if (emp.pan_file) {
        const panPath = path.join(__dirname, "uploads", "pan", emp.pan_file);

        console.log("PAN:", panPath);

        if (fs.existsSync(panPath)) {
          archive.file(panPath, {
            name: emp.pan_file,
          });
        }
      }

      if (emp.bank_file) {
        const bankPath = path.join(__dirname, "uploads", "bank", emp.bank_file);

        console.log("BANK:", bankPath);

        if (fs.existsSync(bankPath)) {
          archive.file(bankPath, {
            name: emp.bank_file,
          });
        }
      }

      archive.finalize();
    } catch (e) {
      console.log("DOWNLOAD ERROR:", e);
      return res.status(500).json({
        message: e.message,
      });
    }
  });
});

// ======================================================
// DOWNLOAD ALL EMPLOYEE FILES
// ======================================================

app.get("/api/download-all-personal-files", (req, res) => {
  const sql = `
    SELECT *
    FROM employee_personal_details
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json({
        message: "Database Error",
      });
    }

    // No employees found
    if (results.length === 0) {
      return res.status(404).json({
        message: "No Employee Data Found",
      });
    }

    // Check whether at least one file exists
    const hasFiles = results.some(
      (emp) => emp.aadhaar_file || emp.pan_file || emp.bank_file,
    );

    if (!hasFiles) {
      return res.status(404).json({
        message: "No Employee Files Found",
      });
    }

    // ZIP name
    res.attachment("All_Employee_Files.zip");

    // Create ZIP
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      console.log("ARCHIVE ERROR:", err);

      if (!res.headersSent) {
        return res.status(500).json({
          message: "ZIP creation failed",
        });
      }
    });

    archive.pipe(res);

    // Loop all employees
    results.forEach((emp) => {
      const folderName = emp.emp_id || "Employee";

      // Employee details text file
      const details = `
EMPLOYEE DETAILS

Employee ID : ${emp.emp_id}
Employee Name : ${emp.emp_name}

DOB : ${emp.date_of_birth}
DOJ : ${emp.date_of_joining}

AADHAAR : ${emp.aadhaar_number}
PAN : ${emp.pan_number}

BANK : ${emp.bank_account_number}
IFSC : ${emp.ifsc_code}

LAST APPRAISAL : ${emp.last_appraisal_date}
NEXT APPRAISAL : ${emp.next_appraisal_date}
`;

      archive.append(details, {
        name: `${folderName}/employee-details.txt`,
      });

      // Aadhaar File
      if (emp.aadhaar_file) {
        const aadhaarPath = path.join(
          __dirname,
          "uploads",
          "aadhaar",
          emp.aadhaar_file,
        );

        if (fs.existsSync(aadhaarPath)) {
          archive.file(aadhaarPath, {
            name: `${folderName}/aadhaar-${emp.aadhaar_file}`,
          });
        }
      }

      // PAN File
      if (emp.pan_file) {
        const panPath = path.join(__dirname, "uploads", "pan", emp.pan_file);

        if (fs.existsSync(panPath)) {
          archive.file(panPath, {
            name: `${folderName}/pan-${emp.pan_file}`,
          });
        }
      }

      // Bank File
      if (emp.bank_file) {
        const bankPath = path.join(__dirname, "uploads", "bank", emp.bank_file);

        if (fs.existsSync(bankPath)) {
          archive.file(bankPath, {
            name: `${folderName}/bank-${emp.bank_file}`,
          });
        }
      }
    });

    archive.finalize();
  });
});

// navya

// ================= PROXY ROUTES FOR PAYSLIP SERVER =================

// Proxy all employee-related requests to payslip server
app.use("/api/employees", async (req, res) => {
  try {
    // Remove '/api' from originalUrl since PAYSLIP_API_URL already has it
    const pathWithoutApi = req.originalUrl.replace("/api", "");
    const targetUrl = `${PAYSLIP_API_URL}${pathWithoutApi}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch from payslip server",
      details: error.message,
    });
  }
});

// Proxy all payslip-related requests to payslip server
// In HRMS server, modify the payslip proxy route
// Proxy specific payslip routes
app.get("/api/payslips/employee/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}/payslips/employee/${emp_id}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch from payslip server",
      details: error.message,
    });
  }
});

app.get("/api/payslips/test", async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}/payslips/test`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch from payslip server",
      details: error.message,
    });
  }
});
// Proxy payslip generation
app.post("/api/payslip/generate", async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.post(targetUrl, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Payslip generation error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to generate payslip",
      details: error.message,
    });
  }
});

// Proxy payslip PDF generation
app.post("/api/payslip/pdf", async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios({
      method: "post",
      url: targetUrl,
      data: req.body,
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader(
      "Content-Disposition",
      response.headers["content-disposition"],
    );
    response.data.pipe(res);
  } catch (error) {
    console.error("❌ PDF generation error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
});

// Proxy payslip save
app.post("/api/payslips/save", async (req, res) => {
  try {
    const pathWithoutApi = req.originalUrl.replace("/api", "");
    const targetUrl = `${PAYSLIP_API_URL}${pathWithoutApi}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    const response = await axios.post(targetUrl, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Payslip save error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to save payslip",
      details: error.message,
    });
  }
});

// Proxy payslip update
// app.put("/api/payslips/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
//     console.log(`🔄 Proxying to: ${targetUrl}`);

//     const response = await axios.put(targetUrl, req.body);
//     res.status(response.status).json(response.data);
//   } catch (error) {
//     console.error("❌ Payslip update error:", error.message);
//     res.status(error.response?.status || 500).json({
//       error: "Failed to update payslip",
//       details: error.message,
//     });
//   }
// });

app.put("/api/payslips/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const targetUrl = `${PAYSLIP_API_URL}/payslips/${id}`;

    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.put(targetUrl, req.body);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Payslip update error:", error.message);

    console.error("Payslip API response:", error.response?.data);

    res.status(error.response?.status || 500).json({
      error: "Failed to update payslip",
      details: error.response?.data || error.message,
    });
  }
});

// Proxy payslip delete
app.delete("/api/payslips/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.delete(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Payslip delete error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to delete payslip",
      details: error.message,
    });
  }
});
// Proxy single payslip fetch
app.get("/api/payslips/single/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}/payslips/single/${id}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Single payslip fetch error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch payslip",
      details: error.message,
    });
  }
});

// Proxy payslips by month and year
app.get("/api/payslips/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}/payslips/${year}/${month}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Payslips fetch error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch payslips",
      details: error.message,
    });
  }
});

// Proxy reports
app.get("/api/reports/monthly/:year/:month", async (req, res) => {
  try {
    const pathWithoutApi = req.originalUrl.replace("/api", "");
    const targetUrl = `${PAYSLIP_API_URL}${pathWithoutApi}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);
    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Monthly report error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch monthly report",
      details: error.message,
    });
  }
});

app.get("/api/reports/yearly/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Yearly report error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch yearly report",
      details: error.message,
    });
  }
});

app.get("/api/reports/employee/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Employee history error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch employee history",
      details: error.message,
    });
  }
});

// Proxy BLKPAY Excel download
app.post("/api/employees/download-excel", async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios({
      method: "post",
      url: targetUrl,
      data: req.body,
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader(
      "Content-Disposition",
      response.headers["content-disposition"],
    );
    response.data.pipe(res);
  } catch (error) {
    console.error("❌ Excel download error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to download Excel",
      details: error.message,
    });
  }
});

// Proxy payment summary PDF
app.post("/api/payment-summary/pdf", async (req, res) => {
  try {
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios({
      method: "post",
      url: targetUrl,
      data: req.body,
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader(
      "Content-Disposition",
      response.headers["content-disposition"],
    );
    response.data.pipe(res);
  } catch (error) {
    console.error("❌ Payment summary PDF error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to generate payment summary PDF",
      details: error.message,
    });
  }
});

// Proxy earnings endpoint
app.get("/api/employees/:emp_id/earnings", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const targetUrl = `${PAYSLIP_API_URL}${req.originalUrl}`;
    console.log(`🔄 Proxying to: ${targetUrl}`);

    const response = await axios.get(targetUrl);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Earnings fetch error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch earnings",
      details: error.message,
    });
  }
});
// ================= STATIC FILES =================
app.use(express.static(path.join(__dirname, "/build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "./build", "index.html"));
});

// ================= START SERVER =================
const PORT = process.env.BACKEND_PORT || 8017;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
