import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const PAYSLIP_API_URL = "http://localhost:7014/api";

const months = [
  { value: 1, label: "January" },  { value: 2, label: "February" },
  { value: 3, label: "March" },    { value: 4, label: "April" },
  { value: 5, label: "May" },      { value: 6, label: "June" },
  { value: 7, label: "July" },     { value: 8, label: "August" },
  { value: 9, label: "September" },{ value: 10, label: "October" },
  { value: 11, label: "November" },{ value: 12, label: "December" },
];
const years = [2023, 2024, 2025, 2026, 2027];

function DownloadPayslips() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payslip, setPayslip] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [allPayslips, setAllPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPayslips = useCallback(async () => {
    if (!user?.emp_id) return;
    setLoading(true);
    setError("");
    try {
      const [payslipRes, empRes] = await Promise.all([
        axios.get(`${PAYSLIP_API_URL}/payslips/employee/${user.emp_id}`),
        axios.get(`${PAYSLIP_API_URL}/employees/${user.emp_id}`),
      ]);
      setAllPayslips(payslipRes.data || []);
      setEmployeeDetails(empRes.data || null);
    } catch (err) {
      console.error("Error fetching payslips:", err);
      setError("Failed to load payslip data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  useEffect(() => {
    if (allPayslips.length > 0) {
      const found = allPayslips.find(
        (p) => parseInt(p.salary_month) === parseInt(month) && parseInt(p.salary_year) === parseInt(year)
      );
      setPayslip(found || null);
    } else {
      setPayslip(null);
    }
  }, [month, year, allPayslips]);

  // Build viewData in same shape as admin's handleViewPayslip, then navigate to employee payslip view
  const handleView = () => {
    if (!payslip || !employeeDetails) return;
    const viewData = {
      id: payslip.emp_id,
      name: employeeDetails.name || user?.name || "",
      designation: employeeDetails.designation || "",
      month: months.find((m) => m.value === parseInt(payslip.salary_month))?.label || "Unknown",
      year: payslip.salary_year || new Date().getFullYear(),
      generatedDate: new Date().toLocaleDateString(),
      paidDays: payslip.paid_days || 0,
      pan: employeeDetails.PAN || "N/A",
      grossAfterAttendance: payslip.gross_salary || 0,
      pf: payslip.pf_deduction || 0,
      professionalTax: payslip.professional_tax_deduction || 0,
      advance: payslip.advance_salary || 0,
      performanceBonus: payslip.performance_bonus || 0,
      arrears: payslip.arrears || 0,
      pf_applicable: employeeDetails.pf_applicable || false,
      bank_account: employeeDetails.bank_account_number || "",
      ifsc: employeeDetails.IFSC_code || "",
      bank_name: employeeDetails.bank_name || "",
      holidays: payslip.holidays || 0,
      leaves: payslip.leaves || 0,
    };
    navigate("/employee/payslip-view", { state: viewData });
  };

  return (
    <div className="container-fluid p-3">
      <div className="mb-3">
        <h3 className="fw-bold">Download Payslips</h3>
      </div>

      {/* FILTER */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Select Month</label>
              <select className="form-select" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Select Year</label>
              <select className="form-select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-outline-primary w-100" onClick={fetchPayslips} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATES */}
      {loading && (
        <div className="text-center p-5 text-muted">
          <div className="spinner-border text-primary mb-2" role="status"></div>
          <div>Loading payslip details...</div>
        </div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && !payslip && (
        <div className="card shadow-sm text-center p-5 text-muted">
          <h5>No Payslip Found</h5>
          <p className="mb-0">
            No payslip has been generated for {months.find((m) => m.value === month)?.label} {year}.
          </p>
        </div>
      )}

      {/* PAYSLIP FOUND — show View + Download buttons */}
      {!loading && !error && payslip && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white fw-bold">
            Payslip — {months.find((m) => m.value === month)?.label} {year}
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <table className="table table-bordered">
                  <tbody>
                    <tr><th className="bg-light">Employee ID</th><td>{user?.emp_id}</td></tr>
                    <tr><th className="bg-light">Name</th><td>{user?.name}</td></tr>
                    <tr><th className="bg-light">Department</th><td>{user?.department || "N/A"}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered">
                  <tbody>
                    <tr><th className="bg-light">Paid Days</th><td>{payslip.paid_days}</td></tr>
                    <tr><th className="bg-light">Gross Salary</th><td>₹{parseFloat(payslip.gross_salary).toFixed(2)}</td></tr>
                    <tr><th className="bg-light">Net Salary</th><td className="fw-bold text-primary">₹{parseFloat(payslip.net_salary).toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* VIEW & DOWNLOAD buttons */}
            <div className="d-flex gap-3 flex-wrap">
              <button className="btn btn-primary btn-lg px-4" onClick={handleView}>
                View Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloadPayslips;
