import React, { useEffect, useState, memo } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaIdCard,
  FaUniversity,
  FaCalendarAlt,
  FaUpload,
  FaSave,
  FaUserTie,
} from "react-icons/fa";

/* ================= FIELD ================= */

const Field = memo(
  ({ label, icon, name, value, onChange, color, error, placeholder }) => (
    <div className="col-xl-6 col-lg-6 col-md-6 col-12">
      <div className="formRow h-100">
        <div className="leftSide">
          <span className="icon" style={{ color }}>
            {icon}
          </span>

          <span className="label">{label}</span>
        </div>

        <div className="inputArea">
          <input
            className={`form-control form-control-lg inputBox ${
              error ? "inputError" : ""
            }`}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder || `Enter ${label}`}
          />

          {error && <div className="errorBox">⚠ {error}</div>}
        </div>
      </div>
    </div>
  ),
);

/* ================= FILE ================= */

const FileField = memo(({ label, name, onChange, preview }) => (
  <div className="col-xl-6 col-lg-6 col-md-6 col-12">
    <div className="formRow h-100">
      <div className="leftSide">
        <span className="icon fileIcon">
          <FaUpload />
        </span>

        <span className="label">{label}</span>
      </div>

      <div className="inputArea">
        <input
          type="file"
          className="form-control form-control-lg inputBox"
          name={name}
          onChange={onChange}
        />

        {/* ================= FILE PREVIEW ================= */}

        {preview ? (
          /\.(pdf|zip)$/i.test(preview) ? (
            <div className="filePreviewName">📄 {preview.split("/").pop()}</div>
          ) : (
            <img
              src={preview}
              alt="preview"
              className="previewImage"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )
        ) : (
          <div className="text-muted mt-2">No file uploaded</div>
        )}
      </div>
    </div>
  </div>
));

/* ================= MAIN ================= */

function EditEmployeePersonalDetails() {
  const { emp_id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

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

  const [files, setFiles] = useState({});

  const [preview, setPreview] = useState({});

  const [errors, setErrors] = useState({});

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    let newErrors = { ...errors };

    /* ================= DATE ================= */

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

      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

      if (!updatedValue.trim()) {
        newErrors[name] = "Required";
      } else if (!dateRegex.test(updatedValue)) {
        newErrors[name] = "DD/MM/YYYY";
      } else {
        delete newErrors[name];
      }
    }

    /* ================= PAN ================= */

    if (name === "pan_number") {
      updatedValue = value.toUpperCase().slice(0, 10);

      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (updatedValue && !panRegex.test(updatedValue)) {
        newErrors.pan_number = "ABCDE1234F";
      } else {
        delete newErrors.pan_number;
      }
    }

    /* ================= AADHAAR ================= */

    if (name === "aadhaar_number") {
      updatedValue = value.replace(/\D/g, "").slice(0, 12);

      if (updatedValue && updatedValue.length !== 12) {
        newErrors.aadhaar_number = "12 digits required";
      } else {
        delete newErrors.aadhaar_number;
      }
    }

    /* ================= BANK ================= */

    if (name === "bank_account_number") {
      updatedValue = value.replace(/\D/g, "").slice(0, 18);

      if (updatedValue && updatedValue.length < 9) {
        newErrors.bank_account_number = "Invalid Account";
      } else {
        delete newErrors.bank_account_number;
      }
    }

    /* ================= IFSC ================= */

    if (name === "ifsc_code") {
      updatedValue = value.toUpperCase().slice(0, 11);

      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

      if (updatedValue && !ifscRegex.test(updatedValue)) {
        newErrors.ifsc_code = "Invalid IFSC";
      } else {
        delete newErrors.ifsc_code;
      }
    }

    /* ================= NAME ================= */

    if (name === "emp_name") {
      if (!updatedValue.trim()) {
        newErrors.emp_name = "Required";
      } else if (updatedValue.trim().length < 3) {
        newErrors.emp_name = "Min 3 letters";
      } else {
        delete newErrors.emp_name;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    setErrors(newErrors);
  };

  /* ================= FILE ================= */
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    const name = e.target.name;

    if (!file) return;

    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));

    // IMAGE PREVIEW ONLY

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = () => {
        setPreview((p) => ({
          ...p,
          [name]: reader.result,
        }));
      };

      reader.readAsDataURL(file);
    } else {
      // PDF / ZIP

      setPreview((p) => ({
        ...p,
        [name]: file.name,
      }));
    }
  };

  /* ================= UPDATE ================= */

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = new FormData();

      Object.keys(formData).forEach((k) => {
        data.append(k, formData[k] || "");
      });

      Object.keys(files).forEach((k) => {
        if (files[k]) {
          data.append(k, files[k]);
        }
      });

      await api.put(`/api/personal-details/${emp_id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Updated Successfully");

      navigate("/admin/employee-details-personal/list");
    } catch (err) {
      console.log(err);

      alert("Update Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DATE FORMAT ================= */

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");

    const month = String(d.getMonth() + 1).padStart(2, "0");

    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/personal-details/${emp_id}`);
        const data = res.data;
        console.log(data);

        setFormData({
          ...data,
          date_of_birth: formatDate(data.date_of_birth),
          date_of_joining: formatDate(data.date_of_joining),
        });

        // EXISTING FILE PREVIEW

        const BASE_URL = api.defaults.baseURL;

        setPreview({
          aadhaar_file: data.aadhaar_file
            ? `${BASE_URL}/uploads/aadhaar/${data.aadhaar_file}`
            : null,

          pan_file: data.pan_file
            ? `${BASE_URL}/uploads/pan/${data.pan_file}`
            : null,

          bank_file: data.bank_file
            ? `${BASE_URL}/uploads/bank/${data.bank_file}`
            : null,
        });
      } catch (err) {
        console.log(err);
      }
    };

    load();
  }, [emp_id]);

  return (
    <div className="page">
      <div className="container-fluid">
        <div className="cardBox">
          {/* ================= HEADER ================= */}

          <div className="header">
            <div className="iconBox">
              <FaUserTie />
            </div>

            <div>
              <h3>Edit Employee Personal Details</h3>

              <p>Update Aadhaar, PAN, Bank & Files</p>
            </div>
          </div>

          {/* ================= FORM ================= */}

          <form onSubmit={handleUpdate}>
            <div className="row g-4 align-items-stretch">
              <Field
                label="Employee Name"
                icon={<FaUserTie />}
                name="emp_name"
                value={formData.emp_name}
                onChange={handleChange}
                color="#0d6efd"
                error={errors.emp_name}
              />

              <Field
                label="Employee ID"
                icon={<FaIdCard />}
                name="emp_id"
                value={formData.emp_id}
                onChange={handleChange}
                color="#6610f2"
              />

              <Field
                label="Date Of Birth"
                icon={<FaCalendarAlt />}
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                color="#198754"
                error={errors.date_of_birth}
                placeholder="DD/MM/YYYY"
              />

              <Field
                label="Date Of Joining"
                icon={<FaCalendarAlt />}
                name="date_of_joining"
                value={formData.date_of_joining}
                onChange={handleChange}
                color="#0dcaf0"
                error={errors.date_of_joining}
                placeholder="DD/MM/YYYY"
              />

              <Field
                label="Aadhaar Number"
                icon={<FaIdCard />}
                name="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                color="#198754"
                error={errors.aadhaar_number}
                placeholder="Enter 12 Digit Aadhaar"
              />

              <FileField
                label="Aadhaar File"
                name="aadhaar_file"
                onChange={handleFileChange}
                preview={preview.aadhaar_file}
              />

              <Field
                label="PAN Number"
                icon={<FaIdCard />}
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                color="#dc3545"
                error={errors.pan_number}
                placeholder="ABCDE1234F"
              />

              <FileField
                label="PAN File"
                name="pan_file"
                onChange={handleFileChange}
                preview={preview.pan_file}
              />

              <Field
                label="Bank Account"
                icon={<FaUniversity />}
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
                color="#ffc107"
                error={errors.bank_account_number}
              />
              <FileField
                label="Bank File"
                name="bank_file"
                onChange={handleFileChange}
                preview={preview.bank_file}
              />

              <Field
                label="IFSC Code"
                icon={<FaUniversity />}
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                color="#fd7e14"
                error={errors.ifsc_code}
                placeholder="SBIN0001234"
              />
            </div>

            {/* ================= BUTTONS ================= */}

            <div className="buttonArea">
              <button
                type="button"
                className="btn btn-dark backBtn"
                onClick={() => navigate(-1)}
              >
                Back
              </button>

              <button
                type="submit"
                className="btn btn-success saveBtn"
                disabled={loading}
              >
                <FaSave className="me-2" />

                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= CSS ================= */}

      <style>{`

/* =======================================================
   LIGHT MODE
======================================================= */

.bg-light .page{
  background:
  linear-gradient(135deg,#eef4ff,#f8fbff,#edf2ff);
}

.bg-light .cardBox{
  background:rgba(255,255,255,0.95);
  border:1px solid #e5e7eb;
  box-shadow:
  0 10px 30px rgba(0,0,0,0.08);
}

.bg-light .header h3{
  color:#111827;
}

.bg-light .header p{
  color:#64748b;
}

.bg-light .formRow{
  background:#ffffff;
  border:1px solid #e2e8f0;
}

.bg-light .formRow:hover{
  border-color:#0d6efd;
  box-shadow:0 6px 18px rgba(13,110,253,0.08);
}

.bg-light .label{
  color:#1e293b;
}

.bg-light .icon{
  background:#eef4ff;
}

.bg-light .inputBox{
  background:#ffffff !important;
  color:#111827 !important;
  border:1px solid #dbe4f0 !important;
}

.bg-light .inputBox::placeholder{
  color:#94a3b8 !important;
}

.bg-light .inputBox:focus{
  border-color:#0d6efd !important;
  box-shadow:
  0 0 0 4px rgba(13,110,253,0.12) !important;
}

.bg-light .filePreviewName{
  background:#f1f5f9;
  color:#111827;
}

.bg-light .text-muted{
  color:#64748b !important;
}

/* =======================================================
   DARK MODE
======================================================= */

.bg-dark .page{
  background:
  linear-gradient(135deg,#0f172a,#111827,#1e293b);
}

.bg-dark .cardBox{
  background:rgba(17,24,39,0.96);
  border:1px solid #334155;
  box-shadow:
  0 10px 30px rgba(0,0,0,0.45);
}

.bg-dark .header h3{
  color:#f8fafc !important;
}

.bg-dark .header p{
  color:#cbd5e1 !important;
}

.bg-dark .formRow{
  background:#1e293b;
  border:1px solid #334155;
}

.bg-dark .formRow:hover{
  border-color:#3b82f6;
  box-shadow:
  0 8px 20px rgba(59,130,246,0.12);
}

.bg-dark .label{
  color:#f1f5f9 !important;
}

.bg-dark .icon{
  background:#334155;
}

.bg-dark .inputBox{
  background:#0f172a !important;
  color:#f8fafc !important;
  border:1px solid #475569 !important;
}

.bg-dark .inputBox::placeholder{
  color:#94a3b8 !important;
}

.bg-dark .inputBox:focus{
  border-color:#3b82f6 !important;
  box-shadow:
  0 0 0 4px rgba(59,130,246,0.16) !important;
}



.bg-dark .filePreviewName{
  background:#0f172a;
  color:#f8fafc;
  border:1px solid #334155;
}

.bg-dark .text-muted{
  color:#cbd5e1 !important;
}

.bg-dark .errorBox{
  background:#3b0d16;
  color:#fecaca;
  padding:8px 12px;
  border-radius:10px;
}

.bg-dark .previewImage{
  border:2px solid #475569;
}

.bg-dark .backBtn{
  background:#374151 !important;
  border:none !important;
  color:#fff !important;
}

.bg-dark .saveBtn{
  background:
  linear-gradient(135deg,#16a34a,#2563eb) !important;
  border:none !important;
  color:#fff !important;
}

/* =======================================================
   PAGE
======================================================= */

.page{
  min-height:100vh;
  padding:25px;
  transition:0.3s ease;
}

/* =======================================================
   CARD
======================================================= */

.cardBox{
  border-radius:24px;
  padding:30px;
  transition:0.3s ease;
}

/* =======================================================
   HEADER
======================================================= */

.header{
  display:flex;
  align-items:center;
  gap:18px;
  margin-bottom:35px;
  flex-wrap:wrap;
}

.iconBox{
  width:65px;
  height:65px;
  border-radius:18px;
  background:
  linear-gradient(135deg,#198754,#0d6efd);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
  box-shadow:
  0 8px 20px rgba(13,110,253,0.25);
}

.header h3{
  margin:0;
  font-size:28px;
  font-weight:800;
}

.header p{
  margin:0;
  font-size:14px;
}

/* =======================================================
   FORM
======================================================= */

.formRow{
  display:flex;
  align-items:flex-start;
  gap:18px;
  padding:18px;
  border-radius:18px;
  transition:0.3s ease;
  height:100%;
}

/* =======================================================
   LEFT
======================================================= */

.leftSide{
  min-width:210px;
  display:flex;
  align-items:center;
  gap:12px;
  padding-top:8px;
}

.icon{
  width:42px;
  height:42px;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:18px;
  flex-shrink:0;
}

.label{
  font-size:15px;
  font-weight:700;
}

/* =======================================================
   INPUT
======================================================= */

.inputArea{
  flex:1;
  width:100%;
}

.inputBox{
  width:100%;
  min-height:54px;
  border-radius:14px !important;
  font-size:15px !important;
  padding:12px 16px !important;
  box-shadow:none !important;
  transition:0.25s ease !important;
}

.inputError{
  border:1px solid #dc3545 !important;
}

.errorBox{
  margin-top:7px;
  font-size:13px;
  font-weight:600;
}

/* =======================================================
   FILE
======================================================= */
/* =======================================================
   FILE
======================================================= */

input[type="file"]{
  width:100%;
  overflow:hidden;
  padding:6px !important;
  cursor:pointer;
  border-radius:14px !important;
}

/* LIGHT MODE FILE INPUT */

.bg-light input[type="file"]{
  background:#ffffff !important;
  color:#111827 !important;
  border:1px solid #dbe4f0 !important;
}

.bg-light input[type="file"]::file-selector-button{
  background:linear-gradient(135deg,#0d6efd,#2563eb);
  color:#fff;
  border:none;
  padding:10px 16px;
  border-radius:10px;
  margin-right:12px;
  cursor:pointer;
  font-size:14px;
  font-weight:600;
  transition:0.3s ease;
}

.bg-light input[type="file"]::file-selector-button:hover{
  opacity:0.9;
}

/* DARK MODE FILE INPUT */

.bg-dark input[type="file"]{
  background:#0f172a !important;
  color:#f8fafc !important;
  border:1px solid #475569 !important;
}

.bg-dark input[type="file"]::file-selector-button{
  background:linear-gradient(135deg,#2563eb,#3b82f6);
  color:#ffffff;
  border:none;
  padding:10px 16px;
  border-radius:10px;
  margin-right:12px;
  cursor:pointer;
  font-size:14px;
  font-weight:600;
  transition:0.3s ease;
}

.bg-dark input[type="file"]::file-selector-button:hover{
  opacity:0.9;
}

/* PREVIEW */

.previewImage{
  width:75px;
  height:75px;
  object-fit:cover;
  border-radius:12px;
  margin-top:10px;
}

.filePreviewName{
  margin-top:10px;
  padding:10px 12px;
  border-radius:12px;
  font-size:14px;
  font-weight:600;
  word-break:break-word;
}
.previewImage{
  width:75px;
  height:75px;
  object-fit:cover;
  border-radius:12px;
  margin-top:10px;
}

.filePreviewName{
  margin-top:10px;
  padding:10px 12px;
  border-radius:12px;
  font-size:14px;
  font-weight:600;
  word-break:break-word;
}

/* =======================================================
   BUTTONS
======================================================= */

.buttonArea{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:35px;
  gap:15px;
  flex-wrap:wrap;
}

.backBtn,
.saveBtn{
  min-width:150px;
  height:50px;
  border-radius:14px !important;
  font-weight:700 !important;
  transition:0.25s ease;
}

.saveBtn{
  background:
  linear-gradient(135deg,#198754,#0d6efd);
  border:none !important;
}

.saveBtn:hover{
  transform:translateY(-2px);
}

.backBtn:hover{
  transform:translateY(-2px);
}

/* =======================================================
   RESPONSIVE
======================================================= */

@media(max-width:1200px){

  .leftSide{
    min-width:180px;
  }

}

@media(max-width:992px){

  .page{
    padding:18px;
  }

  .cardBox{
    padding:24px;
  }

  .formRow{
    flex-direction:column;
    gap:14px;
  }

  .leftSide{
    min-width:100%;
    padding-top:0;
  }

}

@media(max-width:576px){

  .page{
    padding:10px;
  }

  .cardBox{
    padding:18px;
    border-radius:18px;
  }

  .header{
    margin-bottom:25px;
  }

  .header h3{
    font-size:22px;
  }

  .header p{
    font-size:13px;
  }

  .iconBox{
    width:55px;
    height:55px;
    font-size:24px;
  }

  .formRow{
    padding:14px;
  }

  .label{
    font-size:14px;
  }

  .inputBox{
    min-height:48px;
    font-size:14px !important;
  }

  input[type="file"]::file-selector-button{
    padding:8px 12px;
    font-size:12px;
  }

  .buttonArea{
    flex-direction:column;
  }

  .backBtn,
  .saveBtn{
    width:100%;
  }

}

@media(max-width:400px){

  .header{
    flex-direction:column;
    align-items:flex-start;
  }

  .leftSide{
    gap:10px;
  }

  .icon{
    width:38px;
    height:38px;
    font-size:16px;
  }

}

`}</style>
    </div>
  );
}

export default EditEmployeePersonalDetails;
