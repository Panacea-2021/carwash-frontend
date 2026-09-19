import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Home,
  Car,
  Loader2,
  Save,
  Calendar,
  Mail,
  Plus,
  DollarSign,
  Check,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Redux
import { createEnquiry, updateEnquiry } from "../../redux/slices/enquirySlice";
import { useDispatch } from "react-redux";

// API
import { locationService } from "../../api/locationService";
import { buildingService } from "../../api/buildingService";
import { workerService } from "../../api/workerService";

// Custom Components
import CustomDropdown from "../ui/CustomDropdown";

const EnquiryModal = ({ isOpen, onClose, enquiry, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("AED");

  // Data States
  const [locations, setLocations] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);

  // Week Days Options
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Refs for Day Dropdowns (array for multiple vehicles)
  const dayDropdownRefs = useRef([]);
  const [openDayDropdowns, setOpenDayDropdowns] = useState({});

  // Empty Vehicle Template
  const vehicleTemplate = {
    registration_no: "",
    parking_no: "",
    vehicle_type: "sedan",
    amount: "",
    worker: "",
    schedule_type: "daily",
    schedule_days: "",
    start_date: new Date().toISOString().split("T")[0],
    onboard_date: new Date().toISOString().split("T")[0],
    advance_amount: "",
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
    status: "pending",
  });

  // --- Helper: Normalize day name to proper case ---
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

  // --- Helper: Convert schedule_days to string (handles all formats) ---
  const getScheduleDaysString = (scheduleDays) => {
    if (!scheduleDays) return "";
    if (typeof scheduleDays === "string")
      return scheduleDays
        .split(",")
        .filter(Boolean)
        .map(normalizeDayName)
        .join(",");
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
        try {
          const [locRes, buildRes, workRes] = await Promise.all([
            locationService.list(1, 1000),
            buildingService.list(1, 1000),
            workerService.list(1, 1000),
          ]);

          setLocations(locRes.data || []);
          setAllBuildings(buildRes.data || []);
          const validWorkers = (workRes.data || []).filter(
            (w) => !w.role || w.role === "worker" || w.role === "supervisor",
          );
          setAllWorkers(validWorkers);
        } catch (error) {
          console.error("Failed to load options", error);
          toast.error("Failed to load dropdown data");
        }
      };
      loadDependencies();
      populateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, enquiry]);

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
    if (enquiry) {
      const locId = enquiry.location?._id || enquiry.location || "";
      const buildId = enquiry.building?._id || enquiry.building || "";

      const vehicles =
        enquiry.vehicles && enquiry.vehicles.length > 0
          ? enquiry.vehicles.map((v) => {
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
                    : "",
                advance_amount: v.advance_amount || "",
              };
            })
          : [vehicleTemplate];

      setFormData({
        firstName: enquiry.firstName || "",
        lastName: enquiry.lastName || "",
        mobile: enquiry.mobile || "",
        email: enquiry.email || "",
        location: locId,
        building: buildId,
        flat_no: enquiry.flat_no || "",
        vehicles: vehicles,
        status: enquiry.status || "pending",
      });
    } else {
      // Reset for new enquiry
      setFormData({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        location: "",
        building: "",
        flat_no: "",
        vehicles: [vehicleTemplate],
        status: "pending",
      });
    }
  };

  // --- Handlers ---
  const handleBasicChange = (name, value) => {
    setFormData((prev) => {
      // If location changes, clear building and worker
      if (name === "location") {
        return { ...prev, [name]: value, building: "", worker: "" };
      }
      // If building changes, clear worker
      if (name === "building") {
        return { ...prev, [name]: value, worker: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const toggleDaySelection = (day) => {
    let currentDays = formData.schedule_days
      ? formData.schedule_days.split(",").filter((d) => d)
      : [];

    if (currentDays.includes(day)) {
      currentDays = currentDays.filter((d) => d !== day);
    } else {
      currentDays.push(day);
    }

    const sortedDays = weekDays.filter((d) => currentDays.includes(d));
    setFormData({ ...formData, schedule_days: sortedDays.join(",") });
  };

  const handleVehicleChange = (index, name, value) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [name]: value };
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const toggleVehicleDaySelection = (index, day) => {
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

    // Validation
    if (!formData.mobile) return toast.error("Mobile number is required");
    if (!formData.vehicles || formData.vehicles.length === 0) {
      return toast.error("At least one vehicle is required");
    }
    if (!formData.vehicles[0].registration_no) {
      return toast.error("Vehicle registration number is required");
    }

    setLoading(true);
    try {
      if (enquiry) {
        await dispatch(
          updateEnquiry({ id: enquiry._id, data: formData }),
        ).unwrap();
        toast.success("Enquiry updated successfully");
      } else {
        await dispatch(createEnquiry(formData)).unwrap();
        toast.success("Enquiry created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error || "Operation failed");
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[95vh] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {enquiry ? (
                    <>
                      <User className="w-5 h-5 text-indigo-600" />
                      Edit Enquiry
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-indigo-600" />
                      Create Enquiry
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {enquiry
                    ? `ID: #${enquiry.id || "---"}`
                    : "Create a new customer enquiry"}
                </p>
              </div>
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
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-2">
                      Customer Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div>
                        <label className={labelClass}>First Name</label>
                        <div className={wrapperClass}>
                          <User className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) =>
                              handleBasicChange("firstName", e.target.value)
                            }
                            placeholder="Enter first name"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className={labelClass}>Last Name</label>
                        <div className={wrapperClass}>
                          <User className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                              handleBasicChange("lastName", e.target.value)
                            }
                            placeholder="Enter last name"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label className={labelClass}>
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className={wrapperClass}>
                          <Phone className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="text"
                            value={formData.mobile}
                            onChange={(e) =>
                              handleBasicChange("mobile", e.target.value)
                            }
                            placeholder="e.g. 9494197969"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className={labelClass}>Email</label>
                        <div className={wrapperClass}>
                          <Mail className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleBasicChange("email", e.target.value)
                            }
                            placeholder="customer@example.com"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Flat Number */}
                      <div>
                        <label className={labelClass}>Flat Number</label>
                        <div className={wrapperClass}>
                          <Home className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="text"
                            value={formData.flat_no}
                            onChange={(e) =>
                              handleBasicChange("flat_no", e.target.value)
                            }
                            placeholder="e.g. 101"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location and Building */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location */}
                      <div>
                        <label className={labelClass}>Location</label>
                        <CustomDropdown
                          options={locationOptions}
                          value={formData.location}
                          onChange={(val) => handleBasicChange("location", val)}
                          placeholder="Select Location"
                          searchPlaceholder="Search location..."
                          icon={MapPin}
                        />
                      </div>

                      {/* Building */}
                      <div>
                        <label className={labelClass}>Building</label>
                        <CustomDropdown
                          options={buildingOptions}
                          value={formData.building}
                          onChange={(val) => handleBasicChange("building", val)}
                          placeholder="Select Building"
                          searchPlaceholder="Search building..."
                          icon={Home}
                          disabled={!formData.location}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-2">
                      Vehicle Information
                    </h4>

                    {formData.vehicles.map((vehicle, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-4 space-y-4 relative bg-slate-50/50"
                      >
                        {/* Vehicle Header */}
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-bold text-indigo-600 uppercase">
                            Vehicle {index + 1}
                          </h5>
                          {formData.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVehicle(index)}
                              className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                              title="Remove Vehicle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Registration Number */}
                          <div>
                            <label className={labelClass}>
                              Registration Number{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className={wrapperClass}>
                              <Car className="w-4 h-4 text-slate-400 mr-2" />
                              <input
                                type="text"
                                value={vehicle.registration_no}
                                onChange={(e) =>
                                  handleVehicleChange(
                                    index,
                                    "registration_no",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. 12"
                                className={inputClass}
                              />
                            </div>
                          </div>

                          {/* Parking Number */}
                          <div>
                            <label className={labelClass}>Parking Number</label>
                            <div className={wrapperClass}>
                              <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                              <input
                                type="text"
                                value={vehicle.parking_no}
                                onChange={(e) =>
                                  handleVehicleChange(
                                    index,
                                    "parking_no",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. 12"
                                className={inputClass}
                              />
                            </div>
                          </div>

                          {/* Vehicle Type */}
                          <div>
                            <label className={labelClass}>Vehicle Type</label>
                            <CustomDropdown
                              options={vehicleTypeOptions}
                              value={vehicle.vehicle_type}
                              onChange={(val) =>
                                handleVehicleChange(index, "vehicle_type", val)
                              }
                              placeholder="Select Vehicle Type"
                              icon={Car}
                            />
                          </div>

                          {/* Select Cleaner */}
                          <div>
                            <label className={labelClass}>Select Cleaner</label>
                            <CustomDropdown
                              options={workerOptions}
                              value={vehicle.worker}
                              onChange={(val) =>
                                handleVehicleChange(index, "worker", val)
                              }
                              placeholder="Select Cleaner"
                              searchPlaceholder="Search cleaner..."
                              icon={User}
                              disabled={!formData.building}
                            />
                          </div>

                          {/* Subscription Amount */}
                          <div>
                            <label className={labelClass}>
                              Subscription Amount
                            </label>
                            <div className={wrapperClass}>
                              <DollarSign className="w-4 h-4 text-slate-400 mr-2" />
                              <input
                                type="number"
                                value={vehicle.amount}
                                onChange={(e) =>
                                  handleVehicleChange(
                                    index,
                                    "amount",
                                    e.target.value,
                                  )
                                }
                                placeholder="0.00"
                                className={inputClass}
                              />
                              <span className="text-xs font-bold text-slate-400 ml-2">
                                {currency}
                              </span>
                            </div>
                          </div>

                          {/* Advance Amount */}
                          <div>
                            <label className={labelClass}>Advance Amount</label>
                            <div className={wrapperClass}>
                              <DollarSign className="w-4 h-4 text-slate-400 mr-2" />
                              <input
                                type="number"
                                value={vehicle.advance_amount}
                                onChange={(e) =>
                                  handleVehicleChange(
                                    index,
                                    "advance_amount",
                                    e.target.value,
                                  )
                                }
                                placeholder="0.00"
                                className={inputClass}
                              />
                              <span className="text-xs font-bold text-slate-400 ml-2">
                                {currency}
                              </span>
                            </div>
                          </div>

                          {/* Choose Onboard Date */}
                          <div>
                            <label className={labelClass}>
                              Choose Onboard Date
                            </label>
                            <div className={wrapperClass}>
                              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                              <input
                                type="date"
                                value={vehicle.onboard_date}
                                onChange={(e) =>
                                  handleVehicleChange(
                                    index,
                                    "onboard_date",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>

                          {/* Choose Service Start Date */}
                          <div>
                            <label className={labelClass}>
                              Choose Service Start Date
                            </label>
                            <div className={wrapperClass}>
                              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                              <input
                                type="date"
                                value={vehicle.start_date}
                                onChange={(e) =>
                                  handleVehicleChange(
                                    index,
                                    "start_date",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>

                          {/* Schedule Type */}
                          <div>
                            <label className={labelClass}>Schedule</label>
                            <CustomDropdown
                              options={scheduleTypeOptions}
                              value={vehicle.schedule_type}
                              onChange={(val) =>
                                handleVehicleChange(index, "schedule_type", val)
                              }
                              placeholder="Select Schedule Type"
                              icon={Calendar}
                            />
                          </div>

                          {/* Schedule Days (Only for Weekly) */}
                          {vehicle.schedule_type === "weekly" && (
                            <div>
                              <label className={labelClass}>
                                Schedule Days
                              </label>
                              <div
                                className="relative"
                                ref={(el) =>
                                  (dayDropdownRefs.current[index] = el)
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenDayDropdowns((prev) => ({
                                      ...prev,
                                      [index]: !prev[index],
                                    }))
                                  }
                                  className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                >
                                  <span>
                                    {vehicle.schedule_days || "Select Days"}
                                  </span>
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                </button>

                                {openDayDropdowns[index] && (
                                  <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-2">
                                    {weekDays.map((day) => {
                                      const isSelected = vehicle.schedule_days
                                        ?.split(",")
                                        .includes(day);
                                      return (
                                        <button
                                          key={day}
                                          type="button"
                                          onClick={() =>
                                            toggleVehicleDaySelection(
                                              index,
                                              day,
                                            )
                                          }
                                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isSelected
                                              ? "bg-indigo-50 text-indigo-600"
                                              : "text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          {day}
                                          {isSelected && (
                                            <Check className="w-4 h-4" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Section (Only on Edit) */}
                  {enquiry && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-2">
                        Status
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Enquiry Status</label>
                          <CustomDropdown
                            options={[
                              { value: "pending", label: "Pending" },
                              { value: "completed", label: "Completed" },
                              { value: "cancelled", label: "Cancelled" },
                            ]}
                            value={formData.status}
                            onChange={(val) => handleBasicChange("status", val)}
                            placeholder="Select Status"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="flex-1 px-4 py-2.5 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all text-sm font-bold flex justify-center items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Vehicle
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {enquiry ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnquiryModal;
