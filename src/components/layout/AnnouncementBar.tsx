"use client";

import React from "react";
import { Truck, RotateCcw, ShieldCheck, MapPin, ChevronDown } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="w-full bg-[#050B18] text-[#94A3B8] py-2 px-4 border-b border-white/5">
      <div className="container mx-auto flex flex-col md:flex-row justify-center items-center text-[11px] font-medium tracking-wide gap-6">
        {/* Right: Trust Badges */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
            <ShieldCheck className="w-3.5 h-3.5 text-[#429DFE]" />
            <span>Secure Shopping</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
            <RotateCcw className="w-3.5 h-3.5 text-[#429DFE]" />
            <span>Easy RETURNS</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
            <Truck className="w-3.5 h-3.5 text-[#429DFE]" />
            <span>Trusted Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
