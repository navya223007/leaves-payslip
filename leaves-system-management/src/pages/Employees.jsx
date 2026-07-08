import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);

  // ✅ DEFINE OUTSIDE (REUSABLE)

  // DELETE
  const handleDelete = async (id) => {
    if (!id) {
      alert("Invalid ID");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/employees/${id}`);

      alert("Deleted successfully");

      // ✅ refresh employees list
      const res = await api.get("/employees-reports");

      setEmployees(res.data);
    } catch (err) {
      console.log(err);

      if (err.response?.status === 403) {
        alert("Session expired");
        navigate("/");
      } else {
        alert("Delete failed");
      }
    }
  };

  const loadEmployees = React.useCallback(async () => {
    try {
      const res = await api.get("/employees-reports");

      setEmployees(res.data);
    } catch (error) {
      console.log("Error fetching employees:", error);

      if (error.response?.status === 403) {
        alert("Session expired. Please login again.");
        navigate("/");
      }
    }
  }, [navigate]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 p-4 md:p-6 lg:p-8 xl:p-10">
      {/* Animated Shapes */}
      <div className="absolute w-24 h-24 md:w-32 md:h-32 xl:w-40 xl:h-40 bg-sky-400 rounded-full top-10 left-5 opacity-30 animate-pulse"></div>
      <div className="absolute w-32 h-32 md:w-44 md:h-44 xl:w-52 xl:h-52 bg-purple-400 rounded-full bottom-10 right-5 opacity-30 animate-pulse"></div>
      <div className="absolute w-20 h-20 md:w-28 md:h-28 xl:w-36 xl:h-36 bg-green-400 rounded-full top-1/2 right-1/4 opacity-30 animate-pulse"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className=" text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
            Employee List
          </h2>

          <button
            onClick={() => navigate("/admin/create-employees")}
            className="btn btn-success px-4 py-2 text-sm md:text-base xl:text-lg"
          >
            + Create Employee
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white bg-opacity-95 p-4 lg:p-6 xl:p-8 rounded-lg shadow-lg overflow-x-auto">
          <table className="table table-bordered table-hover text-nowrap w-full">
            <thead className="table-primary">
              <tr>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base">
                  Emp ID
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base">
                  Name
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base">
                  Email
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base">
                  Role
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base">
                  Department
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base hidden lg:table-cell">
                  Sub Department
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base hidden md:table-cell">
                  Employee Type
                </th>
                <th className="px-2 py-2 text-xs md:text-sm xl:text-base">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base">
                      {emp.emp_id}
                    </td>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base">
                      {emp.name}
                    </td>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base">
                      {emp.email}
                    </td>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base">
                      {emp.role}
                    </td>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base">
                      {emp.department}
                    </td>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base hidden lg:table-cell">
                      {emp.subDepartment}
                    </td>
                    <td className="px-2 py-2 text-xs md:text-sm xl:text-base hidden md:table-cell">
                      {emp.employeeType}
                    </td>

                    <td className="px-2 py-2">
                      <div
                        className="d-flex flex-wrap justify-content-center"
                        style={{
                          gap: "6px", // 🔥 better spacing than gap-1
                          minWidth: "120px", // 🔥 prevents collapse on mobile
                        }}
                      >
                        <button
                          onClick={() =>
                            navigate(`/admin/employees/view/${emp.id}`)
                          }
                          className="btn btn-sm btn-primary d-flex align-items-center justify-content-center"
                          style={{ minWidth: "36px" }}
                        >
                          <FaEye />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/admin/employees/edit/${emp.id}`)
                          }
                          className="btn btn-sm btn-warning d-flex align-items-center justify-content-center"
                          style={{ minWidth: "36px" }}
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="btn btn-sm btn-danger d-flex align-items-center justify-content-center"
                          style={{ minWidth: "36px" }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No Employees Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BACK BUTTON */}
        <div className="mt-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="btn btn-secondary px-4 py-2 text-sm md:text-base xl:text-lg"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Employees;
