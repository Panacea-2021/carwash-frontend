import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw, Users } from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import staffNotificationService from "../../api/staffNotificationService";

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

const StatTile = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-1 text-2xl font-extrabold text-slate-800">{value}</div>
  </div>
);

const StaffNotificationHistoryByStaff = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
  });

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await staffNotificationService.getCampaignStats({
        status: filters.status,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      const payload = extractPayload(res);
      setStats(payload || null);
    } catch (error) {
      console.error("Failed to load staff-wise stats:", error);
      toast.error("Failed to load staff-wise history");
    } finally {
      setLoading(false);
    }
  }, [filters.endDate, filters.startDate, filters.status]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const rows = useMemo(
    () => (Array.isArray(stats?.perWorker) ? stats.perWorker : []),
    [stats],
  );

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
            <div className="text-xs text-slate-500">{row.mobile || "-"}</div>
          </div>
        ),
      },
      {
        header: "Sent",
        accessor: "sentCount",
        className: "min-w-[90px]",
        render: (row) => (
          <span className="font-bold text-slate-700">{row.sentCount || 0}</span>
        ),
      },
      {
        header: "Opened",
        accessor: "openedCount",
        className: "min-w-[90px]",
        render: (row) => (
          <span className="font-bold text-emerald-700">
            {row.openedCount || 0}
          </span>
        ),
      },
      {
        header: "Not Opened",
        accessor: "unopenedCount",
        className: "min-w-[110px]",
        render: (row) => (
          <span className="font-bold text-amber-700">
            {row.unopenedCount || 0}
          </span>
        ),
      },
      {
        header: "Open Rate",
        accessor: "openRate",
        className: "min-w-[100px]",
        render: (row) => {
          const value = Number(row.openRate || 0);
          const colorClass =
            value >= 70
              ? "text-emerald-700 bg-emerald-50"
              : value >= 40
                ? "text-amber-700 bg-amber-50"
                : "text-rose-700 bg-rose-50";
          return (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${colorClass}`}
            >
              {value}%
            </span>
          );
        },
      },
      {
        header: "Last Opened",
        accessor: "lastOpenedAt",
        className: "min-w-[180px]",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatDateTime(row.lastOpenedAt)}
          </span>
        ),
      },
      {
        header: "Last Sent",
        accessor: "lastSentAt",
        className: "min-w-[180px]",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatDateTime(row.lastSentAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const resetFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl border border-[#dde7ff] bg-white/95 p-5 shadow-[0_14px_42px_rgba(19,36,84,0.12)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#13203a] flex items-center gap-2">
              <Users className="h-6 w-6 text-[#1f4ed8]" />
              Staff-wise Notification History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Measure engagement per staff member with open-rate and timeline
              stats.
            </p>
          </div>

          <button
            type="button"
            onClick={loadStats}
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
          title="Staff Engagement"
          columns={columns}
          data={rows}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default StaffNotificationHistoryByStaff;
