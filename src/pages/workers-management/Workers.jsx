import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Briefcase,
  ShoppingBag,
  Eye,
  Calendar,
  User,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  Save,
  Loader2,
  Truck,
  Building,
  Map as MapIcon,
  FileText, // ✅ Added FileText Icon
  Car, // ✅ Driver icon
  UserCheck, // ✅ Office Staff icon
  Shield, // ✅ Supervisor icon
  Activity,
  ClipboardCheck,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../api/axiosInstance";

// Components
import DataTable from "../../components/DataTable";
import WorkerModal from "../../components/modals/WorkerModal";
import DeleteModal from "../../components/modals/DeleteModal";
import AttendanceSheetModal from "../../components/modals/AttendanceSheetModal";
import CustomDropdown from "../../components/ui/CustomDropdown";
import {
  ATTENDANCE_DOWNLOAD_PRESETS,
  DEFAULT_ATTENDANCE_DOWNLOAD_PRESET,
  generateMonthlyAttendanceSheetsPdf,
  getWorkerSiteName,
  getWorkerTradeLabel,
} from "../../utils/attendanceSheetPdf";

// API
import { workerService } from "../../api/workerService";
import { staffAppUpdateService } from "../../api/staffAppUpdateService";
import usePagePermissions from "../../utils/usePagePermissions";

const getDefaultAttendanceMonth = () => {
  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  return `${nextMonthStart.getFullYear()}-${String(nextMonthStart.getMonth() + 1).padStart(2, "0")}`;
};

const ATTENDANCE_PRESET_STORAGE_KEY = "attendanceSheetDownloadPreset";
const ATTENDANCE_OFFSET_X_STORAGE_KEY = "attendanceSheetOffsetX";
const ATTENDANCE_OFFSET_Y_STORAGE_KEY = "attendanceSheetOffsetY";
const ATTENDANCE_FONT_SCALE_STORAGE_KEY = "attendanceSheetFontScale";
const ATTENDANCE_FONT_WEIGHT_STORAGE_KEY = "attendanceSheetFontWeight";
const DEFAULT_ATTENDANCE_FONT_SCALE = 1;
const DEFAULT_ATTENDANCE_FONT_WEIGHT = "normal";

const parseStoredNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getStoredAttendancePreset = () => {
  if (typeof window === "undefined") {
    return DEFAULT_ATTENDANCE_DOWNLOAD_PRESET;
  }

  const stored = window.localStorage.getItem(ATTENDANCE_PRESET_STORAGE_KEY);
  const isValid = ATTENDANCE_DOWNLOAD_PRESETS.some(
    (preset) => preset.key === stored,
  );

  return isValid ? stored : DEFAULT_ATTENDANCE_DOWNLOAD_PRESET;
};

const getStoredAttendanceOffsetMm = (key) => {
  if (typeof window === "undefined") return 0;
  return parseStoredNumber(window.localStorage.getItem(key), 0);
};

const getStoredAttendanceFontScale = () => {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE_FONT_SCALE;
  return parseStoredNumber(
    window.localStorage.getItem(ATTENDANCE_FONT_SCALE_STORAGE_KEY),
    DEFAULT_ATTENDANCE_FONT_SCALE,
  );
};

const getStoredAttendanceFontWeight = () => {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE_FONT_WEIGHT;
  const stored = window.localStorage.getItem(
    ATTENDANCE_FONT_WEIGHT_STORAGE_KEY,
  );
  return stored === "bold" || stored === "normal"
    ? stored
    : DEFAULT_ATTENDANCE_FONT_WEIGHT;
};

const MULTI_ALL_VALUE = "__all__";

const MultiSelectDropdown = ({
  value = [],
  onChange,
  options = [],
  placeholder,
  disabled = false,
  minWidth = "min-w-[160px]",
  onOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedSet = new Set(value);
  const selectedLabels = value
    .map((val) => options.find((opt) => opt.value === val)?.label || val)
    .filter(Boolean);

  const buttonLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (nextValue) => {
    if (nextValue === MULTI_ALL_VALUE) {
      onChange([]);
      return;
    }

    if (selectedSet.has(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  return (
    <div ref={containerRef} className={`relative ${minWidth}`}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!isOpen && onOpen) onOpen();
          setIsOpen((prev) => !prev);
        }}
        disabled={disabled}
        className={`h-10 w-full px-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between gap-2 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="truncate text-left flex-1">{buttonLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[9999] mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map((option) => {
              const isSelected = selectedSet.has(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const Workers = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pp = usePagePermissions("workers");

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [currency, setCurrency] = useState("AED");
  const [latestAppUpdate, setLatestAppUpdate] = useState(null);
  const [latestUpdateLoading, setLatestUpdateLoading] = useState(false);

  // Filters State
  const [currentSearch, setCurrentSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedExpiryRange, setSelectedExpiryRange] = useState("");

  // ✅ NEW FILTER STATES
  const [filterServiceType, setFilterServiceType] = useState("all");
  const [filterLocation, setFilterLocation] = useState("");

  // Data for Filters
  const [mallsList, setMallsList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deactivationModal, setDeactivationModal] = useState({
    isOpen: false,
    worker: null,
    reason: "",
    deactivateDate: new Date().toISOString().split("T")[0],
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(
    getDefaultAttendanceMonth(),
  );
  const [attendanceModalLoading, setAttendanceModalLoading] = useState(false);
  const [attendanceSheetModal, setAttendanceSheetModal] = useState({
    isOpen: false,
    workers: [],
  });
  const [attendanceFilterWorkers, setAttendanceFilterWorkers] = useState([]);
  const [attendanceFilterLoaded, setAttendanceFilterLoaded] = useState(false);
  const [attendanceFilterLoading, setAttendanceFilterLoading] = useState(false);
  const [selectedAttendanceTrades, setSelectedAttendanceTrades] = useState([]);
  const [selectedAttendanceSites, setSelectedAttendanceSites] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);

    // Load Filter Options
    const loadFilterData = async () => {
      try {
        const [malls, buildings, sites] = await Promise.all([
          api.get("/malls?limit=1000").catch(() => ({ data: { data: [] } })),
          api
            .get("/buildings?limit=1000")
            .catch(() => ({ data: { data: [] } })),
          api.get("/sites?limit=1000").catch(() => ({ data: { data: [] } })),
        ]);
        setMallsList(malls.data.data || []);
        setBuildingsList(buildings.data.data || []);
        setSitesList(sites.data.data || []);
      } catch (e) {
        console.error("Filter load error", e);
      }
    };
    loadFilterData();
  }, []);

  useEffect(() => {
    if (!pp.isAdmin) return;
    const loadLatestUpdate = async () => {
      setLatestUpdateLoading(true);
      try {
        const response = await staffAppUpdateService.latest();
        setLatestAppUpdate(response.data || null);
      } catch (e) {
        setLatestAppUpdate(null);
      } finally {
        setLatestUpdateLoading(false);
      }
    };

    loadLatestUpdate();
  }, [pp.isAdmin]);

  // --- HELPERS ---
  const getDaysDiff = (date) => {
    if (!date) return null;
    return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLatestDownloaded = (row) => {
    if (!latestAppUpdate) return false;
    const downloadedId = row.appUpdate?.downloadedUpdateId;
    if (downloadedId && latestAppUpdate._id) {
      return String(downloadedId) === String(latestAppUpdate._id);
    }
    const downloadedVersion = row.appUpdate?.downloadedVersion;
    return (
      downloadedVersion &&
      latestAppUpdate.version &&
      String(downloadedVersion) === String(latestAppUpdate.version)
    );
  };

  const buildServerFilters = () => ({
    ...(selectedCompany ? { companyName: selectedCompany } : {}),
    ...(filterServiceType !== "all" ? { service_type: filterServiceType } : {}),
    ...(filterLocation && filterServiceType === "mall"
      ? { mall: filterLocation }
      : {}),
    ...(filterLocation && filterServiceType === "residence"
      ? { building: filterLocation }
      : {}),
    ...(filterLocation && filterServiceType === "site"
      ? { site: filterLocation }
      : {}),
  });

  // --- FETCH DATA ---
  const fetchData = async (
    page = 1,
    limit = 100,
    search = "",
    status = undefined,
  ) => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      const fetchStatus =
        status !== undefined ? status : activeTab === "active" ? 1 : 2;

      const serverFilters = buildServerFilters();

      const response = await workerService.list(
        page,
        limit,
        search,
        fetchStatus,
        serverFilters,
      );
      setData(response.data || []);
      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const status = activeTab === "active" ? 1 : 2;
    fetchData(pagination.page, pagination.limit, currentSearch, status);
  }, [activeTab]);

  // --- Debounced server-side search when user types ---
  useEffect(() => {
    const timer = setTimeout(() => {
      const status = activeTab === "active" ? 1 : 2;
      fetchData(1, pagination.limit, currentSearch, status);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentSearch]);

  useEffect(() => {
    const status = activeTab === "active" ? 1 : 2;
    fetchData(1, pagination.limit, currentSearch, status);
  }, [selectedCompany, filterServiceType, filterLocation]);

  // --- FILTER LOGIC ---
  const companyOptions = useMemo(() => {
    const companies = [
      "BABA CAR WASHING AND CLEANING L.L.C.",
      "NEW SAI TECHNICAL SERVICES L.L.C.",
      "SAI BABA CLEANING SERVICES L.L.C.",
      "B C W PARKING CAR WASH L.L.C.",
    ];
    return [
      { value: "", label: "All Companies" },
      ...companies.map((c) => ({ value: c, label: c })),
    ];
  }, []);

  const expiryRangeOptions = [
    { value: "", label: "Any Validity" },
    { value: "already_expired", label: "Already Expired" },
    { value: "30", label: "Within 1 Month" },
  ];

  const locationOptions = useMemo(() => {
    if (filterServiceType === "mall")
      return [
        { value: "", label: "All Malls" },
        ...mallsList.map((m) => ({ value: m._id, label: m.name })),
      ];
    if (filterServiceType === "residence")
      return [
        { value: "", label: "All Buildings" },
        ...buildingsList.map((b) => ({ value: b._id, label: b.name })),
      ];
    if (filterServiceType === "site")
      return [
        { value: "", label: "All Sites" },
        ...sitesList.map((s) => ({ value: s._id, label: s.name })),
      ];
    return [{ value: "", label: "Select Service Type First" }];
  }, [filterServiceType, mallsList, buildingsList, sitesList]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedExpiryRange) {
        const dates = [
          item.passportExpiry,
          item.visaExpiry,
          item.emiratesIdExpiry,
        ];
        const diffs = dates.map((d) => getDaysDiff(d));
        if (selectedExpiryRange === "already_expired") {
          if (!diffs.some((d) => d !== null && d < 0)) return false;
        } else {
          const limit = parseInt(selectedExpiryRange);
          const min = Math.min(...diffs.filter((d) => d !== null && d >= 0));
          if (min > limit || min === Infinity) return false;
        }
      }

      if (currentSearch) {
        const s = currentSearch.toLowerCase();
        const assignmentNames = [
          ...(item.malls || []).map((m) =>
            typeof m === "object" ? m.name : m,
          ),
          ...(item.buildings || []).map((b) =>
            typeof b === "object" ? b.name : b,
          ),
          ...(item.sites || []).map((st) =>
            typeof st === "object" ? st.name : st,
          ),
        ]
          .join(" ")
          .toLowerCase();

        return (
          item.name?.toLowerCase().includes(s) ||
          item.employeeCode?.toLowerCase().includes(s) ||
          item.mobile?.toLowerCase().includes(s) ||
          item.companyName?.toLowerCase().includes(s) ||
          assignmentNames.includes(s)
        );
      }
      return true;
    });
  }, [data, selectedExpiryRange]);

  const criticalAlerts = useMemo(() => {
    return data.filter((item) => {
      const dates = [
        item.passportExpiry,
        item.visaExpiry,
        item.emiratesIdExpiry,
      ];
      const diffs = dates.map((d) => getDaysDiff(d)).filter((d) => d !== null);
      if (diffs.length === 0) return false;
      return Math.min(...diffs) <= 30;
    });
  }, [data]);

  const closeAttendanceSheetModal = () => {
    setAttendanceSheetModal({ isOpen: false, workers: [] });
  };

  const normalizeAttendanceTrade = (worker) =>
    getWorkerTradeLabel(worker) || "Unassigned";

  const normalizeAttendanceSite = (worker) =>
    getWorkerSiteName(worker) || "Unassigned";

  const attendanceTradeOptions = useMemo(() => {
    if (attendanceFilterLoading) {
      return [{ value: "all", label: "Loading trades..." }];
    }

    if (!attendanceFilterLoaded) {
      return [{ value: "all", label: "Click to load trades" }];
    }

    const hasSiteFilter = selectedAttendanceSites.length > 0;
    const siteSet = hasSiteFilter ? new Set(selectedAttendanceSites) : null;
    const baseWorkers = hasSiteFilter
      ? attendanceFilterWorkers.filter((worker) => {
          const siteLabel = normalizeAttendanceSite(worker);
          return siteSet.has(siteLabel);
        })
      : attendanceFilterWorkers;

    const counts = new Map();
    baseWorkers.forEach((worker) => {
      const tradeLabel = normalizeAttendanceTrade(worker);
      counts.set(tradeLabel, (counts.get(tradeLabel) || 0) + 1);
    });

    return [
      {
        value: MULTI_ALL_VALUE,
        label: `All Trades (${baseWorkers.length})`,
      },
      ...Array.from(counts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([trade, count]) => ({
          value: trade,
          label: `${trade} (${count})`,
        })),
    ];
  }, [
    attendanceFilterWorkers,
    attendanceFilterLoaded,
    attendanceFilterLoading,
    selectedAttendanceSites,
  ]);

  const attendanceSiteOptions = useMemo(() => {
    if (attendanceFilterLoading) {
      return [{ value: "all", label: "Loading sites..." }];
    }

    if (!attendanceFilterLoaded) {
      return [{ value: "all", label: "Click to load sites" }];
    }

    const hasTradeFilter = selectedAttendanceTrades.length > 0;
    const tradeSet = hasTradeFilter ? new Set(selectedAttendanceTrades) : null;
    const baseWorkers = hasTradeFilter
      ? attendanceFilterWorkers.filter((worker) => {
          const tradeLabel = normalizeAttendanceTrade(worker);
          return tradeSet.has(tradeLabel);
        })
      : attendanceFilterWorkers;

    const counts = new Map();
    baseWorkers.forEach((worker) => {
      const siteLabel = normalizeAttendanceSite(worker);
      counts.set(siteLabel, (counts.get(siteLabel) || 0) + 1);
    });

    return [
      {
        value: MULTI_ALL_VALUE,
        label: `All Sites (${baseWorkers.length})`,
      },
      ...Array.from(counts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([site, count]) => ({
          value: site,
          label: `${site} (${count})`,
        })),
    ];
  }, [
    attendanceFilterWorkers,
    attendanceFilterLoaded,
    attendanceFilterLoading,
    selectedAttendanceTrades,
  ]);

  useEffect(() => {
    if (!attendanceFilterLoaded) return;
    const validTrades = new Set(
      attendanceTradeOptions
        .map((option) => option.value)
        .filter((value) => value !== MULTI_ALL_VALUE),
    );
    setSelectedAttendanceTrades((prev) =>
      prev.filter((value) => validTrades.has(value)),
    );
  }, [attendanceTradeOptions, attendanceFilterLoaded]);

  useEffect(() => {
    if (!attendanceFilterLoaded) return;
    const validSites = new Set(
      attendanceSiteOptions
        .map((option) => option.value)
        .filter((value) => value !== MULTI_ALL_VALUE),
    );
    setSelectedAttendanceSites((prev) =>
      prev.filter((value) => validSites.has(value)),
    );
  }, [attendanceSiteOptions, attendanceFilterLoaded]);

  const filteredAttendanceWorkers = useMemo(() => {
    if (!attendanceFilterLoaded) return [];
    const hasTradeFilter = selectedAttendanceTrades.length > 0;
    const hasSiteFilter = selectedAttendanceSites.length > 0;
    const tradeSet = hasTradeFilter ? new Set(selectedAttendanceTrades) : null;
    const siteSet = hasSiteFilter ? new Set(selectedAttendanceSites) : null;

    return attendanceFilterWorkers.filter((worker) => {
      if (hasTradeFilter) {
        const tradeLabel = normalizeAttendanceTrade(worker);
        if (!tradeSet.has(tradeLabel)) return false;
      }

      if (hasSiteFilter) {
        const siteLabel = normalizeAttendanceSite(worker);
        if (!siteSet.has(siteLabel)) return false;
      }

      return true;
    });
  }, [
    attendanceFilterWorkers,
    attendanceFilterLoaded,
    selectedAttendanceTrades,
    selectedAttendanceSites,
  ]);

  const attendanceFilterCount = attendanceFilterLoaded
    ? filteredAttendanceWorkers.length
    : 0;

  const loadAttendanceFilterWorkers = async (force = false) => {
    if (attendanceFilterLoading) return attendanceFilterWorkers;
    if (attendanceFilterLoaded && !force) return attendanceFilterWorkers;

    setAttendanceFilterLoading(true);
    try {
      const response = await workerService.list(
        1,
        10000,
        "",
        1,
        buildServerFilters(),
      );

      const activeWorkers = (response.data || []).filter(
        (worker) => worker.status === 1,
      );

      setAttendanceFilterWorkers(activeWorkers);
      setAttendanceFilterLoaded(true);
      return activeWorkers;
    } catch (error) {
      toast.error("Failed to load trade/site options");
      setAttendanceFilterWorkers([]);
      setAttendanceFilterLoaded(false);
      return [];
    } finally {
      setAttendanceFilterLoading(false);
    }
  };

  useEffect(() => {
    setAttendanceFilterWorkers([]);
    setAttendanceFilterLoaded(false);
    setSelectedAttendanceTrades([]);
    setSelectedAttendanceSites([]);

    if (pp.isToolbarVisible("attendanceSheet")) {
      loadAttendanceFilterWorkers(true);
    }
  }, [selectedCompany, filterServiceType, filterLocation]);

  const handleOpenAttendanceSheetsModal = async () => {
    const toastId = toast.loading("Loading attendance sheets...");
    try {
      setAttendanceModalLoading(true);
      const activeWorkers = attendanceFilterLoaded
        ? attendanceFilterWorkers
        : await loadAttendanceFilterWorkers();

      if (!activeWorkers || activeWorkers.length === 0) {
        toast.error("No active workers found for the current filters", {
          id: toastId,
        });
        return;
      }

      const filteredWorkers = attendanceFilterLoaded
        ? filteredAttendanceWorkers
        : activeWorkers;

      if (filteredWorkers.length === 0) {
        toast.error("No workers match the selected trade/site filters", {
          id: toastId,
        });
        return;
      }

      await generateMonthlyAttendanceSheetsPdf({
        workers: filteredWorkers,
        monthValue: attendanceMonth,
        downloadPresetKey: getStoredAttendancePreset(),
        pageOffsetMm: {
          x: getStoredAttendanceOffsetMm(ATTENDANCE_OFFSET_X_STORAGE_KEY),
          y: getStoredAttendanceOffsetMm(ATTENDANCE_OFFSET_Y_STORAGE_KEY),
        },
        fontScale: getStoredAttendanceFontScale(),
        fontWeight: getStoredAttendanceFontWeight(),
        action: "preview",
      });

      toast.success(
        `Opened attendance sheets for ${filteredWorkers.length} workers`,
        { id: toastId },
      );
    } catch (error) {
      toast.error("Failed to load attendance sheets", { id: toastId });
    } finally {
      setAttendanceModalLoading(false);
    }
  };

  const handleOpenSingleAttendanceSheetModal = (worker) => {
    if (!worker?._id) {
      toast.error("Worker details are not available");
      return;
    }

    setAttendanceSheetModal({
      isOpen: true,
      workers: [worker],
    });
  };

  const handleExportData = async () => {
    const toastId = toast.loading("Exporting...");
    try {
      const status = activeTab === "active" ? 1 : 2;
      const blob = await workerService.exportData(status);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Workers_Export_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Done", { id: toastId });
    } catch {
      toast.error("Export failed", { id: toastId });
    }
  };

  const handleDownloadTemplate = () => {
    const toastId = toast.loading("Generating Template...");
    try {
      const templateData = [
        {
          Name: "John Doe (Sample)",
          Mobile: "971501234567",
          "Employee Code": "EMP001",
          "Joining Date (DD/MM/YYYY)": "01/01/2024",
          "Passport No.": "N123456",
          "Passport Expiry (DD/MM/YYYY)": "01/01/2030",
          "Visa No.": "V987654",
          "Visa Expiry (DD/MM/YYYY)": "01/01/2026",
          "EID No.": "784-1234-1234567-1",
          "EID Expiry (DD/MM/YYYY)": "01/01/2026",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      ws["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 25 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Workers Template");
      XLSX.writeFile(wb, "Workers_Import_Template.xlsx");
      toast.success("Template Downloaded", { id: toastId });
    } catch {
      toast.error("Template failed", { id: toastId });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;
    const toastId = toast.loading("Uploading...");
    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await workerService.importData(formData);
      toast.success("Success", { id: toastId });
      fetchData(1, pagination.limit);
    } catch {
      toast.error("Failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await workerService.delete(workerToDelete._id);
      toast.success("Deleted");
      setIsDeleteModalOpen(false);
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (worker) => {
    if (worker.status === 1) {
      setDeactivationModal({
        isOpen: true,
        worker,
        reason: "",
        deactivateDate: new Date().toISOString().split("T")[0],
      });
      return;
    }

    try {
      setStatusLoading(true);
      await workerService.update(worker._id, {
        status: 1,
        deactivateReason: "",
        reactivateDate: new Date().toISOString(),
      });
      toast.success("Worker Activated");
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch {
      toast.error("Status update failed");
    } finally {
      setStatusLoading(false);
    }
  };

  const closeDeactivationModal = () => {
    if (statusLoading) return;
    setDeactivationModal({
      isOpen: false,
      worker: null,
      reason: "",
      deactivateDate: new Date().toISOString().split("T")[0],
    });
  };

  const confirmDeactivation = async () => {
    if (!deactivationModal.worker) return;

    const reason = deactivationModal.reason.trim();
    if (!reason) {
      toast.error("Please provide a deactivation reason");
      return;
    }

    try {
      setStatusLoading(true);
      await workerService.update(deactivationModal.worker._id, {
        status: 2,
        deactivateReason: reason,
        deactivateDate: new Date(
          deactivationModal.deactivateDate,
        ).toISOString(),
      });
      toast.success("Worker Deactivated");
      closeDeactivationModal();
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch {
      toast.error("Status update failed");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDownloadImage = async (e, url, name) => {
    e.stopPropagation();
    if (!url) return toast.error("No image to download");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, "_")}_profile.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Worker",
      className: "min-w-[280px]",
      render: (r) => (
        <div
          className="flex items-center gap-4 py-2 group cursor-pointer"
          onClick={() => navigate(`/workers/${r._id}`)}
        >
          <div className="relative group/img flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md ring-1 ring-slate-100">
              <div className="w-full h-full rounded-[12px] overflow-hidden bg-slate-50 flex items-center justify-center">
                {r.profileImage?.url ? (
                  <img
                    src={r.profileImage.url}
                    className="w-full h-full object-cover"
                    alt={r.name}
                  />
                ) : (
                  <User className="text-slate-300 w-6 h-6" />
                )}
              </div>
            </div>
            {r.profileImage?.url && (
              <button
                onClick={(e) =>
                  handleDownloadImage(e, r.profileImage.url, r.name)
                }
                className="absolute -bottom-2 -right-2 p-1.5 bg-white text-slate-600 rounded-full shadow-md border border-slate-100 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover/img:opacity-100"
                title="Download Photo"
              >
                <Save className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="font-extrabold text-slate-800 text-[15px] leading-snug mb-1 group-hover:text-indigo-600 transition-colors whitespace-normal break-words max-w-[200px]">
              {r.name}
            </h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider w-fit">
                {r.employeeCode || `#${r.id}`}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-fit flex items-center gap-1 ${
                  r.service_type === "mobile"
                    ? "bg-green-100 text-green-700"
                    : r.service_type === "mall"
                      ? "bg-purple-100 text-purple-700"
                      : r.service_type === "site"
                        ? "bg-orange-100 text-orange-700"
                        : r.service_type === "driver"
                          ? "bg-cyan-100 text-cyan-700"
                          : r.service_type === "officestaff"
                            ? "bg-pink-100 text-pink-700"
                            : r.service_type === "supervisor"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                }`}
              >
                {r.service_type === "mobile" ? (
                  <Truck className="w-3 h-3" />
                ) : r.service_type === "mall" ? (
                  <ShoppingBag className="w-3 h-3" />
                ) : r.service_type === "site" ? (
                  <MapIcon className="w-3 h-3" />
                ) : r.service_type === "driver" ? (
                  <Car className="w-3 h-3" />
                ) : r.service_type === "officestaff" ? (
                  <UserCheck className="w-3 h-3" />
                ) : r.service_type === "supervisor" ? (
                  <Shield className="w-3 h-3" />
                ) : (
                  <Building className="w-3 h-3" />
                )}
                {r.service_type}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (r) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
            <Phone className="w-3.5 h-3.5" />
          </div>
          {r.mobile || <span className="text-slate-400 italic">No Number</span>}
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-700 leading-tight whitespace-normal min-w-[150px] break-words">
            {r.companyName || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "appUpdate",
      header: "App Update",
      className: "min-w-[240px]",
      render: (r) => {
        if (!pp.isAdmin) {
          return (
            <span className="text-xs text-slate-400 italic">Restricted</span>
          );
        }
        const latestVersion = latestAppUpdate?.version;
        const downloaded = isLatestDownloaded(r);
        const downloadedAt = r.appUpdate?.downloadedAt;
        const installedVersion = r.appUpdate?.installedVersion;
        const installedAt = r.appUpdate?.installedAt;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  downloaded
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {downloaded ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {downloaded ? "Downloaded" : "Not Downloaded"}
              </span>
              {latestUpdateLoading && (
                <span className="text-[10px] text-slate-400">Checking...</span>
              )}
              {!latestUpdateLoading && latestVersion && (
                <span className="text-[10px] text-slate-400">
                  Latest v{latestVersion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Clock className="w-3 h-3" />
              DL {formatDateTime(downloadedAt)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {installedVersion
                ? `Installed v${installedVersion}`
                : "Installed -"}
              <span className="text-[10px] text-slate-400">
                {formatDateTime(installedAt)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "assignments",
      header: "Assignments",
      className: "min-w-[250px] max-w-[450px]",
      render: (r) => {
        const buildings = r.buildings || [];
        const malls = r.malls || [];
        const sites = r.sites || [];
        const hasAssignments =
          buildings.length > 0 || malls.length > 0 || sites.length > 0;

        return (
          <div className="flex flex-wrap gap-1.5 items-center">
            {hasAssignments ? (
              <>
                {malls.map((m, i) => (
                  <span
                    key={`m-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold shadow-sm whitespace-normal mb-1"
                  >
                    <ShoppingBag className="w-3 h-3" />{" "}
                    {typeof m === "object" ? m.name : `Mall ${m}`}
                  </span>
                ))}
                {buildings.map((b, i) => (
                  <span
                    key={`b-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold shadow-sm whitespace-normal mb-1"
                  >
                    <Briefcase className="w-3 h-3" />{" "}
                    {typeof b === "object" ? b.name : `Res ${b}`}
                  </span>
                ))}
                {sites.map((s, i) => (
                  <span
                    key={`s-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 text-[11px] font-bold shadow-sm whitespace-normal mb-1"
                  >
                    <MapIcon className="w-3 h-3" />{" "}
                    {typeof s === "object" ? s.name : `Site ${s}`}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-slate-400 italic text-xs">Unassigned</span>
            )}
          </div>
        );
      },
    },
    {
      key: "quickLinks",
      header: "Quick Links",
      className: "text-center",
      render: (r) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              navigate(`/workers/${r._id}/payments`, { state: { worker: r } })
            }
            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-100"
            title="Payments"
          >
            <span className="text-[10px] font-bold px-1">{currency}</span>
          </button>
          <button
            onClick={() =>
              navigate(`/workers/${r._id}/history`, { state: { worker: r } })
            }
            className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 border border-purple-100"
            title="History"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          {pp.isActionVisible("activity") && (
            <button
              onClick={() => navigate(`/workers/${r._id}/activity`)}
              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100"
              title="Activity Tracking"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      render: (row) => (
        <div className="flex justify-center">
          <div
            onClick={() => toggleStatus(row)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 shadow-inner ${row.status === 1 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-slate-200"}`}
            title={row.status === 1 ? "Deactivate" : "Activate"}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${row.status === 1 ? "left-6" : "left-1"}`}
            />
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className:
        "text-right w-44 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          {pp.isActionVisible("view") && (
            <button
              onClick={() => navigate(`/workers/${row._id}`)}
              className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
              title="View Profile"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {pp.isActionVisible("view") && (
            <button
              onClick={() =>
                navigate("/workers/monthly", {
                  state: {
                    workerId: row._id,
                    worker: row,
                  },
                })
              }
              className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
              title="Monthly Records"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {pp.isActionVisible("attendanceSheet") && (
            <button
              onClick={() => handleOpenSingleAttendanceSheetModal(row)}
              className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-all"
              title="Open Attendance Sheet"
            >
              <ClipboardCheck className="w-4 h-4" />
            </button>
          )}

          {pp.isActionVisible("edit") && (
            <button
              onClick={() => {
                setSelectedWorker(row);
                setIsModalOpen(true);
              }}
              className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("delete") && (
            <button
              onClick={() => {
                setWorkerToDelete(row);
                setIsDeleteModalOpen(true);
              }}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const isClientFiltered = selectedExpiryRange;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex relative">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out z-0`}
                style={{ left: activeTab === "active" ? "4px" : "calc(50%)" }}
              />
              <button
                onClick={() => setActiveTab("active")}
                className={`relative z-10 px-6 py-2 text-sm font-bold transition-colors duration-300 ${activeTab === "active" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("inactive")}
                className={`relative z-10 px-6 py-2 text-sm font-bold transition-colors duration-300 ${activeTab === "inactive" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto justify-end">
            {pp.isToolbarVisible("search") && (
              <div className="relative w-full lg:w-64 group mr-2">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={currentSearch}
                  onChange={(e) => setCurrentSearch(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            )}
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
              {pp.isToolbarVisible("attendanceSheet") && (
                <div className="flex items-center gap-2 px-2 py-1">
                  <input
                    type="month"
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="h-10 px-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <MultiSelectDropdown
                    value={selectedAttendanceTrades}
                    onChange={setSelectedAttendanceTrades}
                    options={attendanceTradeOptions}
                    placeholder={
                      attendanceTradeOptions.find(
                        (option) => option.value === MULTI_ALL_VALUE,
                      )?.label || "All Trades"
                    }
                    disabled={attendanceFilterLoading && !attendanceFilterLoaded}
                    minWidth="min-w-[150px]"
                    onOpen={loadAttendanceFilterWorkers}
                  />
                  <MultiSelectDropdown
                    value={selectedAttendanceSites}
                    onChange={setSelectedAttendanceSites}
                    options={attendanceSiteOptions}
                    placeholder={
                      attendanceSiteOptions.find(
                        (option) => option.value === MULTI_ALL_VALUE,
                      )?.label || "All Sites"
                    }
                    disabled={attendanceFilterLoading && !attendanceFilterLoaded}
                    minWidth="min-w-[170px]"
                    onOpen={loadAttendanceFilterWorkers}
                  />
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                    {attendanceFilterLoaded
                      ? `Count: ${attendanceFilterCount}`
                      : attendanceFilterLoading
                        ? "Loading..."
                        : "Pick to load"}
                  </span>
                  <button
                    onClick={handleOpenAttendanceSheetsModal}
                    disabled={attendanceModalLoading}
                    className="h-10 px-3 text-slate-600 hover:text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm disabled:opacity-60"
                    title="Open monthly attendance sheets"
                  >
                    {attendanceModalLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Attendance Sheets</span>
                  </button>
                </div>
              )}
              {pp.isToolbarVisible("export") && (
                <button
                  onClick={handleExportData}
                  className="h-10 px-4 text-slate-600 hover:text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
              {pp.isToolbarVisible("template") && (
                <button
                  onClick={handleDownloadTemplate}
                  className="h-10 px-4 text-slate-600 hover:text-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">Template</span>
                </button>
              )}
              {pp.isToolbarVisible("import") && (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="h-10 px-4 text-slate-600 hover:text-indigo-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm"
                >
                  {importLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}{" "}
                  <span className="hidden sm:inline">Import</span>
                </button>
              )}
            </div>
            {pp.isToolbarVisible("addWorker") && (
              <button
                onClick={() => {
                  setSelectedWorker(null);
                  setIsModalOpen(true);
                }}
                className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Worker
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-100 pt-6 mt-2">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              Service Type
            </span>
            <div className="flex p-1 bg-slate-100 rounded-lg gap-0.5 overflow-x-auto">
              {[
                { id: "all", icon: Briefcase, label: "All" },
                { id: "mall", icon: ShoppingBag, label: "Mall" },
                { id: "residence", icon: Building, label: "Res" },
                { id: "site", icon: MapIcon, label: "Site" },
                { id: "mobile", icon: Truck, label: "Mob" },
                { id: "driver", icon: Car, label: "Drv" },
                { id: "officestaff", icon: UserCheck, label: "Ofc" },
                { id: "supervisor", icon: Shield, label: "Sup" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setFilterServiceType(type.id);
                    setFilterLocation("");
                  }}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${filterServiceType === type.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <type.icon className="w-3 h-3" /> {type.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className={
              ["mobile", "driver", "officestaff", "supervisor"].includes(
                filterServiceType,
              )
                ? "opacity-30 pointer-events-none grayscale"
                : ""
            }
          >
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              {filterServiceType === "mall"
                ? "Select Mall"
                : filterServiceType === "residence"
                  ? "Select Building"
                  : filterServiceType === "site"
                    ? "Select Site"
                    : "Location Filter"}
            </span>
            <CustomDropdown
              value={filterLocation}
              onChange={setFilterLocation}
              options={locationOptions}
              icon={MapPin}
              placeholder={
                filterServiceType === "all"
                  ? "Select Type First"
                  : "All Locations"
              }
              disabled={
                filterServiceType === "all" || filterServiceType === "mobile"
              }
            />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              Company
            </span>
            <CustomDropdown
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={companyOptions}
              icon={Briefcase}
              placeholder="All Companies"
            />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              Compliance
            </span>
            <CustomDropdown
              value={selectedExpiryRange}
              onChange={setSelectedExpiryRange}
              options={expiryRangeOptions}
              icon={Clock}
              placeholder="Any Validity"
            />
          </div>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="mb-6 bg-white/80 backdrop-blur-md border border-rose-100 py-3 rounded-2xl overflow-hidden relative shadow-lg mx-1 ring-1 ring-rose-50">
          <div className="flex whitespace-nowrap animate-marquee items-center gap-24">
            <div className="flex items-center gap-2.5 bg-rose-600 text-white px-5 py-1.5 rounded-full ml-6 font-black text-[10px] uppercase tracking-widest shadow-md">
              <ShieldAlert className="w-4 h-4" /> Action Required
            </div>
            {criticalAlerts.map((w) => (
              <div
                key={w._id}
                className="flex items-center gap-4 group cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/workers/${w._id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                  {w.profileImage?.url ? (
                    <img
                      src={w.profileImage.url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="p-1.5 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[13px] font-black text-slate-700">
                    {w.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {w.employeeCode}
                  </span>
                </div>
                <div className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold border border-rose-200">
                  Check Expiry
                </div>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/60 overflow-hidden relative z-10">
        <DataTable
          columns={pp.filterColumns(columns)}
          data={filteredData}
          loading={loading}
          pagination={{
            ...pagination,
            total: isClientFiltered ? filteredData.length : pagination.total,
          }}
          onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
          onLimitChange={(l) => fetchData(1, l, currentSearch)}
          onSearch={(t) => fetchData(1, pagination.limit, t)}
          hideSearch={true}
          // ✅ REMOVED renderExpandedRow
        />
      </div>

      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedWorker}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Worker"
        message={`Are you sure you want to delete "${workerToDelete?.name}"?`}
      />
      <AttendanceSheetModal
        isOpen={attendanceSheetModal.isOpen}
        onClose={closeAttendanceSheetModal}
        workers={attendanceSheetModal.workers}
        monthValue={attendanceMonth}
      />

      {deactivationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <button
              onClick={closeDeactivationModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
              disabled={statusLoading}
            >
              <X size={20} />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="text-amber-700" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Deactivate Worker
                </h3>
                <p className="text-sm text-slate-600">
                  {deactivationModal.worker?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deactivation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={deactivationModal.deactivateDate}
                  onChange={(e) =>
                    setDeactivationModal((prev) => ({
                      ...prev,
                      deactivateDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  disabled={statusLoading}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Reason for Deactivation{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deactivationModal.reason}
                  onChange={(e) =>
                    setDeactivationModal((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Enter reason..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  disabled={statusLoading}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeactivationModal}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={statusLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivation}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-70"
                disabled={statusLoading}
              >
                {statusLoading ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .DataTable th { font-weight: 900; color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; padding: 24px 32px !important; border-bottom: 2px solid #f8fafc; background: #fff; }
        .DataTable td { padding: 20px 32px !important; border-bottom: 1px solid #f8fafc; vertical-align: middle; background: #fff; }
        .DataTable tr:hover td { background: #fdfdfd; }
      `}</style>
    </div>
  );
};

export default Workers;
