#!/usr/bin/env python3
"""Harvest batch 2: Uiverse + 21st.dev components + preview screenshots."""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "data" / "inbox"
PREVIEWS = ROOT / "public" / "previews"
HARVEST = ROOT / "_harvest"
GALAXY = HARVEST / "galaxy"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
UA = {"User-Agent": "ui-resource-lab-harvest/0.1 (local; research batch2)"}
GH = {"User-Agent": "ui-resource-lab-harvest", "Accept": "application/vnd.github+json"}

ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


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
        raise ValueError(f"bad id: {raw} -> {s}")
    return s


def http_json(url: str, headers: dict | None = None):
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_text(url: str, headers: dict | None = None) -> str:
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read().decode("utf-8", "replace")


def http_bytes(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read()


def write_json(path: Path, obj: dict) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---------- Uiverse ----------
def list_galaxy(category: str) -> list[dict]:
    url = f"https://api.github.com/repos/uiverse-io/galaxy/contents/{urllib.parse.quote(category)}"
    data = http_json(url, GH)
    if not isinstance(data, list):
        raise RuntimeError(f"galaxy {category}: {data}")
    return [x for x in data if x.get("type") == "file" and x["name"].endswith(".html")]


def pick_spread(items: list[dict], n: int) -> list[dict]:
    if len(items) <= n:
        return items
    step = len(items) / n
    return [items[int(i * step)] for i in range(n)]


def parse_galaxy_meta(filename: str, html: str) -> tuple[str, str, str]:
    # filename: Author_name-with-dashes-99.html
    stem = filename[:-5]
    if "_" not in stem:
        author, name = "unknown", stem
    else:
        author, name = stem.split("_", 1)
    # comment: /* From Uiverse.io by AUTHOR  - Tags: ... */
    m = re.search(r"From Uiverse\.io by\s+([^\s*-]+)", html)
    if m:
        author = m.group(1).strip()
    tags = []
    tm = re.search(r"Tags:\s*([^*]+)\*/", html)
    if tm:
        tags = [t.strip() for t in tm.group(1).split(",") if t.strip()]
    return author, name, ", ".join(tags)


def scene_for_uiverse_cat(cat: str) -> list[str]:
    mapping = {
        "Buttons": ["landing", "marketing"],
        "Cards": ["marketing", "landing"],
        "loaders": ["app-shell"],
        "Inputs": ["app-shell", "docs"],
        "Forms": ["app-shell"],
        "Toggle-switches": ["app-shell"],
    }
    return mapping.get(cat, ["landing"])


def harvest_uiverse(targets: dict[str, int]) -> list[dict]:
    GALAXY.mkdir(parents=True, exist_ok=True)
    (PREVIEWS / "uiverse").mkdir(parents=True, exist_ok=True)
    selected: list[tuple[str, dict]] = []
    for cat, n in targets.items():
        files = list_galaxy(cat)
        picked = pick_spread(files, n)
        print(f"uiverse {cat}: {len(files)} available, picking {len(picked)}")
        for f in picked:
            selected.append((cat, f))

    records = []
    wrap_dir = HARVEST / "wraps"
    wrap_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 800, "height": 500}, device_scale_factor=2)

        for cat, f in selected:
            name = f["name"]
            try:
                html = http_text(f["download_url"], UA)
            except Exception as e:
                print("  skip download", name, e)
                continue
            author, comp_name, tags = parse_galaxy_meta(name, html)
            rid = ensure_id(f"uiverse-{author}-{comp_name}")
            # keep id length reasonable
            if len(rid) > 80:
                rid = ensure_id(f"uiverse-{author}-{comp_name[:40]}")
            shot_rel = f"/previews/uiverse/{rid}.png"
            shot_path = ROOT / "public" / shot_rel.lstrip("/")

            local_html = GALAXY / name
            local_html.write_text(html, encoding="utf-8")
            wrapped = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<style>
html,body{{margin:0;padding:0;background:#111113;color:#fafafa;}}
.wrap{{display:flex;align-items:center;justify-content:center;min-height:360px;padding:48px;box-sizing:border-box;}}
</style></head><body><div class="wrap">{html}</div></body></html>"""
            wrap_path = wrap_dir / f"{rid}.html"
            wrap_path.write_text(wrapped, encoding="utf-8")
            try:
                page.goto(wrap_path.resolve().as_uri(), wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(400)
                page.locator(".wrap").screenshot(path=str(shot_path))
            except Exception as e:
                print("  shot fail", rid, e)
                continue

            title = comp_name.replace("-", " ").strip().title()
            source_url = f"https://uiverse.io/{author}/{comp_name}"
            note_tags = f" tags: {tags}." if tags else ""
            rec = {
                "id": rid,
                "title": title,
                "source_url": source_url,
                "kind": "component",
                "source": "uiverse",
                "vibe": ["趣味交互"],
                "scene": scene_for_uiverse_cat(cat),
                "stack": ["html", "css"],
                "license": "free",
                "preview": {
                    "screenshot": shot_rel,
                    "embed_url": source_url,
                },
                "usage": (
                    f"Harvested from Uiverse galaxy (`{cat}/{name}`).\n\n"
                    f"Open {source_url} and copy HTML/CSS (MIT via uiverse-io/galaxy)."
                ),
                "notes": (
                    f"Auto-harvested from https://github.com/uiverse-io/galaxy ({cat}). "
                    f"Author `{author}`.{note_tags} vibe/scene provisional for review. "
                    "Screenshot rendered locally from galaxy HTML+CSS."
                ),
                "status": "pending_review",
                "created_at": NOW,
                "updated_at": NOW,
            }
            out = INBOX / f"{rid}.json"
            if out.exists():
                print("  exists", rid)
                continue
            write_json(out, rec)
            records.append(rec)
            print(f"  + {rid}")

        browser.close()
    return records


# ---------- 21st.dev ----------
CATEGORY_MD = {
    "button": ("Buttons", ["landing", "app-shell"]),
    "hero": ("Hero", ["landing", "marketing"]),
    "features": ("Features", ["landing", "marketing"]),
    "card": ("Cards", ["marketing", "landing"]),
    "input": ("Inputs", ["app-shell", "docs"]),
}

SKIP_AUTHORS = {
    "dillionverma",  # Magic UI already harvested
}


def parse_21st_list(md: str) -> list[tuple[str, str, str]]:
    """Return list of (title, author, path_without_md) unique by author/slug base."""
    # - [Title](https://21st.dev/@author/components/slug...) — by Author
    items = []
    seen = set()
    for m in re.finditer(
        r"- \[([^\]]+)\]\((https://21st\.dev/@([^/]+)/components/([^)\s]+))\)",
        md,
    ):
        title, url, author, rest = m.group(1), m.group(2), m.group(3), m.group(4)
        rest = rest.removesuffix(".md")
        # base slug = first segment under components/
        slug = rest.split("/")[0]
        key = (author.lower(), slug.lower())
        if key in seen:
            continue
        if author.lower() in SKIP_AUTHORS:
            continue
        if title.lower().startswith("not found"):
            continue
        seen.add(key)
        items.append((title.strip(), author, slug))
    return items


def harvest_21st(per_cat: int = 14) -> list[dict]:
    (PREVIEWS / "21st").mkdir(parents=True, exist_ok=True)
    records = []
    existing = {p.stem for p in INBOX.glob("*.json")}

    for cat, (label, scenes) in CATEGORY_MD.items():
        url = f"https://21st.dev/community/components/s/{cat}.md"
        try:
            md = http_text(url, {**UA, "Accept": "text/markdown"})
        except Exception as e:
            print("21st list fail", cat, e)
            continue
        Path(HARVEST / f"21st-{cat}.md").write_text(md, encoding="utf-8")
        items = parse_21st_list(md)
        picked = items[:per_cat]
        print(f"21st {cat}: {len(items)} unique, picking {len(picked)}")

        for title, author, slug in picked:
            rid = ensure_id(f"21st-{author}-{slug}")
            if len(rid) > 80:
                rid = ensure_id(f"21st-{author}-{slug[:40]}")
            if rid in existing:
                print("  skip existing", rid)
                continue
            source_url = f"https://21st.dev/@{author}/components/{slug}"
            shot_rel = f"/previews/21st/{rid}.png"
            shot_path = ROOT / "public" / shot_rel.lstrip("/")
            og_url = f"https://21st.dev/og/component/{author}/{slug}"
            try:
                data = http_bytes(og_url, {**UA, "Accept": "image/png,image/*"})
                if data[:8] != b"\x89PNG\r\n\x1a\n":
                    # might be HTML; try playwright later
                    print("  og not png", rid, data[:20])
                    continue
                shot_path.write_bytes(data)
            except Exception as e:
                print("  og fail", rid, e)
                continue

            # Try fetch component md for install hint (no API key required for metadata)
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

            rec = {
                "id": rid,
                "title": title,
                "source_url": source_url,
                "kind": "component",
                "source": "21st",
                "vibe": ["产品级组件橱窗"],
                "scene": scenes,
                "stack": ["react", "tailwind", "typescript"],
                "license": "mixed",
                "preview": {
                    "screenshot": shot_rel,
                    "embed_url": source_url,
                },
                "usage": usage,
                "notes": (
                    f"Auto-harvested from 21st community category `{cat}` ({label}). "
                    f"Author `@{author}`.{notes_extra} "
                    "vibe/scene provisional for review. Screenshot from 21st OG image. "
                    "Skipped Magic UI (@dillionverma) duplicates."
                ),
                "status": "pending_review",
                "created_at": NOW,
                "updated_at": NOW,
            }
            write_json(INBOX / f"{rid}.json", rec)
            existing.add(rid)
            records.append(rec)
            print(f"  + {rid}")
            time.sleep(0.15)

    return records


# ---------- Backfill shadcn / magicui screenshots ----------
def backfill_registry_shots(prefix: str, limit: int | None = None) -> tuple[int, int, list[str]]:
    """Screenshot [data-slot=preview] on docs pages. Returns (ok, fail, failed_ids)."""
    files = sorted(INBOX.glob(f"{prefix}-*.json"))
    if limit is not None:
        files = files[:limit]
    out_dir = PREVIEWS / prefix
    out_dir.mkdir(parents=True, exist_ok=True)
    ok = fail = 0
    failed: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
        for i, path in enumerate(files, 1):
            rec = json.loads(path.read_text(encoding="utf-8"))
            rid = rec["id"]
            url = rec.get("source_url") or rec.get("preview", {}).get("embed_url")
            if not url:
                fail += 1
                failed.append(rid)
                continue
            shot_rel = f"/previews/{prefix}/{rid}.png"
            shot_path = ROOT / "public" / shot_rel.lstrip("/")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(900)
                loc = page.locator('[data-slot="preview"]')
                if loc.count() == 0:
                    loc = page.locator(".preview")
                if loc.count() == 0:
                    raise RuntimeError("no preview slot")
                # prefer first sizable preview
                target = None
                for j in range(min(loc.count(), 5)):
                    box = loc.nth(j).bounding_box()
                    if box and box["width"] >= 120 and box["height"] >= 60:
                        target = loc.nth(j)
                        break
                if target is None:
                    target = loc.first
                target.screenshot(path=str(shot_path))
                rec.setdefault("preview", {})
                rec["preview"]["screenshot"] = shot_rel
                if "embed_url" not in rec["preview"] and url:
                    rec["preview"]["embed_url"] = url
                rec["updated_at"] = NOW
                notes = rec.get("notes") or ""
                if "screenshot backfilled" not in notes:
                    rec["notes"] = (
                        notes + " Screenshot backfilled from docs page preview region."
                    ).strip()
                write_json(path, rec)
                ok += 1
                print(f"  [{i}/{len(files)}] ok {rid}")
            except Exception as e:
                fail += 1
                failed.append(rid)
                print(f"  [{i}/{len(files)}] FAIL {rid}: {e}")
            time.sleep(0.2)
        browser.close()
    return ok, fail, failed


def main():
    print("=== Uiverse harvest ===")
    uiverse = harvest_uiverse(
        {
            "Buttons": 20,
            "Cards": 20,
            "loaders": 15,
            "Inputs": 15,
            "Toggle-switches": 5,
            "Forms": 5,
        }
    )
    print("uiverse written", len(uiverse))

    print("=== 21st harvest ===")
    twenty = harvest_21st(per_cat=14)
    print("21st written", len(twenty))

    print("=== backfill shadcn screenshots (all) ===")
    s_ok, s_fail, s_failed = backfill_registry_shots("shadcn")
    print("shadcn shots", s_ok, "fail", s_fail)

    print("=== backfill magicui screenshots (all) ===")
    m_ok, m_fail, m_failed = backfill_registry_shots("magicui")
    print("magicui shots", m_ok, "fail", m_fail)

    summary = {
        "uiverse": len(uiverse),
        "21st": len(twenty),
        "shadcn_shots_ok": s_ok,
        "shadcn_shots_fail": s_fail,
        "shadcn_failed_ids": s_failed,
        "magicui_shots_ok": m_ok,
        "magicui_shots_fail": m_fail,
        "magicui_failed_ids": m_failed,
        "uiverse_ids": [r["id"] for r in uiverse],
        "21st_ids": [r["id"] for r in twenty],
    }
    (HARVEST / "batch2-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("SUMMARY", json.dumps({k: v for k, v in summary.items() if not k.endswith("_ids")}, indent=2))


if __name__ == "__main__":
    main()
