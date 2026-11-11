"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((type: ToastType, message: string) => {
    const safeMessage = typeof message === "string" ? message : String(message);
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message: safeMessage }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-6 py-4 min-w-[300px]",
                "bg-[rgba(255,255,255,0.80)] backdrop-filter-[saturate(180%)_blur(20px)]",
                "border border-[rgba(255,255,255,0.35)] rounded-[16px] shadow-soft",
                "text-text-primary",
                t.type === "success" && "border-l-4 border-l-success",
                t.type === "error" && "border-l-4 border-l-error",
                t.type === "info" && "border-l-4 border-l-accent"
              )}
            >
              {t.type === "success" && <CheckCircle className="w-5 h-5 text-success" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-error" />}
              {t.type === "info" && <Info className="w-5 h-5 text-accent" />}
              <span className="font-semibold letter-spacing-[-0.01em] flex-1">{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                className="hover:bg-[rgba(255,255,255,0.50)] rounded-[8px] p-1 transition-all duration-150"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
