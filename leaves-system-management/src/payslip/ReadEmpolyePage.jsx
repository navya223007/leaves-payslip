import React, { useEffect, useState } from "react";
import { Container, Card, Row, Col, Button } from "react-bootstrap";
// import axios from "axios";
import api from "../api/axiosConfig";

// Simple field display component
const Field = ({ label, value }) => (
  <div className="mb-2">
    <strong>{label}:</strong> <span>{value || "N/A"}</span>
  </div>
);

/**
 * ReadEmployeePage Component
 * Props:
 *  - employee (optional): object of selected employee
 *  - goBack (optional): function to go back (for tabbed view)
 *  - onEdit (optional): function to edit employee
 *  - id (optional): employee ID if fetching via API route
 */
function ReadEmployeePage({ employee: propEmployee, goBack, onEdit, id }) {
  const [employee, setEmployee] = useState(propEmployee || {});
  const [loading, setLoading] = useState(!propEmployee); // only loading if fetching

  // Fetch employee if no prop passed and id is provided
  useEffect(() => {
    if (!propEmployee && id) {
      const fetchEmployee = async () => {
        setLoading(true);
        try {
          const response = await api.get(
            `/api/employees/${id}`,
          );
          setEmployee(response.data);
        } catch (error) {
          console.error("Error fetching employee:", error);
          alert("Error fetching employee details");
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [id, propEmployee]);

  if (loading) return <p>Loading...</p>;
  if (!employee) return <p>No employee data available.</p>;

  return (
    <Container fluid className="px-2 px-md-4 py-3">
      <Card className="shadow">
        {/* Card Header */}
        <Card.Header
          className="text-center fw-bold"
          style={{ background: "#0d6efd", color: "white" }}
        >
          Employee Details
        </Card.Header>

        {/* Card Body */}
        <Card.Body>
          <Row>
            {/* Employee Info */}
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="fw-bold text-primary">
                  Employee Information
                </Card.Header>
                <Card.Body>
                  <Field label="Employee ID" value={employee.emp_id} />
                  <Field label="Name" value={employee.name} />
                  <Field label="Designation" value={employee.designation} />
                  <Field
                    label="Date of Joining"
                    value={employee.date_of_joining}
                  />
                  <Field label="PAN Number" value={employee.PAN} />
                </Card.Body>
              </Card>
            </Col>

            {/* Bank Details */}
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="fw-bold text-warning">
                  Bank Details
                </Card.Header>
                <Card.Body>
                  <Field label="Bank Name" value={employee.bank_name} />
                  <Field
                    label="Account Number"
                    value={employee.bank_account_number}
                  />
                  <Field label="IFSC Code" value={employee.IFSC_code} />
                </Card.Body>
              </Card>
            </Col>

            {/* Salary Information */}
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="fw-bold text-success">
                  Salary Information
                </Card.Header>
                <Card.Body>
                  <Field label="Basic Salary" value={employee.basic_salary} />
                  <Field label="HRA" value={employee.house_rent_allowence} />
                  <Field
                    label="Transport Allowance"
                    value={employee.transport_allowance}
                  />
                  <Field
                    label="Internet Allowance"
                    value={employee.internet_allowance}
                  />
                  <Field
                    label="Medical Allowance"
                    value={employee.medical_allowance}
                  />
                </Card.Body>
              </Card>
            </Col>

            {/* Salary Deductions */}
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="fw-bold text-danger">
                  Salary Deductions
                </Card.Header>
                <Card.Body>
                  <Field
                    label="Professional Tax"
                    value={employee.professional_tax}
                  />
                  <Field
                    label="PF Applicable"
                    value={employee.pf_applicable ? "Yes" : "No"}
                  />
                  <Field label="PF Amount" value={employee.pf_amount} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>

        {/* Card Footer */}
        <Card.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={goBack ? goBack : () => window.history.back()}
          >
            Back
          </Button>

          {onEdit && (
            <Button
              style={{
                backgroundColor: "#ff6600", // your custom color
                borderColor: "#ff6600", // border same as background
                color: "white", // text color
              }}
              onClick={() => onEdit(employee)}
            >
              update
            </Button>
          )}
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default ReadEmployeePage;
