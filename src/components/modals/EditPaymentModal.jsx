import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EditPaymentModal = ({ isOpen, onClose, payment, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_mode: "cash",
    notes: "",
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        // Pre-fill with existing data
        amount: payment.total_amount || payment.amount_charged || 0,
        payment_mode: payment.payment_mode || "cash",
        notes: payment.notes || "",
      });
    }
  }, [payment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Pass the ID and the Data back to the parent handler
    await onSubmit(payment._id, formData);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Update Payment</h3>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Amount
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Payment Mode
              </label>
              <select
                value={formData.payment_mode}
                onChange={(e) =>
                  setFormData({ ...formData, payment_mode: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2 mt-1 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full border rounded-lg px-4 py-2 mt-1"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border rounded-lg font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Submit
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditPaymentModal;
