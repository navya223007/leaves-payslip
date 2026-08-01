import React from "react";
import api from "../api";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
function LeaveCard({
  data = {},
  onDelete,
  showActions = false,
  onApprove,
  onReject,
}) {
  const navigate = useNavigate();

  const id = data.id;
  const status = data.status || "pending";

  const empId = data.emp_id || "N/A";
  const name = data.name || "N/A";
  const department = data.department || "N/A";

  // ================= EDIT =================
  const handleEdit = () => {
    navigate("/employee/leave", { state: { leave: data } });
  };

  // ================= MARK AS VIEW =================
  const handleMarkRead = async () => {
    try {
      await api.put(`/api/leaves/mark-read/${id}`);
      onDelete?.(id);
    } catch (err) {
      console.log(err.message);
    }
  };

  // ================= SAFE DATES =================
  const getDates = () => {
    if (!data.selected_dates) return [];

    if (Array.isArray(data.selected_dates)) {
      return data.selected_dates;
    }

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
          <b>Applied Time:</b> {formatDate(data.created_at)}
        </p>

        <p>
          <b>Reason:</b> {getReason()}
        </p>

        {data.date && (
          <p>
            <b>Leave Date:</b> {new Date(data.date).toLocaleDateString("en-GB")}
            {data.session && ` (${data.session})`}
          </p>
        )}

        {getDates().length > 0 && (
          <p>
            <b>Leave Dates:</b> {getDates().join(", ")}
          </p>
        )}

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

        {status === "approved" && data.approved_at && (
          <p className="text-success">
            <b>Approved Time:</b> {formatDate(data.approved_at)}
          </p>
        )}

        {status === "rejected" && (
          <>
            {data.rejected_at && (
              <p className="text-danger">
                <b>Rejected Time:</b> {formatDate(data.rejected_at)}
              </p>
            )}

            <p className="text-danger">
              <b>Reject Reason:</b> {data.reject_reason || "-"}
            </p>
          </>
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
            <button
              onClick={() => onApprove?.(id)}
              className="btn btn-success btn-sm"
            >
              Approve
            </button>

            <button
              onClick={() => onReject?.(id)}
              className="btn btn-danger btn-sm"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LeaveCard;
