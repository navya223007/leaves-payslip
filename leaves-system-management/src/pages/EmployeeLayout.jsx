import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { employeeMenu } from "./menuConfig";

function EmployeeLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className={darkMode ? "bg-dark text-white" : "bg-light text-dark"}>
      {/* NAVBAR */}
      <Navbar
        isOpen={isOpen}
        toggleSidebar={toggleSidebar}
        title="Employee Panel"
        onLogout={handleLogout}
        user={user}
        darkMode={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
      />

      {/* BODY WRAPPER */}
      <div className="d-flex" style={{ paddingTop: "56px" }}>
        {/* SIDEBAR */}
        <div
          className={`d-lg-block ${isOpen ? "d-block" : "d-none d-lg-block"}`}
          style={{
            position: "fixed",
            top: "56px",
            left: 0,
            height: "calc(100vh - 56px)",
            width: isOpen ? "240px" : "70px",
            background: "#212529",
            transition: "0.3s",
            overflowY: "auto",
            overflowX: "hidden",
            zIndex: 1000,
          }}
        >
          <Sidebar menuItems={employeeMenu} isOpen={isOpen} />
        </div>

        {/* OVERLAY for mobile */}
        {isOpen && (
          <div
            className="d-lg-none position-fixed"
            style={{
              top: "56px",
              left: 0,
              width: "100vw",
              height: "calc(100vh - 56px)",
              background: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          ></div>
        )}

        {/* CONTENT */}
        <div
          className={`content-area ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
          style={{
            width: "100%",
            minHeight: "calc(100vh - 56px)",
            background: darkMode ? "#121212" : "#f4f6f9",
            transition: "0.3s",
            padding: "20px",
          }}
        >
          <Outlet />
        </div>

        <style>
          {`
            .content-area.sidebar-open {
              margin-left: 240px;
            }
            .content-area.sidebar-closed {
              margin-left: 70px;
            }
            @media (max-width: 991.98px) {
              .content-area.sidebar-open,
              .content-area.sidebar-closed {
                margin-left: 0;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default EmployeeLayout;
