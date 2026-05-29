"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as BsIcons from "react-icons/bs";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const availableIcons = [
  ...Object.keys(LucideIcons).filter(key => key !== "createLucideIcon" && key !== "default"),
  ...Object.keys(FaIcons),
  ...Object.keys(SiIcons),
  ...Object.keys(BsIcons)
].filter(key => typeof key === "string" && key.length > 2);

const curatedList = [
  "Server", "Cpu", "HardDrive", "MemoryStick", "Monitor", "Keyboard", "Mouse", 
  "Speaker", "Mic", "Fan", "Droplets", "Activity", "Globe", "Cloud",
  "Star", "Heart", "Plane", "Bird", "Gamepad2", "Code", "Leaf", "Car", "Boxes", "Bug",
  "FaGithub", "FaDiscord", "FaTelegramPlane", "FaSteam", "FaTwitter", "FaLinkedin",
  "SiAmd", "SiNvidia", "SiAsus", "FaWindows", "BsDeviceSsd", "FaMemory"
];

export function IconRenderer({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  if (name.startsWith("Fa") && (FaIcons as any)[name]) {
    const Icon = (FaIcons as any)[name];
    return <Icon className={className} />;
  }
  if (name.startsWith("Si") && (SiIcons as any)[name]) {
    const Icon = (SiIcons as any)[name];
    return <Icon className={className} />;
  }
  if (name.startsWith("Bs") && (BsIcons as any)[name]) {
    const Icon = (BsIcons as any)[name];
    return <Icon className={className} />;
  }
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon className={className} /> : <div className={className} />;
}

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = search
    ? availableIcons.filter(i => i.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : curatedList;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-brand-text focus:outline-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full"
      >
        <div className="w-6 h-6 flex items-center justify-center bg-brand-bg rounded-md border border-brand-border">
          <IconRenderer name={value} />
        </div>
        <span className="flex-1 text-left text-sm font-medium">{value || "Select Icon..."}</span>
        <ChevronDown className="w-4 h-4 text-brand-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 mt-2 w-72 bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden p-2"
          >
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-brand-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-accent/50"
              />
            </div>
            <div className="max-h-60 overflow-y-auto grid grid-cols-5 gap-1 p-1">
              {filteredIcons.map(iconName => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${value === iconName ? "bg-brand-accent/20 text-brand-accent" : "text-brand-muted hover:text-brand-text"}`}
                  title={iconName}
                >
                  <IconRenderer name={iconName} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
