#!/usr/bin/env python3
"""Update inbox preview.embed_url to best live source preview URLs.

Primary display source: preview.embed_url (live component / page from origin).
screenshot remains optional offline fallback; UI must join import.meta.env.BASE_URL.
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "data" / "inbox"
HARVEST = ROOT / "_harvest"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

HTML_UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}

BUNDLE_RE = re.compile(
    r"https://cdn\.21st\.dev/[^\s\"'<>]+/bundle\.[0-9]+\.html"
)
BUNDLE_REL_RE = re.compile(
    r"cdn\.21st\.dev/([^\s\"'<>]+/bundle\.[0-9]+\.html)"
)

MARKERS = {
    "21st_cdn": (
        "Primary preview: live source via preview.embed_url "
        "(cdn.21st.dev …/bundle.<ts>.html?theme=light iframe). "
        "screenshot is optional offline fallback only; on GitHub Pages the UI must "
        "resolve screenshot with import.meta.env.BASE_URL (absolute /previews/… 404s)."
    ),
    "21st_page": (
        "Primary preview: live source via preview.embed_url (21st component page; "
        "CDN bundle HTML not found in page — kept page URL). "
        "screenshot is optional offline fallback; UI must join BASE_URL for /previews/."
    ),
    "uiverse": (
        "Primary preview: live source via preview.embed_url (Uiverse element page). "
        "No dedicated official embed endpoint found in page HTML; iframe may be blocked "
        "by CSP/X-Frame-Options. screenshot is optional offline fallback; UI must join BASE_URL."
    ),
    "magicui": (
        "Primary preview: live source via preview.embed_url (Magic UI docs page). "
        "No dedicated component embed URL discovered; docs pages often block iframes. "
        "screenshot is optional offline fallback; UI must join BASE_URL."
    ),
    "shadcn": (
        "Primary preview: live source via preview.embed_url (shadcn/ui docs page). "
        "No dedicated component embed URL discovered; docs pages often block iframes. "
        "screenshot is optional offline fallback; UI must join BASE_URL."
    ),
}


def http_text(url: str, timeout: int = 45) -> str:
    req = urllib.request.Request(url, headers=HTML_UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def extract_21st_bundle(html: str) -> str | None:
    matches = sorted(set(BUNDLE_RE.findall(html)), key=lambda u: ("/default/" not in u, len(u)))
    if matches:
        return matches[0]
    rel = sorted(set(BUNDLE_REL_RE.findall(html)), key=lambda u: ("/default/" not in u, len(u)))
    if rel:
        return "https://cdn.21st.dev/" + rel[0]
    return None


def with_theme(url: str) -> str:
    if "theme=" in url:
        return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}theme=light"


def strip_old_primary_notes(notes: str) -> str:
    """Remove prior Primary preview sentences so we do not stack duplicates."""
    if not notes:
        return ""
    # Drop sentences that start with our marker (may span multiple sentences).
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
            or p.startswith("screenshot is optional offline")
        ):
            continue
        skip = False
        keep.append(p)
    return " ".join(keep).strip()


def set_primary_notes(rec: dict, key: str) -> None:
    base = strip_old_primary_notes(rec.get("notes", ""))
    marker = MARKERS[key]
    rec["notes"] = (base + " " + marker).strip() if base else marker


def write_json(path: Path, obj: dict) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def playwright_bundle(page_url: str) -> str | None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.goto(page_url, wait_until="domcontentloaded", timeout=60000)
            try:
                page.wait_for_selector('iframe[src*="cdn.21st.dev"]', timeout=25000)
            except Exception:
                pass
            page.wait_for_timeout(1500)
            loc = page.locator('iframe[src*="cdn.21st.dev"]')
            if loc.count() == 0:
                loc = page.locator("iframe")
            for i in range(min(loc.count(), 8)):
                src = loc.nth(i).get_attribute("src") or ""
                if "cdn.21st.dev" in src and "bundle." in src and src.endswith((".html", "html?theme=light", "html?theme=dark")) or (
                    "cdn.21st.dev" in src and "/bundle." in src
                ):
                    browser.close()
                    return src.split("?")[0]  # normalize; with_theme adds theme
                if "cdn.21st.dev" in src and "/bundle." in src:
                    browser.close()
                    return src.split("?")[0]
            browser.close()
    except Exception as e:
        print("  playwright err", e)
    return None


def resolve_21st_embed(page_url: str) -> tuple[str | None, str]:
    """Return (embed_url_or_None, method)."""
    try:
        html = http_text(page_url)
    except Exception as e:
        print("  fetch fail", e)
        html = ""
    bundle = extract_21st_bundle(html) if html else None
    if bundle:
        return with_theme(bundle), "html"
    # Playwright fallback
    pw = playwright_bundle(page_url)
    if pw:
        return with_theme(pw), "playwright"
    return None, "none"


def main() -> None:
    HARVEST.mkdir(parents=True, exist_ok=True)
    files = sorted(INBOX.glob("*.json"))
    stats = {
        "21st_cdn_html": 0,
        "21st_cdn_playwright": 0,
        "21st_page_fallback": 0,
        "uiverse_page": 0,
        "magicui_page": 0,
        "shadcn_page": 0,
        "unchanged_other": 0,
    }
    samples: dict[str, list[str]] = {"21st_cdn": [], "page_only": []}
    details = []

    for i, path in enumerate(files, 1):
        rec = json.loads(path.read_text(encoding="utf-8"))
        source = rec.get("source")
        rid = rec["id"]
        page = rec.get("source_url") or ""
        rec.setdefault("preview", {})
        old_embed = rec["preview"].get("embed_url")

        if source == "21st":
            print(f"[{i}/{len(files)}] 21st {rid}")
            embed, method = resolve_21st_embed(page)
            if embed:
                rec["preview"]["embed_url"] = embed
                set_primary_notes(rec, "21st_cdn")
                rec["updated_at"] = NOW
                write_json(path, rec)
                key = "21st_cdn_html" if method == "html" else "21st_cdn_playwright"
                stats[key] += 1
                if len(samples["21st_cdn"]) < 5:
                    samples["21st_cdn"].append(embed)
                details.append({"id": rid, "status": method, "embed": embed})
                print(f"  {method}", embed[:110])
            else:
                rec["preview"]["embed_url"] = page
                set_primary_notes(rec, "21st_page")
                rec["updated_at"] = NOW
                write_json(path, rec)
                stats["21st_page_fallback"] += 1
                samples["page_only"].append(f"21st:{rid}")
                details.append({"id": rid, "status": "page_fallback", "embed": page})
                print("  PAGE FALLBACK")
            time.sleep(0.1)
        elif source in ("uiverse", "magicui", "shadcn"):
            rec["preview"]["embed_url"] = page
            set_primary_notes(rec, source)
            rec["updated_at"] = NOW
            write_json(path, rec)
            stats[f"{source}_page"] += 1
            if old_embed != page:
                samples["page_only"].append(f"{source}:{rid}")
        else:
            stats["unchanged_other"] += 1

    summary = {
        "stats": stats,
        "samples": samples,
        "inbox_count": len(files),
        "updated_at": NOW,
        "details_21st": [d for d in details],
    }
    (HARVEST / "live-preview-update-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("SUMMARY", json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
