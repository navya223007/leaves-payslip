import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";

const API_BASE_URL = "http://localhost:7008/api";

function ViewPDF() {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [earnings, setEarnings] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [pfApplicable, setPfApplicable] = useState(true);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [attendanceInfo, setAttendanceInfo] = useState({
    totalDays: 0,
    paidDays: 0,
    holidays: 0,
    leaves: 0,
    deductedLeaves: 0,
  });

  const data = location.state || null;
  const { returnTab, ...payslipData } = location.state || {};

  const handleBack = () => {
    if (returnTab) {
      navigate("/admin/payslips", { state: { activeTab: returnTab } });
    } else {
      navigate("/admin/payslips");
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for date of joining
    if (name === "dateOfJoining") {
      // Allow only numbers and hyphens
      const cleanedValue = value.replace(/[^\d-]/g, "");

      // Auto-format as DD-MM-YYYY
      let formattedValue = cleanedValue;
      if (cleanedValue.length === 2 && !cleanedValue.includes("-")) {
        formattedValue = cleanedValue + "-";
      } else if (
        cleanedValue.length === 5 &&
        cleanedValue.split("-").length === 2
      ) {
        const parts = cleanedValue.split("-");
        if (parts[1].length === 2 && !parts[1].includes("-")) {
          formattedValue = cleanedValue + "-";
        }
      }

      setEditedData({
        ...editedData,
        [name]: formattedValue,
      });
    } else {
      setEditedData({
        ...editedData,
        [name]: value,
      });
    }

    // Update PF applicability when PF values change
    if (name === "pf" || name === "employerPF") {
      const newPfValue =
        name === "pf" ? Number(value) : Number(editedData?.pf || data.pf);
      const newEmployerPfValue =
        name === "employerPF"
          ? Number(value)
          : Number(editedData?.employerPF || data.employerPF);
      setPfApplicable(newPfValue > 0 || newEmployerPfValue > 0);
    }
  };
  const [proratedEarnings, setProratedEarnings] = useState({
    basic_salary: 0,
    house_rent_allowence: 0,
    transport_allowance: 0,
    internet_allowance: 0,
    medical_allowance: 0,
    employer_pf_contribution: 0,
    performance_bonus: 0,
    arrears: 0,
    total_earnings: 0,
  });

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    try {
      if (typeof date === "string" && /^\d{2}-\d{2}-\d{4}$/.test(date))
        return date;
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
      }
      const dateObj = date instanceof Date ? date : new Date(date);
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return String(date);
    } catch (error) {
      return String(date);
    }
  };

  const downloadPDF = async () => {
    try {
      const input = pdfRef.current;
      if (!input) {
        console.error("PDF reference is null");
        return;
      }

      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${data.name}_Payslip_${data.month}_${data.year}.pdf`);
      console.log("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setMessage({ type: "error", text: "Error downloading PDF" });
    }
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString || dateString === "" || dateString === "Not Available")
      return null;
    const parts = dateString.split("-");
    if (parts.length === 3 && parts[2].length === 4)
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateString;
  };

  const isValidDateFormat = (dateString) => {
    if (!dateString || dateString === "" || dateString === "Not Available")
      return true;
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(dateString)) return false;
    const [_, day, month, year] = dateString.match(regex);
    const date = new Date(`${year}-${month}-${day}`);
    return (
      date instanceof Date &&
      !isNaN(date) &&
      date.getDate() === parseInt(day) &&
      date.getMonth() + 1 === parseInt(month) &&
      date.getFullYear() === parseInt(year)
    );
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "0.00";
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const formatIndianRupee = (amount) => {
    if (amount === null || amount === undefined || amount === "")
      return "₹0.00";
    const num = parseFloat(amount);
    if (isNaN(num)) return "₹0.00";
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const numberToWords = (num) => {
    if (num === 0 || !num) return "Zero Rupees Only";
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
    if (paise > 0) words += " and " + numToWords(paise) + " Paise";
    return words + " Only";
  };

  const calculateProratedEarnings = (earningsData, paidDays, totalDays) => {
    if (!earningsData || !paidDays || !totalDays) return null;
    const perDayRatio = paidDays / totalDays;
    const proratedBasic =
      (Number(earningsData.basic_salary) || 0) * perDayRatio;
    const proratedHRA =
      (Number(earningsData.house_rent_allowence) || 0) * perDayRatio;
    const proratedTransport =
      (Number(earningsData.transport_allowance) || 0) * perDayRatio;
    const proratedInternet =
      (Number(earningsData.internet_allowance) || 0) * perDayRatio;
    const proratedMedical =
      (Number(earningsData.medical_allowance) || 0) * perDayRatio;
    const proratedEmployerPF =
      (Number(earningsData.employer_pf_contribution) || 0) * perDayRatio;
    const performanceBonus = Number(earningsData.performance_bonus) || 0;
    const arrears = Number(earningsData.arrears) || 0;
    const totalProratedEarnings =
      proratedBasic +
      proratedHRA +
      proratedTransport +
      proratedInternet +
      proratedMedical +
      (pfApplicable ? proratedEmployerPF : 0) +
      performanceBonus +
      arrears;
    return {
      basic_salary: proratedBasic,
      house_rent_allowence: proratedHRA,
      transport_allowance: proratedTransport,
      internet_allowance: proratedInternet,
      medical_allowance: proratedMedical,
      employer_pf_contribution: proratedEmployerPF,
      performance_bonus: performanceBonus,
      arrears: arrears,
      total_earnings: totalProratedEarnings,
    };
  };

  const fetchEmployeeDetails = async (empId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/${empId}`);
      setEmployeeDetails(response.data);
      const formattedDateOfJoining = formatDateForDisplay(
        response.data.date_of_joining,
      );
      setEditedData((prev) => ({
        ...prev,
        dateOfJoining: formattedDateOfJoining,
      }));
      return formattedDateOfJoining;
    } catch (error) {
      console.error("Error fetching employee details:", error);
      return null;
    }
  };

  const fetchEarningsData = async (empId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/employees/${empId}/earnings`,
      );
      setEarnings(response.data);
      setFetchError(false);
      if (response.data) {
        const employerPf = Number(response.data.employer_pf_contribution) || 0;
        if (employerPf === 0) setPfApplicable(false);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      setFetchError(true);
      setEarnings({
        basic_salary: Number(data.basicSalary) || 0,
        house_rent_allowence: Number(data.hra) || 0,
        transport_allowance: Number(data.transportAllowance) || 0,
        internet_allowance: Number(data.internetAllowance) || 0,
        medical_allowance: Number(data.medicalAllowance) || 0,
        professional_tax: Number(data.professionalTax) || 0,
        employer_pf_contribution: Number(data.employerPF) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPfApplicability = (employeeData) => {
    if (
      employeeData.pf_applicable === 0 ||
      employeeData.pf_applicable === false
    ) {
      setPfApplicable(false);
      return;
    }
    const pfValue = Number(employeeData.pf) || 0;
    const employerPfValue = Number(employeeData.employerPF) || 0;
    setPfApplicable(pfValue > 0 || employerPfValue > 0);
  };

  useEffect(() => {
    const initializeData = async () => {
      if (data) {
        setEditedData(data);
        checkPfApplicability(data);
        fetchEarningsData(data.id);
        await fetchEmployeeDetails(data.id);

        // Populate attendance info from payslip data
        const monthIndex = data.month
          ? new Date(Date.parse(data.month + " 1, " + (data.year || new Date().getFullYear()))).getMonth()
          : new Date().getMonth();
        const year = data.year || new Date().getFullYear();
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();

        setAttendanceInfo({
          totalDays: totalDays,
          paidDays: Number(data.paidDays) || totalDays,
          holidays: Number(data.holidays) || 0,
          leaves: Number(data.leaves) || 0,
          deductedLeaves: 0,
        });
      } else {
        console.warn("ViewPDF - No data received in location.state");
      }
    };
    initializeData();
  }, [data]);

  useEffect(() => {
    if (
      earnings &&
      attendanceInfo.totalDays > 0 &&
      attendanceInfo.paidDays > 0
    ) {
      const prorated = calculateProratedEarnings(
        earnings,
        attendanceInfo.paidDays,
        attendanceInfo.totalDays,
      );
      if (prorated) setProratedEarnings(prorated);
    }
  }, [earnings, attendanceInfo, pfApplicable]);

  if (!data) {
    return (
      <div className="container text-center mt-5">
        <h4>No Payslip Data Found</h4>
        <p className="text-muted">
          Please ensure you selected a payslip from the payment summary.
        </p>
        <button className="btn btn-dark mt-3" onClick={() => navigate("/admin/payslips")}>
          Go Back to Payment Summary
        </button>
      </div>
    );
  }

  // Calculate totals for earnings and deductions
  const totalEarnings =
    (proratedEarnings.basic_salary || 0) +
    (proratedEarnings.house_rent_allowence || 0) +
    (proratedEarnings.transport_allowance || 0) +
    (proratedEarnings.internet_allowance || 0) +
    (proratedEarnings.medical_allowance || 0) +
    (pfApplicable ? proratedEarnings.employer_pf_contribution || 0 : 0) +
    (proratedEarnings.performance_bonus || 0) +
    (proratedEarnings.arrears || 0);

  const totalDeductions =
    (Number(isEditing ? editedData?.professionalTax : data.professionalTax) || 0) +
    (Number(isEditing ? editedData?.pf : data.pf) || 0) +
    (Number(isEditing ? editedData?.advance : data.advance) || 0);

  const finalNet = totalEarnings - totalDeductions;

  // Your JSX here (leave everything else as-is, same as your previous code)
  return (
    <div className="container my-5">
      <div>
        <style>
          {`
@media print {

}.payslip-container {
  page-break-inside: avoid;
}

.salary-section,
.net-salary-container,
.footer-note {
  page-break-inside: avoid;
}
`}
        </style>
      </div>

      <div
        className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 no-print"
        style={{ maxWidth: "900px", margin: "0 auto" }}
      >
        {/* Back Button */}
        <button
          className="btn btn-secondary px-4"
          style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
          onClick={handleBack}
        >
          Back
        </button>

        {/* Download Button */}
        <button
          className="btn btn-dark px-4"
          style={{ backgroundColor: "#0f3052", borderColor: "#0f3052" }}
          onClick={downloadPDF}
        >
          Download PDF
        </button>
      </div>
      {message.text && (
        <div
          className={`alert alert-${message.type === "success" ? "success" : "danger"} mb-3 no-print`}
        >
          {message.text}
        </div>
      )}

      {fetchError && (
        <div className="alert alert-warning no-print">
          Using default values for earnings. Some data may not be accurate.
        </div>
      )}

      {/*  */}
      <div className="container my-4 px-3 px-md-5">
        <div
          ref={pdfRef}
          className="pdf-wrapper"
          style={{
            background: "#ffffff",
            padding: "20px", // space from PDF edge
          }}
        >
          <div
            className="payslip-container"
            style={{
              maxWidth: "900px",
              width: "100%",
              margin: "0 auto",
              padding: "20px",
              border: "10px solid #333",
              boxSizing: "border-box",
            }}
          >
            {/* COMPANY HEADER */}
            <div
              className="company-header"
              style={{
                textAlign: "center",
                marginBottom: "20px",
                borderBottom: "2px solid #333",
                paddingBottom: "15px",
              }}
            >
              <div
                className="company-name"
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#2c3e50",
                  margin: "0 0 5px 0",
                  letterSpacing: "1px",
                }}
              >
                Soft Electronic Solutions Private Limited
              </div>
              <div
                className="company-address"
                style={{
                  fontSize: "12px",
                  color: "#666",
                  margin: "2px 0",
                  lineHeight: "1.4",
                }}
              >
                13-6/33, Road No.2, Gayathri Hills, Badangpet
              </div>
              <div
                className="company-address"
                style={{
                  fontSize: "12px",
                  color: "#666",
                  margin: "2px 0",
                  lineHeight: "1.4",
                }}
              >
                Hyderabad - 700858
              </div>
              <div
                className="company-contact"
                style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}
              >
                PH: +91 8415796558 | Email: softelectronics.pvtltd@gmail.com
              </div>
            </div>

            {/* ✅ TITLE INSIDE PDF */}
            <div
              className="title-section text-center my-3"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="payslip-title fw-bold"
                style={{
                  fontSize: "28px",
                  color: "#34495e", // Bootstrap primary color
                  letterSpacing: "2px",
                }}
              >
                PAYSLIP
              </div>
              <div
                className="month-year text-muted"
                style={{
                  fontSize: "16px",
                  marginTop: "4px",
                  color: "#6c757d", // Bootstrap text-muted color
                }}
              >
                {editedData?.month || data.month}{" "}
                {editedData?.year || data.year}
              </div>
            </div>

            {/* ✅ EMPLOYEE DETAILS */}
            <div className="employee-details my-3 px-2 px-md-3">
              <div className="row g-3 text-center text-md-start">
                {/* Employee ID */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="mb-1">
                    <span
                      className="detail-label"
                      style={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                      Employee ID:
                    </span>
                    <span
                      className="detail-value"
                      style={{ color: "#34495e", marginLeft: "5px" }}
                    >
                      {data.id}
                    </span>
                  </div>
                </div>

                {/* Joining Date */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="mb-1">
                    <span
                      className="detail-label"
                      style={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                      Joining Date:
                    </span>
                    <span
                      className="detail-value"
                      style={{ color: "#34495e", marginLeft: "5px" }}
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            name="dateOfJoining"
                            value={editedData?.dateOfJoining ?? ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm d-inline-block"
                            style={{ minWidth: "120px" }}
                            placeholder="DD-MM-YYYY"
                          />
                          <small className="text-muted ms-1">
                            (DD-MM-YYYY)
                          </small>
                        </>
                      ) : (
                        editedData?.dateOfJoining ||
                        (employeeDetails
                          ? formatDateForDisplay(
                              employeeDetails.date_of_joining,
                            )
                          : "Not Available")
                      )}
                    </span>
                  </div>
                </div>

                {/* Employee Name */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="mb-1">
                    <span
                      className="detail-label"
                      style={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                      Employee Name:
                    </span>
                    <span
                      className="detail-value"
                      style={{ color: "#34495e", marginLeft: "5px" }}
                    >
                      {data.name}
                    </span>
                  </div>
                </div>

                {/* Designation */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="mb-1">
                    <span
                      className="detail-label"
                      style={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                      Designation:
                    </span>
                    <span
                      className="detail-value"
                      style={{ color: "#34495e", marginLeft: "5px" }}
                    >
                      {data.designation}
                    </span>
                  </div>
                </div>

                {/* PAN */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="mb-1">
                    <span
                      className="detail-label"
                      style={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                      PAN:
                    </span>
                    <span
                      className="detail-value"
                      style={{ color: "#34495e", marginLeft: "5px" }}
                    >
                      {data.pan}
                    </span>
                  </div>
                </div>

                {/* Paid Days */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="mb-1">
                    <span
                      className="detail-label"
                      style={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                      Paid Days:
                    </span>
                    <span
                      className="detail-value"
                      style={{ color: "#34495e", marginLeft: "5px" }}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          name="paidDays"
                          value={editedData?.paidDays ?? data.paidDays}
                          onChange={handleInputChange}
                          className="form-control form-control-sm d-inline-block"
                          style={{ width: "80px" }}
                        />
                      ) : (
                        data.paidDays || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ TABLE */}
            {/* Earnings & Deductions Table */}
            <div className="salary-section table-responsive px-2 px-md-3 my-3">
              <table className="table table-bordered align-middle">
                <thead className="table-secondary text-center">
                  <tr>
                    <th style={{ width: "40%" }}>Earnings</th>
                    <th style={{ width: "10%" }}>Amount (₹)</th>
                    <th style={{ width: "40%" }}>Deductions</th>
                    <th style={{ width: "10%" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-start">
                      Basic Salary
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                        <span className="text-muted"> (prorated)</span>
                      )}
                    </td>

                    <td className="text-end">
                      {formatAmount(proratedEarnings.basic_salary)}
                    </td>

                    <td className="text-start">Professional Tax</td>

                    <td className="text-end">
                      {isEditing ? (
                        <input
                          type="number"
                          name="professionalTax"
                          value={
                            editedData?.professionalTax !== undefined
                              ? editedData.professionalTax
                              : data.professionalTax || 0
                          }
                          onChange={handleInputChange}
                          className="form-control form-control-sm"
                        />
                      ) : (
                        formatAmount(data.professionalTax || 0)
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-start">
                      House Rent Allowance
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                        <span className="text-muted"> (prorated)</span>
                      )}
                    </td>

                    <td className="text-end">
                      {formatAmount(proratedEarnings.house_rent_allowence)}
                    </td>

                    <td></td>
                    <td></td>
                  </tr>

                  <tr>
                    <td className="text-start">
                      Transport Allowance
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                        <span className="text-muted"> (prorated)</span>
                      )}
                    </td>

                    <td className="text-end">
                      {formatAmount(proratedEarnings.transport_allowance)}
                    </td>

                    <td className="text-start">Advance Salary</td>

                    <td className="text-end">
                      {isEditing ? (
                        <input
                          type="number"
                          name="advance"
                          value={editedData?.advance || data.advance}
                          onChange={handleInputChange}
                          className="form-control form-control-sm"
                        />
                      ) : (
                        formatAmount(data.advance)
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-start">
                      Telephone and Internet Allowance
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                        <span className="text-muted"> (prorated)</span>
                      )}
                    </td>

                    <td className="text-end">
                      {formatAmount(proratedEarnings.internet_allowance)}
                    </td>

                    <td></td>
                    <td></td>
                  </tr>

                  <tr>
                    <td className="text-start">
                      Medical Allowance
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                        <span className="text-muted"> (prorated)</span>
                      )}
                    </td>

                    <td className="text-end">
                      {formatAmount(proratedEarnings.medical_allowance)}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* PF */}
                  {pfApplicable && (
                    <tr className="table-light">
                      <td className="text-start">
                        Employer's PF Contribution @12%
                        {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                          <span className="text-muted"> (prorated)</span>
                        )}
                      </td>

                      <td className="text-end">
                        {formatAmount(
                          proratedEarnings.employer_pf_contribution,
                        )}
                      </td>

                      <td></td>
                      <td></td>
                    </tr>
                  )}

                  {/* Bonus */}
                  <tr className="table-info">
                    <td className="text-start fw-bold">Performance Bonus</td>

                    <td className="text-end fw-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          name="performanceBonus"
                          value={editedData?.performanceBonus || 0}
                          onChange={handleInputChange}
                          className="form-control form-control-sm"
                        />
                      ) : (
                        formatAmount(data.performanceBonus || 0)
                      )}
                    </td>

                    <td></td>
                    <td></td>
                  </tr>

                  {/* Arrears */}
                  <tr>
                    <td className="text-start">Arrears</td>

                    <td className="text-end">
                      {isEditing ? (
                        <input
                          type="number"
                          name="arrears"
                          value={editedData?.arrears || 0}
                          onChange={handleInputChange}
                          className="form-control form-control-sm"
                        />
                      ) : (
                        formatAmount(data.arrears || 0)
                      )}
                    </td>

                    <td></td>
                    <td></td>
                  </tr>

                  {/* Totals */}
                  <tr className="table-secondary fw-bold">
                    <td className="text-start">Total Earnings (Prorated)</td>

                    <td className="text-end">{formatAmount(totalEarnings)}</td>

                    <td className="text-start">Total Deductions</td>

                    <td className="text-end">
                      {formatAmount(totalDeductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ✅ NET SALARY */}
            <div className="d-flex justify-content-center align-items-center my-3 px-2">
              <div
                style={{
                  border: "2px solid #2c3e50",
                  padding: "15px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#f4f8f9",
                  textAlign: "center",
                  width: "100%",
                  maxWidth: "900px", // 🔥 wider like payslip
                  margin: "0 auto",
                }}
              >
                {/* Net Salary */}
                <div
                  style={{
                    fontSize: "13px",
                    color: "#555",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                  }}
                >
                  Net Salary
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "bold",
                    color: "#2c3e50",
                    marginBottom: "10px",
                  }}
                >
                  ₹ {formatAmount(finalNet)}
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: "#ccc",
                    margin: "10px 0",
                  }}
                />

                {/* Amount in Words Label */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                  }}
                >
                  Amount in Words
                </div>

                {/* Amount in Words VALUE (Single Line Responsive) */}
                <div
                  style={{
                    fontSize: "clamp(12px, 2vw, 16px)", // 🔥 responsive text
                    color: "#333",
                    fontWeight: "500",
                    whiteSpace: "nowrap", // ✅ one line
                    overflow: "hidden", // ✅ prevent overflow
                    textOverflow: "ellipsis", // ✅ ...
                    width: "100%",
                  }}
                >
                  {numberToWords(finalNet)}
                </div>
              </div>
            </div>

            {/* ✅ FOOTER */}
            <div className="footer-note text-center mt-3">
              <div className="footer-text">
                This is a computer-generated payslip and does not require a
                signature.
              </div>

              {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                <div
                  className="footer-text"
                  style={{ marginTop: "5px", color: "#7f8c8d" }}
                >
                  * Salary has been prorated based on {attendanceInfo.paidDays}{" "}
                  paid days out of {attendanceInfo.totalDays} total days
                  {attendanceInfo.deductedLeaves > 0 &&
                    ` (${attendanceInfo.deductedLeaves} leaves deducted after 2 free leaves)`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <h4>PDF Layout JSX remains unchanged</h4>
    </div>
  );
}

export default ViewPDF;
