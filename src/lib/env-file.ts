/**
 * .env file parse/serialize — safe for client and server.
 */

export type EnvLine =
  | { type: "comment"; text: string }
  | { type: "blank" }
  | { type: "var"; key: string; value: string };

/** Unquote a value segment after the `=` sign. */
export function parseEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const quote = trimmed[0];
    if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
      return unescapeEnvValue(trimmed.slice(1, -1), quote);
    }
  }
  return raw;
}

function unescapeEnvValue(inner: string, quote: '"' | "'"): string {
  let out = "";
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "\\" && i + 1 < inner.length) {
      const next = inner[++i];
      if (next === "n") out += "\n";
      else if (next === "t") out += "\t";
      else if (next === "r") out += "\r";
      else if (quote === '"' && next === '"') out += '"';
      else if (quote === "'" && next === "'") out += "'";
      else out += next;
    } else {
      out += inner[i];
    }
  }
  return out;
}

/** Quote value when it contains whitespace or special characters. Empty stays unquoted (KEY=). */
export function serializeEnvValue(value: string): string {
  if (value === "") return "";
  if (/[\s#="'\\]/.test(value)) {
    return `"${value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")}"`;
  }
  return value;
}

export function parseEnvFile(content: string): EnvLine[] {
  const raw = content.endsWith("\n") ? content.slice(0, -1) : content;
  return raw.split("\n").map((line): EnvLine => {
    const trimmed = line.trim();
    if (trimmed === "") return { type: "blank" };
    if (trimmed.startsWith("#")) return { type: "comment", text: line };
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) return { type: "comment", text: line };
    // Preserve leading/trailing spaces on the key segment (e.g. " DB_HOST=...")
    const key = line.slice(0, eqIdx);
    const value = parseEnvValue(line.slice(eqIdx + 1));
    return { type: "var", key, value };
  });
}

export function serializeEnvFile(lines: EnvLine[]): string {
  return (
    lines
      .map((line) => {
        if (line.type === "comment") return line.text;
        if (line.type === "blank") return "";
        return `${line.key}=${serializeEnvValue(line.value)}`;
      })
      .join("\n") + "\n"
  );
}

export function buildVarMapFromLines(lines: EnvLine[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of lines) {
    if (line.type === "var") map.set(envKeyName(line.key), line.value);
  }
  return map;
}

/** Logical name used for validation, hints, and duplicate checks. */
export function envKeyName(key: string): string {
  return key.trim();
}

export function findEnvValidationError(lines: EnvLine[]): string | null {
  const keys: string[] = [];
  for (const line of lines) {
    if (line.type === "var") {
      const name = envKeyName(line.key);
      if (!name) return "Variable key cannot be empty";
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
        return `Invalid variable name: ${name}`;
      keys.push(name);
    }
  }
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) return `Duplicate variable key: ${k}`;
    seen.add(k);
  }
  return null;
}
