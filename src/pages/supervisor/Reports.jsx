import React, { useState, useEffect } from "react";
import { analyticsService } from "../../api/analyticsService";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  DollarSign,
  Users,
  Loader2,
  FileText,
  Printer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Activity,
  Target,
  Award,
  Zap,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  User,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  Car,
  Percent,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const SupervisorReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [comparisonPeriod, setComparisonPeriod] = useState("last7days");

  const datePresets = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "thismonth" },
    { label: "Last Month", value: "lastmonth" },
    { label: "Custom", value: "custom" },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "breakdown", label: "Breakdown", icon: Layers },
    { id: "comparison", label: "Comparison", icon: Activity },
  ];

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getSupervisorStats(dateRange);
      setStats(response.counts);
    } catch (error) {
      console.error("❌ Failed to fetch reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
    toast.success("Reports refreshed");
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case "today":
        startDate = endDate = today.toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split("T")[0];
        break;
      case "last7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        startDate = sevenDaysAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "last30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "thismonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "lastmonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = lastMonth.toISOString().split("T")[0];
        endDate = lastMonthEnd.toISOString().split("T")[0];
        break;
      default:
        return;
    }

    setDateRange({ startDate, endDate });
    setComparisonPeriod(preset);
  };

  const handleExportCSV = () => {
    const csvData = [
      ["Supervisor Performance Report"],
      [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
      [""],
      ["Metric", "All Time", "Selected Period"],
      ["Total Jobs", stats?.totalJobs || 0, stats?.todaysJobs || 0],
      [
        "Total Revenue",
        `₹${stats?.totalAmount || 0}`,
        `₹${stats?.todaysAmount || 0}`,
      ],
      [
        "Cash Payments",
        `₹${stats?.totalCash || 0}`,
        `₹${stats?.todaysCash || 0}`,
      ],
      [
        "Card Payments",
        `₹${stats?.totalCard || 0}`,
        `₹${stats?.todaysCard || 0}`,
      ],
      [
        "Bank Transfers",
        `₹${stats?.totalBank || 0}`,
        `₹${stats?.todaysBank || 0}`,
      ],
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supervisor-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  // Mock data for charts (replace with real data processing)
  const dailyTrend = [
    { date: "Mon", revenue: 3200, jobs: 12, target: 4000 },
    { date: "Tue", revenue: 4100, jobs: 15, target: 4000 },
    { date: "Wed", revenue: 4800, jobs: 18, target: 4000 },
    { date: "Thu", revenue: 3700, jobs: 14, target: 4000 },
    { date: "Fri", revenue: 5500, jobs: 20, target: 4000 },
    { date: "Sat", revenue: 4600, jobs: 17, target: 4000 },
    { date: "Sun", revenue: 4200, jobs: 16, target: 4000 },
  ];

  const workerPerformance = [
    { name: "Rajesh Kumar", jobs: 45, revenue: 18500, efficiency: 92 },
    { name: "Amit Sharma", jobs: 38, revenue: 15200, efficiency: 88 },
    { name: "Vijay Singh", jobs: 42, revenue: 17600, efficiency: 90 },
    { name: "Suresh Reddy", jobs: 35, revenue: 14000, efficiency: 85 },
    { name: "Prakash Rao", jobs: 40, revenue: 16800, efficiency: 89 },
  ];

  const paymentDistribution = [
    { name: "Cash", value: stats?.todaysCash || 0, color: "#10b981" },
    { name: "Card", value: stats?.todaysCard || 0, color: "#3b82f6" },
    { name: "Bank", value: stats?.todaysBank || 0, color: "#8b5cf6" },
  ];

  const performanceMetrics = [
    { subject: "Revenue", A: 92, fullMark: 100 },
    { subject: "Jobs", A: 85, fullMark: 100 },
    { subject: "Efficiency", A: 88, fullMark: 100 },
    { subject: "Quality", A: 90, fullMark: 100 },
    { subject: "Customer Satisfaction", A: 87, fullMark: 100 },
    { subject: "Team Performance", A: 89, fullMark: 100 },
  ];

  const serviceTypeDistribution = [
    { name: "Residence", value: 65, color: "#10b981" },
    { name: "Commercial", value: 35, color: "#3b82f6" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <FileText className="w-10 h-10" />
              Performance Reports
            </h1>
            <p className="text-blue-100 mt-2 text-sm md:text-base">
              Comprehensive analytics and insights for your team
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
              </motion.button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
                  >
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                    >
                      <FileText className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        handleExportPDF();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        handlePrint();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Date Presets & Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/20"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-4">
                {datePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleDatePreset(preset.value)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      comparisonPeriod === preset.value
                        ? "bg-white text-blue-600 shadow-lg"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Selected Period Jobs"
              value={stats?.todaysJobs || 0}
              total={stats?.totalJobs || 0}
              icon={BarChart3}
              color="blue"
              trend={{ value: 12.5, isPositive: true }}
            />
            <MetricCard
              title="Selected Period Revenue"
              value={`₹${(stats?.todaysAmount || 0).toLocaleString()}`}
              total={`₹${(stats?.totalAmount || 0).toLocaleString()}`}
              icon={DollarSign}
              color="green"
              trend={{ value: 8.3, isPositive: true }}
            />
            <MetricCard
              title="Cash Collections"
              value={`₹${(stats?.todaysCash || 0).toLocaleString()}`}
              total={`₹${(stats?.totalCash || 0).toLocaleString()}`}
              icon={Banknote}
              color="yellow"
              trend={{ value: 5.2, isPositive: false }}
            />
            <MetricCard
              title="Digital Payments"
              value={`₹${((stats?.todaysCard || 0) + (stats?.todaysBank || 0)).toLocaleString()}`}
              total={`₹${((stats?.totalCard || 0) + (stats?.totalBank || 0)).toLocaleString()}`}
              icon={CreditCard}
              color="purple"
              trend={{ value: 15.7, isPositive: true }}
            />
          </div>

          {/* Performance Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HighlightCard
              title="Avg Revenue/Job"
              value={`₹${
                stats?.todaysJobs > 0
                  ? Math.round(stats.todaysAmount / stats.todaysJobs)
                  : 0
              }`}
              icon={Target}
              color="emerald"
            />
            <HighlightCard
              title="Completion Rate"
              value="94%"
              icon={CheckCircle}
              color="blue"
            />
            <HighlightCard
              title="Team Size"
              value="12"
              icon={Users}
              color="purple"
            />
            <HighlightCard
              title="Top Performer"
              value="Rajesh K."
              icon={Award}
              color="amber"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Daily Revenue Trend
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailyTrend}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="url(#colorRevenue)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue (₹)"
                  />
                  <Bar
                    dataKey="jobs"
                    fill="#10b981"
                    name="Jobs"
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Radar */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Performance Metrics
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={performanceMetrics}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    stroke="#6b7280"
                  />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Distribution */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                Payment Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name}: ₹${entry.value.toLocaleString()}`
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Service Type Distribution */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Service Type Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={serviceTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === "breakdown" && (
        <div className="space-y-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Methods Breakdown
            </h3>
            <div className="space-y-4">
              <PaymentMethodRow
                label="Cash"
                selected={stats?.todaysCash || 0}
                total={stats?.totalCash || 0}
                percentage={
                  stats?.totalCash > 0
                    ? Math.round(
                        ((stats?.todaysCash || 0) / (stats?.totalCash || 1)) *
                          100,
                      )
                    : 0
                }
              />
              <PaymentMethodRow
                label="Card"
                selected={stats?.todaysCard || 0}
                total={stats?.totalCard || 0}
                percentage={
                  stats?.totalCard > 0
                    ? Math.round(
                        ((stats?.todaysCard || 0) / (stats?.totalCard || 1)) *
                          100,
                      )
                    : 0
                }
              />
              <PaymentMethodRow
                label="Bank Transfer"
                selected={stats?.todaysBank || 0}
                total={stats?.totalBank || 0}
                percentage={
                  stats?.totalBank > 0
                    ? Math.round(
                        ((stats?.todaysBank || 0) / (stats?.totalBank || 1)) *
                          100,
                      )
                    : 0
                }
              />
            </div>
          </div>

          {/* Worker Performance Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Worker Performance Rankings
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Rank
                    </th>
                    <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Worker
                    </th>
                    <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Jobs
                    </th>
                    <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Revenue
                    </th>
                    <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workerPerformance.map((worker, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="p-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : idx === 1
                                ? "bg-gray-100 text-gray-700"
                                : idx === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          #{idx + 1}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">
                        {worker.name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {worker.jobs}
                      </td>
                      <td className="p-3 font-bold text-green-600">
                        ₹{worker.revenue.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${worker.efficiency}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            {worker.efficiency}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === "comparison" && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Period Comparison
          </h3>
          <div className="space-y-4">
            <ComparisonRow
              label="Total Jobs"
              current={stats?.todaysJobs || 0}
              previous={80}
            />
            <ComparisonRow
              label="Total Revenue"
              current={stats?.todaysAmount || 0}
              previous={25000}
              isCurrency
            />
            <ComparisonRow
              label="Cash Payments"
              current={stats?.todaysCash || 0}
              previous={12000}
              isCurrency
            />
            <ComparisonRow
              label="Digital Payments"
              current={(stats?.todaysCard || 0) + (stats?.todaysBank || 0)}
              previous={13000}
              isCurrency
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* Metric Card */
const MetricCard = ({ title, value, total, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-200",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-yellow-200",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
    },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border}`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-xs text-slate-500">
        All time: <span className="font-semibold">{total}</span>
      </p>
    </motion.div>
  );
};

/* Highlight Card */
const HighlightCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <div
        className={`p-2 rounded-lg inline-block ${colorClasses[color]} mb-3`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h4>
      <p className="text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

/* Payment Method Row */
const PaymentMethodRow = ({ label, selected, total, percentage }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {label}
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          ₹{(selected || 0).toLocaleString()} / ₹{(total || 0).toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1 text-right">{percentage}%</p>
    </div>
  );
};

/* Comparison Row */
const ComparisonRow = ({ label, current, previous, isCurrency = false }) => {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-slate-900 dark:text-white">
          {label}
        </span>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <div className="flex justify-between items-baseline">
        <div>
          <p className="text-xs text-slate-500 mb-1">Current Period</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {isCurrency ? `₹${current.toLocaleString()}` : current}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Previous Period</p>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            {isCurrency ? `₹${previous.toLocaleString()}` : previous}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorReports;
