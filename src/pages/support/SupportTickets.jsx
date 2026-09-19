import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LifeBuoy,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import { supportTicketService } from "../../api/supportTicketService";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

const SupportTickets = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    search: "",
    pageNo: 0,
    pageSize: 20,
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportTicketService.list(
        filters.pageNo + 1,
        filters.pageSize,
        {
          status: filters.status,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          search: filters.search || undefined,
        },
      );

      const payload = res || {};
      setRows(Array.isArray(payload.data) ? payload.data : []);
      setTotal(Number(payload.total || 0));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [
    filters.endDate,
    filters.pageNo,
    filters.pageSize,
    filters.search,
    filters.startDate,
    filters.status,
  ]);

  useEffect(() => {
    const timer = setTimeout(loadTickets, 200);
    return () => clearTimeout(timer);
  }, [loadTickets]);

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

  const columns = useMemo(
    () => [
      {
        header: "Ticket",
        accessor: "id",
        className: "min-w-[140px]",
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-800">#{row.id || "-"}</div>
            <div className="text-xs text-slate-500">
              {formatDateTime(row.createdAt)}
            </div>
          </div>
        ),
      },
      {
        header: "Staff",
        accessor: "workerName",
        className: "min-w-[200px]",
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
        header: "Category",
        accessor: "category",
        className: "min-w-[200px]",
        render: (row) => (
          <div className="text-sm font-semibold text-slate-700">
            {row.category || "-"}
          </div>
        ),
      },
      {
        header: "Status",
        accessor: "status",
        className: "min-w-[140px]",
        render: (row) =>
          row.status === "resolved" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Open
            </span>
          ),
      },
      {
        header: "Action",
        accessor: "action",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/support-tickets/${row._id}`)}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
          >
            Open
          </button>
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
      status: "",
      startDate: "",
      endDate: "",
      search: "",
      pageNo: 0,
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl border border-[#e5edff] bg-white/95 p-5 shadow-[0_14px_42px_rgba(19,36,84,0.12)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#13203a] flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-[#1f4ed8]" />
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review staff support requests and update their status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadTickets}
            className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#1f4ed8] hover:bg-[#e2ecff]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-4">
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
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          title="Support Tickets"
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

export default SupportTickets;
