import React, { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  createLocation,
  updateLocation,
} from "../../redux/slices/locationSlice";
import ModalManager from "./ModalManager";

const LocationModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");

  // Populate data when editing
  useEffect(() => {
    if (isOpen) {
      console.log(
        "📍 [LOCATION MODAL] Modal opened",
        editData ? "for editing" : "for creating"
      );
      if (editData) {
        console.log("📝 [LOCATION MODAL] Edit data:", editData);
        setAddress(editData.address || "");
      } else {
        console.log("➕ [LOCATION MODAL] Creating new location");
        setAddress(""); // Clear for new entry
      }
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      console.warn("⚠️ [LOCATION MODAL] Validation failed: Address is empty");
      toast.error("Address is required");
      return;
    }

    console.log("💾 [LOCATION MODAL] Submitting form:", {
      address,
      isEdit: !!editData,
    });
    setLoading(true);
    try {
      if (editData) {
        // UPDATE Existing - Use Redux
        console.log(
          "✏️ [LOCATION MODAL] Updating location via Redux:",
          editData._id
        );
        await dispatch(
          updateLocation({ id: editData._id, data: { address } })
        ).unwrap();
        toast.success("Location updated successfully");
        console.log("✅ [LOCATION MODAL] Location updated successfully");
      } else {
        // CREATE New - Use Redux
        console.log("➕ [LOCATION MODAL] Creating location via Redux");
        await dispatch(createLocation({ address })).unwrap();
        toast.success("Location added successfully");
        console.log("✅ [LOCATION MODAL] Location created successfully");
      }
      onSuccess(); // Refresh the table
      onClose(); // Close the modal
    } catch (error) {
      console.error("❌ [LOCATION MODAL] Submit error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Location" : "Add New Location"}
      pageName="LOCATIONS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="md"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter address here..."
              autoFocus
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end pt-2 gap-3">
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
            {editData ? "Save Changes" : "Create Location"}
          </button>
        </div>
      </form>
    </ModalManager>
  );
};

export default LocationModal;
