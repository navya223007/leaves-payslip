import {
  FaTachometerAlt,
  FaUsers,
  FaClock,
  FaFileAlt,
  FaKey,
  FaMoneyCheckAlt,
  FaTasks,
  FaIdCard,
  FaUserPlus,
} from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa";

export const adminMenu = [
  {
    label: "Admin Dashboard",
    path: "/admin",
    icon: FaTachometerAlt,
  },

  {
    label: "Create Employee",
    path: "/admin/create-employees",
    icon: FaUserPlus,
  },

  {
    label: "Employees Details",
    path: "/admin/employees",
    icon: FaUsers,
  },

  {
    label: "Pending Leaves",
    path: "/admin/leaves",
    icon: FaClock,
  },

  {
    label: "Leaves Reports",
    path: "/admin/admin-reports",
    icon: FaFileAlt,
  },

  {
    label: "Daily Status Reports ",
    path: "/admin/employee-status",
    icon: FaClipboardList,
  },
    // ✅ NEW
  {
    label: "Employee Personal Details",
    path: "/admin/employee-details",
    icon: FaIdCard,
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
    label: "Employe Dashboard",
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
    label: "My Profile",
    path: "/employee/my-details",
    icon: FaIdCard,
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

