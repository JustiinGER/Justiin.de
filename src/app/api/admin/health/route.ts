import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { getPool, isDbConfigured } from "@/lib/db.server";
import { getSectionUpdateTimes } from "@/lib/content.server";

interface WidgetStatus {
  name: string;
  configured: boolean;
  envKey: string;
}

export interface ProbeResult {
  name: string;
  status: "ok" | "error" | "not_configured";
  latencyMs: number | null;
  details: string | null;
  error: string | null;
}

async function probeAdsb(): Promise<ProbeResult> {
  const endpoint = process.env.ADSB_ENDPOINT;
  const name = "ADS-B";
  if (!endpoint) return { name, status: "not_configured", latencyMs: null, details: null, error: null };
  const start = Date.now();
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const latencyMs = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = Array.isArray(data.aircraft) ? data.aircraft.length : null;
    return { name, status: "ok", latencyMs, details: count !== null ? `${count} aircraft` : null, error: null };
  } catch (err) {
    return { name, status: "error", latencyMs: Date.now() - start, details: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function probeBirdnet(): Promise<ProbeResult> {
  const baseUrl = process.env.BIRDNET_ENDPOINT;
  const name = "BirdNET";
  if (!baseUrl) return { name, status: "not_configured", latencyMs: null, details: null, error: null };
  const start = Date.now();
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const url = `${baseUrl.replace(/\/$/, "")}/api/v2/analytics/species/summary?start_date=${fmt(weekAgo)}&end_date=${fmt(now)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const latencyMs = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const species = Array.isArray(data) ? data : Array.isArray(data.species) ? data.species : [];
    const detections = species.reduce(
      (sum: number, s: { count?: number; detection_count?: number }) => sum + (s.count ?? s.detection_count ?? 0),
      0
    );
    return { name, status: "ok", latencyMs, details: `${species.length} species, ${detections} detections`, error: null };
  } catch (err) {
    return { name, status: "error", latencyMs: Date.now() - start, details: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function probeSteam(): Promise<ProbeResult> {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;
  const name = "Steam";
  if (!apiKey || !steamId) return { name, status: "not_configured", latencyMs: null, details: null, error: null };
  const start = Date.now();
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const latencyMs = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const games: { name: string }[] = data.response?.games ?? [];
    const details = games.length > 0 ? games[0].name : "No recent games";
    return { name, status: "ok", latencyMs, details, error: null };
  } catch (err) {
    return { name, status: "error", latencyMs: Date.now() - start, details: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function probeUptime(): Promise<ProbeResult> {
  const baseUrl = process.env.UPTIME_KUMA_ENDPOINT;
  const slug = process.env.UPTIME_KUMA_SLUG;
  const name = "Uptime Kuma";
  if (!baseUrl || !slug) return { name, status: "not_configured", latencyMs: null, details: null, error: null };
  const start = Date.now();
  try {
    const cleanBase = baseUrl.replace(/\/$/, "");
    const [configRes, heartbeatRes] = await Promise.all([
      fetch(`${cleanBase}/api/status-page/${slug}`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
      fetch(`${cleanBase}/api/status-page/heartbeat/${slug}`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
    ]);
    const latencyMs = Date.now() - start;
    if (!configRes.ok) throw new Error(`HTTP ${configRes.status}`);
    const configData = await configRes.json();
    const heartbeatData = heartbeatRes.ok ? await heartbeatRes.json() : { heartbeatList: {} };
    const groupList: { monitorList?: { id: string | number }[] }[] = configData.publicGroupList ?? [];
    const heartbeats: Record<string, { status: number }[]> = heartbeatData.heartbeatList ?? {};
    let total = 0;
    let up = 0;
    for (const group of groupList) {
      for (const monitor of group.monitorList ?? []) {
        total++;
        const beats = heartbeats[String(monitor.id)];
        if (Array.isArray(beats) && beats.length > 0 && beats[beats.length - 1].status === 1) up++;
      }
    }
    return { name, status: "ok", latencyMs, details: `${up}/${total} services up`, error: null };
  } catch (err) {
    return { name, status: "error", latencyMs: Date.now() - start, details: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dbStatus: "ok" | "error" | "not_configured" = "not_configured";
  let dbError: string | null = null;
  let dbLatencyMs: number | null = null;
  let dbSizeBytes: number | null = null;

  let pool: import("mysql2/promise").Pool | null = null;

  if (isDbConfigured()) {
    const dbStart = Date.now();
    try {
      pool = getPool();
      await pool.execute("SELECT 1");
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "ok";
      const [rows] = await pool.execute<{ size_bytes: number | null }[] & import("mysql2").RowDataPacket[]>(
        "SELECT SUM(data_length + index_length) AS size_bytes FROM information_schema.tables WHERE table_schema = DATABASE()"
      );
      dbSizeBytes = rows[0]?.size_bytes ?? null;
    } catch (err) {
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "error";
      dbError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  // Load cached probe results from DB
  let cachedProbes: ProbeResult[] | null = null;
  let probedAt: string | null = null;
  if (pool && dbStatus === "ok") {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS health_probe_cache (
          id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
          probed_at DATETIME NOT NULL,
          results JSON NOT NULL
        )
      `);
      const [rows] = await pool.execute<import("mysql2").RowDataPacket[]>(
        "SELECT probed_at, results FROM health_probe_cache WHERE id = 1"
      );
      if (rows.length > 0) {
        cachedProbes = JSON.parse(rows[0].results as string) as ProbeResult[];
        probedAt = (rows[0].probed_at as Date).toISOString();
      }
    } catch {
      // ignore — cache miss is fine
    }
  }

  const widgets: WidgetStatus[] = [
    { name: "ADS-B", configured: !!process.env.ADSB_ENDPOINT, envKey: "ADSB_ENDPOINT" },
    { name: "BirdNET", configured: !!process.env.BIRDNET_ENDPOINT, envKey: "BIRDNET_ENDPOINT" },
    { name: "Steam", configured: !!(process.env.STEAM_API_KEY && process.env.STEAM_ID), envKey: "STEAM_API_KEY + STEAM_ID" },
    { name: "Uptime Kuma", configured: !!(process.env.UPTIME_KUMA_ENDPOINT && process.env.UPTIME_KUMA_SLUG), envKey: "UPTIME_KUMA_ENDPOINT + UPTIME_KUMA_SLUG" },
  ];

  let sectionUpdates: { section: string; updated_at: string | null }[] = [];
  try {
    const times = await getSectionUpdateTimes();
    sectionUpdates = times.map((t) => ({
      section: t.section,
      updated_at: t.updated_at ? t.updated_at.toISOString() : null,
    }));
  } catch {
    // ignore
  }

  const url = new URL(req.url);
  let probes: ProbeResult[] | null = cachedProbes;
  let finalProbedAt: string | null = probedAt;

  if (url.searchParams.get("probe") === "true") {
    const results = await Promise.allSettled([probeAdsb(), probeBirdnet(), probeSteam(), probeUptime()]);
    probes = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { name: "Unknown", status: "error" as const, latencyMs: null, details: null, error: "Internal probe error" }
    );
    finalProbedAt = new Date().toISOString();

    if (pool && dbStatus === "ok") {
      try {
        await pool.execute(
          `INSERT INTO health_probe_cache (id, probed_at, results) VALUES (1, NOW(), ?)
           ON DUPLICATE KEY UPDATE probed_at = NOW(), results = VALUES(results)`,
          [JSON.stringify(probes)]
        );
      } catch {
        // ignore
      }
    }
  }

  return NextResponse.json({
    database: { status: dbStatus, error: dbError, latencyMs: dbLatencyMs, sizeBytes: dbSizeBytes },
    widgets,
    sectionUpdates,
    probes,
    probedAt: finalProbedAt,
  });
}
