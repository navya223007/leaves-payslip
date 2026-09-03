import React, { useState, useEffect } from "react";
import api from "../api";

import { Container, Row, Col, Form, Card, Button } from "react-bootstrap";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import ReadEmployeePage from "./ReadEmpolyePage";

function EmployeeDetails() {
  // =========================================================
  // EMPLOYEE STATE
  // =========================================================

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("form");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // EMPLOYEE FORM
  // =========================================================

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

  // =========================================================
  // MESSAGE
  // =========================================================

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    });

    setTimeout(() => {
      setMessage({
        type: "",
        text: "",
      });
    }, 8014);
  };

  // =========================================================
  // DATE FUNCTIONS
  // =========================================================

  const formatDateForDisplay = (date) => {
    if (!date) return "";

    // Already DD/MM/YYYY
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

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split("/");

      return `${year}-${month}-${day}`;
    }

    return dateString;
  };

  const validateDateFormat = (dateString) => {
    if (!dateString) return false;

    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    if (!regex.test(dateString)) {
      return false;
    }

    const [, day, month, year] = dateString.match(regex);

    const date = new Date(`${year}-${month}-${day}`);

    return (
      !isNaN(date) &&
      date.getDate() === parseInt(day) &&
      date.getMonth() + 1 === parseInt(month) &&
      date.getFullYear() === parseInt(year)
    );
  };

  // =========================================================
  // FETCH EMPLOYEES API
  // =========================================================

  const fetchEmployees = async () => {
    setLoading(true);

    try {
      const response = await api.get("/employees");

      const employeesWithFormattedDates = response.data.map((emp) => ({
        ...emp,
        date_of_joining: formatDateForDisplay(emp.date_of_joining),
      }));

      setEmployees(employeesWithFormattedDates);
    } catch (error) {
      console.error("Error fetching employees:", error);

      showMessage("error", "Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleEmployeeInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let inputValue = type === "checkbox" ? checked : value;

    // =======================================================
    // DATE OF JOINING
    // =======================================================

    if (name === "date_of_joining") {
      const digits = value.replace(/\D/g, "");

      if (digits.length <= 2) {
        inputValue = digits;
      } else if (digits.length <= 4) {
        inputValue = digits.slice(0, 2) + "/" + digits.slice(2);
      } else {
        inputValue =
          digits.slice(0, 2) +
          "/" +
          digits.slice(2, 4) +
          "/" +
          digits.slice(4, 8);
      }
    }

    // =======================================================
    // PAN
    // =======================================================

    if (name === "PAN") {
      inputValue = value.toUpperCase();
    }

    // =======================================================
    // IFSC
    // =======================================================

    if (name === "IFSC_code") {
      inputValue = value.toUpperCase();
    }

    setEmployeeForm((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    // Clear field error when user changes it
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateEmployeeForm = () => {
    const newErrors = {};

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const accRegex = /^[0-9]{9,18}$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    // =======================================================
    // EMPLOYEE ID
    // =======================================================

    if (!employeeForm.emp_id.trim()) {
      newErrors.emp_id = "Employee ID is required";
    } else if (
      employees.some(
        (emp) =>
          String(emp.emp_id).trim().toLowerCase() ===
            employeeForm.emp_id.trim().toLowerCase() &&
          emp.emp_id !== editingEmployee?.emp_id,
      )
    ) {
      newErrors.emp_id = "Employee ID already exists";
    }

    // =======================================================
    // NAME
    // =======================================================

    if (!employeeForm.name.trim()) {
      newErrors.name = "Name is required";
    } else if (employeeForm.name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters";
    }

    // =======================================================
    // DESIGNATION
    // =======================================================

    if (!employeeForm.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    // =======================================================
    // DATE OF JOINING
    // =======================================================

    if (!employeeForm.date_of_joining) {
      newErrors.date_of_joining = "Date of Joining is required";
    } else if (!validateDateFormat(employeeForm.date_of_joining)) {
      newErrors.date_of_joining = "Enter a valid date in DD/MM/YYYY format";
    }

    // =======================================================
    // PAN
    // =======================================================

    if (!employeeForm.PAN.trim()) {
      newErrors.PAN = "PAN is required";
    } else if (!panRegex.test(employeeForm.PAN.trim().toUpperCase())) {
      newErrors.PAN = "Invalid PAN (Ex: ABCDE1234F)";
    } else if (
      employees.some(
        (emp) =>
          String(emp.PAN || "")
            .trim()
            .toUpperCase() === employeeForm.PAN.trim().toUpperCase() &&
          emp.emp_id !== editingEmployee?.emp_id,
      )
    ) {
      newErrors.PAN = "PAN already exists";
    }

    // =======================================================
    // BASIC SALARY
    // =======================================================

    if (
      employeeForm.basic_salary === "" ||
      employeeForm.basic_salary === null
    ) {
      newErrors.basic_salary = "Basic Salary is required";
    } else if (!Number.isFinite(Number(employeeForm.basic_salary))) {
      newErrors.basic_salary = "Enter a valid Basic Salary";
    } else if (Number(employeeForm.basic_salary) <= 0) {
      newErrors.basic_salary = "Basic Salary must be greater than 0";
    }

    // =======================================================
    // OPTIONAL SALARY FIELDS
    // =======================================================

    const salaryFields = [
      ["house_rent_allowence", "HRA"],
      ["transport_allowance", "Transport"],
      ["internet_allowance", "Internet"],
      ["medical_allowance", "Medical"],
      ["professional_tax", "Professional Tax"],
    ];

    salaryFields.forEach(([field, label]) => {
      if (employeeForm[field] !== "") {
        if (!Number.isFinite(Number(employeeForm[field]))) {
          newErrors[field] = `Enter a valid ${label} amount`;
        } else if (Number(employeeForm[field]) < 0) {
          newErrors[field] = `${label} cannot be negative`;
        }
      }
    });

    // =======================================================
    // BANK ACCOUNT
    // =======================================================

    if (!employeeForm.bank_account_number.trim()) {
      newErrors.bank_account_number = "Account number is required";
    } else if (!accRegex.test(employeeForm.bank_account_number.trim())) {
      newErrors.bank_account_number = "Account number must contain 9-18 digits";
    } else if (
      employees.some(
        (emp) =>
          String(emp.bank_account_number || "").trim() ===
            employeeForm.bank_account_number.trim() &&
          emp.emp_id !== editingEmployee?.emp_id,
      )
    ) {
      newErrors.bank_account_number = "Account number already exists";
    }

    // =======================================================
    // IFSC
    // =======================================================

    if (!employeeForm.IFSC_code.trim()) {
      newErrors.IFSC_code = "IFSC code is required";
    } else if (!ifscRegex.test(employeeForm.IFSC_code.trim().toUpperCase())) {
      newErrors.IFSC_code = "Invalid IFSC (Ex: SBIN0001234)";
    }

    // =======================================================
    // BANK NAME
    // =======================================================

    if (!employeeForm.bank_name.trim()) {
      newErrors.bank_name = "Bank Name is required";
    }

    // =======================================================
    // SET ERRORS
    // =======================================================

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================================
  // SUBMIT - CREATE / UPDATE
  // =========================================================

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmployeeForm()) {
      showMessage("error", "Please fix the highlighted errors");
      return;
    }

    setLoading(true);

    try {
      // Validate date before sending
      if (!validateDateFormat(employeeForm.date_of_joining)) {
        showMessage("error", "Please enter valid date DD/MM/YYYY");

        setLoading(false);
        return;
      }

      // =====================================================
      // PREPARE EMPLOYEE DATA
      // =====================================================

      const employeeData = {
        ...employeeForm,

        date_of_joining: convertToDBFormat(employeeForm.date_of_joining),

        PAN: employeeForm.PAN.trim().toUpperCase(),

        IFSC_code: employeeForm.IFSC_code.trim().toUpperCase(),

        emp_id: employeeForm.emp_id.trim(),

        name: employeeForm.name.trim(),

        designation: employeeForm.designation.trim(),

        bank_account_number: employeeForm.bank_account_number.trim(),

        bank_name: employeeForm.bank_name.trim(),

        pf_applicable: employeeForm.pf_applicable,
      };

      // =====================================================
      // UPDATE EMPLOYEE
      // =====================================================

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.emp_id}`, employeeData);

        showMessage("success", "Employee updated successfully");
      }

      // =====================================================
      // CREATE EMPLOYEE
      // =====================================================
      else {
        await api.post("/employees", employeeData);

        showMessage("success", "Employee created successfully");
      }

      // Refresh employee list
      await fetchEmployees();

      // Reset form
      resetEmployeeForm();

      // Go to employee list after save
      setActiveSection("list");
    } catch (error) {
      console.error("Error saving employee:", error);

      showMessage(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error saving employee",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET
  // =========================================================

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
    setErrors({});
  };

  // =========================================================
  // EDIT
  // =========================================================

  const editEmployee = (employee) => {
    setEmployeeForm({
      ...employee,
      date_of_joining: formatDateForDisplay(employee.date_of_joining),
    });

    setEditingEmployee(employee);
    setSelectedEmployee(null);
    setActiveSection("form");
    setErrors({});
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteEmployee = async (emp_id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    setLoading(true);

    try {
      await api.delete(`/employees/${emp_id}`);

      showMessage("success", "Employee deleted successfully");

      await fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);

      showMessage(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error deleting employee",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PF
  // =========================================================

  const calculatePF = (basicSalary, pfApplicable) => {
    if (pfApplicable) {
      return parseFloat(basicSalary || 0) * 0.12;
    }

    return 0;
  };

  // =========================================================
  // FIELD ERROR COMPONENT
  // =========================================================

  const FieldError = ({ field }) => {
    if (!errors[field]) {
      return null;
    }

    return <div className="text-danger mt-1 small">{errors[field]}</div>;
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="container-fluid py-4">
      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message.text && (
        <div className={`message mt-3 ${message.type}`}>{message.text}</div>
      )}

      {/* =====================================================
          EMPLOYEE FORM
      ====================================================== */}

      {activeSection === "form" && (
        <Container fluid className="py-3">
          <Form onSubmit={handleEmployeeSubmit}>
            {/* =================================================
                EMPLOYEE DETAILS
            ================================================== */}

            <Card className="mb-4 shadow">
              <Card.Header className="text-center fw-bold bg-info text-white">
                Employee Details
              </Card.Header>

              <Card.Body>
                <Row className="g-3">
                  {/* EMPLOYEE ID */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Employee ID *</Form.Label>

                    <Form.Control
                      name="emp_id"
                      value={employeeForm.emp_id}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.emp_id}
                      required
                    />

                    <FieldError field="emp_id" />
                  </Col>

                  {/* NAME */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Name *</Form.Label>

                    <Form.Control
                      name="name"
                      value={employeeForm.name}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.name}
                      required
                    />

                    <FieldError field="name" />
                  </Col>

                  {/* DESIGNATION */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Designation *</Form.Label>

                    <Form.Control
                      name="designation"
                      value={employeeForm.designation}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.designation}
                      required
                    />

                    <FieldError field="designation" />
                  </Col>

                  {/* DATE OF JOINING */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Date of Joining *</Form.Label>

                    <Form.Control
                      name="date_of_joining"
                      value={employeeForm.date_of_joining}
                      onChange={handleEmployeeInputChange}
                      placeholder="DD/MM/YYYY"
                      isInvalid={!!errors.date_of_joining}
                      required
                    />

                    <FieldError field="date_of_joining" />
                  </Col>

                  {/* PAN */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>PAN *</Form.Label>

                    <Form.Control
                      name="PAN"
                      value={employeeForm.PAN}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.PAN}
                      required
                    />

                    <FieldError field="PAN" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* =================================================
                SALARY DETAILS
            ================================================== */}

            <Card className="mb-4 shadow">
              <Card.Header className="text-center fw-bold bg-success text-dark text-white">
                Salary Details
              </Card.Header>

              <Card.Body>
                <Row className="g-3 align-items-end">
                  {/* BASIC SALARY */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Basic Salary *</Form.Label>

                    <Form.Control
                      type="number"
                      name="basic_salary"
                      value={employeeForm.basic_salary}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.basic_salary}
                      required
                    />

                    <FieldError field="basic_salary" />
                  </Col>

                  {/* PF */}

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

                  {/* PF AMOUNT */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>PF Amount</Form.Label>

                    <Form.Control
                      value={
                        employeeForm.pf_applicable && employeeForm.basic_salary
                          ? `₹ ${calculatePF(
                              employeeForm.basic_salary,
                              true,
                            ).toFixed(2)}`
                          : "₹ 0"
                      }
                      readOnly
                      className="bg-light fw-bold"
                    />
                  </Col>

                  {employeeForm.pf_applicable && employeeForm.basic_salary && (
                    <Col xs={12}>
                      <small className="text-success">
                        PF = 12% of Basic Salary
                      </small>
                    </Col>
                  )}

                  {/* HRA */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>HRA</Form.Label>

                    <Form.Control
                      type="number"
                      name="house_rent_allowence"
                      value={employeeForm.house_rent_allowence}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.house_rent_allowence}
                    />

                    <FieldError field="house_rent_allowence" />
                  </Col>

                  {/* TRANSPORT */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Transport</Form.Label>

                    <Form.Control
                      type="number"
                      name="transport_allowance"
                      value={employeeForm.transport_allowance}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.transport_allowance}
                    />

                    <FieldError field="transport_allowance" />
                  </Col>

                  {/* INTERNET */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Internet</Form.Label>

                    <Form.Control
                      type="number"
                      name="internet_allowance"
                      value={employeeForm.internet_allowance}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.internet_allowance}
                    />

                    <FieldError field="internet_allowance" />
                  </Col>

                  {/* MEDICAL */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Medical</Form.Label>

                    <Form.Control
                      type="number"
                      name="medical_allowance"
                      value={employeeForm.medical_allowance}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.medical_allowance}
                    />

                    <FieldError field="medical_allowance" />
                  </Col>

                  {/* PROFESSIONAL TAX */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Professional Tax</Form.Label>

                    <Form.Control
                      type="number"
                      name="professional_tax"
                      value={employeeForm.professional_tax}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.professional_tax}
                    />

                    <FieldError field="professional_tax" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* =================================================
                BANK DETAILS
            ================================================== */}

            <Card className="mb-4 shadow">
              <Card.Header className="text-center fw-bold bg-secondary text-white">
                Bank Details
              </Card.Header>

              <Card.Body>
                <Row className="g-3">
                  {/* ACCOUNT NUMBER */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Account Number *</Form.Label>

                    <Form.Control
                      name="bank_account_number"
                      value={employeeForm.bank_account_number}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.bank_account_number}
                      required
                    />

                    <FieldError field="bank_account_number" />
                  </Col>

                  {/* IFSC */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>IFSC *</Form.Label>

                    <Form.Control
                      name="IFSC_code"
                      value={employeeForm.IFSC_code}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.IFSC_code}
                      required
                    />

                    <FieldError field="IFSC_code" />
                  </Col>

                  {/* BANK NAME */}

                  <Col lg={4} md={6} sm={12}>
                    <Form.Label>Bank Name *</Form.Label>

                    <Form.Control
                      name="bank_name"
                      value={employeeForm.bank_name}
                      onChange={handleEmployeeInputChange}
                      isInvalid={!!errors.bank_name}
                      required
                    />

                    <FieldError field="bank_name" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* =================================================
                BUTTONS
            ================================================== */}

            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="secondary"
                onClick={() => {
                  resetEmployeeForm();
                  setActiveSection("list");
                }}
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
                  padding: "0.5rem 1rem",
                  borderRadius: "5px",
                }}
              >
                {loading
                  ? "Saving..."
                  : editingEmployee
                    ? "Update Employee"
                    : "Add Employee"}
              </Button>
            </div>
          </Form>
        </Container>
      )}

      {/* =====================================================
          EMPLOYEE LIST
      ====================================================== */}

      {activeSection === "list" && (
        <div className="container-fluid py-4 bg-light">
          <h2 className="text-center mb-4 fw-bold text-dark">Employee List</h2>

          <div className="card shadow-sm border-light">
            <div className="card-body p-3">
              <div className="d-flex justify-content-end mb-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    resetEmployeeForm();
                    setActiveSection("form");
                  }}
                >
                  Add Employee
                </Button>
              </div>

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
                        <th>PAN Number</th>
                        <th>Gross Salary (₹)</th>
                        <th>PF</th>
                        <th>Bank A/c</th>
                        <th>Bank Name</th>
                        <th>IFSC</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan="12" className="text-center">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        employees.map((emp, index) => {
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

                              <td>{emp.PAN || "-"}</td>

                              <td className="fw-semibold text-primary">
                                ₹{grossSalary.toFixed(2)}
                              </td>

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

                              <td>
                                <div className="d-flex justify-content-center gap-1 flex-wrap">
                                  {/* VIEW */}

                                  <button
                                    className="btn btn-sm d-flex align-items-center gap-1"
                                    style={{
                                      backgroundColor: "#2d7dce",
                                      color: "#fff",
                                      borderRadius: "8px",
                                    }}
                                    onClick={() => {
                                      setSelectedEmployee(emp);
                                      setActiveSection("view");
                                    }}
                                    title="View"
                                  >
                                    <FaEye />
                                    View
                                  </button>

                                  {/* EDIT */}

                                  <button
                                    className="btn btn-sm d-flex align-items-center gap-1"
                                    style={{
                                      backgroundColor: "#8dc02f",
                                      color: "#ffff",
                                      borderRadius: "8px",
                                    }}
                                    onClick={() => editEmployee(emp)}
                                    title="Edit"
                                  >
                                    <FaEdit />
                                    Edit
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
                                    <FaTrash />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW EMPLOYEE
      ====================================================== */}

      {activeSection === "view" && selectedEmployee && (
        <ReadEmployeePage
          employee={selectedEmployee}
          goBack={() => {
            setSelectedEmployee(null);
            setActiveSection("list");
          }}
          onEdit={(emp) => {
            editEmployee(emp);
          }}
        />
      )}
    </div>
  );
}

export default EmployeeDetails;
