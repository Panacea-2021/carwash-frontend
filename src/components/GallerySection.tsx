"use client";

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

interface GalleryItem {
  id: number;
  imageSrc: string;
  altText: string;
}

export default function GallerySection() {
  const galleryItems: GalleryItem[] = [
    { id: 1, imageSrc: '/gallery1.jpeg', altText: 'Central Court Yard landscape architecture' },
    { id: 2, imageSrc: '/gallery2.jpeg', altText: 'Modern luxury Club House elevation' },
    { id: 3, imageSrc: '/gallery3.jpeg', altText: 'Luxury infinity swimming pool beside residential towers' },
    { id: 4, imageSrc: '/gallery4.jpeg', altText: 'Outdoor basketball court amenity illuminated at dusk' },
    { id: 5, imageSrc: '/gallery5.jpeg', altText: 'Community outdoor fitness station and gym area' },
    { id: 6, imageSrc: '/gallery6.jpeg', altText: 'Fenced outdoor tennis court layout' },
  ];

  // Duplicate the array once to make the infinite loop seamless
  const duplicatedItems = [...galleryItems, ...galleryItems];

  // Entrance variants for the heading text block (slides up smoothly from down)
  const headingVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: 'easeOut' } 
    }
  };

  return (
    <section className="w-full bg-white text-[#111111] py-16 overflow-hidden font-sans">
      <div className="w-full mx-auto">
        
        {/* --- ANIMATED SECTION HEADING --- */}
        <motion.div 
          className="text-center mb-16 px-6 flex flex-col items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headingVariants}
        >
          <span className="text-xs font-bold tracking-[0.25em] text-amber-600 uppercase mb-3">
            Our Amenities
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium tracking-wide text-[#1c1c1c] relative pb-5">
            Project Gallery
          </h2>
          {/* Minimalist Accent Line Divider */}
          <div className="w-12 h-[2px] bg-amber-600/60 rounded-full mt-1"></div>
        </motion.div>

        {/* Injecting the keyframes directly via an HTML style block */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(calc(-50% - 12px)); }
          }
          .pure-css-marquee {
            display: flex;
            gap: 24px;
            animation: marquee 25s linear infinite;
          }
          .pure-css-marquee:hover {
            animation-play-state: paused;
          }
        `}} />

        {/* Outer Loop Container */}
        <div className="relative w-full overflow-hidden flex whitespace-nowrap">
          
          {/* Inner Track running our pure CSS animation */}
          <div className="pure-css-marquee shrink-0 min-w-full">
            {duplicatedItems.map((item, index) => (
              <motion.div 
                key={`${item.id}-${index}`} 
                className="group flex flex-col bg-white border border-gray-200 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden rounded-xl shrink-0 w-[320px] sm:w-[440px] md:w-[520px] cursor-pointer"
                // Interactive micro-interaction for single cards on hover
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Image Frame Container */}
                <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                  <Image
                    src={item.imageSrc}
                    alt={item.altText}
                    fill
                    sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}