import React from "react";

const SalarySlipTemplate2 = ({ data, inputs }) => {
  // Calculations
  const totalExtra =
    (Number(data.extraPaymentIncentive) || 0) +
    (Number(data.allowanceAmount) || 0);
  const monthName = new Date(data.year, data.month)
    .toLocaleString("default", { month: "long" })
    .toUpperCase();

  // Inline styles for A4 Portrait
  const styles = {
    container: {
      width: "210mm",
      minHeight: "297mm",
      padding: "15mm",
      backgroundColor: "white",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: "#1a1a1a",
      margin: "0 auto",
      position: "relative",
      boxSizing: "border-box",
    },
    header: {
      textAlign: "center",
      marginBottom: "20px",
      paddingBottom: "15px",
      borderBottom: "3px solid #4f46e5",
    },
    companyName: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#4f46e5",
      margin: "0 0 8px 0",
      letterSpacing: "1px",
    },
    payslipTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#64748b",
      margin: 0,
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      marginBottom: "20px",
    },
    infoBox: {
      backgroundColor: "#f8fafc",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    label: {
      fontSize: "11px",
      color: "#64748b",
      fontWeight: "600",
      textTransform: "uppercase",
      marginBottom: "4px",
    },
    value: {
      fontSize: "14px",
      color: "#1e293b",
      fontWeight: "600",
    },
    section: {
      marginBottom: "20px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "700",
      color: "#4f46e5",
      marginBottom: "12px",
      paddingBottom: "6px",
      borderBottom: "2px solid #e0e7ff",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "15px",
    },
    tableRow: {
      borderBottom: "1px solid #e2e8f0",
    },
    tableCell: {
      padding: "10px 8px",
      fontSize: "13px",
    },
    tableCellLabel: {
      padding: "10px 8px",
      fontSize: "13px",
      color: "#475569",
      fontWeight: "500",
    },
    tableCellValue: {
      padding: "10px 8px",
      fontSize: "13px",
      textAlign: "right",
      fontWeight: "600",
      color: "#1e293b",
    },
    totalRow: {
      backgroundColor: "#f1f5f9",
      fontWeight: "700",
    },
    finalBalance: {
      backgroundColor: "#4f46e5",
      color: "white",
      fontSize: "15px",
      fontWeight: "700",
    },
    dailyGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: "4px",
      marginBottom: "15px",
    },
    dateBox: {
      border: "1px solid #cbd5e1",
      borderRadius: "4px",
      padding: "8px 4px",
      textAlign: "center",
      backgroundColor: "#f8fafc",
    },
    dateLabel: {
      fontSize: "10px",
      color: "#64748b",
      fontWeight: "600",
      marginBottom: "4px",
    },
    dateValue: {
      fontSize: "14px",
      color: "#1e293b",
      fontWeight: "700",
    },
    footer: {
      marginTop: "30px",
      paddingTop: "20px",
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
    },
    signature: {
      width: "40%",
      textAlign: "center",
    },
    signatureLine: {
      borderTop: "2px solid #94a3b8",
      paddingTop: "8px",
      marginTop: "40px",
      fontSize: "12px",
      color: "#64748b",
      fontWeight: "600",
    },
  };

  return (
    <div id="printable-slip-template2" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.companyName}>BABA CAR WASHING AND CLEANING LLC</h1>
        <p style={styles.payslipTitle}>
          Employee Salary Slip - {monthName} {data.year}
        </p>
      </div>

      {/* Employee Info */}
      <div style={styles.infoGrid}>
        <div style={styles.infoBox}>
          <div style={styles.label}>Employee Name</div>
          <div style={styles.value}>
            {data.employeeName?.toUpperCase() || "N/A"}
          </div>
        </div>
        <div style={styles.infoBox}>
          <div style={styles.label}>Employee Code</div>
          <div style={styles.value}>{data.employeeCode || "N/A"}</div>
        </div>
        <div style={styles.infoBox}>
          <div style={styles.label}>Designation</div>
          <div style={styles.value}>{data.role?.toUpperCase() || "WORKER"}</div>
        </div>
        <div style={styles.infoBox}>
          <div style={styles.label}>Pay Period</div>
          <div style={styles.value}>
            {monthName} {data.year}
          </div>
        </div>
      </div>

      {/* Earnings Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>EARNINGS</div>
        <table style={styles.table}>
          <tbody>
            <tr style={styles.tableRow}>
              <td style={styles.tableCellLabel}>Basic Salary</td>
              <td style={styles.tableCellValue}>
                {Number(data.basicSalary).toFixed(2)} AED
              </td>
            </tr>
            <tr style={styles.tableRow}>
              <td style={styles.tableCellLabel}>Extra Work & Overtime</td>
              <td style={styles.tableCellValue}>
                {Number(data.overtimeAmount || data.extraWorkOt || 0).toFixed(
                  2,
                )}{" "}
                AED
              </td>
            </tr>
            <tr style={styles.tableRow}>
              <td style={styles.tableCellLabel}>Extra Payment / Incentive</td>
              <td style={styles.tableCellValue}>{totalExtra.toFixed(2)} AED</td>
            </tr>
            <tr style={{ ...styles.tableRow, ...styles.totalRow }}>
              <td style={styles.tableCell}>TOTAL EARNINGS</td>
              <td style={styles.tableCellValue}>
                {Number(data.totalEarnings).toFixed(2)} AED
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>DEDUCTIONS</div>
        <table style={styles.table}>
          <tbody>
            {data.simDeduction > 0 && (
              <tr style={styles.tableRow}>
                <td style={styles.tableCellLabel}>Etisalat SIM Balance</td>
                <td style={styles.tableCellValue}>
                  {Number(data.simDeduction).toFixed(2)} AED
                </td>
              </tr>
            )}
            {data.lastMonthBalance !== 0 && (
              <tr style={styles.tableRow}>
                <td style={styles.tableCellLabel}>Last Month Balance</td>
                <td style={styles.tableCellValue}>
                  {Number(data.lastMonthBalance).toFixed(2)} AED
                </td>
              </tr>
            )}
            {data.advanceDeduction > 0 && (
              <tr style={styles.tableRow}>
                <td style={styles.tableCellLabel}>Advance Deduction</td>
                <td style={styles.tableCellValue}>
                  {Number(data.advanceDeduction).toFixed(2)} AED
                </td>
              </tr>
            )}
            {data.otherDeduction > 0 && (
              <tr style={styles.tableRow}>
                <td style={styles.tableCellLabel}>C3 Pay / Other Deduction</td>
                <td style={styles.tableCellValue}>
                  {Number(data.otherDeduction).toFixed(2)} AED
                </td>
              </tr>
            )}
            <tr style={{ ...styles.tableRow, ...styles.totalRow }}>
              <td style={styles.tableCell}>TOTAL DEDUCTIONS</td>
              <td style={styles.tableCellValue}>
                {Number(data.totalDeductions).toFixed(2)} AED
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Salary */}
      <table style={styles.table}>
        <tbody>
          <tr style={{ ...styles.tableRow, ...styles.finalBalance }}>
            <td style={styles.tableCell}>NET SALARY (CLOSING BALANCE)</td>
            <td style={styles.tableCellValue}>
              {Number(data.closingBalance).toFixed(2)} AED
            </td>
          </tr>
        </tbody>
      </table>

      {/* Daily Attendance Grid */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>DAILY WORK RECORD</div>
        <div style={styles.dailyGrid}>
          {Array.from({ length: data.daysInMonth || 31 }, (_, i) => (
            <div key={i} style={styles.dateBox}>
              <div style={styles.dateLabel}>{i + 1}</div>
              <div style={styles.dateValue}>{data.dailyData?.[i + 1] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={styles.infoGrid}>
        <div style={styles.infoBox}>
          <div style={styles.label}>Total Cars Washed</div>
          <div style={styles.value}>{data.totalWashes || 0}</div>
        </div>
        <div style={styles.infoBox}>
          <div style={styles.label}>Days Present</div>
          <div style={styles.value}>{data.presentDays || 0}</div>
        </div>
        <div style={styles.infoBox}>
          <div style={styles.label}>Absent Days</div>
          <div style={styles.value}>{inputs.absentDays || 0}</div>
        </div>
        <div style={styles.infoBox}>
          <div style={styles.label}>Sick Leave Days</div>
          <div style={styles.value}>{inputs.sickLeaveDays || 0}</div>
        </div>
      </div>

      {/* Signatures */}
      <div style={styles.footer}>
        <div style={styles.signature}>
          <div style={styles.signatureLine}>Prepared By</div>
        </div>
        <div style={styles.signature}>
          <div style={styles.signatureLine}>Employee Signature</div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }

          /* Hide everything except template2 */
          body * {
            display: none !important;
          }

          #printable-slip-template2,
          #printable-slip-template2 * {
            display: revert !important;
          }

          #printable-slip-template2 {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
            background: white !important;
            z-index: 999999 !important;
          }

          /* Hide non-printable elements */
          aside, header, footer:not(#printable-slip-template2 footer), nav, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SalarySlipTemplate2;
