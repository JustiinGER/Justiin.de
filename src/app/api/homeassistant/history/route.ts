import { NextResponse } from "next/server";

export const revalidate = 0; // always live

/** Resolves an opaque sensor key (e.g. "g0-s1") to the real HA entity ID.
 *  Returns null if the key is unknown or config is missing. */
function resolveKey(sensorKey: string): string | null {
  const haGroups = process.env.HA_SENSOR_GROUPS;
  const haSensors = process.env.HA_SENSORS;

  // Parse key: "g{groupIdx}-s{sensorIdx}"
  const match = sensorKey.match(/^g(\d+)-s(\d+)$/);
  if (!match) return null;

  const groupIdx = parseInt(match[1], 10);
  const sensorIdx = parseInt(match[2], 10);

  if (haGroups) {
    const groupDefs = haGroups.split("|").map((g) => g.trim()).filter(Boolean);
    const groupDef = groupDefs[groupIdx];
    if (!groupDef) return null;

    const colonIdx = groupDef.indexOf(":");
    const entries = groupDef
      .slice(colonIdx + 1)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const entry = entries[sensorIdx];
    if (!entry) return null;

    const eqIdx = entry.indexOf("=");
    return eqIdx > -1 ? entry.slice(0, eqIdx).trim() : entry;
  }

  if (haSensors && groupIdx === 0) {
    const entries = haSensors.split(",").map((s) => s.trim()).filter(Boolean);
    const entry = entries[sensorIdx];
    if (!entry) return null;

    const eqIdx = entry.indexOf("=");
    return eqIdx > -1 ? entry.slice(0, eqIdx).trim() : entry;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sensorKey = searchParams.get("sensorKey");

  const haUrl = process.env.HA_URL;
  const haToken = process.env.HA_TOKEN;

  if (!haUrl || !haToken || !sensorKey) {
    return NextResponse.json({ error: "Missing config or sensorKey" }, { status: 400 });
  }

  // Resolve the opaque key to the real entity ID — entirely on the server
  const entityId = resolveKey(sensorKey);
  if (!entityId) {
    return NextResponse.json({ error: "Unknown sensor key" }, { status: 403 });
  }

  try {
    let baseUrl = haUrl.replace(/\/$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const url = `${baseUrl}/api/history/period/${startTime}?filter_entity_id=${entityId}&minimal_response=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HA API returned ${response.status} for history`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ history: [] });
    }

    const history = data[0]
      .filter((item: { state: string }) => item.state !== "unavailable" && item.state !== "unknown")
      .map((item: { state: string; last_changed: string }) => ({
        state: parseFloat(item.state),
        time: item.last_changed,
      }))
      .filter((item: { state: number }) => !isNaN(item.state));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[homeassistant-history] fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 503 });
  }
}
