import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { X, User, MapPin, Loader2, Building, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CustomDropdown from "../ui/CustomDropdown";

// APIs
import { attendanceService } from "../../api/attendanceService";
import { locationService } from "../../api/locationService";
import { buildingService } from "../../api/buildingService";

// Reduxj
import { assignWorker } from "../../redux/slices/bookingSlice";

const AssignWorkerModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Data Lists
  const [workers, setWorkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    worker: "",
    location: "",
    building: "",
  });

  const toId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    const raw = value?._id || value?.id || "";
    return raw ? String(raw).trim() : "";
  };

  const normalizeText = (value) =>
    (value || "").toString().trim().toLowerCase();

  const normalizeServiceType = (value) => {
    const t = normalizeText(value);
    if (["mobile", "residence", "mall"].includes(t)) return t;
    return "";
  };

  const getWorkerServiceType = (worker) => {
    const direct = normalizeServiceType(
      worker?.service_type || worker?.serviceType || worker?.type,
    );
    if (direct) return direct;

    if (Array.isArray(worker?.malls) && worker.malls.length > 0) return "mall";
    if (Array.isArray(worker?.buildings) && worker.buildings.length > 0) {
      return "residence";
    }
    return "";
  };

  const extractList = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  // --- Load Data ---
  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);

      const loadData = async () => {
        try {
          // Fetch all data in parallel
          const [workersRes, locRes, buildRes] = await Promise.all([
            attendanceService.getOrgList(),
            locationService.list(1, 1000),
            buildingService.list(1, 1000),
          ]);

          // 1. Workers
          const workerList = (workersRes.data || []).filter(
            (u) => u.role === "worker" || !u.role,
          );
          setWorkers(workerList);

          // 2. Locations (supports [], {data: []}, {data: {data: []}})
          const locList = extractList(locRes);
          setLocations(locList);

          // 3. Buildings (supports [], {data: []}, {data: {data: []}})
          const buildList = extractList(buildRes);
          setAllBuildings(buildList);

          // 4. Prefill selected worker/location/building after dropdown data is loaded
          const initialWorkerId = toId(booking?.worker);

          const bookingLocationId =
            toId(booking?.location) || toId(booking?.customer?.location);
          const bookingLocationName =
            booking?.location_name ||
            booking?.location?.address ||
            booking?.location?.name ||
            booking?.customer?.location?.address ||
            booking?.customer?.location?.name ||
            "";

          let initialLocationId = bookingLocationId;
          const hasLocationInList = locList.some(
            (l) => toId(l) === initialLocationId,
          );
          if (!initialLocationId || !hasLocationInList) {
            const matchedLocation = locList.find((l) => {
              const text = normalizeText(l?.address || l?.name || "");
              return text && text === normalizeText(bookingLocationName);
            });
            initialLocationId = toId(matchedLocation);
          }

          const buildingsForLocation = initialLocationId
            ? buildList.filter(
                (b) =>
                  toId(b?.location_id || b?.location) === initialLocationId,
              )
            : [];

          const bookingBuildingId =
            toId(booking?.building) || toId(booking?.customer?.building);
          const bookingBuildingName =
            booking?.building_name ||
            booking?.building?.name ||
            booking?.customer?.building?.name ||
            "";

          let initialBuildingId = bookingBuildingId;
          const hasBuildingInList = buildingsForLocation.some(
            (b) => toId(b) === initialBuildingId,
          );
          if (!initialBuildingId || !hasBuildingInList) {
            const matchedBuilding = buildingsForLocation.find(
              (b) =>
                normalizeText(b?.name) === normalizeText(bookingBuildingName),
            );
            initialBuildingId = toId(matchedBuilding);
          }

          setFormData({
            worker: initialWorkerId,
            location: initialLocationId,
            building: initialBuildingId,
          });
        } catch (error) {
          console.error("Failed to load dropdowns", error);
          toast.error("Could not load options");
        } finally {
          setDataLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, booking]);

  // --- Cascading Filter ---
  const targetServiceType = normalizeServiceType(booking?.service_type);

  const filteredWorkers = useMemo(() => {
    if (!targetServiceType) return workers;
    return workers.filter((w) => getWorkerServiceType(w) === targetServiceType);
  }, [workers, targetServiceType]);

  const workerOptions = useMemo(
    () =>
      filteredWorkers.map((w) => ({
        value: toId(w),
        label: `${w.name || "Unknown"}${w.mobile ? ` (${w.mobile})` : ""}`,
      })),
    [filteredWorkers],
  );

  const locationOptions = useMemo(
    () =>
      locations.map((loc) => ({
        value: toId(loc),
        label: loc.address || loc.name || "Unknown Location",
      })),
    [locations],
  );

  const filteredBuildings = useMemo(() => {
    if (!formData.location) return [];

    return allBuildings.filter((b) => {
      const bLocId = toId(b.location_id || b.location);
      return bLocId === formData.location;
    });
  }, [formData.location, allBuildings]);

  const buildingOptions = useMemo(
    () =>
      filteredBuildings.map((b) => ({
        value: toId(b),
        label: b.name || "Unknown Building",
      })),
    [filteredBuildings],
  );

  useEffect(() => {
    if (!formData.worker) return;
    const exists = filteredWorkers.some((w) => toId(w) === formData.worker);
    if (!exists) {
      setFormData((prev) => ({ ...prev, worker: "" }));
    }
  }, [filteredWorkers, formData.worker]);

  // --- Handlers ---
  const handleLocationChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      location: value,
      building: "",
    }));
  };

  const handleSubmit = async () => {
    if (!formData.worker) return toast.error("Please select a worker");

    if (booking?.service_type === "residence") {
      if (!formData.location) return toast.error("Location is required");
      if (!formData.building) return toast.error("Building is required");
    }

    setLoading(true);
    try {
      await dispatch(
        assignWorker({
          id: booking._id,
          payload: formData,
        }),
      ).unwrap();
      toast.success("Worker assigned successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (No Blur = Smooth) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Assign Worker
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Booking #{booking?.id || "---"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {dataLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-sm">Loading options...</span>
                </div>
              ) : (
                <>
                  {/* Worker Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Worker
                    </label>
                    <CustomDropdown
                      value={formData.worker}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, worker: value }))
                      }
                      options={workerOptions}
                      placeholder={
                        targetServiceType
                          ? `Select ${targetServiceType} worker`
                          : "Select Worker"
                      }
                      icon={User}
                      searchable
                    />
                    {targetServiceType && workerOptions.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        No active {targetServiceType} workers available.
                      </p>
                    )}
                  </div>

                  {/* Residence Details */}
                  {booking?.service_type === "residence" && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4" />
                        Residence Details
                      </div>

                      {/* Location Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Location
                        </label>
                        <CustomDropdown
                          value={formData.location}
                          onChange={handleLocationChange}
                          options={locationOptions}
                          placeholder="Select Location"
                          icon={MapPin}
                          searchable
                        />
                      </div>

                      {/* Building Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Building
                        </label>
                        <CustomDropdown
                          value={formData.building}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              building: value,
                            }))
                          }
                          options={buildingOptions}
                          placeholder={
                            formData.location
                              ? "Select Building"
                              : "Select Location First"
                          }
                          icon={Building}
                          searchable
                          disabled={!formData.location}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-white font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || dataLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssignWorkerModal;
