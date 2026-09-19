import React, { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  Edit2,
  Download,
  Search,
  Filter,
  User,
  CreditCard,
  Banknote,
  Briefcase,
  Layers,
  Calendar,
  Car,
  MapPin,
  Coins,
  Loader2,
  Droplets,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import DataTable from "../../components/DataTable";
import OneWashModal from "../../components/modals/OneWashModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown";

import { oneWashService } from "../../api/oneWashService";
import { supervisorService } from "../../api/supervisorService";

const SupervisorOnewash = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [currency, setCurrency] = useState("AED");

  const [stats, setStats] = useState({
    totalAmount: 0,
    totalJobs: 0,
    cash: 0,
    card: 0,
    bank: 0,
    outsideCount: 0,
    insideOutsideCount: 0,
    residenceCount: 0,
    outsideAmount: 0,
    insideOutsideAmount: 0,
    residenceAmount: 0,
  });

  const [workers, setWorkers] = useState([]);

  // --- DATE HELPERS ---
  const formatDateLocal = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getToday = () => formatDateLocal(new Date());

  const getFirstOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return formatDateLocal(d);
  };

  const [filters, setFilters] = useState({
    startDate: getToday(),
    endDate: getToday(),
    worker: "",
    payment_mode: "",
    wash_type: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadData = async () => {
      const savedCurrency = localStorage.getItem("app_currency");
      if (savedCurrency) setCurrency(savedCurrency);

      try {
        const res = await supervisorService.getTeam({
          pageNo: 0,
          pageSize: 1000,
        });
        console.log("✅ [Supervisor Onewash] Team loaded:", res);
        setWorkers(res.data || []);
      } catch (e) {
        console.error("❌ [Supervisor Onewash] Failed to load team:", e);
      }
    };
    loadData();
  }, []);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchData = async (page = 1, limit = 100) => {
    if (!filters.startDate || !filters.endDate) return;

    setLoading(true);
    try {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Invalid Date Range Selected");
        setLoading(false);
        return;
      }

      const apiFilters = {
        ...filters,
      };

      // Send team worker IDs so only team data is returned
      if (!filters.worker && workers.length > 0) {
        apiFilters.workers = workers.map((w) => w._id);
      }

      console.log("📤 [Supervisor Onewash] Fetching data with:", {
        page,
        limit,
        searchTerm,
        apiFilters,
      });

      const res = await oneWashService.list(
        page,
        limit,
        searchTerm,
        apiFilters,
      );

      console.log("📥 [Supervisor Onewash] API Response:", res);

      setData(res.data || []);
      if (res.counts) setStats(res.counts);

      const total =
        res.total !== undefined ? res.total : res.data ? res.data.length : 0;

      setPagination({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- EXPORT LOGIC ---
  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Please select a valid date range");
      return;
    }

    setExporting(true);
    try {
      const apiFilters = {
        ...filters,
      };

      const res = await oneWashService.list(1, 10000, searchTerm, apiFilters);
      const exportData = res.data || [];

      if (exportData.length === 0) {
        toast.error("No data to export");
        setExporting(false);
        return;
      }

      const detailedData = exportData.map((item) => {
        let washType = "-";
        if (item.service_type === "residence") {
          washType = "Residence";
        } else if (item.wash_type === "outside") {
          washType = "Outside";
        } else if (item.wash_type === "total") {
          washType = "Inside + Outside";
        } else if (item.wash_type === "inside") {
          washType = "Inside";
        }

        return {
          ID: item.id,
          Date: new Date(item.createdAt).toLocaleDateString(),
          "Service Type": washType,
          "Mall/Building": item.mall?.name || item.building?.name || "-",
          Vehicle: item.registration_no,
          Parking: item.parking_no,
          "Original Amount": (item.amount - (item.tip_amount || 0)).toFixed(2),
          "Tip Amount":
            item.service_type === "residence" ? "-" : item.tip_amount || 0,
          "Total Amount": item.amount,
          "Payment Mode": item.payment_mode,
          Status: item.status,
          Worker: item.worker?.name || "Unassigned",
        };
      });

      const summaryMap = {};
      exportData.forEach((item) => {
        const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
        let locationName = "Unknown";
        if (item.service_type === "mall" && item.mall?.name) {
          locationName = item.mall.name;
        } else if (item.service_type === "residence" && item.building?.name) {
          locationName = item.building.name;
        }
        const compositeKey = `${dateKey}_${locationName}`;
        if (!summaryMap[compositeKey]) {
          summaryMap[compositeKey] = {
            date: dateKey,
            location: locationName,
            count: 0,
            type: item.service_type === "mall" ? "Mall" : "Building",
          };
        }
        summaryMap[compositeKey].count += 1;
      });

      const summaryArray = Object.values(summaryMap).sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );
      const mallSummary = summaryArray.filter((i) => i.type === "Mall");
      const buildingSummary = summaryArray.filter((i) => i.type === "Building");

      const summarySheetRows = [];
      if (mallSummary.length > 0) {
        summarySheetRows.push(["Day", "Mall", "Count"]);
        mallSummary.forEach((m) =>
          summarySheetRows.push([m.date, m.location, m.count]),
        );
        summarySheetRows.push([], []);
      }
      if (buildingSummary.length > 0) {
        summarySheetRows.push(["Day", "Building", "Count"]);
        buildingSummary.forEach((b) =>
          summarySheetRows.push([b.date, b.location, b.count]),
        );
      }

      const workbook = XLSX.utils.book_new();
      if (summarySheetRows.length > 0) {
        const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetRows);
        XLSX.utils.book_append_sheet(workbook, wsSummary, "Report");
      }
      const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, wsDetailed, "Detailed Report");

      XLSX.writeFile(workbook, `OneWash_Report_${filters.startDate}.xlsx`);
      toast.success("Export successful!");
    } catch (e) {
      console.error("Export Error:", e);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // --- HANDLERS ---
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getToday(),
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEdit = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job record?")) return;
    try {
      await oneWashService.delete(id);
      toast.success("Deleted successfully");
      fetchData(pagination.page, pagination.limit);
    } catch {
      toast.error("Delete failed");
    }
  };

  // --- DROPDOWN OPTIONS ---
  const serviceTypeOptions = [
    { value: "", label: "All Services" },
    { value: "mall", label: "Mall" },
    { value: "residence", label: "Residence" },
  ];

  const workerOptions = useMemo(() => {
    const options = [{ value: "", label: "All Workers" }];
    workers.forEach((w) => options.push({ value: w._id, label: w.name }));
    return options;
  }, [workers]);

  // --- COLUMNS (matching the screenshot exactly) ---
  const columns = [
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-slate-700 font-medium text-sm">
          {new Date(row.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
      ),
    },
    {
      header: "Vehicle No",
      accessor: "registration_no",
      render: (row) => (
        <span className="font-semibold text-slate-700">
          {row.registration_no}
        </span>
      ),
    },
    {
      header: "Parking No",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-slate-600">{row.parking_no || "-"}</span>
      ),
    },
    {
      header: "Wash Type",
      accessor: "wash_type",
      render: (row) => {
        if (!row.wash_type) return <span className="text-slate-400">-</span>;
        const labels = {
          outside: "Outside",
          total: "Inside + Outside",
          inside: "Inside",
        };
        const colors = {
          outside: "bg-blue-100 text-blue-700",
          total: "bg-purple-100 text-purple-700",
          inside: "bg-teal-100 text-teal-700",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ${colors[row.wash_type] || "bg-slate-100 text-slate-700"}`}
          >
            {labels[row.wash_type] || row.wash_type}
          </span>
        );
      },
    },
    {
      header: "Original Amount",
      accessor: "original_amount",
      render: (row) => (
        <span className="font-bold text-slate-800 flex items-center gap-1">
          <span className="text-[10px] text-emerald-600 font-extrabold">
            {currency}
          </span>
          {(row.amount - (row.tip_amount || 0)).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Tip",
      accessor: "tip_amount",
      className: "text-right",
      render: (row) => {
        if (row.service_type === "residence") {
          return <span className="text-xs text-slate-400">-</span>;
        }
        return (
          <span className="text-xs text-slate-600">
            {row.tip_amount ? `${row.tip_amount}` : "0"}
          </span>
        );
      },
    },
    {
      header: "Total Amount",
      accessor: "amount",
      render: (row) => (
        <span className="font-bold text-slate-800 flex items-center gap-1">
          <span className="text-[10px] text-emerald-600 font-extrabold">
            {currency}
          </span>
          {row.amount}
        </span>
      ),
    },
    {
      header: "Payment Mode",
      accessor: "payment_mode",
      render: (row) => (
        <span className="text-slate-600 capitalize">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`text-xs font-bold uppercase tracking-wide ${
            row.status === "completed" ? "text-emerald-500" : "text-amber-500"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Mall/Building",
      accessor: "location",
      render: (row) => {
        const name =
          row.service_type === "mall" ? row.mall?.name : row.building?.name;
        return <span className="text-slate-700 uppercase">{name || "-"}</span>;
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <span className="text-slate-700 uppercase font-medium">
          {row.worker?.name || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-24 sticky right-0 bg-white",
      render: (row) => (
        <div className="flex justify-end gap-2 pr-2">
          <button
            onClick={() => handleEdit(row)}
            className="hover:text-indigo-600 text-slate-400 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                One Wash Jobs
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage daily washing records
              </p>
            </div>
          </div>

          {/* Stats summary pills */}
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 mt-1">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Total: <b className="text-slate-800">{stats.totalJobs}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Original Amount:{" "}
                <b className="text-emerald-700">
                  {stats.totalAmount} {currency}
                </b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Cash: <b>{stats.cash}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Card: <b>{stats.card}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Tips: <b className="text-amber-600">{stats.tips || 0}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Outside: <b className="text-blue-700">{stats.outsideCount}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-purple-500" />
              <span>
                Inside + Outside:{" "}
                <b className="text-purple-700">{stats.insideOutsideCount}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-green-200 shadow-sm flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-green-500" />
              <span>
                Residence:{" "}
                <b className="text-green-700">{stats.residenceCount}</b>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="h-11 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-500" />
            )}{" "}
            Export
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 items-end">
          <div className="w-full xl:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
              Date Range
            </span>
            <RichDateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
            />
          </div>

          <div className="flex-1 w-full max-w-xs">
            <CustomDropdown
              label="Payment Mode"
              value={filters.payment_mode}
              onChange={(val) => setFilters({ ...filters, payment_mode: val })}
              options={[
                { value: "", label: "All Modes" },
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "bank transfer", label: "Bank Transfer" },
              ]}
              icon={CreditCard}
              placeholder="All Modes"
            />
          </div>

          <div className="flex-1 w-full max-w-xs">
            <CustomDropdown
              label="Wash Type"
              value={filters.wash_type}
              onChange={(val) => setFilters({ ...filters, wash_type: val })}
              options={[
                { value: "", label: "All Types" },
                { value: "outside", label: "Outside" },
                { value: "total", label: "Inside + Outside" },
              ]}
              icon={Droplets}
              placeholder="All Types"
            />
          </div>

          <div className="flex-1 w-full max-w-xs">
            <CustomDropdown
              label="Worker"
              value={filters.worker}
              onChange={(val) => setFilters({ ...filters, worker: val })}
              options={workerOptions}
              icon={User}
              placeholder="All Workers"
              searchable={true}
            />
          </div>

          <div className="flex-1 w-full">
            <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
              Search
            </span>
            <div className="relative h-[42px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search All Columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          hideSearch={true}
        />
      </div>

      {/* Edit Modal */}
      <OneWashModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
        parentWorkers={workers}
      />
    </div>
  );
};

export default SupervisorOnewash;
