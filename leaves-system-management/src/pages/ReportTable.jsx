import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import "./ReportTable.css";

function ReportTable({ role }) {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [empId, setEmpId] = useState("all");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedReason, setExpandedReason] = useState(null);
  const [expandedRejectReason, setExpandedRejectReason] = useState(null);
  const reportsPerPage = 6;

  // ================= FETCH EMPLOYEES =================

  useEffect(() => {
    const fetchEmployees = async () => {
      if (role !== "admin") return;

      try {
        const res = await api.get("/employees-reports");

        setEmployees(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Employee fetch error:", err);
      }
    };

    fetchEmployees();
  }, [role]);

  // ================= FETCH REPORTS =================

  useEffect(() => {
    const fetchReports = async () => {
      // Employee login - wait until user is available
      if (role === "employee" && !user?.emp_id) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const empIdToSend = role === "employee" ? user?.emp_id : empId;

        const res = await api.get("/api/leaves/report", {
          params: {
            role,
            emp_id: empIdToSend,
            month,
            status,
          },
        });

        setReports(Array.isArray(res.data) ? res.data : []);
        setCurrentPage(1);
      } catch (err) {
        console.error("Report fetch error:", err);

        setReports([]);
        setError(
          err?.response?.data?.message || "Unable to load leave reports.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [empId, month, status, role, user?.emp_id]);

  // ================= PAGINATION =================

  const indexOfLast = currentPage * reportsPerPage;
  const indexOfFirst = indexOfLast - reportsPerPage;

  const currentReports = reports.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(reports.length / reportsPerPage);

  // ================= STATUS CLASS =================

  const getStatusClass = (leaveStatus) => {
    switch (String(leaveStatus || "").toLowerCase()) {
      case "approved":
        return "statusApproved";

      case "rejected":
        return "statusRejected";

      default:
        return "statusPending";
    }
  };

  // ================= LEAVE TYPE =================

  const getLeaveType = (report) => {
    const type = String(
      report.leave_type || report.type || report.leaveType || "",
    ).toLowerCase();

    const dayType = String(
      report.day_type ||
        report.half_day_type ||
        report.halfDayType ||
        report.leave_period ||
        "",
    ).toLowerCase();

    // ================= HALF DAY =================
    if (
      type.includes("half") ||
      dayType.includes("half") ||
      dayType.includes("morning") ||
      dayType.includes("afternoon")
    ) {
      if (dayType.includes("morning")) {
        return (
          <span className="leaveType">
            Half Day <span>🌅 Morning</span>
          </span>
        );
      }

      return (
        <span className="leaveType">
          Half Day <span>🌇 Afternoon</span>
        </span>
      );
    }

    // ================= FULL DAY MULTIPLE =================
    if (
      type.includes("full") &&
      String(report.sub_type || "").toLowerCase() === "multi"
    ) {
      return (
        <span className="leaveType">
          Full Day <span>📅 Multiple Days</span>
        </span>
      );
    }

    // ================= FULL DAY SINGLE =================
    return (
      <span className="leaveType">
        Full Day <span>📅 Single Day</span>
      </span>
    );
  };

  // ================= DATE FORMAT =================

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB");
  };

  // ================= PAGE CHANGE =================

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  // ================= COMPACT TEXT =================

  const renderReasonText = (report) => {
    const text =
      report.reason_type === "other" && report.reason_text
        ? String(report.reason_text).trim()
        : "";

    if (!text) {
      return <div className="reasonType">{report.reason_type || "-"}</div>;
    }

    const id = report.id || report.leave_id;
    const isExpanded = expandedReason === id;
    const maxLength = 35;

    return (
      <div className="reasonCellContent">
        <div className="reasonType">Other Description</div>

        <div className={`reasonText ${isExpanded ? "expanded" : ""}`}>
          👉{" "}
          {isExpanded
            ? text
            : `${text.slice(0, maxLength)}${text.length > maxLength ? "..." : ""}`}
        </div>

        {text.length > maxLength && (
          <button
            type="button"
            className="readMoreButton"
            onClick={() => setExpandedReason(isExpanded ? null : id)}
          >
            {isExpanded ? "Read Less" : "Read More"}
          </button>
        )}
      </div>
    );
  };

  // ================= COMPACT REJECT REASON =================

  const renderRejectReason = (report) => {
    const text = String(
      report.reject_reason || report.rejection_reason || "",
    ).trim();

    if (!text) {
      return "-";
    }

    const id = report.id || report.leave_id;
    const isExpanded = expandedRejectReason === id;
    const maxLength = 35;

    return (
      <div className="reasonCellContent">
        <div className={`rejectReason ${isExpanded ? "expanded" : ""}`}>
          {isExpanded
            ? text
            : `${text.slice(0, maxLength)}${
                text.length > maxLength ? "..." : ""
              }`}
        </div>

        {text.length > maxLength && (
          <button
            type="button"
            className="readMoreButton"
            onClick={() => setExpandedRejectReason(isExpanded ? null : id)}
          >
            {isExpanded ? "Read Less" : "Read More"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="leaveReportsPage">
      {/* ================= HEADER ================= */}

      <div className="reportsHeader">
        <div>
          <h1>Leave Reports</h1>

          <p>Employee leave reports and approval tracking</p>
        </div>

        <div className="totalReportsCard">
          <span>Total Reports</span>
          <strong>{reports.length}</strong>
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div className="reportsFilters">
        {/* Employee Filter - Admin Only */}

        {role === "admin" && (
          <div className="filterGroup">
            <label>Employee</label>

            <select
              value={empId}
              onChange={(e) => {
                setEmpId(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Employees</option>

              {employees.map((employee) => (
                <option key={employee.emp_id} value={employee.emp_id}>
                  {employee.emp_id} - {employee.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Month */}

        <div className="filterGroup">
          <label>Month</label>

          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Months</option>
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

        {/* Status */}

        <div className="filterGroup">
          <label>Status</label>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* ================= ERROR ================= */}

      {error && <div className="reportError">{error}</div>}

      {/* ================= TABLE ================= */}

      <div className="reportsTableCard">
        <div className="tableScroll">
          <table className="reportsTable">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Applied Time</th>
                <th>Reason</th>
                <th>Leave Date</th>
                <th>Status</th>
                <th>Accepted Time</th>
                <th>Reject Reason</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="tableMessage">
                    Loading leave reports...
                  </td>
                </tr>
              ) : currentReports.length === 0 ? (
                <tr>
                  <td colSpan="10" className="tableMessage">
                    No leave reports found.
                  </td>
                </tr>
              ) : (
                currentReports.map((report, index) => {
                  const reportStatus =
                    report.status || report.leave_status || "pending";

                  return (
                    <tr key={report.id || report.leave_id || index}>
                      {/* EMP ID */}
                      <td>
                        <strong className="employeeId">
                          {report.emp_id || "-"}
                        </strong>
                      </td>

                      {/* NAME */}
                      <td>{report.name || report.employee_name || "-"}</td>

                      {/* DEPARTMENT */}
                      <td>
                        {report.department || report.department_name || "-"}
                      </td>

                      {/* LEAVE TYPE */}
                      <td>{getLeaveType(report)}</td>

                      {/* APPLIED TIME */}
                      <td className="dateCell">
                        {formatDateTime(
                          report.applied_at ||
                            report.created_at ||
                            report.applied_time,
                        )}
                      </td>

                      {/* REASON */}
                      <td className="reasonCell">{renderReasonText(report)}</td>

                      {/* LEAVE DATE */}
                      <td>
                        {report.sub_type === "multi"
                          ? (() => {
                              let dates = report.selected_dates;

                              // MySQL JSON may already come as an array
                              // or may come as a JSON string.
                              if (typeof dates === "string") {
                                try {
                                  dates = JSON.parse(dates);
                                } catch {
                                  dates = [];
                                }
                              }

                              if (!Array.isArray(dates) || dates.length === 0) {
                                return "-";
                              }

                              return (
                                <div className="multipleLeaveDates">
                                  {dates.map((date, index) => (
                                    <div key={index}>{date}</div>
                                  ))}
                                </div>
                              );
                            })()
                          : formatDate(report.date || report.leave_date)}
                      </td>
                      {/* STATUS */}
                      <td>
                        <span
                          className={`statusBadge ${getStatusClass(
                            reportStatus,
                          )}`}
                        >
                          {reportStatus}
                        </span>
                      </td>

                      {/* ACCEPTED TIME */}
                      <td className="dateCell">
                        {formatDateTime(
                          report.accepted_time ||
                            report.approved_at ||
                            report.approved_time,
                        )}
                      </td>

                      {/* REJECT REASON */}
                      <td className="reasonCell">
                        {renderRejectReason(report)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}

        {!loading && reports.length > 0 && (
          <div className="pagination">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="pageInfo">
              <span>Page</span>

              <strong>{currentPage}</strong>

              <span>/</span>

              <strong>{totalPages}</strong>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportTable;
