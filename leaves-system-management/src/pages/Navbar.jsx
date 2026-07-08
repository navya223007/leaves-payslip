import React from "react";
import {
  FaBars,
  FaMoon,
  FaSun,
  FaSignOutAlt,
} from "react-icons/fa";

function Navbar({ toggleSidebar, darkMode, toggleTheme, onLogout, user }) {
  return (
    <nav
      id="mainNavbar"
      className="navbar navbar-expand-lg navbar-dark bg-primary px-2 px-md-3 fixed-top shadow"
    >
      {/* ================= LEFT SIDE ================= */}
      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Sidebar Toggle */}
        <button className="btn btn-light btn-sm" onClick={toggleSidebar}>
          <FaBars />
        </button>

        {/* ✅ LOGO */}
        <img src="/ses_logo.ico" alt="Logo" style={{ width: "35px", height: "35px", borderRadius: "50%", border: "1px solid white" }} />

        {/* ✅ DESKTOP TEXT */}
        <div className="text-white d-none d-md-block">
          <div className="fw-bold">
            Welcome {user?.role === "admin" ? "Admin Panel" : "Employee Panel"}
          </div>
          <div className="small text-light">Leave Management System</div>
        </div>

        {/* ✅ MOBILE TEXT */}
        <div className="text-white fw-bold d-block d-md-none">
          {user?.role === "admin" ? "Admin" : "Employee"}
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
        {/* ✅ USER ICON WITH HOVER */}
        <div className="position-relative user-hover">
          <img
            src="/ses_logo.ico"
            alt="User"
            style={{ width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", border: "1px solid white" }}
          />

          {/* HOVER BOX */}
          <div className="user-box">
            <div className="fw-semibold">{user?.name}</div>
            <div className="small">Emp ID: {user?.emp_id}</div>
          </div>
        </div>

        {/* DARK MODE */}
        <button className="btn btn-light btn-sm" onClick={toggleTheme}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* LOGOUT */}
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-1"
          onClick={onLogout}
        >
          <FaSignOutAlt />
          <span className="d-none d-sm-inline">Logout</span>
        </button>
      </div>

      {/* ================= STYLE ================= */}
      <style>
        {`
          .user-hover {
            position: relative;
          }

          .user-box {
            position: absolute;
            top: 40px;
            right: 0;
            background: white;
            color: black;
            padding: 8px 10px;
            border-radius: 6px;
            min-width: 160px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            display: none;
            z-index: 999;
          }

          .user-hover:hover .user-box {
            display: block;
          }
        `}
      </style>
    </nav>
  );
}

export default Navbar;
