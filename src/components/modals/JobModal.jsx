import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  User,
  Car,
  Calendar,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { jobService } from "../../api/jobService";

// Components
import CustomDropdown from "../ui/CustomDropdown";

const JobModal = ({
  isOpen,
  onClose,
  job,
  onSuccess,
  workers = [],
  customers = [],
}) => {
  const [loading, setLoading] = useState(false);

  // Dropdown Data
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [mergedCustomers, setMergedCustomers] = useState([]);
  const [mergedWorkers, setMergedWorkers] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    vehicle: "",
    worker: "",
    assignedDate: "",
    status: "pending",
    rejectionReason: "",
    service_type: "", // Auto-detected from customer's building/location
  });

  // 1. Load Initial Data
  useEffect(() => {
    if (isOpen) {
      // Pre-fill if editing
      if (job) {
        // If editing, we need to populate vehicles based on the existing customer
        const selectedCustomer = job.customer;
        const selectedWorker = job.worker;

        // The backend 'list' usually populates customer, so we check if it's an object or ID
        const customerId = selectedCustomer?._id || selectedCustomer;
        const workerId = selectedWorker?._id || selectedWorker;

        // Ensure the job's customer is in the customers list
        let updatedCustomers = [...customers];
        if (
          selectedCustomer &&
          typeof selectedCustomer === "object" &&
          selectedCustomer._id
        ) {
          const existsInList = customers.some(
            (c) => c._id === selectedCustomer._id,
          );
          if (!existsInList) {
            updatedCustomers = [selectedCustomer, ...customers];
          }
        }
        setMergedCustomers(updatedCustomers);

        // Ensure the job's worker is in the workers list
        let updatedWorkers = [...workers];
        if (
          selectedWorker &&
          typeof selectedWorker === "object" &&
          selectedWorker._id
        ) {
          const existsInList = workers.some(
            (w) => w._id === selectedWorker._id,
          );
          if (!existsInList) {
            updatedWorkers = [selectedWorker, ...workers];
          }
        }
        setMergedWorkers(updatedWorkers);

        // Find full customer object to get vehicles
        const customerObj =
          updatedCustomers.find((c) => c._id === customerId) ||
          selectedCustomer;
        const vehicles = customerObj?.vehicles || [];
        setAvailableVehicles(vehicles);

        // Auto-detect service_type from customer's building/location
        let serviceType = "";
        if (customerObj?.building) {
          serviceType = "Residence";
        } else if (customerObj?.location) {
          serviceType = "Mall";
        }

        setFormData({
          customer: customerId || "",
          vehicle: job.vehicle?._id || job.vehicle || "", // Backend sends populated vehicle or ID
          worker: workerId || "",
          assignedDate: job.assignedDate
            ? new Date(job.assignedDate).toISOString().split("T")[0]
            : "",
          status: job.status || "pending",
          rejectionReason: job.rejectionReason || job.rejectReason || "", // Handle both field names
          service_type: job.service_type || serviceType || "", // Use existing or auto-detect
        });
      } else {
        // Reset - use props directly for new jobs
        setMergedCustomers(customers);
        setMergedWorkers(workers);
        setFormData({
          customer: "",
          vehicle: "",
          worker: "",
          assignedDate: "",
          status: "pending",
          rejectionReason: "",
          service_type: "",
        });
        setAvailableVehicles([]);
      }
    }
  }, [isOpen, job, customers, workers]);

  // 2. Handle Customer Change -> Update Vehicles & Service Type
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const selectedCus = mergedCustomers.find((c) => c._id === customerId);

    // Auto-detect service_type from customer's building/location
    let serviceType = "";
    if (selectedCus?.building) {
      serviceType = "Residence";
    } else if (selectedCus?.location) {
      serviceType = "Mall";
    }

    setFormData((prev) => ({
      ...prev,
      customer: customerId,
      vehicle: "", // Reset vehicle when customer changes
      service_type: serviceType,
    }));

    setAvailableVehicles(selectedCus?.vehicles || []);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate rejection reason when status is rejected
    if (formData.status === "rejected" && !formData.rejectionReason?.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      if (job) {
        await jobService.update(job._id, formData);
        toast.success("Job updated");
      } else {
        await jobService.create(formData);
        toast.success("Job scheduled");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const labelClass =
    "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1";
  const inputClass =
    "w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (No Blur for Performance) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.5,
            }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[95vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {job ? "Edit Job" : "Schedule New Job"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              {/* Customer Selection */}
              <div>
                <CustomDropdown
                  label="Customer"
                  value={formData.customer}
                  onChange={(val) => {
                    const selectedCus = mergedCustomers.find(
                      (c) => c._id === val,
                    );

                    // Auto-detect service_type from customer's building/location
                    let serviceType = "";
                    if (selectedCus?.building) {
                      serviceType = "Residence";
                    } else if (selectedCus?.location) {
                      serviceType = "Mall";
                    }

                    setFormData((prev) => ({
                      ...prev,
                      customer: val,
                      vehicle: "",
                      service_type: serviceType,
                    }));
                    setAvailableVehicles(selectedCus?.vehicles || []);
                  }}
                  options={mergedCustomers.map((c) => ({
                    value: c._id,
                    label: `${c.firstName} ${c.lastName} (${c.mobile})`,
                  }))}
                  icon={User}
                  placeholder="Select Customer"
                  searchable={true}
                />
              </div>

              {/* Service Type - Auto-detected, readonly */}
              {formData.service_type && (
                <div>
                  <label className={labelClass}>Service Type</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.service_type}
                      readOnly
                      className={`${inputClass} pl-9 bg-slate-100 cursor-not-allowed`}
                    />
                  </div>
                </div>
              )}

              {/* Vehicle Selection */}
              <div>
                <CustomDropdown
                  label="Vehicle"
                  value={formData.vehicle}
                  onChange={(val) => setFormData({ ...formData, vehicle: val })}
                  options={availableVehicles.map((v) => ({
                    value: v._id,
                    label: `${v.registration_no} - ${v.parking_no}`,
                  }))}
                  icon={Car}
                  placeholder="Select Vehicle"
                  disabled={!formData.customer}
                />
              </div>

              {/* Worker & Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <CustomDropdown
                    label="Assign Worker"
                    value={formData.worker}
                    onChange={(val) =>
                      setFormData({ ...formData, worker: val })
                    }
                    options={mergedWorkers.map((w) => ({
                      value: w._id,
                      label: w.name,
                    }))}
                    icon={Briefcase}
                    placeholder="Select Worker"
                  />
                </div>
                <div>
                  <label className={labelClass}>Assigned Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      name="assignedDate"
                      value={formData.assignedDate}
                      onChange={handleChange}
                      className={`${inputClass} pl-9 cursor-pointer`}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <CustomDropdown
                  label="Status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { value: "pending", label: "Pending", icon: Clock },
                    {
                      value: "completed",
                      label: "Completed",
                      icon: CheckCircle,
                    },
                    { value: "rejected", label: "Rejected", icon: XCircle },
                  ]}
                  placeholder="Select Status"
                />
              </div>

              {/* Rejection Reason - Only show when status is rejected */}
              {formData.status === "rejected" && (
                <div>
                  <label className={labelClass}>Rejection Reason *</label>
                  <textarea
                    name="rejectionReason"
                    value={formData.rejectionReason}
                    onChange={handleChange}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                    required
                  />
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                {job ? "Update" : "Schedule"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JobModal;
