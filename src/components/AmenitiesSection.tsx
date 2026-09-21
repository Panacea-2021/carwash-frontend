"use client";

import React from "react";
import Image from "next/image";

interface Amenity {
  title: string;
  iconSrc: string; 
}

export default function AmenitiesSection() {
  const amenities: Amenity[] = [
    { title: "Grand Lobby", iconSrc: "/grand-lobby.webp" }, 
    { title: "Swimming Pool", iconSrc: "/swimming-pool.webp" },
    { title: "Gym", iconSrc: "/fitness-pockets.webp" },
    { title: "Multipurpose Halls", iconSrc: "/multipurpose-hall.webp" },
    { title: "Yoga/Meditation/Aerobics Halls", iconSrc: "/yoga-lawns.webp" },
    { title: "Guest Rooms", iconSrc: "/guest-rooms.webp" },
    { title: "Indoor Badminton Courts", iconSrc: "/badminton-court.webp" },
    { title: "Indoor Games", iconSrc: "/indoor-games.webp" },
  ];

  const duplicatedAmenities = [...amenities, ...amenities, ...amenities];

  const cacheBustLoader = ({ src }: { src: string }) => {
    return `${src}?v=prajwalaa-2026`;
  };

  return (
    <section className="w-full bg-white py-16 relative overflow-hidden select-none">
      
      {/* --- HIGH-VISIBILITY YELLOW SHADE BACKGROUND BOXES --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Box 1: Solid Light Yellow Accent Box - Top Left */}
        <div className="absolute top-[-5%] left-[8%] w-96 h-80 bg-amber-500/[0.12] border border-[#d5a86a]/40 rounded-[2.5rem] transform -rotate-[12deg]" />
        
        {/* Box 2: Overlapping Medium Box - Center Left */}
        <div className="absolute top-[20%] left-[20%] w-64 h-72 bg-[#d5a86a]/[0.1] border border-[#d5a86a]/30 rounded-[2rem] transform rotate-[15deg]" />

        {/* Box 3: Upper Right Accent Box */}
        <div className="absolute top-[8%] right-[12%] w-72 h-72 bg-gradient-to-br from-yellow-400/[0.12] to-amber-500/[0.06] border border-[#d5a86a]/40 rounded-[2rem] transform -rotate-[8deg]" />
        
        {/* Box 4: Big Core Backdrop Layer - Bottom Center */}
        <div className="absolute bottom-[-10%] left-[35%] w-[32rem] h-80 bg-[#d5a86a]/[0.08] border border-[#d5a86a]/20 rounded-[3.5rem] transform rotate-[20deg]" />

        {/* Box 5: Trailing Accent Box - Bottom Right */}
        <div className="absolute bottom-[5%] right-[4%] w-72 h-64 bg-amber-500/[0.08] border border-[#d5a86a]/30 rounded-[1.75rem] transform rotate-[10deg]" />

        {/* Box 6: Horizontal Accent Band across the middle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-48 bg-[#d5a86a]/[0.03] border-y border-[#d5a86a]/20" />
        
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-24 relative z-10">
        
        {/* --- Section Title --- */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#1a2b49] tracking-wide inline-block relative">
            Amenities
          </h2>
          <div className="w-full border-t border-[#d5a86a] mt-8"></div>
        </div>

        {/* --- Infinite Moving Container --- */}
        <div className="w-full overflow-hidden relative flex">
          
          {/* Subtle fade masks on edges for premium feel */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling Row */}
          <div 
            className="flex space-x-12 py-4 animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused]"
            style={{
              display: 'flex',
              whiteSpace: 'nowrap',
            }}
          >
            {duplicatedAmenities.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center group min-w-[150px] shrink-0"
              >
                {/* Circular Image Container Frame */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-[#d5a86a] bg-white flex items-center justify-center overflow-hidden p-3 sm:p-4 mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105 relative z-20">
                  <div className="relative w-full h-full">
                    <Image
                      loader={cacheBustLoader}
                      src={item.iconSrc}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 80px, 96px"
                      className="object-contain sepia-[0.2] saturate-[1.5] hue-rotate-[8deg] brightness-[0.95]"
                    />
                  </div>
                </div>

                {/* Text Label */}
                <p className="font-serif text-[14px] font-medium text-black leading-snug tracking-wide max-w-[140px] whitespace-normal relative z-20">
                  {item.title}
                </p>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Border Rule */}
        <div className="w-full border-t border-[#d5a86a] mt-12"></div>
      </div>

      {/* --- Global Tailwind CSS Keyframe Injection --- */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </section>
  );
}