import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  DollarSign,
  Calendar,
  User,
  FileEdit,
  CreditCard,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { paymentService } from "../../api/paymentService";

const PaymentHistoryModal = ({ isOpen, onClose, payment }) => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const formatMoney = (value) => `${Number(value || 0).toFixed(2)} AED`;

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (isOpen && payment?._id) {
      fetchHistory();
    } else {
      setHistoryData(null);
    }
  }, [isOpen, payment]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getPaymentHistory(payment._id);
      setHistoryData(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load payment history",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !payment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Payment History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {payment.vehicle?.registration_no || "N/A"} —{" "}
                  {payment.vehicle?.parking_no || ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-full text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : historyData ? (
              <div className="space-y-6">
                {/* Current Status */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">
                    Current Status
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Total Amount
                      </div>
                      <div className="text-lg font-bold text-slate-700">
                        {formatMoney(historyData.currentAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Paid
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        {formatMoney(historyData.currentPaidAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Balance
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        {formatMoney(historyData.currentBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Status
                      </div>
                      <div
                        className={`text-xs font-bold uppercase px-2 py-1 rounded-full inline-block ${
                          historyData.currentStatus === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {historyData.currentStatus}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Billing Month
                      </div>
                      <div className="text-sm font-bold text-indigo-700">
                        {historyData.currentBillingMonthLabel || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Invoice Date
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {formatDate(historyData.currentInvoiceDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Due Date
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {formatDate(historyData.currentDueDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Monthly Charge
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {formatMoney(historyData.currentMonthlyAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Carried Forward
                      </div>
                      <div className="text-sm font-bold text-orange-600">
                        {formatMoney(historyData.currentOldBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Vehicle
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {historyData.vehicleInfo?.registrationNo || "-"}
                        {historyData.vehicleInfo?.parkingNo
                          ? ` (${historyData.vehicleInfo.parkingNo})`
                          : ""}
                      </div>
                    </div>
                  </div>

                  {historyData.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase mb-1">
                        Remarks
                      </div>
                      <div className="text-xs text-slate-600">
                        {historyData.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Carry Forward Source */}
                {historyData.carriedForwardSource && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-orange-700 uppercase mb-2">
                      Carry Forward Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] text-orange-500 uppercase">
                          From Month
                        </div>
                        <div className="text-sm font-bold text-orange-800">
                          {historyData.carriedForwardSource.fromMonthLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-orange-500 uppercase">
                          To Month
                        </div>
                        <div className="text-sm font-bold text-orange-800">
                          {historyData.carriedForwardSource.toMonthLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-orange-500 uppercase">
                          Amount Carried
                        </div>
                        <div className="text-sm font-bold text-orange-800">
                          {formatMoney(
                            historyData.carriedForwardSource.amountCarried,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Month-wise Snapshot */}
                {historyData.monthlyBreakdown &&
                  historyData.monthlyBreakdown.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Month-wise Billing & Payment Details
                        </h4>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                            <tr>
                              <th className="px-3 py-2 text-left">Month</th>
                              <th className="px-3 py-2 text-right">Monthly</th>
                              <th className="px-3 py-2 text-right">Carried</th>
                              <th className="px-3 py-2 text-right">Total</th>
                              <th className="px-3 py-2 text-right">Paid</th>
                              <th className="px-3 py-2 text-right">Balance</th>
                              <th className="px-3 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyData.monthlyBreakdown.map((item) => (
                              <tr
                                key={item.paymentId}
                                className="border-t border-slate-100"
                              >
                                <td className="px-3 py-2">
                                  <div className="font-semibold text-slate-700">
                                    {item.monthLabel}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Invoice: {formatDate(item.invoiceDate)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Due: {formatDate(item.dueDate)}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right text-slate-700 font-medium">
                                  {formatMoney(item.monthlyAmount)}
                                </td>
                                <td className="px-3 py-2 text-right text-orange-600 font-medium">
                                  {formatMoney(item.carriedForward)}
                                </td>
                                <td className="px-3 py-2 text-right text-indigo-700 font-bold">
                                  {formatMoney(item.totalAmount)}
                                </td>
                                <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                                  {formatMoney(item.paidAmount)}
                                  {item.collectedDate && (
                                    <div className="text-[10px] text-slate-400">
                                      {formatDate(item.collectedDate)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-red-600 font-medium">
                                  {formatMoney(item.balance)}
                                </td>
                                <td className="px-3 py-2">
                                  <div
                                    className={`inline-block text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                      item.status === "completed"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {item.status}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Amount Edit History */}
                {historyData.amountEdits &&
                  historyData.amountEdits.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileEdit className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Amount Edit History
                        </h4>
                        <span className="text-xs text-slate-400">
                          ({historyData.amountEdits.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {historyData.amountEdits.map((edit, idx) => (
                          <div
                            key={idx}
                            className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="text-sm font-bold text-amber-900">
                                    {edit.old_total_amount} AED →{" "}
                                    {edit.new_total_amount} AED
                                  </div>
                                  <div
                                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                      edit.new_total_amount >
                                      edit.old_total_amount
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {edit.new_total_amount >
                                    edit.old_total_amount
                                      ? "+"
                                      : ""}
                                    {(
                                      edit.new_total_amount -
                                      edit.old_total_amount
                                    ).toFixed(2)}{" "}
                                    AED
                                  </div>
                                </div>
                                <div className="text-xs text-amber-800 mb-2">
                                  <strong>Reason:</strong> {edit.reason}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-amber-600">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {edit.editedByName || "Unknown"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateTime(edit.editedAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Collection Transactions */}
                {historyData.transactions &&
                  historyData.transactions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Payment Collections
                        </h4>
                        <span className="text-xs text-slate-400">
                          ({historyData.transactions.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {historyData.transactions.map((txn, idx) => (
                          <div
                            key={idx}
                            className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-bold text-emerald-700">
                                  +{txn.amount} AED
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-emerald-600 mt-1">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {txn.createdBy?.name ||
                                      txn.createdBy?.email ||
                                      "Unknown"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(txn.payment_date)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                                Collected
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* No History */}
                {(!historyData.amountEdits ||
                  historyData.amountEdits.length === 0) &&
                  (!historyData.transactions ||
                    historyData.transactions.length === 0) && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <History className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        No history available
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Amount edits and payment collections will appear here
                      </p>
                    </div>
                  )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentHistoryModal;
