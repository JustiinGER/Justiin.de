import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { setHistoryPinned } from "@/lib/content.server";

export async function PATCH(
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
    const { pinned } = await req.json();
    if (typeof pinned !== "boolean") {
      return NextResponse.json({ error: "pinned must be a boolean" }, { status: 400 });
    }

    const updated = await setHistoryPinned(entryId, pinned);
    if (!updated) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, pinned });
  } catch (err) {
    console.error("[History/[id]/pin API] PATCH Error:", err);
    return NextResponse.json({ error: "Failed to update pin" }, { status: 500 });
  }
}
