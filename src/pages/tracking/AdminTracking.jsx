import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  RefreshCw,
  Eye,
  Mouse,
  MousePointer,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  LogIn,
  LogOut,
  ChevronDown,
  Navigation,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  Layers,
  BarChart2,
  TrendingUp,
  TrendingDown,
  User,
  Hash,
  Link2,
  FileText,
  Timer,
  Search,
  MessageSquare,
  ChevronRight,
  MoreHorizontal,
  LayoutDashboard,
  Shield,
  Filter,
  Download,
  Upload,
  Settings,
  PlusCircle,
  Edit,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  Tablet,
} from "lucide-react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

/* ─── Activity type styling map (admin-specific) ─────────────────────────── */
const typeConfig = {
  login: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: LogIn,
    label: "Login",
  },
  logout: {
    color: "bg-red-100 text-red-600 border-red-200",
    icon: LogOut,
    label: "Logout",
  },
  page_view: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Eye,
    label: "Page View",
  },
  screen_view: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Eye,
    label: "Screen View",
  },
  scroll: {
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Mouse,
    label: "Scroll",
  },
  button_click: {
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: MousePointer,
    label: "Button Click",
  },
  navigation: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Navigation,
    label: "Navigation",
  },
  form_submit: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: FileText,
    label: "Form Submit",
  },
  search: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Search,
    label: "Search",
  },
  filter: {
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: Filter,
    label: "Filter",
  },
  modal_open: {
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: Maximize2,
    label: "Modal Open",
  },
  modal_close: {
    color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    icon: Minimize2,
    label: "Modal Close",
  },
  data_export: {
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: Download,
    label: "Data Export",
  },
  data_import: {
    color: "bg-lime-100 text-lime-700 border-lime-200",
    icon: Upload,
    label: "Data Import",
  },
  create: {
    color: "bg-green-100 text-green-700 border-green-200",
    icon: PlusCircle,
    label: "Create",
  },
  update: {
    color: "bg-sky-100 text-sky-700 border-sky-200",
    icon: Edit,
    label: "Update",
  },
  delete: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: Trash2,
    label: "Delete",
  },
  settings_change: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Settings,
    label: "Settings Change",
  },
  tab_focus: {
    color: "bg-green-50 text-green-600 border-green-200",
    icon: Eye,
    label: "Tab Focus",
  },
  tab_blur: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: Eye,
    label: "Tab Blur",
  },
  idle_start: {
    color: "bg-stone-100 text-stone-600 border-stone-200",
    icon: Clock,
    label: "Idle Start",
  },
  idle_end: {
    color: "bg-stone-100 text-stone-700 border-stone-200",
    icon: Clock,
    label: "Idle End",
  },
  session_timeout: {
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Clock,
    label: "Session Timeout",
  },
  session_resume: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Activity,
    label: "Session Resume",
  },
  screen_time: {
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: Timer,
    label: "Screen Time",
  },
  other: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: MoreHorizontal,
    label: "Other",
  },
};

/* ─── Helper components ───────────────────────────────────────────────────── */
const ActivityBadge = ({ type }) => {
  const cfg = typeConfig[type] || {
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Activity,
    label: type,
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label || type?.replace(/_/g, " ")}
    </span>
  );
};

const MiniBar = ({ value, max, color = "bg-violet-500", className = "" }) => (
  <div
    className={`flex-1 bg-slate-100 rounded-full h-2 overflow-hidden ${className}`}
  >
    <div
      className={`h-full rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }}
    />
  </div>
);

const SectionHeader = ({
  icon: Icon,
  title,
  color = "text-violet-500",
  badge,
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className={`w-5 h-5 ${color}`} />
    <h3 className="font-semibold text-slate-700">{title}</h3>
    {badge !== undefined && (
      <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </div>
);

const Card = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className}`}
  >
    {children}
  </motion.div>
);

const EmptyState = ({ text }) => (
  <p className="text-slate-400 text-sm text-center py-6">{text}</p>
);

/* ─── Heatmap ────────────────────────────────────────────────────────────── */
const HourHeatmap = ({ data }) => {
  const map = {};
  data.forEach((d) => (map[d._id] = d.count));
  const maxVal = Math.max(...Object.values(map), 1);
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: 24 }, (_, h) => {
        const cnt = map[h] || 0;
        const i = cnt / maxVal;
        const bg =
          i === 0
            ? "bg-slate-100"
            : i < 0.25
              ? "bg-violet-200"
              : i < 0.5
                ? "bg-violet-400"
                : i < 0.75
                  ? "bg-violet-600"
                  : "bg-violet-800";
        return (
          <div
            key={h}
            title={`${h}:00 — ${cnt} events`}
            className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center cursor-default`}
          >
            <span className="text-[9px] font-bold text-white/90">{h}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Mini day bar chart ─────────────────────────────────────────────────── */
const DayChart = ({ data }) => {
  if (!data.length) return <EmptyState text="No data" />;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((d) => (
        <div
          key={d._id}
          className="flex-1 flex flex-col items-center gap-0.5 group"
          title={`${d._id}: ${d.count}`}
        >
          <div
            className="w-full bg-gradient-to-t from-violet-500 to-purple-400 rounded-t transition-all duration-700 min-h-[2px]"
            style={{ height: `${(d.count / max) * 64}px` }}
          />
        </div>
      ))}
    </div>
  );
};

/* ─── URL Table row ──────────────────────────────────────────────────────── */
const URLRow = ({ rank, title, path, count, duration, maxCount }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0 mt-0.5">
      #{rank}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-700 truncate">
        {title || "Unknown Page"}
      </p>
      <p className="text-xs text-violet-500 truncate flex items-center gap-1 mt-0.5">
        <Link2 className="w-3 h-3 flex-shrink-0" />
        {path || "/"}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <MiniBar value={count} max={maxCount} color="bg-blue-400" />
        <span className="text-xs font-semibold text-slate-500 flex-shrink-0">
          {count} hits
        </span>
        {duration > 0 && (
          <span className="text-xs text-slate-400 flex-shrink-0">
            · {Math.round(duration / 1000)}s
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({
  label,
  value,
  icon: Icon,
  gradient,
  bg,
  border,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={`${bg} border ${border} rounded-2xl p-4 shadow-sm`}
  >
    <div
      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-2 shadow-sm`}
    >
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="text-xl font-bold text-slate-800">{value ?? 0}</div>
    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const AdminTracking = () => {
  const [data, setData] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null); // null = All Devices
  // Timezone: auto-detect based on browser — Dubai (UTC+4) vs India (UTC+5:30)
  const [timezone, setTimezone] = useState(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz === "Asia/Kolkata" || tz === "Asia/Calcutta"
        ? "Asia/Kolkata"
        : "Asia/Dubai";
    } catch {
      return "Asia/Dubai";
    }
  });
  const autoRefreshRef = useRef(null);

  /* ── Fetch my tracking data ── */
  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        // Build query string
        const deviceParam = selectedDevice
          ? `&deviceId=${encodeURIComponent(selectedDevice)}`
          : "";
        let qs = `dateRange=${dateRange}&page=${page}&limit=30${deviceParam}`;
        let qsAll = `dateRange=${dateRange}&page=1&limit=500${deviceParam}`;
        if (customStartDate) {
          const extra = `&startDate=${encodeURIComponent(customStartDate)}${customEndDate ? `&endDate=${encodeURIComponent(customEndDate)}` : ""}${startTime ? `&startTime=${encodeURIComponent(startTime)}` : ""}${endTime ? `&endTime=${encodeURIComponent(endTime)}` : ""}`;
          qs = `dateRange=custom&page=${page}&limit=30${extra}${deviceParam}`;
          qsAll = `dateRange=custom&page=1&limit=500${extra}${deviceParam}`;
        }
        const [mainRes, allRes] = await Promise.all([
          api.get(`/admin-activities/my-tracking?${qs}`),
          api.get(`/admin-activities/my-tracking?${qsAll}`),
        ]);
        if (mainRes.data.status) setData(mainRes.data.data);
        if (allRes.data.status)
          setAllActivities(allRes.data.data.timeline || []);
        setLastRefreshed(new Date());
      } catch (err) {
        if (!silent) {
          toast.error(
            err.response?.data?.message || "Failed to load tracking data",
          );
        }
        console.error("[AdminTracking] fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      dateRange,
      page,
      customStartDate,
      customEndDate,
      startTime,
      endTime,
      selectedDevice,
    ],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /* ── Auto-refresh every 10 seconds ── */
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        fetchDetail(true);
      }, 10000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh, fetchDetail]);

  /* ── Helpers ── */
  const fmt = (s) => {
    if (!s && s !== 0) return "—";
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${(s / 3600).toFixed(1)}h`;
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          timeZone: timezone,
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const fmtTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString("en-IN", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

  const fmtMs = (ms) => {
    if (!ms) return "—";
    return `${Math.round(ms / 1000)}s`;
  };

  /* ── Derived sets from allActivities ── */
  const formSubmissions = useMemo(
    () =>
      allActivities.filter((a) =>
        ["form_submit", "search", "filter"].includes(a.activityType),
      ),
    [allActivities],
  );

  const navActivities = useMemo(
    () =>
      allActivities.filter(
        (a) =>
          ["navigation", "button_click"].includes(a.activityType) &&
          a.action?.element,
      ),
    [allActivities],
  );

  const crudActivities = useMemo(
    () =>
      allActivities.filter((a) =>
        [
          "create",
          "update",
          "delete",
          "data_export",
          "data_import",
          "settings_change",
        ].includes(a.activityType),
      ),
    [allActivities],
  );

  /* ── Page analytics ── */
  const pageAnalytics = useMemo(() => {
    const map = {};
    allActivities.forEach((a) => {
      const pagePath = a.page?.path;
      if (!pagePath) return;

      if (!map[pagePath]) {
        map[pagePath] = {
          path: pagePath,
          title: a.page?.title || pagePath,
          visits: 0,
          totalTimeSpent: 0,
          maxScrollDepth: 0,
          buttonClicks: [],
          firstVisit: a.timestamp,
          lastVisit: a.timestamp,
        };
      }
      if (
        ["page_view", "screen_view", "screen_time"].includes(a.activityType)
      ) {
        map[pagePath].visits++;
      }
      if (a.activityType === "screen_time" && a.duration) {
        map[pagePath].totalTimeSpent += a.duration;
      }
      if (a.activityType === "scroll") {
        const depth = a.scroll?.depth || a.scroll?.maxDepth || 0;
        if (depth > map[pagePath].maxScrollDepth) {
          map[pagePath].maxScrollDepth = depth;
        }
      }
      if (a.activityType === "button_click") {
        map[pagePath].buttonClicks.push({
          element: a.action?.element || "Unknown button",
          value: a.action?.value || "",
          timestamp: a.timestamp,
        });
      }
      if (new Date(a.timestamp) < new Date(map[pagePath].firstVisit)) {
        map[pagePath].firstVisit = a.timestamp;
      }
      if (new Date(a.timestamp) > new Date(map[pagePath].lastVisit)) {
        map[pagePath].lastVisit = a.timestamp;
      }
    });
    return Object.values(map).sort((a, b) => b.visits - a.visits);
  }, [allActivities]);

  /* ── URL frequency ── */
  const urlFrequency = useMemo(() => {
    const map = {};
    allActivities.forEach((a) => {
      if (!a.page?.path) return;
      const key = a.page.path;
      if (!map[key])
        map[key] = {
          path: key,
          title: a.page.title || key,
          count: 0,
          totalDuration: 0,
        };
      map[key].count++;
      if (a.duration) map[key].totalDuration += a.duration;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [allActivities]);

  /* ── Nav frequency ── */
  const navFrequency = useMemo(() => {
    const map = {};
    navActivities.forEach((a) => {
      const key = a.action?.element || a.page?.title || "Unknown";
      if (!map[key])
        map[key] = {
          element: key,
          count: 0,
          type: a.activityType,
          lastSeen: a.timestamp,
        };
      map[key].count++;
      if (new Date(a.timestamp) > new Date(map[key].lastSeen))
        map[key].lastSeen = a.timestamp;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [navActivities]);

  /* ── Session grouping ── */

  /* ── Login History — every login event with full device + location ── */
  const loginHistory = useMemo(() => {
    return allActivities
      .filter((a) => a.activityType === "login")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allActivities]);

  const sessionMap = useMemo(() => {
    const map = {};
    allActivities.forEach((a) => {
      const sid = a.sessionId || "unknown";
      if (!map[sid])
        map[sid] = {
          sessionId: sid,
          activities: [],
          start: a.timestamp,
          end: a.timestamp,
          device: a.device || null,
          location: a.location || null,
        };
      map[sid].activities.push(a);
      // Use the most recent activity's device info
      if (
        a.device &&
        (!map[sid].device || new Date(a.timestamp) > new Date(map[sid].end))
      ) {
        map[sid].device = a.device;
      }
      if (
        a.location &&
        (!map[sid].location || new Date(a.timestamp) > new Date(map[sid].end))
      ) {
        map[sid].location = a.location;
      }
      if (new Date(a.timestamp) < new Date(map[sid].start))
        map[sid].start = a.timestamp;
      if (new Date(a.timestamp) > new Date(map[sid].end))
        map[sid].end = a.timestamp;
    });
    let sessions = Object.values(map).sort(
      (a, b) => new Date(b.end) - new Date(a.end),
    );

    // Client-side device filter — ensures session list matches the selected device
    if (selectedDevice) {
      sessions = sessions.filter((s) => {
        if (!s.device) return false;
        // Match by deviceId if present
        if (s.device.deviceId === selectedDevice) return true;
        // Fallback: match browser_platform_type key for old data
        const fallbackKey = `${s.device.browser || "Unknown"}_${s.device.platform || "Unknown"}_${s.device.isMobile ? "mobile" : "desktop"}`;
        return fallbackKey === selectedDevice;
      });
    }
    return sessions;
  }, [allActivities, selectedDevice]);

  /* ── Filtered timeline ── */
  const filteredTimeline = useMemo(() => {
    if (!data?.timeline) return [];
    if (typeFilter === "all") return data.timeline;
    return data.timeline.filter((a) => a.activityType === typeFilter);
  }, [data?.timeline, typeFilter]);

  /* ── Loading / empty states ── */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading your activity analytics…</p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-600">No tracking data found.</p>
          <button
            onClick={() => fetchDetail()}
            className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const {
    admin,
    stats,
    activityBreakdown,
    activityByHour,
    activityByDay,
    topPages,
    deviceInfo,
    devices,
    timeline,
    totalPages,
  } = data;

  const maxBreakdown = Math.max(
    ...(activityBreakdown || []).map((a) => a.count),
    1,
  );
  const breakdownColors = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-red-500",
  ];

  const adminName = admin?.name || "Admin User";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ═══════════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 p-4 md:p-6 space-y-5">
      {/* ── 1. Header ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-200 flex-shrink-0">
                {initials || "?"}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-800">
                    {adminName}
                  </h1>
                  <span className="flex items-center gap-1 text-xs text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-0.5 rounded-full font-medium">
                    <Shield className="w-3 h-3" />
                    {admin?.role || "Admin"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm text-slate-500">
                  {admin?.number && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {admin.number}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    My Activity Tracking
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-slate-400">
                  {admin?._id && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      ID: {admin._id}
                    </span>
                  )}
                  {admin?.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Since: {fmtDate(admin.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {/* Live indicator */}
              {autoRefresh && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  LIVE
                  {lastRefreshed && (
                    <span className="text-emerald-500 font-normal ml-1">
                      {lastRefreshed.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  )}
                </span>
              )}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                  autoRefresh
                    ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                {autoRefresh ? "Auto 10s ON" : "Auto OFF"}
              </button>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setStartTime("");
                  setEndTime("");
                  setPage(1);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              {/* Timezone toggle */}
              <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
                <button
                  onClick={() => setTimezone("Asia/Dubai")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    timezone === "Asia/Dubai"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🇦🇪 Dubai
                </button>
                <button
                  onClick={() => setTimezone("Asia/Kolkata")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    timezone === "Asia/Kolkata"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🇮🇳 India
                </button>
              </div>
              <button
                onClick={() => fetchDetail()}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          {/* ── Custom Date Range + Time Picker Row ── */}
          <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="flex-1 min-w-[280px] max-w-xs">
              <RichDateRangePicker
                startDate={customStartDate}
                endDate={customEndDate}
                onChange={(field, value) => {
                  if (field === "startDate") {
                    setCustomStartDate(value);
                    setDateRange("custom");
                    setPage(1);
                  } else if (field === "endDate") {
                    setCustomEndDate(value);
                    if (value) setPage(1);
                  } else if (field === "clear") {
                    setCustomStartDate("");
                    setCustomEndDate("");
                    setStartTime("");
                    setEndTime("");
                    setDateRange("all");
                    setPage(1);
                  }
                }}
              />
            </div>

            {/* Time range inputs */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (customStartDate) setPage(1);
                  }}
                  className="h-[50px] px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white font-medium text-slate-700"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    if (customStartDate) setPage(1);
                  }}
                  className="h-[50px] px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white font-medium text-slate-700"
                />
              </div>
              {(startTime || endTime) && (
                <button
                  onClick={() => {
                    setStartTime("");
                    setEndTime("");
                    setPage(1);
                  }}
                  className="h-[50px] px-3 border border-red-200 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear Time
                </button>
              )}
            </div>

            {/* Active filter indicator */}
            {customStartDate && (
              <div className="flex items-center gap-2 h-[50px] px-3 bg-violet-50 border border-violet-200 rounded-xl text-xs font-semibold text-violet-700">
                <Calendar className="w-3.5 h-3.5" />
                Custom Range Active
                {startTime && ` • ${startTime}`}
                {endTime && ` - ${endTime}`}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 1b. Device Toggle Bar ──────────────────────────────────────── */}
      {devices && devices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-700">Devices</h3>
              <span className="text-xs text-slate-400 ml-1">
                ({devices.length} detected)
              </span>
              {selectedDevice && (
                <button
                  onClick={() => {
                    setSelectedDevice(null);
                    setPage(1);
                  }}
                  className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Clear Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* All Devices pill */}
              <button
                onClick={() => {
                  setSelectedDevice(null);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  !selectedDevice
                    ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                All Devices
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    !selectedDevice
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {devices.reduce((s, d) => s + d.totalActivities, 0)}
                </span>
              </button>

              {/* Individual device pills */}
              {devices.map((d) => {
                const isActive = selectedDevice === d.deviceId;
                const DeviceIcon =
                  d.deviceType === "Mobile"
                    ? Smartphone
                    : d.deviceType === "Tablet"
                      ? Tablet
                      : Monitor;
                return (
                  <button
                    key={d.deviceId}
                    onClick={() => {
                      setSelectedDevice(isActive ? null : d.deviceId);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                    title={`${d.deviceLabel || d.deviceId}\nSessions: ${d.sessionCount} · Logins: ${d.logins}\nFirst: ${fmtDate(d.firstSeen)}\nLast: ${fmtDate(d.lastSeen)}\nIPs: ${(d.ips || []).filter(Boolean).join(", ") || "—"}`}
                  >
                    <DeviceIcon className="w-3.5 h-3.5" />
                    <div className="flex flex-col items-start">
                      <span className="max-w-[180px] truncate">
                        {d.browser || "Unknown"}
                        {d.os ? ` · ${d.os}` : ""}
                      </span>
                      {((d.fullAddresses || []).filter(Boolean).length > 0 ||
                        (d.cities || []).filter(Boolean).length > 0 ||
                        (d.countries || []).filter(Boolean).length > 0) && (
                        <span
                          className={`text-[10px] max-w-[180px] truncate ${isActive ? "text-white/60" : "text-slate-400"}`}
                          title={(d.fullAddresses || [])
                            .filter(Boolean)
                            .join(" | ")}
                        >
                          📍{" "}
                          {(d.fullAddresses || []).filter(Boolean).length > 0
                            ? (d.fullAddresses || [])
                                .filter(Boolean)[0]
                                .split(",")
                                .slice(0, 3)
                                .join(",")
                            : [...(d.cities || []), ...(d.countries || [])]
                                .filter(Boolean)
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .join(", ")}
                        </span>
                      )}
                    </div>
                    {d.screenResolution && (
                      <span
                        className={`text-[10px] ${isActive ? "text-white/70" : "text-slate-400"}`}
                      >
                        {d.screenResolution}
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {d.totalActivities}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected device details */}
            {selectedDevice &&
              (() => {
                const dev = devices.find((d) => d.deviceId === selectedDevice);
                if (!dev) return null;
                const fmtDur = (ms) => {
                  if (!ms) return "—";
                  const s = Math.round(ms / 1000);
                  if (s < 60) return `${s}s`;
                  const m = Math.floor(s / 60);
                  const rs = s % 60;
                  if (m < 60) return `${m}m ${rs}s`;
                  const h = Math.floor(m / 60);
                  return `${h}h ${m % 60}m`;
                };
                return (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {/* Device identity header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        {dev.deviceType === "Mobile" ? (
                          <Smartphone className="w-5 h-5" />
                        ) : dev.deviceType === "Tablet" ? (
                          <Tablet className="w-5 h-5" />
                        ) : (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {dev.deviceLabel || `${dev.browser} on ${dev.os}`}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Device ID: {dev.deviceId}
                        </p>
                      </div>
                    </div>

                    {/* All device details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 text-xs">
                      <div className="bg-blue-50 rounded-xl p-2.5">
                        <div className="text-blue-400 mb-0.5 font-medium">
                          Browser
                        </div>
                        <div className="font-bold text-blue-700">
                          {dev.browser || "—"}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-2.5">
                        <div className="text-purple-400 mb-0.5 font-medium">
                          OS
                        </div>
                        <div className="font-bold text-purple-700">
                          {dev.os || "—"}
                        </div>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-2.5">
                        <div className="text-emerald-400 mb-0.5 font-medium">
                          Device Type
                        </div>
                        <div className="font-bold text-emerald-700">
                          {dev.deviceType || "—"}
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-2.5">
                        <div className="text-amber-400 mb-0.5 font-medium">
                          Screen
                        </div>
                        <div className="font-bold text-amber-700">
                          {dev.screenResolution || "—"}
                        </div>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-2.5">
                        <div className="text-rose-400 mb-0.5 font-medium">
                          Platform
                        </div>
                        <div className="font-bold text-rose-700">
                          {dev.platform || "—"}
                        </div>
                      </div>
                      <div className="bg-cyan-50 rounded-xl p-2.5">
                        <div className="text-cyan-400 mb-0.5 font-medium">
                          Language
                        </div>
                        <div className="font-bold text-cyan-700">
                          {dev.language || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Activity & session stats */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-xs mt-2.5">
                      <div className="bg-violet-50 rounded-xl p-2.5 text-center">
                        <div className="text-violet-400 mb-0.5 font-medium">
                          Sessions
                        </div>
                        <div className="font-bold text-violet-700 text-lg">
                          {dev.sessionCount}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-2.5 text-center">
                        <div className="text-green-400 mb-0.5 font-medium">
                          Logins
                        </div>
                        <div className="font-bold text-green-700 text-lg">
                          {dev.logins || 0}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                        <div className="text-blue-400 mb-0.5 font-medium">
                          Page Views
                        </div>
                        <div className="font-bold text-blue-700 text-lg">
                          {dev.pageViews || 0}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                        <div className="text-orange-400 mb-0.5 font-medium">
                          Clicks
                        </div>
                        <div className="font-bold text-orange-700 text-lg">
                          {dev.clicks || 0}
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
                        <div className="text-indigo-400 mb-0.5 font-medium">
                          Screen Time
                        </div>
                        <div className="font-bold text-indigo-700 text-lg">
                          {fmtDur(dev.totalDuration)}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <div className="text-slate-400 mb-0.5 font-medium">
                          Events
                        </div>
                        <div className="font-bold text-slate-700 text-lg">
                          {dev.totalActivities}
                        </div>
                      </div>
                    </div>

                    {/* Network / Location info */}
                    {/* Full Address — prominent display */}
                    {(dev.fullAddresses || []).filter(Boolean).length > 0 && (
                      <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-3 mt-2.5 border border-rose-100">
                        <div className="text-rose-500 mb-1 font-semibold text-xs flex items-center gap-1.5">
                          📍 Exact Address
                        </div>
                        {(dev.fullAddresses || [])
                          .filter(Boolean)
                          .map((addr, i) => (
                            <div
                              key={i}
                              className="text-sm font-medium text-slate-800 leading-relaxed"
                            >
                              {addr}
                            </div>
                          ))}
                        {dev.latitudes &&
                          dev.longitudes &&
                          (dev.latitudes || []).filter(Boolean).length > 0 && (
                            <a
                              href={`https://www.google.com/maps?q=${(dev.latitudes || []).filter(Boolean)[0]},${(dev.longitudes || []).filter(Boolean)[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                            >
                              🗺️ Open in Google Maps ↗
                            </a>
                          )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs mt-2.5">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-slate-400 mb-0.5 font-medium">
                          🌐 IP Addresses
                        </div>
                        <div
                          className="font-semibold text-slate-700 break-all"
                          title={(dev.ips || []).filter(Boolean).join(", ")}
                        >
                          {(dev.ips || []).filter(Boolean).join(", ") || "—"}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2.5">
                        <div className="text-orange-400 mb-0.5 font-medium">
                          📍 Cities
                        </div>
                        <div
                          className="font-semibold text-orange-700"
                          title={(dev.cities || []).filter(Boolean).join(", ")}
                        >
                          {(dev.cities || []).filter(Boolean).join(", ") || "—"}
                        </div>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-2.5">
                        <div className="text-emerald-400 mb-0.5 font-medium">
                          🏳️ Countries
                        </div>
                        <div
                          className="font-semibold text-emerald-700"
                          title={(dev.countries || [])
                            .filter(Boolean)
                            .join(", ")}
                        >
                          {(dev.countries || []).filter(Boolean).join(", ") ||
                            "—"}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-2.5">
                        <div className="text-purple-400 mb-0.5 font-medium">
                          🗺️ Regions
                        </div>
                        <div
                          className="font-semibold text-purple-700"
                          title={(dev.regions || []).filter(Boolean).join(", ")}
                        >
                          {(dev.regions || []).filter(Boolean).join(", ") ||
                            "—"}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-2.5">
                        <div className="text-blue-400 mb-0.5 font-medium">
                          📡 ISP
                        </div>
                        <div
                          className="font-semibold text-blue-700 truncate"
                          title={(dev.isps || []).filter(Boolean).join(", ")}
                        >
                          {(dev.isps || []).filter(Boolean).join(", ") || "—"}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-slate-400 mb-0.5 font-medium">
                          📅 Active Period
                        </div>
                        <div className="font-semibold text-slate-700 text-[11px]">
                          {fmtDate(dev.firstSeen)} — {fmtDate(dev.lastSeen)}
                        </div>
                      </div>
                    </div>

                    {/* User Agent (collapsible) */}
                    {dev.userAgent && (
                      <details className="mt-2.5">
                        <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                          Show full User Agent
                        </summary>
                        <div className="mt-1 p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-mono break-all leading-relaxed">
                          {dev.userAgent}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })()}
          </div>
        </motion.div>
      )}

      {/* ── 1c. Device-wise Stats Comparison ─────────────────────────────── */}
      {devices && devices.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionHeader
              icon={Monitor}
              title="Device-wise Stats"
              color="text-blue-500"
              badge={devices.length}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold">
                      Device
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      Sessions
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      Events
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      Logins
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      Pages
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      Clicks
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      Screen Time
                    </th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold">
                      IPs
                    </th>
                    <th className="text-left py-2 px-2 text-slate-500 font-semibold">
                      First Seen
                    </th>
                    <th className="text-left py-2 px-2 text-slate-500 font-semibold">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => {
                    const DevIcon =
                      d.deviceType === "Mobile"
                        ? Smartphone
                        : d.deviceType === "Tablet"
                          ? Tablet
                          : Monitor;
                    const isSelected = selectedDevice === d.deviceId;
                    return (
                      <tr
                        key={d.deviceId}
                        onClick={() => {
                          setSelectedDevice(isSelected ? null : d.deviceId);
                          setPage(1);
                        }}
                        className={`border-b border-slate-50 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-violet-50 border-violet-200"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isSelected
                                  ? "bg-violet-500 text-white"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              <DevIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {d.browser || "Unknown"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {d.os || "Unknown OS"}
                                {d.screenResolution
                                  ? ` · ${d.screenResolution}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            {d.sessionCount}
                          </span>
                        </td>
                        <td className="text-center py-2.5 px-2 font-semibold text-slate-700">
                          {d.totalActivities}
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            {d.logins || 0}
                          </span>
                        </td>
                        <td className="text-center py-2.5 px-2 font-semibold text-slate-600">
                          {d.pageViews || "—"}
                        </td>
                        <td className="text-center py-2.5 px-2 font-semibold text-slate-600">
                          {d.clicks || "—"}
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className="font-semibold text-violet-600">
                            {d.totalDuration
                              ? fmt(Math.round(d.totalDuration / 1000))
                              : "—"}
                          </span>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {(d.ips || []).filter(Boolean).map((ip, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono"
                              >
                                {ip}
                              </span>
                            ))}
                            {!(d.ips || []).filter(Boolean).length && (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                          {fmtDate(d.firstSeen)}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                          {fmtDate(d.lastSeen)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 2. Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          {
            label: "Total Events",
            value: stats.totalActivities,
            icon: Activity,
            gradient: "from-violet-500 to-purple-600",
            bg: "bg-violet-50",
            border: "border-violet-100",
          },
          {
            label: "Sessions",
            value: stats.sessionCount,
            icon: Layers,
            gradient: "from-blue-500 to-cyan-500",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Page Views",
            value: stats.totalPageViews,
            icon: Eye,
            gradient: "from-indigo-500 to-blue-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
          },
          {
            label: "Screen Time",
            value: fmt(
              Math.round(
                (stats.totalScreenTime || stats.totalDuration || 0) / 1000,
              ),
            ),
            icon: Timer,
            gradient: "from-purple-500 to-violet-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
          },
          {
            label: "Scrolls",
            value: stats.totalScrolls,
            icon: Mouse,
            gradient: "from-pink-500 to-rose-500",
            bg: "bg-pink-50",
            border: "border-pink-100",
          },
          {
            label: "Clicks",
            value: stats.totalClicks,
            icon: MousePointer,
            gradient: "from-orange-500 to-amber-500",
            bg: "bg-orange-50",
            border: "border-orange-100",
          },
          {
            label: "Logins",
            value: stats.totalLogins,
            icon: LogIn,
            gradient: "from-green-500 to-emerald-500",
            bg: "bg-green-50",
            border: "border-green-100",
          },
          {
            label: "Actions",
            value: crudActivities.length,
            icon: Settings,
            gradient: "from-rose-500 to-pink-600",
            bg: "bg-rose-50",
            border: "border-rose-100",
          },
        ].map((s, i) => (
          <StatCard key={i} {...s} delay={i * 0.04} />
        ))}
      </div>

      {/* ── 3. Charts Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Activity Breakdown */}
        <Card delay={0.1}>
          <SectionHeader
            icon={BarChart2}
            title="Activity Breakdown"
            color="text-violet-500"
            badge={activityBreakdown?.length}
          />
          <div className="space-y-2">
            {(activityBreakdown || []).map((a, i) => (
              <div key={a._id} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 truncate capitalize">
                  {a._id?.replace(/_/g, " ")}
                </span>
                <MiniBar
                  value={a.count}
                  max={maxBreakdown}
                  color={breakdownColors[i % breakdownColors.length]}
                />
                <span className="text-xs font-semibold text-slate-600 w-8 text-right">
                  {a.count}
                </span>
              </div>
            ))}
            {(!activityBreakdown || activityBreakdown.length === 0) && (
              <EmptyState text="No activity" />
            )}
          </div>
        </Card>

        {/* 30-day chart */}
        <Card delay={0.13}>
          <SectionHeader
            icon={TrendingUp}
            title="Last 30 Days"
            color="text-blue-500"
          />
          <DayChart data={activityByDay || []} />
          <p className="text-xs text-slate-400 mt-2 text-center">
            Daily activity frequency
          </p>
        </Card>

        {/* Hour heatmap */}
        <Card delay={0.16}>
          <SectionHeader
            icon={Clock}
            title="Activity by Hour"
            color="text-orange-500"
          />
          <HourHeatmap data={activityByHour || []} />
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <div className="w-3 h-3 rounded bg-slate-100" /> Low
            <div className="w-3 h-3 rounded bg-violet-300" />
            <div className="w-3 h-3 rounded bg-violet-500" />
            <div className="w-3 h-3 rounded bg-violet-800" /> High
          </div>
        </Card>
      </div>

      {/* ── 4. Pages Visited + Navigation ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={0.18}>
          <SectionHeader
            icon={Link2}
            title="All Pages Visited"
            color="text-blue-500"
            badge={urlFrequency.length}
          />
          {urlFrequency.length === 0 ? (
            <EmptyState text="No page visits recorded yet" />
          ) : (
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto pr-1">
              {urlFrequency.map((p, i) => (
                <URLRow
                  key={p.path}
                  rank={i + 1}
                  title={p.title}
                  path={p.path}
                  count={p.count}
                  duration={p.totalDuration}
                  maxCount={urlFrequency[0]?.count || 1}
                />
              ))}
            </div>
          )}
        </Card>

        <Card delay={0.2}>
          <SectionHeader
            icon={LayoutDashboard}
            title="Navigation & Button Clicks"
            color="text-purple-500"
            badge={navFrequency.length}
          />
          {navFrequency.length === 0 ? (
            <EmptyState text="No navigation clicks recorded yet" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {navFrequency.map((n, i) => (
                <div key={n.element} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-bold text-slate-400 w-5">
                    #{i + 1}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      typeConfig[n.type]?.color || "bg-slate-100"
                    }`}
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {n.element}
                    </p>
                    <p className="text-xs text-slate-400">
                      {fmtDate(n.lastSeen)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0 bg-slate-100 px-2 py-0.5 rounded-full">
                    {n.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── 5. Top Pages (backend topPages) ──────────────────────────────── */}
      <Card delay={0.22}>
        <SectionHeader
          icon={Globe}
          title="Top Pages Visited"
          color="text-emerald-500"
          badge={topPages?.length}
        />
        {!topPages || topPages.length === 0 ? (
          <EmptyState text="No page views yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 text-left border-b border-slate-100">
                  <th className="pb-2 pr-3 font-semibold w-6">#</th>
                  <th className="pb-2 pr-3 font-semibold">Page</th>
                  <th className="pb-2 pr-3 font-semibold">Path</th>
                  <th className="pb-2 pr-3 font-semibold text-right">Views</th>
                  <th className="pb-2 pr-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2 pr-3 font-bold text-slate-400">
                      {i + 1}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-700 max-w-[180px] truncate">
                      {p.title || p._id || "Unknown"}
                    </td>
                    <td className="py-2 pr-3 text-violet-500 max-w-[200px] truncate">
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3 flex-shrink-0" />
                        {p._id || "/"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold text-slate-600">
                      {p.views || p.count}
                    </td>
                    <td className="py-2 text-right text-slate-500">
                      {p.totalDuration
                        ? fmt(Math.round(p.totalDuration / 1000))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── 6. Detailed Page Analytics ───────────────────────────────────── */}
      <Card delay={0.24}>
        <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 -m-5 p-5 rounded-t-2xl border-b-2 border-blue-200 mb-4">
          <SectionHeader
            icon={Activity}
            title="Detailed Page Analytics"
            color="text-blue-700"
            badge={pageAnalytics.length}
          />
          <p className="text-xs text-slate-600 mt-1 font-medium">
            In-depth analysis of admin panel usage per page
          </p>
        </div>
        {pageAnalytics.length === 0 ? (
          <EmptyState text="No page analytics data yet" />
        ) : (
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {pageAnalytics.map((pg, idx) => {
              const timeSpentSec = Math.round(pg.totalTimeSpent / 1000);
              return (
                <div
                  key={idx}
                  className="border-2 border-blue-100 rounded-2xl p-4 hover:border-blue-300 hover:shadow-lg transition-all bg-gradient-to-br from-blue-50/40 to-cyan-50/40 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-blue-100">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-blue-700 mb-1 flex items-center gap-2">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{pg.title}</span>
                      </h4>
                      <p className="text-xs text-blue-500 truncate flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 flex-shrink-0" />
                        {pg.path}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {pg.visits} visits
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <div className="bg-white rounded-xl p-3 border border-blue-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-slate-400">
                          Time Spent
                        </span>
                      </div>
                      <p className="text-lg font-bold text-slate-700">
                        {timeSpentSec > 0 ? fmt(timeSpentSec) : "N/A"}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-50">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs text-slate-400">
                          Max Scroll
                        </span>
                      </div>
                      <p className="text-lg font-bold text-slate-700">
                        {pg.maxScrollDepth > 0 ? `${pg.maxScrollDepth}%` : "0%"}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-50 sm:col-span-1 col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <MousePointer className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs text-slate-400">
                          Button Clicks
                        </span>
                      </div>
                      <p className="text-lg font-bold text-slate-700">
                        {pg.buttonClicks.length}
                      </p>
                    </div>
                  </div>

                  {pg.maxScrollDepth > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">
                          Scroll Progress
                        </span>
                        <span className="text-xs text-violet-600 font-bold">
                          {pg.maxScrollDepth}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-700"
                          style={{ width: `${pg.maxScrollDepth}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {pg.buttonClicks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MousePointer className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-semibold text-slate-700">
                          Buttons Clicked on this Page
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {pg.buttonClicks.map((click, cidx) => (
                          <div
                            key={cidx}
                            className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-100 flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">
                                {click.element}
                              </p>
                              {click.value && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {click.value}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {new Date(click.timestamp).toLocaleTimeString(
                                "en-IN",
                                { timeZone: timezone },
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      First visit:{" "}
                      {new Date(pg.firstVisit).toLocaleString("en-IN", {
                        timeZone: timezone,
                      })}
                    </span>
                    <span>
                      Last visit:{" "}
                      {new Date(pg.lastVisit).toLocaleString("en-IN", {
                        timeZone: timezone,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 7. Admin Actions (CRUD / Export / Settings) ──────────────────── */}
      <Card delay={0.25}>
        <SectionHeader
          icon={Settings}
          title="Admin Actions"
          color="text-amber-500"
          badge={crudActivities.length}
        />
        {crudActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Settings className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              No admin actions recorded yet
            </p>
            <p className="text-xs text-slate-400">
              CRUD operations, data exports, imports and settings changes will
              appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 text-left border-b border-slate-100">
                  <th className="pb-2 pr-3 font-semibold">Type</th>
                  <th className="pb-2 pr-3 font-semibold">Details</th>
                  <th className="pb-2 pr-3 font-semibold">Page</th>
                  <th className="pb-2 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {crudActivities.slice(0, 50).map((a, i) => (
                  <tr
                    key={a._id || i}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="py-2 pr-3">
                      <ActivityBadge type={a.activityType} />
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-700 max-w-[200px] truncate">
                      {a.action?.element || a.action?.value || "—"}
                    </td>
                    <td className="py-2 pr-3 text-violet-500 max-w-[140px] truncate">
                      {a.page?.title || a.page?.path || "—"}
                    </td>
                    <td className="py-2 text-slate-400">
                      {fmtTime(a.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── 8. Form & Search Activity ────────────────────────────────────── */}
      <Card delay={0.27}>
        <SectionHeader
          icon={MessageSquare}
          title="Form Submissions & Search/Filter"
          color="text-rose-500"
          badge={formSubmissions.length}
        />
        {formSubmissions.length === 0 ? (
          <EmptyState text="No form submissions, searches, or filters recorded" />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {formSubmissions.map((a, i) => (
              <div
                key={a._id || i}
                className="border border-slate-100 rounded-xl p-3 hover:border-rose-200 transition-colors bg-slate-50/40"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <ActivityBadge type={a.activityType} />
                  <span className="text-xs text-slate-400">
                    {fmtDate(a.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {a.page?.path && (
                    <div>
                      <span className="text-slate-400">Page</span>
                      <p className="font-medium text-violet-600 truncate">
                        {a.page.path}
                      </p>
                    </div>
                  )}
                  {a.action?.element && (
                    <div>
                      <span className="text-slate-400">Element</span>
                      <p className="font-medium text-slate-700 truncate">
                        {a.action.element}
                      </p>
                    </div>
                  )}
                  {a.action?.value && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400">Value</span>
                      <p className="font-medium text-slate-700 break-all">
                        {a.action.value}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 8b. Login History ───────────────────────────────────────── */}
      {loginHistory.length > 0 && (
        <Card delay={0.27}>
          <SectionHeader
            icon={LogIn}
            title="Login History — Device Details"
            color="text-green-600"
            badge={loginHistory.length}
          />
          <p className="text-[11px] text-slate-400 mb-3">
            Every login event with full device &amp; network info. Click a row
            to filter by that device.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 px-2 text-slate-500 font-semibold">#</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Time
                  </th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Device
                  </th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Browser
                  </th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">OS</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Screen
                  </th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Type
                  </th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">IP</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Location
                  </th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">
                    Session
                  </th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((ev, idx) => {
                  const dev = ev.device || {};
                  const loc = ev.location || {};
                  const devId = dev.deviceId || "";
                  const isActiveDevice = selectedDevice === devId;
                  const DevIcon = dev.isMobile
                    ? Smartphone
                    : dev.deviceType === "Tablet"
                      ? Tablet
                      : Monitor;
                  return (
                    <tr
                      key={ev._id || idx}
                      onClick={() => {
                        if (devId) {
                          setSelectedDevice(isActiveDevice ? null : devId);
                          setPage(1);
                        }
                      }}
                      className={`border-b border-slate-50 transition-all cursor-pointer ${
                        isActiveDevice
                          ? "bg-violet-50 border-violet-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2 px-2 text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-700 whitespace-nowrap">
                        {fmtDate(ev.timestamp)}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${
                              isActiveDevice
                                ? "bg-violet-500 text-white"
                                : "bg-blue-50 text-blue-500"
                            }`}
                          >
                            <DevIcon className="w-3 h-3" />
                          </div>
                          <span
                            className="font-semibold text-slate-700 truncate max-w-[140px]"
                            title={dev.deviceLabel || ""}
                          >
                            {dev.deviceLabel || dev.browser || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-slate-600">
                        {dev.browser || "—"}
                      </td>
                      <td className="py-2 px-2 text-slate-600">
                        {dev.os || dev.platform || "—"}
                      </td>
                      <td className="py-2 px-2 text-slate-500">
                        {dev.screenResolution ||
                          `${dev.screenWidth || "?"}x${dev.screenHeight || "?"}`}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dev.isMobile
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {dev.deviceType ||
                            (dev.isMobile ? "Mobile" : "Desktop")}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-500 text-[11px]">
                        {loc.ip || "—"}
                      </td>
                      <td
                        className="py-2 px-2 text-slate-500 max-w-[200px]"
                        title={loc.fullAddress || ""}
                      >
                        {loc.fullAddress ? (
                          <span className="truncate block max-w-[200px]">
                            {loc.fullAddress}
                          </span>
                        ) : (
                          [loc.city, loc.country].filter(Boolean).join(", ") ||
                          "—"
                        )}
                      </td>
                      <td
                        className="py-2 px-2 text-[10px] text-slate-400 font-mono truncate max-w-[90px]"
                        title={ev.sessionId}
                      >
                        {ev.sessionId ? ev.sessionId.slice(-8) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── 9. Session Analysis ─────────────────────────────────────────── */}
      <Card delay={0.29}>
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 -m-5 p-5 rounded-t-2xl border-b-2 border-indigo-200 mb-4">
          <SectionHeader
            icon={Layers}
            title="Login-to-Logout Session Analysis"
            color="text-indigo-700"
            badge={sessionMap.length}
          />
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Complete admin panel journey from login to logout — with detailed
            page tracking and time spent analysis
          </p>
        </div>
        {sessionMap.length === 0 ? (
          <EmptyState text="No sessions found" />
        ) : (
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
            {sessionMap.map((s, i) => {
              const durationSec =
                s.start && s.end
                  ? Math.round((new Date(s.end) - new Date(s.start)) / 1000)
                  : 0;
              const types = [
                ...new Set(s.activities.map((a) => a.activityType)),
              ];
              const hasLogin = s.activities.some(
                (a) => a.activityType === "login",
              );
              const hasLogout = s.activities.some(
                (a) => a.activityType === "logout",
              );
              const hasTimeout = s.activities.some(
                (a) => a.activityType === "session_timeout",
              );
              const isEnded = hasLogout || hasTimeout;

              // Get all pages in this session with time
              const screenMap = {};
              let lastScreen = null;
              let lastTime = null;
              const screenTypes = [
                "screen_view",
                "page_view",
                "screen_time",
                "scroll",
                "button_click",
                "navigation",
              ];

              s.activities
                .filter(
                  (a) => a.page?.path && screenTypes.includes(a.activityType),
                )
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .forEach((a) => {
                  const currentScreen = a.page.path;
                  const currentTime = new Date(a.timestamp).getTime();

                  if (lastScreen && lastTime) {
                    const timeSpent = Math.round(
                      (currentTime - lastTime) / 1000,
                    );
                    if (!screenMap[lastScreen]) {
                      screenMap[lastScreen] = {
                        path: lastScreen,
                        title: lastScreen,
                        totalTime: 0,
                        visits: 0,
                      };
                    }
                    screenMap[lastScreen].totalTime += timeSpent;
                  }

                  if (!screenMap[currentScreen]) {
                    screenMap[currentScreen] = {
                      path: currentScreen,
                      title: a.page?.title || currentScreen,
                      totalTime: 0,
                      visits: 0,
                    };
                  }
                  if (
                    ["screen_view", "page_view", "screen_time"].includes(
                      a.activityType,
                    )
                  ) {
                    screenMap[currentScreen].visits++;
                  }
                  if (a.activityType === "screen_time" && a.duration) {
                    screenMap[currentScreen].totalTime += Math.round(
                      a.duration / 1000,
                    );
                  }
                  lastScreen = currentScreen;
                  lastTime = currentTime;
                });

              const screensVisited = Object.values(screenMap).sort(
                (a, b) => b.totalTime - a.totalTime,
              );

              return (
                <div
                  key={s.sessionId}
                  className="relative overflow-hidden border-2 border-indigo-200 rounded-2xl hover:border-indigo-400 transition-all bg-white shadow-sm hover:shadow-xl"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-indigo-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            Session #{i + 1}
                          </span>
                          {hasLogin && (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 border border-green-200 shadow-sm">
                              <LogIn className="w-3 h-3" /> Login
                            </span>
                          )}
                          {hasLogout && (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1 border border-red-200 shadow-sm">
                              <LogOut className="w-3 h-3" /> Logout
                            </span>
                          )}
                          {hasTimeout && !hasLogout && (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1 border border-orange-200 shadow-sm">
                              <Clock className="w-3 h-3" /> Timed Out
                            </span>
                          )}
                          {!isEnded && (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1 border border-amber-200 shadow-sm animate-pulse">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                              Active
                            </span>
                          )}
                        </div>
                        {/* Device & Location info for this session */}
                        {s.device && (
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200">
                              {s.device.isMobile ||
                              s.device.deviceType === "Mobile" ? (
                                <Smartphone className="w-3 h-3" />
                              ) : s.device.deviceType === "Tablet" ? (
                                <Tablet className="w-3 h-3" />
                              ) : (
                                <Monitor className="w-3 h-3" />
                              )}
                              {s.device.browser || "Unknown Browser"}
                              {s.device.os
                                ? ` · ${s.device.os}`
                                : s.device.platform
                                  ? ` · ${s.device.platform}`
                                  : ""}
                            </span>
                            {s.device.screenResolution && (
                              <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                {s.device.screenResolution}
                              </span>
                            )}
                            {s.location?.ip && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                <Globe className="w-2.5 h-2.5" />
                                {s.location.ip}
                              </span>
                            )}
                            {(s.location?.city || s.location?.country) && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                                <MapPin className="w-2.5 h-2.5 text-orange-400" />
                                {[s.location.city, s.location.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-100">
                            <span className="text-indigo-400 block text-[10px] uppercase tracking-wide font-medium">
                              Started
                            </span>
                            <p className="text-slate-700 font-bold mt-0.5">
                              {fmtTime(s.start)}
                            </p>
                          </div>
                          <div className="bg-pink-50 rounded-xl p-2.5 border border-pink-100">
                            <span className="text-pink-400 block text-[10px] uppercase tracking-wide font-medium">
                              Ended
                            </span>
                            <p className="text-slate-700 font-bold mt-0.5">
                              {fmtTime(s.end)}
                            </p>
                          </div>
                          <div className="bg-violet-50 rounded-xl p-2.5 border border-violet-100">
                            <span className="text-violet-400 block text-[10px] uppercase tracking-wide font-medium">
                              Duration
                            </span>
                            <p className="text-violet-700 font-bold mt-0.5">
                              {fmt(durationSec)}
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                            <span className="text-blue-400 block text-[10px] uppercase tracking-wide font-medium">
                              Total Events
                            </span>
                            <p className="text-blue-700 font-bold mt-0.5">
                              {s.activities.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Right side: Close reason + Details button */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Session close reason */}
                        {isEnded ? (
                          <div
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border shadow-sm ${
                              hasLogout
                                ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200"
                                : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200"
                            }`}
                          >
                            {hasLogout ? (
                              <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Closed: User Logged Out</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Closed: Idle Timeout (1hr)</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 shadow-sm animate-pulse">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            <span>Session Active</span>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const box = document.getElementById(
                              `asession-${i}`,
                            );
                            box.classList.toggle("hidden");
                          }}
                          className="px-3 py-1.5 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors flex items-center gap-1 font-medium shadow-sm"
                        >
                          <ChevronDown className="w-3 h-3" /> Details
                        </button>
                      </div>
                    </div>

                    <div id={`asession-${i}`} className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Pages Visited ({screensVisited.length})
                        </h4>
                      </div>
                      {screensVisited.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No page views in this session
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {screensVisited.map((scr, idx) => {
                            const maxTime = Math.max(
                              ...screensVisited.map((u) => u.totalTime),
                              1,
                            );
                            return (
                              <div
                                key={idx}
                                className="bg-gradient-to-r from-white to-indigo-50/30 rounded-xl p-3 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                      {scr.title || scr.path}
                                    </p>
                                    <p className="text-xs text-indigo-500 truncate flex items-center gap-1 mt-0.5">
                                      <Link2 className="w-2.5 h-2.5 flex-shrink-0" />
                                      {scr.path}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-sm font-extrabold text-indigo-600 whitespace-nowrap">
                                      {fmt(scr.totalTime)}
                                    </span>
                                    <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-semibold">
                                      {scr.visits} visits
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500 rounded-full transition-all duration-700 shadow-sm"
                                    style={{
                                      width: `${(scr.totalTime / maxTime) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-indigo-100">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-2">
                          Activity Types in this Session:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {types.slice(0, 8).map((t) => (
                            <ActivityBadge key={t} type={t} />
                          ))}
                          {types.length > 8 && (
                            <span className="text-xs text-slate-400 px-2 py-0.5">
                              +{types.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                          Session ID
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 break-all mt-0.5 bg-slate-50 rounded p-1">
                          {s.sessionId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 10. Device & Browser ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={0.31}>
          <SectionHeader
            icon={Monitor}
            title="Device & Browser"
            color="text-blue-500"
          />
          {deviceInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-medium flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> Web Browser
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {deviceInfo.device?.platform && (
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 block">Platform</span>
                    <span className="font-semibold text-slate-700">
                      {deviceInfo.device.platform}
                    </span>
                  </div>
                )}
                {deviceInfo.device?.browser && (
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 block">Browser</span>
                    <span className="font-semibold text-slate-700">
                      {deviceInfo.device.browser}
                    </span>
                  </div>
                )}
                {deviceInfo.device?.screenWidth && (
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 block">Screen</span>
                    <span className="font-semibold text-slate-700">
                      {deviceInfo.device.screenWidth}×
                      {deviceInfo.device.screenHeight}
                    </span>
                  </div>
                )}
                {deviceInfo.device?.isMobile !== undefined && (
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 block">Type</span>
                    <span className="font-semibold text-slate-700">
                      {deviceInfo.device.isMobile ? "Mobile" : "Desktop"}
                    </span>
                  </div>
                )}
                {deviceInfo.location?.ip && (
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 block">IP Address</span>
                    <span className="font-semibold text-slate-700">
                      {deviceInfo.location.ip}
                    </span>
                  </div>
                )}
                {deviceInfo.location?.city && (
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 block">City / Country</span>
                    <span className="font-semibold text-slate-700">
                      {deviceInfo.location.city}
                      {deviceInfo.location.country
                        ? `, ${deviceInfo.location.country}`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
              {deviceInfo.device?.userAgent && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">
                    User Agent
                  </span>
                  <p className="text-xs text-slate-500 break-all leading-relaxed">
                    {deviceInfo.device.userAgent}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="No device data available" />
          )}
        </Card>

        {/* Interaction Summary */}
        <Card delay={0.33}>
          <SectionHeader
            icon={MousePointer}
            title="Interaction Summary"
            color="text-violet-500"
          />
          <div className="space-y-3">
            {[
              {
                label: "Page Views",
                value: stats.totalPageViews,
                max: Math.max(
                  stats.totalPageViews,
                  stats.totalScrolls,
                  stats.totalClicks,
                  1,
                ),
                color: "bg-blue-400",
              },
              {
                label: "Scrolls",
                value: stats.totalScrolls,
                max: Math.max(
                  stats.totalPageViews,
                  stats.totalScrolls,
                  stats.totalClicks,
                  1,
                ),
                color: "bg-indigo-400",
              },
              {
                label: "Clicks",
                value: stats.totalClicks,
                max: Math.max(
                  stats.totalPageViews,
                  stats.totalScrolls,
                  stats.totalClicks,
                  1,
                ),
                color: "bg-orange-400",
              },
              {
                label: "Logins",
                value: stats.totalLogins,
                max: Math.max(
                  stats.totalPageViews,
                  stats.totalScrolls,
                  stats.totalClicks,
                  stats.totalLogins,
                  1,
                ),
                color: "bg-green-400",
              },
              {
                label: "Actions",
                value: crudActivities.length,
                max: Math.max(stats.totalPageViews, crudActivities.length, 1),
                color: "bg-rose-400",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">
                  {item.label}
                </span>
                <MiniBar value={item.value} max={item.max} color={item.color} />
                <span className="text-xs font-bold text-slate-600 w-10 text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Total time tracked</p>
            <p className="text-2xl font-bold text-violet-600">
              {fmt(Math.round((stats.totalDuration || 0) / 1000))}
            </p>
          </div>
        </Card>
      </div>

      {/* ── 11. Full Activity Timeline ─────────────────────────────────── */}
      <Card delay={0.36} className="overflow-hidden">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Calendar className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-700">
            Full Activity Timeline
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold ml-1">
            {stats.totalActivities} total
          </span>
          <div className="ml-auto flex gap-1 flex-wrap">
            {[
              "all",
              "login",
              "logout",
              "page_view",
              "screen_time",
              "button_click",
              "navigation",
              "scroll",
              "search",
              "filter",
              "form_submit",
              "tab_focus",
              "tab_blur",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  typeFilter === t
                    ? "bg-violet-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t === "all" ? "All" : t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
          {filteredTimeline.length === 0 ? (
            <EmptyState text="No activities in this filter/range" />
          ) : (
            filteredTimeline.map((act, i) => {
              const cfg = typeConfig[act.activityType] || {
                color: "bg-slate-100 text-slate-600 border-slate-200",
                icon: Activity,
              };
              const Icon = cfg.icon;
              return (
                <div
                  key={act._id || i}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${cfg.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-0.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 capitalize">
                          {act.activityType?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {fmtDate(act.timestamp)}
                      </span>
                    </div>
                    <div>
                      {act.page?.title && (
                        <p className="text-xs font-medium text-slate-600 truncate">
                          {typeof act.page.title === "string"
                            ? act.page.title
                            : ""}
                        </p>
                      )}
                      {act.page?.path && (
                        <p className="text-xs text-violet-500 truncate flex items-center gap-1">
                          <Link2 className="w-2.5 h-2.5 flex-shrink-0" />
                          {act.page.path}
                        </p>
                      )}
                    </div>
                    <div>
                      {(act.action?.element || act.action?.value) && (
                        <p className="text-xs text-slate-600 truncate">
                          <span className="text-slate-400">Action: </span>
                          {act.action.element || act.action.value}
                        </p>
                      )}
                      {act.scroll?.depth != null && (
                        <p className="text-xs text-slate-500">
                          Scroll {act.scroll.depth}% (max {act.scroll.maxDepth}
                          %)
                        </p>
                      )}
                    </div>
                    <div>
                      {act.duration != null && (
                        <p className="text-xs text-slate-500">
                          <span className="text-slate-400">Duration: </span>
                          {fmtMs(act.duration)}
                        </p>
                      )}
                      {act.sessionId && (
                        <p className="text-xs font-mono text-slate-400 truncate">
                          <span className="text-slate-400 not-italic">
                            SID:{" "}
                          </span>
                          {act.sessionId.slice(0, 20)}…
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Page {page} / {totalPages} · {stats.totalActivities} total events
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                ‹ Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                      pg === page
                        ? "bg-violet-500 text-white"
                        : "border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminTracking;
