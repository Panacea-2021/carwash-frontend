import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  Copy,
  X,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Components
import DataTable from "../../components/DataTable";
import usePagePermissions from "../../utils/usePagePermissions";

// API
import { importLogsService } from "../../api/importLogsService";

const ImportLogs = () => {
  const pp = usePagePermissions("importLogs");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 100) => {
    setLoading(true);
    try {
      const response = await importLogsService.list(page, limit);
      const records = response.data || [];
      const totalRecords = response.total || 0;

      setData(records);
      setPagination({
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      });
    } catch (error) {
      toast.error("Failed to load import logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Handlers ---
  const handleView = (log) => {
    setSelectedLog(log);
    setModalTab("overview");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Slight delay to clear data so it doesn't flash empty during exit animation
    setTimeout(() => setSelectedLog(null), 300);
  };

  // --- OPTIMIZATION: Limit Displayed Errors ---
  // Renders max 100 items to prevent modal lag
  const displayErrors = useMemo(() => {
    if (!selectedLog?.logs?.errors) return [];
    return selectedLog.logs.errors.slice(0, 100);
  }, [selectedLog]);

  const displayDuplicates = useMemo(() => {
    if (!selectedLog?.logs?.duplicates) return [];
    return selectedLog.logs.duplicates.slice(0, 100);
  }, [selectedLog]);

  const displayChanges = useMemo(() => {
    if (!selectedLog?.logs?.changes) return [];
    return selectedLog.logs.changes.slice(0, 100);
  }, [selectedLog]);

  // Modal tab state
  const [modalTab, setModalTab] = useState("overview");

  // --- Columns ---
  const columns = [
    {
      header: "Date",
      accessor: "createdAt",
      key: "date",
      className: "w-40",
      render: (row) => (
        <span className="text-slate-600 text-sm font-medium">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      key: "type",
      render: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wide">
          {row.type}
        </span>
      ),
    },
    {
      header: "Success",
      accessor: "logs.success",
      key: "success",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-green-600 font-medium">
          <CheckCircle className="w-4 h-4" />
          {row.logs?.success || 0}
        </div>
      ),
    },
    {
      header: "Errors",
      accessor: "logs.errors",
      key: "errors",
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 font-medium ${
            row.logs?.errors?.length > 0 ? "text-red-600" : "text-slate-400"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {row.logs?.errors?.length || 0}
        </div>
      ),
    },
    {
      header: "Duplicates",
      accessor: "logs.duplicates",
      key: "duplicates",
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 font-medium ${
            row.logs?.duplicates?.length > 0
              ? "text-amber-600"
              : "text-slate-400"
          }`}
        >
          <Copy className="w-4 h-4" />
          {row.logs?.duplicates?.length || 0}
        </div>
      ),
    },
    {
      header: "Changes",
      accessor: "logs.changes",
      key: "changes",
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 font-medium ${
            row.logs?.changes?.length > 0 ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {row.logs?.changes?.length || 0}
        </div>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      render: (row) => (
        pp.isActionVisible("view") && (<button
          onClick={() => handleView(row)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>)
      ),
    },
  ];

  return (
    <div className="p-3 w-full">
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Import Logs</h1>
        <p className="text-slate-500 mt-1">
          Track history of bulk data imports
        </p>
      </div> */}

      <DataTable
        title="History"
        columns={pp.filterColumns(columns)}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p, pagination.limit)}
        onLimitChange={(l) => fetchData(1, l)}
      />

      {/* --- OPTIMIZED MODAL --- */}
      <AnimatePresence>
        {isModalOpen && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 1. Light Backdrop (Fast Fade, No Blur) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40"
            />

            {/* 2. Modal Content (Snappy Spring Animation) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Import Details
                  </h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">
                    {selectedLog.type}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Tab Navigation */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {[
                    { key: "overview", label: "Overview", icon: CheckCircle },
                    {
                      key: "errors",
                      label: `Errors (${selectedLog.logs?.errors?.length || 0})`,
                      icon: AlertCircle,
                      color: "text-red-600",
                    },
                    {
                      key: "changes",
                      label: `Changes (${selectedLog.logs?.changes?.length || 0})`,
                      icon: RefreshCw,
                      color: "text-indigo-600",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setModalTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                        modalTab === tab.key
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <tab.icon
                        className={`w-3.5 h-3.5 ${modalTab === tab.key ? tab.color || "text-green-600" : ""}`}
                      />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* === OVERVIEW TAB === */}
                {modalTab === "overview" && (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-green-600">
                          {selectedLog.logs?.success || 0}
                        </span>
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Processed
                        </span>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {selectedLog.logs?.created || 0}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                          Created
                        </span>
                      </div>
                      <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {selectedLog.logs?.updated || 0}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                          Updated
                        </span>
                      </div>
                      <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-red-600">
                          {selectedLog.logs?.errors?.length || 0}
                        </span>
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wide">
                          Errors
                        </span>
                      </div>
                    </div>

                    {/* Duplicate List (CAPPED) */}
                    {displayDuplicates.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Copy className="w-4 h-4 text-amber-500" />{" "}
                            Duplicates
                          </h4>
                          {selectedLog.logs.duplicates.length > 100 && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                              Showing 100 of{" "}
                              {selectedLog.logs.duplicates.length}
                            </span>
                          )}
                        </div>
                        <div className="bg-amber-50/50 rounded-lg border border-amber-100 p-3 max-h-48 overflow-y-auto">
                          <ul className="space-y-2">
                            {displayDuplicates.map((dup, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-amber-700 font-mono break-all bg-white p-2 rounded border border-amber-100/60 shadow-sm"
                              >
                                {typeof dup === "object"
                                  ? JSON.stringify(dup)
                                  : dup}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Quick Changes Summary */}
                    {displayChanges.length > 0 && (
                      <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
                        <p className="text-sm text-indigo-700 font-medium flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          {displayChanges.length} customer(s) were updated
                          during this import.
                          <button
                            onClick={() => setModalTab("changes")}
                            className="text-indigo-600 underline hover:text-indigo-800 font-bold"
                          >
                            View Details →
                          </button>
                        </p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!selectedLog.logs?.errors?.length &&
                      !selectedLog.logs?.duplicates?.length &&
                      !selectedLog.logs?.changes?.length && (
                        <div className="text-center py-8 text-slate-400">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-100" />
                          <p>
                            Clean import. No errors, duplicates, or changes
                            found.
                          </p>
                        </div>
                      )}
                  </>
                )}

                {/* === ERRORS TAB === */}
                {modalTab === "errors" && (
                  <>
                    {displayErrors.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />{" "}
                            Errors
                          </h4>
                          {selectedLog.logs.errors.length > 100 && (
                            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                              Showing 100 of {selectedLog.logs.errors.length}
                            </span>
                          )}
                        </div>
                        <div className="bg-red-50/50 rounded-lg border border-red-100 p-3 max-h-[50vh] overflow-y-auto">
                          <ul className="space-y-2">
                            {displayErrors.map((err, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-red-700 bg-white p-3 rounded border border-red-100/60 shadow-sm"
                              >
                                {typeof err === "object" ? (
                                  <div>
                                    {err.row && (
                                      <span className="font-bold">
                                        Row {err.row}
                                      </span>
                                    )}
                                    {err.name && (
                                      <span className="ml-1 text-red-600">
                                        ({err.name})
                                      </span>
                                    )}
                                    {err.error && (
                                      <span className="ml-1">
                                        — {err.error}
                                      </span>
                                    )}
                                    {!err.error && !err.row && (
                                      <span className="font-mono break-all">
                                        {JSON.stringify(err)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-mono break-all">
                                    {err}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-200" />
                        <p className="text-sm">No errors in this import</p>
                      </div>
                    )}
                  </>
                )}

                {/* === CHANGES TAB === */}
                {modalTab === "changes" && (
                  <>
                    {displayChanges.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-indigo-500" />{" "}
                            Updated Customers
                          </h4>
                          {selectedLog.logs.changes.length > 100 && (
                            <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                              Showing 100 of {selectedLog.logs.changes.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                          {displayChanges.map((change, idx) => (
                            <ChangeCard key={idx} change={change} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-200" />
                        <p className="text-sm">
                          No customer records were modified in this import
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- CHANGE CARD COMPONENT ---------- */
const ChangeCard = ({ change }) => {
  const [expanded, setExpanded] = useState(false);

  const fieldLabels = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    flat_no: "Flat No",
    status: "Status",
    location: "Location",
    building: "Building",
    vehicles_added: "Vehicles",
  };

  const formatValue = (field, value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (field === "status") {
      return value === 1 ? "Active" : value === 2 ? "Inactive" : String(value);
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {change.customerName?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">
              {change.customerName || "Unknown"}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Mobile: {change.mobile || "N/A"} • {change.fields?.length || 0}{" "}
              field(s) changed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
            {change.action}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
              {change.fields?.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide w-20 shrink-0">
                    {fieldLabels[f.field] || f.field}
                  </span>
                  <span
                    className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded line-through max-w-[150px] truncate"
                    title={formatValue(f.field, f.before)}
                  >
                    {formatValue(f.field, f.before)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span
                    className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded max-w-[150px] truncate"
                    title={formatValue(f.field, f.after)}
                  >
                    {formatValue(f.field, f.after)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportLogs;
