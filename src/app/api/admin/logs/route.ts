import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { actionSupportsDiff, getAdminLogs } from "@/lib/admin-log.server";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const offsetParam = req.nextUrl.searchParams.get("offset");

  const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);
  const offset = Math.max(parseInt(offsetParam || "0", 10) || 0, 0);

  try {
    const logs = await getAdminLogs(limit, offset);
    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        username: log.username,
        action: log.action,
        section: log.section,
        ip: log.ip,
        created_at: log.created_at.toISOString(),
        hasDiff: actionSupportsDiff(log.action) && !!log.details,
      })),
    });
  } catch (err) {
    console.error("[Logs API] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
