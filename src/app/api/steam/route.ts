import { NextResponse } from "next/server";

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    return NextResponse.json(
      { gameName: null, playtime2Weeks: null, configured: false },
      { status: 200 }
    );
  }

  try {
    // Get recently played games
    const url = `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json`;

    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}`);
    }

    const data = await response.json();
    const games = data.response?.games || [];

    if (games.length === 0) {
      return NextResponse.json({
        gameName: "Nothing recently",
        playtime2Weeks: 0,
        configured: true,
      });
    }

    // The first game in the array is usually the most recently played
    const mostRecent = games[0];
    
    // Playtime is returned in minutes, convert to hours
    const hoursPlayed = Math.round((mostRecent.playtime_2weeks / 60) * 10) / 10;

    return NextResponse.json({
      gameName: mostRecent.name,
      playtime2Weeks: hoursPlayed,
      configured: true,
    });
  } catch (error) {
    console.error("[steam] fetch failed:", error);
    return NextResponse.json(
      { gameName: null, playtime2Weeks: null, configured: true, error: "unreachable" },
      { status: 503 }
    );
  }
}
