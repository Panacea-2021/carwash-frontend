import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  Loader2,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Calendar as CalendarIcon,
  ShoppingBag,
  Building,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { workerService } from "../../api/workerService";
import CustomDropdown from "../../components/ui/CustomDropdown";

const MonthlyRecords = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null); // Data for single worker
  const [meta, setMeta] = useState(null);

  // Worker State
  const [selectedWorkerId, setSelectedWorkerId] = useState(
    location.state?.workerId || "",
  );
  const [workerInfo, setWorkerInfo] = useState(location.state?.worker || {});

  // List for Dropdown
  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]); // Filtered by service type

  // Date State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = [2024, 2025, 2026, 2027];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // --- 1. Load & Filter Worker List ---
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const res = await workerService.list(1, 2000, "", 1); // Fetch active workers
        if (res.data) {
          setAllWorkers(res.data);
        }
      } catch (e) {
        console.error("Worker list load failed", e);
      }
    };
    loadWorkers();
  }, []);

  // Filter dropdown options based on the CURRENT worker's service type
  useEffect(() => {
    if (workerInfo.service_type && allWorkers.length > 0) {
      const sameTypeWorkers = allWorkers.filter(
        (w) => w.service_type === workerInfo.service_type,
      );
      setFilteredWorkers(sameTypeWorkers);
    } else {
      setFilteredWorkers(allWorkers);
    }
  }, [allWorkers, workerInfo.service_type]);

  // --- 2. Fetch Monthly Data ---
  const fetchData = async () => {
    if (!selectedWorkerId) return;
    setLoading(true);
    console.log(
      `🚀 Fetching records for Worker: ${selectedWorkerId}, Month: ${selectedMonth}, Year: ${selectedYear}`,
    );

    try {
      const response = await workerService.getMonthlyRecords(
        selectedYear,
        selectedMonth,
        selectedWorkerId,
      );

      if (response && response.data && response.data.length > 0) {
        const data = response.data[0];
        setRecord(data);
        setMeta(response.meta);

        // Update header info with fresh data from backend
        setWorkerInfo((prev) => ({
          ...prev,
          name: data.name,
          mobile: data.mobile,
          code: data.code,
          service_type: data.serviceType || prev.service_type,
        }));
      } else {
        setRecord(null);
        setMeta(response.meta);
      }
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      toast.error("Failed to load monthly data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, selectedWorkerId]);

  // --- HANDLERS ---
  const handleWorkerChange = (newId) => {
    const selected = allWorkers.find((w) => w._id === newId);
    if (selected) {
      setSelectedWorkerId(newId);
      setWorkerInfo(selected);
      setRecord(null);
    }
  };

  // Navigate to Slip in New Tab
  const handleViewSlip = () => {
    if (!selectedWorkerId) return toast.error("Select a worker first");
    const url = `/salary/slip/${selectedWorkerId}/${selectedYear}/${selectedMonth}`;
    window.open(url, "_blank");
  };

  const handleExportPDF = () => {
    if (!record) return toast.error("No data to export");

    const doc = new jsPDF("l", "mm", "a4");

    // Company Name Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("BABA CAR WASHING AND CLEANING LLC", 148.5, 15, {
      align: "center",
    });

    // Sub-header details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Work Record: ${workerInfo.name}`, 14, 25);
    doc.setFontSize(10);
    doc.text(
      `Type: ${workerInfo.service_type?.toUpperCase() || "N/A"}`,
      14,
      32,
    );
    doc.text(`Period: ${months[selectedMonth]} ${selectedYear}`, 14, 37);

    const daysInMonth = meta?.daysInMonth || 31;

    // Prepare table data
    const tableHead = [["Date", "Day", "Jobs Completed"]];
    const tableBody = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(selectedYear, selectedMonth, i);
      const dayName = weekDays[dateObj.getDay()];
      const count = record[`day_${i}`] || 0;
      tableBody.push([
        `${selectedYear}-${selectedMonth + 1}-${i}`,
        dayName,
        count === 0 ? "-" : count,
      ]);
    }

    // Add Summary Row
    tableBody.push(["", "TOTAL JOBS", record.total]);

    // Use autoTable(doc, options)
    autoTable(doc, {
      startY: 45, // Adjusted startY to fit new header
      head: tableHead,
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 75, 133] }, // Deep Blue
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40, fontStyle: "bold" },
      },
    });

    doc.save(`${workerInfo.name}_${months[selectedMonth]}_Record.pdf`);
    toast.success("PDF Downloaded");
  };

  // --- CALENDAR RENDERER ---
  const renderCalendar = () => {
    const daysInMonth = meta?.daysInMonth || 30;

    // 1. Calculate empty slots for start of month
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const blanks = Array(firstDayOfMonth).fill(null);

    // 2. Days Array
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const allSlots = [...blanks, ...days];

    return (
      <div className="grid grid-cols-7 gap-3 mt-4">
        {/* Weekday Headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Cells */}
        {allSlots.map((day, index) => {
          if (!day)
            return (
              <div key={`blank-${index}`} className="h-24 bg-transparent"></div>
            );

          const count = record ? record[`day_${day}`] : 0;
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === selectedMonth &&
            new Date().getFullYear() === selectedYear;

          return (
            <div
              key={day}
              className={`
                relative h-24 rounded-2xl border transition-all duration-300 group
                flex flex-col items-center justify-center
                ${
                  count > 0
                    ? "bg-white border-indigo-100 shadow-md shadow-indigo-100/50 hover:-translate-y-1 hover:shadow-lg"
                    : "bg-slate-50/50 border-slate-100 text-slate-300"
                }
                ${isToday ? "ring-2 ring-indigo-500 ring-offset-2" : ""}
              `}
            >
              {/* Date Number */}
              <div
                className={`absolute top-2 left-3 text-xs font-bold ${count > 0 ? "text-slate-500" : "text-slate-300"}`}
              >
                {day}
              </div>

              {/* Count (Center Big) */}
              {count > 0 ? (
                <div className="text-3xl font-black text-indigo-600 tracking-tight">
                  {count}
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-200">-</div>
              )}

              {/* Label */}
              {count > 0 && (
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mt-1">
                  Cars Done
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Dropdown Options
  const workerOptions = filteredWorkers.map((w) => ({
    value: w._id,
    label: w.name,
  }));

  // Service Type Display Helper
  const getServiceTypeBadge = (type) => {
    switch (type) {
      case "mall":
        return {
          label: "Mall Worker",
          color: "bg-purple-100 text-purple-700",
          icon: ShoppingBag,
        };
      case "residence":
        return {
          label: "Residence Worker",
          color: "bg-blue-100 text-blue-700",
          icon: Building,
        };
      case "site":
        return {
          label: "Site Worker",
          color: "bg-orange-100 text-orange-700",
          icon: MapPin,
        };
      default:
        return {
          label: "Worker",
          color: "bg-slate-100 text-slate-700",
          icon: User,
        };
    }
  };
  const badge = getServiceTypeBadge(workerInfo.service_type);
  const BadgeIcon = badge.icon;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans">
      {/* --- TOP BAR: Back & Header --- */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-3">
          {/* MONTH SELECTOR */}
          <div className="relative group">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer shadow-sm min-w-[140px]"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>

          {/* YEAR SELECTOR */}
          <div className="relative group">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer shadow-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Slip Button */}
          <button
            onClick={handleViewSlip}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" /> View Salary Slip
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* --- LEFT: PROFILE CARD & FILTERS --- */}
        <div className="w-full lg:w-1/4 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-slate-200/60 border border-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

            <div className="relative z-10 flex flex-col items-center mt-4">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden mb-4">
                {workerInfo.profileImage?.url ? (
                  <img
                    src={workerInfo.profileImage.url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-800 text-center leading-tight">
                {workerInfo.name || "Select Worker"}
              </h2>
              {/* ✅ "NO ID" Row Removed Here */}

              {/* DETAILS */}
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Mobile
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {workerInfo.mobile || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-purple-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Email
                    </span>
                    <span
                      className="text-xs font-bold text-slate-700 truncate max-w-[120px]"
                      title={workerInfo.email}
                    >
                      {workerInfo.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SWITCH WORKER BOX */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Switch Worker
              </span>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${badge.color}`}
              >
                <BadgeIcon className="w-3 h-3" /> {badge.label}s
              </span>
            </div>
            <CustomDropdown
              options={workerOptions}
              value={selectedWorkerId}
              onChange={handleWorkerChange}
              placeholder="Search Worker..."
              icon={User}
            />
            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
              * Showing only workers from the{" "}
              <strong>{workerInfo.service_type || "selected"}</strong> category.
            </p>
          </div>
        </div>

        {/* --- RIGHT: CALENDAR & STATS --- */}
        <div className="w-full lg:w-3/4">
          {/* STATS ROW */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
              <div className="relative z-10">
                <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">
                  Total Jobs
                </span>
                <div className="text-4xl font-black mt-1">
                  {loading ? "..." : record?.total || 0}
                </div>
                <div className="mt-2 text-indigo-200 text-xs font-medium">
                  Completed this month
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Total Tips
                </span>
                <div className="text-4xl font-black text-emerald-500 mt-1">
                  {loading ? "..." : record?.tips || 0}{" "}
                  <span className="text-lg text-emerald-300">AED</span>
                </div>
                <div className="mt-2 text-slate-400 text-xs font-medium">
                  Accumulated tips
                </div>
              </div>
            </div>
          </div>

          {/* CALENDAR CARD */}
          <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-200 p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                Performance Calendar
              </h3>
              <div className="text-sm font-bold text-slate-400">
                {months[selectedMonth]} {selectedYear}
              </div>
            </div>

            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <span className="text-slate-400 font-bold text-sm">
                  Loading Calendar Data...
                </span>
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRecords;
