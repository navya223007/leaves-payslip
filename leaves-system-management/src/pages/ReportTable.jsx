import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

function ReportTable({ role }) {
  // const API = `http://localhost:7015`;
// const API = `http://localhost:7015`;
const API = ``;
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [empId, setEmpId] = useState("all");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  // ================= FETCH EMPLOYEES =================
  useEffect(() => {
    const fetchEmployees = async () => {
      if (role === "admin") {
        const res = await axios.get(`${API}/employees-reports`, { withCredentials: true });

        setEmployees(res.data);
      }
    };

    fetchEmployees();
  }, [role]);
  // ================= FETCH REPORTS =================
  useEffect(() => {
    const fetchReports = async () => {
      const empIdToSend = role === "employee" ? user?.emp_id : empId;

      const res = await axios.get(`${API}/api/leaves/report`, {
        withCredentials: true,
        params: {
          role,
          emp_id: empIdToSend,
          month,
          status,
        }
      });

      setReports(res.data);
      setCurrentPage(1);
    };

    fetchReports();
  }, [empId, month, status, role, user?.emp_id]);

  // ================= PAGINATION =================
  const indexOfLast = currentPage * reportsPerPage;
  const indexOfFirst = indexOfLast - reportsPerPage;
  const currentReports = reports.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  // ================= STATUS COLOR =================

  return (
    <div className="container-fluid py-3 px-2 px-md-3">
      {/* TITLE */}
      <h3 className="mb-3 fw-bold text-center text-md-start">Reports</h3>

      {/* ================= FILTERS ================= */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            {role === "admin" && (
              <div className="col-12 col-sm-6 col-lg-4">
                <label className="form-label mb-1">Employee</label>
                <select
                  className="form-select form-select-sm"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                >
                  <option value="all">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-12 col-sm-6 col-lg-4">
              <label className="form-label mb-1">Month</label>
              <select
                className="form-select form-select-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-12 col-lg-4">
              <label className="form-label mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover table-striped align-middle text-center mb-0">
          {/* HEADER */}
          <thead className="table-dark">
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Leave Type</th>
              <th>Applied Time</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Accepted Time</th>
              <th>Reject Reason</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {currentReports.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-4">
                  No records found
                </td>
              </tr>
            ) : (
              currentReports.map((r) => (
                <tr key={r.id}>
                  {/* EMP ID */}
                  <td>{r.emp_id || "-"}</td>

                  {/* NAME */}
                  <td>{r.name || "-"}</td>

                  {/* DEPARTMENT */}
                  <td>{r.department || "-"}</td>

                  {/* LEAVE TYPE + HALF DAY FIX */}
                  <td>
                    <div>{r.leave_type || "-"}</div>

                    {r.leave_type === "half" && (
                      <small className="text-primary d-block">
                        {r.sub_type === "morning"
                          ? "🌅 Morning Half"
                          : r.sub_type === "afternoon"
                            ? "🌇 Afternoon Half"
                            : "Half Day"}
                      </small>
                    )}
                  </td>

                  {/* APPLIED TIME */}
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "-"}
                  </td>

                  {/* REASON (TWO TEXT FIX) */}
                  <td>
                    <div className="fw-semibold">{r.reason_type || "-"}</div>
                    <small className="text-muted d-block">
                      {r.reason_text || "-"}
                    </small>
                  </td>

                  {/* DATE (SINGLE + MULTI FIX) */}
                  <td>
                    <div>
                      {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                    </div>

                    {r.selected_dates?.length > 0 && (
                      <small className="text-muted d-block">
                        {r.selected_dates.join(" | ")}
                      </small>
                    )}
                  </td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={`badge ${
                        r.status === "approved"
                          ? "bg-success"
                          : r.status === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* ACCEPTED TIME */}
                  <td>
                    {r.action_time
                      ? new Date(r.action_time).toLocaleString()
                      : "-"}
                  </td>

                  {/* REJECT REASON (TEXT WRAP FIX) */}
                  <td style={{ maxWidth: "200px", whiteSpace: "pre-wrap" }}>
                    {r.reject_reason || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* ================= PAGINATION ================= */}
      <div className="d-flex justify-content-center mt-3 px-2">
        <div
          className="d-flex align-items-center justify-content-center gap-2 bg-light border rounded p-2"
          style={{
            flexWrap: "wrap",
            maxWidth: "100%",
          }}
        >
          {/* Previous */}
          <button
            className="btn btn-outline-primary btn-sm"
            style={{
              minWidth: "90px",
            }}
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {/* Page Info */}
          <span
            className="fw-bold px-2 text-center"
            style={{
              minWidth: "90px",
              display: "inline-block",
            }}
          >
            {currentPage} / {totalPages}
          </span>

          {/* Next */}
          <button
            className="btn btn-outline-primary btn-sm"
            style={{
              minWidth: "90px",
            }}
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportTable;
