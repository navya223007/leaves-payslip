import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

function EmployeeDailyStatus() {
  const API = `http://${window.location.hostname}:7013`;

  const { user } = useAuth();
  const [employee, setEmployee] = useState({});
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmployee({
        name: user.name,
        emp_id: user.emp_id,
        department: user.department,
      });
    }
  }, [user]);
  const submitStatus = async () => {
    try {
      if (!projectName || !description || !assignedBy) {
        alert("Please fill all fields");
        return;
      }

      await axios.post(
        `${API}/api/daily-status`,
        {
          emp_id: user.emp_id,
          project_name: projectName,
          subtask: description,
          assigned_by: assignedBy,
        },
        { withCredentials: true }
      );

      alert("Submitted successfully");

      setProjectName("");
      setDescription("");
      setAssignedBy("");
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 text-muted">
        Loading employee details...
      </div>
    );
  }

  return (
    <div className="container-fluid p-3">
      {/* TITLE */}
      <div className="mb-3">
        <h3 className="fw-bold">Daily Status Update</h3>
      </div>

      {/* EMPLOYEE INFO */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body d-flex flex-wrap justify-content-between gap-3">
          <div>
            <b>Name:</b> {employee.name || "N/A"}
          </div>
          <div>
            <b>ID:</b> {employee.emp_id || "N/A"}
          </div>
          <div>
            <b>Dept:</b> {employee.department || "N/A"}
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="card shadow-sm">
        <div className="card-body">
          {/* PROJECT NAME */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Name</label>

            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="form-control"
              placeholder="Enter project name"
            />
          </div>
          {/* TASK ASSIGNED BY */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Task Assigned By</label>

            <input
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
              className="form-control"
              placeholder="Enter manager / lead name"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="6"
              className="form-control"
              placeholder="Write detailed work description..."
            />
          </div>

          {/* BUTTON */}
          <div className="text-end">
            <button onClick={submitStatus} className="btn btn-primary px-4">
              Submit Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDailyStatus;
