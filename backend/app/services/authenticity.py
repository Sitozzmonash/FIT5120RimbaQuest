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
# Android screenshots carry only the OS build (e.g. "Android BP2A.250605.031.A3")
# in Software and no Make/Model; camera apps always write Make/Model.
_ANDROID_BUILD_SOFTWARE = re.compile(r"^Android\s+\S+$")
# Phone screens are 18:9 or taller; camera photos are 4:3 or 16:9 (1.78).
_SCREEN_ASPECT_RATIO = 1.9
# Below this long side a gallery image is a thumbnail, sticker or web image,
# never an original phone photo, and is too small to identify wildlife.
_TINY_LONG_SIDE = 640
# Categories the app derives from the filename on the device (the name itself
# is never sent).
_FILE_ORIGINS = {"screenshot", "downloaded"}


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
            print(exif)
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
    fields = {key: _clean(data.get(key)) for key in _CLIENT_METADATA_KEYS}
    # Yes/no from the app: the photo's pixel size equals this phone's screen.
    fields["screen_sized"] = data.get("screen_sized") is True
    file_origin = data.get("file_origin")
    fields["file_origin"] = file_origin if file_origin in _FILE_ORIGINS else None
    return fields


def evaluate_metadata(content: bytes, client_metadata: dict[str, str | None]) -> dict[str, Any]:
    """Metadata signal: does camera EXIF exist, was it made by a camera, was it
    edited/exported by another app, does it look like a screenshot. Prefers
    the file's own EXIF."""
    fields, image_format, size = _file_metadata(content)
    shape = {
        "is_png": image_format == "PNG",
        "screen_shaped": bool(size and min(size) and max(size) / min(size) >= _SCREEN_ASPECT_RATIO),
        "screen_sized": bool(client_metadata.get("screen_sized")),
        "tiny_image": bool(size and max(size) < _TINY_LONG_SIDE),
        "file_origin": client_metadata.get("file_origin"),
    }
    origin = "file"
    if not any(fields.values()):
        fields = {key: client_metadata.get(key) for key in _CLIENT_METADATA_KEYS}
        origin = "app"
    if not any(fields.values()):
        return {"available": False, "origin": None, "has_camera_exif": False,
                "created_by_camera": False, "edited_by_app": False, "software": None,
                "marked_screenshot": False, "android_screenshot_software": False, **shape}
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
        "android_screenshot_software": not has_camera_exif and bool(
            software and _ANDROID_BUILD_SOFTWARE.match(software)
        ),
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
    # Some Android phones save screenshots as JPEG with only the OS build tag.
    android_screenshot = metadata["android_screenshot_software"]
    screen_sized_without_camera = metadata["screen_sized"] and not metadata["has_camera_exif"]

    if strong_recapture:
        return POTENTIALLY_EXTERNAL, ["strong_screen_recapture"]
    if reliable and moderate_recapture and edited:
        return POTENTIALLY_EXTERNAL, ["screen_recapture", "edited_by_app"]
    if metadata["marked_screenshot"]:
        return POTENTIALLY_EXTERNAL, ["screenshot"]
    if (png_without_camera or android_screenshot) and metadata["screen_shaped"]:
        return POTENTIALLY_EXTERNAL, ["screenshot_shape"]
    if screen_sized_without_camera:
        return POTENTIALLY_EXTERNAL, ["screenshot_shape"]
    if metadata["file_origin"] == "screenshot":
        return POTENTIALLY_EXTERNAL, ["screenshot_filename"]

    if source == "gallery":
        # Saved from the web, a chat app, a stock site or an AI generator.
        if metadata["file_origin"] == "downloaded":
            return POTENTIALLY_EXTERNAL, ["downloaded_filename"]
        if metadata["tiny_image"]:
            return POTENTIALLY_EXTERNAL, ["tiny_image"]
        if edited and not metadata["has_camera_exif"]:
            return POTENTIALLY_EXTERNAL, ["edited_without_camera_metadata"]
        # Phone cameras always write Make/Model; web downloads and chat-app
        # copies have them stripped.
        if not metadata["has_camera_exif"]:
            return POTENTIALLY_EXTERNAL, ["gallery_without_camera_metadata"]

    reasons: list[str] = []
    if moderate_recapture:
        reasons.append("possible_screen_recapture_low_resolution" if not reliable else "possible_screen_recapture")
    if edited:
        reasons.append("edited_by_app")
    if png_without_camera or android_screenshot:
        reasons.append("possible_screenshot")
    if reasons:
        return UNABLE_TO_DETERMINE, reasons
    return LIKELY_GENUINE, []
