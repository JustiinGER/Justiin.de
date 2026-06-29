import { NextResponse } from "next/server";
import {
  fetchSensorHistory,
  getHaCredentials,
  resolveSensorKey,
} from "@/lib/homeassistant.server";

export const revalidate = 300; // cache history for 5 minutes per sensorKey

const HISTORY_REVALIDATE = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sensorKey = searchParams.get("sensorKey");

  const credentials = getHaCredentials();

  if (!credentials || !sensorKey) {
    return NextResponse.json({ error: "Missing config or sensorKey" }, { status: 400 });
  }

  const entry = resolveSensorKey(sensorKey);
  if (!entry) {
    return NextResponse.json({ error: "Unknown sensor key" }, { status: 403 });
  }

  try {
    const history = await fetchSensorHistory(
      credentials.baseUrl,
      credentials.token,
      entry.entityId,
      HISTORY_REVALIDATE
    );

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[homeassistant-history] fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 503 });
  }
}
