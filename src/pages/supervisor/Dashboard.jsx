import React, { useState, useEffect, useCallback, useMemo } from "react";
import { analyticsService } from "../../api/analyticsService";
import {
  Briefcase,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  CheckCircle,
  Activity,
  Wallet,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Zap,
  Target,
  PieChart as PieChartIcon,
  Award,
  Clock,
  Sparkles,
  CircleDollarSign,
  BadgeDollarSign,
  HandCoins,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 18 },
  },
};

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  const sym = localStorage.getItem("app_currency") || "AED";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  if (sym.length === 1 || sym === "₹") return `${sym} ${formatted}`;
  return `${formatted} ${sym}`;
};

const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(n || 0);

const pct = (part, total) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : "0.0";

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
const SupervisorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState(null);
  const [shiftDate, setShiftDate] = useState(null);
  const [shiftWindow, setShiftWindow] = useState(null);

  const fetchDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await analyticsService.getSupervisorStats({});
      if (response.data?.counts) {
        setCounts(response.data.counts);
      }
      if (response.data?.shiftDate) {
        setShiftDate(response.data.shiftDate);
      }
      if (response.data?.shiftWindow) {
        setShiftWindow(response.data.shiftWindow);
      }
      if (!showLoader) toast.success("Dashboard refreshed");
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => fetchDashboard(false);

  // Derived calculations
  const derived = useMemo(() => {
    if (!counts) return {};
    return {
      avgPerJob:
        counts.totalJobs > 0 ? counts.totalAmount / counts.totalJobs : 0,
      todayAvgPerJob:
        counts.todaysJobs > 0 ? counts.todaysAmount / counts.todaysJobs : 0,
      cashPct: pct(counts.totalCash, counts.totalAmount),
      cardPct: pct(counts.totalCard, counts.totalAmount),
      bankPct: pct(counts.totalBank, counts.totalAmount),
      todayCashPct: pct(counts.todaysCash, counts.todaysAmount),
      todayCardPct: pct(counts.todaysCard, counts.todaysAmount),
      todayBankPct: pct(counts.todaysBank, counts.todaysAmount),
      jobsTodayPct: pct(counts.todaysJobs, counts.totalJobs),
      revTodayPct: pct(counts.todaysAmount, counts.totalAmount),
    };
  }, [counts]);

  // ─────────────── Loading Skeleton ───────────────
  if (loading && !counts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Loader2 className="w-20 h-20 animate-spin text-blue-600 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-blue-400/20 blur-xl"
            />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg mt-6">
            Loading Dashboard...
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Fetching your team analytics
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* ════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl"
        >
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-cyan-300/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl">
                  <LayoutDashboard className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                    Supervisor Dashboard
                  </h1>
                  <p className="text-blue-200 text-sm md:text-base mt-1">
                    {shiftDate
                      ? `${new Date(shiftDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
                      : "Your team's complete performance overview"}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 border border-white/20 shadow-lg"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </motion.button>
          </div>

          {/* Quick summary strip */}
          {counts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <MiniStat
                label="Today's Jobs"
                value={formatNumber(counts.todaysJobs)}
              />
              <MiniStat
                label="Today's Revenue"
                value={formatCurrency(counts.todaysAmount)}
              />
              <MiniStat
                label="Today's Cash"
                value={formatCurrency(counts.todaysCash)}
              />
              <MiniStat
                label="Today's Card"
                value={formatCurrency(counts.todaysCard)}
              />
            </motion.div>
          )}
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION: TODAY'S STATISTICS
        ════════════════════════════════════════════ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SectionHeader
            icon={Zap}
            title={
              shiftDate
                ? `Today's Statistics — ${shiftDate}`
                : "Today's Statistics"
            }
            subtitle={
              shiftWindow
                ? `Date: ${shiftDate || shiftWindow.start?.split(" ")?.[0]} (Dubai)`
                : "Real-time performance for today"
            }
            gradient="from-blue-600 to-indigo-600"
          />

          {/* Primary Today Cards */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-5"
          >
            <motion.div variants={itemVariants}>
              <GlassCard
                title="Today's Jobs"
                value={formatNumber(counts?.todaysJobs)}
                icon={CheckCircle}
                gradient="from-blue-500 to-blue-700"
                glowColor="blue"
                subtitle="Completed washes today"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <GlassCard
                title="Today's Revenue"
                value={formatCurrency(counts?.todaysAmount)}
                icon={Activity}
                gradient="from-emerald-500 to-green-700"
                glowColor="green"
                subtitle="Total collection today"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <GlassCard
                title="Today's Cash"
                value={formatCurrency(counts?.todaysCash)}
                icon={HandCoins}
                gradient="from-green-500 to-teal-700"
                glowColor="teal"
                subtitle={`${derived.todayCashPct}% of today`}
                badge={`${derived.todayCashPct}%`}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <GlassCard
                title="Today's Card"
                value={formatCurrency(counts?.todaysCard)}
                icon={CreditCard}
                gradient="from-purple-500 to-indigo-700"
                glowColor="purple"
                subtitle={`${derived.todayCardPct}% of today`}
                badge={`${derived.todayCardPct}%`}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <GlassCard
                title="Today's Bank"
                value={formatCurrency(counts?.todaysBank)}
                icon={Building2}
                gradient="from-orange-500 to-amber-700"
                glowColor="orange"
                subtitle={`${derived.todayBankPct}% of today`}
                badge={`${derived.todayBankPct}%`}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION: REVENUE BREAKDOWN
        ════════════════════════════════════════════ */}
        {counts && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <SectionHeader
              icon={PieChartIcon}
              title="Today's Revenue Breakdown"
              subtitle="Payment method distribution for today"
              gradient="from-purple-600 to-pink-600"
            />

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-5 max-w-2xl mx-auto">
              {/* Today's Revenue Split */}
              <motion.div variants={scaleIn}>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        Today&apos;s Revenue Split
                      </h3>
                      <p className="text-xs text-slate-400">
                        Total: {formatCurrency(counts.todaysAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Donut visual */}
                  <div className="flex items-center justify-center mb-8">
                    <DonutChart
                      segments={[
                        {
                          value: counts.todaysCash,
                          color: "#06b6d4",
                          label: "Cash",
                        },
                        {
                          value: counts.todaysCard,
                          color: "#d946ef",
                          label: "Card",
                        },
                        {
                          value: counts.todaysBank,
                          color: "#f43f5e",
                          label: "Bank",
                        },
                      ]}
                      total={counts.todaysAmount}
                      centerLabel={formatCurrency(counts.todaysAmount)}
                      centerSub="Today"
                    />
                  </div>

                  <div className="space-y-4">
                    <ProgressRow
                      label="Cash"
                      amount={counts.todaysCash}
                      total={counts.todaysAmount}
                      color="bg-cyan-500"
                      trackColor="bg-cyan-100 dark:bg-cyan-900/30"
                      icon={HandCoins}
                      iconBg="bg-cyan-100 dark:bg-cyan-900/40"
                      iconColor="text-cyan-600"
                    />
                    <ProgressRow
                      label="Card"
                      amount={counts.todaysCard}
                      total={counts.todaysAmount}
                      color="bg-fuchsia-500"
                      trackColor="bg-fuchsia-100 dark:bg-fuchsia-900/30"
                      icon={CreditCard}
                      iconBg="bg-fuchsia-100 dark:bg-fuchsia-900/40"
                      iconColor="text-fuchsia-600"
                    />
                    <ProgressRow
                      label="Bank Transfer"
                      amount={counts.todaysBank}
                      total={counts.todaysAmount}
                      color="bg-rose-500"
                      trackColor="bg-rose-100 dark:bg-rose-900/30"
                      icon={Building2}
                      iconBg="bg-rose-100 dark:bg-rose-900/40"
                      iconColor="text-rose-600"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-4"
        >
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Data refreshes on page load &bull; Click Refresh for latest numbers
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

/* Mini stat in header strip */
const MiniStat = ({ label, value }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
    <p className="text-[11px] text-blue-200 font-medium uppercase tracking-wider">
      {label}
    </p>
    <p className="text-lg font-black text-white mt-0.5 truncate">{value}</p>
  </div>
);

/* Section header with icon */
const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <motion.div variants={itemVariants} className="flex items-center gap-3">
    <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
        {title}
      </h2>
      <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
    </div>
  </motion.div>
);

/* Glass card for main stat display */
const GlassCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  glowColor,
  subtitle,
  badge,
}) => {
  const glowClasses = {
    blue: "group-hover:shadow-blue-500/20",
    green: "group-hover:shadow-green-500/20",
    teal: "group-hover:shadow-teal-500/20",
    purple: "group-hover:shadow-purple-500/20",
    orange: "group-hover:shadow-orange-500/20",
    cyan: "group-hover:shadow-cyan-500/20",
    emerald: "group-hover:shadow-emerald-500/20",
    lime: "group-hover:shadow-lime-500/20",
    fuchsia: "group-hover:shadow-fuchsia-500/20",
    rose: "group-hover:shadow-rose-500/20",
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 overflow-hidden cursor-default shadow-lg hover:shadow-2xl ${glowClasses[glowColor] || ""} transition-all duration-300`}
    >
      {/* Top gradient accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient} opacity-70 group-hover:opacity-100 transition-opacity`}
      />

      {/* Subtle background pattern on hover */}
      <div
        className={`absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-br ${gradient} rounded-full opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500 blur-xl`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
          {title}
        </h3>

        <p className="text-xl font-black text-slate-900 dark:text-white truncate mb-1">
          {value}
        </p>

        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

/* Progress Row for Revenue Split */
const ProgressRow = ({
  label,
  amount,
  total,
  color,
  trackColor,
  icon: Icon,
  iconBg,
  iconColor,
}) => {
  const percent = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <div className="flex-1 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(amount)}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                percent > 50
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : percent > 0
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {percent}%
            </span>
          </div>
        </div>
      </div>
      <div
        className={`relative h-2.5 ${trackColor} rounded-full overflow-hidden`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className={`absolute inset-y-0 left-0 ${color} rounded-full`}
        />
      </div>
    </div>
  );
};

/* Insight comparison card */
const InsightCard = ({
  title,
  allTimeValue,
  todayValue,
  icon: Icon,
  gradient,
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300"
  >
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {title}
      </h3>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between py-2 px-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          All-Time
        </span>
        <span className="text-sm font-black text-blue-700 dark:text-blue-300">
          {allTimeValue}
        </span>
      </div>
      <div className="flex items-center justify-between py-2 px-3 bg-cyan-50/80 dark:bg-cyan-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800/30">
        <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
          Today
        </span>
        <span className="text-sm font-black text-cyan-700 dark:text-cyan-300">
          {todayValue}
        </span>
      </div>
    </div>
  </motion.div>
);

/* SVG Donut Chart */
const DonutChart = ({ segments, total, centerLabel, centerSub }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const validSegments = segments.filter((s) => s.value > 0);
  const hasData = total > 0;

  return (
    <div className="relative w-44 h-44">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          className="text-slate-100 dark:text-slate-700"
        />
        {hasData &&
          validSegments.map((seg, i) => {
            const segPct = seg.value / total;
            const dashLength = segPct * circumference;
            const dashOffset = -(accumulated * circumference);
            accumulated += segPct;

            return (
              <motion.circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
          {centerSub}
        </p>
        <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5 text-center px-2 leading-tight">
          {centerLabel}
        </p>
      </div>
      {/* Legend */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Comparison table row */
const ComparisonRow = ({
  label,
  icon: Icon,
  allTime,
  today,
  percentage,
  iconColor,
  iconBg,
  isLast = false,
}) => (
  <tr className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <span className="text-sm font-bold text-slate-800 dark:text-white">
        {allTime}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400">
        {today}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
          parseFloat(percentage) >= 100
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : parseFloat(percentage) > 0
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
        }`}
      >
        {parseFloat(percentage) >= 100 ? (
          <ArrowUp className="w-3 h-3" />
        ) : parseFloat(percentage) > 0 ? (
          <Clock className="w-3 h-3" />
        ) : null}
        {percentage}%
      </span>
    </td>
  </tr>
);

export default SupervisorDashboard;
