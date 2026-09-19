import React, { useState } from "react";
import { Lock, Send, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { accessRequestService } from "../api/accessRequestService";

/**
 * Modal shown to staff when they click on a feature they don't have access to.
 * Allows them to send an access request to the super admin.
 *
 * Usage:
 *   <AccessRequestModal
 *     isOpen={true}
 *     onClose={() => setOpen(false)}
 *     page="customers"
 *     pageLabel="Customers"
 *     elementType="action"         // "column" | "action" | "toolbar"
 *     elementKey="delete"
 *     elementLabel="Delete Customer"
 *   />
 */
export default function AccessRequestModal({
  isOpen,
  onClose,
  page,
  pageLabel,
  elementType,
  elementKey,
  elementLabel,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setSending(true);
      await accessRequestService.create({
        page,
        pageLabel,
        elementType,
        elementKey,
        elementLabel,
        message,
      });
      toast.success("Access request sent to admin");
      setMessage("");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">Access Required</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            You don't have permission to access{" "}
            <strong className="text-slate-800">{elementLabel}</strong> on the{" "}
            <strong className="text-slate-800">{pageLabel}</strong> page. You
            can request access from the admin.
          </p>

          <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 w-16">Page:</span>
              <span className="font-medium text-slate-700">{pageLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 w-16">Type:</span>
              <span className="font-medium text-slate-700 capitalize">
                {elementType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 w-16">Feature:</span>
              <span className="font-medium text-slate-700">
                {elementLabel}
              </span>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Message to Admin (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why you need this access..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
