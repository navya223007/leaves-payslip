// Updated App.js - Hide BLKPAY table from UI

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
// import "./App.css";
import {
  ThemeProvider,
  createTheme,
  Snackbar,
  CssBaseline,
  Alert,
} from "@mui/material";
import PayslipGeneration from "./PayslipGeneration";
import ViewPDF from "./ViewPDF";

// navya
// import LoginPage from "./LoginPage";
import {
  FaBars,
  FaTimes,
  FaUsers,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";
import "./custom.css";
// import "./empolyelist.css";
import { Container, Row, Col, Form, Card, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import ReadEmployeePage from "./ReadEmpolyePage"; // adjust the path
import Login from "./Login";

// const API_BASE_URL = "http://192.168.29.239:7008/api";
const API_BASE_URL = "http://localhost:7008/api";

// Main App component with routing
function AppContent() {
  // navya
  const [sidebarOpen, setSidebarOpen] = useState(false); // <-- Fixes your error
  const [menuOpen, setMenuOpen] = useState(false);
  const validateEmployeeForm = () => {
    let errors = {};

    // Regex
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const accRegex = /^[0-9]{9,18}$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    // PAN VALIDATION
    if (!employeeForm.PAN) {
      errors.PAN = "PAN is required";
    } else if (!panRegex.test(employeeForm.PAN.toUpperCase())) {
      errors.PAN = "Invalid PAN (Ex: ABCDE1234F)";
    } else if (
      employees.some(
        (emp) =>
          String(emp.PAN).toUpperCase() ===
            String(employeeForm.PAN).toUpperCase() &&
          emp.emp_id !== employeeForm.emp_id,
      )
    ) {
      errors.PAN = "PAN already exists";
    }

    // BANK ACCOUNT VALIDATION
    if (!employeeForm.bank_account_number) {
      errors.bank_account_number = "Account number required";
    } else if (!accRegex.test(employeeForm.bank_account_number)) {
      errors.bank_account_number = "Invalid account number";
    } else if (
      employees.some(
        (emp) =>
          String(emp.bank_account_number).trim() ===
            String(employeeForm.bank_account_number).trim() &&
          emp.emp_id !== employeeForm.emp_id,
      )
    ) {
      errors.bank_account_number = "Account already exists";
    }

    // IFSC VALIDATION
    if (!employeeForm.IFSC_code) {
      errors.IFSC_code = "IFSC required";
    } else if (!ifscRegex.test(employeeForm.IFSC_code.toUpperCase())) {
      errors.IFSC_code = "Invalid IFSC (Ex: SBIN0001234)";
    }

    // Debug (you can remove later)
    console.log("Validation Errors:", errors);

    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const [errors, setErrors] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // navya
  const navigate = useNavigate();
  // State for different sections
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [payslips, setPayslips] = useState([]);
  const [reports, setReports] = useState(null);
  const roboticsTheme = createTheme({
    palette: {
      mode: "dark",
      primary: { main: "#e4f5f5" },
    },
    typography: {
      fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    },
  });
  const [loading, setLoading] = useState({
    general: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, general: true }));

      await Promise.all([
        fetchEmployees(),
        fetchPayslips(),
        fetchEmployeeHistory(),
        fetchMonthlyReport(),
        fetchYearlyReport(),
      ]);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, general: false }));
    }
  }, []);

  // Form states with PF applicability field
  const [employeeForm, setEmployeeForm] = useState({
    emp_id: "",
    name: "",
    designation: "",
    date_of_joining: "",
    PAN: "",
    basic_salary: "",
    house_rent_allowence: "",
    transport_allowance: "",
    internet_allowance: "",
    medical_allowance: "",
    professional_tax: "",
    bank_account_number: "",
    IFSC_code: "",
    bank_name: "",
    pf_applicable: true,
  });

  const [payslipForm, setPayslipForm] = useState({
    emp_id: "",
    salary_month: new Date().getMonth() + 1,
    salary_year: new Date().getFullYear(),
    advance_salary: "0",
    paid_days: "30",
    holidays: "0",
    leaves: "0",
  });

  const [reportFilters, setReportFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    emp_id: "",
  });

  // New state for BLKPAY export filtering
  const [blkpayFilters, setBlkpayFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Months array
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
    new Date().getFullYear() + 2,
  ];

  //  navya

  const formatDateForDisplay = (date) => {
    if (!date) return "";

    // ✅ If already DD/MM/YYYY → return directly
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }

    const dateObj = new Date(date);

    if (isNaN(dateObj)) return "";

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const convertToDBFormat = (dateString) => {
    if (!dateString) return null;

    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split("/");
      return `${year}-${month}-${day}`;
    }

    return dateString;
  };

  const validateDateFormat = (dateString) => {
    if (!dateString) return true; // Empty is handled by required field

    // Check if matches DD/MM/YYYY format
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dateString)) return false;

    const [_, day, month, year] = dateString.match(regex);
    const date = new Date(`${year}-${month}-${day}`);

    // Check if it's a valid date
    return (
      date instanceof Date &&
      !isNaN(date) &&
      date.getDate() === parseInt(day) &&
      date.getMonth() + 1 === parseInt(month) &&
      date.getFullYear() === parseInt(year)
    );
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 7008);
  };

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/employees`);
      // Convert dates to display format
      const employeesWithFormattedDates = response.data.map((emp) => ({
        ...emp,
        date_of_joining: formatDateForDisplay(emp.date_of_joining),
      }));
      setEmployees(employeesWithFormattedDates);
    } catch (error) {
      showMessage("error", "Error fetching employees");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      localStorage.removeItem("token");
      sessionStorage.clear();
      setIsLoggedIn(false);
    }
  };
  // Load employees on component mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees();
      fetchData();
    }
  }, [isLoggedIn]);
  const handleLogin = async (credentials) => {
    try {
      if (!credentials) {
        throw new Error("Credentials are required");
      }

      const username = credentials.username?.trim();
      const password = credentials.password?.trim();

      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      const response = await fetch("http://localhost:7008/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Invalid username or password");
      }

      if (!data?.accessToken) {
        throw new Error("Authentication token not received");
      }

      localStorage.setItem("token", data.accessToken);

      // ONLY set login state
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };
  // Helper functions for date formatting

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Handle employee form input change
  const handleEmployeeInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "date_of_joining") {
      // Auto-format as user types
      let formattedValue = value;
      // Remove any non-digit characters
      const digits = value.replace(/\D/g, "");
      // Format as DD/MM/YYYY
      if (digits.length <= 2) {
        formattedValue = digits;
      } else if (digits.length <= 4) {
        formattedValue = digits.slice(0, 2) + "/" + digits.slice(2);
      } else if (digits.length <= 8) {
        formattedValue =
          digits.slice(0, 2) +
          "/" +
          digits.slice(2, 4) +
          "/" +
          digits.slice(4, 8);
      } else {
        formattedValue =
          digits.slice(0, 2) +
          "/" +
          digits.slice(2, 4) +
          "/" +
          digits.slice(4, 8);
      }
      setEmployeeForm({ ...employeeForm, [name]: formattedValue });

      // Validate on change and show warning if invalid
      if (formattedValue.length === 10 && !validateDateFormat(formattedValue)) {
        setMessage({ type: "warning", text: "Please enter a valid date" });
      }
    } else {
      const inputValue = type === "checkbox" ? checked : value;
      setEmployeeForm({ ...employeeForm, [name]: inputValue });
    }
  };

  // Handle payslip form input change
  const handlePayslipInputChange = (e) => {
    const { name, value } = e.target;
    setPayslipForm({ ...payslipForm, [name]: value });
  };

  // Handle report filter change
  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters({ ...reportFilters, [name]: value });
  };

  // Handle BLKPAY filter change
  const handleBlkpayFilterChange = (e) => {
    const { name, value } = e.target;
    setBlkpayFilters({ ...blkpayFilters, [name]: parseInt(value) });
  };

  // Reset employee form
  const resetEmployeeForm = () => {
    setEmployeeForm({
      emp_id: "",
      name: "",
      designation: "",
      date_of_joining: "",
      PAN: "",
      basic_salary: "",
      house_rent_allowence: "",
      transport_allowance: "",
      internet_allowance: "",
      medical_allowance: "",
      professional_tax: "",
      bank_account_number: "",
      IFSC_code: "",
      bank_name: "",
      pf_applicable: true,
    });
    setEditingEmployee(null);
  };

  // Create or update employee
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();

    // 🔥 ADD FULL FORM VALIDATION FIRST
    if (!validateEmployeeForm()) {
      showMessage("error", "Please fix form errors");
      return;
    }

    setLoading(true);

    try {
      // ✅ (Optional) Date check already covered in validation,
      // but keeping extra safety is fine
      if (!validateDateFormat(employeeForm.date_of_joining)) {
        showMessage("error", "Please enter valid date DD/MM/YYYY");
        setLoading(false);
        return;
      }

      // Convert date format
      const employeeData = {
        ...employeeForm,
        date_of_joining: convertToDBFormat(employeeForm.date_of_joining),
        pf_applicable: employeeForm.pf_applicable,
      };

      if (editingEmployee) {
        await axios.put(
          `${API_BASE_URL}/employees/${employeeForm.emp_id}`,
          employeeData,
        );
        showMessage("success", "Employee updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/employees`, employeeData);
        showMessage("success", "Employee created successfully");
      }

      fetchEmployees();
      resetEmployeeForm();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.error || "Error saving employee",
      );
      console.error("Error:", error);
    }

    setLoading(false);
  };
  // Generate Employee Details PDF (hidden from UI)
  const generateEmployeeDetailsPDF = async () => {
    showMessage("info", "PDF generation is handled through Excel export");
  };

  // Download Employee Details in Excel format (BLKPAY template) - FILTERED BY MONTH & YEAR
  const downloadEmployeeDetailsExcel = async () => {
    if (!blkpayFilters.month || !blkpayFilters.year) {
      showMessage("error", "Please select month and year");
      return;
    }

    setLoading(true);

    try {
      // Make API request to download Excel file with month/year filters
      const response = await axios.post(
        `${API_BASE_URL}/employees/download-excel`,
        {
          month: blkpayFilters.month,
          year: blkpayFilters.year,
        },
        {
          responseType: "blob",
          timeout: 30000,
        },
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `BLKPAY_${blkpayFilters.year}${String(blkpayFilters.month).padStart(2, "0")}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      showMessage(
        "success",
        `BLKPAY Excel file for ${months.find((m) => m.value === blkpayFilters.month)?.label} ${blkpayFilters.year} downloaded successfully`,
      );
    } catch (error) {
      console.error("Error downloading employee details Excel:", error);

      // Handle error response
      if (error.response && error.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            showMessage(
              "error",
              errorData.error || "Error downloading Excel file",
            );
          } catch {
            showMessage("error", "Error downloading Excel file");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        showMessage(
          "error",
          error.response?.data?.error || "Error downloading Excel file",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // navya
  const editEmployee = (employee) => {
    setEmployeeForm(employee); // ✅ direct set
    setEditingEmployee(employee);
    setActiveTab("employees");
  };

  // Delete employee
  const deleteEmployee = async (emp_id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/employees/${emp_id}`);
      showMessage("success", "Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      showMessage("error", "Error deleting employee");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Delete payslip
  const deletePayslip = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payslip?"))
      return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/payslips/${id}`);
      showMessage("success", "Payslip deleted successfully");
      fetchPayslips();
    } catch (error) {
      showMessage("error", "Error deleting payslip");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Calculate PF based on applicability
  const calculatePF = (basicSalary, pfApplicable) => {
    if (pfApplicable) {
      return parseFloat(basicSalary) * 0.12;
    }
    return 0;
  };

  // Generate payslip
  const handleGeneratePayslip = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/payslips/generate`,
        payslipForm,
      );
      showMessage("success", "Payslip generated successfully");
      console.log("Generated payslip:", response.data);

      setPayslipForm({
        ...payslipForm,
        advance_salary: "",
        paid_days: 30,
        holidays: 0,
        leaves: 0,
      });
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.error || "Error generating payslip",
      );
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Fetch payslips for a month
  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payslips/${reportFilters.year}/${reportFilters.month}`,
      );
      setPayslips(response.data);
      console.log("Fetched payslips:", response.data);
    } catch (error) {
      showMessage("error", "Error fetching payslips");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Generate PDF summary
  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-summary/pdf`,
        {
          year: reportFilters.year,
          month: reportFilters.month,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payment_summary_${reportFilters.month}_${reportFilters.year}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      showMessage("success", "PDF generated successfully");
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.error || "Error generating PDF",
      );
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Fetch monthly report
  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports/monthly/${reportFilters.year}/${reportFilters.month}`,
      );
      setReports(response.data);
    } catch (error) {
      showMessage("error", "Error fetching monthly report");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Fetch yearly report
  const fetchYearlyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports/yearly/${reportFilters.year}`,
      );
      setReports(response.data);
    } catch (error) {
      showMessage("error", "Error fetching yearly report");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Fetch employee history
  const fetchEmployeeHistory = async () => {
    if (!reportFilters.emp_id) {
      showMessage("error", "Please select an employee");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports/employee/${reportFilters.emp_id}`,
      );
      setReports(response.data);
    } catch (error) {
      showMessage("error", "Error fetching employee history");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // Handle view payslip
  const handleViewPayslip = (payslip) => {
    console.log("View Payslip clicked for:", payslip);

    try {
      if (!payslip) {
        console.error("No payslip data provided");
        showMessage("error", "No payslip data available");
        return;
      }

      // Format data for ViewPDF component with performance bonus
      const viewData = {
        id: payslip.emp_id,
        name: payslip.name || "",
        designation: payslip.designation || "",
        month:
          months.find((m) => m.value === parseInt(payslip.salary_month))
            ?.label || "Unknown",
        year: payslip.salary_year || new Date().getFullYear(),
        generatedDate: new Date().toLocaleDateString(),
        paidDays: payslip.paid_days || 0,
        pan: payslip.PAN || "N/A",
        grossAfterAttendance: payslip.gross_salary || 0,
        pf: payslip.pf_deduction || 0,
        professionalTax: payslip.professional_tax_deduction || 0,
        advance: payslip.advance_salary || 0,
        performanceBonus: payslip.performance_bonus || 0,
        arrears: payslip.arrears || 0,
        pf_applicable: payslip.pf_applicable || false,
        bank_account: payslip.bank_account_number || "",
        ifsc: payslip.IFSC_code || "",
        bank_name: payslip.bank_name || "",
        holidays: payslip.holidays || 0,
        leaves: payslip.leaves || 0,
      };

      console.log("Navigating with data:", viewData);

      // Navigate to ViewPDF with state
      navigate("/view-pdf", { state: viewData });
    } catch (error) {
      console.error("Error in handleViewPayslip:", error);
      showMessage("error", "Error opening payslip view");
    }
  };

  // Handle edit payslip
  const handleEditPayslip = (payslip) => {
    console.log("Edit Payslip clicked for:", payslip);

    try {
      if (!payslip) {
        console.error("No payslip data provided");
        showMessage("error", "No payslip data available");
        return;
      }

      // Format data for edit mode with performance bonus
      const editData = {
        emp_id: payslip.emp_id,
        salary_month: parseInt(payslip.salary_month),
        salary_year: parseInt(payslip.salary_year),
        advance_salary: parseFloat(payslip.advance_salary) || 0,
        paid_days: parseInt(payslip.paid_days) || 0,
        holidays: parseInt(payslip.holidays) || 0,
        leaves: parseInt(payslip.leaves) || 0,
        gross_salary: parseFloat(payslip.gross_salary) || 0,
        pf_deduction: parseFloat(payslip.pf_deduction) || 0,
        professional_tax_deduction:
          parseFloat(payslip.professional_tax_deduction) || 0,
        performance_bonus: parseFloat(payslip.performance_bonus) || 0,
        arrears: parseFloat(payslip.arrears) || 0,
        total_deductions: parseFloat(payslip.total_deductions) || 0,
        net_salary: parseFloat(payslip.net_salary) || 0,
        payslip_id: payslip.id,
        name: payslip.name,
        designation: payslip.designation,
        bank_account_number: payslip.bank_account_number,
        IFSC_code: payslip.IFSC_code,
        bank_name: payslip.bank_name,
        PAN: payslip.PAN,
        pf_applicable: payslip.pf_applicable,
      };

      console.log("Navigating to edit mode with data:", editData);

      // Navigate to Generate Payslip form (home) with edit data
      navigate("/", { state: { editData } });

      // Set the active tab to 'payslips' to show the generate form
      setActiveTab("payslips");
    } catch (error) {
      console.error("Error in handleEditPayslip:", error);
      showMessage("error", "Error opening payslip for editing");
    }
  };
  // if (!isLoggedIn) {
  //   return (
  //     <ThemeProvider theme={roboticsTheme}>
  //       <CssBaseline />
  //       <LoginPage onLogin={handleLogin} />
  //       <Snackbar
  //         open={snackbar.open}
  //         autoHideDuration={6000}
  //         onClose={() => setSnackbar({ ...snackbar, open: false })}
  //       >
  //         <Alert
  //           severity={snackbar.severity}
  //           onClose={() => setSnackbar({ ...snackbar, open: false })}
  //         >
  //           {snackbar.message}
  //         </Alert>
  //       </Snackbar>
  //     </ThemeProvider>
  //   );
  // }

  return (
    <div className="App-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button
          className="close-btn d-md-none"
          onClick={() => setSidebarOpen(false)}
        >
          <FaTimes />
        </button>
        <ul className="sidebar-nav">
          <li
            className={activeTab === "employees" ? "active" : ""}
            onClick={() => {
              setActiveTab("employees");
              setSidebarOpen(false);
            }}
          >
            <FaUsers className="icon" /> Employee Management
          </li>
          <li
            className={activeTab === "payslips" ? "active" : ""}
            onClick={() => {
              setActiveTab("payslips");
              setSidebarOpen(false);
            }}
          >
            <FaFileInvoiceDollar className="icon" /> Generate Payslip
          </li>
          <li
            className={activeTab === "payment" ? "active" : ""}
            onClick={() => {
              setActiveTab("payment");
              setSidebarOpen(false);
            }}
          >
            <FaMoneyCheckAlt className="icon" /> Payment Summary
          </li>
          <li
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => {
              setActiveTab("reports");
              setSidebarOpen(false);
            }}
          >
            <FaChartBar className="icon" /> Reports
          </li>
          <li
            className={activeTab === "employeelist" ? "active" : ""}
            onClick={() => {
              setActiveTab("employeelist");
              setSidebarOpen(false);
            }}
          >
            <FaUsers className="icon" /> Employee List
          </li>
          {/* Logout Button */}
          <li
            className="logout"
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
          >
            <FaSignOutAlt className="icon" /> Logout
          </li>
        </ul>
      </div>

      <div className="main-content">
        {/* Header */}
        <header className="app-header d-flex align-items-center justify-content-center position-relative py-3">
          {/* Hamburger for mobile */}
          <button
            className="d-md-none btn btn-light hamburger-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <h1 className="header-title text-white m-0 text-truncate w-100">
            Payslip Management System
          </h1>
        </header>

        {/* Message */}
        {message?.text && (
          <div className={`message mt-3 ${message.type}`}>{message.text}</div>
        )}
        <div className="tab-content mt-4">
          {/* Employee Management Tab */}
          {activeTab === "employees" && (
            <Container fluid className="py-3">
              <Form onSubmit={handleEmployeeSubmit}>
                {/* Employee Details */}
                <Card className="mb-4 shadow">
                  <Card.Header className="text-center fw-bold bg-info text-white">
                    Employee Details
                  </Card.Header>

                  <Card.Body>
                    <Row className="g-3">
                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Employee ID *</Form.Label>
                        <Form.Control
                          name="emp_id"
                          value={employeeForm.emp_id}
                          onChange={handleEmployeeInputChange}
                          disabled={editingEmployee}
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Name *</Form.Label>
                        <Form.Control
                          name="name"
                          value={employeeForm.name}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Designation *</Form.Label>
                        <Form.Control
                          name="designation"
                          value={employeeForm.designation}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Date of Joining *</Form.Label>
                        <Form.Control
                          name="date_of_joining"
                          value={employeeForm.date_of_joining}
                          onChange={handleEmployeeInputChange}
                          placeholder="DD/MM/YYYY"
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>PAN *</Form.Label>
                        <Form.Control
                          name="PAN"
                          value={employeeForm.PAN}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Salary */}
                <Card className="mb-4 shadow">
                  <Card.Header className="text-center fw-bold bg-success text-dark text-white">
                    Salary Details
                  </Card.Header>

                  <Card.Body>
                    <Row className="g-3 align-items-end">
                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Basic Salary *</Form.Label>
                        <Form.Control
                          type="number"
                          name="basic_salary"
                          value={employeeForm.basic_salary}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Check
                          type="checkbox"
                          name="pf_applicable"
                          checked={employeeForm.pf_applicable}
                          onChange={handleEmployeeInputChange}
                          label="PF Applicable (12%)"
                          className="mt-4"
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>PF Amount</Form.Label>
                        <Form.Control
                          value={
                            employeeForm.pf_applicable &&
                            employeeForm.basic_salary
                              ? `₹ ${calculatePF(employeeForm.basic_salary, true).toFixed(2)}`
                              : "₹ 0"
                          }
                          readOnly
                          className="bg-light fw-bold"
                        />
                      </Col>

                      {employeeForm.pf_applicable &&
                        employeeForm.basic_salary && (
                          <Col xs={12}>
                            <small className="text-success">
                              PF = 12% of Basic Salary
                            </small>
                          </Col>
                        )}

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>HRA</Form.Label>
                        <Form.Control
                          type="number"
                          name="house_rent_allowence"
                          value={employeeForm.house_rent_allowence}
                          onChange={handleEmployeeInputChange}
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Transport</Form.Label>
                        <Form.Control
                          type="number"
                          name="transport_allowance"
                          value={employeeForm.transport_allowance}
                          onChange={handleEmployeeInputChange}
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Internet</Form.Label>
                        <Form.Control
                          type="number"
                          name="internet_allowance"
                          value={employeeForm.internet_allowance}
                          onChange={handleEmployeeInputChange}
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Medical</Form.Label>
                        <Form.Control
                          type="number"
                          name="medical_allowance"
                          value={employeeForm.medical_allowance}
                          onChange={handleEmployeeInputChange}
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Professional Tax</Form.Label>
                        <Form.Control
                          type="number"
                          name="professional_tax"
                          value={employeeForm.professional_tax}
                          onChange={handleEmployeeInputChange}
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Bank */}
                <Card className="mb-4 shadow">
                  <Card.Header className="text-center fw-bold bg-secondary text-white">
                    Bank Details
                  </Card.Header>

                  <Card.Body>
                    <Row className="g-3">
                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Account Number *</Form.Label>
                        <Form.Control
                          name="bank_account_number"
                          value={employeeForm.bank_account_number}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>IFSC *</Form.Label>
                        <Form.Control
                          name="IFSC_code"
                          value={employeeForm.IFSC_code}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>

                      <Col lg={4} md={6} sm={12}>
                        <Form.Label>Bank Name *</Form.Label>
                        <Form.Control
                          name="bank_name"
                          value={employeeForm.bank_name}
                          onChange={handleEmployeeInputChange}
                          required
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <div className="d-flex justify-content-between mt-3">
                  {/* Back Button on the left */}
                  <Button
                    variant="secondary"
                    onClick={() => setActiveTab("employeelist")} // or navigate(-1) if using react-router
                  >
                    Back
                  </Button>

                  {/* Update / Add Button on the right */}
                  {/* Update / Add Button on the right */}
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: "#6c5ce7", // your custom purple
                      color: "#fff", // text color
                      border: "none", // remove border
                      padding: "0.5rem 1rem", // optional padding
                      borderRadius: "5px", // optional rounded corners
                    }}
                  >
                    {editingEmployee ? "Update Employee" : "Add Employee"}
                  </Button>
                </div>
              </Form>
            </Container>
          )}

          {/* Generate Payslip Tab */}
          {activeTab === "payslips" && (
            <div className="payslip-section">
              <PayslipGeneration />
            </div>
          )}

          {/* Payment Summary Tab - Enhanced with View/Edit/Delete Options */}
          {activeTab === "payment" && (
            <div className="payment-section container-fluid py-3 px-4">
              <h2 className="mb-4 text-center">Payment Summary</h2>

              {/* Filters */}
              <div className="row g-3 align-items-end mb-4">
                <div className="col-md-3">
                  <label className="form-label">Month</label>
                  <select
                    name="month"
                    className="form-select"
                    value={reportFilters.month}
                    onChange={handleReportFilterChange}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Year</label>
                  <select
                    name="year"
                    className="form-select"
                    value={reportFilters.year}
                    onChange={handleReportFilterChange}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <button
                    onClick={fetchPayslips}
                    disabled={loading}
                    className="btn btn-primary w-100"
                  >
                    {loading ? "Loading..." : "View Payslips"}
                  </button>
                </div>
              </div>

              {/* Payslip Table */}
              {payslips.length > 0 ? (
                <div className="payslip-list">
                  <h4 className="mb-3 text-center" style={{ color: "#0d5aa7" }}>
                    Payslips For{" "}
                    {months.find((m) => m.value === reportFilters.month)?.label}{" "}
                    {reportFilters.year}
                  </h4>

                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle text-center">
                      <thead className="table-info">
                        <tr>
                          <th> S.No</th>
                          <th>Emp ID</th>
                          <th>Emp Name</th>
                          <th>Salary Amount (₹)</th>
                          <th>Bank Account No</th>
                          <th>IFSC</th>
                          <th>Options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payslips.map((payslip, index) => (
                          <tr key={payslip.id}>
                            <td>{index + 1}</td> {/* ✅ S.No */}
                            <td>{payslip.emp_id}</td>
                            <td>{payslip.name}</td>
                            <td>
                              ₹{Number(payslip.net_salary || 0).toFixed(2)}
                            </td>
                            <td>{payslip.bank_account_number || "-"}</td>
                            <td>{payslip.IFSC_code || "-"}</td>
                            <td>
                              <div
                                className="d-flex justify-content-center gap-2"
                                style={{}}
                              >
                                <button
                                  onClick={() => handleViewPayslip(payslip)}
                                  className="action-btn view-btn"
                                >
                                  <FaEye className="me-1" /> View
                                </button>

                                <button
                                  onClick={() => handleEditPayslip(payslip)}
                                  className="action-btn edit-btn"
                                >
                                  <FaEdit className="me-1" /> Edit
                                </button>

                                <button
                                  onClick={() => deletePayslip(payslip.id)}
                                  className="action-btn delete-btn"
                                >
                                  <FaTrash className="me-1" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : !loading ? (
                <div className="alert alert-info text-center">
                  No payslips found for the selected period.
                </div>
              ) : null}
            </div>
          )}
          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="reports-section">
              <h2 className="text-center" style={{ color: "#333" }}>
                Reports
              </h2>

              <div className="reports-controls">
                <div className="filter-section"></div>
              </div>

              {/* BLKPAY Export Section - Hidden Table but Filter Controls Visible */}
              <div
                className="blkpay-export-section"
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <div
                  className="section-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ color: "#333", margin: 0 }}>
                    BLKPAY Excel Export
                  </h3>
                  <div
                    className="filter-group"
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div className="form-group">
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontWeight: "500",
                        }}
                      >
                        Month
                      </label>
                      <select
                        name="month"
                        value={blkpayFilters.month}
                        onChange={handleBlkpayFilterChange}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                        }}
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontWeight: "500",
                        }}
                      >
                        Year
                      </label>
                      <select
                        name="year"
                        value={blkpayFilters.year}
                        onChange={handleBlkpayFilterChange}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                        }}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={downloadEmployeeDetailsExcel}
                      className="btn-download"
                      disabled={loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#193e4d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {loading ? "Generating..." : "Download BLKPAY Excel"}
                    </button>
                  </div>
                </div>
                <p style={{ color: "#666", marginBottom: "10px" }}>
                  <i className="fas fa-info-circle"></i> Download employee
                  payment data in BLKPAY format for the selected month and year.
                </p>
                <p style={{ color: "#666", fontSize: "0.9em" }}>
                  Note: Only payslips generated for{" "}
                  {months.find((m) => m.value === blkpayFilters.month)?.label}{" "}
                  {blkpayFilters.year} will be included.
                </p>
              </div>

              {reports && (
                <div className="report-results">
                  {reports.details && (
                    <div>
                      <h3>
                        Monthly Report -{" "}
                        {
                          months.find(
                            (m) => m.value === parseInt(reportFilters.month),
                          )?.label
                        }{" "}
                        {reportFilters.year}
                      </h3>

                      <div className="report-summary">
                        <p>Total Employees: {reports.summary.totalEmployees}</p>
                        <p>
                          Employees with PF:{" "}
                          {reports.summary.employeesWithPF || 0}
                        </p>
                        <p>
                          Employees without PF:{" "}
                          {reports.summary.employeesWithoutPF || 0}
                        </p>
                        <p>
                          Total Gross Salary: ₹
                          {reports.summary.totalGrossSalary.toFixed(2)}
                        </p>
                        <p>
                          Total PF Deduction: ₹
                          {reports.summary.totalPF.toFixed(2)}
                        </p>
                        <p>
                          Total Net Salary: ₹
                          {reports.summary.totalNetSalary.toFixed(2)}
                        </p>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Emp ID</th>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>PF Applicable</th>
                            <th>PF Amount</th>
                            <th>Gross Salary</th>
                            <th>Professional Tax</th>
                            <th>Net Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.details.map((detail, index) => (
                            <tr key={index}>
                              <td>{detail.emp_id}</td>
                              <td>{detail.name}</td>
                              <td>{detail.designation}</td>
                              <td>
                                <span
                                  className={`pf-badge ${detail.pf_applicable ? "pf-yes" : "pf-no"}`}
                                >
                                  {detail.pf_applicable ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>
                                ₹
                                {parseFloat(detail.pf_deduction || 0).toFixed(
                                  2,
                                )}
                              </td>
                              <td>
                                ₹{parseFloat(detail.gross_salary).toFixed(2)}
                              </td>
                              <td>
                                ₹
                                {parseFloat(
                                  detail.professional_tax_deduction,
                                ).toFixed(2)}
                              </td>
                              <td>
                                ₹{parseFloat(detail.net_salary).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reports.employeeSummary && (
                    <div>
                      <h3>Yearly Summary - {reportFilters.year}</h3>
                      <p>Total Payout: ₹{reports.totalPayout.toFixed(2)}</p>

                      {reports.employeeSummary.map((emp) => (
                        <div
                          key={emp.emp_id}
                          className="employee-yearly-summary"
                        >
                          <h4>
                            {emp.name} ({emp.emp_id})
                          </h4>
                          <p>
                            PF Applicable: {emp.pf_applicable ? "Yes" : "No"}
                          </p>
                          <p>Total Salary: ₹{emp.totalSalary.toFixed(2)}</p>
                          <p>Total PF: ₹{emp.totalPF.toFixed(2)}</p>
                          <table>
                            <thead>
                              <tr>
                                <th>Month</th>
                                <th>PF Amount</th>
                                <th>Net Salary</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emp.months.map((month, idx) => (
                                <tr key={idx}>
                                  <td>{month.month}</td>
                                  <td>
                                    ₹
                                    {parseFloat(month.pf_amount || 0).toFixed(
                                      2,
                                    )}
                                  </td>
                                  <td>
                                    ₹{parseFloat(month.salary).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}

                  {reports.history && (
                    <div>
                      <h3>Employee History - {reports.employee.name}</h3>
                      <p>Designation: {reports.employee.designation}</p>
                      <p>
                        PF Applicable:{" "}
                        {reports.employee.pf_applicable ? "Yes" : "No"}
                      </p>
                      <p>Total Earnings: ₹{reports.totalEarnings.toFixed(2)}</p>
                      <p>
                        Total PF Contribution: ₹{reports.totalPF.toFixed(2)}
                      </p>

                      <table>
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>Year</th>
                            <th>Paid Days</th>
                            <th>PF Amount</th>
                            <th>Gross Salary</th>
                            <th>Deductions</th>
                            <th>Net Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.history.map((entry, index) => (
                            <tr key={index}>
                              <td>{entry.month_name}</td>
                              <td>{entry.salary_year}</td>
                              <td>{entry.paid_days}</td>
                              <td>
                                ₹
                                {parseFloat(entry.pf_deduction || 0).toFixed(2)}
                              </td>
                              <td>
                                ₹{parseFloat(entry.gross_salary).toFixed(2)}
                              </td>
                              <td>
                                ₹{parseFloat(entry.total_deductions).toFixed(2)}
                              </td>
                              <td>
                                ₹{parseFloat(entry.net_salary).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Employee List */}
          {activeTab === "employeelist" && (
            <div className="container-fluid py-4 bg-light">
              {/* TITLE */}
              <h2 className="text-center mb-4 fw-bold text-dark">
                Employee List
              </h2>

              {/* CARD BOX */}
              <div className="card shadow-sm border-light">
                <div className="card-body p-3">
                  {loading ? (
                    <p className="text-center">Loading...</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle text-center">
                        {/* HEADER */}
                        <thead className="table-info">
                          <tr>
                            <th scope="col">S.No</th>
                            <th scope="col">Emp ID</th>
                            <th scope="col">Name</th>
                            <th scope="col">Designation</th>
                            <th scope="col">Date of Joining</th>
                            <th scope="col">PAN Number</th>
                            <th scope="col">Gross Salary (₹)</th>
                            <th scope="col">PF</th>
                            <th scope="col">Bank A/c</th>
                            <th scope="col">Bank Name</th>
                            <th scope="col">IFSC</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>

                        {/* BODY */}
                        <tbody>
                          {employees.map((emp, index) => {
                            const grossSalary =
                              Number(emp.basic_salary || 0) +
                              Number(emp.house_rent_allowence || 0) +
                              Number(emp.transport_allowance || 0) +
                              Number(emp.internet_allowance || 0) +
                              Number(emp.medical_allowance || 0);

                            return (
                              <tr
                                key={emp.emp_id || index}
                                className={index % 2 === 0 ? "table-light" : ""}
                              >
                                <th scope="row">{index + 1}</th>
                                <td>{emp.emp_id || "-"}</td>
                                <td>{emp.name || "-"}</td>
                                <td>{emp.designation || "-"}</td>
                                <td>{emp.date_of_joining || "-"}</td>
                                <td>{emp.PAN}</td>
                                <td className="fw-semibold text-primary">
                                  ₹{grossSalary.toFixed(2)}
                                </td>

                                {/* PF Badge */}
                                <td>
                                  <span
                                    className={`badge ${
                                      emp.pf_applicable
                                        ? "bg-success"
                                        : "bg-danger"
                                    }`}
                                  >
                                    {emp.pf_applicable ? "Yes" : "No"}
                                  </span>
                                </td>

                                <td>{emp.bank_account_number || "-"}</td>
                                <td>{emp.bank_name || "-"}</td>
                                <td>{emp.IFSC_code || "-"}</td>

                                {/* ACTION BUTTONS */}
                                <td>
                                  <div className="d-flex justify-content-center gap-1 flex-wrap">
                                    {/* VIEW */}
                                    <button
                                      className="btn btn-sm  d-flex align-items-center gap-1"
                                      style={{
                                        backgroundColor: "#2d7dce",
                                        color: "#fff",
                                        borderRadius: "8px",
                                      }}
                                      onClick={() => {
                                        setSelectedEmployee(emp);
                                        setActiveTab("readEmployee");
                                      }}
                                      title="View"
                                    >
                                      <FaEye /> View
                                    </button>

                                    {/* EDIT */}
                                    <button
                                      className="btn btn-sm  d-flex align-items-center gap-1"
                                      style={{
                                        backgroundColor: "#8dc02f",
                                        color: "#ffff",
                                        borderRadius: "8px",
                                      }}
                                      onClick={() => editEmployee(emp)}
                                      title="Edit"
                                    >
                                      <FaEdit /> Edit
                                    </button>

                                    {/* DELETE */}
                                    <button
                                      className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                      style={{
                                        borderRadius: "8px",
                                      }}
                                      onClick={() => deleteEmployee(emp.emp_id)}
                                      title="Delete"
                                    >
                                      <FaTrash /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "readEmployee" && selectedEmployee && (
            <ReadEmployeePage
              employee={selectedEmployee}
              goBack={() => setActiveTab("employeelist")} // Back button
              onEdit={(emp) => editEmployee(emp)} // Optional edit
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Main App with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/view-pdf" element={<ViewPDF />} />
      </Routes>
    </Router>
  );
}

export default App;
