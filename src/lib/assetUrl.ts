/** Prefix repo-relative asset paths with Vite BASE_URL (Pages lives under /ui-resource-lab/). */
export function assetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL || "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}
