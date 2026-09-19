import React, { useState } from "react";
import { X, AlertTriangle, Calendar } from "lucide-react";

/**
 * DeactivationReasonModal
 *
 * Collects reason and dates when deactivating customer/vehicle.
 * Only shown when NO pending payments exist (deactivation is allowed).
 *
 * Requires:
 * - Deactivation date (defaults to today)
 * - Reason (required text)
 */
const DeactivationReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  type,
}) => {
  const [formData, setFormData] = useState({
    deactivateDate: new Date().toISOString().split("T")[0],
    deactivateReason: "",
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};

    if (!formData.deactivateReason.trim()) {
      newErrors.deactivateReason = "Reason is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Send data with proper date objects
    onConfirm({
      deactivateDate: new Date(formData.deactivateDate),
      deactivateReason: formData.deactivateReason.trim(),
    });

    // Reset form
    setFormData({
      deactivateDate: new Date().toISOString().split("T")[0],
      deactivateReason: "",
    });
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      deactivateDate: new Date().toISOString().split("T")[0],
      deactivateReason: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-600">
              {type === "customer" ? "Customer" : "Vehicle"}: {entityName}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deactivation Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Deactivation Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="date"
                value={formData.deactivateDate}
                onChange={(e) =>
                  setFormData({ ...formData, deactivateDate: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reason for Deactivation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.deactivateReason}
              onChange={(e) =>
                setFormData({ ...formData, deactivateReason: e.target.value })
              }
              placeholder="e.g., Customer moved out, Long vacation, Vehicle not available..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              required
            />
            {errors.deactivateReason && (
              <p className="mt-1 text-xs text-red-500">
                {errors.deactivateReason}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-medium">⚠️ Important:</p>
            <ul className="ml-4 mt-1 list-disc space-y-1">
              <li>All pending payments must be cleared before deactivation</li>
              <li>This {type} will be marked as inactive immediately</li>
              <li>
                You can reactivate this {type} anytime from the inactive list
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Deactivate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivationReasonModal;
