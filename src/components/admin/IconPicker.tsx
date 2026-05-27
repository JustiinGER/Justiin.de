"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as BsIcons from "react-icons/bs";
import { Check, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Combined icon map for rendering
const availableIcons = [
  ...Object.keys(LucideIcons).filter(key => key !== "createLucideIcon" && key !== "default"),
  ...Object.keys(FaIcons),
  ...Object.keys(SiIcons),
  ...Object.keys(BsIcons)
].filter(key => typeof key === "string" && key.length > 2); // Exclude weird internals

// To keep the UI fast, we don't render all 5000+ icons at once.
// We just offer a curated list based on what might be useful, plus search.
const curatedList = [
  "Server", "Cpu", "HardDrive", "MemoryStick", "Monitor", "Keyboard", "Mouse", 
  "Speaker", "Mic", "Fan", "Droplets", "Activity", "Globe", "Cloud",
  "Star", "Heart", "Plane", "Bird", "Gamepad2", "Code", "Leaf", "Car", "Boxes", "Bug",
  "FaGithub", "FaDiscord", "FaTelegramPlane", "FaSteam", "FaTwitter", "FaLinkedin",
  "SiAmd", "SiNvidia", "SiAsus", "FaWindows", "BsDeviceSsd", "FaMemory"
];

// Helper to render an icon by string name
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
    ? availableIcons.filter(i => i.toLowerCase().includes(search.toLowerCase())).slice(0, 50) // Max 50 results
    : curatedList;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none hover:bg-slate-800/50 transition-colors w-full"
      >
        <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-md">
          <IconRenderer name={value} />
        </div>
        <span className="flex-1 text-left text-sm font-medium">{value || "Select Icon..."}</span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-2"
          >
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50"
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
                  className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors ${value === iconName ? "bg-brand-accent/20 text-brand-accent" : "text-slate-400 hover:text-white"}`}
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
