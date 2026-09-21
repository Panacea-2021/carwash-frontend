"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function ConsultationWidget() {
  // Animation variants for the floating booking card
  const widgetVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.1 }
    }
  };

  return (
    /* Changed layout shell to sit naturally within standard block flow right beneath the video */
    <div className="w-full bg-white z-30 px-4 md:px-12 lg:px-24 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={widgetVariants}
          className="w-full bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.06)] relative"
        >
          {/* Top Yellow Ribbon Line Indicator */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent"></div>

          {/* Widget Heading */}
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-black tracking-wide">
              Your Journey Starts Here
            </h3>
            <p className="text-black text-xs md:text-sm font-light mt-1">
              Connect with our real estate specialists and book your custom site consultation today.
            </p>
          </div>

          {/* Responsive Multi-Input Grid Matching Image Form Matrix */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              
              {/* Input field: Name */}
              <input 
                type="text" 
                placeholder="Your Name*" 
                required
                className="w-full bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#f59e0b] focus:bg-white transition-colors"
              />

              {/* Input field: Phone */}
              <input 
                type="tel" 
                placeholder="Phone Number*" 
                required
                className="w-full bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#f59e0b] focus:bg-white transition-colors"
              />

              {/* Input field: Email */}
              <input 
                type="email" 
                placeholder="Email Address*" 
                required
                className="w-full bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#f59e0b] focus:bg-white transition-colors"
              />

              {/* Selection Dropdown: Property Categories */}
              <select 
                className="w-full bg-zinc-50 border border-zinc-200 text-black rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#f59e0b] focus:bg-white transition-colors appearance-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled hidden>Select Requirement*</option>
                <option value="plots">Open Plots &amp; Farm Lands</option>
                <option value="gated">Gated Community Villas</option>
                <option value="apartments">Luxury Apartments</option>
                <option value="custom">Custom House Design</option>
              </select>

            </div>

            {/* Premium Theme Action Call Button */}
            <div className="flex justify-center pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full sm:w-auto bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-sans font-bold text-sm uppercase tracking-widest px-10 py-3.5 rounded-lg transition-colors duration-200 shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
              >
                Book Consultation
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}