import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  Filter,
  User,
  Calendar,
  Car,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Phone,
  Building2,
  Loader2,
  Play,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

// Components
import DataTable from "../../components/DataTable";
import JobModal from "../../components/modals/JobModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown";

// API
import { jobService } from "../../api/jobService";
import { workerService } from "../../api/workerService";
import { buildingService } from "../../api/buildingService";
import { customerService } from "../../api/customerService";
import usePagePermissions from "../../utils/usePagePermissions";
import { toShiftRange } from "../../utils/shiftTime";

const Residence = () => {
  const pp = usePagePermissions("washes_residence");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [allJobsForFilters, setAllJobsForFilters] = useState([]); // ⚡ All jobs for filter counts
  const [workers, setWorkers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [customers, setCustomers] = useState([]);

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

  const getLastOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return formatDateLocal(d);
  };

  const [filters, setFilters] = useState({
    startDate: getToday(),
    endDate: getToday(),
    worker: "",
    status: "",
    building: "",
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
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [schedulerDate, setSchedulerDate] = useState("");
  const [runningScheduler, setRunningScheduler] = useState(false);

  // --- LOAD RESOURCES ---
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [wRes, bRes, cRes] = await Promise.all([
          workerService.list(1, 1000),
          buildingService.list(1, 1000),
          customerService.list(1, 1000),
        ]);
        setWorkers(wRes.data || []);
        setBuildings(bRes.data || []);
        setCustomers(cRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadResources();
  }, []);

  // --- AUTOMATIC FETCH ---
  useEffect(() => {
    fetchData(1, pagination.limit);
    fetchAllJobsForFilters(); // ⚡ Fetch all jobs for accurate filter counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ⚡ NEW: Fetch ALL jobs (not paginated) for filter counts
  const fetchAllJobsForFilters = async () => {
    if (!filters.startDate || !filters.endDate) return;

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    try {
      const shiftRange = toShiftRange(
        filters.startDate.length > 10
          ? start.toISOString().split("T")[0]
          : filters.startDate,
        filters.endDate.length > 10
          ? end.toISOString().split("T")[0]
          : filters.endDate,
      );

      // ⚡ IMPORTANT: Don't include building/worker filters here
      // We want to show ALL buildings/workers in dropdown, not just filtered ones
      const apiFilters = {
        status: filters.status, // Include status filter
        startDate: shiftRange.startDate,
        endDate: shiftRange.endDate,
        // ❌ DON'T include: building, worker (so dropdown shows all options)
      };

      // Fetch with large limit to get all jobs (for filter counts only)
      const res = await jobService.list(1, 10000, "", apiFilters);
      setAllJobsForFilters(res.data || []);

      console.log(
        "⚡ [FILTERS] Loaded",
        res.data?.length || 0,
        "total jobs for filter counts",
      );
    } catch (e) {
      console.error("Failed to fetch all jobs for filters:", e);
      setAllJobsForFilters([]); // Fallback to empty
    }
  };

  const fetchData = async (page = 1, limit = 100) => {
    if (!filters.startDate || !filters.endDate) return;

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    setLoading(true);
    try {
      const shiftRange = toShiftRange(
        filters.startDate.length > 10
          ? start.toISOString().split("T")[0]
          : filters.startDate,
        filters.endDate.length > 10
          ? end.toISOString().split("T")[0]
          : filters.endDate,
      );

      const apiFilters = {
        ...filters,
        startDate: shiftRange.startDate,
        endDate: shiftRange.endDate,
      };

      const res = await jobService.list(page, limit, searchTerm, apiFilters);
      let fetchedData = res.data || [];

      fetchedData.sort(
        (a, b) => new Date(b.assignedDate) - new Date(a.assignedDate),
      );

      setData(fetchedData);
      setPagination({
        page,
        limit,
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / limit) || 1,
      });
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        toast.error("Failed to load jobs");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- EXPORT ---
  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Please select a valid date range");
      return;
    }

    setExporting(true);
    const toastId = toast.loading("Preparing download...");
    try {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      const shiftRange = toShiftRange(
        filters.startDate.length > 10
          ? filters.startDate.split("T")[0]
          : filters.startDate,
        filters.endDate.length > 10
          ? filters.endDate.split("T")[0]
          : filters.endDate,
      );

      const apiFilters = {
        ...filters,
        startDate: shiftRange.startDate,
        endDate: shiftRange.endDate,
      };

      const res = await jobService.list(1, 10000, searchTerm, apiFilters);
      const exportData = res.data || [];

      if (exportData.length === 0) {
        toast.error("No data to export", { id: toastId });
        setExporting(false);
        return;
      }

      // Summary Sheet
      const buildingCounts = {};
      exportData.forEach((item) => {
        const dateKey = new Date(item.assignedDate).toISOString().split("T")[0];
        const bName = item.building?.name || "Unknown";
        const compositeKey = `${dateKey}_${bName}`;

        if (!buildingCounts[compositeKey]) {
          buildingCounts[compositeKey] = {
            date: dateKey,
            building: bName,
            count: 0,
          };
        }
        buildingCounts[compositeKey].count += 1;
      });

      const summaryArray = Object.values(buildingCounts).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.building.localeCompare(b.building);
      });

      const summarySheetRows = [["Day", "Building", "Count"]];
      summaryArray.forEach((item) => {
        summarySheetRows.push([item.date, item.building, item.count]);
      });

      // Detailed Sheet
      const detailedData = exportData.map((item) => {
        return {
          ID: item.id,
          Date: new Date(item.assignedDate).toLocaleDateString(),
          "Customer Mobile": item.customer?.mobile || "-",
          Building: item.building?.name || "-",
          Vehicle: item.vehicle?.registration_no || "-",
          Parking: item.vehicle?.parking_no || "-",
          Status: item.status,
          Worker: item.worker?.name || "Unassigned",
          Completed: item.completedDate
            ? new Date(item.completedDate).toLocaleDateString()
            : "-",
        };
      });

      const workbook = XLSX.utils.book_new();

      if (summarySheetRows.length > 1) {
        const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetRows);
        XLSX.utils.book_append_sheet(workbook, wsSummary, "Report");
      }

      const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, wsDetailed, "Detailed Report");

      XLSX.writeFile(workbook, `Residence_Jobs_${filters.startDate}.xlsx`);
      toast.success("Download complete", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getFirstOfMonth(),
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleRunScheduler = () => {
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSchedulerDate(formatDateLocal(tomorrow));
    setIsSchedulerModalOpen(true);
  };

  const handleConfirmScheduler = async () => {
    if (!schedulerDate) {
      toast.error("Please select a date");
      return;
    }

    setRunningScheduler(true);
    try {
      const result = await jobService.runScheduler(schedulerDate);
      toast.success(
        `✅ Scheduler executed successfully! Generated ${result.jobsGenerated} jobs for ${result.targetDate}`,
      );
      setIsSchedulerModalOpen(false);
      // Refresh the data
      fetchData(pagination.page, pagination.limit);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to run scheduler";
      toast.error(errorMsg);
    } finally {
      setRunningScheduler(false);
    }
  };

  const handleCreate = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await jobService.delete(id);
      toast.success("Job deleted");
      fetchData(pagination.page, pagination.limit);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  // --- Dropdown Options ---
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
  ];

  // ⚡ Extract unique buildings from ALL jobs (not just current page)
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = new Map();
    allJobsForFilters.forEach((job) => {
      if (job.building && job.building._id) {
        uniqueBuildings.set(job.building._id, job.building.name);
      }
    });

    const options = [
      { value: "", label: `All Buildings (${uniqueBuildings.size})` },
    ];
    uniqueBuildings.forEach((name, id) => {
      options.push({ value: id, label: name });
    });

    console.log(
      "🏢 Building Options:",
      options.length - 1,
      "buildings from",
      allJobsForFilters.length,
      "total jobs",
    );
    return options;
  }, [allJobsForFilters]);

  // ⚡ Extract unique workers from ALL jobs (not just current page)
  const workerOptions = useMemo(() => {
    const uniqueWorkers = new Map();
    allJobsForFilters.forEach((job) => {
      if (job.worker && job.worker._id) {
        uniqueWorkers.set(job.worker._id, job.worker.name);
      }
    });

    const options = [
      { value: "", label: `All Workers (${uniqueWorkers.size})` },
    ];
    uniqueWorkers.forEach((name, id) => {
      options.push({ value: id, label: name });
    });

    console.log(
      "👷 Worker Options:",
      options.length - 1,
      "workers from",
      allJobsForFilters.length,
      "total jobs",
    );
    return options;
  }, [allJobsForFilters]);

  // ✅ HELPER: Format Date (Shows the actual date without timezone conversion)
  const formatUtcDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    // Use local date components to avoid timezone shift
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", {
      month: "short",
    });
    return `${month} ${day}`;
  };

  // --- Columns ---
  const columns = [
    {
      key: "date",
      header: "Date",
      accessor: "assignedDate",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-slate-700 text-sm font-bold">
            {/* ✅ UPDATED: Using UTC formatting to fix date shift */}
            {formatUtcDate(row.assignedDate)}
          </span>
        </div>
      ),
    },
    {
      key: "completed",
      header: "Completed",
      accessor: "completedDate",
      render: (row) => (
        <span className="text-slate-500 text-xs font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
          {/* ✅ UPDATED: Using UTC formatting here too */}
          {formatUtcDate(row.completedDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      className: "w-24 text-center",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();
        const config = {
          completed: {
            text: "Completed",
            classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: CheckCircle,
          },
          rejected: {
            text: "Rejected",
            classes: "bg-red-50 text-red-600 border-red-100",
            icon: XCircle,
          },
          pending: {
            text: "Pending",
            classes: "bg-amber-50 text-amber-600 border-amber-100",
            icon: Clock,
          },
        }[status] || {
          text: status,
          classes: "bg-gray-50 text-gray-600",
          icon: Clock,
        };

        const Icon = config.icon;
        const rejectionReason = row.rejectionReason || row.rejectReason || "";

        return (
          <div className="flex items-center justify-center gap-1.5">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${config.classes}`}
            >
              <Icon className="w-3 h-3" />
              {config.text}
            </div>
            {status === "rejected" && rejectionReason && (
              <div
                className="relative group cursor-help"
                title={rejectionReason}
              >
                <Info className="w-4 h-4 text-red-500 hover:text-red-600" />
                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                  <div className="text-center">{rejectionReason}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "customer",
      header: "Customer",
      accessor: "customer.mobile",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold border border-indigo-200">
            <Phone className="w-3 h-3" />
          </div>
          <span className="text-sm text-slate-700 font-mono font-bold">
            {row.customer?.mobile || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "vehicleDetails",
      header: "Vehicle Details",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-700 tracking-wide w-fit">
              {row.vehicle?.registration_no || "N/A"}
            </span>
          </div>
          {row.vehicle?.parking_no && (
            <span className="text-[10px] text-slate-500 pl-6">
              Parking:{" "}
              <span className="font-bold">{row.vehicle.parking_no}</span>
            </span>
          )}
          {row.vehicle?.schedule_type && (
            <span className="text-[10px] text-slate-500 pl-6">
              Schedule:{" "}
              <span className="font-bold capitalize">
                {row.vehicle.schedule_type === "daily"
                  ? "Daily"
                  : row.vehicle.schedule_type === "weekly"
                    ? `Weekly (${row.vehicle.schedule_days?.map((d) => (typeof d === "object" ? d.day : d)).join(", ") || ""})`
                    : row.vehicle.schedule_type}
              </span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "building",
      header: "Building",
      accessor: "building.name",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-indigo-500" />
          <span className="text-xs font-bold uppercase text-slate-600 truncate max-w-[150px]">
            {row.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "worker",
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold border border-purple-200">
            {row.worker?.name?.[0] || "U"}
          </div>
          <span className="text-sm text-slate-700 font-medium">
            {row.worker?.name || (
              <span className="text-slate-400 italic text-xs">Unassigned</span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      accessor: "createdSource",
      render: (row) => {
        const source = row.createdSource || "";
        const name = row.createdByName || row.createdBy || "—";
        const sourceConfig = {
          "Cron Job": {
            bg: "bg-slate-100",
            text: "text-slate-600",
            border: "border-slate-200",
            label: "Cron Job",
          },
          "Admin Panel": {
            bg: "bg-indigo-50",
            text: "text-indigo-600",
            border: "border-indigo-200",
            label: "Admin Panel",
          },
          "Admin Panel (Run Scheduler)": {
            bg: "bg-emerald-50",
            text: "text-emerald-600",
            border: "border-emerald-200",
            label: "Run Scheduler",
          },
          "Staff App": {
            bg: "bg-purple-50",
            text: "text-purple-600",
            border: "border-purple-200",
            label: "Staff App",
          },
          "Customer App": {
            bg: "bg-amber-50",
            text: "text-amber-600",
            border: "border-amber-200",
            label: "Customer App",
          },
        }[source] || {
          bg: "bg-gray-50",
          text: "text-gray-500",
          border: "border-gray-200",
          label: source || "System",
        };

        const displayName = [
          "Cron Scheduler",
          "Manual Scheduler",
          "Customer Booking",
          "Cron Job",
        ].includes(name)
          ? ""
          : name;

        return (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border w-fit ${sourceConfig.bg} ${sourceConfig.text} ${sourceConfig.border}`}
            >
              {sourceConfig.label}
            </span>
            {displayName && (
              <span
                className="text-[10px] text-slate-500 truncate max-w-[120px]"
                title={displayName}
              >
                {displayName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right w-24 sticky right-0 bg-white",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          {pp.isActionVisible("edit") && (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("delete") && (
            <button
              onClick={() => handleDelete(row._id)}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                Residence Jobs
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage residential service schedules
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pp.isToolbarVisible("runScheduler") && (
            <button
              onClick={handleRunScheduler}
              disabled={runningScheduler}
              className="h-11 px-5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {runningScheduler ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}{" "}
              Run Scheduler
            </button>
          )}
          {pp.isToolbarVisible("export") && (
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
          )}
          {pp.isToolbarVisible("addJob") && (
            <button
              onClick={handleCreate}
              className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Schedule Job
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 items-end">
          {pp.isToolbarVisible("dateRange") && (
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
          )}

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {pp.isToolbarVisible("statusFilter") && (
              <div>
                <CustomDropdown
                  label="Status"
                  value={filters.status}
                  onChange={(val) => setFilters({ ...filters, status: val })}
                  options={statusOptions}
                  icon={Filter}
                  placeholder="All Status"
                />
              </div>
            )}
            {pp.isToolbarVisible("buildingFilter") && (
              <div>
                <CustomDropdown
                  label="Building"
                  value={filters.building}
                  onChange={(val) => setFilters({ ...filters, building: val })}
                  options={buildingOptions}
                  icon={Building2}
                  placeholder="All Buildings"
                  searchable={true}
                />
              </div>
            )}
            {pp.isToolbarVisible("workerFilter") && (
              <div>
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
            )}

            {pp.isToolbarVisible("search") && (
              <div className="relative">
                <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                  Search
                </span>
                <div className="relative h-[42px]">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-full pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DataTable
          columns={pp.filterColumns(columns)}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          hideSearch={true}
        />
      </div>

      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
        workers={workers}
        customers={customers}
      />

      {/* Scheduler Modal */}
      {isSchedulerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600" />
                Run Job Scheduler
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Generate jobs for a specific date
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={schedulerDate}
                onChange={(e) => setSchedulerDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                💡 Jobs will be created for this date based on customer
                schedules
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Warning:</strong> This will create jobs for the
                selected date. If jobs already exist for that date, the
                operation will be blocked.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsSchedulerModalOpen(false)}
                disabled={runningScheduler}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmScheduler}
                disabled={runningScheduler || !schedulerDate}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {runningScheduler ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Scheduler
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residence;
