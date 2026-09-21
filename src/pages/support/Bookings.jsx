import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UserPlus,
  Trash2,
  CheckCircle,
  User,
  Loader2,
  Calendar,
  Clock,
  Car,
  MapPin,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import AssignWorkerModal from "../../components/modals/AssignWorkerModal";
import usePagePermissions from "../../utils/usePagePermissions";

// Redux
import {
  fetchBookings,
  acceptBooking,
  deleteBooking,
  setSelectedBooking,
  clearSelectedBooking,
  clearError,
} from "../../redux/slices/bookingSlice";

const Bookings = () => {
  // Redux State
  const dispatch = useDispatch();
  const pp = usePagePermissions("bookings");
  const { bookings, loading, error, total, currentPage, totalPages } =
    useSelector((state) => state.booking);

  // Local UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
  });

  const isObjectIdLike = (value) => {
    const text = value?.toString?.().trim?.() || "";
    return /^[a-fA-F0-9]{24}$/.test(text);
  };

  const getLocationText = (row) => {
    const serviceType = (row.service_type || "").toString().toLowerCase();

    if (row.service_type === "mall" && row.mall?.name) {
      return row.mall.name;
    }

    const locationName =
      row.location_name?.toString?.().trim?.() ||
      row.location?.address?.toString?.().trim?.() ||
      row.location?.name?.toString?.().trim?.() ||
      row.customer?.location?.address?.toString?.().trim?.() ||
      row.customer?.location?.name?.toString?.().trim?.() ||
      "";

    const buildingName =
      row.building_name?.toString?.().trim?.() ||
      row.building?.name?.toString?.().trim?.() ||
      row.customer?.building?.name?.toString?.().trim?.() ||
      "";

    const flatNo =
      row.flat_no?.toString?.().trim?.() ||
      row.customer?.flat_no?.toString?.().trim?.() ||
      "";

    const composed = [
      !isObjectIdLike(locationName) ? locationName : "",
      !isObjectIdLike(buildingName) ? buildingName : "",
      flatNo ? `Flat ${flatNo}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    if (composed) {
      return composed;
    }

    const locationTextCandidates = [
      serviceType === "mobile" ? row.address : "",
      row.location?.address,
      row.location?.name,
      row.customer?.location?.address,
      row.customer?.location?.name,
      row.building?.name,
      row.customer?.building?.name,
      row.customer?.city,
      row.customer?.address,
    ];

    for (const value of locationTextCandidates) {
      const text = value?.toString?.().trim?.() || "";
      if (text && !isObjectIdLike(text)) {
        return text;
      }
    }

    return "";
  };

  const getBuildingText = (row) => {
    const candidates = [
      row.building_name,
      row.building?.name,
      row.customer?.building?.name,
      row.customer?.building,
    ];

    for (const value of candidates) {
      const text = value?.toString?.().trim?.() || "";
      if (text && !isObjectIdLike(text)) return text;
    }
    return "";
  };

  const getAddressText = (row) => {
    const serviceType = (row.service_type || "").toString().toLowerCase();
    if (serviceType !== "mobile") return "";

    const flat =
      row.flat_no?.toString?.().trim?.() ||
      row.customer?.flat_no?.toString?.().trim?.() ||
      "";
    const parking =
      row.parking_no?.toString?.().trim?.() ||
      row.vehicle?.parking_no?.toString?.().trim?.() ||
      "";

    const parts = [
      row.address?.toString?.().trim?.() || "",
      flat ? `Flat ${flat}` : "",
      parking ? `Parking ${parking}` : "",
    ].filter(Boolean);

    return parts.join(" • ");
  };

  // Fetch data on mount and when pagination changes
  useEffect(() => {
    dispatch(
      fetchBookings({
        page: pagination.page,
        limit: pagination.limit,
      }),
    );
  }, [dispatch, pagination.page, pagination.limit]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // --- Client-Side Search (Instant Filter) ---
  const filteredBookings = useMemo(() => {
    if (!currentSearch) return bookings;
    const lowerTerm = currentSearch.toLowerCase();

    return bookings.filter((row) => {
      // 1. Prepare fields
      const customer = row.customer?.mobile?.toLowerCase() || "";
      const vehicle = row.vehicle?.registration_no?.toLowerCase() || "";
      const parking = row.vehicle?.parking_no?.toLowerCase() || "";
      const worker = row.worker?.name?.toLowerCase() || "";

      // 2. Resolve Location Logic for Search
      const location = getLocationText(row).toLowerCase();
      const building = getBuildingText(row).toLowerCase();
      const address = getAddressText(row).toLowerCase();

      // 3. Check match
      return (
        customer.includes(lowerTerm) ||
        vehicle.includes(lowerTerm) ||
        parking.includes(lowerTerm) ||
        location.includes(lowerTerm) ||
        building.includes(lowerTerm) ||
        address.includes(lowerTerm) ||
        worker.includes(lowerTerm)
      );
    });
  }, [bookings, currentSearch]);

  // --- Handlers ---
  const handleSearch = (term) => {
    setCurrentSearch(term);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const handleOpenAssign = (booking) => {
    dispatch(setSelectedBooking(booking));
    setIsModalOpen(true);
  };

  const handleAccept = async (booking) => {
    if (!window.confirm("Accept booking? This will create a Job.")) return;
    try {
      await dispatch(acceptBooking(booking._id)).unwrap();
      toast.success("Booking Accepted");
    } catch (error) {
      toast.error(error || "Failed to accept");
    }
  };

  const handleDelete = async (booking) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await dispatch(deleteBooking(booking._id)).unwrap();
      toast.success("Deleted");
    } catch (error) {
      toast.error(error || "Delete failed");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    dispatch(clearSelectedBooking());
    dispatch(
      fetchBookings({
        page: pagination.page,
        limit: pagination.limit,
      }),
    );
  };

  // --- Columns ---
  const columns = [
    {
      header: "Customer",
      accessor: "customer",
      key: "customer",
      render: (row) => (
        <span className="font-bold text-sm text-slate-800">
          {row.customer?.mobile || "Unknown"}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      key: "date",
      render: (row) => {
        const dateObj = row.date ? new Date(row.date) : null;
        return (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-sm font-medium">
              {dateObj
                ? dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Time",
      accessor: "time",
      key: "time",
      render: (row) => {
        const dateObj = row.date ? new Date(row.date) : null;
        const timeStr =
          row.time ||
          (dateObj &&
            dateObj.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }));

        return (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-mono font-bold">
              {timeStr || "-"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Vehicle",
      accessor: "vehicle",
      key: "vehicle",
      render: (row) => {
        const v = row.vehicle || {};
        const regNo = v.registration_no || "-";

        return (
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {regNo}
            </span>
          </div>
        );
      },
    },
    {
      header: "Parking No",
      accessor: "parking_no",
      key: "parking",
      render: (row) => {
        const parking = row.vehicle?.parking_no || row.parking_no || "-";
        return (
          <span className="text-xs font-mono font-bold text-slate-600">
            {parking}
          </span>
        );
      },
    },
    {
      header: "Location",
      accessor: "location",
      key: "location",
      className: "min-w-[150px] max-w-[220px]",
      render: (row) => {
        const locationName = getLocationText(row);

        return locationName ? (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-1 shrink-0 text-red-500" />
            <span className="text-sm leading-snug text-slate-600 whitespace-normal break-words">
              {locationName}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        );
      },
    },
    {
      header: "Building",
      accessor: "building",
      key: "building",
      className: "min-w-[140px] max-w-[220px]",
      render: (row) => {
        const text = getBuildingText(row);
        return text ? (
          <span className="text-sm leading-snug text-slate-600 whitespace-normal break-words">
            {text}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        );
      },
    },
    {
      header: "Address",
      accessor: "address",
      key: "address",
      className: "min-w-[190px] max-w-[300px]",
      render: (row) => {
        const text = getAddressText(row);
        return text ? (
          <span className="text-sm leading-snug text-slate-600 whitespace-normal break-words">
            {text}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker",
      key: "worker",
      // ✅ CHANGED: Added width constraints to force wrap if too long
      className: "min-w-[120px] max-w-[200px]",
      render: (row) => (
        <div className="flex items-start gap-2">
          {row.worker ? (
            <>
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0 mt-0.5">
                {row.worker.name?.charAt(0).toUpperCase()}
              </div>
              {/* ✅ CHANGED: whitespace-normal allows wrapping */}
              <span className="text-xs font-semibold text-slate-700 whitespace-normal break-words leading-tight">
                {row.worker.name}
              </span>
            </>
          ) : (
            <span className="text-xs italic text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              Unassigned
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      key: "status",
      className: "text-center",
      render: (row) => {
        const status = (row.status || "PENDING").toUpperCase();
        const isCompleted = status === "ACCEPTED" || status === "COMPLETED";

        return (
          <span
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              isCompleted
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-blue-50 text-blue-600 border-blue-100"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right w-28 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => {
        const normalizedStatus = (row.status || "").toString().toLowerCase();
        const isFinalStatus = [
          "accepted",
          "completed",
          "rejected",
          "cancelled",
          "canceled",
        ].includes(normalizedStatus);
        const canAssign = pp.isActionVisible("assignWorker") && !isFinalStatus;
        const canAccept =
          pp.isActionVisible("accept") && !isFinalStatus && !!row.worker;

        return (
          <div className="flex items-center justify-end gap-1 px-2">
            {canAssign && (
              <button
                onClick={() => handleOpenAssign(row)}
                className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 transition-colors"
                title="Assign Worker"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}

            {canAccept && (
              <button
                onClick={() => handleAccept(row)}
                className="p-1.5 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                title="Accept"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}

            {pp.isActionVisible("delete") && (
              <button
                onClick={() => handleDelete(row)}
                className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans flex flex-col">
      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
        <DataTable
          title="Bookings"
          columns={pp.filterColumns(columns)}
          data={filteredBookings}
          loading={loading}
          hideSearch={!pp.isToolbarVisible("search")}
          pagination={{
            page: currentPage,
            limit: pagination.limit,
            total: total,
            totalPages: totalPages,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSearch={handleSearch}
          searchPlaceholder="Search bookings, workers, locations..."
        />
      </div>

      {/* --- MODAL --- */}
      <AssignWorkerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          dispatch(clearSelectedBooking());
        }}
        booking={useSelector((state) => state.booking.selectedBooking)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Bookings;
