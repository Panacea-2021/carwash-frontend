import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle,
  Clock,
  Calendar,
  X,
  Landmark,
  Banknote,
  CreditCard,
} from "lucide-react"; // Removed extra Search icon import
import toast from "react-hot-toast";
import DataTable from "../../components/DataTable";
import usePagePermissions from "../../utils/usePagePermissions";
import {
  fetchSettlements,
  approveSettlement,
  setSelectedSettlement,
  clearSelectedSettlement,
} from "../../redux/slices/settlementSlice";

const Settlements = () => {
  const dispatch = useDispatch();
  const pp = usePagePermissions("settlements");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [currency, setCurrency] = useState("AED"); // Default Currency
  const [searchTerm, setSearchTerm] = useState(""); // Search State

  const { settlements, total, loading, currentPage, selectedSettlement } =
    useSelector((state) => state.settlement);

  // --- 1. Load Data & Currency ---
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);

    dispatch(fetchSettlements({ page: 1, limit: 100 }));
  }, [dispatch]);

  // --- 2. Search Logic (Client-Side) ---
  const filteredSettlements = settlements.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();

    // Fields to search
    const supervisorName = row.supervisor?.name?.toLowerCase() || "";
    const amount = String(row.amount || "").toLowerCase();
    const status = row.status?.toLowerCase() || "";
    const date = new Date(row.createdAt).toLocaleDateString().toLowerCase();

    return (
      supervisorName.includes(lowerTerm) ||
      amount.includes(lowerTerm) ||
      status.includes(lowerTerm) ||
      date.includes(lowerTerm)
    );
  });

  // --- APPROVE HANDLERS ---
  const handleApproveClick = (settlement) => {
    dispatch(setSelectedSettlement(settlement));
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedSettlement) return;

    try {
      await dispatch(approveSettlement(selectedSettlement._id)).unwrap();
      toast.success("Settlement Approved!");
      setShowApproveModal(false);
      dispatch(clearSelectedSettlement());
      dispatch(fetchSettlements({ page: currentPage, limit: 100 }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve settlement");
    }
  };

  const handlePageChange = (page) => {
    dispatch(fetchSettlements({ page, limit: 100 }));
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(row.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "supervisor",
      header: "Supervisor",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center font-bold text-xs text-indigo-600 border border-indigo-200 shadow-sm">
            {row.supervisor?.name?.charAt(0) || "U"}
          </div>
          <span className="text-sm font-semibold text-slate-700">
            {row.supervisor?.name || "Unknown"}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Total Amount",
      className: "text-right",
      render: (row) => (
        <div className="text-right">
          <span className="text-lg font-bold text-slate-800">
            {row.amount || 0}
          </span>
          <span className="text-[10px] font-medium text-slate-400 ml-1">
            {currency}
          </span>
        </div>
      ),
    },
    {
      key: "breakdown",
      header: "Breakdown",
      render: (row) => (
        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100"
            title="Cash"
          >
            <Banknote className="w-3 h-3" /> {row.cash || 0}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100"
            title="Card"
          >
            <CreditCard className="w-3 h-3" /> {row.card || 0}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-100"
            title="Bank"
          >
            <Landmark className="w-3 h-3" /> {row.bank || 0}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (row) => {
        const isCompleted = row.status === "completed";
        return (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-amber-50 text-amber-600 border-amber-100"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {row.status || "Pending"}
            </span>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end">
          {row.status !== "completed" ? (
            pp.isActionVisible("approve") && (
              <button
                onClick={() => handleApproveClick(row)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </button>
            )
          ) : (
            <span className="text-xs font-medium text-slate-400 italic px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              Settled
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 font-sans">
      {/* TABLE with Built-in Search */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          columns={pp.filterColumns(columns)}
          data={filteredSettlements}
          loading={loading}
          hideSearch={!pp.isToolbarVisible("search")}
          pagination={{
            page: currentPage,
            limit: 100,
            total: total,
          }}
          onPageChange={handlePageChange}
          emptyMessage="No settlements found"
          // ✅ Enabled Built-in Search
          onSearch={(term) => setSearchTerm(term)}
          searchPlaceholder="Search Supervisor, Amount..."
        />
      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && selectedSettlement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all scale-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                Approve Settlement
              </h2>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  dispatch(clearSelectedSettlement());
                }}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-slate-600 text-sm">
                Are you sure you want to verify and approve this settlement
                report?
              </p>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Supervisor</span>
                  <span className="font-bold text-slate-800">
                    {selectedSettlement.supervisor?.name || "Unknown"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">
                    Total Amount
                  </span>
                  <span className="font-bold text-lg text-indigo-600">
                    {selectedSettlement.amount || 0} {currency}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-white p-2 rounded border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">
                      Cash
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      {selectedSettlement.cash || 0}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">
                      Card
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      {selectedSettlement.card || 0}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">
                      Bank
                    </p>
                    <p className="text-sm font-bold text-purple-600">
                      {selectedSettlement.bank || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <p>
                  This action will mark the settlement as completed and cannot
                  be undone.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  dispatch(clearSelectedSettlement());
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settlements;
