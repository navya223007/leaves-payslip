import React from "react";
// import { FaBars, FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { FaBars, FaSignOutAlt } from "react-icons/fa";

function Navbar({ toggleSidebar, darkMode, toggleTheme, onLogout, user }) {
  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm fixed-top px-3"
        id="mainNavbar"
      >
        {/* LEFT */}
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light btn-sm" onClick={toggleSidebar}>
            <FaBars />
          </button>

          {/* LOGO */}
          <img src="/logo192.png" alt="logo" className="navbarLogo" />

          {/* TITLE */}
          <div className="text-white d-none d-md-block">
            <div className="fw-bold">
              {user?.role === "admin" ? "Admin Panel" : "Employee Panel"}
            </div>

            <small className="text-light">Leave Management System</small>
          </div>
        </div>

        {/* RIGHT */}
        <div className="ms-auto d-flex align-items-center gap-2">
          {/* USER */}
          <div className="position-relative userHover">
            <img src="/logo192.png" alt="user" className="userImage" />

            <div className="userPopup">
              <div className="fw-bold">{user?.name}</div>

              <small>EMP ID : {user?.emp_id}</small>
            </div>
          </div>

          {/* THEME
          <button className="btn btn-light btn-sm" onClick={toggleTheme}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button> */}

          {/* LOGOUT */}
          <button
            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
            onClick={onLogout}
          >
            <FaSignOutAlt />

            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* CSS */}
      <style>{`
      
      #mainNavbar{
        height:60px;
        z-index:1050;
      }

      .navbarLogo{
        width:38px;
        height:38px;
        border-radius:50%;
        object-fit:cover;
        border:2px solid white;
      }

      .userImage{
        width:34px;
        height:34px;
        border-radius:50%;
        object-fit:cover;
        cursor:pointer;
        border:2px solid white;
      }

      .userHover{
        position:relative;
      }

      .userPopup{
        position:absolute;
        top:45px;
        right:0;
        background:white;
        color:black;
        min-width:170px;
        padding:10px;
        border-radius:10px;
        box-shadow:0 5px 15px rgba(0,0,0,0.15);
        display:none;
        z-index:9999;
      }

      .userHover:hover .userPopup{
        display:block;
      }

      @media(max-width:768px){

        #mainNavbar{
          padding:8px 12px !important;
        }

        .navbarLogo{
          width:32px;
          height:32px;
        }

      }

      `}</style>
    </>
  );
}

export default Navbar;
