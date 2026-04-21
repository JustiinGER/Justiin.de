"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { SpecBadge } from "./ui/SpecBadge";
import { aboutMe } from "@/lib/data";

const terminalCommands = [
  "docker ps | grep jellyfin",
  "tail -f /var/log/nextcloud.log",
  "ping 1.1.1.1",
  "ssh root@proxmox",
  "htop",
  "docker logs homeassistant",
  "cat /etc/pihole/pihole-FTL.conf",
  "df -h /mnt/storage",
  "systemctl status birdnet-go",
];

export function Hero() {
  const [text, setText] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);
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

  useEffect(() => {
    const commandInterval = setInterval(() => {
      setCommandIndex((prev) => (prev + 1) % terminalCommands.length);
    }, 3000);

    return () => clearInterval(commandInterval);
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

          <motion.div variants={fadeUp} className="flex items-center gap-2 font-mono text-sm sm:text-base text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-sm backdrop-blur-sm overflow-hidden whitespace-nowrap max-w-[90vw] sm:max-w-full">
            <span className="text-brand-accent font-semibold shrink-0">~/justin</span>
            <span className="text-slate-500 shrink-0">$</span>
            <div className="relative flex items-center flex-1 min-w-[120px] sm:min-w-[300px] h-6 overflow-hidden ml-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={commandIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute left-0 text-slate-300 truncate w-full text-left"
                >
                  {terminalCommands[commandIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="animate-pulse w-2 h-4 bg-slate-500 inline-block shrink-0" aria-hidden="true" />
          </motion.div>

          <motion.h1 
            variants={fadeUp}
            className="text-4xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-white min-h-[1.2em]"
          >
            {text}
            <span className="animate-pulse font-light text-brand-accent" aria-hidden="true">|</span>
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="mt-4 text-lg sm:text-2xl leading-relaxed text-slate-300 max-w-3xl font-medium px-2 sm:px-0"
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
