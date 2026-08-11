import React, { useEffect, useMemo, useState } from "react";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  // FaFileExport,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import api from "../api";
function PersonalDetailsList() {
  const [employees, setEmployees] = useState([]);

  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [showAppraisal, setShowAppraisal] = useState(false);

  const [selectedEmp, setSelectedEmp] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    const date = new Date(dateStr);

    return date.toLocaleDateString("en-GB");
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/personal-details");
      setEmployees(res.data);
    } catch (error) {
      console.log("Fetch Employees Error:", error);
    }
  };
  // =========================================
  // FILTER
  // =========================================

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const searchText = search.toLowerCase();

      const empName = (emp.emp_name || "").toLowerCase();

      const empId = (emp.emp_id || "").toLowerCase();

      const pan = (emp.pan_number || "").toLowerCase();

      const aadhaar = (emp.aadhaar_number || "").toLowerCase();

      const ifsc = (emp.ifsc_code || "").toLowerCase();

      const bank = (emp.bank_account_number || "").toLowerCase();

      const dob = emp.date_of_birth
        ? formatDate(emp.date_of_birth).toLowerCase()
        : "";

      const doj = emp.date_of_joining
        ? formatDate(emp.date_of_joining).toLowerCase()
        : "";

      const matchesSearch =
        empName.includes(searchText) ||
        empId.includes(searchText) ||
        pan.includes(searchText) ||
        aadhaar.includes(searchText) ||
        ifsc.includes(searchText) ||
        bank.includes(searchText) ||
        dob.includes(searchText) ||
        doj.includes(searchText);

      const matchesDropdown =
        selectedEmployee === "" || emp.emp_id === selectedEmployee;

      return matchesSearch && matchesDropdown;
    });
  }, [employees, search, selectedEmployee]);
  // =========================================
  // ACTIONS
  // =========================================

  const handleView = (emp) => {
    navigate(`/admin/employee-details/read/${emp.emp_id}`);
  };

  const handleEdit = (emp) => {
    navigate(`/admin/employee-details/edit/${emp.emp_id}`);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure want to delete employee?",
    );

    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/api/personal-details/${id}`);
      const data = res.data;

      alert(data.message);

      fetchEmployees();
    } catch (error) {
      console.log(error);
    }
  };

const handleDownload = async (emp) => {
  try {
    const response = await api.get(
      `/api/download-employee/${emp.emp_id}`,
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(response.data);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${emp.emp_id}.zip`;

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
      alert("Download failed");
    }
  }
};
  // // EXPORT ALL
  // const handleExportAll = () => {
  //   window.open(
  //     `${api.defaults.baseUR}/api/export-all-personal-details`,
  //     "_blank",
  //   );
  // };

  // DOWNLOAD ALL FILES
// DOWNLOAD ALL FILES
const handleDownloadAllFiles = async () => {
  try {
    const response = await api.get("/api/download-all-personal-files", {
      responseType: "blob",
      validateStatus: () => true,
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers["content-type"]);

    // Backend returned JSON (error message)
    if (
      response.headers["content-type"] &&
      response.headers["content-type"].includes("application/json")
    ) {
      const text = await response.data.text();
      const json = JSON.parse(text);

      alert(json.message);
      return;
    }

    // ZIP download
    const url = window.URL.createObjectURL(response.data);

    const a = document.createElement("a");
    a.href = url;
    a.download = "All_Employee_Files.zip";

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.log(error);
    alert("Download Failed");
  }
};

  return (
    <>
      <div className="container-fluid px-0 overflow-hidden">
        <div className="card shadow-sm border-0 w-100">
          <div className="card-body">
            {/* HEADER */}

            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "55px",
                    height: "55px",
                    fontSize: "22px",
                  }}
                >
                  <FaUserTie />
                </div>

                <div>
                  <h3 className="mb-1">Employee Personal Details List</h3>

                  <p className="text-muted mb-0">
                    Manage Employee Personal Information
                  </p>
                </div>
              </div>

              {/* RIGHT BUTTONS */}

              <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto ">
                {/* <button className="btn btn-primary" onClick={handleExportAll}>
                  <FaFileExport className="me-2" />
                  Export All
                </button> */}

                <button
                  className="btn btn-success ms-auto"
                  onClick={handleDownloadAllFiles}
                >
                  <FaDownload className="me-2" />
                  Download All Files
                </button>
              </div>
            </div>

            {/* FILTERS */}

            <div className="row g-3 mb-4">
              {/* SEARCH */}

              <div className="col-12 col-lg-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Name / Employee ID / PAN"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* DROPDOWN */}

              <div className="col-12 col-lg-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaFilter />
                  </span>

                  <select
                    className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">All Employees</option>

                    {employees.map((emp) => (
                      <option key={emp.id || emp.emp_id} value={emp.emp_id}>
                        {emp.emp_name || "Employee"} ({emp.emp_id || "No ID"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div
              className="table-responsive"
              style={{
                overflowX: "auto",
                width: "100%",
              }}
            >
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-dark">
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
                    <th>Download</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id || emp.emp_id}>
                        {/* EMPLOYEE */}

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "40px",
                                height: "40px",
                                fontWeight: "bold",
                              }}
                            >
                              {(emp.emp_name || "E").charAt(0)}
                            </div>

                            <div>
                              <div className="fw-bold">
                                {emp.emp_name || "No Name"}
                              </div>

                              <small className="text-muted">
                                {emp.emp_id || "No ID"}
                              </small>
                            </div>
                          </div>
                        </td>

                        {/* DOB */}

                        <td>
                          {emp.date_of_birth
                            ? formatDate(emp.date_of_birth)
                            : "-"}
                        </td>

                        {/* DOJ */}

                        <td>
                          {emp.date_of_joining
                            ? formatDate(emp.date_of_joining)
                            : "-"}
                        </td>

                        {/* AADHAAR */}

                        <td>
                          {emp.aadhaar_number ? (
                            <span className="text-success fw-semibold">
                              <FaCheckCircle className="me-1" />
                              {emp.aadhaar_number}
                            </span>
                          ) : (
                            <span className="text-danger fw-semibold">
                              <FaTimesCircle className="me-1" />
                              Not Added
                            </span>
                          )}
                        </td>

                        {/* AADHAAR FILE */}

                        <td>
                          {emp.aadhaar_file ? (
                            <div className="d-flex flex-column gap-2">
                              <img
                                src={`${api.defaults.baseURL}/uploads/aadhaar/${emp.aadhaar_file}`}
                                alt="aadhaar"
                                className="img-thumbnail"
                                style={{
                                  width: "70px",
                                  height: "70px",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(
                                    `${api.defaults.baseURL}/uploads/aadhaar/${emp.aadhaar_file}`,
                                    "_blank",
                                  )
                                }
                              />

                              <a
                                href={`${api.defaults.baseURL}/uploads/aadhaar/${emp.aadhaar_file}`}
                                download
                                className="btn btn-sm btn-outline-primary"
                              >
                                Download
                              </a>
                            </div>
                          ) : (
                            <span className="text-danger">No File</span>
                          )}
                        </td>

                        {/* PAN */}

                        <td>
                          {emp.pan_number ? (
                            <span className="text-success fw-semibold">
                              <FaCheckCircle className="me-1" />
                              {emp.pan_number}
                            </span>
                          ) : (
                            <span className="text-danger fw-semibold">
                              <FaTimesCircle className="me-1" />
                              Not Added
                            </span>
                          )}
                        </td>

                        {/* PAN FILE */}

                        <td>
                          {emp.pan_file ? (
                            <div className="d-flex flex-column gap-2">
                              <img
                                src={`${api.defaults.baseURL}/uploads/pan/${emp.pan_file}`}
                                alt="pan"
                                className="img-thumbnail"
                                style={{
                                  width: "70px",
                                  height: "70px",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(
                                    `${api.defaults.baseURL}/uploads/pan/${emp.pan_file}`,
                                    "_blank",
                                  )
                                }
                              />

                              <a
                                href={`${api.defaults.baseURL}/uploads/pan/${emp.pan_file}`}
                                download
                                className="btn btn-sm btn-outline-primary"
                              >
                                Download
                              </a>
                            </div>
                          ) : (
                            <span className="text-danger">No File</span>
                          )}
                        </td>

                        {/* BANK */}

                        <td>
                          {emp.bank_account_number ? (
                            <span className="text-success fw-semibold">
                              <FaCheckCircle className="me-1" />
                              {emp.bank_account_number}
                            </span>
                          ) : (
                            <span className="text-danger fw-semibold">
                              <FaTimesCircle className="me-1" />
                              Not Added
                            </span>
                          )}
                        </td>

                        {/* BANK FILE */}

                        <td>
                          {emp.bank_file ? (
                            <div className="d-flex flex-column gap-2">
                              <img
                                src={`${api.defaults.baseURL}/uploads/bank/${emp.bank_file}`}
                                alt="bank"
                                className="img-thumbnail"
                                style={{
                                  width: "70px",
                                  height: "70px",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(
                                    `${api.defaults.baseURL}/uploads/bank/${emp.bank_file}`,
                                    "_blank",
                                  )
                                }
                              />

                              <a
                                href={`${api.defaults.baseURL}/uploads/bank/${emp.bank_file}`}
                                download
                                className="btn btn-sm btn-outline-primary"
                              >
                                Download
                              </a>
                            </div>
                          ) : (
                            <span className="text-danger">No File</span>
                          )}
                        </td>

                        {/* IFSC */}

                        <td>
                          {emp.ifsc_code ? (
                            <span className="text-success fw-semibold">
                              <FaCheckCircle className="me-1" />
                              {emp.ifsc_code}
                            </span>
                          ) : (
                            <span className="text-danger fw-semibold">
                              <FaTimesCircle className="me-1" />
                              Not Added
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              className="btn btn-info btn-sm text-white"
                              onClick={() => handleView(emp)}
                            >
                              <FaEye />
                            </button>

                            <button
                              className="btn btn-warning btn-sm text-white"
                              onClick={() => handleEdit(emp)}
                            >
                              <FaEdit />
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(emp.emp_id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>

                        {/* APPRAISAL */}

                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedEmp(emp);

                              setShowAppraisal(true);
                            }}
                          >
                            Appraisal
                          </button>
                        </td>

                        {/* DOWNLOAD */}

                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleDownload(emp)}
                          >
                            <FaDownload className="me-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="13" className="text-center py-5">
                        No employee records found
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
        <div className="modal fade show d-block appraisalModal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content appraisalContent">
              <div className="modal-header appraisalHeader">
                <h5 className="modal-title">Employee Appraisal</h5>

                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAppraisal(false);
                    setSelectedEmp(null);
                  }}
                ></button>
              </div>

              <div className="modal-body">
                {/* Employee Profile */}
                <div className="appraisalEmployee">
                  <div className="appraisalAvatar">
                    {selectedEmp.emp_name?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h5>{selectedEmp.emp_name}</h5>
                    <small>{selectedEmp.emp_id}</small>
                  </div>
                </div>

                {/* Cards */}
                <div className="row mt-4">
                  <div className="col-md-4 mb-3">
                    <div className="appraisalCard joinCard">
                      <h6>Joining Date</h6>
                      <p>{formatDate(selectedEmp.date_of_joining)}</p>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="appraisalCard lastCard">
                      <h6>Last Appraisal</h6>
                      <p>{formatDate(selectedEmp.last_appraisal_date)}</p>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="appraisalCard nextCard">
                      <h6>Next Appraisal</h6>
                      <p>{formatDate(selectedEmp.next_appraisal_date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0">
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
      <style>{`

html,
body{
  overflow-x:hidden;
}

/* =========================================
   CARD
========================================= */

.bg-light .card{
  background:#ffffff !important;
  color:#111827 !important;
  border:1px solid #e5e7eb !important;
}

.bg-dark .card{
  background:#111827 !important;
  color:#f9fafb !important;
  border:1px solid #374151 !important;
}

/* =========================================
   CARD BODY
========================================= */

.bg-dark .card-body{
  background:#111827 !important;
  color:#f9fafb !important;
}

/* =========================================
   TEXT FIX
========================================= */

.bg-dark h1,
.bg-dark h2,
.bg-dark h3,
.bg-dark h4,
.bg-dark h5,
.bg-dark h6,
.bg-dark p,
.bg-dark span,
.bg-dark label,
.bg-dark div{
  color:#f9fafb !important;
}

/* EMPLOYEE NAME */

.bg-dark .fw-bold{
  color:#ffffff !important;
}

/* EMPLOYEE ID */

.bg-dark small,
.bg-dark small.text-muted,
.bg-dark .text-muted{
  color:#cbd5e1 !important;
}

/* =========================================
   INPUTS
========================================= */

.bg-dark .form-control,
.bg-dark .form-select,
.bg-dark .input-group-text{
  background:#0f172a !important;
  color:#f9fafb !important;
  border:1px solid #475569 !important;
}

.bg-dark .form-control::placeholder{
  color:#94a3b8 !important;
}

.bg-dark .form-control:focus,
.bg-dark .form-select:focus{
  background:#0f172a !important;
  color:#ffffff !important;
  border-color:#3b82f6 !important;
  box-shadow:none !important;
}

/* SELECT OPTION */

.bg-dark select option{
  background:#0f172a !important;
  color:#ffffff !important;
}

/* =========================================
   TABLE
========================================= */

.table td,
.table th{
  white-space:nowrap;
  vertical-align:middle;
}

/* MAIN TABLE */

.bg-dark .table{
  background:#111827 !important;
  color:#f9fafb !important;
}

/* TABLE BORDER */

.bg-dark .table-bordered{
  border-color:#374151 !important;
}

/* TABLE HEAD */

.bg-dark .table-dark th{
  background:#0f172a !important;
  color:#ffffff !important;
  border-color:#374151 !important;
}

/* TABLE ROW */

.bg-dark .table tbody tr{
  background:#111827 !important;
}

/* TABLE CELLS */

.bg-dark .table tbody tr td{
  background:#111827 !important;
  color:#f9fafb !important;
  border-color:#374151 !important;
}

/* DOB + DOJ FIX */

.bg-dark .table tbody tr td:nth-child(2),
.bg-dark .table tbody tr td:nth-child(3){
  color:#ffffff !important;
  font-weight:500;
}

/* EMPLOYEE NAME + ID FIX */

.bg-dark .table tbody tr td:first-child div,
.bg-dark .table tbody tr td:first-child small{
  color:#ffffff !important;
}

/* HOVER */

.bg-dark .table-hover tbody tr:hover td{
  background:#1e293b !important;
  color:#ffffff !important;
}

/* =========================================
   BUTTONS
========================================= */

.bg-dark .btn-outline-primary{
  color:#60a5fa !important;
  border-color:#60a5fa !important;
}

.bg-dark .btn-outline-primary:hover{
  background:#2563eb !important;
  color:#ffffff !important;
}

/* =========================================
   MODAL
========================================= */

.bg-dark .modal-content{
  background:#111827 !important;
  color:#f9fafb !important;
  border:1px solid #374151 !important;
}

.bg-dark .modal-header,
.bg-dark .modal-footer{
  border-color:#374151 !important;
}

.bg-dark .modal-body{
  background:#111827 !important;
  color:#ffffff !important;
}

.bg-dark .btn-close{
  filter:invert(1);
}

/* =========================================
   IMAGE
========================================= */

.bg-dark .img-thumbnail{
  background:#1e293b !important;
  border:1px solid #475569 !important;
}

/* =========================================
   SCROLLBAR
========================================= */

.table-responsive::-webkit-scrollbar{
  height:8px;
}

.table-responsive::-webkit-scrollbar-thumb{
  background:#475569;
  border-radius:10px;
}

/*==========================
 APPRAISAL MODAL
==========================*/

.appraisalModal{
    background:rgba(0,0,0,.55);
    backdrop-filter:blur(4px);
}

.appraisalContent{
    border:none;
    border-radius:18px;
    overflow:hidden;
}

.appraisalHeader{
    background:linear-gradient(135deg,#2563eb,#3b82f6);
    color:#fff;
    border:none;
}

.bg-dark .appraisalHeader{
    background:linear-gradient(135deg,#1d4ed8,#1e3a8a);
}

.appraisalEmployee{
    display:flex;
    align-items:center;
    gap:15px;
    background:#f8fafc;
    padding:18px;
    border-radius:15px;
}

.bg-dark .appraisalEmployee{
    background:#1e293b;
}

.appraisalAvatar{
    width:65px;
    height:65px;
    border-radius:50%;
    background:#2563eb;
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:24px;
    font-weight:bold;
}

.appraisalEmployee h5{
    margin:0;
    font-weight:700;
}

.appraisalEmployee small{
    color:#6b7280;
}

.bg-dark .appraisalEmployee small{
    color:#cbd5e1;
}

/* Cards */

.appraisalCard{
    border-radius:15px;
    padding:22px;
    text-align:center;
    color:#fff;
    height:100%;
    transition:.3s;
}

.appraisalCard:hover{
    transform:translateY(-5px);
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

.appraisalCard h6{
    margin-bottom:12px;
    font-weight:600;
}

.appraisalCard p{
    margin:0;
    font-size:16px;
    font-weight:700;
}

.bg-dark .appraisalContent{
    background:#111827;
    color:#fff;
}

.bg-dark .btn-close{
    filter:invert(1);
}

@media(max-width:768px){

.appraisalEmployee{
    flex-direction:column;
    text-align:center;
}

.appraisalAvatar{
    width:55px;
    height:55px;
    font-size:20px;
}

.appraisalCard{
    padding:18px;
}
}
/* Mobile */
@media (max-width: 767px) {

  .modal-dialog{
    margin:12px;
  }

  .appraisalCard{
    padding:18px;
    border-radius:12px;
  }

  .appraisalCard h6{
    font-size:15px;
  }

  .appraisalCard p{
    font-size:14px;
  }

  .appraisalEmployee{
    flex-direction:column;
    text-align:center;
  }

  .appraisalAvatar{
    width:55px;
    height:55px;
    font-size:20px;
  }
}
/* =========================================
   RESPONSIVE
========================================= */

.card{
  overflow:hidden;
}

@media (max-width:991px){

  .table td,
  .table th{
    min-width:140px;
  }

}

@media (min-width:992px){

  .table-responsive{
    overflow-x:auto;
  }

}

`}</style>
    </>
  );
}

export default PersonalDetailsList;
