import { SENSOR_HISTORY_MS, type HistoryPoint, type SensorTrend } from "@/types/homeassistant";

export interface ParsedSensorEntry {
  key: string;
  entityId: string;
  displayName?: string;
}

export interface ParsedSensorGroup {
  label: string | null;
  sensors: ParsedSensorEntry[];
}

interface StatisticsBucket {
  start: string;
  mean?: number;
  min?: number;
  max?: number;
}

interface GetStatisticsServiceResponse {
  service_response?: {
    statistics?: Record<string, StatisticsBucket[]>;
  };
}

interface HaStateResponse {
  state?: string;
  last_changed?: string;
  attributes?: {
    friendly_name?: string;
    unit_of_measurement?: string;
    device_class?: string;
  };
}

const OPAQUE_KEY_PATTERN = /^g(\d+)-s(\d+)$/;

export function normalizeHaUrl(haUrl: string): string {
  let baseUrl = haUrl.replace(/\/$/, "");
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }
  return baseUrl;
}

export function isHaConfigured(): boolean {
  const { haUrl, haToken, haGroups, haSensors } = readHaEnv();
  return !!(haUrl && haToken && (haGroups || haSensors));
}

export function getHaCredentials(): { baseUrl: string; token: string } | null {
  const { haUrl, haToken } = readHaEnv();
  if (!haUrl || !haToken) return null;
  return { baseUrl: normalizeHaUrl(haUrl), token: haToken };
}

export function parseSensorGroups(): ParsedSensorGroup[] {
  const { haGroups, haSensors } = readHaEnv();

  if (haGroups) {
    return haGroups
      .split("|")
      .map((groupDef) => groupDef.trim())
      .filter(Boolean)
      .map((groupDef, groupIdx) => {
        const colonIdx = groupDef.indexOf(":");
        const label = colonIdx > -1 ? groupDef.slice(0, colonIdx).trim() : "";

        const sensors = groupDef
          .slice(colonIdx + 1)
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry, sensorIdx) => parseEnvEntry(entry, `g${groupIdx}-s${sensorIdx}`));

        return { label: label || null, sensors };
      });
  }

  if (haSensors) {
    const sensors = haSensors
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry, sensorIdx) => parseEnvEntry(entry, `g0-s${sensorIdx}`));

    if (sensors.length === 0) return [];
    return [{ label: null, sensors }];
  }

  return [];
}

export function resolveSensorKey(sensorKey: string): ParsedSensorEntry | null {
  const match = sensorKey.match(OPAQUE_KEY_PATTERN);
  if (!match) return null;

  const groupIdx = parseInt(match[1], 10);
  const sensorIdx = parseInt(match[2], 10);
  const groups = parseSensorGroups();
  const group = groups[groupIdx];
  if (!group) return null;

  return group.sensors[sensorIdx] ?? null;
}

export function countConfiguredSensors(): number {
  return parseSensorGroups().reduce((sum, group) => sum + group.sensors.length, 0);
}

export function computeTrend(
  current: number,
  deviceClass: string,
  buckets: StatisticsBucket[]
): SensorTrend | null {
  if (!Number.isFinite(current) || buckets.length === 0) return null;

  const sorted = [...buckets].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Prefer the latest hour bucket that ended at least ~45 min ago (avoids the
  // in-progress hour whose mean tracks the live value too closely).
  const referenceCutoff = Date.now() - 45 * 60 * 1000;
  const eligible = sorted.filter(
    (bucket) => new Date(bucket.start).getTime() <= referenceCutoff
  );
  const referenceBucket =
    eligible.length > 0 ? eligible[eligible.length - 1] : sorted[sorted.length - 1];

  if (typeof referenceBucket?.mean !== "number") return null;

  const diff = current - referenceBucket.mean;
  const epsilon =
    deviceClass === "temperature"
      ? 0.2
      : deviceClass === "humidity"
      ? Math.max(0.25, current * 0.004)
      : 0.1;

  if (diff > epsilon) return "up";
  if (diff < -epsilon) return "down";
  return "flat";
}

export async function fetchHaStatistics(
  baseUrl: string,
  token: string,
  entityIds: string[],
  start: Date,
  end: Date,
  revalidate: number
): Promise<{ ok: boolean; statistics: Record<string, StatisticsBucket[]> }> {
  if (entityIds.length === 0) return { ok: true, statistics: {} };

  const response = await fetch(
    `${baseUrl}/api/services/recorder/get_statistics?return_response`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statistic_ids: entityIds,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        period: "hour",
        types: ["mean", "min", "max"],
      }),
      signal: AbortSignal.timeout(10000),
      next: { revalidate },
    }
  );

  if (!response.ok) return { ok: false, statistics: {} };

  const data = (await response.json()) as GetStatisticsServiceResponse;
  return { ok: true, statistics: data?.service_response?.statistics ?? {} };
}

export async function fetchHaSensorState(
  baseUrl: string,
  token: string,
  entityId: string,
  revalidate: number
): Promise<HaStateResponse | null> {
  const response = await fetch(`${baseUrl}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(5000),
    next: { revalidate },
  });

  if (!response.ok) return null;
  return (await response.json()) as HaStateResponse;
}

export function mapStatisticsBuckets(buckets: StatisticsBucket[]): HistoryPoint[] {
  return buckets
    .filter(
      (bucket) =>
        typeof bucket?.start === "string" &&
        typeof bucket?.mean === "number" &&
        typeof bucket?.min === "number" &&
        typeof bucket?.max === "number"
    )
    .map((bucket) => ({
      time: bucket.start,
      mean: bucket.mean as number,
      min: bucket.min as number,
      max: bucket.max as number,
    }));
}

interface LegacyHistoryEntry {
  state: string;
  last_changed: string;
}

export async function fetchHaRawHistory(
  baseUrl: string,
  token: string,
  entityId: string,
  start: Date,
  revalidate: number
): Promise<{ ok: boolean; history: HistoryPoint[] }> {
  const url = `${baseUrl}/api/history/period/${start.toISOString()}?filter_entity_id=${encodeURIComponent(entityId)}&minimal_response=true`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10000),
    next: { revalidate },
  });

  if (!response.ok) return { ok: false, history: [] };

  const rawData = (await response.json()) as LegacyHistoryEntry[][];
  const rawEntries = rawData?.[0] ?? [];

  return {
    ok: true,
    history: rawEntries
      .filter((item) => item.state !== "unavailable" && item.state !== "unknown")
      .map((item) => ({
        time: item.last_changed,
        value: Number.parseFloat(item.state),
      }))
      .filter((item) => !Number.isNaN(item.value))
      .map((item) => ({
        time: item.time,
        mean: item.value,
        min: item.value,
        max: item.value,
      })),
  };
}

export async function fetchSensorHistory(
  baseUrl: string,
  token: string,
  entityId: string,
  revalidate: number
): Promise<HistoryPoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - SENSOR_HISTORY_MS);

  const { ok: statisticsOk, statistics } = await fetchHaStatistics(
    baseUrl,
    token,
    [entityId],
    start,
    end,
    revalidate
  );
  const buckets = statistics[entityId] ?? [];

  if (buckets.length > 0) {
    return mapStatisticsBuckets(buckets);
  }

  if (statisticsOk) {
    return [];
  }

  const rawHistory = await fetchHaRawHistory(baseUrl, token, entityId, start, revalidate);
  if (!rawHistory.ok) {
    throw new Error("HA statistics and fallback history APIs both failed");
  }

  return rawHistory.history;
}

function readHaEnv() {
  return {
    haUrl: process.env.HA_URL,
    haToken: process.env.HA_TOKEN,
    haGroups: process.env.HA_SENSOR_GROUPS,
    haSensors: process.env.HA_SENSORS,
  };
}

function parseEnvEntry(entry: string, key: string): ParsedSensorEntry {
  const eqIdx = entry.indexOf("=");
  return {
    key,
    entityId: eqIdx > -1 ? entry.slice(0, eqIdx).trim() : entry,
    displayName: eqIdx > -1 ? entry.slice(eqIdx + 1).trim() : undefined,
  };
}
