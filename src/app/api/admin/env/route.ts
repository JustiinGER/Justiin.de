import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAuth, verifyAdminPassword } from "@/lib/auth.server";
import { logAdminAction } from "@/lib/admin-log.server";
import { CRITICAL_ENV_KEYS } from "@/lib/env-critical";
import {
  type EnvLine,
  parseEnvFile,
  serializeEnvFile,
  buildVarMapFromLines,
  findEnvValidationError,
} from "@/lib/env-file";
import { parseEnvHintsFromExample } from "@/lib/env-hints";
import { getMissingFromTemplate, parseTemplateVars } from "@/lib/env-template";

export type { EnvLine } from "@/lib/env-file";

const ENV_FILE = path.join(process.cwd(), ".env.local");
const ENV_EXAMPLE_FILE = path.join(process.cwd(), ".env.local.example");

function findPayloadValidationError(lines: unknown): string | null {
  if (!Array.isArray(lines)) return "Invalid payload";

  for (const line of lines) {
    if (typeof line !== "object" || line === null) return "Invalid payload";
    const { type } = line as Record<string, unknown>;

    if (type === "comment") {
      if (typeof (line as { text?: unknown }).text !== "string") return "Invalid payload";
    } else if (type === "blank") {
      // ok
    } else if (type === "var") {
      const { key, value } = line as { key?: unknown; value?: unknown };
      if (typeof key !== "string" || typeof value !== "string") return "Invalid payload";
    } else {
      return "Invalid payload";
    }
  }

  return findEnvValidationError(lines as EnvLine[]);
}

function findCriticalViolation(
  beforeMap: Map<string, string>,
  afterMap: Map<string, string>,
  confirmedRemovals: Set<string>
): string | null {
  for (const key of CRITICAL_ENV_KEYS) {
    const beforeVal = beforeMap.get(key);
    if (beforeVal === undefined || beforeVal.trim() === "") continue;

    const afterVal = afterMap.get(key);
    if (afterVal === undefined || afterVal.trim() === "") {
      if (!confirmedRemovals.has(key)) {
        return `Cannot remove or clear protected variable: ${key}. Confirm removal when saving.`;
      }
    }
  }
  return null;
}

// ---- Audit helpers ----

const SENSITIVE_PATTERNS = [
  "PASSWORD", "SECRET", "KEY", "TOKEN", "PASS", "AUTH", "CREDENTIAL", "PRIVATE",
];

function isSensitiveKey(key: string): boolean {
  const u = key.toUpperCase();
  return SENSITIVE_PATTERNS.some((p) => u.includes(p));
}

function buildRedactedMap(lines: EnvLine[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of lines) {
    if (l.type === "var") map[l.key] = isSensitiveKey(l.key) ? "***" : l.value;
  }
  return map;
}

async function loadExampleMetadata(localLines: EnvLine[]) {
  try {
    const example = await fs.readFile(ENV_EXAMPLE_FILE, "utf-8");
    const hints = parseEnvHintsFromExample(example);
    const templateVars = parseTemplateVars(example);
    const missingFromTemplate = getMissingFromTemplate(templateVars, localLines, hints);
    return { hints, missingFromTemplate };
  } catch {
    return { hints: {} as Record<string, string>, missingFromTemplate: [] };
  }
}

// ---- Routes ----

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const content = await fs.readFile(ENV_FILE, "utf-8");
    const lines = parseEnvFile(content);
    const { hints, missingFromTemplate } = await loadExampleMetadata(lines);
    let rawExample: string | undefined;
    try {
      rawExample = await fs.readFile(ENV_EXAMPLE_FILE, "utf-8");
    } catch {
      // example file may not exist
    }
    return NextResponse.json({ lines, hints, raw: content, missingFromTemplate, rawExample });
  } catch (err) {
    console.error("[Env API] GET error:", err);
    return NextResponse.json({ error: "Failed to read .env.local" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { lines, rawContent, currentPassword, confirmCriticalRemoval } = body as {
      lines?: unknown;
      rawContent?: unknown;
      currentPassword?: unknown;
      confirmCriticalRemoval?: unknown;
    };

    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to save environment variables" },
        { status: 400 }
      );
    }

    const passwordOk = await verifyAdminPassword(user.username, currentPassword);
    if (!passwordOk) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    let validLines: EnvLine[];
    let fileContent: string;

    if (typeof rawContent === "string") {
      try {
        validLines = parseEnvFile(rawContent);
      } catch {
        return NextResponse.json({ error: "Invalid .env file content" }, { status: 400 });
      }
      fileContent = rawContent.endsWith("\n") ? rawContent : `${rawContent}\n`;
    } else if (lines !== undefined) {
      const validationError = findPayloadValidationError(lines);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      validLines = lines as EnvLine[];
      fileContent = serializeEnvFile(validLines);
    } else {
      return NextResponse.json({ error: "lines or rawContent is required" }, { status: 400 });
    }

    // rawContent path hasn't been validated yet; lines path already validated above via findPayloadValidationError
    if (typeof rawContent === "string") {
      const validationError = findEnvValidationError(validLines);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const afterMap = buildVarMapFromLines(validLines);

    let beforeLines: EnvLine[] = [];
    try {
      const existing = await fs.readFile(ENV_FILE, "utf-8");
      beforeLines = parseEnvFile(existing);
    } catch {
      // File may not exist yet
    }

    const beforeMap = buildVarMapFromLines(beforeLines);
    const confirmedList = Array.isArray(confirmCriticalRemoval)
      ? confirmCriticalRemoval.filter((k): k is string => typeof k === "string")
      : [];
    for (const key of confirmedList) {
      if (!CRITICAL_ENV_KEYS.has(key)) {
        return NextResponse.json({ error: "Invalid critical removal confirmation" }, { status: 400 });
      }
    }
    const confirmedRemovals = new Set(confirmedList);
    const criticalError = findCriticalViolation(beforeMap, afterMap, confirmedRemovals);
    if (criticalError) {
      return NextResponse.json({ error: criticalError }, { status: 400 });
    }

    const tmpFile = `${ENV_FILE}.tmp`;
    await fs.writeFile(tmpFile, fileContent, "utf-8");
    await fs.rename(tmpFile, ENV_FILE);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    logAdminAction(user.username, "env_save", null, ip, {
      before: buildRedactedMap(beforeLines),
      after: buildRedactedMap(validLines),
    }).catch((err) => {
      console.error("[Env API] Failed to log action:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Env API] PUT error:", err);
    return NextResponse.json({ error: "Failed to write .env.local" }, { status: 500 });
  }
}
