import React from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function LeaveCard({ data = {}, onDelete, showActions = false }) {
  // const API = `http://localhost:7015`;
//  const API = `http://localhost:7015`;
const API = ``;
  const navigate = useNavigate();
  // Token handled by cookie

  const id = data.id;
  const status = data.status || "pending";

  const empId = data.emp_id || "N/A";
  const name = data.name || "N/A";
  const department = data.department || "N/A";

  // ================= EDIT =================
  const handleEdit = () => {
    navigate("/employee/leave", { state: { leave: data } });
  };

  // // ================= VIEW =================
  // const handleView = () => {
  //   navigate("/employee/leave/view", { state: { leave: data } });
  // };
  // ================= MARK AS VIEW =================
  const handleMarkRead = async () => {
    try {
      await axios.put(
        `${API}/api/leaves/mark-read/${id}`,
        {},
        { withCredentials: true }
      );

      onDelete?.(id); // ✅ HERE (correct)
    } catch (err) {
      console.log(err.message);
    }
  };
  // ================= APPROVE =================
  const handleApprove = async () => {
    try {
      await axios.put(
        `${API}/api/leaves/approve/${id}`,
        {},
        { withCredentials: true }
      );

      onDelete?.(id); // ✅ HERE (correct)
    } catch (err) {
      console.log(err.message);
    }
  };

  // ================= REJECT =================
  const handleReject = async () => {
    const reason = prompt("Enter reject reason:");
    if (!reason) return;

    try {
      await axios.put(
        `${API}/api/leaves/reject/${id}`,
        { reason },
        { withCredentials: true }
      );

      onDelete?.(id); // ✅ HERE (correct)
    } catch (err) {
      console.log(err.message);
    }
  };
  // ================= SAFE DATES =================
  const getDates = () => {
    if (!data.selected_dates) return [];
    if (Array.isArray(data.selected_dates)) return data.selected_dates;

    try {
      return JSON.parse(data.selected_dates);
    } catch {
      return [];
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleString();
  };

  const getReason = () => {
    if (!data.reason_type) return "N/A";
    return data.reason_type === "other"
      ? data.reason_text || "N/A"
      : data.reason_type;
  };

  const getLeaveTypeLabel = (type) => {
    if (type === "half") return "Half Day";
    if (type === "full") return "Full Day";
    if (type === "multi") return "Multiple Days";
    return "N/A";
  };

  return (
    <div className="card shadow-lg border-0 mb-3 rounded-4 h-100 d-flex flex-column">
      {/* HEADER */}
      <div className="card-header bg-primary text-white fw-bold">
        {getLeaveTypeLabel(data.leave_type)}
      </div>

      {/* BODY */}
      <div className="card-body flex-grow-1">
        <p>
          <b>Emp ID:</b> {empId}
        </p>
        <p>
          <b>Name:</b> {name}
        </p>
        <p>
          <b>Department:</b> {department}
        </p>
        <p>
          <b>Applied:</b> {formatDate(data.created_at)}
        </p>
        <p>
          <b>Reason:</b> {getReason()}
        </p>

        {data.date && (
          <p>
            <b>Date:</b> {data.date} {data.session && `(${data.session})`}
          </p>
        )}

        {getDates().length > 0 && (
          <p>
            <b>Dates:</b> {getDates().join(", ")}
          </p>
        )}

        {/* STATUS */}
        <p>
          <b>Status:</b>{" "}
          <span
            className={`badge px-3 py-2 ${
              status === "approved"
                ? "bg-success"
                : status === "rejected"
                  ? "bg-danger"
                  : "bg-warning text-dark"
            }`}
          >
            {status}
          </span>
        </p>

        {/* FIXED HEIGHT REJECT */}
        {status === "rejected" && (
          <p className="text-danger mb-2" style={{ minHeight: "24px" }}>
            <b>Reject:</b> {data.reject_reason || "-"}
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div className="card-footer bg-white d-flex flex-wrap gap-2 mt-auto">
        {!showActions && status === "pending" && (
          <button onClick={handleEdit} className="btn btn-primary btn-sm">
            <FaEdit /> Edit
          </button>
        )}

        {!showActions && status !== "pending" && !data.employee_checked && (
          <button onClick={handleMarkRead} className="btn btn-success btn-sm">
            Mark as View
          </button>
        )}

        {showActions && status === "pending" && (
          <>
            <button onClick={handleApprove} className="btn btn-success btn-sm">
              Approve
            </button>

            <button onClick={handleReject} className="btn btn-danger btn-sm">
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LeaveCard;
