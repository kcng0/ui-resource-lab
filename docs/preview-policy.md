# Preview policy / 预览策略

Aligns with UI `isEmbeddablePreviewUrl` (PR #3): cards/detail **iframe only** when the URL is a real embeddable preview — not a full docs/marketing shell.

## When UI embeds (`embed_url`)

Live iframe **only** if `embed_url` matches one of:

1. Host **`cdn.21st.dev`** (21st component body), or
2. Path contains **`/embed`** or **`/preview`**

Everything else (Uiverse element pages, shadcn docs, Magic UI docs, 21st `@author/components/…` shell pages) is **not** iframed; UI falls back to `preview.screenshot` with `import.meta.env.BASE_URL`.

## Per-source `embed_url` harvest rules

| Source | Preferred `embed_url` | Embeddable by UI? |
| --- | --- | --- |
| **21st** | CDN iframe src from the component page: either `https://cdn.21st.dev/<…>/default/bundle.<ts>.html?theme=light` **or** `https://cdn.21st.dev/bundled/<id>.html?theme=light` | **Yes** (cdn host) |
| **Uiverse** | Element page `https://uiverse.io/<user>/<slug>` — no dedicated `/embed` or `/preview` URL found | **No** → screenshot |
| **Magic UI** | Docs page `https://magicui.design/docs/components/<slug>` — no embed URL found | **No** → screenshot |
| **shadcn** | Docs page `https://ui.shadcn.com/docs/components/<slug>` — no embed URL found | **No** → screenshot |

## Screenshot fallback (BASE_URL)

- Files under `public/previews/…`; harvest stores `/previews/<source>/<id>.png`.
- Absolute `/previews/…` 404s on GitHub Pages unless the UI joins `import.meta.env.BASE_URL` (PR #3).
- Research keeps the `/previews/…` convention; UI owns BASE_URL joining. Do not invent a second path scheme without coordinating with UI.

## Display priority (UI)

1. If `embed_url` passes `isEmbeddablePreviewUrl` → live iframe.
2. Else if `screenshot` → image with BASE_URL.
3. Else letter / empty placeholder.

**This Research PR depends on UI PR #3** for correct card images (BASE_URL) and for 21st live iframes.
