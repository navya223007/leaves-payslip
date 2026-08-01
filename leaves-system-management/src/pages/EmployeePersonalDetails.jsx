import React from "react";
import { Link, useLocation } from "react-router-dom";

import {
  FaUserPlus,
  FaListAlt,
  FaUsers,
  FaUpload,
  FaDownload,
} from "react-icons/fa";

function EmployeePersonalDetails() {
  const location = useLocation();

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* ===================================== */}
      {/* TOP HEADER CARD */}
      {/* ===================================== */}

      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4"
        style={{
          background: "linear-gradient(135deg, #0d6efd, #4f8cff)",
        }}
      >
        <div className="card-body p-4">
          <div className="row align-items-center">
            {/* LEFT */}

            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    width: "75px",
                    height: "75px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontSize: "30px",
                  }}
                >
                  <FaUsers />
                </div>

                <div>
                  <h2 className="fw-bold text-white mb-1">
                    Employee Personal Details
                  </h2>

                  <p className="text-light mb-0">
                    Upload Aadhaar, PAN, Bank Documents and Manage Employee
                    Personal Data
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="col-lg-5 mt-4 mt-lg-0">
              <div className="d-flex gap-3 flex-wrap justify-content-lg-end">
                {/* CREATE BUTTON */}

                <Link
                  to="/admin/employee-details/create"
                  className={`btn px-4 py-3 rounded-4 fw-semibold shadow-sm border-0 ${
                    location.pathname.includes("create")
                      ? "btn-warning text-dark"
                      : "btn-light text-primary"
                  }`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaUserPlus />

                    <span>Create Employee Details</span>
                  </div>
                </Link>

                {/* LIST BUTTON */}

                <Link
                  to="/admin/employee-details-personal/list"
                  className={`btn px-4 py-3 rounded-4 fw-semibold shadow-sm border-0 ${
                    location.pathname.includes("list")
                      ? "btn-warning text-dark"
                      : "btn-light text-primary"
                  }`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaListAlt />

                    <span>Personal Details List</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================== */}
      {/* QUICK CARDS */}
      {/* ===================================== */}

      <div className="row g-3 mb-4">
        {/* UPLOAD */}

        <div className="col-md-4">
          <div
            className="card border-0 shadow rounded-4 h-100"
            style={{
              background: "linear-gradient(135deg, #198754, #28c76f)",
            }}
          >
            <div className="card-body text-white p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold">Upload Documents</h5>

                  <small>Aadhaar / PAN / Bank Files</small>
                </div>

                <FaUpload size={35} />
              </div>
            </div>
          </div>
        </div>

        {/* DOWNLOAD */}

        <div className="col-md-4">
          <div
            className="card border-0 shadow rounded-4 h-100"
            style={{
              background: "linear-gradient(135deg, #0d6efd, #36a2ff)",
            }}
          >
            <div className="card-body text-white p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold">Download Files</h5>

                  <small>Single / All Employees</small>
                </div>

                <FaDownload size={35} />
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS */}

        <div className="col-md-4">
          <div
            className="card border-0 shadow rounded-4 h-100"
            style={{
              background: "linear-gradient(135deg, #6f42c1, #9b6dff)",
            }}
          >
            <div className="card-body text-white p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold">Manage Details</h5>

                  <small>Read / Edit / Delete</small>
                </div>

                <FaUsers size={35} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeePersonalDetails;
