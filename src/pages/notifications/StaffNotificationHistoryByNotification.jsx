import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Filter, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import staffNotificationService from "../../api/staffNotificationService";
import { workerService } from "../../api/workerService";

const PAGE_SIZE_DEFAULT = 20;

const extractPayload = (response) => {
  const root = response?.data ?? response ?? {};
  return root?.data ?? root;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const StatTile = ({ label, value, success, danger }) => {
  const colorClass = success
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : danger
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${colorClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold leading-none">{value}</div>
    </div>
  );
};

const StaffNotificationHistoryByNotification = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({
    workerId: "",
    status: "all",
    startDate: "",
    endDate: "",
    search: "",
    pageNo: 0,
    pageSize: PAGE_SIZE_DEFAULT,
  });

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await workerService.list(1, 300, "", 1);
        setStaff(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load staff for filters:", error);
      }
    };

    loadStaff();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        pageNo: filters.pageNo,
        pageSize: filters.pageSize,
        status: filters.status,
        workerId: filters.workerId || undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };

      const [historyRes, statsRes] = await Promise.all([
        staffNotificationService.getCampaignHistory(params),
        staffNotificationService.getCampaignStats({
          status: filters.status,
          workerId: filters.workerId || undefined,
          search: filters.search || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
      ]);

      const historyPayload = extractPayload(historyRes);
      const statsPayload = extractPayload(statsRes);

      const parsedRows = Array.isArray(historyPayload?.data)
        ? historyPayload.data
        : [];

      setRows(parsedRows);
      setTotal(Number(historyPayload?.total || 0));
      setStats(statsPayload || null);
    } catch (error) {
      console.error("Failed to load notification history:", error);
      toast.error("Failed to load notification-wise history");
    } finally {
      setLoading(false);
    }
  }, [
    filters.workerId,
    filters.endDate,
    filters.pageNo,
    filters.pageSize,
    filters.search,
    filters.startDate,
    filters.status,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 220);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  const columns = useMemo(
    () => [
      {
        header: "Staff",
        accessor: "workerName",
        className: "min-w-[220px]",
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-800">
              {row.workerName || "Unknown Staff"}
            </div>
            <div className="text-xs text-slate-500">
              {row.workerMobile || row.worker || "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Notification",
        accessor: "title",
        className: "min-w-[280px]",
        render: (row) => (
          <div className="max-w-[340px] whitespace-normal">
            <div className="font-semibold text-slate-800">
              {row.title || "-"}
            </div>
            <div className="mt-1 line-clamp-2 text-xs text-slate-500">
              {row.message || "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Route",
        accessor: "route",
        className: "min-w-[180px]",
        render: (row) => (
          <span className="font-semibold text-[#1f4ed8]">
            {row.route || "/notifications"}
          </span>
        ),
      },
      {
        header: "Sent At",
        accessor: "sentAt",
        className: "min-w-[180px]",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatDateTime(row.sentAt || row.createdAt)}
          </span>
        ),
      },
      {
        header: "Opened At",
        accessor: "openedAt",
        className: "min-w-[180px]",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatDateTime(row.openedAt || row.readAt)}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: "isRead",
        className: "min-w-[120px]",
        render: (row) =>
          row.isRead ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              Opened
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              Not Opened
            </span>
          ),
      },
    ],
    [],
  );

  const pagination = useMemo(
    () => ({
      page: filters.pageNo + 1,
      limit: filters.pageSize,
      total,
      displayTotal: total,
    }),
    [filters.pageNo, filters.pageSize, total],
  );

  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      workerId: "",
      status: "all",
      startDate: "",
      endDate: "",
      search: "",
      pageNo: 0,
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl border border-[#dde7ff] bg-white/95 p-5 shadow-[0_14px_42px_rgba(19,36,84,0.12)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#13203a] flex items-center gap-2">
              <BellRing className="h-6 w-6 text-[#1f4ed8]" />
              Staff Notification-wise History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete timeline of every notification sent to each staff member.
            </p>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#1f4ed8] hover:bg-[#e2ecff]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile label="Total Sent" value={stats?.totalSent || 0} />
          <StatTile label="Total Opened" value={stats?.totalOpened || 0} />
          <StatTile label="Total Unread" value={stats?.totalUnread || 0} />
          <StatTile label="Open Rate %" value={stats?.openRate ?? 0} />
          <StatTile
            label="Staff Notified"
            value={stats?.uniqueStaffNotified || 0}
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
              Staff
            </label>
            <select
              value={filters.workerId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  workerId: e.target.value,
                  pageNo: 0,
                }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4ed8] focus:ring-4 focus:ring-[#1f4ed8]/15"
            >
              <option value="">All Staff</option>
              {staff.map((worker) => (
                <option key={worker._id} value={worker._id}>
                  {worker.name || "Unnamed Staff"}
                  {worker.mobile ? ` (${worker.mobile})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
              Status Scope
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4ed8] focus:ring-4 focus:ring-[#1f4ed8]/15"
            >
              <option value="all">All</option>
              <option value="opened">Opened</option>
              <option value="unopened">Not Opened</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4ed8] focus:ring-4 focus:ring-[#1f4ed8]/15"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4ed8] focus:ring-4 focus:ring-[#1f4ed8]/15"
            />
          </div>

          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </div>

        <DataTable
          title="Notification History"
          columns={columns}
          data={rows}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) =>
            setFilters((prev) => ({ ...prev, pageNo: Math.max(page - 1, 0) }))
          }
          onLimitChange={(limit) =>
            setFilters((prev) => ({ ...prev, pageSize: limit, pageNo: 0 }))
          }
          onSearch={(searchValue) =>
            setFilters((prev) => ({ ...prev, search: searchValue, pageNo: 0 }))
          }
        />
      </div>
    </div>
  );
};

export default StaffNotificationHistoryByNotification;
