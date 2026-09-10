#!/usr/bin/env python3
"""
generate_validated_quizzes.py

Generates validated quiz presets for species in RimbaQuest.
Epic 4 US4.5 - Module 2:
- 3 difficulties: 'easy', 'medium', 'hard'
- Each difficulty has 3 preset quiz sets (indices 0, 1, 2)
- Each quiz set has exactly 5 multiple-choice questions
- Each question has 1 question text, exactly 3 answer options, exactly 1 correct answer
- Questions must NOT be duplicated across difficulty levels
- Grounded in approved species data and 10 Fun Facts
- Output saved to backend/data/species_quiz_presets.json
"""

import json
import random
import re
import sqlite3
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
FUN_FACTS_PATH = DATA_DIR / "iteration2_fun_facts_pilot.json"
DB_PATH = DATA_DIR / "RimbaQuest.db"
OUTPUT_PATH = DATA_DIR / "species_quiz_presets.json"

CATEGORIES = ["Bird", "Mammal", "Reptile", "Butterfly"]


def clean_sentence(text: str) -> str:
    text = text.strip()
    if text.endswith("."):
        text = text[:-1].strip()
    return text


def load_data():
    # Load fun facts
    species_facts = {}
    if FUN_FACTS_PATH.exists():
        with open(FUN_FACTS_PATH, "r", encoding="utf-8") as f:
            raw_facts = json.load(f)
            for item in raw_facts:
                sp_id = item["species_id"]
                order = item["display_order"]
                species_facts.setdefault(sp_id, {})[order] = clean_sentence(item["fact_text"])

    # Load species from SQLite DB
    species_dict = {}
    if DB_PATH.exists():
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute(
            """SELECT id, common_name, scientific_name, category, habitat, diet,
                      distinctive_features, threats, conservation_status, fun_fact
               FROM species"""
        )
        for row in cur.fetchall():
            sp_id = row[0]
            species_dict[sp_id] = {
                "id": row[0],
                "common_name": row[1],
                "scientific_name": row[2],
                "category": row[3],
                "habitat": clean_sentence(row[4] or ""),
                "diet": clean_sentence(row[5] or ""),
                "distinctive_features": clean_sentence(row[6] or ""),
                "threats": clean_sentence(row[7] or ""),
                "conservation_status": clean_sentence(row[8] or ""),
                "fun_fact": clean_sentence(row[9] or ""),
            }
        con.close()

    return species_dict, species_facts


def get_other_species_attributes(species_dict, current_id, attr_name, count=2):
    """Pick distinct distractors from other species."""
    current_val = species_dict[current_id].get(attr_name, "")
    current_cat = species_dict[current_id].get("category", "")

    # Try same category first for realistic distractors, then fallback
    same_cat = [
        s[attr_name]
        for sid, s in species_dict.items()
        if sid != current_id and s.get("category") == current_cat and s.get(attr_name) and s[attr_name] != current_val
    ]
    diff_cat = [
        s[attr_name]
        for sid, s in species_dict.items()
        if sid != current_id and s.get(attr_name) and s[attr_name] != current_val
    ]

    candidates = []
    seen = {current_val.lower()}
    for val in same_cat + diff_cat:
        val_clean = clean_sentence(val)
        if val_clean.lower() not in seen and len(val_clean) > 3:
            seen.add(val_clean.lower())
            candidates.append(val_clean)
            if len(candidates) >= count:
                break

    while len(candidates) < count:
        candidates.append(f"Alternative habitat/diet pattern {len(candidates) + 1}")

    return candidates[:count]


def build_questions_for_species(sp_id, sp, facts, all_species):
    """
    Generates:
    - 3 difficulty levels: easy, medium, hard
    - 3 sets per difficulty
    - 5 questions per set
    Total: 45 questions per species, strictly no duplicate questions across difficulties.
    """
    name = sp["common_name"]
    cat = sp["category"]
    hab = sp["habitat"]
    diet = sp["diet"]
    dist = sp["distinctive_features"]
    status = sp["conservation_status"]
    ff_i1 = sp["fun_fact"]

    # Gather facts 1..10
    f = [facts.get(i, "") for i in range(1, 11)]

    # Helper to assemble 3 options
    def make_q(q_id, question_text, correct_opt, distractor1, distractor2, fact_ref=""):
        options = [correct_opt, distractor1, distractor2]
        # Deterministic shuffle based on sp_id and q_id to keep sets reproducible
        rng = random.Random(f"{sp_id}_{q_id}")
        rng.shuffle(options)
        return {
            "id": q_id,
            "question": question_text,
            "options": options,
            "correct_answer": correct_opt,
            "explanation": f"Fact about {name}: {correct_opt}.",
        }

    # Category distractors
    other_cats = [c for c in CATEGORIES if c != cat]
    cat_d1, cat_d2 = other_cats[0], other_cats[1]

    # Habitat distractors
    hab_d1, hab_d2 = get_other_species_attributes(all_species, sp_id, "habitat", 2)
    # Diet distractors
    diet_d1, diet_d2 = get_other_species_attributes(all_species, sp_id, "diet", 2)
    # Distinctive distractors
    dist_d1, dist_d2 = get_other_species_attributes(all_species, sp_id, "distinctive_features", 2)

    # -------------------------------------------------------------
    # EASY LEVEL (Sets 0, 1, 2)
    # Focus: Category, Core Habitat, Main Diet, Distinctive Look, Primary Fun Fact
    # -------------------------------------------------------------
    easy_sets = []

    # Easy Set 0
    easy_sets.append([
        make_q(
            "easy_s0_q1",
            f"What type of wildlife animal is the {name}?",
            cat,
            cat_d1,
            cat_d2,
        ),
        make_q(
            "easy_s0_q2",
            f"In which environment does the {name} typically live?",
            hab,
            hab_d1,
            hab_d2,
        ),
        make_q(
            "easy_s0_q3",
            f"What does the {name} primarily eat in the wild?",
            diet,
            diet_d1,
            diet_d2,
        ),
        make_q(
            "easy_s0_q4",
            f"Which of the following physical features helps identify the {name}?",
            dist,
            dist_d1,
            dist_d2,
        ),
        make_q(
            "easy_s0_q5",
            f"Which fun fact is true about the {name}?",
            f[0] if f[0] else ff_i1,
            f"The {name} lives exclusively in Arctic snow and ice.",
            f"The {name} is a deep-sea creature that cannot survive on land.",
        ),
    ])

    # Easy Set 1 (Different angle / different facts)
    easy_sets.append([
        make_q(
            "easy_s1_q1",
            f"To which animal group does the {name} belong?",
            cat,
            cat_d2,
            cat_d1,
        ),
        make_q(
            "easy_s1_q2",
            f"Where in Malaysia is the {name} most likely to be found?",
            hab,
            hab_d2,
            hab_d1,
        ),
        make_q(
            "easy_s1_q3",
            f"What forms a major part of the {name}'s natural diet?",
            diet,
            diet_d2,
            diet_d1,
        ),
        make_q(
            "easy_s1_q4",
            f"What notable appearance or marking characterizes the {name}?",
            dist,
            dist_d2,
            dist_d1,
        ),
        make_q(
            "easy_s1_q5",
            f"What is an interesting beginner fact about the {name}?",
            f[1] if f[1] else (f[0] if f[0] else ff_i1),
            f"The {name} migrates to Antarctica every winter season.",
            f"The {name} produces light through deep ocean bioluminescence.",
        ),
    ])

    # Easy Set 2
    easy_sets.append([
        make_q(
            "easy_s2_q1",
            f"How is the {name} classified biologically?",
            cat,
            cat_d1,
            cat_d2,
        ),
        make_q(
            "easy_s2_q2",
            f"What natural habitat provides shelter and food for the {name}?",
            hab,
            hab_d1,
            hab_d2,
        ),
        make_q(
            "easy_s2_q3",
            f"What feeding habit best describes the {name}?",
            diet,
            diet_d1,
            diet_d2,
        ),
        make_q(
            "easy_s2_q4",
            f"Which feature makes the {name} recognizable during field observation?",
            dist,
            dist_d1,
            dist_d2,
        ),
        make_q(
            "easy_s2_q5",
            f"Which statement describes a verified trait of the {name}?",
            f[2] if f[2] else (f[1] if f[1] else ff_i1),
            f"The {name} hibernates underwater for six months every year.",
            f"The {name} builds giant sand dunes in the Sahara desert.",
        ),
    ])

    # -------------------------------------------------------------
    # MEDIUM LEVEL (Sets 0, 1, 2)
    # Focus: Behavioral ecology, intermediate fun facts (facts 3, 4, 5, 6), adaptations
    # -------------------------------------------------------------
    medium_sets = []

    # Medium Set 0
    medium_sets.append([
        make_q(
            "med_s0_q1",
            f"According to wildlife studies, which behavioural or physical trait applies to {name}?",
            f[3] if f[3] else f"Adapted to thrive in {hab}",
            f"Possesses webbed swimming flippers suited for glacial arctic waters",
            f"Constructs permanent underground tunnels across desert sands",
        ),
        make_q(
            "med_s0_q2",
            f"What specific adaptation or characteristic is observed in {name}?",
            f[4] if f[4] else f"Relies on {diet} for daily nutritional energy",
            f"Uses echolocation in pitch-black volcanic caves",
            f"Survives prolonged sub-zero blizzards without shelter",
        ),
        make_q(
            "med_s0_q3",
            f"Which statement accurately details the lifestyle of {name}?",
            f[5] if f[5] else f"Known to inhabit {hab}",
            f"Grows venomous spines along its tail during adult stages",
            f"Never requires drinking water throughout its entire lifecycle",
        ),
        make_q(
            "med_s0_q4",
            f"What biological feature or lifecycle fact is true for {name}?",
            f[6] if f[6] else f"Displays {dist}",
            f"Has transparent skin allowing internal organs to absorb sunlight directly",
            f"Lays eggs exclusively in frozen polar snowdrifts",
        ),
        make_q(
            "med_s0_q5",
            f"How does the {name} interact with its surrounding ecosystem?",
            f"Maintains balance in its habitat ({hab}) by consuming {diet}",
            f"Eliminates all native flora by consuming tree roots entirely",
            f"Only interacts with marine saltwater organisms on coral reefs",
        ),
    ])

    # Medium Set 1
    medium_sets.append([
        make_q(
            "med_s1_q1",
            f"Which observational fact about {name} has been documented in Malaysia?",
            f[4] if f[4] else f"Frequently recorded in {hab}",
            f"Can withstand extreme subzero tundra conditions for months",
            f"Forms massive airborne colonies that fly across oceans non-stop",
        ),
        make_q(
            "med_s1_q2",
            f"What ecological adaptation aids {name} in finding food and surviving?",
            f[5] if f[5] else f"Its feeding strategy involves {diet}",
            f"Generates powerful electric discharges to stun prey from a distance",
            f"Burrows 50 meters beneath desert dunes to escape sunlight",
        ),
        make_q(
            "med_s1_q3",
            f"Which verified scientific fact describes {name}'s biology?",
            f[6] if f[6] else f"Exhibits physical traits like {dist}",
            f"Sheds its entire skeletal structure each breeding season",
            f"Can change into a plant form when food is scarce",
        ),
        make_q(
            "med_s1_q4",
            f"Regarding {name}'s daily activity, which statement is correct?",
            f[7] if f[7] else f"Active within its natural range in {hab}",
            f"Migrates between northern Europe and Malaysian peat swamps weekly",
            f"Lives exclusively inside subterranean volcanic thermal vents",
        ),
        make_q(
            "med_s1_q5",
            f"What physical adaptation of {name} is key to its survival?",
            f"Its {dist}, which is tailored for living in {hab}",
            f"Heavy multi-layer blubber designed for arctic ice survival",
            f"Bioluminescent light organs used for deep ocean navigation",
        ),
    ])

    # Medium Set 2
    medium_sets.append([
        make_q(
            "med_s2_q1",
            f"What distinguishes {name}'s habits from unrelated species?",
            f[3] if f[3] else f"Its specialized reliance on {diet}",
            f"Complete dependence on freezing oceanic currents",
            f"Inability to survive in any tropical forest environment",
        ),
        make_q(
            "med_s2_q2",
            f"Which recorded detail highlights the unique biology of {name}?",
            f[5] if f[5] else f"Its association with {hab}",
            f"Has three hearts and blue copper-based blood",
            f"Requires zero oxygen intake while sleeping for years",
        ),
        make_q(
            "med_s2_q3",
            f"In Malaysian wildlife studies, what has been noted about {name}?",
            f[7] if f[7] else f"Displays distinctive appearance ({dist})",
            f"Exclusively thrives at sub-zero alpine summits",
            f"Can survive without any food or moisture for a whole decade",
        ),
        make_q(
            "med_s2_q4",
            f"How does {name}'s diet contribute to its ecological role?",
            f"By feeding on {diet}, it fills a vital niche in its native ecosystem",
            f"By consuming volcanic minerals to produce defensive acid",
            f"By eating coral polyps exclusively in offshore marine waters",
        ),
        make_q(
            "med_s2_q5",
            f"Which of the following statements about {name}'s lifecycle is accurate?",
            f[6] if f[6] else f"Undergoes development suited to its habitat in {hab}",
            f"Metamorphoses into a marine mammal during high tide",
            f"Lays eggs only on floating polar pack ice",
        ),
    ])

    # -------------------------------------------------------------
    # HARD LEVEL (Sets 0, 1, 2)
    # Focus: Conservation status, complex ecology, advanced facts (facts 7, 8, 9, 10), environmental threats
    # -------------------------------------------------------------
    hard_sets = []

    # Hard Set 0
    hard_sets.append([
        make_q(
            "hard_s0_q1",
            f"What is the official conservation status or ecological threat profile for {name}?",
            f"Status is {status}; threatened by {sp['threats']}" if sp["threats"] else f"Conservation status: {status}",
            f"Listed as completely extinct in the wild since the 19th century",
            f"Considered an invasive threat causing arctic permafrost thawing",
        ),
        make_q(
            "hard_s0_q2",
            f"Which advanced research finding applies to the {name}?",
            f[8] if f[8] else f"Maintains complex ecological ties within {hab}",
            f"Possesses specialized antifreeze proteins preventing blood crystallization",
            f"Undergoes complete genetic transformation when exposed to moonlight",
        ),
        make_q(
            "hard_s0_q3",
            f"What critical ecological factor or conservation challenge affects {name}?",
            f[9] if f[9] else f"Vulnerable to habitat pressures such as {sp['threats']}",
            f"Competition with polar bears over arctic seal breathing holes",
            f"Depletion of deep-sea hydrothermal vents in the mid-Atlantic ridge",
        ),
        make_q(
            "hard_s0_q4",
            f"Which scientific insight accurately describes {name}'s survival needs?",
            f[7] if f[7] else f"Requires conservation of its natural habitat ({hab}) and food sources ({diet})",
            f"Requires continuous subzero temperatures to prevent cellular breakdown",
            f"Needs saline oceanic brine to maintain internal osmotic balance",
        ),
        make_q(
            "hard_s0_q5",
            f"In conservation management, what is the primary recommendation for protecting {name}?",
            f"Preserve native {hab} and mitigate {sp['threats']}",
            f"Introduce foreign predators to force evolutionary rapid adaptation",
            f"Relocate the entire population to polar wildlife refuges",
        ),
    ])

    # Hard Set 1
    hard_sets.append([
        make_q(
            "hard_s1_q1",
            f"Regarding the IUCN classification and threats to {name}, which is true?",
            f"Classified as {status}, with primary pressure from {sp['threats']}",
            f"Classified as globally overpopulated with urgent culling mandated",
            f"Classified as an artificial hybrid species created in laboratories",
        ),
        make_q(
            "hard_s1_q2",
            f"Which advanced biological trait or population dynamic is documented for {name}?",
            f[9] if f[9] else (f[8] if f[8] else f"Exhibits specific adaptations in {hab}"),
            f"Produces chemical compounds that prevent water from boiling at 100°C",
            f"Uses geomagnetic sensory organs to migrate to the North Pole",
        ),
        make_q(
            "hard_s1_q3",
            f"What environmental vulnerability most threatens wild populations of {name}?",
            f"Loss of {hab} and impact of {sp['threats']}",
            f"Melting of Antarctic continental ice shelves",
            f"Acidification of open ocean pelagic trenches",
        ),
        make_q(
            "hard_s1_q4",
            f"Which specialized characteristic makes {name} sensitive to environmental change?",
            f[8] if f[8] else f"Its strict dependence on resources found in {hab}",
            f"Its requirement for extreme freezing blizzards during breeding",
            f"Its complete reliance on deep sea hydrothermal minerals",
        ),
        make_q(
            "hard_s1_q5",
            f"How do wildlife biologists assess the long-term viability of {name}?",
            f"By monitoring {hab} integrity and population health against {sp['threats']}",
            f"By measuring the thickness of polar pack ice in the Arctic circle",
            f"By counting the number of ocean trenches inhabited across the globe",
        ),
    ])

    # Hard Set 2
    hard_sets.append([
        make_q(
            "hard_s2_q1",
            f"What major ecological concern is highlighted in conservation reviews for {name}?",
            f"Mitigating {sp['threats']} to maintain stable wild populations ({status})",
            f"Preventing the species from overrunning polar seal sanctuaries",
            f"Preventing desertification in the Sahara through species eradication",
        ),
        make_q(
            "hard_s2_q2",
            f"Which verified scientific fact reflects the advanced biology of {name}?",
            f[7] if f[7] else f"Displays specialized adaptations ({dist}) for its lifestyle",
            f"Possesses a four-chambered venom gland that synthesizes neurotoxins",
            f"Can survive prolonged exposure to the vacuum of space",
        ),
        make_q(
            "hard_s2_q3",
            f"How does habitat fragmentation impact {name} populations in Malaysia?",
            f"Reduces available {hab}, isolating breeding groups and restricting food ({diet})",
            f"Forces them to adapt into pelagic marine fish species",
            f"Causes them to permanently migrate to arctic glaciers",
        ),
        make_q(
            "hard_s2_q4",
            f"According to biodiversity inventories, what status does {name} hold?",
            f"Recognized under status '{status}', dependent on conserving {hab}",
            f"Recognized as an invasive species introduced from the Antarctic",
            f"Recognized as an extinct prehistoric dinosaur relic",
        ),
        make_q(
            "hard_s2_q5",
            f"What critical conservation strategy is most effective for {name}?",
            f"Securing protected corridors within {hab} to safeguard food sources like {diet}",
            f"Building indoor refrigerated glass domes to simulate Siberian winters",
            f"Releasing predatory sharks into inland freshwater rivers",
        ),
    ])

    # Verification: Ensure no question text collisions across easy, medium, hard
    all_q_texts = {}
    for diff_name, diff_sets in [("easy", easy_sets), ("medium", medium_sets), ("hard", hard_sets)]:
        for s_idx, q_list in enumerate(diff_sets):
            for q in q_list:
                q_text = q["question"].strip()
                if q_text in all_q_texts:
                    prev_diff, prev_s = all_q_texts[q_text]
                    raise ValueError(
                        f"Duplicate question detected for species {sp_id}!\n"
                        f"Question: {q_text}\n"
                        f"Found in {prev_diff} set {prev_s} and {diff_name} set {s_idx}"
                    )
                all_q_texts[q_text] = (diff_name, s_idx)

    return {
        "easy": easy_sets,
        "medium": medium_sets,
        "hard": hard_sets,
    }


def main():
    print(f"Loading species and fun facts...")
    species_dict, species_facts = load_data()
    print(f"Loaded {len(species_dict)} species from DB, {len(species_facts)} species with fun facts.")

    all_species_quizzes = {}
    total_species = 0
    total_questions = 0

    for sp_id, sp in species_dict.items():
        facts = species_facts.get(sp_id, {})
        quiz_data = build_questions_for_species(sp_id, sp, facts, species_dict)
        all_species_quizzes[sp_id] = quiz_data
        total_species += 1
        # Count questions
        q_count = sum(len(s) for d in quiz_data.values() for s in d)
        total_questions += q_count

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_species_quizzes, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated quizzes for {total_species} species ({total_questions} total questions).")
    print(f"Saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
