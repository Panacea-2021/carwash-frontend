import React, { useState, useEffect } from "react";
import { ShoppingBag, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createMall, updateMall } from "../../redux/slices/mallSlice";
import ModalManager from "./ModalManager";

const MallModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Use strings for inputs to handle decimals (like "0.5") correctly during typing
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    card_charges: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          name: editData.name || "",
          amount: editData.amount || "",
          card_charges: editData.card_charges || "",
        });
      } else {
        setFormData({ name: "", amount: "", card_charges: "" });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Mall name is required");
      return;
    }

    setLoading(true);
    try {
      // Convert to float before sending to backend
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount) || 0,
        card_charges: parseFloat(formData.card_charges) || 0,
      };

      if (editData) {
        await dispatch(
          updateMall({ id: editData._id, data: payload })
        ).unwrap();
        toast.success("Mall updated successfully");
      } else {
        await dispatch(createMall(payload)).unwrap();
        toast.success("Mall created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Mall" : "Add New Mall"}
      pageName="MALLS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Mall Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="E.g. City Center Mall"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Amount (AED) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Amount (AED)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                AED
              </div>
              <input
                type="number"
                step="0.01" // ✅ Allows decimals like 0.5, 10.99
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value, // Keep as string for input handling
                  })
                }
                className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Card Charges (AED) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Card Charges (AED)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="number"
                step="0.01" // ✅ Allows decimals
                min="0"
                value={formData.card_charges}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    card_charges: e.target.value,
                  })
                }
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {editData ? "Save Changes" : "Create Mall"}
          </button>
        </div>
      </form>
    </ModalManager>
  );
};

export default MallModal;
