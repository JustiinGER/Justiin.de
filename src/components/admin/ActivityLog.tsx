"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { ScrollText, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { getAdminToken } from "@/lib/admin-session.client";
import { DiffView } from "@/components/admin/DiffView";
import type { DiffLine } from "@/lib/json-diff";

interface LogEntry {
  id: number;
  username: string;
  action: string;
  section: string | null;
  ip: string | null;
  created_at: string;
  hasDiff?: boolean;
}

type DiffState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; lines: DiffLine[]; isInitial: boolean }
  | { status: "unavailable"; reason: string }
  | { status: "error" };

const actionLabels: Record<string, { label: string; color: string }> = {
  login: { label: "Login", color: "text-blue-400 bg-blue-500/10" },
  content_save: { label: "Content Save", color: "text-green-400 bg-green-500/10" },
  password_change: { label: "Password Change", color: "text-yellow-400 bg-yellow-500/10" },
  rollback: { label: "Rollback", color: "text-purple-400 bg-purple-500/10" },
  history_delete: { label: "History Delete", color: "text-red-400 bg-red-500/10" },
};

const sectionLabels: Record<string, string> = {
  aboutMe: "About Me",
  lab: "Lab",
  passions: "Passions",
  gear: "Gear",
  contactData: "Contact",
};

const diffUnavailableMessages: Record<string, string> = {
  legacy: "No change details were recorded for this entry (saved before the update).",
  no_diff: "This action type does not support diffs.",
  history_missing: "The referenced history version could not be found.",
  incomplete: "Diff data is incomplete.",
  not_found: "Log entry not found.",
};

export function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [diffCache, setDiffCache] = useState<Record<number, DiffState>>({});

  const fetchLogs = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/logs?limit=50&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const json = await res.json();

      if (append) {
        setLogs((prev) => [...prev, ...json.logs]);
      } else {
        setLogs(json.logs || []);
      }

      setHasMore(json.logs.length === 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const loadDiff = async (logId: number) => {
    if (diffCache[logId]?.status === "loaded" || diffCache[logId]?.status === "loading") {
      return;
    }

    setDiffCache((prev) => ({ ...prev, [logId]: { status: "loading" } }));
    const token = await getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/logs/${logId}/diff`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load diff");
      const json = await res.json();

      if (json.available) {
        setDiffCache((prev) => ({
          ...prev,
          [logId]: {
            status: "loaded",
            lines: json.lines,
            isInitial: json.isInitial,
          },
        }));
      } else {
        setDiffCache((prev) => ({
          ...prev,
          [logId]: { status: "unavailable", reason: json.reason || "unknown" },
        }));
      }
    } catch {
      setDiffCache((prev) => ({ ...prev, [logId]: { status: "error" } }));
    }
  };

  const toggleDiff = (log: LogEntry) => {
    const canDiff = log.action === "content_save" || log.action === "rollback";
    if (!canDiff) return;

    if (expandedId === log.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(log.id);
    loadDiff(log.id);
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchLogs(logs.length, true);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 md:w-10 md:h-10 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center shrink-0">
          <ScrollText className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-semibold text-brand-text">Activity Log</h2>
          <p className="text-xs md:text-sm text-brand-muted">
            Recent admin actions — tap to view changes
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="border border-brand-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-brand-muted text-sm">
            No activity logged yet
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-brand-border">
              {logs.map((log) => {
                const actionInfo = actionLabels[log.action] || {
                  label: log.action,
                  color: "text-brand-muted bg-brand-card",
                };
                const canDiff =
                  log.action === "content_save" || log.action === "rollback";
                const isExpanded = expandedId === log.id;
                const diffState = diffCache[log.id];

                return (
                  <div key={log.id} className={`p-3 ${isExpanded ? "bg-brand-card/40" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {canDiff ? (
                            <button
                              type="button"
                              onClick={() => toggleDiff(log)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all ${actionInfo.color}`}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              {actionInfo.label}
                            </button>
                          ) : (
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          )}
                          {log.section && (
                            <span className="text-xs text-brand-muted">
                              {sectionLabels[log.section] || log.section}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-muted mt-1">
                          {log.username} · {new Date(log.created_at).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-brand-border/50">
                        {!diffState || diffState.status === "loading" ? (
                          <div className="flex items-center gap-2 text-brand-muted text-sm py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading diff…
                          </div>
                        ) : diffState.status === "loaded" ? (
                          <DiffView lines={diffState.lines} isInitial={diffState.isInitial} />
                        ) : diffState.status === "unavailable" ? (
                          <p className="text-sm text-brand-muted py-2">
                            {diffUnavailableMessages[diffState.reason] ?? "No diff available."}
                          </p>
                        ) : (
                          <p className="text-sm text-red-400 py-2">Failed to load diff.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-card/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Time
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Section
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {logs.map((log) => {
                    const actionInfo = actionLabels[log.action] || {
                      label: log.action,
                      color: "text-brand-muted bg-brand-card",
                    };
                    const canDiff =
                      log.action === "content_save" || log.action === "rollback";
                    const isExpanded = expandedId === log.id;
                    const diffState = diffCache[log.id];

                    return (
                      <Fragment key={log.id}>
                        <tr
                          className={`transition-colors ${
                            isExpanded ? "bg-brand-card/40" : "hover:bg-brand-card/30"
                          }`}
                        >
                          <td className="px-4 py-3 text-brand-text whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 text-brand-text">{log.username}</td>
                          <td className="px-4 py-3">
                            {canDiff ? (
                              <button
                                type="button"
                                onClick={() => toggleDiff(log)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all hover:ring-2 hover:ring-brand-accent/30 ${actionInfo.color}`}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                                {actionInfo.label}
                              </button>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}
                              >
                                {actionInfo.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-brand-muted">
                            {log.section ? sectionLabels[log.section] || log.section : "—"}
                          </td>
                          <td className="px-4 py-3 text-brand-muted font-mono text-xs">
                            {log.ip || "—"}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${log.id}-diff`} className="bg-brand-bg/50">
                            <td colSpan={5} className="px-4 py-4 border-t border-brand-border/50">
                              {!diffState || diffState.status === "loading" ? (
                                <div className="flex items-center gap-2 text-brand-muted text-sm py-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading diff…
                                </div>
                              ) : diffState.status === "loaded" ? (
                                <DiffView
                                  lines={diffState.lines}
                                  isInitial={diffState.isInitial}
                                />
                              ) : diffState.status === "unavailable" ? (
                                <p className="text-sm text-brand-muted py-2">
                                  {diffUnavailableMessages[diffState.reason] ?? "No diff available."}
                                </p>
                              ) : (
                                <p className="text-sm text-red-400 py-2">
                                  Failed to load diff.
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="border-t border-brand-border p-3">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-all disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load more
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
