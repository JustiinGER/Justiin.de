import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { getContentHistory, rollbackContent, type ContentSection } from "@/lib/content.server";
import { logAdminAction } from "@/lib/admin-log.server";

const allowedSections: ContentSection[] = ["aboutMe", "passions", "lab", "contactData", "gear"];

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const section = req.nextUrl.searchParams.get("section") as ContentSection | null;

  if (!section || !allowedSections.includes(section)) {
    return NextResponse.json({ error: "Invalid or missing section" }, { status: 400 });
  }

  try {
    const history = await getContentHistory(section);
    return NextResponse.json({ history });
  } catch (err) {
    console.error("[History API] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { historyId } = await req.json();

    if (!historyId || typeof historyId !== "number") {
      return NextResponse.json({ error: "historyId is required" }, { status: 400 });
    }

    const result = await rollbackContent(historyId, user.username);

    if (!result) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    await logAdminAction(user.username, "rollback", result.section, ip, {
      historyId: result.archivedHistoryId ?? undefined,
      before: result.before ?? undefined,
      after: result.after,
    });

    return NextResponse.json({ success: true, section: result.section });
  } catch (err) {
    console.error("[History API] POST Error:", err);
    return NextResponse.json({ error: "Rollback failed" }, { status: 500 });
  }
}
