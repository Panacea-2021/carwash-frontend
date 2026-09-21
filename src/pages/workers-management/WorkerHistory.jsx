import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Car,
  User,
  Search,
  Building,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { workerService } from "../../api/workerService";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

const WorkerHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const worker = location.state?.worker || {};

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusHistory, setStatusHistory] = useState([]);

  // --- Date Helpers ---
  const getDateString = (dateObj) => {
    const local = new Date(dateObj);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const getToday = () => getDateString(new Date());

  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return getDateString(d);
  };

  const [dateRange, setDateRange] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      // 1. Ensure endDate captures the full day
      const validEndDate = dateRange.endDate || getToday();

      const params = {
        startDate: dateRange.startDate,
        endDate: `${validEndDate}T23:59:59`, // Include full day
        pageNo: page - 1,
        pageSize: pagination.limit,
        service_type: "residence",
      };

      if (searchTerm && searchTerm.trim() !== "") {
        params.search = searchTerm;
      }

      console.log("🔍 Fetching History Params:", params);

      const response = await workerService.payments(id, params);

      let records = response.data || [];
      const total = response.total || records.length;
      setStatusHistory(response.workerInfo?.statusHistory || []);

      // --- FIX: STRICT DATE SORTING ---
      // We explicitly sort by assignedDate (Scheduled Date) first, fallback to createdAt.
      // This ignores 'Status' and ensures chronological order.
      records.sort((a, b) => {
        const dateA = new Date(a.assignedDate || a.createdAt).getTime();
        const dateB = new Date(b.assignedDate || b.createdAt).getTime();
        return dateB - dateA; // Descending (Newest date first)
      });

      setHistory(records);
      setPagination((prev) => ({
        ...prev,
        page,
        total,
        totalPages: Math.ceil(total / prev.limit) || 1,
      }));
    } catch (error) {
      console.error("❌ Error fetching worker history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setDateRange({
        startDate: getFirstDayOfMonth(),
        endDate: getToday(),
      });
    } else {
      setDateRange((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSearch = () => {
    fetchHistory(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatStatusEvent = (event) => {
    if (event === "deactivated") return "Deactivated";
    if (event === "reactivated") return "Reactivated";
    return event || "-";
  };

  const sortedStatusHistory = [...statusHistory].sort(
    (a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/workers/list")}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workers</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent uppercase">
              {worker.name ? `${worker.name} History` : "Worker History"}
            </h1>
            {worker.mobile && (
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Mobile:{" "}
                <span className="text-indigo-600 font-bold">
                  {worker.mobile}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search vehicle, parking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Picker */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Date Range
            </label>
            <RichDateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-4">
            <button
              onClick={handleSearch}
              className="w-full h-10 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium rounded-md transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
          Worker Status History
        </h3>
        {sortedStatusHistory.length === 0 ? (
          <p className="text-sm text-gray-500">
            No worker status history found.
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {sortedStatusHistory.map((entry, index) => (
              <div
                key={`worker-status-${index}`}
                className="border border-gray-200 rounded-md p-3 bg-gray-50"
              >
                <div className="text-sm font-semibold text-gray-700">
                  {formatStatusEvent(entry.event)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {entry.changedAt
                    ? new Date(entry.changedAt).toLocaleString()
                    : "-"}
                </div>
                {entry.reason && (
                  <div className="text-xs text-rose-600 mt-1">
                    Reason: {entry.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blue Header Stats & Pagination Info */}
      <div className="bg-[#1e88e5] text-white px-6 py-3 flex justify-between items-center rounded-t-lg shadow-md">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="font-medium text-lg">
            Total Records: {pagination.total}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="bg-white/20 px-3 py-1 rounded-md">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 hover:bg-white/20 rounded disabled:opacity-50 transition-colors"
            >
              &lt;
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 hover:bg-white/20 rounded disabled:opacity-50 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No history found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100 font-bold">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Vehicle No</th>
                  <th className="px-6 py-4">Parking No</th>
                  <th className="px-6 py-4">Building</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {history.map((record, index) => {
                  const pageIndex =
                    (pagination.page - 1) * pagination.limit + index + 1;
                  const dateVal = record.assignedDate || record.createdAt;
                  const vehicleNo = record.vehicle?.registration_no || "-";
                  const parkingNo = record.vehicle?.parking_no || "-";
                  const buildingName =
                    record.building?.name || record.location?.address || "-";
                  const customerMobile = record.customer?.mobile || "-";

                  const status = (record.status || "pending").toLowerCase();
                  let statusBadgeClass =
                    "bg-amber-50 text-amber-600 border-amber-100";
                  let StatusIcon = Clock;

                  if (status === "completed") {
                    statusBadgeClass =
                      "bg-emerald-50 text-emerald-600 border-emerald-100";
                    StatusIcon = CheckCircle;
                  } else if (status === "cancelled") {
                    statusBadgeClass = "bg-red-50 text-red-600 border-red-100";
                    StatusIcon = XCircle;
                  }

                  return (
                    <tr
                      key={record._id || index}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-500 font-mono">
                        {pageIndex}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">
                              {formatDateOnly(dateVal)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(dateVal).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                            {vehicleNo}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {parkingNo}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          <span
                            className="text-sm text-slate-700 max-w-[150px] truncate"
                            title={buildingName}
                          >
                            {buildingName}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 font-mono">
                            {customerMobile}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusBadgeClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {record.status || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerHistory;
