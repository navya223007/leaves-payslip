import React, { useEffect, useState } from "react";
import axios from "axios";
import LeaveCard from "./LeaveCard";
import { useAuth } from "../context/AuthContext.jsx";

function EmployeeDashboard() {
  const API = `http://${window.location.hostname}:7013`;
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);

  // ================= FETCH =================
  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API}/api/leaves/employee/${user.emp_id}`, { withCredentials: true });

      setLeaves(res.data);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    if (user?.emp_id) fetchLeaves();
  }, [user?.emp_id]);

  // ================= MARK AS VIEW =================
  const handleMarkRead = async (id) => {
    try {
      await axios.put(`${API}/api/leaves/mark-read/${id}`, {}, { withCredentials: true });

      fetchLeaves();
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <div className="container mt-3">
      {/* HEADER SECTION */}
      <div className="bg-primary text-white p-3 rounded mb-3 shadow-sm">
        <h3 className="mb-0">My Leaves</h3>
      </div>

      {/* CONTENT */}
      {leaves.length === 0 ? (
        <div className="bg-light p-3 rounded shadow-sm text-center">
          <p className="mb-0 text-muted">No leaves</p>
        </div>
      ) : (
        <div className="row">
          {leaves.map((item) => (
            <div className="col-12 col-sm-6 col-lg-4 mb-3" key={item.id}>
              <LeaveCard data={item} onDelete={handleMarkRead} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
