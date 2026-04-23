"use client";

import * as React from "react";
import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

type MotionToggleProps = {
  variant?: "floating" | "panel";
};

export function MotionToggle({ variant = "panel" }: MotionToggleProps) {
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

  if (variant === "panel") {
    return (
      <section aria-label="Animation settings">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-brand-text">Animations</p>
          <span className="text-xs text-brand-muted">{reduceMotion ? "Off" : "On"}</span>
        </div>
        <button
          type="button"
          onClick={toggleMotion}
          aria-label={reduceMotion ? "Enable animations" : "Disable animations"}
          aria-pressed={reduceMotion}
          className={`inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
            reduceMotion
              ? "border-brand-border text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
              : "border-brand-accent bg-brand-accent/10 text-brand-accent"
          }`}
        >
          <span>{reduceMotion ? "Enable animations" : "Disable animations"}</span>
          {reduceMotion ? (
            <Play className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Pause className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </section>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleMotion}
      className="fixed bottom-20 right-6 z-50 rounded-full border border-brand-border bg-brand-card p-3 text-brand-muted shadow-lg transition-colors hover:text-brand-accent"
      aria-label={reduceMotion ? "Enable animations" : "Disable animations"}
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
