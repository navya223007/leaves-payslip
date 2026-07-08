import React, { useEffect, useState } from "react";
import api from "../api";
import LeaveCard from "./LeaveCard";

function PendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Token handled by cookie

  // ================= FETCH =================
  const fetchLeaves = React.useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/leaves/pending");

      setLeaves(res.data || []);
    } catch (err) {
      console.log("FETCH ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // ================= REMOVE FROM UI =================
  const handleRemove = (id) => {
    setLeaves((prev) => prev.filter((item) => item.id !== id));
  };

  // ================= APPROVE =================
  const handleApprove = React.useCallback(async (id) => {
    try {
      await api.put(`/api/leaves/approve/${id}`, {});

      handleRemove(id);
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  // ================= REJECT =================
  const handleReject = React.useCallback(async (id) => {
    const reason = prompt("Enter reject reason:");
    if (!reason) return;

    try {
      await api.put(`/api/leaves/reject/${id}`, { reason });

      handleRemove(id);
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  return (
    <div style={styles.page} className="min-h-screen p-4">
      {/* 🔵 ANIMATED BACKGROUND */}
      <div style={styles.shape1}></div>
      <div style={styles.shape2}></div>
      <div style={styles.shape3}></div>

      <div style={styles.content}>
        <h2 style={styles.title}>Pending Leaves</h2>

        {loading ? (
          <p style={{ color: "white" }}>Loading...</p>
        ) : leaves.length === 0 ? (
          <p style={{ color: "white" }}>No pending leaves</p>
        ) : (
          <div className="row g-4">
            {leaves.map((item) => (
              <div key={item.id} className="col-12 col-sm-6 col-lg-4">
                <LeaveCard
                  data={item}
                  showActions={true}
                  onDelete={handleRemove}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PendingLeaves;

/* ================= STYLES (UNCHANGED YOUR DESIGN) ================= */
const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    padding: "20px",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a, #2563eb)",
  },

  content: {
    position: "relative",
    zIndex: 2,
  },

  title: {
    marginBottom: 15,
    color: "#fff",
    fontSize: "22px",
    fontWeight: "bold",
  },

  shape1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "#38bdf8",
    top: "10%",
    left: "5%",
    opacity: 0.3,
    animation: "float 6s ease-in-out infinite",
  },

  shape2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: "#a78bfa",
    bottom: "10%",
    right: "5%",
    opacity: 0.3,
    animation: "float 8s ease-in-out infinite",
  },

  shape3: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: "50%",
    background: "#34d399",
    top: "50%",
    right: "30%",
    opacity: 0.3,
    animation: "float 7s ease-in-out infinite",
  },
};
