import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  CheckCircle2,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import staffNotificationService from "../../api/staffNotificationService";
import { workerService } from "../../api/workerService";

const PAGE_SIZE_DEFAULT = 15;

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

const KpiTile = ({ icon: Icon, label, value, tone = "slate" }) => {
  const classes = {
    slate: "border-slate-200 bg-white text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${classes[tone] || classes.slate}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold leading-none">{value}</div>
    </div>
  );
};

const StaffNotificationTracking = () => {
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
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
        console.error("Failed to load staff for notification tracking:", error);
      }
    };

    loadStaff();
  }, []);

  const loadTracking = useCallback(async () => {
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

      setRows(Array.isArray(historyPayload?.data) ? historyPayload.data : []);
      setTotal(Number(historyPayload?.total || 0));
      setStats(statsPayload || null);
    } catch (error) {
      console.error("Failed to load notification tracking:", error);
      toast.error("Failed to load notification tracking");
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
      loadTracking();
    }, 220);
    return () => clearTimeout(timer);
  }, [loadTracking]);

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
        header: "Campaign",
        accessor: "title",
        className: "min-w-[240px]",
        render: (row) => (
          <div className="max-w-[320px] whitespace-normal">
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
        header: "Behavior",
        accessor: "data",
        className: "min-w-[150px]",
        render: (row) => {
          const mode =
            row?.data?.openBehavior === "page" ? "Direct Page" : "Details";
          return (
            <span className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-xs font-bold text-[#1f4ed8]">
              {mode}
            </span>
          );
        },
      },
      {
        header: "Route",
        accessor: "route",
        className: "min-w-[170px]",
        render: (row) => (
          <span className="text-xs font-semibold text-[#1f4ed8]">
            {row.route || "/notifications"}
          </span>
        ),
      },
      {
        header: "Sent",
        accessor: "sentAt",
        className: "min-w-[170px]",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatDateTime(row.sentAt || row.createdAt)}
          </span>
        ),
      },
      {
        header: "Opened",
        accessor: "openedAt",
        className: "min-w-[170px]",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatDateTime(row.openedAt || row.readAt)}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: "isRead",
        className: "min-w-[110px]",
        render: (row) =>
          row.isRead ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              Opened
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              Pending
            </span>
          ),
      },
    ],
    [],
  );

  const topStaff = useMemo(
    () => (Array.isArray(stats?.perWorker) ? stats.perWorker.slice(0, 6) : []),
    [stats],
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
              <Activity className="h-6 w-6 text-[#1f4ed8]" />
              Staff Notification Tracking
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Live monitoring of sent, opened, and pending notification
              behavior.
            </p>
          </div>

          <button
            type="button"
            onClick={loadTracking}
            className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#1f4ed8] hover:bg-[#e2ecff]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <KpiTile
            icon={BellRing}
            label="Total Sent"
            value={stats?.totalSent || 0}
            tone="blue"
          />
          <KpiTile
            icon={CheckCircle2}
            label="Opened"
            value={stats?.totalOpened || 0}
            tone="emerald"
          />
          <KpiTile
            icon={TrendingUp}
            label="Open Rate %"
            value={stats?.openRate ?? 0}
            tone="slate"
          />
          <KpiTile
            icon={Users}
            label="Staff Notified"
            value={stats?.uniqueStaffNotified || 0}
            tone="slate"
          />
          <KpiTile
            icon={Users}
            label="Staff Opened"
            value={stats?.uniqueStaffOpened || 0}
            tone="emerald"
          />
          <KpiTile
            icon={Activity}
            label="Pending Open"
            value={stats?.totalUnread || 0}
            tone="amber"
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
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
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                  pageNo: 0,
                }))
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
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                  pageNo: 0,
                }))
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
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                  pageNo: 0,
                }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4ed8] focus:ring-4 focus:ring-[#1f4ed8]/15"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-5 flex justify-end">
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

        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="border-b border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
            Top Staff by Engagement
          </div>
          <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
            {topStaff.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                No staff engagement data available for selected filters.
              </div>
            ) : (
              topStaff.map((item) => (
                <div
                  key={item.workerId || item.mobile || item.workerName}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="font-semibold text-slate-800">
                    {item.workerName || "Unknown Staff"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.mobile || "-"}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Sent: {item.sentCount || 0}
                    </span>
                    <span className="font-bold text-emerald-700">
                      Open Rate: {item.openRate || 0}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DataTable
          title="Recent Notification Events"
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

export default StaffNotificationTracking;
