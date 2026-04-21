"use client";

import { useEffect, useState } from "react";

interface ServerStatusProps {
  /**
   * Public server identifier. Must match an entry on the server-side
   * allowlist in `src/lib/servers.server.ts`. Internal IPs never leave
   * the server, so the client only deals with opaque ids.
   */
  id?: string;
}

export function ServerStatus({ id }: ServerStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/ping?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          setIsOnline(false);
          return;
        }
        const data = await res.json();
        setIsOnline(data.alive);
      } catch (error) {
        console.error("Failed to check server status:", error);
        setIsOnline(false);
      }
    };

    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (!id || isOnline === null) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
        </span>
        CHECKING
      </div>
    );
  }

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        ONLINE
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
      OFFLINE
    </div>
  );
}
