import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Map } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import SiteModal from "../../components/modals/SiteModal";
import DeleteModal from "../../components/modals/DeleteModal";

// API
import { siteService } from "../../api/siteService";
import usePagePermissions from "../../utils/usePagePermissions";

const Sites = () => {
  const pp = usePagePermissions("sites");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // -- Modal States --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
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
      let resultData = [];
      let totalRecords = 0;

      // STRATEGY:
      // If searching: Fetch ALL items (limit=1000) and filter locally
      // If not searching: Use standard server-side pagination.

      if (search) {
        // 1. Fetch EVERYTHING
        const response = await siteService.list(1, 1000, "");

        // 2. Filter Locally
        const allItems = response.data || [];
        resultData = allItems.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase()),
        );

        totalRecords = resultData.length;
      } else {
        // Normal Server Fetch
        const response = await siteService.list(page, limit, "");
        resultData = response.data || [];
        totalRecords = response.total || 0;
      }

      // 3. Update State
      setData(resultData);

      const totalPages = Math.ceil(totalRecords / limit) || 1;
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load sites");
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
    setSelectedSite(null);
    setIsModalOpen(true);
  };

  const handleEdit = (site) => {
    setSelectedSite(site);
    setIsModalOpen(true);
  };

  const openDeleteModal = (site) => {
    setSiteToDelete(site);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!siteToDelete) return;
    setDeleteLoading(true);
    try {
      await siteService.delete(siteToDelete._id);
      toast.success("Site deleted successfully");
      setIsDeleteModalOpen(false);
      // Refresh with current state
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      toast.error(error.message || "Failed to delete site");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Columns ---
  const columns = [
    {
      key: "name",
      header: "Site Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-sm text-white">
            <Map className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-700 text-sm">{row.name}</span>
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
              className="p-2 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6 font-sans">
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          title="Manage Sites"
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
            pp.isToolbarVisible("addSite") ? (
              <button
                onClick={handleAdd}
                className="h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Site
              </button>
            ) : null
          }
        />
      </div>

      {/* --- MODALS --- */}
      <SiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedSite}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Site"
        message={`Are you sure you want to delete "${siteToDelete?.name}"?`}
      />
    </div>
  );
};

export default Sites;
