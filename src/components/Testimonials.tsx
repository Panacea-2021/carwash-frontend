'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote: "Working with Prajwaala Properties was a fantastic experience. From start to finish, they were professional, attentive to our needs, and delivered on their promises. Our dream home is a testament to their dedication to quality and excellence.",
      author: "Mr. and Mrs. Kumar",
      role: "Happy Homeowners"
    },
    {
      id: 2,
      quote: "I highly recommend Prajwaala Properties to anyone looking for a reliable and trustworthy real estate partner. Their attention to detail, transparent communication, and commitment to customer satisfaction set them apart in the industry.",
      author: "Ms. Rao",
      role: "Satisfied Customer"
    },
    {
      id: 3,
      quote: "Prajwaala Properties made the entire home buying process smooth and stress-free for us. Their team was knowledgeable, responsive, and guided us every step of the way. We couldn't be happier with our decision to choose them.",
      author: "Mr. and Mrs. Reddy",
      role: "Delighted Homeowners"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000); 
    return () => clearInterval(interval);
  }, [page]);

  const handleNext = () => {
    setPage([page + 1, 1]);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setPage([page - 1, -1]);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    const direct = index > currentIndex ? 1 : -1;
    setPage([page + direct, direct]);
    setCurrentIndex(index);
  };

  const headingVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeInOut' }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeInOut' }
    })
  };

  return (
    /* ADJUSTED: Replaced bg-[#fafafa] with matching amber canvas gradient backdrop */
    <section className="relative w-full bg-gradient-to-b from-amber-50/40 via-[#fffdf9] to-white text-[#111111] py-12 sm:py-16 px-4 sm:px-6 md:px-8 font-sans overflow-hidden border-t border-b border-amber-200/50">
      
      {/* MATCHED LAYER: Intensified Floating Yellow Background Box Accent Cards */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-90">
        
        {/* Shape 1 - Top Left */}
        <motion.div 
          className="absolute w-44 h-44 rounded-2xl border-[3px] border-amber-400/35 bg-amber-400/[0.06]"
          style={{ top: '6%', left: '4%' }}
          animate={{ y: [0, -15, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shape 2 - Top Widescreen Right */}
        <motion.div 
          className="absolute w-56 h-36 rounded-3xl border-[3px] border-amber-500/30 bg-amber-400/[0.07] rotate-12"
          style={{ top: '12%', right: '5%' }}
          animate={{ scale: [1, 1.06, 1], y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />

        {/* Shape 3 - Bottom Left Anchor */}
        <motion.div 
          className="absolute w-52 h-52 rounded-[2rem] border-[3px] border-amber-400/30 bg-amber-300/[0.05] -rotate-12"
          style={{ bottom: '4%', left: '6%' }}
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />

        {/* Shape 4 - Bottom Right Anchor */}
        <motion.div 
          className="absolute w-64 h-40 rounded-2xl border-[3px] border-amber-500/25 bg-amber-400/[0.06]"
          style={{ bottom: '2%', right: '3%' }}
          animate={{ y: [-10, 10, -10], rotate: [0, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </div>

      {/* MATCHED LAYER: Intensified geometric linear grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#d3944307_1px,transparent_1px),linear-gradient(to_bottom,#d3944307_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Section Heading */}
        <motion.div 
          className="text-center mb-12 flex flex-col items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headingVariants}
        >
          {/* Highlight Badge to fully coordinate components */}
          <div className="inline-flex items-center space-x-1.5 bg-[#d39443]/20 text-[#be7c2a] px-4 py-1.5 rounded-full mb-3 font-semibold shadow-sm backdrop-blur-md">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs tracking-wide uppercase">Client Trust</span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-light tracking-wide uppercase text-[#1c1c1c]">
            Voices of <span className="font-bold">Satisfaction</span>
          </h2>
          <div className="w-12 h-[2px] bg-[#d39443]/60 mt-3"></div>
        </motion.div>

        {/* Highlighted Testimonial Box */}
        {/* CHANGED: Made layout box clear and white translucent to sit neatly above background shapes */}
        <div className="relative bg-white/95 backdrop-blur-md border border-amber-100 rounded-2xl p-8 md:p-12 shadow-[0_20px_50px_rgba(211,148,67,0.08)] min-h-[340px] md:min-h-[260px] flex flex-col justify-between overflow-hidden">
          
          {/* Top Decorative Border Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#d39443]/20 via-[#d39443] to-[#d39443]/20 z-20"></div>
          
          {/* Subtle Background Inner Glow Accent */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#d39443]/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Giant Quote Icon */}
          <div className="absolute top-8 left-8 text-7xl font-serif text-[#d39443]/15 select-none pointer-events-none">
            “
          </div>

          {/* Controlled Slider Area */}
          <div className="relative flex-grow flex flex-col justify-between overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex-grow flex flex-col justify-between"
              >
                {/* Quote Text */}
                <div className="pt-6 mb-6">
                  <p className="text-black font-normal italic leading-relaxed text-sm md:text-base">
                    "{testimonials[currentIndex].quote}"
                  </p>
                </div>

                {/* Author Block */}
                <div className="pt-5 border-t border-amber-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-semibold tracking-wide text-[#1c1c1c] hover:text-[#d39443] transition-colors duration-300">
                      {testimonials[currentIndex].author}
                    </h4>
                    <div className="text-[11px] mt-0.5 text-[#d39443] font-semibold uppercase tracking-wider">
                      {testimonials[currentIndex].role}
                    </div>
                  </div>
                  
                  {/* Gold Stars */}
                  <div className="flex gap-0.5 text-[#d39443]">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 md:-left-14 md:-right-14 flex justify-between pointer-events-none z-30">
            <button 
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-amber-100 bg-white shadow-md flex items-center justify-center text-black hover:text-[#d39443] hover:border-[#d39443] transition-all pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Previous testimonial"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-amber-100 bg-white shadow-md flex items-center justify-center text-black hover:text-[#d39443] hover:border-[#d39443] transition-all pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Next testimonial"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>

        {/* Bottom Slide Indicators */}
        <div className="flex justify-center gap-1.5 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${index === currentIndex ? 'w-6 bg-[#d39443]' : 'w-1.5 bg-amber-200/60'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}