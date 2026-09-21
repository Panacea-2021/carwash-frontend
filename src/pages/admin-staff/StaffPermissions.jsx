import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Save,
  ArrowLeft,
  Eye,
  Columns3,
  MousePointerClick,
  Wrench,
  Loader2,
  User,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Unlock,
  ChevronUp,
  LayoutGrid,
  List,
  Info,
  Zap,
  Filter,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { adminStaffService } from "../../api/adminStaffService";
import { ALL_PERMISSION_MODULES } from "../../utils/usePermissions";
import PAGE_PERMISSIONS_CONFIG from "../../utils/pagePermissionsConfig";
import { clsx } from "clsx";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const SECTION_META = {
  columns: {
    icon: Columns3,
    label: "Table Columns",
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    bgDark: "bg-blue-100",
    text: "text-blue-700",
    textLight: "text-blue-500",
    border: "border-blue-200",
    ring: "ring-blue-400",
    trackOn: "bg-blue-500",
    description: "Control which table columns are visible",
  },
  actions: {
    icon: MousePointerClick,
    label: "Row Actions",
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
    bgDark: "bg-violet-100",
    text: "text-violet-700",
    textLight: "text-violet-500",
    border: "border-violet-200",
    ring: "ring-violet-400",
    trackOn: "bg-violet-500",
    description: "Control which row-level actions are available",
  },
  toolbar: {
    icon: Wrench,
    label: "Toolbar & Filters",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    bgDark: "bg-emerald-100",
    text: "text-emerald-700",
    textLight: "text-emerald-500",
    border: "border-emerald-200",
    ring: "ring-emerald-400",
    trackOn: "bg-emerald-500",
    description: "Control toolbar buttons and filter visibility",
  },
};

const MODULE_MAP = {
  washes_residence: "washes",
  washes_onewash: "washes",
  payments_onewash: "payments",
  payments_residence: "payments",
  paymentEditHistory: "payments",
};

/* ═══════════════════════════════════════════════════════════════════
   TOGGLE SWITCH COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

function ToggleSwitch({ enabled, onChange, size = "md", colorClass }) {
  const sizes = {
    sm: {
      track: "w-8 h-[18px]",
      thumb: "w-3.5 h-3.5",
      translate: "translate-x-[14px]",
    },
    md: {
      track: "w-10 h-[22px]",
      thumb: "w-4 h-4",
      translate: "translate-x-[18px]",
    },
    lg: {
      track: "w-12 h-[26px]",
      thumb: "w-5 h-5",
      translate: "translate-x-[22px]",
    },
  };
  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={clsx(
        "relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer shrink-0",
        s.track,
        enabled
          ? colorClass || "bg-indigo-500 focus:ring-indigo-400"
          : "bg-slate-300 focus:ring-slate-400",
      )}
    >
      <span
        className={clsx(
          "inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ml-[3px]",
          s.thumb,
          enabled ? s.translate : "translate-x-0",
        )}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PERMISSION CARD (Individual Item)
   ═══════════════════════════════════════════════════════════════════ */

function PermissionCard({ item, enabled, onToggle, meta, viewMode }) {
  if (viewMode === "list") {
    return (
      <div
        className={clsx(
          "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200",
          enabled
            ? `${meta.bg} ${meta.border} shadow-sm`
            : "bg-slate-50/80 border-slate-200/80",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              "w-2 h-2 rounded-full shrink-0 transition-colors duration-200",
              enabled ? meta.trackOn : "bg-slate-300",
            )}
          />
          <span
            className={clsx(
              "text-sm font-medium truncate transition-colors duration-200",
              enabled ? "text-slate-700" : "text-slate-400",
            )}
          >
            {item.label}
          </span>
        </div>
        <ToggleSwitch
          enabled={enabled}
          onChange={onToggle}
          size="sm"
          colorClass={clsx(enabled && meta.trackOn, "focus:ring-2", meta.ring)}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onToggle}
      className={clsx(
        "relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none group hover:scale-[1.02] active:scale-[0.98]",
        enabled
          ? `${meta.bg} ${meta.border} shadow-md shadow-slate-200/50`
          : "bg-white border-slate-200 hover:border-slate-300",
      )}
    >
      {/* Status indicator dot */}
      <div
        className={clsx(
          "absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full transition-all duration-300",
          enabled ? `${meta.trackOn} shadow-sm` : "bg-slate-300",
        )}
      />

      {/* Icon area */}
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
          enabled ? meta.bgDark : "bg-slate-100 group-hover:bg-slate-200",
        )}
      >
        {enabled ? (
          <CheckCircle2 className={clsx("w-5 h-5", meta.textLight)} />
        ) : (
          <XCircle className="w-5 h-5 text-slate-400" />
        )}
      </div>

      {/* Label */}
      <span
        className={clsx(
          "text-xs font-semibold text-center leading-tight transition-colors duration-200",
          enabled ? "text-slate-700" : "text-slate-400",
        )}
      >
        {item.label}
      </span>

      {/* Toggle — pointer-events-none so only the card onClick handles toggling */}
      <div className="pointer-events-none">
        <ToggleSwitch
          enabled={enabled}
          onChange={() => {}}
          size="sm"
          colorClass={clsx(enabled && meta.trackOn, "focus:ring-2", meta.ring)}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION COMPONENT (Columns / Actions / Toolbar)
   ═══════════════════════════════════════════════════════════════════ */

function PermissionSection({
  pageKey,
  sectionType,
  items,
  isItemEnabled,
  toggleItem,
  toggleAllInSection,
  countEnabled,
  viewMode,
}) {
  const meta = SECTION_META[sectionType];
  const Icon = meta.icon;
  const total = items.length;
  const enabled = countEnabled(
    pageKey,
    sectionType === "columns"
      ? "column"
      : sectionType === "actions"
        ? "action"
        : "toolbar",
  );
  const allEnabled = enabled === total;
  const noneEnabled = enabled === 0;
  const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Section Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br",
                  meta.gradient,
                )}
              >
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                  {meta.label}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {meta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress pill */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5">
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className={clsx(
                      "h-full rounded-full bg-gradient-to-r",
                      meta.gradient,
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span
                  className={clsx("text-xs font-bold tabular-nums", meta.text)}
                >
                  {enabled}/{total}
                </span>
              </div>

              {/* Select / Deselect All toggle */}
              <button
                onClick={() =>
                  toggleAllInSection(
                    pageKey,
                    sectionType === "columns"
                      ? "column"
                      : sectionType === "actions"
                        ? "action"
                        : "toolbar",
                    !allEnabled,
                  )
                }
                className={clsx(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200",
                  allEnabled
                    ? "border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    : `${meta.border} ${meta.text} hover:shadow-sm ${meta.bg}`,
                )}
              >
                {allEnabled ? (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Select All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid/List */}
        <div className="p-4">
          <div
            className={clsx(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2",
            )}
          >
            {items.map((item) => {
              const sectionSection =
                sectionType === "columns"
                  ? "column"
                  : sectionType === "actions"
                    ? "action"
                    : "toolbar";
              return (
                <PermissionCard
                  key={item.key}
                  item={item}
                  enabled={isItemEnabled(pageKey, sectionSection, item.key)}
                  onToggle={() => toggleItem(pageKey, sectionSection, item.key)}
                  meta={meta}
                  viewMode={viewMode}
                />
              );
            })}
          </div>

          {/* Quick status bar */}
          {noneEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200"
            >
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-700">
                All items are disabled — this section will be completely hidden
                for this staff member.
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE ACCORDION CARD
   ═══════════════════════════════════════════════════════════════════ */

function PageCard({
  pageKey,
  config,
  isExpanded,
  onToggleExpand,
  isFullAccess,
  totalItems,
  enabledItems,
  toggleAllForPage,
  isItemEnabled,
  toggleItem,
  toggleAllInSection,
  countEnabled,
  viewMode,
}) {
  const percentage =
    totalItems > 0 ? Math.round((enabledItems / totalItems) * 100) : 0;
  const statusColor =
    isFullAccess || percentage === 100
      ? "emerald"
      : percentage === 0
        ? "red"
        : percentage >= 50
          ? "amber"
          : "orange";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-2xl border-2 overflow-hidden transition-all duration-300",
        isExpanded
          ? "border-indigo-200 shadow-lg shadow-indigo-100/40 bg-gradient-to-b from-white to-slate-50/50"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md",
      )}
    >
      {/* Page Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none group"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Expand chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </motion.div>

          {/* Page icon */}
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
              isExpanded
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200"
                : "bg-slate-100 group-hover:bg-slate-200",
            )}
          >
            <Shield
              className={clsx(
                "w-5 h-5 transition-colors",
                isExpanded ? "text-white" : "text-slate-500",
              )}
            />
          </div>

          {/* Page name */}
          <div className="min-w-0">
            <h3
              className={clsx(
                "font-bold text-base truncate transition-colors",
                isExpanded ? "text-indigo-800" : "text-slate-700",
              )}
            >
              {config.label}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">
                {config.columns.length} cols · {config.actions.length} actions ·{" "}
                {config.toolbar.length} tools
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status badge */}
          <div
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold",
              statusColor === "emerald" && "bg-emerald-50 text-emerald-600",
              statusColor === "red" && "bg-red-50 text-red-600",
              statusColor === "amber" && "bg-amber-50 text-amber-600",
              statusColor === "orange" && "bg-orange-50 text-orange-600",
            )}
          >
            {/* Mini circular progress */}
            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                opacity={0.2}
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${percentage * 0.502} 100`}
                strokeLinecap="round"
              />
            </svg>
            {isFullAccess ? "Full Access" : `${enabledItems}/${totalItems}`}
          </div>

          {/* Enable / Disable all */}
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => toggleAllForPage(pageKey, true)}
              className={clsx(
                "flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200",
                isFullAccess
                  ? "bg-emerald-50 border-emerald-300 text-emerald-600 cursor-default"
                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:shadow-sm",
              )}
            >
              <Unlock className="w-3 h-3" />
              Enable All
            </button>
            <button
              onClick={() => toggleAllForPage(pageKey, false)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
            >
              <Lock className="w-3 h-3" />
              Disable All
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Sections */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200 px-5 py-5 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
              {["columns", "actions", "toolbar"].map((sectionType) => {
                const items =
                  sectionType === "columns"
                    ? config.columns
                    : sectionType === "actions"
                      ? config.actions
                      : config.toolbar;

                if (items.length === 0) return null;

                return (
                  <PermissionSection
                    key={sectionType}
                    pageKey={pageKey}
                    sectionType={sectionType}
                    items={items}
                    isItemEnabled={isItemEnabled}
                    toggleItem={toggleItem}
                    toggleAllInSection={toggleAllInSection}
                    countEnabled={countEnabled}
                    viewMode={viewMode}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATS OVERVIEW BAR
   ═══════════════════════════════════════════════════════════════════ */

function StatsBar({ accessiblePages, pagePermissions, countEnabled }) {
  const stats = useMemo(() => {
    let totalPages = accessiblePages.length;
    let totalItems = 0;
    let enabledItems = 0;
    let fullAccessPages = 0;

    accessiblePages.forEach(([pageKey, config]) => {
      const pageTotalItems =
        config.columns.length + config.actions.length + config.toolbar.length;
      const pageEnabledItems =
        countEnabled(pageKey, "column") +
        countEnabled(pageKey, "action") +
        countEnabled(pageKey, "toolbar");

      totalItems += pageTotalItems;
      enabledItems += pageEnabledItems;
      if (!pagePermissions[pageKey]) fullAccessPages++;
    });

    return { totalPages, totalItems, enabledItems, fullAccessPages };
  }, [accessiblePages, pagePermissions, countEnabled]);

  const statCards = [
    {
      label: "Accessible Pages",
      value: stats.totalPages,
      icon: LayoutGrid,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
    },
    {
      label: "Full Access Pages",
      value: stats.fullAccessPages,
      icon: Sparkles,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Enabled Items",
      value: `${stats.enabledItems}/${stats.totalItems}`,
      icon: Zap,
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
    },
    {
      label: "Access Level",
      value:
        stats.totalItems > 0
          ? `${Math.round((stats.enabledItems / stats.totalItems) * 100)}%`
          : "0%",
      icon: Filter,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {statCards.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
              stat.gradient,
            )}
          >
            <stat.icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-800 truncate">
              {stat.value}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              {stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function StaffPermissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagePermissions, setPagePermissions] = useState({});
  const [modulePermissions, setModulePermissions] = useState({});
  const [expandedPages, setExpandedPages] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [expandAll, setExpandAll] = useState(false);

  /* ── Fetch staff data ────────────────────────────────────────── */

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminStaffService.getById(id);
      setStaff(res.data);
      setPagePermissions(res.data.pagePermissions || {});
      setModulePermissions(res.data.permissions || {});
    } catch (err) {
      toast.error("Failed to load staff member");
      navigate("/admin-staff");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  /* ── Module access check ─────────────────────────────────────── */
  // Show ALL config pages so admin can configure any page's permissions,
  // regardless of the staff's current module-level access.
  const hasModuleAccess = useCallback(() => true, []);

  /* ── Expand / Collapse ───────────────────────────────────────── */

  const togglePage = (pageKey) => {
    setExpandedPages((prev) => ({ ...prev, [pageKey]: !prev[pageKey] }));
  };

  const handleExpandAll = () => {
    const next = !expandAll;
    setExpandAll(next);
    const newExpanded = {};
    if (next) {
      accessiblePages.forEach(([key]) => {
        newExpanded[key] = true;
      });
    }
    setExpandedPages(newExpanded);
  };

  /* ── Permission helpers ──────────────────────────────────────── */

  const isItemEnabled = useCallback(
    (pageKey, section, itemKey) => {
      const pageConf = pagePermissions[pageKey];
      if (!pageConf) return true;
      const sectionKey = section === "toolbar" ? "toolbar" : section + "s";
      if (!pageConf[sectionKey]) return true;
      return pageConf[sectionKey].includes(itemKey);
    },
    [pagePermissions],
  );

  const toggleItem = useCallback((pageKey, section, itemKey) => {
    setHasChanges(true);
    setPagePermissions((prev) => {
      const updated = { ...prev };
      const sectionKey = section === "toolbar" ? "toolbar" : section + "s";

      if (!updated[pageKey]) {
        const config = PAGE_PERMISSIONS_CONFIG[pageKey];
        updated[pageKey] = {
          columns: [...config.columns.map((c) => c.key)],
          actions: [...config.actions.map((a) => a.key)],
          toolbar: [...config.toolbar.map((t) => t.key)],
        };
      } else {
        // Deep clone the inner page object to avoid mutating prev state
        // (React Strict Mode calls updaters twice — mutation causes double-toggle)
        updated[pageKey] = {
          columns: [...(updated[pageKey].columns || [])],
          actions: [...(updated[pageKey].actions || [])],
          toolbar: [...(updated[pageKey].toolbar || [])],
        };
      }

      const arr = updated[pageKey][sectionKey];
      if (arr.includes(itemKey)) {
        updated[pageKey][sectionKey] = arr.filter((k) => k !== itemKey);
      } else {
        updated[pageKey][sectionKey] = [...arr, itemKey];
      }

      return updated;
    });
  }, []);

  const toggleAllInSection = useCallback((pageKey, section, enable) => {
    setHasChanges(true);
    const config = PAGE_PERMISSIONS_CONFIG[pageKey];
    const sectionKey = section === "toolbar" ? "toolbar" : section + "s";
    const configSection =
      section === "column"
        ? config.columns
        : section === "action"
          ? config.actions
          : config.toolbar;

    setPagePermissions((prev) => {
      const updated = { ...prev };
      if (!updated[pageKey]) {
        updated[pageKey] = {
          columns: [...config.columns.map((c) => c.key)],
          actions: [...config.actions.map((a) => a.key)],
          toolbar: [...config.toolbar.map((t) => t.key)],
        };
      } else {
        updated[pageKey] = { ...updated[pageKey] };
      }
      updated[pageKey][sectionKey] = enable
        ? configSection.map((item) => item.key)
        : [];
      return updated;
    });
  }, []);

  const toggleAllForPage = useCallback((pageKey, enable) => {
    setHasChanges(true);
    setPagePermissions((prev) => {
      const updated = { ...prev };
      if (enable) {
        delete updated[pageKey];
      } else {
        updated[pageKey] = { columns: [], actions: [], toolbar: [] };
      }
      return updated;
    });
  }, []);

  const isPageFullAccess = useCallback(
    (pageKey) => !pagePermissions[pageKey],
    [pagePermissions],
  );

  const countEnabled = useCallback(
    (pageKey, section) => {
      const config = PAGE_PERMISSIONS_CONFIG[pageKey];
      const configSection =
        section === "column"
          ? config.columns
          : section === "action"
            ? config.actions
            : config.toolbar;
      if (!pagePermissions[pageKey]) return configSection.length;
      const sectionKey = section === "toolbar" ? "toolbar" : section + "s";
      return pagePermissions[pageKey][sectionKey]?.length || 0;
    },
    [pagePermissions],
  );

  /* ── Save ────────────────────────────────────────────────────── */

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        adminStaffService.updatePagePermissions(id, pagePermissions),
        adminStaffService.updatePermissions(id, modulePermissions),
      ]);
      toast.success("Permissions saved successfully");
      setHasChanges(false);
    } catch (err) {
      toast.error("Failed to save page permissions");
    } finally {
      setSaving(false);
    }
  };

  /* ── Accessible pages (with search filter) ───────────────────── */

  const accessiblePages = useMemo(
    () =>
      Object.entries(PAGE_PERMISSIONS_CONFIG).filter(([key]) =>
        hasModuleAccess(key),
      ),
    [hasModuleAccess],
  );

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return accessiblePages;
    const q = searchQuery.toLowerCase();
    return accessiblePages.filter(([, config]) =>
      config.label.toLowerCase().includes(q),
    );
  }, [accessiblePages, searchQuery]);

  /* ── Loading state ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700">Loading permissions...</p>
          <p className="text-xs text-slate-400 mt-1">
            Fetching staff access configuration
          </p>
        </div>
      </div>
    );
  }

  /* ── RENDER ──────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 font-sans">
      {/* ═══ STICKY HEADER ═══ */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin-staff")}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Shield className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-slate-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Page Permissions
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-sm text-slate-600 font-semibold">
                    {staff?.name || "Staff Member"}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {staff?.number}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Unsaved changes indicator */}
              <AnimatePresence>
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-700">
                      Unsaved changes
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={clsx(
                  "h-11 px-6 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2",
                  hasChanges
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200 hover:shadow-xl"
                    : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed",
                )}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              First toggle{" "}
              <strong className="text-blue-700">Module Access</strong> to
              control which sections appear in the sidebar. Then configure
              granular{" "}
              <strong className="text-indigo-700">table columns</strong>,{" "}
              <strong className="text-violet-700">row actions</strong>, and{" "}
              <strong className="text-emerald-700">
                toolbar buttons/filters
              </strong>{" "}
              for each enabled page.
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Changes won't take effect until you save.
            </p>
          </div>
        </motion.div>

        {/* ═══ MODULE ACCESS SECTION ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
                  <Shield className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                    Module Access (Sidebar Visibility)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toggle which sections this staff member can see in the
                    sidebar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setHasChanges(true);
                    setModulePermissions((prev) => {
                      const updated = { ...prev };
                      ALL_PERMISSION_MODULES.forEach(({ key, actions }) => {
                        updated[key] = {};
                        actions.forEach((a) => {
                          updated[key][a] = true;
                        });
                      });
                      return updated;
                    });
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <Unlock className="w-3 h-3" />
                  Enable All
                </button>
                <button
                  onClick={() => {
                    setHasChanges(true);
                    setModulePermissions((prev) => {
                      const updated = { ...prev };
                      ALL_PERMISSION_MODULES.forEach(({ key, actions }) => {
                        updated[key] = {};
                        actions.forEach((a) => {
                          updated[key][a] = false;
                        });
                      });
                      return updated;
                    });
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                >
                  <Lock className="w-3 h-3" />
                  Disable All
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {ALL_PERMISSION_MODULES.map(({ key, label, actions }) => {
              const isEnabled = modulePermissions[key]?.view === true;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setHasChanges(true);
                    setModulePermissions((prev) => {
                      const updated = { ...prev };
                      const newState = !isEnabled;
                      updated[key] = {};
                      actions.forEach((a) => {
                        updated[key][a] = newState;
                      });
                      return updated;
                    });
                  }}
                  className={clsx(
                    "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none hover:scale-[1.02] active:scale-[0.98]",
                    isEnabled
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div
                    className={clsx(
                      "absolute top-2 right-2 w-2.5 h-2.5 rounded-full transition-all duration-300",
                      isEnabled ? "bg-blue-500 shadow-sm" : "bg-slate-300",
                    )}
                  />
                  {isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                  <span
                    className={clsx(
                      "text-xs font-semibold text-center leading-tight",
                      isEnabled ? "text-slate-700" : "text-slate-400",
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Overview */}
        <StatsBar
          accessiblePages={accessiblePages}
          pagePermissions={pagePermissions}
          countEnabled={countEnabled}
        />

        {/* Toolbar: Search + View Mode + Expand All */}
        <div className="mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all",
                  viewMode === "grid"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all",
                  viewMode === "list"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>

            {/* Expand All / Collapse All */}
            <button
              onClick={handleExpandAll}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {expandAll ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Expand All
                </>
              )}
            </button>
          </div>
        </div>

        {/* No pages state */}
        {accessiblePages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-bold text-lg">No Module Access</p>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              This staff member has no module-level VIEW permissions enabled.
              Enable module access first, then configure page-level permissions
              here.
            </p>
          </motion.div>
        ) : filteredPages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
          >
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">
              No pages match "{searchQuery}"
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try a different search term
            </p>
          </motion.div>
        ) : (
          /* Pages List */
          <div className="space-y-4">
            <AnimatePresence>
              {filteredPages.map(([pageKey, config]) => {
                const totalItems =
                  config.columns.length +
                  config.actions.length +
                  config.toolbar.length;
                const enabledItems =
                  countEnabled(pageKey, "column") +
                  countEnabled(pageKey, "action") +
                  countEnabled(pageKey, "toolbar");

                return (
                  <PageCard
                    key={pageKey}
                    pageKey={pageKey}
                    config={config}
                    isExpanded={!!expandedPages[pageKey]}
                    onToggleExpand={() => togglePage(pageKey)}
                    isFullAccess={isPageFullAccess(pageKey)}
                    totalItems={totalItems}
                    enabledItems={enabledItems}
                    toggleAllForPage={toggleAllForPage}
                    isItemEnabled={isItemEnabled}
                    toggleItem={toggleItem}
                    toggleAllInSection={toggleAllInSection}
                    countEnabled={countEnabled}
                    viewMode={viewMode}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom spacing for mobile scroll */}
        <div className="h-20" />
      </div>

      {/* ═══ FLOATING SAVE BUTTON (visible when scrolled with changes) ═══ */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-indigo-300/50 transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Permissions
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
