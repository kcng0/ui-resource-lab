# Component-first browse UI

## Product rule
- Main catalog grid shows **`kind === "component"`** only (approved).
- Legacy `component_library` / showcase cards are **not** shown in the main grid.
- **Source** (shadcn / magicui / uiverse / 21st) is a multi-select filter chip + badge, not a library card.

## URL query (unchanged keys)
- `axis`, `cat`, `q`, `license`, `stack` (comma), `source` (comma) — see `query.ts`.
- Browse clear-filters resets `sources` as well.

## Pages
- **BrowsePage**: component base set; Source chip row; denser `sm:2 / xl:3 / 2xl:4` grid; empty → link Inbox.
- **ResourceCard**: `SourceBadge` on media + near title; shorter notes clamp; letterplate if no screenshot.
- **DetailPage**: SourceBadge with kind/status/license.
- **InboxPage**: component-harvest copy; source filter chips; same denser grid.

## Data
- Box tree may only have sample inbox/resources for compile. Full harvest lives on the user machine / remote.
- Types require `source`; records without it will fail type-check until data is updated.

## Preview (live-first)
- Cards + detail prefer `preview.embed_url` (official / source live preview).
- `preview.screenshot` is fallback only; resolve via `assetUrl()` so Pages `BASE_URL` (`/ui-resource-lab/`) is applied.
- Card iframes are lazy (IntersectionObserver) and `pointer-events-none` so the tile stays a link.

- Skip iframe when `isEmbeddablePreviewUrl(embed_url)` is false (docs shells / XFO); show screenshot instead so tiles are not blank.

- Live-embed cards: iframe keeps pointer events (scroll/drag); only the meta block is the detail `Link`. Shot-only cards keep a media overlay link.

## Inbox review + density
- Inbox: checkbox 通过 + 全选可见 / 复制已选 id / 下载 .txt（静态 Pages 不能真入库；把 id 交给 Research promote）。
- Browse + Inbox: URL cols=2|4 密度开关（默认 2/行；cols=4 为每行四卡）。
