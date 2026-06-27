import { NextResponse } from "next/server";

export const revalidate = 0; // always live; never caches the HA token

interface SensorResult {
  key: string;   // opaque client-facing key — never the real HA entity ID
  name: string;
  state: string;
  unit: string;
  device_class: string;
}

async function fetchSensor(
  baseUrl: string,
  haToken: string,
  entityId: string,
  opaqueKey: string,
  customName?: string
): Promise<SensorResult> {
  const response = await fetch(`${baseUrl}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${haToken}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`HA API returned ${response.status} for entity`);
  }

  const data = await response.json();
  return {
    key: opaqueKey,
    // Never fall back to entity_id — use a generic label if no name available
    name: customName || data.attributes?.friendly_name || "Sensor",
    state: data.state,
    unit: data.attributes?.unit_of_measurement || "",
    device_class: data.attributes?.device_class || "",
  };
}

export async function GET() {
  const haUrl = process.env.HA_URL;
  const haToken = process.env.HA_TOKEN;
  const haGroups = process.env.HA_SENSOR_GROUPS;
  const haSensors = process.env.HA_SENSORS;

  if (!haUrl || !haToken || (!haGroups && !haSensors)) {
    return NextResponse.json({ configured: false, groups: [] }, { status: 200 });
  }

  let baseUrl = haUrl.replace(/\/$/, "");
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }

  try {
    // HA_SENSOR_GROUPS takes precedence over HA_SENSORS
    // Format: "Indoor:sensor.a=Name,sensor.b=Name|Outdoor:sensor.c,sensor.d"
    if (haGroups) {
      const groupDefs = haGroups.split("|").map((g) => g.trim()).filter(Boolean);

      const groups = await Promise.all(
        groupDefs.map(async (groupDef, groupIdx) => {
          const colonIdx = groupDef.indexOf(":");
          const label = colonIdx > -1 ? groupDef.slice(0, colonIdx).trim() : "";

          const entityDefs = groupDef
            .slice(colonIdx + 1)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((entry, sensorIdx) => {
              const eqIdx = entry.indexOf("=");
              return {
                id: eqIdx > -1 ? entry.slice(0, eqIdx).trim() : entry,
                name: eqIdx > -1 ? entry.slice(eqIdx + 1).trim() : undefined,
                key: `g${groupIdx}-s${sensorIdx}`, // opaque key
              };
            });

          const sensors = await Promise.all(
            entityDefs.map(({ id, name, key }) =>
              fetchSensor(baseUrl, haToken, id, key, name)
            )
          );

          return { label, sensors };
        })
      );

      return NextResponse.json({ configured: true, groups });
    }

    // Fallback: flat HA_SENSORS list as a single unlabelled group
    const entityDefs = haSensors!
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry, sensorIdx) => {
        const eqIdx = entry.indexOf("=");
        return {
          id: eqIdx > -1 ? entry.slice(0, eqIdx).trim() : entry,
          name: eqIdx > -1 ? entry.slice(eqIdx + 1).trim() : undefined,
          key: `g0-s${sensorIdx}`,
        };
      });

    if (entityDefs.length === 0) {
      return NextResponse.json({ configured: true, groups: [] }, { status: 200 });
    }

    const sensors = await Promise.all(
      entityDefs.map(({ id, name, key }) =>
        fetchSensor(baseUrl, haToken, id, key, name)
      )
    );

    return NextResponse.json({ configured: true, groups: [{ label: null, sensors }] });
  } catch (error) {
    console.error("[homeassistant] fetch failed:", error);
    return NextResponse.json(
      { configured: true, groups: [], error: "unreachable" },
      { status: 503 }
    );
  }
}
