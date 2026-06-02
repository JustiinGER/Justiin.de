/**
 * Parse active variable definitions from .env.local.example (uncommented KEY=value lines only).
 */

import { envKeyName, parseEnvValue, type EnvLine } from "./env-file";

export type TemplateVarEntry = {
  key: string;
  defaultValue: string;
};

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseVarAssignment(line: string): TemplateVarEntry | null {
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) return null;

  const key = line.slice(0, eqIdx).trim();
  if (!key || !KEY_PATTERN.test(key)) return null;

  return {
    key,
    defaultValue: parseEnvValue(line.slice(eqIdx + 1)),
  };
}

/**
 * Collect active variable definitions from the example file.
 * Commented `# KEY=value` lines are ignored.
 */
export function parseTemplateVars(content: string): TemplateVarEntry[] {
  const byLogicalKey = new Map<string, TemplateVarEntry>();
  const raw = content.endsWith("\n") ? content.slice(0, -1) : content;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const entry = parseVarAssignment(line);
    if (entry) {
      byLogicalKey.set(envKeyName(entry.key), entry);
    }
  }

  return [...byLogicalKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export type MissingTemplateVar = TemplateVarEntry & {
  hint?: string;
};

export function getMissingFromTemplate(
  templateVars: TemplateVarEntry[],
  localLines: EnvLine[],
  hints: Record<string, string> = {}
): MissingTemplateVar[] {
  const localKeys = new Set<string>();
  for (const line of localLines) {
    if (line.type === "var") {
      const name = envKeyName(line.key);
      if (name) localKeys.add(name);
    }
  }

  return templateVars
    .filter((t) => !localKeys.has(envKeyName(t.key)))
    .map((t) => ({
      ...t,
      hint: hints[envKeyName(t.key)],
    }));
}
