from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import GOOGLE_PLACES_API_KEY


PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
# Address is Essentials; regularOpeningHours is Enterprise. Keep the mask tight.
SEARCH_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.regularOpeningHours,places.location"
)

# Existing Iteration 1 parks only. Do not add zoos or extra places here.
PLACE_LOOKUPS = (
    {
        "id": "loc_bukit_gasing",
        "query": "Hutan Pendidikan Bukit Gasing",
        "lat": 3.0964,
        "lng": 101.65,
    },
    {
        "id": "loc_frim",
        "query": "Forest Research Institute Malaysia Kepong",
        "lat": 3.24,
        "lng": 101.65,
    },
    {
        "id": "loc_kuala_selangor",
        "query": "Kuala Selangor Nature Park",
        "lat": 3.35,
        "lng": 101.25,
    },
    {
        "id": "loc_per_paya_indah",
        "query": "Paya Indah Wetlands Dengkil",
        "lat": 2.8604,
        "lng": 101.6288,
    },
    {
        "id": "loc_kl_forest_eco_park",
        "query": "Taman Eko Rimba KL Jalan Raja Chulan",
        "lat": 3.151,
        "lng": 101.703,
    },
    {
        "id": "loc_perdana_botanical",
        "query": "Perdana Botanical Gardens Kuala Lumpur",
        "lat": 3.143,
        "lng": 101.685,
    },
)

_DAY_PREFIX = re.compile(
    r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*",
    re.IGNORECASE,
)


class PlacesUnavailable(RuntimeError):
    pass


def places_configured() -> bool:
    return bool(GOOGLE_PLACES_API_KEY)


def _display_address(formatted_address: str) -> str:
    address = formatted_address.strip()
    for suffix in (", Malaysia", ", Malaysia."):
        if address.endswith(suffix):
            address = address[: -len(suffix)]
    return address


def compact_opening_hours(weekday_descriptions: list[str] | None) -> str | None:
    if not weekday_descriptions:
        return None
    hours = [_DAY_PREFIX.sub("", line).strip() for line in weekday_descriptions if line.strip()]
    hours = [item for item in hours if item]
    if not hours:
        return None
    unique = list(dict.fromkeys(hours))
    if unique == ["Open 24 hours"]:
        return "Open 24 hours"
    if unique == ["Closed"]:
        return "Closed"
    if len(unique) == 1:
        return f"Daily {unique[0]}"
    compact: list[str] = []
    for line in weekday_descriptions:
        stripped = line.strip()
        if stripped:
            compact.append(stripped.replace(": ", " "))
    return "; ".join(compact)


def _search_place(query: str, lat: float, lng: float) -> dict[str, Any]:
    if not places_configured():
        raise PlacesUnavailable("GOOGLE_PLACES_API_KEY is not set")
    response = httpx.post(
        PLACES_SEARCH_URL,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": SEARCH_FIELD_MASK,
        },
        json={
            "textQuery": query,
            "languageCode": "en",
            "regionCode": "MY",
            "maxResultCount": 1,
            "locationBias": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": 8000.0,
                }
            },
        },
        timeout=20.0,
    )
    if response.status_code >= 400:
        hint = ""
        if response.status_code == 403:
            hint = (
                " Billing may still be pending, Places API (New) may not be fully enabled, "
                "or this key may be locked to HTTP referrers / the wrong API."
            )
        raise PlacesUnavailable(
            f"Places search failed ({response.status_code}).{hint} {response.text[:300]}"
        )
    places = response.json().get("places") or []
    if not places:
        raise PlacesUnavailable(f"No Places result for {query!r}")
    return places[0]


def fetch_location_place(lookup: dict[str, Any]) -> dict[str, Any]:
    place = _search_place(lookup["query"], lookup["lat"], lookup["lng"])
    display = place.get("displayName") or {}
    hours = compact_opening_hours((place.get("regularOpeningHours") or {}).get("weekdayDescriptions"))
    location = place.get("location") or {}
    return {
        "id": lookup["id"],
        "place_id": place.get("id"),
        "google_name": display.get("text"),
        "area": _display_address(place.get("formattedAddress") or ""),
        "opening_hours": hours,
        "lat": location.get("latitude"),
        "lng": location.get("longitude"),
    }


def fetch_iteration_one_places() -> list[dict[str, Any]]:
    return [fetch_location_place(lookup) for lookup in PLACE_LOOKUPS]


if __name__ == "__main__":
    print(json.dumps(fetch_iteration_one_places(), indent=2, ensure_ascii=False))
