import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Navigation } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import LocationModal from "../../components/modals/LocationModal";
import DeleteModal from "../../components/modals/DeleteModal";

// APId
import { locationService } from "../../api/locationService";
import usePagePermissions from "../../utils/usePagePermissions";

const Locations = () => {
  const pp = usePagePermissions("locations");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // -- Modals --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -- Pagination --
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // --- Search State ---
  const [currentSearch, setCurrentSearch] = useState("");

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 100, search = "") => {
    setLoading(true);
    setCurrentSearch(search);

    try {
      // 1. Fetch Data
      const response = await locationService.list(page, limit, search);

      // 2. Handle Search / Pagination Logic
      let resultData = response.data || [];
      let totalRecords = response.total || resultData.length;

      // Fallback: If API doesn't filter, we filter client-side
      if (search && response.total === undefined) {
        resultData = resultData.filter(
          (item) =>
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.address?.toLowerCase().includes(search.toLowerCase()),
        );
        totalRecords = resultData.length;
      }

      setData(resultData);

      const totalPages = Math.ceil(totalRecords / limit) || 1;
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error("[LocationsPage] Fetch error:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit, currentSearch);
  }, []);

  // --- Helper: Get Data for Current Page ---
  const getDisplayData = () => {
    if (!data) return [];
    if (data.length > pagination.limit) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return data.slice(startIndex, startIndex + pagination.limit);
    }
    return data;
  };

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedLocation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const openDeleteModal = (location) => {
    setLocationToDelete(location);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    setDeleteLoading(true);
    try {
      await locationService.delete(locationToDelete._id);
      toast.success("Location deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      console.error("[LocationsPage] Delete error:", error);
      toast.error(error.message || "Failed to delete location");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Columns ---
  const columns = [
    {
      key: "locationDetails",
      header: "Location Details",
      accessor: "name", // Using name as key accessor, but render uses both
      render: (row) => (
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-sm text-white mt-1">
            <MapPin className="w-5 h-5" />
          </div>

          {/* Combined Text Content */}
          <div className="flex flex-col">
            <span className="font-bold text-slate-700 text-sm">{row.name}</span>

            <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
              <Navigation className="w-3 h-3 text-teal-500" />
              <span className="truncate max-w-[300px]" title={row.address}>
                {row.address || (
                  <span className="italic text-slate-400">No Address</span>
                )}
              </span>
            </div>

            {/* Optional: Lat/Long as tiny text below address if needed */}
            {(row.latitude || row.longitude) && (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 ml-4">
                {row.latitude || 0}, {row.longitude || 0}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className:
        "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          {pp.isActionVisible("edit") && (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 hover:bg-teal-50 text-slate-400 hover:text-teal-600 rounded-lg transition-all"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/30 p-6 font-sans">
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          title="Location List"
          columns={pp.filterColumns(columns)}
          data={getDisplayData()}
          loading={loading}
          hideSearch={!pp.isToolbarVisible("search")}
          pagination={pagination}
          // Pagination Handlers
          onPageChange={(newPage) =>
            fetchData(newPage, pagination.limit, currentSearch)
          }
          onLimitChange={(newLimit) => fetchData(1, newLimit, currentSearch)}
          // Search Handler
          onSearch={(term) => fetchData(1, pagination.limit, term)}
          // Add Button
          actionButton={
            pp.isToolbarVisible("addLocation") ? (
              <button
                onClick={handleAdd}
                className="h-10 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            ) : null
          }
        />
      </div>

      {/* --- MODALS --- */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedLocation}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Location"
        message={`Are you sure you want to delete "${locationToDelete?.name}"?`}
      />
    </div>
  );
};

export default Locations;
