import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminEmployeeStatus() {
  const API = `http://${window.location.hostname}:7013`;

  const [statusList, setStatusList] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedEmp, setSelectedEmp] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [viewText, setViewText] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  // ================= FETCH EMPLOYEES =================
  const fetchEmployees = async () => {
    const res = await axios.get(`${API}/employees-reports`, { withCredentials: true });

    setEmployees(res.data);
  };

  // ================= FETCH STATUS =================
  const fetchStatus = async () => {
    const res = await axios.get(
      `${API}/api/daily-status/report`,
      {
        withCredentials: true,
        params: {
          emp_id: selectedEmp,
          month: selectedMonth,
          status: selectedStatus,
        }
      },
    );

    setStatusList(res.data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [selectedEmp, selectedMonth, selectedStatus]);

  // ✅ APPROVE
  const handleApprove = async (id) => {
    await axios.put(
      `${API}/api/daily-status/approve/${id}`,
      {},
      { withCredentials: true }
    );

    fetchStatus();
  };

  // ❌ REJECT
  const handleReject = async (id) => {
    await axios.put(
      `${API}/api/daily-status/reject/${id}`,
      {},
      { withCredentials: true }
    );

    fetchStatus();
  };
  const getBadge = (status) => (
    <span
      className={`badge px-2 py-1 ${
        status === "approved"
          ? "bg-success"
          : status === "rejected"
            ? "bg-danger"
            : "bg-warning text-dark"
      }`}
    >
      {status || "pending"}
    </span>
  );

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* TITLE */}
      <h3 className="fw-bold mb-3">Employee Daily Status Report</h3>

      {/* FILTERS */}
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-2">
            {/* EMPLOYEE */}
            <div className="col-12 col-sm-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* MONTH */}
            <div className="col-12 col-sm-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
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

            {/* STATUS */}
            <div className="col-12 col-sm-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow border-0">
        <div className="table-responsive">
          <table className="table align-middle mb-0 text-center">
            <thead className="table-light">
              <tr>
                <th>Emp</th>
                <th>Project</th>
                <th>Assigned By</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ minWidth: "180px" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {statusList.length > 0 ? (
                statusList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>

                    <td className="text-start">{item.project_name}</td>

                    <td>{item.assigned_by || "-"}</td>

                    <td className="text-start">
                      {item.subtask.length > 40
                        ? item.subtask.slice(0, 40) + "..."
                        : item.subtask}
                    </td>

                    <td>{new Date(item.status_date).toLocaleDateString()}</td>

                    <td>{getBadge(item.status)}</td>

                    <td>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {/* VIEW BUTTON (ALWAYS SHOW) */}
                        <button
                          className="btn btn-sm btn-outline-primary"
                          data-bs-toggle="modal"
                          data-bs-target="#viewModal"
                          onClick={() => {
                            setViewText(item.subtask);
                            setSelectedRow(item);
                          }}
                        >
                          View
                        </button>

                        {/* ✅ SHOW ONLY IF PENDING */}
                        {(!item.status || item.status === "pending") && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(item.id)}
                            >
                              ✓
                            </button>

                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(item.id)}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-muted">
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <div className="modal fade" id="viewModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Description</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body">
              <p style={{ whiteSpace: "pre-line" }}>{viewText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminEmployeeStatus;
