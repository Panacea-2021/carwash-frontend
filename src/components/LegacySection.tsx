'use client';

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

export default function LegacySection() {
  // Parent container variants configured with the correct 'Variants' type definition
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Delay between each text element's entry
        delayChildren: 0.2,    // Initial wait before text starts animating
      }
    }
  };

  // Individual text item variants configured with the correct 'Variants' type definition
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <section id="legacy-split" className="w-full bg-white overflow-hidden font-sans">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 lg:min-h-[600px]">
        
        {/* Left Side: Image Canvas Frame (~66.6% width) */}
        <motion.div 
          className="relative w-full min-h-[350px] sm:min-h-[450px] lg:min-h-full bg-zinc-100 lg:col-span-8"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <Image
            alt="Prajwaala Properties architectural project legacy background"
            src="/legacy.jpeg"
            fill
            priority
            sizes="(max-w-1024px) 100vw, 66vw"
            className="object-cover"
          />
        </motion.div>

        {/* Right Side: Solid Color Content Container (~33.3% width) */}
        <div className="bg-[#d39443] flex flex-col justify-center px-8 py-16 sm:px-12 md:px-16 lg:px-12 xl:px-16 lg:col-span-4 text-[#111111]">
          
          {/* Animated Wrapper managing text blocks */}
          <motion.div 
            className="w-full"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {/* Minimalist Sub-indicator */}
            <motion.span 
              variants={itemVariants}
              className="text-xs uppercase tracking-[0.3em] font-bold text-black/60 block mb-3"
            >
              Prajwaala Core Values
            </motion.span>
            
            {/* Section Heading */}
            <motion.h2 
              variants={itemVariants}
              className="text-3xl sm:text-4xl font-serif font-bold tracking-wide mb-6 leading-tight text-black"
            >
              Continuing the Legacy
            </motion.h2>
            
            {/* Divider bar */}
            <motion.div 
              variants={itemVariants}
              className="w-16 h-[2px] bg-zinc-900/40 mb-6" 
            />

            {/* Content Body */}
            <motion.p 
              variants={itemVariants}
              className="text-black font-light text-base sm:text-lg leading-relaxed"
            >
              As we celebrate 20+ years of undefeated success, we remain dedicated to our core values of integrity, innovation, and customer satisfaction. Join us in shaping the future of real estate and experience the unmatched excellence of Prajwaala Properties.
            </motion.p>
          </motion.div>

        </div>

      </div>
    </section>
  );
}