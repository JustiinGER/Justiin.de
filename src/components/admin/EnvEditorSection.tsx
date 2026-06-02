"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FilePlus,
  LayoutList,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { getAdminToken } from "@/lib/admin-session.client";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { CRITICAL_ENV_KEYS, isCriticalEnvKey } from "@/lib/env-critical";
import {
  type EnvLine,
  envKeyName,
  parseEnvFile,
  serializeEnvFile,
  findEnvValidationError,
} from "@/lib/env-file";
import type { MissingTemplateVar } from "@/lib/env-template";

type EditorView = "form" | "raw";

// ============================================================
// Types
// ============================================================

type LineWithId = EnvLine & { id: string };

type VarChange =
  | { kind: "added"; key: string; value: string; sensitive: boolean }
  | { kind: "removed"; key: string; sensitive: boolean }
  | { kind: "changed"; key: string; sensitive: boolean; oldValue: string; newValue: string };

// ============================================================
// Utilities
// ============================================================

let _nextId = 0;
const uid = () => `el-${++_nextId}`;

function withIds(lines: EnvLine[]): LineWithId[] {
  return lines.map((l) => ({ ...l, id: uid() }));
}

const SENSITIVE_PATTERNS = [
  "PASSWORD", "SECRET", "KEY", "TOKEN", "PASS", "AUTH", "CREDENTIAL", "PRIVATE",
];

function isSensitive(key: string): boolean {
  const u = key.toUpperCase();
  return SENSITIVE_PATTERNS.some((p) => u.includes(p));
}

function canGenerate(key: string): boolean {
  return key.toUpperCase().includes("SECRET");
}

function generateSecret(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildVarMap(lines: LineWithId[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const l of lines) {
    if (l.type === "var" && envKeyName(l.key)) map.set(envKeyName(l.key), l.value);
  }
  return map;
}

function getCriticalRemovals(original: LineWithId[], current: LineWithId[]): string[] {
  const before = buildVarMap(original);
  const after = buildVarMap(current);
  const removed: string[] = [];
  for (const key of CRITICAL_ENV_KEYS) {
    const beforeVal = before.get(key);
    if (beforeVal === undefined || beforeVal.trim() === "") continue;
    const afterVal = after.get(key);
    if (afterVal === undefined || afterVal.trim() === "") removed.push(key);
  }
  return removed;
}

function originalValueForKey(original: LineWithId[], key: string): string | undefined {
  const name = envKeyName(key);
  for (const l of original) {
    if (l.type === "var" && envKeyName(l.key) === name) return l.value;
  }
  return undefined;
}

// ============================================================
// Form layout blocks (file order; blanks and comments stay in state but are not shown in form)
// ============================================================

function isFenceLine(l: LineWithId): boolean {
  return l.type === "comment" && /^#\s*={4,}/.test(l.text.trim());
}

function isFenceStart(lines: LineWithId[], i: number): boolean {
  return (
    i + 2 < lines.length &&
    isFenceLine(lines[i]) &&
    lines[i + 1].type === "comment" &&
    !isFenceLine(lines[i + 1]) &&
    isFenceLine(lines[i + 2])
  );
}

type FormBlock =
  | { kind: "preamble"; id: string; lines: LineWithId[] }
  | { kind: "section"; id: string; title: string; lines: LineWithId[] };

function buildFormBlocks(lines: LineWithId[]): FormBlock[] {
  const blocks: FormBlock[] = [];
  let i = 0;
  let blockIdx = 0;

  const pushPreamble = (chunk: LineWithId[]) => {
    if (chunk.length === 0) return;
    blocks.push({ kind: "preamble", id: `p${blockIdx++}`, lines: chunk });
  };

  const preamble: LineWithId[] = [];
  while (i < lines.length && !isFenceStart(lines, i)) {
    preamble.push(lines[i++]);
  }
  pushPreamble(preamble);

  while (i < lines.length) {
    if (!isFenceStart(lines, i)) {
      const orphan: LineWithId[] = [];
      while (i < lines.length && !isFenceStart(lines, i)) {
        orphan.push(lines[i++]);
      }
      pushPreamble(orphan);
      continue;
    }

    const titleLine = lines[i + 1];
    const title =
      titleLine.type === "comment"
        ? titleLine.text.trim().replace(/^#\s*/, "").trim()
        : "Variables";
    i += 3;

    const sectionLines: LineWithId[] = [];
    while (i < lines.length && !isFenceStart(lines, i)) {
      sectionLines.push(lines[i++]);
    }

    blocks.push({
      kind: "section",
      id: `s${blockIdx++}`,
      title: title || "Variables",
      lines: sectionLines,
    });
  }

  return blocks;
}

// ============================================================
// Change diff
// ============================================================

function computeChanges(original: LineWithId[], current: LineWithId[]): VarChange[] {
  const origMap = new Map<string, string>();
  for (const l of original) if (l.type === "var") origMap.set(envKeyName(l.key), l.value);

  const currMap = new Map<string, string>();
  for (const l of current) if (l.type === "var") currMap.set(envKeyName(l.key), l.value);

  const changes: VarChange[] = [];

  for (const [key, value] of currMap) {
    const sensitive = isSensitive(key);
    if (!origMap.has(key)) {
      changes.push({ kind: "added", key, value, sensitive });
    } else if (origMap.get(key) !== value) {
      changes.push({ kind: "changed", key, sensitive, oldValue: origMap.get(key)!, newValue: value });
    }
  }
  for (const [key] of origMap) {
    if (!currMap.has(key)) changes.push({ kind: "removed", key, sensitive: isSensitive(key) });
  }

  return changes;
}

// ============================================================
// Shared input styles
// ============================================================

const inputBase =
  "block w-full rounded-lg border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder-brand-muted transition-colors focus:outline-none focus:ring-2";
const inputNormal = `${inputBase} border-brand-border focus:border-brand-accent/50 focus:ring-brand-accent/50`;
const inputError = `${inputBase} border-red-500/40 focus:border-red-500/40 focus:ring-red-500/30`;

// ============================================================
// VarRow
// ============================================================

function VarRow({
  line,
  hint,
  isDuplicate,
  hasDuplicateValue,
  isProtected,
  onChange,
  onDelete,
  onGenerate,
  onRequestProtectedDelete,
}: {
  line: LineWithId & { type: "var" };
  hint?: string;
  isDuplicate: boolean;
  hasDuplicateValue: boolean;
  isProtected: boolean;
  onChange: (id: string, field: "key" | "value", val: string) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  onRequestProtectedDelete: (id: string, key: string, action: "delete" | "clear") => void;
}) {
  const [hidden, setHidden] = useState(() => isSensitive(envKeyName(line.key)));
  const keyInvalid =
    line.key !== "" && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(envKeyName(line.key));
  const showKeyError = keyInvalid || isDuplicate;
  const keyId = useId();
  const valId = useId();
  const critical = isCriticalEnvKey(envKeyName(line.key));
  const sensitive = isSensitive(envKeyName(line.key));
  const needsGenerator = canGenerate(envKeyName(line.key));

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_4.75rem] md:gap-2 md:items-start">
        <div>
          <label htmlFor={keyId} className="mb-1 block text-xs font-medium text-brand-muted md:sr-only">
            Key
          </label>
          <div className="relative">
            <input
              id={keyId}
              type="text"
              value={line.key}
              onChange={(e) => onChange(line.id, "key", e.target.value)}
              placeholder="VARIABLE_NAME"
              className={`${showKeyError ? inputError : inputNormal} font-mono ${critical ? "pr-8" : ""}`}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={showKeyError}
            />
            {critical && (
              <Lock
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-400/80"
                aria-hidden
              />
            )}
          </div>
          {isDuplicate && (
            <p className="mt-0.5 text-xs text-red-400" role="alert">
              Duplicate key
            </p>
          )}
          {isProtected && (
            <p className="mt-0.5 text-xs text-amber-400/90">Protected — confirm to remove or clear</p>
          )}
        </div>

        <div>
          <label htmlFor={valId} className="mb-1 block text-xs font-medium text-brand-muted md:sr-only">
            Value
          </label>
          <div className="relative">
            <input
              id={valId}
              type={hidden ? "password" : "text"}
              value={line.value}
              onChange={(e) => onChange(line.id, "value", e.target.value)}
              placeholder="value"
              className={`${hasDuplicateValue ? inputError : inputNormal} font-mono ${sensitive ? "pr-9" : ""}`}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={hasDuplicateValue}
            />
            {sensitive && (
              <button
                type="button"
                onClick={() => setHidden((h) => !h)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors"
                aria-label={hidden ? "Show value" : "Hide value"}
              >
                {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            )}
          </div>
          {hasDuplicateValue && (
            <p className="mt-0.5 text-xs text-amber-400" role="alert">
              Same value as another variable
            </p>
          )}
        </div>

        <div className="flex w-[4.75rem] items-center justify-end gap-1">
          {needsGenerator && (
            <button
              type="button"
              onClick={() => onGenerate(line.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
              aria-label={`Generate secret for ${line.key || "variable"}`}
              title="Generate random secret"
            >
              <Wand2 className="h-4 w-4" />
            </button>
          )}
          {!needsGenerator && <span className="h-9 w-9" aria-hidden />}
          <button
            type="button"
            onClick={() => {
              if (isProtected) {
                onRequestProtectedDelete(line.id, line.key.trim(), "delete");
              } else {
                onDelete(line.id);
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
            aria-label={`Delete ${line.key || "variable"}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {hint && (
        <p className="text-xs leading-relaxed text-brand-muted/90">{hint}</p>
      )}
    </div>
  );
}

// ============================================================
// CriticalKeyConfirmModal
// ============================================================

function CriticalKeyConfirmModal({
  keyName,
  action,
  onConfirm,
  onCancel,
}: {
  keyName: string;
  action: "delete" | "clear";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onCancel]);

  const verb = action === "delete" ? "delete" : "clear the value of";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="critical-key-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-brand-card shadow-2xl">
        <div className="border-b border-brand-border p-5">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <h2 id="critical-key-title" className="text-sm font-semibold text-brand-text">
              Protected variable
            </h2>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-sm text-brand-muted">
            You are about to {verb}{" "}
            <code className="rounded bg-brand-border/60 px-1 py-0.5 font-mono text-brand-text">
              {keyName}
            </code>
            . This can invalidate admin sessions and break authentication until you set a new
            secret and restart the server.
          </p>
          <p className="text-sm text-brand-muted">
            You will still need your password and an explicit acknowledgment when saving.
          </p>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            I understand, continue
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SaveConfirmModal
// ============================================================

function ChangeBadge({ kind }: { kind: VarChange["kind"] }) {
  const cls = {
    added: "border-green-500/20 bg-green-500/10 text-green-400",
    removed: "border-red-500/20 bg-red-500/10 text-red-400",
    changed: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  }[kind];
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {kind}
    </span>
  );
}

function SaveConfirmModal({
  changes,
  criticalRemovals,
  password,
  passwordError,
  criticalAcknowledged,
  isSaving,
  onPasswordChange,
  onCriticalAcknowledgedChange,
  onConfirm,
  onCancel,
}: {
  changes: VarChange[];
  criticalRemovals: string[];
  password: string;
  passwordError: string;
  criticalAcknowledged: boolean;
  isSaving: boolean;
  onPasswordChange: (value: string) => void;
  onCriticalAcknowledgedChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const hasSensitive = changes.some((c) => c.sensitive);
  const needsCriticalAck = criticalRemovals.length > 0;
  const canConfirm =
    password.trim().length > 0 && (!needsCriticalAck || criticalAcknowledged);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onCancel();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isSaving, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="env-confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (!isSaving) onCancel(); }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-brand-border bg-brand-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-border p-5">
          <div className="flex items-center gap-2.5">
            {hasSensitive && <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />}
            <h2 id="env-confirm-title" className="text-sm font-semibold text-brand-text">
              Save {changes.length} change{changes.length !== 1 ? "s" : ""} to .env.local?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { if (!isSaving) onCancel(); }}
            className="text-brand-muted hover:text-brand-text transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-4 space-y-1.5">
          {changes.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg border border-brand-border/50 bg-brand-bg/50 px-3 py-2"
            >
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-brand-text">
                {c.key}
              </code>
              <ChangeBadge kind={c.kind} />
              {c.kind === "changed" && (
                <span className="shrink-0 text-xs text-brand-muted">
                  {c.sensitive ? "•••" : `"${c.oldValue}"`}
                  {" → "}
                  {c.sensitive ? "•••" : `"${c.newValue}"`}
                </span>
              )}
            </div>
          ))}
        </div>

        {hasSensitive && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Sensitive values are masked. Double-check before confirming.
          </div>
        )}

        {needsCriticalAck && (
          <div className="mx-4 mb-3 space-y-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
            <p className="font-medium">
              You are removing or clearing protected keys: {criticalRemovals.join(", ")}
            </p>
            <label className="flex cursor-pointer items-start gap-2 text-brand-text">
              <input
                type="checkbox"
                checked={criticalAcknowledged}
                onChange={(e) => onCriticalAcknowledgedChange(e.target.checked)}
                className="mt-0.5 rounded border-brand-border"
              />
              <span className="text-xs text-brand-muted">
                I understand this may invalidate admin sessions and require setting a new secret.
              </span>
            </label>
          </div>
        )}

        <div className="space-y-1.5 px-4 pb-3">
          <label htmlFor="env-save-password" className="block text-sm font-medium text-brand-text">
            Current password
          </label>
          <input
            id="env-save-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
            placeholder="Required to save"
            className={passwordError ? inputError : inputNormal}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "env-save-password-error" : undefined}
          />
          {passwordError && (
            <p id="env-save-password-error" className="text-xs text-red-400" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-4 pb-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || !canConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            ) : (
              <><Save className="h-4 w-4" />Confirm Save</>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted hover:text-brand-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ResetConfirmModal
// ============================================================

function ResetConfirmModal({
  password,
  passwordError,
  isResetting,
  onPasswordChange,
  onConfirm,
  onCancel,
}: {
  password: string;
  passwordError: string;
  isResetting: boolean;
  onPasswordChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-brand-card shadow-2xl">
        <div className="border-b border-brand-border p-5">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="h-5 w-5 shrink-0 text-red-400" />
            <h2 id="reset-modal-title" className="text-sm font-semibold text-brand-text">
              Reset to example defaults
            </h2>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-brand-muted">
            This will <strong className="text-brand-text">overwrite your entire{" "}
            <code className="rounded bg-brand-border/60 px-1 py-0.5 font-mono text-xs">.env.local</code></strong>{" "}
            with the contents of{" "}
            <code className="rounded bg-brand-border/60 px-1 py-0.5 font-mono text-xs">.env.local.example</code>.
            All current values — including secrets, passwords, and endpoints — will be lost.
          </p>
          <p className="text-sm text-brand-muted">
            Consider downloading a backup first.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-muted">
              Current password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password to confirm"
              className={`${passwordError ? "border-red-500/40 focus:border-red-500/40 focus:ring-red-500/30" : "border-brand-border focus:border-brand-accent/50 focus:ring-brand-accent/50"} block w-full rounded-lg border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder-brand-muted transition-colors focus:outline-none focus:ring-2`}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter" && password) onConfirm(); }}
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-400" role="alert">{passwordError}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isResetting || !password}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResetting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Resetting…</>
            ) : (
              <><RotateCcw className="h-4 w-4" />Reset to defaults</>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isResetting}
            className="rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted hover:text-brand-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EnvEditorSection
// ============================================================

function stripIds(lines: LineWithId[]): EnvLine[] {
  return lines.map(({ id: _id, ...rest }) => rest as EnvLine);
}

const SECTION_FENCE = "# ============================================";
const MISC_SECTION_TITLE = "Misc";

function addNewVarToMiscSection(lines: LineWithId[]): LineWithId[] {
  const next = [...lines];
  const newVar: LineWithId = { type: "var", key: "", value: "", id: uid() };

  let i = 0;
  while (i < next.length) {
    if (!isFenceStart(next, i)) {
      i += 1;
      continue;
    }

    const titleLine = next[i + 1];
    const title =
      titleLine.type === "comment"
        ? titleLine.text.trim().replace(/^#\s*/, "").trim().toLowerCase()
        : "";

    i += 3;
    while (i < next.length && !isFenceStart(next, i)) i += 1;

    if (title === MISC_SECTION_TITLE.toLowerCase()) {
      const insertAt = i;
      const toInsert: LineWithId[] = [];
      if (insertAt > 0 && next[insertAt - 1].type !== "blank") {
        toInsert.push({ type: "blank", id: uid() });
      }
      toInsert.push(newVar);
      next.splice(insertAt, 0, ...toInsert);
      return next;
    }
  }

  if (next.length > 0 && next[next.length - 1].type !== "blank") {
    next.push({ type: "blank", id: uid() });
  }
  next.push({ type: "comment", text: SECTION_FENCE, id: uid() });
  next.push({ type: "comment", text: `# ${MISC_SECTION_TITLE}`, id: uid() });
  next.push({ type: "comment", text: SECTION_FENCE, id: uid() });
  next.push(newVar);
  return next;
}

function appendMissingTemplateVars(
  lines: LineWithId[],
  missing: MissingTemplateVar[]
): LineWithId[] {
  if (missing.length === 0) return lines;

  const next = [...lines];
  if (next.length > 0 && next[next.length - 1].type !== "blank") {
    next.push({ type: "blank", id: uid() });
  }
  next.push({
    type: "comment",
    text: "# Added from .env.local.example",
    id: uid(),
  });
  for (const item of missing) {
    next.push({
      type: "var",
      key: item.key,
      value: item.defaultValue,
      id: uid(),
    });
  }
  return next;
}

function MissingFromTemplatePanel({
  items,
  onAddAll,
  onAddOne,
}: {
  items: MissingTemplateVar[];
  onAddAll: () => void;
  onAddOne: (item: MissingTemplateVar) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-brand-accent/25 bg-brand-accent/5 p-4">
      <div className="flex items-start gap-2">
        <FilePlus className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-text">
            {items.length} variable{items.length !== 1 ? "s" : ""} in{" "}
            <code className="rounded bg-brand-border/60 px-1 py-0.5 text-xs font-mono">
              .env.local.example
            </code>{" "}
            not in your file
          </p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex flex-col gap-2 rounded-lg border border-brand-border/50 bg-brand-bg/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <code className="font-mono text-sm text-brand-text">{item.key}</code>
                  {item.defaultValue !== "" && (
                    <span className="ml-2 text-xs text-brand-muted">
                      default:{" "}
                      <span className="font-mono">
                        {item.defaultValue.length > 40
                          ? `${item.defaultValue.slice(0, 40)}…`
                          : item.defaultValue}
                      </span>
                    </span>
                  )}
                  {item.hint && (
                    <p className="mt-1 text-xs leading-relaxed text-brand-muted">{item.hint}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onAddOne(item)}
                  className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onAddAll}
            className="mt-3 rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-accent/90"
          >
            Add all {items.length} missing
          </button>
        </div>
      </div>
    </div>
  );
}

export function EnvEditorSection() {
  const [lines, setLines] = useState<LineWithId[]>([]);
  const [original, setOriginal] = useState<LineWithId[]>([]);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [missingFromTemplate, setMissingFromTemplate] = useState<MissingTemplateVar[]>([]);
  const [rawExample, setRawExample] = useState("");
  const [viewMode, setViewMode] = useState<EditorView>("form");
  const [rawText, setRawText] = useState("");
  const [originalRaw, setOriginalRaw] = useState("");
  const [modeError, setModeError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<VarChange[] | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [pendingCritical, setPendingCritical] = useState<{
    id: string;
    key: string;
    action: "delete" | "clear";
  } | null>(null);
  const [savePassword, setSavePassword] = useState("");
  const [savePasswordError, setSavePasswordError] = useState("");
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const formDirty = JSON.stringify(lines) !== JSON.stringify(original);
  const rawDirty = rawText !== originalRaw;
  const isDirty = viewMode === "raw" ? rawDirty : formDirty;

  useUnsavedChangesGuard(isDirty);

  const duplicateKeys = useMemo<Set<string>>(() => {
    const seen = new Map<string, string[]>();
    for (const l of lines) {
      if (l.type === "var" && envKeyName(l.key)) {
        const k = envKeyName(l.key);
        seen.set(k, [...(seen.get(k) ?? []), l.id]);
      }
    }
    const dupes = new Set<string>();
    for (const ids of seen.values()) {
      if (ids.length > 1) ids.forEach((id) => dupes.add(id));
    }
    return dupes;
  }, [lines]);

  const duplicateValueIds = useMemo<Set<string>>(() => {
    const valueToIds = new Map<string, string[]>();
    for (const l of lines) {
      if (l.type === "var" && l.value.trim()) {
        valueToIds.set(l.value, [...(valueToIds.get(l.value) ?? []), l.id]);
      }
    }
    const dupes = new Set<string>();
    for (const ids of valueToIds.values()) {
      if (ids.length > 1) ids.forEach((id) => dupes.add(id));
    }
    return dupes;
  }, [lines]);

  const hasInvalidVars = useMemo(
    () =>
      lines.some(
        (l) =>
          l.type === "var" &&
          (!envKeyName(l.key) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(envKeyName(l.key)))
      ),
    [lines]
  );

  const formBlocks = useMemo(() => buildFormBlocks(lines), [lines]);

  const activeMissingFromTemplate = useMemo(() => {
    const localKeys = new Set<string>();
    for (const l of lines) {
      if (l.type === "var") {
        const name = envKeyName(l.key);
        if (name) localKeys.add(name);
      }
    }
    return missingFromTemplate.filter((m) => !localKeys.has(envKeyName(m.key)));
  }, [lines, missingFromTemplate]);

  const criticalRemovals = useMemo(() => {
    if (!pendingChanges) return [];
    const effective =
      viewMode === "raw" ? withIds(parseEnvFile(rawText)) : lines;
    return getCriticalRemovals(original, effective);
  }, [pendingChanges, original, viewMode, lines, rawText]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setModeError("");
    try {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/env", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const data = (await res.json()) as {
        lines: EnvLine[];
        hints?: Record<string, string>;
        raw?: string;
        missingFromTemplate?: MissingTemplateVar[];
        rawExample?: string;
      };
      const loaded = withIds(data.lines);
      const raw = data.raw ?? serializeEnvFile(data.lines);
      setHints(data.hints ?? {});
      setMissingFromTemplate(data.missingFromTemplate ?? []);
      setRawExample(data.rawExample ?? "");
      setLines(loaded);
      setOriginal(loaded);
      setRawText(raw);
      setOriginalRaw(raw);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load .env.local");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyLineUpdate = useCallback((id: string, field: "key" | "value", val: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id && l.type === "var" ? { ...l, [field]: val } : l))
    );
    setSaveSuccess(false);
    setSaveError("");
  }, []);

  const handleChange = useCallback(
    (id: string, field: "key" | "value", val: string) => {
      if (field === "value") {
        const line = lines.find((l) => l.id === id);
        if (line?.type === "var" && isCriticalEnvKey(envKeyName(line.key))) {
          const orig = originalValueForKey(original, line.key);
          if (orig !== undefined && orig.trim() !== "" && val.trim() === "") {
            setPendingCritical({ id, key: envKeyName(line.key), action: "clear" });
            return;
          }
        }
      }
      applyLineUpdate(id, field, val);
    },
    [lines, original, applyLineUpdate]
  );

  const handleDelete = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setSaveSuccess(false);
    setSaveError("");
  }, []);

  const handleRequestProtectedDelete = useCallback(
    (id: string, key: string, action: "delete" | "clear") => {
      setPendingCritical({ id, key, action });
    },
    []
  );

  const handleConfirmProtectedAction = useCallback(() => {
    if (!pendingCritical) return;
    if (pendingCritical.action === "delete") {
      handleDelete(pendingCritical.id);
    } else {
      applyLineUpdate(pendingCritical.id, "value", "");
    }
    setPendingCritical(null);
  }, [pendingCritical, handleDelete, applyLineUpdate]);

  const handleGenerate = useCallback((id: string) => {
    applyLineUpdate(id, "value", generateSecret());
  }, [applyLineUpdate]);

  const handleDownload = () => {
    const content = originalRaw || serializeEnvFile(stripIds(original));
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env.local.backup";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmReset = async () => {
    if (!resetPassword) return;
    setIsResetting(true);
    setResetPasswordError("");
    try {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/env", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ rawContent: rawExample, currentPassword: resetPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setResetPasswordError(json.error ?? "Incorrect password");
        } else {
          setResetPasswordError(json.error ?? "Reset failed");
        }
        return;
      }
      setShowResetConfirm(false);
      setResetPassword("");
      setResetPasswordError("");
      await load();
    } catch {
      setResetPasswordError("Reset failed — please try again");
    } finally {
      setIsResetting(false);
    }
  };

  const handleAdd = () => {
    setLines((prev) => addNewVarToMiscSection(prev));
    setCollapsedSections(new Set());
    setSaveSuccess(false);
    setSaveError("");
  };

  const handleAddMissingFromTemplate = (items: MissingTemplateVar[]) => {
    if (items.length === 0) return;
    setLines((prev) => appendMissingTemplateVars(prev, items));
    setCollapsedSections(new Set());
    setSaveSuccess(false);
    setSaveError("");
  };

  const visibleFormLines = (blockLines: LineWithId[]): (LineWithId & { type: "var" })[] =>
    blockLines.filter((l): l is LineWithId & { type: "var" } => l.type === "var");

  const renderFormLine = (line: LineWithId & { type: "var" }) => {
    const origVal = originalValueForKey(original, line.key);
    const isProtected =
      isCriticalEnvKey(envKeyName(line.key)) &&
      origVal !== undefined &&
      origVal.trim() !== "";

    return (
      <VarRow
        key={line.id}
        line={line}
        hint={hints[envKeyName(line.key)]}
        isDuplicate={duplicateKeys.has(line.id)}
        hasDuplicateValue={duplicateValueIds.has(line.id)}
        isProtected={isProtected}
        onChange={handleChange}
        onDelete={handleDelete}
        onGenerate={handleGenerate}
        onRequestProtectedDelete={handleRequestProtectedDelete}
      />
    );
  };

  const handleReset = () => {
    if (viewMode === "raw") {
      setRawText(originalRaw);
    } else {
      setLines(original.map((l) => ({ ...l })));
    }
    setSaveSuccess(false);
    setSaveError("");
    setModeError("");
    setPendingChanges(null);
    setSavePassword("");
    setSavePasswordError("");
    setCriticalAcknowledged(false);
    setPendingCritical(null);
  };

  const switchToRaw = () => {
    setRawText(serializeEnvFile(stripIds(lines)));
    setViewMode("raw");
    setModeError("");
    setSaveError("");
  };

  const switchToForm = () => {
    const parsed = parseEnvFile(rawText);
    const validationError = findEnvValidationError(parsed);
    if (validationError) {
      setModeError(validationError);
      return;
    }
    setLines(withIds(parsed));
    setModeError("");
    setSaveError("");
    setViewMode("form");
  };

  const getEffectiveLines = useCallback((): LineWithId[] => {
    if (viewMode === "form") return lines;
    const parsed = parseEnvFile(rawText);
    return withIds(parsed);
  }, [viewMode, lines, rawText]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRequestSave = () => {
    const effectiveLines = getEffectiveLines();

    if (viewMode === "raw") {
      const validationError = findEnvValidationError(stripIds(effectiveLines));
      if (validationError) {
        setSaveError(validationError);
        return;
      }
    } else {
      if (hasInvalidVars) {
        setSaveError("Fix invalid variable names before saving.");
        return;
      }
      if (duplicateKeys.size > 0) {
        setSaveError("Remove duplicate variable names before saving.");
        return;
      }
    }

    const changes = computeChanges(original, effectiveLines);
    if (changes.length === 0) return;
    setSaveError("");
    setSavePassword("");
    setSavePasswordError("");
    setCriticalAcknowledged(false);
    setPendingChanges(changes);
  };

  const handleConfirmSave = async () => {
    if (!savePassword.trim()) {
      setSavePasswordError("Enter your current password to save.");
      return;
    }

    const effectiveLines = getEffectiveLines();
    const removals = getCriticalRemovals(original, effectiveLines);
    if (removals.length > 0 && !criticalAcknowledged) {
      setSaveError("Acknowledge protected variable changes before saving.");
      return;
    }

    setSaveError("");
    setSavePasswordError("");
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const token = await getAdminToken();
      const body =
        viewMode === "raw"
          ? {
              rawContent: rawText,
              currentPassword: savePassword,
              ...(removals.length > 0 ? { confirmCriticalRemoval: removals } : {}),
            }
          : {
              lines: stripIds(lines),
              currentPassword: savePassword,
              ...(removals.length > 0 ? { confirmCriticalRemoval: removals } : {}),
            };

      const res = await fetch("/api/admin/env", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && data.error?.toLowerCase().includes("password")) {
          setSavePasswordError(data.error);
          return;
        }
        throw new Error(data.error ?? "Save failed");
      }

      if (viewMode === "raw") {
        const parsed = parseEnvFile(rawText);
        const loaded = withIds(parsed);
        setLines(loaded);
        setOriginal(loaded.map((l) => ({ ...l })));
        setOriginalRaw(rawText);
      } else {
        const serialized = serializeEnvFile(stripIds(lines));
        setOriginal(lines.map((l) => ({ ...l })));
        setRawText(serialized);
        setOriginalRaw(serialized);
      }

      setSaveSuccess(true);
      setPendingChanges(null);
      setSavePassword("");
      setCriticalAcknowledged(false);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setPendingChanges(null);
    } finally {
      setIsSaving(false);
    }
  };

  const rawValidationError = useMemo(() => {
    if (viewMode !== "raw") return null;
    return findEnvValidationError(parseEnvFile(rawText));
  }, [viewMode, rawText]);

  const canSave =
    isDirty &&
    (viewMode === "raw"
      ? !rawValidationError
      : !hasInvalidVars && duplicateKeys.size === 0);

  return (
    <>
      {pendingCritical && (
        <CriticalKeyConfirmModal
          keyName={pendingCritical.key}
          action={pendingCritical.action}
          onConfirm={handleConfirmProtectedAction}
          onCancel={() => setPendingCritical(null)}
        />
      )}

      {showResetConfirm && (
        <ResetConfirmModal
          password={resetPassword}
          passwordError={resetPasswordError}
          isResetting={isResetting}
          onPasswordChange={(v) => { setResetPassword(v); setResetPasswordError(""); }}
          onConfirm={handleConfirmReset}
          onCancel={() => { setShowResetConfirm(false); setResetPassword(""); setResetPasswordError(""); }}
        />
      )}

      {pendingChanges && (
        <SaveConfirmModal
          changes={pendingChanges}
          criticalRemovals={criticalRemovals}
          password={savePassword}
          passwordError={savePasswordError}
          criticalAcknowledged={criticalAcknowledged}
          isSaving={isSaving}
          onPasswordChange={(value) => {
            setSavePassword(value);
            setSavePasswordError("");
          }}
          onCriticalAcknowledgedChange={setCriticalAcknowledged}
          onConfirm={handleConfirmSave}
          onCancel={() => {
            setPendingChanges(null);
            setSavePassword("");
            setSavePasswordError("");
            setCriticalAcknowledged(false);
          }}
        />
      )}

      <section
        aria-label="Environment variables"
        className="rounded-2xl border border-brand-border bg-brand-card/50 p-4 md:p-6"
      >
        <div className="mb-4 md:mb-6 flex items-start gap-3">
          <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
            <FileCode2 className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-brand-text">
              Environment Variables
            </h2>
            <p className="mt-1 text-sm text-brand-muted">
              Edit{" "}
              <code className="rounded bg-brand-border/60 px-1 py-0.5 text-xs font-mono">
                .env.local
              </code>{" "}
              directly. Restart the server after saving for changes to take effect.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This file contains sensitive credentials. Changes are written directly to disk —
            double-check before saving.
          </span>
        </div>

        {!isLoading && !loadError && viewMode === "form" && activeMissingFromTemplate.length > 0 && (
          <div className="mb-4">
            <MissingFromTemplatePanel
              items={activeMissingFromTemplate}
              onAddAll={() => handleAddMissingFromTemplate(activeMissingFromTemplate)}
              onAddOne={(item) => handleAddMissingFromTemplate([item])}
            />
          </div>
        )}

        {!isLoading && !loadError && (
          <div
            className="mb-4 flex rounded-xl border border-brand-border p-1"
            role="tablist"
            aria-label="Editor mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "form"}
              onClick={() => {
                if (viewMode === "form") return;
                switchToForm();
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "form"
                  ? "bg-brand-accent text-brand-bg"
                  : "text-brand-muted hover:text-brand-text"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Form
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "raw"}
              onClick={() => {
                if (viewMode === "raw") return;
                switchToRaw();
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "raw"
                  ? "bg-brand-accent text-brand-bg"
                  : "text-brand-muted hover:text-brand-text"
              }`}
            >
              <FileCode2 className="h-4 w-4" />
              Raw file
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
          </div>
        ) : loadError ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {loadError}
            </p>
            <button
              type="button"
              onClick={load}
              className="rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {viewMode === "raw" ? (
              <>
                {modeError && (
                  <p
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    role="alert"
                  >
                    {modeError}
                  </p>
                )}
                {rawValidationError && !modeError && (
                  <p
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    role="alert"
                  >
                    {rawValidationError}
                  </p>
                )}
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setSaveSuccess(false);
                    setSaveError("");
                    setModeError("");
                  }}
                  spellCheck={false}
                  className={`${inputNormal} min-h-[min(24rem,60vh)] w-full resize-y font-mono text-xs leading-relaxed`}
                  aria-label="Raw .env.local content"
                />
                <p className="text-xs text-brand-muted">
                  Edit the full file. Use quotes for values with spaces (e.g.{" "}
                  <code className="rounded bg-brand-border/60 px-1">KEY=&quot;value here&quot;</code>
                  ). Switch to Form view to validate structure before saving.
                </p>
              </>
            ) : (
              <>
            {formBlocks.length === 0 ? (
              <p className="py-4 text-center text-sm text-brand-muted">No content in .env.local.</p>
            ) : (
              formBlocks.map((block) => {
                if (block.kind === "preamble") {
                  const visible = visibleFormLines(block.lines);
                  if (visible.length === 0) return null;
                  return (
                    <div
                      key={block.id}
                      className="space-y-2 rounded-xl border border-brand-border/40 bg-brand-bg/20 px-4 py-3"
                    >
                      <div className="space-y-2">{visible.map(renderFormLine)}</div>
                    </div>
                  );
                }

                const collapsed = collapsedSections.has(block.id);
                const visible = visibleFormLines(block.lines);
                const dupCount = visible.filter((l) => duplicateKeys.has(l.id)).length;

                if (visible.length === 0) return null;

                return (
                  <div
                    key={block.id}
                    className="overflow-hidden rounded-xl border border-brand-border/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(block.id)}
                      className="flex w-full items-center justify-between gap-3 bg-brand-bg/40 px-4 py-3 text-left transition-colors hover:bg-brand-bg/70"
                      aria-expanded={!collapsed}
                    >
                      <span className="truncate text-sm font-medium text-brand-text">
                        {block.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-2 text-brand-muted">
                        {dupCount > 0 && (
                          <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                            {dupCount} duplicate{dupCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-xs">
                          {visible.length} var{visible.length !== 1 ? "s" : ""}
                        </span>
                        {collapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {!collapsed && (
                      <div className="space-y-2 border-t border-brand-border/40 px-4 py-3">
                        {visible.length > 0 && (
                          <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto] md:gap-2 border-b border-brand-border/40 pb-1">
                            <span className="pl-1 text-xs font-medium uppercase tracking-wider text-brand-muted">
                              Key
                            </span>
                            <span className="pl-1 text-xs font-medium uppercase tracking-wider text-brand-muted">
                              Value
                            </span>
                            <span className="w-9" />
                          </div>
                        )}
                        {visible.length === 0 ? (
                          <p className="py-2 text-center text-sm text-brand-muted">
                            Empty section.
                          </p>
                        ) : (
                          <div className="space-y-2">{visible.map(renderFormLine)}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border px-4 py-2.5 text-sm text-brand-muted transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
            >
              <Plus className="h-4 w-4" />
              Add variable
            </button>
              </>
            )}

            {saveError && (
              <p
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                {saveError}
              </p>
            )}

            {saveSuccess && (
              <p
                className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                role="status"
              >
                <Check className="h-4 w-4 shrink-0" />
                Saved. Restart the server for changes to take effect.
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestSave}
                  disabled={!canSave}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>

                {isDirty && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition-colors hover:text-brand-text"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Discard
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition-colors hover:text-brand-text"
                  title="Download current .env.local as backup"
                >
                  <Download className="h-4 w-4" />
                  Backup
                </button>

                {rawExample && (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-red-500/30 px-4 py-2.5 text-sm text-red-400/80 transition-colors hover:border-red-500/60 hover:text-red-400"
                    title="Reset .env.local to example file defaults"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to defaults
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
