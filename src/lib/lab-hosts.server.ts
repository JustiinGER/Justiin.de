/**
 * Default addresses of the lab servers in data.ts, keyed by server id —
 * server-only. Kept out of data.ts because that module is also imported by
 * Client Components and would ship these addresses in the browser bundle.
 */
export const defaultLabHosts: Record<string, string> = {
  "ugreen": "192.168.2.166",
  "minisforum": "192.168.2.146",
  "dell-wyse": "192.168.2.153",
  "raspberrypi5": "192.168.2.115",
};
