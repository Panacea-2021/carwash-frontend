import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Loader2,
  Calendar,
  User,
  ShoppingBag,
  Building,
  BarChart2,
  FileText,
  Printer,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { workerService } from "../../api/workerService";
import CustomDropdown from "../../components/ui/CustomDropdown";

const YearlyRecords = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Restore state from sessionStorage if available
  const savedState = sessionStorage.getItem("yearlyRecordsState");
  const initialState = savedState ? JSON.parse(savedState) : null;

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [serviceType, setServiceType] = useState(
    initialState?.serviceType || "onewash",
  );
  const [selectedWorker, setSelectedWorker] = useState(
    initialState?.selectedWorker || "",
  );

  // Time Mode: 'year' or 'last6' (Removed 'last3')
  const [timeMode, setTimeMode] = useState(initialState?.timeMode || "year");
  const [selectedYear, setSelectedYear] = useState(
    initialState?.selectedYear || new Date().getFullYear(),
  );

  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);

  const normalizeServiceType = (worker) =>
    String(worker?.service_type || worker?.serviceType || "")
      .trim()
      .toLowerCase();

  const hasMallAssignment = (worker) =>
    (Array.isArray(worker?.malls) && worker.malls.length > 0) || !!worker?.mall;

  const isMallWorker = (worker) =>
    normalizeServiceType(worker) === "mall" && hasMallAssignment(worker);

  const years = [2024, 2025, 2026, 2027];
  const serviceTypes = [
    {
      value: "onewash",
      label: "One Wash",
      icon: ShoppingBag,
      color: "bg-purple-100 text-purple-700",
    },
    {
      value: "residence",
      label: "Residence",
      icon: Building,
      color: "bg-blue-100 text-blue-700",
    },
  ];

  // --- UseEffects ---
  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (serviceType || selectedWorker) {
      sessionStorage.setItem(
        "yearlyRecordsState",
        JSON.stringify({
          serviceType,
          selectedWorker,
          timeMode,
          selectedYear,
        }),
      );
    }
  }, [serviceType, selectedWorker, timeMode, selectedYear]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await workerService.list(1, 3000, "", 1);
        if (res.data) setAllWorkers(res.data);
      } catch (e) {}
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (!serviceType) {
      setFilteredWorkers([]);
      return;
    }
    let filtered = [];
    if (serviceType === "onewash") {
      filtered = allWorkers.filter(isMallWorker);
    } else {
      filtered = allWorkers.filter(
        (w) => normalizeServiceType(w) === "residence",
      );
    }

    setFilteredWorkers(filtered);

    // Keep selection valid for current service type.
    if (selectedWorker && !filtered.some((w) => w._id === selectedWorker)) {
      setSelectedWorker("");
      setReportData(null);
    }
  }, [serviceType, allWorkers, selectedWorker]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWorker) return;
      setLoading(true);
      try {
        const response = await workerService.getYearlyRecords(
          timeMode,
          selectedYear,
          selectedWorker,
        );
        setReportData(response);
      } catch (e) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedWorker, timeMode, selectedYear]);

  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF("l", "mm", "a4");
    const workerName =
      filteredWorkers.find((w) => w._id === selectedWorker)?.name || "Worker";

    doc.setFontSize(16);
    doc.text(`Work Record History`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Worker: ${workerName}`, 14, 22);
    doc.text(`Period: ${reportData.period}`, 14, 27);

    const tableHead = [
      "Month",
      ...Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
      "Total",
      "Tips",
    ];

    const tableBody = reportData.data.map((row) => {
      const days = Array.from({ length: 31 }, (_, i) => {
        const val = row[`day_${i + 1}`];
        return val === null || val === undefined ? 0 : val;
      });
      return [row.month, ...days, row.total, row.tips];
    });

    const summaryRow = [
      "GRAND TOTAL",
      ...Array(31).fill(""),
      reportData.grandTotal.cars,
      `AED ${reportData.grandTotal.tips}`,
    ];
    tableBody.push(summaryRow);

    autoTable(doc, {
      startY: 35,
      head: [tableHead],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 75, 133], fontSize: 6, halign: "center" },
      styles: { fontSize: 6, cellPadding: 1, halign: "center" },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 25 },
        32: { fontStyle: "bold", cellWidth: 10 },
        33: { fontStyle: "bold", cellWidth: 15 },
      },
    });

    doc.save(`${workerName}_Records.pdf`);
  };

  const handleViewSlip = (monthIndex) => {
    if (!selectedWorker) return;

    // Save current state before navigating
    sessionStorage.setItem(
      "yearlyRecordsState",
      JSON.stringify({
        serviceType,
        selectedWorker,
        timeMode,
        selectedYear,
      }),
    );

    const url = `/salary/slip/${selectedWorker}/${selectedYear}/${monthIndex}`;
    navigate(url, {
      state: {
        from: "/workers-management/yearly-records",
        returnState: { serviceType, selectedWorker, timeMode, selectedYear },
      },
    });
  };

  const getDownloadLabel = () => {
    if (timeMode === "last6") return "Download Last 6 Months";
    return "Download";
  };

  const handleDownloadFullYear = async () => {
    if (!reportData || !reportData.data.length)
      return toast.error("No data available");
    const toastId = toast.loading("Generating report...");

    try {
      const doc = new jsPDF();
      const workerName =
        filteredWorkers.find((w) => w._id === selectedWorker)?.name || "Worker";
      const workerCode =
        filteredWorkers.find((w) => w._id === selectedWorker)?.employeeCode ||
        "N/A";

      for (let i = 0; i < reportData.data.length; i++) {
        const monthData = reportData.data[i];
        if (i > 0) doc.addPage();

        const totalWashes = monthData.total;
        const basicSalary = 550.0;
        const ratePerWash = 1.35;
        const totalWashEarnings = totalWashes * ratePerWash;
        const extraWorkOt = Math.max(0, totalWashEarnings - basicSalary);
        const incentive = totalWashes >= 1000 ? 200.0 : 100.0;
        const etisalat = 26.25;
        const totalDebit = basicSalary + extraWorkOt + incentive;
        const closing = totalDebit - etisalat;

        doc.setLineWidth(0.5);
        doc.rect(10, 10, 190, 270);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("BABA CAR WASHING AND CLEANING LLC", 105, 18, {
          align: "center",
        });
        doc.line(10, 22, 200, 22);
        doc.setFontSize(10);
        doc.text(`Employee Name : ${workerName}`, 12, 28);
        doc.text(`Employee Code : ${workerCode}`, 105, 28, { align: "center" });
        doc.text(`${monthData.month} Salary`, 198, 28, { align: "right" });
        doc.line(10, 32, 200, 32);

        doc.setFillColor(240, 240, 240);
        doc.rect(10, 32, 190, 8, "F");
        doc.line(10, 40, 200, 40);
        doc.text("Date", 25, 37, { align: "center" });
        doc.line(40, 32, 40, 140);
        doc.text("Particulars", 100, 37, { align: "center" });
        doc.line(160, 32, 160, 140);
        doc.text("Debit", 170, 37, { align: "center" });
        doc.line(180, 32, 180, 140);
        doc.text("Credit", 190, 37, { align: "center" });

        let y = 48;
        const drawRow = (text, debit, credit) => {
          doc.text(text, 42, y);
          if (debit) {
            doc.text("Dr", 175, y, { align: "right" });
            doc.text(debit, 178, y, { align: "right" });
          }
          if (credit) {
            doc.text("Cr", 175, y, { align: "right" });
            doc.text(credit, 198, y, { align: "right" });
          }
          y += 8;
          doc.line(10, y - 5, 200, y - 5);
        };

        drawRow(`${monthData.month} BASIC 550 AED SALARY`, "550.00", null);
        drawRow("EXTRA WORK AND OT", extraWorkOt.toFixed(2), null);
        drawRow("EXTRA PAYMENT", incentive.toFixed(2), null);
        drawRow("ETISALAT SIM BALANCE", null, etisalat.toFixed(2));
        drawRow("LAST MONTH BALANCE", null, null);
        doc.text("ADVANCE", 12, y);
        drawRow("", null, null);
        drawRow("C3 PAY", null, null);

        doc.setFont("helvetica", "bold");
        doc.text("TOTAL", 42, y);
        doc.text(totalDebit.toFixed(2), 178, y, { align: "right" });
        doc.text(etisalat.toFixed(2), 198, y, { align: "right" });
        y += 8;
        doc.line(10, y - 5, 200, y - 5);

        doc.text("CLOSING BALANCE", 42, y);
        doc.text(closing.toFixed(2), 198, y, { align: "right" });
        y += 8;
        doc.line(10, y - 5, 200, y - 5);

        y += 12;
        doc.line(10, y, 200, y);

        const daysRow = Array.from({ length: 31 }, (_, d) =>
          (d + 1).toString(),
        );
        const countsRow = Array.from({ length: 31 }, (_, d) => {
          const val = monthData[`day_${d + 1}`];
          return val === null ? "" : val || 0;
        });
        daysRow.push("TOTAL");
        countsRow.push(totalWashes);

        autoTable(doc, {
          startY: y,
          head: [daysRow],
          body: [countsRow],
          theme: "grid",
          styles: {
            fontSize: 6,
            halign: "center",
            cellPadding: 1,
            lineColor: 0,
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: 0,
            fontStyle: "bold",
            lineWidth: 0.1,
          },
          bodyStyles: { fontStyle: "bold", lineWidth: 0.1 },
          tableWidth: 190,
          margin: { left: 10 },
        });
      }

      doc.save(`${workerName}_Slips.pdf`);
      toast.success("Downloaded", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Generation failed", { id: toastId });
    }
  };

  const workerOptions = filteredWorkers.map((w) => ({
    value: w._id,
    label: w.name,
  }));
  const activeServiceBadge =
    serviceTypes.find((t) => t.value === serviceType) || serviceTypes[0];

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 min-w-fit">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 whitespace-nowrap">
                Historical Records
              </h1>
              <p className="text-xs text-slate-500 font-bold whitespace-nowrap">
                Comprehensive Daily Breakdowns
              </p>
            </div>
          </div>

          {/* ✅ FIXED LAYOUT: Using flex-wrap for smaller screens, flex-nowrap for XL */}
          <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 w-full xl:justify-end">
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              {serviceTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setServiceType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${serviceType === type.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <type.icon className="w-3.5 h-3.5" /> {type.label}
                </button>
              ))}
            </div>

            <div className="w-64 relative shrink-0 z-20">
              <div
                className={`absolute -top-3 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm z-30 ${activeServiceBadge.color}`}
              >
                {activeServiceBadge.label} Workers
              </div>
              <CustomDropdown
                options={workerOptions}
                value={selectedWorker}
                onChange={setSelectedWorker}
                placeholder={
                  serviceType ? "Search Worker..." : "Select Type First"
                }
                icon={User}
                disabled={!serviceType}
                searchable={true}
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setTimeMode("year")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${timeMode === "year" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
              >
                Specific Year
              </button>
              <button
                onClick={() => setTimeMode("last6")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${timeMode === "last6" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
              >
                Last 6 Months
              </button>
            </div>

            {timeMode === "year" && (
              <div className="relative shrink-0">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 pr-8 outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm appearance-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}

            <div className="flex bg-slate-800 rounded-xl p-1 gap-1 shrink-0">
              <button
                onClick={handleExportPDF}
                disabled={!reportData}
                className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                title="Summary PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="w-px bg-slate-600 my-1"></div>
              <button
                onClick={handleDownloadFullYear}
                disabled={!reportData}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                title="Download Slips"
              >
                <Printer className="w-4 h-4" /> {getDownloadLabel()}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-xl border border-slate-200 overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="text-sm font-bold text-slate-400 mt-2">
              Loading Data...
            </span>
          </div>
        ) : !selectedWorker ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
            <User className="w-16 h-16 mb-4 opacity-50" />
            <span className="text-sm font-bold">
              Select a Worker to view records
            </span>
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
            <span className="text-sm font-bold">No Data Found</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e4b85] text-white">
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-r border-white/10 sticky left-0 bg-[#1e4b85] z-20 min-w-[140px]">
                    Month
                  </th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th
                      key={i}
                      className="px-1 py-2 text-[10px] font-bold text-center border-r border-white/10 min-w-[32px]"
                    >
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-[10px] font-bold text-center bg-[#f97316] border-r border-white/10 min-w-[60px]">
                    Total
                  </th>
                  <th className="px-4 py-2 text-[10px] font-bold text-center bg-[#10b981] min-w-[80px]">
                    Tips
                  </th>
                  <th className="px-2 py-2 text-[10px] font-bold text-center bg-slate-800 min-w-[60px]">
                    Slip
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/50 transition-colors border-b border-slate-100"
                  >
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-slate-100 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {row.month}
                    </td>
                    {Array.from({ length: 31 }, (_, i) => {
                      const count = row[`day_${i + 1}`];
                      const isNull = count === null;
                      const displayVal = isNull ? "" : count > 0 ? count : 0;
                      return (
                        <td
                          key={i}
                          className={`px-1 py-1 text-center text-[11px] border-r border-slate-100 ${isNull ? "bg-slate-100/50" : ""} ${count > 0 ? "font-black text-slate-800 bg-blue-100/30" : "text-slate-400"}`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-center text-sm font-black text-orange-600 bg-orange-50/30 border-r border-slate-100">
                      {row.total}
                    </td>
                    <td className="px-2 py-3 text-center text-xs font-bold text-emerald-600 bg-emerald-50/30">
                      {row.tips > 0 ? row.tips : "0"}
                    </td>
                    <td className="px-2 py-3 text-center border-l border-slate-100">
                      <button
                        onClick={() => handleViewSlip(idx)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-slate-400 shadow-sm"
                        title="View Salary Slip"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800 text-white sticky bottom-0 z-20">
                <tr>
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-800 z-30 border-r border-slate-700">
                    GRAND TOTAL
                  </td>
                  <td
                    colSpan={31}
                    className="bg-slate-800/90 border-r border-slate-700"
                  ></td>
                  <td className="px-2 py-3 text-center text-sm font-black text-orange-400 border-r border-slate-700">
                    {reportData.grandTotal.cars}
                  </td>
                  <td
                    className="px-2 py-3 text-center text-xs font-bold text-emerald-400"
                    colSpan={2}
                  >
                    AED {reportData.grandTotal.tips}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 10px; width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}</style>
    </div>
  );
};

export default YearlyRecords;
