#!/usr/bin/env python3
from __future__ import annotations
import json, re, shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(r"C:\Users\yunsh\Projects\ui-resource-lab")
INBOX = ROOT / "data" / "inbox"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
VIBE_U = "\u8da3\u5473\u4ea4\u4e92"
VIBE_21 = "\u4ea7\u54c1\u7ea7\u7ec4\u4ef6\u6a71\u7a97"
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def slugify(text: str) -> str:
    text = text.lower().replace("_", "-").replace(".", "-").replace(" ", "-")
    text = re.sub(r"[^a-z0-9-]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "item"

def ensure_id(raw: str) -> str:
    s = slugify(raw)
    if not ID_RE.match(s):
        raise ValueError(s)
    return s

def repair_uiverse():
    renames = []
    for path in sorted(INBOX.glob("uiverse-*.json")):
        rec = json.loads(path.read_text(encoding="utf-8"))
        m = re.search(r"galaxy \(`[^/]+/([^`]+)\.html`\)", rec.get("usage", ""))
        if not m:
            print("no filename", path.name)
            continue
        stem = m.group(1)
        if "_" not in stem:
            author, name = "unknown", stem
        else:
            author, name = stem.split("_", 1)
        new_id = ensure_id(f"uiverse-{author}-{name}")
        if len(new_id) > 90:
            new_id = ensure_id(f"uiverse-{author}-{name[:50]}")
        source_url = f"https://uiverse.io/{author}/{name}"
        old_shot = rec.get("preview", {}).get("screenshot", "")
        new_shot_rel = f"/previews/uiverse/{new_id}.png"
        old_shot_path = ROOT / "public" / old_shot.lstrip("/") if old_shot else None
        new_shot_path = ROOT / "public" / new_shot_rel.lstrip("/")
        if old_shot_path and old_shot_path.exists() and old_shot_path != new_shot_path:
            new_shot_path.parent.mkdir(parents=True, exist_ok=True)
            if new_shot_path.exists():
                new_shot_path.unlink()
            old_shot_path.rename(new_shot_path)

        title = name.replace("-", " ").strip().title()
        tags_m = re.search(r"tags: ([^.]+)\.", rec.get("notes", ""), re.I)
        tags = tags_m.group(1) if tags_m else ""
        note_tags = f" tags: {tags}." if tags else ""
        # rebuild usage keeping galaxy path
        um = re.search(r"galaxy \(`([^`]+)`\)", rec.get("usage", ""))
        galaxy_path = um.group(1) if um else f"unknown/{stem}.html"
        rec.update({
            "id": new_id,
            "title": title,
            "source_url": source_url,
            "vibe": [VIBE_U],
            "preview": {"screenshot": new_shot_rel, "embed_url": source_url},
            "usage": (
                f"Harvested from Uiverse galaxy (`{galaxy_path}`).\n\n"
                f"Open {source_url} and copy HTML/CSS (MIT via uiverse-io/galaxy)."
            ),
            "notes": (
                f"Auto-harvested from https://github.com/uiverse-io/galaxy. Author `{author}`.{note_tags} "
                "vibe/scene provisional for review. Screenshot rendered locally from galaxy HTML+CSS."
            ),
            "updated_at": NOW,
        })
        new_path = INBOX / f"{new_id}.json"
        if path != new_path:
            if new_path.exists() and new_path != path:
                new_path.unlink()
            path.unlink(missing_ok=True)
            renames.append((path.name, new_path.name))
        new_path.write_text(json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("fixed", new_id)
    print("renames", len(renames))

def repair_21st():
    for path in sorted(INBOX.glob("21st-*.json")):
        rec = json.loads(path.read_text(encoding="utf-8"))
        rec["vibe"] = [VIBE_21]
        rec["updated_at"] = NOW
        path.write_text(json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("vibe", path.name)

if __name__ == "__main__":
    print(VIBE_U, VIBE_21)
    repair_uiverse()
    repair_21st()
