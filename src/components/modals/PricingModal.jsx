import React, { useState, useEffect } from "react";
import { X, Loader2, Building, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { pricingService } from "../../api/pricingService";
import { mallService } from "../../api/mallService";

// Componentsd
import CustomDropdown from "../ui/CustomDropdown";

const DEFAULT_CASH_OUTSIDE_BASE = 21;
const DEFAULT_CASH_TOTAL_BASE = 31;
const DEFAULT_CARD_OUTSIDE_BASE = 21.5;
const DEFAULT_CARD_TOTAL_BASE = 31.5;

const PricingModal = ({ isOpen, onClose, pricing, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [malls, setMalls] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    service_type: "mobile",
    mall: "",
    // Mall pricing method: "onetime" or "wash_types"
    mall_pricing_method: "onetime",
    // Payment control (mall only)
    cash_fixed: true,
    card_fixed: false,
    cash_outside_base: DEFAULT_CASH_OUTSIDE_BASE,
    cash_total_base: DEFAULT_CASH_TOTAL_BASE,
    card_outside_base: DEFAULT_CARD_OUTSIDE_BASE,
    card_total_base: DEFAULT_CARD_TOTAL_BASE,
    // Unified pricing (no sedan/SUV split)
    onetime: "",
    once: "",
    twice: "",
    thrice: "",
    daily: "",
    // Mall Wash Types (unified)
    wash_inside: "",
    wash_outside: "",
    wash_total: "",
  });

  // Load Data
  useEffect(() => {
    if (isOpen) {
      const fetchMalls = async () => {
        try {
          // Fetch generic list of malls
          const res = await mallService.list(1, 1000);
          setMalls(res.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchMalls();

      if (pricing) {
        // Map backend data to flat form state
        // Support both new flat format and legacy sedan/4x4 format
        const sedan = pricing.sedan || {};
        const suv = pricing["4x4"] || {};
        const paymentControl = pricing.payment_control || {};
        const cashFixed =
          paymentControl.cash_fixed ?? pricing.cash_fixed ?? true;
        const cardFixed =
          paymentControl.card_fixed ?? pricing.card_fixed ?? false;
        const cashOutsideBase =
          paymentControl.cash_outside_base ?? DEFAULT_CASH_OUTSIDE_BASE;
        const cashTotalBase =
          paymentControl.cash_total_base ?? DEFAULT_CASH_TOTAL_BASE;
        const cardOutsideBase =
          paymentControl.card_outside_base ?? DEFAULT_CARD_OUTSIDE_BASE;
        const cardTotalBase =
          paymentControl.card_total_base ?? DEFAULT_CARD_TOTAL_BASE;

        // Determine pricing method based on data
        const hasFlatWashTypes =
          pricing.wash_types &&
          (pricing.wash_types.inside || pricing.wash_types.outside);
        const hasSedanWashTypes =
          sedan.wash_types &&
          (sedan.wash_types.inside || sedan.wash_types.outside);
        const mall_pricing_method =
          hasFlatWashTypes || hasSedanWashTypes ? "wash_types" : "onetime";

        // Read from flat structure first, fallback to sedan, then 4x4
        const washTypes =
          pricing.wash_types || sedan.wash_types || suv.wash_types || {};

        setFormData({
          service_type: pricing.service_type || "mobile",
          mall: pricing.mall?._id || pricing.mall || "",
          mall_pricing_method: mall_pricing_method,
          cash_fixed: !!cashFixed,
          card_fixed: !!cardFixed,
          cash_outside_base: cashOutsideBase,
          cash_total_base: cashTotalBase,
          card_outside_base: cardOutsideBase,
          card_total_base: cardTotalBase,

          onetime: pricing.onetime || sedan.onetime || suv.onetime || "",
          once: pricing.once || sedan.once || suv.once || "",
          twice: pricing.twice || sedan.twice || suv.twice || "",
          thrice: pricing.thrice || sedan.thrice || suv.thrice || "",
          daily: pricing.daily || sedan.daily || suv.daily || "",

          // Wash types (unified)
          wash_inside: washTypes.inside || "",
          wash_outside: washTypes.outside || "",
          wash_total: washTypes.total || "",
        });
      } else {
        // Reset Form
        setFormData({
          service_type: "mobile",
          mall: "",
          mall_pricing_method: "onetime",
          cash_fixed: true,
          card_fixed: false,
          cash_outside_base: DEFAULT_CASH_OUTSIDE_BASE,
          cash_total_base: DEFAULT_CASH_TOTAL_BASE,
          card_outside_base: DEFAULT_CARD_OUTSIDE_BASE,
          card_total_base: DEFAULT_CARD_TOTAL_BASE,
          onetime: "",
          once: "",
          twice: "",
          thrice: "",
          daily: "",
          wash_inside: "",
          wash_outside: "",
          wash_total: "",
        });
      }
    }
  }, [isOpen, pricing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    const newFormData = { ...formData, [name]: nextValue };

    // Auto-calculate totals for mall wash types (unified)
    if (
      formData.service_type === "mall" &&
      formData.mall_pricing_method === "wash_types"
    ) {
      if (name === "wash_inside" || name === "wash_outside") {
        const inside =
          name === "wash_inside"
            ? Number(value)
            : Number(newFormData.wash_inside || 0);
        const outside =
          name === "wash_outside"
            ? Number(value)
            : Number(newFormData.wash_outside || 0);
        newFormData.wash_total = inside + outside;
      }
    }

    setFormData(newFormData);
  };

  const toNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Construct Nested Payload
      // Unified pricing payload (no sedan/SUV split)
      const payload = {
        service_type: formData.service_type,
        ...(formData.service_type === "mall" && { mall: formData.mall }),
        ...(formData.service_type === "mall" && {
          payment_control: {
            cash_fixed: !!formData.cash_fixed,
            card_fixed: !!formData.card_fixed,
            cash_outside_base: toNumberOrNull(formData.cash_outside_base),
            cash_total_base: toNumberOrNull(formData.cash_total_base),
            card_outside_base: toNumberOrNull(formData.card_outside_base),
            card_total_base: toNumberOrNull(formData.card_total_base),
          },
        }),

        // Mall wash_types method: flat wash_types
        ...(formData.service_type === "mall" &&
          formData.mall_pricing_method === "wash_types" && {
            wash_types: {
              inside: formData.wash_inside || null,
              outside: formData.wash_outside || null,
              total: formData.wash_total || null,
            },
          }),

        // Mall onetime / Mobile / Residence: flat pricing fields
        ...(!(
          formData.service_type === "mall" &&
          formData.mall_pricing_method === "wash_types"
        ) && {
          onetime: formData.onetime || null,
          ...(formData.service_type === "residence" && {
            once: formData.once || null,
            twice: formData.twice || null,
            thrice: formData.thrice || null,
            daily: formData.daily || null,
          }),
        }),

        // Clear legacy sedan/4x4 fields
        sedan: null,
        "4x4": null,
      };

      if (pricing) {
        await pricingService.update(pricing._id, payload);
        toast.success("Pricing updated");
      } else {
        await pricingService.create(payload);
        toast.success("Pricing created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const sectionLabel =
    "block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 mt-1 border-b border-slate-100 pb-1";
  const labelClass =
    "block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1";
  const inputGroupClass =
    "relative flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all";
  const inputClass =
    "w-full text-sm text-slate-800 outline-none placeholder:text-slate-300 font-bold";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 1. BACKDROP: No Blur = No Lag. Just simple opacity fade. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50" // Simple semi-transparent black
          />

          {/* 2. MODAL: Snappy Spring Animation */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.5,
            }}
            className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800">
                {pricing ? "Update Pricing" : "Add Pricing"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto"
            >
              {/* Service Type & Mall */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Service Type</label>
                  <div className={inputGroupClass}>
                    <Building className="w-4 h-4 text-slate-400 mr-2" />
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      className={`${inputClass} bg-transparent cursor-pointer uppercase`}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="mall">Mall</option>
                      <option value="residence">Residence</option>
                    </select>
                  </div>
                </div>

                {formData.service_type === "mall" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CustomDropdown
                      label="Select Mall"
                      value={formData.mall}
                      onChange={(value) =>
                        handleChange({ target: { name: "mall", value } })
                      }
                      options={malls.map((m) => ({
                        value: m._id,
                        label: m.name,
                      }))}
                      placeholder="-- Select Mall --"
                      icon={ShoppingBag}
                    />
                  </motion.div>
                )}
              </div>

              {/* Mall Pricing Method Selection */}
              {formData.service_type === "mall" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className={labelClass}>Pricing Method</label>
                  <div className="flex gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mall_pricing_method"
                        value="onetime"
                        checked={formData.mall_pricing_method === "onetime"}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Onetime Pricing
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mall_pricing_method"
                        value="wash_types"
                        checked={formData.mall_pricing_method === "wash_types"}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Inside/Outside Pricing
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}

              {formData.service_type === "mall" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4 className={sectionLabel}>Payment Control</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="cash_fixed"
                        checked={!!formData.cash_fixed}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      Cash fixed
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="card_fixed"
                        checked={!!formData.card_fixed}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      Card fixed
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    When fixed, staff cannot edit the amount for that payment
                    mode.
                  </p>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Tip Base Amounts (Outside / Total)
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className={labelClass}>Cash Outside</label>
                        <input
                          type="number"
                          name="cash_outside_base"
                          value={formData.cash_outside_base}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Cash Total</label>
                        <input
                          type="number"
                          name="cash_total_base"
                          value={formData.cash_total_base}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Card Outside</label>
                        <input
                          type="number"
                          name="card_outside_base"
                          value={formData.card_outside_base}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Card Total</label>
                        <input
                          type="number"
                          name="card_total_base"
                          value={formData.card_total_base}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Paid above base becomes tip. Paid below base is rejected
                      when fixed.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Pricing (Unified - no sedan/SUV split) */}
              <div>
                <h4 className={sectionLabel}>Pricing</h4>

                {formData.service_type === "mall" &&
                formData.mall_pricing_method === "wash_types" ? (
                  // Mall: Inside/Outside/Total pricing
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Inside</label>
                      <input
                        type="number"
                        name="wash_inside"
                        value={formData.wash_inside}
                        onChange={handleChange}
                        className={
                          inputGroupClass + " w-full text-sm font-bold"
                        }
                        placeholder="0"
                        list="wash-price-options"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Outside</label>
                      <input
                        type="number"
                        name="wash_outside"
                        value={formData.wash_outside}
                        onChange={handleChange}
                        className={
                          inputGroupClass + " w-full text-sm font-bold"
                        }
                        placeholder="0"
                        list="wash-price-options"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Total (Auto)</label>
                      <input
                        type="number"
                        name="wash_total"
                        value={formData.wash_total || 0}
                        readOnly
                        className={
                          inputGroupClass +
                          " w-full text-sm font-bold bg-slate-100 cursor-not-allowed"
                        }
                        placeholder="0"
                      />
                    </div>
                    <datalist id="wash-price-options">
                      <option value="10" />
                      <option value="20" />
                      <option value="30" />
                      <option value="40" />
                    </datalist>
                  </div>
                ) : formData.service_type === "mall" &&
                  formData.mall_pricing_method === "onetime" ? (
                  // Mall: Onetime pricing only
                  <div className="grid grid-cols-1 gap-3 max-w-xs">
                    <div>
                      <label className={labelClass}>Onetime</label>
                      <input
                        type="number"
                        name="onetime"
                        value={formData.onetime}
                        onChange={handleChange}
                        className={
                          inputGroupClass + " w-full text-sm font-bold"
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  // Residence/Mobile: Show regular pricing fields
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className={labelClass}>Onetime</label>
                      <input
                        type="number"
                        name="onetime"
                        value={formData.onetime}
                        onChange={handleChange}
                        className={
                          inputGroupClass + " w-full text-sm font-bold"
                        }
                        placeholder="0"
                      />
                    </div>

                    {formData.service_type === "residence" && (
                      <>
                        <div>
                          <label className={labelClass}>Once/Wk</label>
                          <input
                            type="number"
                            name="once"
                            value={formData.once}
                            onChange={handleChange}
                            className={
                              inputGroupClass + " w-full text-sm font-bold"
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Twice/Wk</label>
                          <input
                            type="number"
                            name="twice"
                            value={formData.twice}
                            onChange={handleChange}
                            className={
                              inputGroupClass + " w-full text-sm font-bold"
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Thrice/Wk</label>
                          <input
                            type="number"
                            name="thrice"
                            value={formData.thrice}
                            onChange={handleChange}
                            className={
                              inputGroupClass + " w-full text-sm font-bold"
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Daily</label>
                          <input
                            type="number"
                            name="daily"
                            value={formData.daily}
                            onChange={handleChange}
                            className={
                              inputGroupClass + " w-full text-sm font-bold"
                            }
                            placeholder="0"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-[#009ef7] text-white font-bold rounded-lg hover:bg-[#0095e8] transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;
