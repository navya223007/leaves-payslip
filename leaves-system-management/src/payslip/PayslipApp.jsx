// Integrated Payslip Application — embedded inside HRMS Leave Management System
// No separate login, no separate sidebar. Uses top-navbar for payslip tabs.

import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
import api from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaChartBar,
} from "react-icons/fa";
import { Container, Row, Col, Form, Card, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import PayslipGeneration from "./PayslipGeneration";
import ReadEmployeePage from "./ReadEmpolyePage";
import "./payslip.css";

// const API_BASE_URL = "http://localhost:7016/api";
const API_BASE_URL = "/api";
const TABS = [
  { key: "employees", label: "Employee Management", icon: FaUsers },
  { key: "payslips", label: "Generate Payslip", icon: FaFileInvoiceDollar },
  { key: "payment", label: "Payment Summary", icon: FaMoneyCheckAlt },
  { key: "reports", label: "Reports", icon: FaChartBar },
  { key: "employeelist", label: "Employee List", icon: FaUsers },
];

function PayslipApp() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [editingEmployee, setEditingEmployee] = useState(null);

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

  const [reportFilters, setReportFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    emp_id: "",
  });

  const [blkpayFilters, setBlkpayFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d)) return "";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const convertToDBFormat = (ds) => {
    if (!ds) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(ds)) {
      const [d, m, y] = ds.split("/");
      return `${y}-${m}-${d}`;
    }
    return ds;
  };

  const validateDateFormat = (ds) => {
    if (!ds) return true;
    const r = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!r.test(ds)) return false;
    const [, d, m, y] = ds.match(r);
    const dt = new Date(`${y}-${m}-${d}`);
    return (
      dt instanceof Date &&
      !isNaN(dt) &&
      dt.getDate() === +d &&
      dt.getMonth() + 1 === +m &&
      dt.getFullYear() === +y
    );
  };

  const calculatePF = (basic, applicable) =>
    applicable ? Math.min(parseFloat(basic) * 0.12, 1800) : 0;
  // const fetchEmployees = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const res = await api.get(`${API_BASE_URL}/employees`);
  //     setEmployees(res.data.map(e => ({
  //       ...e,
  //       date_of_joining: e.date_of_joining
  //         ? (() => { const d = new Date(e.date_of_joining); return isNaN(d) ? e.date_of_joining : `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; })()
  //         : ""
  //     })));
  //   } catch { setMessage({ type:"error", text:"Error fetching employees" }); }
  //   setLoading(false);
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE_URL}/employees`);
      // Ensure we always have an array - handle null/undefined/object
      let employeeData = [];
      if (res.data) {
        employeeData = Array.isArray(res.data) ? res.data : [];
      }
      setEmployees(
        employeeData.map((e) => ({
          ...e,
          date_of_joining: e.date_of_joining
            ? (() => {
                const d = new Date(e.date_of_joining);
                return isNaN(d)
                  ? e.date_of_joining
                  : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
              })()
            : "",
        })),
      );
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
      setMessage({ type: "error", text: "Error fetching employees" });
    }
    setLoading(false);
  }, []);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `${API_BASE_URL}/payslips/${reportFilters.year}/${reportFilters.month}`,
      );
      setPayslips(res.data);
    } catch {
      setMessage({ type: "error", text: "Error fetching payslips" });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportFilters.year, reportFilters.month]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const validateEmployeeForm = () => {
    const errs = {};
    const panRe = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const accRe = /^[0-9]{9,18}$/;
    const ifscRe = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!employeeForm.PAN) errs.PAN = "PAN is required";
    else if (!panRe.test(employeeForm.PAN.toUpperCase()))
      errs.PAN = "Invalid PAN";
    else if (
      employees.some(
        (e) =>
          String(e.PAN).toUpperCase() ===
            String(employeeForm.PAN).toUpperCase() &&
          e.emp_id !== editingEmployee?.emp_id,
      )
    )
      errs.PAN = "PAN already exists";
    if (!employeeForm.bank_account_number)
      errs.bank_account_number = "Account required";
    else if (!accRe.test(employeeForm.bank_account_number))
      errs.bank_account_number = "Invalid account";
    else if (
      employees.some(
        (e) =>
          String(e.bank_account_number).trim() ===
            String(employeeForm.bank_account_number).trim() &&
          e.emp_id !== editingEmployee?.emp_id,
      )
    )
      errs.bank_account_number = "Account already exists";
    if (!employeeForm.IFSC_code) errs.IFSC_code = "IFSC required";
    else if (!ifscRe.test(employeeForm.IFSC_code.toUpperCase()))
      errs.IFSC_code = "Invalid IFSC";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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

  const handleEmployeeInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "date_of_joining") {
      const digits = value.replace(/\D/g, "");
      let fmt = digits;
      if (digits.length > 2) fmt = digits.slice(0, 2) + "/" + digits.slice(2);
      if (digits.length > 4)
        fmt =
          digits.slice(0, 2) +
          "/" +
          digits.slice(2, 4) +
          "/" +
          digits.slice(4, 8);
      setEmployeeForm({ ...employeeForm, [name]: fmt });
    } else {
      setEmployeeForm({
        ...employeeForm,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmployeeForm()) {
      showMessage("error", "Please fix form errors");
      return;
    }
    if (!validateDateFormat(employeeForm.date_of_joining)) {
      showMessage("error", "Please enter valid date DD/MM/YYYY");
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...employeeForm,
        date_of_joining: convertToDBFormat(employeeForm.date_of_joining),
      };
      if (editingEmployee) {
        await api.put(
          `${API_BASE_URL}/employees/${editingEmployee.emp_id}`,
          data,
        );
        showMessage("success", "Employee updated successfully");
      } else {
        await api.post(`${API_BASE_URL}/employees`, data);
        showMessage("success", "Employee created successfully");
      }
      fetchEmployees();
      resetEmployeeForm();
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.error || "Error saving employee",
      );
    }
    setLoading(false);
  };

  const editEmployee = (emp) => {
    setEmployeeForm(emp);
    setEditingEmployee(emp);
    setActiveTab("employees");
  };

  const deleteEmployee = async (emp_id) => {
    if (!window.confirm("Delete this employee?")) return;
    setLoading(true);
    try {
      await api.delete(`${API_BASE_URL}/employees/${emp_id}`);
      showMessage("success", "Employee deleted");
      fetchEmployees();
    } catch {
      showMessage("error", "Error deleting employee");
    }
    setLoading(false);
  };

  const deletePayslip = async (id) => {
    if (!window.confirm("Delete this payslip?")) return;
    setLoading(true);
    try {
      await api.delete(`${API_BASE_URL}/payslips/${id}`);
      showMessage("success", "Payslip deleted");
      fetchPayslips();
    } catch {
      showMessage("error", "Error deleting payslip");
    }
    setLoading(false);
  };

  const downloadEmployeeDetailsExcel = async () => {
    if (!blkpayFilters.month || !blkpayFilters.year) {
      showMessage("error", "Please select month and year");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        `${API_BASE_URL}/employees/download-excel`,
        { month: blkpayFilters.month, year: blkpayFilters.year },
        { responseType: "blob", timeout: 30000 },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      let fn = `BLKPAY_${blkpayFilters.year}${String(blkpayFilters.month).padStart(2, "0")}.xlsx`;
      const cd = res.headers["content-disposition"];
      if (cd) {
        const m = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (m) fn = m[1].replace(/['"]/g, "");
      }
      link.setAttribute("download", fn);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage("success", "BLKPAY Excel downloaded");
    } catch {
      showMessage("error", "Error downloading Excel");
    }
    setLoading(false);
  };

  const handleViewPayslip = (payslip) => {
    const viewData = {
      id: payslip.emp_id,
      name: payslip.name || "",
      designation: payslip.designation || "",
      month:
        months.find((m) => m.value === parseInt(payslip.salary_month))?.label ||
        "Unknown",
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
      returnTab: "payslips",
    };

    console.log("🔍🔍🔍 PayslipApp - View Data:", viewData);
    console.log("🔍🔍🔍 PayslipApp - Navigating to: /admin/payslips/view-pdf");

    // Use replace: true to force a fresh render
    navigate(`/admin/payslips/view-pdf/${payslip.id}`);
  };
  const handleEditPayslip = (payslip) => {
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
    navigate("/admin/payslips", { state: { editData } });
    setActiveTab("payslips");
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `${API_BASE_URL}/reports/monthly/${reportFilters.year}/${reportFilters.month}`,
      );
      // Ensure details is always an array
      const data = res.data;
      if (data && data.details) {
        data.details = Array.isArray(data.details) ? data.details : [];
      }
      setReports(data);
    } catch {
      setMessage({ type: "error", text: "Error fetching monthly report" });
    }
    setLoading(false);
  };

  const fetchYearlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `${API_BASE_URL}/reports/yearly/${reportFilters.year}`,
      );
      setReports(res.data);
    } catch {
      showMessage("error", "Error fetching yearly report");
    }
    setLoading(false);
  };

  const fetchEmployeeHistory = async () => {
    if (!reportFilters.emp_id) {
      showMessage("error", "Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(
        `${API_BASE_URL}/reports/employee/${reportFilters.emp_id}`,
      );
      setReports(res.data);
    } catch {
      showMessage("error", "Error fetching employee history");
    }
    setLoading(false);
  };

  // ── TOP NAV BAR (replaces payslip sidebar) ──────────────────────────────────
  const TopNav = () => (
    <nav
      className="navbar navbar-expand-md mb-3 px-3"
      style={{ background: "#0f263f", borderRadius: "6px" }}
    >
      <span
        className="navbar-brand text-white fw-bold me-4"
        style={{ fontSize: "1rem" }}
      >
        Payslip Management
      </span>
      <button
        className="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#payslipNav"
        style={{ filter: "invert(1)" }}
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="payslipNav">
        <ul className="navbar-nav gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <li className="nav-item" key={tab.key}>
                <button
                  className={`nav-link btn btn-sm px-3 py-1 d-flex align-items-center gap-2 ${activeTab === tab.key ? "active text-white fw-bold" : "text-white-50"}`}
                  style={{
                    background:
                      activeTab === tab.key
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                    border: "none",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={13} /> {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );

  return (
    <div>
      <TopNav />

      {message?.text && (
        <div
          className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"} py-2 mb-3`}
        >
          {message.text}
        </div>
      )}

      {/* ── EMPLOYEE MANAGEMENT TAB ── */}
      {activeTab === "employees" && (
        <Container fluid className="py-3">
          <Form onSubmit={handleEmployeeSubmit}>
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
                    {errors.PAN && (
                      <small className="text-danger">{errors.PAN}</small>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4 shadow">
              <Card.Header className="text-center fw-bold bg-success text-white">
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
                        employeeForm.pf_applicable && employeeForm.basic_salary
                          ? `₹ ${calculatePF(employeeForm.basic_salary, true).toFixed(2)}`
                          : "₹ 0"
                      }
                      readOnly
                      className="bg-light fw-bold"
                    />
                  </Col>
                  {[
                    "house_rent_allowence",
                    "transport_allowance",
                    "internet_allowance",
                    "medical_allowance",
                    "professional_tax",
                  ].map((field) => (
                    <Col lg={4} md={6} sm={12} key={field}>
                      <Form.Label>
                        {field
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name={field}
                        value={employeeForm[field]}
                        onChange={handleEmployeeInputChange}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

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
                    {errors.bank_account_number && (
                      <small className="text-danger">
                        {errors.bank_account_number}
                      </small>
                    )}
                  </Col>
                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>IFSC *</Form.Label>
                    <Form.Control
                      name="IFSC_code"
                      value={employeeForm.IFSC_code}
                      onChange={handleEmployeeInputChange}
                      required
                    />
                    {errors.IFSC_code && (
                      <small className="text-danger">{errors.IFSC_code}</small>
                    )}
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
              <Button
                variant="secondary"
                onClick={() => setActiveTab("employeelist")}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#6c5ce7",
                  color: "#fff",
                  border: "none",
                }}
              >
                {editingEmployee ? "Update Employee" : "Add Employee"}
              </Button>
            </div>
          </Form>
        </Container>
      )}

      {/* ── GENERATE PAYSLIP TAB ── */}
      {activeTab === "payslips" && (
        <div className="payslip-section">
          <PayslipGeneration />
        </div>
      )}

      {/* ── PAYMENT SUMMARY TAB ── */}
      {activeTab === "payment" && (
        <div className="container-fluid py-3 px-4">
          <h2 className="mb-4 text-center">Payment Summary</h2>
          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-3">
              <label className="form-label">Month</label>
              <select
                name="month"
                className="form-select"
                value={reportFilters.month}
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    month: parseInt(e.target.value),
                  })
                }
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
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
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    year: parseInt(e.target.value),
                  })
                }
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
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
          {payslips.length > 0 ? (
            <div className="table-responsive">
              <h4 className="mb-3 text-center" style={{ color: "#0d5aa7" }}>
                Payslips For{" "}
                {months.find((m) => m.value === reportFilters.month)?.label}{" "}
                {reportFilters.year}
              </h4>
              <table className="table table-bordered table-hover align-middle text-center">
                <thead className="table-info">
                  <tr>
                    <th>S.No</th>
                    <th>Emp ID</th>
                    <th>Emp Name</th>
                    <th>Salary (₹)</th>
                    <th>Bank Account</th>
                    <th>IFSC</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td>{p.emp_id}</td>
                      <td>{p.name}</td>
                      <td>₹{Number(p.net_salary || 0).toFixed(2)}</td>
                      <td>{p.bank_account_number || "-"}</td>
                      <td>{p.IFSC_code || "-"}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            onClick={() => handleViewPayslip(p)}
                            className="action-btn view-btn"
                          >
                            <FaEye className="me-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditPayslip(p)}
                            className="action-btn edit-btn"
                          >
                            <FaEdit className="me-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deletePayslip(p.id)}
                            className="action-btn delete-btn"
                          >
                            <FaTrash className="me-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading ? (
            <div className="alert alert-info text-center">
              No payslips found for the selected period.
            </div>
          ) : null}
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === "reports" && (
        <div className="reports-section p-3">
          <h2 className="text-center mb-4">Reports</h2>
          <div className="p-4 bg-light rounded mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <h3 className="mb-0">BLKPAY Excel Export</h3>
              <div className="d-flex gap-3 align-items-end flex-wrap">
                <div>
                  <label className="form-label mb-1">Month</label>
                  <select
                    className="form-select"
                    value={blkpayFilters.month}
                    onChange={(e) =>
                      setBlkpayFilters({
                        ...blkpayFilters,
                        month: parseInt(e.target.value),
                      })
                    }
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label mb-1">Year</label>
                  <select
                    className="form-select"
                    value={blkpayFilters.year}
                    onChange={(e) =>
                      setBlkpayFilters({
                        ...blkpayFilters,
                        year: parseInt(e.target.value),
                      })
                    }
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={downloadEmployeeDetailsExcel}
                  className="btn btn-dark"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Download BLKPAY Excel"}
                </button>
              </div>
            </div>
            <p className="text-muted mb-1">
              Download employee payment data in BLKPAY format for the selected
              month and year.
            </p>
            <p className="text-muted small">
              Note: Only payslips generated for{" "}
              {months.find((m) => m.value === blkpayFilters.month)?.label}{" "}
              {blkpayFilters.year} will be included.
            </p>
          </div>
          <div className="d-flex gap-3 flex-wrap mb-3">
            <div>
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={reportFilters.month}
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    month: parseInt(e.target.value),
                  })
                }
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Year</label>
              <select
                className="form-select"
                value={reportFilters.year}
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    year: parseInt(e.target.value),
                  })
                }
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Employee</label>
              <select
                className="form-select"
                value={reportFilters.emp_id}
                onChange={(e) =>
                  setReportFilters({ ...reportFilters, emp_id: e.target.value })
                }
              >
                <option value="">All Employees</option>
                {Array.isArray(employees) &&
                  employees.map((e) => (
                    <option key={e.emp_id} value={e.emp_id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="d-flex gap-2 align-self-end">
              <button className="btn btn-primary" onClick={fetchMonthlyReport}>
                Monthly Report
              </button>
              <button className="btn btn-secondary" onClick={fetchYearlyReport}>
                Yearly Report
              </button>
              <button
                className="btn btn-info text-white"
                onClick={fetchEmployeeHistory}
              >
                Employee History
              </button>
            </div>
          </div>
          {reports && reports.details && (
            <div>
              <h4>
                Monthly Report —{" "}
                {
                  months.find((m) => m.value === parseInt(reportFilters.month))
                    ?.label
                }{" "}
                {reportFilters.year}
              </h4>
              <p>
                Total Employees: {reports.summary?.totalEmployees} | Total Net:
                ₹{reports.summary?.totalNetSalary?.toFixed(2)}
              </p>
              <div className="table-responsive">
                <table className="table table-bordered table-sm text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>PF</th>
                      <th>Gross</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ADD THE ARRAY CHECK HERE */}
                    {Array.isArray(reports.details) &&
                      reports.details.map((d, i) => (
                        <tr key={i}>
                          <td>{d.emp_id}</td>
                          <td>{d.name}</td>
                          <td>{d.designation}</td>
                          <td>{d.pf_applicable ? "Yes" : "No"}</td>
                          <td>₹{parseFloat(d.gross_salary).toFixed(2)}</td>
                          <td>₹{parseFloat(d.net_salary).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EMPLOYEE LIST TAB ── */}
      {activeTab === "employeelist" && (
        <div className="container-fluid py-4 bg-light">
          <h2 className="text-center mb-4 fw-bold">Employee List</h2>
          <div className="card shadow-sm">
            <div className="card-body p-3">
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle text-center">
                    <thead className="table-info">
                      <tr>
                        <th>S.No</th>
                        <th>Emp ID</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Date of Joining</th>
                        <th>PAN</th>
                        <th>Gross (₹)</th>
                        <th>PF</th>
                        <th>Bank A/c</th>
                        <th>Bank Name</th>
                        <th>IFSC</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(employees) &&
                        employees.map((emp, i) => {
                          const gross =
                            Number(emp.basic_salary || 0) +
                            Number(emp.house_rent_allowence || 0) +
                            Number(emp.transport_allowance || 0) +
                            Number(emp.internet_allowance || 0) +
                            Number(emp.medical_allowance || 0);
                          return (
                            <tr
                              key={emp.emp_id || i}
                              className={i % 2 === 0 ? "table-light" : ""}
                            >
                              <th scope="row">{i + 1}</th>
                              <td>{emp.emp_id || "-"}</td>
                              <td>{emp.name || "-"}</td>
                              <td>{emp.designation || "-"}</td>
                              <td>{emp.date_of_joining || "-"}</td>
                              <td>{emp.PAN}</td>
                              <td className="fw-semibold text-primary">
                                ₹{gross.toFixed(2)}
                              </td>
                              <td>
                                <span
                                  className={`badge ${emp.pf_applicable ? "bg-success" : "bg-danger"}`}
                                >
                                  {emp.pf_applicable ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>{emp.bank_account_number || "-"}</td>
                              <td>{emp.bank_name || "-"}</td>
                              <td>{emp.IFSC_code || "-"}</td>
                              <td>
                                <div className="d-flex justify-content-center gap-1 flex-wrap">
                                  <button
                                    className="btn btn-sm"
                                    style={{
                                      backgroundColor: "#2d7dce",
                                      color: "#fff",
                                      borderRadius: "8px",
                                    }}
                                    onClick={() => {
                                      setSelectedEmployee(emp);
                                      setActiveTab("readEmployee");
                                    }}
                                  >
                                    <FaEye /> View
                                  </button>
                                  <button
                                    className="btn btn-sm"
                                    style={{
                                      backgroundColor: "#8dc02f",
                                      color: "#fff",
                                      borderRadius: "8px",
                                    }}
                                    onClick={() => editEmployee(emp)}
                                  >
                                    <FaEdit /> Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ borderRadius: "8px" }}
                                    onClick={() => deleteEmployee(emp.emp_id)}
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

      {/* ── READ EMPLOYEE TAB ── */}
      {activeTab === "readEmployee" && selectedEmployee && (
        <ReadEmployeePage
          employee={selectedEmployee}
          goBack={() => setActiveTab("employeelist")}
          onEdit={(emp) => editEmployee(emp)}
        />
      )}
    </div>
  );
}

export default PayslipApp;
