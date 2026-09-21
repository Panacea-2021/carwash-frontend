import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Building,
  Car,
  CreditCard,
  User,
  MapPin,
  ShoppingBag,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { oneWashService } from "../../api/oneWashService";
import { workerService } from "../../api/workerService";
import { mallService } from "../../api/mallService";
import { buildingService } from "../../api/buildingService";
import { pricingService } from "../../api/pricingService";

// Custom Components
import CustomDropdown from "../ui/CustomDropdown";

const OneWashModal = ({
  isOpen,
  onClose,
  job,
  onSuccess,
  parentWorkers = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("AED"); // Default currency
  const [hasWashTypes, setHasWashTypes] = useState(false); // Track if mall has wash_types configured

  // Dropdown Data
  const [workers, setWorkers] = useState([]);
  const [malls, setMalls] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [formData, setFormData] = useState({
    service_type: "mall",
    worker: "",
    mall: "",
    building: "",
    registration_no: "",
    parking_no: "",
    amount: "",
    payment_mode: "cash",
    status: "pending",
    wash_type: "inside", // Added wash_type field
  });

  // Load Currency
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  // Load Dependencies
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // Fetch each independently so one failure doesn't block the others
        const [wRes, mRes, bRes] = await Promise.allSettled([
          workerService.list(1, 1000),
          mallService.list(1, 1000),
          buildingService.list(1, 1000),
        ]);

        if (wRes.status === "fulfilled") {
          setWorkers(wRes.value?.data || []);
        } else {
          console.error("Failed to load workers:", wRes.reason);
          // Fallback to parent-provided workers if the API call fails
          if (parentWorkers.length > 0) {
            setWorkers(parentWorkers);
          }
        }

        if (mRes.status === "fulfilled") {
          setMalls(mRes.value?.data || []);
        } else {
          console.error("Failed to load malls:", mRes.reason);
        }

        if (bRes.status === "fulfilled") {
          setBuildings(bRes.value?.data || []);
        } else {
          console.error("Failed to load buildings:", bRes.reason);
        }
      };
      fetchData();

      // Pre-fill if editing
      if (job) {
        const serviceType = job.service_type || "mall";
        setFormData({
          service_type: serviceType,
          worker: job.worker?._id || job.worker || "",
          mall: job.mall?._id || job.mall || "",
          building: job.building?._id || job.building || "",
          registration_no: job.registration_no || "",
          parking_no: job.parking_no || "",
          amount: job.amount || "",
          payment_mode: job.payment_mode || "cash",
          status: job.status || "pending",
          // Only preserve wash_type for mall jobs
          wash_type: serviceType === "mall" ? job.wash_type || "inside" : "",
        });

        // Check pricing for mall jobs
        if (serviceType === "mall" && (job.mall?._id || job.mall)) {
          checkMallPricing(job.mall?._id || job.mall);
        }
      } else {
        // Reset
        setFormData({
          service_type: "mall",
          worker: "",
          mall: "",
          building: "",
          registration_no: "",
          parking_no: "",
          amount: "",
          payment_mode: "cash",
          status: "pending",
          wash_type: "inside", // Default wash_type for new mall jobs
        });
      }
    }
  }, [isOpen, job]);

  // Check if mall has wash_types configured in pricing
  const checkMallPricing = async (mallId) => {
    if (!mallId) {
      setHasWashTypes(false);
      return;
    }

    try {
      const response = await pricingService.getByMall(mallId);
      const pricing = response?.data;

      // Check if pricing exists and has wash_types configured (unified)
      const hasWashTypesConfig = !!(
        pricing &&
        (pricing.wash_types || (pricing.sedan && pricing.sedan.wash_types))
      );

      setHasWashTypes(hasWashTypesConfig);
    } catch (error) {
      console.error("Error fetching mall pricing:", error);
      setHasWashTypes(false);
    }
  };

  // Watch for mall changes to check pricing
  useEffect(() => {
    if (formData.service_type === "mall" && formData.mall) {
      checkMallPricing(formData.mall);
    } else {
      setHasWashTypes(false);
    }
  }, [formData.mall, formData.service_type]);

  // --- Handlers ---

  const handleFieldChange = (name, value) => {
    setFormData((prev) => {
      // Clear conflicting fields if service type changes
      if (name === "service_type") {
        // When switching to residence, clear wash_type and mall
        // When switching to mall, clear building
        return {
          ...prev,
          [name]: value,
          mall: value === "mall" ? prev.mall : "",
          building: value === "residence" ? prev.building : "",
          wash_type: value === "mall" ? prev.wash_type || "inside" : "",
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    if (!formData.worker) {
      toast.error("Please select a worker");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.registration_no) {
      toast.error("Please enter registration number");
      return;
    }
    if (formData.service_type === "mall" && !formData.mall) {
      toast.error("Please select a mall");
      return;
    }
    if (formData.service_type === "residence" && !formData.building) {
      toast.error("Please select a building");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - exclude wash_type for residence jobs or malls without wash_types
      const payload = { ...formData };
      if (formData.service_type === "residence") {
        delete payload.wash_type;
        delete payload.mall; // Ensure mall is not sent for residence
      } else if (formData.service_type === "mall") {
        delete payload.building; // Ensure building is not sent for mall

        // Only include wash_type if mall has wash_types configured
        if (!hasWashTypes) {
          delete payload.wash_type;
        } else if (!payload.wash_type) {
          // Ensure wash_type has a default value for malls with wash_types
          payload.wash_type = "inside";
        }
      }

      if (job) {
        await oneWashService.update(job._id, payload);
        toast.success("Job updated successfully");
      } else {
        await oneWashService.create(payload);
        toast.success("Job created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Operation failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Prepare Options ---
  const serviceTypeOptions = [
    { value: "mall", label: "Mall", icon: ShoppingBag },
    { value: "residence", label: "Residence", icon: Building },
  ];

  const paymentModeOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank transfer", label: "Bank Transfer" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", icon: Loader2 },
    { value: "completed", label: "Completed", icon: CheckCircle },
  ];

  const washTypeOptions = [
    { value: "inside", label: "Inside" },
    { value: "outside", label: "Outside" },
    { value: "total", label: "Inside + Outside" },
  ];

  const mallOptions = useMemo(
    () => malls.map((m) => ({ value: m._id, label: m.name })),
    [malls],
  );

  const buildingOptions = useMemo(
    () => buildings.map((b) => ({ value: b._id, label: b.name })),
    [buildings],
  );

  const workerOptions = useMemo(
    () => workers.map((w) => ({ value: w._id, label: w.name })),
    [workers],
  );

  // Styles
  const labelClass =
    "block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wide";
  const inputClass =
    "w-full text-sm font-semibold text-slate-700 outline-none bg-transparent placeholder:text-slate-400";
  const wrapperClass =
    "flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-600" />
                {job ? "Edit Job" : "New One Wash Job"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50"
            >
              {/* Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <CustomDropdown
                    label="Service Type"
                    value={formData.service_type}
                    onChange={(val) => handleFieldChange("service_type", val)}
                    options={serviceTypeOptions}
                    icon={MapPin}
                    placeholder="Select Type"
                  />
                </div>

                {/* Dynamic Location Field */}
                <div>
                  {formData.service_type === "mall" ? (
                    <CustomDropdown
                      label="Select Mall"
                      value={formData.mall}
                      onChange={(val) => handleFieldChange("mall", val)}
                      options={mallOptions}
                      icon={ShoppingBag}
                      placeholder="Select Mall"
                      searchable={true}
                    />
                  ) : (
                    <CustomDropdown
                      label="Select Building"
                      value={formData.building}
                      onChange={(val) => handleFieldChange("building", val)}
                      options={buildingOptions}
                      icon={Building}
                      placeholder="Select Building"
                      searchable={true}
                    />
                  )}
                </div>
              </div>

              {/* Vehicle & Payment Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Car className="w-4 h-4 text-purple-500" /> Vehicle & Payment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Car Plate No</label>
                    <div className={wrapperClass}>
                      <input
                        name="registration_no"
                        value={formData.registration_no}
                        onChange={handleInputChange}
                        className={`${inputClass} font-bold uppercase`}
                        placeholder="DXB 1234"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Parking No</label>
                    <div className={wrapperClass}>
                      <input
                        name="parking_no"
                        value={formData.parking_no}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="B1-20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <div className={wrapperClass}>
                      <span className="text-[10px] font-extrabold text-emerald-600 pr-1.5">
                        {currency}
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className={`${inputClass} font-bold text-emerald-600`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <CustomDropdown
                      label="Payment Mode"
                      value={formData.payment_mode}
                      onChange={(val) => handleFieldChange("payment_mode", val)}
                      options={paymentModeOptions}
                      icon={CreditCard}
                      placeholder="Select Mode"
                    />
                  </div>
                </div>
              </div>

              {/* Worker & Status */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-500" /> Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <CustomDropdown
                      label="Assign Worker"
                      value={formData.worker}
                      onChange={(val) => handleFieldChange("worker", val)}
                      options={workerOptions}
                      icon={Briefcase}
                      placeholder="Select Worker"
                      searchable={true}
                    />
                  </div>
                  <div>
                    <CustomDropdown
                      label="Job Status"
                      value={formData.status}
                      onChange={(val) => handleFieldChange("status", val)}
                      options={statusOptions}
                      placeholder="Pending"
                    />
                  </div>
                  {formData.service_type === "mall" && hasWashTypes && (
                    <div className="md:col-span-2">
                      <CustomDropdown
                        label="Wash Type (For Malls Only)"
                        value={formData.wash_type}
                        onChange={(val) => handleFieldChange("wash_type", val)}
                        options={washTypeOptions}
                        icon={Car}
                        placeholder="Select Wash Type"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-20">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200 text-sm disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save
                Job
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OneWashModal;
