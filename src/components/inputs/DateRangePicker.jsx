import React, { useRef } from "react";
import { Calendar, ChevronRight, X, CalendarDays } from "lucide-react";

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const startRef = useRef(null);
  const endRef = useRef(null);

  // Helper: Format date nicely (e.g., "Oct 24, 2025")
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // Check if valid date
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper: Trigger the hidden native picker
  const triggerPicker = (ref) => {
    if (ref.current) {
      try {
        ref.current.showPicker();
      } catch {
        ref.current.focus();
      }
    }
  };

  return (
    <div className="flex items-center gap-0 bg-white border border-slate-300 rounded-xl shadow-sm hover:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-200 overflow-hidden h-[50px] w-full md:w-auto min-w-[320px]">
      {/* --- LEFT: START DATE --- */}
      <div
        className="relative flex-1 flex items-center gap-3 px-4 h-full cursor-pointer hover:bg-slate-50 transition-colors border-r border-slate-100"
        onClick={() => triggerPicker(startRef)}
      >
        <CalendarDays
          className={`w-4 h-4 ${
            startDate ? "text-indigo-600" : "text-slate-400"
          }`}
        />

        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
            Start
          </span>
          <span
            className={`text-sm font-semibold leading-none truncate ${
              startDate ? "text-slate-700" : "text-slate-300"
            }`}
          >
            {formatDate(startDate) || "DD/MM/YYYY"}
          </span>
        </div>

        {/* Hidden Native Input */}
        <input
          ref={startRef}
          type="date"
          value={startDate}
          onChange={(e) => onChange("startDate", e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
      </div>

      {/* --- MIDDLE: ARROW --- */}
      <div className="px-2 text-slate-300 flex items-center justify-center bg-slate-50 h-full">
        <ChevronRight className="w-4 h-4" />
      </div>

      {/* --- RIGHT: END DATE --- */}
      <div
        className="relative flex-1 flex items-center justify-end gap-3 px-4 h-full cursor-pointer hover:bg-slate-50 transition-colors border-l border-slate-100"
        onClick={() => triggerPicker(endRef)}
      >
        <div className="flex flex-col justify-center items-end text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
            End
          </span>
          <span
            className={`text-sm font-semibold leading-none truncate ${
              endDate ? "text-slate-700" : "text-slate-300"
            }`}
          >
            {formatDate(endDate) || "DD/MM/YYYY"}
          </span>
        </div>

        <CalendarDays
          className={`w-4 h-4 ${
            endDate ? "text-indigo-600" : "text-slate-400"
          }`}
        />

        {/* Hidden Native Input */}
        <input
          ref={endRef}
          type="date"
          value={endDate}
          min={startDate} // Prevent picking end date before start date
          onChange={(e) => onChange("endDate", e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
      </div>

      {/* --- CLEAR BUTTON (Shows only when active) --- */}
      {(startDate || endDate) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange("clear");
          }}
          className="h-full px-3 hover:bg-red-50 text-slate-300 hover:text-red-500 border-l border-slate-100 transition-colors flex items-center justify-center z-20"
          title="Clear Dates"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default DateRangePicker;
