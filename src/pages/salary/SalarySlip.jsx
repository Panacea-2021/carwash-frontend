import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  Loader2,
  Printer,
  ArrowLeft,
  Edit3,
  Download,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { salaryService } from "../../api/salaryService";
import { salarySettingsService } from "../../api/salarySettingsService";
import SalarySlip2 from "./SalarySlip2";

const SalarySlip = () => {
  const { workerId, year, month } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template1");

  // Editable Manual Inputs
  const [inputs, setInputs] = useState({
    simBillAmount: 0,
    lastMonthBalance: 0,
    advance: 0,
    c3Pay: 0,
    absentDays: 0,
    noDutyDays: 0,
    sickLeaveDays: 0,
    otHours: 0,
  });

  // --- 1. Fetch Slip Data ---
  const fetchSlip = async () => {
    setLoading(true);
    try {
      const res = await salaryService.getSlip(workerId, year, month);
      setData(res);

      // ==================== FRONTEND DEBUGGING ====================
      console.log("\n");
      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      console.log("📄 SALARY SLIP DATA RECEIVED IN FRONTEND");
      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      console.log("👤 Employee Name:", res.employeeName);
      console.log("🆔 Employee Code:", res.employeeCode);
      console.log("🏷️ Role:", res.role);
      console.log("📅 Period:", `${Number(month) + 1}/${year}`);
      console.log("\n--- EARNINGS ---");
      console.log("💰 Basic Salary:", res.basicSalary);
      console.log("🎁 Incentive:", res.extraPaymentIncentive);
      console.log("💵 Allowance:", res.allowanceAmount);
      console.log("⏰ Overtime:", res.overtimeAmount);
      console.log("➕ Total Earnings:", res.totalEarnings);
      console.log("\n--- DEDUCTIONS ---");
      console.log("📱 SIM Bill Amount:", res.simBillAmount);
      console.log("📱 SIM Deduction:", res.simDeduction);
      console.log("💸 Advance:", res.advanceDeduction);
      console.log("💸 Other Deduction:", res.otherDeduction);
      console.log("📊 Last Month Balance:", res.lastMonthBalance);
      console.log("➖ Total Deductions:", res.totalDeductions);
      console.log("\n--- ATTENDANCE ---");
      console.log("✅ Present Days:", res.presentDays);
      console.log("❌ Absent Days:", res.absentDays);
      console.log("🏥 Sick Leave Days:", res.sickLeaveDays);
      console.log("⏱️ OT Hours:", res.otHours);
      console.log("\n--- CALCULATION METHOD ---");
      console.log("📊 Method Used:", res.calculationBreakdown?.method);
      console.log(
        "📋 Breakdown:",
        JSON.stringify(res.calculationBreakdown, null, 2),
      );
      console.log("\n💰 FINAL NET SALARY:", res.closingBalance);
      console.log(
        "═══════════════════════════════════════════════════════════\n",
      );

      setInputs({
        simBillAmount: res.simBillAmount || 0,
        lastMonthBalance: res.lastMonthBalance || 0,
        advance: res.advanceDeduction || 0,
        c3Pay: res.otherDeduction || 0,
        absentDays: res.absentDays || 0,
        noDutyDays: res.noDutyDays || 0,
        sickLeaveDays: res.sickLeaveDays || 0,
        otHours: res.otHours || 0,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load slip");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Load Template Selection ---
  const loadTemplateSettings = async () => {
    try {
      // First check localStorage for immediate preference
      const localTemplate = localStorage.getItem("salary_slip_template");
      if (localTemplate) {
        setSelectedTemplate(localTemplate);
        return;
      }

      // Otherwise load from API
      const settings = await salarySettingsService.getSettings();
      const template = settings.slipTemplate || "template1";
      setSelectedTemplate(template);
      // Save to localStorage for future use
      localStorage.setItem("salary_slip_template", template);
    } catch (error) {
      console.error("Failed to load template settings:", error);
      // Default to template1 if error
      setSelectedTemplate("template1");
    }
  };

  useEffect(() => {
    fetchSlip();
    loadTemplateSettings();
  }, [workerId, year, month]);

  // --- 3. Save Handler ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        workerId,
        month: Number(month),
        year: Number(year),
        manualInputs: {
          ...inputs,
          advanceDeduction: inputs.advance,
          otherDeduction: inputs.c3Pay,
          simBillAmount: inputs.simBillAmount,
        },
      };
      const savedData = await salaryService.saveSlip(payload);
      setData(savedData.data);
      toast.success("Slip Updated");
      setShowEditModal(false);
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handlePrint = () => window.print();

  if (loading || !data)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );

  // --- CALCULATIONS & FORMATTING ---
  const totalExtra =
    (Number(data.extraPaymentIncentive) || 0) +
    (Number(data.allowanceAmount) || 0);
  const monthName = new Date(year, month)
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const shortYear = String(year).slice(-2);

  // --- INLINE STYLES FOR EXACT PRINT MATCHING ---
  const styles = {
    slipContainer: {
      width: "220mm", // ROTATED - use full DL width
      minHeight: "110mm", // ROTATED - DL height
      padding: "5mm",
      backgroundColor: "white",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "black",
      margin: "0 auto",
      position: "relative",
      boxSizing: "border-box",
      overflow: "hidden",
      fontSize: "10px",
      lineHeight: "1.2",
      border: "1px solid #e5e7eb",
    },
    header: {
      textAlign: "center",
      borderBottom: "2px solid black",
      paddingBottom: "5px",
      marginBottom: "8px",
    },
    companyName: {
      fontSize: "14px",
      fontWeight: "900",
      margin: 0,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
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
      border: "1px solid black",
      marginBottom: "6px",
    },
    th: {
      border: "1px solid black",
      padding: "4px",
      backgroundColor: "#3b82f6", // BLUE - restored original colors
      color: "#ffffff", // WHITE text
      fontWeight: "bold",
      textAlign: "center",
      fontSize: "9px",
      textTransform: "uppercase",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    },
    td: {
      border: "1px solid black",
      padding: "3px 4px",
      verticalAlign: "middle",
    },
    tdRight: {
      border: "1px solid black",
      padding: "3px 4px",
      textAlign: "right",
      verticalAlign: "middle",
    },
    warningBox: {
      border: "1px solid black",
      padding: "5px",
      fontSize: "8px",
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: "6px",
      lineHeight: "1.2",
    },
    dailyTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "7px",
      textAlign: "center",
      border: "1px solid black",
      marginBottom: "2px",
    },
    dailyTh: {
      border: "1px solid black",
      padding: "1px 2px",
      backgroundColor: "#3b82f6", // BLUE - restored
      color: "#ffffff", // WHITE text
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
      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] print:hidden backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              Edit Slip Values
            </h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                <label className="text-xs font-bold block text-blue-900">
                  SIM BILL AMOUNT (AED)
                </label>
                <input
                  type="number"
                  name="simBillAmount"
                  value={inputs.simBillAmount}
                  onChange={handleInputChange}
                  className="w-full p-1 border rounded text-sm"
                />
                <p className="text-[10px] text-blue-700 mt-1">
                  Deduction calculated automatically if &gt; 52.50
                </p>
              </div>

              {(data.role === "camp" || data.role === "constructionCamp") && (
                <div>
                  <label className="text-xs font-bold block text-gray-700">
                    OT HOURS
                  </label>
                  <input
                    type="number"
                    name="otHours"
                    value={inputs.otHours}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block text-gray-700">
                    ADVANCE
                  </label>
                  <input
                    type="number"
                    name="advance"
                    value={inputs.advance}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block text-gray-700">
                    C3 PAY
                  </label>
                  <input
                    type="number"
                    name="c3Pay"
                    value={inputs.c3Pay}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block text-gray-700">
                    LAST MONTH BAL
                  </label>
                  <input
                    type="number"
                    name="lastMonthBalance"
                    value={inputs.lastMonthBalance}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block text-gray-700">
                    ABSENT DAYS
                  </label>
                  <input
                    type="number"
                    name="absentDays"
                    value={inputs.absentDays}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block text-gray-700">
                    SICK DAYS
                  </label>
                  <input
                    type="number"
                    name="sickLeaveDays"
                    value={inputs.sickLeaveDays}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 bg-gray-200 rounded font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold text-sm"
              >
                Save & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP TOOLBAR (only for template1) --- */}
      {selectedTemplate === "template1" && (
        <div className="w-[110mm] flex justify-between items-center bg-slate-800 p-3 rounded-t-xl text-white print:hidden shadow-lg mb-0">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold flex items-center gap-1 transition-all"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Edit3 size={14} /> Edit Values
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-bold flex items-center gap-1 transition-all"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}{" "}
              Save
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>
      )}

      {/* --- CONDITIONAL TEMPLATE RENDERING --- */}
      {selectedTemplate === "template2" ? (
        <SalarySlip2
          data={data}
          inputs={inputs}
          handlePrint={handlePrint}
          handleSave={handleSave}
          saving={saving}
          navigate={navigate}
          setShowEditModal={setShowEditModal}
        />
      ) : (
        <>
          {/* --- TEMPLATE 1: DL ENVELOPE LANDSCAPE --- */}
          {/* --- PRINTABLE SLIP --- */}
          <div
            id="printable-slip"
            className="bg-white shadow-2xl print:shadow-none"
            style={styles.slipContainer}
          >
            {/* Header */}
            <div style={styles.header}>
              <h1 style={styles.companyName}>
                BABA CAR WASHING AND CLEANING LLC
              </h1>
            </div>

            {/* Info Grid */}
            <table style={styles.infoTable}>
              <tbody>
                <tr>
                  <td style={{ ...styles.td, width: "40%" }}>
                    NAME : {data.employeeName?.toUpperCase()}
                  </td>
                  <td
                    style={{ ...styles.td, width: "30%", textAlign: "center" }}
                  >
                    CODE : {data.employeeCode || "N/A"}
                  </td>
                  <td
                    style={{ ...styles.td, width: "30%", textAlign: "right" }}
                  >
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
                  <th style={{ ...styles.th, textAlign: "left" }}>
                    PARTICULARS
                  </th>
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
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
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
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
                  >
                    Dr
                  </td>
                  <td style={styles.tdRight}>
                    {Number(
                      data.overtimeAmount || data.extraWorkOt || 0,
                    ).toFixed(2)}
                  </td>
                  <td style={styles.td}></td>
                </tr>

                {/* Incentive */}
                <tr>
                  <td style={styles.td}></td>
                  <td style={styles.td}>EXTRA PAYMENT</td>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
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
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
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
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
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
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
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
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontSize: "9px",
                    }}
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
                    backgroundColor: "#f3f4f6", // Light Gray
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
                      backgroundColor: "#000",
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
              "You must keep an accurate record; if we discover that you are
              doing cars without recording them, you will be fined, and you
              won't receive any payments and other benefits from the company."
            </div>

            {/* Daily Grid - All dates in one line */}
            <table id="daily-grid" style={styles.dailyTable}>
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
                      backgroundColor: "black",
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
                border: "1px solid black",
                backgroundColor: "#f9fafb", // very light gray
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
                  borderTop: "1px solid black",
                  textAlign: "center",
                  paddingTop: "5px",
                }}
              >
                Prepared By Signatory
              </div>
              <div
                style={{
                  width: "40%",
                  borderTop: "1px solid black",
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

          /* Hide MainLayout components: Sidebar, Header, Footer */
          aside,
          header,
          footer,
          nav {
            display: none !important;
          }

          /* Hide buttons and non-printable elements */
          button,
          .print\\:hidden {
            display: none !important;
          }

          /* Hide the wrapper divs but keep structure */
          body > div,
          body > div > * {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Make printable slip overlay everything */
          #printable-slip {
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

          /* Show all children of printable slip */
          #printable-slip * {
            visibility: visible !important;
            display: revert !important;
          }

          /* Ensure table elements display correctly */
          #printable-slip table {
            display: table !important;
            border-collapse: collapse !important;
          }

          #printable-slip tbody {
            display: table-row-group !important;
          }

          #printable-slip thead {
            display: table-header-group !important;
          }

          #printable-slip tr {
            display: table-row !important;
          }

          #printable-slip td,
          #printable-slip th {
            display: table-cell !important;
          }

          /* Hide the outer wrapper that contains the slip */
          #printable-slip ~ * {
            display: none !important;
          }

          /* Font sizes optimized for landscape */
          #printable-slip {
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }

          #printable-slip h1 {
            font-size: 10pt !important;
            margin: 0 0 2mm 0 !important;
          }

          #printable-slip table {
            font-size: 7pt !important;
            margin-bottom: 1mm !important;
          }

          #printable-slip td,
          #printable-slip th {
            padding: 1mm !important;
            font-size: 6.5pt !important;
          }

          /* Make daily grid cells smaller to fit all dates in one line */
          #daily-grid td,
          #daily-grid th {
            padding: 0.2mm 0.3mm !important;
            font-size: 4.5pt !important;
            white-space: nowrap !important;
            line-height: 1 !important;
          }
        }
      `}</style>
        </>
      )}
    </div>
  );
};

export default SalarySlip;
