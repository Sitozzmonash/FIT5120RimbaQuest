"""Validate Iteration 2 fun facts before approving them for children.

Run from ``backend``:
    python tools/validate_iteration2_fun_facts.py
    python tools/validate_iteration2_fun_facts.py --reject-invalid

The optional rewrite marks unusable text as rejected; it never manufactures a
scientific claim.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


FACTS_PATH = Path(__file__).resolve().parents[1] / "data" / "iteration2_fun_facts_pilot.json"
BANNED_PATTERNS = (
    r"\brimbaquest\s+catalogue\b",
    r"\bcatalogue\s+links?\b",
    r"\byou can help wikipedia\b",
    r"\bthis article\b.*\bis a stub\b",
    r"^from wikipedia, the free encyclopedia",
    r"^life-history note:",
    r"lifespan.*\b(unknown|uncertain)\b",
    r"lifespan.*not well documented",
)


def issues_for(record: dict[str, object]) -> list[str]:
    text = str(record.get("fact_text") or "").strip()
    source_url = str(record.get("source_url") or "").strip()
    source_name = str(record.get("source_name") or "").strip()
    issues: list[str] = []
    if not text:
        issues.append("empty fact")
    if any(re.search(pattern, text, re.IGNORECASE) for pattern in BANNED_PATTERNS):
        issues.append("placeholder, system statement, or page artefact")
    if not re.match(r"^https://", source_url):
        issues.append("missing HTTPS source URL")
    if not source_name:
        issues.append("missing source name")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reject-invalid", action="store_true")
    args = parser.parse_args()
    records = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    invalid: list[tuple[dict[str, object], list[str]]] = []
    changed = 0
    for record in records:
        issues = issues_for(record)
        if issues:
            invalid.append((record, issues))
        if args.reject_invalid and issues and record.get("verification_status") != "rejected":
            record["verification_status"] = "rejected"
            changed += 1
    print(f"{len(records)} facts checked; {len(invalid)} need content/source review.")
    for record, issues in invalid[:20]:
        print(f"- {record['species_id']} #{record['display_order']}: {'; '.join(issues)}")
    if len(invalid) > 20:
        print(f"... and {len(invalid) - 20} more.")
    if args.reject_invalid:
        FACTS_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Rejected {changed} unusable facts.")
    return 1 if invalid and not args.reject_invalid else 0


if __name__ == "__main__":
    raise SystemExit(main())
