import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Download,
  Search,
  Filter,
  User,
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
  Plus,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Briefcase,
  Building,
  MapPin,
  Coins,
  Droplets,
  Calculator,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal";
import ViewPaymentModal from "../../components/modals/ViewPaymentModal";
import OneWashModal from "../../components/modals/OneWashModal";
import DeleteModal from "../../components/modals/DeleteModal";
import EditPaymentAmountModal from "../../components/modals/EditPaymentAmountModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown";
import usePagePermissions from "../../utils/usePagePermissions";

// Redux
import { exportPayments } from "../../redux/slices/paymentSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { fetchOneWash, deleteOneWash } from "../../redux/slices/oneWashSlice";

const OneWashPayments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pp = usePagePermissions("payments_onewash");

  // Redux State
  const { oneWashJobs, stats, total, loading } = useSelector(
    (state) => state.oneWash,
  );
  const { workers } = useSelector((state) => state.worker);

  const [currency, setCurrency] = useState("AED");

  // --- DATES & TABS LOGIC ---
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
    let startStr, endStr;

    if (tab === "today") {
      startStr = today.toISOString().split("T")[0];
      endStr = startStr;
    } else if (tab === "this_month") {
      startStr = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      endStr = today.toISOString().split("T")[0];
    } else {
      startStr = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      endStr = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split("T")[0];
    }

    return { startDate: startStr, endDate: endStr };
  };

  const [activeTab, setActiveTab] = useState("today");
  const initialDates = getRangeForTab("today");

  const [filters, setFilters] = useState({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    worker: "",
    status: "",
    service_type: "",
    mall: "",
    building: "",
    payment_mode: "",
    wash_type: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteJob, setDeleteJob] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editAmountPayment, setEditAmountPayment] = useState(null);

  useEffect(() => {
    if (searchParams.get("ai") !== "1") {
      return;
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const worker = searchParams.get("worker");
    const customer = searchParams.get("customer");
    const createdBy = searchParams.get("createdBy");
    const q = searchParams.get("q");

    setFilters((previous) => ({
      ...previous,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(worker ? { worker } : {}),
      ...(customer ? { customer } : {}),
      ...(createdBy ? { createdBy } : {}),
    }));

    setSearchTerm(q || "");

    if (startDate || endDate) {
      setActiveTab("custom");
    }
  }, [searchParams]);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    fetchData(1, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // --- AUTOMATIC FETCH ---
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Fetch larger set if searching to allow client-side filtering
      const limit = searchTerm ? 3000 : 100;
      fetchData(1, limit);
    }, 500); // Instant search debounce
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ✅ LOG SEARCH FIELDS
  useEffect(() => {
    if (searchTerm) {
      console.group("🔍 Search Active");
      console.log("Searching for:", searchTerm);
      console.log("Fields included in search:");
      console.log("1. Vehicle Registration");
      console.log("2. Parking Number");
      console.log("3. Worker Name");
      console.log("4. Payment ID");
      console.log("5. Amount & Status");
      console.groupEnd();
    }
  }, [searchTerm]);

  const fetchData = async (page = 1, limit = 100) => {
    try {
      const apiFilters = { ...filters };

      const normalizedSearch = searchTerm.trim();
      const isSearching = normalizedSearch.length > 0;
      const useServerSearch = /\d/.test(normalizedSearch);
      const fetchLimit = useServerSearch ? limit : isSearching ? 3000 : limit;

      const result = await dispatch(
        fetchOneWash({
          page,
          limit: fetchLimit,
          search: useServerSearch ? normalizedSearch : "",
          filters: apiFilters,
        }),
      ).unwrap();

      setPagination({
        page,
        limit: fetchLimit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / fetchLimit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load payments");
    }
  };

  // ✅ ENHANCED FILTER LOGIC
  const filteredPayments = oneWashJobs.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase().trim();

    if (/\d/.test(lowerTerm)) {
      return true;
    }

    // 1. Prepare Fields
    const id = String(row.id || row._id || "").toLowerCase();
    const vehicleReg = row.registration_no?.toLowerCase() || "";
    const parkingNo = row.parking_no?.toString().toLowerCase() || "";
    const workerName = row.worker?.name ? row.worker.name.toLowerCase() : "";
    const amount = String(row.amount || "").toLowerCase();
    const status = row.status?.toLowerCase() || "";

    // 2. Check Match
    const matches =
      id.includes(lowerTerm) ||
      vehicleReg.includes(lowerTerm) ||
      parkingNo.includes(lowerTerm) ||
      workerName.includes(lowerTerm) ||
      amount.includes(lowerTerm) ||
      status.includes(lowerTerm);

    return matches;
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

  const handleViewReceipt = (row) => {
    const receiptData = {
      id: row.id,
      receipt_no: row.receipt_no, // Pass receipt_no from backend
      createdAt: row.createdAt,
      vehicle: {
        registration_no: row.registration_no || "-",
        parking_no: row.parking_no || "-",
      },
      building: row.building || row.mall || { name: "-" },
      amount_paid: row.amount || 0,
      tip: row.tip_amount || 0,
      balance: row.balance || 0,
      payment_mode: row.payment_mode || "cash",
      status: row.status || "pending",
      settled: row.settled || "pending",
      worker: row.worker,
      service_type: row.service_type,
      mall: row.mall,
    };
    setSelectedReceipt(receiptData);
  };

  const handleViewDetails = (row) => setViewPayment(row);
  const handleEdit = (row) => {
    setEditJob(row);
    setIsEditModalOpen(true);
  };
  const handleAddNew = () => {
    setEditJob(null);
    setIsEditModalOpen(true);
  };
  const handleEditSuccess = () => {
    fetchData(pagination.page, pagination.limit);
  };
  const handleDelete = (row) => {
    setDeleteJob(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteJob) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteOneWash(deleteJob._id)).unwrap();
      toast.success("Payment deleted successfully!");
      fetchData(pagination.page, pagination.limit);
      setIsDeleteModalOpen(false);
      setDeleteJob(null);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Downloading report...");
    try {
      const exportParams = {
        ...filters,
        search: searchTerm,
        onewash: "true",
      };
      const result = await dispatch(exportPayments(exportParams)).unwrap();
      const blobData = result.blob || result;
      const blob = new Blob([blobData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `onewash_payments_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download complete", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const serviceTypeOptions = [
    { value: "", label: "All Services" },
    { value: "mall", label: "Mall" },
    { value: "residence", label: "Residence" },
  ];

  const workerOptions = useMemo(() => {
    const options = [{ value: "", label: "All Workers" }];
    if (workers && workers.length > 0) {
      workers.forEach((w) => options.push({ value: w._id, label: w.name }));
    }
    return options;
  }, [workers]);

  const columns = [
    {
      key: "date",
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
      key: "vehicle",
      header: "Vehicle",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
            <Car className="w-3 h-3 text-slate-400" />
            {row.registration_no || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "parking",
      header: "Parking",
      accessor: "parking_no",
      className: "text-center",
      render: (row) => (
        <span className="font-medium text-slate-600 text-sm">
          {row.parking_no || "-"}
        </span>
      ),
    },
    {
      key: "serviceType",
      header: "Service Type",
      accessor: "display_service_type",
      className: "text-center",
      render: (row) => {
        const displayText = row.display_service_type || "-";
        let colorClass = "bg-slate-50 text-slate-600 border-slate-200";

        const serviceType = (displayText || "").toLowerCase();

        if (serviceType === "residence") {
          colorClass = "bg-green-50 text-green-700 border-green-200";
        } else if (serviceType === "external" || serviceType === "outside") {
          colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        } else if (
          serviceType === "total" ||
          serviceType === "inside + outside"
        ) {
          colorClass = "bg-purple-50 text-purple-700 border-purple-200";
        } else if (serviceType === "internal" || serviceType === "inside") {
          colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
        } else if (serviceType === "mall") {
          colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        }

        return (
          <span
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${colorClass}`}
          >
            {displayText}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Original Amount",
      accessor: "original_amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {(row.amount - (row.tip_amount || 0)).toFixed(2)}{" "}
          <span className="text-[10px] text-emerald-400">{currency}</span>
        </span>
      ),
    },
    {
      key: "tip",
      header: "Tip",
      accessor: "tip_amount",
      className: "text-center",
      render: (row) => (
        <span className="text-slate-500 text-sm">
          {row.tip_amount ? `${row.tip_amount}` : "-"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total Amount",
      accessor: "amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {row.amount}{" "}
          <span className="text-[10px] text-emerald-400">{currency}</span>
        </span>
      ),
    },
    {
      key: "paymentMode",
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) => (
        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      key: "status",
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
      key: "worker",
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
      key: "receipt",
      header: "Receipt",
      className: "text-center w-16",
      render: (row) => {
        const isPaid = (row.status || "").toLowerCase() === "completed";
        if (!isPaid) return <span className="text-slate-300">-</span>;
        return (
          <button
            onClick={() => handleViewReceipt(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="Download Receipt"
          >
            <FileText className="w-4 h-4" />
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[80px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {pp.isActionVisible("view") && (
            <button
              onClick={() => handleViewDetails(row)}
              className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("editAmount") && (
            <button
              onClick={() => setEditAmountPayment(row)}
              className="p-1.5 hover:bg-amber-50 rounded text-slate-400 hover:text-amber-600"
              title="Edit Amount"
            >
              <Calculator className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("receipt") &&
            (row.status || "").toLowerCase() === "completed" && (
              <button
                onClick={() => handleViewReceipt(row)}
                className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600"
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                One Wash Payments
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage on-demand wash transactions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {pp.isToolbarVisible("search") && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicle, worker, parking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-52 h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            )}
            {pp.isToolbarVisible("dateRange") && (
              <div className="bg-slate-100 p-1 rounded-xl flex">
                <button
                  onClick={() => handleTabChange("today")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "today"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleTabChange("this_month")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "this_month"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {thisMonth}
                </button>
                <button
                  onClick={() => handleTabChange("last_month")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "last_month"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {lastMonth}
                </button>
              </div>
            )}
            {pp.isToolbarVisible("addNew") && (
              <button
                onClick={handleAddNew}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                title="Add New Payment"
              >
                <Plus className="w-5 h-5" /> New
              </button>
            )}
            {pp.isToolbarVisible("export") && (
              <button
                onClick={handleExport}
                className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            )}
            {pp.isToolbarVisible("editHistory") && (
              <button
                onClick={() => navigate("/payments/edit-history")}
                className="h-10 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Clock className="w-4 h-4" /> Edit History
              </button>
            )}
            <button
              onClick={() =>
                navigate("/pending-payments/employee-wise?type=onewash")
              }
              className="h-10 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Users className="w-4 h-4" /> Employee Wise
            </button>
          </div>
        </div>

        {/* ✅ UPDATED STATS GRID: 5 Equal Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {/* 1. Original Amount Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md flex items-center gap-4">
            {/* Left: Icon Centered */}
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            {/* Right: Label Top, Number Bottom */}
            <div>
              <span className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-0.5">
                Original Amount
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{stats.totalAmount}</span>
                <span className="text-xs opacity-70">{currency}</span>
              </div>
            </div>
          </div>

          {/* 2. Cash Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Cash
              </span>
              <span className="text-xl font-bold text-slate-700">
                {stats.cash}
              </span>
            </div>
          </div>

          {/* 3. Card Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Card
              </span>
              <span className="text-xl font-bold text-slate-700">
                {stats.card}
              </span>
            </div>
          </div>

          {/* 4. Bank Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Bank
              </span>
              <span className="text-xl font-bold text-slate-700">
                {stats.bank}
              </span>
            </div>
          </div>

          {/* 5. Tips Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Tips
              </span>
              <span className="text-xl font-bold text-amber-600">
                {stats.tips || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Wash Type Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Outside
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-blue-700">
                  {stats.outsideAmount || 0}{" "}
                  <span className="text-[10px] text-blue-400">{currency}</span>
                </span>
                <span className="text-[10px] font-bold text-blue-500">
                  ({stats.outsideCount || 0} jobs)
                </span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Inside + Outside
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-purple-700">
                  {stats.insideOutsideAmount || 0}{" "}
                  <span className="text-[10px] text-purple-400">
                    {currency}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-purple-500">
                  ({stats.insideOutsideCount || 0} jobs)
                </span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-green-400 uppercase tracking-wider">
                Residence
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-green-700">
                  {stats.residenceAmount || 0}{" "}
                  <span className="text-[10px] text-green-400">{currency}</span>
                </span>
                <span className="text-[10px] font-bold text-green-500">
                  ({stats.residenceCount || 0} jobs)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILTERS & ACTIONS --- */}
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
            {pp.isToolbarVisible("statusFilter") && (
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
            )}
            {pp.isToolbarVisible("paymentModeFilter") && (
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
            )}
            {pp.isToolbarVisible("washTypeFilter") && (
              <div>
                <CustomDropdown
                  label="Wash Type"
                  value={filters.wash_type}
                  onChange={(val) => setFilters({ ...filters, wash_type: val })}
                  options={[
                    { value: "", label: "All Types" },
                    { value: "outside", label: "Outside" },
                    { value: "total", label: "Inside + Outside" },
                  ]}
                  icon={Droplets}
                  placeholder="All Types"
                />
              </div>
            )}
            {pp.isToolbarVisible("workerFilter") && (
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
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
        <DataTable
          columns={pp.filterColumns(columns)}
          data={filteredPayments}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          hideSearch={true}
        />
      </div>

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
      />
      <ViewPaymentModal
        isOpen={!!viewPayment}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />
      <OneWashModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditJob(null);
        }}
        job={editJob}
        onSuccess={handleEditSuccess}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteJob(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Payment?"
        message={`Delete payment for ${
          deleteJob?.registration_no || "this vehicle"
        }?`}
      />
      <EditPaymentAmountModal
        isOpen={!!editAmountPayment}
        onClose={() => setEditAmountPayment(null)}
        payment={editAmountPayment}
        onSuccess={() => {
          fetchData(pagination.page, pagination.limit);
          setEditAmountPayment(null);
        }}
      />
    </div>
  );
};

export default OneWashPayments;
