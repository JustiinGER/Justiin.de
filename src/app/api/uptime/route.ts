import { NextResponse } from "next/server";

export const revalidate = 60; // cache for 1 minute

export async function GET() {
  const baseUrl = process.env.UPTIME_KUMA_ENDPOINT;
  const slug = process.env.UPTIME_KUMA_SLUG;

  if (!baseUrl || !slug) {
    return NextResponse.json(
      { total: null, up: null, configured: false },
      { status: 200 }
    );
  }

  try {
    const cleanBase = baseUrl.replace(/\/$/, "");

    // Uptime Kuma has two separate endpoints we need to fetch:
    // 1. The status page config (contains monitor list)
    // 2. The heartbeat data (contains the live status of each monitor)
    const [configRes, heartbeatRes] = await Promise.all([
      fetch(`${cleanBase}/api/status-page/${slug}`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${cleanBase}/api/status-page/heartbeat/${slug}`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (!configRes.ok) {
      throw new Error(`Uptime Kuma config API returned ${configRes.status}`);
    }
    if (!heartbeatRes.ok) {
      throw new Error(`Uptime Kuma heartbeat API returned ${heartbeatRes.status}`);
    }

    const configData = await configRes.json();
    const heartbeatData = await heartbeatRes.json();

    let totalMonitors = 0;
    let upMonitors = 0;

    const groupList = configData.publicGroupList || [];
    const heartbeats = heartbeatData.heartbeatList || {};

    if (Array.isArray(groupList)) {
      groupList.forEach((group: { monitorList?: { id: string | number }[] }) => {
        if (Array.isArray(group.monitorList)) {
          group.monitorList.forEach((monitor: { id: string | number }) => {
            totalMonitors++;

            const monitorId = String(monitor.id);
            const monitorHeartbeats = heartbeats[monitorId];

            if (Array.isArray(monitorHeartbeats) && monitorHeartbeats.length > 0) {
              // The latest heartbeat is at the end of the array
              const latestHeartbeat = monitorHeartbeats[monitorHeartbeats.length - 1];
              // status 1 = UP
              if (latestHeartbeat.status === 1) {
                upMonitors++;
              }
            }
          });
        }
      });
    }

    return NextResponse.json({
      total: totalMonitors,
      up: upMonitors,
      configured: true,
    });
  } catch (error) {
    console.error("[uptime] fetch failed:", error);
    return NextResponse.json(
      { total: null, up: null, configured: true, error: "unreachable" },
      { status: 503 }
    );
  }
}
