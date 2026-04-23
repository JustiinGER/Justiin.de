"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { GlassCard } from "./ui/GlassCard";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { SiAmd, SiNvidia, SiAsus } from "react-icons/si";
import { BsDeviceSsd } from "react-icons/bs";
import { FaWindows, FaMemory } from "react-icons/fa6";
import { HardDrive, Keyboard, Mouse, Speaker, Mic, Monitor, Gamepad2, Droplets, Fan, SlidersHorizontal } from "lucide-react";

export function Gear() {
  const gearItems = [
    {
      id: "cpu",
      title: "Processor (CPU)",
      name: "AMD Ryzen 9 7950X3D",
      desc: "16-Core Processor",
      icon: <SiAmd className="w-8 h-8" />,
      color: "text-[#ED1C24]",
      bgColor: "bg-[#ED1C24]/10",
      className: "col-span-1 md:col-span-6 lg:col-span-4",
    },
    {
      id: "gpu",
      title: "Graphics Card (GPU)",
      name: "NVIDIA GeForce RTX 4090",
      desc: "24GB GDDR6X",
      icon: <SiNvidia className="w-8 h-8" />,
      color: "text-[#76B900]",
      bgColor: "bg-[#76B900]/10",
      className: "col-span-1 md:col-span-6 lg:col-span-4",
    },
    {
      id: "ram",
      title: "Memory (RAM)",
      name: "96.0 GB RAM",
      desc: "DDR5",
      icon: <FaMemory className="w-8 h-8" />,
      color: "text-[#3178C6]",
      bgColor: "bg-[#3178C6]/10",
      className: "col-span-1 md:col-span-6 lg:col-span-4",
    },
    {
      id: "mobo",
      title: "Motherboard",
      name: "ASUS ROG CROSSHAIR X670E EXTREME",
      desc: "E-ATX",
      icon: <SiAsus className="w-8 h-8" />,
      color: "text-[#FF0029]",
      bgColor: "bg-[#FF0029]/10",
      className: "col-span-1 md:col-span-6 lg:col-span-6",
    },
    {
      id: "os",
      title: "Operating System",
      name: "Windows 11 Enterprise",
      desc: "64-Bit",
      icon: <FaWindows className="w-8 h-8" />,
      color: "text-[#0078D4]",
      bgColor: "bg-[#0078D4]/10",
      className: "col-span-1 md:col-span-6 lg:col-span-6",
    },
    {
      id: "cooling_monitors",
      title: "Cooling & Monitors",
      name: "Displays & Custom Loop",
      desc: "Screens and Water Cooling",
      icon: <Fan className="w-8 h-8" />,
      color: "text-[#06B6D4]",
      bgColor: "bg-[#06B6D4]/10",
      className: "col-span-1 md:col-span-12",
      items: [
        { name: "1x LG 27GR95QE-B", size: "27 inch", type: "OLED Gaming Monitor", icon: <Monitor className="w-4 h-4" /> },
        { name: "2x Dell S2722DGM", size: "27 inch", type: "QHD Curved Monitor", icon: <Monitor className="w-4 h-4" /> },
        { name: "CORSAIR XC7 ELITE LCD", size: "Water Block", type: "CPU Cooler", icon: <Droplets className="w-4 h-4" /> },
        { name: "2x Corsair XD5 Elite", size: "Pump/Res", type: "Water Cooling", icon: <Droplets className="w-4 h-4" /> },
        { name: "4x Corsair XR7 480mm", size: "Radiators", type: "Hydro X Series", icon: <Fan className="w-4 h-4" /> },
        { name: "16x Corsair QX RGB", size: "Fans", type: "System Cooling", icon: <Fan className="w-4 h-4" /> },
      ]
    },
    {
      id: "storage",
      title: "Storage (SSDs & HDDs)",
      name: "31 TB Total Storage",
      desc: "High-Speed NVMe & Mass Storage",
      icon: <HardDrive className="w-8 h-8" />,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10",
      className: "col-span-1 md:col-span-12",
      items: [
        { name: "1x Samsung 990 PRO", size: "4 TB", type: "NVMe SSD", icon: <BsDeviceSsd className="w-4 h-4" /> },
        { name: "2x WD Black SN850X", size: "4 TB", type: "NVMe SSD", icon: <BsDeviceSsd className="w-4 h-4" /> },
        { name: "1x WD Black SN850X", size: "1 TB", type: "NVMe SSD", icon: <BsDeviceSsd className="w-4 h-4" /> },
        { name: "1x WD Black SN850", size: "1 TB", type: "NVMe SSD", icon: <BsDeviceSsd className="w-4 h-4" /> },
        { name: "1x Toshiba MG08ACA14TE", size: "14 TB", type: "HDD", icon: <HardDrive className="w-4 h-4" /> },
      ]
    },
    {
      id: "peripherals",
      title: "Peripherals & Audio",
      name: "Setup & Gear",
      desc: "Mouse, Keyboard, Audio & Control",
      icon: <Keyboard className="w-8 h-8" />,
      color: "text-[#A855F7]",
      bgColor: "bg-[#A855F7]/10",
      className: "col-span-1 md:col-span-12",
      items: [
        { name: "CORSAIR K100 RGB", size: "Keyboard", type: "Optical-Mechanical", icon: <Keyboard className="w-4 h-4" /> },
        { name: "Logitech G502 X", size: "Mouse", type: "LIGHTSPEED Wireless", icon: <Mouse className="w-4 h-4" /> },
        { name: "Elgato Stream Deck XL", size: "Control", type: "32 Keys", icon: <Monitor className="w-4 h-4" /> },
        { name: "Tobii Eye Tracker 5", size: "Tracking", type: "Eye & Head Tracking", icon: <Gamepad2 className="w-4 h-4" /> },
        { name: "Elgato Wave DX", size: "Microphone", type: "Dynamic Mic", icon: <Mic className="w-4 h-4" /> },
        { name: "Elgato Wave XLR", size: "Audio Interface", type: "Microphone Preamp", icon: <SlidersHorizontal className="w-4 h-4" /> },
        { name: "Edifier R1280DBs", size: "Speaker", type: "Studio Monitors", icon: <Speaker className="w-4 h-4" /> },
        { name: "Creative Pebble Pro", size: "Speaker", type: "Desktop Audio", icon: <Speaker className="w-4 h-4" /> },
      ]
    },
  ];

  return (
    <section id="gear" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <SectionHeading 
        title="04. Hardware Setup" 
        subtitle="The machines that power my projects and experiments." 
      />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {gearItems.map((item) => (
          <GlassCard 
            key={item.id} 
            variants={fadeUp} 
            className={`${item.className} flex flex-col`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${item.bgColor} ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
                  {item.title}
                </h3>
                <p className="font-semibold text-slate-900 dark:text-white text-lg break-words">
                  {item.name}
                </p>
                <p className="text-sm text-brand-muted">
                  {item.desc}
                </p>
              </div>
            </div>

            {item.items && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.items.map((subItem, idx) => (
                  <div key={idx} className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 bg-black/5 dark:bg-white/5 px-4 py-3 rounded-lg border border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-500 dark:text-slate-400">
                        {subItem.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{subItem.name}</span>
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{subItem.size}</span>
                      <span className="text-xs text-brand-muted">{subItem.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
      </motion.div>
    </section>
  );
}
