"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface Principle {
  id: string;
  title: string;
  description: string;
  features: string[];
}

export default function KeyPrinciples() {
  const principles: Principle[] = [
    {
      id: "01",
      title: "Transparency",
      description: "We believe in transparent communication and operations, providing clear data at every single stage.",
      features: ["Clear communication", "Accurate information", "Step-by-step updates"]
    },
    {
      id: "02",
      title: "Ethical Conduct",
      description: "Integrity is at the core of our business philosophy. We maintain complete trust with partners.",
      features: ["Adhere to standards", "Honest operations", "Stakeholder trust"]
    },
    {
      id: "03",
      title: "Compliance",
      description: "We stay updated with all regulatory frameworks and standards, ensuring complete security.",
      features: ["Regulatory updates", "Industry standards", "Secure transactions"]
    },
    {
      id: "04",
      title: "Continuous Improvement",
      description: "We are dedicated to learning and adopting cutting-edge innovative approaches.",
      features: ["Continuous learning", "Best practices", "Superior results"]
    }
  ];

  // Duplicated to create a seamless infinite loop illusion across the viewport wide tracks
  const duplicatedPrinciples = [...principles, ...principles, ...principles];

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: 'easeOut' } 
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-amber-50/40 via-[#fffdf9] to-white text-[#111111] py-16 md:py-20 overflow-hidden font-sans border-t border-amber-200/50">
      
      {/* --- INTENSIFIED FLOATING YELLOW BACKGROUND CARDS --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-90">
        <motion.div 
          className="absolute w-52 h-52 rounded-2xl border-[3px] border-amber-400/40 bg-amber-400/[0.07]"
          style={{ top: '6%', left: '3%' }}
          animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute w-72 h-44 rounded-3xl border-[3px] border-amber-500/35 bg-amber-400/[0.08]"
          style={{ top: '32%', right: '5%' }}
          animate={{ y: [0, 25, 0], rotate: [-10, -5, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div 
          className="absolute w-60 h-60 rounded-[2.5rem] border-[3px] border-amber-400/30 bg-amber-300/[0.06] rotate-45"
          style={{ bottom: '8%', left: '12%' }}
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Background mesh overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#d3944307_1px,transparent_1px),linear-gradient(to_bottom,#d3944307_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="w-full mx-auto relative z-10">
        
        {/* --- CENTERED TOP HEADING LAYOUT --- */}
        <motion.div 
          className="text-center mb-12 md:mb-16 px-4 flex flex-col items-center max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
        >
          <div className="inline-flex items-center space-x-1.5 bg-[#d39443]/20 text-[#be7c2a] px-4 py-1.5 rounded-full mb-4 font-semibold shadow-sm backdrop-blur-md">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs tracking-wide uppercase">Core Pillars</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight text-[#1c1c1c] leading-tight">
            Key Principles <span className="font-bold text-[#d39443]">We Follow</span>
          </h2>
          
          <p className="text-zinc-700 text-sm md:text-base mt-4 font-normal leading-relaxed max-w-2xl">
            The structural foundational ethics guiding every blueprint, deployment strategy, and customer interaction.
          </p>
        </motion.div>

        {/* --- UNIFIED RIGHT-TO-LEFT MEDIUM SPEED LOOP SYSTEM --- */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes unifiedMarquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(calc(-33.333% - 10.666px)); } /* Aligns perfectly with the grid gaps */
          }
          .global-marquee-track {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            gap: 16px;
            width: max-content;
            animation: unifiedMarquee 20s linear infinite; /* Paced nicely at a uniform medium speed */
          }
          @media (min-width: 768px) {
            @keyframes unifiedMarqueeDesktop {
              0% { transform: translateX(0%); }
              100% { transform: translateX(calc(-33.333% - 21.333px)); }
            }
            .global-marquee-track {
              gap: 32px;
              animation: unifiedMarqueeDesktop 22s linear infinite;
            }
          }
          .global-marquee-track:hover,
          .global-marquee-track:active {
            animation-play-state: paused;
          }
        `}} />

        {/* --- ONE ROW SINGLE MARQUEE VIEWPORT WRAPPER --- */}
        <div className="w-full overflow-hidden py-4 relative flex flex-row flex-nowrap">
          
          <div className="global-marquee-track shrink-0 px-4 md:px-8">
            {duplicatedPrinciples.map((item, index) => {
              const backgroundColors = [
                "bg-white/95 backdrop-blur-md", 
                "bg-[#fffefb]/95 backdrop-blur-md", 
                "bg-white/95 backdrop-blur-md", 
                "bg-[#fafafa]/95 backdrop-blur-md"
              ];
              const cardBg = backgroundColors[index % backgroundColors.length];

              return (
                <motion.div 
                  key={`card-${item.id}-${index}`}
                  // Calculated sizing maintains exactly 3 visible cards on desktop viewports safely
                  className={`w-[280px] md:w-[calc((100vw-64px-64px)/3)] md:max-w-[380px] shrink-0 group relative p-6 md:p-8 ${cardBg} border border-amber-200/60 rounded-2xl flex flex-col justify-between whitespace-normal cursor-pointer shadow-md`}
                  whileHover={{ 
                    y: -6, 
                    borderColor: "rgba(211, 148, 67, 0.7)",
                    boxShadow: "0 25px 55px rgba(211, 148, 67, 0.12)",
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                >
                  <span className="absolute right-6 top-5 font-serif text-2xl md:text-3xl font-bold text-black/30 md:text-black/40 group-hover:text-[#d39443]/40 transition-colors duration-300">
                    {item.id}
                  </span>

                  <div>
                    <h3 className="text-lg md:text-2xl font-serif font-bold text-[#1c1c1c] tracking-wide mb-2 md:mb-3 group-hover:text-[#d39443] transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-zinc-700 text-xs md:text-sm font-light leading-relaxed mb-4 md:mb-6">
                      {item.description}
                    </p>
                  </div>

                  <ul className="space-y-2 md:space-y-2.5 pt-4 border-t border-amber-200/40 mt-auto">
                    {item.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2 text-[11px] md:text-sm text-zinc-800">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#d39443] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Vignette Overlays for Smooth Edge Transitions */}
          <div className="absolute top-0 bottom-0 left-0 w-8 md:w-16 bg-gradient-to-r from-[#fffdf9] via-[#fffdf9]/30 to-transparent pointer-events-none z-20" />
          <div className="absolute top-0 bottom-0 right-0 w-8 md:w-16 bg-gradient-to-l from-[#fffdf9] via-[#fffdf9]/30 to-transparent pointer-events-none z-20" />
        </div>

      </div>
    </section>
  );
}