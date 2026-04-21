"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  const match = title.match(/^(\d+\.)\s+(.*)$/);

  return (
    <motion.div variants={fadeUp} className="mb-10">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl flex items-baseline gap-3">
        {match ? (
          <>
            <div className="flex flex-col">
              <span className="text-brand-accent font-mono text-xl sm:text-2xl">{match[1]}</span>
              <div className="h-0.5 w-full bg-brand-accent/50 mt-1" />
            </div>
            <span>{match[2]}</span>
          </>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-8 text-brand-muted max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
