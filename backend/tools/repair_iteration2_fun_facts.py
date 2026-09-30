"""Replace known non-fact artefacts with short child-facing species facts."""

from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
FACTS_PATH = BACKEND / "data" / "iteration2_fun_facts_pilot.json"
SEED_PATH = BACKEND / "data" / "seed.sql"
FUN_FACT_BLOCKED_PATTERNS = (
    r"\brimbaquest\s+catalogue\b",
    r"\bcatalogue\s+links?\b",
    r"^from wikipedia, the free encyclopedia",
    r"\byou can help wikipedia\b",
    r"\bthis article\b.*\bis a stub\b",
    r"^life-history note:",
    r"lifespan.*\b(unknown|uncertain)\b",
    r"lifespan.*not well documented",
)
LIFESPAN_REPLACEMENTS = {
    "sp_malayan_pangolin": "Its strong claws help it climb trees.",
    "sp_green_sea_turtle": "Its front flippers work like paddles for swimming.",
    "sp_great_argus": "A male clears a patch of forest floor before its courtship display.",
}
CHILD_FRIENDLY_REPLACEMENTS = {
    ("sp_green_sea_turtle", 3): "Green Sea Turtles use their strong flippers to swim through the sea.",
    ("sp_great_argus", 3): "Male Great Argus birds spread their long feathers in a fan during courtship.",
    ("sp_long_tailed_sibia", 7): "Long-tailed Sibias live in the forests of Southeast Asia.",
    ("sp_long_tailed_sibia", 10): "Its long tail helps make the Long-tailed Sibia easy to recognise.",
    ("sp_bornean_banded_pitta", 5): "The Bornean Banded Pitta is found only on the island of Borneo.",
    ("sp_bornean_banded_pitta", 9): "Pittas are forest birds that usually search for food near the ground.",
    ("sp_sunda_laughingthrush", 8): "Sunda Laughingthrushes live on the islands of Sumatra and Borneo.",
    ("sp_rufous_tailed_shama", 5): "Rufous-tailed Shamas live in moist forests and swamps.",
    ("sp_rufous_tailed_shama", 6): "The Rufous-tailed Shama belongs to the Old World flycatcher family.",
    ("sp_rufous_tailed_shama", 10): "Its rufous, or reddish-brown, tail gives this bird its name.",
    ("sp_thick_spined_porcupine", 7): "Thick-spined Porcupines live in habitats from forests to farmland.",
    ("sp_striped_wren_babbler", 5): "Striped Wren-babblers are found in Brunei, Indonesia, Malaysia, and Thailand.",
    ("sp_sooty_capped_babbler", 5): "Sooty-capped Babblers are small birds that live in Southeast Asian forests.",
    ("sp_bornean_yellow_muntjac", 9): "The Bornean Yellow Muntjac lives in the moist forests of Borneo.",
    ("sp_bornean_yellow_muntjac", 10): "Its short antlers are much smaller than those of the common muntjac.",
    ("sp_shrew_faced_squirrel", 7): "Shrew-faced Squirrels mainly eat insects and earthworms.",
    ("sp_green_billed_coucal", 1): "The Green-billed Coucal has maroon wings and a long dark-green tail.",
    ("sp_hose_s_civet", 1): "Hose's Civet is a small mammal that lives in Borneo's forests.",
    ("sp_moonrat", 1): "Moonrats feed on earthworms and other small animals.",
    ("sp_black_crowned_pitta", 1): "Black-crowned Pittas are colourful forest birds of Southeast Asia.",
    ("sp_cinereous_bulbul", 1): "Cinereous Bulbuls are birds found in Southeast Asia and Indonesia.",
    ("sp_short_tailed_mongoose", 10): "Short-tailed Mongooses live in evergreen forests and sometimes visit rural gardens.",
    ("sp_lar_gibbon", 1): "Lar Gibbons swing through trees using their very long arms.",
    ("sp_four_striped_ground_squirrel", 10): "Four-striped Ground Squirrels have four dark stripes along their backs.",
    ("sp_three_striped_ground_squirrel", 9): "Three-striped Ground Squirrels have three dark stripes along their backs.",
    ("sp_noisy_rat", 8): "Noisy Rats are forest mammals found in Southeast Asia.",
    ("sp_rufous_tailed_pheasant", 6): "The Rufous-tailed Pheasant is a forest bird of Borneo.",
    ("sp_malay_crested_fireback", 7): "Male Malay Crested Firebacks have a tall crest of feathers on their heads.",
    ("sp_stump_tailed_macaque", 8): "Stump-tailed Macaques have short tails and often live in groups.",
    ("sp_southern_red_muntjac", 1): "Southern Red Muntjacs are also called barking deer because of their calls.",
    ("sp_sunda_stink_badger", 2): "The Sunda Stink-badger has a white stripe running from its head to its tail.",
    ("sp_blyth_s_hawk_eagle", 10): "Blyth's Hawk-Eagles are birds of prey with strong feet for catching food.",
    ("sp_changeable_hawk_eagle", 2): "Changeable Hawk-Eagles can raise a crest of feathers on their heads.",
    ("sp_dark_necked_tailorbird", 7): "Tailorbirds use plant fibres to stitch leaves together for their nests.",
    ("sp_rufous_browed_babbler", 1): "Rufous-browed Babblers are small birds that search for food near the forest floor.",
    ("sp_rufous_browed_babbler", 7): "Its rufous, or reddish-brown, eyebrow stripe helps identify this babbler.",
    ("sp_crimson_winged_woodpecker", 9): "Crimson-winged Woodpeckers use their strong bills to tap and search tree trunks.",
    ("sp_western_hooded_pitta", 1): "Western Hooded Pittas live in forests and can also be found near plantations.",
    ("sp_white_thighed_surili", 1): "White-thighed Surilis are leaf-eating monkeys that live in trees.",
    ("sp_white_thighed_surili", 7): "The white fur on its thighs helps give the White-thighed Surili its name.",
    ("sp_flat_headed_cat", 1): "Flat-headed Cats have low, flattened heads and are good swimmers.",
    ("sp_crested_serpent_eagle", 1): "Crested Serpent-Eagles have long feathers at the back of the head that form a crest.",
    ("sp_asiatic_striped_squirrels", 1): "Asiatic Striped Squirrels have dark stripes running along their backs.",
    ("sp_chestnut_capped_babbler", 1): "Chestnut-capped Babblers have a warm chestnut-coloured cap on their heads.",
    ("sp_large_indian_civet", 1): "Large Indian Civets have tails with black and white rings.",
}


def species_catalogue() -> dict[str, tuple[str, str, str]]:
    database = sqlite3.connect(":memory:")
    database.executescript(SEED_PATH.read_text(encoding="utf-8"))
    return {
        row[0]: (row[1], row[2], row[3])
        for row in database.execute("SELECT id, common_name, scientific_name, category FROM species")
    }


def replacement_for(record: dict[str, object], species: tuple[str, str, str]) -> str:
    common_name, scientific_name, category = species
    text = str(record["fact_text"]).strip()
    species_id = str(record["species_id"])
    if species_id in LIFESPAN_REPLACEMENTS:
        return LIFESPAN_REPLACEMENTS[species_id]
    if text.lower().startswith("life-history note:"):
        note = text.split(":", 1)[1].strip()
        if not any(marker in note for marker in ("[", "_", "ed.", "University Press")):
            return note
    if "catalogue" in text.lower() or "wikipedia" in text.lower() or "stub" in text.lower():
        return f"{common_name} is a {category.lower()} known by the scientific name {scientific_name}."
    return f"{common_name} is a {category.lower()} known by the scientific name {scientific_name}."


def distinct_replacement(record: dict[str, object], species: tuple[str, str, str]) -> str:
    common_name, scientific_name, category = species
    choices = (
        f"Wildlife researchers use the scientific name {scientific_name} for the {common_name}.",
        f"{common_name} belongs to the {category.lower()} group of animals.",
        f"{common_name} is part of the wildlife of Southeast Asia.",
    )
    return choices[int(record["display_order"]) % len(choices)]


def main() -> None:
    records = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    catalogue = species_catalogue()
    changed = 0
    for record in records:
        text = str(record.get("fact_text") or "")
        if any(re.search(pattern, text, re.IGNORECASE) for pattern in FUN_FACT_BLOCKED_PATTERNS):
            record["fact_text"] = replacement_for(record, catalogue[str(record["species_id"])])
            record["verification_status"] = "source-linked-draft"
            changed += 1
        replacement = CHILD_FRIENDLY_REPLACEMENTS.get(
            (str(record["species_id"]), int(record["display_order"]))
        )
        if replacement and record["fact_text"] != replacement:
            record["fact_text"] = replacement
            record["verification_status"] = "source-linked-draft"
            changed += 1
    seen: dict[str, set[str]] = {}
    for record in records:
        species_id = str(record["species_id"])
        text = str(record["fact_text"]).strip().casefold()
        previous = seen.setdefault(species_id, set())
        if text in previous:
            record["fact_text"] = distinct_replacement(record, catalogue[species_id])
            changed += 1
        previous.add(str(record["fact_text"]).strip().casefold())
    FACTS_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Replaced {changed} non-fact records.")


if __name__ == "__main__":
    main()
