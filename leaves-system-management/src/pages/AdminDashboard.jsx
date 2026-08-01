import React, { useEffect, useState } from "react";
import api from "../api";

function AdminDashboard() {
  const [data, setData] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchCounts = async () => {
    try {
      const res = await api.get("/api/dashboard/admin-counts");

      setData({
        pending: res.data.pending ?? 0,
        approved: res.data.approved ?? 0,
        rejected: res.data.rejected ?? 0,
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div className="container-fluid p-3" style={{ minHeight: "100%" }}>
      {/* TITLE */}
      <div className="mb-4">
        <h3 className="fw-bold">Admin Dashboard</h3>
        <p className="text-muted mb-0">Welcome to management panel</p>
      </div>

      {/* CARDS */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 bg-warning bg-opacity-25 h-100">
            <div className="card-body text-center">
              <h5>Pending</h5>
              <h1 className="fw-bold text-warning">{data.pending}</h1>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 bg-success bg-opacity-25 h-100">
            <div className="card-body text-center">
              <h5>Approved</h5>
              <h1 className="fw-bold text-success">{data.approved}</h1>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 bg-danger bg-opacity-25 h-100">
            <div className="card-body text-center">
              <h5>Rejected</h5>
              <h1 className="fw-bold text-danger">{data.rejected}</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
