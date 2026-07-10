// EmployeeViewPDF — same as ViewPDF but Back navigates to /employee/download-payslips
// No edit functionality exposed to employees.

import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// import axios from "axios";
import api from "../api/axiosConfig";

// const API_BASE_URL = "http://localhost:7014/api";
const API_BASE_URL = "/api";

function EmployeeViewPDF() {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [earnings, setEarnings] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [pfApplicable, setPfApplicable] = useState(true);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [attendanceInfo, setAttendanceInfo] = useState({
    totalDays: 0, paidDays: 0, holidays: 0, leaves: 0, deductedLeaves: 0,
  });
  const [proratedEarnings, setProratedEarnings] = useState({
    basic_salary: 0, house_rent_allowence: 0, transport_allowance: 0,
    internet_allowance: 0, medical_allowance: 0, employer_pf_contribution: 0,
    performance_bonus: 0, arrears: 0, total_earnings: 0,
  });

  const data = location.state || null;

  const handleBack = () => navigate("/employee/download-payslips");

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    try {
      if (typeof date === "string" && /^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split("-"); return `${d}-${m}-${y}`;
      }
      const dt = date instanceof Date ? date : new Date(date);
      if (!isNaN(dt.getTime())) {
        return `${String(dt.getDate()).padStart(2,"0")}-${String(dt.getMonth()+1).padStart(2,"0")}-${dt.getFullYear()}`;
      }
      return String(date);
    } catch { return String(date); }
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "0.00";
    const n = Number(value);
    return isNaN(n) ? "0.00" : n.toFixed(2);
  };

  const numberToWords = (num) => {
    if (!num) return "Zero Rupees Only";
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
      "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const n2w = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)]+(n%10?" "+ones[n%10]:"");
      if (n < 1000) return ones[Math.floor(n/100)]+" Hundred"+(n%100?" "+n2w(n%100):"");
      if (n < 100000) return n2w(Math.floor(n/1000))+" Thousand"+(n%1000?" "+n2w(n%1000):"");
      if (n < 10000000) return n2w(Math.floor(n/100000))+" Lakh"+(n%100000?" "+n2w(n%100000):"");
      return n2w(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+n2w(n%10000000):"");
    };
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let words = n2w(rupees) + " Rupees";
    if (paise > 0) words += " and " + n2w(paise) + " Paise";
    return words + " Only";
  };

  const downloadPDF = async () => {
    try {
      const input = pdfRef.current;
      if (!input) return;
      const canvas = await html2canvas(input, {
        scale: 2, backgroundColor: "#ffffff", logging: false, allowTaint: true, useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${data.name}_Payslip_${data.month}_${data.year}.pdf`);
    } catch (error) {
      setMessage({ type: "error", text: "Error downloading PDF" });
    }
  };

  const fetchEarningsData = async (empId) => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE_URL}/employees/${empId}/earnings`, {
  withCredentials: true
});
      setEarnings(response.data);
      if (response.data) {
        const epf = Number(response.data.employer_pf_contribution) || 0;
        if (epf === 0) setPfApplicable(false);
      }
    } catch {
      setFetchError(true);
      setEarnings({
        basic_salary: Number(data.basicSalary) || 0,
        house_rent_allowence: Number(data.hra) || 0,
        transport_allowance: Number(data.transportAllowance) || 0,
        internet_allowance: Number(data.internetAllowance) || 0,
        medical_allowance: Number(data.medicalAllowance) || 0,
        professional_tax: Number(data.professionalTax) || 0,
        employer_pf_contribution: Number(data.employerPF) || 0,
      });
    } finally { setLoading(false); }
  };

  const fetchEmployeeDetails = async (empId) => {
    try {
      const response = await api.get(`${API_BASE_URL}/employees/${empId}`, {
  withCredentials: true
});
      setEmployeeDetails(response.data);
    } catch { console.error("Error fetching employee details"); }
  };

  const checkPfApplicability = (d) => {
    if (d.pf_applicable === 0 || d.pf_applicable === false) { setPfApplicable(false); return; }
    setPfApplicable((Number(d.pf) || 0) > 0 || (Number(d.employerPF) || 0) > 0);
  };

  const calculateProratedEarnings = (earningsData, paidDays, totalDays) => {
    if (!earningsData || !paidDays || !totalDays) return null;
    const r = paidDays / totalDays;
    const pB = (Number(earningsData.basic_salary)||0)*r;
    const pHRA = (Number(earningsData.house_rent_allowence)||0)*r;
    const pT = (Number(earningsData.transport_allowance)||0)*r;
    const pI = (Number(earningsData.internet_allowance)||0)*r;
    const pM = (Number(earningsData.medical_allowance)||0)*r;
    const pEPF = (Number(earningsData.employer_pf_contribution)||0)*r;
    const bonus = Number(earningsData.performance_bonus)||0;
    const arrears = Number(earningsData.arrears)||0;
    const total = pB+pHRA+pT+pI+pM+(pfApplicable?pEPF:0)+bonus+arrears;
    return {
      basic_salary:pB, house_rent_allowence:pHRA, transport_allowance:pT,
      internet_allowance:pI, medical_allowance:pM, employer_pf_contribution:pEPF,
      performance_bonus:bonus, arrears, total_earnings:total,
    };
  };

  useEffect(() => {
    if (data) {
      checkPfApplicability(data);
      fetchEarningsData(data.id);
      fetchEmployeeDetails(data.id);
      const monthIdx = data.month
        ? new Date(Date.parse(data.month+" 1, "+(data.year||new Date().getFullYear()))).getMonth()
        : new Date().getMonth();
      const yr = data.year || new Date().getFullYear();
      const totalDays = new Date(yr, monthIdx+1, 0).getDate();
      setAttendanceInfo({
        totalDays, paidDays: Number(data.paidDays)||totalDays,
        holidays: Number(data.holidays)||0, leaves: Number(data.leaves)||0, deductedLeaves: 0,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (earnings && attendanceInfo.totalDays > 0 && attendanceInfo.paidDays > 0) {
      const p = calculateProratedEarnings(earnings, attendanceInfo.paidDays, attendanceInfo.totalDays);
      if (p) setProratedEarnings(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnings, attendanceInfo, pfApplicable]);

  if (!data) {
    return (
      <div className="container text-center mt-5">
        <h4>No Payslip Data Found</h4>
        <button className="btn btn-dark mt-3" onClick={handleBack}>Go Back</button>
      </div>
    );
  }

  const totalEarnings =
    (proratedEarnings.basic_salary||0)+(proratedEarnings.house_rent_allowence||0)+
    (proratedEarnings.transport_allowance||0)+(proratedEarnings.internet_allowance||0)+
    (proratedEarnings.medical_allowance||0)+(pfApplicable?proratedEarnings.employer_pf_contribution||0:0)+
    (proratedEarnings.performance_bonus||0)+(proratedEarnings.arrears||0);

  const totalDeductions =
    (Number(data.professionalTax)||0)+(Number(data.pf)||0)+(Number(data.advance)||0);

  const finalNet = totalEarnings - totalDeductions;

  return (
    <div className="container my-5">
      <div style={{maxWidth:"900px",margin:"0 auto"}}
        className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 no-print">
        <button className="btn btn-secondary px-4" onClick={handleBack}>Back</button>
        <button className="btn btn-dark px-4" style={{backgroundColor:"#0f3052",borderColor:"#0f3052"}} onClick={downloadPDF}>
          Download PDF
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type==="success"?"success":"danger"} mb-3 no-print`}>{message.text}</div>
      )}

      {fetchError && (
        <div className="alert alert-warning no-print">Using default values for earnings. Some data may not be accurate.</div>
      )}

      <div className="container my-4 px-3 px-md-5">
        <div ref={pdfRef} className="pdf-wrapper" style={{background:"#ffffff",padding:"20px"}}>
          <div className="payslip-container" style={{
            maxWidth:"900px",width:"100%",margin:"0 auto",padding:"20px",
            border:"10px solid #333",boxSizing:"border-box"}}>

            {/* COMPANY HEADER */}
            <div className="company-header" style={{textAlign:"center",marginBottom:"20px",borderBottom:"2px solid #333",paddingBottom:"15px"}}>
              <div style={{fontSize:"24px",fontWeight:"bold",color:"#2c3e50",margin:"0 0 5px 0",letterSpacing:"1px"}}>
                Soft Electronic Solutions Private Limited
              </div>
              <div style={{fontSize:"12px",color:"#666",margin:"2px 0",lineHeight:"1.4"}}>13-6/33, Road No.2, Gayathri Hills, Badangpet</div>
              <div style={{fontSize:"12px",color:"#666",margin:"2px 0",lineHeight:"1.4"}}>Hyderabad - 700858</div>
              <div style={{fontSize:"12px",color:"#666",margin:"2px 0"}}>PH: +91 8415796558 | Email: softelectronics.pvtltd@gmail.com</div>
            </div>

            {/* TITLE */}
            <div className="title-section text-center my-3" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:"28px",fontWeight:"bold",color:"#34495e",letterSpacing:"2px"}}>PAYSLIP</div>
              <div style={{fontSize:"16px",marginTop:"4px",color:"#6c757d"}}>{data.month} {data.year}</div>
            </div>

            {/* EMPLOYEE DETAILS */}
            <div className="employee-details my-3 px-2 px-md-3">
              <div className="row g-3 text-center text-md-start">
                {[
                  ["Employee ID", data.id],
                  ["Joining Date", employeeDetails ? formatDateForDisplay(employeeDetails.date_of_joining) : "Not Available"],
                  ["Employee Name", data.name],
                  ["Designation", data.designation],
                  ["PAN", data.pan],
                  ["Paid Days", data.paidDays||0],
                ].map(([label, value]) => (
                  <div className="col-12 col-md-6 col-lg-4" key={label}>
                    <div className="mb-1">
                      <span style={{fontWeight:"bold",color:"#2c3e50"}}>{label}:</span>
                      <span style={{color:"#34495e",marginLeft:"5px"}}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EARNINGS & DEDUCTIONS TABLE */}
            <div className="salary-section table-responsive px-2 px-md-3 my-3">
              <table className="table table-bordered align-middle">
                <thead className="table-secondary text-center">
                  <tr>
                    <th style={{width:"40%"}}>Earnings</th>
                    <th style={{width:"10%"}}>Amount (₹)</th>
                    <th style={{width:"40%"}}>Deductions</th>
                    <th style={{width:"10%"}}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-start">Basic Salary{attendanceInfo.paidDays<attendanceInfo.totalDays&&<span className="text-muted"> (prorated)</span>}</td>
                    <td className="text-end">{formatAmount(proratedEarnings.basic_salary)}</td>
                    <td className="text-start">Professional Tax</td>
                    <td className="text-end">{formatAmount(data.professionalTax||0)}</td>
                  </tr>
                  <tr>
                    <td className="text-start">House Rent Allowance{attendanceInfo.paidDays<attendanceInfo.totalDays&&<span className="text-muted"> (prorated)</span>}</td>
                    <td className="text-end">{formatAmount(proratedEarnings.house_rent_allowence)}</td>
                    <td></td><td></td>
                  </tr>
                  <tr>
                    <td className="text-start">Transport Allowance{attendanceInfo.paidDays<attendanceInfo.totalDays&&<span className="text-muted"> (prorated)</span>}</td>
                    <td className="text-end">{formatAmount(proratedEarnings.transport_allowance)}</td>
                    <td className="text-start">Advance Salary</td>
                    <td className="text-end">{formatAmount(data.advance)}</td>
                  </tr>
                  <tr>
                    <td className="text-start">Telephone and Internet Allowance{attendanceInfo.paidDays<attendanceInfo.totalDays&&<span className="text-muted"> (prorated)</span>}</td>
                    <td className="text-end">{formatAmount(proratedEarnings.internet_allowance)}</td>
                    <td></td><td></td>
                  </tr>
                  <tr>
                    <td className="text-start">Medical Allowance{attendanceInfo.paidDays<attendanceInfo.totalDays&&<span className="text-muted"> (prorated)</span>}</td>
                    <td className="text-end">{formatAmount(proratedEarnings.medical_allowance)}</td>
                    <td></td><td></td>
                  </tr>
                  {pfApplicable&&(
                    <tr className="table-light">
                      <td className="text-start">Employer's PF Contribution @12%{attendanceInfo.paidDays<attendanceInfo.totalDays&&<span className="text-muted"> (prorated)</span>}</td>
                      <td className="text-end">{formatAmount(proratedEarnings.employer_pf_contribution)}</td>
                      <td></td><td></td>
                    </tr>
                  )}
                  {(Number(data.pf)||0)>0&&(
                    <tr className="table-light">
                      <td className="text-start">Employee PF @12%</td>
                      <td></td>
                      <td className="text-start">PF Deduction</td>
                      <td className="text-end">{formatAmount(data.pf)}</td>
                    </tr>
                  )}
                  <tr className="table-info">
                    <td className="text-start fw-bold">Performance Bonus</td>
                    <td className="text-end fw-bold">{formatAmount(data.performanceBonus||0)}</td>
                    <td></td><td></td>
                  </tr>
                  <tr>
                    <td className="text-start">Arrears</td>
                    <td className="text-end">{formatAmount(data.arrears||0)}</td>
                    <td></td><td></td>
                  </tr>
                  <tr className="table-secondary fw-bold">
                    <td className="text-start">Total Earnings (Prorated)</td>
                    <td className="text-end">{formatAmount(totalEarnings)}</td>
                    <td className="text-start">Total Deductions</td>
                    <td className="text-end">{formatAmount(totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NET SALARY */}
            <div className="d-flex justify-content-center align-items-center my-3 px-2">
              <div style={{border:"2px solid #2c3e50",padding:"15px 20px",borderRadius:"8px",
                backgroundColor:"#f4f8f9",textAlign:"center",width:"100%",maxWidth:"900px",margin:"0 auto"}}>
                <div style={{fontSize:"13px",color:"#555",textTransform:"uppercase",marginBottom:"5px"}}>Net Salary</div>
                <div style={{fontSize:"30px",fontWeight:"bold",color:"#2c3e50",marginBottom:"10px"}}>
                  ₹ {formatAmount(finalNet)}
                </div>
                <div style={{height:"1px",background:"#ccc",margin:"10px 0"}}/>
                <div style={{fontSize:"12px",color:"#777",marginBottom:"5px",textTransform:"uppercase"}}>Amount in Words</div>
                <div style={{fontSize:"clamp(12px,2vw,16px)",color:"#333",fontWeight:"500",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",width:"100%"}}>
                  {numberToWords(finalNet)}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="footer-note text-center mt-3">
              <div className="footer-text">This is a computer-generated payslip and does not require a signature.</div>
              {attendanceInfo.paidDays<attendanceInfo.totalDays&&(
                <div style={{marginTop:"5px",color:"#7f8c8d"}}>
                  * Salary has been prorated based on {attendanceInfo.paidDays} paid days out of {attendanceInfo.totalDays} total days
                  {attendanceInfo.deductedLeaves>0&&` (${attendanceInfo.deductedLeaves} leaves deducted after 2 free leaves)`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeViewPDF;
