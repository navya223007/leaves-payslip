import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bgImage from "../assets/bgimage/login.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [emp_id, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpEmpId, setOtpEmpId] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="loginPage">
      <div className="loginCard">
        {/* LOGO */}
        <div className="logoWrapper">
          <img src="/ses_logo.ico" alt="Logo" className="loginLogo" />
        </div>

        <h2 className="loginTitle">Employee Login</h2>

        {/* EMPLOYEE ID */}
        <input
          type="text"
          placeholder="Employee ID"
          value={emp_id}
          disabled={showOtp}
          onChange={(e) => setEmpId(e.target.value)}
          className="loginInput"
        />

        {/* PASSWORD */}
        {!showOtp && (
          <div className="passwordWrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="loginInput passwordInput"
            />

            <button
              type="button"
              className={`eyeButton ${showPassword ? "eyeActive" : ""}`}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        )}

        {/* OTP */}
        {showOtp && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="loginInput"
            />

            <p className="otpText">
              OTP has been sent to your registered email.
            </p>
          </>
        )}

        {/* BUTTON */}
        {!showOtp ? (
          <button
            onClick={handleLogin}
            className="loginButton"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        ) : (
          <button
            onClick={handleVerifyOtp}
            className="loginButton"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        )}
      </div>

      {/* RESPONSIVE + ANIMATION CSS */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        .loginPage {
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background-image: url(${bgImage});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .loginCard {
          width: 360px;
          max-width: 100%;
          padding: 30px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.25);
          animation: loginCardIn 0.7s ease;
        }

        @keyframes loginCardIn {
          from {
            opacity: 0;
            transform: translateY(25px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .logoWrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 15px;
        }

        .loginLogo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        .loginTitle {
          text-align: center;
          margin: 0 0 20px;
          font-size: 24px;
          font-weight: 600;
        }

        .loginInput {
          width: 100%;
          height: 44px;
          padding: 10px 12px;
          margin-bottom: 15px;
          border-radius: 8px;
          border: none;
          outline: none;
          background: rgba(255, 255, 255, 0.95);
          color: #000;
          font-size: 15px;
          transition:
            box-shadow 0.25s ease,
            transform 0.25s ease;
        }

        .loginInput::placeholder {
          color: #777;
        }

        .loginInput:focus {
          box-shadow: 0 0 0 3px rgba(147, 40, 189, 0.3);
          transform: translateY(-1px);
        }

        .loginInput:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .passwordWrapper {
          position: relative;
          width: 100%;
        }

        .passwordInput {
          padding-right: 48px;
        }

        .eyeButton {
          position: absolute;
          right: 7px;
          top: 0;
          width: 38px;
          height: 44px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          background: transparent;
          color: #666;
          cursor: pointer;
          border-radius: 50%;
          transition:
            color 0.25s ease,
            transform 0.25s ease,
            background 0.25s ease;
        }

        .eyeButton:hover {
          color: #9328bd;
          background: rgba(147, 40, 189, 0.08);
          transform: scale(1.08);
        }

        .eyeButton:active {
          transform: scale(0.88);
        }

        .eyeButton svg {
          font-size: 17px;
          transition: transform 0.25s ease;
        }

        .eyeActive svg {
          animation: eyePop 0.3s ease;
          color: #9328bd;
        }

        @keyframes eyePop {
          0% {
            transform: scale(0.6) rotate(-10deg);
          }

          60% {
            transform: scale(1.15) rotate(5deg);
          }

          100% {
            transform: scale(1) rotate(0);
          }
        }

        .otpText {
          font-size: 13px;
          text-align: center;
          color: #fff;
          margin: -5px 0 15px;
          line-height: 1.5;
        }

        .loginButton {
          width: 100%;
          height: 44px;
          padding: 10px;
          border-radius: 8px;
          border: none;
          background-color: #9328bd;
          color: white;
          font-weight: bold;
          cursor: pointer;
          font-size: 15px;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background-color 0.25s ease;
        }

        .loginButton:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(147, 40, 189, 0.4);
          background-color: #8222a8;
        }

        .loginButton:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .loginButton:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* TABLET */
        @media (max-width: 768px) {
          .loginPage {
            padding: 20px;
          }

          .loginCard {
            width: 380px;
            padding: 28px;
          }
        }

        /* MOBILE */
        @media (max-width: 480px) {
          .loginPage {
            padding: 15px;
            align-items: center;
          }

          .loginCard {
            width: 100%;
            padding: 24px 20px;
            border-radius: 13px;
          }

          .loginLogo {
            width: 68px;
            height: 68px;
          }

          .loginTitle {
            font-size: 21px;
            margin-bottom: 18px;
          }

          .loginInput,
          .loginButton {
            height: 43px;
          }
        }

        /* VERY SMALL DEVICES */
        @media (max-width: 350px) {
          .loginPage {
            padding: 10px;
          }

          .loginCard {
            padding: 20px 15px;
          }

          .loginLogo {
            width: 60px;
            height: 60px;
          }

          .loginTitle {
            font-size: 19px;
          }
        }

        /* LANDSCAPE MOBILE */
        @media (max-height: 500px) and (orientation: landscape) {
          .loginPage {
            align-items: flex-start;
            overflow-y: auto;
            padding: 15px;
          }

          .loginCard {
            margin: 10px auto;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
