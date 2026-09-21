import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  User,
  UserPlus,
  Phone,
  MapPin,
  Home,
  Car,
  Loader2,
  Save,
  Briefcase,
  Clock,
  Calendar,
  Mail,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { customerService } from "../../api/customerService";
import { locationService } from "../../api/locationService";
import { buildingService } from "../../api/buildingService";
import { workerService } from "../../api/workerService";

// Custom Components
import CustomDropdown from "../ui/CustomDropdown";

const CustomerModal = ({ isOpen, onClose, customer, onSuccess }) => {
  const UAE_CODE = "971";
  const AUTO_LOCAL_PREFIX = "200000";
  const AUTO_UAE_PREFIX = `${UAE_CODE}${AUTO_LOCAL_PREFIX}`;

  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("AED"); // Default Currency
  const [isMobileGenerated, setIsMobileGenerated] = useState(false); // Track if mobile is auto-generated

  // Data States
  const [locations, setLocations] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);

  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);

  // Empty Vehicle Template
  const vehicleTemplate = {
    registration_no: "",
    parking_no: "",
    vehicle_type: "sedan",
    amount: "",
    worker: "",
    schedule_type: "daily",
    schedule_days: "", // Stores comma separated days "Mon,Tue"
    start_date: new Date().toISOString().split("T")[0],
    onboard_date: new Date().toISOString().split("T")[0],
    advance_amount: "",
    status: 1, // 1 = Active, 2 = Inactive (per vehicle)
  };

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    location: "",
    building: "",
    flat_no: "",
    vehicles: [vehicleTemplate],
  });

  // Week Days Options
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Refs for Day Dropdowns
  const dayDropdownRefs = useRef([]);
  // UI State for Open Day Dropdowns (Tracked by vehicle index)
  const [openDayDropdowns, setOpenDayDropdowns] = useState({});

  // --- Auto-Generate Mobile Number ---
  const generateMobileNumber = async () => {
    try {
      // Get the total count of customers to generate serial-based number
      const res = await customerService.list(1, 1, "", 1);
      const serialNumber = (res.total || 0) + 1;
      // Generate auto mobile: 971200000 + serial (display local: 200000 + serial)
      const generatedMobile = `${AUTO_UAE_PREFIX}${String(serialNumber).padStart(3, "0")}`;
      setIsMobileGenerated(true);
      return generatedMobile;
    } catch (error) {
      console.error("Failed to generate mobile number", error);
      // Fallback to timestamp-based generation
      const timestamp = Date.now().toString().slice(-3);
      const generatedMobile = `${AUTO_UAE_PREFIX}${timestamp.padStart(3, "0")}`;
      setIsMobileGenerated(true);
      return generatedMobile;
    }
  };

  // --- Helper: Convert schedule_days to string (handles all formats) ---
  // Normalizes day names to proper case (e.g., "thu" → "Thu")
  const normalizeDayName = (d) => {
    const map = {
      sun: "Sun",
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
    };
    return map[d.trim().toLowerCase()] || d.trim();
  };
  const getScheduleDaysString = (scheduleDays) => {
    if (!scheduleDays) return "";
    if (typeof scheduleDays === "string") {
      return scheduleDays
        .split(",")
        .filter(Boolean)
        .map(normalizeDayName)
        .join(",");
    }
    if (Array.isArray(scheduleDays)) {
      return scheduleDays
        .map((d) => normalizeDayName(typeof d === "object" ? d.day : String(d)))
        .filter(Boolean)
        .join(",");
    }
    if (typeof scheduleDays === "object" && scheduleDays.day) {
      return normalizeDayName(scheduleDays.day);
    }
    return "";
  };

  // --- Load Currency ---
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  // --- 1. Load Initial Data ---
  useEffect(() => {
    if (isOpen) {
      const loadDependencies = async () => {
        const [locRes, buildRes, workRes] = await Promise.allSettled([
          locationService.list(1, 1000),
          buildingService.list(1, 1000),
          workerService.list(1, 1000),
        ]);

        if (locRes.status === "fulfilled") {
          setLocations(locRes.value?.data || []);
        }
        if (buildRes.status === "fulfilled") {
          setAllBuildings(buildRes.value?.data || []);
        }
        if (workRes.status === "fulfilled") {
          const validWorkers = (workRes.value?.data || []).filter(
            (w) => !w.role || w.role === "worker" || w.role === "supervisor",
          );
          setAllWorkers(validWorkers);
        }
      };
      loadDependencies();
      populateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  // --- 2. Filter Buildings when Location Changes ---
  useEffect(() => {
    if (formData.location && allBuildings.length > 0) {
      const filtered = allBuildings.filter((b) => {
        const rawLoc = b.location || b.location_id;
        const bLocId =
          rawLoc && typeof rawLoc === "object" ? rawLoc._id : rawLoc;
        return String(bLocId) === String(formData.location);
      });
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings([]);
    }
  }, [formData.location, allBuildings]);

  // --- 3. Filter Workers when Building Changes ---
  useEffect(() => {
    if (formData.building && allWorkers.length > 0) {
      const relevantWorkers = allWorkers.filter((worker) => {
        return worker.buildings?.some((b) => {
          const bId = typeof b === "object" ? b._id : b;
          return String(bId) === String(formData.building);
        });
      });
      setFilteredWorkers(relevantWorkers);
    } else {
      setFilteredWorkers([]);
    }
  }, [formData.building, allWorkers]);

  // --- 4. Populate Form ---
  const populateForm = () => {
    if (customer) {
      const locId = customer.location?._id || customer.location || "";
      const buildId = customer.building?._id || customer.building || "";

      const vehicles =
        customer.vehicles && customer.vehicles.length > 0
          ? customer.vehicles.map((v) => {
              return {
                _id: v._id,
                registration_no: v.registration_no || "",
                parking_no: v.parking_no || "",
                vehicle_type: v.vehicle_type || "sedan",
                amount: v.amount || "",
                worker: v.worker?._id || v.worker || "",
                schedule_type: v.schedule_type || "daily",
                schedule_days: getScheduleDaysString(v.schedule_days),
                start_date: v.start_date
                  ? new Date(v.start_date).toISOString().split("T")[0]
                  : "",
                onboard_date: v.onboard_date
                  ? new Date(v.onboard_date).toISOString().split("T")[0]
                  : v.start_date
                    ? new Date(v.start_date).toISOString().split("T")[0]
                    : "", // Use start_date as fallback for old records
                advance_amount: v.advance_amount || "",
                status: v.status || 1, // Preserve vehicle status
              };
            })
          : [vehicleTemplate];

      // Check if mobile is auto-generated UAE format
      const mobile = customer.mobile || "";
      setIsMobileGenerated(mobile.startsWith(AUTO_UAE_PREFIX));

      setFormData({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        mobile: mobile,
        email: customer.email || "",
        location: locId,
        building: buildId,
        flat_no: customer.flat_no || "",
        vehicles: vehicles,
      });
    } else {
      // New customer - auto-generate mobile if not provided
      const initializeNewCustomer = async () => {
        const generatedMobile = await generateMobileNumber();
        setFormData({
          firstName: "",
          lastName: "",
          mobile: generatedMobile,
          email: "",
          location: "",
          building: "",
          flat_no: "",
          vehicles: [vehicleTemplate],
        });
      };
      initializeNewCustomer();
    }
  };

  // --- Handlers ---

  const handleBasicChange = (name, value) => {
    setFormData((prev) => {
      // If location changes, clear building
      if (name === "location") {
        return { ...prev, [name]: value, building: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleVehicleChange = (index, name, value) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [name]: value };
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const toggleDaySelection = (index, day) => {
    const vehicle = formData.vehicles[index];
    const scheduleDaysStr = getScheduleDaysString(vehicle.schedule_days);
    let currentDays = scheduleDaysStr
      ? scheduleDaysStr.split(",").filter((d) => d)
      : [];

    if (currentDays.includes(day)) {
      currentDays = currentDays.filter((d) => d !== day);
    } else {
      currentDays.push(day);
    }

    const sortedDays = weekDays.filter((d) => currentDays.includes(d));
    handleVehicleChange(index, "schedule_days", sortedDays.join(","));
  };

  const handleAddVehicle = () => {
    setFormData({
      ...formData,
      vehicles: [...formData.vehicles, vehicleTemplate],
    });
  };

  const handleRemoveVehicle = (index) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  // Close day dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(openDayDropdowns).forEach((key) => {
        if (
          openDayDropdowns[key] &&
          dayDropdownRefs.current[key] &&
          !dayDropdownRefs.current[key].contains(event.target)
        ) {
          setOpenDayDropdowns((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDayDropdowns]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Validate for duplicate vehicle+parking combinations within this customer
      const vehicleParkingCombos = new Map();
      for (const vehicle of formData.vehicles) {
        if (vehicle.registration_no) {
          const key = `${vehicle.registration_no.toLowerCase()}|${(vehicle.parking_no || "").toLowerCase()}`;
          if (vehicleParkingCombos.has(key)) {
            toast.error(
              `Duplicate vehicle+parking combination: ${vehicle.registration_no} with parking ${vehicle.parking_no || "N/A"}`,
            );
            setLoading(false);
            return;
          }
          vehicleParkingCombos.set(key, true);
        }
      }

      if (customer) {
        // For updates, remove onboard_date from existing vehicles (backend will preserve it)
        const updatePayload = {
          ...formData,
          vehicles: formData.vehicles.map((v) => {
            const vehicleData = { ...v };
            // Remove onboard_date for existing vehicles (let backend preserve original)
            if (v._id) {
              delete vehicleData.onboard_date;
            }
            return vehicleData;
          }),
        };
        await customerService.update(customer._id, updatePayload);
        toast.success("Customer updated successfully");
      } else {
        await customerService.create(formData);
        toast.success("Customer created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Prepare Dropdown Options ---
  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l._id, label: l.name || l.address })),
    [locations],
  );

  const buildingOptions = useMemo(
    () => filteredBuildings.map((b) => ({ value: b._id, label: b.name })),
    [filteredBuildings],
  );

  const workerOptions = useMemo(
    () => filteredWorkers.map((w) => ({ value: w._id, label: w.name })),
    [filteredWorkers],
  );

  const vehicleTypeOptions = [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV / 4x4" },
    { value: "bike", label: "Bike" },
    { value: "hatchback", label: "Hatchback" },
    { value: "xuv", label: "XUV" },
  ];

  const scheduleTypeOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "onetime", label: "One Time" },
  ];

  // Styles
  const labelClass =
    "block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wide";
  const inputClass =
    "w-full text-sm font-semibold text-slate-700 outline-none bg-transparent placeholder:text-slate-400";
  const wrapperClass =
    "flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[95vh] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {customer ? (
                  <User className="w-5 h-5 text-indigo-600" />
                ) : (
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                )}
                {customer ? "Edit Customer" : "Create Customer"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
            >
              {/* --- 1. Personal Details --- */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-500" /> Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <div className={wrapperClass}>
                      <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleBasicChange("firstName", e.target.value)
                        }
                        className={inputClass}
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <div className={wrapperClass}>
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleBasicChange("lastName", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Mobile
                      {isMobileGenerated && (
                        <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          AUTO-GENERATED
                        </span>
                      )}
                    </label>
                    <div
                      className={`${wrapperClass} ${isMobileGenerated ? "border-amber-300 bg-amber-50/30" : ""}`}
                    >
                      <Phone
                        className={`w-4 h-4 mr-2 ${isMobileGenerated ? "text-amber-500" : "text-slate-400"}`}
                      />
                      <input
                        name="mobile"
                        value={formData.mobile}
                        onChange={(e) => {
                          handleBasicChange("mobile", e.target.value);
                          // If user modifies the generated number, mark it as not generated
                          if (
                            isMobileGenerated &&
                            e.target.value !== formData.mobile
                          ) {
                            setIsMobileGenerated(false);
                          }
                        }}
                        className={inputClass}
                        placeholder="9715XXXXXXXX"
                        required
                      />
                      {isMobileGenerated && (
                        <span className="text-[9px] text-amber-600 ml-2 whitespace-nowrap">
                          (Editable)
                        </span>
                      )}
                    </div>
                    {isMobileGenerated && (
                      <p className="mt-1 text-[10px] text-amber-600">
                        This is a temporary number. Update it when the customer
                        provides their mobile.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className={wrapperClass}>
                      <Mail className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleBasicChange("email", e.target.value)
                        }
                        className={inputClass}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 2. Address --- */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-purple-500" /> Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <CustomDropdown
                      label="Location"
                      value={formData.location}
                      onChange={(val) => handleBasicChange("location", val)}
                      options={locationOptions}
                      placeholder="Select Location"
                      icon={MapPin}
                      searchable={true}
                    />
                  </div>
                  <div>
                    <CustomDropdown
                      label="Building"
                      value={formData.building}
                      onChange={(val) => handleBasicChange("building", val)}
                      options={buildingOptions}
                      placeholder={
                        !formData.location
                          ? "Select Location First"
                          : "Select Building"
                      }
                      icon={Briefcase}
                      searchable={true}
                      disabled={!formData.location}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Flat No</label>
                    <div className={wrapperClass}>
                      <Home className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="flat_no"
                        value={formData.flat_no}
                        onChange={(e) =>
                          handleBasicChange("flat_no", e.target.value)
                        }
                        className={inputClass}
                        placeholder="101"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 3. Vehicles (Dynamic Array) --- */}
              {formData.vehicles.map((vehicle, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-visible"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Car className="w-4 h-4 text-indigo-600" /> Vehicle{" "}
                      {index + 1}
                      {vehicle.status === 2 && (
                        <span className="ml-2 text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                          INACTIVE
                        </span>
                      )}
                      {vehicle.status === 1 && vehicle._id && (
                        <span className="ml-2 text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2">
                      {/* Vehicle Status Toggle */}
                      {vehicle._id && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600">
                            STATUS:
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const newStatus = vehicle.status === 1 ? 2 : 1;
                              const action =
                                newStatus === 1 ? "Activate" : "Deactivate";
                              if (!window.confirm(`${action} this vehicle?`))
                                return;
                              try {
                                await customerService.toggleVehicle(
                                  vehicle._id,
                                  vehicle.status,
                                );
                                toast.success(
                                  `Vehicle ${action}d successfully`,
                                );
                                // Update local state
                                const updatedVehicles = [...formData.vehicles];
                                updatedVehicles[index] = {
                                  ...vehicle,
                                  status: newStatus,
                                };
                                setFormData({
                                  ...formData,
                                  vehicles: updatedVehicles,
                                });
                              } catch (error) {
                                toast.error("Failed to update vehicle status");
                              }
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 shadow-sm ${
                              vehicle.status === 1
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-600 justify-end"
                                : "bg-slate-300 justify-start"
                            }`}
                            title={`${vehicle.status === 1 ? "Deactivate" : "Activate"} Vehicle`}
                          >
                            <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                          </button>
                          <span
                            className={`text-[9px] font-bold ${
                              vehicle.status === 1
                                ? "text-emerald-600"
                                : "text-slate-500"
                            }`}
                          >
                            {vehicle.status === 1 ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVehicle(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Row 1 */}
                    <div>
                      <label className={labelClass}>Registration No</label>
                      <div className={wrapperClass}>
                        <input
                          name="registration_no"
                          value={vehicle.registration_no}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "registration_no",
                              e.target.value,
                            )
                          }
                          className={`${inputClass} uppercase`}
                          placeholder="DXB 12345"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Parking No</label>
                      <div className={wrapperClass}>
                        <input
                          name="parking_no"
                          value={vehicle.parking_no}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "parking_no",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="B1-20"
                        />
                      </div>
                    </div>

                    {/* Vehicle Type (Custom Dropdown) */}
                    <div>
                      <CustomDropdown
                        label="Type"
                        value={vehicle.vehicle_type}
                        onChange={(val) =>
                          handleVehicleChange(index, "vehicle_type", val)
                        }
                        options={vehicleTypeOptions}
                        placeholder="Sedan"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Amount</label>
                      <div className={wrapperClass}>
                        {/* Dynamic Currency */}
                        <span className="text-[10px] font-extrabold text-emerald-600 pr-1.5">
                          {currency}
                        </span>
                        <input
                          type="number"
                          name="amount"
                          value={vehicle.amount}
                          onChange={(e) =>
                            handleVehicleChange(index, "amount", e.target.value)
                          }
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label className={labelClass}>Advance Amount</label>
                      <div className={wrapperClass}>
                        {/* Dynamic Currency */}
                        <span className="text-[10px] font-extrabold text-emerald-600 pr-1.5">
                          {currency}
                        </span>
                        <input
                          type="number"
                          name="advance_amount"
                          value={vehicle.advance_amount}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "advance_amount",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Worker Dropdown (Custom) */}
                    <div>
                      <CustomDropdown
                        label="Worker"
                        value={vehicle.worker}
                        onChange={(val) =>
                          handleVehicleChange(index, "worker", val)
                        }
                        options={workerOptions}
                        icon={Briefcase}
                        placeholder={
                          !formData.building
                            ? "Select Building First"
                            : "Assign Worker"
                        }
                        searchable={true}
                        disabled={!formData.building}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Start Date</label>
                      <div className={wrapperClass}>
                        <input
                          type="date"
                          name="start_date"
                          value={vehicle.start_date}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "start_date",
                              e.target.value,
                            )
                          }
                          className={`${inputClass} cursor-pointer`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Onboard Date</label>
                      <div className={wrapperClass}>
                        <input
                          type="date"
                          name="onboard_date"
                          value={vehicle.onboard_date}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "onboard_date",
                              e.target.value,
                            )
                          }
                          className={`${inputClass} cursor-pointer`}
                        />
                      </div>
                    </div>

                    {/* Row 3 - Schedule & Days Selection */}
                    <div className="md:col-span-4 flex gap-4">
                      {/* Schedule Type (Custom) */}
                      <div className="flex-1">
                        <CustomDropdown
                          label="Schedule Type"
                          value={vehicle.schedule_type}
                          onChange={(val) =>
                            handleVehicleChange(index, "schedule_type", val)
                          }
                          options={scheduleTypeOptions}
                          icon={Clock}
                          placeholder="Daily"
                        />
                      </div>

                      {/* Dynamic Weekly Days Dropdown */}
                      {vehicle.schedule_type === "weekly" && (
                        <div
                          className="flex-1 relative"
                          ref={(el) => (dayDropdownRefs.current[index] = el)}
                        >
                          <label className={labelClass}>Select Days</label>
                          <div
                            className={`${wrapperClass} cursor-pointer`}
                            onClick={() =>
                              setOpenDayDropdowns((prev) => ({
                                ...prev,
                                [index]: !prev[index],
                              }))
                            }
                          >
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <span
                              className={`truncate ${
                                vehicle.schedule_days
                                  ? "text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {getScheduleDaysString(vehicle.schedule_days) ||
                                "Select Days..."}
                            </span>
                          </div>

                          {/* Days Dropdown Menu */}
                          {openDayDropdowns[index] && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              {weekDays.map((day) => {
                                const scheduleDaysStr = getScheduleDaysString(
                                  vehicle.schedule_days,
                                );
                                const isSelected = scheduleDaysStr
                                  .split(",")
                                  .includes(day);
                                return (
                                  <div
                                    key={day}
                                    onClick={() =>
                                      toggleDaySelection(index, day)
                                    }
                                    className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-indigo-50 text-indigo-600 font-bold"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span>{day}</span>
                                    {isSelected && (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </form>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-20">
              <button
                type="button"
                onClick={handleAddVehicle}
                className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Customer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomerModal;
