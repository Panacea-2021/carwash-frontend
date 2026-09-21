"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Navigation map
  const navLinks = [
    { name: "Home", href: "/", hasSub: false },
    { name: "About", href: "/about", hasSub: false },
    { name: "Principles", href: "/principles", hasSub: false },
    { name: "FAQs", href: "/faq", hasSub: false },
    { name: "Blogs", href: "/blogs", hasSub: false },
    { name: "Gallery", href: "/gallery", hasSub: false },
    { name: "Contact Us", href: "/contact", hasSub: false },
  ];

  return (
    <div className="w-full relative z-50 font-sans bg-white">
      
      {/* --- 1. TOP BURNT ORANGE ANNOUNCEMENT BAR --- */}
      <div className="w-full bg-[#a64f17] text-white text-[12px] py-2 px-4 md:px-12 lg:px-20 flex items-center justify-between shadow-sm select-none">
        {/* Left Side: Location Picker */}
        <div className="flex items-center space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity">
          <MapPin size={13} className="fill-transparent stroke-[2]" />
          <span className="font-normal text-[13px]">Select Location</span>
          <ChevronDown size={13} className="opacity-80" />
        </div>

        {/* Right Side: Social Media Handles Bar */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="opacity-90 text-[11px] font-medium tracking-wide">Follow</span>
          <div className="flex items-center space-x-4">
            {/* Facebook */}
            <a href="#" className="hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" className="hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            {/* YouTube */}
            <a href="#" className="hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            {/* Twitter / X */}
            <a href="#" className="hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {/* LinkedIn */}
            <a href="#" className="hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* --- 2. MAIN NAVBAR CONTENT BAR --- */}
      <header className="w-full bg-white border-b border-gray-100 px-4 md:px-12 lg:px-20 py-2.5 flex items-center justify-between shadow-sm">
        
        {/* Left Column: Brand Identity */}
        <Link href="/" className="flex items-center space-x-2 group select-none">
          <div className="relative h-12 w-12 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Prajwalaa Ankura Properties Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="flex flex-col justify-center leading-none pl-1 min-w-0">
            <div className="flex items-baseline space-x-1.5 min-w-0">
              <span className="font-serif text-xl font-bold tracking-tight text-[#a64f17] uppercase truncate">
                Prajwalaa
              </span>
              <span className="text-[13px] font-sans font-bold tracking-wide text-black uppercase shrink-0">
                Ankura
              </span>
            </div>
            <span className="text-[7.5px] font-sans font-semibold tracking-[0.16em] text-black uppercase mt-1">
              Properties
            </span>
          </div>
        </Link>

        {/* Center/Right Desktop Links - CHANGED: Swapped text-[14px] font-medium to text-[15px] font-semibold */}
        <nav className="hidden xl:flex items-center space-x-5 lg:space-x-7 text-[15px] font-semibold text-black">
          {navLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={idx} 
                href={link.href}
                className={`relative group transition-colors flex items-center space-x-0.5 py-1.5 ${isActive ? 'text-[#a64f17]' : 'hover:text-[#a64f17]'}`}
              >
                {/* CHANGED: Swapped font-normal to font-semibold for crisp thickness */}
                <span className="font-semibold">{link.name}</span>
                {/* CHANGED: Increased the indicator bar layout height to h-[2.5px] to match text thickness balance */}
                <span className={`absolute bottom-0 left-0 w-full h-[2.5px] bg-[#d39443] transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                {link.hasSub && <ChevronDown size={14} className="text-black stroke-[2.5]" />}
              </Link>
            );
          })}
        </nav>

        {/* Mobile View Toggle Trigger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="xl:hidden p-1 text-black hover:bg-neutral-50 rounded-md transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* --- 3. MOBILE TARGET EXPANSION DRAWERS - CHANGED: Swapped font-medium to font-semibold --- */}
      {isMobileMenuOpen && (
        <div className="xl:hidden w-full bg-white border-b border-neutral-200 shadow-xl absolute top-full left-0 py-3 px-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 font-semibold text-black">
            {navLinks.map((link, idx) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={idx} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`transition-colors flex items-center justify-between border-b border-neutral-50 pb-2 text-[14px] ${isActive ? 'text-[#a64f17] font-bold' : 'hover:text-[#a64f17]'}`}
                >
                  <span>{link.name}</span>
                  {link.hasSub && <ChevronDown size={14} className="text-black" />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}