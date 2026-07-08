import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";

import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import Employees from "./Employees";
import CreateEmployee from "./CreateEmployee";
import ViewEmployee from "./ViewEmployee";
import PendingLeaves from "./PendingLeaves";

import EmployeeLayout from "./EmployeeLayout";
import EmployeeDashboard from "./EmployeeDashboard";
import ApplyLeave from "./ApplyLeave";
import AdminPageReport from "./AdminPageReport";
import EmployeReport from "./EmployeReport";
import AdminEmployeeStatus from "./AdminEmployeeStatus";
import EmployeeDailyStatus from "./EmployeeDailyStatus";
import EmployeeDailyStatusReport from "./EmployeeDailyStatusReport";
import ChangePassword from "./ChangePassword";
import DownloadPayslips from "./DownloadPayslips";
import PayslipApp from "../payslip/PayslipApp";
import ViewPDFWrapper from "../payslip/ViewPDFWrapper";
import EmployeeViewPDF from "../payslip/EmployeeViewPDF";

import ProtectedRoute from "./ProtectedRoute";

function RouterPage() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<Login />} />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="create-employees" element={<CreateEmployee />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/edit/:id" element={<CreateEmployee />} />
        <Route path="employees/view/:id" element={<ViewEmployee />} />
        <Route path="leaves" element={<PendingLeaves />} />
        <Route path="admin-reports" element={<AdminPageReport />} />
        <Route path="employee-status" element={<AdminEmployeeStatus />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="payslips" element={<PayslipApp />} />
        <Route path="payslips/view-pdf" element={<ViewPDFWrapper />} />
      </Route>

      {/* EMPLOYEE ROUTES */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="leave" element={<ApplyLeave />} />
        <Route path="employee-reports" element={<EmployeReport />} />
        <Route path="daily-status" element={<EmployeeDailyStatus />} />
        <Route
          path="daily-status-report"
          element={<EmployeeDailyStatusReport />}
        />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="download-payslips" element={<DownloadPayslips />} />
        <Route path="payslip-view" element={<EmployeeViewPDF />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<h2>Page Not Found</h2>} />
    </Routes>
  );
}

export default RouterPage;
