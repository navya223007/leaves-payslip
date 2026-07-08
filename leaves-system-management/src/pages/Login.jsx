import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import bgImage from "../assets/bgimage/login.jpg";

function Login() {
  const [emp_id, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      if (!emp_id.trim() || !password.trim()) {
        alert("Please enter Employee ID and Password");
        return;
      }

      setLoading(true);

      const res = await api.post("/login", {
        emp_id: emp_id.trim(),
        password: password.trim(),
      });

      const { user } = res.data;

      // 🔥 USE CONTEXT INSTEAD OF LOCALSTORAGE
      login(user);

      // 🔥 FIXED NAVIGATION
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }

    } catch (error) {
      console.log("Login Error:", error);

      if (error.response) {
        alert(error.response.data.message || "Login failed");
      } else {
        alert("Server not responding");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "30px",
          borderRadius: "15px",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
          <img src="/ses_logo.ico" alt="Logo" style={{ width: "80px", height: "80px", borderRadius: "50%" }} />
        </div>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Employee Login
        </h2>

        <input
          type="text"
          placeholder="Employee ID"
          value={emp_id}
          onChange={(e) => setEmpId(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button onClick={handleLogin} style={button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "none",
  outline: "none",
  color: "black",
};

const button = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#9328bd",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Login;
