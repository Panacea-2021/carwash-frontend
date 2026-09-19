import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

/**
 * Reusable Dropdown Component
 * @param {string} label - Label text above dropdown
 * @param {string} value - Current selected value (ID)
 * @param {function} onChange - Callback (value) => {}
 * @param {Array} options - Array of objects { value, label, icon? }
 * @param {string} placeholder - Placeholder text
 * @param {LucideIcon} icon - Icon to show on the left of trigger
 * @param {boolean} searchable - Enable search input inside dropdown
 * @param {string} error - Error message
 * @param {boolean} disabled - Disable interaction
 */
const CustomDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  icon: Icon,
  searchable = false,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Find selected option object based on ID
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log(`📋 Dropdown opened - ${label}:`, {
        totalOptions: options.length,
        filteredOptions: filteredOptions.length,
        searchTerm,
      });
    }
  }, [isOpen, options.length, filteredOptions.length, searchTerm, label]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm(""); // Reset search on close
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none
            ${
              error
                ? "border-red-300 bg-red-50 text-red-900"
                : isOpen
                  ? "border-indigo-500 ring-4 ring-indigo-50 bg-white"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
            }
            ${
              disabled
                ? "opacity-60 cursor-not-allowed bg-slate-100"
                : "cursor-pointer"
            }
          `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Left Icon (Optional) */}
            {Icon && (
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  error ? "text-red-400" : "text-slate-400"
                }`}
              />
            )}

            {/* Selected Value or Placeholder */}
            <span
              className={`block truncate text-sm font-medium ${
                selectedOption ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          {/* Chevron Arrow */}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-indigo-500" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-[9999] mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
            {/* Search Input (If enabled) */}
            {searchable && (
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <ul className="max-h-60 overflow-auto py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      relative cursor-pointer select-none py-2.5 pl-4 pr-10 text-sm transition-colors
                      ${
                        opt.value === value
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Optional Option Icon */}
                      {opt.icon && (
                        <opt.icon className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="block truncate">{opt.label}</span>
                    </div>

                    {/* Checkmark for selected */}
                    {opt.value === value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center">
                  <Search className="w-8 h-8 mb-2 opacity-20" />
                  No options found
                </div>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Error Text */}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default CustomDropdown;
