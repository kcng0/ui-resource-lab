#!/usr/bin/env python3
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(r"C:\Users\yunsh\Projects\ui-resource-lab")
INBOX = ROOT / "data" / "inbox"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

FAILED = [
    "shadcn-form",
    "shadcn-sidebar",
    "magicui-client-tweet-card",
]

def shot_one(page, rid: str) -> bool:
    path = INBOX / f"{rid}.json"
    rec = json.loads(path.read_text(encoding="utf-8"))
    url = rec.get("source_url")
    prefix = rid.split("-", 1)[0]
    # magicui / shadcn
    if rid.startswith("magicui-"):
        prefix = "magicui"
    elif rid.startswith("shadcn-"):
        prefix = "shadcn"
    shot_rel = f"/previews/{prefix}/{rid}.png"
    shot_path = ROOT / "public" / shot_rel.lstrip("/")
    shot_path.parent.mkdir(parents=True, exist_ok=True)
    page.goto(url, wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(1500)
    # try several strategies
    selectors = [
        '[data-slot="preview"]',
        '[data-slot="component-preview"]',
        ".preview",
        "main article",
        "main",
    ]
    for sel in selectors:
        loc = page.locator(sel)
        if loc.count() == 0:
            continue
        for j in range(min(loc.count(), 8)):
            try:
                box = loc.nth(j).bounding_box()
                if not box or box["width"] < 80 or box["height"] < 40:
                    continue
                loc.nth(j).screenshot(path=str(shot_path))
                if shot_path.stat().st_size < 500:
                    continue
                rec.setdefault("preview", {})
                rec["preview"]["screenshot"] = shot_rel
                if url and "embed_url" not in rec["preview"]:
                    rec["preview"]["embed_url"] = url
                rec["updated_at"] = NOW
                notes = rec.get("notes") or ""
                if "screenshot backfilled" not in notes:
                    rec["notes"] = (notes + " Screenshot backfilled from docs page preview region.").strip()
                path.write_text(json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print("ok", rid, "via", sel, shot_path.stat().st_size)
                return True
            except Exception as e:
                print("try fail", rid, sel, e)
    # full page clip as last resort
    try:
        page.screenshot(path=str(shot_path), clip={"x": 300, "y": 160, "width": 900, "height": 420})
        if shot_path.stat().st_size > 800:
            rec.setdefault("preview", {})
            rec["preview"]["screenshot"] = shot_rel
            rec["updated_at"] = NOW
            path.write_text(json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print("ok clip", rid, shot_path.stat().st_size)
            return True
    except Exception as e:
        print("clip fail", rid, e)
    print("FAIL", rid)
    return False

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
        for rid in FAILED:
            shot_one(page, rid)
        browser.close()

if __name__ == "__main__":
    main()
