import React, { useCallback, useEffect, useState } from "react";
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

  /* =========================================================
     STATE
  ========================================================= */

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

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const rowsPerPage = 6;

  /* =========================================================
     FETCH EMPLOYEES
  ========================================================= */

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/employees-reports");

      if (Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Employee fetch error:", err);
      setEmployees([]);
    }
  }, []);

  /* =========================================================
     FETCH STATUS REPORT
  ========================================================= */

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/daily-status/report", {
        params: {
          emp_id: selectedEmp,
          month: selectedMonth,
          status: selectedStatus,
        },
      });

      if (Array.isArray(res.data)) {
        setStatusList(res.data);
      } else {
        setStatusList([]);
      }

      setCurrentPage(1);
    } catch (err) {
      console.error("Status report fetch error:", err);
      setStatusList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmp, selectedMonth, selectedStatus]);

  /* =========================================================
     INITIAL EMPLOYEE FETCH
  ========================================================= */

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  /* =========================================================
     FETCH STATUS WHEN FILTER CHANGES
  ========================================================= */

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* =========================================================
     APPROVE / REJECT
  ========================================================= */

  const submitAction = async () => {
    if (!selectedId || !actionType) {
      return;
    }

    try {
      setActionLoading(true);

      if (actionType === "approved") {
        await api.put(`/api/daily-status/approve/${selectedId}`, {
          admin_comment: comment,
        });
      } else {
        await api.put(`/api/daily-status/reject/${selectedId}`, {
          admin_comment: comment,
        });
      }

      setComment("");
      setSelectedId(null);
      setActionType("");

      await fetchStatus();
    } catch (err) {
      console.error("Status action error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     CLOSE ACTION MODAL
  ========================================================= */

  const closeActionModal = () => {
    if (actionLoading) return;

    setSelectedId(null);
    setActionType("");
    setComment("");
  };

  /* =========================================================
     STATUS BADGE
  ========================================================= */

  const getBadge = (status) => {
    const currentStatus = status || "pending";

    return (
      <span
        className={`statusBadge ${
          currentStatus === "approved"
            ? "statusApproved"
            : currentStatus === "rejected"
              ? "statusRejected"
              : "statusPending"
        }`}
      >
        {currentStatus}
      </span>
    );
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(statusList.length / rowsPerPage);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentRows = statusList.slice(indexOfFirst, indexOfLast);

  /* =========================================================
     KEEP CURRENT PAGE VALID
  ========================================================= */

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  /* =========================================================
     PAGINATION FUNCTIONS
  ========================================================= */

  const goToPrevious = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNext = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <div className="adminDailyStatusPage">
        <div className="adminDailyStatusContainer">
          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="dailyStatusHeader">
            <div className="headerContent">
              <div className="headerLeft">
                <div className="headerIcon">
                  <FaClipboardList />
                </div>

                <div className="headerText">
                  <h1>Employee Status Reports</h1>

                  <p>Manage and monitor daily work updates</p>
                </div>
              </div>

              <button
                type="button"
                className="backDashboardButton"
                onClick={() => navigate("/admin/dashboard")}
              >
                <FaArrowLeft />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>

          {/* =====================================================
              FILTER CARD
          ===================================================== */}

          <div className="filterCard">
            <div className="filterGrid">
              {/* EMPLOYEE */}

              <div className="filterItem">
                <label>Employee</label>

                <select
                  value={selectedEmp}
                  onChange={(e) => {
                    setSelectedEmp(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Employees</option>

                  {employees.map((employee) => (
                    <option key={employee.emp_id} value={employee.emp_id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* MONTH */}

              <div className="filterItem">
                <label>Month</label>

                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Months</option>

                  {[...Array(12)].map((_, index) => (
                    <option key={index} value={index + 1}>
                      {new Date(2000, index, 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATUS */}

              <div className="filterItem">
                <label>Status</label>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>

                  <option value="pending">Pending</option>

                  <option value="approved">Approved</option>

                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* =====================================================
              TABLE CARD
          ===================================================== */}

          <div className="tableCard">
            <div className="tableScroll">
              <table className="dailyStatusTable">
                <thead>
                  <tr>
                    <th className="employeeColumn">Employee</th>

                    <th className="projectColumn">Project</th>

                    <th className="assignedColumn">Assigned By</th>

                    <th className="descriptionColumn">Description</th>

                    <th className="dateColumn">Date</th>

                    <th className="statusColumn">Status</th>

                    <th className="responseColumn">Admin Response</th>

                    <th className="actionColumn">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="tableMessage">
                        Loading status reports...
                      </td>
                    </tr>
                  ) : currentRows.length > 0 ? (
                    currentRows.map((item) => (
                      <tr key={item.id}>
                        {/* EMPLOYEE */}

                        <td>
                          <div className="employeeCell">
                            <div className="employeeAvatar">
                              <FaUserTie />
                            </div>

                            <span className="employeeName">
                              {item.name || "-"}
                            </span>
                          </div>
                        </td>

                        {/* PROJECT */}

                        <td>
                          <span className="projectName">
                            {item.project_name || "-"}
                          </span>
                        </td>

                        {/* ASSIGNED BY */}

                        <td>
                          <span className="assignedBy">
                            {item.assigned_by || "-"}
                          </span>
                        </td>

                        {/* DESCRIPTION */}

                        <td>
                          {item.subtask ? (
                            <div
                              className="readMoreWrapper"
                              onClick={() => {
                                if (item.subtask.length > 40) {
                                  setHoveredItem(
                                    hoveredItem === item.id ? null : item.id,
                                  );
                                }
                              }}
                            >
                              <span className="descriptionText">
                                {item.subtask.length > 40
                                  ? `${item.subtask.substring(0, 40)}...`
                                  : item.subtask}
                              </span>

                              {item.subtask.length > 40 && (
                                <span className="readMoreButton">
                                  Read More
                                </span>
                              )}

                              {hoveredItem === item.id &&
                                item.subtask.length > 40 && (
                                  <div
                                    className="detailPopup"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="popupHeader">
                                      <span>Description Detail</span>

                                      <button
                                        type="button"
                                        className="popupClose"
                                        onClick={() => setHoveredItem(null)}
                                      >
                                        <FaTimes />
                                      </button>
                                    </div>

                                    <div className="popupContent">
                                      {item.subtask}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* DATE */}

                        <td>
                          <div className="dateCell">
                            <FaCalendarAlt />

                            <span>
                              {item.status_date
                                ? new Date(
                                    item.status_date,
                                  ).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td>{getBadge(item.status)}</td>

                        {/* ADMIN RESPONSE */}

                        <td>
                          {item.admin_comment ? (
                            <div
                              className="readMoreWrapper"
                              onClick={() => {
                                if (item.admin_comment.length > 40) {
                                  setHoveredItem(
                                    hoveredItem === `comment-${item.id}`
                                      ? null
                                      : `comment-${item.id}`,
                                  );
                                }
                              }}
                            >
                              <span className="adminResponseText">
                                {item.admin_comment.length > 40
                                  ? `${item.admin_comment.substring(0, 40)}...`
                                  : item.admin_comment}
                              </span>

                              {item.admin_comment.length > 40 && (
                                <span className="readMoreButton">
                                  Read More
                                </span>
                              )}

                              {hoveredItem === `comment-${item.id}` &&
                                item.admin_comment.length > 40 && (
                                  <div
                                    className="detailPopup"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="popupHeader">
                                      <span>Admin Response</span>

                                      <button
                                        type="button"
                                        className="popupClose"
                                        onClick={() => setHoveredItem(null)}
                                      >
                                        <FaTimes />
                                      </button>
                                    </div>

                                    <div className="popupContent">
                                      {item.admin_comment}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* ACTION */}

                        <td>
                          {!item.status || item.status === "pending" ? (
                            <div className="actionButtons">
                              <button
                                type="button"
                                className="approveButton"
                                title="Approve"
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setActionType("approved");
                                }}
                              >
                                <FaCheckCircle />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                className="rejectButton"
                                title="Reject"
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setActionType("rejected");
                                }}
                              >
                                <FaTimesCircle />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="noAction">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="tableMessage">
                        No matching records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* =====================================================
                PAGINATION
            ===================================================== */}

            {totalPages > 0 && (
              <div className="paginationWrapper">
                <button
                  type="button"
                  className="pageButton"
                  disabled={currentPage === 1}
                  onClick={goToPrevious}
                >
                  Previous
                </button>

                <div className="pageInfo">
                  Page <strong>{currentPage}</strong> / {totalPages}
                </div>

                <button
                  type="button"
                  className="pageButton"
                  disabled={currentPage === totalPages}
                  onClick={goToNext}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          APPROVE / REJECT MODAL
      ========================================================= */}

      {selectedId && (
        <div className="actionModalOverlay">
          <div className="actionModal">
            <div className="actionModalHeader">
              <div>
                <h3>
                  {actionType === "approved"
                    ? "Approve Status"
                    : "Reject Status"}
                </h3>

                <p>Add an optional response for the employee.</p>
              </div>

              <button
                type="button"
                className="modalCloseButton"
                onClick={closeActionModal}
                disabled={actionLoading}
              >
                <FaTimes />
              </button>
            </div>

            <textarea
              className="commentTextarea"
              rows="5"
              placeholder="Enter your response..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={actionLoading}
            />

            <div className="modalButtons">
              <button
                type="button"
                className="cancelButton"
                onClick={closeActionModal}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  actionType === "approved"
                    ? "submitApproveButton"
                    : "submitRejectButton"
                }
                onClick={submitAction}
                disabled={actionLoading}
              >
                {actionLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PAGE CSS
      ========================================================= */}

      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .adminDailyStatusPage {
          width: 100%;
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
          font-family:
            "Segoe UI",
            Roboto,
            Arial,
            sans-serif;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .adminDailyStatusContainer {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .dailyStatusHeader {
          width: 100%;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #2563eb 0%,
              #4f46e5 100%
            );
          color: #ffffff;
          box-shadow:
            0 8px 25px rgba(37, 99, 235, 0.18);
          margin-bottom: 16px;
        }

        .headerContent {
          min-height: 105px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-sizing: border-box;
        }

        .headerLeft {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .headerIcon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.18);
          font-size: 23px;
        }

        .headerText {
          min-width: 0;
        }

        .headerText h1 {
          margin: 0 0 5px;
          color: #ffffff;
          font-size: 23px;
          line-height: 1.25;
          font-weight: 700;
        }

        .headerText p {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 13px;
          line-height: 1.4;
        }

        .backDashboardButton {
          flex-shrink: 0;
          min-height: 40px;
          padding: 9px 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          background: #ffffff;
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          box-shadow:
            0 3px 10px rgba(0, 0, 0, 0.12);
          transition: 0.2s ease;
        }

        .backDashboardButton:hover {
          transform: translateY(-1px);
          box-shadow:
            0 5px 14px rgba(0, 0, 0, 0.18);
        }


        /* =====================================================
           FILTER CARD
        ===================================================== */

        .filterCard {
          width: 100%;
          padding: 18px;
          margin-bottom: 16px;
          border-radius: 15px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow:
            0 4px 15px rgba(15, 23, 42, 0.06);
          box-sizing: border-box;
        }

        .filterGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .filterItem {
          min-width: 0;
        }

        .filterItem label {
          display: block;
          margin-bottom: 7px;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }

        .filterItem select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #1e293b;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .filterItem select:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.1);
        }


        /* =====================================================
           TABLE CARD
        ===================================================== */

        .tableCard {
          width: 100%;
          overflow: hidden;
          border-radius: 15px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.08);
          box-sizing: border-box;
        }

        .tableScroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        .dailyStatusTable {
          width: 100%;
          min-width: 1180px;
          border-collapse: collapse;
          table-layout: fixed;
        }


        /* =====================================================
           COLUMN WIDTHS
        ===================================================== */

        .employeeColumn {
          width: 14%;
        }

        .projectColumn {
          width: 13%;
        }

        .assignedColumn {
          width: 13%;
        }

        .descriptionColumn {
          width: 21%;
        }

        .dateColumn {
          width: 10%;
        }

        .statusColumn {
          width: 9%;
        }

        .responseColumn {
          width: 12%;
        }

        .actionColumn {
          width: 12%;
        }


        /* =====================================================
           TABLE HEADER
        ===================================================== */

        .dailyStatusTable thead th {
          height: 52px;
          padding: 10px 10px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          text-align: center;
          vertical-align: middle;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.35px;
          white-space: nowrap;
          box-sizing: border-box;
        }


        /* =====================================================
           TABLE BODY
        ===================================================== */

        .dailyStatusTable tbody tr {
          min-height: 66px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          transition: background 0.15s ease;
        }

        .dailyStatusTable tbody tr:hover {
          background: #f8fafc;
        }

        .dailyStatusTable tbody tr:last-child {
          border-bottom: none;
        }

        .dailyStatusTable tbody td {
          position: relative;
          padding: 12px 10px;
          color: #334155;
          text-align: center;
          vertical-align: middle;
          font-size: 13px;
          line-height: 1.4;
          word-break: break-word;
          box-sizing: border-box;
        }


        /* =====================================================
           EMPLOYEE
        ===================================================== */

        .employeeCell {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          min-width: 0;
          text-align: left;
        }

        .employeeAvatar {
          width: 31px;
          height: 31px;
          min-width: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e0e7ff;
          color: #2563eb;
          font-size: 12px;
        }

        .employeeName {
          min-width: 0;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }


        /* =====================================================
           PROJECT
        ===================================================== */

        .projectName {
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
        }


        /* =====================================================
           ASSIGNED BY
        ===================================================== */

        .assignedBy {
          color: #d97706;
          font-size: 13px;
          font-weight: 600;
        }


        /* =====================================================
           DESCRIPTION
        ===================================================== */

        .readMoreWrapper {
          position: relative;
          display: inline;
          cursor: pointer;
        }

        .descriptionText,
        .adminResponseText {
          color: #1e293b;
          font-size: 13px;
          font-weight: 500;
        }

        .readMoreButton {
          margin-left: 5px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          text-decoration: underline;
          white-space: nowrap;
        }


        /* =====================================================
           DATE
        ===================================================== */

        .dateCell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .dateCell svg {
          color: #64748b;
          font-size: 12px;
          flex-shrink: 0;
        }


        /* =====================================================
           STATUS BADGES
        ===================================================== */

        .statusBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 72px;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .statusApproved {
          background: #dcfce7;
          color: #15803d;
        }

        .statusRejected {
          background: #fee2e2;
          color: #dc2626;
        }

        .statusPending {
          background: #fef3c7;
          color: #92400e;
        }


        /* =====================================================
           ACTION BUTTONS
        ===================================================== */

        .actionButtons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .approveButton,
        .rejectButton {
          min-height: 31px;
          padding: 5px 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: none;
          border-radius: 6px;
          color: #ffffff;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .approveButton {
          background: #16a34a;
        }

        .approveButton:hover {
          background: #15803d;
        }

        .rejectButton {
          background: #dc2626;
        }

        .rejectButton:hover {
          background: #b91c1c;
        }

        .noAction {
          color: #94a3b8;
          font-size: 13px;
        }


        /* =====================================================
           NO RECORD / LOADING
        ===================================================== */

        .tableMessage {
          height: 120px;
          padding: 20px !important;
          color: #64748b !important;
          text-align: center !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          vertical-align: middle !important;
        }


        /* =====================================================
           DESCRIPTION POPUP
        ===================================================== */

        .detailPopup {
          position: fixed;
          z-index: 999999;
          top: 50%;
          left: 50%;
          width: calc(100vw - 40px);
          max-width: 520px;
          max-height: calc(100vh - 80px);
          transform: translate(-50%, -50%);
          overflow: hidden;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 25px 70px rgba(15, 23, 42, 0.35);
          text-align: left;
          cursor: default;
        }

        .popupHeader {
          min-height: 50px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid #e2e8f0;
          color: #2563eb;
          font-size: 14px;
          font-weight: 700;
          box-sizing: border-box;
        }

        .popupClose {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .popupClose:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .popupContent {
          max-height: 330px;
          padding: 16px;
          overflow-y: auto;
          color: #334155;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          box-sizing: border-box;
        }


        /* =====================================================
           PAGINATION
        ===================================================== */

        .paginationWrapper {
          width: 100%;
          min-height: 64px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
          box-sizing: border-box;
        }

        .pageButton {
          flex: 0 0 auto;
          min-width: 88px;
          height: 36px;
          padding: 6px 13px;
          border: none;
          border-radius: 7px;
          background: #e2e8f0;
          color: #475569;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .pageButton:hover:not(:disabled) {
          background: #cbd5e1;
          color: #1e293b;
        }

        .pageButton:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .pageInfo {
          flex: 0 0 auto;
          min-width: 100px;
          color: #475569;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }

        .pageInfo strong {
          color: #2563eb;
          font-weight: 700;
        }


        /* =====================================================
           APPROVE / REJECT MODAL
        ===================================================== */

        .actionModalOverlay {
          position: fixed;
          inset: 0;
          z-index: 9999999;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.55);
          box-sizing: border-box;
        }

        .actionModal {
          width: 100%;
          max-width: 500px;
          padding: 20px;
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 25px 70px rgba(0, 0, 0, 0.3);
          box-sizing: border-box;
        }

        .actionModalHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .actionModalHeader h3 {
          margin: 0 0 5px;
          color: #1e293b;
          font-size: 18px;
          font-weight: 700;
        }

        .actionModalHeader p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }

        .modalCloseButton {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
        }

        .modalCloseButton:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .commentTextarea {
          width: 100%;
          min-height: 110px;
          margin-top: 16px;
          padding: 11px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          resize: vertical;
          color: #1e293b;
          background: #ffffff;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
          box-sizing: border-box;
        }

        .commentTextarea:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .modalButtons {
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .cancelButton,
        .submitApproveButton,
        .submitRejectButton {
          min-width: 82px;
          height: 36px;
          padding: 6px 13px;
          border: none;
          border-radius: 7px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancelButton {
          background: #e2e8f0;
          color: #475569;
        }

        .cancelButton:hover {
          background: #cbd5e1;
        }

        .submitApproveButton {
          background: #16a34a;
          color: #ffffff;
        }

        .submitApproveButton:hover {
          background: #15803d;
        }

        .submitRejectButton {
          background: #dc2626;
          color: #ffffff;
        }

        .submitRejectButton:hover {
          background: #b91c1c;
        }

        .cancelButton:disabled,
        .submitApproveButton:disabled,
        .submitRejectButton:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1024px) {

          .adminDailyStatusContainer {
            padding: 16px;
          }

          .headerContent {
            min-height: 95px;
            padding: 18px;
          }

          .headerText h1 {
            font-size: 20px;
          }

          .dailyStatusTable {
            min-width: 1120px;
          }

          .paginationWrapper {
            gap: 24px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 768px) {

          .adminDailyStatusContainer {
            padding: 12px;
          }

          .dailyStatusHeader {
            border-radius: 13px;
          }

          .headerContent {
            min-height: auto;
            padding: 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .headerLeft {
            width: 100%;
          }

          .headerIcon {
            width: 44px;
            height: 44px;
            min-width: 44px;
            font-size: 19px;
          }

          .headerText h1 {
            font-size: 18px;
          }

          .headerText p {
            font-size: 11px;
          }

          .backDashboardButton {
            width: 100%;
            min-height: 38px;
            font-size: 12px;
          }

          .filterCard {
            padding: 14px;
            border-radius: 13px;
          }

          .filterGrid {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .filterItem label {
            font-size: 11px;
          }

          .filterItem select {
            height: 40px;
            font-size: 12px;
          }

          .tableCard {
            border-radius: 13px;
          }

          .dailyStatusTable {
            min-width: 1120px;
          }

          .dailyStatusTable thead th {
            height: 48px;
            padding: 8px;
            font-size: 11px;
          }

          .dailyStatusTable tbody td {
            padding: 10px 8px;
            font-size: 12px;
          }

          .employeeName,
          .projectName,
          .assignedBy,
          .descriptionText,
          .adminResponseText {
            font-size: 12px;
          }

          .actionButtons {
            flex-direction: row;
            flex-wrap: nowrap;
          }

          .approveButton,
          .rejectButton {
            min-height: 30px;
            padding: 5px 7px;
            font-size: 10px;
          }

          .paginationWrapper {
            min-height: 58px;
            gap: 14px;
            padding: 10px 12px;
          }

          .pageButton {
            min-width: 76px;
            height: 34px;
            padding: 5px 9px;
            font-size: 11px;
          }

          .pageInfo {
            min-width: 88px;
            font-size: 11px;
          }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 480px) {

          .adminDailyStatusContainer {
            padding: 9px;
          }

          .headerContent {
            padding: 14px;
          }

          .headerLeft {
            gap: 10px;
          }

          .headerIcon {
            width: 40px;
            height: 40px;
            min-width: 40px;
            font-size: 17px;
          }

          .headerText h1 {
            font-size: 16px;
          }

          .headerText p {
            font-size: 10px;
          }

          .filterCard {
            padding: 12px;
          }

          .dailyStatusTable {
            min-width: 1080px;
          }

          .paginationWrapper {
            gap: 10px;
            padding: 9px 10px;
          }

          .pageButton {
            min-width: 70px;
            height: 32px;
            padding: 4px 7px;
            font-size: 10px;
          }

          .pageInfo {
            min-width: 78px;
            font-size: 10px;
          }

          .actionModalOverlay {
            padding: 12px;
          }

          .actionModal {
            padding: 16px;
            border-radius: 12px;
          }

          .actionModalHeader h3 {
            font-size: 16px;
          }

          .commentTextarea {
            font-size: 12px;
          }

        }


        /* =====================================================
           VERY SMALL MOBILE
        ===================================================== */

        @media (max-width: 360px) {

          .adminDailyStatusContainer {
            padding: 7px;
          }

          .paginationWrapper {
            gap: 7px;
            padding: 8px;
          }

          .pageButton {
            min-width: 64px;
            height: 30px;
            padding: 4px 5px;
            font-size: 9px;
          }

          .pageInfo {
            min-width: 70px;
            font-size: 9px;
          }

        }


        /* =====================================================
           DARK MODE
        ===================================================== */

        .bg-dark .adminDailyStatusPage,
        [data-theme="dark"] .adminDailyStatusPage {
          background: #0f172a !important;
          color: #f1f5f9 !important;
        }

        .bg-dark .filterCard,
        [data-theme="dark"] .filterCard,
        .bg-dark .tableCard,
        [data-theme="dark"] .tableCard {
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        .bg-dark .filterItem label,
        [data-theme="dark"] .filterItem label {
          color: #cbd5e1 !important;
        }

        .bg-dark .filterItem select,
        [data-theme="dark"] .filterItem select {
          background: #0f172a !important;
          border-color: #475569 !important;
          color: #f1f5f9 !important;
        }

        .bg-dark .dailyStatusTable tbody tr,
        [data-theme="dark"] .dailyStatusTable tbody tr {
          background: #1e293b !important;
          border-bottom-color: #334155 !important;
        }

        .bg-dark .dailyStatusTable tbody tr:hover,
        [data-theme="dark"] .dailyStatusTable tbody tr:hover {
          background: #263449 !important;
        }

        .bg-dark .dailyStatusTable tbody td,
        [data-theme="dark"] .dailyStatusTable tbody td {
          color: #cbd5e1 !important;
        }

        .bg-dark .employeeName,
        [data-theme="dark"] .employeeName,
        .bg-dark .descriptionText,
        [data-theme="dark"] .descriptionText,
        .bg-dark .adminResponseText,
        [data-theme="dark"] .adminResponseText {
          color: #f1f5f9 !important;
        }

        .bg-dark .employeeAvatar,
        [data-theme="dark"] .employeeAvatar {
          background: #334155 !important;
          color: #38bdf8 !important;
        }

        .bg-dark .projectName,
        [data-theme="dark"] .projectName {
          color: #38bdf8 !important;
        }

        .bg-dark .assignedBy,
        [data-theme="dark"] .assignedBy {
          color: #f59e0b !important;
        }

        .bg-dark .dateCell,
        [data-theme="dark"] .dateCell {
          color: #cbd5e1 !important;
        }

        .bg-dark .dateCell svg,
        [data-theme="dark"] .dateCell svg {
          color: #94a3b8 !important;
        }

        .bg-dark .readMoreButton,
        [data-theme="dark"] .readMoreButton {
          color: #38bdf8 !important;
        }

        .bg-dark .paginationWrapper,
        [data-theme="dark"] .paginationWrapper {
          background: #1e293b !important;
          border-top-color: #334155 !important;
        }

        .bg-dark .pageInfo,
        [data-theme="dark"] .pageInfo {
          color: #cbd5e1 !important;
        }

        .bg-dark .pageInfo strong,
        [data-theme="dark"] .pageInfo strong {
          color: #38bdf8 !important;
        }

        .bg-dark .pageButton,
        [data-theme="dark"] .pageButton {
          background: #334155 !important;
          color: #e2e8f0 !important;
        }

        .bg-dark .detailPopup,
        [data-theme="dark"] .detailPopup {
          background: #1e293b !important;
          border-color: #475569 !important;
        }

        .bg-dark .popupHeader,
        [data-theme="dark"] .popupHeader {
          color: #38bdf8 !important;
          border-bottom-color: #334155 !important;
        }

        .bg-dark .popupContent,
        [data-theme="dark"] .popupContent {
          color: #e2e8f0 !important;
        }

        .bg-dark .actionModal,
        [data-theme="dark"] .actionModal {
          background: #1e293b !important;
        }

        .bg-dark .actionModalHeader h3,
        [data-theme="dark"] .actionModalHeader h3 {
          color: #f1f5f9 !important;
        }

        .bg-dark .actionModalHeader p,
        [data-theme="dark"] .actionModalHeader p {
          color: #94a3b8 !important;
        }

        .bg-dark .commentTextarea,
        [data-theme="dark"] .commentTextarea {
          background: #0f172a !important;
          border-color: #475569 !important;
          color: #f1f5f9 !important;
        }

        .bg-dark .cancelButton,
        [data-theme="dark"] .cancelButton {
          background: #334155 !important;
          color: #e2e8f0 !important;
        }

      `}</style>
    </>
  );
}

export default AdminEmployeeStatus;
