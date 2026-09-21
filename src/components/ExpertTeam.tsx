'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

export default function ExpertTeam() {
  const headerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  const leftSideVariants: Variants = {
    hidden: { opacity: 0, x: -60 },
    visible: { 
      opacity: 1, 
      y: 0, // Swapped to Y or X depending on preference, kept your X-axis logic
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' }
    }
  };

  return (
    <section id="property-experts" className="py-16 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-gradient-to-br from-amber-50 via-white to-amber-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <motion.div 
          className="text-center mb-10 sm:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
        >
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-4 sm:mb-6 leading-tight">
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500">Expert Property Team</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-black max-w-2xl mx-auto leading-relaxed">
            Led by Nidumolu Bosu Babu — certified wealth and asset specialist focused on maximizing yield, compliance, and seamless oversight across our residential and commercial portfolios.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="flex flex-col gap-14 sm:gap-16">
          
          {/* Portfolio Director - Mohan Rayapudi */}
          <div id="mohan-rayapudi" className="max-w-6xl mx-auto scroll-mt-28 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center rounded-3xl bg-white shadow-xl border border-amber-100/80 overflow-hidden">
              
              {/* Left Side Content (Image) */}
              {/* REMOVED hardcoded min-h values that clash with portrait aspect ratio */}
              <motion.div 
                className="relative w-full h-full bg-white p-4 lg:p-6 flex items-center justify-center" 
                style={{ aspectRatio: '1080 / 1616' }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={leftSideVariants}
              >
                <Image
                  alt="Mohan Rayapudi, Principal Property Strategist"
                  src="/producer.png"
                  fill
                  priority
                  sizes="(max-w-1024px) 100vw, 50vw"
                  /* CHANGED FROM object-cover TO object-contain TO PREVENT CROPPING */
                  className="object-contain" 
                />
              </motion.div>

              {/* Right Side Content (Text & Info) */}
              <motion.div 
                className="p-6 sm:p-8 lg:p-10 text-left"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0, x: 60 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.7, ease: 'easeOut', delay: 0.5 }
                  }
                }}
              >
                <p className="font-sans text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.35em] text-amber-700/90 uppercase mb-3">
                  Meet The Man Behind The Brand
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1">
                  Nidumolu Bosu Babu
                </h3>
                <p className="font-sans text-base sm:text-lg font-semibold mb-1" style={{ color: '#513500' }}>
                  CPM® (Certified Property Manager)
                </p>
              
                <blockquote className="font-sans text-sm sm:text-base text-black leading-relaxed border-l-4 border-amber-500 pl-4 mb-8 italic">
                  “Optimization protects the asset, but community strategy builds true value. We don&apos;t just manage structures; we preserve and grow the legacy behind every estate.”
                </blockquote>
                <Link 
                  className="inline-flex items-center gap-2 font-sans font-semibold text-amber-700 hover:text-amber-900 transition-colors group" 
                  href="/about"
                >
                  <span>Read More</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </Link>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}