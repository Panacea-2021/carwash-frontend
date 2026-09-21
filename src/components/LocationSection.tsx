"use client";

import React from "react";
import { Train, Navigation, Milestone, Route, Plane, Compass } from "lucide-react";

export default function LocationSection() {
  const neighborhoodHighlights = [
    {
      icon: <Train className="w-7 h-7 text-black" />,
      distance: "2.5 Kms",
      title: "Chanda Nagar Railway Station",
    },
    {
      icon: <Navigation className="w-7 h-7 text-black" />,
      distance: "1.2 Kms",
      title: "Sridevi Theater Crossroads",
    },
    {
      icon: <Route className="w-7 h-7 text-black" />,
      distance: "4.0 Kms",
      title: "Miyapur Metro Station",
    },
    {
      icon: <Milestone className="w-7 h-7 text-black" />,
      distance: "6.5 Kms",
      title: "NH-65 (Mumbai Highway)",
    },
    {
      icon: <Plane className="w-7 h-7 text-black" />,
      distance: "42 Kms",
      title: "Rajiv Gandhi International Airport (RGIA)",
    },
  ];

  // Publicly queryable address string for the map iframe
  const mapQuery = encodeURIComponent(
    "Krishna Vrindavan colony, Road Nos.3B & 4, Bandamkommu, Ameenpur, Hyderabad, 502032"
  );

  return (
    <section id="location" className="w-full bg-white py-16 md:py-20 font-sans">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        
        {/* Section Heading */}
        <div className="w-full flex items-center justify-center space-x-4 mb-12">
          <div className="h-[1px] bg-neutral-300 w-12 md:w-20 hidden sm:block"></div>
          <h2 className="text-3xl md:text-4xl font-light tracking-wide text-black text-center">
            Neighbourhood
          </h2>
          <div className="h-[1px] bg-neutral-300 w-12 md:w-20 hidden sm:block"></div>
        </div>

        {/* Map and Floating Panel Wrapper Container */}
        <div className="flex flex-col sm:block sm:relative w-full rounded-lg overflow-hidden border border-neutral-200 shadow-sm bg-neutral-50">
          
          {/* Publicly Embedded Map Canvas (No API Key Required) */}
          <iframe
            className="w-full h-[350px] sm:h-[450px] md:h-[600px] lg:h-[650px] border-none grayscale-[10%] contrast-[102%]"
            title="Prajwalaa Ankura Location Map"
            src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Floating Address Panel Overlay Card */}
          <div className="relative w-full p-6 bg-white border-t border-neutral-100 sm:absolute sm:top-4 sm:left-4 sm:bottom-4 sm:w-[380px] sm:border-t-0 sm:border sm:border-neutral-100 sm:rounded sm:shadow-xl sm:z-10 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header section */}
              <div className="flex items-start justify-between border-b border-neutral-100 pb-4 mb-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-1">
                    Site Address
                  </h3>
                  <p className="text-sm font-medium text-black leading-relaxed">
                    Chandanagar, Sridevi Theater Road,<br />
                    Krishna Vrindavan colony, Road Nos.3B & 4,<br />
                    Bandamkommu, Ameenpur - 502032.
                  </p>
                </div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md shrink-0 ml-4"
                  title="Get Directions"
                >
                  <Compass size={18} />
                </a>
              </div>

              {/* Proximity Distance Highlights Grid */}
              <div className="space-y-6">
                {neighborhoodHighlights.map((item, index) => (
                  <div key={index} className="flex items-center space-x-5 group">
                    <div className="p-1 bg-neutral-50 rounded border border-neutral-100 transition-colors group-hover:bg-neutral-100 shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-black tracking-wide">
                        {item.distance}
                      </span>
                      <span className="text-xs text-black font-medium tracking-wide mt-0.5">
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtle Footer Citation */}
            <div className="text-[10px] text-black font-medium tracking-wide pt-4 mt-6 border-t border-neutral-100">
              Source: *Google Maps Proximity Analytics
            </div>
          </div>

        </div>
        
      </div>
    </section>
  );
}