"use client";

import * as React from "react";
import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

export function MotionToggle() {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const isReduced = localStorage.getItem("motion-reduced") === "true";
    setReduceMotion(isReduced);
    if (isReduced) {
      document.documentElement.classList.add("reduce-motion");
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleMotion = () => {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    if (newValue) {
      localStorage.setItem("motion-reduced", "true");
      document.documentElement.classList.add("reduce-motion");
    } else {
      localStorage.setItem("motion-reduced", "false");
      document.documentElement.classList.remove("reduce-motion");
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleMotion}
      className="fixed bottom-20 right-6 z-50 p-3 rounded-full bg-brand-card border border-brand-border shadow-lg text-brand-muted hover:text-brand-accent transition-colors"
      aria-label={reduceMotion ? "Animationen einschalten" : "Animationen ausschalten"}
      aria-pressed={reduceMotion}
      type="button"
    >
      {reduceMotion ? (
        <Play className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Pause className="w-5 h-5" aria-hidden="true" />
      )}
    </motion.button>
  );
}
