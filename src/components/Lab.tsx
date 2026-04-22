"use client";

import { motion } from "framer-motion";
import { HardDrive, Cpu, Activity, Globe } from "lucide-react";
import { lab } from "@/lib/data";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { GlassCard } from "./ui/GlassCard";
import { SectionHeading } from "./ui/SectionHeading";
import { SpecBadge } from "./ui/SpecBadge";
import { Tooltip } from "./ui/Tooltip";
import { ServerStatus } from "./ui/ServerStatus";

export function Lab() {
  return (
    <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <SectionHeading title={lab.title} subtitle={lab.subtitle} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {lab.servers.map((server, idx) => (
          <GlassCard key={server.id} variants={fadeUp} className="flex flex-col">
            {/* Server Header with status LED */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent">
                  {idx === 0 ? (
                    <HardDrive className="w-6 h-6" aria-label="Storage server icon" />
                  ) : (
                    <Cpu className="w-6 h-6" aria-label="Compute server icon" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight">
                    {server.name}
                  </h3>
                  <p className="text-sm text-brand-muted mt-0.5">{server.role}</p>
                </div>
              </div>

              {/* Status LED */}
              <ServerStatus id={server.id} />
            </div>

            {/* OS Badge */}
            <div className="mb-5">
              <span
                className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded-md border border-black/10 dark:border-white/10 ${server.osBg} ${server.osColor}`}
              >
                <Globe className="w-3 h-3" aria-hidden="true" />
                {server.os}
              </span>
            </div>

            {/* Specs - terminal-style rack mount */}
            <div className="bg-black/5 dark:bg-black/30 rounded-lg border border-black/10 dark:border-white/5 p-4 mb-5 font-mono">
              <div className="flex items-center gap-2 text-[10px] text-brand-muted uppercase tracking-widest mb-3">
                <Activity className="w-3 h-3" aria-hidden="true" />
                <span>Specifications</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {server.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="text-center border border-black/5 dark:border-white/5 rounded-md py-2 bg-white/50 dark:bg-white/[0.02]"
                  >
                    <div className="text-[10px] text-brand-muted uppercase tracking-wider">
                      {spec.label}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Running Services */}
            <div className="mt-auto">
              <h4 className="text-xs font-semibold text-brand-muted mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-accent"></span>
                </span>
                Running Services
              </h4>
              <div className="flex flex-wrap gap-2">
                {server.services.map((service) => {
                  const isObj = typeof service === 'object';
                  const serviceName = isObj ? service.name : service;
                  const tooltip = isObj ? service.tooltip : undefined;
                  
                  const badge = (
                    <SpecBadge key={serviceName} variant="default" className={`${tooltip ? 'cursor-help' : ''}`}>
                      {serviceName}
                    </SpecBadge>
                  );

                  return tooltip ? (
                    <Tooltip key={serviceName} content={tooltip}>
                      {badge}
                    </Tooltip>
                  ) : (
                    badge
                  );
                })}
              </div>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Network Diagram / Connection */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mt-6 p-6 rounded-2xl border border-brand-border bg-brand-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-brand-muted uppercase tracking-widest">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
              </span>
              Network
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-slate-700 dark:text-slate-300">
              <span className="text-brand-accent">10 GbE</span>
              <span className="text-brand-muted hidden sm:inline">|</span>
              <span>LAN + Reverse Proxy</span>
              <span className="text-brand-muted hidden sm:inline">|</span>
              <span className="text-brand-muted">Internal DNS + VPN</span>
            </div>
          </div>
          <div className="font-mono text-xs text-brand-muted">
            3 nodes · 168 GB RAM · 65 TB total storage
          </div>
        </div>
      </motion.div>
    </section>
  );
}
