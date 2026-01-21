"use client";

import { useState, useEffect } from "react";
import { Work } from "@/app/types";
import { WorkCard } from "./WorkCard";
import { SearchBar } from "./SearchBar";
import { motion } from "framer-motion";

interface HomePageClientProps {
  works: Work[];
}

export function HomePageClient({ works }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredWorks = works.filter((work) =>
    work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Avoid hydration mismatch by rendering a static placeholder or null until mounted
  // For SEO and initial paint, we can render the initial state without animations/dynamic classes if needed,
  // but to be safe and simple, we'll ensure client-side only rendering for interactive parts if they cause issues.
  // However, for this specific mismatch (className differences), it's often due to browser extensions or
  // conditional classes that resolve differently on server/client.
  // Here, we'll stick to a consistent render but ensure mounted check for potentially problematic parts if any.
  
  // The error log shows className mismatch on input and div. 
  // This might be due to how Tailwind/Next.js handles class merging or hydration.
  // We will simplify the structure slightly to reduce potential conflict points.

  return (
    <div className="container mx-auto px-4 py-24 relative z-10">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-black to-black/40 dark:from-white dark:to-white/40"
        >
          人物关系全景
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-black/50 dark:text-white/50 max-w-2xl mx-auto"
        >
          探索错综复杂的角色网络，以全新的维度理解经典作品
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorks.map((work, index) => (
          <WorkCard key={work.id} work={work} index={index} />
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <div className="text-center py-20 text-black/30 dark:text-white/30">
          <p>未找到匹配的作品</p>
        </div>
      )}
      
      {/* Ambient background effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
