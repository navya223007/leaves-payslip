import {
  FaTachometerAlt,
  FaUsers,
  FaClock,
  FaFileAlt,
  FaEye,
  FaKey,
  FaMoneyCheckAlt,
  FaTasks,
} from "react-icons/fa";

export const adminMenu = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: FaTachometerAlt,
  },
  {
    label: "Employees",
    path: "/admin/employees",
    icon: FaUsers,
  },
  {
    label: "Leaves",
    path: "/admin/leaves",
    icon: FaClock,
  },
  {
    label: "Reports",
    path: "/admin/admin-reports",
    icon: FaFileAlt,
  },
  {
    label: "Daily Status",
    path: "/admin/employee-status",
    icon: FaEye,
  },
  {
    label: "Change Password",
    path: "/admin/change-password",
    icon: FaKey,
  },
  {
    label: "Payslip Management",
    path: "/admin/payslips",
    icon: FaMoneyCheckAlt,
  },
];

export const employeeMenu = [
  {
    label: "Dashboard",
    path: "/employee",
    icon: FaTachometerAlt,
  },
  {
    label: "Apply Leave",
    path: "/employee/leave",
    icon: FaClock,
  },
  {
    label: "My Leaves",
    path: "/employee/employee-reports",
    icon: FaFileAlt,
  },
  {
    label: "Daily Status",
    path: "/employee/daily-status",
    icon: FaTasks,
  },
  {
    label: "Change Password",
    path: "/employee/change-password",
    icon: FaKey,
  },
  {
    label: "Download Payslips",
    path: "/employee/download-payslips",
    icon: FaMoneyCheckAlt,
  },
];

