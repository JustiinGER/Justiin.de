"use client";

import { useEffect, useState, useCallback } from "react";
import {
  History,
  RotateCcw,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  Pin,
  PinOff,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { getAdminToken } from "@/lib/admin-session.client";
import { DiffView, computeJsonDiff } from "@/components/admin/DiffView";
import type { DiffLine } from "@/lib/json-diff";

interface HistoryEntry {
  id: number;
  section: string;
  saved_by: string;
  pinned: boolean;
  saved_at: string;
}

type Section = "aboutMe" | "passions" | "lab" | "contactData" | "gear";

const sections: { id: Section; label: string }[] = [
  { id: "aboutMe", label: "About Me" },
  { id: "lab", label: "The Lab" },
  { id: "passions", label: "Passions" },
  { id: "gear", label: "Gear" },
  { id: "contactData", label: "Contact" },
];

interface PreviewModalProps {
  entry: HistoryEntry;
  diffLines: DiffLine[];
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isRollingBack: boolean;
}

function PreviewModal({
  entry,
  diffLines,
  isLoading,
  onConfirm,
  onClose,
  isRollingBack,
}: PreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-brand-border">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Rollback Preview</h2>
            <p className="text-sm text-brand-muted mt-0.5">
              Version vom{" "}
              {new Date(entry.saved_at).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              (saved by <span className="text-brand-text">{entry.saved_by}</span>)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-brand-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading preview…</span>
            </div>
          ) : diffLines.length === 0 ? (
            <p className="text-sm text-brand-muted py-4 text-center">
              This version is identical to the current content.
            </p>
          ) : (
            <>
              <p className="text-xs text-brand-muted mb-3">
                The following changes will be applied by this rollback:
              </p>
              <DiffView lines={diffLines} maxHeight="max-h-96" />
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-brand-card/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRollingBack || isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-brand-accent text-brand-bg rounded-xl hover:bg-brand-accent/90 transition-all disabled:opacity-50"
          >
            {isRollingBack ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Restore this version
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContentHistory() {
  const [selectedSection, setSelectedSection] = useState<Section>("aboutMe");
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rollback with preview
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
  const [previewLines, setPreviewLines] = useState<DiffLine[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<number | null>(null);

  // Pin
  const [togglingPin, setTogglingPin] = useState<number | null>(null);

  // Download
  const [downloading, setDownloading] = useState<number | null>(null);

  // Delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedLabel = sections.find((s) => s.id === selectedSection)?.label ?? "";

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/history?section=${selectedSection}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      const json = await res.json();
      setHistory(
        (json.history || []).map((e: HistoryEntry) => ({
          ...e,
          pinned: Boolean(e.pinned),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Rollback preview ────────────────────────────────────────────────────────

  const openPreview = async (entry: HistoryEntry) => {
    setPreviewEntry(entry);
    setPreviewLines([]);
    setPreviewLoading(true);

    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/history/${entry.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load preview");
      const json = await res.json();
      const lines = computeJsonDiff(json.current, json.entry.data);
      setPreviewLines(lines);
    } catch {
      // show modal with empty diff, still allow rollback
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!previewEntry) return;
    setIsRollingBack(true);
    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ historyId: previewEntry.id }),
      });
      if (!res.ok) throw new Error("Rollback failed");

      setRollbackSuccess(previewEntry.id);
      setPreviewEntry(null);
      setTimeout(() => {
        setRollbackSuccess(null);
        fetchHistory();
      }, 2000);
    } catch {
      // show toast? keep modal open on error
    } finally {
      setIsRollingBack(false);
    }
  };

  // ── Pin / Unpin ─────────────────────────────────────────────────────────────

  const togglePin = async (entry: HistoryEntry) => {
    setTogglingPin(entry.id);
    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/history/${entry.id}/pin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ pinned: !entry.pinned }),
      });
      if (!res.ok) throw new Error("Failed to toggle pin");
      setHistory((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, pinned: !e.pinned } : e))
      );
    } catch {
      // ignore
    } finally {
      setTogglingPin(null);
    }
  };

  // ── Download ────────────────────────────────────────────────────────────────

  const downloadEntry = async (entry: HistoryEntry) => {
    setDownloading(entry.id);
    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/history/${entry.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch entry");
      const json = await res.json();

      const blob = new Blob([JSON.stringify(json.entry.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date(entry.saved_at).toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
      a.href = url;
      a.download = `${entry.section}_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setDownloading(null);
    }
  };

  const deleteEntry = async (id: number) => {
    setDeleting(id);
    setDeleteError(null);
    const token = await getAdminToken();
    if (!token) {
      setDeleting(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setConfirmDeleteId(null);
      await fetchHistory();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {previewEntry && (
        <PreviewModal
          entry={previewEntry}
          diffLines={previewLines}
          isLoading={previewLoading}
          onConfirm={handleRollback}
          onClose={() => !isRollingBack && setPreviewEntry(null)}
          isRollingBack={isRollingBack}
        />
      )}

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center shrink-0">
              <History className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-brand-text">Content History</h2>
              <p className="text-xs md:text-sm text-brand-muted">
                Restore or download previous versions
              </p>
            </div>
          </div>

          <div className="relative self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSectionMenuOpen((open) => !open)}
              onBlur={() => setTimeout(() => setSectionMenuOpen(false), 150)}
              className="flex items-center gap-2 min-w-[8rem] md:min-w-[9rem] px-3 py-2 rounded-lg border border-brand-border bg-brand-card text-brand-text text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={sectionMenuOpen}
            >
              <span className="flex-1 text-left">{selectedLabel}</span>
              <ChevronDown
                className={`w-4 h-4 text-brand-muted shrink-0 transition-transform ${sectionMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {sectionMenuOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-50 mt-1 min-w-full py-1 rounded-lg border border-brand-border bg-brand-card shadow-lg font-sans"
              >
                {sections.map((s) => (
                  <li key={s.id} role="option" aria-selected={selectedSection === s.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedSection(s.id);
                        setSectionMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        selectedSection === s.id
                          ? "bg-brand-accent/10 text-brand-accent"
                          : "text-brand-text hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {rollbackSuccess !== null && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <Check className="w-4 h-4" />
            Version restored successfully.
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {deleteError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Delete failed: {deleteError}
          </div>
        )}

        <div className="border border-brand-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-brand-muted text-sm">
              No history for this section yet
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 md:px-4 py-3 transition-colors ${
                    entry.pinned
                      ? "bg-brand-accent/5 hover:bg-brand-accent/10"
                      : "hover:bg-brand-card/50"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {entry.pinned && (
                      <Pin className="w-3.5 h-3.5 text-brand-accent shrink-0" aria-label="Pinned" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-brand-text">
                        {new Date(entry.saved_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-brand-muted">by {entry.saved_by}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    {/* Download */}
                    <button
                      onClick={() => downloadEntry(entry)}
                      disabled={downloading === entry.id}
                      title="Download as JSON"
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all disabled:opacity-40"
                    >
                      {downloading === entry.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Pin / Unpin */}
                    <button
                      onClick={() => togglePin(entry)}
                      disabled={togglingPin === entry.id}
                      title={entry.pinned ? "Unpin" : "Pin (protect from auto-deletion)"}
                      className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
                        entry.pinned
                          ? "text-brand-accent hover:bg-red-500/10 hover:text-red-400"
                          : "text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10"
                      }`}
                    >
                      {togglingPin === entry.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : entry.pinned ? (
                        <PinOff className="w-3.5 h-3.5" />
                      ) : (
                        <Pin className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete — disabled for pinned entries */}
                    {!entry.pinned && (
                      confirmDeleteId === entry.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <span className="text-xs text-brand-muted hidden sm:inline">Delete?</span>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            disabled={deleting === entry.id}
                            className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                          >
                            {deleting === entry.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Yes"
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs font-medium text-brand-muted hover:text-brand-text transition-all"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(entry.id)}
                          title="Delete entry"
                          className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}

                    {/* Rollback with preview */}
                    {confirmDeleteId !== entry.id && (
                      <button
                        onClick={() => openPreview(entry)}
                        className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-medium text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-all ml-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
