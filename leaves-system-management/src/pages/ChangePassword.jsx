import React, { useState } from "react";
import { FaLock, FaEye, FaEyeSlash, FaKey } from "react-icons/fa";

import api from "../api";
function ChangePassword() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear old messages
    setErrorMessage("");
    setSuccessMessage("");

    // Check password mismatch before API call
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("New Password and Confirm Password do not match");
      return;
    }

    try {
      const response = await api.put("/api/change-password", {
        currentPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      // Success
      setSuccessMessage(
        response.data?.message || "Password changed successfully",
      );

      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Change password error:", error);

      // Show exact backend error message
      const message =
        error.response?.data?.message ||
        "Unable to change password. Please try again.";

      setErrorMessage(message);
    }
  };

  return (
    <>
      <div className="changePasswordPage">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-7 col-md-9">
              <div className="changePasswordCard">
                <div className="cardHeader">
                  <div className="iconCircle">
                    <FaKey />
                  </div>

                  <h3>Change Password</h3>

                  <p>Update your account password securely</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* OLD PASSWORD */}

                  <div className="mb-4">
                    <label className="form-label">Current Password</label>

                    <div className="inputGroup">
                      <FaLock className="inputIcon" />

                      <input
                        type={showOld ? "text" : "password"}
                        className="form-control"
                        name="oldPassword"
                        placeholder="Enter current password"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        required
                      />

                      <button
                        type="button"
                        className="eyeBtn"
                        onClick={() => setShowOld(!showOld)}
                      >
                        {showOld ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* NEW PASSWORD */}

                  <div className="mb-4">
                    <label className="form-label">New Password</label>

                    <div className="inputGroup">
                      <FaLock className="inputIcon" />

                      <input
                        type={showNew ? "text" : "password"}
                        className="form-control"
                        name="newPassword"
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                      />

                      <button
                        type="button"
                        className="eyeBtn"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>

                    <div className="inputGroup">
                      <FaLock className="inputIcon" />

                      <input
                        type={showConfirm ? "text" : "password"}
                        className="form-control"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />

                      <button
                        type="button"
                        className="eyeBtn"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button className="btn saveBtn w-100" type="submit">
                    Update Password
                  </button>
                </form>
                {errorMessage && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                    style={{
                      borderRadius: "10px",
                      fontWeight: "500",
                      marginBottom: "20px",
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div
                    className="alert alert-success"
                    role="alert"
                    style={{
                      borderRadius: "10px",
                      fontWeight: "500",
                      marginBottom: "20px",
                    }}
                  >
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
      
      .changePasswordPage{
        min-height:calc(100vh - 100px);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
      }

      .changePasswordCard{
        background:white;
        border-radius:24px;
        padding:35px;
        box-shadow:0 15px 40px rgba(0,0,0,0.08);
      }

      .cardHeader{
        text-align:center;
        margin-bottom:30px;
      }

      .iconCircle{
        width:75px;
        height:75px;
        margin:auto;
        border-radius:50%;
        background:linear-gradient(
          135deg,
          #0d6efd,
          #6610f2
        );
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:28px;
        margin-bottom:15px;
      }

      .cardHeader h3{
        font-weight:700;
        margin-bottom:5px;
        color:green;
      }

      .cardHeader p{
        color:#6c757d;
        margin:0;
      }

      .inputGroup{
        position:relative;
      }

      .inputIcon{
        position:absolute;
        left:15px;
        top:50%;
        transform:translateY(-50%);
        color:#6c757d;
      }

      .inputGroup .form-control{
        height:55px;
        padding-left:45px;
        padding-right:50px;
        border-radius:14px;
      }

      .eyeBtn{
        position:absolute;
        right:15px;
        top:50%;
        transform:translateY(-50%);
        border:none;
        background:none;
        color:#666;
      }

      .saveBtn{
        height:55px;
        border:none;
        border-radius:14px;
        font-weight:600;
        color:white;
        background:linear-gradient(
          135deg,
          #0d6efd,
          #6610f2
        );
      }

      .saveBtn:hover{
        transform:translateY(-2px);
      }

      @media(max-width:768px){

        .changePasswordCard{
          padding:25px;
        }

        .iconCircle{
          width:65px;
          height:65px;
          font-size:24px;
        }

        .cardHeader h3{
          font-size:22px;
        }

      }

      @media(max-width:576px){

        .changePasswordCard{
          padding:20px;
          border-radius:18px;
        }

        .inputGroup .form-control{
          height:50px;
        }

        .saveBtn{
          height:50px;
        }

      }

      `}</style>
    </>
  );
}

export default ChangePassword;
