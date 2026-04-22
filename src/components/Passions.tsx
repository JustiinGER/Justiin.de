"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Server, Plane, Bird, Gamepad2, Code, Leaf, Car, Boxes, Bug, Radar, Mic, Activity } from "lucide-react";
import { passions, type Equipment, type Tag } from "@/lib/data";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { GlassCard } from "./ui/GlassCard";
import { SectionHeading } from "./ui/SectionHeading";
import { SpecBadge } from "./ui/SpecBadge";
import { Tooltip } from "./ui/Tooltip";
import { LiveCounter } from "./ui/LiveCounter";

const iconMap: Record<string, React.ReactNode> = {
  Star: <Star className="w-6 h-6" aria-label="Star Icon" />,
  Server: <Server className="w-6 h-6" aria-label="Server Icon" />,
  Plane: <Plane className="w-6 h-6" aria-label="Plane Icon" />,
  Bird: <Bird className="w-6 h-6" aria-label="Bird Icon" />,
  Gamepad2: <Gamepad2 className="w-6 h-6" aria-label="Gamepad Icon" />,
  Code: <Code className="w-6 h-6" aria-label="Code Icon" />,
  Leaf: <Leaf className="w-6 h-6" aria-label="Leaf Icon" />,
  Car: <Car className="w-6 h-6" aria-label="Car Icon" />,
  Boxes: <Boxes className="w-6 h-6" aria-label="Boxes Icon" />,
  Bug: <Bug className="w-6 h-6" aria-label="Bug Icon" />,
};

export function Passions() {
  const getAdsbValue = useCallback((d: unknown) => {
    const data = d as { aircraft?: number | null };
    return typeof data?.aircraft === "number" ? data.aircraft : null;
  }, []);

  const getAdsbSecondaryValue = useCallback((d: unknown) => {
    const data = d as { maxDistanceKm?: number | null };
    return typeof data?.maxDistanceKm === "number" ? data.maxDistanceKm : null;
  }, []);

  const getBirdsValue = useCallback((d: unknown) => {
    const data = d as { species7d?: number | null };
    return typeof data?.species7d === "number" ? data.species7d : null;
  }, []);

  const getBirdsSecondaryValue = useCallback((d: unknown) => {
    const data = d as { detections7d?: number | null };
    return typeof data?.detections7d === "number" ? data.detections7d : null;
  }, []);

  const getSteamValue = useCallback((d: unknown) => {
    const data = d as { gameName?: string | null };
    return typeof data?.gameName === "string" ? data.gameName : null;
  }, []);

  const getSteamSecondaryValue = useCallback((d: unknown) => {
    const data = d as { playtime2Weeks?: number | null };
    return typeof data?.playtime2Weeks === "number" ? data.playtime2Weeks : null;
  }, []);

  const getUptimeValue = useCallback((d: unknown) => {
    const data = d as { up?: number | null };
    return typeof data?.up === "number" ? data.up : null;
  }, []);

  const getUptimeSecondaryValue = useCallback((d: unknown) => {
    const data = d as { total?: number | null };
    return typeof data?.total === "number" ? data.total : null;
  }, []);

  return (
    <section id="passions" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <SectionHeading 
        title={passions.title} 
        subtitle={passions.subtitle} 
      />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]"
      >
        {passions.items.map((item) => (
          <GlassCard 
            key={item.id} 
            variants={fadeUp} 
            className={`${item.className} flex flex-col`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}>
                {iconMap[item.icon]}
              </div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xl">
                  {item.title}
                </h3>
              </div>
            </div>
            
            <div className="mb-6 flex-grow">
              {item.content.split('\n\n').map((paragraph: string, idx: number) => (
                <p key={idx} className="text-brand-muted leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Live counters for specific items */}
            {item.id === "aviation" && (
              <div className="mb-5">
                <LiveCounter
                  endpoint="/api/adsb"
                  getValue={getAdsbValue}
                  getSecondaryValue={getAdsbSecondaryValue}
                  label="aircraft tracked"
                  secondaryLabel="km max range"
                  sublabel="currently visible to my station"
                  icon={<Radar className="w-3.5 h-3.5" aria-label="Radar icon" />}
                  pollInterval={15_000}
                />
              </div>
            )}
            {item.id === "birdwatching" && (
              <div className="mb-5">
                <LiveCounter
                  endpoint="/api/birds"
                  getValue={getBirdsValue}
                  getSecondaryValue={getBirdsSecondaryValue}
                  label="species"
                  secondaryLabel="calls detected"
                  secondaryPrefix="and"
                  sublabel="over the last 7 days"
                  icon={<Mic className="w-3.5 h-3.5" aria-label="Microphone icon" />}
                  pollInterval={120_000}
                />
              </div>
            )}
            
            {item.id === "gaming" && (
              <div className="mb-5">
                <LiveCounter
                  endpoint="/api/steam"
                  getValue={getSteamValue}
                  getSecondaryValue={getSteamSecondaryValue}
                  label="recently played"
                  secondaryLabel="hours"
                  secondaryPrefix="for"
                  sublabel="via Steam API (last 2 weeks)"
                  icon={<Gamepad2 className="w-3.5 h-3.5" aria-label="Gamepad icon" />}
                  pollInterval={300_000}
                />
              </div>
            )}
            
            {item.id === "self-hosting" && (
              <div className="mb-5">
                <LiveCounter
                  endpoint="/api/uptime"
                  getValue={getUptimeValue}
                  getSecondaryValue={getUptimeSecondaryValue}
                  label="services online"
                  secondaryLabel="monitored"
                  secondaryPrefix="out of"
                  sublabel="via Uptime Kuma public status page"
                  icon={<Activity className="w-3.5 h-3.5" aria-label="Activity icon" />}
                  pollInterval={60_000}
                />
              </div>
            )}
            
            <div className="mt-auto space-y-5">
              {item.equipment && (
                <div>
                  <h4 className="text-xs font-semibold text-brand-muted mb-3 uppercase tracking-wider">Equipment</h4>
                  <div className="flex flex-col gap-2">
                    {item.equipment.map((eq: Equipment) => (
                      <div key={eq.value} className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/5 px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 text-sm w-full">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{eq.label}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{eq.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.tags && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-brand-border">
                  {item.tags.map((tag: string | Tag) => {
                    const isObj = typeof tag === 'object';
                    const tagName = isObj ? tag.name : tag;
                    const tooltip = isObj ? tag.tooltip : undefined;
                    
                    const badge = (
                      <SpecBadge key={tagName} variant="default" className={`${tooltip ? 'cursor-help' : ''}`}>
                        {tagName}
                      </SpecBadge>
                    );

                    return tooltip ? (
                      <Tooltip key={tagName} content={tooltip}>
                        {badge}
                      </Tooltip>
                    ) : (
                      badge
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </motion.div>
    </section>
  );
}
