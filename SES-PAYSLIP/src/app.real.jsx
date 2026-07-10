// Updated App.js - Hide BLKPAY table from UI

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import {
  ThemeProvider,
  createTheme,
  Snackbar,
  CssBaseline,
  Alert,
} from "@mui/material";
import PayslipGeneration from "./PayslipGeneration";
import ViewPDF from "./ViewPDF";
import LoginPage from "./LoginPage";

const API_BASE_URL = "/api";

// Main App component with routing
function AppContent() {
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
  const fetchData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, general: true }));
      await Promise.all([
        fetchEmployees(),
        fetchPayslips(),
        fetchData(),
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
  const [loading, setLoading] = useState(false);

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

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);
  // const handleLogin = async (credentials) => {
  //   try {
  //     if (!credentials || !credentials.username || !credentials.password) {
  //       throw new Error("Invalid credentials format");
  //     }
  //     const response = await fetch("http://192.168.29.239:7014/api/login", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         username: credentials.username,
  //         password: credentials.password,
  //       }),
  //     });
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || "Login failed");
  //     }
  //     const data = await response.json();
  //     localStorage.setItem("token", data.accessToken);
  //     setIsLoggedIn(true);
  //     await fetchData();
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     setSnackbar({
  //       open: true,
  //       message: error.message,
  //       severity: "error",
  //     });
  //     throw error;
  //   }
  // };
  // Helper functions for date formatting
  const formatDateForDisplay = (date) => {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return String(date);
    }
  };

  // const convertToDisplayFormat = (dateString) => {
  //   if (!dateString) return '';

  //   // If already in DD/MM/YYYY format
  //   if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
  //     return dateString;
  //   }

  //   // Convert from YYYY-MM-DD to DD/MM/YYYY
  //   if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
  //     const [year, month, day] = dateString.split('-');
  //     return `${day}/${month}/${year}`;
  //   }

  //   return dateString;
  // };
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
    setTimeout(() => setMessage({ type: "", text: "" }), 7014);
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
    setLoading(true);

    try {
      // Validate date format before submission
      if (!validateDateFormat(employeeForm.date_of_joining)) {
        showMessage("error", "Please enter a valid date in DD/MM/YYYY format");
        setLoading(false);
        return;
      }

      // Convert date to database format (YYYY-MM-DD) for API
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

  // Edit employee
  const editEmployee = (employee) => {
    // Convert date to display format if needed
    const employeeWithFormattedDate = {
      ...employee,
      date_of_joining: formatDateForDisplay(employee.date_of_joining),
    };

    setEmployeeForm(employeeWithFormattedDate);
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
  if (!isLoggedIn) {
    return (
      <ThemeProvider theme={roboticsTheme}>
        <CssBaseline />
        <LoginPage onLogin={handleLogin} />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }
  return (
    <div className="app-container">
     {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button
          className="close-btn d-md-none"
          onClick={() => setSidebarOpen(false)}
        >
          &#x2715;
        </button>
        <ul className="sidebar-nav">
          <li
            className={activeTab === "employees" ? "active" : ""}
            onClick={() => setActiveTab("employees")}
          >
            Employee Management
          </li>
          <li
            className={activeTab === "payslips" ? "active" : ""}
            onClick={() => setActiveTab("payslips")}
          >
            Generate Payslip
          </li>
          <li
            className={activeTab === "payment" ? "active" : ""}
            onClick={() => setActiveTab("payment")}
          >
            Payment Summary
          </li>
          <li
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </li>
          <li
            className={activeTab === "employeelist" ? "active" : ""}
            onClick={() => setActiveTab("employeelist")}
          >
            Employee List
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="app-header d-flex justify-content-between align-items-center px-3 py-2 bg-primary text-white shadow-sm">
          <h1 className="h5 mb-0">Payslip Management System</h1>
          <button
            className="d-md-none btn btn-light"
            onClick={() => setSidebarOpen(true)}
          >
            &#9776;
          </button>
        </header>

        {/* Message */}
        {message?.text && (
          <div className={`message mt-3 ${message.type}`}>{message.text}</div>
        )}

      <div className="tab-content">
        {/* Employee Management Tab */}
        {activeTab === "employees" && (
          <div className="employee-section">
            <h2>{editingEmployee ? "Edit Employee" : "Add New Employee"}</h2>

            <form onSubmit={handleEmployeeSubmit} className="employee-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    name="emp_id"
                    value={employeeForm.emp_id}
                    onChange={handleEmployeeInputChange}
                    disabled={editingEmployee}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={employeeForm.name}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    value={employeeForm.designation}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date of Joining * (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    name="date_of_joining"
                    value={employeeForm.date_of_joining}
                    onChange={handleEmployeeInputChange}
                    placeholder="DD/MM/YYYY"
                    pattern="\d{2}/\d{2}/\d{4}"
                    required
                  />
                  <small className="form-text text-muted">
                    Format: DD/MM/YYYY (e.g., 16/11/2024)
                  </small>
                </div>
                <div className="form-group">
                  <label>PAN *</label>
                  <input
                    type="text"
                    name="PAN"
                    value={employeeForm.PAN}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Basic Salary *</label>
                  <input
                    type="number"
                    name="basic_salary"
                    value={employeeForm.basic_salary}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>
                {/* PF Applicability Field */}
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="pf_applicable"
                      checked={employeeForm.pf_applicable}
                      onChange={handleEmployeeInputChange}
                    />
                    PF Applicable (12% of Basic Salary)
                  </label>
                  {employeeForm.pf_applicable && employeeForm.basic_salary && (
                    <small className="pf-calculation">
                      PF Amount: ₹
                      {calculatePF(employeeForm.basic_salary, true).toFixed(2)}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>House Rent Allowance</label>
                  <input
                    type="number"
                    name="house_rent_allowence"
                    value={employeeForm.house_rent_allowence}
                    onChange={handleEmployeeInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Transport Allowance</label>
                  <input
                    type="number"
                    name="transport_allowance"
                    value={employeeForm.transport_allowance}
                    onChange={handleEmployeeInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Telephone And Internet Allowance</label>
                  <input
                    type="number"
                    name="internet_allowance"
                    value={employeeForm.internet_allowance}
                    onChange={handleEmployeeInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Medical Allowance</label>
                  <input
                    type="number"
                    name="medical_allowance"
                    value={employeeForm.medical_allowance}
                    onChange={handleEmployeeInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Professional Tax</label>
                  <input
                    type="number"
                    name="professional_tax"
                    value={employeeForm.professional_tax}
                    onChange={handleEmployeeInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Bank Account Number *</label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={employeeForm.bank_account_number}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    name="IFSC_code"
                    value={employeeForm.IFSC_code}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={employeeForm.bank_name}
                    onChange={handleEmployeeInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </button>
                {editingEmployee && (
                  <button type="button" onClick={resetEmployeeForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h2>Employee List</h2>
            <div className="employee-list">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Date of Joining</th>
                      <th>Basic Salary</th>
                      <th>PF Applicable</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.emp_id}>
                        <td>{emp.emp_id}</td>
                        <td>{emp.name}</td>
                        <td>{emp.designation}</td>
                        <td>{emp.date_of_joining}</td>
                        <td>₹{parseFloat(emp.basic_salary).toFixed(2)}</td>
                        <td>
                          <span
                            className={`pf-badge ${emp.pf_applicable ? "pf-yes" : "pf-no"}`}
                          >
                            {emp.pf_applicable ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => editEmployee(emp)}>
                            Edit
                          </button>
                          <button onClick={() => deleteEmployee(emp.emp_id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Generate Payslip Tab */}
        {activeTab === "payslips" && (
          <div className="payslip-section">
            <PayslipGeneration />
          </div>
        )}

        {/* Payment Summary Tab - Enhanced with View/Edit/Delete Options */}
        {activeTab === "payment" && (
          <div className="payment-section">
            <h2>Payment Summary</h2>

            <div className="filter-section">
              <div className="form-group">
                <label>Month</label>
                <select
                  name="month"
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

              <div className="form-group">
                <label>Year</label>
                <select
                  name="year"
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

              <button
                onClick={fetchPayslips}
                disabled={loading}
                className="btn-primary"
              >
                View Payslips
              </button>
            </div>
            {payslips.length > 0 && (
              <div className="payslip-list">
                <h3>
                  Payslips for{" "}
                  {
                    months.find(
                      (m) => m.value === parseInt(reportFilters.month),
                    )?.label
                  }{" "}
                  {reportFilters.year}
                </h3>
                <div className="table-responsive">
                  <table className="payslip-table">
                    <thead>
                      <tr>
                        <th>Emp ID</th>
                        <th>Emp Name</th>
                        <th>Salary Amount (₹)</th>
                        <th>Bank Account No</th>
                        <th>IFSC</th>
                        <th>Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map((payslip) => (
                        <tr key={payslip.id}>
                          <td>{payslip.emp_id}</td>
                          <td>{payslip.name}</td>
                          <td>₹{parseFloat(payslip.net_salary).toFixed(2)}</td>
                          <td>{payslip.bank_account_number}</td>
                          <td>{payslip.IFSC_code}</td>
                          <td className="options-cell">
                            <button
                              onClick={() => handleViewPayslip(payslip)}
                              className="btn-view"
                              title="View Payslip"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditPayslip(payslip)}
                              className="btn-edit"
                              title="Edit Payslip"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deletePayslip(payslip.id)}
                              className="btn-delete"
                              title="Delete Payslip"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {payslips.length === 0 && !loading && (
              <div className="no-data-message">
                {/* <p>No payslips found for the selected period. Click "View Payslips" to fetch data.</p> */}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="reports-section">
            <h2 style={{ color: "#f5ecec" }}>Reports</h2>

            <div className="reports-controls">
              <div className="filter-section">
                {/* <div className="form-group">
                  <label>Report Type</label>
                  <select
                    id="reportType"
                    onChange={(e) => setReports(null)}
                  >
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Summary</option>
                    <option value="employee">Employee History</option>
                  </select>
                </div> */}

                {/* <div className="form-group">
                  <label>Month</label>
                  <select
                    name="month"
                    value={reportFilters.month}
                    onChange={handleReportFilterChange}
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* <div className="form-group">
                  <label>Year</label>
                  <select
                    name="year"
                    value={reportFilters.year}
                    onChange={handleReportFilterChange}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* <div className="form-group">
                  <label>Employee</label>
                  <select
                    name="emp_id"
                    value={reportFilters.emp_id}
                    onChange={handleReportFilterChange}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.emp_id} value={emp.emp_id}>
                        {emp.emp_id} - {emp.name}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* <div className="report-buttons">
                  <button onClick={fetchMonthlyReport} disabled={loading}>
                    Monthly Report
                  </button>
                  <button onClick={fetchYearlyReport} disabled={loading}>
                    Yearly Summary
                  </button>
                  <button onClick={fetchEmployeeHistory} disabled={loading}>
                    Employee History
                  </button>
                </div> */}
              </div>
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
                <i className="fas fa-info-circle"></i> Download employee payment
                data in BLKPAY format for the selected month and year.
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
                              ₹{parseFloat(detail.pf_deduction || 0).toFixed(2)}
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
                            <td>₹{parseFloat(detail.net_salary).toFixed(2)}</td>
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
                      <div key={emp.emp_id} className="employee-yearly-summary">
                        <h4>
                          {emp.name} ({emp.emp_id})
                        </h4>
                        <p>PF Applicable: {emp.pf_applicable ? "Yes" : "No"}</p>
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
                                  ₹{parseFloat(month.pf_amount || 0).toFixed(2)}
                                </td>
                                <td>₹{parseFloat(month.salary).toFixed(2)}</td>
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
                    <p>Total PF Contribution: ₹{reports.totalPF.toFixed(2)}</p>

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
                              ₹{parseFloat(entry.pf_deduction || 0).toFixed(2)}
                            </td>
                            <td>
                              ₹{parseFloat(entry.gross_salary).toFixed(2)}
                            </td>
                            <td>
                              ₹{parseFloat(entry.total_deductions).toFixed(2)}
                            </td>
                            <td>₹{parseFloat(entry.net_salary).toFixed(2)}</td>
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
