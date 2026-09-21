import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Car,
  User,
  Calendar,
  Filter,
  Search,
  MapPin,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import EnquiryModal from "../../components/modals/EnquiryModal";
import DeleteModal from "../../components/modals/DeleteModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import usePagePermissions from "../../utils/usePagePermissions";
import { toCalendarRange } from "../../utils/shiftTime";

// Redux
import {
  fetchEnquiries,
  deleteEnquiry,
  setSelectedEnquiry,
  clearSelectedEnquiry,
  clearError,
} from "../../redux/slices/enquirySlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";

const Enquiry = () => {
  // Redux State
  const dispatch = useDispatch();
  const pp = usePagePermissions("enquiry");
  const { enquiries, loading, error, total, currentPage, totalPages } =
    useSelector((state) => state.enquiry);
  const { workers } = useSelector((state) => state.worker);

  // --- Dates Helper ---
  // Default to empty strings or specific range if needed
  const getInitialDates = () => {
    return {
      startDate: "",
      endDate: "",
    };
  };

  // Local UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  // Instant Filters State
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    worker: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
  });

  // For Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    // Fetch workers for the dropdown
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  // --- MAIN FETCH EFFECT (Instant) ---
  // Triggers whenever Pagination or Filters change
  useEffect(() => {
    // Prepare filters with safe dates
    const apiFilters = { ...filters };

    // Use full-day ranges outside residence shift logic
    if (apiFilters.startDate && apiFilters.endDate) {
      const shiftRange = toCalendarRange(
        apiFilters.startDate,
        apiFilters.endDate,
      );
      apiFilters.startDate = shiftRange.startDate;
      apiFilters.endDate = shiftRange.endDate;
    } else {
      // If either date is missing, remove both to be safe
      delete apiFilters.startDate;
      delete apiFilters.endDate;
    }

    dispatch(
      fetchEnquiries({
        page: pagination.page,
        limit: pagination.limit,
        filters: apiFilters,
      }),
    );
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // --- Client-Side Search (Filters the FETCHED page) ---
  const filteredData = useMemo(() => {
    if (!clientSearchTerm) return enquiries;
    const lowerTerm = clientSearchTerm.toLowerCase();
    return enquiries.filter(
      (row) =>
        row.mobile?.toLowerCase().includes(lowerTerm) ||
        row.registration_no?.toLowerCase().includes(lowerTerm) ||
        row.parking_no?.toLowerCase().includes(lowerTerm),
    );
  }, [enquiries, clientSearchTerm]);

  // --- Handlers ---

  // Instant Filter Handlers
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const handleClientSearch = (term) => setClientSearchTerm(term);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const handleCreate = () => {
    dispatch(clearSelectedEnquiry());
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    dispatch(setSelectedEnquiry(row));
    setIsModalOpen(true);
  };

  const openDeleteModal = (row) => {
    setEnquiryToDelete(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!enquiryToDelete) return;
    setDeleteLoading(true);
    try {
      await dispatch(deleteEnquiry(enquiryToDelete._id)).unwrap();
      toast.success("Enquiry deleted successfully");
      setIsDeleteModalOpen(false);
      // Re-fetch will be triggered automatically if Redux updates state,
      // but explicitly calling it ensures table refresh
      dispatch(
        fetchEnquiries({
          page: pagination.page,
          limit: pagination.limit,
          filters,
        }),
      );
    } catch (error) {
      toast.error(error || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    dispatch(clearSelectedEnquiry());
    dispatch(
      fetchEnquiries({
        page: pagination.page,
        limit: pagination.limit,
        filters: filters,
      }),
    );
  };

  // --- Columns with Rich CSS ---
  const columns = [
    {
      header: "Date & Time",
      accessor: "createdAt",
      key: "dateTime",
      render: (row) => {
        const dateObj = new Date(row.createdAt);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">
                {dateObj.toLocaleDateString()}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {dateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Customer Mobile",
      accessor: "mobile",
      key: "customer",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm font-mono text-slate-700">
            {row.mobile || "---"}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle Details",
      accessor: "registration_no",
      key: "vehicle",
      render: (row) => {
        // Debug logging
        console.log("🚗 Row data:", {
          id: row.id,
          vehicles: row.vehicles,
          registration_no: row.registration_no,
          parking_no: row.parking_no,
        });

        // Show first vehicle details or "N/A" if no vehicles
        const firstVehicle =
          row.vehicles && row.vehicles.length > 0 ? row.vehicles[0] : null;
        const vehicleCount = row.vehicles?.length || 0;

        const regNo =
          firstVehicle?.registration_no || row.registration_no || "N/A";
        const parkNo = firstVehicle?.parking_no || row.parking_no;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {regNo}
              </span>
              {vehicleCount > 1 && (
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                  +{vehicleCount - 1}
                </span>
              )}
            </div>
            {parkNo && (
              <span className="text-[10px] text-slate-400 pl-6">
                Parking:{" "}
                <span className="font-mono text-slate-600">{parkNo}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker",
      key: "worker",
      render: (row) => {
        // Show first vehicle's worker or "Unassigned"
        const firstVehicle =
          row.vehicles && row.vehicles.length > 0 ? row.vehicles[0] : null;
        const hasWorker = firstVehicle?.worker?.name || firstVehicle?.worker;

        return hasWorker ? (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">
              {firstVehicle.worker?.name || firstVehicle.worker}
            </span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400 bg-slate-50 px-2 py-1 rounded">
            Unassigned
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      key: "status",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();

        const statusConfig = {
          completed: {
            classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: CheckCircle,
            label: "Completed",
          },
          cancelled: {
            classes: "bg-red-50 text-red-600 border-red-100",
            icon: XCircle,
            label: "Cancelled",
          },
          pending: {
            classes: "bg-blue-50 text-blue-600 border-blue-100",
            icon: Clock,
            label: "Pending",
          },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase w-fit ${config.classes}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          {pp.isActionVisible("edit") && (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
              title="View/Edit Enquiry"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("delete") && (
            <button
              onClick={() => openDeleteModal(row)}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
              title="Delete"
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
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* --- INTEGRATED FILTER BAR --- */}
        <div className="border-b border-gray-100 bg-slate-50/50 p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* 1. Date Range Picker */}
            {pp.isToolbarVisible("dateRange") && (
              <div className="w-full lg:w-auto min-w-[280px]">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                  Date Range
                </label>
                <RichDateRangePicker
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onChange={handleDateChange}
                />
              </div>
            )}

            {/* 2. Filters Wrapper */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Status Filter */}
              {pp.isToolbarVisible("statusFilter") && (
                <div className="relative group">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Filter className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Worker Filter */}
              {pp.isToolbarVisible("workerFilter") && (
                <div className="relative group">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                    Assigned Worker
                  </label>
                  <div className="relative">
                    <select
                      name="worker"
                      value={filters.worker}
                      onChange={handleFilterChange}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Workers</option>
                      {workers.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Search Bar */}
            {pp.isToolbarVisible("search") && (
              <div className="w-full lg:w-72">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                  Search Table
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search mobile, vehicle..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- DATATABLE --- */}
        <DataTable
          title="Enquiries"
          columns={pp.filterColumns(columns)}
          data={filteredData}
          loading={loading}
          pagination={{
            page: currentPage,
            limit: pagination.limit,
            total: total,
            totalPages: totalPages,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          hideSearch={true}
          actionButton={
            pp.isToolbarVisible("addEnquiry") ? (
              <button
                onClick={handleCreate}
                className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Enquiry
              </button>
            ) : null
          }
        />
      </div>

      {/* --- MODALS --- */}
      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          dispatch(clearSelectedEnquiry());
        }}
        enquiry={useSelector((state) => state.enquiry.selectedEnquiry)}
        onSuccess={handleModalSuccess}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry?"
      />
    </div>
  );
};

export default Enquiry;
