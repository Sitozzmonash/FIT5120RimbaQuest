"""Fetch one attributed Wikimedia Commons thumbnail for each missing species asset.

The script deliberately does not overwrite the hand-curated originals.  It
keeps an attribution manifest beside the images so the source and licence can
be surfaced or audited later.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
DATABASE = ROOT / "backend" / "data" / "RimbaQuest.db"
OUTPUT = ROOT / "rimbaquest" / "assets" / "species"
MANIFEST = OUTPUT / "commons-attribution.json"
API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "RimbaQuest educational prototype/1.0 (asset enrichment)"}


def get_json(params: dict[str, str]) -> dict:
    request = Request(f"{API}?{urlencode(params)}", headers=HEADERS)
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def candidate_for(scientific_name: str) -> dict | None:
    data = get_json({
        "action": "query",
        "generator": "search",
        "gsrsearch": scientific_name,
        "gsrnamespace": "6",
        "gsrlimit": "8",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": "900",
        "format": "json",
    })
    pages = data.get("query", {}).get("pages", {}).values()
    scientific = scientific_name.casefold()
    choices = []
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        url = info.get("thumburl")
        metadata = info.get("extmetadata", {})
        if not url or not metadata.get("LicenseShortName"):
            continue
        title = page.get("title", "").casefold()
        choices.append((0 if scientific in title else 1, page, info))
    if not choices:
        return None
    _, page, info = sorted(choices, key=lambda choice: choice[0])[0]
    metadata = info["extmetadata"]
    return {
        "url": info["thumburl"],
        "page": info.get("descriptionurl"),
        "title": page.get("title"),
        "licence": metadata.get("LicenseShortName", {}).get("value"),
        "author": metadata.get("Artist", {}).get("value"),
        "attribution": metadata.get("Attribution", {}).get("value"),
        "licence_url": metadata.get("LicenseUrl", {}).get("value"),
    }


def download(url: str, path: Path) -> None:
    request = Request(url, headers=HEADERS)
    with urlopen(request, timeout=60) as response:
        data = response.read()
    if len(data) < 5_000:
        raise ValueError("downloaded file is unexpectedly small")
    path.write_bytes(data)


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    connection = sqlite3.connect(DATABASE)
    rows = connection.execute(
        "SELECT id, common_name, scientific_name FROM species ORDER BY id"
    ).fetchall()
    missing = [row for row in rows if not (OUTPUT / f"{row[0]}.jpg").exists()]
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(missing)
    successes = 0
    for species_id, common_name, scientific_name in missing[:limit]:
        if not scientific_name:
            print(f"SKIP {species_id}: no scientific name")
            continue
        try:
            source = candidate_for(scientific_name)
            if not source:
                print(f"MISS {species_id}: no licensed Commons result")
                continue
            target = OUTPUT / f"{species_id}.jpg"
            download(source["url"], target)
            manifest[species_id] = {
                "species": common_name,
                "scientific_name": scientific_name,
                **source,
            }
            successes += 1
            print(f"OK {species_id}: {source['title']}")
        except Exception as error:  # keep going so one missing image is not fatal
            print(f"FAIL {species_id}: {error}")
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Downloaded {successes}/{min(limit, len(missing))} missing images")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
