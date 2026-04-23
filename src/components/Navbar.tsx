"use client";

import { useEffect, useState, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Server, Heart, Cpu, MessageSquare } from "lucide-react";
import { DisplaySettings } from "@/components/DisplaySettings";

const navItems = [
  { name: "About", href: "#about", icon: <User className="w-4 h-4" aria-hidden="true" /> },
  { name: "Lab", href: "#lab", icon: <Server className="w-4 h-4" aria-hidden="true" /> },
  { name: "Passions", href: "#passions", icon: <Heart className="w-4 h-4" aria-hidden="true" /> },
  { name: "Gear", href: "#gear", icon: <Cpu className="w-4 h-4" aria-hidden="true" /> },
  { name: "Connect", href: "#contact", icon: <MessageSquare className="w-4 h-4" aria-hidden="true" /> },
];

export function Navbar() {
  const pathname = usePathname();
  const isPrivacyPage = pathname === "/privacy";

  const [activeSection, setActiveSection] = useState("about");
  const isClickScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPrivacyPage) return;

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
  }, [isPrivacyPage]);

  useEffect(() => {
    if (isPrivacyPage) return;

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
  }, [isPrivacyPage]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      isClickScrolling.current = true;
      setActiveSection(href.substring(1));
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isPrivacyPage) {
    return (
      <motion.nav
        aria-label="Privacy page navigation"
        initial={{ y: -100, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-4 left-1/2 z-50 flex max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full border border-brand-border bg-brand-card/50 p-2 shadow-sm backdrop-blur-md"
      >
        <Link
          href="/"
          aria-label="Back to home"
          className="relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:bg-black/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white max-[340px]:px-2.5 max-[340px]:py-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <DisplaySettings />
      </motion.nav>
    );
  }

  return (
    <motion.nav
      aria-label="Primaer"
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ "--nav-bottom": "4.5rem" } as CSSProperties}
      className="fixed top-4 left-1/2 z-50 flex max-w-[calc(100vw-1rem)] items-center gap-2 overflow-x-auto overflow-y-hidden rounded-full border border-brand-border bg-brand-card/50 p-2 shadow-sm backdrop-blur-md [scrollbar-width:none] [-ms-overflow-style:none] max-[340px]:gap-1.5 max-[340px]:p-1.5 [&::-webkit-scrollbar]:hidden"
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
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors max-[340px]:px-2.5 max-[340px]:py-2 ${
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
      <DisplaySettings />
    </motion.nav>
  );
}
