"""Read-only quality checks for the runtime catalogue in ``data/seed.sql``.

Run from the repository root with ``python backend/tools/validate_seed_data.py``.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
SEED_SQL = BACKEND_ROOT / "data" / "seed.sql"
IMAGE_DIR = REPO_ROOT / "rimbaquest" / "assets" / "species"
REQUIRED_SPECIES_FIELDS = ("id", "common_name", "category", "habitat", "diet", "fun_fact")


def validate() -> tuple[list[str], list[str]]:
    """Return blocking errors and non-blocking data-governance warnings."""
    errors: list[str] = []
    warnings: list[str] = []
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    try:
        connection.executescript(SEED_SQL.read_text(encoding="utf-8"))
        species = connection.execute("SELECT * FROM species ORDER BY id").fetchall()
        species_ids = {row["id"] for row in species}
        if len(species) != 152:
            errors.append(f"Expected 152 species, found {len(species)}.")
        for row in species:
            missing = [field for field in REQUIRED_SPECIES_FIELDS if not str(row[field] or "").strip()]
            if missing:
                errors.append(f"{row['id']} is missing: {', '.join(missing)}.")

        duplicate_names = connection.execute(
            """SELECT lower(trim(common_name)) AS name, group_concat(id, ', ') AS ids
                FROM species GROUP BY lower(trim(common_name)) HAVING count(*) > 1"""
        ).fetchall()
        for row in duplicate_names:
            warnings.append(f"Duplicate display name '{row['name']}' for IDs {row['ids']}.")

        image_species_ids = {
            row[0] for row in connection.execute("SELECT species_id FROM species_images")
        }
        if image_species_ids - species_ids:
            errors.append("Image metadata refers to a species outside the active catalogue.")
        missing_metadata = species_ids - image_species_ids
        if missing_metadata:
            warnings.append("Missing image provenance metadata for: " + ", ".join(sorted(missing_metadata)) + ".")

        quiz_rows = connection.execute("SELECT species_id, version, questions_json FROM quizzes").fetchall()
        if {row["species_id"] for row in quiz_rows} != species_ids:
            errors.append("Every active species must have a quiz definition.")
        for row in quiz_rows:
            try:
                questions = json.loads(row["questions_json"])
                if not isinstance(questions, list) or not questions:
                    raise ValueError("questions must be a non-empty list")
                for question in questions:
                    options, answer = question.get("options", []), question.get("correct_index")
                    if not isinstance(options, list) or not options or not isinstance(answer, int) or not 0 <= answer < len(options):
                        raise ValueError("invalid options or correct_index")
            except (TypeError, ValueError, json.JSONDecodeError) as error:
                errors.append(f"Invalid quiz for {row['species_id']} v{row['version']}: {error}.")
    finally:
        connection.close()

    asset_ids = {path.stem for path in IMAGE_DIR.glob("*.jpg")}
    missing_assets = species_ids - asset_ids
    if missing_assets:
        errors.append("Missing bundled image assets for: " + ", ".join(sorted(missing_assets)) + ".")
    return errors, warnings


def main() -> int:
    errors, warnings = validate()
    for message in warnings:
        print(f"WARNING: {message}")
    for message in errors:
        print(f"ERROR: {message}")
    if errors:
        return 1
    print("Seed validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
