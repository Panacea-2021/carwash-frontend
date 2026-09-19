import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  User,
  Building,
  ShoppingBag,
  Shield,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import SupervisorModal from "../../components/modals/SupervisorModal";
import DeleteModal from "../../components/modals/DeleteModal";
import usePagePermissions from "../../utils/usePagePermissions";

// Redux
import {
  fetchSupervisors,
  deleteSupervisor,
  setSelectedSupervisor,
  clearSelectedSupervisor,
  clearError,
} from "../../redux/slices/supervisorSlice";

const Supervisors = () => {
  // Redux State
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pp = usePagePermissions("supervisors");
  const { supervisors, loading, error, total, currentPage, totalPages } =
    useSelector((state) => state.supervisor);

  // Local UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
  });

  // Fetch data
  useEffect(() => {
    dispatch(
      fetchSupervisors({
        page: pagination.page,
        limit: pagination.limit,
        search: currentSearch,
      }),
    );
  }, [dispatch, pagination.page, pagination.limit, currentSearch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handlers
  const handleAdd = () => {
    dispatch(clearSelectedSupervisor());
    setIsModalOpen(true);
  };

  const handleEdit = (supervisor) => {
    dispatch(setSelectedSupervisor(supervisor));
    setIsModalOpen(true);
  };

  const handleDeleteAction = (supervisor) => {
    setSupervisorToDelete(supervisor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await dispatch(deleteSupervisor(supervisorToDelete._id)).unwrap();
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (searchValue) => {
    setCurrentSearch(searchValue);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    dispatch(
      fetchSupervisors({
        page: pagination.page,
        limit: pagination.limit,
        search: currentSearch,
      }),
    );
  };

  // --- Columns Configuration ---
  const columns = [
    {
      key: "serviceType",
      header: "Service Type",
      accessor: "role",
      render: (row) => {
        const isMall = !!row.mall;
        return (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase ${
              isMall
                ? "bg-purple-50 text-purple-700 border-purple-100"
                : "bg-blue-50 text-blue-700 border-blue-100"
            }`}
          >
            {isMall ? (
              <ShoppingBag className="w-3 h-3" />
            ) : (
              <Building className="w-3 h-3" />
            )}
            {isMall ? "MALL" : "RESIDENCE"}
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm text-white font-bold text-sm">
            {row.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <span className="font-bold text-slate-700 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Mobile",
      accessor: "number",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
            <Phone className="w-3.5 h-3.5" />
          </div>
          {row.number || (
            <span className="text-slate-400 italic">No Number</span>
          )}
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
          {pp.isActionVisible("activity") && (
            <button
              onClick={() => navigate(`/supervisors/${row._id}/activity`)}
              className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
              title="Activity Tracking"
            >
              <Activity className="w-4 h-4" />
            </button>
          )}
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
              onClick={() => handleDeleteAction(row)}
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

  // --- Expanded Row Content (Details) ---
  const renderDetailsRow = (row) => {
    const isMall = !!row.mall;
    return (
      <div className="flex items-start gap-4 text-sm py-2 px-4 bg-slate-50/50 rounded-lg border border-slate-100 mt-2 mx-4 mb-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold mt-1.5 min-w-[100px]">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span>{isMall ? "Assignment:" : "Buildings:"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {isMall ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-sm">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
              {row.mall?.name || "Unknown Mall"}
            </span>
          ) : row.buildings && row.buildings.length > 0 ? (
            row.buildings.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-sm"
              >
                <Building className="w-3.5 h-3.5 text-blue-500" />
                {typeof b === "object" ? b.name : `ID: ${b}`}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-xs mt-1.5">
              No specific assignments
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          title="Supervisors"
          columns={pp.filterColumns(columns)}
          data={supervisors}
          loading={loading}
          hideSearch={!pp.isToolbarVisible("search")}
          // Pagination props
          pagination={{
            page: currentPage,
            limit: pagination.limit,
            total: total,
            totalPages: totalPages,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          // Header Actions
          onSearch={handleSearch}
          actionButton={
            pp.isToolbarVisible("addSupervisor") ? (
              <button
                onClick={handleAdd}
                className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Supervisor
              </button>
            ) : null
          }
          // Expanded Row
          renderExpandedRow={renderDetailsRow}
        />
      </div>

      {/* --- MODALS --- */}
      <SupervisorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={useSelector((state) => state.supervisor.selectedSupervisor)}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Supervisor"
        message={`Are you sure you want to delete "${supervisorToDelete?.name}"?`}
      />
    </div>
  );
};

export default Supervisors;
