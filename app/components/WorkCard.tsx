"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Work } from "@/app/types";
import { useEffect, useState } from "react";

interface WorkCardProps {
  work: Work;
  index: number;
}

export function WorkCard({ work, index }: WorkCardProps) {
  // Use simple classes initially to match server, then enhance on client
  // But here, let's just use standard Tailwind classes that are consistent.
  // The mismatch usually comes from dynamic string interpolation or extension injection.
  // We'll clean up the className string construction.

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/work/${work.id}`} className="block group h-full">
        <div 
          suppressHydrationWarning
          className="relative h-full overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl flex flex-col justify-between bg-white/80 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:shadow-black/5 dark:hover:shadow-white/5 backdrop-blur-md"
        >
          {/* Decorative accent */}
          <div 
            className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: work.coverColor }}
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-full text-black/60 dark:text-white/50 border border-black/5 dark:border-white/10">
                {work.category}
              </span>
              <span className="text-sm font-mono text-black/40 dark:text-white/40">{work.year}</span>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 transition-colors text-black dark:text-white group-hover:text-[var(--hover-color)]" style={{ '--hover-color': work.coverColor } as any}>
              {work.title}
            </h3>
            
            <p className="text-sm leading-relaxed mb-6 line-clamp-3 text-black/70 dark:text-white/60">
              {work.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 dark:border-white/5">
            <span className="text-sm font-medium text-black/80 dark:text-white/80">{work.author}</span>
            <div className="flex items-center text-xs font-bold uppercase tracking-widest opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ color: work.coverColor }}>
              Explore
              <ArrowRight className="ml-1 w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
