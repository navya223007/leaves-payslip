import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { adminMenu } from "./menuConfig";

function AdminLayout() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, logout } = useAuth();

  // ================= SCREEN DETECT =================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ================= TOGGLE =================
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className={darkMode ? "bg-dark text-white" : "bg-light text-dark"}>
      {/* ================= NAVBAR ================= */}
      <Navbar
        toggleSidebar={toggleSidebar}
        isOpen={isOpen}
        user={user}
        darkMode={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
      />

      {/* ================= BODY ================= */}
      <div className="d-flex" style={{ paddingTop: "56px" }}>
        {/* ================= SIDEBAR ================= */}
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
            zIndex: 1050,
          }}
        >
          <Sidebar menuItems={adminMenu} isOpen={isOpen} />
        </div>

        {/* OVERLAY for mobile */}
        {isOpen && isMobile && (
          <div
            className="d-lg-none position-fixed"
            style={{
              top: "56px",
              left: 0,
              width: "100vw",
              height: "calc(100vh - 56px)",
              background: "rgba(0,0,0,0.5)",
              zIndex: 1049,
            }}
            onClick={() => setIsOpen(false)}
          ></div>
        )}

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

export default AdminLayout;
