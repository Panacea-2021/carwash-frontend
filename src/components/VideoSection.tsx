"use client";

import React, { useState, useRef } from 'react';
import { motion, Variants } from 'framer-motion';

export default function VideoSection() {
  // 1. Setup ref for the video element and state for audio control
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Toggle sound handler
  const toggleSound = () => {
    if (videoRef.current) {
      // Toggle the native DOM element property
      videoRef.current.muted = !videoRef.current.muted;
      // Synchronize React state
      setIsMuted(videoRef.current.muted);
    }
  };

  // Entrance variants for the heading text block (slide from left side)
  const leftHeaderVariants: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: 'easeOut' } 
    }
  };

  // Entrance variants for the descriptor text side (slide from right side)
  const rightDescVariants: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: 'easeOut', delay: 0.1 } 
    }
  };

  // Entry animation for the main video block frame
  const playerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 } 
    }
  };

  return (
    <section className="relative w-full bg-white text-[#111111] py-12 sm:py-16 px-4 sm:px-6 md:px-16 lg:px-24 overflow-hidden font-sans border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Heading Row with Motion Intro */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6 gap-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={leftHeaderVariants}
          >
            <span className="text-[#d39443] text-sm uppercase tracking-[0.25em] font-medium block mb-2">
              Cinematic Tour
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide uppercase text-[#111111]">
              Experience the <span className="font-bold">Grandeur</span>
            </h2>
          </motion.div>
          
          <motion.p 
            className="text-black text-sm max-w-xs font-light leading-relaxed"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={rightDescVariants}
          >
            Take a virtual walkthrough across our expertly engineered living spaces.
          </motion.p>
        </div>

        {/* Video Player Box with Entrance Animation */}
        <motion.div 
          className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-xl group"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={playerVariants}
        >
          
          {/* HTML5 Video Element - Auto Looping (Controlled by React ref) */}
          <video
            ref={videoRef}
            src="/video2.mp4"
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />

          {/* Top Right Audio Control Trigger Toggle */}
          <button
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="absolute top-6 right-6 z-20 flex items-center justify-center p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-black/60 active:scale-95 transition-all duration-200 shadow-md pointer-events-auto"
          >
            {isMuted ? (
              // Muted Icon (Speaker with a slash)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            ) : (
              // Unmuted Icon (Speaker with sound waves)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            )}
          </button>

         
        </motion.div>

      </div>
    </section>
  );
}