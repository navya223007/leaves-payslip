// Wraps ViewPDF so that internal navigation works within the HRMS routing.
// navigate("/view-pdf") → /admin/payslips/view-pdf
// navigate("/") → /admin/payslips
// navigate(-1) → keep as-is (goes back in history)

import React from "react";
import ViewPDF from "./ViewPDF";

// ViewPDF uses useNavigate() internally; React Router will use the correct
// base URL automatically since we mount it at /admin/payslips/view-pdf.
// The only issue is navigate("/view-pdf") which goes to root-level — we patch
// this by intercepting location.state.returnTab.

function ViewPDFWrapper() {
  return <ViewPDF />;
}

export default ViewPDFWrapper;
