from __future__ import annotations

import io
import json
import re
from typing import Any

from PIL import Image

LIKELY_GENUINE = "likely_genuine"
POTENTIALLY_EXTERNAL = "potentially_externally_sourced_or_recaptured"
UNABLE_TO_DETERMINE = "unable_to_determine"

CAPTURE_SOURCES = {"camera", "gallery"}

# Only these EXIF tags are ever read
_TAG_MAKE = 0x010F
_TAG_MODEL = 0x0110
_TAG_SOFTWARE = 0x0131
_EXIF_IFD = 0x8769
_TAG_DATETIME_ORIGINAL = 0x9003
_TAG_USER_COMMENT = 0x9286
_CLIENT_METADATA_KEYS = ("make", "model", "software", "datetime_original", "user_comment")
_MAX_FIELD_LENGTH = 80

# Apps whose "Software" tag means the photo was edited or exported after
# capture. Phone firmware versions (e.g. "17.5.1") deliberately do not match.
_EDITING_SOFTWARE = re.compile(
    r"photoshop|lightroom|gimp|snapseed|picsart|canva|vsco|facetune|pixelmator|"
    r"affinity|paint\.net|\bpaint\b|photopea|fotor|polarr|meitu|remini|"
    r"instagram|picasa",
    re.IGNORECASE,
)
# iOS writes "Screenshot" into UserComment; desktop tools name themselves in
# the Software tag.
_SCREENSHOT_MARK = re.compile(r"screenshot|screen ?capture|snipping", re.IGNORECASE)
# Phone screens are 18:9 or taller; camera photos are 4:3 or 16:9 (1.78).
_SCREEN_ASPECT_RATIO = 1.9


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, bytes):
        value = value.decode("utf-8", "ignore")
    text = str(value).replace("\x00", "").strip()
    return text[:_MAX_FIELD_LENGTH] or None


def _file_metadata(content: bytes) -> tuple[dict[str, str | None], str | None, tuple[int, int] | None]:
    """Whitelisted EXIF fields, image format and size from the original file;
    empty when unavailable."""
    try:
        with Image.open(io.BytesIO(content)) as image:
            exif = image.getexif()
            exif_ifd = exif.get_ifd(_EXIF_IFD)
            fields = {
                "make": _clean(exif.get(_TAG_MAKE)),
                "model": _clean(exif.get(_TAG_MODEL)),
                "software": _clean(exif.get(_TAG_SOFTWARE)),
                "datetime_original": _clean(exif_ifd.get(_TAG_DATETIME_ORIGINAL)),
                "user_comment": _clean(exif_ifd.get(_TAG_USER_COMMENT)),
            }
            return fields, image.format, image.size
    except Exception:
        return {}, None, None


def parse_client_metadata(raw: str | None) -> dict[str, str | None]:
    """The app's whitelisted EXIF copy (used when the file itself has none,
    e.g. iOS gallery exports that drop EXIF). Unknown keys are discarded."""
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except ValueError:
        return {}
    if not isinstance(data, dict):
        return {}
    return {key: _clean(data.get(key)) for key in _CLIENT_METADATA_KEYS}


def evaluate_metadata(content: bytes, client_metadata: dict[str, str | None]) -> dict[str, Any]:
    """Metadata signal: does camera EXIF exist, was it made by a camera, was it
    edited/exported by another app, does it look like a screenshot. Prefers
    the file's own EXIF."""
    fields, image_format, size = _file_metadata(content)
    shape = {
        "is_png": image_format == "PNG",
        "screen_shaped": bool(size and min(size) and max(size) / min(size) >= _SCREEN_ASPECT_RATIO),
    }
    origin = "file"
    if not any(fields.values()):
        fields, origin = client_metadata, "app"
    if not any(fields.values()):
        return {"available": False, "origin": None, "has_camera_exif": False,
                "created_by_camera": False, "edited_by_app": False, "software": None,
                "marked_screenshot": False, **shape}
    has_camera_exif = bool(fields.get("make") or fields.get("model"))
    software = fields.get("software")
    marks = (software, fields.get("user_comment"))
    return {
        "available": True,
        "origin": origin,
        "has_camera_exif": has_camera_exif,
        "created_by_camera": has_camera_exif and bool(fields.get("datetime_original")),
        "edited_by_app": bool(software and _EDITING_SOFTWARE.search(software)),
        "software": software,
        # Only the yes/no is kept, never the comment text.
        "marked_screenshot": any(bool(mark and _SCREENSHOT_MARK.search(mark)) for mark in marks),
        **shape,
    }


def classify(
    source: str | None,
    metadata: dict[str, Any],
    recapture: dict[str, Any],
    block_threshold: float,
) -> tuple[str, list[str]]:
    """Combine the signals into one internal outcome plus the reasons for it."""
    reliable = not recapture["low_resolution"]
    strong_recapture = reliable and recapture["p_recapture"] >= block_threshold
    moderate_recapture = recapture["is_recapture"]
    edited = metadata["edited_by_app"]
    # Phone cameras save JPEG or HEIC; screenshots are PNG without camera EXIF.
    png_without_camera = metadata["is_png"] and not metadata["has_camera_exif"]

    if strong_recapture:
        return POTENTIALLY_EXTERNAL, ["strong_screen_recapture"]
    if reliable and moderate_recapture and edited:
        return POTENTIALLY_EXTERNAL, ["screen_recapture", "edited_by_app"]
    if metadata["marked_screenshot"]:
        return POTENTIALLY_EXTERNAL, ["screenshot"]
    if png_without_camera and metadata["screen_shaped"]:
        return POTENTIALLY_EXTERNAL, ["screenshot_shape"]

    reasons: list[str] = []
    if moderate_recapture:
        reasons.append("possible_screen_recapture_low_resolution" if not reliable else "possible_screen_recapture")
    if edited:
        reasons.append("edited_by_app")
    if png_without_camera:
        reasons.append("possible_screenshot")
    # A gallery photo without camera metadata may have been downloaded; pixels
    # alone cannot tell, so this is uncertainty, not suspicion.
    if source == "gallery" and not metadata["has_camera_exif"]:
        reasons.append("gallery_without_camera_metadata")
    if reasons:
        return UNABLE_TO_DETERMINE, reasons
    return LIKELY_GENUINE, []
