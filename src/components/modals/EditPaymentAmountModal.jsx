import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { paymentService } from "../../api/paymentService";

const EditPaymentAmountModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [newTotalAmount, setNewTotalAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen && payment) {
      setNewTotalAmount(payment.total_amount || 0);
      setReason("");
    }
  }, [isOpen, payment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason for editing the amount");
      return;
    }

    if (
      newTotalAmount === "" ||
      isNaN(newTotalAmount) ||
      Number(newTotalAmount) < 0
    ) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (Number(newTotalAmount) === payment.total_amount) {
      toast.error("New amount is the same as current amount");
      return;
    }

    setLoading(true);
    try {
      await paymentService.editAmount(
        payment._id,
        Number(newTotalAmount),
        reason.trim(),
      );
      toast.success("Payment amount updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update payment amount",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all";
  const labelClass =
    "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1";

  const amountDiff = payment
    ? Number(newTotalAmount || 0) - (payment.total_amount || 0)
    : 0;
  const newBalance = payment
    ? Math.max(0, Number(newTotalAmount || 0) - (payment.amount_paid || 0))
    : 0;

  return (
    <AnimatePresence>
      {isOpen && payment && (
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
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Edit Payment Amount
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {payment.vehicle?.registration_no || "N/A"} —{" "}
                  {payment.vehicle?.parking_no || ""}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/80 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Info */}
            <div className="px-6 pt-4 pb-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Current Total
                  </div>
                  <div className="text-base font-bold text-slate-700">
                    {payment.total_amount || 0}
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">
                    Paid
                  </div>
                  <div className="text-base font-bold text-emerald-600">
                    {payment.amount_paid || 0}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-red-400 uppercase">
                    Balance
                  </div>
                  <div className="text-base font-bold text-red-600">
                    {payment.balance || 0}
                  </div>
                </div>
              </div>
              {payment.old_balance > 0 && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  Includes <strong>{payment.old_balance} AED</strong>{" "}
                  carry-forward from previous month
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* New Amount */}
              <div>
                <label className={labelClass}>New Total Amount (AED)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTotalAmount}
                    onChange={(e) => setNewTotalAmount(e.target.value)}
                    className={`${inputClass} pl-9 text-lg font-bold ${
                      amountDiff < 0
                        ? "text-red-600"
                        : amountDiff > 0
                          ? "text-blue-600"
                          : "text-slate-700"
                    }`}
                    placeholder="Enter new total amount"
                    autoFocus
                  />
                </div>
                {/* Change indicator */}
                {amountDiff !== 0 && (
                  <div
                    className={`mt-1.5 text-xs font-bold flex items-center gap-1 ${
                      amountDiff < 0 ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {amountDiff < 0 ? "↓" : "↑"}{" "}
                    {Math.abs(amountDiff).toFixed(2)} AED{" "}
                    {amountDiff < 0 ? "reduction" : "increase"} — New balance
                    will be <strong>{newBalance.toFixed(2)} AED</strong>
                  </div>
                )}
              </div>

              {/* Reason (Required) */}
              <div>
                <label className={labelClass}>
                  <span className="text-red-500">*</span> Reason for Editing
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. Customer requested reduction due to fewer washes this month..."
                    required
                  />
                </div>
              </div>

              {/* Warning */}
              {amountDiff !== 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    This will update the total amount and balance. If a next
                    month bill already exists, its carry-forward balance will
                    also be adjusted automatically.
                  </p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !reason.trim() ||
                  Number(newTotalAmount) === payment.total_amount
                }
                className="px-8 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-amber-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Amount
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditPaymentAmountModal;
