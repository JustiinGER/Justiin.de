import { NextResponse } from "next/server";
import net from "net";
import { getServerIp } from "@/lib/servers.server";

export const revalidate = 0; // Don't cache ping results

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

/**
 * Reachability probe for the homelab servers shown on the Lab section.
 *
 * The client passes a server `id` from the public data set. The handler
 * resolves that id against a server-side allowlist (`servers.server.ts`)
 * and only probes that specific host. This prevents the endpoint from
 * being abused as an SSRF / internal port scanner, and avoids leaking
 * internal IPs into the client bundle or query strings.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Server id is required" }, { status: 400 });
  }

  const host = getServerIp(id);
  if (!host) {
    return NextResponse.json({ error: "Unknown server" }, { status: 404 });
  }

  try {
    // Common homelab ports: SSH, HTTP, HTTPS, Proxmox, alt. HTTP.
    // If ANY port answers, the host is considered alive.
    const ports = [22, 80, 443, 8006, 8080];

    const results = await Promise.all(ports.map((port) => checkPort(host, port)));
    const isAlive = results.some((isUp) => isUp);

    return NextResponse.json({
      id,
      alive: isAlive,
    });
  } catch (error) {
    console.error(`[ping] failed for ${id}:`, error);
    return NextResponse.json(
      { id, alive: false, error: "Ping failed" },
      { status: 500 }
    );
  }
}
