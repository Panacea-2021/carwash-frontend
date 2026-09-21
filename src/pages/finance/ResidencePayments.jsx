import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Download,
  Search,
  Filter,
  User,
  Building,
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Receipt,
  Wallet,
  Calendar,
  CheckCircle2, // Settle Icon
  CheckSquare, // Mark Paid Icon
  Clock,
  Building2,
  StickyNote,
  X,
  Play,
  Loader2,
  Zap,
  Calculator,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal";
import ResidenceReceiptModal from "../../components/modals/ResidenceReceiptModal";
import ViewPaymentModal from "../../components/modals/ViewPaymentModal";
import DeleteModal from "../../components/modals/DeleteModal";
import PaymentModal from "../../components/modals/PaymentModal";
import EditPaymentAmountModal from "../../components/modals/EditPaymentAmountModal";
import PaymentHistoryModal from "../../components/modals/PaymentHistoryModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown"; // Import CustomDropdown
import usePagePermissions from "../../utils/usePagePermissions";
import { toCalendarRange } from "../../utils/shiftTime";

// API
import { buildingService } from "../../api/buildingService";
import { customerService } from "../../api/customerService";

// Redux
import {
  fetchResidencePayments,
  deleteResidencePayment,
} from "../../redux/slices/residencePaymentSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import {
  exportPayments,
  settlePaymentsBulk,
  bulkUpdatePaymentStatus,
} from "../../redux/slices/paymentSlice";
import { paymentService } from "../../api/paymentService";

const ResidencePayments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pp = usePagePermissions("payments_residence");

  const { payments, stats, loading, total } = useSelector(
    (state) => state.residencePayment,
  );
  const { workers } = useSelector((state) => state.worker);

  const [buildings, setBuildings] = useState([]);
  const [currency, setCurrency] = useState("AED"); // Default Currency

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

    return toCalendarRange(startStr, endStr);
  };

  const [activeTab, setActiveTab] = useState("this_month");
  const initialDates = getRangeForTab("this_month");

  const [filters, setFilters] = useState({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    worker: "",
    status: "",
    onewash: "false",
    building: "",
    payment_mode: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [editAmountPayment, setEditAmountPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isClosingMonth, setIsClosingMonth] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonthForClose, setSelectedMonthForClose] = useState(null);
  const [closeOperation, setCloseOperation] = useState(null); // 'close' or 'revert'
  const [customerNotesModal, setCustomerNotesModal] = useState({
    isOpen: false,
    customer: null,
    notes: "",
  });
  const [savingNotes, setSavingNotes] = useState(false);

  // Invoice Generation Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState("full_subscription"); // "full_subscription" or "per_wash"
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth()); // 0-11
  const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());
  const [runningInvoice, setRunningInvoice] = useState(false);
  const [invoiceCheckResult, setInvoiceCheckResult] = useState(null);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const [historyPayment, setHistoryPayment] = useState(null);

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
      onewash: "false",
    }));

    setSearchTerm(q || "");

    if (startDate || endDate) {
      setActiveTab("custom");
    }
  }, [searchParams]);

  // Load Currency & Initial Data
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);

    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));

    // Load buildings
    const loadBuildings = async () => {
      try {
        const res = await buildingService.list(1, 1000);
        setBuildings(res.data || []);
      } catch (e) {
        console.error("Failed to load buildings", e);
      }
    };
    loadBuildings();

    fetchData(1, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const limit = searchTerm ? 3000 : 100;
      fetchData(1, limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchData = async (page = 1, limit = 100) => {
    try {
      const normalizedSearch = searchTerm.trim();
      const isSearching = normalizedSearch.length > 0;
      const useServerSearch = /\d/.test(normalizedSearch);
      const fetchLimit = useServerSearch ? limit : isSearching ? 3000 : limit;

      // If dates are YYYY-MM-DD (from custom picker), convert to full-day range
      let apiFilters = { ...filters };
      if (apiFilters.startDate && apiFilters.startDate.length === 10) {
        const calendarRange = toCalendarRange(
          apiFilters.startDate,
          apiFilters.endDate,
        );
        apiFilters.startDate = calendarRange.startDate;
        apiFilters.endDate = calendarRange.endDate;
      }

      const result = await dispatch(
        fetchResidencePayments({
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

  // --- CLIENT SIDE FILTERING ---
  const filteredPayments = payments.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase().trim();

    if (/\d/.test(lowerTerm)) {
      return true;
    }

    const id = String(row.id || row._id || "").toLowerCase();
    const vehicleReg = row.vehicle?.registration_no?.toLowerCase() || "";
    const parkingNo = row.vehicle?.parking_no?.toString().toLowerCase() || "";
    const fName = row.customer?.firstName || "";
    const lName = row.customer?.lastName || "";
    const customerName = `${fName} ${lName}`.toLowerCase();
    const mobile = row.customer?.mobile?.toLowerCase() || "";
    const buildingName =
      row.customer?.building?.name?.toLowerCase() ||
      row.building?.name?.toLowerCase() ||
      "";
    const workerName = row.worker?.name ? row.worker.name.toLowerCase() : "";
    const amountTotal = String(row.total_amount || "").toLowerCase();
    const amountPaid = String(row.amount_paid || "").toLowerCase();
    const paymentMode = row.payment_mode?.toLowerCase() || "";
    const status = row.status?.toLowerCase() || "";
    const dateObj = new Date(row.createdAt);
    const dateStr = dateObj.toLocaleDateString().toLowerCase();
    const monthStr = dateObj
      .toLocaleString("default", { month: "long" })
      .toLowerCase();

    return (
      id.includes(lowerTerm) ||
      vehicleReg.includes(lowerTerm) ||
      parkingNo.includes(lowerTerm) ||
      customerName.includes(lowerTerm) ||
      mobile.includes(lowerTerm) ||
      buildingName.includes(lowerTerm) ||
      workerName.includes(lowerTerm) ||
      amountTotal.includes(lowerTerm) ||
      amountPaid.includes(lowerTerm) ||
      paymentMode.includes(lowerTerm) ||
      status.includes(lowerTerm) ||
      dateStr.includes(lowerTerm) ||
      monthStr.includes(lowerTerm)
    );
  });

  // --- HANDLERS ---

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newDates = getRangeForTab(tab);
    setFilters((prev) => ({
      ...prev,
      startDate: newDates.startDate,
      endDate: newDates.endDate,
    }));
  };

  const handleBulkSettle = async () => {
    const pendingIds = filteredPayments
      .filter((row) => (row.settled || "pending").toLowerCase() !== "completed")
      .map((row) => row._id || row.id);

    if (pendingIds.length === 0) {
      toast.success("All displayed payments are already settled!");
      return;
    }

    if (
      !window.confirm(
        `Mark ${pendingIds.length} payments as SETTLED for ${
          activeTab === "this_month" ? thisMonth : lastMonth
        }?`,
      )
    )
      return;

    setIsSettling(true);
    try {
      await dispatch(settlePaymentsBulk(pendingIds)).unwrap();
      toast.success(`Successfully settled ${pendingIds.length} payments!`);
      fetchData(pagination.page, pagination.limit);
    } catch (e) {
      toast.error("Failed to settle payments");
    } finally {
      setIsSettling(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    const pendingIds = filteredPayments
      .filter((row) => (row.status || "pending").toLowerCase() !== "completed")
      .map((row) => row._id || row.id);

    if (pendingIds.length === 0) {
      toast.success("All displayed payments are already marked as Paid!");
      return;
    }

    if (!window.confirm(`Mark ${pendingIds.length} payments as PAID?`)) return;

    setIsMarkingPaid(true);
    try {
      console.log("🚀 [FRONTEND] Sending Bulk Status Update for:", pendingIds);
      await dispatch(
        bulkUpdatePaymentStatus({ ids: pendingIds, status: "completed" }),
      ).unwrap();
      toast.success(
        `Successfully marked ${pendingIds.length} payments as Paid!`,
      );
      console.log("🔄 [FRONTEND] Refetching data...");
      await fetchData(pagination.page, pagination.limit);
    } catch (e) {
      console.error("❌ [FRONTEND] Error:", e);
      toast.error("Failed to update status");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const fetchAvailableMonths = async () => {
    try {
      console.log("🔍 Fetching available months with pending bills...");

      const result = await paymentService.getMonthsWithPending();

      console.log("📦 Result:", result);

      if (result.months) {
        console.log("📅 Available months:", result.months);
        setAvailableMonths(result.months);
        return result.months;
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching months:", error);
      console.error("❌ Response data:", error.response?.data);
      return [];
    }
  };

  const handleMonthEndClose = async (month, year) => {
    if (!month && month !== 0) {
      // No month selected, show dropdown
      console.log("📅 Opening month selector for close...");
      const months = await fetchAvailableMonths();
      if (months.length === 0) {
        toast.error("No months with pending bills found");
        return;
      }
      setCloseOperation("close");
      setShowMonthSelector(true);
      return;
    }

    // Month selected, proceed with close
    const monthName = new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    console.log("\n🔵 ========== MONTH-END CLOSE STARTED ==========");
    console.log("📅 Selected Month:", monthName);
    console.log("📅 Month Index:", month, "(0-11)");
    console.log("📅 Year:", year);

    const confirmMsg = `⚠️ MONTH-END CLOSING FOR ${monthName.toUpperCase()} ⚠️

This will:
1. Close all pending bills from ${monthName} as "completed"
2. Transfer unpaid balances to next month
3. Create new bills with carried forward balances

Are you sure you want to proceed?`;

    if (!window.confirm(confirmMsg)) {
      console.log("❌ Month-end close cancelled by user");
      setShowMonthSelector(false);
      return;
    }

    setIsClosingMonth(true);
    const toastId = toast.loading(`Closing ${monthName}...`);

    try {
      console.log("\n🚀 [FRONTEND] Sending month-end close request...");
      console.log("📤 Payload:", { month, year });

      // Call backend API using paymentService
      const result = await paymentService.closeMonth(month, year);
      console.log("📦 [FRONTEND] Response data:", result);

      console.log("✅ [FRONTEND] Month-end close SUCCESS!");
      console.log("   📊 Bills Closed:", result.closedBills || 0);
      console.log("   📊 New Bills Created:", result.newBills || 0);
      console.log("🔄 [FRONTEND] Refreshing data...");

      toast.success(
        `✅ Month closed successfully!\n` +
          `${result.closedBills || 0} bills closed\n` +
          `${result.newBills || 0} new bills created`,
        { id: toastId, duration: 5000 },
      );
      await fetchData(pagination.page, pagination.limit);
      console.log("✅ [FRONTEND] Data refresh complete");
      console.log("🔵 ========== MONTH-END CLOSE COMPLETE ==========\n");
      setShowMonthSelector(false);
    } catch (e) {
      console.error("❌ [FRONTEND] Month-end close error:", e);
      console.error("❌ Error stack:", e.stack);
      toast.error("Failed to close month: " + e.message, { id: toastId });
    } finally {
      setIsClosingMonth(false);
      console.log("🔵 ========== MONTH-END CLOSE ENDED ==========\n");
    }
  };

  const handleMonthCloseClick = () => {
    handleMonthEndClose();
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      // If clearing manually, revert to Today
      handleTabChange("today");
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setActiveTab("custom"); // If manual date pick, deselect tabs
    }
  };

  // ✅ UPDATED: Handle Open Doc with Receipt Number from Backend
  const handleOpenDoc = (row, type) => {
    // Use receipt_no from backend directly
    const docData = {
      id: row.id, // Pass payment id for receipt number generation
      _id: row._id, // Pass MongoDB ID as fallback
      receipt_no: row.receipt_no, // Use actual receipt_no from database
      createdAt: row.createdAt,
      vehicle: row.vehicle || {},
      customer: row.customer || {},
      building: row.customer?.building || row.building,
      mall: row.mall,
      amount_paid: row.amount_paid,
      amount_charged: row.amount_charged,
      old_balance: row.old_balance,
      total_amount: row.total_amount,
      balance: row.balance,
      tip: row.tip_amount,
      payment_mode: row.payment_mode,
      status: row.status,
      settled: row.settled,
      worker: row.worker,
      service_type: "residence",
      billAmountDesc: row.createdAt
        ? (() => {
            const createdDate = new Date(row.createdAt);
            const billingDate = new Date(createdDate);
            billingDate.setMonth(billingDate.getMonth() - 1);
            const month = billingDate.toLocaleDateString("en-US", {
              month: "long",
            });
            const year = billingDate.getFullYear();
            return `For the month of ${month} ${year}`;
          })()
        : "",
    };
    setSelectedRecord(docData);
    setActiveModal(type === "Invoice" ? "invoice" : "receipt");
  };

  const handleCloseModals = () => {
    setActiveModal(null);
    setSelectedRecord(null);
  };

  const handleViewDetails = (row) => setViewPayment(row);
  const handleEdit = (row) => setEditPayment(row);
  const handleEditAmount = (row) => setEditAmountPayment(row);
  const handleViewHistory = (row) => setHistoryPayment(row);

  const handleDelete = (row) => {
    setDeletePayment(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePayment) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteResidencePayment(deletePayment._id)).unwrap();
      toast.success("Payment deleted successfully!");
      fetchData(pagination.page, pagination.limit);
      setIsDeleteModalOpen(false);
      setDeletePayment(null);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Downloading report...");
    try {
      const result = await dispatch(
        exportPayments({ search: searchTerm, ...filters }),
      ).unwrap();
      const blobData = result.blob || result;
      const blob = new Blob([blobData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `residence_payments_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download complete", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Generating PDF report...");
    try {
      // Call backend API through paymentService
      const blob = await paymentService.exportPDF({
        ...filters,
        search: searchTerm || "",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `residence_payments_${dateStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (e) {
      console.error("PDF export error:", e);
      toast.error("Failed to generate PDF: " + e.message, { id: toastId });
    }
  };

  // --- INVOICE GENERATION HANDLERS ---
  const handleOpenInvoiceModal = async () => {
    if (runningInvoice) return; // Don't open modal while generating
    // Default to current month/year
    const now = new Date();
    setInvoiceMonth(now.getMonth());
    setInvoiceYear(now.getFullYear());
    setInvoiceMode("full_subscription");
    setInvoiceCheckResult(null);
    setIsInvoiceModalOpen(true);

    // Check if invoices already exist for this month
    await checkInvoiceExists(now.getMonth(), now.getFullYear());
  };

  const checkInvoiceExists = async (month, year) => {
    setCheckingInvoice(true);
    try {
      const result = await paymentService.checkInvoice(month, year);
      setInvoiceCheckResult(result);
    } catch (error) {
      console.error("Failed to check invoice status:", error);
      setInvoiceCheckResult(null);
    } finally {
      setCheckingInvoice(false);
    }
  };

  const handleInvoiceMonthChange = async (month, year) => {
    setInvoiceMonth(month);
    setInvoiceYear(year);
    setInvoiceCheckResult(null);
    await checkInvoiceExists(month, year);
  };

  const handleConfirmInvoice = async () => {
    if (runningInvoice) return; // Prevent double-click
    setRunningInvoice(true);
    // Close modal immediately so user can't click again
    setIsInvoiceModalOpen(false);

    const billingMonth = invoiceMonth;
    const billingYear = invoiceYear;
    const billingMode = invoiceMode;

    const monthName = new Date(billingYear, billingMonth, 1).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      },
    );
    const toastId = toast.loading(`Generating invoices for ${monthName}...`);

    try {
      const result = await paymentService.runInvoice(
        billingMonth,
        billingYear,
        billingMode,
      );
      toast.success(
        `${result.invoicesCreated} invoices created for ${monthName} (${billingMode === "full_subscription" ? "Full Subscription" : "Per Wash"})`,
        { id: toastId, duration: 5000 },
      );

      // Switch date filter to show the generated invoices
      // Invoices for e.g. February are dated March 1st (1st of next month)
      const invoiceDate = new Date(billingYear, billingMonth + 1, 1);
      const invoiceDateStr = invoiceDate.toISOString().split("T")[0];
      const calendarRange = toCalendarRange(invoiceDateStr, invoiceDateStr);

      setActiveTab("custom");
      setFilters((prev) => ({
        ...prev,
        startDate: calendarRange.startDate,
        endDate: calendarRange.endDate,
      }));
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to generate invoices";
      toast.error(errorMsg, { id: toastId, duration: 5000 });
    } finally {
      setRunningInvoice(false);
    }
  };

  // --- Prepare Dropdown Options ---
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const workerOptions = useMemo(() => {
    const options = [{ value: "", label: "All Workers" }];
    if (workers && workers.length > 0) {
      workers.forEach((w) => {
        options.push({ value: w._id, label: w.name });
      });
    }
    return options;
  }, [workers]);

  // --- RENDER EXPANDED ROW ---
  const renderExpandedRow = (row) => {
    const cust = row.customer || {};
    const vehicle = row.vehicle || {};
    const detailedVehicle =
      cust.vehicles?.find((v) => v._id === vehicle._id) || vehicle;

    return (
      <div className="bg-slate-50 p-4 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Customer
            </span>
            <div className="font-bold text-slate-800">
              {cust.firstName || cust.lastName
                ? `${cust.firstName} ${cust.lastName}`
                : "Guest"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {cust.mobile || "-"}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Location
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5" />
              {row.building?.name || cust.building?.name || "-"}
            </div>
            <div className="text-xs text-slate-500 mt-1 pl-5">
              Flat: {cust.flat_no || "-"}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Vehicle Details
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Type:</span>
              <span className="font-medium text-slate-700 capitalize">
                {detailedVehicle.vehicle_type || "Sedan"}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">Parking:</span>
              <span className="font-medium text-slate-700">
                {detailedVehicle.parking_no || "-"}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Timestamps
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Created:</span>
              <span className="font-mono text-xs">
                {new Date(row.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">Updated:</span>
              <span className="font-mono text-xs">
                {new Date(row.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- COLUMNS ---
  const columns = [
    {
      key: "receipt",
      header: "Rcpt#", // Receipt Number
      accessor: "receipt_no",
      className: "w-20 text-center",
      render: (row, idx) => {
        // Only show receipt number for COMPLETED payments
        const isCompleted = (row.status || "").toLowerCase() === "completed";

        if (!isCompleted) {
          return <span className="text-slate-300 text-xs italic">Pending</span>;
        }

        // Format receipt number: prefer receipt_no, fallback to RCP{id}
        const formatReceiptNo = () => {
          if (row.receipt_no) return row.receipt_no;
          // Use numeric id field, not MongoDB _id
          if (row.id) return `RCP${String(row.id).padStart(6, "0")}`;
          return "-";
        };

        return (
          <div className="flex justify-center">
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] font-mono border border-emerald-200">
              {formatReceiptNo()}
            </span>
          </div>
        );
      },
    },
    {
      key: "billDate",
      header: "Bill Date",
      accessor: "createdAt",
      className: "w-28",
      render: (row) => {
        if (!row.createdAt) return null;
        return (
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
        );
      },
    },
    {
      key: "paidDate",
      header: "Paid Date",
      accessor: "collectedDate",
      className: "w-28",
      render: (row) => {
        if (!row.collectedDate) {
          // Check if this is an old bill (not from current month)
          const billDate = new Date(row.createdAt);
          const today = new Date();
          const billMonth = billDate.getMonth();
          const billYear = billDate.getFullYear();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();

          const isOldBill =
            billYear < currentYear ||
            (billYear === currentYear && billMonth < currentMonth);

          const hasBalance = row.balance > 0;
          const isPending = (row.status || "").toLowerCase() !== "completed";
          const hasOldBalance = (row.old_balance || 0) > 0;

          // Bill was actually carried forward from previous month (has old_balance)
          if (isOldBill && isPending && hasBalance && hasOldBalance) {
            const prevMonth = new Date(billYear, billMonth - 1, 1);
            const prevMonthName = prevMonth.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });

            return (
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                  Carried Fwd →
                </span>
                <span className="text-[9px] text-orange-400 mt-0.5">
                  from {prevMonthName}
                </span>
              </div>
            );
          }

          // Old pending bill without old_balance = just overdue
          if (isOldBill && isPending && hasBalance) {
            return (
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  ⚠️ Overdue
                </span>
                <span className="text-[9px] text-red-400 mt-0.5">
                  Not Closed
                </span>
              </div>
            );
          }

          // Current month unpaid
          return (
            <div className="flex items-center justify-center">
              <span className="text-xs text-slate-300 italic">Not Paid</span>
            </div>
          );
        }

        // Use backend-provided flag for month-end close
        const isMonthEndClosed = row.isMonthEndClosed || false;
        const amountPaid = row.amount_paid || 0;
        const totalAmount = row.total_amount || 0;
        const hasPartialPayment = amountPaid > 0;

        // Extract carried forward amount from notes (fix regex to match actual format)
        let carriedForwardAmount = 0;
        if (isMonthEndClosed && row.notes) {
          const match = row.notes.match(/Carried Forward:\s*([\d.]+)\s*AED/i);
          if (match) {
            carriedForwardAmount = parseFloat(match[1]);
          }
        }

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-sm">
              <Calendar className="w-3 h-3 text-emerald-500" />
              {new Date(row.collectedDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </div>

            {/* Show amount paid if customer paid something */}
            {hasPartialPayment && (
              <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                💰 Paid: {amountPaid} {currency}
              </span>
            )}

            {/* Show carried forward amount if month-end closed */}
            {isMonthEndClosed && carriedForwardAmount > 0 ? (
              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                🔒 Carried: {carriedForwardAmount} {currency}
              </span>
            ) : isMonthEndClosed ? (
              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                🔒 Fully Paid
              </span>
            ) : !hasPartialPayment ? (
              <span className="text-[10px] text-emerald-400 pl-4.5">
                {new Date(row.collectedDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "vehicle",
      header: "Vehicle Info",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
            {row.vehicle?.registration_no || "-"}
          </span>
          <span className="text-[10px] text-slate-400 pl-1">
            P: {row.vehicle?.parking_no || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "building",
      header: "Building",
      accessor: "building.name",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-indigo-500" />
          <span className="text-xs font-bold uppercase text-slate-600 truncate max-w-[150px]">
            {row.building?.name || row.customer?.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "subscription",
      header: "Subscription Amount",
      accessor: "amount_charged",
      className: "text-right",
      render: (row) => (
        <span className="font-medium text-slate-600 text-xs">
          {row.amount_charged}
        </span>
      ),
    },
    {
      key: "previousDue",
      header: "Previous Payment Due",
      accessor: "old_balance",
      className: "text-right",
      render: (row) => (
        <span className="text-slate-400 text-xs">{row.old_balance}</span>
      ),
    },
    {
      key: "totalDue",
      header: "Total Amount Due",
      accessor: "total_amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-indigo-600 text-sm">
          {row.total_amount}{" "}
          <span className="text-[10px] text-indigo-400">{currency}</span>
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      accessor: "amount_paid",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {row.amount_paid}{" "}
          <span className="text-[10px] text-emerald-400">{currency}</span>
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (row) => {
        const hasBalance = row.balance > 0;
        const isPending = (row.status || "").toLowerCase() !== "completed";
        const hasOldBalance = (row.old_balance || 0) > 0;

        // Only show "Carried Forward" if bill actually has old_balance (created by month-end close)
        const isActuallyCarriedForward =
          hasBalance && isPending && hasOldBalance;

        return (
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                hasBalance
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}
            >
              {row.balance}
            </span>
            {isActuallyCarriedForward && (
              <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 whitespace-nowrap">
                → Carried Forward
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "mode",
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) =>
        row.payment_mode ? (
          <span className="text-[10px] font-bold uppercase text-slate-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
            {row.payment_mode}
          </span>
        ) : null,
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.status || "").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
              s === "COMPLETED"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      key: "settle",
      header: "Settle",
      accessor: "settled",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.settled || "pending").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold uppercase ${
              s === "COMPLETED" ? "text-emerald-600" : "text-amber-500"
            }`}
          >
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
            <span
              className="text-xs font-semibold text-slate-700 whitespace-normal break-words leading-tight"
              title={row.worker?.name}
            >
              {row.worker?.name}
            </span>
          </div>
        );
      },
    },
    {
      key: "remarks",
      header: "Remarks",
      accessor: "notes",
      className: "max-w-[200px]",
      render: (row) => (
        <div className="flex items-center gap-2 group">
          <div
            className="text-xs text-slate-600 truncate flex-1"
            title={row.notes || "-"}
          >
            {row.notes || "-"}
          </div>
          <button
            onClick={() => handleViewHistory(row)}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-400 hover:text-indigo-600 transition-all shrink-0"
            title="View payment history"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: "customerNotes",
      header: "Customer Notes",
      accessor: "customer.notes",
      className: "max-w-[250px]",
      render: (row) => (
        <div className="flex items-center gap-2 group">
          <div
            className="text-xs text-slate-600 truncate flex-1"
            title={row.customer?.notes || "Click edit to add notes"}
          >
            {row.customer?.notes || "-"}
          </div>
          <button
            onClick={() =>
              setCustomerNotesModal({
                isOpen: true,
                customer: row.customer,
                notes: row.customer?.notes || "",
              })
            }
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 rounded text-blue-500 transition-all"
            title="Edit customer notes"
          >
            <StickyNote className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    // ✅ Use receipt_no from backend
    {
      key: "invoice",
      header: "Invoice",
      className: "text-center w-16",
      render: (row, idx) => {
        return (
          <button
            onClick={() => handleOpenDoc(row, "Invoice")}
            className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-1.5 rounded-lg"
            title="View Tax Invoice"
          >
            <Receipt className="w-4 h-4 mx-auto" />
          </button>
        );
      },
    },
    // ✅ Receipt only if Completed, use receipt_no from backend
    {
      key: "receiptLink",
      header: "Receipt",
      className: "text-center w-16",
      render: (row, idx) => {
        const isPaid = (row.status || "").toLowerCase() === "completed";
        if (!isPaid) return <span className="text-slate-300">-</span>;

        return (
          <button
            onClick={() => handleOpenDoc(row, "Receipt")}
            className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all p-1.5 rounded-lg"
            title="View Receipt"
          >
            <FileText className="w-4 h-4 mx-auto" />
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className:
        "text-right w-24 sticky right-4 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1 px-2">
          {pp.isActionVisible("view") && (
            <button
              onClick={() => handleViewDetails(row)}
              className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("edit") && (
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
              title="Collect Payment"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("editAmount") && (
            <button
              onClick={() => handleEditAmount(row)}
              className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
              title="Edit Amount"
            >
              <Calculator className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("delete") && (
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans flex flex-col">
      {/* INVOICE GENERATION LOADING BANNER */}
      {runningInvoice && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-bold text-sm">
            Generating invoices... Please wait, this may take a moment
          </span>
        </div>
      )}
      {/* Use flex-1 to fill height, and padding on THIS container */}
      <div className="w-full flex-1 p-2 md:p-5">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                  Residence Payments
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Monthly recurring payments & invoices
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* TAB SWITCHER */}
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

              {/* GENERATE INVOICES BUTTON */}
              {pp.isToolbarVisible("invoiceModal") && (
                <button
                  onClick={handleOpenInvoiceModal}
                  disabled={runningInvoice}
                  className={`h-10 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                    runningInvoice ? "opacity-80 cursor-wait animate-pulse" : ""
                  }`}
                >
                  {runningInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Invoices
                    </>
                  )}
                </button>
              )}

              {/* MARK ALL PAID BUTTON */}
              {pp.isToolbarVisible("bulkMarkPaid") && (
                <button
                  onClick={handleBulkMarkPaid}
                  disabled={isMarkingPaid}
                  className={`h-10 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                    isMarkingPaid ? "opacity-70 cursor-wait" : ""
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {isMarkingPaid ? "Updating..." : `Mark Status This Page Paid`}
                </button>
              )}

              {/* MONTH-END CLOSE BUTTON */}
              {pp.isToolbarVisible("monthEndClose") && (
                <button
                  onClick={handleMonthCloseClick}
                  disabled={isClosingMonth}
                  className={`h-10 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                    isClosingMonth ? "opacity-70 cursor-wait" : ""
                  }`}
                  title="Close selected month and transfer balances"
                >
                  <Calendar className="w-4 h-4" />
                  {isClosingMonth ? "Closing..." : "Month-End Close"}
                </button>
              )}

              {/* EDIT HISTORY BUTTON */}
              {pp.isToolbarVisible("editHistory") && (
                <button
                  onClick={() => navigate("/payments/edit-history")}
                  className="h-10 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Clock className="w-4 h-4" /> Edit History
                </button>
              )}

              {/* SETTLE ALL BUTTON */}
              {pp.isToolbarVisible("bulkSettle") && (
                <button
                  onClick={handleBulkSettle}
                  disabled={isSettling}
                  className={`h-10 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                    isSettling ? "opacity-70 cursor-wait" : ""
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSettling
                    ? "Settling..."
                    : `Mark Settle This Page Payments `}
                </button>
              )}

              {pp.isToolbarVisible("exportExcel") && (
                <button
                  onClick={handleExport}
                  className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              )}

              {/* PDF EXPORT BUTTON */}
              {pp.isToolbarVisible("exportPdf") && (
                <button
                  onClick={handleExportPDF}
                  className="h-10 px-4 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <FileText className="w-4 h-4" /> Export PDF
                </button>
              )}

              <button
                onClick={() =>
                  navigate("/pending-payments/employee-wise?type=residence")
                }
                className="h-10 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Users className="w-4 h-4" /> Employee Wise
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col justify-center">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold text-indigo-700">
                {stats.totalAmount || 0}{" "}
                <span className="text-sm font-normal text-indigo-400">
                  {currency}
                </span>
              </h3>
            </div>
            {/* ... Other stats (Cash, Card, Bank) ... */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Cash
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {stats.cash || 0}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Card
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {stats.card || 0}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Bank
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {stats.bank || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 mb-6">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            <div className="w-full xl:w-auto min-w-[280px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                Date Range
              </label>
              <RichDateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={handleDateChange}
              />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {/* Building Dropdown */}
              {pp.isToolbarVisible("buildingFilter") && (
                <div>
                  <CustomDropdown
                    label="Building"
                    value={filters.building}
                    onChange={(val) =>
                      setFilters({ ...filters, building: val })
                    }
                    options={[
                      { value: "", label: "All Buildings" },
                      ...buildings.map((b) => ({
                        value: b._id,
                        label: b.name,
                      })),
                    ]}
                    icon={Building2}
                    placeholder="All Buildings"
                    searchable={true}
                  />
                </div>
              )}

              {/* Payment Status Dropdown (CustomDropdown) */}
              {pp.isToolbarVisible("statusFilter") && (
                <div>
                  <CustomDropdown
                    label="Payment Status"
                    value={filters.status}
                    onChange={(val) => setFilters({ ...filters, status: val })}
                    options={statusOptions}
                    icon={Filter}
                    placeholder="All Status"
                  />
                </div>
              )}

              {/* Payment Mode Dropdown */}
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

              {/* Assigned Worker Dropdown (CustomDropdown) */}
              {pp.isToolbarVisible("workerFilter") && (
                <div>
                  <CustomDropdown
                    label="Assigned Worker"
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

            {pp.isToolbarVisible("search") && (
              <div className="w-full xl:w-64 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search All Columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
          <DataTable
            columns={pp.filterColumns(columns)}
            data={filteredPayments}
            loading={loading}
            pagination={pagination}
            onPageChange={(p) => fetchData(p, pagination.limit)}
            onLimitChange={(l) => fetchData(1, l)}
            renderExpandedRow={renderExpandedRow}
            hideSearch={true}
          />
        </div>

        {/* --- MODALS --- */}
        <ResidenceReceiptModal
          isOpen={!!selectedRecord && activeModal === "invoice"}
          onClose={handleCloseModals}
          data={selectedRecord}
          type="Invoice"
        />
        <ReceiptModal
          isOpen={!!selectedRecord && activeModal === "receipt"}
          onClose={handleCloseModals}
          data={selectedRecord}
        />
        <ViewPaymentModal
          isOpen={!!viewPayment}
          onClose={() => setViewPayment(null)}
          payment={viewPayment}
        />
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletePayment(null);
          }}
          onConfirm={confirmDelete}
          loading={isDeleting}
          title="Delete Payment?"
          message={`Are you sure you want to delete the payment?`}
        />
        <PaymentModal
          isOpen={!!editPayment}
          onClose={() => setEditPayment(null)}
          payment={editPayment}
          onSuccess={() => {
            fetchData(pagination.page, pagination.limit);
            setEditPayment(null);
          }}
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

        {/* Payment History Modal */}
        <PaymentHistoryModal
          isOpen={!!historyPayment}
          onClose={() => setHistoryPayment(null)}
          payment={historyPayment}
        />
      </div>

      {/* MONTH SELECTOR MODAL */}
      {showMonthSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                🔒 Month-End Closing
              </h3>
              <p className="text-slate-600">
                Select a month to close all pending bills and carry forward
                unpaid balances
              </p>
            </div>

            {availableMonths.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-slate-800 mb-2">
                  All Clear!
                </p>
                <p className="text-slate-500 mb-6">
                  No months with pending bills found
                </p>
                <button
                  onClick={() => setShowMonthSelector(false)}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-slate-600 mb-1">Total Months</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {availableMonths.length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-sm text-slate-600 mb-1">
                      Total Pending Bills
                    </p>
                    <p className="text-3xl font-bold text-orange-700">
                      {availableMonths.reduce((sum, m) => sum + m.count, 0)}
                    </p>
                  </div>
                </div>

                {/* Month Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {availableMonths.map((monthData) => {
                    const monthName = new Date(
                      monthData.year,
                      monthData.month,
                      1,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                    const isClosed =
                      monthData.isClosed || monthData.pending === 0;
                    return (
                      <button
                        key={`${monthData.year}-${monthData.month}`}
                        onClick={() => {
                          if (isClosed && closeOperation === "close") {
                            toast.info(`${monthName} is already closed`);
                            return;
                          }
                          console.log(`✅ Selected month:`, monthName);
                          setSelectedMonthForClose({
                            month: monthData.month,
                            year: monthData.year,
                          });
                          if (closeOperation === "close") {
                            handleMonthEndClose(
                              monthData.month,
                              monthData.year,
                            );
                          } else {
                            handleRevertMonthClose(
                              monthData.month,
                              monthData.year,
                            );
                          }
                        }}
                        disabled={isClosed && closeOperation === "close"}
                        className={`group p-6 rounded-xl border-2 transition-all text-left ${
                          isClosed
                            ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-300 opacity-75 cursor-not-allowed"
                            : "bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 hover:from-indigo-100 hover:via-blue-100 hover:to-purple-100 border-indigo-200 hover:border-indigo-400 hover:shadow-lg"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`text-lg font-bold group-hover:scale-105 transition-colors ${
                                  isClosed
                                    ? "text-green-700"
                                    : "text-slate-800 group-hover:text-indigo-700"
                                }`}
                              >
                                {monthName}
                              </p>
                              {isClosed && (
                                <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-bold rounded-full">
                                  CLOSED
                                </span>
                              )}
                            </div>
                          </div>
                          {isClosed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Calendar className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-slate-600">
                              {isClosed ? "Total Bills" : "Pending Bills"}
                            </span>
                            <span
                              className={`text-lg font-bold ${
                                isClosed ? "text-green-700" : "text-indigo-700"
                              }`}
                            >
                              {monthData.pending || monthData.count}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-slate-600">
                              Total Balance
                            </span>
                            <span className="text-lg font-bold text-orange-600">
                              {currency}{" "}
                              {monthData.totalBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowMonthSelector(false)}
                  className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customer Notes Modal */}
      {customerNotesModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-blue-500" />
                Customer Notes
              </h3>
              <button
                onClick={() =>
                  setCustomerNotesModal({
                    isOpen: false,
                    customer: null,
                    notes: "",
                  })
                }
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-slate-600 mb-3">
                  <div className="font-semibold">
                    {customerNotesModal.customer?.firstName}{" "}
                    {customerNotesModal.customer?.lastName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {customerNotesModal.customer?.building?.name} - Flat{" "}
                    {customerNotesModal.customer?.flat_no}
                  </div>
                </div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Notes / Remarks
                </label>
                <textarea
                  value={customerNotesModal.notes}
                  onChange={(e) =>
                    setCustomerNotesModal((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                  placeholder="e.g., NO WASHES FOR OCT AND NOV, STOPPED LAST WASHED ON 24-10-2025, etc."
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
              <button
                onClick={() =>
                  setCustomerNotesModal({
                    isOpen: false,
                    customer: null,
                    notes: "",
                  })
                }
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-100"
                disabled={savingNotes}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSavingNotes(true);
                  try {
                    await customerService.update(
                      customerNotesModal.customer._id,
                      {
                        notes: customerNotesModal.notes.trim(),
                      },
                    );
                    toast.success("Customer notes updated successfully");
                    setCustomerNotesModal({
                      isOpen: false,
                      customer: null,
                      notes: "",
                    });
                    fetchData(pagination.page, pagination.limit);
                  } catch (error) {
                    toast.error(
                      error.response?.data?.message || "Failed to update notes",
                    );
                  } finally {
                    setSavingNotes(false);
                  }
                }}
                disabled={savingNotes}
                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {savingNotes && <Clock className="w-4 h-4 animate-spin" />}
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE GENERATION MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-600" />
                Generate Monthly Invoices
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Create payment invoices for all active residence vehicles
              </p>
            </div>

            {/* MODE TOGGLE */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Invoice Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInvoiceMode("full_subscription")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    invoiceMode === "full_subscription"
                      ? "border-indigo-500 bg-indigo-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet
                      className={`w-4 h-4 ${invoiceMode === "full_subscription" ? "text-indigo-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-bold ${invoiceMode === "full_subscription" ? "text-indigo-700" : "text-slate-600"}`}
                    >
                      Full Subscription
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Charge full monthly amount for all active vehicles
                  </p>
                </button>
                <button
                  onClick={() => setInvoiceMode("per_wash")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    invoiceMode === "per_wash"
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator
                      className={`w-4 h-4 ${invoiceMode === "per_wash" ? "text-emerald-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-bold ${invoiceMode === "per_wash" ? "text-emerald-700" : "text-slate-600"}`}
                    >
                      Per Completed Wash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Charge only for washes actually completed
                  </p>
                </button>
              </div>
            </div>

            {/* MONTH/YEAR SELECTOR */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Month
                </label>
                <select
                  value={invoiceMonth}
                  onChange={(e) =>
                    handleInvoiceMonthChange(
                      parseInt(e.target.value),
                      invoiceYear,
                    )
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2024, i, 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Year
                </label>
                <select
                  value={invoiceYear}
                  onChange={(e) =>
                    handleInvoiceMonthChange(
                      invoiceMonth,
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - 1 + i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* STATUS CHECK */}
            {checkingInvoice ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm p-3 bg-slate-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking existing invoices...
              </div>
            ) : invoiceCheckResult?.exists ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Invoices Already Generated
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {invoiceCheckResult.count} invoices already exist for{" "}
                  {invoiceCheckResult.month}. Cannot generate duplicates.
                </p>
              </div>
            ) : invoiceCheckResult && !invoiceCheckResult.exists ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to Generate
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  No invoices exist for {invoiceCheckResult.month}. You can
                  proceed.
                </p>
              </div>
            ) : null}

            {/* WARNING */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Important:</strong> Once invoices are generated for a
                month, they <strong>cannot be generated again</strong> — not
                through this button, not through cron. Make sure you select the
                correct mode and month before proceeding.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                <strong>📅 Invoice Date:</strong> Invoices for{" "}
                {new Date(invoiceYear, invoiceMonth, 1).toLocaleString(
                  "default",
                  { month: "long", year: "numeric" },
                )}{" "}
                will be dated{" "}
                <strong>
                  {new Date(invoiceYear, invoiceMonth + 1, 1).toLocaleString(
                    "default",
                    { month: "long", day: "numeric", year: "numeric" },
                  )}
                </strong>{" "}
                (1st of next month).
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                disabled={runningInvoice}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInvoice}
                disabled={
                  runningInvoice ||
                  checkingInvoice ||
                  invoiceCheckResult?.exists
                }
                className={`flex-1 px-4 py-2.5 ${
                  invoiceMode === "full_subscription"
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                    : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                } text-white rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {runningInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Generate Invoices
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidencePayments;
