import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Phone,
  Lock,
  Building,
  ShoppingBag,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supervisorService } from "../../api/supervisorService";
import { buildingService } from "../../api/buildingService";
import { mallService } from "../../api/mallService";

const SupervisorModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Data Lists
  const [allBuildings, setAllBuildings] = useState([]);
  const [allMalls, setAllMalls] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    password: "",
    confirmPassword: "",
    serviceType: "residence", // 'residence' or 'mall'
    mall: "",
  });

  // Multi-Select State for Buildings
  const [selectedBuildings, setSelectedBuildings] = useState([]); // Stores full objects { _id, name }
  const [buildingSearch, setBuildingSearch] = useState("");
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- 1. Fetch Data on Open ---
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setFetchingData(true);
        try {
          const [bRes, mRes] = await Promise.all([
            buildingService.list(1, 1000),
            mallService.list(1, 1000),
          ]);
          setAllBuildings(bRes.data || []);
          setAllMalls(mRes.data || []);
        } catch (error) {
          toast.error("Could not load options");
        } finally {
          setFetchingData(false);
        }
      };
      loadOptions();

      // Reset or Populate
      if (editData) {
        populateEditData(editData);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editData]);

  // --- 2. Helper Functions ---

  const resetForm = () => {
    setFormData({
      name: "",
      number: "",
      password: "",
      confirmPassword: "",
      serviceType: "residence",
      mall: "",
    });
    setSelectedBuildings([]);
    setBuildingSearch("");
  };

  const populateEditData = (data) => {
    // Determine Service Type based on data
    let sType = "residence";
    if (data.mall) sType = "mall";

    // Handle Buildings (Convert IDs/Objects to local state array)
    let initialBuildings = [];
    if (data.buildings && Array.isArray(data.buildings)) {
      initialBuildings = data.buildings.map((b) =>
        // Handle if backend sends full object or just ID
        typeof b === "object" ? b : { _id: b, name: "Loading..." },
      );
    }

    setFormData({
      name: data.name || "",
      number: data.number || "",
      password: data.password || "",
      confirmPassword: data.password || "",
      serviceType: sType,
      mall:
        data.mall && typeof data.mall === "object"
          ? data.mall._id
          : data.mall || "",
    });
    setSelectedBuildings(initialBuildings);
  };

  // --- 3. Multi-Select Logic ---

  // Add a building to the selected list
  const selectBuilding = (building) => {
    if (!selectedBuildings.find((b) => b._id === building._id)) {
      setSelectedBuildings([...selectedBuildings, building]);
    }
    setBuildingSearch("");
    // Keep dropdown open for multiple selections or close it:
    // setIsBuildingDropdownOpen(false);
  };

  // Remove a building chip
  const removeBuilding = (id) => {
    setSelectedBuildings(selectedBuildings.filter((b) => b._id !== id));
  };

  // Filter buildings for dropdown
  const filteredBuildings = allBuildings.filter(
    (b) =>
      b.name.toLowerCase().includes(buildingSearch.toLowerCase()) &&
      !selectedBuildings.find((selected) => selected._id === b._id),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBuildingDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.number) {
      toast.error("Name and Mobile are required");
      return;
    }

    // Password validation for new supervisors
    if (!editData && !formData.password) {
      toast.error("Password is required for new supervisors");
      return;
    }

    // Check password match (only if password is provided)
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // 1. Prepare Payload
      const payload = {
        name: formData.name,
        number: formData.number,
      };

      // Only include password if it's provided (and not empty)
      if (formData.password && formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      // 2. Assignment Logic
      if (formData.serviceType === "mall") {
        if (!formData.mall) throw new Error("Please select a Mall");
        payload.mall = formData.mall;
        payload.buildings = [];
      } else {
        if (selectedBuildings.length === 0)
          throw new Error("Please select at least one Building");
        payload.buildings = selectedBuildings.map((b) => b._id);
        payload.mall = null;
      }

      // 3. Send Request
      if (editData) {
        await supervisorService.update(editData._id, payload);
        toast.success("Supervisor Updated");
      } else {
        await supervisorService.create(payload);
        toast.success("Supervisor Created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[SupervisorModal] Error:", error);

      // --- FIX IS HERE ---
      // 1. Check if backend sent a specific response message (e.g., "Oops! Supervisor already created")
      // 2. Fallback to generic error message
      const msg =
        error.response?.data?.message || error.message || "Operation failed";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const passwordsMatch =
    !formData.confirmPassword || formData.password === formData.confirmPassword;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-xl rounded-lg shadow-xl relative z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              {editData ? "Edit Supervisor" : "Create Supervisor"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="p-8 overflow-y-auto custom-scrollbar">
            <form
              id="supervisorForm"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 block">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Enter full name"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 block">
                  Mobile
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="9346532339"
                />
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600 block">
                    Password{" "}
                    {editData && (
                      <span className="text-xs text-gray-400 font-normal">
                        (Leave empty to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder={
                      editData
                        ? "Enter new password (optional)"
                        : "Enter password"
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label
                    className={`text-sm font-medium block ${
                      passwordsMatch ? "text-gray-600" : "text-red-500"
                    }`}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="text"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-md focus:ring-2 outline-none transition-all text-sm ${
                      passwordsMatch
                        ? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        : "border-red-400 focus:ring-red-200 focus:border-red-500"
                    }`}
                    placeholder={
                      editData
                        ? "Confirm new password (optional)"
                        : "Confirm password"
                    }
                  />
                  {!passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">
                      Password and confirm password do not match
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Service Type Switch */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 block">
                  Service Type
                </label>
                <div className="relative">
                  <select
                    value={formData.serviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-700 text-sm"
                  >
                    <option value="residence">Residence</option>
                    <option value="mall">Mall</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* CONDITIONAL RENDERING BASED ON SERVICE TYPE */}

              {/* Option A: MALL SELECT */}
              {formData.serviceType === "mall" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600 block">
                    Select Mall
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={formData.mall}
                      onChange={(e) =>
                        setFormData({ ...formData, mall: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-sm"
                    >
                      <option value="">Select a Mall</option>
                      {allMalls.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Option B: BUILDING MULTI-SELECT (The Chip Input) */}
              {formData.serviceType === "residence" && (
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="text-sm font-medium text-gray-600 block">
                    Building
                  </label>

                  {/* The Chip Input Container */}
                  <div
                    className="w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white min-h-[46px] p-1.5 flex flex-wrap gap-2 items-center relative transition-all"
                    onClick={() => setIsBuildingDropdownOpen(true)}
                  >
                    {/* Render Chips */}
                    {selectedBuildings.map((building) => (
                      <span
                        key={building._id}
                        className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                      >
                        {building.name}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBuilding(building._id);
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {/* Search Input */}
                    <input
                      type="text"
                      value={buildingSearch}
                      onChange={(e) => {
                        setBuildingSearch(e.target.value);
                        setIsBuildingDropdownOpen(true);
                      }}
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-1 px-1 text-gray-700 placeholder-gray-400"
                      placeholder={
                        selectedBuildings.length === 0
                          ? "Search building..."
                          : ""
                      }
                    />
                  </div>

                  {/* Custom Dropdown */}
                  {isBuildingDropdownOpen && (
                    <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {fetchingData ? (
                        <div className="p-3 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Loading...
                        </div>
                      ) : filteredBuildings.length > 0 ? (
                        filteredBuildings.map((building) => (
                          <div
                            key={building._id}
                            onClick={() => selectBuilding(building)}
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer flex items-center gap-2 transition-colors"
                          >
                            <Building className="w-4 h-4 text-gray-400" />
                            {building.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-sm text-gray-400">
                          No buildings found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer Buttons */}
          <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="supervisorForm" // Links button to form
              disabled={loading || !passwordsMatch}
              className="px-6 py-2 bg-[#009ef7] hover:bg-[#0095e8] text-white text-sm font-medium rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SupervisorModal;
