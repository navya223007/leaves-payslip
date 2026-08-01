import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaCalendarAlt,
  FaUserTie,
  FaTimes,
} from "react-icons/fa";

function AdminEmployeeStatus() {
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [statusList, setStatusList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredItem, setHoveredItem] = useState(null);

  const rowsPerPage = 6;

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees-reports");
      setEmployees(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await api.get("/api/daily-status/report", {
        params: {
          emp_id: selectedEmp,
          month: selectedMonth,
          status: selectedStatus,
        },
      });
      setStatusList(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.log(err);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEmployees();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStatus();
  }, [selectedEmp, selectedMonth, selectedStatus]);

  const submitAction = async () => {
    try {
      if (actionType === "approved") {
        await api.put(`/api/daily-status/approve/${selectedId}`, {
          admin_comment: comment,
        });
      } else {
        await api.put(`/api/daily-status/reject/${selectedId}`, {
          admin_comment: comment,
        });
        console.log("selectedId:", selectedId);
        console.log("actionType:", actionType);
        console.log("comment:", comment);
      }

      setComment("");
      setSelectedId(null);
      setActionType("");
      fetchStatus();
    } catch (err) {
      console.log(err);
    }
  };
  const getBadge = (status) => (
    <span
      className={`badge px-3 py-2 rounded-pill fw-semibold ${
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

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = statusList.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(statusList.length / rowsPerPage);

  return (
    <>
      <div className="container-fluid dailyPage px-2 px-md-3 py-3">
        {/* HEADER SECTION WITH BLUE GRADIENT */}
        <div className="dailyStatusHeader card border-0 shadow-lg mb-3">
          <div className="card-body headerBody">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="headerIcon">
                  <FaClipboardList />
                </div>
                <div>
                  <h2 className="headerTitle mb-1">Employee Status Reports</h2>
                  <p className="headerSubTitle mb-0">
                    Manage and monitor daily work updates
                  </p>
                </div>
              </div>
              <button
                className="btn btn-light fw-semibold text-primary px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
                onClick={() => navigate("/admin/dashboard")}
              >
                <FaArrowLeft /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="card filterCard border-0 shadow-sm mb-3">
          <div className="card-body py-3">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <select
                  className="form-select customSelect"
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                >
                  <option value="all">All Employees</option>
                  {employees.map((e) => (
                    <option key={e.emp_id} value={e.emp_id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select customSelect"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="all">All Months</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {new Date(0, i).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select customSelect"
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

        {/* TABLE SECTION */}
        <div className="card tableCard border-0 shadow-lg">
          <div className="table-responsive customTableWrapper">
            <table className="table customTable align-middle mb-0">
              <thead>
                <tr className="text-center">
                  <th style={{ width: "15%" }}>Employee</th>
                  <th style={{ width: "15%" }}>Project</th>
                  <th style={{ width: "15%" }}>Assigned By</th>
                  <th style={{ width: "25%" }}>Description</th>
                  <th style={{ width: "12%" }}>Date</th>
                  <th style={{ width: "8%" }}>Status</th>
                  <th>Admin Response</th>
                  <th style={{ width: "10%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((item) => (
                    <tr key={item.id} className="text-center">
                      <td className="text-start">
                        <div className="d-flex align-items-center gap-2">
                          <div className="adminEmpAvatar">
                            <FaUserTie />
                          </div>
                          <span className="fw-semibold empNameText">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="fw-semibold projectText">
                        {item.project_name}
                      </td>
                      <td className="assignedByText fw-medium">
                        {item.assigned_by || "-"}
                      </td>
                      <td className="text-start">
                        <div
                          className="readMoreWrapper"
                          onClick={() =>
                            setHoveredItem(
                              hoveredItem === item.id ? null : item.id,
                            )
                          }
                        >
                          <span className="descriptionText">
                            {item.subtask?.length > 40
                              ? item.subtask.substring(0, 40) + "..."
                              : item.subtask}
                          </span>
                          {item.subtask?.length > 40 && (
                            <span className="readMoreBtn ms-1">Read More</span>
                          )}

                          {/* FLOATING HOVER CARD */}
                          {hoveredItem === item.id &&
                            item.subtask?.length > 40 && (
                              <div
                                className="hoverDescriptionCard"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="hoverTitle d-flex justify-content-between align-items-center">
                                  <span>Description Detail</span>
                                  <FaTimes
                                    className="closeModal"
                                    onClick={() => setHoveredItem(null)}
                                  />
                                </div>
                                <div className="hoverContent">
                                  {item.subtask}
                                </div>
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="text-nowrap dateText">
                        <FaCalendarAlt className="me-1 text-muted" />{" "}
                        {new Date(item.status_date).toLocaleDateString()}
                      </td>
                      <td>{getBadge(item.status)}</td>
                      <td>
                        {item.admin_comment ? (
                          <div
                            className="readMoreWrapper"
                            onClick={() =>
                              setHoveredItem(
                                hoveredItem === `comment-${item.id}`
                                  ? null
                                  : `comment-${item.id}`,
                              )
                            }
                          >
                            <span className="adminResponseText">
                              {item.admin_comment.length > 40
                                ? item.admin_comment.substring(0, 40) + "..."
                                : item.admin_comment}
                            </span>

                            {item.admin_comment.length > 40 && (
                              <span className="readMoreBtn ms-1">
                                Read More
                              </span>
                            )}

                            {hoveredItem === `comment-${item.id}` &&
                              item.admin_comment.length > 40 && (
                                <div
                                  className="hoverDescriptionCard"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="hoverTitle d-flex justify-content-between align-items-center">
                                    <span>Admin Response</span>

                                    <FaTimes
                                      className="closeModal"
                                      onClick={() => setHoveredItem(null)}
                                    />
                                  </div>

                                  <div className="hoverContent">
                                    {item.admin_comment}
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {!item.status || item.status === "pending" ? (
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              className="btn btn-success btn-sm d-flex align-items-center gap-1 px-2 py-1"
                              title="Approve"
                              onClick={() => {
                                console.log("Approve Clicked", item.id);
                                setSelectedId(item.id);
                                setActionType("approved");
                              }}
                            >
                              <FaCheckCircle /> Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm d-flex align-items-center gap-1 px-2 py-1"
                              title="Reject"
                              onClick={() => {
                                console.log("Reject Clicked", item.id);
                                setSelectedId(item.id);
                                setActionType("rejected");
                              }}
                            >
                              <FaTimesCircle /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-4 explicitNoRecord text-muted italic"
                    >
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="paginationWrapper">
            <button
              className="pageBtn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`pageNumber ${currentPage === i + 1 ? "activePage" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pageBtn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {selectedId && (
        <div className="modalOverlay">
          <div className="commentModal">
            <h5>
              {actionType === "approved" ? "Approve Status" : "Reject Status"}
            </h5>

            <textarea
              className="form-control mt-3"
              rows="4"
              placeholder="Enter your response..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="mt-3 d-flex gap-2 justify-content-end">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedId(null);
                  setComment("");
                }}
              >
                Cancel
              </button>

              <button
                className={
                  actionType === "approved"
                    ? "btn btn-success"
                    : "btn btn-danger"
                }
                onClick={submitAction}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* MUTUAL CORE STYLING WITH STRICT LIGHT/DARK DISCRIMINATION */
        .dailyPage { min-height: 100vh; background: #f8fafc; font-family: 'Segoe UI', Roboto, sans-serif; transition: background 0.25s ease, color 0.25s ease; color: #1e293b; }
        
        .bg-dark .dailyPage, [data-theme="dark"] .dailyPage { 
          background: #0f172a !important; 
          color: #f8fafc !important; 
        }

        /* HEADER BOX BLUE GRADIENT BACKGROUND */
        .dailyStatusHeader { border-radius: 15px; background: linear-gradient(135deg, #2563eb, #4f46e5) !important; color: white !important; }
        .headerIcon { width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .headerTitle { font-size: 22px; font-weight: 700; color: white !important; }
        .headerSubTitle { font-size: 13px; color: rgba(255,255,255,0.8) !important; }

        /* CONTROL FILTERS BOX */
        .filterCard { border-radius: 15px; background: #ffffff; border: 1px solid #e2e8f0; transition: background 0.25s; }
        .bg-dark .filterCard, [data-theme="dark"] .filterCard { background: #1e293b !important; border: 1px solid #334155 !important; }
        
        .customSelect { border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0; background-color: #ffffff; color: #1e293b; }
        .bg-dark .customSelect, [data-theme="dark"] .customSelect { background-color: #0f172a !important; border-color: #475569 !important; color: #f1f5f9 !important; }

        /* THE DATA TABLE container BLOCK */
        .tableCard { border-radius: 15px; overflow: hidden; background: #ffffff; border: 1px solid #e2e8f0; transition: background 0.25s; }
        .bg-dark .tableCard, [data-theme="dark"] .tableCard { background: #1e293b !important; border: 1px solid #334155 !important; }
        
        .customTable { width: 100%; border-collapse: collapse; background: transparent; }
        .customTable thead th { background: #2563eb !important; color: #ffffff !important; padding: 15px 12px; font-size: 14px; border: none; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .customTable tbody tr { border-bottom: 1px solid #e2e8f0; transition: background 0.2s; }
        .bg-dark .customTable tbody tr, [data-theme="dark"] .customTable tbody tr { border-bottom-color: #334155 !important; }
        .bg-dark .customTable tbody tr:hover, [data-theme="dark"] .customTable tbody tr:hover { background: rgba(255, 255, 255, 0.03) !important; }

        /* DYNAMIC COLOR FIELDS */
        .empNameText { color: #334155; }
        .bg-dark .empNameText, [data-theme="dark"] .empNameText { color: #121314 !important; }

        .projectText { color: #2563eb; }
        .bg-dark .projectText, [data-theme="dark"] .projectText { color: #38bdf8 !important; }

        .assignedByText { color: #eb920e; }
        .bg-dark .assignedByText, [data-theme="dark"] .assignedByText { color: #0a0a0aef !important; }

  /* Light Mode - బ్యాక్‌గ్రౌండ్ వైట్ ఉన్నప్పుడు ప్యూర్ బ్లాక్ టెక్స్ట్ */
.dailyPage .descriptionText,
.tableCard .descriptionText { 
  color: #000000 !important; 
  font-weight: 600;         
  font-size: 14px; 
}


.bg-dark .descriptionText,
[data-theme="dark"] .descriptionText,
.bg-dark .tableCard .descriptionText,
[data-theme="dark"] .tableCard .descriptionText {
  color: #131111 !important; /* Pure White */
}
        .dateText { color: #101822; }
        .bg-dark .dateText, [data-theme="dark"] .dateText { color: #121314 !important; }

        .explicitNoRecord { color: #080808 !important; }

        .adminEmpAvatar { width: 30px; height: 30px; background: #e2e8f0; color: #2563eb; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12px; }
        .bg-dark .adminEmpAvatar, [data-theme="dark"] .adminEmpAvatar { background: #334155 !important; color: #38bdf8 !important; }

        /* INTERACTIVE POPUP DETAIL MODAL OVERLAYS */
        .readMoreWrapper { position: relative; cursor: pointer; }
        .readMoreBtn { color: #2563eb; font-weight: 700; font-size: 12px; text-decoration: underline; }
        .bg-dark .readMoreBtn, [data-theme="dark"] .readMoreBtn { color: #38bdf8 !important; }

        .hoverDescriptionCard {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 500px;
          background: #ffffff !important;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.45) !important;
          z-index: 999999 !important;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        .bg-dark .hoverDescriptionCard, [data-theme="dark"] .hoverDescriptionCard { 
          background: #1e293b !important; 
          border-color: #475569 !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
        }
        
        .hoverTitle { font-weight: 800; border-bottom: 2px solid #e2e8f0; margin-bottom: 12px; padding-bottom: 8px; color: #2563eb; font-size: 16px; }
        .bg-dark .hoverTitle, [data-theme="dark"] .hoverTitle { color: #38bdf8 !important; border-bottom-color: #334155 !important; }
        
        .hoverContent { font-size: 14px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; color: #0f172a !important; }
        .bg-dark .hoverContent, [data-theme="dark"] .hoverContent { color: #e2e8f0 !important; }
        
        .closeModal { cursor: pointer; color: #64748b; transition: 0.2s; font-size: 16px; }
        .closeModal:hover { color: #ef4444; }

        /* FOOTER CONTROLS PAGINATION */
        .paginationWrapper { padding: 15px; display: flex; justify-content: center; gap: 5px; background: #ffffff; border-top: 1px solid #e2e8f0; }
        .bg-dark .paginationWrapper, [data-theme="dark"] .paginationWrapper { background: #1e293b !important; border-top-color: #334155 !important; }
        
        .pageBtn, .pageNumber { border: none; padding: 6px 12px; border-radius: 8px; background: #e2e8f0; color: #475569; font-weight: 600; transition: 0.2s; }
        .bg-dark .pageBtn, .bg-dark .pageNumber, [data-theme="dark"] .pageBtn, [data-theme="dark"] .pageNumber { background: #334155 !important; color: #cbd5e1 !important; }
        
        .pageBtn:disabled { opacity: 0.35; cursor: not-allowed; }
        .activePage { background: #2563eb !important; color: white !important; }
        .bg-dark .activePage, [data-theme="dark"] .activePage { background: #38bdf8 !important; color: #0f172a !important; }

        /* SCREEN WIDTH BREAKPOINTS */
        @media (max-width: 1024px) {
          .customTable { min-width: 1000px; }
          .customTableWrapper { overflow-x: auto; }
        }
          .modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999999;
}

.commentModal {
  background: white;
  width: 500px;
  padding: 20px;
  border-radius: 10px;
}
  .adminResponseText {
  color: #000000 !important;
  font-weight: 600;
  font-size: 14px;
}

.bg-dark .adminResponseText,
[data-theme="dark"] .adminResponseText {
  color: #141414 !important;
}
      `}</style>
    </>
  );
}

export default AdminEmployeeStatus;
