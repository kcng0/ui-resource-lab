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
