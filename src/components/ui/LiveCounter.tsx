"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

interface LiveCounterProps {
  endpoint: string;
  getValue: (data: unknown) => number | string | null;
  getSecondaryValue?: (data: unknown) => number | string | null;
  label: string;
  sublabel?: string;
  secondaryLabel?: string;
  secondaryPrefix?: string;
  /** Optional icon override (defaults to Radio) */
  icon?: React.ReactNode;
  /** Polling interval in ms (default 60s) */
  pollInterval?: number;
}

type Status = "loading" | "live" | "offline" | "not-configured";

export function LiveCounter({
  endpoint,
  getValue,
  getSecondaryValue,
  label,
  sublabel,
  secondaryLabel,
  secondaryPrefix = "up to",
  icon,
  pollInterval = 60_000,
}: LiveCounterProps) {
  const [value, setValue] = useState<number | string | null>(null);
  const [secondaryValue, setSecondaryValue] = useState<number | string | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        if (data?.configured === false) {
          setStatus("not-configured");
          return;
        }

        const v = getValue(data);
        if (v === null || v === undefined) {
          setStatus("offline");
          return;
        }

        setValue(v);
        if (getSecondaryValue) {
          setSecondaryValue(getSecondaryValue(data));
        }
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    load();
    const interval = setInterval(load, pollInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [endpoint, getValue, getSecondaryValue, pollInterval]);

  const statusConfig = {
    loading: { color: "bg-slate-500", ringColor: "bg-slate-500", text: "Loading", textColor: "text-slate-400" },
    live: { color: "bg-emerald-500", ringColor: "bg-emerald-400", text: "Live", textColor: "text-emerald-400" },
    offline: { color: "bg-amber-500", ringColor: "bg-amber-500", text: "Offline", textColor: "text-amber-400" },
    "not-configured": { color: "bg-slate-600", ringColor: "bg-slate-600", text: "Demo", textColor: "text-slate-400" },
  }[status];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 p-5">
      {/* Top row: icon + status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-brand-accent/10 text-brand-accent">
            {icon ?? <Radio className="w-3.5 h-3.5" aria-label="Live data icon" />}
          </div>
          <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-widest">
            Live Data
          </span>
        </div>

        <div className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${statusConfig.textColor}`}>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {status === "live" && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig.ringColor} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.color}`} />
          </span>
          {statusConfig.text}
        </div>
      </div>

      {/* Main counter */}
      <div className="flex flex-col gap-1 pb-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <AnimatePresence mode="wait">
            <motion.span
              key={value ?? "placeholder"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`${typeof value === 'string' ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-white tabular-nums leading-none tracking-tight`}
            >
              {typeof value === 'number' ? value.toLocaleString("en-US") : (value !== null ? value : "—")}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-slate-200 font-medium">{label}</span>
          
          {secondaryValue !== null && secondaryLabel && (
            <>
              <span className="text-sm text-brand-muted font-medium mx-1">{secondaryPrefix}</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={secondaryValue ?? "placeholder2"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className={`${typeof secondaryValue === 'string' ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-white tabular-nums leading-none tracking-tight`}
                >
                  {typeof secondaryValue === 'number' ? secondaryValue.toLocaleString("en-US") : secondaryValue}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm text-slate-200 font-medium">{secondaryLabel}</span>
            </>
          )}
        </div>
        
        {sublabel && (
          <span className="text-xs text-brand-muted mt-1">{sublabel}</span>
        )}
      </div>

      {/* Decorative scanline */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
