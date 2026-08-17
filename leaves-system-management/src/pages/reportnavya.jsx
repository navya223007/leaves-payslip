import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
function ReportTable({ role }) {
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
        const res = await api.get("/employees-reports");
        setEmployees(res.data);
      }
    };

    fetchEmployees();
  }, [role]);

  // ================= FETCH REPORTS =================

  useEffect(() => {
    const fetchReports = async () => {
      const empIdToSend = role === "employee" ? user?.emp_id : empId;

      const res = await api.get("/api/leaves/report", {
        params: {
          role,
          emp_id: empIdToSend,
          month,
          status,
        },
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

  // ================= STATUS STYLE =================

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "statusApproved";

      case "rejected":
        return "statusRejected";

      default:
        return "statusPending";
    }
  };

  return (
    <div className="reportPage">
      {/* ================= HEADER ================= */}

      <div className="topHeader">
        <div>
          <h2 className="pageTitle">Leave Reports</h2>

          <p className="pageSubTitle">
            Employee leave reports and approval tracking
          </p>
        </div>

        <div className="reportCountBox">
          <span>Total Reports</span>

          <h3>{reports.length}</h3>
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div className="filterCard">
        <div className="filterGrid">
          {/* EMPLOYEE */}

          {role === "admin" && (
            <div className="filterItem">
              <label>Employee</label>

              <select value={empId} onChange={(e) => setEmpId(e.target.value)}>
                <option value="all">All Employees</option>

                {employees.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MONTH */}

          <div className="filterItem">
            <label className="form-label">Month</label>

            <select
              className="form-select py-2"
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
          {/* STATUS */}

          <div className="filterItem">
            <label className="form-label">Status</label>

            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                paddingRight: "45px",
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="tableCard">
        <div className="table-responsive">
          <table className="modernTable">
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
              {currentReports.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    <div className="emptyBox">No records found</div>
                  </td>
                </tr>
              ) : (
                currentReports.map((r) => (
                  <tr key={r.id}>
                    {/* EMP ID */}

                    <td>
                      <div className="empIdBox">{r.emp_id || "-"}</div>
                    </td>

                    {/* NAME */}

                    <td>
                      <div className="nameBox">{r.name || "-"}</div>
                    </td>

                    {/* DEPARTMENT */}

                    <td>
                      <span className="deptBadge">{r.department || "-"}</span>
                    </td>

                    {/* LEAVE TYPE */}

                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {/* LEAVE TYPE */}
                        <span
                          className="badge"
                          style={{
                            background:
                              r.leave_type === "half"
                                ? "linear-gradient(135deg,#ff9800,#ffb74d)"
                                : "#0d6efd",
                            color: "#fff",
                            padding: "7px 14px",
                            borderRadius: "30px",
                            fontWeight: "700",
                            fontSize: "13px",
                            textTransform: "capitalize",
                          }}
                        >
                          {r.leave_type === "half"
                            ? "Half Day"
                            : r.leave_type === "full"
                              ? "Full Day"
                              : r.leave_type}
                        </span>

                        {/* SESSION */}
                        {r.leave_type === "half" && (
                          <small
                            style={{
                              background: "#eef4ff",
                              color: "#0d6efd",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            {r.session === "morning"
                              ? "🌅 Morning"
                              : r.session === "afternoon"
                                ? "🌇 Afternoon"
                                : "-"}
                          </small>
                        )}

                        {/* FULL DAY TYPE */}
                        {r.leave_type === "full" && (
                          <small
                            style={{
                              background: "#f3f4f6",
                              color: "#111827",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            {r.sub_type === "single"
                              ? "📅 Single Day"
                              : r.sub_type === "multi"
                                ? "🗓 Multiple Days"
                                : "-"}
                          </small>
                        )}
                      </div>
                    </td>
                    {/* APPLIED TIME */}

                    <td>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : "-"}
                    </td>

                    {/* REASON */}
                    <td>
                      <div
                        className="reasonType"
                        style={{
                          textTransform: "capitalize",
                          fontWeight: "600",
                        }}
                      >
                        {r.reason_type === "other"
                          ? "Other Description"
                          : r.reason_type || "-"}
                      </div>

                      {r.reason_type === "other" && r.reason_text && (
                        <small
                          className="reasonText"
                          style={{
                            display: "block",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          👉 {r.reason_text}
                        </small>
                      )}
                    </td>

                    {/* DATE */}
                    <td>
                      {r.leave_type === "full" && r.sub_type === "multi" ? (
                        r.selected_dates && r.selected_dates.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                              maxWidth: "250px",
                            }}
                          >
                            {r.selected_dates.map((d, idx) => (
                              <span
                                key={idx}
                                className="badge bg-secondary"
                                style={{ fontSize: "11px" }}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )
                      ) : (
                        <div style={{ fontWeight: "500" }}>
                          {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                        </div>
                      )}
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`statusBadge ${getStatusClass(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>

                    {/* ACTION TIME */}

                    <td>
                      {r.action_time
                        ? new Date(r.action_time).toLocaleString()
                        : "-"}
                    </td>

                    {/* REJECT REASON */}

                    <td className="rejectReason">{r.reject_reason || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}

      <div className="paginationWrapper">
        <button
          className="pageBtn"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <div className="pageNumber">
          {currentPage} / {totalPages}
        </div>

        <button
          className="pageBtn"
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      <style>{  `/* =========================================================
   REPORT PAGE
========================================================= */

.reportPage {
  width: 100%;
  height: 100vh;
  max-height: 100vh;

  padding: 10px 14px;
  box-sizing: border-box;

  background: linear-gradient(135deg, #eef4ff, #f8fbff, #edf2ff);

  display: flex;
  flex-direction: column;

  gap: 8px;

  overflow: hidden;

  font-family: "Inter", "Segoe UI", sans-serif;
  color: #1f2937;
}


/* =========================================================
   HEADER
========================================================= */

.topHeader {
  flex: 0 0 auto;

  min-height: 58px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 9px 16px;
  box-sizing: border-box;

  background: #ffffff;

  border: 1px solid #dbe7f5;
  border-radius: 10px;

  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.06);
}


/* LEFT SIDE */

.topHeader > div:first-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
}


.pageTitle {
  margin: 0;

  font-size: 20px;
  line-height: 1.2;

  font-weight: 800;

  color: #0f172a;
}


.pageSubTitle {
  margin: 4px 0 0;

  font-size: 12px;
  line-height: 1.3;

  color: #475569;

  font-weight: 500;
}


/* =========================================================
   REPORT COUNT - RIGHT SIDE
========================================================= */

.reportCountBox {
  flex: 0 0 auto;

  min-width: 115px;

  padding: 7px 16px;

  box-sizing: border-box;

  text-align: center;

  background: linear-gradient(135deg, #0d6efd, #6610f2);

  color: #ffffff;

  border: none;
  border-radius: 10px;

  box-shadow: 0 5px 14px rgba(13, 110, 253, 0.20);
}


.reportCountBox span {
  display: block;

  margin: 0;

  font-size: 10px;
  line-height: 1.2;

  font-weight: 600;

  color: rgba(255, 255, 255, 0.88);
}


.reportCountBox h3 {
  margin: 2px 0 0;

  font-size: 21px;
  line-height: 1.15;

  font-weight: 800;

  color: #ffffff;
}


/* =========================================================
   FILTER CARD
========================================================= */

.filterCard {
  flex: 0 0 auto;

  width: 100%;

  padding: 9px 14px;

  box-sizing: border-box;

  background: #ffffff;

  border: 1px solid #dbe7f5;
  border-radius: 10px;

  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.045);
}


/* =========================================================
   FILTER GRID

   Employee | Month | Status
========================================================= */

.filterGrid {
  width: 100%;

  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 10px;

  align-items: end;
}


.filterItem {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 4px;
}


.filterItem label {
  margin: 0;

  font-size: 11px;

  line-height: 1.2;

  font-weight: 700;

  color: #1e293b;
}


/* =========================================================
   SELECT
========================================================= */

.filterItem select {
  width: 100%;

  height: 35px;

  padding: 0 10px;

  box-sizing: border-box;

  border: 1px solid #dbeafe;

  border-radius: 7px;

  background: #f8fbff;

  color: #111827;

  font-size: 12px;

  font-weight: 600;

  outline: none;

  cursor: pointer;

  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}


.filterItem select:hover {
  border-color: #93c5fd;

  background: #ffffff;
}


.filterItem select:focus {
  border-color: #0d6efd;

  background: #ffffff;

  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.11);
}


/* =========================================================
   TABLE CARD
========================================================= */

.tableCard {
  flex: 1 1 auto;

  min-width: 0;
  min-height: 0;

  width: 100%;

  display: flex;
  flex-direction: column;

  background: #ffffff;

  border: 1px solid #dbe7f5;
  border-radius: 10px;

  box-shadow: 0 5px 15px rgba(13, 110, 253, 0.05);

  overflow: hidden;
}


/* =========================================================
   TABLE SCROLL AREA

   Vertical + Horizontal scrollbar
========================================================= */

.table-responsive {
  flex: 1 1 auto;

  min-width: 0;
  min-height: 0;

  width: 100%;

  overflow-x: auto;
  overflow-y: auto;

  scrollbar-width: thin;

  scrollbar-color: #aebed3 #f3f7fc;

  -webkit-overflow-scrolling: touch;
}


/* =========================================================
   TABLE
========================================================= */

.modernTable {
  width: 100%;

  min-width: 1450px;

  border-collapse: separate;

  border-spacing: 0;

  font-size: 12px;

  color: #111827;
}


/* =========================================================
   TABLE HEADER
========================================================= */

.modernTable thead {
  position: sticky;

  top: 0;

  z-index: 5;
}


.modernTable thead tr {
  background: linear-gradient(135deg, #0d6efd, #6610f2);
}


.modernTable th {
  height: 40px;

  padding: 7px 12px;

  box-sizing: border-box;

  background: linear-gradient(135deg, #0d6efd, #6610f2);

  color: #ffffff;

  font-size: 10.5px;

  font-weight: 800;

  text-transform: uppercase;

  letter-spacing: 0.25px;

  white-space: nowrap;

  border: none;
}


.modernTable th:first-child {
  border-top-left-radius: 8px;
}


.modernTable th:last-child {
  border-top-right-radius: 8px;
}


/* =========================================================
   TABLE BODY
========================================================= */

.modernTable td {
  height: 42px;

  padding: 6px 12px;

  box-sizing: border-box;

  background: #ffffff;

  color: #111827;

  border-bottom: 1px solid #e9eef5;

  vertical-align: middle;

  white-space: nowrap;

  font-size: 11.5px;

  font-weight: 600;
}


.modernTable tbody tr {
  transition: background 0.15s ease;
}


.modernTable tbody tr:hover td {
  background: #f5f9ff;
}


.modernTable tbody tr:last-child td {
  border-bottom: none;
}


/* =========================================================
   EMPLOYEE ID
========================================================= */

.empIdBox {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  min-width: 52px;

  padding: 4px 8px;

  background: #e8f0ff;

  color: #2563eb;

  border: 1px solid #d6e5ff;

  border-radius: 6px;

  font-size: 10.5px;

  font-weight: 800;
}


/* =========================================================
   NAME
========================================================= */

.nameBox {
  font-weight: 800;

  color: #111827;
}


/* =========================================================
   DEPARTMENT
========================================================= */

.deptBadge {
  display: inline-flex;

  align-items: center;

  padding: 4px 9px;

  background: #e0ecff;

  color: #0d6efd;

  border: 1px solid #cfe0ff;

  border-radius: 20px;

  font-size: 10.5px;

  font-weight: 700;

  white-space: nowrap;
}


/* =========================================================
   STATUS
========================================================= */

.statusBadge {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  min-width: 70px;

  padding: 5px 10px;

  border-radius: 20px;

  font-size: 10.5px;

  font-weight: 800;

  text-transform: capitalize;

  border: none;
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

  color: #d97706;
}


/* =========================================================
   REASON
========================================================= */

.reasonType {
  color: #111827 !important;

  font-size: 11.5px;

  font-weight: 700 !important;
}


.reasonText {
  max-width: 220px;

  margin-top: 2px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  color: #475569 !important;

  font-size: 10.5px;

  font-weight: 600;
}


/* =========================================================
   REJECT REASON
========================================================= */

.rejectReason {
  max-width: 220px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  color: #dc2626 !important;

  font-size: 11px;

  font-weight: 700;
}


/* =========================================================
   DATE / TIME
========================================================= */

.modernTable td:nth-child(5),
.modernTable td:nth-child(7),
.modernTable td:nth-child(9) {
  color: #1e293b;

  font-weight: 700;
}


/* =========================================================
   EMPTY STATE
========================================================= */

.emptyBox {
  min-height: 160px;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 30px 20px;

  box-sizing: border-box;

  color: #64748b;

  font-size: 14px;

  font-weight: 700;
}


/* =========================================================
   PAGINATION
========================================================= */

.paginationWrapper {
  flex: 0 0 auto;

  min-height: 43px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 10px;

  padding: 5px 12px;

  box-sizing: border-box;

  background: #ffffff;

  border-top: 1px solid #e8eef7;
}


.pageBtn {
  height: 30px;

  min-width: 82px;

  padding: 0 14px;

  box-sizing: border-box;

  border: none;

  border-radius: 7px;

  background: linear-gradient(135deg, #0d6efd, #6610f2);

  color: #ffffff;

  font-size: 11px;

  font-weight: 700;

  cursor: pointer;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}


.pageBtn:hover:not(:disabled) {
  transform: translateY(-1px);

  box-shadow: 0 4px 10px rgba(13, 110, 253, 0.22);
}


.pageBtn:disabled {
  opacity: 0.45;

  cursor: not-allowed;

  transform: none;

  box-shadow: none;
}


.pageNumber {
  min-width: 65px;

  padding: 6px 10px;

  box-sizing: border-box;

  text-align: center;

  background: #ffffff;

  color: #111827;

  border: 1px solid #e0e7f0;

  border-radius: 7px;

  font-size: 11px;

  font-weight: 800;
}


/* =========================================================
   TABLE SCROLLBAR
========================================================= */

.table-responsive::-webkit-scrollbar {
  width: 7px;

  height: 7px;
}


.table-responsive::-webkit-scrollbar-track {
  background: #f3f7fc;
}


.table-responsive::-webkit-scrollbar-thumb {
  background: #aebed3;

  border-radius: 10px;
}


.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #8297b2;
}


/* =========================================================
   LAPTOP / 1366 x 768
========================================================= */

@media (max-height: 800px) and (min-width: 901px) {

  .reportPage {
    padding: 8px 12px;

    gap: 6px;
  }


  .topHeader {
    min-height: 52px;

    padding: 7px 13px;
  }


  .pageTitle {
    font-size: 18px;
  }


  .pageSubTitle {
    margin-top: 2px;

    font-size: 10.5px;
  }


  .reportCountBox {
    min-width: 100px;

    padding: 5px 11px;
  }


  .reportCountBox span {
    font-size: 9px;
  }


  .reportCountBox h3 {
    font-size: 18px;
  }


  .filterCard {
    padding: 7px 12px;
  }


  .filterGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));

    gap: 9px;
  }


  .filterItem {
    gap: 3px;
  }


  .filterItem label {
    font-size: 10px;
  }


  .filterItem select {
    height: 32px;

    font-size: 11px;
  }


  .modernTable th {
    height: 35px;

    padding: 5px 9px;

    font-size: 9.5px;
  }


  .modernTable td {
    height: 39px;

    padding: 5px 9px;

    font-size: 11px;
  }


  .paginationWrapper {
    min-height: 39px;

    padding: 4px 10px;
  }


  .pageBtn {
    height: 28px;

    min-width: 72px;

    font-size: 10.5px;
  }


  .pageNumber {
    min-width: 60px;

    font-size: 10.5px;
  }
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 900px) {

  .filterGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }


  .modernTable {
    min-width: 1300px;
  }
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {

  .reportPage {
    padding: 8px;

    gap: 7px;
  }


  .topHeader {
    min-height: 52px;

    padding: 8px 10px;
  }


  .pageTitle {
    font-size: 17px;
  }


  .pageSubTitle {
    font-size: 10px;
  }


  .reportCountBox {
    min-width: 80px;

    padding: 5px 8px;
  }


  .reportCountBox h3 {
    font-size: 16px;
  }


  .filterGrid {
    grid-template-columns: 1fr;

    gap: 7px;
  }


  .filterCard {
    padding: 8px 10px;
  }


  .modernTable {
    min-width: 1200px;
  }
     ` }</style>
    </div>
  );
}

export default ReportTable;
