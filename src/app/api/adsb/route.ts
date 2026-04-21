import { NextResponse } from "next/server";

export const revalidate = 15; // cache for 15 seconds

/**
 * Proxies ADS-B data from a local tar1090/readsb/dump1090 endpoint.
 *
 * Expected endpoint returns a JSON payload with an `aircraft` array, like:
 *   https://tar1090.example.com/data/aircraft.json
 *
 * Configure via env var `ADSB_ENDPOINT`.
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function GET() {
  const endpoint = process.env.ADSB_ENDPOINT;
  const receiverLat = process.env.RECEIVER_LAT ? parseFloat(process.env.RECEIVER_LAT) : null;
  const receiverLon = process.env.RECEIVER_LON ? parseFloat(process.env.RECEIVER_LON) : null;

  if (!endpoint) {
    return NextResponse.json(
      { aircraft: null, withPosition: null, configured: false },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 15 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    const data = await response.json();
    const aircraft = Array.isArray(data.aircraft) ? data.aircraft : [];
    
    let maxDistanceKm = 0;
    
    const withPosition = aircraft.filter(
      (a: { lat?: number; lon?: number; dst?: number }) => {
        const hasPos = typeof a.lat === "number" && typeof a.lon === "number";
        
        if (a.dst) {
          // tar1090 provides distance in nautical miles (nm)
          const distKm = a.dst * 1.852;
          if (distKm > maxDistanceKm) maxDistanceKm = distKm;
        } else if (hasPos && receiverLat !== null && receiverLon !== null) {
          // Fallback: calculate distance manually if receiver coordinates are provided
          const distKm = getDistanceFromLatLonInKm(receiverLat, receiverLon, a.lat!, a.lon!);
          if (distKm > maxDistanceKm) maxDistanceKm = distKm;
        }

        return hasPos;
      }
    ).length;

    const finalMaxDistance = maxDistanceKm > 0 ? Math.round(maxDistanceKm) : null;

    return NextResponse.json({
      aircraft: aircraft.length,
      withPosition,
      maxDistanceKm: finalMaxDistance,
      configured: true,
    });
  } catch (error) {
    console.error("[adsb] fetch failed:", error);
    return NextResponse.json(
      { aircraft: null, withPosition: null, configured: true, error: "unreachable" },
      { status: 503 }
    );
  }
}
