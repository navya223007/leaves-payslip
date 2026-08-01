import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";

function ViewEmployee() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [emp, setEmp] = useState(null);

  useEffect(() => {
    api
      .get(`/employees/${id}`)
      .then((res) => {
        setEmp(res.data);
      })
      .catch((err) => {
        console.log(err);

        if (err.response?.status === 403) {
          alert("Session expired");

          navigate("/");
        }
      });
  }, [id, navigate]);

  if (!emp) {
    return (
      <>
        <div className="viewEmployeeWrapper">
          <div className="loadingBox">
            <h3 className="loadingText">Loading...</h3>
          </div>
        </div>

        <style>{styles}</style>
      </>
    );
  }

  return (
    <>
      <div className="viewEmployeeWrapper">
        <div className="employeeCard">
          {/* ================= HEADER ================= */}

          <div className="employeeHeader">
            <h2 className="employeeTitle">Employee Details</h2>

            <p className="employeeSubTitle">Complete Employee Information</p>
          </div>

          {/* ================= PROFILE IMAGE ================= */}

          <div className="profileSection">
            <div className="imgWrapper">
              <img
                src={
                  emp.profileImage
                    ? emp.profileImage
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt="profile"
                className="profileImg"
              />
            </div>
          </div>

          {/* ================= DETAILS ================= */}

          <div className="detailsGrid">
            <div className="detailCard">
              <span className="detailLabel">Employee ID</span>

              <span className="detailValue">{emp.emp_id}</span>
            </div>

            <div className="detailCard">
              <span className="detailLabel">Name</span>

              <span className="detailValue">{emp.name}</span>
            </div>

            <div className="detailCard">
              <span className="detailLabel">Email</span>

              <span className="detailValue">{emp.email}</span>
            </div>

            <div className="detailCard">
              <span className="detailLabel">Role</span>

              <span className="detailValue">{emp.role}</span>
            </div>

            <div className="detailCard">
              <span className="detailLabel">Department</span>

              <span className="detailValue">{emp.department}</span>
            </div>

            <div className="detailCard">
              <span className="detailLabel">Sub Department</span>

              <span className="detailValue">{emp.subDepartment}</span>
            </div>

            <div className="detailCard">
              <span className="detailLabel">Employee Type</span>

              <span className="detailValue">{emp.employeeType}</span>
            </div>
          </div>

          {/* ================= BUTTONS ================= */}

          <div className="buttonSection">
            <button
              onClick={() => navigate("/admin/employees")}
              className="btnBack"
            >
              Back
            </button>

            <button
              onClick={() => navigate(`/admin/employees/edit/${emp.id}`)}
              className="btnEdit"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <style>{styles}</style>
    </>
  );
}

const styles = `

/* =========================================================
   GLOBAL
========================================================= */

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

html,
body{
  overflow-x:hidden;
  font-family:Arial,sans-serif;
}

/* =========================================================
   PAGE WRAPPER
========================================================= */

.viewEmployeeWrapper{
  min-height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  padding:10px;
  transition:0.3s ease;
}

/* =========================================================
   LIGHT MODE
========================================================= */

.bg-light .viewEmployeeWrapper{
  background:linear-gradient(135deg,#f8fafc,#e2e8f0);
}

.bg-light .employeeCard{
  background:#ffffff;
  border:1px solid #e5e7eb;
  color:#111827;
  box-shadow:0 10px 30px rgba(0,0,0,0.08);
}

.bg-light .employeeTitle{
  color:#111827 !important;
}

.bg-light .employeeSubTitle{
  color:#6b7280 !important;
}

.bg-light .detailCard{
  background:#f8fafc;
  border:1px solid #e5e7eb;
}

.bg-light .detailLabel{
  color:#2563eb !important;
}

.bg-light .detailValue{
  color:#111827 !important;
}

.bg-light .loadingText{
  color:#111827 !important;
}

/* =========================================================
   DARK MODE
========================================================= */

.bg-dark .viewEmployeeWrapper{
  background:linear-gradient(135deg,#0f172a,#111827);
}

.bg-dark .employeeCard{
  background:#111827;
  border:1px solid #374151;
  color:#f9fafb;
  box-shadow:0 10px 30px rgba(0,0,0,0.4);
}

.bg-dark .employeeTitle{
  color:#ffffff !important;
}

.bg-dark .employeeSubTitle{
  color:#cbd5e1 !important;
}

.bg-dark .detailCard{
  background:#1f2937;
  border:1px solid #374151;
}

.bg-dark .detailLabel{
  color:#60a5fa !important;
}

.bg-dark .detailValue{
  color:#f9fafb !important;
}

.bg-dark .loadingText{
  color:#ffffff !important;
}

/* =========================================================
   CARD
========================================================= */

.employeeCard{
  width:100%;
  max-width:780px;
  border-radius:22px;
  padding:22px;
  transition:0.3s ease;
}

.employeeCard:hover{
  transform:translateY(-2px);
}

/* =========================================================
   HEADER
========================================================= */

.employeeHeader{
  text-align:center;
  margin-bottom:18px;
}

.employeeTitle{
  font-size:28px;
  font-weight:800;
  margin-bottom:4px;
}

.employeeSubTitle{
  font-size:14px;
  font-weight:500;
}

/* =========================================================
   PROFILE IMAGE
========================================================= */

.profileSection{
  display:flex;
  justify-content:center;
  margin-bottom:22px;
}

.imgWrapper{
  width:115px;
  height:115px;
  border-radius:50%;
  overflow:hidden;
  border:3px solid #2563eb;
  padding:3px;
  background:linear-gradient(135deg,#2563eb,#60a5fa);
  transition:0.3s ease;
}

.imgWrapper:hover{
  transform:scale(1.05);
}

.profileImg{
  width:100%;
  height:100%;
  object-fit:cover;
  border-radius:50%;
}

/* =========================================================
   DETAILS GRID
========================================================= */

.detailsGrid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:12px;
}

.detailCard{
  padding:14px;
  border-radius:14px;
  transition:0.3s ease;
}

.detailCard:hover{
  transform:translateY(-2px);
}

.detailLabel{
  display:block;
  font-size:12px;
  font-weight:700;
  margin-bottom:5px;
  text-transform:uppercase;
  letter-spacing:0.5px;
}

.detailValue{
  display:block;
  font-size:14px;
  font-weight:600;
  word-break:break-word;
}

/* =========================================================
   BUTTONS
========================================================= */

.buttonSection{
  margin-top:22px;
  display:flex;
  justify-content:center;
  gap:10px;
  flex-wrap:wrap;
}

.btnBack,
.btnEdit{
  border:none;
  outline:none;
  padding:10px 22px;
  border-radius:10px;
  color:#ffffff;
  font-size:14px;
  font-weight:700;
  cursor:pointer;
  transition:0.3s ease;
}

.btnBack{
  background:linear-gradient(135deg,#2563eb,#1d4ed8);
}

.btnEdit{
  background:linear-gradient(135deg,#f59e0b,#d97706);
}

.btnBack:hover,
.btnEdit:hover{
  transform:translateY(-2px);
  opacity:0.95;
}

/* =========================================================
   LOADING
========================================================= */

.loadingBox{
  padding:20px;
}

.loadingText{
  font-size:24px;
  font-weight:700;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media(max-width:768px){

  .viewEmployeeWrapper{
    padding:8px;
  }

  .employeeCard{
    padding:16px;
    border-radius:18px;
  }

  .employeeHeader{
    margin-bottom:14px;
  }

  .employeeTitle{
    font-size:22px;
  }

  .employeeSubTitle{
    font-size:12px;
  }

  .profileSection{
    margin-bottom:16px;
  }

  .imgWrapper{
    width:90px;
    height:90px;
  }

  .detailsGrid{
    grid-template-columns:1fr;
    gap:10px;
  }

  .detailCard{
    padding:12px;
  }

  .detailLabel{
    font-size:11px;
  }

  .detailValue{
    font-size:13px;
  }

  .buttonSection{
    margin-top:16px;
    gap:8px;
  }

  .btnBack,
  .btnEdit{
    width:100%;
    padding:9px;
    font-size:13px;
  }
}

@media(max-width:480px){

  .viewEmployeeWrapper{
    padding:6px;
  }

  .employeeCard{
    padding:14px;
    border-radius:16px;
  }

  .employeeTitle{
    font-size:20px;
  }

  .employeeSubTitle{
    font-size:11px;
  }

  .imgWrapper{
    width:80px;
    height:80px;
  }

  .detailCard{
    padding:10px;
  }

  .detailLabel{
    font-size:10px;
  }

  .detailValue{
    font-size:12px;
  }
}

`;

export default ViewEmployee;
