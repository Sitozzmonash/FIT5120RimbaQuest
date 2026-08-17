#!/usr/bin/env python3
"""
Batch download species images from Wikimedia Commons.
Usage: python fetch_species_batch.py <max_batch>
Reads species from DB, checks which are missing images, downloads up to <max_batch>.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
import subprocess
import re
from pathlib import Path

ROOT = Path(r"D:\Documents\ChatGPT\RimbaQuest鏋勫缓")
DB = ROOT / "backend" / "data" / "RimbaQuest.db"
OUTPUT = ROOT / "rimbaquest" / "assets" / "species"
MANIFEST = OUTPUT / "commons-attribution.json"
TYPESCRIPT = ROOT / "rimbaquest" / "src" / "app" / "index.tsx"

def get_db_species():
    """Get all species from SQLite database."""
    result = subprocess.run(
        ["sqlite3", str(DB), "SELECT id, common_name, scientific_name, category FROM species ORDER BY id;"],
        capture_output=True, text=True
    )
    species = []
    for line in result.stdout.strip().split("\n"):
        parts = line.split("|")
        if len(parts) >= 4:
            species.append({
                "id": parts[0],
                "common_name": parts[1],
                "scientific_name": parts[2],
                "category": parts[3]
            })
    return species

def get_existing_images():
    """Get set of species IDs that already have images."""
    existing = set()
    for f in OUTPUT.iterdir():
        if f.suffix.lower() == ".jpg" and f.stem.startswith("sp_"):
            existing.add(f.stem)
    return existing

def load_manifest():
    """Load existing attribution manifest."""
    if MANIFEST.exists():
        with open(MANIFEST, encoding="utf-8-sig") as f:
            return json.load(f)
    return {}

def save_manifest(manifest):
    """Save attribution manifest."""
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

def search_commons(scientific_name, max_retries=3):
    """Search Wikimedia Commons for the best image of a species."""
    query = urllib.parse.quote(scientific_name)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&generator=search&gsrsearch={query}"
        f"&gsrnamespace=6&gsrlimit=10"
        f"&prop=imageinfo&iiprop=url%7Cextmetadata"
        f"&iiurlwidth=900&format=json"
    )

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "RimbaQuest/1.0 (species image enrichment; educational project)"
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode())

            pages = data.get("query", {}).get("pages", {})
            if not pages:
                return None

            # Skip non-image file types (audio, video, etc.)
            skip_extensions = ('.mp3', '.ogg', '.wav', '.flac', '.ogv', '.webm', '.mp4', '.svg')

            candidates = []
            for page_id, page in pages.items():
                title = page.get("title", "")
                title_lower = title.lower()

                # Skip audio/video/svg files
                if any(title_lower.endswith(ext) for ext in skip_extensions):
                    continue

                # Skip distribution maps, range maps, diagrams
                skip_keywords = ['distribution', 'range map', 'map.svg', 'diagram', 'illustration']
                if any(kw in title_lower for kw in skip_keywords):
                    continue

                imageinfo = page.get("imageinfo", [])
                if not imageinfo:
                    continue
                info = imageinfo[0]
                thumburl = info.get("thumburl")
                extmeta = info.get("extmetadata", {})
                license_short = None
                if extmeta.get("LicenseShortName"):
                    license_short = extmeta["LicenseShortName"].get("value")

                if thumburl and license_short:
                    name_lower = scientific_name.lower()
                    # Prefer exact scientific name matches in title
                    exact = name_lower in title_lower
                    candidates.append({
                        "title": title,
                        "thumburl": thumburl,
                        "descriptionurl": info.get("descriptionurl"),
                        "license": license_short,
                        "license_url": extmeta.get("LicenseUrl", {}).get("value") if extmeta.get("LicenseUrl") else None,
                        "author": extmeta.get("Artist", {}).get("value") if extmeta.get("Artist") else None,
                        "attribution": extmeta.get("Attribution", {}).get("value") if extmeta.get("Attribution") else None,
                        "exact": exact
                    })

            if not candidates:
                return None

            # Sort: exact match first, then by thumbnail URL quality
            candidates.sort(key=lambda c: (not c["exact"], c["thumburl"]))
            return candidates[0]

        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 5 * (attempt + 1)
                print(f"  429 rate limit, waiting {wait}s...")
                time.sleep(wait)
                continue
            print(f"  HTTP error: {e.code}")
            return None
        except Exception as e:
            print(f"  Error: {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
                continue
            return None
    return None

def download_image(url, output_path):
    """Download an image from URL to file."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "RimbaQuest/1.0 (species image enrichment; educational project)"
        })
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        if len(data) < 5000:
            return False, f"Too small: {len(data)} bytes"
        with open(output_path, "wb") as f:
            f.write(data)
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    max_batch = int(sys.argv[1]) if len(sys.argv) > 1 else 10

    species = get_db_species()
    existing = get_existing_images()
    manifest = load_manifest()

    missing = [s for s in species if s["id"] not in existing]
    print(f"Total species: {len(species)}")
    print(f"Existing images: {len(existing)}")
    print(f"Missing images: {len(missing)}")

    batch = missing[:max_batch]
    print(f"\nProcessing batch of {len(batch)}:")

    results = {"ok": [], "fail": [], "miss": []}

    for i, sp in enumerate(batch):
        print(f"\n[{i+1}/{len(batch)}] {sp['id']} - {sp['common_name']} ({sp['scientific_name']})")

        if sp["id"] in manifest:
            print(f"  Already in manifest, skipping")
            continue

        result = search_commons(sp["scientific_name"])
        if not result:
            print(f"  MISS - no suitable image found on Commons")
            results["miss"].append(sp["id"])
            time.sleep(1.0)
            continue

        print(f"  Found: {result['title']} ({result['license']})")

        out_path = OUTPUT / f"{sp['id']}.jpg"
        success, error = download_image(result["thumburl"], out_path)
        if not success:
            print(f"  FAIL - download error: {error}")
            results["fail"].append(sp["id"])
            time.sleep(1.0)
            continue

        # Add to manifest
        manifest[sp["id"]] = {
            "species": sp["common_name"],
            "scientific_name": sp["scientific_name"],
            "page": result["descriptionurl"],
            "url": result["thumburl"],
            "licence": result["license"],
            "licence_url": result["license_url"],
            "author": result["author"],
            "attribution": result["attribution"],
            "title": result["title"]
        }

        print(f"  OK - downloaded to {sp['id']}.jpg ({os.path.getsize(out_path)} bytes)")
        results["ok"].append(sp["id"])

        # Save manifest after each download
        save_manifest(manifest)

        # Rate limit
        time.sleep(1.5)

    print(f"\n{'='*50}")
    print(f"Batch complete: {len(results['ok'])} OK, {len(results['fail'])} FAIL, {len(results['miss'])} MISS")
    if results["ok"]:
        print(f"Downloaded: {', '.join(results['ok'])}")
    if results["fail"]:
        print(f"Failed: {', '.join(results['fail'])}")
    if results["miss"]:
        print(f"Missing from Commons: {', '.join(results['miss'])}")

if __name__ == "__main__":
    main()
