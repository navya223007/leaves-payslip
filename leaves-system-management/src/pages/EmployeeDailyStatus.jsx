import React, { useEffect, useState } from "react";
import api from "../api"; // adjust path if needed
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";

import {
  FaTasks,
  FaProjectDiagram,
  FaUserTie,
  FaClipboardCheck,
  FaEdit,
  FaArrowLeft,
} from "react-icons/fa";

function EmployeeDailyStatus() {
  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.editData;

  const { user } = useAuth();

  const [employee, setEmployee] = useState({});
 
const [statusDate, setStatusDate] = useState("");
const [serverDate, setServerDate] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedBy, setAssignedBy] = useState("");

  // ✅ BUTTON LOADING ONLY
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  // ================= SERVER DATE =================

useEffect(() => {
  const fetchServerDate = async () => {
    try {
      const response = await api.get("/api/server-time");

      const date = response.data.date;

      setServerDate(date);
      setStatusDate(date);
    } catch (error) {
      console.error("Failed to get server date:", error);
      alert("Unable to get server date. Please try again.");
    }
  };

  fetchServerDate();
}, []);

  // ================= EMPLOYEE =================

  useEffect(() => {
    if (user) {
      setEmployee({
        name: user.name,
        emp_id: user.emp_id,
        department: user.department,
      });
    }
  }, [user]);

  // ================= EDIT DATA =================

useEffect(() => {
  if (editData) {
    setProjectName(editData.project_name || "");
    setDescription(editData.subtask || "");
    setAssignedBy(editData.assigned_by || "");
    setEditId(editData.id);
  }
}, [editData]);

  // ================= SUBMIT =================
// const submitStatus = async () => {
//   if (loading) return;

//   try {
//     if (!projectName || !description || !assignedBy) {
//       alert("Please fill all fields");
//       return;
//     }

//     const wordCount = description.trim().split(/\s+/).length;

//     if (wordCount < 25) {
//       alert("Please describe more. Minimum 25 words required.");
//       return;
//     }

//     const today = new Date().toISOString().split("T")[0];

//     // Only today's date is allowed
//     if (statusDate !== today) {
//       alert("You can submit Daily Status only for today's date.");
//       return;
//     }

//     setLoading(true);

//     if (editId) {
//       await api.put(`/api/daily-status/update/${editId}`, {
//         project_name: projectName,
//         subtask: description,
//         assigned_by: assignedBy,
//         status_date: statusDate,
//       });
//     } else {
//       await api.post("/api/daily-status", {
//         emp_id: user.emp_id,
//         project_name: projectName,
//         subtask: description,
//         assigned_by: assignedBy,
//         status_date: statusDate,
//       });
//     }

//     setProjectName("");
//     setDescription("");
//     setAssignedBy("");
//     setEditId(null);

//     navigate("/employee/daily-status-report");
//   } catch (err) {
//     if (err.response?.status === 400) {
//       alert(err.response.data.message);
//     } else {
//       alert("Server Busy. Please Try Again.");
//     }
//   } finally {
//     setLoading(false);
//   }
// };



const submitStatus = async () => {
  if (loading) return;

  try {
    if (!projectName || !description || !assignedBy) {
      alert("Please fill all fields");
      return;
    }

    const wordCount = description.trim().split(/\s+/).length;

    if (wordCount < 25) {
      alert("Please describe more. Minimum 25 words required.");
      return;
    }

    // ================= SERVER DATE VALIDATION =================

    if (!serverDate || !statusDate) {
      alert("Unable to get server date. Please try again.");
      return;
    }

    setLoading(true);

    // ================= UPDATE =================

    if (editId) {
      await api.put(`/api/daily-status/update/${editId}`, {
        project_name: projectName,
        subtask: description,
        assigned_by: assignedBy,
        status_date: statusDate,
      });
    }

    // ================= NEW STATUS =================

    else {
      await api.post("/api/daily-status", {
        emp_id: user.emp_id,
        project_name: projectName,
        subtask: description,
        assigned_by: assignedBy,
        status_date: statusDate,
      });
    }

    setProjectName("");
    setDescription("");
    setAssignedBy("");
    setEditId(null);

    navigate("/employee/daily-status-report");
  } catch (err) {
    if (err.response?.status === 400) {
      alert(err.response.data.message);
    } else {
      alert("Server Busy. Please Try Again.");
    }
  } finally {
    setLoading(false);
  }
};




  // ================= UI =================

  return (
    <>
      <div className="container-fluid dailyPage p-2 p-md-4">
        {/* ================================================= */}
        {/* TOP HEADER */}
        {/* ================================================= */}

        <div className="dailyHeader card border-0 shadow-lg mb-3">
          <div className="card-body headerBody">
            {/* TOP ACTIONS */}

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              {/* BACK BUTTON */}

              <button className="backBtn" onClick={() => navigate("/employee")}>
                <FaArrowLeft className="me-2" />
                Back To Dashboard
              </button>

              {/* REPORT BUTTON */}

              <button
                className="reportBtn"
                onClick={() => navigate("/employee/daily-status-report")}
              >
                View Reports
              </button>
            </div>

            <div className="row align-items-center g-3">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="headerIcon">
                    <FaTasks />
                  </div>

                  <div>
                    <h2 className="headerTitle mb-1">Employee Daily Status</h2>

                    <p className="headerSubTitle mb-0">
                      Submit daily work updates and project progress
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* INFO CARDS */}
        {/* ================================================= */}

        <div className="row g-3 mb-3">
          {/* EMPLOYEE */}

          <div className="col-lg-4 col-md-6">
            <div className="infoCard greenCard shadow">
              <div className="infoCardBody">
                <div>
                  <h5>Employee</h5>

                  <small>{employee.name || "N/A"}</small>
                </div>

                <FaClipboardCheck size={32} />
              </div>
            </div>
          </div>

          {/* EMPLOYEE ID */}

          <div className="col-lg-4 col-md-6">
            <div className="infoCard blueCard shadow">
              <div className="infoCardBody">
                <div>
                  <h5>Employee ID</h5>

                  <small>{employee.emp_id || "N/A"}</small>
                </div>

                <FaUserTie size={32} />
              </div>
            </div>
          </div>

          {/* DEPARTMENT */}

          <div className="col-lg-4 col-md-12">
            <div className="infoCard purpleCard shadow">
              <div className="infoCardBody">
                <div>
                  <h5>Department</h5>

                  <small>{employee.department || "N/A"}</small>
                </div>

                <FaProjectDiagram size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <div className="card formCard border-0 shadow-lg">
          <div className="card-body p-3 p-md-4">
            {/* TITLE */}

            <div className="d-flex align-items-center gap-2 mb-4">
              <div className="editIcon">
                <FaEdit />
              </div>

              <div>
                <h4 className="fw-bold mb-0">
                  {editId ? "Edit Daily Status" : "Submit Daily Status"}
                </h4>

                <small className="subText">
                  Fill all required work details properly
                </small>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label customLabel">Status Date</label>
<input
  type="date"
  value={statusDate}
  readOnly
  disabled
  className="form-control customInput"
/>
            </div>

            {/* PROJECT */}

            <div className="mb-4">
              <label className="form-label customLabel">Project Name</label>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="form-control customInput"
                placeholder="Enter project name"
              />
            </div>

            {/* ASSIGNED BY */}

            <div className="mb-4">
              <label className="form-label customLabel">Task Assigned By</label>

              <input
                type="text"
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
                className="form-control customInput"
                placeholder="Enter manager / lead name"
              />
            </div>

            {/* DESCRIPTION */}

            <div className="mb-4">
              <label className="form-label customLabel">Work Description</label>

              <textarea
                rows="7"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-control customInput"
                placeholder="Write detailed work update here..."
                style={{
                  resize: "none",
                }}
              ></textarea>

              <div className="d-flex justify-content-between mt-2 flex-wrap gap-2">
                <small className="subText">Minimum 25 words required</small>

                <small
                  className={`fw-bold ${
                    description.trim().split(/\s+/).length >= 25
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  Words :
                  {description.trim()
                    ? description.trim().split(/\s+/).length
                    : 0}
                </small>
              </div>
            </div>

            {/* BUTTON */}

            <div className="text-end">
              <button
                type="button"
                onClick={submitStatus}
                className={`submitBtn ${editId ? "updateBtn" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  ></span>
                ) : editId ? (
                  "Update Status"
                ) : (
                  "Submit Status"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* CSS */}
      {/* ================================================= */}

      <style>{`

/* =====================================================
   GLOBAL
===================================================== */

html,
body{
  overflow-x:hidden;
}

*{
  box-sizing:border-box;
}

.dailyPage{
  min-height:100vh;
  transition:0.3s ease;
}

/* =====================================================
   LIGHT MODE
===================================================== */

.bg-light .dailyPage{
  background:#f1f5f9 !important;
}

.bg-light .formCard{
  background:#ffffff !important;
  border:1px solid #e5e7eb !important;
}

.bg-light .formCard *{
  color:#111827;
}

.bg-light .customInput{
  background:#f8fbff !important;
  color:#111827 !important;
  border:1px solid #dbeafe !important;
}

.bg-light .customInput::placeholder{
  color:#6b7280;
}

.bg-light .subText{
  color:#6b7280 !important;
}

/* =====================================================
   DARK MODE
===================================================== */

.bg-dark .dailyPage{
  background:#0f172a !important;
}

.bg-dark .formCard{
  background:#111827 !important;
  border:1px solid #374151 !important;
}

.bg-dark .formCard h4,
.bg-dark .formCard label,
.bg-dark .formCard small,
.bg-dark .formCard div,
.bg-dark .formCard span,
.bg-dark .customLabel{
  color:#f9fafb !important;
}

.bg-dark .customInput{
  background:#1e293b !important;
  color:#ffffff !important;
  border:1px solid #475569 !important;
}

.bg-dark .customInput::placeholder{
  color:#cbd5e1;
}

.bg-dark .customInput:focus{
  box-shadow:none !important;
  border-color:#60a5fa !important;
}

.bg-dark .subText{
  color:#cbd5e1 !important;
}

/* =====================================================
   HEADER
===================================================== */

.dailyHeader{
  border-radius:22px;
  overflow:hidden;

  background:linear-gradient(
    135deg,
    #2563eb,
    #1d4ed8,
    #4f46e5
  ) !important;
}

.headerBody{
  background:transparent !important;
  padding:22px !important;
}

.dailyHeader *{
  color:#ffffff !important;
}

.headerIcon{
  width:70px;
  height:70px;

  border-radius:50%;

  background:rgba(255,255,255,0.2);

  display:flex;
  align-items:center;
  justify-content:center;

  font-size:28px;

  flex-shrink:0;
}

.headerTitle{
  font-size:28px;
  font-weight:800;
}

.headerSubTitle{
  font-size:14px;
  opacity:0.95;
}

/* =====================================================
   TOP BUTTONS
===================================================== */

.backBtn,
.reportBtn{
  border:none;

  padding:10px 18px;

  border-radius:14px;

  font-weight:700;

  transition:0.3s ease;

  display:flex;
  align-items:center;
  justify-content:center;

  min-width:170px;
}

.backBtn{
  background:rgba(255,255,255,0.22) !important;
  color:#ffffff !important;

  border:1px solid rgba(255,255,255,0.35);
}

.reportBtn{
  background:#ffffff !important;
  color:#2563eb !important;

  border:1px solid #ffffff;
}

.backBtn:hover,
.reportBtn:hover{
  transform:translateY(-2px);
}

.bg-dark .backBtn{
  background:rgba(255,255,255,0.18) !important;
  color:#ffffff !important;
}

.bg-dark .reportBtn{
  background:#ffffff !important;
  color:#2563eb !important;
}

/* =====================================================
   INFO CARDS
===================================================== */

.infoCard{
  border-radius:22px;
  overflow:hidden;
  height:100%;
}

.infoCardBody{
  padding:24px;

  display:flex;
  justify-content:space-between;
  align-items:center;

  color:#ffffff;
}

.infoCardBody h5{
  font-weight:700;
  margin-bottom:6px;
}

.greenCard{
  background:linear-gradient(135deg,#198754,#28c76f);
}

.blueCard{
  background:linear-gradient(135deg,#0d6efd,#36a2ff);
}

.purpleCard{
  background:linear-gradient(135deg,#6f42c1,#9b6dff);
}

/* =====================================================
   FORM
===================================================== */

.formCard{
  border-radius:24px;
}

.editIcon{
  width:45px;
  height:45px;

  border-radius:50%;

  display:flex;
  align-items:center;
  justify-content:center;

  background:#e0ecff;
  color:#2563eb;

  font-size:18px;
}

.customLabel{
  font-weight:700;
  margin-bottom:10px;
}

.customInput{
  border-radius:16px !important;
  padding:14px 16px !important;
  font-size:15px !important;
}

.customInput:focus{
  box-shadow:none !important;
}

/* =====================================================
   BUTTON
===================================================== */

.submitBtn{
  border:none;

  background:linear-gradient(
    135deg,
    #2563eb,
    #1d4ed8
  );

  color:#ffffff !important;

  padding:13px 28px;

  border-radius:16px;

  font-weight:700;

  transition:0.3s ease;

  min-width:180px;

  height:52px;

  display:inline-flex;
  align-items:center;
  justify-content:center;
}

.submitBtn:hover{
  transform:translateY(-2px);
}

.submitBtn:disabled{
  opacity:0.85;
  cursor:not-allowed;
}

.updateBtn{
  background:linear-gradient(
    135deg,
    #f59e0b,
    #d97706
  ) !important;
}

/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width:768px){

  .dailyPage{
    padding-top:10px !important;
  }

  .headerBody{
    padding:18px !important;
  }

  .headerIcon{
    width:58px;
    height:58px;
    font-size:22px;
  }

  .headerTitle{
    font-size:22px;
  }

  .headerSubTitle{
    font-size:12px;
  }

  .infoCardBody{
    padding:18px;
  }

  .customInput{
    padding:12px 14px !important;
  }
}

@media (max-width:576px){

  .dailyPage{
    padding-left:6px !important;
    padding-right:6px !important;
  }

  .dailyHeader{
    border-radius:18px;
  }

  .headerBody{
    padding:15px !important;
  }

  .headerIcon{
    width:50px;
    height:50px;
    font-size:18px;
  }

  .headerTitle{
    font-size:18px;
  }

  .headerSubTitle{
    font-size:11px;
  }

  .submitBtn{
    width:100%;
  }

  .backBtn,
  .reportBtn{
    width:100%;
  }
}

      `}</style>
    </>
  );
}

export default EmployeeDailyStatus;
