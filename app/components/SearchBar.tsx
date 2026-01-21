"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-xl mx-auto mb-12 group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索作品、作者或角色..."
          suppressHydrationWarning
          className="w-full rounded-full py-4 pl-12 pr-6 transition-all duration-300 backdrop-blur-sm bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/20 focus:bg-white/80 dark:focus:bg-white/10"
        />
      </div>
    </div>
  );
}
