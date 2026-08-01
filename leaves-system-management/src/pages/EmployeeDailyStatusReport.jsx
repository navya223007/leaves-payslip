import React, { useEffect, useState } from "react";
import api from "../api"; // adjust path if needed
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaEdit,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";

function EmployeeDailyStatusReport() {
  const [statusList, setStatusList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredItem, setHoveredItem] = useState(null); // Track hovered item for cleaner UI

  const rowsPerPage = 6;
  const navigate = useNavigate();

  const { user } = useAuth();

  const fetchStatus = async () => {
    try {
      const res = await api.get("/api/daily-status/report", {
        params: {
          emp_id: user?.emp_id,
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

  useEffect(() => {
    if (user?.emp_id) fetchStatus();
  }, [selectedMonth, selectedStatus, user?.emp_id]);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = statusList.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(statusList.length / rowsPerPage);

  const handleEdit = (item) => {
    navigate("/employee/daily-status", { state: { editData: item } });
  };

  const getStatusBadge = (status) => (
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

  if (!user?.emp_id) return <div className="text-center p-5">Login Again</div>;

  return (
    <>
      <div className="container-fluid dailyPage px-2 px-md-3 py-3">
        {/* HEADER */}
        <div className="dailyStatusHeader card border-0 shadow-lg mb-3">
          <div className="card-body headerBody">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="headerIcon">
                  <FaClipboardList />
                </div>
                <div>
                  <h2 className="headerTitle mb-1">Daily Status Report</h2>
                  <p className="headerSubTitle mb-0">
                    View submitted daily work reports
                  </p>
                </div>
              </div>
              <div className="reportCountBox">
                <div className="reportCountLabel">Total Reports</div>
                <div className="reportCountValue">{statusList.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="card filterCard border-0 shadow-sm mb-3">
          <div className="card-body py-2">
            <div className="row g-2">
              <div className="col-12 col-md-6 col-lg-3">
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
              <div className="col-12 col-md-6 col-lg-3">
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

        {/* TABLE */}
        <div className="card tableCard border-0 shadow-lg">
          <div className="table-responsive customTableWrapper">
            <table className="table customTable align-middle mb-0">
              <thead>
                <tr className="text-center">
                  <th>Project</th>
                  <th>Assigned By</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Admin Comment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((item) => (
                    <tr key={item.id} className="text-center">
                      <td className="text-start fw-semibold">
                        {item.project_name}
                      </td>
                      <td>{item.assigned_by || "-"}</td>
                      <td className="text-start">
                        <div
                          className="readMoreWrapper"
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <span className="descriptionText">
                            {item.subtask?.length > 40
                              ? item.subtask.substring(0, 40) + "..."
                              : item.subtask}
                          </span>
                          {item.subtask?.length > 40 && (
                            <span className="readMoreBtn ms-1">Read More</span>
                          )}

                          {/* FLOATING HOVER CARD - FIXED POSITIONING */}
                          {hoveredItem === item.id &&
                            item.subtask?.length > 40 && (
                              <div className="hoverDescriptionCard">
                                <div className="hoverTitle d-flex justify-content-between">
                                  <span>Full Description</span>
                                  <FaTimes
                                    className="d-md-none"
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
                      <td className="text-nowrap">
                        <FaCalendarAlt className="me-1" />{" "}
                        {new Date(item.status_date).toLocaleDateString()}
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{item.admin_comment ? item.admin_comment : "-"}</td>
                      <td>
                        {item.status === "pending" && (
                          <button
                            className="btn btn-primary btn-sm editBtn"
                            onClick={() => handleEdit(item)}
                          >
                            <FaEdit className="me-1" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No Data Found
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

      <style>{`
        .dailyPage { min-height: 100vh; background: #f8fafc; }
        .bg-dark .dailyPage { background: #0f172a !important; }

        /* HEADER */
        .dailyStatusHeader { border-radius: 15px; background: linear-gradient(135deg, #2563eb, #4f46e5) !important; color: white !important; }
        .headerIcon { width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .headerTitle { font-size: 22px; font-weight: 700; color: white !important; }
        .headerSubTitle { font-size: 13px; color: rgba(255,255,255,0.8) !important; }
        .reportCountBox { background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 12px; text-align: center; }

        /* TABLE */
        .tableCard { border-radius: 15px; overflow: hidden; }
        .customTable thead th { background: #2563eb !important; color: white !important; padding: 12px; font-size: 14px; border: none; }
        .customTable tbody td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
        .bg-dark .customTable tbody td { background: #111827; color: #f1f5f9; border-bottom: 1px solid #334155; }

        /* READ MORE & HOVER CARD FIX */
        .readMoreWrapper { position: relative; cursor: pointer; }
        .descriptionText { display: inline-block; vertical-align: middle; }
        .readMoreBtn { color: #2563eb; font-weight: 700; font-size: 12px; text-decoration: underline; }

        .hoverDescriptionCard {
          position: fixed; /* Fixed to viewport so it never overflows the table */
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 500px;
          background: white;
          color: #1e293b;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          z-index: 9999;
          border: 1px solid #e2e8f0;
        }

        .bg-dark .hoverDescriptionCard { background: #1e293b; color: #f1f5f9; border-color: #334155; }
        .hoverTitle { font-weight: 800; border-bottom: 1px solid #eee; margin-bottom: 10px; padding-bottom: 5px; color: #2563eb; }
        .hoverContent { font-size: 14px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; }

        /* PAGINATION */
        .paginationWrapper { padding: 15px; display: flex; justify-content: center; gap: 5px; }
        .pageBtn, .pageNumber { border: none; padding: 6px 12px; border-radius: 8px; background: #e2e8f0; color: #475569; font-weight: 600; }
        .activePage { background: #2563eb !important; color: white !important; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .customTable { min-width: 800px; }
          .headerTitle { font-size: 18px; }
          .hoverDescriptionCard { width: 95%; padding: 15px; }
        }
      `}</style>
    </>
  );
}

export default EmployeeDailyStatusReport;
