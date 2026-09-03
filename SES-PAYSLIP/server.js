// Updated server.js - Add month/year filtering for Excel export

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
// const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 7016;
const host = "0.0.0.0";

// Middleware;
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Global error handler for unhandled errors in routes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

// MySQL Connection Pool
// Using a pool instead of a single connection prevents "ECONNRESET" and
// "wait_timeout" issues with MySQL 8 on Windows.
const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Sesgps@123",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verify pool can connect
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
  connection.release();
});

// Helper function to parse and validate date in DD-MM-YYYY format
const parseDate = (dateString) => {
  if (!dateString) return null;

  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Parse DD-MM-YYYY format
  const parts = dateString.split("-");
  if (parts.length === 3 && parts[2].length === 4) {
    const [day, month, year] = parts;

    // Validate date
    const date = new Date(`${year}-${month}-${day}`);
    if (
      date instanceof Date &&
      !isNaN(date) &&
      date.getDate() === parseInt(day) &&
      date.getMonth() + 1 === parseInt(month) &&
      date.getFullYear() === parseInt(year)
    ) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
};

// Create tables if they don't exist
const createTables = () => {
  // Employee table with PF_APPLICABLE field
  const createEmployeeTable = `
        CREATE TABLE IF NOT EXISTS employee (
            emp_id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            date_of_joining DATE NOT NULL,
            PAN VARCHAR(20) UNIQUE NOT NULL,
            basic_salary DECIMAL(10,2) NOT NULL,
            house_rent_allowence DECIMAL(10,2) DEFAULT 0,
            transport_allowance DECIMAL(10,2) DEFAULT 0,
            internet_allowance DECIMAL(10,2) DEFAULT 0,
            medical_allowance DECIMAL(10,2) DEFAULT 0,
            professional_tax DECIMAL(10,2) DEFAULT 0,
            bank_account_number VARCHAR(30) NOT NULL,
            IFSC_code VARCHAR(20) NOT NULL,
            bank_name VARCHAR(100) NOT NULL,
            pf_applicable BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

  // Payslip table with performance_bonus column
  const createPayslipTable = `
        CREATE TABLE IF NOT EXISTS payslip (
            id INT AUTO_INCREMENT PRIMARY KEY,
            emp_id VARCHAR(20),
            salary_month INT NOT NULL,
            salary_year INT NOT NULL,
            advance_salary DECIMAL(10,2) DEFAULT 0,
            paid_days INT NOT NULL,
            holidays INT DEFAULT 0,
            leaves INT DEFAULT 0,
            gross_salary DECIMAL(10,2) NOT NULL,
            total_deductions DECIMAL(10,2) NOT NULL,
            net_salary DECIMAL(10,2) NOT NULL,
            pf_deduction DECIMAL(10,2) NOT NULL,
            professional_tax_deduction DECIMAL(10,2) NOT NULL,
            performance_bonus DECIMAL(10,2) DEFAULT 0,
            arrears DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE ON UPDATE CASCADE,
            UNIQUE KEY unique_employee_month_year (emp_id, salary_month, salary_year)
        )
    `;

  // Holidays table
  const createHolidaysTable = `
        CREATE TABLE IF NOT EXISTS holidays (
            id INT AUTO_INCREMENT PRIMARY KEY,
            holiday_date DATE NOT NULL,
            holiday_name VARCHAR(100),
            year INT NOT NULL,
            month INT NOT NULL,
            day_of_week VARCHAR(20),
            UNIQUE KEY unique_holiday (holiday_date)
        )
    `;

  const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
  db.query(createEmployeeTable, (err) => {
    if (err) console.error("Error creating employee table:", err);
    else console.log("Employee table ready");
  });

  db.query(createPayslipTable, (err) => {
    if (err) console.error("Error creating payslip table:", err);
    else console.log("Payslip table ready");
  });

  db.query(createHolidaysTable, (err) => {
    if (err) console.error("Error creating holidays table:", err);
    else console.log("Holidays table ready");
  });
  db.query(createUsersTable, (err) => {
    if (err) console.error("Error creating users table:", err);
    else console.log("Users table ready");
  });
};

createTables();

// ==================== HOLIDAYS ROUTES ====================

// Upload holidays from Excel/CSV file
app.post("/api/holidays/upload", (req, res) => {
  try {
    const { fileData, fileName } = req.body;

    // Decode base64 file data
    const buffer = Buffer.from(fileData, "base64");

    // Read the Excel file
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Process holidays
    const holidays = [];
    const errors = [];

    data.forEach((row, index) => {
      try {
        // Expected columns: Date, Holiday Name (adjust based on your file)
        let holidayDate = row.Date || row.date || row.DATE;
        let holidayName =
          row["Holiday Name"] || row.holiday_name || row.Holiday || row.holiday;

        if (!holidayDate) {
          errors.push(`Row ${index + 2}: Missing date`);
          return;
        }

        // Parse date (handle different formats)
        let date;
        if (typeof holidayDate === "number") {
          // Excel serial date
          date = new Date((holidayDate - 25569) * 86400 * 1000);
        } else {
          date = new Date(holidayDate);
        }

        if (isNaN(date.getTime())) {
          errors.push(`Row ${index + 2}: Invalid date format - ${holidayDate}`);
          return;
        }

        const formattedDate = date.toISOString().split("T")[0];
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

        holidays.push([
          formattedDate,
          holidayName || "Public Holiday",
          year,
          month,
          dayOfWeek,
        ]);
      } catch (err) {
        errors.push(`Row ${index + 2}: Error processing - ${err.message}`);
      }
    });

    if (holidays.length === 0) {
      return res.status(400).json({
        error: "No valid holidays found in file",
        details: errors,
      });
    }

    // Insert holidays into database
    const insertQuery = `
            INSERT INTO holidays (holiday_date, holiday_name, year, month, day_of_week)
            VALUES ?
            ON DUPLICATE KEY UPDATE
                holiday_name = VALUES(holiday_name),
                year = VALUES(year),
                month = VALUES(month),
                day_of_week = VALUES(day_of_week)
        `;

    db.query(insertQuery, [holidays], (err, result) => {
      if (err) {
        console.error("Error inserting holidays:", err);
        return res
          .status(500)
          .json({ error: "Database error: " + err.message });
      }

      res.json({
        message: "Holidays uploaded successfully",
        inserted: result.affectedRows,
        total: holidays.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Error processing file: " + error.message });
  }
});

// Get holidays for a specific month and year
app.get("/api/holidays/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const query =
    "SELECT * FROM holidays WHERE year = ? AND month = ? ORDER BY holiday_date";

  db.query(query, [year, month], (err, results) => {
    if (err) {
      console.error("Error fetching holidays:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Get holidays for a specific year
app.get("/api/holidays/:year", (req, res) => {
  const { year } = req.params;

  const query = "SELECT * FROM holidays WHERE year = ? ORDER BY holiday_date";

  db.query(query, [year], (err, results) => {
    if (err) {
      console.error("Error fetching holidays:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Delete a holiday
app.delete("/api/holidays/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM holidays WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting holiday:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }
    res.json({ message: "Holiday deleted successfully" });
  });
});

// ==================== EMPLOYEE ROUTES ====================

// Get all employees
app.get("/api/employees", (req, res) => {
  const query = "SELECT * FROM employee ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching employees:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Get single employee by ID
app.get("/api/employees/:emp_id", (req, res) => {
  const { emp_id } = req.params;
  const query = "SELECT * FROM employee WHERE emp_id = ?";

  db.query(query, [emp_id], (err, results) => {
    if (err) {
      console.error("Error fetching employee:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Format date_of_joining to DD-MM-YYYY for frontend
    const employee = results[0];
    if (employee.date_of_joining) {
      const date = new Date(employee.date_of_joining);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        employee.date_of_joining = `${day}-${month}-${year}`;
      }
    }

    res.json(employee);
  });
});

// Create new employee
app.post("/api/employees", (req, res) => {
  const {
    emp_id,
    name,
    designation,
    date_of_joining,
    PAN,
    basic_salary,
    house_rent_allowence,
    transport_allowance,
    internet_allowance,
    medical_allowance,
    professional_tax,
    bank_account_number,
    IFSC_code,
    bank_name,
    pf_applicable,
  } = req.body;

  // Validation
  if (
    !emp_id ||
    !name ||
    !designation ||
    !date_of_joining ||
    !PAN ||
    !basic_salary
  ) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  // Parse and validate date of joining
  const formattedDate = parseDate(date_of_joining);
  if (!formattedDate) {
    return res.status(400).json({
      error:
        "Invalid date format for date_of_joining. Please use DD-MM-YYYY format (e.g., 15-01-2024)",
    });
  }

  const query = `
        INSERT INTO employee (
            emp_id, name, designation, date_of_joining, PAN, basic_salary,
            house_rent_allowence,
            transport_allowance, internet_allowance, medical_allowance,
            professional_tax, bank_account_number, IFSC_code, bank_name,
            pf_applicable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    emp_id,
    name,
    designation,
    formattedDate, // Use the formatted date
    PAN,
    basic_salary,
    house_rent_allowence || 0,
    transport_allowance || 0,
    internet_allowance || 0,
    medical_allowance || 0,
    professional_tax || 0,
    bank_account_number,
    IFSC_code,
    bank_name,
    pf_applicable !== undefined ? pf_applicable : true,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error creating employee:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Employee ID or PAN already exists" });
      }
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    res.status(201).json({ message: "Employee created successfully", emp_id });
  });
});

// Update employee
app.put("/api/employees/:emp_id", (req, res) => {
  // The URL identifies the existing employee; the request body contains the new ID.
  const oldEmpId = req.params.emp_id;
  const newEmpId = String(req.body.emp_id || oldEmpId).trim();
  const updates = { ...req.body };

  delete updates.emp_id;

  if (!newEmpId) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  // Handle date of joining specially if it's being updated
  if (updates.date_of_joining) {
    const formattedDate = parseDate(updates.date_of_joining);
    if (!formattedDate) {
      return res.status(400).json({
        error:
          "Invalid date format for date_of_joining. Please use DD-MM-YYYY format (e.g., 15-01-2024)",
      });
    }
    updates.date_of_joining = formattedDate;
  }

  // Build dynamic update query
  const fields = ["emp_id = ?"];
  const values = [newEmpId];

  // List of allowed fields to update
  const allowedFields = [
    "name",
    "designation",
    "date_of_joining",
    "PAN",
    "basic_salary",
    "house_rent_allowence",
    "transport_allowance",
    "internet_allowance",
    "medical_allowance",
    "professional_tax",
    "bank_account_number",
    "IFSC_code",
    "bank_name",
    "pf_applicable",
  ];

  Object.keys(updates).forEach((key) => {
    if (
      allowedFields.includes(key) &&
      updates[key] !== undefined &&
      updates[key] !== null
    ) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  values.push(oldEmpId);
  const query = `UPDATE employee SET ${fields.join(", ")} WHERE emp_id = ?`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating employee:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Employee ID already exists" });
      }
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          error:
            "Employee ID cannot be changed because the payslip database relation is not configured for updates.",
        });
      }
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({ message: "Employee updated successfully" });
  });
});

// Delete employee
app.delete("/api/employees/:emp_id", (req, res) => {
  const { emp_id } = req.params;
  const query = "DELETE FROM employee WHERE emp_id = ?";

  db.query(query, [emp_id], (err, result) => {
    if (err) {
      console.error("Error deleting employee:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({ message: "Employee deleted successfully" });
  });
});

// ==================== PAYSLIP ROUTES ====================

// Function to calculate working days in a month considering holidays
const getWorkingDaysInMonth = (year, month, holidays, callback) => {
  // Get total days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Count holidays in this month
  const holidaysCount = holidays.filter(
    (h) => h.year === year && h.month === month,
  ).length;

  // Calculate working days (excluding Sundays and holidays)
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's a holiday
    const isHoliday = holidays.some((h) => {
      const holidayDate = new Date(h.holiday_date);
      return (
        holidayDate.getDate() === day &&
        holidayDate.getMonth() === month - 1 &&
        holidayDate.getFullYear() === year
      );
    });

    // Count if it's not Sunday and not a holiday
    if (dayOfWeek !== 0 && !isHoliday) {
      workingDays++;
    }
  }

  callback(workingDays);
};

// Calculate salary function with performance bonus
const calculateSalary = (
  employee,
  paidDays,
  holidays,
  leaves,
  advanceSalary,
  performanceBonus,
  arrears,
  totalWorkingDays,
) => {
  // Calculate per day salary based on total working days in month
  const totalAllowances =
    parseFloat(employee.transport_allowance || 0) +
    parseFloat(employee.house_rent_allowence || 0) +
    parseFloat(employee.internet_allowance || 0) +
    parseFloat(employee.medical_allowance || 0);

  const monthlyGrossSalary =
    parseFloat(employee.basic_salary) + totalAllowances;
  const perDaySalary = monthlyGrossSalary / totalWorkingDays;

  // Calculate gross salary based on paid days
  const grossSalary = perDaySalary * paidDays;

  // Calculate PF only if applicable
  const pfDeduction = employee.pf_applicable
    ? parseFloat(employee.basic_salary) * 0.12
    : 0; // 12% of basic if applicable

  const professionalTax = parseFloat(employee.professional_tax || 0);
  const advanceDeduction = parseFloat(advanceSalary) || 0;
  const bonus = parseFloat(performanceBonus) || 0;
  const arrearsAmount = parseFloat(arrears) || 0;

  const totalDeductions = pfDeduction + professionalTax + advanceDeduction;
  const netSalary = grossSalary - totalDeductions + bonus + arrearsAmount;

  return {
    grossSalary: grossSalary.toFixed(2),
    pfDeduction: pfDeduction.toFixed(2),
    professionalTax: professionalTax.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    performanceBonus: bonus.toFixed(2),
    arrears: arrearsAmount.toFixed(2),
    netSalary: netSalary.toFixed(2),
  };
};

// Generate payslip
app.post("/api/payslip/generate", (req, res) => {
  const {
    emp_id,
    salary_month,
    salary_year,
    advance_salary,
    paid_days,
    holidays,
    leaves,
    performance_bonus,
    arrears,
  } = req.body;

  // Validate input
  if (!emp_id || !salary_month || !salary_year || !paid_days) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  // Get employee details
  const getEmployeeQuery = "SELECT * FROM employee WHERE emp_id = ?";

  db.query(getEmployeeQuery, [emp_id], (err, employeeResults) => {
    if (err) {
      console.error("Error fetching employee:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (employeeResults.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = employeeResults[0];

    // Get holidays for the month
    const getHolidaysQuery =
      "SELECT * FROM holidays WHERE year = ? AND month = ?";
    db.query(
      getHolidaysQuery,
      [salary_year, salary_month],
      (err, holidayResults) => {
        if (err) {
          console.error("Error fetching holidays:", err);
          return res.status(500).json({ error: "Database error" });
        }

        // Calculate total working days in the month
        getWorkingDaysInMonth(
          salary_year,
          salary_month,
          holidayResults,
          (totalWorkingDays) => {
            // Calculate salary with performance bonus
            const salary = calculateSalary(
              employee,
              paid_days,
              holidays || 0,
              leaves || 0,
              advance_salary || 0,
              performance_bonus || 0,
              arrears || 0,
              totalWorkingDays,
            );

            // Insert payslip
            const insertQuery = `
                    INSERT INTO payslip (
                        emp_id, salary_month, salary_year, advance_salary,
                        paid_days, holidays, leaves, gross_salary,
                        total_deductions, net_salary, pf_deduction,
                        professional_tax_deduction, performance_bonus, arrears
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        advance_salary = VALUES(advance_salary),
                        paid_days = VALUES(paid_days),
                        holidays = VALUES(holidays),
                        leaves = VALUES(leaves),
                        gross_salary = VALUES(gross_salary),
                        total_deductions = VALUES(total_deductions),
                        net_salary = VALUES(net_salary),
                        pf_deduction = VALUES(pf_deduction),
                        professional_tax_deduction = VALUES(professional_tax_deduction),
                        performance_bonus = VALUES(performance_bonus),
                        arrears = VALUES(arrears)
                `;

            const values = [
              emp_id,
              salary_month,
              salary_year,
              advance_salary || 0,
              paid_days,
              holidays || 0,
              leaves || 0,
              salary.grossSalary,
              salary.totalDeductions,
              salary.netSalary,
              salary.pfDeduction,
              salary.professionalTax,
              salary.performanceBonus,
              salary.arrears,
            ];

            db.query(insertQuery, values, (err, result) => {
              if (err) {
                console.error("Error generating payslip:", err);
                return res
                  .status(500)
                  .json({ error: "Database error: " + err.message });
              }

              res.status(201).json({
                message: "Payslip generated successfully",
                salary: salary,
                workingDays: totalWorkingDays,
                employee: {
                  name: employee.name,
                  emp_id: employee.emp_id,
                  designation: employee.designation,
                  PAN: employee.PAN,
                },
              });
            });
          },
        );
      },
    );
  });
});

// Get single payslip by ID  (must be before /:year/:month to avoid route conflict)
app.get("/api/payslips/single/:id", (req, res) => {
  const { id } = req.params;

  const query = `
        SELECT p.*, e.*
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.id = ?
    `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching payslip:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Payslip not found" });
    }
    res.json(results[0]);
  });
});

// Get employee payslip history  (must be before /:year/:month to avoid route conflict)
app.get("/api/payslips/employee/:emp_id", (req, res) => {
  const { emp_id } = req.params;

  const query = `
        SELECT * FROM payslip 
        WHERE emp_id = ? 
        ORDER BY salary_year DESC, salary_month DESC
    `;

  db.query(query, [emp_id], (err, results) => {
    if (err) {
      console.error("Error fetching employee payslips:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
// Add this near the top of your payslip server routes
app.get("/api/payslips/test", (req, res) => {
  res.json({
    message: "Payslip server test route works!",
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
});
// Get payslips by month/year
app.get("/api/payslips/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const query = `
        SELECT p.*, e.name, e.designation, e.PAN, e.bank_account_number, e.IFSC_code, e.bank_name,
               e.pf_applicable
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.salary_year = ? AND p.salary_month = ?
        ORDER BY e.name
    `;

  db.query(query, [year, month], (err, results) => {
    if (err) {
      console.error("Error fetching payslips:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Delete payslip
app.delete("/api/payslips/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM payslip WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting payslip:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Payslip not found" });
    }
    res.json({ message: "Payslip deleted successfully" });
  });
});

// Save generated payslip from preview
app.post("/api/payslips/save", (req, res) => {
  console.log("Received save payslip request at /api/payslips/save:", req.body);

  const {
    emp_id,
    salary_month,
    salary_year,
    advance_salary,
    paid_days,
    holidays,
    leaves,
    gross_salary,
    pf_deduction,
    professional_tax_deduction,
    performance_bonus,
    arrears,
    total_deductions,
    net_salary,
  } = req.body;

  // Validate input
  if (!emp_id || !salary_month || !salary_year || !paid_days) {
    console.log("Missing required fields:", {
      emp_id,
      salary_month,
      salary_year,
      paid_days,
    });
    return res.status(400).json({ error: "Required fields are missing" });
  }

  const insertQuery = `
        INSERT INTO payslip (
            emp_id, salary_month, salary_year, advance_salary,
            paid_days, holidays, leaves, gross_salary,
            total_deductions, net_salary, pf_deduction,
            professional_tax_deduction, performance_bonus, arrears
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            advance_salary = VALUES(advance_salary),
            paid_days = VALUES(paid_days),
            holidays = VALUES(holidays),
            leaves = VALUES(leaves),
            gross_salary = VALUES(gross_salary),
            total_deductions = VALUES(total_deductions),
            net_salary = VALUES(net_salary),
            pf_deduction = VALUES(pf_deduction),
            professional_tax_deduction = VALUES(professional_tax_deduction),
            performance_bonus = VALUES(performance_bonus),
            arrears = VALUES(arrears)
    `;

  const values = [
    emp_id,
    parseInt(salary_month),
    parseInt(salary_year),
    advance_salary || 0,
    parseInt(paid_days),
    parseInt(holidays) || 0,
    parseInt(leaves) || 0,
    gross_salary,
    total_deductions,
    net_salary,
    pf_deduction,
    professional_tax_deduction,
    performance_bonus || 0,
    arrears || 0,
  ];

  console.log("Executing query with values:", values);

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("Error saving payslip:", err);
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    console.log("Payslip saved successfully, insertId:", result.insertId);

    // Get the saved payslip with employee details
    const selectQuery = `
            SELECT p.*, e.name, e.designation, e.bank_account_number, e.IFSC_code, e.bank_name, e.PAN, e.pf_applicable
            FROM payslip p
            JOIN employee e ON p.emp_id = e.emp_id
            WHERE p.id = ?
        `;

    db.query(selectQuery, [result.insertId], (err, results) => {
      if (err) {
        console.error("Error fetching saved payslip:", err);
        return res
          .status(201)
          .json({ message: "Payslip saved successfully", id: result.insertId });
      }
      console.log("Returning saved payslip:", results[0]);
      res.status(201).json({
        message: "Payslip saved successfully",
        payslip: results[0],
      });
    });
  });
});

// Update payslip
// app.put("/api/payslips/:id", (req, res) => {
//   const { id } = req.params;
//   console.log("Received update request for payslip ID:", id);
//   console.log("Update data:", req.body);

//   const {
//     emp_id,
//     salary_month,
//     salary_year,
//     advance_salary,
//     paid_days,
//     holidays,
//     leaves,
//     gross_salary,
//     pf_deduction,
//     professional_tax_deduction,
//     performance_bonus,
//     arrears,
//     total_deductions,
//     net_salary,
//   } = req.body;

//   // Validate input
//   if (!emp_id || !salary_month || !salary_year || !paid_days) {
//     console.log("Missing required fields:", {
//       emp_id,
//       salary_month,
//       salary_year,
//       paid_days,
//     });
//     return res.status(400).json({ error: "Required fields are missing" });
//   }

//   // Parse and validate numeric values
//   const parsedGrossSalary = parseFloat(gross_salary) || 0;
//   const parsedPfDeduction = parseFloat(pf_deduction) || 0;
//   const parsedProfessionalTax = parseFloat(professional_tax_deduction) || 0;
//   const parsedAdvanceSalary = parseFloat(advance_salary) || 0;
//   const parsedPerformanceBonus = parseFloat(performance_bonus) || 0;
//   const parsedArrears = parseFloat(arrears) || 0;
//   const parsedTotalDeductions = parseFloat(total_deductions) || 0;
//   const parsedNetSalary = parseFloat(net_salary) || 0;

//   // Validate range (max 999,999,999.99)
//   if (parsedGrossSalary > 999999999.99) {
//     return res
//       .status(400)
//       .json({ error: "Gross salary exceeds maximum allowed value" });
//   }
//   if (parsedNetSalary > 999999999.99) {
//     return res
//       .status(400)
//       .json({ error: "Net salary exceeds maximum allowed value" });
//   }

//   const updateQuery = `
//         UPDATE payslip
//         SET
//             emp_id = ?,
//             salary_month = ?,
//             salary_year = ?,
//             advance_salary = ?,
//             paid_days = ?,
//             holidays = ?,
//             leaves = ?,
//             gross_salary = ?,
//             pf_deduction = ?,
//             professional_tax_deduction = ?,
//             performance_bonus = ?,
//             arrears = ?,
//             total_deductions = ?,
//             net_salary = ?
//         WHERE id = ?
//     `;

//   const values = [
//     emp_id,
//     parseInt(salary_month),
//     parseInt(salary_year),
//     parsedAdvanceSalary.toFixed(2),
//     parseInt(paid_days),
//     parseInt(holidays) || 0,
//     parseInt(leaves) || 0,
//     parsedGrossSalary.toFixed(2),
//     parsedPfDeduction.toFixed(2),
//     parsedProfessionalTax.toFixed(2),
//     parsedPerformanceBonus.toFixed(2),
//     parsedArrears.toFixed(2),
//     parsedTotalDeductions.toFixed(2),
//     parsedNetSalary.toFixed(2),
//     id,
//   ];

//   console.log("Executing update query with values:", values);

//   db.query(updateQuery, values, (err, result) => {
//     if (err) {
//       console.error("Error updating payslip:", err);

//       // Handle specific MySQL errors
//       if (
//         err.code === "ER_DATA_TOO_LONG" ||
//         err.code === "ER_TRUNCATED_WRONG_VALUE"
//       ) {
//         return res.status(400).json({
//           error: "Salary value out of range. Please check the amounts.",
//         });
//       }
//       if (err.code === "ER_BAD_NULL_ERROR") {
//         return res.status(400).json({
//           error: "Required field cannot be null",
//         });
//       }

//       return res.status(500).json({ error: "Database error: " + err.message });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Payslip not found" });
//     }

//     console.log(
//       "Payslip updated successfully, affected rows:",
//       result.affectedRows,
//     );

//     // Get the updated payslip with employee details
//     const selectQuery = `
//             SELECT p.*, e.name, e.designation, e.bank_account_number, e.IFSC_code, e.bank_name, e.PAN, e.pf_applicable
//             FROM payslip p
//             JOIN employee e ON p.emp_id = e.emp_id
//             WHERE p.id = ?
//         `;

//     db.query(selectQuery, [id], (err, results) => {
//       if (err) {
//         console.error("Error fetching updated payslip:", err);
//         return res.json({ message: "Payslip updated successfully" });
//       }
//       console.log("Returning updated payslip:", results[0]);
//       res.json({
//         message: "Payslip updated successfully",
//         payslip: results[0],
//       });
//     });
//   });
// });

// ==================== UPDATE PAYSLIP ====================

app.put("/api/payslips/:id", (req, res) => {
  const { id } = req.params;

  console.log("====================================");
  console.log("UPDATE PAYSLIP REQUEST");
  console.log("Payslip ID:", id);
  console.log("Request body:", req.body);

  const {
    emp_id,
    salary_month,
    salary_year,
    advance_salary,
    paid_days,
    holidays,
    leaves,
    gross_salary,
    pf_deduction,
    professional_tax_deduction,
    performance_bonus,
    arrears,
    total_deductions,
    net_salary,
  } = req.body;

  // --------------------------------------------------
  // 1. Validate required fields
  // --------------------------------------------------

  if (
    !emp_id ||
    salary_month === undefined ||
    salary_year === undefined ||
    paid_days === undefined
  ) {
    return res.status(400).json({
      error: "Employee ID, month, year and paid days are required",
    });
  }

  // --------------------------------------------------
  // 2. Check whether payslip exists
  // --------------------------------------------------

  const checkPayslipQuery = `
    SELECT id, emp_id
    FROM payslip
    WHERE id = ?
  `;

  db.query(checkPayslipQuery, [id], (err, payslipResults) => {
    if (err) {
      console.error("Error checking payslip:", err);

      return res.status(500).json({
        error: "Database error while checking payslip",
      });
    }

    if (payslipResults.length === 0) {
      return res.status(404).json({
        error: "Payslip not found",
      });
    }

    // --------------------------------------------------
    // 3. Check whether employee ID exists
    // --------------------------------------------------

    const checkEmployeeQuery = `
      SELECT
        emp_id,
        name,
        designation,
        PAN,
        bank_account_number,
        IFSC_code,
        bank_name,
        pf_applicable
      FROM employee
      WHERE emp_id = ?
    `;

    db.query(checkEmployeeQuery, [emp_id], (err, employeeResults) => {
      if (err) {
        console.error("Error checking employee:", err);

        return res.status(500).json({
          error: "Database error while checking employee",
        });
      }

      if (employeeResults.length === 0) {
        return res.status(400).json({
          error: `Employee ID ${emp_id} does not exist`,
        });
      }

      const employee = employeeResults[0];

      // --------------------------------------------------
      // 4. Convert numeric values safely
      // --------------------------------------------------

      const parsedMonth = parseInt(salary_month, 10);
      const parsedYear = parseInt(salary_year, 10);
      const parsedPaidDays = parseInt(paid_days, 10);

      const parsedHolidays = parseInt(holidays, 10) || 0;
      const parsedLeaves = parseInt(leaves, 10) || 0;

      const parsedAdvanceSalary = parseFloat(advance_salary) || 0;

      const parsedGrossSalary = parseFloat(gross_salary) || 0;

      const parsedPfDeduction = parseFloat(pf_deduction) || 0;

      const parsedProfessionalTax = parseFloat(professional_tax_deduction) || 0;

      const parsedPerformanceBonus = parseFloat(performance_bonus) || 0;

      const parsedArrears = parseFloat(arrears) || 0;

      const parsedTotalDeductions = parseFloat(total_deductions) || 0;

      const parsedNetSalary = parseFloat(net_salary) || 0;

      // --------------------------------------------------
      // 5. Validate month/year/paid days
      // --------------------------------------------------

      if (
        !Number.isInteger(parsedMonth) ||
        parsedMonth < 1 ||
        parsedMonth > 12
      ) {
        return res.status(400).json({
          error: "Invalid salary month",
        });
      }

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 2000 ||
        parsedYear > 2100
      ) {
        return res.status(400).json({
          error: "Invalid salary year",
        });
      }

      if (!Number.isInteger(parsedPaidDays) || parsedPaidDays < 0) {
        return res.status(400).json({
          error: "Invalid paid days",
        });
      }

      // --------------------------------------------------
      // 6. Validate decimal range
      // DECIMAL(10,2)
      // --------------------------------------------------

      const maxAmount = 99999999.99;

      const amountFields = [
        ["advance_salary", parsedAdvanceSalary],
        ["gross_salary", parsedGrossSalary],
        ["pf_deduction", parsedPfDeduction],
        ["professional_tax_deduction", parsedProfessionalTax],
        ["performance_bonus", parsedPerformanceBonus],
        ["arrears", parsedArrears],
        ["total_deductions", parsedTotalDeductions],
        ["net_salary", parsedNetSalary],
      ];

      for (const [fieldName, value] of amountFields) {
        if (value < 0) {
          return res.status(400).json({
            error: `${fieldName} cannot be negative`,
          });
        }

        if (value > maxAmount) {
          return res.status(400).json({
            error: `${fieldName} exceeds maximum allowed value`,
          });
        }
      }

      // --------------------------------------------------
      // 7. Update payslip
      // --------------------------------------------------

      const updateQuery = `
        UPDATE payslip
        SET
          emp_id = ?,
          salary_month = ?,
          salary_year = ?,
          advance_salary = ?,
          paid_days = ?,
          holidays = ?,
          leaves = ?,
          gross_salary = ?,
          pf_deduction = ?,
          professional_tax_deduction = ?,
          performance_bonus = ?,
          arrears = ?,
          total_deductions = ?,
          net_salary = ?
        WHERE id = ?
      `;

      const values = [
        emp_id,
        parsedMonth,
        parsedYear,
        parsedAdvanceSalary.toFixed(2),
        parsedPaidDays,
        parsedHolidays,
        parsedLeaves,
        parsedGrossSalary.toFixed(2),
        parsedPfDeduction.toFixed(2),
        parsedProfessionalTax.toFixed(2),
        parsedPerformanceBonus.toFixed(2),
        parsedArrears.toFixed(2),
        parsedTotalDeductions.toFixed(2),
        parsedNetSalary.toFixed(2),
        id,
      ];

      console.log("Updating payslip with:");
      console.log(values);

      db.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error("Error updating payslip:", err);

          // Foreign key error
          if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
              error: `Employee ID ${emp_id} does not exist`,
            });
          }

          // Duplicate key
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              error:
                "A payslip already exists for this employee, month and year.",
            });
          }

          // Invalid value
          if (err.code === "ER_TRUNCATED_WRONG_VALUE") {
            return res.status(400).json({
              error: "Invalid value supplied for one of the fields",
            });
          }

          // Null error
          if (err.code === "ER_BAD_NULL_ERROR") {
            return res.status(400).json({
              error: "A required field cannot be null",
            });
          }

          return res.status(500).json({
            error: "Database error: " + err.message,
          });
        }

        // --------------------------------------------------
        // 8. Make sure the payslip actually exists
        // --------------------------------------------------

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Payslip not found or no changes were made",
          });
        }

        console.log("Payslip updated successfully:", id);

        // --------------------------------------------------
        // 9. Fetch updated payslip + employee details
        // --------------------------------------------------

        const selectQuery = `
          SELECT
            p.*,
            e.name,
            e.designation,
            e.PAN,
            e.bank_account_number,
            e.IFSC_code,
            e.bank_name,
            e.pf_applicable
          FROM payslip p
          JOIN employee e
            ON p.emp_id = e.emp_id
          WHERE p.id = ?
        `;

        db.query(selectQuery, [id], (err, results) => {
          if (err) {
            console.error("Error fetching updated payslip:", err);

            return res.status(500).json({
              error: "Payslip updated but failed to fetch updated data",
            });
          }

          if (results.length === 0) {
            return res.status(404).json({
              error: "Payslip updated but could not be retrieved",
            });
          }

          console.log("Updated payslip returned:", results[0]);

          return res.json({
            message: "Payslip updated successfully",
            payslip: results[0],
            employee: employee,
          });
        });
      });
    });
  });
});

// Get employee earnings
app.get("/api/employees/:emp_id/earnings", (req, res) => {
  const { emp_id } = req.params;

  const query = `
        SELECT 
            emp_id,
            name,
            basic_salary,
            house_rent_allowence,
            transport_allowance,
            internet_allowance,
            medical_allowance,
            pf_applicable,
            0 as telephone_allowance,
            ROUND(basic_salary * 0.12, 2) as employer_pf_contribution
        FROM employee 
        WHERE emp_id = ?
    `;

  db.query(query, [emp_id], (err, results) => {
    if (err) {
      console.error("Error fetching employee earnings:", err);
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(results[0]);
  });
});

// Create earnings table
const createEarningsTable = `
    CREATE TABLE IF NOT EXISTS employee_earnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id VARCHAR(20),
        basic_salary DECIMAL(10,2) NOT NULL,
        house_rent_allowence DECIMAL(10,2) DEFAULT 0,
        transport_allowance DECIMAL(10,2) DEFAULT 0,
        internet_allowance DECIMAL(10,2) DEFAULT 0,
        telephone_allowance DECIMAL(10,2) DEFAULT 0,
        medical_allowance DECIMAL(10,2) DEFAULT 0,
        employer_pf_contribution DECIMAL(10,2) DEFAULT 0,
        performance_bonus DECIMAL(10,2) DEFAULT 0,
        arrears DECIMAL(10,2) DEFAULT 0,
        effective_from DATE NOT NULL,
        effective_to DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_effective (emp_id, effective_from)
    )
`;

db.query(createEarningsTable, (err) => {
  if (err) console.error("Error creating earnings table:", err);
  else console.log("Employee earnings table ready");
});

// Get current earnings for an employee
app.get("/api/earnings/current/:emp_id", (req, res) => {
  const { emp_id } = req.params;

  const query = `
        SELECT * FROM employee_earnings 
        WHERE emp_id = ? 
        AND (effective_to IS NULL OR effective_to >= CURDATE())
        ORDER BY effective_from DESC 
        LIMIT 1
    `;

  db.query(query, [emp_id], (err, results) => {
    if (err) {
      console.error("Error fetching current earnings:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      // Fallback to employee table
      return fetchEmployeeEarnings(req, res, emp_id);
    }
    res.json(results[0]);
  });
});

// Helper function to fetch from employee table
function fetchEmployeeEarnings(req, res, emp_id) {
  const query = `
        SELECT 
            emp_id,
            basic_salary,
            house_rent_allowence,
            transport_allowance,
            internet_allowance,
            telephone_allowance,
            medical_allowance,
            employer_pf_contribution,
            pf_applicable
        FROM employee 
        WHERE emp_id = ?
    `;

  db.query(query, [emp_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(results[0]);
  });
}

// ==================== PDF GENERATION ROUTES ====================

// Generate individual payslip PDF with performance bonus - UPDATED to use calculated values
app.post("/api/payslip/pdf", (req, res) => {
  const { emp_id, year, month } = req.body;

  const query = `
        SELECT p.*, e.*
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.emp_id = ? AND p.salary_year = ? AND p.salary_month = ?
    `;

  db.query(query, [emp_id, year, month], (err, results) => {
    if (err) {
      console.error("Error fetching payslip:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    const data = results[0];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    try {
      const doc = new PDFDocument();
      const filename = `payslip_${data.emp_id}_${month}_${year}.pdf`;

      res.setHeader(
        "Content-disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-type", "application/pdf");

      doc.pipe(res);

      // Company Header
      doc
        .fontSize(20)
        .text("Soft Electronic Solutions Private Limited", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text("PAYSLIP", { align: "center" });
      doc.moveDown();

      // Month and Year
      doc
        .fontSize(14)
        .text(`${monthNames[month - 1]} ${year}`, { align: "center" });
      doc.moveDown();
      doc.moveDown();

      // Employee Details
      doc.fontSize(12);
      doc.text(`Employee ID: ${data.emp_id}`);
      doc.text(`Employee Name: ${data.name}`);
      doc.text(`Designation: ${data.designation}`);
      doc.text(`PAN: ${data.PAN}`);
      doc.text(
        `Date of Joining: ${new Date(data.date_of_joining).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
      );

      // Calculate working days info
      const totalDays = new Date(year, month, 0).getDate();
      const paidDays = parseInt(data.paid_days) || 0;
      const holidays = parseInt(data.holidays) || 0;
      const leaves = parseInt(data.leaves) || 0;

      doc.text(
        `Paid Days: ${paidDays} (Total Days: ${totalDays}, Holidays: ${holidays}, Leaves: ${leaves > 2 ? leaves - 2 : 0} deducted)`,
      );
      doc.moveDown();
      doc.moveDown();

      // Salary Details Table
      const tableTop = doc.y;
      const leftCol = 80;
      const rightCol = 400;
      const colWidth = 150;

      // Table headers
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Earnings", leftCol, tableTop);
      doc.text("Amount (₹)", rightCol, tableTop);

      // Draw header line
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();

      doc.font("Helvetica");
      let yPos = tableTop + 30;

      // Earnings section - USING CALCULATED VALUES FROM PAYSLIP TABLE
      doc.fontSize(11);

      // Get individual components (but these might not be stored separately in payslip table)
      // We'll use the gross salary which is already calculated based on paid days
      const grossSalary = parseFloat(data.gross_salary) || 0;

      // Show basic salary and allowances if we can get them, otherwise show as "Salary"
      if (data.basic_salary) {
        doc.text("Basic Salary", leftCol, yPos);
        doc.text(parseFloat(data.basic_salary).toFixed(2), rightCol, yPos);
        yPos += 20;
      }

      if (parseFloat(data.house_rent_allowence) > 0) {
        doc.text("House Rent Allowance", leftCol, yPos);
        doc.text(
          parseFloat(data.house_rent_allowence).toFixed(2),
          rightCol,
          yPos,
        );
        yPos += 20;
      }

      if (parseFloat(data.transport_allowance) > 0) {
        doc.text("Transport Allowance", leftCol, yPos);
        doc.text(
          parseFloat(data.transport_allowance).toFixed(2),
          rightCol,
          yPos,
        );
        yPos += 20;
      }

      if (parseFloat(data.internet_allowance) > 0) {
        doc.text("Internet Allowance", leftCol, yPos);
        doc.text(
          parseFloat(data.internet_allowance).toFixed(2),
          rightCol,
          yPos,
        );
        yPos += 20;
      }

      if (parseFloat(data.medical_allowance) > 0) {
        doc.text("Medical Allowance", leftCol, yPos);
        doc.text(parseFloat(data.medical_allowance).toFixed(2), rightCol, yPos);
        yPos += 20;
      }

      // Performance Bonus
      const performanceBonus = parseFloat(data.performance_bonus) || 0;
      if (performanceBonus > 0) {
        doc.text("Performance Bonus", leftCol, yPos);
        doc.text(performanceBonus.toFixed(2), rightCol, yPos);
        yPos += 20;
      }

      // Arrears
      const arrears = parseFloat(data.arrears) || 0;
      if (arrears > 0) {
        doc.text("Arrears", leftCol, yPos);
        doc.text(arrears.toFixed(2), rightCol, yPos);
        yPos += 20;
      }

      // Gross Salary (already adjusted for attendance)
      doc.font("Helvetica-Bold");
      doc.text("Gross Earnings", leftCol, yPos);
      doc.text(grossSalary.toFixed(2), rightCol, yPos);
      yPos += 25;

      doc.font("Helvetica");

      // Draw separator
      doc
        .moveTo(50, yPos - 10)
        .lineTo(550, yPos - 10)
        .stroke();

      // Deductions section
      doc.font("Helvetica-Bold");
      doc.text("Deductions", leftCol, yPos);
      doc.text("Amount (₹)", rightCol, yPos);
      yPos += 20;
      doc
        .moveTo(50, yPos - 5)
        .lineTo(550, yPos - 5)
        .stroke();

      doc.font("Helvetica");

      // PF Deduction
      const pfDeduction = parseFloat(data.pf_deduction) || 0;
      doc.text("PF Deduction", leftCol, yPos);
      doc.text(pfDeduction.toFixed(2), rightCol, yPos);
      yPos += 20;

      // Professional Tax
      const profTax = parseFloat(data.professional_tax_deduction) || 0;
      doc.text("Professional Tax", leftCol, yPos);
      doc.text(profTax.toFixed(2), rightCol, yPos);
      yPos += 20;

      // Advance Salary
      const advance = parseFloat(data.advance_salary) || 0;
      if (advance > 0) {
        doc.text("Advance Salary", leftCol, yPos);
        doc.text(advance.toFixed(2), rightCol, yPos);
        yPos += 20;
      }

      // Total Deductions
      const totalDeductions = parseFloat(data.total_deductions) || 0;
      doc.font("Helvetica-Bold");
      doc.text("Total Deductions", leftCol, yPos);
      doc.text(totalDeductions.toFixed(2), rightCol, yPos);
      yPos += 25;

      // Draw separator
      doc
        .moveTo(50, yPos - 10)
        .lineTo(550, yPos - 10)
        .stroke();

      // Net Salary
      const netSalary = parseFloat(data.net_salary) || 0;
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text("NET SALARY", leftCol, yPos);
      doc.text(`₹ ${netSalary.toFixed(2)}`, rightCol, yPos);
      yPos += 30;

      // Amount in words
      doc.fontSize(10).font("Helvetica");
      doc.text(`Amount in words: ${numberToWords(netSalary)}`, leftCol, yPos);
      yPos += 30;

      // Footer
      doc.fontSize(9);
      doc.text(
        "This is a computer-generated payslip and does not require a signature.",
        50,
        yPos,
        { align: "center", width: 500 },
      );

      doc.end();
      console.log(
        "Payslip PDF generated successfully with correct attendance calculations",
      );
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      res
        .status(500)
        .json({ error: "Error generating PDF: " + pdfError.message });
    }
  });
});

// Helper function to convert numbers to words
function numberToWords(num) {
  if (num === 0) return "Zero Rupees Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + numToWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        numToWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + numToWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        numToWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + numToWords(n % 100000) : "")
      );
    return (
      numToWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + numToWords(n % 10000000) : "")
    );
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = numToWords(rupees) + " Rupees";
  if (paise > 0) {
    words += " and " + numToWords(paise) + " Paise";
  }
  return words + " Only";
}
// Generate payment summary PDF
app.post("/api/payment-summary/pdf", (req, res) => {
  const { year, month } = req.body;
  console.log("Generating PDF for:", { year, month });
  if (!year || !month) {
    return res.status(400).json({ error: "Year and month are required" });
  }
  const query = `
        SELECT p.*, e.name, e.designation,e.PAN, e.bank_account_number, e.IFSC_code, e.bank_name,
               e.pf_applicable
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.salary_year = ? AND p.salary_month = ?
        ORDER BY e.name
    `;
  db.query(query, [year, month], (err, results) => {
    if (err) {
      console.error("Error fetching payslips for PDF:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No payslips found for the selected period" });
    }

    try {
      const doc = new PDFDocument();
      const filename = `payment_summary_${month}_${year}.pdf`;

      res.setHeader(
        "Content-disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-type", "application/pdf");

      doc.pipe(res);

      doc.fontSize(20).text("Payment Summary Report", { align: "center" });
      doc.moveDown();

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      doc
        .fontSize(14)
        .text(`${monthNames[month - 1]} ${year}`, { align: "center" });
      doc.moveDown();
      doc.moveDown();

      // Table headers
      const startX = 40;
      let currentY = doc.y;

      doc.fontSize(8);
      doc.text("Emp ID", startX, currentY);
      doc.text("Name", startX + 50, currentY);
      doc.text("PF", startX + 110, currentY);
      doc.text("Bonus", startX + 130, currentY);
      doc.text("Gross", startX + 170, currentY);
      doc.text("Deductions", startX + 210, currentY);
      doc.text("Net Salary", startX + 270, currentY);
      doc.text("Bank Account", startX + 330, currentY);

      currentY += 15;
      doc
        .moveTo(40, currentY - 5)
        .lineTo(570, currentY - 5)
        .stroke();

      // Table data
      results.forEach((payslip) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;

          // Repeat headers on new page
          doc.fontSize(8);
          doc.text("Emp ID", startX, currentY);
          doc.text("Name", startX + 50, currentY);
          doc.text("PF", startX + 110, currentY);
          doc.text("Bonus", startX + 130, currentY);
          doc.text("Gross", startX + 170, currentY);
          doc.text("Deductions", startX + 210, currentY);
          doc.text("Net Salary", startX + 270, currentY);
          doc.text("Bank Account", startX + 330, currentY);
          currentY += 15;
          doc
            .moveTo(40, currentY - 5)
            .lineTo(570, currentY - 5)
            .stroke();
        }

        doc.text(payslip.emp_id, startX, currentY);
        doc.text(payslip.name.substring(0, 12), startX + 50, currentY);
        doc.text(payslip.pf_applicable ? "Y" : "N", startX + 110, currentY);
        doc.text(
          parseFloat(payslip.performance_bonus || 0).toFixed(0),
          startX + 130,
          currentY,
        );
        doc.text(
          parseFloat(payslip.gross_salary).toFixed(0),
          startX + 170,
          currentY,
        );
        doc.text(
          parseFloat(payslip.total_deductions).toFixed(0),
          startX + 210,
          currentY,
        );
        doc.text(
          `₹${parseFloat(payslip.net_salary).toFixed(0)}`,
          startX + 270,
          currentY,
        );
        doc.text(
          payslip.bank_account_number.substring(0, 12),
          startX + 330,
          currentY,
        );

        currentY += 20;
      });

      // Totals
      const totalGross = results.reduce(
        (sum, p) => sum + parseFloat(p.gross_salary),
        0,
      );
      const totalDeductions = results.reduce(
        (sum, p) => sum + parseFloat(p.total_deductions),
        0,
      );
      const totalNet = results.reduce(
        (sum, p) => sum + parseFloat(p.net_salary),
        0,
      );
      const totalPF = results.reduce(
        (sum, p) => sum + parseFloat(p.pf_deduction),
        0,
      );
      const totalBonus = results.reduce(
        (sum, p) => sum + parseFloat(p.performance_bonus || 0),
        0,
      );
      const totalArrears = results.reduce(
        (sum, p) => sum + parseFloat(p.arrears || 0),
        0,
      );

      doc.moveDown();
      doc.moveDown();
      doc.fontSize(10);
      doc.text(`Total Employees: ${results.length}`, { align: "left" });
      doc.text(`Total Gross Salary: ₹${totalGross.toFixed(2)}`, {
        align: "left",
      });
      doc.text(`Total PF Deduction: ₹${totalPF.toFixed(2)}`, { align: "left" });
      doc.text(`Total Performance Bonus: ₹${totalBonus.toFixed(2)}`, {
        align: "left",
      });
      doc.text(`Total Arrears: ₹${totalArrears.toFixed(2)}`, { align: "left" });
      doc.text(`Total Deductions: ₹${totalDeductions.toFixed(2)}`, {
        align: "left",
      });
      doc.text(`Total Net Salary: ₹${totalNet.toFixed(2)}`, { align: "left" });

      doc.end();
      console.log("PDF generated successfully");
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      res
        .status(500)
        .json({ error: "Error generating PDF: " + pdfError.message });
    }
  });
});

//****************************************************************************** */ REPORTS ROUTES ====================

// Monthly salary report
app.get("/api/reports/monthly/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const query = `
        SELECT 
            e.emp_id,
            e.name,
            e.designation,
            e.PAN,
            e.pf_applicable,
            p.gross_salary,
            p.pf_deduction,
            p.professional_tax_deduction,
            p.performance_bonus,
            p.arrears,
            p.net_salary,
            p.paid_days,
            p.leaves
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.salary_year = ? AND p.salary_month = ?
        ORDER BY e.name
    `;

  db.query(query, [year, month], (err, results) => {
    if (err) {
      console.error("Error generating monthly report:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // Calculate summary
    const summary = {
      totalEmployees: results.length,
      employeesWithPF: results.filter((r) => r.pf_applicable).length,
      employeesWithoutPF: results.filter((r) => !r.pf_applicable).length,
      totalGrossSalary: results.reduce(
        (sum, r) => sum + parseFloat(r.gross_salary || 0),
        0,
      ),
      totalNetSalary: results.reduce(
        (sum, r) => sum + parseFloat(r.net_salary || 0),
        0,
      ),
      totalPF: results.reduce(
        (sum, r) => sum + parseFloat(r.pf_deduction || 0),
        0,
      ),
      totalPerformanceBonus: results.reduce(
        (sum, r) => sum + parseFloat(r.performance_bonus || 0),
        0,
      ),
      totalArrears: results.reduce(
        (sum, r) => sum + parseFloat(r.arrears || 0),
        0,
      ),
    };

    res.json({
      month,
      year,
      details: results,
      summary,
    });
  });
});
// Yearly salary summary
app.get("/api/reports/yearly/:year", (req, res) => {
  const { year } = req.params;

  const query = `
        SELECT 
            e.emp_id,
            e.name,
            e.pf_applicable,
            MONTHNAME(STR_TO_DATE(p.salary_month, '%m')) as month_name,
            p.salary_month,
            p.net_salary,
            p.pf_deduction,
            p.performance_bonus,
            p.arrears
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.salary_year = ?
        ORDER BY e.name, p.salary_month
    `;

  db.query(query, [year], (err, results) => {
    if (err) {
      console.error("Error generating yearly report:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // Group by employee
    const employeeSummary = {};
    results.forEach((row) => {
      if (!employeeSummary[row.emp_id]) {
        employeeSummary[row.emp_id] = {
          emp_id: row.emp_id,
          name: row.name,
          pf_applicable: row.pf_applicable,
          months: [],
          totalSalary: 0,
          totalPF: 0,
          totalBonus: 0,
        };
      }
      employeeSummary[row.emp_id].months.push({
        month: row.month_name,
        salary: row.net_salary,
        pf_amount: row.pf_deduction,
        bonus: row.performance_bonus,
        arrears: row.arrears,
      });
      employeeSummary[row.emp_id].totalSalary += parseFloat(
        row.net_salary || 0,
      );
      employeeSummary[row.emp_id].totalPF += parseFloat(row.pf_deduction || 0);
      employeeSummary[row.emp_id].totalBonus += parseFloat(
        row.performance_bonus || 0,
      );
      employeeSummary[row.emp_id].totalArrears += parseFloat(row.arrears || 0);
    });

    res.json({
      year,
      employeeSummary: Object.values(employeeSummary),
      totalPayout: results.reduce(
        (sum, r) => sum + parseFloat(r.net_salary || 0),
        0,
      ),
    });
  });
});
// Employee-wise salary history
app.get("/api/reports/employee/:emp_id", (req, res) => {
  const { emp_id } = req.params;

  const query = `
        SELECT 
            p.*,
            MONTHNAME(STR_TO_DATE(p.salary_month, '%m')) as month_name
        FROM payslip p
        WHERE p.emp_id = ?
        ORDER BY p.salary_year DESC, p.salary_month DESC
    `;

  db.query(query, [emp_id], (err, results) => {
    if (err) {
      console.error("Error generating employee history:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Get employee details
    const empQuery =
      "SELECT name, designation, PAN, pf_applicable FROM employee WHERE emp_id = ?";
    db.query(empQuery, [emp_id], (err, empResults) => {
      if (err) {
        console.error("Error fetching employee details:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const totalEarnings = results.reduce(
        (sum, r) => sum + parseFloat(r.net_salary || 0),
        0,
      );
      const totalPF = results.reduce(
        (sum, r) => sum + parseFloat(r.pf_deduction || 0),
        0,
      );
      const totalBonus = results.reduce(
        (sum, r) => sum + parseFloat(r.performance_bonus || 0),
        0,
      );
      const totalArrears = results.reduce(
        (sum, r) => sum + parseFloat(r.arrears || 0),
        0,
      );

      res.json({
        employee: empResults[0] || { name: "Unknown", designation: "Unknown" },
        history: results,
        totalEarnings: totalEarnings,
        totalPF: totalPF,
        totalBonus: totalBonus,
        totalArrears: totalArrears,
      });
    });
  });
});

//********************************************************************************EMPLOYEE DETAILS EXCEL DOWNLOAD***************************************************
// Download employee details in Excel format matching BLKPAY template
app.post("/api/employees/download-excel", (req, res) => {
  const { month, year } = req.body;
  console.log(
    `Generating employee details Excel file in strict BLKPAY format for month: ${month}, year: ${year}`,
  );
  if (!month || !year) {
    return res.status(400).json({ error: "Month and year are required" });
  }
  // Query to get payslips for the selected month and year with employee details
  const query = `
        SELECT 
            e.name,
            e.bank_account_number,
            e.IFSC_code,
            p.net_salary,
            p.salary_month,
            p.salary_year,
            e.emp_id
        FROM payslip p
        JOIN employee e ON p.emp_id = e.emp_id
        WHERE p.salary_month = ? AND p.salary_year = ?
        ORDER BY e.emp_id
    `;

  db.query(query, [month, year], (err, payslips) => {
    if (err) {
      console.error("Error fetching payslips for Excel:", err);
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    if (payslips.length === 0) {
      return res
        .status(404)
        .json({ error: `No payslips found for ${month}/${year}` });
    }
    try {
      //a new workbook
      const workbook = xlsx.utils.book_new();
      // Define the worksheet data with EXACT headers matching BLKPAY format
      const worksheetData = [];
      // Define the exact headers from BLKPAY format - NO EXTRA COLUMNS
      const headers = [
        "Beneficiary Name",
        "Beneficiary Account Number",
        "IFSC",
        "Transaction Type",
        "Debit Account Number",
        "Transaction Date",
        "Amount",
        "Currency",
        "Beneficiary Email ID",
        "Remarks",
        "Custom Header - 1",
        "Custom Header - 2",
        "Custom Header - 3",
        "Custom Header - 4",
        "Custom Header - 5",
      ];
      worksheetData.push(headers);
      // Add payslip data rows
      payslips.forEach((payslip) => {
        // Create row with EXACTLY 15 columns in the specified order
        const row = [
          payslip.name || "", // Beneficiary Name
          payslip.bank_account_number || "", // Beneficiary Account Number
          "", // IFSC
          "IFT", // Transaction Type (fixed)
          "", // Debit Account Number (empty)
          "", // Transaction Date (empty) DD/MM/YYYY the
          payslip.net_salary ? parseFloat(payslip.net_salary).toFixed(2) : "", // Amount - NET SALARY from payslip
          "INR", // Currency (fixed)
          "", // Beneficiary Email ID (empty)
          ``, // empty
          "", // Custom Header - 1 (empty)
          "", // Custom Header - 2 (empty)
          "", // Custom Header - 3 (empty)
          "", // Custom Header - 4 (empty)
          "", // Custom Header - 5 (empty)
        ];
        worksheetData.push(row);
      });
      // Create worksheet
      const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
      // Set column widths for better readability
      const colWidths = [
        { wch: 25 }, // Beneficiary Name
        { wch: 22 }, // Beneficiary Account Number
        { wch: 15 }, // IFSC
        { wch: 15 }, // Transaction Type
        { wch: 20 }, // Debit Account Number
        { wch: 15 }, // Transaction Date
        { wch: 15 }, // Amount
        { wch: 10 }, // Currency
        { wch: 20 }, // Beneficiary Email ID
        { wch: 20 }, // Remarks
        { wch: 15 }, // Custom Header - 1
        { wch: 15 }, // Custom Header - 2
        { wch: 15 }, // Custom Header - 3
        { wch: 15 }, // Custom Header - 4
        { wch: 15 }, // Custom Header - 5
      ];
      worksheet["!cols"] = colWidths;
      // Add the worksheet to workbook
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[month - 1];
      xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        `BLKPAY_${monthName}_${year}`,
      );
      // Generate filename in BLKPAY_yyyymm format
      const filename = `BLKPAY_${year}${String(month).padStart(2, "0")}.xlsx`;
      // Write to buffer
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      // Set response headers
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Length", buffer.length);
      // Send the file
      res.send(buffer);
      console.log(
        `Excel file generated successfully: ${filename} with ${payslips.length} records`,
      );
    } catch (error) {
      console.error("Error generating Excel file:", error);
      res
        .status(500)
        .json({ error: "Error generating Excel file: " + error.message });
    }
  });
});

// ==================== LOGIN ROUTE ====================

// Add at top
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET = "mysecret123";

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // STRICT username comparison
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE BINARY username = ?", [
        trimmedUsername,
      ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];

    // STRICT password comparison
    if (trimmedPassword !== user.password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate token
    const accessToken = jwt.sign(
      {
        username: user.username,
        role: user.role,
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      accessToken,
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});
app.listen(PORT, host, () => {
  console.log(`Server running on port ${PORT}`);
  // console.log(`API available at http://192.168.29.239:${PORT}/api`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
