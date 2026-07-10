
import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";

const API_BASE_URL = "/api";

function ViewPDF() {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfRef = useRef(null);
  const [activeTab, setActiveTab] = useState("employees");
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

  // State for payment summary view
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [paymentSummaryLoading, setPaymentSummaryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [filteredPayslips, setFilteredPayslips] = useState([]);

  // Prorated earnings based on paid days
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

  const data = location.state;

  // Function to fetch all payslips for payment summary
  const fetchAllPayslips = async () => {
    try {
      setPaymentSummaryLoading(true);
      const year = data?.year || new Date().getFullYear();
      const month = data?.monthNumber || data?.month || new Date().getMonth() + 1;
      const response = await axios.get(`${API_BASE_URL}/payslips/${year}/${month}`);
      console.log("Fetched payslips:", response.data);
      setPayslips(response.data);
      setFilteredPayslips(response.data);
      setShowPaymentSummary(true);
    } catch (err) {
      console.error("Error fetching payslips:", err);
      setMessage({ type: "error", text: "Failed to load payslips" });
    } finally {
      setPaymentSummaryLoading(false);
    }
  };

  // Filter payslips when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const filtered = payslips.filter(
        (payslip) =>
          payslip.salary_month === parseInt(selectedMonth) &&
          payslip.salary_year === parseInt(selectedYear)
      );
      setFilteredPayslips(filtered);
    } else {
      setFilteredPayslips(payslips);
    }
  }, [selectedMonth, selectedYear, payslips]);

  // Function to handle view payslip from summary
const handleViewPayslip = (payslip) => {
  const viewData = {
    id: payslip.emp_id,
    name: payslip.name || "",
    designation: payslip.designation || "",
    month: months.find(m => m.value === parseInt(payslip.salary_month))?.label || "Unknown",
    year: payslip.salary_year || new Date().getFullYear(),
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
  
  console.log("🔍 Navigating with data:", viewData);
  navigate("/admin/payslips/view-pdf", { state: viewData });
};

  // Function to handle edit payslip
  const handleEditPayslip = (payslip) => {
    // Navigate to PayslipGeneration with edit data
    navigate("/generate-payslip", {
      state: {
        editData: {
          payslip_id: payslip.id,
          emp_id: payslip.emp_id,
          salary_month: payslip.salary_month,
          salary_year: payslip.salary_year,
          leaves: payslip.leaves,
          advance_salary: payslip.advance_salary,
          performance_bonus: payslip.performance_bonus,
          arrears: payslip.arrears,
          holidays: payslip.holidays,
        },
      },
    });
  };

  const getMonthName = (monthNumber) => {
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
    return monthNames[monthNumber - 1];
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return `₹${parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Function to go back - Navigate to main dashboard with Payment Summary tab
  const handleBackButton = () => {
    navigate("/", { state: { activeTab: "payment" } });
  };

  // Calculate attendance info from data
  useEffect(() => {
    if (data) {
      const totalDays = new Date(
        data.year,
        new Date(`${data.month} 1, ${data.year}`).getMonth() + 1,
        0,
      ).getDate();
      const paidDays = parseInt(data.paidDays) || 0;
      const holidays = parseInt(data.holidays) || 0;
      const leaves = parseInt(data.leaves) || 0;
      const deductedLeaves = leaves > 2 ? leaves - 2 : 0;

      setAttendanceInfo({
        totalDays,
        paidDays,
        holidays,
        leaves,
        deductedLeaves,
      });
    }
  }, [data]);

  // Fetch employee details including date of joining
  const fetchEmployeeDetails = async (empId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/${empId}`);
      console.log("Employee details fetched:", response.data);
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

  useEffect(() => {
    const initializeData = async () => {
      if (data) {
        console.log("ViewPDF - received data:", data);
        setEditedData(data);
        checkPfApplicability(data);
        fetchEarningsData(data.id);
        const formattedDate = await fetchEmployeeDetails(data.id);
        if (formattedDate) {
          setEditedData((prev) => ({
            ...prev,
            dateOfJoining: formattedDate,
          }));
        }
      } else {
        console.warn("ViewPDF - No data received in location.state");
      }
    };

    initializeData();
  }, [data]);

  // Update prorated earnings when earnings data or attendance info changes
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
      if (prorated) {
        setProratedEarnings(prorated);
      }
    }
  }, [earnings, attendanceInfo, pfApplicable]);

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    try {
      if (typeof date === "string" && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
        return date;
      }

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

  const formatDateForAPI = (dateString) => {
    if (!dateString || dateString === "" || dateString === "Not Available")
      return null;

    const parts = dateString.split("-");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

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
    if (paise > 0) {
      words += " and " + numToWords(paise) + " Paise";
    }
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
  const employerPF = pfApplicable
  ? Math.min(
      Number(earningsData.employer_pf_contribution) || 0,
      1800
    )
  : 0;

const proratedEmployerPF = employerPF * perDayRatio;
    const performanceBonus = Number(data?.performanceBonus) || 0;
    const arrears = Number(data?.arrears) || 0;

const totalProratedEarnings =
  proratedBasic +
  proratedHRA +
  proratedTransport +
  proratedInternet +
  proratedMedical +
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

  const fetchEarningsData = async (empId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/employees/${empId}/earnings`,
      );
      console.log("Earnings data fetched:", response.data);
      setEarnings(response.data);
      setFetchError(false);

      if (response.data) {
        const employerPf = Number(response.data.employer_pf_contribution) || 0;
        if (employerPf === 0) {
          setPfApplicable(false);
        }
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      setFetchError(true);
      setEarnings({
        basic_salary: Number(data?.basicSalary) || 0,
        house_rent_allowence: Number(data?.hra) || 0,
        transport_allowance: Number(data?.transportAllowance) || 0,
        internet_allowance: Number(data?.internetAllowance) || 0,
        medical_allowance: Number(data?.medicalAllowance) || 0,
        professional_tax: Number(data?.professionalTax) || 0,
        employer_pf_contribution: Number(data?.employerPF) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "0.00";
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // If showing payment summary, render it
  if (showPaymentSummary) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Payment Summary</h2>
          <button
            className="btn btn-secondary"
            onClick={() => setShowPaymentSummary(false)}
          >
            Back to Payslip
          </button>
        </div>

        {paymentSummaryLoading ? (
          <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading payslips...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="row mb-4">
              <div className="col-md-3">
                <label className="form-label">Filter by Month</label>
                <select
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Filter by Year</label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Payslips Table */}
            {filteredPayslips.length === 0 ? (
              <div className="alert alert-info">
                No payslips found. Click "Generate New Payslip" to create one.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Net Salary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayslips.map((payslip) => (
                      <tr key={payslip.id}>
                        <td>{payslip.emp_id}</td>
                        <td>{payslip.employee_name}</td>
                        <td>{payslip.designation}</td>
                        <td>{getMonthName(payslip.salary_month)}</td>
                        <td>{payslip.salary_year}</td>
                        <td>{formatCurrency(payslip.net_salary)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-info me-2"
                            onClick={() => handleViewPayslip(payslip)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEditPayslip(payslip)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (loading && !earnings && !data) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading payslip data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container text-center mt-5">
        <h4>No Payslip Data Found</h4>
        <p className="text-muted">
          Please ensure you selected a payslip from the payment summary.
        </p>
        <button 
          className="btn btn-dark mt-3" 
          onClick={handleBackButton}
        >
          Go Back to Payment Summary
        </button>
      </div>
    );
  }

  const totalMonthlyEarnings = earnings
    ? (Number(earnings.basic_salary) || 0) +
      (Number(earnings.house_rent_allowence) || 0) +
      (Number(earnings.transport_allowance) || 0) +
      (Number(earnings.internet_allowance) || 0) +
      (Number(earnings.medical_allowance) || 0)
    : 0;

  const totalEarnings = Number(proratedEarnings.total_earnings || 0);

const employeePF = pfApplicable
  ? Math.min(Number(editedData?.pf || data.pf || 0), 1800)
  : 0;

const employerPF = Number(
  proratedEarnings.employer_pf_contribution || 0
);

const totalDeductions =
  employeePF +
  (Number(editedData?.professionalTax || data.professionalTax) || 0) +
  (Number(editedData?.advance || data.advance) || 0);

const finalNet = totalEarnings - totalDeductions;

// Employer Contribution Section
const grossEarnings = totalEarnings;
const totalCTC = grossEarnings + employerPF;

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "dateOfJoining") {
      const cleanedValue = value.replace(/[^\d-]/g, "");

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

  const handleSave = async () => {
    if (
      editedData?.dateOfJoining &&
      editedData.dateOfJoining !== "Not Available" &&
      editedData.dateOfJoining !== "" &&
      !isValidDateFormat(editedData.dateOfJoining)
    ) {
      setMessage({
        type: "error",
        text: "Please enter date of joining in DD-MM-YYYY format (e.g., 15-01-2024)",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Saving edited payslip:", editedData);

      const apiDateOfJoining =
        editedData?.dateOfJoining &&
        editedData.dateOfJoining !== "Not Available" &&
        editedData.dateOfJoining !== ""
          ? formatDateForAPI(editedData.dateOfJoining)
          : null;

      const apiData = {
        ...editedData,
        date_of_joining: apiDateOfJoining,
      };

      const response = await axios.post(`${API_BASE_URL}/payslips/generate`, {
        emp_id: apiData.id,
        date_of_joining: apiData.date_of_joining,
        salary_month:
          new Date(`${apiData.month} 1, ${apiData.year}`).getMonth() + 1,
        salary_year: parseInt(apiData.year),
        advance_salary: parseFloat(apiData.advance) || 0,
        paid_days: parseInt(apiData.paidDays) || 0,
        holidays: parseInt(apiData.holidays) || 0,
        leaves: parseInt(apiData.leaves) || 0,
        performance_bonus: parseFloat(apiData.performanceBonus) || 0,
        arrears: parseFloat(apiData.arrears) || 0,
        pf_amount: pfApplicable ? parseFloat(apiData.pf) || 0 : 0,
        employer_pf_amount: pfApplicable
          ? parseFloat(apiData.employerPF) || 0
          : 0,
      });

      console.log("Save response:", response.data);
      setMessage({ type: "success", text: "Payslip updated successfully" });
      setIsEditing(false);

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error updating payslip:", error);
      setMessage({
        type: "error",
        text:
          "Error updating payslip: " +
          (error.response?.data?.error || error.message),
      });
    }
    setLoading(false);
  };

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
        {/* Back Button - Calls payment summary function */}
        <button
          className="btn btn-secondary px-4"
          style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
          onClick={handleBackButton}
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

      <div className="container my-4 px-3 px-md-5">
        <div
          ref={pdfRef}
          className="pdf-wrapper"
          style={{
            background: "#ffffff",
            padding: "20px",
          }}
        >
          <div
            className="payslip-container"
            style={{
              maxWidth: "900px",
              width: "100%",
              margin: "0 auto",
              padding: "20px",
              border: "3px solid #333",
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
                13-6/33, Ground Floor,block A, Road No.2, Gayathri Hills,
                Badangpet
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
                Hyderabad - 500058
              </div>
              <div
                className="company-contact"
                style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}
              >
                PH: +91 8415796558 | Email: softelectronics.pvtltd@gmail.com
              </div>
            </div>

            {/* TITLE INSIDE PDF */}
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
                  color: "#34495e",
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
                  color: "#6c757d",
                }}
              >
                {editedData?.month || data.month}{" "}
                {editedData?.year || data.year}
              </div>
            </div>

            {/* EMPLOYEE DETAILS */}
            <div className="employee-details my-3 px-2 px-md-3">
              <div className="row g-3 text-center text-md-start">
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
                    {/* </td>
<td className="text-start">
                      Employee Contribution @12%
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                          <span className="text-muted"> (prorated)</span>
                        )}
                    </td>
                    
                    <td className="text-end">
                      {formatAmount(
                          proratedEarnings.employer_pf_contribution,
                        )}
                    </td> */}
                    <td className="text-start">
                      Employee Contribution @12%
                      {attendanceInfo.paidDays < attendanceInfo.totalDays && (
                          <span className="text-muted"> (prorated)</span>
                        )}
                    </td>
                    <td className="text-end">
                      {formatAmount(
                          proratedEarnings.employer_pf_contribution,
                        )}
                    </td> 
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

                  {/* {pfApplicable && (
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
                  )} */}

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

            {/* NET SALARY */}
            <div className="d-flex justify-content-center align-items-center my-3 px-2">
              <div
                style={{
                  border: "2px solid #2c3e50",
                  padding: "15px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#f4f8f9",
                  textAlign: "center",
                  width: "100%",
                  maxWidth: "900px",
                  margin: "0 auto",
                }}
              >
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

                <div
                  style={{
                    height: "1px",
                    background: "#ccc",
                    margin: "10px 0",
                  }}
                />

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

                <div
                  style={{
                    fontSize: "clamp(12px, 2vw, 16px)",
                    color: "#333",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                  }}
                >
                  {numberToWords(finalNet)}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="footer-note text-center mt-3">
              {/* <div className="footer-text">
                This is a computer-generated payslip and does not require a
                signature.
              </div> */}

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
         <div className="salary-section table-responsive px-2 px-md-3 my-3">
  <table className="table table-bordered">
    <thead className="table-secondary">
      <tr>
        <th>Description</th>
        <th className="text-end">Amount</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Gross Earnings</td>
        <td className="text-end">
          ₹{formatAmount(grossEarnings)}
        </td>
      </tr>

      <tr>
        <td>Employer's Provident Fund</td>
        <td className="text-end">
          ₹{formatAmount(employerPF)}
        </td>
      </tr>

      <tr className="table-secondary fw-bold">
        <td>Total CTC</td>
        <td className="text-end">
          ₹{formatAmount(totalCTC)}
        </td>
      </tr>
    </tbody>
  </table>
</div>

{/* Total CTC in Words */}
<div
  style={{
    textAlign: "center",
    marginTop: "10px",
    marginBottom: "15px",
  }}
>
  <div
    style={{
      fontSize: "12px",
      color: "#777",
      textTransform: "uppercase",
      marginBottom: "5px",
    }}
  >
    Total CTC in Words
  </div>

  <div
    style={{
      fontSize: "14px",
      fontWeight: "500",
      color: "#333",
    }}
  >
    {numberToWords(totalCTC)}
  </div>
</div>

{/* FOOTER */}
<div className="footer-note text-center mt-3">
  <div className="footer-text">
    This is a computer-generated payslip and does not require a signature.
  </div>

  {attendanceInfo.paidDays < attendanceInfo.totalDays && (
    <div
      className="footer-text"
      style={{ marginTop: "5px", color: "#7f8c8d" }}
    >
      * Salary has been prorated based on {attendanceInfo.paidDays} paid days
      out of {attendanceInfo.totalDays} total days
      {attendanceInfo.deductedLeaves > 0 &&
        ` (${attendanceInfo.deductedLeaves} leaves deducted after 2 free leaves)`}
    </div>
  )}
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewPDF;