/** Prefix repo-relative asset paths with Vite BASE_URL (Pages lives under /ui-resource-lab/). */
export function assetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL || "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}

/**
 * True only when the URL is likely a real component canvas that allows framing.
 * Full docs/marketing pages (Uiverse XFO SAMEORIGIN, shadcn/Magic UI docs, 21st shell)
 * return false so we keep the BASE_URL screenshot instead of a blank iframe.
 */
export function isEmbeddablePreviewUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    // Dedicated preview / CDN hosts
    if (host === "cdn.21st.dev" || host.endsWith(".cdn.21st.dev")) return true;
    if (path.includes("/embed") || path.includes("/preview")) return true;

    // Known non-frameable doc shells currently in inbox
    if (host === "uiverse.io" || host.endsWith(".uiverse.io")) return false;
    if (host === "ui.shadcn.com") return false;
    if (host === "magicui.design" && path.startsWith("/docs")) return false;
    if (host === "21st.dev" || host.endsWith(".21st.dev")) return false;

    // Unknown absolute URL: allow (Research may land real embeds here)
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
