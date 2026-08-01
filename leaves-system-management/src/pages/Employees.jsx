import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const paginatedEmployees = employees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ================= PAGINATION =================

  const goPrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [employees]);

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmDelete = window.confirm("Are you sure you want to delete?");

    if (!confirmDelete) return;

    await api.delete("/employees/" + id);

    const res = await api.get("/employees-reports");

    setEmployees(res.data);
  };

  // ================= LOAD =================

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await api.get("/employees-reports");
        setEmployees(res.data);
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    };

    loadEmployees();
  }, []);

  // ================= ROW COLORS =================

  const getRowStyle = (empId) => {
    if (!empId) return {};

    if (empId.startsWith("ADMIN")) {
      return {
        background:
          "linear-gradient(90deg, rgba(239,68,68,0.18), rgba(220,38,38,0.10))",
        borderLeft: "8px solid #dc2626",
      };
    }

    if (empId.startsWith("EMP")) {
      return {
        background:
          "linear-gradient(90deg, rgba(59,130,246,0.18), rgba(37,99,235,0.10))",
        borderLeft: "8px solid #2563eb",
      };
    }

    if (empId.startsWith("SES-SE")) {
      return {
        background:
          "linear-gradient(90deg, rgba(139,92,246,0.18), rgba(124,58,237,0.10))",
        borderLeft: "8px solid #7c3aed",
      };
    }

    if (empId.startsWith("SES-TE")) {
      return {
        background:
          "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(5,150,105,0.10))",
        borderLeft: "8px solid #059669",
      };
    }

    if (empId.startsWith("SES-HR")) {
      return {
        background:
          "linear-gradient(90deg, rgba(245,158,11,0.18), rgba(217,119,6,0.10))",
        borderLeft: "8px solid #d97706",
      };
    }

    if (empId.startsWith("SES-TST")) {
      return {
        background:
          "linear-gradient(90deg, rgba(236,72,153,0.18), rgba(219,39,119,0.10))",
        borderLeft: "8px solid #db2777",
      };
    }

    return {};
  };

  return (
    <>
      {/* ================= CSS ================= */}

      <style>{`

        .employeePage{
          min-height:100vh;
        }

        .employeeTitle{
          font-size:28px;
          font-weight:700;
        }

        .employeeCard{
          border-radius:24px;
          overflow:hidden;
          transition:0.3s;
          padding:24px;
        }

        /* ================= LIGHT MODE ================= */

        .bg-light .employeeCard{
          background:#f2f3f3;
          color:#111827;
          box-shadow:0 10px 25px rgba(0,0,0,0.08);
        }

        /* ================= DARK MODE ================= */

        .bg-dark .employeeCard{
          background:#1e1e1e;
          color:#f3f4f6;
          box-shadow:0 10px 25px rgba(0,0,0,0.35);
          border:1px solid #333;
        }

        /* ================= TABLE ================= */

        .employeeTable{
          border-collapse:separate;
          border-spacing:0 12px;
        }

        .employeeTable td,
        .employeeTable th{
          background:transparent !important;
          vertical-align:middle;
          border:none !important;
        }

        /* ================= LIGHT MODE TABLE TEXT ================= */

        .bg-light .employeeTable td{
          color:#111827 !important;
          font-weight:500;
        }

        .bg-light .employeeTable th{
          color:#ffffff !important;
          font-weight:700;
        }

        /* ================= DARK MODE TABLE TEXT ================= */

        .bg-dark .employeeTable td{
          color:#f3f4f6 !important;
          font-weight:500;
        }

        .bg-dark .employeeTable th{
          color:#ffffff !important;
          font-weight:700;
        }

        /* ================= TABLE HEADER ================= */

        .employeeTable thead tr{
          background:#0d6efd;
        }

        .employeeTable thead th{
          padding:16px;
          font-size:14px;
          letter-spacing:0.3px;
        }

        /* ================= ROW HOVER ================= */

        .employeeTable tbody tr{
          transition:0.25s ease;
        }

        .employeeTable tbody tr:hover{
          transform:translateY(-2px);
        }

        /* ================= PAGINATION ================= */

        .paginationText{
          font-size:15px;
          font-weight:600;
        }

        .bg-dark .paginationText{
          color:#ffffff;
        }

        .bg-light .paginationText{
          color:#111827;
        }

        /* ================= BUTTONS ================= */

        .actionBtn{
          width:34px;
          height:34px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:10px;
        }

        /* ================= RESPONSIVE ================= */

        @media(max-width:768px){

          .employeeCard{
            padding:16px;
          }

          .employeeTitle{
            font-size:22px;
          }

          .employeeTable thead th{
            font-size:13px;
          }

          .employeeTable td{
            font-size:13px;
          }

        }

      `}</style>

      {/* ================= PAGE ================= */}

      <div className="employeePage p-3 p-md-4 p-lg-5">
        <div className="container-fluid">
          {/* ================= HEADER ================= */}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="employeeTitle">Employee List</h2>
          </div>

          {/* ================= TABLE CARD ================= */}

          <div className="employeeCard">
            <div className="table-responsive">
              <table className="table employeeTable align-middle text-nowrap w-100">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Sub Department</th>
                    <th>Employee Type</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((emp) => (
                      <tr key={emp.id} style={getRowStyle(emp.emp_id)}>
                        <td>{emp.emp_id}</td>

                        <td>{emp.name}</td>

                        <td>{emp.email}</td>

                        <td>{emp.password}</td>

                        <td>{emp.role}</td>

                        <td>{emp.department}</td>

                        <td>{emp.subDepartment}</td>

                        <td>{emp.employeeType}</td>

                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            {/* VIEW */}

                            <button
                              className="btn btn-primary btn-sm actionBtn"
                              onClick={() =>
                                navigate(`/admin/employees/view/${emp.id}`)
                              }
                            >
                              <FaEye />
                            </button>

                            {/* EDIT */}

                            <button
                              className="btn btn-warning btn-sm actionBtn"
                              onClick={() =>
                                navigate(`/admin/employees/edit/${emp.id}`)
                              }
                            >
                              <FaEdit />
                            </button>
                            {/* DELETE */}

                            <button
                              className="btn btn-danger btn-sm actionBtn"
                              onClick={() => handleDelete(emp.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-5 fw-bold">
                        No Employees Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGINATION ================= */}

          <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
            <button
              className="btn btn-secondary btn-sm"
              onClick={goPrev}
              disabled={currentPage === 1}
            >
              Prev
            </button>

            <span className="paginationText">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={goNext}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>

          {/* ================= BACK BUTTON ================= */}

          <div className="mt-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="btn btn-secondary"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Employees;
