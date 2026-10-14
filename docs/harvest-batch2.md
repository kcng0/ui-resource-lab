# Harvest batch 2

Date: 2026-10-14 (Asia/Singapore)

## Counts

| Source | New inbox JSON | Screenshots | Method |
| --- | --- | --- | --- |
| Uiverse | 80 | 80 | Galaxy HTML from `uiverse-io/galaxy` (Buttons 20, Cards 20, loaders 15, Inputs 15, Toggle-switches 5, Forms 5); Playwright render of HTML+CSS → `public/previews/uiverse/` |
| 21st.dev | 70 | 70 | Category markdown lists (`button`, `hero`, `features`, `card`, `input`), unique base components; **Playwright capture of live `cdn.21st.dev` preview iframe** (component body) → `public/previews/21st/`. **No longer uses** `https://21st.dev/og/component/...` OG cards. |
| shadcn (existing) | 0 new (54 existing) | 54 / 54 | Playwright preview region (or `main` fallback) on docs → `public/previews/shadcn/` |
| Magic UI (existing) | 0 new (78 existing) | 78 / 78 | Same; tweet-card used page clip fallback → `public/previews/magicui/` |

Total pending_review after batch: 132 + 80 + 70 = **282**

## 21st screenshot method (updated)

Original batch downloaded OG PNGs from `/og/component/{author}/{slug}` — those are logo+title cards, not component appearance. Review rejected that.

**Current method** (`scripts/recapture_21st_shots.py`):

1. Open each component live page (`source_url`).
2. Wait for `iframe[src*="cdn.21st.dev"]` (sandbox bundle).
3. Screenshot the iframe element (component demo body).
4. Overwrite `public/previews/21st/{id}.png` and refresh `preview.screenshot` + notes.

### Dead live pages replaced (5)

These inbox entries had SPA 404s (stale/truncated category links). Removed and replaced with other working category components (same shot method):

| Removed | Replacement |
| --- | --- |
| `21st-ali-hussein-dev-card-with-cross-patter` | `21st-trophyso-leaderboard-card` |
| `21st-ali-hussein-dev-card-with-grid-ellipsis-pattern` | `21st-efferd-contact-card` |
| `21st-azacdev-form` | `21st-syeddhasnainn-approval-card` |
| `21st-mynaui-button` | `21st-uiable-card-tabs` |
| `21st-serafimcloud-input` | `21st-shadcnspace-shine-border-06` |

Recapture result: **70 / 70** body shots OK; no remaining OG screenshots in 21st inbox.

## Skips / gaps

- **21st:** skipped `@dillionverma` (Magic UI already in inbox via magicui.design). Install payloads need a 21st API key; metadata + live URL + body screenshot only for `pending_review`.
- No free-web crawl. Approved sources only.

## Vibes (provisional)

- Uiverse: `趣味交互`
- 21st: `产品级组件橱窗`

## Scripts

- `scripts/harvest_batch2.py` — main harvest + backfill (21st harvest path still documents OG historically; do not re-run OG for screenshots)
- `scripts/recapture_21st_shots.py` — replace 21st OG shots with Playwright iframe body captures; swap dead pages
- `scripts/repair_batch2.py` — author/URL/vibe repair after first pass
- `scripts/retry_failed_shots.py` — retry stubborn docs pages

## Review

Open `/inbox`, filter by source. Approve by moving JSON to `data/resources/` and setting `status: approved`.
