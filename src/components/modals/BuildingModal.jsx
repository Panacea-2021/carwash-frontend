import React, { useState, useEffect, useMemo } from "react";
import {
  Building,
  MapPin,
  Loader2,
  Calendar,
  DollarSign,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  createBuilding,
  updateBuilding,
} from "../../redux/slices/buildingSlice";
import { fetchLocations } from "../../redux/slices/locationSlice";
import ModalManager from "./ModalManager";
import CustomDropdown from "../ui/CustomDropdown"; // ✅ Import the new Dropdown

const BuildingModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [locations, setLocations] = useState([]);

  // Updated state
  const [formData, setFormData] = useState({
    name: "",
    location_id: "",
    amount: "", // String to handle decimals better during input
    card_charges: "",
    schedule_today: false,
  });

  // Fetch locations for dropdown
  useEffect(() => {
    if (isOpen) {
      console.log(
        "🏢 [BUILDING MODAL] Modal opened",
        editData ? "for editing" : "for creating"
      );
      const loadLocations = async () => {
        setFetchingLocations(true);
        try {
          console.log("📍 [BUILDING MODAL] Fetching locations via Redux");
          const result = await dispatch(
            fetchLocations({ page: 1, limit: 100, search: "" })
          ).unwrap();
          setLocations(result.data || []);
        } catch (error) {
          console.error("❌ [BUILDING MODAL] Failed to load locations:", error);
          toast.error("Failed to load locations");
        } finally {
          setFetchingLocations(false);
        }
      };
      loadLocations();

      // Populate form if editing
      if (editData) {
        setFormData({
          name: editData.name || "",
          location_id: editData.location_id?._id || editData.location_id || "",
          amount: editData.amount || "",
          card_charges: editData.card_charges || "",
          schedule_today: editData.schedule_today || false,
        });
      } else {
        // Reset for new entry
        setFormData({
          name: "",
          location_id: "",
          amount: "",
          card_charges: "",
          schedule_today: false,
        });
      }
    }
  }, [isOpen, editData, dispatch]);

  // ✅ Prepare Options for CustomDropdown
  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc._id,
      label: loc.address,
    }));
  }, [locations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("💾 [BUILDING MODAL] Submitting form:", formData);

    if (!formData.name.trim() || !formData.location_id) {
      toast.error("Please fill in required fields (Name & Location)");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload with float conversion
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        card_charges: parseFloat(formData.card_charges) || 0,
      };

      if (editData) {
        await dispatch(
          updateBuilding({ id: editData._id, data: payload })
        ).unwrap();
        toast.success("Building updated successfully");
      } else {
        await dispatch(createBuilding(payload)).unwrap();
        toast.success("Building created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ [BUILDING MODAL] Operation failed:", error);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Building" : "Add New Building"}
      pageName="BUILDINGS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Row 1: Name & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Building Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
                placeholder="Building Name"
              />
            </div>
          </div>

          {/* Location Dropdown (Using CustomDropdown) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Location <span className="text-red-500">*</span>
            </label>
            {/* We render the label manually above to keep style consistent with Name input.
               So we don't pass 'label' prop to CustomDropdown.
            */}
            <CustomDropdown
              value={formData.location_id}
              onChange={(val) => setFormData({ ...formData, location_id: val })}
              options={locationOptions}
              placeholder={fetchingLocations ? "Loading..." : "Select Location"}
              icon={MapPin}
              // searchable={true}
              disabled={fetchingLocations}
            />
          </div>
        </div>

        {/* Row 2: Amount & Card Charges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                step="any" // ✅ Decimals allowed
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value,
                  })
                }
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                AED
              </div>
              <input
                type="number"
                step="any" // ✅ Decimals allowed
                min="0"
                value={formData.card_charges}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    card_charges: e.target.value,
                  })
                }
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Schedule Today Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Schedule Today
              </p>
              <p className="text-xs text-slate-500">
                Enable daily scheduling for this building
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.schedule_today}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  schedule_today: e.target.checked,
                })
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end pt-4 gap-3 border-t border-slate-100">
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
            {editData ? "Save Changes" : "Create Building"}
          </button>
        </div>
      </form>
    </ModalManager>
  );
};

export default BuildingModal;
