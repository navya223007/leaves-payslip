import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaTrash } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

export default function ApplyLeave() {
  const { user } = useAuth();
  const employee = user || {};
  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.leave || null;
  const isEdit = !!editData;

  const halfRef = useRef(null);
  const singleRef = useRef(null);
  const multiRef = useRef(null);

  const today = new Date();

  const [leaveType, setLeaveType] = useState("half");
  const [subType, setSubType] = useState("single");

  const [date, setDate] = useState(null);
  const [session, setSession] = useState("");

  const [selectedDates, setSelectedDates] = useState([]);

  const [reasonType, setReasonType] = useState("");
  const [reasonText, setReasonText] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editData) return;

    setLeaveType(editData.leave_type || "half");
    setSubType(editData.sub_type || "single");

    setDate(editData.date ? new Date(editData.date) : null);
    setSession(editData.session || "");

    setReasonType(editData.reason_type || "");
    setReasonText(editData.reason_text || "");

    try {
      const parsed =
        typeof editData.selected_dates === "string"
          ? JSON.parse(editData.selected_dates)
          : editData.selected_dates;

      setSelectedDates(parsed || []);
    } catch {
      setSelectedDates([]);
    }
  }, [editData]);

  const formatLocalDate = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const addMultiDate = (d) => {
    const val = formatLocalDate(d);
    if (!selectedDates.includes(val)) {
      setSelectedDates([...selectedDates, val]);
    }
  };

  const removeDate = (d) => {
    setSelectedDates(selectedDates.filter((x) => x !== d));
  };

  const validate = () => {
    if (!leaveType) return "Select leave type";

    if (leaveType === "half") {
      if (!date) return "Select date";
      if (!session) return "Select session";
    }

    if (leaveType === "full") {
      if (subType === "single" && !date) return "Select date";
      if (subType === "multi" && selectedDates.length === 0)
        return "Select at least one date";
    }

    if (!reasonType) return "Select reason";
    if (reasonType === "other" && !reasonText) return "Enter reason";

    return null;
  };

  const submit = React.useCallback(async () => {
    const err = validate();
    if (err) return setError(err);

    setError("");
    setLoading(true);

    const payload = {
      emp_id: employee.emp_id,
      name: employee.name,
      department: employee.department,
      leave_type: leaveType,
      sub_type: leaveType === "full" ? subType : null,
      date: date ? formatLocalDate(date) : null,
      selected_dates: subType === "multi" ? selectedDates : [],
      session: leaveType === "half" ? session : null,
      reason_type: reasonType,
      reason_text: reasonText,
    };

    try {
      let res;
      if (isEdit) {
        res = await api.put(
          `/api/leaves/update/${editData.id}`,
          payload
        );
      } else {
        res = await api.post("/api/leaves/apply", payload);
      }

      alert(res.data.message);
      navigate("/employee");
    } catch (error) {
      console.log(error);
      setError("Submit failed");
    }

    setLoading(false);
  }, [employee, leaveType, subType, date, selectedDates, session, reasonType, reasonText, isEdit, editData, navigate]);
  return (
    <div className="glass-bg py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-12">
            {/* GLASS CARD */}
            <div className="glass-card p-4">
              <h4 className="text-center text-white fw-bold mb-3">
                {isEdit ? "Edit Leave" : "Apply Leave"}
              </h4>

              {error && (
                <div className="alert alert-danger py-2 text-center">
                  {error}
                </div>
              )}

              <div className="emp-box mb-3 text-center">
                {employee.name} | {employee.emp_id}
              </div>

              {/* LEAVE TYPE */}
              <div className="mb-3 text-white">
                <label className="form-label">Leave Type</label>
                <div className="d-flex gap-4 flex-wrap">
                  <label>
                    <input
                      type="radio"
                      checked={leaveType === "half"}
                      onChange={() => setLeaveType("half")}
                    />{" "}
                    Half Day
                  </label>

                  <label>
                    <input
                      type="radio"
                      checked={leaveType === "full"}
                      onChange={() => setLeaveType("full")}
                    />{" "}
                    Full Day
                  </label>
                </div>
              </div>

              {/* SUB TYPE */}
              {leaveType === "full" && (
                <select
                  className="form-select mb-3"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                >
                  <option value="single">Single</option>
                  <option value="multi">Multiple</option>
                </select>
              )}

              {/* DATE PICKERS */}
              <div className="mb-3">
                {subType === "single" && leaveType === "full" && (
                  <div>
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => singleRef.current.setOpen(true)}
                    >
                      <FaCalendarAlt />
                    </button>

                    {date && (
                      <span className="badge bg-dark ms-2">
                        {formatLocalDate(date)}
                        <FaTrash onClick={() => setDate(null)} />
                      </span>
                    )}

                    <DatePicker
                      ref={singleRef}
                      selected={date}
                      onChange={setDate}
                      minDate={today}
                      className="d-none"
                    />
                  </div>
                )}

                {subType === "multi" && leaveType === "full" && (
                  <div>
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => multiRef.current.setOpen(true)}
                    >
                      <FaCalendarAlt />
                    </button>

                    <DatePicker
                      ref={multiRef}
                      onChange={addMultiDate}
                      minDate={today}
                      className="d-none"
                    />

                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {selectedDates.map((d, i) => (
                        <span key={i} className="badge bg-secondary">
                          {d}
                          <FaTrash
                            className="ms-2"
                            onClick={() => removeDate(d)}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {leaveType === "half" && (
                  <div className="text-white">
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => halfRef.current.setOpen(true)}
                    >
                      <FaCalendarAlt />
                    </button>

                    <DatePicker
                      ref={halfRef}
                      selected={date}
                      onChange={setDate}
                      minDate={today}
                      className="d-none"
                    />
                  </div>
                )}
              </div>

              {/* SESSION */}
              {leaveType === "half" && (
                <div className="mb-3 text-white">
                  <label>Session</label>
                  <div className="d-flex gap-3">
                    <label>
                      <input
                        type="radio"
                        checked={session === "morning"}
                        onChange={() => setSession("morning")}
                      />{" "}
                      Morning
                    </label>

                    <label>
                      <input
                        type="radio"
                        checked={session === "afternoon"}
                        onChange={() => setSession("afternoon")}
                      />{" "}
                      Afternoon
                    </label>
                  </div>
                </div>
              )}

              {/* REASON */}
              <div className="mb-3 text-white">
                <label>Reason</label>

                <div className="d-flex flex-wrap gap-3">
                  {["sick", "travel", "family", "other"].map((r) => (
                    <label key={r}>
                      <input
                        type="radio"
                        checked={reasonType === r}
                        onChange={() => setReasonType(r)}
                      />{" "}
                      {r}
                    </label>
                  ))}
                </div>

                {reasonType === "other" && (
                  <textarea
                    className="form-control mt-2"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                  />
                )}
              </div>

              <button
                className="btn btn-primary w-100 mt-3"
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GLASS CSS */}
      <style>{`
        .glass-bg {
          min-height: 100vh;
          background: linear-gradient(135deg,#0f172a,#1e3a8a,#6d28d9);
        }

        .glass-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(15px);
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
        }

        .emp-box {
          background: rgba(255,255,255,0.1);
          padding: 8px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
