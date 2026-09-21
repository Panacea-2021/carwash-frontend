import React, { useState, useEffect, useCallback } from "react";
import { supervisorService } from "../../api/supervisorService";
import {
  Users,
  Phone,
  Building2,
  Store,
  CheckCircle,
  XCircle,
  History,
  RefreshCw,
  Download,
  Loader2,
  X,
  Calendar,
  Briefcase,
  Hash,
  CalendarDays,
  UserCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import DataTable from "../../components/DataTable";
import DateRangePicker from "../../components/DateRangePicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toCalendarRange } from "../../utils/shiftTime";

const SupervisorWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Stats from API (counts across ALL workers, not just current page)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    residence: 0,
    mall: 0,
  });

  // History modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(100);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historyCustomerFilter, setHistoryCustomerFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailWorker, setDetailWorker] = useState(null);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        pageNo: page - 1,
        pageSize: limit,
        search,
        status: statusFilter || undefined,
      };
      const response = await supervisorService.getTeam(params);
      setWorkers(response.data || []);
      setTotal(response.total || 0);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Failed to fetch team:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (selectedWorker && showHistoryModal) {
      fetchWorkerHistory(selectedWorker._id);
    }
  }, [historyPage, historyLimit]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeam();
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF with all workers...", { id: "pdf-export" });

      // Fetch ALL workers (no pagination limit)
      const allResponse = await supervisorService.getTeam({
        pageNo: 0,
        pageSize: 99999,
        search: "",
      });
      const allWorkers = allResponse.data || [];

      const doc = new jsPDF("l", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text("My Team Report", pageWidth / 2, 15, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Total: ${allWorkers.length} workers`,
        pageWidth / 2,
        22,
        { align: "center" },
      );

      const tableData = allWorkers.map((w) => [
        w.id || "",
        w.employeeCode || "-",
        w.name || "",
        w.mobile || "",
        w.service_type || "",
        (w.buildings?.length || 0) + " / " + (w.malls?.length || 0),
        w.status === 1 ? "Active" : "Inactive",
        w.joiningDate || w.createdAt
          ? new Date(w.joiningDate || w.createdAt).toLocaleDateString()
          : "-",
      ]);

      autoTable(doc, {
        head: [
          [
            "ID",
            "Emp Code",
            "Name",
            "Mobile",
            "Service Type",
            "Buildings / Malls",
            "Status",
            "Joining Date",
          ],
        ],
        body: tableData,
        startY: 28,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`team-report-${new Date().getTime()}.pdf`);
      toast.success("PDF exported successfully", { id: "pdf-export" });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF", { id: "pdf-export" });
    }
  };

  const handleViewHistory = async (worker) => {
    setSelectedWorker(worker);
    setHistoryPage(1);
    setHistorySearch("");
    setHistoryCustomerFilter("");
    setShowHistoryModal(true);
    await fetchWorkerHistory(worker._id);
  };

  const handleViewDetail = (worker) => {
    setDetailWorker(worker);
    setShowDetailModal(true);
  };

  const fetchWorkerHistory = async (workerId) => {
    try {
      setHistoryLoading(true);
      // Use standard full-day range for non-residence flow
      const startStr = new Date(dateRange.startDate)
        .toISOString()
        .split("T")[0];
      const endStr = new Date(dateRange.endDate).toISOString().split("T")[0];
      const shiftRange = toCalendarRange(startStr, endStr);

      const params = {
        pageNo: historyPage - 1,
        pageSize: historyLimit,
        search: historySearch || "",
        startDate: shiftRange.startDate,
        endDate: shiftRange.endDate,
        service_type: selectedWorker?.service_type || "residence",
      };

      if (historyCustomerFilter) {
        params.customer = historyCustomerFilter;
      }

      const response = await supervisorService.getWorkerHistory(
        workerId,
        params,
      );
      setHistory(response.data || []);
      setHistoryTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch worker history:", error);
      setHistory([]);
      setHistoryTotal(0);
      toast.error("Failed to load worker history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistorySearch = () => {
    if (selectedWorker) {
      setHistoryPage(1);
      fetchWorkerHistory(selectedWorker._id);
    }
  };

  // Apply client-side service type filter (backend doesn't support it)
  const filteredWorkers = serviceTypeFilter
    ? workers.filter((w) => w.service_type === serviceTypeFilter)
    : workers;

  const columns = [
    {
      header: "ID",
      accessor: "id",
      render: (row) => (
        <div>
          <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
            #{row.id || "N/A"}
          </span>
          {row.employeeCode && (
            <p className="text-xs text-slate-400 mt-0.5">{row.employeeCode}</p>
          )}
        </div>
      ),
    },
    {
      header: "Worker",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {row.profileImage?.url ? (
              <img
                src={row.profileImage.url}
                alt={row.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              row.name?.charAt(0)?.toUpperCase() || "W"
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {row.name}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              {row.mobile}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Service Type",
      accessor: "service_type",
      render: (row) => {
        const typeConfig = {
          residence: {
            label: "Residence",
            bg: "bg-blue-100 text-blue-700",
            icon: Building2,
          },
          mall: {
            label: "Mall",
            bg: "bg-purple-100 text-purple-700",
            icon: Store,
          },
          site: {
            label: "Site",
            bg: "bg-orange-100 text-orange-700",
            icon: Briefcase,
          },
          mobile: {
            label: "Mobile",
            bg: "bg-teal-100 text-teal-700",
            icon: Phone,
          },
          driver: {
            label: "Driver",
            bg: "bg-amber-100 text-amber-700",
            icon: UserCircle,
          },
        };
        const config = typeConfig[row.service_type] || {
          label: row.service_type || "N/A",
          bg: "bg-slate-100 text-slate-700",
          icon: Briefcase,
        };
        const Icon = config.icon;

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        );
      },
    },

    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const statusConfig = {
          1: {
            label: "Active",
            className: "bg-green-100 text-green-700",
            icon: CheckCircle,
          },
          2: {
            label: "Inactive",
            className: "bg-red-100 text-red-700",
            icon: XCircle,
          },
          0: {
            label: "Inactive",
            className: "bg-red-100 text-red-700",
            icon: XCircle,
          },
        };
        const config = statusConfig[row.status] || statusConfig[0];
        const Icon = config.icon;

        return (
          <div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${config.className}`}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            {row.status !== 1 && row.deactivateReason && (
              <p
                className="text-xs text-slate-500 mt-1 max-w-[150px] truncate"
                title={row.deactivateReason}
              >
                {row.deactivateReason}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: "Joined",
      accessor: "createdAt",
      render: (row) => {
        const date = row.joiningDate || row.createdAt;
        return (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{date ? new Date(date).toLocaleDateString() : "N/A"}</span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewHistory(row)}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => handleViewDetail(row)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <UserCircle className="w-4 h-4" />
            View
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16 text-center",
      render: (row) => (
        <span className="font-mono text-sm text-slate-500">
          {row.id || "-"}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      render: (row) => {
        const d = row.date || row.createdAt;
        return (
          <span className="text-sm">
            {d ? new Date(d).toLocaleDateString() : "N/A"}
          </span>
        );
      },
    },
    {
      header: "Completed",
      accessor: "completedDate",
      render: (row) => (
        <span className="text-sm">
          {row.completedDate
            ? new Date(row.completedDate).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const s = (row.status || "pending").toLowerCase();
        const colors =
          s === "completed"
            ? "bg-green-100 text-green-700"
            : s === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-700";
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-bold capitalize ${colors}`}
          >
            {row.status || "pending"}
          </span>
        );
      },
    },
    {
      header: "Vehicle No",
      accessor: "vehicle",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.vehicle?.registration_no || row.registration_no || "-"}
        </span>
      ),
    },
    {
      header: "Parking No",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-sm">
          {row.vehicle?.parking_no || row.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Building",
      accessor: "building",
      render: (row) => (
        <span className="text-sm">
          {row.building?.name || row.mall?.name || "-"}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (row) => {
        const name = row.customer
          ? `${row.customer.firstName || ""} ${row.customer.lastName || ""}`.trim()
          : "-";
        return <span className="text-sm">{name}</span>;
      },
    },
  ];

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Team Members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Users className="w-10 h-10" />
              My Team
            </h1>
            <p className="text-blue-100 mt-2 text-sm md:text-base">
              Manage and monitor workers assigned to your supervision
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
              onClick={handleExportPDF}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </motion.button>
          </div>
        </div>
      </div>

      {/* Statistics Cards — uses stats from API (all workers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Workers"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Data Table */}
      <DataTable
        title={`Team Members (${filteredWorkers.length}${serviceTypeFilter ? " filtered" : ""})`}
        columns={columns}
        data={filteredWorkers}
        loading={loading}
        pagination={{
          page,
          limit,
          total: serviceTypeFilter ? filteredWorkers.length : total,
        }}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        actionButton={
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        }
      />

      {/* Worker Detail Modal */}
      <AnimatePresence>
        {showDetailModal && detailWorker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Detail Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
                      {detailWorker.profileImage?.url ? (
                        <img
                          src={detailWorker.profileImage.url}
                          alt={detailWorker.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        detailWorker.name?.charAt(0)?.toUpperCase() || "W"
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {detailWorker.name}
                      </h2>
                      <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {detailWorker.mobile}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-6 space-y-4">
                <DetailItem
                  icon={Hash}
                  label="Worker ID"
                  value={`#${detailWorker.id || "N/A"}`}
                />
                {detailWorker.employeeCode && (
                  <DetailItem
                    icon={Briefcase}
                    label="Employee Code"
                    value={detailWorker.employeeCode}
                  />
                )}
                <DetailItem
                  icon={Briefcase}
                  label="Service Type"
                  value={
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        detailWorker.service_type === "residence"
                          ? "bg-blue-100 text-blue-700"
                          : detailWorker.service_type === "mall"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {detailWorker.service_type || "N/A"}
                    </span>
                  }
                />
                <DetailItem
                  icon={detailWorker.status === 1 ? CheckCircle : XCircle}
                  label="Status"
                  value={
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        detailWorker.status === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {detailWorker.status === 1 ? "Active" : "Inactive"}
                    </span>
                  }
                />
                {detailWorker.buildings?.length > 0 && (
                  <DetailItem
                    icon={Building2}
                    label="Buildings"
                    value={`${detailWorker.buildings.length} assigned`}
                  />
                )}
                {detailWorker.malls?.length > 0 && (
                  <DetailItem
                    icon={Store}
                    label="Malls"
                    value={`${detailWorker.malls.length} assigned`}
                  />
                )}
                {detailWorker.email && (
                  <DetailItem
                    icon={UserCircle}
                    label="Email"
                    value={detailWorker.email}
                  />
                )}
                {detailWorker.joiningDate && (
                  <DetailItem
                    icon={CalendarDays}
                    label="Joining Date"
                    value={new Date(
                      detailWorker.joiningDate,
                    ).toLocaleDateString()}
                  />
                )}
                <DetailItem
                  icon={Calendar}
                  label="Created"
                  value={
                    detailWorker.createdAt
                      ? new Date(detailWorker.createdAt).toLocaleDateString()
                      : "N/A"
                  }
                />
                <DetailItem
                  icon={Calendar}
                  label="Last Updated"
                  value={
                    detailWorker.updatedAt
                      ? new Date(detailWorker.updatedAt).toLocaleDateString()
                      : "N/A"
                  }
                />
                {detailWorker.deactivateReason && (
                  <DetailItem
                    icon={XCircle}
                    label="Deactivation Reason"
                    value={detailWorker.deactivateReason}
                  />
                )}

                {/* Quick Action */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleViewHistory(detailWorker);
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <History className="w-5 h-5" />
                    View Work History
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedWorker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedWorker.name}&apos;s Washes Report
                    </h2>
                    <p className="text-blue-100 text-sm flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {selectedWorker.mobile}
                      <span className="mx-1">|</span>
                      {selectedWorker.service_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-lg">
                      {historyTotal} of {historyTotal}
                    </span>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Row */}
              <div className="px-6 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-slate-500 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleHistorySearch()
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="min-w-[220px]">
                    <label className="block text-xs text-slate-500 mb-1">
                      Choose date
                    </label>
                    <DateRangePicker
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={(newRange) => setDateRange(newRange)}
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <label className="block text-xs text-slate-500 mb-1">
                      Customer
                    </label>
                    <select
                      value={historyCustomerFilter}
                      onChange={(e) => setHistoryCustomerFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All</option>
                    </select>
                  </div>
                  <button
                    onClick={handleHistorySearch}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                <DataTable
                  title={`Results: ${historyTotal}`}
                  columns={historyColumns}
                  data={history}
                  loading={historyLoading}
                  pagination={{
                    page: historyPage,
                    limit: historyLimit,
                    total: historyTotal,
                  }}
                  onPageChange={setHistoryPage}
                  onLimitChange={(newLimit) => {
                    setHistoryLimit(newLimit);
                    setHistoryPage(1);
                  }}
                  hideSearch={true}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* Detail Item Component */
const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0">
      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
        {value}
      </div>
    </div>
  </div>
);

/* Stat Card Component */
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-600",
      border: "border-green-200",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600",
      border: "border-red-200",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600",
      border: "border-purple-200",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-600",
      border: "border-orange-200",
    },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2.5 rounded-lg ${styles.bg} border ${styles.border}`}
        >
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
      </div>
      <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </motion.div>
  );
};

export default SupervisorWorkers;
