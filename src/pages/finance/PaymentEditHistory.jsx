import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  History,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Car,
  Building,
  TrendingDown,
  TrendingUp,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { paymentService } from "../../api/paymentService";
import usePagePermissions from "../../utils/usePagePermissions";

const PaymentEditHistory = () => {
  const navigate = useNavigate();
  const pp = usePagePermissions("paymentEditHistory");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [typeFilter, setTypeFilter] = useState(""); // "" = all, "residence", "onewash"

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const result = await paymentService.getEditHistory(
        page,
        limit,
        typeFilter,
      );
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      toast.error("Failed to load edit history");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, typeFilter]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Flatten: each payment may have multiple edits → show each edit as a row
  const flattenedEdits = [];
  data.forEach((payment) => {
    const edits = payment.amount_edit_history || [];
    edits.forEach((edit, idx) => {
      flattenedEdits.push({ payment, edit, editIndex: idx });
    });
  });
  // Sort edits newest first
  flattenedEdits.sort(
    (a, b) => new Date(b.edit.editedAt) - new Date(a.edit.editedAt),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-amber-800 bg-clip-text text-transparent">
                Payment Edit History
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                All amount edits with reasons and impact details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Type filter */}
            {pp.isToolbarVisible("typeFilter") && (<div className="bg-slate-100 p-1 rounded-xl flex">
              <button
                onClick={() => {
                  setTypeFilter("");
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === ""
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setTypeFilter("residence");
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === "residence"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Residence
              </button>
              <button
                onClick={() => {
                  setTypeFilter("onewash");
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === "onewash"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                One Wash
              </button>
            </div>)}

            <span className="text-sm text-slate-500 font-medium">
              {total} payment{total !== 1 ? "s" : ""} with edits
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : flattenedEdits.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">
              No edit history found
            </p>
            <p className="text-slate-400 text-sm mt-1">
              No payment amounts have been edited yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {flattenedEdits.map((item, idx) => {
              const { payment, edit } = item;
              const customerName = payment.customer
                ? `${payment.customer.firstName || ""} ${payment.customer.lastName || ""}`.trim()
                : "N/A";
              const vehicleNo = payment.vehicle?.registration_no || "-";
              const parkingNo = payment.vehicle?.parking_no || "-";
              const buildingName =
                typeof payment.building === "object"
                  ? payment.building?.name
                  : null;
              const workerName =
                typeof payment.worker === "object"
                  ? payment.worker?.name
                  : null;
              const amountDiff = edit.new_total_amount - edit.old_total_amount;
              const isReduction = amountDiff < 0;
              const balanceDiff = edit.new_balance - edit.old_balance;

              // Next month impact
              const hasNextMonthImpact = balanceDiff !== 0;

              return (
                <div
                  key={`${payment._id}-${idx}`}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  {/* Top row: Payment info + Edit date */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    {/* Left: Payment identification */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                        <Car className="w-3.5 h-3.5" />
                        {vehicleNo}
                      </span>
                      {parkingNo !== "-" && (
                        <span className="text-xs text-slate-400">
                          P: {parkingNo}
                        </span>
                      )}
                      {customerName !== "N/A" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                          <User className="w-3.5 h-3.5" />
                          {customerName}
                        </span>
                      )}
                      {payment.customer?.mobile && (
                        <span className="text-xs text-slate-400">
                          {payment.customer.mobile}
                        </span>
                      )}
                      {buildingName && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg">
                          <Building className="w-3.5 h-3.5" />
                          {buildingName}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          payment.onewash
                            ? "bg-purple-100 text-purple-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {payment.onewash ? "One Wash" : "Residence"}
                      </span>
                    </div>

                    {/* Right: Edit date and editor */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(edit.editedAt)}
                      </span>
                      {edit.editedByName && (
                        <span className="text-xs text-slate-400">
                          By:{" "}
                          <span className="font-semibold text-slate-600">
                            {edit.editedByName}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount change cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {/* Old Amount */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Old Total Amount
                      </span>
                      <p className="text-lg font-bold text-slate-700 mt-0.5">
                        {edit.old_total_amount}{" "}
                        <span className="text-xs text-slate-400">AED</span>
                      </p>
                    </div>

                    {/* New Amount */}
                    <div
                      className={`rounded-lg p-3 border ${
                        isReduction
                          ? "bg-green-50 border-green-100"
                          : "bg-red-50 border-red-100"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        New Total Amount
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-lg font-bold text-slate-700">
                          {edit.new_total_amount}{" "}
                          <span className="text-xs text-slate-400">AED</span>
                        </p>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isReduction
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isReduction ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {isReduction ? "" : "+"}
                          {amountDiff} AED
                        </span>
                      </div>
                    </div>

                    {/* Old Balance */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Old Balance
                      </span>
                      <p className="text-lg font-bold text-slate-700 mt-0.5">
                        {edit.old_balance}{" "}
                        <span className="text-xs text-slate-400">AED</span>
                      </p>
                    </div>

                    {/* New Balance */}
                    <div
                      className={`rounded-lg p-3 border ${
                        balanceDiff < 0
                          ? "bg-green-50 border-green-100"
                          : balanceDiff > 0
                            ? "bg-amber-50 border-amber-100"
                            : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        New Balance
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-lg font-bold text-slate-700">
                          {edit.new_balance}{" "}
                          <span className="text-xs text-slate-400">AED</span>
                        </p>
                        {balanceDiff !== 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              balanceDiff < 0
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {balanceDiff > 0 ? "+" : ""}
                            {balanceDiff} AED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">
                          Reason for Edit
                        </span>
                        <p className="text-sm text-amber-800 font-medium mt-0.5">
                          {edit.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Next month impact */}
                  {hasNextMonthImpact && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">
                            Next Month Impact
                          </span>
                          <p className="text-sm text-blue-800 font-medium mt-0.5">
                            {balanceDiff < 0 ? (
                              <>
                                Next month's carry-forward{" "}
                                <strong>
                                  decreased by {Math.abs(balanceDiff)} AED
                                </strong>
                                . The customer's next bill will be lower.
                              </>
                            ) : (
                              <>
                                Next month's carry-forward{" "}
                                <strong>increased by {balanceDiff} AED</strong>.
                                The customer's next bill will be higher.
                              </>
                            )}
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            Bill Date: {formatDate(payment.createdAt)} | Payment
                            #{payment.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Worker info if available */}
                  {workerName && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      Worker:{" "}
                      <span className="font-medium text-slate-500">
                        {workerName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentEditHistory;
