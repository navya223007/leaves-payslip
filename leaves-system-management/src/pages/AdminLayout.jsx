import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { adminMenu } from "./menuConfig";

function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className={darkMode ? "bg-dark text-white" : "bg-light text-dark"}>
      {/* NAVBAR */}
      <Navbar
        toggleSidebar={toggleSidebar}
        user={user}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      {/* LAYOUT */}
      <div className="layoutWrapper">
        {/* SIDEBAR */}
        <div
          className={`sidebar ${isOpen ? "open" : "closed"} ${
            isMobile ? "mobile" : ""
          }`}
        >
          <Sidebar menuItems={adminMenu} isOpen={isOpen} />
        </div>

        {/* OVERLAY MOBILE */}
        {isMobile && isOpen && (
          <div className="overlay" onClick={() => setIsOpen(false)} />
        )}

        {/* CONTENT */}
        <div className={`content ${isOpen ? "shiftOpen" : "shiftClosed"}`}>
          <Outlet />
        </div>
      </div>

      {/* ================= CSS ================= */}
      <style>{`
        .layoutWrapper {
          display: flex;
          padding-top: 60px;
        }

        .sidebar {
          position: fixed;
          top: 60px;
          left: 0;
          height: calc(100vh - 60px);
          background: #212529;
          overflow-y: auto;
          overflow-x: hidden;
          transition: 0.3s;
          z-index: 1050;
        }

        .sidebar.open {
          width: 240px;
        }

        .sidebar.closed {
          width: 70px;
        }

        .content {
          flex: 1;
          min-height: calc(100vh - 60px);
          padding: 20px;
          transition: 0.3s;
          width: 100%;
          overflow-x: hidden;
        }

        .shiftOpen {
          margin-left: 240px;
        }

        .shiftClosed {
          margin-left: 70px;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1040;
        }

        @media (max-width: 991px) {
          .sidebar {
            width: 240px !important;
            transform: translateX(${isOpen ? "0" : "-100%"});
          }

          .shiftOpen,
          .shiftClosed {
            margin-left: 0 !important;
          }

          .content {
            padding: 12px;
          }
        }

        /* ================= DARK MODE FIX (ONLY COLORS FIX) ================= */

        .bg-dark td,
        .bg-dark th {
          color: #e9ecef !important;
        }

        .bg-dark .text-muted {
          color: #adb5bd !important;
        }

        .bg-dark tbody tr:hover {
          background: rgba(255,255,255,0.06);
        }

        .bg-dark .card {
          background-color: #1e1e1e;
          color: #e9ecef;
          border-color: #2a2a2a;
        }

        .bg-dark .form-control,
        .bg-dark .form-select {
          background-color: #2a2a2a;
          color: #fff;
          border-color: #444;
        }

        .bg-dark input::placeholder {
          color: #bbb !important;
        }

        .bg-dark .pageNumber {
          background: #2a2a2a;
          color: #fff;
        }

        .bg-dark .pageNumber.activePage {
          background: linear-gradient(135deg,#0d6efd,#6610f2);
        }

        .bg-dark .descriptionText {
          color: #d1d1d1 !important;
        }

        .bg-dark .hoverDescriptionCard {
          background: #1f1f1f;
          color: #e9ecef;
          border: 1px solid #333;
        }

        .bg-dark .hoverTitle {
          color: #4dabf7;
        }
      `}</style>
    </div>
  );
}

export default AdminLayout;
