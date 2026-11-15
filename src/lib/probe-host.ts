import { isIP } from "net";

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** True for a literal IP address or a plain DNS hostname — no ports, paths or schemes. */
export function isValidProbeHost(host: string): boolean {
  return isIP(host) !== 0 || HOSTNAME_PATTERN.test(host);
}
