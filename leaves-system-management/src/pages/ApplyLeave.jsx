import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaTrash } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
export default function ApplyLeave() {
  const { user, token } = useAuth();
  const employee = user || {};
  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.leave || null;
  const isEdit = !!editData;

  const halfRef = useRef(null);
  const singleRef = useRef(null);
  const multiRef = useRef(null);

const [serverDate, setServerDate] = useState(null);

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
  const fetchServerDate = async () => {
    try {
      const res = await api.get("/api/server-time");
      setServerDate(new Date(res.data.date + "T00:00:00"));
    } catch (error) {
      console.error("Failed to get server date:", error);
    }
  };

  fetchServerDate();
}, []);

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

  const handleMultiDateChange = (d) => {
    if (!d) return;
    const val = formatLocalDate(d);
    if (selectedDates.includes(val)) {
      setSelectedDates(selectedDates.filter((x) => x !== val));
    } else {
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

 const submit = async () => {
  const err = validate();
  if (err) return setError(err);

  if (!serverDate) {
    return setError("Unable to get server date. Please try again.");
  }

  const todayStr = formatLocalDate(serverDate);

  let isEmergency = 0;

  if (
    (leaveType === "half" ||
      (leaveType === "full" && subType === "single")) &&
    date &&
    formatLocalDate(date) === todayStr
  ) {
    isEmergency = 1;
  }

  setError("");
  setLoading(true);

    const payload = {
      emp_id: employee.emp_id,
      name: employee.name,
      department: employee.department,
      leave_type: leaveType,
      sub_type: leaveType === "full" ? subType : null,

      date:
        (leaveType === "half" ||
          (leaveType === "full" && subType === "single")) &&
        date
          ? formatLocalDate(date)
          : null,

      selected_dates:
        leaveType === "full" && subType === "multi" ? selectedDates : [],

      session: leaveType === "half" ? session : null,

      reason_type: reasonType,
      reason_text: reasonText,

      is_emergency: isEmergency,
    };

    const config = {
      headers: {
        Authorization: `Bearer ${token || localStorage.getItem("token")}`,
      },
    };

    try {
      let res;

      if (isEdit) {
        res = await api.put(
          `/api/leaves/update/${editData.id}`,
          payload,
          config,
        );
      } else {
        res = await api.post("/api/leaves/apply", payload, config);
      }

      alert(res.data.message);
      navigate("/employee");
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  const getDayClassName = (d) => {
    const formatted = formatLocalDate(d);
    return selectedDates.includes(formatted) ? "custom-highlight-selected" : "";
  };

  return (
    <div className="glass-bg py-3 py-sm-4">
      <div className="container-fluid container-md">
        <div className="row justify-content-center m-0">
          <div className="col-lg-6 col-md-8 col-12 px-1 px-sm-3">
            <div className="glass-card p-3 p-sm-4">
              <h4 className="text-center text-white fw-bold mb-3 fs-5 fs-sm-4">
                {isEdit ? "Edit Leave Request" : "Apply Leave Request"}
              </h4>

              {error && (
                <div className="alert alert-danger py-2 text-center border-0 small break-word">
                  {error}
                </div>
              )}

              <div className="emp-box mb-3 text-center text-white-50 small fw-semibold text-wrap">
                {employee.name} | {employee.emp_id}
              </div>

              {/* LEAVE TYPE */}
              <div className="mb-3 text-white">
                <label className="form-label fw-bold text-white-50 small text-uppercase">
                  Leave Type
                </label>
                <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-4">
                  <label className="d-flex align-items-center gap-2 cursor-pointer py-1">
                    <input
                      type="radio"
                      className="form-check-input m-0"
                      checked={leaveType === "half"}
                      onChange={() => {
                        setLeaveType("half");
                        setSubType("single");
                        setSelectedDates([]);
                      }}
                    />{" "}
                    <span>Half Day</span>
                  </label>

                  <label className="d-flex align-items-center gap-2 cursor-pointer py-1">
                    <input
                      type="radio"
                      className="form-check-input m-0"
                      checked={leaveType === "full"}
                      onChange={() => {
                        setLeaveType("full");
                        setSession("");
                      }}
                    />{" "}
                    <span>Full Day</span>
                  </label>
                </div>
              </div>

              {/* SUB TYPE DURATIONS */}
              {leaveType === "full" && (
                <div className="mb-3">
                  <label className="form-label fw-bold text-white-50 small text-uppercase">
                    Duration Option
                  </label>
                  <select
                    className="form-select bg-dark text-white border-secondary w-100"
                    value={subType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubType(val);
                      if (val === "multi") setDate(null);
                      if (val === "single") setSelectedDates([]);
                    }}
                  >
                    <option value="single">Single Isolated Date</option>
                    <option value="multi">Multiple Selection List</option>
                  </select>
                </div>
              )}

              {/* DATE CONFIGURATIONS SECTION */}
              <div className="mb-3">
                <label className="form-label fw-bold text-white-50 small text-uppercase d-block">
                  {leaveType === "full" && subType === "multi"
                    ? "Select Target Dates"
                    : "Choose Date"}
                </label>

                {/* FULL DAY: SINGLE SELECTION */}
                {subType === "single" && leaveType === "full" && (
                  <div className="d-flex align-items-center gap-2 flex-wrap position-relative-wrapper">
                    <button
                      type="button"
                      className="btn btn-light btn-sm px-3 py-2 d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-center"
                      onClick={() => singleRef.current.setOpen(true)}
                    >
                      <FaCalendarAlt /> Open Calendar
                    </button>

                    {date && (
                      <span className="badge date-badge d-flex align-items-center justify-content-between gap-2 py-2 px-3 animate-fade-in w-100 w-sm-auto">
                        <span>{formatLocalDate(date)}</span>
                        <FaTrash
                          className="text-danger cursor-pointer"
                          onClick={() => setDate(null)}
                        />
                      </span>
                    )}

                    <DatePicker
                      ref={singleRef}
                      selected={date}
                      onChange={(d) => {
                        setDate(d);
                        setError("");
                      }}
                      minDate={serverDate}
                      className="d-none"
                    />
                  </div>
                )}

                {/* FULL DAY: MULTIPLE SELECTION */}
                {subType === "multi" && leaveType === "full" && (
                  <div className="position-relative-wrapper">
                    <button
                      type="button"
                      className="btn btn-light btn-sm px-3 py-2 d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-center"
                      onClick={() => multiRef.current.setOpen(true)}
                    >
                      <FaCalendarAlt /> Multi Selection Matrix
                    </button>

                    <DatePicker
                      ref={multiRef}
                      onChange={(d) => {
                        handleMultiDateChange(d);
                        setError("");
                      }}
                      minDate={serverDate}
                      shouldCloseOnSelect={false}
                      dayClassName={getDayClassName}
                      className="d-none"
                      value=""
                    />

                    {selectedDates.length > 0 && (
                      <>
                        <div className="text-white-50 small mt-2 mb-1 fw-semibold">
                          Selected Days Total: {selectedDates.length}
                        </div>
                        <div className="d-flex flex-wrap gap-2 max-height-chips-container p-2 rounded">
                          {selectedDates.map((d, i) => (
                            <span
                              key={i}
                              className="badge date-badge d-flex align-items-center gap-2 py-2 px-3 animate-fade-in"
                            >
                              <span>{d}</span>
                              <FaTrash
                                className="text-danger cursor-pointer ms-auto"
                                onClick={() => removeDate(d)}
                              />
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* HALF DAY DATE CONFIGURATION */}
                {leaveType === "half" && (
                  <div className="d-flex align-items-center gap-2 flex-wrap position-relative-wrapper">
                    <button
                      type="button"
                      className="btn btn-light btn-sm px-3 py-2 d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-center"
                      onClick={() => halfRef.current.setOpen(true)}
                    >
                      <FaCalendarAlt /> Pick Half Day Date
                    </button>

                    {date && (
                      <span className="badge date-badge d-flex align-items-center justify-content-between gap-2 py-2 px-3 animate-fade-in w-100 w-sm-auto">
                        <span>{formatLocalDate(date)}</span>
                        <FaTrash
                          className="text-danger cursor-pointer"
                          onClick={() => setDate(null)}
                        />
                      </span>
                    )}

                    <DatePicker
                      ref={halfRef}
                      selected={date}
                      onChange={(d) => {
                        setDate(d);
                        setError("");
                      }}
                      minDate={serverDate}
                      className="d-none"
                    />
                  </div>
                )}
              </div>

              {/* SHIFT SESSIONS SECTION */}
              {leaveType === "half" && (
                <div className="mb-3 text-white">
                  <label className="form-label fw-bold text-white-50 small text-uppercase">
                    Session
                  </label>
                  <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-4">
                    <label className="d-flex align-items-center gap-2 cursor-pointer py-1">
                      <input
                        type="radio"
                        className="form-check-input m-0"
                        checked={session === "morning"}
                        onChange={() => setSession("morning")}
                      />{" "}
                      <span>Morning Shift</span>
                    </label>

                    <label className="d-flex align-items-center gap-2 cursor-pointer py-1">
                      <input
                        type="radio"
                        className="form-check-input m-0"
                        checked={session === "afternoon"}
                        onChange={() => setSession("afternoon")}
                      />{" "}
                      <span>Afternoon Shift</span>
                    </label>
                  </div>
                </div>
              )}

              {/* LEAVE REASONS */}
              <div className="mb-3 text-white">
                <label className="form-label fw-bold text-white-50 small text-uppercase">
                  Reason Category
                </label>
                <div className="d-flex flex-column flex-sm-row flex-wrap gap-2 gap-sm-3 mb-2">
                  {[
                    { val: "sick", label: "Sick Leave" },
                    { val: "other", label: "Other Description" },
                  ].map((r) => (
                    <label
                      key={r.val}
                      className="d-flex align-items-center gap-2 cursor-pointer bg-white bg-opacity-10 py-2 px-3 rounded-pill justify-content-start"
                    >
                      <input
                        type="radio"
                        className="form-check-input m-0"
                        checked={reasonType === r.val}
                        onChange={() => setReasonType(r.val)}
                      />{" "}
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>

                {reasonType === "other" && (
                  <textarea
                    className="form-control mt-2 bg-dark text-white border-secondary w-100"
                    rows="3"
                    placeholder="Enter descriptive text context details here..."
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                  />
                )}
              </div>

              <button
                className="btn btn-primary w-100 mt-2 fw-bold py-2 shadow"
                onClick={submit}
                disabled={loading}
              >
                {loading
                  ? "Transmitting Fields..."
                  : isEdit
                    ? "Update Changes Securely"
                    : "Submit Leave Application"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-bg {
          min-height: 100vh;
          background: linear-gradient(135deg,#0f172a,#1e3a8a,#6d28d9);
        }
        .glass-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
        }
        .emp-box {
          background: rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 10px;
          word-break: break-all;
        }
        .date-badge {
          background: rgba(255, 255, 255, 0.15) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          font-size: 0.85rem !important;
          border-radius: 6px;
        }
        .max-height-chips-container {
          max-height: 140px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .break-word {
          word-break: break-word;
        }
        .react-datepicker__day.custom-highlight-selected {
          background-color: #6366f1 !important;
          color: white !important;
          border-radius: 50% !important;
          font-weight: bold;
        }
        
        /* THE PERFECT MOBILE CALENDAR OVERFLOW CURE */
        .position-relative-wrapper {
          position: relative;
        }
        
        @media (max-width: 576px) {
          .date-badge {
            width: 100%;
          }
          /* Force calendar container to pop open exactly in center of the form card overlay */
          .react-datepicker-popper {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 9999 !important;
          }
          .react-datepicker {
            font-size: 0.85rem !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
          }
          .react-datepicker__day-name, .react-datepicker__day {
            width: 1.8rem !important;
            line-height: 1.8rem !important;
            margin: 0.12rem !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
