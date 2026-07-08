import React, { useEffect, useState } from "react";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import { useLocation } from "react-router-dom";

// Fix 1: Use a CDN URL with a known working version
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

function PayslipGeneration() {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [holidays, setHolidays] = useState(0);
  const [holidayDates, setHolidayDates] = useState([]);
  const [leaves, setLeaves] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [performanceBonus, setPerformanceBonus] = useState(0);
  const [arrears, setArrears] = useState(0);
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPayslipId, setCurrentPayslipId] = useState(null);

  // Check if we're in edit mode from navigation state
  useEffect(() => {
    const editData = location.state?.editData;
    if (editData) {
      console.log("Loading edit data:", editData);
      setIsEditing(true);
      setSelectedEmp(editData.emp_id);

      // Convert month number to month name
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
      setMonth(monthNames[editData.salary_month - 1]);
      setYear(editData.salary_year.toString());
      setLeaves(editData.leaves || 0);
      setAdvance(editData.advance_salary || 0);
      setPerformanceBonus(editData.performance_bonus || 0);
      setArrears(editData.arrears || 0);
      setCurrentPayslipId(editData.payslip_id);

      // Set holidays count if available
      if (editData.holidays) {
        setHolidays(editData.holidays);
      }

      // Generate the payslip data automatically after employee is loaded
      setTimeout(() => {
        handleGenerateFromEdit(editData);
      }, 500);
    }
  }, [location.state]);
  // Handle generate from edit data
  const handleGenerateFromEdit = (editData) => {
    const emp = employees.find((e) => e.emp_id === editData.emp_id);
    if (!emp) return;

    const basic = Number(emp.basic_salary) || 0;
    const transport = Number(emp.transport_allowance) || 0;
    const medical = Number(emp.medical_allowance) || 0;
    const internet = Number(emp.internet_allowance) || 0;

    const totalSalary = basic + transport + medical + internet;

    // Calculate attendance
    const attendance = calculatePaidDays();

    const perDaySalary = totalSalary / attendance.totalDays;
    const grossAfterAttendance = perDaySalary * attendance.paidDays;

    // Calculate PF only if applicable
    const pf = emp.pf_applicable ? (basic * 12) / 100 : 0;

    const professionalTax = emp.professional_tax
      ? Number(emp.professional_tax)
      : 0; // Use existing value if available, otherwise default to 0

    // Use the advance and performance bonus from edit data
    const advanceAmount = Number(editData.advance_salary) || 0;
    const bonusAmount = Number(editData.performance_bonus) || 0;
    const arrears = Number(editData.arrears) || 0;
    const netSalary =
      grossAfterAttendance -
      pf -
      professionalTax -
      advanceAmount +
      bonusAmount +
      arrears;

    setGeneratedData({
      id: currentPayslipId,
      employee: {
        name: emp.name,
        emp_id: emp.emp_id,
        designation: emp.designation,
        basicSalary: basic,
        allowances:
          emp.house_rent_allowence +
          emp.transport_allowance +
          emp.internet_allowance +
          emp.medical_allowance,
        totalSalary,
        pf_applicable: emp.pf_applicable,
      },
      attendance,
      deductions: {
        pf,
        professionalTax,
        advance: advanceAmount,
        performanceBonus: bonusAmount,
        arrears,
        grossAfterAttendance,
        netSalary,
      },
      month,
      year,
    });
  };

  // Fetch Employees from port 7008
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:7008/api/employees")
      .then((res) => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setError(
          "Failed to load employees. Make sure the server is running on port 7008.",
        );
        setLoading(false);
      });
  }, []);

  // Convert Month Name → Number
  const monthMap = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  // Reset form to default values
  const resetForm = () => {
    setSelectedEmp("");
    setMonth("");
    setYear("");
    setHolidays(0);
    setHolidayDates([]);
    setLeaves(0);
    setAdvance(0);
    setPerformanceBonus(0);
    setArrears(0);
    setGeneratedData(null);
    setIsEditing(false);
    setCurrentPayslipId(null);
    // Reset file input if needed
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Holiday Upload (DD.MM.YYYY format support)
  const handleHolidayUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!month || !year) {
      alert("Select Month and Year first");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async function () {
      try {
        const typedArray = new Uint8Array(this.result);

        // Load the PDF with proper configuration
        const loadingTask = pdfjsLib.getDocument(typedArray);
        const pdf = await loadingTask.promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          content.items.forEach((item) => {
            fullText += item.str + " ";
          });
        }

        const monthNumber = monthMap[month];
        const regex = new RegExp(`(\\d{2})\\.${monthNumber}\\.${year}`, "g");

        // Extract all holiday dates
        const matches = [...fullText.matchAll(regex)];
        const dates = matches.map((match) => {
          const day = parseInt(match[1], 10);
          return { day, dateString: match[0] };
        });

        setHolidayDates(dates);
        setHolidays(dates.length);
        alert(`Found ${dates.length} holidays in the PDF`);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        alert("Error parsing PDF file: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Get Total Days in Month
  const getTotalDays = () => {
    if (!month || !year) return 30;
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  // Count Sundays in the month
  const getSundays = () => {
    if (!month || !year) return [];
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const totalDays = getTotalDays();
    const sundays = [];

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, monthIndex, day);
      if (date.getDay() === 0) {
        // 0 = Sunday
        sundays.push(day);
      }
    }

    return sundays;
  };

  // Calculate paid days without double-counting holidays on Sundays
  const calculatePaidDays = () => {
    const totalDays = getTotalDays();
    const sundays = getSundays();

    // Get holiday days that are NOT on Sundays
    const holidayDays = holidayDates.map((h) => h.day);
    const holidaysOnSundays = holidayDays.filter((day) =>
      sundays.includes(day),
    );
    const holidaysOnWeekdays = holidayDays.filter(
      (day) => !sundays.includes(day),
    );

    // 2 Casual Leaves Free
    const deductedLeaves = leaves > 2 ? leaves - 2 : 0;

    // Total deduction days: leaves after 2 free + holidays on weekdays
    const totalDeductionDays = deductedLeaves;
    const paidDays = totalDays - totalDeductionDays;

    return {
      totalDays,
      sundays: sundays.length,
      totalHolidays: holidayDays.length,
      holidaysOnSundays: holidaysOnSundays.length,
      holidaysOnWeekdays: holidaysOnWeekdays.length,
      deductedLeaves,
      totalDeductionDays,
      paidDays,
    };
  };

  // Generate Payslip
  const handleGenerate = () => {
    const emp = employees.find((e) => e.emp_id === selectedEmp);
    if (!emp) return alert("Select Employee");

    const basic = Number(emp.basic_salary) || 0;
    const houseRent = Number(emp.house_rent_allowence) || 0;
    const transport = Number(emp.transport_allowance) || 0;
    const medical = Number(emp.medical_allowance) || 0;
    const internet = Number(emp.internet_allowance) || 0;
    const professionalTax = Number(emp.professional_tax) || 0; // Dynamic from database

    const totalSalary = basic + houseRent + transport + medical + internet;

    // Calculate paid days without double-counting
    const attendance = calculatePaidDays();

    const perDaySalary = totalSalary / attendance.totalDays;
    const grossAfterAttendance = perDaySalary * attendance.paidDays;

    // Calculate PF only if applicable
    const pf = emp.pf_applicable ? (basic * 12) / 100 : 0;

    const netSalary =
      grossAfterAttendance -
      pf -
      professionalTax -
      Number(advance || 0) +
      Number(performanceBonus || 0) +
      Number(arrears || 0);

    setGeneratedData({
      employee: {
        name: emp.name,
        emp_id: emp.emp_id,
        designation: emp.designation,
        PAN: emp.pan,
        basicSalary: basic,
        allowances: transport + medical + internet + houseRent,
        totalSalary,
        pf_applicable: emp.pf_applicable,
      },
      attendance,
      deductions: {
        pf,
        professionalTax, // Dynamic from database
        advance: Number(advance || 0),
        performanceBonus: Number(performanceBonus || 0),
        arrears: Number(arrears || 0),
        grossAfterAttendance,
        netSalary,
      },
      month,
      year,
    });
  };

  // Save or Update payslip to database
  const handleSavePayslip = async () => {
    if (!generatedData) return;

    setSaving(true);
    try {
      const emp = employees.find((e) => e.emp_id === selectedEmp);

      // Format all numbers properly with 2 decimal places
      const grossAfterAttendance =
        Number(generatedData.deductions.grossAfterAttendance) || 0;
      const pfAmount = Number(generatedData.deductions.pf) || 0;
      const professionalTax = Number(emp.professional_tax) || 0; // Dynamic from database
      const advanceAmount = Number(generatedData.deductions.advance) || 0;
      const bonusAmount =
        Number(generatedData.deductions.performanceBonus) || 0;
      const arrears = Number(generatedData.deductions.arrears) || 0;
      const totalDeductions = pfAmount + professionalTax + advanceAmount;
      const netSalary = Number(generatedData.deductions.netSalary) || 0;

      const payslipData = {
        emp_id: selectedEmp,
        salary_month: parseInt(monthMap[month]),
        salary_year: parseInt(year),
        advance_salary: advanceAmount.toFixed(2),
        paid_days: generatedData.attendance.paidDays,
        holidays: generatedData.attendance.holidaysOnWeekdays,
        leaves: leaves,
        gross_salary: grossAfterAttendance.toFixed(2),
        pf_deduction: pfAmount.toFixed(2),
        professional_tax_deduction: professionalTax.toFixed(2), // Dynamic value
        performance_bonus: bonusAmount.toFixed(2),
        arrears: arrears.toFixed(2),
        total_deductions: totalDeductions.toFixed(2),
        net_salary: netSalary.toFixed(2),
      };

      console.log("Saving payslip...", payslipData);

      let response;
      if (isEditing && currentPayslipId) {
        // Update existing payslip
        console.log(`Updating payslip with ID: ${currentPayslipId}`);
        response = await axios.put(
          `http://localhost:7008/api/payslips/${currentPayslipId}`,
          payslipData,
          {
            headers: { "Content-Type": "application/json" },
            timeout: 7008,
          },
        );
        alert("Payslip updated successfully!");
      } else {
        // Create new payslip
        response = await axios.post(
          "http://localhost:7008/api/payslips/save",
          payslipData,
          {
            headers: { "Content-Type": "application/json" },
            timeout: 7008,
          },
        );
        alert("Payslip saved successfully!");
      }

      console.log("Save response:", response.data);

      // Clear the navigation state to prevent re-entering edit mode
      if (window.history.replaceState) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      resetForm();
    } catch (error) {
      console.error("Error saving payslip:", error);

      if (error.code === "ECONNREFUSED") {
        alert(
          "Cannot connect to server. Please make sure the server is running on port 7008",
        );
      } else if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

        // Show more specific error message
        if (error.response.data && error.response.data.error) {
          if (error.response.data.error.includes("out of range")) {
            alert(
              "Salary value is too large. Please check the amounts and try again.",
            );
          } else {
            alert("Server error: " + error.response.data.error);
          }
        } else {
          alert("Server responded with error: " + error.message);
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response from server. Please check if server is running.");
      } else {
        alert("Error: " + error.message);
      }
    }
    setSaving(false);
  };

  if (loading && employees.length === 0) {
    return <div className="payslip-section">Loading employees...</div>;
  }

  return (
    <div className="payslip-generation">
      <h2 className="text-center mb-4">
        {isEditing ? "Edit Payslip" : "Generate Payslip"}
      </h2>
      {isEditing && (
        <div className="edit-mode-badge text-center mb-5">
          <h4> Editing Mode - Updating Existing Payslip</h4>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button
            onClick={() => window.location.reload()}
            style={{ marginLeft: "10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Only show form when no payslip is generated */}
      {!generatedData && (
        <div
          className="payslip-form container"
          style={{
            border: "2px solid #dcdcdc",
            borderRadius: "12px",
            padding: "25px",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            maxWidth: "1000px",
          }}
        >
          <div className="row g-3">
            {/* Employee */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Select Employee *</label>
              <select
                className="form-select"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                disabled={isEditing}
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.name} - {emp.designation} - {emp.PAN}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Select Month *</label>
              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={isEditing}
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              >
                <option value="">Select Month</option>
                {Object.keys(monthMap).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Select Year *</label>
              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={isEditing}
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              >
                <option value="">Select Year</option>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Holiday Upload */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Upload Holiday PDF</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf"
                onChange={handleHolidayUpload}
                disabled={!month || !year || loading || isEditing}
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              />
              {holidays > 0 && (
                <small className="text-success">
                  Holidays found: <strong>{holidays}</strong>
                </small>
              )}
            </div>

            {/* Leaves */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Leaves Taken</label>
              <input
                type="number"
                className="form-control"
                value={leaves}
                onChange={(e) => setLeaves(Number(e.target.value))}
                min="0"
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              />
              <small className="text-muted">First 2 leaves are free</small>
            </div>

            {/* Advance */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Advance Salary (₹)</label>
              <input
                type="number"
                className="form-control"
                value={advance}
                onChange={(e) => setAdvance(Number(e.target.value))}
                min="0"
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              />
            </div>

            {/* Bonus */}
            <div className="col-md-4">
              <label className="form-label fw-bold">
                Performance Bonus (₹)
              </label>
              <input
                type="number"
                className="form-control"
                value={performanceBonus}
                onChange={(e) => setPerformanceBonus(Number(e.target.value))}
                min="0"
                step="100"
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              />
              <small className="text-muted">Bonus added to net salary</small>
            </div>

            {/* Arrears */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Arrears (₹)</label>
              <input
                type="number"
                className="form-control"
                value={arrears}
                onChange={(e) => setArrears(Number(e.target.value))}
                min="0"
                style={{ boxShadow: "none", border: "1px solid #ccc" }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.border = "1px solid #ccc";
                }}
              />
            </div>

            {/* Buttons */}
            <div className="col-12 d-flex justify-content-between mt-3">
              {isEditing && (
                <button className="btn btn-secondary" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}

              <button
                className="btn ms-auto"
                style={{ backgroundColor: "#073f8d", color: "#fff" }}
                onClick={handleGenerate}
                disabled={!selectedEmp || !month || !year || loading}
              >
                {loading
                  ? "Processing..."
                  : isEditing
                    ? "Load Edit Data"
                    : "Generate Payslip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Preview */}
      {generatedData && (
        <div className="container my-4">
          {/* Preview Header */}
          <div
            className="d-flex justify-content-between align-items-center mb-3 p-3 text-white"
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #304881 100%)",
              borderRadius: "8px",
              color: "#fffff",
            }}
          >
            <h3 className="mb-0">
              Payslip Preview - {generatedData.month} {generatedData.year}
            </h3>

            <div className="d-flex gap-2">
              <button
                onClick={handleSavePayslip}
                disabled={saving}
                className="btn"
                style={{
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  minWidth: "150px",
                }}
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Update Payslip"
                    : "Save Payslip"}
              </button>

              <button
                onClick={resetForm}
                className="btn"
                style={{
                  backgroundColor: "#64748b",
                  color: "#fff",
                  minWidth: "120px",
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Payslip Content */}
          <div className="p-4 bg-light rounded shadow-sm">
            {/* Company Header */}
            <div className="text-center mb-4 border-bottom pb-3">
              <h1 style={{ color: "#0f172a" }}>
                Softelectronic Solutions Private Limited
              </h1>
            </div>

            {/* Title */}
            <h4 className="text-center mb-4 border-bottom pb-2">
              PAYSLIP FOR {generatedData.month?.toUpperCase()}{" "}
              {generatedData.year}
            </h4>

            {/* Employee Details */}
            <div className="section-card px-3 px-md-4 px-lg-5">
              <h3 className="section-title text-center mb-4">
                Employee Details
              </h3>

              <div className="row">
                <div className="col-12 col-md-6 col-lg-4 mb-3">
                  <div className="d-flex">
                    <strong className="me-3" style={{ minWidth: "120px" }}>
                      Name:
                    </strong>
                    <span>{generatedData.employee?.name || "N/A"}</span>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-4 mb-3">
                  <div className="d-flex">
                    <strong className="me-3" style={{ minWidth: "120px" }}>
                      ID:
                    </strong>
                    <span>{generatedData.employee?.emp_id || "N/A"}</span>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-4 mb-3">
                  <div className="d-flex">
                    <strong className="me-3" style={{ minWidth: "120px" }}>
                      Designation:
                    </strong>
                    <span>{generatedData.employee?.designation || "N/A"}</span>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-4 mb-3">
                  <div className="d-flex">
                    <strong className="me-3" style={{ minWidth: "120px" }}>
                      PAN:
                    </strong>
                    <span>
                      {generatedData.employee?.PAN ||
                        generatedData.employee?.pan ||
                        "N/A"}
                    </span>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-4 mb-3">
                  <div className="d-flex">
                    <strong className="me-3" style={{ minWidth: "120px" }}>
                      PF:
                    </strong>
                    <span>
                      {generatedData.employee?.pf_applicable
                        ? "Applicable"
                        : "Not Applicable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Earnings & Deductions */}
            <div className="section-card">
              <h3 className="section-title text-center">
                Earnings & Deductions
              </h3>
              <div className="table-responsive">
                <table
                  className="table table-bordered mb-0 text-center align-middle"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <thead className="table-light">
                    <tr>
                      <th className="text-primary">EARNINGS</th>
                      <th className="text-primary">AMOUNT (₹)</th>
                      <th className="text-primary">DEDUCTIONS</th>
                      <th className="text-primary">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td>₹{generatedData.employee.basicSalary.toFixed(2)}</td>
                      <td>
                        PF{" "}
                        {generatedData.employee.pf_applicable
                          ? "(12% of Basic)"
                          : ""}
                      </td>
                      <td>
                        ₹
                        {generatedData.employee.pf_applicable
                          ? generatedData.deductions.pf.toFixed(2)
                          : "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td>Allowances</td>
                      <td>₹{generatedData.employee.allowances.toFixed(2)}</td>
                      <td>Professional Tax</td>
                      <td>₹{generatedData.deductions.professionalTax}</td>
                    </tr>
                    <tr>
                      <td>Performance Bonus</td>
                      <td>
                        ₹{generatedData.deductions.performanceBonus.toFixed(2)}
                      </td>
                      <td>Advance Deduction</td>
                      <td>₹{generatedData.deductions.advance.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Arrears</td>
                      <td>₹{generatedData.deductions.arrears.toFixed(2)}</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr
                      className="fw-bold"
                      style={{ borderTop: "2px solid #cbd5e1" }}
                    >
                      <td>Gross Earnings</td>
                      <td style={{ color: "#059669" }}>
                        ₹
                        {(
                          generatedData.employee.totalSalary +
                          generatedData.deductions.performanceBonus +
                          generatedData.deductions.arrears
                        ).toFixed(2)}
                      </td>
                      <td>Total Deductions</td>
                      <td style={{ color: "#dc2626" }}>
                        ₹
                        {(
                          generatedData.deductions.pf +
                          generatedData.deductions.professionalTax +
                          generatedData.deductions.advance
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* Attendance Summary */}
            <div className="card mb-4">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0 text-center">Attendance Summary</h5>
              </div>
              <div className="card-body row g-3 text-center">
                {[
                  {
                    label: "Total Days",
                    value: generatedData.attendance.totalDays,
                  },
                  { label: "Sundays", value: generatedData.attendance.sundays },
                  {
                    label: "Holidays",
                    value: generatedData.attendance.holidaysOnWeekdays,
                  },
                  {
                    label: "Leaves (Deducted)",
                    value: generatedData.attendance.deductedLeaves,
                  },
                  {
                    label: "Paid Days",
                    value: generatedData.attendance.paidDays,
                    className: "text-success",
                  },
                  {
                    label: "Per Day Rate",
                    value: `₹${(generatedData.employee.totalSalary / generatedData.attendance.totalDays).toFixed(2)}`,
                  },
                ].map((item, idx) => (
                  <div className="col-6 col-md-4" key={idx}>
                    <small className="text-muted">{item.label}</small>
                    <div className={`fw-bold ${item.className || ""}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Salary */}
            <div
              className="text-center p-4 rounded mb-4"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "white",
              }}
            >
              <h5 className="mb-2 opacity-75">NET PAYABLE AMOUNT</h5>
              <h2 className="fw-bold">
                {`₹${generatedData.deductions.netSalary.toFixed(2)}`}{" "}
                <small style={{ fontSize: "18px" }}>INR</small>
              </h2>
              <p className="mt-2" style={{ fontSize: "14px", opacity: 0.9 }}>
                (Rupees {numberToWords(generatedData.deductions.netSalary)}{" "}
                Only)
              </p>
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-between text-muted small border-top pt-3">
              <div>
                <p className="mb-1">
                  Generated on: {new Date().toLocaleDateString("en-IN")}
                </p>
                <p className="mb-0">This is a computer generated payslip</p>
              </div>
              {/* Optional signature */}
              <div className="text-end">
                {/* <div className="border-top mt-2 pt-1" style={{ width: '180px' }}>Authorized Signatory</div> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Helper function to convert numbers to words (basic implementation)
function numberToWords(num) {
  const units = [
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
  ];
  const teens = [
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

  if (num === 0) return "Zero";
  const integerPart = Math.floor(num);
  function convert(n) {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
    if (n < 1000)
      return (
        units[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  }

  return convert(integerPart);
}
export default PayslipGeneration;
