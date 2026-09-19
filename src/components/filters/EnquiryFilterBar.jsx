import React, { useState, useEffect } from "react";
import { User, Tag, Loader2, RotateCcw, Filter } from "lucide-react";
import toast from "react-hot-toast";

// Components
import RichDateRangePicker from "../inputs/RichDateRangePicker";

// API
import { workerService } from "../../api/workerService";

const EnquiryFilterBar = ({ onFilterApply, loading }) => {
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // --- Fetch All Workers ---
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await workerService.list(1, 1000); // Fetch all
        const workerList = response.data || [];
        setWorkers(workerList);
      } catch (error) {
        console.error("Failed to load workers", error);
        toast.error("Could not load worker list");
      } finally {
        setWorkersLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  // --- Handlers ---
  const handleApply = () => {
    onFilterApply({
      startDate: startDate || null,
      endDate: endDate || null,
      worker: selectedWorker || null,
      status: selectedStatus || null,
    });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setSelectedWorker("");
    setSelectedStatus("");
    onFilterApply({});
  };

  // Handle date range change from RichDateRangePicker
  const handleDateChange = (field, value) => {
    if (field === "startDate") {
      setStartDate(value);
    } else if (field === "endDate") {
      setEndDate(value);
    }
  };

  // --- CSS Class Constants ---
  const containerClass =
    "p-5 rounded-2xl border shadow-sm mb-6 transition-all hover:shadow-md";
  const headerClass = "flex items-center gap-2 mb-5 pb-3 border-b";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-widest mb-1.5 ml-1";

  // Advanced Input Wrapper with CSS variables
  const inputWrapperClass =
    "group relative flex items-center border rounded-xl px-3 py-2.5 transition-all duration-200 hover:border-opacity-70 focus-within:ring-4 focus-within:ring-opacity-10 cursor-pointer";

  return (
    <div
      className={containerClass}
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Header Section */}
      <div
        className={headerClass}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="p-1.5 rounded-lg"
          style={{
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
          }}
        >
          <Filter className="w-4 h-4" />
        </div>
        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--color-text-main)" }}
          >
            Filter Enquiries
          </h3>
          <p
            className="text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            Refine your search results
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
        {/* 1. Date Range - Using RichDateRangePicker */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label
            className={labelClass}
            style={{ color: "var(--color-text-muted)" }}
          >
            Date Range
          </label>
          <RichDateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        </div>

        {/* 2. Worker Select */}
        <div className="min-w-0">
          <label
            className={labelClass}
            style={{ color: "var(--color-text-muted)" }}
          >
            Worker
          </label>
          <div
            className={inputWrapperClass}
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-border)",
            }}
          >
            {workersLoading ? (
              <Loader2
                className="w-4 h-4 animate-spin mr-3"
                style={{ color: "var(--color-primary)" }}
              />
            ) : (
              <User
                className="w-4 h-4 mr-3"
                style={{ color: "var(--color-text-muted)" }}
              />
            )}
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              disabled={workersLoading}
              className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer appearance-none"
              style={{ color: "var(--color-text-main)" }}
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Status Select */}
        <div className="min-w-0">
          <label
            className={labelClass}
            style={{ color: "var(--color-text-muted)" }}
          >
            Status
          </label>
          <div
            className={inputWrapperClass}
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-border)",
            }}
          >
            <Tag
              className="w-4 h-4 mr-3"
              style={{ color: "var(--color-text-muted)" }}
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer appearance-none"
              style={{ color: "var(--color-text-main)" }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 h-[46px] rounded-xl border font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-sub)",
            }}
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 px-6 py-2.5 h-[46px] rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-text-inverse)",
            }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryFilterBar;
