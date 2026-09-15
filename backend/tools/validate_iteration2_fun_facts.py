"""Validate Iteration 2 fun facts before approving them for children.

Run from ``backend``:
    python tools/validate_iteration2_fun_facts.py
    python tools/validate_iteration2_fun_facts.py --demote-unreviewed

The optional rewrite only corrects misleading approval metadata; it never
manufactures a reviewer, timestamp, or scientific claim.
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
    r"\bneeds? specialist review\b",
    r"\binformation\b.*\bnot found\b",
)
REJECTED_SOURCE_HOSTS = {"en.wikipedia.org"}


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
    if any(host in source_url.lower() for host in REJECTED_SOURCE_HOSTS):
        issues.append("Wikipedia cannot be the sole child-facing fact source")
    if str(record.get("verification_status") or "").lower() in {"approved", "verified", "team-verified"}:
        if not str(record.get("verified_by") or "").strip() or not record.get("verified_at"):
            issues.append("approval lacks named reviewer or review timestamp")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--demote-unreviewed", action="store_true")
    args = parser.parse_args()
    records = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    invalid: list[tuple[dict[str, object], list[str]]] = []
    changed = 0
    for record in records:
        issues = issues_for(record)
        if issues:
            invalid.append((record, issues))
        approved = str(record.get("verification_status") or "").lower() in {"approved", "verified", "team-verified"}
        if args.demote_unreviewed and approved and (not record.get("verified_at") or issues):
            record["verification_status"] = "source-linked-draft"
            record["verified_by"] = None
            record["verified_at"] = None
            changed += 1
    print(f"{len(records)} facts checked; {len(invalid)} need content/source review.")
    for record, issues in invalid[:20]:
        print(f"- {record['species_id']} #{record['display_order']}: {'; '.join(issues)}")
    if len(invalid) > 20:
        print(f"... and {len(invalid) - 20} more.")
    if args.demote_unreviewed:
        FACTS_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Demoted {changed} unreviewed facts to source-linked-draft.")
    return 1 if invalid and not args.demote_unreviewed else 0


if __name__ == "__main__":
    raise SystemExit(main())
