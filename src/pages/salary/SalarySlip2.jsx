import React from "react";

const SalarySlip2 = ({
  data,
  inputs,
  handlePrint,
  handleSave,
  saving,
  navigate,
  setShowEditModal,
}) => {
  // Calculations
  const totalExtra =
    (Number(data.extraPaymentIncentive) || 0) +
    (Number(data.allowanceAmount) || 0);
  const monthName = new Date(data.year, data.month)
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const shortYear = String(data.year).slice(-2);

  // --- ALTERNATIVE STYLES FOR TEMPLATE 2 ---
  const styles = {
    slipContainer: {
      width: "220mm",
      minHeight: "110mm",
      padding: "5mm",
      backgroundColor: "white",
      fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif",
      color: "#2d3748",
      margin: "0 auto",
      position: "relative",
      boxSizing: "border-box",
      overflow: "hidden",
      fontSize: "10px",
      lineHeight: "1.2",
      border: "1px solid #cbd5e0",
    },
    header: {
      textAlign: "center",
      borderBottom: "2px solid #e53e3e",
      paddingBottom: "5px",
      marginBottom: "8px",
    },
    companyName: {
      fontSize: "14px",
      fontWeight: "900",
      margin: 0,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      color: "#c53030",
    },
    infoTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "9px",
      fontWeight: "bold",
      marginBottom: "6px",
    },
    mainTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "10px",
      border: "1px solid #4a5568",
      marginBottom: "6px",
    },
    th: {
      border: "1px solid #4a5568",
      padding: "4px",
      backgroundColor: "#2d3748",
      color: "#ffffff",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: "9px",
      textTransform: "uppercase",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    },
    td: {
      border: "1px solid #4a5568",
      padding: "3px 4px",
      verticalAlign: "middle",
    },
    tdRight: {
      border: "1px solid #4a5568",
      padding: "3px 4px",
      textAlign: "right",
      verticalAlign: "middle",
    },
    warningBox: {
      border: "1px solid #c53030",
      padding: "5px",
      fontSize: "8px",
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: "6px",
      lineHeight: "1.2",
      backgroundColor: "#fff5f5",
      color: "#742a2a",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    },
    dailyTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "7px",
      textAlign: "center",
      border: "1px solid #4a5568",
      marginBottom: "2px",
    },
    dailyTh: {
      border: "1px solid #4a5568",
      padding: "1px 2px",
      backgroundColor: "#2d3748",
      color: "#ffffff",
      fontWeight: "bold",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "30px",
      fontSize: "9px",
      fontWeight: "bold",
    },
  };

  return (
    <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center print:p-0 print:m-0 print:bg-white">
      {/* --- TOP TOOLBAR --- */}
      <div className="w-[110mm] flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-900 p-3 rounded-t-xl text-white print:hidden shadow-lg mb-0">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold flex items-center gap-1 transition-all"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded text-xs font-bold flex items-center gap-1 transition-all"
          >
            ✏ Edit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-bold flex items-center gap-1 transition-all"
          >
            {saving ? "⏳" : "💾"} Save
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-bold flex items-center gap-1 transition-all"
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* --- PRINTABLE SLIP TEMPLATE 2 --- */}
      <div
        id="printable-slip-2"
        className="bg-white shadow-2xl print:shadow-none"
        style={styles.slipContainer}
      >
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.companyName}>BABA CAR WASHING AND CLEANING LLC</h1>
        </div>

        {/* Info Grid */}
        <table style={styles.infoTable}>
          <tbody>
            <tr>
              <td style={{ ...styles.td, width: "40%" }}>
                NAME : {data.employeeName?.toUpperCase()}
              </td>
              <td style={{ ...styles.td, width: "30%", textAlign: "center" }}>
                CODE : {data.employeeCode || "N/A"}
              </td>
              <td style={{ ...styles.td, width: "30%", textAlign: "right" }}>
                {monthName}/{shortYear} SALARY
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Financial Table */}
        <table style={styles.mainTable}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: "12%" }}>DATE</th>
              <th style={{ ...styles.th, textAlign: "left" }}>PARTICULARS</th>
              <th style={{ ...styles.th, width: "12%" }}></th>
              <th style={{ ...styles.th, width: "18%" }}>DEBIT</th>
              <th style={{ ...styles.th, width: "18%" }}>CREDIT</th>
            </tr>
          </thead>
          <tbody style={{ fontWeight: "500" }}>
            {/* Basic Salary */}
            <tr>
              <td style={styles.td}></td>
              <td style={styles.td}>
                {monthName}/{shortYear} BASIC{" "}
                {Number(data.basicSalary).toFixed(2)} AED SALARY
              </td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                Dr
              </td>
              <td style={styles.tdRight}>
                {Number(data.basicSalary).toFixed(2)}
              </td>
              <td style={styles.td}></td>
            </tr>

            {/* Mall Wash Type Breakdown */}
            {data.role === "mall" &&
              (data.insideWashCount > 0 ||
                data.outsideWashCount > 0 ||
                data.totalWashTypeCount > 0) && (
                <>
                  {data.insideWashCount > 0 && (
                    <tr>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.td,
                          fontSize: "8px",
                          color: "#555",
                          paddingLeft: "12px",
                        }}
                      >
                        ↳ INSIDE WASH: {data.insideWashCount} ×{" "}
                        {Number(
                          data.calculationBreakdown?.insideRate || 3,
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.tdRight,
                          fontSize: "8px",
                          color: "#555",
                        }}
                      >
                        {(
                          data.insideWashCount *
                          (data.calculationBreakdown?.insideRate || 3)
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                    </tr>
                  )}
                  {data.outsideWashCount > 0 && (
                    <tr>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.td,
                          fontSize: "8px",
                          color: "#555",
                          paddingLeft: "12px",
                        }}
                      >
                        ↳ OUTSIDE WASH: {data.outsideWashCount} ×{" "}
                        {Number(
                          data.calculationBreakdown?.outsideRate || 3,
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.tdRight,
                          fontSize: "8px",
                          color: "#555",
                        }}
                      >
                        {(
                          data.outsideWashCount *
                          (data.calculationBreakdown?.outsideRate || 3)
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                    </tr>
                  )}
                  {data.totalWashTypeCount > 0 && (
                    <tr>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.td,
                          fontSize: "8px",
                          color: "#555",
                          paddingLeft: "12px",
                        }}
                      >
                        ↳ IN+OUT WASH: {data.totalWashTypeCount} ×{" "}
                        {Number(
                          data.calculationBreakdown?.totalRate || 6,
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.tdRight,
                          fontSize: "8px",
                          color: "#555",
                        }}
                      >
                        {(
                          data.totalWashTypeCount *
                          (data.calculationBreakdown?.totalRate || 6)
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                    </tr>
                  )}
                  {data.totalSubscriptionWashes > 0 && (
                    <tr>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.td,
                          fontSize: "8px",
                          color: "#555",
                          paddingLeft: "12px",
                        }}
                      >
                        ↳ MONTHLY SUB: {data.totalSubscriptionWashes} ×{" "}
                        {Number(
                          data.calculationBreakdown?.monthlyPay /
                            data.totalSubscriptionWashes || 1.35,
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                      <td
                        style={{
                          ...styles.tdRight,
                          fontSize: "8px",
                          color: "#555",
                        }}
                      >
                        {Number(
                          data.calculationBreakdown?.monthlyPay || 0,
                        ).toFixed(2)}
                      </td>
                      <td style={styles.td}></td>
                    </tr>
                  )}
                </>
              )}

            {/* Extra Work / OT */}
            <tr>
              <td style={styles.td}></td>
              <td style={styles.td}>EXTRA WORK AND OT</td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                Dr
              </td>
              <td style={styles.tdRight}>
                {Number(data.overtimeAmount || data.extraWorkOt || 0).toFixed(
                  2,
                )}
              </td>
              <td style={styles.td}></td>
            </tr>

            {/* Incentive */}
            <tr>
              <td style={styles.td}></td>
              <td style={styles.td}>EXTRA PAYMENT</td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                Dr
              </td>
              <td style={styles.tdRight}>{totalExtra.toFixed(2)}</td>
              <td style={styles.td}></td>
            </tr>

            {/* ETISALAT SIM */}
            <tr>
              <td style={styles.td}></td>
              <td style={styles.td}>ETISALAT SIM BALANCE</td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                {data.simDeduction > 0 ? "Cr" : ""}
              </td>
              <td style={styles.td}></td>
              <td style={styles.tdRight}>
                {data.simDeduction > 0
                  ? Number(data.simDeduction).toFixed(2)
                  : ""}
              </td>
            </tr>

            {/* LAST MONTH BALANCE */}
            <tr>
              <td style={styles.td}></td>
              <td style={styles.td}>LAST MONTH BALANCE</td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                {data.lastMonthBalance !== 0 ? "Cr" : ""}
              </td>
              <td style={styles.td}></td>
              <td style={styles.tdRight}>
                {data.lastMonthBalance !== 0
                  ? Number(data.lastMonthBalance).toFixed(2)
                  : ""}
              </td>
            </tr>

            {/* ADVANCE */}
            <tr>
              <td
                style={{
                  ...styles.td,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                ADV
              </td>
              <td style={{ ...styles.td, fontWeight: "bold" }}>ADVANCE</td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                {data.advanceDeduction > 0 ? "Cr" : ""}
              </td>
              <td style={styles.td}></td>
              <td style={styles.tdRight}>
                {data.advanceDeduction > 0
                  ? Number(data.advanceDeduction).toFixed(2)
                  : ""}
              </td>
            </tr>

            {/* C3 PAY */}
            <tr>
              <td style={styles.td}></td>
              <td style={styles.td}>C3 PAY</td>
              <td
                style={{ ...styles.td, textAlign: "center", fontSize: "9px" }}
              >
                {data.otherDeduction > 0 ? "Cr" : ""}
              </td>
              <td style={styles.td}></td>
              <td style={styles.tdRight}>
                {data.otherDeduction > 0
                  ? Number(data.otherDeduction).toFixed(2)
                  : ""}
              </td>
            </tr>

            {/* TOTAL */}
            <tr
              style={{
                fontWeight: "bold",
                backgroundColor: "#edf2f7",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <td style={styles.td}></td>
              <td style={{ ...styles.td, textAlign: "right" }}>TOTAL</td>
              <td style={styles.td}></td>
              <td style={styles.tdRight}>
                {Number(data.totalEarnings).toFixed(2)}
              </td>
              <td style={styles.tdRight}>
                {Number(data.totalDeductions).toFixed(2)}
              </td>
            </tr>

            {/* CLOSING BALANCE */}
            <tr style={{ fontWeight: "bold" }}>
              <td style={styles.td}></td>
              <td style={{ ...styles.td, textAlign: "right" }}>
                CLOSING BALANCE
              </td>
              <td style={styles.td}></td>
              <td style={styles.td}></td>
              <td
                style={{
                  ...styles.tdRight,
                  fontSize: "11px",
                  backgroundColor: "#c53030",
                  color: "white",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                {Number(data.closingBalance).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Warning */}
        <div style={styles.warningBox}>
          "You must keep an accurate record; if we discover that you are doing
          cars without recording them, you will be fined, and you won't receive
          any payments and other benefits from the company."
        </div>

        {/* Daily Grid - All dates in one line */}
        <table id="daily-grid-2" style={styles.dailyTable}>
          <tbody>
            <tr>
              {Array.from({ length: data.daysInMonth || 31 }, (_, i) => (
                <td key={i} style={styles.dailyTh}>
                  {i + 1}
                </td>
              ))}
              <td
                style={{
                  ...styles.dailyTh,
                  backgroundColor: "#c53030",
                  color: "white",
                }}
              >
                TOT
              </td>
            </tr>
            <tr>
              {Array.from({ length: data.daysInMonth || 31 }, (_, i) => (
                <td key={i} style={styles.td}>
                  {data.dailyData?.[i + 1] || 0}
                </td>
              ))}
              <td style={{ ...styles.td, fontWeight: "bold" }}>
                {data.totalWashes || 0}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Attendance Summary */}
        <table
          style={{
            ...styles.infoTable,
            marginTop: "5px",
            border: "1px solid #4a5568",
            backgroundColor: "#f7fafc",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "4px" }}>
                P-PRESENT DAYS : {data.presentDays}
              </td>
              <td style={{ padding: "4px", textAlign: "center" }}>
                AB - ABSENT DAYS : {inputs.absentDays}
              </td>
              <td style={{ padding: "4px", textAlign: "center" }}>
                ND - NO DUTY DAYS : {inputs.noDutyDays}
              </td>
              <td style={{ padding: "4px", textAlign: "right" }}>
                SL- SICK DAYS : {inputs.sickLeaveDays}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div style={styles.footer}>
          <div
            style={{
              width: "40%",
              borderTop: "2px solid #4a5568",
              textAlign: "center",
              paddingTop: "5px",
            }}
          >
            Prepared By Signatory
          </div>
          <div
            style={{
              width: "40%",
              borderTop: "2px solid #4a5568",
              textAlign: "center",
              paddingTop: "5px",
            }}
          >
            Received By Signatory
          </div>
        </div>
      </div>

      {/* --- PRINT CSS - DL ENVELOPE LANDSCAPE --- */}
      <style>{`
        @media print {
          @page {
            size: 220mm 110mm;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 220mm !important;
            height: 110mm !important;
            overflow: hidden !important;
          }

          /* Hide MainLayout components */
          aside,
          header,
          footer,
          nav {
            display: none !important;
          }

          /* Hide buttons */
          button,
          .print\\:hidden {
            display: none !important;
          }

          /* Hide wrapper divs */
          body > div,
          body > div > * {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Show printable slip 2 */
          #printable-slip-2 {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 220mm !important;
            height: 110mm !important;
            margin: 0 !important;
            padding: 3mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            z-index: 999999 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Show all children */
          #printable-slip-2 * {
            visibility: visible !important;
            display: revert !important;
          }

          /* Table elements */
          #printable-slip-2 table {
            display: table !important;
            border-collapse: collapse !important;
          }

          #printable-slip-2 tbody {
            display: table-row-group !important;
          }

          #printable-slip-2 thead {
            display: table-header-group !important;
          }

          #printable-slip-2 tr {
            display: table-row !important;
          }

          #printable-slip-2 td,
          #printable-slip-2 th {
            display: table-cell !important;
          }

          #printable-slip-2 ~ * {
            display: none !important;
          }

          /* Font sizes for landscape */
          #printable-slip-2 {
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }

          #printable-slip-2 h1 {
            font-size: 10pt !important;
            margin: 0 0 2mm 0 !important;
          }

          #printable-slip-2 table {
            font-size: 7pt !important;
            margin-bottom: 1mm !important;
          }

          #printable-slip-2 td,
          #printable-slip-2 th {
            padding: 1mm !important;
            font-size: 6.5pt !important;
          }

          /* Daily grid cells smaller */
          #daily-grid-2 td,
          #daily-grid-2 th {
            padding: 0.2mm 0.3mm !important;
            font-size: 4.5pt !important;
            white-space: nowrap !important;
            line-height: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SalarySlip2;
