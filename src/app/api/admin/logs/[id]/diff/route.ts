import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { getLogDiff } from "@/lib/admin-log.server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const logId = parseInt(id, 10);
  if (Number.isNaN(logId)) {
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 });
  }

  try {
    const result = await getLogDiff(logId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Logs Diff API] Error:", err);
    return NextResponse.json({ error: "Failed to load diff" }, { status: 500 });
  }
}
