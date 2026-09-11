/** Resolve public assets against Vite's deployment base ("/" outside Pages). */
export function assetUrl(path: string) {
  if (!path.startsWith('/')) return path;

  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}${path}`;
}
