import React, { useEffect, useState, memo } from "react";
import api, { BASE_URL } from "../api";
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

function EditMyProfile() {
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

      navigate("/employee/my-details");
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

       const BASE_URL = process.env.REACT_APP_API_URL || "";
       
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

              <FileField
                label="Bank File"
                name="bank_file"
                onChange={handleFileChange}
                preview={preview.bank_file}
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

.page{
  min-height:100vh;
  background:#f4f7fb;
  padding:25px;
}

/* ================= CARD ================= */

.cardBox{
  background:#fff;
  border-radius:24px;
  padding:30px;
  box-shadow:0 10px 30px rgba(0,0,0,0.06);
  border:1px solid #edf1f7;
}

/* ================= HEADER ================= */

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
  background:linear-gradient(135deg,#198754,#0d6efd);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
}

.header h3{
  margin:0;
  font-size:28px;
  font-weight:700;
  color:#1d3557;
}

.header p{
  margin:0;
  color:#6c757d;
  font-size:14px;
}

/* ================= FORM ================= */

.formRow{
  display:flex;
  align-items:flex-start;
  gap:18px;
  padding:18px;
  background:#fafcff;
  border:1px solid #edf2f7;
  border-radius:18px;
  transition:0.3s;
}

.formRow:hover{
  border-color:#cfe2ff;
}

/* ================= LEFT ================= */

.leftSide{
  min-width:210px;
  display:flex;
  align-items:center;
  gap:12px;
  padding-top:10px;
}

.icon{
  width:42px;
  height:42px;
  border-radius:12px;
  background:#eef4ff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:18px;
  flex-shrink:0;
}

.label{
  font-size:15px;
  font-weight:600;
  color:#2d3748;
}

/* ================= INPUT ================= */

.inputArea{
  flex:1;
  width:100%;
}

.inputBox{
  width:100%;
  min-height:52px;
  border-radius:14px !important;
  border:1px solid #dbe4f0 !important;
  font-size:15px !important;
  padding:12px 16px !important;
  box-shadow:none !important;
}

.inputBox:focus{
  border-color:#0d6efd !important;
  box-shadow:0 0 0 3px rgba(13,110,253,0.12) !important;
}

.inputBox::placeholder{
  color:#9aa5b1;
  font-size:14px;
}

/* ================= FILE ================= */

input[type="file"]{
  overflow:hidden;
  padding:8px !important;
}

input[type="file"]::file-selector-button{
  border:none;
  background:#0d6efd;
  color:#fff;
  padding:10px 16px;
  border-radius:10px;
  margin-right:10px;
  cursor:pointer;
  font-size:14px;
}

.previewImage{
  width:70px;
  height:70px;
  object-fit:cover;
  border-radius:12px;
  border:2px solid #dee2e6;
  margin-top:10px;
}

/* ================= ERROR ================= */

.inputError{
  border:1px solid #dc3545 !important;
}

.errorBox{
  margin-top:6px;
  color:#dc3545;
  font-size:13px;
  font-weight:500;
}

/* ================= BUTTON ================= */

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
  min-width:140px;
  height:50px;
  border-radius:14px !important;
  font-weight:600 !important;
}
  .filePreviewName{
  margin-top:10px;
  padding:10px;
  background:#f1f3f5;
  border-radius:10px;
  font-size:14px;
  word-break:break-word;
}

/* ================= MEDIA QUERY ================= */

/* Laptop */

@media(max-width:1200px){

  .leftSide{
    min-width:180px;
  }

}

/* Tablet */

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

/* Mobile */

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

/* Extra Small */

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

export default EditMyProfile;
