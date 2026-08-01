import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bgImage from "../assets/bgimage/login.jpg";

function Login() {
  const [emp_id, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpEmpId, setOtpEmpId] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!emp_id.trim() || !password.trim()) {
      alert("Please enter Employee ID and Password");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/login", {
        emp_id: emp_id.trim(),
        password: password.trim(),
      });

      console.log("LOGIN RESPONSE:", res.data);

      // ADMIN LOGIN
      if (res.data.otpRequired) {
        setOtpEmpId(res.data.emp_id);
        setShowOtp(true);

        alert("OTP sent successfully");
        return;
      }

      // EMPLOYEE LOGIN
      const user = res.data.user;

      login(user);

      if (user.role.toLowerCase() === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }
    } catch (err) {
      console.log("Login Error:", err);

      if (err.response) {
        console.log(err.response.data);
        alert(err.response.data.message);
      } else {
        alert("Server not responding");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      alert("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/admin/verify-otp", {
        emp_id: otpEmpId,
        otp: otp.trim(),
      });

      const { user } = res.data;

      login(user);

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Invalid OTP");
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
          width: "360px",
          padding: "30px",
          borderRadius: "15px",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "15px",
          }}
        >
          <img
            src="/ses_logo.ico"
            alt="Logo"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
            }}
          />
        </div>

        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Employee Login
        </h2>

        <input
          type="text"
          placeholder="Employee ID"
          value={emp_id}
          disabled={showOtp}
          onChange={(e) => setEmpId(e.target.value)}
          style={input}
        />

        {!showOtp && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
        )}

        {showOtp && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={input}
            />

            <p
              style={{
                fontSize: "13px",
                textAlign: "center",
                color: "#fff",
              }}
            >
              OTP has been sent to your registered email.
            </p>
          </>
        )}

        {!showOtp ? (
          <button onClick={handleLogin} style={button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        ) : (
          <button onClick={handleVerifyOtp} style={button} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        )}
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
