import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";

function ReadEmployeePersonalDetails() {
  const navigate = useNavigate();
  const { emp_id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= FETCH API =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/personal-details/${emp_id}`);

        setEmployee(res.data);
      } catch (err) {
        console.log(err);
        alert("Failed to load employee details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emp_id]);

  if (loading) {
    return <h4 className="p-4">Loading...</h4>;
  }

  if (!employee) {
    return <h4 className="p-4 text-danger">No Data Found</h4>;
  }

  return (
    <div
      className="p-4 rounded-4 text-dark"
      style={{
        background: "linear-gradient(to right, #89f7fe, #66a6ff)",
      }}
    >
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">Employee Details</h3>

        <div className="d-flex gap-2">
          <button className="btn btn-dark" onClick={() => navigate(-1)}>
            ⬅ Back
          </button>

          <button
            className="btn btn-warning fw-bold"
            onClick={() => navigate(`/admin/employee-details/edit/${emp_id}`)}
          >
            ✏ Edit
          </button>
        </div>
      </div>

      {/* DETAILS CARD */}
      <div className="row bg-white p-4 rounded-4 shadow">
        <div className="col-md-6 mb-3">
          <strong>Employee ID :</strong> {employee.emp_id}
        </div>

        <div className="col-md-6 mb-3">
          <strong>Name :</strong> {employee.emp_name}
        </div>

        <div className="col-md-6 mb-3">
          <strong>Aadhaar :</strong> {employee.aadhaar_number}
        </div>

        <div className="col-md-6 mb-3">
          <strong>PAN :</strong> {employee.pan_number}
        </div>

        <div className="col-md-6 mb-3">
          <strong>DOB :</strong> {employee.date_of_birth}
        </div>

        <div className="col-md-6 mb-3">
          <strong>Date of Joining :</strong> {employee.date_of_joining}
        </div>

        <div className="col-md-6 mb-3">
          <strong>Last Appraisal :</strong> {employee.last_appraisal_date}
        </div>

        <div className="col-md-6 mb-3">
          <strong>Next Appraisal :</strong> {employee.next_appraisal_date}
        </div>
      </div>
    </div>
  );
}

export default ReadEmployeePersonalDetails;
