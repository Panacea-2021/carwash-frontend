import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Download,
  Search,
  Filter,
  User,
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Eye,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  X,
  MapPin,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Components
import DataTable from "../../components/DataTable";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown";
import ReceiptModal from "../../components/modals/ReceiptModal";

// API
import { paymentService } from "../../api/paymentService";
import { toCalendarRange } from "../../utils/shiftTime";

const SupervisorResidencePayments = () => {
  const [currency, setCurrency] = useState("AED");
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalJobs: 0,
    cash: 0,
    card: 0,
    bank: 0,
  });
  const [total, setTotal] = useState(0);
  const [workers, setWorkers] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // Date tabs
  const getMonthNames = () => {
    const today = new Date();
    const thisMonth = today.toLocaleString("default", { month: "long" });
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const lastMonth = prevDate.toLocaleString("default", { month: "long" });
    return { thisMonth, lastMonth };
  };

  const { thisMonth, lastMonth } = getMonthNames();

  const getRangeForTab = (tab) => {
    const today = new Date();
    let start, end;
    if (tab === "today") {
      start = new Date(today);
      end = new Date(today);
    } else if (tab === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const calendarRange = toCalendarRange(fmt(start), fmt(end));
    return {
      startDate: calendarRange.startDate,
      endDate: calendarRange.endDate,
    };
  };

  const [activeTab, setActiveTab] = useState("today");
  const initialDates = getRangeForTab("today");

  const [filters, setFilters] = useState({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    worker: "",
    building: "",
    status: "",
    payment_mode: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // View modal
  const [viewPayment, setViewPayment] = useState(null);

  // Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("app_currency");
    if (saved) setCurrency(saved);
  }, []);

  // Fetch workers for filter dropdown
  useEffect(() => {
    const fetchWorkerList = async () => {
      try {
        const api = (await import("../../api/axiosInstance")).default;
        const res = await api.get("/workers", {
          params: { pageNo: 0, pageSize: 1000, status: 1 },
        });
        setWorkers(res.data?.data || []);
      } catch {
        // silent
      }
    };
    fetchWorkerList();
  }, []);

  // Fetch buildings for filter dropdown
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const api = (await import("../../api/axiosInstance")).default;
        const res = await api.get("/buildings", {
          params: { pageNo: 0, pageSize: 1000 },
        });
        setBuildings(res.data?.data || []);
      } catch {
        // silent
      }
    };
    fetchBuildings();
  }, []);

  const fetchData = useCallback(
    async (page = 1, limit = 100) => {
      setLoading(true);
      try {
        const isSearching = searchTerm.trim().length > 0;
        const fetchLimit = isSearching ? 3000 : limit;

        let apiFilters = {
          ...filters,
          onewash: "false", // residence payments
        };
        if (
          filters.startDate &&
          filters.endDate &&
          filters.startDate.length === 10
        ) {
          const calendarRange = toCalendarRange(
            filters.startDate,
            filters.endDate,
          );
          apiFilters.startDate = calendarRange.startDate;
          apiFilters.endDate = calendarRange.endDate;
        }

        const result = await paymentService.list(
          page,
          fetchLimit,
          "",
          apiFilters,
        );

        const dataArray = result.data || [];
        const backendTotal = result.total || dataArray.length || 0;

        setPayments(dataArray);
        setStats(result.counts || stats);
        setTotal(backendTotal);
        setPagination({
          page,
          limit: fetchLimit,
          total: backendTotal,
          totalPages: Math.ceil(backendTotal / fetchLimit) || 1,
        });
      } catch {
        toast.error("Failed to load payments");
      } finally {
        setLoading(false);
      }
    },
    [filters, searchTerm],
  );

  useEffect(() => {
    fetchData(1, pagination.limit);
  }, [filters]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const limit = searchTerm ? 3000 : 100;
      fetchData(1, limit);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Client-side search filtering
  const filteredPayments = payments.filter((row) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    const id = String(row.id || row._id || "").toLowerCase();
    const customerName = row.customer?.name?.toLowerCase() || "";
    const buildingName = row.building?.name?.toLowerCase() || "";
    const workerName = row.worker?.name?.toLowerCase() || "";
    const amount = String(
      row.total_amount || row.amount_paid || "",
    ).toLowerCase();
    const status = row.status?.toLowerCase() || "";
    return (
      id.includes(term) ||
      customerName.includes(term) ||
      buildingName.includes(term) ||
      workerName.includes(term) ||
      amount.includes(term) ||
      status.includes(term)
    );
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newDates = getRangeForTab(tab);
    setFilters((prev) => ({
      ...prev,
      startDate: newDates.startDate,
      endDate: newDates.endDate,
    }));
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      handleTabChange("today");
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setActiveTab("custom");
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Downloading report...");
    try {
      const result = await paymentService.exportData({
        ...filters,
        onewash: "false",
        search: searchTerm,
      });
      const blob = new Blob([result], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `residence_payments_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download complete", { id: toastId });
    } catch {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- RECEIPT PDF ---
  const handleViewReceipt = (row) => {
    setSelectedReceipt({
      id: row.id,
      receipt_no: row.receipt_no,
      createdAt: row.createdAt,
      vehicle: {
        registration_no: "-",
        parking_no: "-",
      },
      building: row.building || { name: "-" },
      amount_paid: row.amount_paid || 0,
      tip: row.tip_amount || 0,
      balance: row.balance || 0,
      payment_mode: row.payment_mode || "cash",
      status: row.status || "pending",
      settled: row.settled || "pending",
      worker: row.worker,
      service_type: "residence",
      customer: row.customer,
    });
  };

  // --- Dropdown Options ---
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const workerOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Workers" }];
    if (workers?.length) {
      workers.forEach((w) => opts.push({ value: w._id, label: w.name }));
    }
    return opts;
  }, [workers]);

  const buildingOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Buildings" }];
    if (buildings?.length) {
      buildings.forEach((b) => opts.push({ value: b._id, label: b.name }));
    }
    return opts;
  }, [buildings]);

  // --- Computed Stats ---
  const cashPct =
    stats.totalAmount > 0
      ? ((stats.cash / stats.totalAmount) * 100).toFixed(0)
      : 0;
  const cardPct =
    stats.totalAmount > 0
      ? ((stats.card / stats.totalAmount) * 100).toFixed(0)
      : 0;
  const bankPct =
    stats.totalAmount > 0
      ? ((stats.bank / stats.totalAmount) * 100).toFixed(0)
      : 0;

  // --- TABLE COLUMNS ---
  const columns = [
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-32",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
            <Calendar className="w-3 h-3 text-indigo-500" />
            {new Date(row.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </div>
          <span className="text-[10px] text-slate-400 pl-4.5">
            {new Date(row.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer.name",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            {row.customer?.name || "N/A"}
          </span>
          {row.customer?.flat_no && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 pl-4">
              Flat: {row.customer.flat_no}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Building",
      accessor: "building.name",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-emerald-500" />
          <span className="text-sm text-slate-700 font-medium">
            {row.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "total_amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          {(row.total_amount || 0).toFixed(2)}{" "}
          <span className="text-[10px] text-slate-400">{currency}</span>
        </span>
      ),
    },
    {
      header: "Paid",
      accessor: "amount_paid",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {(row.amount_paid || 0).toFixed(2)}{" "}
          <span className="text-[10px] text-emerald-400">{currency}</span>
        </span>
      ),
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (row) => {
        const bal = row.balance || 0;
        return (
          <span
            className={`font-bold text-sm ${bal > 0 ? "text-red-600" : "text-slate-400"}`}
          >
            {bal.toFixed(2)} <span className="text-[10px]">{currency}</span>
          </span>
        );
      },
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) => {
        const mode = (row.payment_mode || "").toLowerCase();
        let modeColor = "bg-slate-100 text-slate-600 border-slate-200";
        if (mode === "cash")
          modeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        else if (mode === "card")
          modeColor = "bg-blue-50 text-blue-700 border-blue-200";
        else if (mode === "bank" || mode === "bank transfer")
          modeColor = "bg-purple-50 text-purple-700 border-purple-200";
        return (
          <span
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${modeColor}`}
          >
            {row.payment_mode || "-"}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-28",
      render: (row) => {
        const s = (row.status || "").toUpperCase();
        return (
          <span
            className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
              s === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : s === "CANCELLED"
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
            }`}
          >
            {s === "COMPLETED" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {s}
          </span>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => {
        if (!row.worker?.name) return null;
        return (
          <div className="flex items-start gap-1.5 min-w-[100px]">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {row.worker.name[0]}
            </div>
            <span className="text-xs font-semibold text-slate-700 whitespace-normal break-words leading-tight">
              {row.worker.name}
            </span>
          </div>
        );
      },
    },
    {
      header: "Settled",
      accessor: "settled",
      className: "text-center",
      render: (row) => {
        const settled = (row.settled || "pending").toLowerCase();
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              settled === "completed" || settled === "settled"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-orange-50 text-orange-600"
            }`}
          >
            {settled === "completed" || settled === "settled"
              ? "Settled"
              : "Pending"}
          </span>
        );
      },
    },
    {
      header: "",
      className: "text-center w-20",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setViewPayment(row)}
            className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {(row.status || "").toLowerCase() === "completed" && (
            <button
              onClick={() => handleViewReceipt(row)}
              className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
              title="View Receipt"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* ─── HEADER ─── */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Residence Payments
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage residence subscription payments
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer, building, worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-52 h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
            {/* Date Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button
                onClick={() => handleTabChange("today")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "today"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleTabChange("this_month")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "this_month"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {thisMonth}
              </button>
              <button
                onClick={() => handleTabChange("last_month")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "last_month"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {lastMonth}
              </button>
            </div>

            <button
              onClick={handleExport}
              className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {/* Total Amount */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-0.5">
                Total Amount
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">
                  {stats.totalAmount?.toLocaleString() || 0}
                </span>
                <span className="text-xs opacity-70">{currency}</span>
              </div>
              <span className="text-[10px] opacity-50">
                {total || 0} records
              </span>
            </div>
          </div>

          {/* Cash */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Cash
              </span>
              <span className="text-xl font-bold text-slate-700">
                {stats.cash?.toLocaleString() || 0}
              </span>
              <span className="block text-[10px] text-emerald-500 font-bold">
                {cashPct}%
              </span>
            </div>
          </div>

          {/* Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Card
              </span>
              <span className="text-xl font-bold text-slate-700">
                {stats.card?.toLocaleString() || 0}
              </span>
              <span className="block text-[10px] text-blue-500 font-bold">
                {cardPct}%
              </span>
            </div>
          </div>

          {/* Bank */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Bank
              </span>
              <span className="text-xl font-bold text-slate-700">
                {stats.bank?.toLocaleString() || 0}
              </span>
              <span className="block text-[10px] text-purple-500 font-bold">
                {bankPct}%
              </span>
            </div>
          </div>

          {/* Records */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Records
              </span>
              <span className="text-xl font-bold text-amber-600">
                {total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="space-y-4">
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Date Range
            </label>
            <RichDateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <CustomDropdown
                label="Status"
                value={filters.status}
                onChange={(val) => setFilters({ ...filters, status: val })}
                options={statusOptions}
                icon={Filter}
                placeholder="All Status"
              />
            </div>
            <div>
              <CustomDropdown
                label="Payment Mode"
                value={filters.payment_mode}
                onChange={(val) =>
                  setFilters({ ...filters, payment_mode: val })
                }
                options={[
                  { value: "", label: "All Modes" },
                  { value: "cash", label: "Cash" },
                  { value: "card", label: "Card" },
                  { value: "bank transfer", label: "Bank Transfer" },
                ]}
                icon={CreditCard}
                placeholder="All Modes"
              />
            </div>
            <div>
              <CustomDropdown
                label="Building"
                value={filters.building}
                onChange={(val) => setFilters({ ...filters, building: val })}
                options={buildingOptions}
                icon={Building2}
                placeholder="All Buildings"
                searchable={true}
              />
            </div>
            <div>
              <CustomDropdown
                label="Worker"
                value={filters.worker}
                onChange={(val) => setFilters({ ...filters, worker: val })}
                options={workerOptions}
                icon={User}
                placeholder="All Workers"
                searchable={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Filtered Results:
            </span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">
              {filteredPayments.length} of {total}
            </span>
            <span className="text-xs text-slate-500">total records</span>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filteredPayments}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          hideSearch={true}
        />
      </div>

      {/* ─── VIEW DETAIL MODAL ─── */}
      <AnimatePresence>
        {viewPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Payment Details</h3>
                      <p className="text-white/70 text-xs">
                        #{viewPayment.id || viewPayment._id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewPayment(null)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Customer Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
                    Customer Info
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Name
                      </span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {viewPayment.customer?.name || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Flat No
                      </span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {viewPayment.customer?.flat_no || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Building
                      </span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {viewPayment.building?.name || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
                    Payment Info
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Total Amount
                      </span>
                      <span className="font-bold text-slate-700 text-lg">
                        {(viewPayment.total_amount || 0).toFixed(2)} {currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Amount Paid
                      </span>
                      <span className="font-bold text-emerald-600 text-lg">
                        {(viewPayment.amount_paid || 0).toFixed(2)} {currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Balance
                      </span>
                      <span
                        className={`font-bold text-lg ${(viewPayment.balance || 0) > 0 ? "text-red-600" : "text-slate-400"}`}
                      >
                        {(viewPayment.balance || 0).toFixed(2)} {currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Mode
                      </span>
                      <span className="font-bold text-slate-700 uppercase text-sm">
                        {viewPayment.payment_mode || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          (viewPayment.status || "").toLowerCase() ===
                          "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {(viewPayment.status || "").toLowerCase() ===
                        "completed" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {(viewPayment.status || "PENDING").toUpperCase()}
                      </span>
                    </div>
                    {viewPayment.receipt_no && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Receipt No
                        </span>
                        <span className="font-bold text-slate-700">
                          {viewPayment.receipt_no}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Worker & Service */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
                    Service Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Worker
                      </span>
                      <span className="font-bold text-slate-700">
                        {viewPayment.worker?.name || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Settled
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          (viewPayment.settled || "").toLowerCase() ===
                            "completed" ||
                          (viewPayment.settled || "").toLowerCase() ===
                            "settled"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {(viewPayment.settled || "").toLowerCase() ===
                          "completed" ||
                        (viewPayment.settled || "").toLowerCase() === "settled"
                          ? "Settled"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewPayment.notes && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Remarks
                    </h4>
                    <p className="text-sm text-slate-600">
                      {viewPayment.notes}
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-center text-[10px] text-slate-400 pt-2">
                  Created:{" "}
                  {new Date(viewPayment.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── RECEIPT MODAL ─── */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
      />
    </div>
  );
};

export default SupervisorResidencePayments;
