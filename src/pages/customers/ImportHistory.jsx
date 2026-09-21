import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Filter,
  Calendar,
  Users,
  Car,
  MapPin,
  Building,
  Phone,
  Mail,
  Hash,
  Clock,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { importLogsService } from "../../api/importLogsService";

const ImportHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [filter, setFilter] = useState("all"); // all, created, updated, errors
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchSessions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await importLogsService.list(page, pagination.limit);
      const records = response.data || [];
      const totalRecords = response.total || 0;
      setSessions(records);
      setPagination((prev) => ({
        ...prev,
        page,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / prev.limit) || 1,
      }));
    } catch (error) {
      toast.error("Failed to load import history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(1);
  }, []);

  const toggleSession = (id) => {
    setExpandedSession(expandedSession === id ? null : id);
    setFilter("all");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/customers")}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Import History</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track all customer import operations and changes
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchSessions(pagination.page)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Session List */}
      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading import history...</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-400">
            No Import History
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Import customers from the Customers page to see history here
          </p>
          <button
            onClick={() => navigate("/customers")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Go to Customers
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              isExpanded={expandedSession === session._id}
              onToggle={() => toggleSession(session._id)}
              filter={expandedSession === session._id ? filter : "all"}
              setFilter={setFilter}
              formatDate={formatDate}
            />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchSessions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSessions(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ========== SESSION CARD ========== */
const SessionCard = ({
  session,
  isExpanded,
  onToggle,
  filter,
  setFilter,
  formatDate,
}) => {
  const logs = session.logs || {};
  const changes = logs.changes || [];
  const createdRecords = logs.createdRecords || [];
  const errors = logs.errors || [];

  const totalRecords = createdRecords.length + changes.length + errors.length;

  // Filtered records
  const filteredItems = useMemo(() => {
    const items = [];

    // Add created records
    createdRecords.forEach((rec) => {
      items.push({ ...rec, _type: "created" });
    });

    // Add updated records (changes)
    changes.forEach((rec) => {
      items.push({ ...rec, _type: "updated" });
    });

    // Add errors
    errors.forEach((rec) => {
      items.push({ ...rec, _type: "error" });
    });

    if (filter === "all") return items;
    return items.filter((item) => item._type === filter);
  }, [createdRecords, changes, errors, filter]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Session Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">
                Customer Import
              </p>
              <span className="text-[10px] font-mono text-slate-400">
                #{session._id?.slice(-6)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">
                {formatDate(session.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2">
            {(logs.created || 0) > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-100">
                <PlusCircle className="w-3 h-3 text-green-600" />
                <span className="text-[10px] font-bold text-green-700">
                  {logs.created} created
                </span>
              </span>
            )}
            {(logs.updated || 0) > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-100">
                <RefreshCw className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-bold text-blue-700">
                  {logs.updated} updated
                </span>
              </span>
            )}
            {errors.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-100">
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span className="text-[10px] font-bold text-red-700">
                  {errors.length} errors
                </span>
              </span>
            )}
            {(logs.created || 0) === 0 &&
              (logs.updated || 0) === 0 &&
              errors.length === 0 && (
                <span className="text-xs text-slate-400">No records</span>
              )}
          </div>

          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100">
              {/* Stats Row */}
              <div className="px-5 py-3 bg-slate-50/50 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {logs.success || 0} processed
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {logs.created || 0} new
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {logs.updated || 0} updated
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {errors.length} errors
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-5 pt-3 pb-2 flex gap-1">
                {[
                  {
                    key: "all",
                    label: "All",
                    count:
                      filteredItems.length !==
                      createdRecords.length + changes.length + errors.length
                        ? null
                        : createdRecords.length +
                          changes.length +
                          errors.length,
                  },
                  {
                    key: "created",
                    label: "Created",
                    count: createdRecords.length,
                    color: "text-green-600 bg-green-50 border-green-200",
                  },
                  {
                    key: "updated",
                    label: "Updated",
                    count: changes.length,
                    color: "text-blue-600 bg-blue-50 border-blue-200",
                  },
                  {
                    key: "error",
                    label: "Errors",
                    count: errors.length,
                    color: "text-red-600 bg-red-50 border-red-200",
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      filter === tab.key
                        ? tab.color ||
                          "text-slate-800 bg-white border-slate-300 shadow-sm"
                        : "text-slate-500 bg-transparent border-transparent hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        ({tab.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Records List */}
              <div className="px-5 pb-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-xs">No records match this filter</p>
                  </div>
                ) : (
                  filteredItems.map((item, idx) => {
                    if (item._type === "created") {
                      return <CreatedCard key={`c-${idx}`} record={item} />;
                    }
                    if (item._type === "updated") {
                      return <UpdatedCard key={`u-${idx}`} record={item} />;
                    }
                    if (item._type === "error") {
                      return <ErrorCard key={`e-${idx}`} record={item} />;
                    }
                    return null;
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ========== CREATED CARD ========== */
const CreatedCard = ({ record }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-green-50/50 rounded-lg border border-green-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <PlusCircle className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">
              {record.customerName || "Unknown"}
            </p>
            <p className="text-[10px] text-slate-500">
              {record.mobile && <span>Mobile: {record.mobile}</span>}
              {record.vehicleCount > 0 && (
                <span className="ml-2">• {record.vehicleCount} vehicle(s)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase">
            New
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
            <div className="px-4 pb-3 pt-1 border-t border-green-100 space-y-2">
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-2">
                {record.email && (
                  <DetailPill icon={Mail} label="Email" value={record.email} />
                )}
                {record.flat_no && (
                  <DetailPill icon={Hash} label="Flat" value={record.flat_no} />
                )}
                {record.location && (
                  <DetailPill
                    icon={MapPin}
                    label="Location"
                    value={record.location}
                  />
                )}
                {record.building && (
                  <DetailPill
                    icon={Building}
                    label="Building"
                    value={record.building}
                  />
                )}
              </div>

              {/* Vehicles */}
              {record.vehicles && record.vehicles.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Vehicles Added
                  </p>
                  <div className="space-y-1">
                    {record.vehicles.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-1.5 px-3 rounded-md bg-white border border-green-100 text-xs"
                      >
                        <Car className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="font-bold text-slate-700">
                          {v.registration_no}
                        </span>
                        {v.parking_no && (
                          <span className="text-slate-500">
                            P: {v.parking_no}
                          </span>
                        )}
                        {v.amount > 0 && (
                          <span className="text-green-700 font-medium">
                            ₹{v.amount}
                          </span>
                        )}
                        {v.schedule_type && (
                          <span className="text-slate-400 capitalize">
                            {v.schedule_type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ========== UPDATED CARD ========== */
const UpdatedCard = ({ record }) => {
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
    vehicleCount: "Vehicle Count",
  };

  const formatValue = (field, value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (field === "status") {
      return value === 1 || value === "1"
        ? "Active"
        : value === 2 || value === "2"
          ? "Inactive"
          : String(value);
    }
    return String(value);
  };

  return (
    <div className="bg-blue-50/50 rounded-lg border border-blue-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">
              {record.customerName || "Unknown"}
            </p>
            <p className="text-[10px] text-slate-500">
              {record.mobile && <span>Mobile: {record.mobile}</span>}
              {record.fields && (
                <span className="ml-2">
                  • {record.fields.length} field(s) changed
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
            Updated
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
            <div className="px-4 pb-3 pt-1 border-t border-blue-100 space-y-2">
              {record.fields && record.fields.length > 0 ? (
                record.fields.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white border border-slate-100"
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide w-20 shrink-0">
                      {fieldLabels[f.field] || f.field}
                    </span>
                    <span
                      className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded line-through max-w-[160px] truncate"
                      title={formatValue(f.field, f.before)}
                    >
                      {formatValue(f.field, f.before)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span
                      className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded max-w-[160px] truncate"
                      title={formatValue(f.field, f.after)}
                    >
                      {formatValue(f.field, f.after)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  No field-level changes recorded
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ========== ERROR CARD ========== */
const ErrorCard = ({ record }) => {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50/50 border border-red-100">
      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {record.row && (
            <span className="text-[10px] font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
              Row {record.row}
            </span>
          )}
          {record.name && (
            <span className="text-xs font-bold text-slate-700">
              {record.name}
            </span>
          )}
        </div>
        <p className="text-xs text-red-600 mt-1">
          {record.error ||
            (typeof record === "string" ? record : JSON.stringify(record))}
        </p>
      </div>
      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase shrink-0">
        Failed
      </span>
    </div>
  );
};

/* ========== DETAIL PILL ========== */
const DetailPill = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-100 text-xs">
    <Icon className="w-3 h-3 text-slate-400 shrink-0" />
    <span className="text-slate-400">{label}:</span>
    <span className="font-medium text-slate-700 truncate">{value}</span>
  </div>
);

export default ImportHistory;
