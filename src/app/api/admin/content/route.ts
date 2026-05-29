import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { getAllContent, writeContent, type ContentSection } from "@/lib/content.server";
import { logAdminAction } from "@/lib/admin-log.server";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const content = await getAllContent();
    return NextResponse.json({ content });
  } catch (err) {
    console.error("[Content API] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { section, data } = await req.json();

    if (!section || !data) {
      return NextResponse.json({ error: "Section and data are required" }, { status: 400 });
    }

    const allowedSections: ContentSection[] = ["aboutMe", "passions", "lab", "contactData", "gear"];
    if (!allowedSections.includes(section as ContentSection)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const { historyId } = await writeContent(
      section as ContentSection,
      data,
      user.username
    );

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    logAdminAction(user.username, "content_save", section, ip, {
      historyId: historyId ?? undefined,
      after: data,
    }).catch((err) => {
      console.error("[Content API] Failed to log save:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Content API] PUT Error:", err);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}
