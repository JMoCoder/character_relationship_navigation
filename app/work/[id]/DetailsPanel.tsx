"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User } from "lucide-react";
import { CharacterNodeData } from "@/app/types";

interface DetailsPanelProps {
  data: CharacterNodeData | null;
  onClose: () => void;
  color?: string;
}

export function DetailsPanel({ data, onClose, color = "#fff" }: DetailsPanelProps) {
  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l border-black/10 dark:border-white/10 z-50 p-8 shadow-2xl overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mt-12">
            <div className="relative w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-black/10 dark:border-white/10 shadow-2xl">
              {data.avatar ? (
                <img src={data.avatar} alt={data.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-4xl font-bold text-black/20 dark:text-white/20">
                  {data.label[0]}
                </div>
              )}
            </div>

            <h2 className="text-3xl font-bold text-black dark:text-white text-center mb-2">{data.label}</h2>
            
            {data.role && (
              <div className="flex justify-center mb-8">
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium border bg-opacity-10"
                  style={{ borderColor: color, backgroundColor: color + '20', color: color }}
                >
                  {data.role}
                </span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-black/40 dark:text-white/40 font-bold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> 简介
                </h3>
                <p className="text-black/80 dark:text-white/80 leading-relaxed text-lg">
                  {data.description || "暂无描述"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
