import React from "react";
import Image from "next/image";
import { MapPin, Mail, Phone, Building2, ShieldAlert } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#111111] text-neutral-300 font-sans border-t border-neutral-800">
      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8 items-start">
          
          {/* Column 1: Increased Brand Logo Container */}
          <div className="flex flex-col space-y-5">
            {/* Increased max-w to 320px and height to h-32 (128px) for maximum visibility */}
            <div className="relative w-full max-w-[320px] h-32 transition-opacity hover:opacity-90">
              <Image 
                src="/logo.png" 
                alt="Prajwalaa Logo" 
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
              Crafting premium residential spaces with structural excellence and modern architectural layouts.
            </p>
          </div>
          
          {/* Column 2: Promoters Info */}
          <div className="flex flex-col space-y-6 lg:border-l lg:border-neutral-800 lg:pl-8">
            <div>
              <span className="text-xs font-semibold tracking-widest text-amber-500 uppercase block mb-1">
                Promoters
              </span>
              <h2 className="text-xl font-light tracking-wide text-white uppercase">
                Prajwalaa <span className="font-semibold text-amber-400">Properties</span>
              </h2>
            </div>
            
            <ul className="space-y-4 text-sm text-neutral-400">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  2-94, 4th Floor, Above Balaji Santhosh Dhaba,<br />
                  Chanda Nagar, Hyderabad - 500 050.
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-amber-500 shrink-0" />
                <a href="mailto:prajwalaaproperties@gmail.com" className="hover:text-white transition-colors">
                  prajwalaaproperties@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <a href="tel:+919956171666" className="hover:text-white transition-colors">+91 99561 71666</a>
                  <a href="tel:+919956173666" className="hover:text-white transition-colors">+91 99561 73666</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Site Address Info */}
          <div className="flex flex-col space-y-6 lg:border-l lg:border-neutral-800 lg:pl-8">
            <div>
              <span className="text-xs font-semibold tracking-widest text-amber-500 uppercase block mb-1">
                Site Address
              </span>
              <h2 className="text-xl font-light tracking-wide text-white uppercase">
                Prajwalaa <span className="font-semibold text-amber-400">Ankura</span>
              </h2>
            </div>

            <ul className="space-y-4 text-sm text-neutral-400">
              <li className="flex items-start space-x-3">
                <Building2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Chandanagar, Sridevi Theater Road,<br />
                  Krishna Vrindavan colony, Road Nos.3B & 4,<br />
                  Bandamkommu, Ameenpur - 502032.<br />
                  <span className="text-neutral-500 text-xs block mt-1">
                    Green Villas colony, Road No.2, Ameenpur - 502032
                  </span>
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-amber-500 shrink-0" />
                <a href="tel:+919848646622" className="hover:text-white transition-colors font-medium text-white">
                  +91 98486 46622
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Deep Footer Bar */}
      <div className="w-full bg-[#0a0a0a] py-4 px-6 text-center text-xs text-neutral-600">
        <p>&copy; {new Date().getFullYear()} Prajwalaa Properties. All Rights Reserved.</p>
      </div>
    </footer>
  );
}