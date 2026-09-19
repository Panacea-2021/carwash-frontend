import React, { useState } from "react";
import { X, Calendar, CheckCircle } from "lucide-react";

/**
 * ReactivationDateModal
 *
 * Collects reactivation date when activating an inactive customer/vehicle.
 *
 * Requires:
 * - Reactivation date (defaults to today)
 */
const ReactivationDateModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  type,
}) => {
  const [formData, setFormData] = useState({
    reactivateDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};

    if (!formData.reactivateDate) {
      newErrors.reactivateDate = "Reactivation date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Send data with proper date object
    onConfirm({
      reactivateDate: new Date(formData.reactivateDate),
    });

    // Reset form
    setFormData({
      reactivateDate: new Date().toISOString().split("T")[0],
    });
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      reactivateDate: new Date().toISOString().split("T")[0],
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="text-green-600" size={20} />
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
          {/* Reactivation Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reactivation Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="date"
                value={formData.reactivateDate}
                onChange={(e) =>
                  setFormData({ ...formData, reactivateDate: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                required
              />
            </div>
            {errors.reactivateDate && (
              <p className="mt-1 text-xs text-red-500">
                {errors.reactivateDate}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              This date will be set as the restart date for service resumption
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-md bg-green-50 p-3 text-xs text-green-800">
            <p className="font-medium">✅ Reactivation:</p>
            <ul className="ml-4 mt-1 list-disc space-y-1">
              <li>This {type} will be marked as active immediately</li>
              <li>The restart date will be updated in customer records</li>
              <li>Monthly billing will resume from the selected date</li>
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
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Reactivate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReactivationDateModal;
