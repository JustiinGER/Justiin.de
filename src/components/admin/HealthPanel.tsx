"use client";

import { useEffect, useState } from "react";
import { Database, Radio, Bird, Gamepad2, Activity, Loader2, RefreshCw } from "lucide-react";
import { getAdminToken } from "@/lib/admin-session.client";

interface WidgetStatus {
  name: string;
  configured: boolean;
  envKey: string;
}

interface HealthData {
  database: {
    status: "ok" | "error" | "not_configured";
    error: string | null;
  };
  widgets: WidgetStatus[];
  sectionUpdates: { section: string; updated_at: string | null }[];
}

const sectionLabels: Record<string, string> = {
  aboutMe: "About Me",
  lab: "Lab",
  passions: "Passions",
  gear: "Gear",
  contactData: "Contact",
};

const widgetIcons: Record<string, React.ElementType> = {
  "ADS-B": Radio,
  BirdNET: Bird,
  Steam: Gamepad2,
  "Uptime Kuma": Activity,
};

export function HealthPanel() {
  const [data, setData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/health", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch health data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-text">System Health</h2>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-card/50">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              data.database.status === "ok"
                ? "bg-green-500/10 text-green-400"
                : data.database.status === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text">Database</p>
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
                ? "Connected"
                : data.database.status === "error"
                ? "Error"
                : "Not configured"}
            </p>
          </div>
        </div>

        {data.widgets.map((widget) => {
          const Icon = widgetIcons[widget.name] || Activity;
          return (
            <div
              key={widget.name}
              className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-card/50"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  widget.configured
                    ? "bg-green-500/10 text-green-400"
                    : "bg-zinc-500/10 text-zinc-400"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text">{widget.name}</p>
                <p
                  className={`text-xs ${
                    widget.configured ? "text-green-400" : "text-zinc-400"
                  }`}
                >
                  {widget.configured ? "Configured" : "Not configured"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-medium text-brand-muted mb-3">Content Last Updated</h3>
        <div className="flex flex-wrap gap-2">
          {["aboutMe", "lab", "passions", "gear", "contactData"].map((section) => {
            const update = data.sectionUpdates.find((u) => u.section === section);
            const hasUpdate = !!update?.updated_at;
            return (
              <div
                key={section}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  hasUpdate
                    ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                <span>{sectionLabels[section] || section}</span>
                {hasUpdate && (
                  <span className="ml-2 opacity-70">
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
