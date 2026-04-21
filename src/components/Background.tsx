"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Background() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Pre-calculate random values to avoid React hydration/purity errors
  const [stars] = useState(() => 
    [...Array(30)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.5 + 0.1,
      scale: Math.random() * 0.5 + 0.5,
      animOpacity: Math.random() * 0.8 + 0.2,
      duration: Math.random() * 3 + 2,
    }))
  );

  const [shootingStars] = useState(() => 
    [...Array(4)].map(() => ({
      top: `${Math.random() * 50}%`,
      left: `${50 + Math.random() * 50}%`,
      duration: Math.random() * 1.5 + 1,
      delay: Math.random() * 15 + 5,
    }))
  );

  const [birds] = useState(() => 
    [...Array(10)].map(() => ({
      top: `${10 + Math.random() * 60}%`,
      y1: Math.random() * -150,
      y2: Math.random() * 100,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 15,
      flapDuration: 0.4 + Math.random() * 0.3,
      angle: 90 + (Math.random() * 30 - 15),
    }))
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {isDark ? (
        <>
          {/* Radial Grid */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(circle,#2e3a4d_1px,transparent_1px)] [background-size:28px_28px] opacity-30" 
            aria-hidden="true" 
          />
          {/* Subtle Stars / Galaxies */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            {/* Shooting Stars */}
            {shootingStars.map((star, i) => (
              <motion.div
                key={`shooting-${i}`}
                className="absolute h-[2px] w-[100px] bg-gradient-to-r from-transparent via-white/80 to-white rounded-full"
                style={{
                  top: star.top,
                  left: star.left,
                  rotate: "-45deg",
                }}
                animate={{
                  x: [0, -2000],
                  y: [0, 2000],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: "linear",
                }}
              />
            ))}
            
            {/* Random small stars */}
            {stars.map((star, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: star.top,
                  left: star.left,
                  opacity: star.opacity,
                  scale: star.scale,
                }}
                animate={{
                  opacity: [star.opacity, star.animOpacity, star.opacity],
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </>
      ) : (
        <>
          {/* Nature Light Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8f0e8] via-[#dce8dc] to-[#c3d9c3] opacity-90" />
          
          {/* Animated Birds */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            {birds.map((bird, i) => (
              <motion.svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute text-brand-accent/30 w-10 h-10"
                style={{
                  top: bird.top,
                  left: `-10%`,
                  rotate: bird.angle,
                }}
                animate={{
                  x: ["0vw", "120vw"],
                  y: [0, bird.y1, bird.y2, 0],
                }}
                transition={{
                  duration: bird.duration,
                  repeat: Infinity,
                  delay: bird.delay,
                  ease: "linear",
                }}
              >
                <motion.path 
                  animate={{
                    d: [
                      "M 11 4 Q 12 2 13 4 Q 16 6 22 4 Q 18 10 14 12 L 13 18 L 12 15 L 11 18 L 10 12 Q 6 10 2 4 Q 8 6 11 4 Z", // Wings high
                      "M 11 4 Q 12 2 13 4 Q 16 8 22 12 Q 18 14 14 12 L 13 18 L 12 15 L 11 18 L 10 12 Q 6 14 2 12 Q 8 8 11 4 Z", // Wings mid
                      "M 11 4 Q 12 2 13 4 Q 16 10 22 18 Q 18 16 14 12 L 13 18 L 12 15 L 11 18 L 10 12 Q 6 16 2 18 Q 8 10 11 4 Z", // Wings low
                      "M 11 4 Q 12 2 13 4 Q 16 8 22 12 Q 18 14 14 12 L 13 18 L 12 15 L 11 18 L 10 12 Q 6 14 2 12 Q 8 8 11 4 Z", // Wings mid
                      "M 11 4 Q 12 2 13 4 Q 16 6 22 4 Q 18 10 14 12 L 13 18 L 12 15 L 11 18 L 10 12 Q 6 10 2 4 Q 8 6 11 4 Z", // Wings high
                    ]
                  }}
                  transition={{
                    duration: bird.flapDuration,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.svg>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
