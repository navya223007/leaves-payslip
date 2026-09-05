import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// const ProtectedRoute = ({ children, role }) => {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return <div>Loading session...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   const userRole = (user.role || "").toLowerCase().trim();
//   const requiredRole = (role || "").toLowerCase().trim();

//   if (role && userRole !== requiredRole) {
//     console.log("ROLE BLOCKED:", userRole, "EXPECTED:", requiredRole);
//     return <Navigate to="/" replace />;
//   }

//   return children;
// };

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading session...</div>;
  }

  if (!user) {
    console.log("❌ NO USER — CURRENT PATH:", window.location.pathname);
    return <Navigate to="/" replace />;
  }

  const userRole = (user.role || "").toLowerCase().trim();
  const requiredRole = (role || "").toLowerCase().trim();

  console.log("🔐 PROTECTED ROUTE CHECK:", {
    path: window.location.pathname,
    userRole,
    requiredRole,
  });

  if (role && userRole !== requiredRole) {
    console.log(
      "🚫 ROLE BLOCKED:",
      userRole,
      "EXPECTED:",
      requiredRole,
      "PATH:",
      window.location.pathname,
    );

    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
