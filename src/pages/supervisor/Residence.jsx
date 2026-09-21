import React, { useState, useEffect, useMemo } from "react";
import {
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
import { supervisorService } from "../../api/supervisorService";
import { buildingService } from "../../api/buildingService";
import { toShiftRange } from "../../utils/shiftTime";

const SupervisorResidence = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [allJobsForFilters, setAllJobsForFilters] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [buildings, setBuildings] = useState([]);

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
    startDate: getFirstOfMonth(),
    endDate: getToday(),
    worker: "",
    status: "",
    building: "",
    customer: "",
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

  // --- LOAD RESOURCES ---
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [wRes, bRes] = await Promise.all([
          supervisorService.getTeam({ pageNo: 0, pageSize: 1000 }),
          buildingService.list(1, 1000),
        ]);
        console.log("✅ [Supervisor Residence] Team loaded:", wRes);
        console.log("✅ [Supervisor Residence] Buildings loaded:", bRes);
        setWorkers(wRes.data || []);
        setBuildings(bRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadResources();
  }, []);

  // --- AUTOMATIC FETCH ---
  useEffect(() => {
    fetchData(1, pagination.limit);
    fetchAllJobsForFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Get team worker IDs for filtering
  const teamWorkerIds = useMemo(() => workers.map((w) => w._id), [workers]);

  const fetchAllJobsForFilters = async () => {
    if (!filters.startDate || !filters.endDate) return;

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    try {
      const shiftRange = toShiftRange(filters.startDate, filters.endDate);

      const apiFilters = {
        status: filters.status,
        startDate: shiftRange.startDate,
        endDate: shiftRange.endDate,
      };

      // Send team worker IDs so only team jobs are returned
      if (teamWorkerIds.length > 0) {
        apiFilters.workers = teamWorkerIds;
      }

      const res = await jobService.list(1, 10000, "", apiFilters);
      console.log("✅ [Supervisor Residence] All jobs for filters:", res);
      setAllJobsForFilters(res.data || []);
    } catch (e) {
      console.error("Failed to fetch all jobs for filters:", e);
      setAllJobsForFilters([]);
    }
  };

  const fetchData = async (page = 1, limit = 100) => {
    if (!filters.startDate || !filters.endDate) return;

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    setLoading(true);
    try {
      const shiftRange = toShiftRange(filters.startDate, filters.endDate);

      const apiFilters = {
        ...filters,
        startDate: shiftRange.startDate,
        endDate: shiftRange.endDate,
      };

      // Send team worker IDs so only team jobs are returned
      if (!filters.worker && teamWorkerIds.length > 0) {
        apiFilters.workers = teamWorkerIds;
      }

      console.log("📤 [Supervisor Residence] Fetching data with:", {
        page,
        limit,
        searchTerm,
        apiFilters,
      });

      const res = await jobService.list(page, limit, searchTerm, apiFilters);
      let fetchedData = res.data || [];

      console.log("📥 [Supervisor Residence] API Response:", res);

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
      const shiftRange = toShiftRange(filters.startDate, filters.endDate);

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

      const detailedData = exportData.map((item) => ({
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
      }));

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
    return options;
  }, [allJobsForFilters]);

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
    return options;
  }, [allJobsForFilters]);

  const customerOptions = useMemo(() => {
    const uniqueCustomers = new Map();
    allJobsForFilters.forEach((job) => {
      if (job.customer && job.customer._id) {
        const label =
          job.customer.mobile || job.customer.firstName || job.customer._id;
        uniqueCustomers.set(job.customer._id, label);
      }
    });

    const options = [
      { value: "", label: `All Customers (${uniqueCustomers.size})` },
    ];
    uniqueCustomers.forEach((label, id) => {
      options.push({ value: id, label });
    });
    return options;
  }, [allJobsForFilters]);

  const formatUtcDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${month} ${day}`;
  };

  // --- Columns (matching admin Residence layout) ---
  const columns = [
    {
      header: "Created",
      accessor: "assignedDate",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-slate-700 text-sm font-bold">
            {formatUtcDate(row.assignedDate)}
          </span>
        </div>
      ),
    },
    {
      header: "Completed",
      accessor: "completedDate",
      render: (row) => (
        <span className="text-slate-500 text-xs font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
          {formatUtcDate(row.completedDate)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "w-24 text-center",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();
        const config = {
          completed: {
            text: "COMPLETED",
            classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: CheckCircle,
          },
          rejected: {
            text: "REJECTED",
            classes: "bg-red-50 text-red-600 border-red-100",
            icon: XCircle,
          },
          pending: {
            text: "PENDING",
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
      header: "Vehicle No",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Car className="w-3.5 h-3.5 text-slate-400" />
          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-700 tracking-wide">
            {row.vehicle?.registration_no || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Parking No",
      accessor: "vehicle.parking_no",
      className: "w-24 text-center",
      render: (row) => (
        <span className="text-sm text-slate-700 font-bold">
          {row.vehicle?.parking_no || "-"}
        </span>
      ),
    },
    {
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
      header: "Actions",
      className: "text-right w-24 sticky right-0 bg-white",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* Header */}
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
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

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
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
            <div>
              <CustomDropdown
                label="Customer"
                value={filters.customer}
                onChange={(val) => setFilters({ ...filters, customer: val })}
                options={customerOptions}
                icon={Phone}
                placeholder="All Customers"
                searchable={true}
              />
            </div>

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
          </div>
        </div>

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
      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
        workers={workers}
        customers={[]}
      />
    </div>
  );
};

export default SupervisorResidence;
