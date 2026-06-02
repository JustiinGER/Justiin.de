/**
 * Extract per-variable hints from .env.local.example comment blocks.
 */

export function parseEnvHintsFromExample(content: string): Record<string, string> {
  const hints: Record<string, string> = {};
  const pending: string[] = [];

  const raw = content.endsWith("\n") ? content.slice(0, -1) : content;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    if (trimmed === "") {
      pending.length = 0;
      continue;
    }

    if (trimmed.startsWith("#")) {
      const text = trimmed.replace(/^#\s?/, "").trim();
      const isFence = /^={3,}$/.test(text.replace(/\s/g, ""));
      if (text && !isFence) pending.push(text);
      continue;
    }

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    if (key && pending.length > 0) {
      hints[key] = pending.join(" ");
    }
    pending.length = 0;
  }

  return hints;
}
