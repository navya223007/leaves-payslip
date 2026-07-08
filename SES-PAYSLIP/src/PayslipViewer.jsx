import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://192.168.29.103:7008/api";

function PayslipViewer() {
  const [payslips, setPayslips] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingPayslip, setEditingPayslip] = useState(null);
  const navigate = useNavigate();
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

  const years = [2023, 2024, 2025, 2026, 2027];

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payslips/${year}/${month}`,
      );
      setPayslips(response.data);
    } catch (error) {
      showMessage("error", "Error fetching payslips");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayslips();
  }, [month, year]);

  const handleViewPayslip = (payslip) => {
    navigate("/view-pdf", {
      state: {
        id: payslip.emp_id,
        name: payslip.name,
        designation: payslip.designation,
        month: months.find((m) => m.value === parseInt(payslip.salary_month))
          ?.label,
        year: payslip.salary_year,
        grossAfterAttendance: payslip.gross_salary,
        pf: payslip.pf_deduction,
        professionalTax: payslip.professional_tax_deduction,
        advance: payslip.advance_salary,
        paidDays: payslip.paid_days,
        pan: payslip.PAN,
        generatedDate: new Date().toLocaleDateString(),
        pf_applicable: payslip.pf_applicable,
        basic_salary: payslip.basic_salary,
        transport_allowance: payslip.transport_allowance,
        internet_allowance: payslip.internet_allowance,
        medical_allowance: payslip.medical_allowance,
        holidays: payslip.holidays,
        leaves: payslip.leaves,
        payslip_id: payslip.id,
      },
    });
  };

  const handleUpdatePayslip = (payslip) => {
    setEditingPayslip({
      id: payslip.id,
      emp_id: payslip.emp_id,
      salary_month: payslip.salary_month,
      salary_year: payslip.salary_year,
      advance_salary: payslip.advance_salary,
      paid_days: payslip.paid_days,
      holidays: payslip.holidays,
      leaves: payslip.leaves,
      gross_salary: payslip.gross_salary,
      pf_deduction: payslip.pf_deduction,
      professional_tax_deduction: payslip.professional_tax_deduction,
    });
  };
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First, update the payslip in database
      const response = await axios.post(`${API_BASE_URL}/payslips/generate`, {
        emp_id: editingPayslip.emp_id,
        salary_month: editingPayslip.salary_month,
        salary_year: editingPayslip.salary_year,
        advance_salary: editingPayslip.advance_salary,
        paid_days: editingPayslip.paid_days,
        holidays: editingPayslip.holidays,
        leaves: editingPayslip.leaves,
      });

      showMessage("success", "Payslip updated successfully");
      setEditingPayslip(null);
      fetchPayslips();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.error || "Error updating payslip",
      );
      console.error("Error:", error);
    }
    setLoading(false);
  };
  const handleDeletePayslip = async (id) => {
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
  const handleDownloadPayslip = async (payslip) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payslip/pdf`,
        {
          emp_id: payslip.emp_id,
          year: payslip.salary_year,
          month: payslip.salary_month,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payslip_${payslip.emp_id}_${payslip.salary_month}_${payslip.salary_year}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      showMessage("success", "Payslip downloaded successfully");
    } catch (error) {
      showMessage("error", "Error downloading payslip");
      console.error("Error:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPayslip({ ...editingPayslip, [name]: value });
  };

  return (
    <div className="payslip-viewer">
      <h2>View Payslips</h2>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="filter-section">
        <div className="form-group">
          <label>Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Year</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchPayslips} disabled={loading}>
          Refresh
        </button>
      </div>

      {editingPayslip && (
        <div className="edit-form">
          <h3>Update Payslip</h3>
          <form onSubmit={handleUpdateSubmit}>
            <div className="form-group">
              <label>Paid Days</label>
              <input
                type="number"
                name="paid_days"
                value={editingPayslip.paid_days}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Holidays</label>
              <input
                type="number"
                name="holidays"
                value={editingPayslip.holidays}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Leaves</label>
              <input
                type="number"
                name="leaves"
                value={editingPayslip.leaves}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Advance Salary</label>
              <input
                type="number"
                name="advance_salary"
                value={editingPayslip.advance_salary}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                Update Payslip
              </button>
              <button type="button" onClick={() => setEditingPayslip(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="payslip-list">
          {payslips.length === 0 ? (
            <p>No payslips found for the selected period.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>PF Applicable</th>
                  <th>Gross Salary</th>
                  <th>PF Amount</th>
                  <th>Net Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td>{payslip.emp_id}</td>
                    <td>{payslip.name}</td>
                    <td>{payslip.designation}</td>
                    <td>
                      <span
                        className={`pf-badge ${payslip.pf_applicable ? "pf-yes" : "pf-no"}`}
                      >
                        {payslip.pf_applicable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>₹{parseFloat(payslip.gross_salary).toFixed(2)}</td>
                    <td>₹{parseFloat(payslip.pf_deduction || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(payslip.net_salary).toFixed(2)}</td>
                    <td className="actions">
                      <button
                        className="view-btn"
                        onClick={() => handleViewPayslip(payslip)}
                        title="View Payslip"
                      >
                        View
                      </button>
                      <button
                        className="update-btn"
                        onClick={() => handleUpdatePayslip(payslip)}
                        title="Update Payslip"
                      >
                        Update
                      </button>
                      <button
                        className="download-btn"
                        onClick={() => handleDownloadPayslip(payslip)}
                        title="Download PDF"
                      >
                        Download
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeletePayslip(payslip.id)}
                        title="Delete Payslip"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default PayslipViewer;
