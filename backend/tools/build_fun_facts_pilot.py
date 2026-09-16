"""Convert the raw fun_facts.json export into the seed pilot schema.

The team edits ``data/fun_facts.json`` (species_id, display_order, fun_fact,
source_url, verified). The seeder in ``app/core/seed.py`` only reads
``data/iteration2_fun_facts_pilot.json``, whose rows need the full
``species_fun_facts`` columns. This tool bridges the two so a fun-fact update
actually reaches the database.

Run from ``backend``:
    python tools/build_fun_facts_pilot.py

source_name and source_license are derived from the source URL host using the
same convention as the previously hand-curated pilot file. Regenerating the
pilot changes its sha256, which makes the seeder reload it on next startup.
"""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse

DATA = Path(__file__).resolve().parents[1] / "data"
SOURCE_PATH = DATA / "fun_facts.json"
PILOT_PATH = DATA / "iteration2_fun_facts_pilot.json"

RETRIEVED_AT = "2026-09-16T00:00:00Z"

WIKIPEDIA_LICENSE = "CC BY-SA 4.0"
ADW_LICENSE = "CC BY-NC-SA 3.0"
US_GOV_LICENSE = "Public-domain U.S. government work"
DEFAULT_LICENSE = "Source page terms apply"

# host -> (human-readable source name, licence). Hosts not listed fall back to
# a humanised domain name and the generic "Source page terms apply" licence.
HOST_ATTRIBUTION: dict[str, tuple[str, str]] = {
    "en.wikipedia.org": ("Wikipedia", WIKIPEDIA_LICENSE),
    "kids.kiddle.co": ("Kiddle (Wikipedia for kids)", DEFAULT_LICENSE),
    "animaldiversity.org": ("Animal Diversity Web", ADW_LICENSE),
    "www.fisheries.noaa.gov": ("NOAA Fisheries", US_GOV_LICENSE),
    "nationalzoo.si.edu": ("Smithsonian National Zoo", US_GOV_LICENSE),
    "www.ncbi.nlm.nih.gov": ("NCBI", US_GOV_LICENSE),
    "www.ecologyasia.com": ("Ecology Asia", DEFAULT_LICENSE),
    "animalia.bio": ("Animalia", DEFAULT_LICENSE),
    "ebird.org": ("eBird", DEFAULT_LICENSE),
    "singaporebirds.com": ("Singapore Birds", DEFAULT_LICENSE),
    "neprimateconservancy.org": ("Northeast Primate Conservancy", DEFAULT_LICENSE),
    "birdsoftheworld.org": ("Birds of the World", DEFAULT_LICENSE),
    "www.nationalgeographic.com": ("National Geographic", DEFAULT_LICENSE),
    "www.mybis.gov.my": ("MyBIS (Malaysia Biodiversity)", DEFAULT_LICENSE),
    "www.thainationalparks.com": ("Thai National Parks", DEFAULT_LICENSE),
    "www.nparks.gov.sg": ("NParks Singapore", DEFAULT_LICENSE),
    "biodiversitysg.nparks.gov.sg": ("NParks Singapore Biodiversity", DEFAULT_LICENSE),
    "malaysianwildlife.org": ("Malaysian Wildlife", DEFAULT_LICENSE),
    "forestry.sarawak.gov.my": ("Sarawak Forestry", DEFAULT_LICENSE),
    "www.inaturalist.org": ("iNaturalist", DEFAULT_LICENSE),
    "natureseychelles.org": ("Nature Seychelles", DEFAULT_LICENSE),
    "bigcatrescue.org": ("Big Cat Rescue", DEFAULT_LICENSE),
    "zootaiping.gov.my": ("Zoo Taiping", DEFAULT_LICENSE),
    "stlzoo.org": ("Saint Louis Zoo", DEFAULT_LICENSE),
    "www.lakpura.com": ("Lakpura", DEFAULT_LICENSE),
    "wildcatconservation.org": ("WildCat Conservation", DEFAULT_LICENSE),
    "app.birda.org": ("Birda", DEFAULT_LICENSE),
    "www.worldlandtrust.org": ("World Land Trust", DEFAULT_LICENSE),
    "www.rekoforest.org": ("ReKO Forest", DEFAULT_LICENSE),
    "www.catsg.org": ("IUCN Cat Specialist Group", DEFAULT_LICENSE),
    "hoscap-borneo.org": ("HOSCAP Borneo", DEFAULT_LICENSE),
    "butterflycircle.blogspot.com": ("Butterfly Circle", DEFAULT_LICENSE),
    "www.britannica.com": ("Britannica", DEFAULT_LICENSE),
    "besgroup.org": ("BES Group", DEFAULT_LICENSE),
    "www.worldanimalprotection.ca": ("World Animal Protection", DEFAULT_LICENSE),
    "seaworld.org": ("SeaWorld", DEFAULT_LICENSE),
    "www.worldbirdnames.com": ("World Bird Names", DEFAULT_LICENSE),
    "birdforum.net": ("BirdForum", DEFAULT_LICENSE),
    "www.birdforum.net": ("BirdForum", DEFAULT_LICENSE),
    "www.orangutan.or.id": ("Orangutan Indonesia", DEFAULT_LICENSE),
    "www.wwf.org.my": ("WWF Malaysia", DEFAULT_LICENSE),
    "www.environmentalinclusion.com": ("Environmental Inclusion", DEFAULT_LICENSE),
    "biodb.com": ("BioDB", DEFAULT_LICENSE),
    "encyclopedia.pub": ("Encyclopedia.pub", DEFAULT_LICENSE),
    "symphonyofhorizon.com": ("Symphony of Horizon", DEFAULT_LICENSE),
    "globalconservation.org": ("Global Conservation", DEFAULT_LICENSE),
    "www.frim.gov.my": ("FRIM Malaysia", DEFAULT_LICENSE),
    "iucnhornbills.org": ("IUCN Hornbills", DEFAULT_LICENSE),
    "www.fauna-flora.org": ("Fauna & Flora", DEFAULT_LICENSE),
    "www.edinburghzoo.org.uk": ("Edinburgh Zoo", DEFAULT_LICENSE),
    "datazone.birdlife.org": ("BirdLife International", DEFAULT_LICENSE),
    "terra-cultura.com": ("Terra Cultura", DEFAULT_LICENSE),
    "a-z-animals.com": ("A-Z Animals", DEFAULT_LICENSE),
    "sdzwildlifeexplorers.org": ("San Diego Zoo Wildlife Explorers", DEFAULT_LICENSE),
    "fladder.app": ("Fladder", DEFAULT_LICENSE),
    "malaysia.wcs.org": ("WCS Malaysia", DEFAULT_LICENSE),
    "www.orangutan-appeal.org.uk": ("Orangutan Appeal UK", DEFAULT_LICENSE),
    "www.jungledragon.com": ("JungleDragon", DEFAULT_LICENSE),
    "smallcarnivoreconservation.com": ("Small Carnivore Conservation", DEFAULT_LICENSE),
    "www.worldwildlife.org": ("World Wildlife Fund", DEFAULT_LICENSE),
    "mountainbiodiversity.org": ("Mountain Biodiversity", DEFAULT_LICENSE),
    "animals.fandom.com": ("Animals Wiki (Fandom)", DEFAULT_LICENSE),
    "app.birdweather.com": ("Birdweather", DEFAULT_LICENSE),
    "birdwatcher.delhigreens.com": ("Delhi Greens Birdwatcher", DEFAULT_LICENSE),
    "www.natureinfocus.in": ("Nature In Focus", DEFAULT_LICENSE),
    "www.zoodegranby.com": ("Zoo de Granby", DEFAULT_LICENSE),
    "oiseaux.net": ("Oiseaux.net", DEFAULT_LICENSE),
    "xeno-canto.org": ("Xeno-canto", DEFAULT_LICENSE),
    "www.otter.org": ("Otter.org", DEFAULT_LICENSE),
    "macaulaylibrary.org": ("Macaulay Library", DEFAULT_LICENSE),
    "archive.org": ("Internet Archive", DEFAULT_LICENSE),
    "escholarship.org": ("eScholarship", DEFAULT_LICENSE),
    "www.pierrewildlife.com": ("Pierre Wildlife", DEFAULT_LICENSE),
    "worldspecies.org": ("World Species", DEFAULT_LICENSE),
    "aladdin.st": ("Aladdin.st", DEFAULT_LICENSE),
    "zenodo.org": ("Zenodo", DEFAULT_LICENSE),
    "creatures.com": ("Creatures.com", DEFAULT_LICENSE),
    "indianbirds.in": ("Indian Birds", DEFAULT_LICENSE),
}


def _humanise_host(host: str) -> str:
    """Turn an unmapped host into a readable site name (drop www., title-case)."""
    label = host.removeprefix("www.")
    root = label.split(".")[0].replace("-", " ").replace("_", " ")
    return root.title() or label.title()


def attribution_for(source_url: str) -> tuple[str, str]:
    host = urlparse(source_url).netloc.lower()
    if host in HOST_ATTRIBUTION:
        return HOST_ATTRIBUTION[host]
    if not host:
        return "Unspecified source", DEFAULT_LICENSE
    return _humanise_host(host), DEFAULT_LICENSE


def build_record(raw: dict[str, object]) -> dict[str, object]:
    source_url = str(raw.get("source_url") or "").strip()
    if source_url.startswith("http://"):
        source_url = "https://" + source_url.removeprefix("http://")
    source_name, source_license = attribution_for(source_url)
    verified = str(raw.get("verified") or "").strip().upper()
    # Records cleared for children are seeded as source-linked drafts, matching
    # the prior pilot. An unsourced fact cannot be attributed, so it is rejected
    # and stays out of the public feed.
    status = "source-linked-draft" if (verified == "PASS" and source_url) else "rejected"
    return {
        "species_id": raw["species_id"],
        "display_order": int(raw["display_order"]),
        "fact_text": str(raw.get("fun_fact") or "").strip(),
        "source_name": source_name,
        "source_url": source_url,
        "source_license": source_license,
        "retrieved_at": RETRIEVED_AT,
        "verification_status": status,
        "verified_by": None,
        "verified_at": None,
    }


def main() -> None:
    raw_records = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    records = [build_record(raw) for raw in raw_records]
    rejected = sum(1 for record in records if record["verification_status"] == "rejected")
    PILOT_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Wrote {len(records)} fun facts to {PILOT_PATH.name} "
        f"({len(records) - rejected} draft, {rejected} rejected)."
    )


if __name__ == "__main__":
    main()
