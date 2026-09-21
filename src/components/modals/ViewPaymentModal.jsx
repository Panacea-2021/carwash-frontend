import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ViewPaymentModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  // Helper to format date cleanly like "Dec 29" or "-"
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Payment Info</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-8 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">
                Payment Generated
              </span>
              <span className="font-bold text-slate-800">
                {formatDate(payment.createdAt)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">
                Payment Received
              </span>
              <span className="font-bold text-slate-800">
                {payment.status === "completed"
                  ? formatDate(payment.updatedAt)
                  : "-"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">
                Payment Settled
              </span>
              <span className="font-bold text-slate-800">
                {payment.settled === "completed"
                  ? formatDate(payment.settledDate)
                  : "-"}
              </span>
            </div>

            {payment.notes && (
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Remarks / Comments
                </span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {payment.notes}
                </p>
              </div>
            )}

            {payment.amount_edit_history &&
              payment.amount_edit_history.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Amount Edit History
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {payment.amount_edit_history.map((entry, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-amber-700">
                            {entry.old_total_amount} → {entry.new_total_amount}{" "}
                            AED
                          </span>
                          <span className="text-amber-500">
                            {formatDate(entry.editedAt)}
                          </span>
                        </div>
                        <p className="text-amber-600">
                          <strong>Reason:</strong> {entry.reason}
                        </p>
                        {entry.editedByName && (
                          <p className="text-amber-500 mt-0.5">
                            By: {entry.editedByName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViewPaymentModal;
