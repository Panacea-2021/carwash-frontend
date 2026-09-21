import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  Calendar,
  Car,
  MapPin,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  User,
  DollarSign,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import DataTable from "../../components/DataTable";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

import { customerService } from "../../api/customerService";
import { toCalendarRange } from "../../utils/shiftTime";

const CustomerHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerStatusHistory, setCustomerStatusHistory] = useState([]);
  const [vehicleStatusHistory, setVehicleStatusHistory] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // <--- Logic preserved: Default limit to 50
  const fetchData = async (page = 1, limit = 100) => {
    setLoading(true);
    try {
      console.log("🔄 Fetching customer history:", {
        id,
        page,
        limit,
        startDate,
        endDate,
      });
      // Convert dates to full-day range (00:00 to 23:59 UTC)
      let apiStartDate = startDate;
      let apiEndDate = endDate;
      if (startDate && endDate) {
        const shiftRange = toCalendarRange(startDate, endDate);
        apiStartDate = shiftRange.startDate;
        apiEndDate = shiftRange.endDate;
      }
      const res = await customerService.getHistory(
        id,
        page,
        limit,
        apiStartDate,
        apiEndDate,
      );

      console.log("📦 Backend Response:", res);
      console.log("📊 Data Array:", res.data);
      if (res.data && res.data.length > 0) {
        console.log("🔍 First Record:", res.data[0]);
        console.log(
          "🚗 Vehicle Data:",
          res.data[0].vehicle || res.data[0].registration_no,
        );
        console.log("💰 Price:", res.data[0].price);
        console.log("💵 Tips:", res.data[0].tips);
      }

      setData(res.data || []);
      setCustomerInfo(res.customerInfo || null);
      setCustomerStatusHistory(res.customerInfo?.statusHistory || []);

      const flattenedVehicleHistory = (
        res.customerInfo?.vehicles || []
      ).flatMap((vehicle) =>
        (vehicle.statusHistory || []).map((entry) => ({
          ...entry,
          vehicleLabel:
            `${vehicle.registration_no || "-"} / ${vehicle.parking_no || "-"}`.trim(),
        })),
      );
      setVehicleStatusHistory(flattenedVehicleHistory);

      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      console.error("❌ Failed to load history:", e);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50);
  }, [id]);

  // Auto-fetch when dates change (instant filtering)
  useEffect(() => {
    if (startDate || endDate) {
      fetchData(1, pagination.limit);
    }
  }, [startDate, endDate]);

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setStartDate("");
      setEndDate("");
      // Reset will trigger useEffect to fetch all data
    } else if (field === "startDate") {
      setStartDate(value);
    } else if (field === "endDate") {
      setEndDate(value);
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading("Generating Excel...");
    try {
      // Fetch all data for export (no pagination)
      const res = await customerService.getHistory(
        id,
        1,
        10000,
        startDate,
        endDate,
      );

      const exportData = res.data || [];
      if (exportData.length === 0) {
        toast.error("No data to export", { id: toastId });
        return;
      }

      // Prepare worksheet data matching table columns
      const wsData = [
        [
          "ID",
          "Assigned Date",
          "Completed Date",
          "Status",
          "Vehicle Registration",
          "Parking No",
          "Building",
          "Location",
          "Worker",
          "Worker Mobile",
          "Price",
          "Tips",
          "Type",
        ],
        ...exportData.map((row, idx) => [
          row.scheduleId || idx + 1,
          row.assignedDate
            ? new Date(row.assignedDate).toLocaleString("en-US")
            : "",
          row.completedDate
            ? new Date(row.completedDate).toLocaleString("en-US")
            : "",
          (row.status || "PENDING").toUpperCase(),
          row.registration_no || "N/A",
          row.parking_no || "N/A",
          row.building?.name || "",
          row.location?.address || "",
          row.worker?.name || "",
          row.worker?.mobile || "",
          row.price || 0,
          row.tips || 0,
          row.immediate ? "Immediate" : "Scheduled",
        ]),
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws["!cols"] = [
        { wch: 8 }, // ID
        { wch: 20 }, // Assigned Date
        { wch: 20 }, // Completed Date
        { wch: 12 }, // Status
        { wch: 18 }, // Vehicle Reg
        { wch: 12 }, // Parking
        { wch: 25 }, // Building
        { wch: 30 }, // Location
        { wch: 20 }, // Worker
        { wch: 15 }, // Worker Mobile
        { wch: 10 }, // Price
        { wch: 10 }, // Tips
        { wch: 12 }, // Type
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Washes Report");

      // Generate file
      XLSX.writeFile(
        wb,
        `washes_report_${customerInfo?.mobile || id}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      toast.success("Excel downloaded successfully", { id: toastId });
    } catch (e) {
      console.error("Excel export error:", e);
      toast.error("Excel export failed", { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Generating PDF...");
    try {
      // Fetch all data for export (without pagination)
      const res = await customerService.getHistory(
        id,
        1,
        10000,
        startDate,
        endDate,
      );

      const exportData = res.data || [];
      const custInfo = res.customerInfo || customerInfo || {};

      if (exportData.length === 0) {
        toast.error("No data to export", { id: toastId });
        return;
      }

      // Create PDF with rich styling
      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Background
      doc.setFillColor(79, 70, 229); // Indigo
      doc.rect(0, 0, pageWidth, 35, "F");

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Washes Report - Customer History", pageWidth / 2, 12, {
        align: "center",
      });

      // Customer Info
      if (custInfo.name || custInfo.mobile) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Customer: ${custInfo.name || custInfo.mobile || "-"}`,
          pageWidth / 2,
          20,
          { align: "center" },
        );
      }

      // Date Range
      if (startDate || endDate) {
        doc.setFontSize(9);
        const dateRange = `Period: ${startDate || "All"} to ${endDate || "Present"}`;
        doc.text(dateRange, pageWidth / 2, 27, { align: "center" });
      }

      doc.setTextColor(0, 0, 0); // Reset to black

      // Prepare table data matching frontend columns
      const tableData = exportData.map((row, idx) => {
        return [
          row.scheduleId || idx + 1,
          row.assignedDate
            ? new Date(row.assignedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "-",
          row.completedDate
            ? new Date(row.completedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "-",
          (row.status || "PENDING").toUpperCase(),
          row.registration_no || "N/A",
          row.parking_no || "N/A",
          row.building?.name || "-",
          row.location?.address || "-",
          row.worker?.name || "-",
          `₹${row.price || 0}`,
          `₹${row.tips || 0}`,
          row.immediate ? "Immediate" : "Scheduled",
        ];
      });

      // Generate rich table
      autoTable(doc, {
        startY: 40,
        head: [
          [
            "ID",
            "Assigned",
            "Completed",
            "Status",
            "Vehicle",
            "Parking",
            "Building",
            "Location",
            "Worker",
            "Price",
            "Tips",
            "Type",
          ],
        ],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [79, 70, 229], // Indigo
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Light slate
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "center", cellWidth: 22 },
          2: { halign: "center", cellWidth: 22 },
          3: { halign: "center", cellWidth: 20 },
          4: { halign: "center", cellWidth: 20 },
          5: { halign: "center", cellWidth: 16 },
          6: { halign: "left", cellWidth: 28 },
          7: { halign: "left", cellWidth: 35 },
          8: { halign: "left", cellWidth: 25 },
          9: { halign: "right", cellWidth: 18 },
          10: { halign: "right", cellWidth: 15 },
          11: { halign: "center", cellWidth: 20 },
        },
        margin: { left: 8, right: 8 },
        didDrawPage: () => {
          // Footer on each page
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `Generated: ${new Date().toLocaleString("en-US")} | Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" },
          );
        },
      });

      // Save PDF
      doc.save(
        `washes_report_${custInfo.mobile || id}_${new Date().toISOString().split("T")[0]}.pdf`,
      );

      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (e) {
      console.error("PDF export error:", e);
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns = [
    {
      header: "Id",
      accessor: "scheduleId",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
            {row.scheduleId ||
              (pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Assigned Date",
      accessor: "assignedDate",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-slate-700 text-sm whitespace-nowrap font-medium">
            {row.assignedDate
              ? new Date(row.assignedDate).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Completed Date",
      accessor: "completedDate",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-slate-700 text-sm whitespace-nowrap font-medium">
            {row.completedDate
              ? new Date(row.completedDate).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "PENDING").toUpperCase();
        let colorClass = "text-amber-700 bg-amber-50 border-amber-100";
        let Icon = Clock;

        if (status === "COMPLETED") {
          colorClass = "text-emerald-700 bg-emerald-50 border-emerald-100";
          Icon = CheckCircle2;
        }
        if (status === "CANCELLED") {
          colorClass = "text-rose-700 bg-rose-50 border-rose-100";
          Icon = XCircle;
        }

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      },
    },
    {
      header: "Vehicle Info",
      accessor: "vehicle.registration_no",
      render: (row) => {
        // Handle vehicle as either embedded object or direct fields
        const regNo =
          typeof row.vehicle === "object"
            ? row.vehicle?.registration_no
            : row.registration_no;
        const parkNo =
          typeof row.vehicle === "object"
            ? row.vehicle?.parking_no
            : row.parking_no;

        const hasVehicleData = regNo || parkNo;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Car
                className={`w-3.5 h-3.5 ${hasVehicleData ? "text-blue-500" : "text-slate-300"}`}
              />
              <span
                className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${
                  hasVehicleData
                    ? "text-slate-800 bg-slate-100 border-slate-200"
                    : "text-slate-400 bg-slate-50 border-slate-200 italic"
                }`}
              >
                {regNo || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 ml-0.5">
              <span className="font-medium">P:</span>
              <span className={!parkNo ? "italic text-slate-400" : ""}>
                {parkNo || "N/A"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Building / Location",
      accessor: "building.name",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>{row.building?.name || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span
              className="truncate max-w-[150px]"
              title={row.location?.address}
            >
              {row.location?.address || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-slate-700 text-sm font-medium">
              {row.worker?.name || "-"}
            </span>
          </div>
          {row.worker?.mobile && (
            <span className="text-xs text-slate-500 font-mono ml-5">
              {row.worker.mobile}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Price & Tips",
      accessor: "price",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-800 font-bold text-sm">
              ₹{row.price || 0}
            </span>
          </div>
          {row.tips > 0 && (
            <div className="flex items-center gap-1.5 ml-5">
              <span className="text-xs text-amber-600 font-medium">
                +₹{row.tips} tip
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "immediate",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            row.immediate
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          <FileText className="w-3 h-3" />
          {row.immediate ? "Immediate" : "Scheduled"}
        </span>
      ),
    },
  ];

  const formatStatusEvent = (event) => {
    if (event === "deactivated") return "Deactivated";
    if (event === "reactivated") return "Reactivated";
    return event || "-";
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const sortedCustomerStatusHistory = [...customerStatusHistory].sort(
    (a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0),
  );

  const sortedVehicleStatusHistory = [...vehicleStatusHistory].sort(
    (a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* Customer Info Header */}
      {customerInfo && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {customerInfo.name || "Customer"}
              </h2>
              <div className="flex items-center gap-4 text-indigo-100">
                <span className="font-mono text-sm">
                  📱 {customerInfo.mobile || "-"}
                </span>
                {customerInfo.email && (
                  <span className="text-sm">✉️ {customerInfo.email}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Status History
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase">
              Customer Status Changes
            </h4>
            {sortedCustomerStatusHistory.length === 0 ? (
              <p className="text-sm text-slate-400">
                No customer status history found.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {sortedCustomerStatusHistory.map((entry, index) => (
                  <div
                    key={`customer-status-${index}`}
                    className="rounded-xl border border-slate-200 p-3 bg-slate-50"
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      {formatStatusEvent(entry.event)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDateTime(entry.changedAt)}
                    </div>
                    {entry.reason && (
                      <div className="text-xs text-rose-600 mt-1">
                        Reason: {entry.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase">
              Vehicle Status Changes
            </h4>
            {sortedVehicleStatusHistory.length === 0 ? (
              <p className="text-sm text-slate-400">
                No vehicle status history found.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {sortedVehicleStatusHistory.map((entry, index) => (
                  <div
                    key={`vehicle-status-${index}`}
                    className="rounded-xl border border-slate-200 p-3 bg-slate-50"
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      {entry.vehicleLabel}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {formatStatusEvent(entry.event)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDateTime(entry.changedAt)}
                    </div>
                    {entry.reason && (
                      <div className="text-xs text-rose-600 mt-1">
                        Reason: {entry.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title & Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                  Washes Report
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>History Details</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions: Export & Pagination Controls */}
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* Pagination Controls */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <div className="px-3 text-xs font-bold text-slate-500 uppercase">
                {pagination.total} Records
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchData(pagination.page - 1, pagination.limit)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium px-2 text-slate-700">
                {pagination.page}/{pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1, pagination.limit)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="h-10 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DATE FILTER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="w-full">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase ml-1">
            Filter by Date Range (Auto-applies)
          </label>
          <RichDateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            className="w-full"
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>
    </div>
  );
};

export default CustomerHistory;
