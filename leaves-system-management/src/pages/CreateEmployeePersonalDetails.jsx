import React, { useState, memo } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
  FaIdCard,
  FaUniversity,
  FaCalendarAlt,
  FaUpload,
  FaSave,
  FaUserTie,
} from "react-icons/fa";

/* ======================================================
   FIELD COMPONENT
====================================================== */

const Field = memo(
  ({
    label,
    icon,
    name,
    type = "text",
    color,
    value,
    onChange,
    error,
    placeholder,
  }) => (
    <div className="col-lg-6">
      <div className="formRow">
        <div className="leftSide">
          <span className="icon" style={{ color }}>
            {icon}
          </span>

          <span className="label">{label}</span>
        </div>

        <div className="inputWrapper">
          <input
            type={type}
            className={`form-control form-control-lg inputBox ${
              error ? "inputError" : ""
            }`}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete="off"
          />

          {error && <div className="errorBox">⚠ {error}</div>}
        </div>
      </div>
    </div>
  ),
);

/* ======================================================
   FILE FIELD
====================================================== */

const FileField = memo(
  ({ label, name, handleFileChange, filePreview, errors }) => (
    <div className="col-lg-6">
      <div className="formRow">
        <div className="leftSide">
          <span className="icon fileIcon">
            <FaUpload />
          </span>

          <span className="label">{label}</span>
        </div>

        <div className="inputWrapper">
          <input
            type="file"
            className="form-control form-control-lg inputBox"
            name={name}
            onChange={handleFileChange}
          />

          {errors[name] && <div className="errorBox">⚠ {errors[name]}</div>}

          {filePreview[name] && (
            <img
              src={filePreview[name]}
              alt="preview"
              className="previewImage"
            />
          )}
        </div>
      </div>
    </div>
  ),
);

function CreateEmployeePersonalDetails() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    emp_name: "",
    emp_id: "",
    aadhaar_number: "",
    pan_number: "",
    date_of_birth: "",
    date_of_joining: "",
    bank_account_number: "",
    ifsc_code: "",
  });

  const [files, setFiles] = useState({
    aadhaar_file: null,
    pan_file: null,
    bank_file: null,
  });

  const [filePreview, setFilePreview] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /* ======================================================
     FETCH EMPLOYEE
  ====================================================== */

  const fetchEmployeeData = async (empId) => {
    try {
      const res = await api.get(`/api/employee-basic/${empId}`);

      const data = res.data;

      setFormData((prev) => ({
        ...prev,
        emp_id: data.emp_id || "",
        emp_name: data.name || data.emp_name || "",
      }));

      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.emp_name;
        return updated;
      });
    } catch (err) {
      console.log(err);

      setFormData((prev) => ({
        ...prev,
        emp_name: "",
      }));
    }
  };

  /* ======================================================
     HANDLE CHANGE
  ====================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("========== CREATE HANDLE CHANGE ==========");
    console.log("Field:", name);
    console.log("Original Value:", value);

    let updatedValue = value;

    if (name === "emp_id") {
      updatedValue = value.toUpperCase();
    }

    if (name === "date_of_birth" || name === "date_of_joining") {
      updatedValue = value.replace(/\D/g, "").slice(0, 8);

      if (updatedValue.length > 4) {
        updatedValue =
          updatedValue.slice(0, 2) +
          "/" +
          updatedValue.slice(2, 4) +
          "/" +
          updatedValue.slice(4);
      } else if (updatedValue.length > 2) {
        updatedValue = updatedValue.slice(0, 2) + "/" + updatedValue.slice(2);
      }
    }

    if (name === "pan_number") {
      updatedValue = value.toUpperCase().slice(0, 10);
    }

    if (name === "aadhaar_number") {
      updatedValue = value.replace(/\D/g, "").slice(0, 12);
    }

    if (name === "bank_account_number") {
      updatedValue = value.replace(/\D/g, "").slice(0, 18);
    }

    if (name === "ifsc_code") {
      updatedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);
    }
    console.log("Updated Value:", updatedValue);
    console.log("=========================================");
    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    let newErrors = { ...errors };

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (name === "emp_name") {
      if (!updatedValue.trim()) {
        newErrors.emp_name = "Employee Name is required";
      } else {
        delete newErrors.emp_name;
      }
    }

    if (name === "emp_id") {
      if (!updatedValue.trim()) {
        newErrors.emp_id = "Employee ID is required";
      } else {
        delete newErrors.emp_id;

        if (updatedValue.length >= 9) {
          fetchEmployeeData(updatedValue);
        }
      }
    }

    if (name === "date_of_birth") {
      if (!dateRegex.test(updatedValue)) {
        newErrors.date_of_birth = "Date format should be DD/MM/YYYY";
      } else {
        delete newErrors.date_of_birth;
      }
    }

    if (name === "date_of_joining") {
      if (!dateRegex.test(updatedValue)) {
        newErrors.date_of_joining = "Date format should be DD/MM/YYYY";
      } else {
        delete newErrors.date_of_joining;
      }
    }

    if (name === "aadhaar_number") {
      if (updatedValue && updatedValue.length !== 12) {
        newErrors.aadhaar_number = "Aadhaar number must be exactly 12 digits";
      } else {
        delete newErrors.aadhaar_number;
      }
    }

    if (name === "pan_number") {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (updatedValue && !panRegex.test(updatedValue)) {
        newErrors.pan_number = "PAN format should be like ABCDE1234F";
      } else {
        delete newErrors.pan_number;
      }
    }

    if (name === "bank_account_number") {
      if (updatedValue && updatedValue.length < 9) {
        newErrors.bank_account_number = "Bank account number is too short";
      } else {
        delete newErrors.bank_account_number;
      }
    }

    if (name === "ifsc_code") {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

      if (updatedValue && !ifscRegex.test(updatedValue)) {
        newErrors.ifsc_code = "IFSC format should be like SBIN0001234";
      } else {
        delete newErrors.ifsc_code;
      }
    }

    setErrors(newErrors);
  };

  /* ======================================================
     FILE CHANGE
  ====================================================== */

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;

    const file = fileList[0];

    if (!file) return;

    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = () => {
        setFilePreview((prev) => ({
          ...prev,
          [name]: reader.result,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  /* ======================================================
     SUBMIT
  ====================================================== */

  // ======================================================
  // SUBMIT
  // ======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("========== CREATE SUBMIT DEBUG ==========");
    console.log("Form Data:", formData);
    console.log("Employee ID:", formData.emp_id);
    console.log("Employee Name:", formData.emp_name);
    console.log("Date Of Birth:", formData.date_of_birth);
    console.log("Date Of Joining:", formData.date_of_joining);
    console.log("Aadhaar:", formData.aadhaar_number);
    console.log("PAN:", formData.pan_number);
    console.log("Bank Account:", formData.bank_account_number);
    console.log("IFSC:", formData.ifsc_code);
    console.log("Files:", files);
    console.log("==========================================");

    let newErrors = {};

    // ======================================================
    // REQUIRED VALIDATIONS
    // ======================================================

    if (!formData.emp_name.trim()) {
      newErrors.emp_name = "Employee Name is required";
    }

    if (!formData.emp_id.trim()) {
      newErrors.emp_id = "Employee ID is required";
    }

    if (!formData.date_of_birth.trim()) {
      newErrors.date_of_birth = "Date Of Birth is required";
    }

    if (!formData.date_of_joining.trim()) {
      newErrors.date_of_joining = "Date Of Joining is required";
    }

    // ======================================================
    // DATE FORMAT VALIDATION
    // ======================================================
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (formData.date_of_joining && !dateRegex.test(formData.date_of_joining)) {
      newErrors.date_of_joining = "Date format should be DD/MM/YYYY";
    }

    if (formData.date_of_birth && !dateRegex.test(formData.date_of_birth)) {
      newErrors.date_of_birth = "Date format should be DD/MM/YYYY";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // ======================================================
    // API SUBMIT
    // ======================================================

    try {
      setLoading(true);

      const data = new FormData();

      Object.keys(formData).forEach((k) => {
        data.append(k, formData[k]);
      });

      Object.keys(files).forEach((k) => {
        if (files[k]) {
          data.append(k, files[k]);
        }
      });

      await api.post("/api/personal-details", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Saved Successfully");
      navigate("/admin/employee-details-personal/list");
    } catch (err) {
      console.log("========== CREATE API ERROR ==========");
      console.log("ERROR OBJECT:", err);
      console.log("STATUS:", err?.response?.status);
      console.log("DATA:", err?.response?.data);
      console.log("MESSAGE:", err?.response?.data?.message);
      console.log("ERROR MESSAGE:", err?.message);
      console.log("======================================");

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to save employee details";

      setErrors((prev) => ({
        ...prev,
        date_of_joining: backendMessage,
      }));

      return;
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="pageWrapper">
        <div className="container-fluid">
          <div className="mainCard">
            {/* HEADER */}

            <div className="headerSection">
              <div className="headerLeft">
                <div className="headerIcon">
                  <FaUserTie />
                </div>

                <div>
                  <h2 className="mainTitle">
                    Create Employee Personal Details
                  </h2>

                  <p className="subTitle">
                    Aadhaar, PAN, Bank & Personal Information
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <Field
                  label="Employee Name"
                  icon={<FaUserTie />}
                  name="emp_name"
                  color="#2563eb"
                  value={formData.emp_name}
                  onChange={handleChange}
                  error={errors.emp_name}
                  placeholder="Enter employee name"
                />

                <Field
                  label="Employee ID"
                  icon={<FaIdCard />}
                  name="emp_id"
                  color="#7c3aed"
                  value={formData.emp_id}
                  onChange={handleChange}
                  error={errors.emp_id}
                  placeholder="EMP001"
                />

                <Field
                  label="Date Of Birth"
                  icon={<FaCalendarAlt />}
                  name="date_of_birth"
                  color="#0ea5e9"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  error={errors.date_of_birth}
                  placeholder="dd/mm/yyyy"
                />

                <Field
                  label="Date Of Joining"
                  icon={<FaCalendarAlt />}
                  name="date_of_joining"
                  color="#8b5cf6"
                  value={formData.date_of_joining}
                  onChange={handleChange}
                  error={errors.date_of_joining}
                  placeholder="dd/mm/yyyy"
                />

                <Field
                  label="Aadhaar Number"
                  icon={<FaIdCard />}
                  name="aadhaar_number"
                  color="#16a34a"
                  value={formData.aadhaar_number}
                  onChange={handleChange}
                  error={errors.aadhaar_number}
                  placeholder="123412341234"
                />

                <FileField
                  label="Aadhaar File"
                  name="aadhaar_file"
                  handleFileChange={handleFileChange}
                  filePreview={filePreview}
                  errors={errors}
                />

                <Field
                  label="PAN Number"
                  icon={<FaIdCard />}
                  name="pan_number"
                  color="#dc2626"
                  value={formData.pan_number}
                  onChange={handleChange}
                  error={errors.pan_number}
                  placeholder="ABCDE1234F"
                />

                <FileField
                  label="PAN File"
                  name="pan_file"
                  handleFileChange={handleFileChange}
                  filePreview={filePreview}
                  errors={errors}
                />

                <Field
                  label="Bank Account Number"
                  icon={<FaUniversity />}
                  name="bank_account_number"
                  color="#f59e0b"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  error={errors.bank_account_number}
                  placeholder="123456789012"
                />

                <FileField
                  label="Bank File"
                  name="bank_file"
                  handleFileChange={handleFileChange}
                  filePreview={filePreview}
                  errors={errors}
                />

                <Field
                  label="IFSC Code"
                  icon={<FaIdCard />}
                  name="ifsc_code"
                  color="#2563eb"
                  value={formData.ifsc_code}
                  onChange={handleChange}
                  error={errors.ifsc_code}
                  placeholder="SBIN0001234"
                />
              </div>

              {/* BUTTONS */}

              <div className="buttonSection">
                <button
                  type="button"
                  className="btn backBtn"
                  onClick={() => window.history.back()}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="btn saveBtn"
                  disabled={loading}
                >
                  <FaSave className="me-2" />

                  {loading ? "Saving..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* CSS */}

      <style>{`

/* ======================================================
   PAGE
====================================================== */

.pageWrapper{
  min-height:100vh;
  padding:24px;

  background:
  linear-gradient(
    135deg,
    #eef4ff 0%,
    #f8fbff 50%,
    #ffffff 100%
  );
}

/* LIGHT MODE */

.bg-light .pageWrapper{
  background:
  linear-gradient(
    135deg,
    #eef4ff 0%,
    #f8fbff 50%,
    #ffffff 100%
  );
}

/* DARK MODE */

.bg-dark .pageWrapper{
  background:
  linear-gradient(
    135deg,
    #0f172a 0%,
    #111827 50%,
    #1e293b 100%
  );
}

/* ======================================================
   CARD
====================================================== */

.mainCard{
  background:#ffffff;
  border-radius:28px;
  padding:32px;

  box-shadow:
  0 10px 35px rgba(0,0,0,0.08);

  transition:0.3s ease;
}

.bg-dark .mainCard{
  background:#111827;
  border:1px solid #334155;

  box-shadow:
  0 10px 35px rgba(0,0,0,0.35);
}

/* ======================================================
   HEADER
====================================================== */

.headerSection{
  margin-bottom:32px;
}

.headerLeft{
  display:flex;
  align-items:center;
  gap:18px;
}

.headerIcon{
  width:70px;
  height:70px;

  border-radius:20px;

  display:flex;
  align-items:center;
  justify-content:center;

  font-size:28px;
  color:#fff;

  background:
  linear-gradient(
    135deg,
    #2563eb,
    #7c3aed
  );

  box-shadow:
  0 10px 25px rgba(37,99,235,0.30);
}

.mainTitle{
  margin:0;

  font-size:30px;
  font-weight:800;

  color:#111827;
}

.subTitle{
  margin-top:6px;

  color:#64748b;

  font-size:14px;
  font-weight:500;
}

.bg-dark .mainTitle{
  color:#f8fafc;
}

.bg-dark .subTitle{
  color:#cbd5e1;
}

/* ======================================================
   FORM ROW
====================================================== */

.formRow{
  display:flex;
  align-items:flex-start;
  gap:16px;

  background:#f8fbff;

  border:1px solid #e2e8f0;

  border-radius:18px;

  padding:18px;

  height:100%;
}

.bg-dark .formRow{
  background:#1e293b;
  border:1px solid #334155;
}

/* ======================================================
   LEFT SIDE
====================================================== */

.leftSide{
  width:220px;

  display:flex;
  align-items:center;
  gap:12px;

  flex-shrink:0;
}

.icon{
  font-size:20px;
}

.label{
  font-size:15px;
  font-weight:700;
  color:#1e293b;
}

.bg-dark .label{
  color:#f1f5f9;
}

.fileIcon{
  color:#64748b;
}

/* ======================================================
   INPUT
====================================================== */

.inputWrapper{
  flex:1;
  width:100%;
}

.inputBox{
  border-radius:14px !important;

  min-height:52px;

  border:1px solid #cbd5e1 !important;

  background:#ffffff !important;

  color:#111827 !important;

  font-size:14px !important;
  font-weight:600 !important;

  box-shadow:none !important;
}

.inputBox:focus{
  border-color:#2563eb !important;

  box-shadow:
  0 0 0 4px rgba(37,99,235,0.12) !important;
}

.bg-dark .inputBox{
  background:#0f172a !important;

  border:1px solid #475569 !important;

  color:#f8fafc !important;
}

.bg-dark .inputBox::placeholder{
  color:#94a3b8 !important;
}

/* ======================================================
   ERROR
====================================================== */

.inputError{
  border:1px solid #dc2626 !important;
}

.errorBox{
  margin-top:8px;

  background:#fee2e2;
  color:#dc2626;

  padding:10px 12px;

  border-radius:12px;

  font-size:13px;
  font-weight:700;
}

/* ======================================================
   IMAGE PREVIEW
====================================================== */

.previewImage{
  width:70px;
  height:70px;

  object-fit:cover;

  margin-top:10px;

  border-radius:12px;

  border:2px solid #dbeafe;
}

/* ======================================================
   BUTTONS
====================================================== */

.buttonSection{
  display:flex;
  justify-content:space-between;
  align-items:center;

  gap:15px;

  margin-top:35px;
}

.backBtn{
  padding:12px 24px;

  border-radius:14px;

  background:#e2e8f0;
  color:#111827;

  font-weight:700;

  border:none;
}

.backBtn:hover{
  background:#cbd5e1;
}

.saveBtn{
  padding:12px 28px;

  border:none;

  border-radius:14px;

  background:
  linear-gradient(
    135deg,
    #2563eb,
    #7c3aed
  );

  color:#fff;

  font-weight:700;

  box-shadow:
  0 10px 25px rgba(37,99,235,0.25);
}

.saveBtn:hover{
  transform:translateY(-2px);
}

/* ======================================================
   RESPONSIVE
====================================================== */

@media(max-width:992px){

  .formRow{
    flex-direction:column;
  }

  .leftSide{
    width:100%;
  }

}

@media(max-width:768px){

  .pageWrapper{
    padding:14px;
  }

  .mainCard{
    padding:20px;
  }

  .headerLeft{
    align-items:flex-start;
  }

  .headerIcon{
    width:60px;
    height:60px;
    font-size:24px;
  }

  .mainTitle{
    font-size:22px;
  }

  .buttonSection{
    flex-direction:column;
  }

  .backBtn,
  .saveBtn{
    width:100%;
  }

}

      `}</style>
    </>
  );
}

export default CreateEmployeePersonalDetails;
