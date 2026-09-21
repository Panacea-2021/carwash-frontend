import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Building,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import BuildingModal from "../../components/modals/BuildingModal";
import DeleteModal from "../../components/modals/DeleteModal";

// API
import { buildingService } from "../../api/buildingService";
import usePagePermissions from "../../utils/usePagePermissions";

const Buildings = () => {
  const pp = usePagePermissions("buildings");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [currency, setCurrency] = useState("AED"); // Default currency state

  // -- Modal States --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
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

  // --- Load Currency from Settings ---
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 100, search = "") => {
    setLoading(true);
    setCurrentSearch(search);

    try {
      let resultData = [];
      let totalRecords = 0;

      if (search) {
        // 1. Fetch EVERYTHING
        const response = await buildingService.list(1, 1000, "");

        // 2. Filter Locally
        const allItems = response.data || [];
        resultData = allItems.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase()),
        );

        totalRecords = resultData.length;
      } else {
        // Normal Server Fetch
        const response = await buildingService.list(page, limit, "");
        resultData = response.data || [];
        totalRecords = response.total || 0;
      }

      // 3. Update State
      setData(resultData);

      const totalPages = Math.ceil(totalRecords / limit) || 1;
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Failed to load buildings");
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
    setSelectedBuilding(null);
    setIsModalOpen(true);
  };

  const handleEdit = (building) => {
    setSelectedBuilding(building);
    setIsModalOpen(true);
  };

  const openDeleteModal = (building) => {
    setBuildingToDelete(building);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!buildingToDelete) return;
    setDeleteLoading(true);
    try {
      await buildingService.delete(buildingToDelete._id);
      toast.success("Building deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      toast.error(error.message || "Failed to delete building");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Columns ---
  const columns = [
    {
      key: "name",
      header: "Building Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm text-white">
            <Building className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-700 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      accessor: "location",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span
            className="truncate max-w-[200px]"
            title={row.location_id?.address}
          >
            {row.location_id?.address || (
              <span className="text-slate-400 italic">No Location</span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessor: "amount",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit text-xs">
          {/* ✅ DYNAMIC CURRENCY SYMBOL */}
          <span className="text-[10px] font-extrabold text-emerald-600">
            {currency}
          </span>
          {row.amount?.toFixed(2) || "0.00"}
        </div>
      ),
    },
    {
      key: "cardCharges",
      header: "Card Charges",
      accessor: "card_charges",
      render: (row) => (
        <span className="text-slate-500 text-xs font-medium font-mono">
          {row.card_charges?.toFixed(2) || "0.00"}
        </span>
      ),
    },
    {
      key: "scheduled",
      header: "Scheduled",
      accessor: "schedule_today",
      render: (row) =>
        row.schedule_today ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
            <CheckCircle className="w-3 h-3" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">
            <XCircle className="w-3 h-3" /> No
          </span>
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
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          title="Buildings Management"
          columns={pp.filterColumns(columns)}
          data={getDisplayData()}
          loading={loading}
          pagination={pagination}
          onPageChange={(newPage) =>
            fetchData(newPage, pagination.limit, currentSearch)
          }
          onLimitChange={(newLimit) => fetchData(1, newLimit, currentSearch)}
          onSearch={(term) => fetchData(1, pagination.limit, term)}
          actionButton={pp.isToolbarVisible("addBuilding") ?
            <button
              onClick={handleAdd}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Building
            </button>
          : null}
        />
      </div>

      {/* --- MODALS --- */}
      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedBuilding}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Building"
        message={`Are you sure you want to delete "${buildingToDelete?.name}"?`}
      />
    </div>
  );
};

export default Buildings;
