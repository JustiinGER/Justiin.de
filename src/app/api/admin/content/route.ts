import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";
import { getAllContent, writeContent, type ContentSection } from "@/lib/content.server";
import { isValidProbeHost } from "@/lib/probe-host";
import { logAdminAction } from "@/lib/admin-log.server";
import { getClientIp } from "@/lib/client-ip.server";

const MAX_CONTENT_BYTES = 256 * 1024;

/** Returns a message when the submitted section must not be stored. */
function findContentError(section: ContentSection, data: unknown): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return "Data must be an object";
  }
  if (Buffer.byteLength(JSON.stringify(data), "utf-8") > MAX_CONTENT_BYTES) {
    return "Content is too large";
  }

  if (section === "lab") {
    const servers = (data as { servers?: unknown }).servers;
    if (servers !== undefined && !Array.isArray(servers)) {
      return "lab.servers must be a list";
    }
    // /api/ping opens connections to these addresses, so only accept real hosts.
    for (const server of (servers ?? []) as unknown[]) {
      const ip = (server as { ip?: unknown } | null)?.ip;
      if (ip === undefined || ip === null || ip === "") continue;
      if (typeof ip !== "string" || !isValidProbeHost(ip)) {
        return "Server IP must be a valid IP address or hostname";
      }
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
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
  const user = await requireAuth(req);
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

    const contentError = findContentError(section as ContentSection, data);
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    const { historyId } = await writeContent(
      section as ContentSection,
      data,
      user.username
    );

    const ip = getClientIp(req);
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
