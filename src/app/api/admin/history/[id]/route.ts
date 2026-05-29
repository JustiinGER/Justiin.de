import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import {
  getHistoryEntryById,
  getCurrentContent,
  deleteHistoryEntry,
  type ContentSection,
} from "@/lib/content.server";
import { logAdminAction } from "@/lib/admin-log.server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (Number.isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const entry = await getHistoryEntryById(entryId);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const current = await getCurrentContent(entry.section as ContentSection);

    return NextResponse.json({
      entry: {
        id: entry.id,
        section: entry.section,
        data: entry.data,
        saved_by: entry.saved_by,
        pinned: entry.pinned,
        saved_at: entry.saved_at,
      },
      current,
    });
  } catch (err) {
    console.error("[History/[id] API] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (Number.isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const entry = await getHistoryEntryById(entryId);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (entry.pinned) {
      return NextResponse.json(
        { error: "Pinned entries cannot be deleted. Unpin first." },
        { status: 409 }
      );
    }

    const deleted = await deleteHistoryEntry(entryId);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    logAdminAction(user.username, "history_delete", entry.section, ip, {
      historyId: entryId,
    }).catch((err) => {
      console.error("[History/[id] API] Failed to log delete:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[History/[id] API] DELETE Error:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
