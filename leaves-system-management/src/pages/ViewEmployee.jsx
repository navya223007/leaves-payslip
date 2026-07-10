import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function ViewEmployee() {
  // const API = `http://localhost:7015`;
// const API = `http://localhost:7015`;
const API = ``;
  const { id } = useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/employees/${id}`)
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

  if (!emp) return <h3>Loading...</h3>;

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <h2>Employee Details</h2>

        {/* PROFILE IMAGE */}
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={imgWrapper}>
            <img
              src={
                emp.profileImage
                  ? emp.profileImage
                  : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="profile"
              style={profileImg}
            />
          </div>
        </div>

        <p>
          <b>Emp ID:</b> {emp.emp_id}
        </p>
        <p>
          <b>Name:</b> {emp.name}
        </p>
        <p>
          <b>Email:</b> {emp.email}
        </p>
        <p>
          <b>Role:</b> {emp.role}
        </p>
        <p>
          <b>Department:</b> {emp.department}
        </p>
        <p>
          <b>Sub Department:</b> {emp.subDepartment}
        </p>
        <p>
          <b>Employee Type:</b> {emp.employeeType}
        </p>

        {/* BUTTONS */}
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate("/admin/employees")} style={btnBack}>
            Back
          </button>

          <button
            onClick={() => navigate(`/admin/employees/edit/${emp.id}`)}
            style={btnEdit}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

/* 🔵 IMAGE WRAPPER (hover effect) */
const pageWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  backgroundColor: "#f5f7fb",
};

const card = {
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "10px",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  textAlign: "center",
  width: "550px",
};
const imgWrapper = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  overflow: "hidden",
  cursor: "pointer",
  border: "3px solid #1976d2",
};

/* 🔵 PROFILE IMAGE */
const profileImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "transform 0.3s ease",
};

/* Hover effect (pure CSS alternative needed below) */

const btnBack = {
  padding: "10px",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  marginRight: "10px",
};

const btnEdit = {
  padding: "10px",
  backgroundColor: "orange",
  color: "white",
  border: "none",
};

export default ViewEmployee;
