# Harvest batch 2

Date: 2026-10-14 (Asia/Singapore)

## Counts

| Source | New inbox JSON | Screenshots | Method |
| --- | --- | --- | --- |
| Uiverse | 80 | 80 | Galaxy HTML from `uiverse-io/galaxy` (Buttons 20, Cards 20, loaders 15, Inputs 15, Toggle-switches 5, Forms 5); Playwright render of HTML+CSS → `public/previews/uiverse/` |
| 21st.dev | 70 | 70 | Category markdown lists (`button`, `hero`, `features`, `card`, `input`), 14 unique base components each; OG PNG from `https://21st.dev/og/component/{author}/{slug}` → `public/previews/21st/` |
| shadcn (existing) | 0 new (54 existing) | 54 / 54 | Playwright preview region (or `main` fallback) on docs → `public/previews/shadcn/` |
| Magic UI (existing) | 0 new (78 existing) | 78 / 78 | Same; tweet-card used page clip fallback → `public/previews/magicui/` |

Total pending_review after batch: 132 + 80 + 70 = **282**

## Skips / gaps

- **21st:** skipped `@dillionverma` (Magic UI already in inbox via magicui.design). Install payloads need a 21st API key; metadata + live URL + OG screenshot only for `pending_review`.
- No free-web crawl. Approved sources only.

## Vibes (provisional)

- Uiverse: `趣味交互`
- 21st: `产品级组件橱窗`

## Scripts

- `scripts/harvest_batch2.py` — main harvest + backfill
- `scripts/repair_batch2.py` — author/URL/vibe repair after first pass
- `scripts/retry_failed_shots.py` — retry stubborn docs pages

## Review

Open `/inbox`, filter by source. Approve by moving JSON to `data/resources/` and setting `status: approved`.
