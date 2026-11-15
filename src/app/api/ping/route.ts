import { NextResponse } from "next/server";
import net from "net";
import { getAllContent } from "@/lib/content.server";
import { isValidProbeHost } from "@/lib/probe-host";

export const dynamic = "force-dynamic";

// Common homelab ports: SSH, HTTP, HTTPS, Proxmox, alt. HTTP.
// If ANY port answers, the host is considered alive.
const PORTS = [22, 80, 443, 8006, 8080];

// The endpoint is public, so the result is shared between all visitors for a
// short while: however often it is called, each host is probed at most once
// per TTL. The client polls every 30 seconds.
const CACHE_TTL_MS = 25_000;
const MAX_ID_LENGTH = 64;

const cache = new Map<string, { alive: boolean; checkedAt: number }>();
const inFlight = new Map<string, Promise<boolean>>();

function checkPort(host: string, port: number, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const cleanup = () => {
      socket.destroy();
    };

    socket.setTimeout(timeout);

    socket.once("error", () => {
      cleanup();
      resolve(false);
    });

    socket.once("timeout", () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, host, () => {
      cleanup();
      resolve(true);
    });
  });
}

async function probeHost(host: string): Promise<boolean> {
  const results = await Promise.all(PORTS.map((port) => checkPort(host, port)));
  return results.some((isUp) => isUp);
}

/** Probes a host, reusing a fresh result or an already running probe. */
function isHostAlive(host: string): Promise<boolean> {
  const cached = cache.get(host);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.alive);
  }

  const running = inFlight.get(host);
  if (running) return running;

  const probe = probeHost(host)
    .then((alive) => {
      cache.set(host, { alive, checkedAt: Date.now() });
      return alive;
    })
    .finally(() => {
      inFlight.delete(host);
    });

  inFlight.set(host, probe);
  return probe;
}

/**
 * Reachability probe for the homelab servers shown on the Lab section.
 *
 * The client passes a server `id` from the public data set. The handler
 * resolves that id against the site content (database / data.ts) and only
 * probes the host configured for it — callers can never choose the target.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || id.length > MAX_ID_LENGTH) {
    return NextResponse.json({ error: "Server id is required" }, { status: 400 });
  }

  const content = await getAllContent();
  const server = content.lab.servers.find((s) => s.id === id);
  const host = server?.ip;

  if (!host || !isValidProbeHost(host)) {
    return NextResponse.json({ error: "Unknown server or IP not configured" }, { status: 404 });
  }

  // Drop results for hosts that are no longer part of the content.
  const knownHosts = new Set(content.lab.servers.map((s) => s.ip));
  for (const key of cache.keys()) {
    if (!knownHosts.has(key)) cache.delete(key);
  }

  try {
    const alive = await isHostAlive(host);

    return NextResponse.json({ id, alive });
  } catch (error) {
    console.error(`[ping] failed for ${id}:`, error);
    return NextResponse.json(
      { id, alive: false, error: "Ping failed" },
      { status: 500 }
    );
  }
}
