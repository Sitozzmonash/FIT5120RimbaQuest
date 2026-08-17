#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Batch download species images from Wikimedia Commons.
Usage: python fetch_species_batch.py <max_batch>
Reads species from DB, checks which are missing images, downloads up to <max_batch>.
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
import subprocess
from pathlib import Path

ROOT = Path(r"D:\Documents\ChatGPT\RimbaQuest构建")
DB = ROOT / "backend" / "data" / "RimbaQuest.db"
OUTPUT = ROOT / "rimbaquest" / "assets" / "species"
MANIFEST = OUTPUT / "commons-attribution.json"


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


# Skipped file types (commons pages ending in these are not photos)
SKIP_EXTENSIONS = (
    '.mp3', '.ogg', '.wav', '.flac', '.ogv', '.webm', '.mp4', '.mkv',
    '.svg', '.pdf', '.tif', '.tiff', '.djvu', '.xcf', '.psd', '.gif',
    '.odt', '.doc', '.docx', '.zip', '.tar', '.gz', '.7z', '.exe',
)
# Year-in-filename pattern, e.g. "Eupetes macrocerus 1838.jpg" - historic plates/specimens
YEAR_AT_END = re.compile(r'[\s_-]\d{4}\.(jpg|jpeg)$', re.IGNORECASE)
YEAR_MID = re.compile(r'\b(18|19)\d{2}\b')
# Keywords indicating non-photo content
SKIP_KEYWORDS = (
    'distribution', 'range map', 'diagram', 'illustration', 'stamp', 'print',
    'iconographia', 'engraving', 'museum', 'specimen', 'painting', 'drawing',
    'plush', 'toy', 'sculpture', 'taxidermy', 'skull', 'skeleton', 'fossil',
    'reconstruction', 'deer park', 'zoo sign', 'antique', 'map of',
    'distribution of', 'habitat of', 'plate from', 'after ', 'drawn by',
    'sketch', 'lithograph', 'chromolithograph', 'watercolour', 'checklist',
)


def title_needs_skip(title):
    """Return True if the Commons file title is likely not a wildlife photo."""
    low = title.lower()
    if any(low.endswith(ext) for ext in SKIP_EXTENSIONS):
        return True
    if YEAR_AT_END.search(low):
        return True
    if any(kw in low for kw in SKIP_KEYWORDS):
        return True
    return False


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

            candidates = []
            for page_id, page in pages.items():
                title = page.get("title", "")
                if title_needs_skip(title):
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
                    exact = name_lower in title.lower()
                    candidates.append({
                        "title": title,
                        "thumburl": thumburl,
                        "descriptionurl": info.get("descriptionurl"),
                        "license": license_short,
                        "license_url": extmeta.get("LicenseUrl", {}).get("value") if extmeta.get("LicenseUrl") else None,
                        "author": extmeta.get("Artist", {}).get("value") if extmeta.get("Artist") else None,
                        "attribution": extmeta.get("Attribution", {}).get("value") if extmeta.get("Attribution") else None,
                        "exact": exact,
                        "width": info.get("width") or 0,
                        "height": info.get("height") or 0,
                    })

            if not candidates:
                return None

            # Prefer exact scientific-name matches, then larger images
            candidates.sort(key=lambda c: (not c["exact"], -c["width"]))
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


def is_jpeg(data):
    """Check JPEG magic bytes."""
    return data[:3] == b'\xff\xd8\xff'


def download_image(url, output_path, max_retries=4):
    """Download an image from URL to file."""
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "RimbaQuest/1.0 (species image enrichment; educational project)"
            })
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if len(data) < 5000:
                return False, f"Too small: {len(data)} bytes"
            if not is_jpeg(data):
                # If we got a non-JPEG (e.g. PDF rename), try one more time then give up
                if not data[:4] == b'%PDF':
                    return False, f"Not a JPEG (magic: {data[:8].hex()})"
                return False, "Downloaded a PDF, not an image"
            with open(output_path, "wb") as f:
                f.write(data)
            return True, None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 15 * (attempt + 1)
                print(f"  Download 429, waiting {wait}s...")
                time.sleep(wait)
                continue
            return False, str(e)
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"  Download error, retrying... ({e})")
                time.sleep(5)
                continue
            return False, str(e)
    return False, "max retries exceeded"


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

        if (OUTPUT / f"{sp['id']}.jpg").exists():
                    print(f"  Already has image file, skipping")
                    continue

        result = search_commons(sp["scientific_name"])
        if not result:
            print(f"  MISS - no suitable image found on Commons")
            results["miss"].append(sp["id"])
            time.sleep(1.0)
            continue

        print(f"  Found: {result['title']} ({result['license']}) {result['width']}px")

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
        time.sleep(2.5)

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