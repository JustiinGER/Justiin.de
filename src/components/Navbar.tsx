"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Server, Heart, Cpu, MessageSquare } from "lucide-react";

const navItems = [
  { name: "About", href: "#about", icon: <User className="w-4 h-4" aria-hidden="true" /> },
  { name: "Lab", href: "#lab", icon: <Server className="w-4 h-4" aria-hidden="true" /> },
  { name: "Passions", href: "#passions", icon: <Heart className="w-4 h-4" aria-hidden="true" /> },
  { name: "Gear", href: "#gear", icon: <Cpu className="w-4 h-4" aria-hidden="true" /> },
  { name: "Connect", href: "#contact", icon: <MessageSquare className="w-4 h-4" aria-hidden="true" /> },
];

export function Navbar() {
  const [activeSection, setActiveSection] = useState("about");
  const isClickScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrolling.current) {
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          isClickScrolling.current = false;
        }, 100);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isClickScrolling.current) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px",
      }
    );

    navItems.forEach((item) => {
      const element = document.querySelector(item.href);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      isClickScrolling.current = true;
      setActiveSection(href.substring(1));
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      aria-label="Primaer"
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-4 left-1/2 z-50 flex items-center gap-2 p-2 rounded-full bg-brand-card/50 backdrop-blur-md border border-brand-border shadow-sm"
    >
      {navItems.map((item) => {
        const isActive = activeSection === item.href.substring(1);
        return (
          <a
            key={item.name}
            href={item.href}
            aria-label={item.name}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => handleClick(e, item.href)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "text-brand-accent"
                : "text-brand-muted hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full bg-brand-accent/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 hidden sm:block">{item.name}</span>
            <span className="relative z-10 sm:hidden">{item.icon}</span>
          </a>
        );
      })}
    </motion.nav>
  );
}
