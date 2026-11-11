"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  panelClassName?: string;
}

export function Drawer({ isOpen, onClose, title, children, panelClassName }: DrawerProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[100]"
          />
          
          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[101] flex flex-col"
          >
            {/* Glass Panel */}
            <div
              className={cn(
                "h-full bg-[rgba(255,255,255,0.80)] backdrop-filter-[saturate(180%)_blur(20px)] border-l border-[rgba(255,255,255,0.35)] shadow-soft",
                panelClassName
              )}
            >
              <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.35)]">
                <h2 className="text-2xl font-bold letter-spacing-[-0.02em] text-text-primary">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-[10px] bg-[rgba(255,255,255,0.50)] border border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.70)] transition-all duration-150 hover:shadow-shadow-sm"
                >
                  <X className="w-6 h-6 text-text-primary" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-[rgba(255,255,255,0.92)] backdrop-filter-[saturate(180%)_blur(24px)]">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
