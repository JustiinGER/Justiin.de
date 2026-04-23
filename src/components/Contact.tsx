"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contactData } from "@/lib/data";
import { fadeUp } from "@/lib/motion";
import { FaDiscord, FaTelegramPlane, FaSteam, FaGithub } from "react-icons/fa";

const iconMap: Record<string, React.ElementType> = {
  FaDiscord: FaDiscord,
  FaTelegramPlane: FaTelegramPlane,
  FaSteam: FaSteam,
  FaGithub: FaGithub,
};

export function Contact() {
  return (
    <section id="contact" className="py-24 sm:py-32 px-6 lg:px-8 max-w-7xl mx-auto relative">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        <SectionHeading title={contactData.title} subtitle={contactData.subtitle} />

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {contactData.links.map((link) => {
            const Icon = iconMap[link.icon];

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-brand-card/50 border border-brand-border hover:border-brand-accent/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(var(--brand-accent-rgb),0.2)] overflow-hidden"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${link.bgColor}`} />
                
                <div className={`p-4 rounded-2xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${link.bgColor} ${link.color}`}>
                  <Icon className="w-10 h-10" />
                </div>
                
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 relative z-10">
                  {link.name}
                </h3>
              </a>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
