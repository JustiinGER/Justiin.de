"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { SpecBadge } from "./ui/SpecBadge";
import { aboutMe } from "@/lib/data";

export function Hero() {
  const [text, setText] = useState("");
  const fullText = "Justin";

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 py-24 sm:py-32 lg:px-8 relative overflow-hidden">
      <div className="mx-auto max-w-5xl">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-8 text-center mb-16"
        >
          <motion.div variants={fadeUp} className="text-sm font-semibold text-brand-accent tracking-widest uppercase mb-4">
            {aboutMe.title}
          </motion.div>

          <motion.h1 
            variants={fadeUp}
            className="text-4xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-slate-900 dark:text-white min-h-[1.2em]"
          >
            {text}
            <span className="animate-pulse font-light text-brand-accent" aria-hidden="true">|</span>
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="mt-4 text-lg sm:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 max-w-3xl font-medium px-2 sm:px-0"
          >
            {aboutMe.tagline}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 mt-4">
            {aboutMe.quickFacts.map((fact) => (
              <SpecBadge key={fact} className="text-sm sm:text-base px-4 py-1.5">
                {fact}
              </SpecBadge>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mx-auto space-y-5 sm:space-y-6 text-base sm:text-lg text-brand-muted leading-relaxed bg-brand-card/50 backdrop-blur-md p-5 sm:p-10 rounded-3xl border border-brand-border shadow-sm"
        >
          {aboutMe.bio.map((paragraph, idx) => (
            <motion.p key={idx} variants={fadeUp}>
              {paragraph}
            </motion.p>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
