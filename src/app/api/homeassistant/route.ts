import { NextResponse } from "next/server";
import {
  computeTrend,
  fetchHaSensorState,
  fetchHaStatistics,
  getHaCredentials,
  isHaConfigured,
  parseSensorGroups,
  type ParsedSensorEntry,
} from "@/lib/homeassistant.server";
import type { SensorData, SensorGroup } from "@/types/homeassistant";

export const revalidate = 60; // cache HA responses for 60s (aligned with client poll); token stays in process.env

const LIVE_REVALIDATE = 60;

async function buildSensorData(
  baseUrl: string,
  token: string,
  entry: ParsedSensorEntry,
  statisticsByEntity: Record<string, { start: string; mean?: number }[]>
): Promise<SensorData | null> {
  const data = await fetchHaSensorState(baseUrl, token, entry.entityId, LIVE_REVALIDATE);
  if (!data?.state || data.state === "unavailable" || data.state === "unknown") {
    return null;
  }

  const deviceClass = data.attributes?.device_class ?? "";
  const numericState = Number.parseFloat(data.state);
  const trend = Number.isFinite(numericState)
    ? computeTrend(numericState, deviceClass, statisticsByEntity[entry.entityId] ?? [])
    : null;

  return {
    key: entry.key,
    name: entry.displayName || data.attributes?.friendly_name || "Sensor",
    state: data.state,
    unit: data.attributes?.unit_of_measurement ?? "",
    device_class: deviceClass,
    last_changed: data.last_changed ?? new Date().toISOString(),
    trend,
  };
}

export async function GET() {
  if (!isHaConfigured()) {
    return NextResponse.json({ configured: false, groups: [] }, { status: 200 });
  }

  const credentials = getHaCredentials();
  if (!credentials) {
    return NextResponse.json({ configured: false, groups: [] }, { status: 200 });
  }

  const { baseUrl, token } = credentials;
  const parsedGroups = parseSensorGroups();

  if (parsedGroups.length === 0) {
    return NextResponse.json({ configured: true, groups: [] }, { status: 200 });
  }

  try {
    const allEntries = parsedGroups.flatMap((group) => group.sensors);
    const entityIds = allEntries.map((entry) => entry.entityId);

    const end = new Date();
    const trendStart = new Date(end.getTime() - 4 * 60 * 60 * 1000);

    const { statistics: statisticsByEntity } = await fetchHaStatistics(
      baseUrl,
      token,
      entityIds,
      trendStart,
      end,
      LIVE_REVALIDATE
    );

    const groups: SensorGroup[] = await Promise.all(
      parsedGroups.map(async (group) => {
        const results = await Promise.allSettled(
          group.sensors.map((entry) =>
            buildSensorData(baseUrl, token, entry, statisticsByEntity)
          )
        );

        const sensors = results
          .filter(
            (result): result is PromiseFulfilledResult<SensorData | null> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value)
          .filter((sensor): sensor is SensorData => sensor !== null);

        return { label: group.label, sensors };
      })
    );

    return NextResponse.json({ configured: true, groups });
  } catch (error) {
    console.error("[homeassistant] fetch failed:", error);
    return NextResponse.json(
      { configured: true, groups: [], error: "unreachable" },
      { status: 503 }
    );
  }
}
