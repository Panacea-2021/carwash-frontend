import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Calendar, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { paymentService } from "../../api/paymentService";

const PaymentModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    payment_mode: "cash",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
    receipt_no: "",
  });

  // Load remaining balance
  useEffect(() => {
    if (isOpen && payment) {
      const total = payment.amount_charged || payment.total_amount || 0;
      const paid = payment.amount_paid || 0;
      const remaining = total - paid;

      setFormData({
        amount: remaining > 0 ? remaining : "",
        payment_mode: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        notes: payment.notes || "",
        receipt_no: payment.receipt_no || "",
      });
    }
  }, [isOpen, payment]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasAmount = formData.amount && Number(formData.amount) > 0;
    const hasRemarks = formData.notes && formData.notes.trim();
    const receiptNo = formData.receipt_no && formData.receipt_no.trim();
    const hasReceipt = !!receiptNo;

    // Require at least amount, receipt no, or remarks
    if (!hasAmount && !hasRemarks && !hasReceipt) {
      toast.error("Please enter an amount, receipt number, or add remarks");
      return;
    }

    setLoading(true);
    try {
      // Collect payment via the proper /collect endpoint (updates amount_paid, balance, status)
      if (hasAmount) {
        await paymentService.collect(
          payment._id,
          Number(formData.amount),
          formData.payment_mode,
          formData.payment_date,
          receiptNo,
        );
      }

      const updatePayload = {};
      if (hasRemarks) {
        updatePayload.notes = formData.notes.trim();
      }
      if (!hasAmount && hasReceipt) {
        updatePayload.receipt_no = receiptNo;
      }
      if (Object.keys(updatePayload).length > 0) {
        await paymentService.updatePayment(payment._id, updatePayload);
      }

      const successParts = [];
      if (hasAmount) successParts.push("Payment collected");
      if (hasRemarks) successParts.push("Remarks updated");
      if (hasReceipt) successParts.push("Receipt number updated");
      toast.success(
        successParts.length > 0
          ? `${successParts.join(" and ")} successfully`
          : "Payment updated successfully",
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update payment");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all";
  const labelClass =
    "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1";

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
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Collect Payment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registration: {payment.vehicle?.registration_no}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Amount (AED) - Optional</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className={`${inputClass} pl-9 text-lg font-bold text-emerald-600`}
                    placeholder="0.00 (Leave empty to only update remarks)"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Payment Mode</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    className={`${inputClass} pl-9 cursor-pointer`}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Receipt No (Optional)</label>
                <input
                  type="text"
                  name="receipt_no"
                  value={formData.receipt_no}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Leave empty to auto-generate on full payment"
                />
              </div>

              <div>
                <label className={labelClass}>Collection Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    className={`${inputClass} pl-9 cursor-pointer`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Remarks / Comments</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                  placeholder="Add any additional notes or comments..."
                />
              </div>
            </form>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                Collect
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
