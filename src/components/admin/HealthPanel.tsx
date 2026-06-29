"use client";

import { useEffect, useRef, useState } from "react";
import { Database, Radio, Bird, Gamepad2, Activity, Loader2, RefreshCw, Thermometer } from "lucide-react";
import { getAdminToken } from "@/lib/admin-session.client";

const PROBE_INTERVAL_MS = 30 * 60 * 1000;

interface WidgetStatus {
  name: string;
  configured: boolean;
  envKey: string;
}

interface ProbeResult {
  name: string;
  status: "ok" | "error" | "not_configured";
  latencyMs: number | null;
  details: string | null;
  error: string | null;
}

interface HealthData {
  database: {
    status: "ok" | "error" | "not_configured";
    error: string | null;
    latencyMs: number | null;
    sizeBytes: number | null;
  };
  widgets: WidgetStatus[];
  sectionUpdates: { section: string; updated_at: string | null }[];
  probes: ProbeResult[] | null;
  probedAt: string | null;
}

const sectionLabels: Record<string, string> = {
  aboutMe: "About Me",
  lab: "Lab",
  passions: "Passions",
  gear: "Gear",
  contactData: "Contact",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const widgetIcons: Record<string, React.ElementType> = {
  "ADS-B": Radio,
  BirdNET: Bird,
  Steam: Gamepad2,
  "Uptime Kuma": Activity,
  "Home Assistant": Thermometer,
};

export function HealthPanel() {
  const [data, setData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProbing, setIsProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    const token = await getAdminToken();
    if (!token) { setIsLoading(false); return; }

    try {
      const res = await fetch("/api/admin/health", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch health data");
      const json = await res.json();
      setData(json);
      if (json.probedAt) setLastChecked(new Date(json.probedAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const runProbes = async () => {
    setIsProbing(true);
    const token = await getAdminToken();
    if (!token) { setIsProbing(false); return; }

    try {
      const res = await fetch("/api/admin/health?probe=true", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch health data");
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch {
      // silent — keep existing data
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    timerRef.current = setInterval(runProbes, PROBE_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold text-brand-text">System Health</h2>
        <div className="flex items-center gap-2">
          {lastChecked && (
            <span className="text-xs text-brand-muted hidden sm:block">
              Updated {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={runProbes}
            disabled={isProbing || isLoading}
            title="Probe all widgets"
            className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isProbing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        {/* Database card — always a real probe via SELECT 1 */}
        <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-xl border border-brand-border bg-brand-card/50">
          <div
            className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              isProbing
                ? "bg-brand-card/50 text-brand-muted"
                : data.database.status === "ok"
                ? "bg-green-500/10 text-green-400"
                : data.database.status === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {isProbing ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <Database className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-medium text-brand-text truncate">Database</p>
            <p
              className={`text-xs ${
                data.database.status === "ok"
                  ? "text-green-400"
                  : data.database.status === "error"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {data.database.status === "ok"
                ? `Connected · ${data.database.latencyMs}ms`
                : data.database.status === "error"
                ? `Error${data.database.latencyMs !== null ? ` · ${data.database.latencyMs}ms` : ""}`
                : "Not configured"}
            </p>
            {data.database.sizeBytes !== null && !isProbing && (
              <p className="text-xs text-brand-muted mt-0.5">
                {formatBytes(data.database.sizeBytes)}
              </p>
            )}
            {data.database.error && (
              <p className="text-xs text-red-400/60 truncate mt-0.5" title={data.database.error}>
                {data.database.error}
              </p>
            )}
          </div>
        </div>

        {/* Widget cards */}
        {data.widgets.map((widget) => {
          const Icon = widgetIcons[widget.name] || Activity;
          const probe = data.probes?.find((p) => p.name === widget.name);

          const iconBg =
            isProbing
              ? "bg-brand-card/50 text-brand-muted"
              : probe?.status === "ok"
              ? "bg-green-500/10 text-green-400"
              : probe?.status === "error"
              ? "bg-red-500/10 text-red-400"
              : widget.configured
              ? "bg-green-500/10 text-green-400"
              : "bg-zinc-500/10 text-zinc-400";

          const statusText = isProbing
            ? "Checking…"
            : probe?.status === "ok"
            ? `OK · ${probe.latencyMs}ms`
            : probe?.status === "error"
            ? "Unreachable"
            : widget.configured
            ? "Configured"
            : "Not set";

          const statusColor = isProbing
            ? "text-brand-muted"
            : probe?.status === "ok"
            ? "text-green-400"
            : probe?.status === "error"
            ? "text-red-400"
            : widget.configured
            ? "text-green-400"
            : "text-zinc-400";

          return (
            <div
              key={widget.name}
              className="flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-xl border border-brand-border bg-brand-card/50"
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${iconBg}`}>
                {isProbing ? (
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-brand-text truncate">{widget.name}</p>
                <p className={`text-xs transition-colors ${statusColor}`}>{statusText}</p>
                {probe?.details && !isProbing && (
                  <p className="text-xs text-brand-muted truncate mt-0.5" title={probe.details}>
                    {probe.details}
                  </p>
                )}
                {probe?.error && !isProbing && (
                  <p className="text-xs text-red-400/60 truncate mt-0.5" title={probe.error}>
                    {probe.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-xs md:text-sm font-medium text-brand-muted mb-2 md:mb-3">Content Last Updated</h3>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {["aboutMe", "lab", "passions", "gear", "contactData"].map((section) => {
            const update = data.sectionUpdates.find((u) => u.section === section);
            const hasUpdate = !!update?.updated_at;
            return (
              <div
                key={section}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-medium ${
                  hasUpdate
                    ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                <span>{sectionLabels[section] || section}</span>
                {hasUpdate && (
                  <span className="hidden sm:inline ml-2 opacity-70">
                    {new Date(update.updated_at!).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
