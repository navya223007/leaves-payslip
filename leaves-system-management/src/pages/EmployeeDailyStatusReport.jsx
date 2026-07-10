import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

function EmployeeDailyStatusReport() {
  const [statusList, setStatusList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  // const API = process.env.REACT_APP_API_URL || `http://localhost:7015`;
// const API = process.env.REACT_APP_API_URL || `http://localhost:7015`;
 const API = process.env.REACT_APP_API_URL || ``;
const [viewText, setViewText] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editProject, setEditProject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignedBy, setEditAssignedBy] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const { user } = useAuth();

  // ✅ FETCH
  const fetchStatus = async () => {
    try {
      const res = await axios.get(
        `${API}/api/daily-status/report`,
        {
          withCredentials: true,
          params: {
            emp_id: user?.emp_id,
            month: selectedMonth,
            status: selectedStatus,
          }
        },
      );

      setStatusList(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    if (user?.emp_id) {
      fetchStatus();
    }
  }, [selectedMonth, selectedStatus, user?.emp_id]);

  // VIEW
  const handleView = (text) => {
    setViewText(text);
    setShowViewModal(true);
  };

  // EDIT
  const handleEdit = (item) => {
    setEditId(item.id);
    setEditProject(item.project_name);
    setEditDescription(item.subtask);
    setEditAssignedBy(item.assigned_by || "");
    setShowEditModal(true);
  };

  // UPDATE
  const handleUpdate = async () => {
    await axios.put(
      `${API}/api/daily-status/update/${editId}`,
      {
        project_name: editProject,
        subtask: editDescription,
        assigned_by: editAssignedBy,
      },
      { withCredentials: true }
    );
    setShowEditModal(false);
    fetchStatus();
  };
  useEffect(() => {
    if (user?.emp_id) fetchStatus();
  }, [selectedMonth, selectedStatus]);

  const getStatusBadge = (status) => (
    <span
      className={`badge px-3 py-2 ${
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

  if (!user?.emp_id) {
    return <div className="text-center p-4">Login again</div>;
  }

  return (
    <div className="px-2 px-md-4 py-3">
      {/* TITLE */}
      <h3 className="fw-bold mb-3 text-center text-md-start">
        Employee Daily Status Report
      </h3>
      {/* FILTERS */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-4">
              <label className="form-label small text-muted">Month</label>
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-4">
              <label className="form-label small text-muted">Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
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

      {/* TABLE */}
      <div className="card shadow border-0">
        <div className="table-responsive" style={{ overflowX: "auto" }}>
          <table
            className="table align-middle mb-0"
            style={{ minWidth: "800px" }}
          >
            <thead className="table-light text-center">
              <tr>
                <th>Project</th>
                <th>Assigned By</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {statusList.length > 0 ? (
                statusList.map((item) => (
                  <tr key={item.id} className="text-center">
                    <td className="text-start px-3">{item.project_name}</td>
                    <td>{item.assigned_by || "-"}</td>
                    <td className="text-start px-3">{item.subtask}</td>
                    <td>{new Date(item.status_date).toLocaleDateString()}</td>
                    <td>{getStatusBadge(item.status)}</td>

                    <td>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleView(item.subtask)}
                        >
                          View
                        </button>

                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && (
        <div className="modal d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Description</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body">{viewText}</div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Status</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                />
              </div>

              <div className="modal-body">
                <input
                  className="form-control mb-3"
                  value={editProject}
                  onChange={(e) => setEditProject(e.target.value)}
                />
                <input
                  className="form-control mb-3"
                  value={editAssignedBy}
                  onChange={(e) => setEditAssignedBy(e.target.value)}
                />
                <textarea
                  className="form-control"
                  rows="5"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  Update
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDailyStatusReport;
