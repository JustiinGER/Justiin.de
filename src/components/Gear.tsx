"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { GlassCard } from "./ui/GlassCard";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { IconRenderer } from "./admin/IconPicker";

import { gearData } from "@/lib/data";


export function Gear({ data = gearData }: { data?: typeof gearData }) {
  const gearItems = data.items;

  return (
    <section id="gear" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <SectionHeading 
        title="04. Hardware Setup" 
        subtitle="The machines that power my projects and experiments." 
      />

      <motion.div 
        key={data.items.length}
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
              <div className={`p-3 rounded-xl flex items-center justify-center ${item.bgColor || "bg-brand-accent/10"} ${item.color || "text-brand-accent"}`}>
                <IconRenderer name={item.icon} className="w-8 h-8" />
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
                        <IconRenderer name={subItem.icon} className="w-4 h-4" />
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
