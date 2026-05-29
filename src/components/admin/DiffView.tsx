"use client";

import { wordDiff, computeJsonDiff } from "@/lib/json-diff";
import type { DiffLine } from "@/lib/json-diff";

export { computeJsonDiff };
export type { DiffLine };

const diffTypeStyles: Record<string, string> = {
  added: "text-green-400",
  removed: "text-red-400",
  changed: "text-amber-400",
};

const diffTypeLabel: Record<string, string> = {
  added: "NEU",
  removed: "ENTFERNT",
  changed: "GEÄNDERT",
};

function InlineWordDiff({ before, after }: { before: string; after: string }) {
  const tokens = wordDiff(before, after);
  return (
    <p className="text-xs font-mono text-brand-text whitespace-pre-wrap break-all leading-relaxed">
      {tokens.map((token, i) => {
        if (token.type === "equal") {
          return (
            <span key={i} className="text-brand-muted">
              {token.text}
            </span>
          );
        }
        if (token.type === "removed") {
          return (
            <span key={i} className="bg-red-500/20 text-red-300 line-through rounded px-0.5">
              {token.text}
            </span>
          );
        }
        return (
          <span key={i} className="bg-green-500/20 text-green-300 rounded px-0.5">
            {token.text}
          </span>
        );
      })}
    </p>
  );
}

function DiffLineItem({ line }: { line: DiffLine }) {
  return (
    <li className="rounded-lg border border-brand-border bg-brand-bg/50 overflow-hidden text-xs">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-brand-border bg-brand-card/30">
        <span
          className={`font-semibold uppercase tracking-wide text-[10px] ${diffTypeStyles[line.type]}`}
        >
          {diffTypeLabel[line.type]}
        </span>
        <span className="text-brand-muted font-mono">{line.path}</span>
      </div>
      <div className="p-3">
        {line.type === "removed" && line.oldValue && (
          <pre className="text-red-300/90 whitespace-pre-wrap break-all font-mono line-through opacity-80">
            {line.oldValue}
          </pre>
        )}
        {line.type === "added" && line.newValue && (
          <pre className="text-green-300/90 whitespace-pre-wrap break-all font-mono">
            {line.newValue}
          </pre>
        )}
        {line.type === "changed" &&
          line.oldValue !== undefined &&
          line.newValue !== undefined &&
          (line.isString ? (
            <InlineWordDiff before={line.oldValue} after={line.newValue} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-brand-muted text-[10px] uppercase tracking-wide block mb-1">
                  Before
                </span>
                <pre className="text-red-300/80 whitespace-pre-wrap break-all font-mono">
                  {line.oldValue}
                </pre>
              </div>
              <div>
                <span className="text-brand-muted text-[10px] uppercase tracking-wide block mb-1">
                  After
                </span>
                <pre className="text-green-300/80 whitespace-pre-wrap break-all font-mono">
                  {line.newValue}
                </pre>
              </div>
            </div>
          ))}
      </div>
    </li>
  );
}

interface DiffViewProps {
  lines: DiffLine[];
  isInitial?: boolean;
  maxHeight?: string;
}

export function DiffView({ lines, isInitial = false, maxHeight = "max-h-[28rem]" }: DiffViewProps) {
  if (isInitial) {
    return (
      <p className="text-sm text-brand-muted py-2">First save for this section.</p>
    );
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-brand-muted py-2">No structural changes detected.</p>
    );
  }

  return (
    <ul className={`space-y-2 overflow-y-auto pr-1 ${maxHeight}`}>
      {lines.map((line, i) => (
        <DiffLineItem key={`${line.path}-${line.type}-${i}`} line={line} />
      ))}
    </ul>
  );
}
