"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Info, Calculator, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PriceOption {
  id: string;
  name: string;
  priceText: string;
  unit: string;
  tagline: string;
  features: string[];
  baseCost: number; // for calculator
  recommended?: boolean;
}

export default function PricingPage() {
  const priceOptions: PriceOption[] = [
    {
      id: "plots",
      name: "Open Plots & Farm Lands",
      priceText: "₹18,000",
      unit: "per Sq. Yard",
      tagline: "Secure a future financial legacy in premium developing zones.",
      features: [
        "Clear Title ownership & immediate registration",
        "GP/LP sanctioned project layouts",
        "24/7 security boundary wall fencing",
        "Electricity & systematic water lines connected",
        "Blacktop wide internal road layout grids"
      ],
      baseCost: 18000
    },
    {
      id: "villas",
      name: "Gated Community Villas",
      priceText: "₹1.25 Cr",
      unit: "starting baseline",
      tagline: "Experience absolute high-end lifestyle privacy and elite design.",
      features: [
        "Modern 3 & 4 BHK luxury floor designs",
        "Private landscaped garden & patio decks",
        "Full clubhouse & infinity pool memberships",
        "Seismic-resistant structural shell",
        "Dual source backup power grids"
      ],
      baseCost: 12500000,
      recommended: true
    },
    {
      id: "apartments",
      name: "Luxury Apartments",
      priceText: "₹65 Lakhs",
      unit: "starting baseline",
      tagline: "Perfect blend of contemporary architecture and neighborhood vibes.",
      features: [
        "Spacious cross-ventilated room structures",
        "Double balconies with panoramic exterior vistas",
        "High-performance wellness gym access",
        "Integrated CCTV & intercom safety matrix",
        "Rainwater harvesting & solar light grids"
      ],
      baseCost: 6500000
    },
    {
      id: "custom",
      name: "Custom House Design",
      priceText: "₹4,500",
      unit: "per Sq. Foot (Construction)",
      tagline: "Construct your dream layout under rigorous structural oversight.",
      features: [
        "Bespoke architect floor map blueprints",
        "Heavy-gauge reinforced foundation steel",
        "Premium quality material supplies verified",
        "Continuous site engineer project audits",
        "10-Year structural soundness guarantee"
      ],
      baseCost: 4500
    }
  ];

  // Interactive Calculator State
  const [selectedCalcOption, setSelectedCalcOption] = useState<string>("plots");
  const [areaSize, setAreaSize] = useState<number>(150); // square yards or sq. ft.

  const activeCalcPlan = priceOptions.find(o => o.id === selectedCalcOption) || priceOptions[0];

  const calculateEstimate = () => {
    if (selectedCalcOption === "villas" || selectedCalcOption === "apartments") {
      return activeCalcPlan.baseCost; // fixed start baseline
    }
    return activeCalcPlan.baseCost * areaSize;
  };

  const getAreaLabel = () => {
    if (selectedCalcOption === "plots") return "Plots Area (Sq. Yards)";
    if (selectedCalcOption === "custom") return "Built-up Area (Sq. Feet)";
    return "";
  };

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 md:px-16 lg:px-24 font-sans text-black">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center text-center mb-16 max-w-3xl mx-auto">
          <span className="text-amber-600 font-semibold tracking-widest text-xs uppercase mb-3">
            Pricing Plans
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-black mb-6 tracking-wide uppercase">
            Investment & Cost Estimates
          </h1>
          <div className="w-16 h-[2px] bg-amber-500 mb-6" />
          <p className="text-black font-light leading-relaxed text-sm sm:text-base md:text-lg">
            Compare our structural project scopes and investment plans. Leverage our interactive estimation matrix below to map your dream construction space.
          </p>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-20">
          {priceOptions.map((option) => (
            <motion.div
              key={option.id}
              whileHover={{ y: -8 }}
              className={`relative bg-white rounded-2xl border p-6 sm:p-8 flex flex-col justify-between shadow-sm transition-all duration-300 ${
                option.recommended 
                  ? "border-[#d39443] shadow-[0_15px_30px_rgba(211,148,67,0.06)] ring-1 ring-[#d39443]/40" 
                  : "border-neutral-200"
              }`}
            >
              {option.recommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#d39443] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm flex items-center space-x-1">
                  <Sparkles size={10} />
                  <span>Most Popular</span>
                </span>
              )}

              <div>
                <h3 className="text-lg font-serif font-bold text-black mb-2">
                  {option.name}
                </h3>
                <p className="text-xs text-black font-light leading-relaxed mb-6">
                  {option.tagline}
                </p>

                <div className="flex items-baseline space-x-1.5 mb-6 border-b border-neutral-100 pb-6">
                  <span className="text-3xl font-serif font-bold text-black">
                    {option.priceText}
                  </span>
                  <span className="text-xs text-black font-light lowercase">
                    {option.unit}
                  </span>
                </div>

                <ul className="space-y-3.5 mb-8">
                  {option.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-2.5 text-xs text-black leading-normal">
                      <Check size={14} className="text-[#d39443] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/contact"
                className={`w-full text-center font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-lg transition-colors border ${
                  option.recommended
                    ? "bg-[#d39443] hover:bg-[#c98936] text-white border-transparent"
                    : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200"
                }`}
              >
                Inquire Project
              </Link>
            </motion.div>
          ))}
        </div>

        {/* --- INTERACTIVE ESTIMATOR WIDGET --- */}
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-10 md:p-12 shadow-[0_15px_45px_rgba(0,0,0,0.02)]">
          <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-neutral-100">
            <Calculator className="text-[#d39443] w-6 h-6 shrink-0" />
            <h2 className="text-xl md:text-2xl font-serif font-bold text-black tracking-wide uppercase">
              Project Cost Estimator
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Inputs */}
            <div className="space-y-6">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Select Project Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {priceOptions.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setSelectedCalcOption(o.id);
                        if (o.id === "plots") setAreaSize(150);
                        if (o.id === "custom") setAreaSize(2500);
                      }}
                      className={`text-center py-3.5 px-4 rounded-xl border text-xs font-medium transition-all duration-200 ${
                        selectedCalcOption === o.id
                          ? "border-[#d39443] bg-[#d39443]/[0.03] text-[#d39443] font-semibold"
                          : "border-neutral-200 hover:border-neutral-300 text-black"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider for Variable pricing */}
              {(selectedCalcOption === "plots" || selectedCalcOption === "custom") && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-black">
                      {getAreaLabel()}
                    </label>
                    <span className="text-sm font-semibold text-neutral-800">
                      {areaSize.toLocaleString()} {selectedCalcOption === "plots" ? "Sq. Yards" : "Sq. Ft"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedCalcOption === "plots" ? 100 : 1000}
                    max={selectedCalcOption === "plots" ? 1000 : 8000}
                    step={selectedCalcOption === "plots" ? 10 : 100}
                    value={areaSize}
                    onChange={(e) => setAreaSize(parseInt(e.target.value))}
                    className="w-full accent-[#d39443] bg-neutral-100 cursor-pointer h-1.5 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-black mt-1">
                    <span>Min: {selectedCalcOption === "plots" ? "100" : "1,000"}</span>
                    <span>Max: {selectedCalcOption === "plots" ? "1,000" : "8,000"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Cost Summary */}
            <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-6 flex flex-col justify-between h-full min-h-[220px]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                  Estimated baseline cost
                </span>
                
                <div className="mb-4">
                  <span className="text-3xl md:text-4xl font-serif font-bold text-black">
                    ₹{calculateEstimate().toLocaleString("en-IN")}
                  </span>
                  {activeCalcPlan.unit.includes("per") && (
                    <span className="text-xs text-black font-light block mt-1">
                      Based on {areaSize.toLocaleString()} {selectedCalcOption === "plots" ? "Sq. Yards" : "Sq. Feet"} at {activeCalcPlan.priceText} {activeCalcPlan.unit}
                    </span>
                  )}
                  {(selectedCalcOption === "villas" || selectedCalcOption === "apartments") && (
                    <span className="text-xs text-black font-light block mt-1">
                      Starting baseline construction layout package value
                    </span>
                  )}
                </div>

                <div className="flex items-start space-x-2.5 text-[11px] text-black leading-normal mb-6">
                  <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    *Values are estimated indicators and exclude local registration charges, taxes, and customization add-ons. Connect with us for a final quote.
                  </span>
                </div>
              </div>

              <Link
                href="/contact"
                className="w-full text-center bg-[#d39443] hover:bg-[#c98936] text-white font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors duration-200 shadow-md"
              >
                Inquire & Get Final Quote
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
