import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";

function CreateEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!document.getElementById("shape-animations")) {
      const style = document.createElement("style");
      style.id = "shape-animations";
      style.innerHTML = `
        @keyframes float1 {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          25% { transform: translate(80px, -40px) rotate(90deg); }
          50% { transform: translate(40px, -80px) rotate(180deg); }
          75% { transform: translate(-40px, -40px) rotate(270deg); }
          100% { transform: translate(0px, 0px) rotate(360deg); }
        }
        @keyframes float2 {
          0% { transform: translate(0,0); }
          50% { transform: translate(-90px,60px); }
          100% { transform: translate(0,0); }
        }
        @keyframes float3 {
          0% { transform: translate(0,0); }
          50% { transform: translate(100px,-60px); }
          100% { transform: translate(0,0); }
        }
        @keyframes float4 {
          0% { transform: translate(0,0) rotate(0deg); }
          50% { transform: translate(-80px,-80px) rotate(180deg); }
          100% { transform: translate(0,0) rotate(360deg); }
        }
        @keyframes float5 {
          0% { transform: rotate(45deg) translate(0,0); }
          50% { transform: rotate(225deg) translate(70px,50px); }
          100% { transform: rotate(405deg) translate(0,0); }
        }
        @keyframes float6 {
          0% { transform: translate(0,0); }
          50% { transform: translate(40px,-70px); }
          100% { transform: translate(0,0); }
        }
        select option { color: black; background: white; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("");
  const [subDepartment, setSubDepartment] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [designation, setDesignation] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // FETCH DATA ON LOAD FOR EDITING
  useEffect(() => {
    if (id) {
      api
        .get(`/employees/${id}`)
        .then((res) => {
          const data = res.data;
          setDesignation(data.designation || "");
          setName(data.name || "");
          setEmpId(data.emp_id || "");
          setEmail(data.email || "");
          setRole(data.role || "employee");
          setDepartment(data.department || "");
          setSubDepartment(data.subDepartment || "");
          setEmployeeType(data.employeeType || "");
        })
        .catch((error) => {
          console.error(error);
          if (error.response?.status === 403) {
            alert("Unauthorized. Please login again.");
            navigate("/");
          }
        });
    }
  }, [id, navigate]);

  const submitEmployee = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !email || (!id && !password)) {
      setErrorMsg("Please fill in Name, Email and Password.");
      return;
    }
    if (!designation) {
      setErrorMsg("Please select designation");
      return;
    }

    if (
      role === "employee" &&
      (!department || !subDepartment || !employeeType)
    ) {
      setErrorMsg(
        "Department, Sub Department, and Employee Type are required for employees.",
      );
      return;
    }

    try {
      setLoading(true);
      const payload = {
        designation,
        name,
        email,
        role,
        department,
        employeeType,
        subDepartment,
      };

      if (id) {
        // UPDATE API
        await api.put(`/employees/${id}`, payload);
        setSuccessMsg("Employee Updated Successfully!");
      } else {
        // CREATE API
        payload.password = password;
        await api.post(`/create-employees`, payload);
        setSuccessMsg("Employee Created Successfully!");
      }

      setTimeout(() => navigate("/admin/employees"), 2000);
    } catch (error) {
      console.error("❌ Save Error:", error);
      const serverMsg = error.response?.data?.message;
      if (error.response?.status === 403) {
        setErrorMsg(serverMsg || "Access Denied: You do not have permission.");
      } else if (error.response?.status === 400) {
        setErrorMsg(serverMsg || "Invalid data provided.");
      } else {
        setErrorMsg(serverMsg || "An unexpected error occurred while saving.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageContainer}>
      <div style={shapesContainer}>
        <div style={{ ...shape, ...circle }} />
        <div style={{ ...shape, ...square }} />
        <div style={{ ...shape, ...triangle }} />
        <div style={{ ...shape, ...circle2 }} />
        <div style={{ ...shape, ...square2 }} />
        <div style={{ ...shape, ...diamond }} />
      </div>

      <div style={{ ...card, padding: isMobile ? "20px" : "30px 40px" }}>
        <h2 style={title}>{id ? "Edit Employee" : "Create Employee"}</h2>

        {errorMsg && <div style={errBanner}>{errorMsg}</div>}
        {successMsg && <div style={successBanner}>{successMsg}</div>}

        {id && (
          <FormRow label="Employee ID" isMobile={isMobile}>
            <input
              value={empId}
              readOnly
              style={{
                ...input,
                backgroundColor: "rgba(255,255,255,0.05)",
                cursor: "not-allowed",
              }}
            />
          </FormRow>
        )}

        <FormRow label="Designation" isMobile={isMobile}>
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            style={input}
          >
            <option style={optionStyle} value="">
              Select Designation
            </option>
            <option style={optionStyle} value="SE">
              Software Engineer
            </option>
            <option style={optionStyle} value="HE">
              Hardware Engineer
            </option>
            <option style={optionStyle} value="TESE">
              Testing Engineer
            </option>
            <option style={optionStyle} value="TE">
              Trainee Engineer
            </option>
          </select>
        </FormRow>

        <FormRow label="Name" isMobile={isMobile}>
          <input
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />
        </FormRow>

        <FormRow label="Email" isMobile={isMobile}>
          <input
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
        </FormRow>

        {!id && (
          <FormRow label="Password" isMobile={isMobile}>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
          </FormRow>
        )}

        <FormRow label="Role" isMobile={isMobile}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={input}
          >
            <option style={optionStyle} value="employee">
              Employee
            </option>
            <option style={optionStyle} value="admin">
              Admin
            </option>
          </select>
        </FormRow>

        <FormRow label="Department" isMobile={isMobile}>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={input}
          >
            <option style={optionStyle} value="">
              Select Department
            </option>
            <option style={optionStyle} value="software">
              Software
            </option>
            <option style={optionStyle} value="hardware">
              Hardware
            </option>
            <option style={optionStyle} value="networking">
              Networking
            </option>
            <option style={optionStyle} value="testing">
              Testing
            </option>{" "}
            {/* Fixed value here */}
            <option style={optionStyle} value="hr">
              HR
            </option>
            <option style={optionStyle} value="finance">
              Finance
            </option>
          </select>
        </FormRow>

        <FormRow label="Sub Department" isMobile={isMobile}>
          <select
            value={subDepartment}
            onChange={(e) => setSubDepartment(e.target.value)}
            style={input}
          >
            <option style={optionStyle} value="">
              Select Sub Department
            </option>
            <option style={optionStyle} value="frontend">
              Frontend
            </option>
            <option style={optionStyle} value="backend">
              Backend
            </option>
            <option style={optionStyle} value="fullstack">
              Fullstack
            </option>
            <option style={optionStyle} value="rd">
              R & D
            </option>
            <option style={optionStyle} value="camr">
              CAMR
            </option>{" "}
            {/* Fixed value here */}
            <option style={optionStyle} value="qc">
              Quality checking(QC)
            </option>{" "}
            {/* Fixed value here */}
          </select>
        </FormRow>

        <FormRow label="Employee Type" isMobile={isMobile}>
          <select
            value={employeeType}
            onChange={(e) => setEmployeeType(e.target.value)}
            style={input}
          >
            <option style={optionStyle} value="">
              Select Employee Type
            </option>
            <option style={optionStyle} value="permanent">
              Permanent
            </option>
            <option style={optionStyle} value="temporary">
              Temporary
            </option>
            <option style={optionStyle} value="trainee">
              Trainee
            </option>
          </select>
        </FormRow>

        <div style={buttonRow}>
          <button onClick={submitEmployee} style={btn} disabled={loading}>
            {loading
              ? "Processing..."
              : id
                ? "Update Employee"
                : "Create Employee"}
          </button>
          <button onClick={() => navigate("/admin/employees")} style={backBtn}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

const FormRow = ({ label, children, isMobile }) => (
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      marginBottom: "14px",
      width: "100%",
    }}
  >
    <label
      style={{
        width: isMobile ? "100%" : "170px",
        marginBottom: isMobile ? "5px" : "0",
        color: "white",
        fontWeight: "500",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

// Style adjustments for notifications
const errBanner = {
  background: "rgba(239, 68, 68, 0.2)",
  color: "#fca5a5",
  padding: "10px",
  borderRadius: "8px",
  marginBottom: "15px",
  textAlign: "center",
  border: "1px solid rgba(239, 68, 68, 0.3)",
};
const successBanner = {
  background: "rgba(34, 197, 94, 0.2)",
  color: "#86efac",
  padding: "10px",
  borderRadius: "8px",
  marginBottom: "15px",
  textAlign: "center",
  border: "1px solid rgba(34, 197, 94, 0.3)",
};

const pageContainer = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0f172a, #1e293b)",
  position: "relative",
  overflowX: "hidden",
  overflowY: "auto",
  fontFamily: "Segoe UI, sans-serif",
  padding: "15px",
};
const card = {
  position: "relative",
  zIndex: 2,
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  width: "90%",
  maxWidth: "600px",
  border: "2px solid rgba(255,255,255,0.2)",
};
const title = {
  textAlign: "center",
  marginBottom: "25px",
  color: "white",
  fontSize: "26px",
  fontWeight: "600",
};
const input = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.3)",
  backgroundColor: "rgba(255,255,255,0.12)",
  color: "white",
  outline: "none",
  width: "100%",
  fontSize: "14px",
  transition: "0.3s",
};
const buttonRow = {
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "10px",
};
const btn = {
  padding: "10px 18px",
  background: "linear-gradient(45deg,#22c55e,#16a34a)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};
const backBtn = {
  padding: "10px 18px",
  background: "linear-gradient(45deg,#3b82f6,#2563eb)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};
const optionStyle = { backgroundColor: "#1e293b", color: "white" };
const shapesContainer = {
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  overflow: "hidden",
  zIndex: 1,
};
const shape = {
  position: "absolute",
  border: "2px solid rgba(255,255,255,0.4)",
};
const circle = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  top: "10%",
  left: "8%",
  animation: "float1 12s infinite linear",
};
const circle2 = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  bottom: "12%",
  right: "10%",
  animation: "float2 10s infinite linear",
};
const square = {
  width: "100px",
  height: "100px",
  top: "60%",
  left: "5%",
  animation: "float3 14s infinite linear",
};
const square2 = {
  width: "90px",
  height: "90px",
  top: "20%",
  right: "15%",
  animation: "float4 11s infinite linear",
};
const diamond = {
  width: "70px",
  height: "70px",
  top: "70%",
  right: "30%",
  transform: "rotate(45deg)",
  animation: "float5 13s infinite linear",
};
const triangle = {
  width: 0,
  height: 0,
  borderLeft: "60px solid transparent",
  borderRight: "60px solid transparent",
  borderBottom: "100px solid rgba(255,255,255,0.3)",
  top: "40%",
  right: "35%",
  animation: "float6 15s infinite linear",
};

export default CreateEmployee;
