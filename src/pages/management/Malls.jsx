import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  DollarSign, // Kept for consistency, though unused in render now
  CreditCard,
  Search,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import MallModal from "../../components/modals/MallModal";
import DeleteModal from "../../components/modals/DeleteModal";

// API
import { mallService } from "../../api/mallService";
import usePagePermissions from "../../utils/usePagePermissions";

const Malls = () => {
  const pp = usePagePermissions("malls");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [currency, setCurrency] = useState("AED"); // Default currency state

  // -- Modals --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMall, setSelectedMall] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mallToDelete, setMallToDelete] = useState(null);
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

      // STRATEGY:
      // If searching: Fetch ALL items (limit=1000) and filter locally
      // If not searching: Use standard server-side pagination.

      if (search) {
        // 1. Fetch EVERYTHING
        const response = await mallService.list(1, 1000, "");

        // 2. Filter Locally
        const allItems = response.data || [];
        resultData = allItems.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase()),
        );

        totalRecords = resultData.length;
      } else {
        // Normal Server Fetch
        const response = await mallService.list(page, limit, "");
        resultData = response.data || [];
        totalRecords = response.total || 0;
      }

      // 3. Update State
      setData(resultData);

      const totalPages = Math.ceil(totalRecords / limit) || 1;
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error("[MallsPage] Fetch error:", error);
      toast.error("Failed to load malls");
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

    // If we are searching or if backend sent all data, handle client-side slicing
    if (data.length > pagination.limit) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return data.slice(startIndex, startIndex + pagination.limit);
    }

    return data;
  };

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedMall(null);
    setIsModalOpen(true);
  };

  const handleEdit = (mall) => {
    setSelectedMall(mall);
    setIsModalOpen(true);
  };

  const openDeleteModal = (mall) => {
    setMallToDelete(mall);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!mallToDelete) return;
    setDeleteLoading(true);
    try {
      await mallService.delete(mallToDelete._id);
      toast.success("Mall deleted successfully");
      setIsDeleteModalOpen(false);
      // Refresh with current state
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      console.error("[MallsPage] Delete error:", error);
      toast.error(error.message || "Failed to delete mall");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Columns ---
  const columns = [
    {
      key: "name",
      header: "Mall Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-700 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessor: "amount",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
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
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          {row.card_charges?.toFixed(2) || "0.00"}
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
          title="Malls Management"
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
          // Search Handler (Integrated into Table Header)
          onSearch={(term) => fetchData(1, pagination.limit, term)}
          // Add Button (Integrated into Table Header)
          actionButton={
            pp.isToolbarVisible("addMall") ? (
              <button
                onClick={handleAdd}
                className="h-10 px-5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Mall
              </button>
            ) : null
          }
        />
      </div>

      {/* --- MODALS --- */}
      <MallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedMall}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Mall"
        message={`Are you sure you want to delete "${mallToDelete?.name}"?`}
      />
    </div>
  );
};

export default Malls;
