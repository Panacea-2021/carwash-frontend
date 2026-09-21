import React, { useState, useEffect, useCallback, useMemo } from "react";
import { paymentService } from "../../api/paymentService";
import {
  Wallet,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  X,
  Calendar,
  Eye,
  Car,
  FileText,
  TrendingUp,
  Landmark,
  Download,
  Receipt,
  ParkingCircle,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DataTable from "../../components/DataTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─────────────────────────────────────────────────────
// Mini SVG Donut
// ─────────────────────────────────────────────────────
const MiniDonut = ({ cash = 0, card = 0, bank = 0, size = 48 }) => {
  const total = cash + card + bank;
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
        />
      </svg>
    );
  }
  const r = 15.9155;
  const circ = 2 * Math.PI * r;
  const cashPct = (cash / total) * 100;
  const cardPct = (card / total) * 100;
  const bankPct = (bank / total) * 100;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth="3.5"
        strokeDasharray={`${(cashPct / 100) * circ} ${circ}`}
        strokeDashoffset="0"
        transform="rotate(-90 18 18)"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="3.5"
        strokeDasharray={`${(cardPct / 100) * circ} ${circ}`}
        strokeDashoffset={`${-((cashPct / 100) * circ)}`}
        transform="rotate(-90 18 18)"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="3.5"
        strokeDasharray={`${(bankPct / 100) * circ} ${circ}`}
        strokeDashoffset={`${-(((cashPct + cardPct) / 100) * circ)}`}
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════
// SUPERVISOR SETTLEMENTS PAGE
// ═══════════════════════════════════════════════════════
const SupervisorSettlements = () => {
  const currency = localStorage.getItem("app_currency") || "AED";

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // ─── Fetch ───
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentService.getSettlements(page, limit);
      setSettlements(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
      toast.error("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Refreshed!");
  };

  // ─── Fetch ALL for stats (separate call with large pageSize) ───
  const [allSettlements, setAllSettlements] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setStatsLoading(true);
        const res = await paymentService.getSettlements(1, 99999);
        setAllSettlements(res.data || []);
      } catch (e) {
        console.error("Stats fetch error:", e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Computed Stats from ALL settlements ───
  const stats = useMemo(() => {
    const src = allSettlements;
    const totalAmount = src.reduce((s, r) => s + (r.amount || 0), 0);
    const totalCash = src.reduce((s, r) => s + (r.cash || 0), 0);
    const totalCard = src.reduce((s, r) => s + (r.card || 0), 0);
    const totalBank = src.reduce((s, r) => s + (r.bank || 0), 0);
    const pending = src.filter((r) => r.status !== "completed").length;
    const completed = src.filter((r) => r.status === "completed").length;
    const totalPayments = src.reduce(
      (s, r) => s + (r.payments?.length || 0),
      0,
    );
    return {
      totalAmount,
      totalCash,
      totalCard,
      totalBank,
      pending,
      completed,
      totalPayments,
    };
  }, [allSettlements]);

  // ─── View Detail ───
  const handleViewDetail = (row) => {
    setSelectedSettlement(row);
    setShowDetailModal(true);
  };

  // ─── Export PDF ───
  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf" });

      let pdfData = allSettlements.length > 0 ? allSettlements : settlements;
      if (pdfData.length === 0 && total > 0) {
        const res = await paymentService.getSettlements(1, 99999);
        pdfData = res.data || [];
      }

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138);
      doc.text("My Settlements Report", 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Total: ${pdfData.length} settlements`, 14, 30);

      const rows = pdfData.map((s, i) => [
        i + 1,
        fmtDate(s.createdAt),
        `${fmt(s.amount)} ${currency}`,
        `${fmt(s.cash)}`,
        `${fmt(s.card)}`,
        `${fmt(s.bank)}`,
        s.payments?.length || 0,
        (s.status || "pending").toUpperCase(),
      ]);

      autoTable(doc, {
        startY: 35,
        head: [
          ["#", "Date", "Total", "Cash", "Card", "Bank", "Payments", "Status"],
        ],
        body: rows,
        theme: "grid",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        styles: { fontSize: 8, cellPadding: 3, halign: "center" },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
        },
      });

      const fY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      const grandTotal = pdfData.reduce((s, r) => s + (r.amount || 0), 0);
      doc.text(`Grand Total: ${fmt(grandTotal)} ${currency}`, 14, fY);

      doc.save("my-settlements-report.pdf");
      toast.success("PDF downloaded!", { id: "pdf" });
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("PDF generation failed", { id: "pdf" });
    }
  };

  // ─── Stat Cards ───
  const statCards = [
    {
      label: "Total Settlements",
      value: total,
      icon: Wallet,
      gradient: "from-indigo-500 to-violet-600",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      ring: "ring-indigo-200",
    },
    {
      label: "Total Amount",
      value: fmt(stats.totalAmount),
      suffix: currency,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-200",
    },
    {
      label: "Cash",
      value: fmt(stats.totalCash),
      suffix: currency,
      icon: Banknote,
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-50",
      text: "text-green-600",
      ring: "ring-green-200",
    },
    {
      label: "Card",
      value: fmt(stats.totalCard),
      suffix: currency,
      icon: CreditCard,
      gradient: "from-blue-500 to-cyan-600",
      bg: "bg-blue-50",
      text: "text-blue-600",
      ring: "ring-blue-200",
    },
    {
      label: "Bank Transfer",
      value: fmt(stats.totalBank),
      suffix: currency,
      icon: Landmark,
      gradient: "from-purple-500 to-violet-600",
      bg: "bg-purple-50",
      text: "text-purple-600",
      ring: "ring-purple-200",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      text: "text-amber-600",
      ring: "ring-amber-200",
    },
  ];

  // ─── Table Columns ───
  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">
              {fmtDate(row.createdAt)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {fmtTime(row.createdAt)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <div className="text-right">
          <span className="text-base font-extrabold text-slate-800">
            {fmt(row.amount)}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 ml-1">
            {currency}
          </span>
        </div>
      ),
    },
    {
      key: "breakdown",
      header: "Breakdown",
      render: (row) => (
        <div className="flex items-center gap-2">
          <MiniDonut
            cash={row.cash || 0}
            card={row.card || 0}
            bank={row.bank || 0}
            size={30}
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">
              <Banknote className="w-3 h-3" />
              {fmt(row.cash)}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
              <CreditCard className="w-3 h-3" />
              {fmt(row.card)}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">
              <Landmark className="w-3 h-3" />
              {fmt(row.bank)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "payments",
      header: "Washes",
      className: "text-center",
      render: (row) => (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
            <Receipt className="w-3 h-3" />
            {row.payments?.length || 0}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (row) => {
        const done = row.status === "completed";
        return (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                done
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              {done ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {row.status || "pending"}
            </span>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Details",
      className: "text-center",
      render: (row) => (
        <div className="flex justify-center">
          <button
            onClick={() => handleViewDetail(row)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 transition-all hover:shadow-sm active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        </div>
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 md:p-6 font-sans"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── HEADER ─── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              My Settlements
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track your daily settlement reports &amp; payment breakdowns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            disabled={loading || total === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-70"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* ─── STAT CARDS ─── */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"
      >
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            variants={scaleIn}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm p-4 shadow-lg shadow-slate-100 hover:shadow-xl transition-all ring-1 ${card.ring}`}
          >
            <div
              className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl`}
            />
            <div className="relative z-10">
              <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-2.5`}>
                <card.icon className={`w-4 h-4 ${card.text}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-800">
                  {statsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  ) : (
                    card.value
                  )}
                </span>
                {card.suffix && !statsLoading && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {card.suffix}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── REVENUE BREAKDOWN BAR ─── */}
      {!statsLoading && stats.totalAmount > 0 && (
        <motion.div
          variants={itemVariants}
          className="mb-6 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm p-5 shadow-lg shadow-slate-100"
        >
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Revenue Breakdown
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{
                  width: `${(stats.totalCash / stats.totalAmount) * 100}%`,
                }}
              />
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700"
                style={{
                  width: `${(stats.totalCard / stats.totalAmount) * 100}%`,
                }}
              />
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-700"
                style={{
                  width: `${(stats.totalBank / stats.totalAmount) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { color: "bg-emerald-500", label: "Cash", val: stats.totalCash },
              { color: "bg-blue-500", label: "Card", val: stats.totalCard },
              { color: "bg-purple-500", label: "Bank", val: stats.totalBank },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-slate-500">{item.label}</span>
                <span className="font-bold text-slate-700">
                  {fmt(item.val)} {currency}
                </span>
                <span className="text-slate-400">
                  (
                  {stats.totalAmount > 0
                    ? ((item.val / stats.totalAmount) * 100).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── TABLE ─── */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-100 overflow-hidden"
      >
        <DataTable
          title="Settlements"
          columns={columns}
          data={settlements}
          loading={loading}
          pagination={{ page, limit, total }}
          onPageChange={(p) => setPage(p)}
          emptyMessage="No settlements found"
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          DETAIL MODAL — View Payments inside a Settlement
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDetailModal && selectedSettlement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">
                      Settlement Details
                    </h2>
                    <p className="text-xs text-slate-500">
                      {fmtDate(selectedSettlement.createdAt)} at{" "}
                      {fmtTime(selectedSettlement.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-full hover:bg-white/80 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ── Body ── */}
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)]">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: "Total",
                      val: selectedSettlement.amount,
                      from: "from-indigo-50",
                      to: "to-violet-50",
                      border: "border-indigo-100",
                      text: "text-indigo-700",
                      sub: "text-indigo-400",
                    },
                    {
                      label: "Cash",
                      val: selectedSettlement.cash,
                      from: "from-emerald-50",
                      to: "to-green-50",
                      border: "border-emerald-100",
                      text: "text-emerald-700",
                      sub: "text-emerald-400",
                    },
                    {
                      label: "Card",
                      val: selectedSettlement.card,
                      from: "from-blue-50",
                      to: "to-cyan-50",
                      border: "border-blue-100",
                      text: "text-blue-700",
                      sub: "text-blue-400",
                    },
                    {
                      label: "Bank",
                      val: selectedSettlement.bank,
                      from: "from-purple-50",
                      to: "to-violet-50",
                      border: "border-purple-100",
                      text: "text-purple-700",
                      sub: "text-purple-400",
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className={`bg-gradient-to-br ${c.from} ${c.to} rounded-xl p-3 border ${c.border}`}
                    >
                      <p
                        className={`text-[10px] font-bold ${c.sub} uppercase tracking-wider`}
                      >
                        {c.label}
                      </p>
                      <p className={`text-xl font-extrabold ${c.text} mt-1`}>
                        {fmt(c.val)}
                        <span className={`text-xs font-bold ${c.sub} ml-1`}>
                          {currency}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Status + donut row */}
                <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {(selectedSettlement.amount || 0) > 0 && (
                    <MiniDonut
                      cash={selectedSettlement.cash || 0}
                      card={selectedSettlement.card || 0}
                      bank={selectedSettlement.bank || 0}
                      size={64}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-500">
                        Status:
                      </span>
                      {selectedSettlement.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-extrabold uppercase border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-extrabold uppercase border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      {[
                        {
                          color: "bg-emerald-500",
                          label: "Cash",
                          val: selectedSettlement.cash,
                        },
                        {
                          color: "bg-blue-500",
                          label: "Card",
                          val: selectedSettlement.card,
                        },
                        {
                          color: "bg-purple-500",
                          label: "Bank",
                          val: selectedSettlement.bank,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-1.5"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                          />
                          <span className="text-slate-500">{item.label}:</span>
                          <span className="font-bold text-slate-700">
                            {fmt(item.val)} {currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold">
                      WASHES
                    </p>
                    <p className="text-2xl font-extrabold text-indigo-600">
                      {selectedSettlement.payments?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Payments list */}
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-500" />
                  Payments Included
                </h3>

                {selectedSettlement.payments?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSettlement.payments.map((p, i) => (
                      <div
                        key={p._id || p.id || i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
                      >
                        {/* Index */}
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] font-bold border border-indigo-100 flex-shrink-0">
                          {i + 1}
                        </span>
                        {/* Vehicle */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <Car className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {p.vehicle?.registration_no || "No Reg. No"}
                            </p>
                            {p.vehicle?.parking_no && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <ParkingCircle className="w-2.5 h-2.5" />
                                {p.vehicle.parking_no}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-extrabold text-slate-800">
                            {fmt(p.amount_paid || p.amount_charged)}
                            <span className="text-[9px] text-slate-400 ml-0.5">
                              {currency}
                            </span>
                          </p>
                          {p.tip_amount > 0 && (
                            <p className="text-[10px] text-amber-500 font-bold">
                              +{fmt(p.tip_amount)} tip
                            </p>
                          )}
                        </div>
                        {/* Mode badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 ${
                            p.payment_mode === "cash"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : p.payment_mode === "card"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : "bg-purple-50 text-purple-600 border-purple-100"
                          }`}
                        >
                          {p.payment_mode === "cash" ? (
                            <Banknote className="w-3 h-3" />
                          ) : p.payment_mode === "card" ? (
                            <CreditCard className="w-3 h-3" />
                          ) : (
                            <Landmark className="w-3 h-3" />
                          )}
                          {p.payment_mode || "—"}
                        </span>
                        {/* Settled */}
                        <div className="flex-shrink-0">
                          {p.settled === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">
                      No payments in this settlement
                    </p>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SupervisorSettlements;
