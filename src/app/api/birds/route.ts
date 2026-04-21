import { NextResponse } from "next/server";

export const revalidate = 120; // cache for 2 minutes

/**
 * Proxies bird detection data from a BirdNET-Go instance.
 *
 * BirdNET-Go exposes endpoints like:
 *   GET /api/v2/detections?numResults=1000&offset=0
 *   GET /api/v2/analytics/species/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * We call the analytics/species endpoint (if configured) and return:
 *   { species7d, detections7d, configured }
 *
 * Configure via env var `BIRDNET_ENDPOINT` (base URL, e.g. http://birdnet.local:8080).
 */
export async function GET() {
  const baseUrl = process.env.BIRDNET_ENDPOINT;

  if (!baseUrl) {
    return NextResponse.json(
      { species7d: null, detections7d: null, configured: false },
      { status: 200 }
    );
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const url = `${baseUrl.replace(/\/$/, "")}/api/v2/analytics/species/summary?start_date=${fmt(weekAgo)}&end_date=${fmt(now)}`;

    const response = await fetch(url, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    const data = await response.json();
    const species = Array.isArray(data) ? data : Array.isArray(data.species) ? data.species : [];
    const species7d = species.length;
    const detections7d = species.reduce(
      (sum: number, s: { count?: number; detection_count?: number }) =>
        sum + (s.count ?? s.detection_count ?? 0),
      0
    );

    return NextResponse.json({
      species7d,
      detections7d,
      configured: true,
    });
  } catch (error) {
    console.error("[birds] fetch failed:", error);
    return NextResponse.json(
      { species7d: null, detections7d: null, configured: true, error: "unreachable" },
      { status: 503 }
    );
  }
}
