"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  // Motion variants for the main section title
  const headingVariants: Variants = {
    hidden: { opacity: 0, y: -40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: 'easeOut' } 
    }
  };

  // Base configurations for sequential list card item reveals
  const cardVariants = (index: number): Variants => ({
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        delay: index * 0.12 // Stagger card slide-ins line-by-line
      }
    }
  });

  const leftColumnFAQs: FAQItem[] = [
    {
      id: 1,
      question: "1. How long has Prajwaala Properties been in the real estate industry?",
      answer: "Prajwaala Properties has been a trusted name in the real estate industry for over 20+ years, with a proven track record of excellence and customer satisfaction."
    },
    {
      id: 2,
      question: "2. What types of properties does Prajwaala Properties offer?",
      answer: "We offer a diverse range of properties, including individual houses, apartments, gated communities, villas, open plots, lands, and farm lands, catering to various preferences and lifestyles."
    },
    {
      id: 3,
      question: "3. Can I customize the design of my home with Prajwaala Properties?",
      answer: "Yes, we offer customization options to tailor the design of your home to your specific preferences and requirements, ensuring a personalized living space that reflects your style."
    },
    {
      id: 4,
      question: "4. Does Prajwaala Properties provide construction support and material supply?",
      answer: "Yes, we provide comprehensive construction support and high-quality material supply to ensure the successful completion of your project with the utmost attention to quality and efficiency."
    },
    {
      id: 5,
      question: "5. What sets Prajwaala Properties apart from other real estate developers?",
      answer: "Our commitment to best practices, transparency, customer satisfaction, and innovation sets us apart in the industry. We prioritize delivering exceptional value and experiences to our clients."
    }
  ];

  const rightColumnFAQs: FAQItem[] = [
    {
      id: 6,
      question: "6. How can I get started with Prajwaala Properties?",
      answer: "You can get started by exploring our website to learn more about our projects and services. Feel free to contact us for inquiries, site visits, or consultations, and our team will be happy to assist you."
    },
    {
      id: 7,
      question: "7. Are there any ongoing promotions or special offers available?",
      answer: "We periodically offer promotions and special offers on select properties. Please check our website or contact us for the latest updates on promotions and discounts."
    },
    {
      id: 8,
      question: "8. Does Prajwaala Properties provide financing options for homebuyers?",
      answer: "We work with reputable financial institutions to offer financing options and assistance to homebuyers, making the purchasing process more convenient and accessible."
    },
    {
      id: 9,
      question: "9. What is the process for booking a property with Prajwaala Properties?",
      answer: "The booking process typically involves selecting a property, completing necessary documentation, and making the required payments. Our team will guide you through each step to ensure a seamless experience."
    },
    {
      id: 10,
      question: "10. How can I share feedback or testimonials about my experience with Prajwaala Properties?",
      answer: "We value feedback from our clients. You can share your testimonials or provide feedback by contacting our customer support team or filling out the feedback form on our website."
    }
  ];

  return (
    <section 
      className="relative w-full min-h-screen py-14 sm:py-20 px-4 sm:px-6 md:px-16 lg:px-24 bg-cover bg-center bg-scroll md:bg-fixed bg-no-repeat overflow-hidden"
      style={{ 
        backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.82), rgba(17, 17, 17, 0.82)), url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80')` 
      }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Heading with Entrance Animation */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headingVariants}
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-widest uppercase text-white">
            Frequently Asked Questions
          </h2>
          <div className="w-24 h-[2px] bg-[#d39443] mx-auto mt-4 opacity-80"></div>
        </motion.div>

        {/* Two-Column Layout Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 items-start">
          
          {/* Left Column Stack */}
          <div className="space-y-4">
            {leftColumnFAQs.map((item, index) => (
              <motion.div 
                key={item.id} 
                className="bg-white text-[#111111] border border-gray-200 shadow-xl overflow-hidden transition-all duration-300 rounded-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants(index)}
              >
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left font-sans font-semibold text-sm md:text-base tracking-wide transition-colors duration-200 hover:bg-gray-50 text-[#1a1a1a]"
                >
                  <span>{item.question}</span>
                  <svg 
                    className={`w-5 h-5 text-black flex-shrink-0 ml-4 transition-transform duration-300 ${openId === item.id ? 'rotate-180 text-[#d39443]' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Smooth Animated Accordion Drawer */}
                <AnimatePresence initial={false}>
                  {openId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="border-t border-gray-100 font-sans overflow-hidden"
                    >
                      <div className="py-4 px-6">
                        <p className="text-sm md:text-[15px] text-black font-light leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Right Column Stack */}
          <div className="space-y-4">
            {rightColumnFAQs.map((item, index) => (
              <motion.div 
                key={item.id} 
                className="bg-white text-[#111111] border border-gray-200 shadow-xl overflow-hidden transition-all duration-300 rounded-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants(index)}
              >
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left font-sans font-semibold text-sm md:text-base tracking-wide transition-colors duration-200 hover:bg-gray-50 text-[#1a1a1a]"
                >
                  <span>{item.question}</span>
                  <svg 
                    className={`w-5 h-5 text-black flex-shrink-0 ml-4 transition-transform duration-300 ${openId === item.id ? 'rotate-180 text-[#d39443]' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Smooth Animated Accordion Drawer */}
                <AnimatePresence initial={false}>
                  {openId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="border-t border-gray-100 font-sans overflow-hidden"
                    >
                      <div className="py-4 px-6">
                        <p className="text-sm md:text-[15px] text-black font-light leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}