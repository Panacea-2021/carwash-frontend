"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface BlogPost {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
  image: string;
}

export default function BlogsPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "The Anatomy of a Gated Villa: Layouts That Maximize Ventilation and Light",
      category: "Architecture",
      date: "July 08, 2026",
      author: "Ar. Rajesh Kumar",
      excerpt: "Explore the architectural principles that govern modern villa designs, focusing on cross-ventilation, open-plan spaces, and strategic natural lighting dynamics.",
      content: `In modern luxury residential architecture, layout planning goes far beyond simple room configurations. A truly premium home is built around natural flows of energy, wind, and solar light. 

At Prajwaala Properties, our design philosophy revolves around three core architectural elements:
1. **Strategic Orientation**: Designing villas to align with local wind patterns, facilitating natural cross-ventilation that reduces dependency on artificial cooling.
2. **Open-Plan Geometry**: Merging living, dining, and outdoor terrace spaces to create a continuous fluid space. This not only makes the house look larger but allows sunlight to reach every corner.
3. **Double-Height Ceilings**: Incorporating double-height volumes in main family zones to draw hot air upwards, creating a natural stack effect that keeps the living areas refreshingly cool.

By implementing these structural principles, we ensure that every villa at Prajwaala Ankura remains an acoustic, thermal, and visual sanctuary.`,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Why Ameenpur is Hyderabad’s Next Premium Residential Hub",
      category: "Real Estate Trends",
      date: "June 24, 2026",
      author: "K. Mohan Rayapudi",
      excerpt: "An in-depth look at location advantages, infrastructure growth, and investment returns driving buyers towards the serene landscapes of Ameenpur.",
      content: `For homebuyers looking to balance serene residential living with easy urban connectivity, Ameenpur has emerged as Hyderabad's most promising real estate destination.

Several key factors are driving this massive infrastructure shift:
1. **Connectivity**: Ameenpur's proximity to the Outer Ring Road (ORR) and major highway corridors like NH-65 makes traveling to the financial district (Gachibowli, Hitec City) incredibly fast and stress-free.
2. **Eco-Friendly Surroundings**: Home to the scenic Ameenpur Lake—a designated biodiversity heritage site—the locality offers cleaner air, lower noise pollution, and a cooler microclimate than central urban pockets.
3. **High Return on Investment**: Over the past three years, land values in Ameenpur have shown stable, upward momentum. Investing in a premium plot or villa community here represents both a quality-of-life upgrade and a robust financial legacy.

Prajwaala Ankura is located at the center of this growth story, offering residents the best of community-oriented privacy and proximity.`,
      image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Structural Integrity: The Hidden Foundations of Luxury Homes",
      category: "Construction",
      date: "May 15, 2026",
      author: "Er. S. Srinivasan",
      excerpt: "Delve into the engineering standards behind our projects, from high-grade concrete matrices to seismic-resistant reinforcement layouts.",
      content: `A luxury home's true value isn't just in its premium marble finishes or designer bathroom fittings; it is deeply embedded inside its concrete walls and foundations.

At Prajwaala Properties, we employ strict, zero-compromise construction benchmarks:
1. **Premium Ready-Mix Concrete**: We use high-performance concrete mixes with optimal curing times, ensuring the highest load-bearing capacities and long-term durability.
2. **Heavy-Gauge Reinforcement Steel**: Our columns and beams are reinforced with premium-grade steel structures designed to withstand thermal expansion and contract cycles without micro-cracking.
3. **Waterproofing & Soil Stabilization**: Advanced moisture barriers are applied at the plinth level to prevent capillary water rise, securing the building's paint and plasterwork from dampness for decades.

Investing in a home is a lifetime commitment. That's why we build structures meant to serve as safe, secure legacies for generations.`,
      image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 md:px-16 lg:px-24 font-sans text-black">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center text-center mb-16 max-w-3xl mx-auto">
          <span className="text-amber-600 font-semibold tracking-widest text-xs uppercase mb-3">
            Prajwaala Insights
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-black mb-6 tracking-wide uppercase">
            Blogs & Articles
          </h1>
          <div className="w-16 h-[2px] bg-amber-500 mb-6" />
          <p className="text-black font-light leading-relaxed text-sm sm:text-base md:text-lg">
            Stay updated with modern architectural trends, construction secrets, Hyderabad real estate insights, and lifestyle updates.
          </p>
        </div>

        {/* --- DYNAMIC CONTENT (MODAL POST VIEW VS INDEX LIST) --- */}
        {selectedPost ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-lg p-6 sm:p-10 md:p-14"
          >
            {/* Back Button */}
            <button 
              onClick={() => setSelectedPost(null)}
              className="mb-8 flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
            >
              <span>&larr; Back to Articles</span>
            </button>

            {/* Post Header */}
            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full mb-4">
              {selectedPost.category}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-black leading-tight mb-6">
              {selectedPost.title}
            </h2>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-black mb-8 border-b border-neutral-100 pb-6">
              <div className="flex items-center space-x-1.5">
                <Calendar size={14} className="text-amber-500" />
                <span>{selectedPost.date}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <User size={14} className="text-amber-500" />
                <span>{selectedPost.author}</span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8 border border-neutral-100 shadow-inner">
              <Image 
                src={selectedPost.image} 
                alt={selectedPost.title} 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Content Body */}
            <div className="prose prose-stone max-w-none text-black font-light leading-relaxed text-base sm:text-lg whitespace-pre-line space-y-6">
              {selectedPost.content}
            </div>

            {/* Bottom Footer Quote */}
            <div className="mt-12 p-6 rounded-xl bg-amber-50/50 border-l-4 border-amber-500">
              <p className="font-serif italic text-amber-900 text-sm md:text-base leading-relaxed">
                "Our designs are born from listening to human needs and structural integrity. Every stone we place is a block in a lasting family legacy."
              </p>
              <span className="block text-xs font-bold uppercase tracking-wider text-amber-700 mt-2">
                — Prajwaala Properties Leadership
              </span>
            </div>
          </motion.div>
        ) : (
          /* --- LIST GRID VIEW --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {blogPosts.map((post) => (
              <motion.div 
                key={post.id}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden border-b border-neutral-100">
                  <Image 
                    src={post.image} 
                    alt={post.title} 
                    fill 
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur-sm text-neutral-800 text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                  <div>
                    {/* Meta info */}
                    <div className="flex items-center space-x-4 text-xs text-black mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} className="text-amber-500/80" />
                        <span>{post.date}</span>
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl font-serif font-bold text-black mb-4 line-clamp-2 leading-snug hover:text-amber-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-black font-light text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Read More Trigger */}
                  <button 
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors group mt-auto pt-2"
                  >
                    <span>Read Article</span>
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
