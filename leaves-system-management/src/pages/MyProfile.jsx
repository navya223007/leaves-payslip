import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaEye,
  FaEdit,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

function MyProfile() {
  const [employee, setEmployee] = useState(null);

  const [loading, setLoading] = useState(true);

  //   const empId = localStorage.getItem("emp_id");
  const { user } = useAuth();

  const empId = user?.emp_id;

  const [selectedEmp, setSelectedEmp] = useState(null);

  const [showAppraisal, setShowAppraisal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        if (!empId) {
          console.log("No emp_id found");
          setLoading(false);
          return;
        }

        const res = await api.get(`/api/personal-details/${empId}`);

        console.log("Employee Data:", res.data);

        setEmployee(res.data);
      } catch (err) {
        console.log(err);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [empId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const handleView = (emp) => {
    console.log("Navigate to:", `/employee/my-details/read/${emp.emp_id}`);
    navigate(`/employee/my-details/read/${emp.emp_id}`);
  };

  const handleEdit = (emp) => {
    navigate(`/employee/my-details/edit/${emp.emp_id}`);
  };

  // const handleDownload = () => {
  //   if (!empId) return;

  //   window.open(
  //     `${api.defaults.baseURL}/api/download-employee/${empId}`,
  //     "_blank",
  //   );
  // };

const handleDownload = async () => {
  try {
    const response = await api.get(
      `/api/download-employee/${empId}`,
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(response.data);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${empId}.zip`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response && error.response.data) {
      const text = await error.response.data.text();
      const json = JSON.parse(text);

      alert(json.message);
    } else {
      alert("Download Failed");
    }
  }
};

  return (
    <>
      <div className="container-fluid px-0 py-2">
        <div className="card shadow-lg border-0 profileCard">
          <div className="card-body p-3 p-md-4">
            {/* HEADER */}

            <div className="profileHeader mb-4">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="profileAvatar">
                    {employee?.emp_name?.charAt(0) || "E"}
                  </div>

                  <div>
                    <h3 className="mb-1 fw-bold profileTitle">My Profile</h3>

                    <p className="profileSubTitle mb-0">
                      Employee Personal Details
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-success downloadBtn"
                  onClick={handleDownload}
                >
                  <FaDownload />
                  Download
                </button>
              </div>
            </div>

            {/* TABLE */}

            <div className="table-responsive profileTableWrapper">
              <table className="table align-middle mb-0 profileTable">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>DOB</th>
                    <th>DOJ</th>
                    <th>Aadhaar</th>
                    <th>Aadhaar File</th>
                    <th>PAN</th>
                    <th>PAN File</th>
                    <th>Bank</th>
                    <th>Bank File</th>
                    <th>IFSC</th>
                    <th>Actions</th>
                    <th>Appraisal</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="12" className="text-center py-5">
                        Loading...
                      </td>
                    </tr>
                  ) : employee ? (
                    <tr>
                      {/* EMPLOYEE */}

                      <td className="minCell">
                        <div className="d-flex align-items-center gap-2 employeeBox">
                          <div className="employeeAvatar">
                            {employee?.emp_name?.charAt(0) || "E"}
                          </div>

                          <div>
                            <div className="fw-bold text-nowrap employeeName">
                              {employee.emp_name}
                            </div>

                            <small className="employeeId">
                              {employee.emp_id}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* DOB */}

                      <td className="text-nowrap">
                        {formatDate(employee.date_of_birth)}
                      </td>

                      {/* DOJ */}

                      <td className="text-nowrap">
                        {formatDate(employee.date_of_joining)}
                      </td>

                      {/* AADHAAR */}

                      <td className="minCell">
                        {employee.aadhaar_number ? (
                          <span className="text-success fw-semibold small">
                            <FaCheckCircle className="me-1" />
                            {employee.aadhaar_number}
                          </span>
                        ) : (
                          <span className="text-danger fw-semibold small">
                            <FaTimesCircle className="me-1" />
                            Not Added
                          </span>
                        )}
                      </td>

                      {/* AADHAAR FILE */}

                      <td className="minCell">
                        {employee.aadhaar_file ? (
                          <div className="d-flex flex-column gap-2">
                            <img
                              src={`${api.defaults.baseURL}/uploads/aadhaar/${employee.aadhaar_file}`}
                              alt="aadhaar"
                              className="img-thumbnail fileImage"
                              onClick={() =>
                                window.open(
                                  `${api.defaults.baseURL}/uploads/aadhaar/${employee.aadhaar_file}`,
                                  "_blank",
                                )
                              }
                            />

                            <a
                              href={`${api.defaults.baseURL}/api/download-file/aadhaar/${employee.aadhaar_file}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-danger small">No File ❌</span>
                        )}
                      </td>

                      {/* PAN */}

                      <td className="minCell">
                        {employee.pan_number ? (
                          <span className="text-success fw-semibold small">
                            <FaCheckCircle className="me-1" />
                            {employee.pan_number}
                          </span>
                        ) : (
                          <span className="text-danger fw-semibold small">
                            <FaTimesCircle className="me-1" />
                            Not Added
                          </span>
                        )}
                      </td>

                      {/* PAN FILE */}

                      <td className="minCell">
                        {employee.pan_file ? (
                          <div className="d-flex flex-column gap-2">
                            <img
                              src={`${api.defaults.baseURL}/uploads/pan/${employee.pan_file}`}
                              alt="pan"
                              className="img-thumbnail fileImage"
                              onClick={() =>
                                window.open(
                                  `${api.defaults.baseURL}/uploads/pan/${employee.pan_file}`,
                                  "_blank",
                                )
                              }
                            />

                            <a
                              href={`${api.defaults.baseURL}/api/download-file/pan/${employee.pan_file}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-danger small">No File ❌</span>
                        )}
                      </td>

                      {/* BANK */}

                      <td className="minCell">
                        {employee.bank_account_number ? (
                          <span className="text-success fw-semibold small">
                            <FaCheckCircle className="me-1" />
                            {employee.bank_account_number}
                          </span>
                        ) : (
                          <span className="text-danger fw-semibold small">
                            <FaTimesCircle className="me-1" />
                            Not Added
                          </span>
                        )}
                      </td>

                      {/* BANK FILE */}

                      <td className="minCell">
                        {employee.bank_file ? (
                          <div className="d-flex flex-column gap-2">
                            <img
                              src={`${api.defaults.baseURL}/uploads/bank/${employee.bank_file}`}
                              alt="bank"
                              className="img-thumbnail fileImage"
                              onClick={() =>
                                window.open(
                                  `${api.defaults.baseURL}/uploads/bank/${employee.bank_file}`,
                                  "_blank",
                                )
                              }
                            />

                            <a
                              href={`${api.defaults.baseURL}/api/download-file/bank/${employee.bank_file}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-danger small">No File ❌</span>
                        )}
                      </td>

                      {/* IFSC */}

                      <td className="minCell">
                        {employee.ifsc_code ? (
                          <span className="text-success fw-semibold small">
                            <FaCheckCircle className="me-1" />
                            {employee.ifsc_code}
                          </span>
                        ) : (
                          <span className="text-danger fw-semibold small">
                            <FaTimesCircle className="me-1" />
                            Not Added
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="minCell">
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            className="btn btn-info btn-sm text-white"
                            onClick={() => handleView(employee)}
                          >
                            <FaEye />
                          </button>

                          <button
                            className="btn btn-warning btn-sm text-white"
                            onClick={() => handleEdit(employee)}
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </td>

                      {/* APPRAISAL */}

                      <td className="minCell">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedEmp(employee);
                            setShowAppraisal(true);
                          }}
                        >
                          Appraisal
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center py-5">
                        No Employee Data Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* APPRAISAL MODAL */}

      {showAppraisal && selectedEmp && (
        <div
          className="modal fade show d-block appraisalModal"
          style={{
            background: "rgba(15,23,42,.65)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content appraisalContent">
              {/* HEADER */}

              <div className="modal-header appraisalHeader">
                <h5 className="modal-title mb-0">Employee Appraisal</h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAppraisal(false);
                    setSelectedEmp(null);
                  }}
                ></button>
              </div>

              {/* BODY */}

              <div className="modal-body">
                {/* Employee */}

                <div className="employeeProfileCard mb-4">
                  <div className="employeeAvatarSmall">
                    {selectedEmp.emp_name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="employeeInfo">
                    <h6 className="mb-1 fw-bold">{selectedEmp.emp_name}</h6>

                    <small>{selectedEmp.emp_id}</small>
                  </div>
                </div>

                {/* Appraisal */}

                <div className="row g-3">
                  <div className="col-12 col-sm-4">
                    <div className="appraisalInfoCard joinCard">
                      <div className="cardTitle">Joining Date</div>

                      <div className="cardValue">
                        {formatDate(selectedEmp.date_of_joining)}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div className="appraisalInfoCard lastCard">
                      <div className="cardTitle">Last Appraisal</div>

                      <div className="cardValue">
                        {formatDate(selectedEmp.last_appraisal_date)}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div className="appraisalInfoCard nextCard">
                      <div className="cardTitle">Next Appraisal</div>

                      <div className="cardValue">
                        {formatDate(selectedEmp.next_appraisal_date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="modal-footer border-0 pt-2">
                <button
                  className="btn btn-primary px-4"
                  onClick={() => {
                    setShowAppraisal(false);
                    setSelectedEmp(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}

      <style>{`
/* =========================================================
   GLOBAL
========================================================= */

html,
body{
  overflow-x:hidden;
}

*{
  box-sizing:border-box;
}

/* =========================================================
   LIGHT MODE
========================================================= */

.bg-light{
  background:#f3f4f6 !important;
  color:#111827 !important;
}

.bg-light .profileCard{
  background:#ffffff !important;
  border:1px solid #e5e7eb !important;
  color:#111827 !important;
}

.bg-light .card-body{
  background:#ffffff !important;
  color:#111827 !important;
}

/* TEXT */

.bg-light .profileTitle,
.bg-light .employeeName,
.bg-light td,
.bg-light h1,
.bg-light h2,
.bg-light h3,
.bg-light h4,
.bg-light h5,
.bg-light h6,
.bg-light span,
.bg-light div,
.bg-light p{
  color:#111827 !important;
}

.bg-light .employeeId,
.bg-light .profileSubTitle{
  color:#6b7280 !important;
}

/* TABLE HEADER */

.bg-light .profileTable thead{
  background:linear-gradient(
    135deg,
    #2563eb,
    #3b82f6
  ) !important;
}

.bg-light .profileTable thead tr{
  background:transparent !important;
}

.bg-light .profileTable thead th{
  background:transparent !important;
  color:#ffffff !important;
  border:none !important;
  font-weight:700;
}

/* TABLE BODY */

.bg-light .profileTable tbody tr{
  background:#ffffff !important;
}

.bg-light .profileTable tbody td{
  background:#ffffff !important;
  color:#111827 !important;
  border-color:#e5e7eb !important;
}

.bg-light .profileTable tbody tr:hover td{
  background:#f8fafc !important;
}

/* MODAL */

.bg-light .modal-content{
  background:#ffffff !important;
  color:#111827 !important;
}

/* =========================================================
   DARK MODE
========================================================= */

.bg-dark{
  background:#0f172a !important;
  color:#f9fafb !important;
}

.bg-dark .profileCard{
  background:#111827 !important;
  border:1px solid #374151 !important;
  color:#f9fafb !important;
}

.bg-dark .card-body{
  background:#111827 !important;
  color:#f9fafb !important;
}

.bg-dark .profileTitle,
.bg-dark .employeeName,
.bg-dark td,
.bg-dark h1,
.bg-dark h2,
.bg-dark h3,
.bg-dark h4,
.bg-dark h5,
.bg-dark h6,
.bg-dark span,
.bg-dark div,
.bg-dark p{
  color:#f9fafb !important;
}

.bg-dark .employeeId,
.bg-dark .profileSubTitle{
  color:#cbd5e1 !important;
}

/* TABLE HEADER */

.bg-dark .profileTable thead{
  background:linear-gradient(
    135deg,
    #1e3a8a,
    #2563eb
  ) !important;
}

.bg-dark .profileTable thead tr{
  background:transparent !important;
}

.bg-dark .profileTable thead th{
  background:transparent !important;
  color:#ffffff !important;
  border:none !important;
  font-weight:700;
}

/* TABLE BODY */

.bg-dark .profileTable tbody tr{
  background:#111827 !important;
}

.bg-dark .profileTable tbody td{
  background:#111827 !important;
  color:#f9fafb !important;
  border-color:#374151 !important;
}

.bg-dark .profileTable tbody tr:hover td{
  background:#1f2937 !important;
}

.bg-dark .modal-content{
  background:#111827 !important;
  color:#f9fafb !important;
}

.bg-dark .btn-close{
  filter:invert(1);
}

/* =========================================================
   CARD
========================================================= */

.profileCard{
  border-radius:22px;
  overflow:hidden;
  transition:0.3s ease;
}

.profileCard:hover{
  transform:translateY(-2px);
}

/* =========================================================
   HEADER
========================================================= */

.profileHeader{
  padding-bottom:18px;
  border-bottom:1px solid rgba(148,163,184,0.2);
}

.profileAvatar{
  width:65px;
  height:65px;
  border-radius:50%;
  background:linear-gradient(135deg,#0d6efd,#2563eb);
  color:#ffffff !important;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:26px;
  font-weight:800;
  flex-shrink:0;
}

/* =========================================================
   TABLE
========================================================= */

.profileTableWrapper{
  width:100%;
  overflow-x:auto;
}

.profileTable{
  width:100%;
  min-width:1200px;
}

.profileTable th{
  white-space:nowrap;
  font-size:14px;
  padding:15px 12px;
}

.profileTable td{
  padding:14px 12px;
  vertical-align:middle;
}

/* =========================================================
   EMPLOYEE
========================================================= */

.employeeBox{
  min-width:180px;
}

.employeeAvatar{
  width:42px;
  height:42px;
  border-radius:50%;
  background:linear-gradient(135deg,#0d6efd,#2563eb);
  color:#ffffff !important;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
}

.largeAvatar{
  width:70px;
  height:70px;
  border-radius:50%;
  background:linear-gradient(135deg,#0d6efd,#2563eb);
  color:#ffffff !important;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
  font-weight:bold;
}

/* =========================================================
   FILE IMAGE
========================================================= */

.fileImage{
  width:70px;
  height:70px;
  object-fit:cover;
  cursor:pointer;
  border-radius:10px;
  transition:0.3s ease;
}

.fileImage:hover{
  transform:scale(1.05);
}

/* =========================================================
   BUTTONS
========================================================= */

.profileTable .btn,
.downloadBtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  font-weight:600;
  transition:0.3s ease;
}

.profileTable .btn:hover,
.downloadBtn:hover{
  transform:translateY(-2px);
}

/*==================================
 APPRAISAL MODAL
==================================*/

.appraisalContent{
    border:none;
    border-radius:18px;
    overflow:hidden;
}

/* Header */

.appraisalHeader{
    background:linear-gradient(135deg,#2563eb,#3b82f6);
    color:#fff;
    border:none;
    padding:16px 20px;
}

.bg-dark .appraisalHeader{
    background:linear-gradient(135deg,#1d4ed8,#1e3a8a);
}

.bg-dark .btn-close{
    filter:invert(1);
}

/* Employee */

.employeeProfileCard{
    display:flex;
    align-items:center;
    gap:14px;
    padding:14px;
    border-radius:14px;
    background:#f8fafc;
}

.bg-dark .employeeProfileCard{
    background:#1e293b;
}

.employeeAvatarSmall{
    width:52px;
    height:52px;
    border-radius:50%;
    background:linear-gradient(135deg,#2563eb,#3b82f6);
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:22px;
    font-weight:700;
    flex-shrink:0;
}

.employeeInfo h6{
    margin:0;
    color:#111827;
    font-size:16px;
}

.employeeInfo small{
    color:#6b7280;
}

.bg-dark .employeeInfo h6{
    color:#fff;
}

.bg-dark .employeeInfo small{
    color:#cbd5e1;
}

/* Cards */

.appraisalInfoCard{
    padding:18px 15px;
    border-radius:14px;
    text-align:center;
    color:#fff;
    transition:.3s;
    height:100%;
}

.appraisalInfoCard:hover{
    transform:translateY(-4px);
}

.joinCard{
    background:linear-gradient(135deg,#2563eb,#3b82f6);
}

.lastCard{
    background:linear-gradient(135deg,#f59e0b,#d97706);
}

.nextCard{
    background:linear-gradient(135deg,#10b981,#059669);
}

.cardTitle{
    font-size:13px;
    opacity:.9;
    margin-bottom:8px;
}

.cardValue{
    font-size:15px;
    font-weight:700;
}

/* Footer */

.modal-footer{
    background:transparent;
}

.bg-dark .modal-content{
    background:#111827;
    color:#fff;
}

/* Mobile */

@media(max-width:576px){

    .modal-dialog{
        margin:.75rem;
    }

    .appraisalHeader{
        padding:14px 16px;
    }

    .employeeProfileCard{
        padding:12px;
        gap:10px;
    }

    .employeeAvatarSmall{
        width:44px;
        height:44px;
        font-size:18px;
    }

    .employeeInfo h6{
        font-size:14px;
    }

    .employeeInfo small{
        font-size:12px;
    }

    .appraisalInfoCard{
        padding:14px;
    }

    .cardTitle{
        font-size:12px;
    }

    .cardValue{
        font-size:14px;
    }

    .modal-footer .btn{
        width:100%;
    }
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media(max-width:768px){

  .profileTable{
    min-width:900px;
  }

  .profileTable th,
  .profileTable td{
    font-size:12px;
    padding:10px 8px;
  }

  .fileImage{
    width:50px;
    height:50px;
  }
}
      `}</style>
    </>
  );
}

export default MyProfile;
