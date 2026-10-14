#!/usr/bin/env python3
"""Replace 21st.dev OG screenshots with Playwright component-body (cdn iframe) shots."""
from __future__ import annotations

import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "data" / "inbox"
PREVIEWS = ROOT / "public" / "previews" / "21st"
HARVEST = ROOT / "_harvest"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
UA = {"User-Agent": "ui-resource-lab-harvest/0.2 (local; 21st body shots)"}
HTML_UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html",
}
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# Known broken base-slug pages (SPA 404); replace with fresh working components.
BROKEN_IDS = {
    "21st-ali-hussein-dev-card-with-cross-patter",
    "21st-ali-hussein-dev-card-with-grid-ellipsis-pattern",
    "21st-azacdev-form",
    "21st-mynaui-button",
    "21st-serafimcloud-input",
}

SCENE_BY_CAT = {
    "button": ["landing", "app-shell"],
    "hero": ["landing", "marketing"],
    "features": ["landing", "marketing"],
    "card": ["marketing", "landing"],
    "input": ["app-shell", "docs"],
}


def slugify(text: str) -> str:
    text = text.lower().replace("_", "-").replace(".", "-").replace(" ", "-")
    text = re.sub(r"[^a-z0-9-]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "item"


def ensure_id(raw: str) -> str:
    s = slugify(raw)
    if not ID_RE.match(s):
        s = re.sub(r"[^a-z0-9-]", "", s)
        s = re.sub(r"-{2,}", "-", s).strip("-")
    if not ID_RE.match(s):
        raise ValueError(f"bad id: {raw}")
    return s


def http_text(url: str, headers: dict | None = None) -> str:
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", "replace")


def page_works(url: str) -> bool:
    try:
        req = urllib.request.Request(url, headers=HTML_UA)
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode("utf-8", "replace")
        title_m = re.search(r"<title>([^<]+)", html)
        title = title_m.group(1) if title_m else ""
        return "Not Found" not in title and "404" not in title
    except Exception:
        return False


def write_json(path: Path, obj: dict) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_notes(notes: str) -> str:
    notes = notes or ""
    notes = notes.replace(
        "Screenshot from 21st OG image.",
        "Screenshot from Playwright capture of live component preview iframe (cdn.21st.dev), not OG.",
    )
    if "Playwright capture of live component preview iframe" not in notes:
        notes = (
            notes.rstrip()
            + " Screenshot from Playwright capture of live component preview iframe (cdn.21st.dev), not OG."
        )
    return notes


def capture_iframe(page, url: str, shot_path: Path) -> tuple[bool, str]:
    """Open component page, wait for cdn.21st.dev iframe, screenshot it."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
    except Exception as e:
        return False, f"goto: {e}"
    try:
        page.wait_for_selector('iframe[src*="cdn.21st.dev"]', timeout=35000)
    except Exception:
        # try alternate selectors
        pass
    page.wait_for_timeout(2200)

    # Prefer cdn iframe
    loc = page.locator('iframe[src*="cdn.21st.dev"]')
    if loc.count() == 0:
        loc = page.locator("iframe")
    if loc.count() == 0:
        return False, "no iframe"

    target = None
    src = ""
    for j in range(min(loc.count(), 6)):
        el = loc.nth(j)
        try:
            box = el.bounding_box()
            src = el.get_attribute("src") or ""
            if not box:
                continue
            if box["width"] >= 200 and box["height"] >= 120:
                target = el
                break
        except Exception:
            continue
    if target is None:
        return False, "no sizable iframe"

    # Give bundle a moment to paint inside iframe; screenshot the iframe element
    # (do not call content_frame — some Playwright builds return a non-callable FrameLocator).
    page.wait_for_timeout(2000)
    try:
        shot_path.parent.mkdir(parents=True, exist_ok=True)
        target.screenshot(path=str(shot_path))
        size = shot_path.stat().st_size if shot_path.exists() else 0
        if size < 1500:
            return False, f"tiny shot {size} src={src[:80]}"
        return True, f"ok size={size} src={src[:100]}"
    except Exception as e:
        return False, f"shot: {e}"


def find_replacements(n: int, used_urls: set[str], used_ids: set[str]) -> list[dict]:
    out: list[dict] = []
    for cat in ["card", "button", "input", "hero", "features"]:
        if len(out) >= n:
            break
        try:
            md = http_text(
                f"https://21st.dev/community/components/s/{cat}.md",
                {**UA, "Accept": "text/markdown"},
            )
        except Exception as e:
            print("list fail", cat, e)
            continue
        seen = set()
        for m in re.finditer(
            r"- \[([^\]]+)\]\((https://21st\.dev/@([^/]+)/components/([^)\s]+))\)",
            md,
        ):
            if len(out) >= n:
                break
            title, _url, author, rest = m.group(1), m.group(2), m.group(3), m.group(4)
            rest = rest.removesuffix(".md")
            if "/" in rest:
                continue
            if author.lower() == "dillionverma":
                continue
            if title.lower().startswith("not found"):
                continue
            key = (author.lower(), rest.lower())
            if key in seen:
                continue
            seen.add(key)
            page_url = f"https://21st.dev/@{author}/components/{rest}"
            if page_url.lower() in used_urls:
                continue
            rid = ensure_id(f"21st-{author}-{rest}")
            if len(rid) > 80:
                rid = ensure_id(f"21st-{author}-{rest[:40]}")
            if rid in used_ids:
                continue
            if not page_works(page_url):
                print("  skip dead", page_url)
                continue
            out.append(
                {
                    "cat": cat,
                    "title": title.strip(),
                    "author": author,
                    "slug": rest,
                    "source_url": page_url,
                    "id": rid,
                    "scene": SCENE_BY_CAT.get(cat, ["landing"]),
                }
            )
            used_urls.add(page_url.lower())
            used_ids.add(rid)
            print("  replace candidate", rid)
    return out


def build_rec(meta: dict, shot_rel: str) -> dict:
    author, slug = meta["author"], meta["slug"]
    source_url = meta["source_url"]
    usage = (
        f"Browse live preview: {source_url}\n\n"
        f"Install via 21st registry (requires API key):\n\n"
        f'```bash\nnpx shadcn@latest add "https://21st.dev/r/{author}/{slug}?api_key=$API_KEY_21ST"\n```'
    )
    notes_extra = ""
    try:
        cmd = http_text(source_url + ".md", {**UA, "Accept": "text/markdown"})
        lic = re.search(r"- License:\s*(.+)", cmd)
        deps = re.search(r"- npm dependencies:\s*(.+)", cmd)
        lib = re.search(r"- Library:\s*\[([^\]]+)\]", cmd)
        bits = []
        if lib:
            bits.append(f"library: {lib.group(1)}")
        if lic:
            bits.append(f"license reported: {lic.group(1).strip()}")
        if deps:
            bits.append(f"deps: {deps.group(1).strip()}")
        if bits:
            notes_extra = " " + "; ".join(bits) + "."
    except Exception:
        pass
    return {
        "id": meta["id"],
        "title": meta["title"],
        "source_url": source_url,
        "kind": "component",
        "source": "21st",
        "vibe": ["产品级组件橱窗"],
        "scene": meta["scene"],
        "stack": ["react", "tailwind", "typescript"],
        "license": "mixed",
        "preview": {"screenshot": shot_rel, "embed_url": source_url},
        "usage": usage,
        "notes": (
            f"Auto-harvested from 21st community category `{meta['cat']}`. "
            f"Author `@{author}`.{notes_extra} "
            "vibe/scene provisional for review. "
            "Screenshot from Playwright capture of live component preview iframe (cdn.21st.dev), not OG. "
            "Skipped Magic UI (@dillionverma) duplicates. "
            "Replaced a prior inbox entry whose live page 404'd."
        ),
        "status": "pending_review",
        "created_at": NOW,
        "updated_at": NOW,
    }


def main():
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    HARVEST.mkdir(parents=True, exist_ok=True)

    files = sorted(INBOX.glob("21st-*.json"))
    print(f"21st inbox files: {len(files)}")

    ok = fail = replaced = 0
    failed_ids: list[str] = []
    results: list[dict] = []

    # Phase 1: remove broken entries (shot + json), collect used urls/ids
    used_urls: set[str] = set()
    used_ids: set[str] = set()
    keep_files: list[Path] = []
    for path in files:
        rec = json.loads(path.read_text(encoding="utf-8"))
        rid = rec["id"]
        if rid in BROKEN_IDS:
            shot = ROOT / "public" / rec.get("preview", {}).get("screenshot", "").lstrip("/")
            print("remove broken", rid)
            path.unlink(missing_ok=True)
            if shot.exists():
                shot.unlink()
            continue
        used_urls.add(rec["source_url"].rstrip("/").lower())
        used_ids.add(rid)
        keep_files.append(path)

    replacements = find_replacements(len(BROKEN_IDS), used_urls, used_ids)
    print(f"replacements found: {len(replacements)} (need {len(BROKEN_IDS)})")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)

        # Phase 2: recapture keepers
        for i, path in enumerate(keep_files, 1):
            rec = json.loads(path.read_text(encoding="utf-8"))
            rid = rec["id"]
            url = rec.get("source_url") or rec.get("preview", {}).get("embed_url")
            shot_rel = rec.get("preview", {}).get("screenshot") or f"/previews/21st/{rid}.png"
            shot_path = ROOT / "public" / shot_rel.lstrip("/")
            print(f"[{i}/{len(keep_files)}] {rid}")
            success, msg = capture_iframe(page, url, shot_path)
            if success:
                rec.setdefault("preview", {})
                rec["preview"]["screenshot"] = shot_rel
                rec["preview"]["embed_url"] = url
                rec["notes"] = update_notes(rec.get("notes", ""))
                rec["updated_at"] = NOW
                write_json(path, rec)
                ok += 1
                results.append({"id": rid, "status": "ok", "msg": msg})
                print("  OK", msg)
            else:
                fail += 1
                failed_ids.append(rid)
                results.append({"id": rid, "status": "fail", "msg": msg})
                print("  FAIL", msg)
            time.sleep(0.15)

        # Phase 3: add replacements
        for meta in replacements:
            rid = meta["id"]
            shot_rel = f"/previews/21st/{rid}.png"
            shot_path = ROOT / "public" / shot_rel.lstrip("/")
            print(f"[replace] {rid}")
            success, msg = capture_iframe(page, meta["source_url"], shot_path)
            if not success:
                print("  FAIL replace", msg)
                failed_ids.append(rid)
                fail += 1
                results.append({"id": rid, "status": "replace_fail", "msg": msg})
                continue
            rec = build_rec(meta, shot_rel)
            write_json(INBOX / f"{rid}.json", rec)
            replaced += 1
            ok += 1
            results.append({"id": rid, "status": "replaced", "msg": msg})
            print("  OK", msg)
            time.sleep(0.15)

        browser.close()

    summary = {
        "ok": ok,
        "fail": fail,
        "replaced": replaced,
        "removed_broken": sorted(BROKEN_IDS),
        "failed_ids": failed_ids,
        "inbox_21st_count": len(list(INBOX.glob("21st-*.json"))),
        "preview_21st_count": len(list(PREVIEWS.glob("*.png"))),
        "results": results,
    }
    (HARVEST / "21st-recapture-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("SUMMARY", json.dumps({k: v for k, v in summary.items() if k != "results"}, indent=2))


if __name__ == "__main__":
    main()
