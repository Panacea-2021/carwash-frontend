"use client";

import React from "react";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[80vh] md:h-[85vh] lg:h-[90vh] flex flex-col justify-center bg-black overflow-hidden font-sans">
      
      {/* --- FULL-SCREEN BACKGROUND VIDEO & MASK --- */}
      {/* Fix 1: Apply w-full h-full absolute directly to the video element. 
        Fix 2: Added 'top-0 left-0' to lock the canvas anchor point precisely.
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        /* Fix 3: Added 'object-center' to balance scale distribution. 
          If you don't want any cropping or resolution stretching on ultra-wide screens, 
          you can swap 'object-cover' with 'object-contain' (though it may introduce letterboxing).
        */
        className="absolute top-0 left-0 w-full h-full object-cover object-center opacity-80 z-0 pointer-events-none"
        /* Fix 4: Explicit layout attributes help the browser engine determine rendering resolution */
        width="1920"
        height="1080"
      >
        <source src="/heroVideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

    </section>
  );
}