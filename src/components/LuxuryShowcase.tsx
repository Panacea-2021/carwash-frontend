'use client';

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

interface PromiseItem {
  id: number;
  title: string;
  description: string;
  desktopImg: string;
  mobileImg: string;
}

export default function LuxuryShowcase() {
  const promiseItems: PromiseItem[] = [
    {
      id: 1,
      title: "Grand Lobby",
      description: "A welcoming space designed to make arriving home feel like a special occasion. With its warm, thoughtful lighting, beautiful natural stone underfoot, and a comfortable seating area, it is a peaceful transition zone where you can pause, catch your breath, and always feel completely looked after.",
      desktopImg: "/grand-lobby.jpg",
      mobileImg: "/sites/default/files/2024-04/USP1_Lodha-Bellevue_390X347.jpg",
    },
    {
      id: 2,
      title: "Fitness Center",
      description: "A bright, energetic space created to help you switch off from work and focus on yourself. Fully equipped with modern cardio and strength equipment, this welcoming workout zone offers beautiful views of the outside world to keep you inspired while you move.",
      desktopImg: "/gym.jpg",
      mobileImg: "/sites/default/files/2024-04/USP2_Lodha-Bellevue_390X347.jpg",
    },
    {
      id: 3,
      title: "Swimming Pool",
      description: "A calm, crystal-clear escape right outside your door. Whether you love starting your mornings with quiet, peaceful laps or prefer cooling off with your family as the sun sets, our beautifully designed poolside deck is the perfect spot to unwind and clear your mind.",
      desktopImg: "/gallery2.jpeg",
      mobileImg: "/sites/default/files/2026-03/USP3_Lodha-Bellevue_390X347.jpg",
    },
    {
      id: 4,
      title: "Indoor Games Lounge",
      description: "The social heartbeat of the community. This comfortable, lively room features classic board games and a premium billiards table, offering a friendly space where neighbors naturally come together to share a laugh, compete, and relax.",
      desktopImg: "/indoor-games.jpg",
      mobileImg: "/sites/default/files/2024-04/USP4_Lodha-Bellevue_390X347.jpg",
    },
    {
      id: 5,
      title: "Yoga & Meditation Studio",
      description: "A quiet, sound-insulated sanctuary designed to shut out the noise of the city. Flooded with soft morning light, this open and peaceful room provides a dedicated space for yoga, quiet reflection, and finding your personal balance.",
      desktopImg: "/yoga.jpg",
      mobileImg: "/sites/default/files/2024-04/USP5_Lodha-Bellevue_390X347.jpg",
    },
    {
      id: 6,
      title: "Guest Suites",
      description: "Host your loved ones with total confidence. Our thoughtfully finished guest rooms are built to offer the comfort of a boutique hotel, giving your friends and family their own quiet, private space to rest and feel truly at home.",
      desktopImg: "/guest-rooms.avif",
      mobileImg: "/sites/default/files/2024-04/guest-rooms-thumb.jpg",
    },
    {
      id: 7,
      title: "Multipurpose Hall",
      description: "From cozy family gatherings to major life milestones, this beautiful, high-ceilinged hall is built for sharing moments together. Designed with excellent acoustics and a flexible layout, it easily transforms to fit whatever celebration you are hosting.",
      desktopImg: "/multipurpose-hall.jpg",
      mobileImg: "/sites/default/files/2024-04/multipurpose-hall-thumb.jpg",
    }
  ];

  const cacheBustLoader = ({ src }: { src: string }) => {
    return `${src}?v=prajwalaa-2026`;
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut' } 
    }
  };

  const containerReveal: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5 } 
    }
  };

  const paperUnfurlOverlay: Variants = {
    hidden: { scaleX: 1 },
    visible: { 
      scaleX: 0,
      transition: { 
        duration: 1.1, 
        ease: [0.25, 1, 0.5, 1],
        delay: 0.1 
      } 
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-amber-50/40 via-[#fffdf9] to-white text-[#111111] py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-16 lg:px-24 font-sans overflow-hidden border-t border-amber-200/50">
      
      {/* --- FLOATING BACKGROUND ELEMENTS (9 SHAPES) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-90">
        
        {/* Shape 1 - Top Left */}
        <motion.div 
          className="absolute w-52 h-52 rounded-2xl border-[3px] border-amber-400/40 bg-amber-400/[0.07] shadow-[inset_0_4px_20px_rgba(251,191,36,0.05)]"
          style={{ top: '3%', left: '2%' }}
          animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shape 2 - Upper Center Right */}
        <motion.div 
          className="absolute w-72 h-44 rounded-3xl border-[3px] border-amber-500/35 bg-amber-400/[0.08] shadow-[0_15px_35px_rgba(251,191,36,0.05)]"
          style={{ top: '15%', right: '4%' }}
          animate={{ y: [0, 25, 0], rotate: [-10, -5, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Shape 3 - Mid Left Axis */}
        <motion.div 
          className="absolute w-60 h-60 rounded-[2.5rem] border-[3px] border-amber-400/30 bg-amber-300/[0.06] rotate-45"
          style={{ top: '38%', left: '6%' }}
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Shape 4 - Lower Center Left */}
        <motion.div 
          className="absolute w-48 h-64 rounded-3xl border-[2.5px] border-amber-400/35 bg-amber-400/[0.05]"
          style={{ top: '58%', left: '25%' }}
          animate={{ scale: [1, 1.05, 1], y: [0, 15, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />

        {/* Shape 5 - Mid Center Right */}
        <motion.div 
          className="absolute w-64 h-64 rounded-[2rem] border-[3px] border-amber-300/25 bg-amber-400/[0.06] rotate-12"
          style={{ top: '48%', right: '12%' }}
          animate={{ rotate: [12, 18, 12], y: [-10, 20, -10] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />

        {/* Shape 6 - Lower Right Axis */}
        <motion.div 
          className="absolute w-80 h-48 rounded-2xl border-[3px] border-amber-500/30 bg-amber-400/[0.07]"
          style={{ bottom: '18%', right: '3%' }}
          animate={{ y: [-15, 15, -15], rotate: [0, 4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        {/* Shape 7 - Bottom Left Corner */}
        <motion.div 
          className="absolute w-48 h-48 rounded-xl border-[2.5px] border-amber-400/40 bg-amber-300/[0.08] -rotate-12"
          style={{ bottom: '2%', left: '3%' }}
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Shape 8 - Top Mid-Right Anchor */}
        <motion.div 
          className="absolute w-40 h-40 rounded-2xl border-[3px] border-amber-400/40 bg-amber-400/[0.08] rotate-45"
          style={{ top: '2%', right: '32%' }}
          animate={{ scale: [1, 1.08, 1], x: [0, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shape 9 - Extreme Bottom Center-Right Grid */}
        <motion.div 
          className="absolute w-80 h-36 rounded-[2rem] border-[2.5px] border-amber-400/20 bg-amber-300/[0.04]"
          style={{ bottom: '4%', right: '40%' }}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
      </div>

      {/* Structural linear background grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#d3944307_1px,transparent_1px),linear-gradient(to_bottom,#d3944307_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- SECTION HEADER --- */}
        <motion.div 
          className="flex flex-col items-center text-center mb-14 md:mb-20 max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="inline-flex items-center space-x-1.5 bg-[#d39443]/20 text-[#be7c2a] px-4 py-1.5 rounded-full mb-4 font-semibold shadow-sm backdrop-blur-md">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs tracking-wide uppercase">Designed for Life</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-black mb-4 tracking-wide">
            Spaces to Gather and Grow
          </h1>
          <div className="w-16 h-[2px] bg-amber-500 mb-6" />
          <p className="text-zinc-700 font-light leading-relaxed text-sm sm:text-base md:text-lg">
            Every corner of our community is built around your well-being. Discover inviting layout spaces 
            <br className="hidden md:block" /> designed to help you stay active, rest deeply, and spend meaningful time together.
          </p>
        </motion.div>

        {/* --- FEATURE MATRIX SHOWCASE --- */}
        <div className="flex flex-col gap-16 sm:gap-20 md:gap-28 lg:gap-36">
          {promiseItems.map((item, index) => {
            const isEven = index % 2 === 0;

            return (
              <div 
                key={item.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center"
              >
                {/* Image Block Container */}
                <motion.div 
                  className={`relative w-full aspect-[527/468] h-auto min-h-[240px] sm:min-h-[340px] md:min-h-[400px] rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md border border-amber-200/60 shadow-[0_12px_40px_rgba(211,148,67,0.06)] lg:col-span-6 ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={containerReveal}
                >
                  <Image
                    loader={cacheBustLoader}
                    src={item.desktopImg}
                    alt={item.title}
                    fill
                    sizes="(max-w-640px) 100vw, (max-w-1024px) 80vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority={index < 2}
                  />

                  <motion.div 
                    className="absolute inset-0 bg-[#fffdf9] transform-gpu pointer-events-none"
                    style={{ transformOrigin: 'right center' }}
                    variants={paperUnfurlOverlay}
                  />
                  
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-black/[0.01] to-black/[0.02]" />
                </motion.div>

                {/* Text Content Block */}
                <motion.div 
                  className={`flex flex-col justify-center lg:col-span-6 ${
                    isEven ? 'lg:order-2 lg:pl-4' : 'lg:order-1 lg:pr-4'
                  }`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeInUp}
                >
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-serif font-bold text-black mb-3 sm:mb-6 leading-tight tracking-wide hover:text-[#d39443] transition-colors duration-300">
                    {item.title}
                  </h2>
                  <div className="w-12 h-[2px] bg-amber-500 mb-4 sm:mb-6" />
                  <p className="text-zinc-700 font-light text-sm sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}