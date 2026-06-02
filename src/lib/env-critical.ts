/** Env keys that must not be removed or cleared without explicit confirmation. */
export const CRITICAL_ENV_KEYS = new Set(["JWT_SECRET"]);

export function isCriticalEnvKey(key: string): boolean {
  return CRITICAL_ENV_KEYS.has(key.trim());
}
