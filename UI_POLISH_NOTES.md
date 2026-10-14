# UI polish notes (browse app)

Visual/interaction pass on the Vite + React + Tailwind catalog. Data schema, query URL logic, and validation scripts were **not** changed. No new dependencies.

## Direction

- Keep copper / paper / sage tokens; amplify with amber, coral, slate accents for vibe marks.
- zh-first copy; short EN crumbs only.
- Dense editorial feel (full hero, sticky filter panel, magazine detail) — not sparse “留白克制”, not blue-purple AI template.

## Files touched

| File | What changed |
|------|----------------|
| `src/index.css` | Richer paper background (copper/sage washes + dot grain), surface helpers, chip styles, rise-in / stagger motion, editor-chrome for code blocks, extra accent tokens |
| `src/components/AppShell.tsx` | Stronger sticky header, diamond mark, pill nav with inbox count, tighter footer |
| `src/components/ResourceCard.tsx` | Left vibe accent strip + corner vibe chip, richer hover lift/border, stack chip trim |
| `src/components/Badges.tsx` | Dot markers, clearer zh + en hierarchy |
| `src/components/PreviewFrame.tsx` | Window chrome bar, larger aspect preview, cleaner shot/embed toggles |
| `src/components/UsageBlock.tsx` | Code-editor chrome (traffic lights + lang), copy button success state |
| `src/pages/BrowsePage.tsx` | Dense hero band, sticky sidebar panel, search with icon, chip filters, card stagger |
| `src/pages/DetailPage.tsx` | Magazine header + quick tags, larger preview/usage, toned meta grid |
| `src/pages/InboxPage.tsx` | Matching hero band + search affordance (light touch) |
| `UI_POLISH_NOTES.md` | This file |

## Intentionally avoided

- Blue–purple gradients, identical 4-feature grids, huge odometer marketing stats
- Schema / catalog loader / `query.ts` / validate scripts changes
- New npm packages (fonts still via `@fontsource` in `main.tsx`)

## Vibe accent mapping (cards)

Known English slugs + locked zh library-card vibes (`趣味交互`, `产品级组件橱窗`, `动效营销`, `克制工程基座`) map to coral / copper / amber / sage bars. Unknown vibes fall back to copper.
