/**
 * Server-only mapping of homelab server IDs to their internal IPs.
 *
 * This module must NEVER be imported from a Client Component or any module
 * that is transitively bundled for the browser. It is consumed exclusively
 * by Route Handlers (e.g. `src/app/api/ping/route.ts`) so that internal
 * addresses stay on the server and are not shipped in the client bundle.
 */

const serverIpById: Record<string, string> = {
  ugreen: "192.168.2.166",
  minisforum: "192.168.2.146",
  "dell-wyse": "192.168.2.153",
};

export function getServerIp(id: string): string | null {
  return Object.prototype.hasOwnProperty.call(serverIpById, id)
    ? serverIpById[id]
    : null;
}

export function isKnownServerId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(serverIpById, id);
}
