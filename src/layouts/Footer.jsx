import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-4 px-4 mt-auto shadow-2xl relative z-10 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Left: Copyright & Brand */}
        <div className="text-center md:text-left">
          <p className="tracking-wide">
            &copy; {currentYear}{" "}
            <span className="text-white font-bold tracking-wider hover:text-indigo-400 transition-colors cursor-default">
              Baba Car Wash
            </span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="uppercase tracking-widest opacity-80">
              All Rights Reserved
            </span>
          </p>
        </div>

        {/* Right: Links & Credits */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Policy Links */}
          <div className="flex gap-4">
            <Link
              to="/privacy-policy"
              className="hover:text-white hover:underline decoration-indigo-500 decoration-2 underline-offset-2 transition-all"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-white hover:underline decoration-indigo-500 decoration-2 underline-offset-2 transition-all"
            >
              Terms of Service
            </Link>
          </div>

          {/* Version & Credit */}
          <div className="flex items-center gap-2 pl-0 sm:pl-6 sm:border-l border-slate-700">
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              v1.0.0
            </span>
            <span className="flex items-center gap-1">
              Made with
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
              by <span className="font-semibold text-slate-300">Admin</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
