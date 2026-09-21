import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UserPlus,
  Trash2,
  Archive,
  Edit2,
  Download,
  UploadCloud,
  Loader2,
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  Hash,
  Calendar,
  Building,
  Home,
  Phone,
  X,
  History,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

// Components
import DataTable from "../../components/DataTable";
import CustomerModal from "../../components/modals/CustomerModal";
import BlockedDeactivationModal from "../../components/modals/customers/BlockedDeactivationModal";
import DeactivationReasonModal from "../../components/modals/customers/DeactivationReasonModal";
import ReactivationDateModal from "../../components/modals/customers/ReactivationDateModal";
import CustomDropdown from "../../components/ui/CustomDropdown";

// API
import { customerService } from "../../api/customerService";
import { workerService } from "../../api/workerService";
import { buildingService } from "../../api/buildingService";
import api from "../../api/axiosInstance";
import usePagePermissions from "../../utils/usePagePermissions";
import AccessRequestModal from "../../components/AccessRequestModal";

const Customers = () => {
  const formatMobileWithCountry = (mobile) => {
    const raw = String(mobile || "").trim();
    if (!raw) return "-";

    // Legacy local auto format had one extra zero: 2000000xxx.
    // Display both old/new formats in unified UAE style (+971200000xxx).
    if (/^2000000\d{3}$/.test(raw)) return `+971200000${raw.slice(7)}`;
    if (/^200000\d{3,}$/.test(raw)) return `+971${raw}`;

    // Keep full international numbers readable with explicit + prefix.
    if (raw.startsWith("971")) return `+${raw}`;

    // Normalize UAE local formats for display only.
    if (/^05\d{8}$/.test(raw)) return `+971${raw.slice(1)}`;
    if (/^5\d{8}$/.test(raw)) return `+971${raw}`;

    return raw.startsWith("+") ? raw : `+${raw}`;
  };

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pp = usePagePermissions("customers");

  const [accessModal, setAccessModal] = useState({
    isOpen: false,
    elementType: "",
    elementKey: "",
    elementLabel: "",
  });

  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [serverData, setServerData] = useState([]);

  // Blocked Deactivation Modal (shows when deactivation blocked due to pending payments)
  const [blockedDeactivationModal, setBlockedDeactivationModal] = useState({
    isOpen: false,
    payments: [],
    totalDue: 0,
    customerName: "",
    type: "customer",
  });

  // Deactivation Modal
  const [deactivationModal, setDeactivationModal] = useState({
    isOpen: false,
    type: "", // "customer" or "vehicle"
    entityId: "",
    entityName: "",
    customerId: "",
  });

  // Reactivation Modal
  const [reactivationModal, setReactivationModal] = useState({
    isOpen: false,
    type: "", // "customer" or "vehicle"
    entityId: "",
    entityName: "",
    customerId: "",
  });

  // Filters
  const [activeTab, setActiveTab] = useState(1); // Customer status filter
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("all"); // all, active, inactive
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("__ANY_WORKER__"); // Worker filter - __ANY_WORKER__ means show ALL customers
  const [selectedBuilding, setSelectedBuilding] = useState(""); // Building filter - empty string means show ALL customers

  // Dropdown data
  const [workers, setWorkers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filtersDataLoaded, setFiltersDataLoaded] = useState(false); // Track if filters data is loaded

  // ⚡ Fast filter counts from backend (no need to load all customers)
  const [workerCountsState, setWorkerCountsState] = useState({});
  const [buildingCountsState, setBuildingCountsState] = useState({});
  const [totalWorkersCount, setTotalWorkersCount] = useState(0);
  const [totalBuildingsCount, setTotalBuildingsCount] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showImportResults, setShowImportResults] = useState(false);

  // --- Fetch Workers and Buildings for Filters ---
  useEffect(() => {
    const fetchFiltersData = async () => {
      setLoadingFilters(true);
      try {
        // Fetch workers, buildings, and filter counts independently
        // so a permission error on one doesn't block the others
        const [workersRes, buildingsRes, countsRes] = await Promise.allSettled([
          workerService.list(1, 1000, "", 1),
          buildingService.list(1, 1000, ""),
          api.get("/customers/filter-counts"),
        ]);

        // Workers (may fail if user lacks workers.view permission)
        if (workersRes.status === "fulfilled") {
          setWorkers(workersRes.value?.data || []);
        }

        // Buildings
        if (buildingsRes.status === "fulfilled") {
          setBuildings(buildingsRes.value?.data || []);
        }

        // Filter counts
        if (countsRes.status === "fulfilled" && countsRes.value?.data?.data) {
          const {
            workerCounts,
            buildingCounts,
            totalCustomersWithWorkers,
            totalCustomersWithBuildings,
          } = countsRes.value.data.data;

          setWorkerCountsState(workerCounts || {});
          setBuildingCountsState(buildingCounts || {});
          setTotalWorkersCount(totalCustomersWithWorkers || 0);
          setTotalBuildingsCount(totalCustomersWithBuildings || 0);
        }

        setFiltersDataLoaded(true);
      } catch (error) {
        console.error("Error fetching filter data:", error);
        setFiltersDataLoaded(true);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFiltersData();
  }, []);

  // --- Fetch Data ---
  const fetchData = async (
    page = 1,
    limit = 100,
    search = "",
    status = 1,
    worker = "",
    building = "",
    vehicleStatus = vehicleStatusFilter,
  ) => {
    setLoading(true);
    try {
      // ✅ FIX: Trim search term to ignore trailing spaces (e.g., "John " becomes "John")
      const cleanSearch = typeof search === "string" ? search.trim() : search;

      const params = {
        pageNo: page - 1,
        pageSize: limit,
        search: cleanSearch,
        status,
      };

      // Add worker and building filters if selected
      if (worker) {
        params.worker = worker;
      }
      if (building) {
        params.building = building;
      }

      // Keep vehicle status filtering server-side so pagination totals stay accurate.
      if (vehicleStatus === "active") {
        params.vehicleStatus = 1;
      } else if (vehicleStatus === "inactive") {
        params.vehicleStatus = 2;
      }

      console.log("📡 [CUSTOMERS PAGE] Fetching with params:", params);
      const res = await api.get("/customers", { params });

      console.log(
        "\n💾 [CUSTOMERS PAGE] Fetched data:",
        res.data?.data?.length,
        "customers",
      );
      console.log("📊 [CUSTOMERS PAGE] Sample customer data:");

      // Log first 3 customers with their pending dues
      if (res.data?.data && res.data.data.length > 0) {
        res.data.data.slice(0, 3).forEach((customer, idx) => {
          console.log(`\n  Customer ${idx + 1}:`, {
            id: customer._id,
            name: `${customer.firstName} ${customer.lastName}`,
            mobile: customer.mobile,
            pendingDues: customer.pendingDues,
            pendingCount: customer.pendingCount,
            vehicles: customer.vehicles?.length || 0,
          });
        });
      }

      setServerData(res.data?.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.data?.total || 0,
        totalPages: Math.ceil((res.data?.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      console.error("❌ [CUSTOMERS PAGE] Error:", e);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // --- Unified Effect for Fetching ---
  useEffect(() => {
    // Only debounce for search term, fetch immediately for other filters
    const shouldDebounce = searchTerm.length > 0;
    const delay = shouldDebounce ? 300 : 0; // Reduced from 500ms to 300ms

    const delayDebounceFn = setTimeout(() => {
      fetchData(
        1,
        pagination.limit,
        searchTerm,
        activeTab,
        selectedWorker,
        selectedBuilding,
        vehicleStatusFilter,
      );
    }, delay);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    searchTerm,
    selectedWorker,
    selectedBuilding,
    vehicleStatusFilter,
  ]);

  // ⚡ Filter counts are now loaded from backend, no expensive calculations needed!
  // Just use the state values directly
  const buildingCounts = buildingCountsState;
  const totalCustomersWithWorkers = totalWorkersCount;
  const totalCustomersWithBuildings = totalBuildingsCount;

  // ✅ Calculate VEHICLE counts per worker (not customer counts)
  const workerVehicleCounts = useMemo(() => {
    const counts = {};
    let totalVehicles = 0;

    serverData.forEach((customer) => {
      customer.vehicles?.forEach((vehicle) => {
        if (vehicle.worker) {
          const workerId =
            typeof vehicle.worker === "object"
              ? vehicle.worker._id
              : vehicle.worker;
          counts[workerId] = (counts[workerId] || 0) + 1;
          totalVehicles++;
        }
      });
    });

    return { counts, totalVehicles };
  }, [serverData]);

  // --- Flatten Data & Search Logic ---
  const flattenedData = useMemo(() => {
    if (!serverData) return [];

    // 1. Group by Customer (ONE row per customer with combined vehicle data)
    const rows = [];
    serverData.forEach((customer) => {
      // Apply vehicle status filter
      let filteredVehicles = customer.vehicles || [];
      if (vehicleStatusFilter === "active") {
        filteredVehicles = filteredVehicles.filter((v) => v.status === 1);
      } else if (vehicleStatusFilter === "inactive") {
        filteredVehicles = filteredVehicles.filter((v) => v.status === 2);
      }

      // Skip customer if no vehicles match filter
      if (filteredVehicles.length === 0 && vehicleStatusFilter !== "all") {
        return;
      }

      // Combine all vehicle data into comma-separated strings
      const vehicleNos = filteredVehicles
        .map((v) => v.registration_no || "")
        .join(", ");
      const parkingNos = filteredVehicles
        .map((v) => v.parking_no || "-")
        .join(", ");

      rows.push({
        customer: customer,
        uniqueId: customer._id,
        vehicleCount: filteredVehicles.length,
        vehicles: filteredVehicles,
        registration_no: vehicleNos || "NO VEHICLE",
        parking_no: parkingNos,
      });
    });
    return rows;
  }, [serverData, vehicleStatusFilter]);

  // --- Handlers ---
  const handleTabChange = (status) => {
    setActiveTab(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customerData) => {
    const fullCustomer = serverData.find((c) => c._id === customerData._id);
    setSelectedCustomer(fullCustomer || customerData);
    setIsModalOpen(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Delete this customer? This removes all vehicles."))
      return;
    try {
      await customerService.delete(customerId);
      toast.success("Deleted");
      fetchData(
        pagination.page,
        pagination.limit,
        searchTerm,
        activeTab,
        selectedWorker,
        selectedBuilding,
      );
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleArchive = async (customerId) => {
    if (!window.confirm("Archive this customer?")) return;
    try {
      await customerService.archive(customerId);
      toast.success("Archived");
      fetchData(
        pagination.page,
        pagination.limit,
        searchTerm,
        activeTab,
        selectedWorker,
        selectedBuilding,
      );
    } catch (e) {
      toast.error("Archive failed");
    }
  };

  const handleToggleCustomerStatus = async (customer) => {
    const newStatus = customer.status === 1 ? 2 : 1;
    const customerName =
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      "Customer";

    // If activating, show reactivation date modal
    if (newStatus === 1) {
      setReactivationModal({
        isOpen: true,
        type: "customer",
        entityId: customer._id,
        entityName: customerName,
        customerId: customer._id,
      });
      return;
    }

    // If deactivating, check pending dues from customer data
    const pendingDues = customer.pendingDues || 0;
    const pendingCount = customer.pendingCount || 0;

    // If there are pending dues, block and show modal with payment details
    if (pendingDues > 0 && pendingCount > 0) {
      toast.error(
        `Cannot deactivate: Customer has AED ${pendingDues.toFixed(2)} pending dues across ${pendingCount} transaction(s).`,
        { duration: 4000 },
      );

      // Try to deactivate to get full payment details from backend
      try {
        await customerService.deactivateCustomer(customer._id, {
          deactivateReason: "Stopped",
          deactivateDate: new Date().toISOString(),
        });
      } catch (e) {
        if (e.response?.data?.code === "PENDING_DUES") {
          const payments = e.response.data.payments || [];
          setBlockedDeactivationModal({
            isOpen: true,
            payments: payments,
            totalDue: pendingDues,
            customerName: customerName,
            type: "customer",
          });
        }
      }
      return;
    }

    // No pending dues, show deactivation modal
    setDeactivationModal({
      isOpen: true,
      type: "customer",
      entityId: customer._id,
      entityName: customerName,
      customerId: customer._id,
    });
  };

  const handleToggleVehicleStatus = async (vehicle, customer) => {
    const newStatus = vehicle.status === 1 ? 2 : 1;
    const customerName =
      `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
      "Customer";
    const vehicleInfo = vehicle.registration_no || "Vehicle";

    // If activating, show reactivation date modal
    if (newStatus === 1) {
      setReactivationModal({
        isOpen: true,
        type: "vehicle",
        entityId: vehicle._id,
        entityName: vehicleInfo,
        customerId: customer._id,
      });
      return;
    }

    // If deactivating, check for vehicle-specific pending dues first
    const checkingToast = toast.loading("Checking vehicle pending payments...");
    try {
      const duesResponse = await customerService.checkVehiclePendingDues(
        vehicle._id,
      );
      const duesCheck = duesResponse.data;

      toast.dismiss(checkingToast);

      if (duesCheck.hasPendingDues && duesCheck.totalDue > 0) {
        // Vehicle has pending dues, show modal with payment details
        toast.error(
          `Cannot deactivate: Vehicle ${vehicleInfo} has AED ${duesCheck.totalDue.toFixed(2)} pending dues across ${duesCheck.pendingCount} transaction(s).`,
          { duration: 4000 },
        );

        setBlockedDeactivationModal({
          isOpen: true,
          payments: duesCheck.payments || [],
          totalDue: duesCheck.totalDue,
          customerName: `${customerName} - ${vehicleInfo}`,
          type: "vehicle",
        });
        return;
      }

      // No pending dues, show deactivation modal
      setDeactivationModal({
        isOpen: true,
        type: "vehicle",
        entityId: vehicle._id,
        entityName: vehicleInfo,
        customerId: customer._id,
        customerName: customerName,
      });
    } catch (e) {
      toast.dismiss(checkingToast);
      console.error("Error checking vehicle pending dues:", e);
      toast.error("Failed to check pending payments");
    }
  };

  // --- DEACTIVATION CONFIRM HANDLER ---
  const handleDeactivationConfirm = async (deactivationData) => {
    const { type, entityId, entityName, customerId, customerName } =
      deactivationModal;
    const loadingToast = toast.loading(`Deactivating ${type}...`);

    try {
      if (type === "customer") {
        // Deactivate customer with dates and reason
        await customerService.deactivateCustomer(entityId, deactivationData);
        toast.success(`Customer ${entityName} deactivated successfully`, {
          id: loadingToast,
        });
      } else if (type === "vehicle") {
        // Deactivate vehicle with dates and reason
        await customerService.deactivateVehicle(entityId, deactivationData);
        toast.success(`Vehicle ${entityName} deactivated successfully`, {
          id: loadingToast,
        });
      }

      // Close modal and refresh data
      setDeactivationModal({
        isOpen: false,
        type: "",
        entityId: "",
        entityName: "",
        customerId: "",
      });
      fetchData(
        pagination.page,
        pagination.limit,
        searchTerm,
        activeTab,
        selectedWorker,
        selectedBuilding,
      );
    } catch (e) {
      console.error("Deactivation error:", e);

      // Handle pending dues error
      if (e.response?.data?.code === "PENDING_DUES") {
        const totalDue = e.response.data.totalDue || 0;
        const pendingCount = e.response.data.pendingCount || 0;
        const payments = e.response.data.payments || [];

        toast.error(
          `Cannot deactivate: ${totalDue > 0 ? `AED ${totalDue.toFixed(2)} pending dues across ${pendingCount} transaction(s)` : "Pending payments exist"}.`,
          { id: loadingToast, duration: 4000 },
        );

        // Show blocked deactivation modal
        setBlockedDeactivationModal({
          isOpen: true,
          payments: payments,
          totalDue: totalDue,
          customerName:
            type === "customer"
              ? entityName
              : `${customerName} - ${entityName}`,
          type: type,
        });

        // Close deactivation modal
        setDeactivationModal({
          isOpen: false,
          type: "",
          entityId: "",
          entityName: "",
          customerId: "",
        });
      } else {
        toast.error(`Failed to deactivate ${type}`, { id: loadingToast });
      }
    }
  };

  // --- REACTIVATION CONFIRMATION HANDLER ---
  const handleReactivationConfirm = async (formData) => {
    const { type, entityId, customerId } = reactivationModal;
    const loadingToast = toast.loading(`Reactivating ${type}...`);

    try {
      if (type === "customer") {
        // Reactivate customer with restart date
        await customerService.activateCustomer(entityId, {
          restart_date: formData.reactivateDate,
        });
        toast.success(`Customer reactivated successfully!`, {
          id: loadingToast,
        });
      } else if (type === "vehicle") {
        // Reactivate vehicle with restart date
        await customerService.toggleVehicle(
          entityId,
          2,
          "",
          formData.reactivateDate,
        );
        toast.success(`Vehicle reactivated successfully!`, {
          id: loadingToast,
        });
      }

      // Refresh data
      fetchData(
        pagination.page,
        pagination.limit,
        searchTerm,
        activeTab,
        selectedWorker,
        selectedBuilding,
      );

      // Close modal
      setReactivationModal({
        isOpen: false,
        type: "",
        entityId: "",
        entityName: "",
        customerId: "",
      });
    } catch (e) {
      console.error("Reactivation error:", e);
      toast.error(`Failed to reactivate ${type}`, { id: loadingToast });
    }
  };

  // --- EXPORT HANDLER ---
  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Downloading file...");
    try {
      const response = await api.get("/customers/export/list", {
        params: { status: activeTab, search: searchTerm },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `Customers_Export_${
        activeTab === 1 ? "Active" : "Inactive"
      }_${dateStr}.xlsx`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download complete!", { id: toastId });
    } catch (e) {
      console.error("Export Error:", e);
      toast.error("Export failed. Check console.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // --- DOWNLOAD TEMPLATE ---
  const handleDownloadTemplate = async () => {
    const toastId = toast.loading("Downloading template...");
    try {
      const blob = await customerService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "customers-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded!", { id: toastId });
    } catch (error) {
      console.error("Template download error:", error);
      toast.error("Failed to download template", { id: toastId });
    }
  };

  // --- IMPORT HANDLERS ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImportLoading(true);
    const toastId = toast.loading("Uploading and processing...");

    try {
      const res = await customerService.importData(formData);

      if (res.success || res.statusCode === 200) {
        const summary = res.data || res;

        // Store results for modal
        setImportResults(summary);
        setShowImportResults(true);

        toast.success(
          `Import complete! ${summary.success} records processed.`,
          {
            id: toastId,
            duration: 5000,
          },
        );

        if (summary.errors && summary.errors.length > 0) {
          console.error("Import Errors:", summary.errors);
        }

        fetchData(
          1,
          pagination.limit,
          searchTerm,
          activeTab,
          selectedWorker,
          selectedBuilding,
          vehicleStatusFilter,
        );
      } else {
        toast.error(res.message || "Import failed", { id: toastId });
      }
    } catch (error) {
      console.error("Import Error:", error);
      toast.error("Import failed. Check file format.", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const formatDateForTable = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const renderExpandedRow = (row) => {
    const c = row.customer;
    const vehicles = row.vehicles || [];

    return (
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 pb-3 border-b border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
              {c.firstName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">
                {c.firstName} {c.lastName}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono bg-slate-200 px-2 py-0.5 rounded">
                  ID: {c._id}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {c.customerCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 md:mt-0 flex items-center gap-3">
            <button
              onClick={() => navigate(`/customers/${c._id}/history`)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Show History
            </button>
            <button
              onClick={() => navigate(`/customers/${c._id}/soa`)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Show SOA
            </button>
          </div>
        </div>

        {/* Display each vehicle in its own box */}
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <span className="text-sm italic">No vehicles found</span>
            </div>
          ) : (
            vehicles.map((vehicle, idx) => {
              const workerName = vehicle.worker?.name || "UNASSIGNED";
              const schedule =
                vehicle.schedule_days && vehicle.schedule_days.length > 0
                  ? vehicle.schedule_days
                      .map((d) => (typeof d === "object" ? d.day : d))
                      .join(", ")
                  : vehicle.schedule_type === "weekly"
                    ? "Weekly"
                    : vehicle.schedule_type || "-";

              return (
                <div
                  key={vehicle._id || idx}
                  className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-md"
                >
                  {/* Vehicle Deactivation Info - Show if vehicle is inactive */}
                  {vehicle.status === 2 && vehicle.deactivateReason && (
                    <div className="p-4 bg-amber-50 border-b-2 border-amber-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                          <span className="text-amber-700 font-bold text-sm">
                            !
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-amber-800 text-sm mb-2">
                            🚗 Vehicle Deactivated
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-amber-700">
                                Deactivated:
                              </span>
                              <span className="text-slate-700">
                                {vehicle.deactivateDate
                                  ? new Date(
                                      vehicle.deactivateDate,
                                    ).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </div>
                            {vehicle.reactivateDate && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-amber-700">
                                  Expected Reactivation:
                                </span>
                                <span className="text-blue-600 font-medium">
                                  {new Date(
                                    vehicle.reactivateDate,
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-amber-200">
                              <span className="font-semibold text-amber-700">
                                Reason:
                              </span>
                              <p className="text-slate-700 italic mt-1">
                                {vehicle.deactivateReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700 font-bold border-b-2 border-gray-300">
                        <tr>
                          <th className="px-6 py-3 min-w-[100px]">Vehicle</th>
                          <th className="px-6 py-3 min-w-[120px]">Schedule</th>
                          <th className="px-6 py-3 min-w-[100px]">Amount</th>
                          <th className="px-6 py-3 min-w-[100px]">Advance</th>
                          <th className="px-6 py-3 min-w-[120px]">
                            Onboard Date
                          </th>
                          <th className="px-6 py-3 min-w-[120px]">
                            Start Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800 text-base">
                            {vehicle.registration_no || "-"}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {schedule}
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-semibold">
                            {vehicle.amount || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {vehicle.advance_amount || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {formatDateForTable(
                              vehicle.onboard_date || vehicle.start_date,
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {formatDateForTable(vehicle.start_date) || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-100 border-t-2 border-gray-300 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Cleaner:
                      </span>
                      <span className="text-slate-700 text-sm font-semibold uppercase">
                        {workerName}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!vehicle?._id) return;
                        navigate(
                          `/customers/${c._id}/soa?vehicleId=${vehicle._id}`,
                        );
                      }}
                      disabled={!vehicle?._id}
                      className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Vehicle SOA
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const columns = [
    // ✅ COMBINED COLUMN (Name Top, Mobile Bottom)
    {
      key: "name",
      header: "Customer",
      accessor: "customer.mobile",
      className: "min-w-[200px]",
      render: (row) => {
        const vehicleCount = row.customer?.vehicles?.length || 0;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md text-white font-bold text-xs">
              {row.customer?.firstName?.[0] || "C"}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {row.customer?.firstName} {row.customer?.lastName}
                {vehicleCount > 0 && (
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                    {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"}
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3" />{" "}
                {formatMobileWithCountry(row.customer?.mobile)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "vehicleInfo",
      header: "Vehicle Info",
      accessor: "registration_no",
      className: "min-w-[120px]",
      render: (row) => {
        const vehicleNumbers = row.registration_no.split(", ");
        return (
          <div className="flex flex-wrap gap-1">
            {vehicleNumbers.map((vehicle, idx) => (
              <span
                key={idx}
                className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-slate-700 border border-slate-200 shadow-sm"
              >
                {vehicle}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "parkingNo",
      header: "Parking No",
      accessor: "parking_no",
      className: "min-w-[100px]",
      render: (row) => {
        const parkingNumbers = row.parking_no.split(", ");
        return (
          <div className="flex flex-col gap-0.5">
            {parkingNumbers.map((parking, idx) => (
              <span key={idx} className="text-xs font-medium text-slate-600">
                {parking}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "building",
      header: "Building",
      accessor: "customer.building",
      className: "min-w-[150px]",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-indigo-500" />
          <span
            className="text-slate-800 font-semibold text-xs truncate max-w-[140px]"
            title={row.customer.building?.name}
          >
            {row.customer.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "flatNo",
      header: "Flat No",
      accessor: "customer.flat_no",
      className: "min-w-[80px]",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">
            {row.customer.flat_no || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      accessor: "vehicles",
      className: "min-w-[180px]",
      render: (row) => {
        if (!row.vehicles || row.vehicles.length === 0) {
          return (
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 italic">No Vehicle</span>
            </div>
          );
        }

        // Show payment status for each vehicle
        return (
          <div className="flex flex-col gap-2">
            {row.vehicles.map((vehicle, idx) => {
              const pendingDues = vehicle.pendingDues || 0;
              const pendingCount = vehicle.pendingCount || 0;
              const lastPayment = vehicle.lastPayment;

              return (
                <div
                  key={vehicle._id || idx}
                  className="flex items-center gap-2 justify-between"
                >
                  <span className="text-[10px] text-slate-500 font-mono w-16 truncate text-left">
                    {vehicle.registration_no}
                  </span>
                  {pendingDues === 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      {lastPayment ? (
                        <>
                          <span
                            className={`text-xs font-bold ${
                              lastPayment.paymentMethod === "monthly_close"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          >
                            {lastPayment.paymentMethod === "monthly_close"
                              ? "Monthly Close"
                              : "Paid by Customer"}
                          </span>
                          <span className="text-[10px] text-slate-600 font-semibold">
                            AED {lastPayment.amount.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No payment
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-red-600">
                        AED {pendingDues.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {pendingCount} pending
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "customerStatus",
      header: "Customer",
      accessor: "customer.status",
      className: "min-w-[120px] text-center",
      render: (row) => (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleToggleCustomerStatus(row.customer)}
            className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 shadow-sm ${
              row.customer.status === 1
                ? "bg-gradient-to-r from-blue-400 to-blue-600 justify-end"
                : "bg-slate-300 justify-start"
            }`}
            title={`${row.customer.status === 1 ? "Deactivate" : "Activate"} Customer`}
          >
            <div className="w-5 h-5 bg-white rounded-full shadow-md" />
          </button>
          <span
            className={`text-[10px] font-bold ${
              row.customer.status === 1 ? "text-blue-600" : "text-slate-500"
            }`}
          >
            {row.customer.status === 1 ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      ),
    },
    {
      key: "vehicleStatus",
      header: "Vehicle Status",
      accessor: "vehicles",
      className: "min-w-[140px] text-center",
      render: (row) => {
        if (!row.vehicles || row.vehicles.length === 0) {
          return (
            <span className="text-xs text-slate-400 italic">No Vehicle</span>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            {row.vehicles.map((vehicle, idx) => (
              <div
                key={vehicle._id || idx}
                className="flex items-center gap-2 justify-center"
              >
                <span className="text-[10px] text-slate-500 font-mono w-16 text-right truncate">
                  {vehicle.registration_no}
                </span>
                <button
                  onClick={() =>
                    handleToggleVehicleStatus(vehicle, row.customer)
                  }
                  className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 shadow-sm ${
                    vehicle.status === 1
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-600 justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                  title={`${vehicle.status === 1 ? "Deactivate" : "Activate"} ${vehicle.registration_no}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                </button>
                <span
                  className={`text-[10px] font-bold w-14 text-left ${
                    vehicle.status === 1 ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {vehicle.status === 1 ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[170px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 pr-2">
          {pp.isActionVisible("history") && (
            <button
              onClick={() => navigate(`/customers/${row.customer._id}/soa`)}
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 transition-all shadow-sm hover:shadow-md"
              title="Statement Of Account (SOA)"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("activity") && (
            <button
              onClick={() =>
                navigate(`/customers/${row.customer._id}/activity`)
              }
              className="p-2 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white border border-violet-100 transition-all shadow-sm hover:shadow-md"
              title="Activity Tracking"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("edit") && (
            <button
              onClick={() => handleEdit(row.customer)}
              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all shadow-sm hover:shadow-md"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("archive") && (
            <button
              onClick={() => handleArchive(row.customer._id)}
              className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-100 transition-all shadow-sm hover:shadow-md"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
          {pp.isActionVisible("delete") && (
            <button
              onClick={() => handleDelete(row.customer._id)}
              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all shadow-sm hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Add deactivation info columns when viewing inactive tab
  if (activeTab === 2) {
    // Insert before "Actions" column (which is last)
    const actionsColumn = columns.pop();

    columns.push({
      header: "Deactivated",
      accessor: "deactivateDate",
      className: "min-w-[100px] text-center",
      render: (row) => {
        const customer = row.customer;
        const inactiveVehicles =
          customer.vehicles?.filter((v) => v.status === 2) || [];

        if (customer.status === 2 && customer.deactivateDate) {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-700">
                {new Date(customer.deactivateDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-[10px] text-slate-500">Customer</div>
            </div>
          );
        }

        if (inactiveVehicles.length > 0) {
          return (
            <div className="flex flex-col gap-1 text-xs">
              {inactiveVehicles.map((v, idx) => (
                <div key={idx}>
                  {v.deactivateDate && (
                    <div className="text-slate-700">
                      {new Date(v.deactivateDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        return <span className="text-xs text-slate-400">-</span>;
      },
    });

    columns.push({
      header: "Reactivate On",
      accessor: "reactivateDate",
      className: "min-w-[100px] text-center",
      render: (row) => {
        const customer = row.customer;
        const inactiveVehicles =
          customer.vehicles?.filter((v) => v.status === 2) || [];

        if (customer.status === 2 && customer.reactivateDate) {
          return (
            <div className="text-xs text-blue-600 font-medium">
              {new Date(customer.reactivateDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          );
        }

        if (
          inactiveVehicles.length > 0 &&
          inactiveVehicles.some((v) => v.reactivateDate)
        ) {
          return (
            <div className="flex flex-col gap-1 text-xs">
              {inactiveVehicles.map((v, idx) => (
                <div key={idx} className="text-blue-600">
                  {v.reactivateDate
                    ? new Date(v.reactivateDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </div>
              ))}
            </div>
          );
        }

        return <span className="text-xs text-slate-400">Not set</span>;
      },
    });

    columns.push({
      header: "Reason",
      accessor: "deactivateReason",
      className: "min-w-[220px]",
      render: (row) => {
        const customer = row.customer;
        const inactiveVehicles =
          customer.vehicles?.filter((v) => v.status === 2) || [];

        // DEBUG: Log deactivation data
        if (customer.status === 2 || inactiveVehicles.length > 0) {
          console.log("📋 [Deactivation Data from DB]", {
            customer: `${customer.firstName} ${customer.lastName}`,
            customerStatus: customer.status,
            customerDeactivateReason: customer.deactivateReason,
            customerDeactivateDate: customer.deactivateDate,
            inactiveVehicles: inactiveVehicles.map((v) => ({
              regNo: v.registration_no,
              reason: v.deactivateReason,
              date: v.deactivateDate,
            })),
          });
        }

        // Customer-level deactivation
        if (customer.status === 2 && customer.deactivateReason) {
          return (
            <div className="text-xs text-slate-700">
              <div className="px-2 py-1 bg-red-50 border border-red-200 rounded mb-2">
                <div className="font-semibold text-red-700 mb-1">
                  🚫 Customer Deactivated
                </div>
                <div className="text-slate-600">
                  {customer.deactivateReason}
                </div>
              </div>
              {inactiveVehicles.length > 0 && (
                <div className="text-[10px] text-slate-500 italic">
                  + {inactiveVehicles.length} vehicle
                  {inactiveVehicles.length > 1 ? "s" : ""} also inactive
                </div>
              )}
            </div>
          );
        }

        // Vehicle-level deactivation only (customer still active)
        if (inactiveVehicles.length > 0) {
          return (
            <div className="flex flex-col gap-1.5 text-xs">
              {inactiveVehicles.map((v, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 bg-amber-50 border border-amber-200 rounded"
                >
                  <div className="font-medium text-amber-700 mb-0.5">
                    🚗 {v.registration_no}
                  </div>
                  <div className="text-slate-600 italic">
                    {v.deactivateReason || "No reason provided"}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        return <span className="text-xs text-slate-400 italic">-</span>;
      },
    });

    // Add actions column back
    columns.push(actionsColumn);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <input
        type="file"
        accept=".csv, .xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 relative z-20 overflow-visible">
        {/* ✅ ALL FILTERS IN ONE ROW */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
          {/* LEFT SIDE: All Filters */}
          <div className="flex flex-wrap gap-3 items-end flex-1">
            {/* Customer Status Filter */}
            {pp.isToolbarVisible("statusFilter") && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide px-1">
                  Customer Status
                </span>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => handleTabChange(1)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                      activeTab === 1
                        ? "bg-white text-blue-600 shadow"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleTabChange(2)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                      activeTab === 2
                        ? "bg-white text-red-600 shadow"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            )}

            {/* Vehicle Status Filter */}
            {pp.isToolbarVisible("vehicleStatusFilter") && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide px-1">
                  Vehicle Status
                </span>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setVehicleStatusFilter("all")}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                      vehicleStatusFilter === "all"
                        ? "bg-white text-indigo-600 shadow"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setVehicleStatusFilter("active")}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                      vehicleStatusFilter === "active"
                        ? "bg-white text-emerald-600 shadow"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setVehicleStatusFilter("inactive")}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                      vehicleStatusFilter === "inactive"
                        ? "bg-white text-red-600 shadow"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            )}

            {/* Worker Filter */}
            {pp.isToolbarVisible("workerFilter") && (
              <div className="w-48 relative z-50">
                <CustomDropdown
                  key={`worker-${workerVehicleCounts.totalVehicles}-${selectedBuilding}`}
                  label={`Filter by Worker (${workers.length})`}
                  value={selectedWorker}
                  onChange={(value) => {
                    console.log("🔄 Worker filter changed:", value);
                    setSelectedWorker(value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  options={[
                    {
                      value: "__ANY_WORKER__",
                      label: `All Workers (${workerVehicleCounts.totalVehicles})`,
                    },
                    ...workers.map((worker) => {
                      const vehicleCount =
                        workerVehicleCounts.counts[worker._id] || 0;
                      const name =
                        worker.name ||
                        `${worker.firstName || ""} ${worker.lastName || ""}`.trim() ||
                        "Unknown Worker";
                      return {
                        value: worker._id,
                        label: `${name} (${vehicleCount})`,
                      };
                    }),
                  ]}
                  placeholder="All Workers"
                  icon={Users}
                  searchable={true}
                  disabled={loadingFilters}
                />
              </div>
            )}

            {/* Building Filter */}
            {pp.isToolbarVisible("buildingFilter") && (
              <div className="w-48 relative z-50">
                <CustomDropdown
                  key={`building-${totalCustomersWithBuildings}-${selectedWorker}`}
                  label={`Filter by Building (${buildings.length})`}
                  value={selectedBuilding}
                  onChange={(value) => {
                    console.log("🔄 Building filter changed:", value);
                    setSelectedBuilding(value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  options={[
                    {
                      value: "",
                      label: `All Buildings (${totalCustomersWithBuildings})`,
                    },
                    ...buildings.map((building) => {
                      const count = buildingCounts[building._id] || 0;
                      const name = building.name || "Unknown Building";
                      return {
                        value: building._id,
                        label: `${name} (${count})`,
                      };
                    }),
                  ]}
                  placeholder="All Buildings"
                  icon={Building}
                  searchable={true}
                  disabled={loadingFilters}
                />
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {pp.isToolbarVisible("template") && (
              <button
                onClick={handleDownloadTemplate}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden xl:inline">Template</span>
              </button>
            )}

            {pp.isToolbarVisible("importHistory") && (
              <button
                onClick={() => navigate("/customers/import-history")}
                className="h-10 px-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Import History</span>
              </button>
            )}

            {pp.isToolbarVisible("export") && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {pp.isToolbarVisible("import") && (
              <button
                onClick={handleImportClick}
                disabled={importLoading}
                className="h-10 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {importLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Import</span>
              </button>
            )}

            {pp.isToolbarVisible("addCustomer") && (
              <button
                onClick={handleCreate}
                className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            )}
          </div>
        </div>

        {pagination.total > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-6 overflow-x-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-bold text-gray-500 uppercase">
                Total Records:
              </span>
              <span className="text-sm font-bold text-gray-800">
                {pagination.total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-xs font-bold text-gray-500 uppercase">
                Page:
              </span>
              <span className="text-sm font-bold text-gray-800">
                {pagination.page} / {pagination.totalPages}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative z-10">
        <DataTable
          key={activeTab}
          columns={pp.filterColumns(columns)}
          data={flattenedData}
          loading={loading}
          hideSearch={!pp.isToolbarVisible("search")}
          pagination={{
            ...pagination,
            displayTotal: flattenedData.length, // Custom prop for display count
          }}
          onPageChange={(p) =>
            fetchData(
              p,
              pagination.limit,
              searchTerm,
              activeTab,
              selectedWorker,
              selectedBuilding,
              vehicleStatusFilter,
            )
          }
          onLimitChange={(l) =>
            fetchData(
              1,
              l,
              searchTerm,
              activeTab,
              selectedWorker,
              selectedBuilding,
              vehicleStatusFilter,
            )
          }
          renderExpandedRow={renderExpandedRow}
          onSearch={(value) => setSearchTerm(value)}
        />
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={() =>
          fetchData(
            pagination.page,
            pagination.limit,
            searchTerm,
            activeTab,
            selectedWorker,
            selectedBuilding,
            vehicleStatusFilter,
          )
        }
      />

      {/* Import Results Modal */}
      {showImportResults && importResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Import Results</h2>
              <p className="text-blue-100 mt-1">
                Summary of customer import operation
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {importResults.success || 0}
                  </div>
                  <div className="text-sm text-green-700 font-medium mt-1">
                    Total Success
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {importResults.created || 0}
                  </div>
                  <div className="text-sm text-blue-700 font-medium mt-1">
                    New Created
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {importResults.updated || 0}
                  </div>
                  <div className="text-sm text-amber-700 font-medium mt-1">
                    Updated
                  </div>
                </div>
              </div>

              {/* Errors Section */}
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold">
                        {importResults.errors.length}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-red-800">
                      Failed Records
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResults.errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-red-200 rounded p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded">
                            Row {error.row}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {error.name}
                            </div>
                            <div className="text-sm text-red-600 mt-1">
                              {error.error}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResults.errors && importResults.errors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-green-600 text-lg font-bold">
                    ✓ All records imported successfully!
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    No errors encountered during import
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
              <button
                onClick={() => {
                  setShowImportResults(false);
                  navigate("/customers/import-history");
                }}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                View Full History
              </button>
              <button
                onClick={() => setShowImportResults(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Deactivation Modal (Shows pending payments when deactivation is blocked) */}
      <BlockedDeactivationModal
        isOpen={blockedDeactivationModal.isOpen}
        onClose={() =>
          setBlockedDeactivationModal({
            isOpen: false,
            payments: [],
            totalDue: 0,
            customerName: "",
            type: "customer",
          })
        }
        payments={blockedDeactivationModal.payments}
        totalDue={blockedDeactivationModal.totalDue}
        customerName={blockedDeactivationModal.customerName}
        type={blockedDeactivationModal.type}
      />

      {/* Deactivation Reason Modal (Collects reason and dates when deactivation is allowed) */}
      <DeactivationReasonModal
        isOpen={deactivationModal.isOpen}
        onClose={() =>
          setDeactivationModal({
            isOpen: false,
            type: "",
            entityId: "",
            entityName: "",
            customerId: "",
          })
        }
        onConfirm={handleDeactivationConfirm}
        title={`Deactivate ${deactivationModal.type === "customer" ? "Customer" : "Vehicle"}`}
        entityName={deactivationModal.entityName}
        type={deactivationModal.type}
      />

      {/* Reactivation Date Modal (Collects reactivation date when activating) */}
      <ReactivationDateModal
        isOpen={reactivationModal.isOpen}
        onClose={() =>
          setReactivationModal({
            isOpen: false,
            type: "",
            entityId: "",
            entityName: "",
            customerId: "",
          })
        }
        onConfirm={handleReactivationConfirm}
        title={`Reactivate ${reactivationModal.type === "customer" ? "Customer" : "Vehicle"}`}
        entityName={reactivationModal.entityName}
        type={reactivationModal.type}
      />

      <AccessRequestModal
        isOpen={accessModal.isOpen}
        onClose={() =>
          setAccessModal({
            isOpen: false,
            elementType: "",
            elementKey: "",
            elementLabel: "",
          })
        }
        page="customers"
        pageLabel="Customers"
        elementType={accessModal.elementType}
        elementKey={accessModal.elementKey}
        elementLabel={accessModal.elementLabel}
      />
    </div>
  );
};

export default Customers;
