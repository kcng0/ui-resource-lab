#!/usr/bin/env python3
"""Fill remaining 21st embed_urls using cdn.21st.dev/bundled/<id>.html iframe src."""
from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "data" / "inbox"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

MARKER = (
    "Primary preview: live source via preview.embed_url "
    "(cdn.21st.dev bundled/… or …/bundle.<ts>.html iframe). "
    "screenshot is optional offline fallback only; on GitHub Pages the UI must "
    "resolve screenshot with import.meta.env.BASE_URL (absolute /previews/… 404s)."
)

CDN_IFRAME_RE = re.compile(
    r"https://cdn\.21st\.dev/(?:bundled/\d+\.html|[^\s\"'<>]+/bundle\.[^\s\"'<>]+\.html)"
)


def strip_primary(notes: str) -> str:
    if not notes:
        return ""
    parts = re.split(r"(?<=\.)\s+", notes.strip())
    keep = []
    skip = False
    for p in parts:
        if p.startswith("Primary preview:"):
            skip = True
            continue
        if skip and (
            p.startswith("screenshot is optional")
            or p.startswith("No dedicated")
            or p.startswith("CDN bundle")
            or "BASE_URL" in p
        ):
            continue
        skip = False
        keep.append(p)
    return " ".join(keep).strip()


def with_theme(url: str) -> str:
    base = url.split("?")[0].rstrip("\\")
    return base + "?theme=light"


def extract_from_page(page) -> str | None:
    try:
        page.wait_for_selector('iframe[src*="cdn.21st.dev"]', timeout=40000)
    except Exception:
        pass
    page.wait_for_timeout(2000)
    loc = page.locator('iframe[src*="cdn.21st.dev"]')
    for i in range(min(loc.count(), 8)):
        src = (loc.nth(i).get_attribute("src") or "").split("?")[0].rstrip("\\")
        if "cdn.21st.dev" in src and (src.endswith(".html") or "/bundled/" in src or "/bundle." in src):
            return src
    html = page.content()
    found = CDN_IFRAME_RE.findall(html)
    if found:
        # Prefer bundled/ or default/bundle
        found = sorted(set(u.rstrip("\\") for u in found), key=lambda u: ("/bundled/" not in u and "/default/" not in u, len(u)))
        return found[0]
    return None


def main() -> None:
    targets = []
    for path in sorted(INBOX.glob("21st-*.json")):
        rec = json.loads(path.read_text(encoding="utf-8"))
        e = rec.get("preview", {}).get("embed_url", "")
        if "cdn.21st.dev" not in e:
            targets.append(path)
    print("targets", len(targets))
    ok = fail = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        for path in targets:
            rec = json.loads(path.read_text(encoding="utf-8"))
            print("fix", rec["id"])
            page.goto(rec["source_url"], wait_until="domcontentloaded", timeout=60000)
            src = extract_from_page(page)
            if not src:
                fail += 1
                print("  FAIL")
                continue
            embed = with_theme(src)
            rec["preview"]["embed_url"] = embed
            base = strip_primary(rec.get("notes", ""))
            rec["notes"] = (base + " " + MARKER).strip()
            rec["updated_at"] = NOW
            path.write_text(json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            ok += 1
            print("  OK", embed)
            time.sleep(0.15)
        browser.close()
    print("done ok", ok, "fail", fail)
    # final count
    cdn = page_n = 0
    shapes = {"bundle_ts": 0, "bundled_id": 0, "other": 0}
    for path in INBOX.glob("21st-*.json"):
        e = json.loads(path.read_text(encoding="utf-8"))["preview"]["embed_url"]
        if "cdn.21st.dev" in e:
            cdn += 1
            if "/bundled/" in e:
                shapes["bundled_id"] += 1
            elif "/bundle." in e:
                shapes["bundle_ts"] += 1
            else:
                shapes["other"] += 1
        else:
            page_n += 1
    print("final cdn", cdn, "page", page_n, "shapes", shapes)


if __name__ == "__main__":
    main()
