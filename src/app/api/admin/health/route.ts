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

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dbStatus: "ok" | "error" | "not_configured" = "not_configured";
  let dbError: string | null = null;

  if (isDbConfigured()) {
    try {
      const pool = getPool();
      await pool.execute("SELECT 1");
      dbStatus = "ok";
    } catch (err) {
      dbStatus = "error";
      dbError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  const widgets: WidgetStatus[] = [
    {
      name: "ADS-B",
      configured: !!process.env.ADSB_ENDPOINT,
      envKey: "ADSB_ENDPOINT",
    },
    {
      name: "BirdNET",
      configured: !!process.env.BIRDNET_ENDPOINT,
      envKey: "BIRDNET_ENDPOINT",
    },
    {
      name: "Steam",
      configured: !!(process.env.STEAM_API_KEY && process.env.STEAM_ID),
      envKey: "STEAM_API_KEY + STEAM_ID",
    },
    {
      name: "Uptime Kuma",
      configured: !!(process.env.UPTIME_KUMA_ENDPOINT && process.env.UPTIME_KUMA_SLUG),
      envKey: "UPTIME_KUMA_ENDPOINT + UPTIME_KUMA_SLUG",
    },
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

  return NextResponse.json({
    database: {
      status: dbStatus,
      error: dbError,
    },
    widgets,
    sectionUpdates,
  });
}
