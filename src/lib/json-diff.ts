export type DiffChangeType = "added" | "removed" | "changed";

export interface DiffLine {
  path: string;
  type: DiffChangeType;
  oldValue?: string;
  newValue?: string;
  isString?: boolean;
}

function stringify(val: unknown): string {
  if (val === undefined) return "";
  if (typeof val === "object" && val !== null) {
    return JSON.stringify(val, null, 2);
  }
  return String(val);
}

function isSimpleValue(val: unknown): boolean {
  return (
    val === null ||
    val === undefined ||
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  );
}

export function computeJsonDiff(
  before: unknown,
  after: unknown,
  basePath = ""
): DiffLine[] {
  if (before === null || before === undefined) {
    if (after === null || after === undefined) return [];
    return [
      {
        path: basePath || "(root)",
        type: "added",
        newValue: stringify(after),
        isString: typeof after === "string",
      },
    ];
  }
  if (after === null || after === undefined) {
    return [
      {
        path: basePath || "(root)",
        type: "removed",
        oldValue: stringify(before),
        isString: typeof before === "string",
      },
    ];
  }

  if (before === after) return [];

  const beforeIsObj =
    typeof before === "object" && !Array.isArray(before);
  const afterIsObj =
    typeof after === "object" && !Array.isArray(after);

  if (beforeIsObj && afterIsObj) {
    const beforeObj = before as Record<string, unknown>;
    const afterObj = after as Record<string, unknown>;
    const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    const lines: DiffLine[] = [];

    for (const key of keys) {
      const path = basePath ? `${basePath}.${key}` : key;
      if (!(key in beforeObj)) {
        lines.push({
          path,
          type: "added",
          newValue: stringify(afterObj[key]),
          isString: typeof afterObj[key] === "string",
        });
      } else if (!(key in afterObj)) {
        lines.push({
          path,
          type: "removed",
          oldValue: stringify(beforeObj[key]),
          isString: typeof beforeObj[key] === "string",
        });
      } else {
        lines.push(...computeJsonDiff(beforeObj[key], afterObj[key], path));
      }
    }
    return lines;
  }

  const beforeIsArr = Array.isArray(before);
  const afterIsArr = Array.isArray(after);

  if (beforeIsArr && afterIsArr) {
    const bArr = before as unknown[];
    const aArr = after as unknown[];
    const maxLen = Math.max(bArr.length, aArr.length);
    const lines: DiffLine[] = [];

    for (let i = 0; i < maxLen; i++) {
      const path = basePath ? `${basePath}[${i}]` : `[${i}]`;
      if (i >= bArr.length) {
        lines.push({
          path,
          type: "added",
          newValue: stringify(aArr[i]),
          isString: isSimpleValue(aArr[i]),
        });
      } else if (i >= aArr.length) {
        lines.push({
          path,
          type: "removed",
          oldValue: stringify(bArr[i]),
          isString: isSimpleValue(bArr[i]),
        });
      } else {
        lines.push(...computeJsonDiff(bArr[i], aArr[i], path));
      }
    }
    return lines;
  }

  if (stringify(before) !== stringify(after)) {
    return [
      {
        path: basePath || "(root)",
        type: "changed",
        oldValue: stringify(before),
        newValue: stringify(after),
        isString:
          typeof before === "string" && typeof after === "string",
      },
    ];
  }

  return [];
}

// ── Word-level diff (client-side rendering helper) ────────────────────────────

export type WordToken = { text: string; type: "equal" | "added" | "removed" };

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function backtrack(dp: number[][], a: string[], b: string[], i: number, j: number): WordToken[] {
  if (i === 0 && j === 0) return [];
  if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
    return [...backtrack(dp, a, b, i - 1, j - 1), { text: a[i - 1], type: "equal" }];
  }
  if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
    return [...backtrack(dp, a, b, i, j - 1), { text: b[j - 1], type: "added" }];
  }
  return [...backtrack(dp, a, b, i - 1, j), { text: a[i - 1], type: "removed" }];
}

export function wordDiff(before: string, after: string): WordToken[] {
  const aWords = before.split(/(\s+)/);
  const bWords = after.split(/(\s+)/);
  const dp = lcs(aWords, bWords);
  return backtrack(dp, aWords, bWords, aWords.length, bWords.length);
}
