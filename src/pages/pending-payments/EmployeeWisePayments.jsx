import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Building,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  Phone,
  MapPin,
  Hash,
  Eye,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  Printer,
  ShoppingBag,
  Home,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Info,
  Banknote,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Redux & API
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { fetchMalls } from "../../redux/slices/mallSlice";
import { paymentService } from "../../api/paymentService";
import { oneWashService } from "../../api/oneWashService";

// Components
import CustomDropdown from "../../components/ui/CustomDropdown";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import { toCalendarRange } from "../../utils/shiftTime";

// ============================================================
// HELPER: compute due date from billing_month or createdAt
// ============================================================
const getDueDate = (item) => {
  if (item.billing_month) {
    const [y, m] = item.billing_month.split("-").map(Number);
    return new Date(y, m, 0);
  }
  const d = new Date(item.createdAt);
  if (d.getDate() === 1) {
    return new Date(d.getFullYear(), d.getMonth(), 0);
  }
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

const formatDueDate = (item) => {
  return getDueDate(item).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// SERVICE TYPE CONFIG
// ============================================================
const SERVICE_TYPES = {
  residence: {
    label: "Residence",
    icon: Home,
    color: "indigo",
    gradient: "from-indigo-500 to-blue-600",
    lightBg: "bg-indigo-50",
    lightBorder: "border-indigo-200",
    lightText: "text-indigo-600",
    description: "Pending residence subscription payments",
    onewash: false,
  },
  onewash: {
    label: "One Wash",
    icon: Car,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    lightBorder: "border-emerald-200",
    lightText: "text-emerald-600",
    description: "One-time washes & mall services (all completed)",
    onewash: true,
  },
};

// ============================================================
// SORT OPTIONS
// ============================================================
const SORT_OPTIONS = [
  { value: "balance_desc", label: "Balance: High to Low" },
  { value: "balance_asc", label: "Balance: Low to High" },
  { value: "due_desc", label: "Total Due: High to Low" },
  { value: "due_asc", label: "Total Due: Low to High" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "count_desc", label: "Vehicles: Most First" },
  { value: "count_asc", label: "Vehicles: Least First" },
];

// ============================================================
// ANIMATED COUNTER COMPONENT
// ============================================================
const AnimatedNumber = ({
  value,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevValue.current = end;
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {display.toFixed(2)}
      {suffix}
    </span>
  );
};

// ============================================================
// PROGRESS BAR COMPONENT
// ============================================================
const ProgressBar = ({ paid, total, size = "md" }) => {
  const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className="w-full">
      <div
        className={`w-full bg-slate-100 rounded-full ${heights[size]} overflow-hidden`}
      >
        <div
          className={`${heights[size]} rounded-full transition-all duration-700 ease-out ${
            percentage >= 80
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
              : percentage >= 40
                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                : "bg-gradient-to-r from-red-400 to-rose-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {size !== "sm" && (
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400 font-medium">
            {percentage.toFixed(1)}% collected
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            {(total - paid).toFixed(2)} remaining
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  colorClass,
  borderColor,
  bgColor,
}) => (
  <div
    className={`${bgColor} rounded-2xl shadow-sm border ${borderColor} p-5 hover:shadow-md transition-all duration-300 group`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`w-10 h-10 rounded-xl ${colorClass} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
        {label}
      </p>
    </div>
    <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
      {value}
    </p>
    {subValue && (
      <p className="text-[10px] text-slate-400 mt-1 font-medium">{subValue}</p>
    )}
  </div>
);

// ============================================================
// EMPLOYEE CARD COMPONENT (Collapsed)
// ============================================================
const EmployeeCard = ({ emp, isExpanded, onToggle, rank, activeType }) => {
  const config = SERVICE_TYPES[activeType] || SERVICE_TYPES.residence;
  const collectionRate =
    emp.totalDue > 0 ? (emp.totalPaid / emp.totalDue) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
        isExpanded
          ? `${config.lightBorder} shadow-lg ring-1 ring-${config.color}-100`
          : "border-slate-200 hover:shadow-md hover:border-slate-300"
      }`}
    >
      {/* Header / Summary Row */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 hover:bg-slate-50/50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          {/* Left Section: Rank + Avatar + Name */}
          <div className="flex items-center gap-4">
            {/* Rank Badge */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                rank === 1
                  ? "bg-red-100 text-red-700"
                  : rank === 2
                    ? "bg-orange-100 text-orange-700"
                    : rank === 3
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              #{rank}
            </div>

            {/* Avatar */}
            <div
              className={`w-12 h-12 rounded-xl ${config.lightBg} flex items-center justify-center shadow-sm`}
            >
              <span className={`text-lg font-bold ${config.lightText}`}>
                {emp.workerName.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Name & Meta */}
            <div>
              <p className="text-sm font-bold text-slate-800 mb-0.5">
                {emp.workerName}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {emp.count} vehicle{emp.count !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {collectionRate.toFixed(1)}% collected
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Amounts */}
          <div className="flex items-center gap-5">
            {/* Mini Progress */}
            <div className="hidden lg:block w-32">
              <ProgressBar
                paid={emp.totalPaid}
                total={emp.totalDue}
                size="sm"
              />
            </div>

            {/* Amount Cards */}
            <div className="flex items-center gap-4">
              <div className="text-right min-w-[80px]">
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                  Total Due
                </p>
                <p className="text-sm font-extrabold text-orange-600 tabular-nums">
                  {emp.totalDue.toFixed(2)}
                </p>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-[9px] font-bold text-green-400 uppercase tracking-wider">
                  Paid
                </p>
                <p className="text-sm font-extrabold text-green-600 tabular-nums">
                  {emp.totalPaid.toFixed(2)}
                </p>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">
                  Balance
                </p>
                <p className="text-sm font-extrabold text-red-600 tabular-nums">
                  {emp.totalBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Chevron */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isExpanded
                  ? `${config.lightBg} ${config.lightText}`
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Detail Section */}
      {isExpanded && (
        <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
          {/* Worker Stats Bar */}
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Due:{" "}
                    <span className="text-orange-600">
                      {emp.totalDue.toFixed(2)} AED
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Paid:{" "}
                    <span className="text-green-600">
                      {emp.totalPaid.toFixed(2)} AED
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Balance:{" "}
                    <span className="text-red-600">
                      {emp.totalBalance.toFixed(2)} AED
                    </span>
                  </span>
                </div>
              </div>
              <div className="w-48">
                <ProgressBar
                  paid={emp.totalPaid}
                  total={emp.totalDue}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Payment Detail Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Sl
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Parking
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3" /> Reg No
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3" /> Building
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" /> Total Due
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-green-400 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <AlertCircle className="w-3 h-3" /> Balance
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due Date
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Mobile
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {emp.payments.map((p, idx) => {
                  const due = Number(p.total_amount || 0);
                  const paid = Number(p.amount_paid || 0);
                  const balance = due - paid;
                  return (
                    <tr
                      key={p._id || idx}
                      className="hover:bg-blue-50/30 transition-colors duration-150"
                    >
                      <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.vehicle?.parking_no || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {p.vehicle?.registration_no || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-slate-600 font-medium">
                          {p.building?.name ||
                            p.customer?.building?.name ||
                            p.mall?.name ||
                            "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs font-bold text-orange-600 tabular-nums">
                          {due.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs font-bold text-green-600 tabular-nums">
                          {paid.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            balance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-slate-500 font-medium">
                          {formatDueDate(p)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-slate-500">
                          {p.customer?.mobile || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${
                            p.status === "pending"
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : p.status === "completed"
                                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {p.status === "pending" && (
                            <Clock className="w-2.5 h-2.5 mr-1" />
                          )}
                          {p.status === "completed" && (
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          )}
                          {(p.status || "-").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer Total Row */}
              <tfoot>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Total for {emp.workerName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-extrabold text-orange-700 tabular-nums">
                      {emp.totalDue.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-extrabold text-green-700 tabular-nums">
                      {emp.totalPaid.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-extrabold text-red-700 tabular-nums">
                      {emp.totalBalance.toFixed(2)}
                    </span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const EmployeeWisePayments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const { buildings } = useSelector((state) => state.building);
  const { workers } = useSelector((state) => state.worker);
  const { malls } = useSelector((state) => state.mall);

  // Active service type (toggle)
  const initialType = searchParams.get("type") || "residence";
  const [activeType, setActiveType] = useState(
    Object.keys(SERVICE_TYPES).includes(initialType)
      ? initialType
      : "residence",
  );

  // Data & UI state
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [allPayments, setAllPayments] = useState([]);
  const [expandedWorker, setExpandedWorker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("balance_desc");
  const [filterMode, setFilterMode] = useState("month");

  // Page for lazy rendering
  const [visibleCount, setVisibleCount] = useState(20);
  const listRef = useRef(null);

  const today = new Date();
  const [filters, setFilters] = useState({
    building: searchParams.get("building") || "all",
    mall: searchParams.get("mall") || "all",
    worker: searchParams.get("worker") || "all",
    month: Number(searchParams.get("month")) || today.getMonth() + 1,
    year: Number(searchParams.get("year")) || today.getFullYear(),
    startDate:
      searchParams.get("startDate") ||
      new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
    endDate:
      searchParams.get("endDate") ||
      new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(),
  });

  // ==============================
  // EFFECTS
  // ==============================
  useEffect(() => {
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    dispatch(fetchMalls({ page: 1, limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    fetchAllPending();
    setExpandedWorker(null);
    setVisibleCount(20);
    // eslint-disable-next-line
  }, [filters, filterMode, activeType]);

  // Update URL when type changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("type", activeType);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line
  }, [activeType]);

  // Lazy load on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 400) {
        setVisibleCount((prev) => prev + 15);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ==============================
  // DATA FETCHING
  // ==============================
  const getDateRangeParams = useCallback(() => {
    if (filterMode === "date_range") {
      return toCalendarRange(filters.startDate, filters.endDate);
    }
    const first = new Date(filters.year, filters.month - 1, 1);
    const last = new Date(filters.year, filters.month, 0);
    return toCalendarRange(
      first.toISOString().split("T")[0],
      last.toISOString().split("T")[0],
    );
  }, [filterMode, filters]);

  const fetchAllPending = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeParams();
      const serviceConfig = SERVICE_TYPES[activeType];

      let fetchedData = [];

      if (activeType === "onewash") {
        // For ONE WASH: Fetch from onewash collection (separate model)
        const query = {
          startDate,
          endDate,
          // Note: Onewash records don't have "pending" status - they're created as completed when wash is done
          // So we fetch all washes in the date range
        };

        // Mall filter (for onewash which includes mall)
        if (filters.mall && filters.mall !== "all") {
          query.mall = filters.mall;
        }

        // Building filter
        if (filters.building && filters.building !== "all") {
          query.building = filters.building;
        }

        // Worker filter
        if (filters.worker && filters.worker !== "all") {
          query.worker = filters.worker;
        }

        const response = await oneWashService.list(1, 10000, "", query);

        // Transform onewash data to match payment structure for consistent processing
        fetchedData = (response.data || []).map((wash) => ({
          ...wash,
          total_amount: wash.amount || 0, // Onewash has 'amount' field
          amount_paid: wash.amount || 0, // For onewash, amount paid = amount (paid on spot)
          balance: 0, // Onewash are paid in full
          status: wash.status || "completed",
          worker: wash.worker,
          building: wash.building,
          mall: wash.mall,
          vehicle: {
            registration_no: wash.vehicle_no || wash.vehicleNo,
            parking_no: wash.parking_no,
          },
          customer: {
            mobile: wash.mobile,
          },
          billing_month: null, // Onewash don't have billing months
          createdAt: wash.date || wash.createdAt,
        }));
      } else {
        // For RESIDENCE: Fetch from payments collection
        const query = {
          startDate,
          endDate,
          status: "pending",
          onewash: serviceConfig.onewash,
        };

        // Building filter
        if (filters.building && filters.building !== "all") {
          query.building = filters.building;
        }

        // Worker filter
        if (filters.worker && filters.worker !== "all") {
          query.worker = filters.worker;
        }

        const response = await paymentService.list(1, 10000, "", query);
        fetchedData = response.data || [];
      }

      setAllPayments(fetchedData);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // DATA PROCESSING
  // ==============================
  const employeeData = useMemo(() => {
    const map = {};
    allPayments.forEach((p) => {
      const wId = p.worker?._id || p.worker || "unassigned";
      const wName = p.worker?.name || "Unassigned";
      if (!map[wId]) {
        map[wId] = {
          workerId: wId,
          workerName: wName,
          totalDue: 0,
          totalPaid: 0,
          totalBalance: 0,
          count: 0,
          payments: [],
          buildings: new Set(),
        };
      }
      const due = Number(p.total_amount || 0);
      const paid = Number(p.amount_paid || 0);
      map[wId].totalDue += due;
      map[wId].totalPaid += paid;
      map[wId].totalBalance += due - paid;
      map[wId].count++;
      map[wId].payments.push(p);
      const bName =
        p.building?.name || p.customer?.building?.name || p.mall?.name;
      if (bName) map[wId].buildings.add(bName);
    });

    let result = Object.values(map).map((e) => ({
      ...e,
      buildings: Array.from(e.buildings),
    }));

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.workerName.toLowerCase().includes(term) ||
          e.buildings.some((b) => b.toLowerCase().includes(term)),
      );
    }

    // Sorting
    const [field, dir] = sortBy.split("_");
    const multiplier = dir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (field) {
        case "balance":
          return (a.totalBalance - b.totalBalance) * multiplier;
        case "due":
          return (a.totalDue - b.totalDue) * multiplier;
        case "name":
          return a.workerName.localeCompare(b.workerName) * multiplier;
        case "count":
          return (a.count - b.count) * multiplier;
        default:
          return (a.totalBalance - b.totalBalance) * multiplier;
      }
    });

    return result;
  }, [allPayments, searchTerm, sortBy]);

  // Grand totals
  const grandTotals = useMemo(() => {
    return employeeData.reduce(
      (acc, e) => ({
        totalDue: acc.totalDue + e.totalDue,
        totalPaid: acc.totalPaid + e.totalPaid,
        totalBalance: acc.totalBalance + e.totalBalance,
        count: acc.count + e.count,
        vehicles: acc.vehicles + e.count,
      }),
      { totalDue: 0, totalPaid: 0, totalBalance: 0, count: 0, vehicles: 0 },
    );
  }, [employeeData]);

  const collectionRate =
    grandTotals.totalDue > 0
      ? ((grandTotals.totalPaid / grandTotals.totalDue) * 100).toFixed(1)
      : "0.0";

  // Visible slice for lazy rendering
  const visibleEmployees = employeeData.slice(0, visibleCount);

  // ==============================
  // FILTER HANDLERS
  // ==============================
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateRangeChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    setSearchTerm("");
    setExpandedWorker(null);
    setFilters((prev) => ({
      ...prev,
      building: "all",
      mall: "all",
      worker: "all",
    }));
  };

  // ==============================
  // DROPDOWN OPTIONS
  // ==============================
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const yearOptions = [2024, 2025, 2026, 2027].map((y) => ({
    value: y,
    label: String(y),
  }));

  const buildingOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Buildings" }];
    if (buildings)
      buildings.forEach((b) => opts.push({ value: b._id, label: b.name }));
    return opts;
  }, [buildings]);

  const mallOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Malls" }];
    if (malls) malls.forEach((m) => opts.push({ value: m._id, label: m.name }));
    return opts;
  }, [malls]);

  const workerOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Workers" }];
    if (!workers) return opts;
    let filteredList = workers;
    if (filters.building && filters.building !== "all") {
      filteredList = workers.filter((w) => {
        if (Array.isArray(w.buildings)) {
          return w.buildings.some(
            (b) => (typeof b === "string" ? b : b._id) === filters.building,
          );
        }
        return false;
      });
    }
    filteredList.forEach((w) => opts.push({ value: w._id, label: w.name }));
    return opts;
  }, [workers, filters.building]);

  const sortOptions = SORT_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  // ==============================
  // EXPORT: EXCEL
  // ==============================
  const handleExportExcel = async () => {
    if (employeeData.length === 0) {
      toast.error("No data to export");
      return;
    }
    setExcelLoading(true);
    const toastId = toast.loading("Generating Excel...");
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "BCW Admin";
      workbook.created = new Date();

      const config = SERVICE_TYPES[activeType];
      const typeName = config.label;

      // ---- SUMMARY SHEET ----
      const summary = workbook.addWorksheet("Employee Summary");
      summary.columns = [
        { header: "Sl No", key: "sl", width: 8 },
        { header: "Employee Name", key: "name", width: 28 },
        { header: "Total Vehicles", key: "count", width: 15 },
        { header: "Total Due (AED)", key: "due", width: 20 },
        { header: "Total Paid (AED)", key: "paid", width: 20 },
        { header: "Balance (AED)", key: "balance", width: 20 },
        { header: "Collection %", key: "rate", width: 14 },
        { header: "Buildings/Malls", key: "locations", width: 30 },
      ];

      // Style header
      const hdr = summary.getRow(1);
      hdr.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      hdr.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A5F" },
      };
      hdr.alignment = { vertical: "middle", horizontal: "center" };
      hdr.height = 28;

      employeeData.forEach((e, i) => {
        const rate =
          e.totalDue > 0
            ? ((e.totalPaid / e.totalDue) * 100).toFixed(1)
            : "0.0";
        const row = summary.addRow({
          sl: i + 1,
          name: e.workerName,
          count: e.count,
          due: e.totalDue,
          paid: e.totalPaid,
          balance: e.totalBalance,
          rate: rate + "%",
          locations: e.buildings.join(", "),
        });
        row.getCell("due").numFmt = "#,##0.00";
        row.getCell("paid").numFmt = "#,##0.00";
        row.getCell("balance").numFmt = "#,##0.00";
        row.alignment = { vertical: "middle" };

        // Highlight high balance rows
        if (e.totalBalance > 500) {
          row.getCell("balance").font = {
            bold: true,
            color: { argb: "FFCC0000" },
          };
        }
      });

      // Grand total row
      const totalRow = summary.addRow({
        sl: "",
        name: "GRAND TOTAL",
        count: grandTotals.vehicles,
        due: grandTotals.totalDue,
        paid: grandTotals.totalPaid,
        balance: grandTotals.totalBalance,
        rate: collectionRate + "%",
        locations: "",
      });
      totalRow.font = { bold: true, size: 11 };
      totalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
      };
      totalRow.getCell("due").numFmt = "#,##0.00";
      totalRow.getCell("paid").numFmt = "#,##0.00";
      totalRow.getCell("balance").numFmt = "#,##0.00";

      // Auto-filter
      summary.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: employeeData.length + 1, column: 8 },
      };

      // ---- PER-WORKER DETAIL SHEETS ----
      employeeData.forEach((e) => {
        const sheetName = (e.workerName || "Unknown")
          .substring(0, 28)
          .replace(/[[\]*?/\\]/g, "");
        const sheet = workbook.addWorksheet(sheetName);

        sheet.columns = [
          { header: "Sl", key: "sl", width: 6 },
          { header: "Parking No", key: "parking", width: 14 },
          { header: "Reg No", key: "regNo", width: 18 },
          { header: "Building/Mall", key: "building", width: 22 },
          { header: "Total Due (AED)", key: "due", width: 16 },
          { header: "Paid (AED)", key: "paid", width: 16 },
          { header: "Balance (AED)", key: "balance", width: 16 },
          { header: "Due Date", key: "dueDate", width: 14 },
          { header: "Customer Mobile", key: "mobile", width: 16 },
          { header: "Status", key: "status", width: 12 },
        ];

        const shdr = sheet.getRow(1);
        shdr.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        shdr.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2E7D32" },
        };
        shdr.alignment = { vertical: "middle", horizontal: "center" };
        shdr.height = 24;

        e.payments.forEach((p, i) => {
          const due = Number(p.total_amount || 0);
          const paid = Number(p.amount_paid || 0);
          const row = sheet.addRow({
            sl: i + 1,
            parking: p.vehicle?.parking_no || "-",
            regNo: p.vehicle?.registration_no || "-",
            building:
              p.building?.name ||
              p.customer?.building?.name ||
              p.mall?.name ||
              "-",
            due,
            paid,
            balance: due - paid,
            dueDate: formatDueDate(p),
            mobile: p.customer?.mobile || "-",
            status: (p.status || "-").toUpperCase(),
          });
          row.getCell("due").numFmt = "#,##0.00";
          row.getCell("paid").numFmt = "#,##0.00";
          row.getCell("balance").numFmt = "#,##0.00";
          row.alignment = { vertical: "middle" };
        });

        // Sheet total row
        const stRow = sheet.addRow({
          sl: "",
          parking: "",
          regNo: "",
          building: "TOTAL",
          due: e.totalDue,
          paid: e.totalPaid,
          balance: e.totalBalance,
          dueDate: "",
          mobile: "",
          status: "",
        });
        stRow.font = { bold: true };
        stRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
        stRow.getCell("due").numFmt = "#,##0.00";
        stRow.getCell("paid").numFmt = "#,##0.00";
        stRow.getCell("balance").numFmt = "#,##0.00";
      });

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        "Employee_Wise_" +
        typeName +
        "_Pending_" +
        filters.month +
        "_" +
        filters.year +
        ".xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel exported — " + employeeData.length + " employees", {
        id: toastId,
      });
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Export failed", { id: toastId });
    } finally {
      setExcelLoading(false);
    }
  };

  // ==============================
  // EXPORT: PDF
  // ==============================
  const handleExportPDF = async () => {
    if (employeeData.length === 0) {
      toast.error("No data to export");
      return;
    }
    setPdfLoading(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const config = SERVICE_TYPES[activeType];
      const typeName = config.label;
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Wise Pending — " + typeName, 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const monthLabel = monthOptions.find((m) => m.value === filters.month);
      const periodText =
        filterMode === "month"
          ? (monthLabel ? monthLabel.label : "") + " " + filters.year
          : new Date(filters.startDate).toLocaleDateString() +
            " - " +
            new Date(filters.endDate).toLocaleDateString();
      doc.text(
        "Period: " +
          periodText +
          " | Generated: " +
          new Date().toLocaleString(),
        14,
        21,
      );

      // Summary table
      const summaryHead = [
        [
          "#",
          "Employee",
          "Vehicles",
          "Total Due",
          "Paid",
          "Balance",
          "Collection %",
        ],
      ];
      const summaryBody = employeeData.map((e, i) => {
        const rate =
          e.totalDue > 0
            ? ((e.totalPaid / e.totalDue) * 100).toFixed(1)
            : "0.0";
        return [
          i + 1,
          e.workerName,
          e.count,
          e.totalDue.toFixed(2),
          e.totalPaid.toFixed(2),
          e.totalBalance.toFixed(2),
          rate + "%",
        ];
      });

      // Grand total
      summaryBody.push([
        "",
        "GRAND TOTAL",
        grandTotals.vehicles,
        grandTotals.totalDue.toFixed(2),
        grandTotals.totalPaid.toFixed(2),
        grandTotals.totalBalance.toFixed(2),
        collectionRate + "%",
      ]);

      autoTable(doc, {
        startY: 26,
        head: summaryHead,
        body: summaryBody,
        theme: "grid",
        headStyles: {
          fillColor: [30, 58, 95],
          textColor: 255,
          fontSize: 8,
          halign: "center",
          cellPadding: 2,
        },
        bodyStyles: { fontSize: 7.5, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 50 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
          4: { cellWidth: 30, halign: "right" },
          5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 25, halign: "center" },
        },
        didParseCell: (data) => {
          // Style grand total row
          if (data.row.index === summaryBody.length - 1) {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Per-worker detail pages
      employeeData.forEach((e) => {
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(e.workerName, 14, 15);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(
          "Vehicles: " +
            e.count +
            " | Due: " +
            e.totalDue.toFixed(2) +
            " AED | Paid: " +
            e.totalPaid.toFixed(2) +
            " AED | Balance: " +
            e.totalBalance.toFixed(2) +
            " AED",
          14,
          21,
        );

        const detailHead = [
          [
            "#",
            "Parking",
            "Reg No",
            "Building/Mall",
            "Due",
            "Paid",
            "Balance",
            "Due Date",
            "Mobile",
            "Status",
          ],
        ];
        const detailBody = e.payments.map((p, i) => {
          const due = Number(p.total_amount || 0);
          const paid = Number(p.amount_paid || 0);
          return [
            i + 1,
            p.vehicle?.parking_no || "-",
            p.vehicle?.registration_no || "-",
            p.building?.name ||
              p.customer?.building?.name ||
              p.mall?.name ||
              "-",
            due.toFixed(2),
            paid.toFixed(2),
            (due - paid).toFixed(2),
            formatDueDate(p),
            p.customer?.mobile || "-",
            (p.status || "-").toUpperCase(),
          ];
        });

        autoTable(doc, {
          startY: 25,
          head: detailHead,
          body: detailBody,
          theme: "grid",
          headStyles: {
            fillColor: [46, 125, 50],
            textColor: 255,
            fontSize: 7,
            halign: "center",
            cellPadding: 1.5,
          },
          bodyStyles: { fontSize: 6.5, cellPadding: 1.2 },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 18 },
            2: { cellWidth: 24 },
            3: { cellWidth: 30 },
            4: { cellWidth: 22, halign: "right", fontStyle: "bold" },
            5: { cellWidth: 22, halign: "right" },
            6: { cellWidth: 22, halign: "right", fontStyle: "bold" },
            7: { cellWidth: 22 },
            8: { cellWidth: 24 },
            9: { cellWidth: 18, halign: "center" },
          },
        });
      });

      doc.save(
        "Employee_Wise_" +
          typeName +
          "_Pending_" +
          filters.month +
          "_" +
          filters.year +
          ".pdf",
      );
      toast.success("PDF exported — " + (employeeData.length + 1) + " pages", {
        id: toastId,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF export failed", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  // ==============================
  // RENDER
  // ==============================
  const activeConfig = SERVICE_TYPES[activeType];
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6 font-sans">
      {/* =========================================== */}
      {/* HEADER SECTION                              */}
      {/* =========================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:shadow-md transition-all duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ActiveIcon className={"w-6 h-6 " + activeConfig.lightText} />
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
                Employee Wise Checking
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {activeConfig.description} — grouped by employee
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllPending}
            disabled={loading}
            className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={"w-3.5 h-3.5 " + (loading ? "animate-spin" : "")}
            />{" "}
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            disabled={excelLoading || loading}
            className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 text-xs"
          >
            {excelLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading || loading}
            className="h-9 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 text-xs"
          >
            {pdfLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* =========================================== */}
      {/* SERVICE TYPE TOGGLE                         */}
      {/* =========================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <ChevronsUpDown className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Service Type
            </span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {Object.entries(SERVICE_TYPES).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = activeType === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTypeChange(key)}
                  className={
                    "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 " +
                    (isActive
                      ? "bg-gradient-to-r " +
                        cfg.gradient +
                        " text-white shadow-md scale-[1.02]"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/60")
                  }
                >
                  <Icon
                    className={"w-4 h-4 " + (isActive ? "text-white" : "")}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================== */}
      {/* FILTERS SECTION                             */}
      {/* =========================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Filters & Search
            </span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode("date_range")}
              className={
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all " +
                (filterMode === "date_range"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              Date Range
            </button>
            <button
              onClick={() => setFilterMode("month")}
              className={
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all " +
                (filterMode === "month"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              Month Wise
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          {/* Date / Month Filter */}
          <div className="lg:col-span-2">
            {filterMode === "date_range" ? (
              <RichDateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={handleDateRangeChange}
              />
            ) : (
              <div className="flex gap-3">
                <div className="flex-1">
                  <CustomDropdown
                    label="Month"
                    value={filters.month}
                    onChange={(v) => handleFilterChange("month", Number(v))}
                    options={monthOptions}
                    icon={Calendar}
                  />
                </div>
                <div className="w-32">
                  <CustomDropdown
                    label="Year"
                    value={filters.year}
                    onChange={(v) => handleFilterChange("year", Number(v))}
                    options={yearOptions}
                    icon={Calendar}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Building Filter */}
          <div>
            <CustomDropdown
              label="Building"
              value={filters.building}
              onChange={(v) => handleFilterChange("building", v)}
              options={buildingOptions}
              icon={Building}
              searchable
            />
          </div>

          {/* Mall Filter (for onewash which includes mall) */}
          {activeType === "onewash" && (
            <div>
              <CustomDropdown
                label="Mall"
                value={filters.mall}
                onChange={(v) => handleFilterChange("mall", v)}
                options={mallOptions}
                icon={ShoppingBag}
                searchable
              />
            </div>
          )}

          {/* Worker Filter */}
          <div>
            <CustomDropdown
              label="Worker"
              value={filters.worker}
              onChange={(v) => handleFilterChange("worker", v)}
              options={workerOptions}
              icon={Users}
              searchable
            />
          </div>

          {/* Sort */}
          <div>
            <CustomDropdown
              label="Sort By"
              value={sortBy}
              onChange={(v) => setSortBy(v)}
              options={sortOptions}
              icon={ArrowUpDown}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name or building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================== */}
      {/* SUMMARY STATS CARDS                         */}
      {/* =========================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={employeeData.length}
          subValue={grandTotals.vehicles + " vehicles total"}
          colorClass="text-indigo-500"
          borderColor="border-indigo-100"
          bgColor="bg-white"
        />
        <StatCard
          icon={DollarSign}
          label="Total Due"
          value={
            <AnimatedNumber
              value={grandTotals.totalDue}
              className="text-2xl font-extrabold text-slate-800 tabular-nums"
            />
          }
          subValue="AED"
          colorClass="text-orange-500"
          borderColor="border-orange-100"
          bgColor="bg-white"
        />
        <StatCard
          icon={Banknote}
          label="Total Paid"
          value={
            <AnimatedNumber
              value={grandTotals.totalPaid}
              className="text-2xl font-extrabold text-slate-800 tabular-nums"
            />
          }
          subValue="AED"
          colorClass="text-green-500"
          borderColor="border-green-100"
          bgColor="bg-white"
        />
        <StatCard
          icon={Wallet}
          label="Total Balance"
          value={
            <AnimatedNumber
              value={grandTotals.totalBalance}
              className="text-2xl font-extrabold text-slate-800 tabular-nums"
            />
          }
          subValue="AED"
          colorClass="text-red-500"
          borderColor="border-red-100"
          bgColor="bg-white"
        />
        <StatCard
          icon={TrendingUp}
          label="Collection Rate"
          value={collectionRate + "%"}
          subValue={
            Number(collectionRate) >= 80
              ? "Good performance"
              : Number(collectionRate) >= 50
                ? "Needs improvement"
                : "Critical — follow up"
          }
          colorClass={
            Number(collectionRate) >= 80
              ? "text-green-500"
              : Number(collectionRate) >= 50
                ? "text-amber-500"
                : "text-red-500"
          }
          borderColor={
            Number(collectionRate) >= 80
              ? "border-green-100"
              : Number(collectionRate) >= 50
                ? "border-amber-100"
                : "border-red-100"
          }
          bgColor="bg-white"
        />
        <StatCard
          icon={BarChart3}
          label="Avg Per Employee"
          value={
            employeeData.length > 0
              ? (grandTotals.totalBalance / employeeData.length).toFixed(2)
              : "0.00"
          }
          subValue="AED balance/employee"
          colorClass="text-purple-500"
          borderColor="border-purple-100"
          bgColor="bg-white"
        />
      </div>

      {/* Grand Progress Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className={"w-4 h-4 " + activeConfig.lightText} />
            <span className="text-xs font-bold text-slate-700">
              Overall Collection Progress
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              Collected:{" "}
              <span className="font-bold text-green-600">
                {grandTotals.totalPaid.toFixed(2)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Remaining:{" "}
              <span className="font-bold text-red-600">
                {grandTotals.totalBalance.toFixed(2)}
              </span>
            </span>
          </div>
        </div>
        <ProgressBar
          paid={grandTotals.totalPaid}
          total={grandTotals.totalDue}
          size="lg"
        />
      </div>

      {/* =========================================== */}
      {/* EMPLOYEE LIST                               */}
      {/* =========================================== */}
      <div ref={listRef}>
        {/* Results Count Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {Math.min(visibleCount, employeeData.length)} of{" "}
              {employeeData.length} employees
            </span>
            {searchTerm && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                Filtered: "{searchTerm}"
              </span>
            )}
          </div>
          {employeeData.length > 0 && (
            <button
              onClick={() =>
                setExpandedWorker(expandedWorker === "all" ? null : "all")
              }
              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              {expandedWorker === "all" ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Expand All
                </>
              )}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <Loader2
              className={
                "w-10 h-10 animate-spin " +
                activeConfig.lightText +
                " mx-auto mb-4"
              }
            />
            <p className="text-sm font-bold text-slate-500">
              Loading employee data...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Fetching {activeConfig.label.toLowerCase()} pending payments
            </p>
          </div>
        ) : employeeData.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div
              className={
                "w-16 h-16 rounded-2xl " +
                activeConfig.lightBg +
                " flex items-center justify-center mx-auto mb-4"
              }
            >
              <ActiveIcon className={"w-8 h-8 " + activeConfig.lightText} />
            </div>
            <p className="text-lg font-bold text-slate-600 mb-1">
              No Pending Payments Found
            </p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              There are no pending {activeConfig.label.toLowerCase()} payments
              for the selected period. Try changing the month or filters.
            </p>
          </div>
        ) : (
          /* Employee Cards */
          <div className="space-y-3">
            {visibleEmployees.map((emp, index) => (
              <EmployeeCard
                key={emp.workerId}
                emp={emp}
                rank={index + 1}
                activeType={activeType}
                isExpanded={
                  expandedWorker === "all" || expandedWorker === emp.workerId
                }
                onToggle={() =>
                  setExpandedWorker(
                    expandedWorker === emp.workerId ? null : emp.workerId,
                  )
                }
              />
            ))}

            {/* Load More Indicator */}
            {visibleCount < employeeData.length && (
              <div className="text-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Scroll down for more... ({employeeData.length - visibleCount}{" "}
                  remaining)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================== */}
      {/* FOOTER SUMMARY                              */}
      {/* =========================================== */}
      {!loading && employeeData.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white/80" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  {activeConfig.label} Summary
                </p>
                <p className="text-sm font-bold">
                  {employeeData.length} employees | {grandTotals.vehicles}{" "}
                  vehicles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-orange-300 uppercase">
                  Total Due
                </p>
                <p className="text-lg font-extrabold tabular-nums">
                  {grandTotals.totalDue.toFixed(2)}
                </p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-green-300 uppercase">
                  Collected
                </p>
                <p className="text-lg font-extrabold tabular-nums">
                  {grandTotals.totalPaid.toFixed(2)}
                </p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-red-300 uppercase">
                  Balance
                </p>
                <p className="text-lg font-extrabold tabular-nums">
                  {grandTotals.totalBalance.toFixed(2)}
                </p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-blue-300 uppercase">
                  Collection
                </p>
                <p className="text-lg font-extrabold tabular-nums">
                  {collectionRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeWisePayments;
