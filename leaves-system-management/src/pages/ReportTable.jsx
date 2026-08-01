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

      <style>{`
/* ================= GLOBAL PAGE ================= */

.reportPage{
  min-height:100vh;
  padding:24px;
  background:linear-gradient(135deg,#eef4ff,#f8fbff,#edf2ff);
  width:100%;
  overflow-x:hidden;
}

/* ================= DARK MODE PAGE ================= */

.bg-dark .reportPage{
  background:linear-gradient(135deg,#0f172a,#111827,#1e293b);
}

/* ================= TOP HEADER ================= */

.topHeader{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:18px;
  flex-wrap:wrap;
  margin-bottom:24px;
}

.pageTitle{
  margin:0;
  font-size:32px;
  font-weight:800;
  color:#0f172a;
}

.pageSubTitle{
  margin-top:6px;
  color:#475569;
  font-size:14px;
  font-weight:500;
}

.bg-dark .pageTitle{
  color:#ffffff;
}

.bg-dark .pageSubTitle{
  color:#cbd5e1;
}

/* ================= REPORT COUNT ================= */

.reportCountBox{
  background:linear-gradient(135deg,#0d6efd,#6610f2);
  color:#fff;
  padding:18px 22px;
  border-radius:18px;
  min-width:180px;
  text-align:center;
  box-shadow:0 12px 30px rgba(13,110,253,0.25);
}

.reportCountBox span{
  font-size:13px;
  opacity:0.9;
}

.reportCountBox h3{
  margin:5px 0 0;
  font-size:30px;
  font-weight:800;
}

/* ================= FILTER CARD ================= */

.filterCard{
  background:#ffffff;
  border-radius:24px;
  padding:22px;
  margin-bottom:24px;
  box-shadow:0 10px 30px rgba(0,0,0,0.06);
}

.bg-dark .filterCard{
  background:#1e293b;
  border:1px solid #334155;
  box-shadow:none;
}

/* ================= FILTER GRID ================= */

.filterGrid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
}

/* ================= FILTER ITEM ================= */

.filterItem{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.filterItem label{
  font-size:14px;
  font-weight:700;
  color:#1e293b;
}

.bg-dark .filterItem label{
  color:#f8fafc;
}

/* ================= SELECT BOX ================= */

.filterItem select{
  height:50px;
  border-radius:14px;
  border:1px solid #dbeafe;
  background:#f8fbff;
  padding:0 14px;
  font-size:14px;
  font-weight:600;
  color:#111827;
  outline:none;
  transition:0.25s;
}

.filterItem select:focus{
  border-color:#0d6efd;
  box-shadow:0 0 0 4px rgba(13,110,253,0.12);
}

/* DARK MODE SELECT */

.bg-dark .filterItem select{
  background:#0f172a;
  border:1px solid #334155;
  color:#ffffff;
}

.bg-dark .filterItem select option{
  background:#111827;
  color:#ffffff;
}

/* ================= TABLE CARD ================= */

.tableCard{
  background:#ffffff;
  border-radius:24px;
  overflow:hidden;
  box-shadow:0 12px 30px rgba(0,0,0,0.06);
}

.bg-dark .tableCard{
  background:#1e293b;
  border:1px solid #334155;
  box-shadow:none;
}

/* ================= TABLE ================= */

.table-responsive{
  width:100%;
  overflow-x:auto;
}

.modernTable{
  width:100%;
  min-width:1450px;
  border-collapse:separate;
  border-spacing:0 8px;
  padding:0 10px 10px;
}

/* ================= TABLE HEAD ================= */

.modernTable thead tr{
  background:linear-gradient(135deg,#0d6efd,#6610f2);
}

.modernTable th{
  padding:18px 14px;
  font-size:13px;
  font-weight:800;
  color:#ffffff;
  border:none;
  white-space:nowrap;
}

.modernTable th:first-child{
  border-top-left-radius:16px;
  border-bottom-left-radius:16px;
}

.modernTable th:last-child{
  border-top-right-radius:16px;
  border-bottom-right-radius:16px;
}

/* ================= TABLE BODY ================= */

.modernTable td{
  background:#ffffff;
  padding:16px 14px;
  border:none;
  vertical-align:middle;
  white-space:nowrap;
  font-size:13px;
  color:#111827;
  font-weight:600;
}

.bg-dark .modernTable td{
  background:#111827;
  color:#f8fafc;
}

.modernTable tbody tr td:first-child{
  border-top-left-radius:16px;
  border-bottom-left-radius:16px;
}

.modernTable tbody tr td:last-child{
  border-top-right-radius:16px;
  border-bottom-right-radius:16px;
}

/* ================= ROW HOVER ================= */

.modernTable tbody tr{
  transition:0.2s ease;
}

.modernTable tbody tr:hover td{
  background:#f8fbff;
}

.bg-dark .modernTable tbody tr:hover td{
  background:#172033;
}

/* ================= TEXT COLORS ================= */

.empIdBox{
  color:#2563eb;
  font-weight:800;
}

.nameBox{
  color:#111827;
  font-weight:800;
}

.bg-dark .nameBox{
  color:#ffffff;
}

/* ================= BADGES ================= */

.deptBadge{
  background:#e0ecff;
  color:#0d6efd;
  padding:6px 12px;
  border-radius:30px;
  font-size:12px;
  font-weight:700;
}

.statusBadge{
  padding:7px 14px;
  border-radius:30px;
  font-size:12px;
  font-weight:800;
  text-transform:capitalize;
}

.statusApproved{
  background:#dcfce7;
  color:#15803d;
}

.statusRejected{
  background:#fee2e2;
  color:#dc2626;
}

.statusPending{
  background:#fef3c7;
  color:#d97706;
}

/* ================= REASON ================= */

.reasonType{
  color:#111827 !important;
  font-weight:700 !important;
}

.reasonText{
  color:#475569 !important;
  font-size:12px;
  font-weight:600;
}

.rejectReason{
  color:#dc2626 !important;
  font-weight:700;
  max-width:220px;
  white-space:normal;
  line-height:1.5;
}

.bg-dark .reasonType{
  color:#ffffff !important;
}

.bg-dark .reasonText{
  color:#cbd5e1 !important;
}

.bg-dark .rejectReason{
  color:#f87171 !important;
}

/* ================= DATE & TIME ================= */

.modernTable td:nth-child(5),
.modernTable td:nth-child(7),
.modernTable td:nth-child(9){
  color:#1e293b;
  font-weight:700;
}

.bg-dark .modernTable td:nth-child(5),
.bg-dark .modernTable td:nth-child(7),
.bg-dark .modernTable td:nth-child(9){
  color:#f1f5f9;
}

/* ================= EMPTY ================= */

.emptyBox{
  padding:50px 20px;
  text-align:center;
  font-size:16px;
  font-weight:700;
  color:#64748b;
}

.bg-dark .emptyBox{
  color:#cbd5e1;
}

/* ================= PAGINATION ================= */

.paginationWrapper{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:12px;
  margin-top:24px;
  flex-wrap:wrap;
}

.pageBtn{
  border:none;
  background:linear-gradient(135deg,#0d6efd,#6610f2);
  color:#fff;
  padding:11px 18px;
  border-radius:14px;
  font-size:13px;
  font-weight:700;
  min-width:110px;
  transition:0.2s;
}

.pageBtn:hover{
  transform:translateY(-2px);
}

.pageBtn:disabled{
  opacity:0.5;
}

.pageNumber{
  background:#ffffff;
  color:#111827;
  padding:10px 16px;
  border-radius:12px;
  font-size:14px;
  font-weight:800;
  box-shadow:0 4px 12px rgba(0,0,0,0.06);
}

.bg-dark .pageNumber{
  background:#1e293b;
  color:#ffffff;
}

/* ================= RESPONSIVE ================= */

@media(max-width:992px){

  .filterGrid{
    grid-template-columns:repeat(2,1fr);
  }

  .pageTitle{
    font-size:26px;
  }

  .modernTable{
    min-width:1300px;
  }
}

@media(max-width:768px){

  .reportPage{
    padding:14px;
  }

  .topHeader{
    flex-direction:column;
    align-items:stretch;
  }

  .reportCountBox{
    width:100%;
  }

  .filterGrid{
    grid-template-columns:1fr;
  }

  .pageTitle{
    font-size:22px;
  }

  .modernTable{
    min-width:1200px;
  }

  .pageBtn{
    min-width:90px;
    padding:9px 12px;
    font-size:12px;
  }
}

@media(max-width:480px){

  .paginationWrapper{
    flex-direction:column;
  }

  .pageBtn,
  .pageNumber{
    width:100%;
    text-align:center;
  }
}`}</style>
    </div>
  );
}

export default ReportTable;
