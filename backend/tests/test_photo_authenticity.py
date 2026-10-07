from __future__ import annotations

import io
import json
import time
from uuid import uuid4

import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.ml.recapture_detector import InvalidImage, get_detector, router as recapture_router
from app.services.authenticity import (
    LIKELY_GENUINE,
    POTENTIALLY_EXTERNAL,
    UNABLE_TO_DETERMINE,
    classify,
    evaluate_metadata,
    parse_client_metadata,
)
from app.services.storage import PROCESSED_PHOTO_LONG_SIDE, prepare_discovery_photo


client = TestClient(app)
BLOCK_MESSAGE = (
    "Please try another photo. Use a photo of wildlife you encountered, "
    "not a picture from a book, website or another screen."
)
RETRY_MESSAGE = "We couldn't check this photo right now. Please try again."
# Words a child must never see.
FORBIDDEN_WORDS = ("fake", "cheat", "lie", "lying", "exif", "confidence", "forensic",
                   "recapture", "authenticity", "score", "likely_genuine", "unable_to_determine")


def _jpeg(width: int = 320, height: int = 240, *, exif: Image.Exif | None = None,
          noise: bool = True, quality: int = 90) -> bytes:
    if noise:
        pixels = np.random.default_rng(0).integers(0, 255, (height, width, 3), dtype=np.uint8)
        image = Image.fromarray(pixels)
    else:
        image = Image.new("RGB", (width, height), (90, 140, 70))
    output = io.BytesIO()
    image.save(output, "JPEG", quality=quality, **({"exif": exif} if exif is not None else {}))
    return output.getvalue()


def _camera_exif(software: str | None = None, gps: bool = False) -> Image.Exif:
    exif = Image.Exif()
    exif[0x010F] = "Apple"
    exif[0x0110] = "iPhone 15"
    if software:
        exif[0x0131] = software
    exif.get_ifd(0x8769)[0x9003] = "2026:10:01 10:00:00"
    if gps:
        exif.get_ifd(0x8825)[1] = "N"
        exif.get_ifd(0x8825)[2] = (3.0, 8.0, 0.0)
    return exif


def _recapture(p: float, low_resolution: bool = False) -> dict:
    return {"p_recapture": p, "is_recapture": p >= 0.607, "threshold": 0.607,
            "low_resolution": low_resolution, "width": 4000, "height": 3000}


_NOT_SCREENSHOT = {"marked_screenshot": False, "is_png": False, "screen_shaped": False}
NO_METADATA = {"available": False, "has_camera_exif": False, "edited_by_app": False, **_NOT_SCREENSHOT}
CAMERA_METADATA = {"available": True, "has_camera_exif": True, "edited_by_app": False, **_NOT_SCREENSHOT}
EDITED_METADATA = {"available": True, "has_camera_exif": True, "edited_by_app": True, **_NOT_SCREENSHOT}


# --- combining signals --------------------------------------------------------

@pytest.mark.parametrize("source, metadata, p, low_res, expected", [
    # Likely Genuine: nothing points elsewhere, missing EXIF is neutral.
    ("camera", NO_METADATA, 0.10, False, LIKELY_GENUINE),
    ("camera", CAMERA_METADATA, 0.10, False, LIKELY_GENUINE),
    ("gallery", CAMERA_METADATA, 0.10, False, LIKELY_GENUINE),
    (None, NO_METADATA, 0.10, False, LIKELY_GENUINE),
    # The model alone at a moderate score is one signal, not proof.
    ("camera", CAMERA_METADATA, 0.70, False, UNABLE_TO_DETERMINE),
    # Low resolution makes the model unreliable, so even a high score is uncertain.
    ("camera", CAMERA_METADATA, 0.95, True, UNABLE_TO_DETERMINE),
    # A gallery photo without camera metadata may be downloaded; pixels alone
    # cannot tell, so it is uncertain, never blocked.
    ("gallery", NO_METADATA, 0.10, False, UNABLE_TO_DETERMINE),
    ("gallery", EDITED_METADATA, 0.10, False, UNABLE_TO_DETERMINE),
    # Strong evidence only.
    ("camera", CAMERA_METADATA, 0.90, False, POTENTIALLY_EXTERNAL),
    ("gallery", EDITED_METADATA, 0.70, False, POTENTIALLY_EXTERNAL),
    # The RimbaQuest camera never skips the recapture check.
    ("camera", NO_METADATA, 0.90, False, POTENTIALLY_EXTERNAL),
])
def test_signals_combine_into_three_outcomes(source, metadata, p, low_res, expected):
    outcome, _ = classify(source, metadata, _recapture(p, low_res), block_threshold=0.85)
    assert outcome == expected


def test_default_block_threshold_blocks_from_0_6_with_or_without_metadata():
    from app.core.config import RECAPTURE_BLOCK_THRESHOLD

    assert RECAPTURE_BLOCK_THRESHOLD == 0.6
    assert classify("camera", CAMERA_METADATA, _recapture(0.741), RECAPTURE_BLOCK_THRESHOLD)[0] == POTENTIALLY_EXTERNAL
    assert classify("camera", CAMERA_METADATA, _recapture(0.59), RECAPTURE_BLOCK_THRESHOLD)[0] == LIKELY_GENUINE
    assert classify("gallery", NO_METADATA, _recapture(0.6), RECAPTURE_BLOCK_THRESHOLD)[0] == POTENTIALLY_EXTERNAL
    assert classify("camera", NO_METADATA, _recapture(0.741), RECAPTURE_BLOCK_THRESHOLD)[0] == POTENTIALLY_EXTERNAL
    # Low resolution stays exempt: the detector is unreliable there.
    assert classify("camera", CAMERA_METADATA, _recapture(0.741, True), RECAPTURE_BLOCK_THRESHOLD)[0] == UNABLE_TO_DETERMINE


def test_gallery_upload_alone_is_never_suspicious():
    """Uploads are not treated as suspicious just for coming from storage."""
    outcome, _ = classify("gallery", CAMERA_METADATA, _recapture(0.05), block_threshold=0.85)
    assert outcome == LIKELY_GENUINE


# --- metadata -----------------------------------------------------------------

def test_metadata_reads_camera_exif():
    metadata = evaluate_metadata(_jpeg(exif=_camera_exif(), noise=False), {})
    assert metadata["available"] and metadata["origin"] == "file"
    assert metadata["has_camera_exif"] and metadata["created_by_camera"]
    assert not metadata["edited_by_app"]


def test_metadata_detects_editing_app_but_not_phone_firmware():
    edited = evaluate_metadata(_jpeg(exif=_camera_exif("Adobe Photoshop 25.0"), noise=False), {})
    firmware = evaluate_metadata(_jpeg(exif=_camera_exif("17.5.1"), noise=False), {})
    assert edited["edited_by_app"] is True
    assert firmware["edited_by_app"] is False


def test_missing_metadata_is_not_available_not_suspicious():
    metadata = evaluate_metadata(_jpeg(noise=False), {})
    assert metadata["available"] is False
    outcome, _ = classify("camera", metadata, _recapture(0.1), block_threshold=0.85)
    assert outcome == LIKELY_GENUINE


def test_app_metadata_is_used_only_when_the_file_has_none():
    client_copy = parse_client_metadata(json.dumps({"make": "Google", "model": "Pixel 9"}))
    from_app = evaluate_metadata(_jpeg(noise=False), client_copy)
    assert from_app["origin"] == "app" and from_app["has_camera_exif"]
    from_file = evaluate_metadata(_jpeg(exif=_camera_exif(), noise=False), client_copy)
    assert from_file["origin"] == "file"


def test_gps_is_never_read_or_kept():
    """GPS in the file or in the app's copy never enters the signals."""
    client_copy = parse_client_metadata(json.dumps({"make": "X", "GPSLatitude": 3.1, "gps": "3.1,101.6"}))
    assert set(client_copy) == {"make", "model", "software", "datetime_original", "user_comment"}
    metadata = evaluate_metadata(_jpeg(exif=_camera_exif(gps=True), noise=False), {})
    assert "gps" not in json.dumps(metadata).casefold()


def _png(width: int, height: int, *, exif: Image.Exif | None = None) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (40, 120, 60)).save(
        buffer, "PNG", exif=exif.tobytes() if exif is not None else b"")
    return buffer.getvalue()


def _screenshot_exif() -> Image.Exif:
    exif = Image.Exif()
    exif.get_ifd(0x8769)[0x9286] = b"ASCII\x00\x00\x00Screenshot"
    return exif


def test_ios_screenshot_comment_blocks():
    metadata = evaluate_metadata(_png(1170, 2532, exif=_screenshot_exif()), {})
    assert metadata["marked_screenshot"] is True
    assert classify("gallery", metadata, _recapture(0.05), block_threshold=0.85) == (POTENTIALLY_EXTERNAL, ["screenshot"])


def test_screenshot_comment_from_the_app_blocks():
    """iOS can drop the file's EXIF on export; the app's copy still carries the mark."""
    client_copy = parse_client_metadata(json.dumps({"user_comment": "Screenshot"}))
    metadata = evaluate_metadata(_jpeg(noise=False), client_copy)
    assert metadata["marked_screenshot"] is True
    assert classify("gallery", metadata, _recapture(0.05), block_threshold=0.85)[0] == POTENTIALLY_EXTERNAL


def test_screenshot_tool_in_software_tag_blocks_but_is_not_an_edit():
    metadata = evaluate_metadata(_jpeg(exif=_camera_exif("Snipping Tool"), noise=False), {})
    assert metadata["marked_screenshot"] is True and metadata["edited_by_app"] is False


def test_screen_shaped_png_without_camera_exif_blocks():
    metadata = evaluate_metadata(_png(1080, 2400), {})
    assert metadata["is_png"] and metadata["screen_shaped"] and not metadata["marked_screenshot"]
    assert classify("gallery", metadata, _recapture(0.05), block_threshold=0.85) == (POTENTIALLY_EXTERNAL, ["screenshot_shape"])


@pytest.mark.parametrize("photo", [
    _png(1200, 900),  # PNG, but camera-shaped
    _jpeg(1080, 2400, noise=False),  # screen-shaped, but a JPEG
], ids=["camera_shaped_png", "screen_shaped_jpeg"])
def test_one_screenshot_hint_alone_is_never_blocked(photo):
    """A single weak hint is uncertainty, not suspicion."""
    metadata = evaluate_metadata(photo, {})
    assert classify("gallery", metadata, _recapture(0.05), block_threshold=0.85)[0] == UNABLE_TO_DETERMINE


def test_screen_shaped_png_with_camera_exif_is_not_a_screenshot():
    metadata = evaluate_metadata(_png(1080, 2400, exif=_camera_exif()), {})
    assert classify("gallery", metadata, _recapture(0.05), block_threshold=0.85)[0] == LIKELY_GENUINE


def test_screenshot_comment_text_is_never_kept():
    metadata = evaluate_metadata(_png(1170, 2532, exif=_screenshot_exif()), {})
    assert "user_comment" not in metadata and "ASCII" not in json.dumps(metadata)


@pytest.mark.parametrize("raw", [None, "", "not json", "[1, 2]"])
def test_bad_app_metadata_is_ignored(raw):
    assert parse_client_metadata(raw) == {}


def test_prepared_photo_has_no_metadata():
    """The copy sent to external AI and storage carries no EXIF/GPS."""
    original = _jpeg(exif=_camera_exif(gps=True), noise=False)
    prepared, content_type = prepare_discovery_photo(original, "image/jpeg")
    assert content_type == "image/jpeg"
    assert len(Image.open(io.BytesIO(prepared)).getexif()) == 0


def test_prepare_shrinks_large_photos_and_converts_heic():
    prepared, _ = prepare_discovery_photo(_jpeg(3000, 2000), "image/jpeg")
    assert max(Image.open(io.BytesIO(prepared)).size) == PROCESSED_PHOTO_LONG_SIDE
    pillow_heif = pytest.importorskip("pillow_heif")
    pillow_heif.register_heif_opener()
    heic = io.BytesIO()
    Image.open(io.BytesIO(_jpeg())).save(heic, "HEIF")
    converted, content_type = prepare_discovery_photo(heic.getvalue(), "image/heic")
    assert content_type == "image/jpeg" and Image.open(io.BytesIO(converted)).format == "JPEG"


# --- end-to-end through the discovery flow ------------------------------------

class _FakeDetector:
    def __init__(self, p: float = 0.1, *, low_resolution: bool = False, error: Exception | None = None,
                 delay: float = 0.0, order: list[str] | None = None):
        self.p, self.low_resolution, self.error, self.delay = p, low_resolution, error, delay
        self.order = order if order is not None else []
        self.received: list[bytes] = []

    def predict(self, data: bytes) -> dict:
        self.order.append("authenticity")
        self.received.append(data)
        if self.delay:
            time.sleep(self.delay)
        if self.error:
            raise self.error
        return {**_recapture(self.p, self.low_resolution),
                "verdict": "recapture" if self.p >= 0.607 else "genuine"}

    def info(self) -> dict:
        return {"sha256": "fake-sha"}


_logged_checks: dict[str, dict] = {}


@pytest.fixture
def flow(monkeypatch):
    """Stub the external vision AI and storage, record what they receive."""
    from app.services.vision import IdentificationOutcome

    calls: dict[str, list] = {"vision": [], "upload": [], "order": []}

    async def fake_vision(content, content_type, catalogue, **_kwargs):
        calls["order"].append("vision")
        calls["vision"].append(content)
        return IdentificationOutcome(matched=True, species_id=catalogue[0]["id"],
                                     confidence=0.95, provider="test", model="test-model")

    def fake_upload(child_id, content, content_type):
        calls["upload"].append(content)
        return f"children/{child_id}/discoveries/test.jpg"

    monkeypatch.setattr("app.routers.discoveries.identify_supported_species", fake_vision)
    monkeypatch.setattr("app.routers.discoveries.upload_discovery_photo", fake_upload)
    monkeypatch.setattr("app.routers.discoveries.signed_photo_url", lambda path: None)

    from app.routers import discoveries
    log_check = discoveries._log_authenticity_check

    def capture_check(trace_id, child_id, source, check):
        _logged_checks[trace_id] = {**check, "source": source}
        log_check(trace_id, child_id, source, check)

    monkeypatch.setattr("app.routers.discoveries._log_authenticity_check", capture_check)

    def use(detector: _FakeDetector) -> dict[str, list]:
        detector.order = calls["order"]
        monkeypatch.setattr("app.routers.discoveries.get_detector", lambda: detector)
        return calls

    return use


def _user() -> tuple[int, dict[str, str]]:
    username = f"pa_{uuid4().hex[:8]}"
    response = client.post("/api/v1/auth/register", json={
        "username": username, "email": f"{username}@rimba.test",
        "password": "authenticPassword123", "age": 10, "avatar": "tiger",
    })
    assert response.status_code == 200, response.text
    return response.json()["child_id"], {"Authorization": f"Bearer {response.json()['access_token']}"}


def _submit(photo: bytes, *, source: str | None = "camera", metadata: dict | None = None) -> tuple[str, dict]:
    child_id, auth = _user()
    data = {}
    if source:
        data["source"] = source
    if metadata is not None:
        data["metadata"] = json.dumps(metadata)
    pending = client.post(
        f"/api/v1/children/{child_id}/discovery-verifications", headers=auth, data=data,
        files={"photo": ("capture.jpg", photo, "image/jpeg")},
    )
    assert pending.status_code == 200, pending.text
    trace_id = pending.json()["trace_id"]
    for _ in range(100):
        status = client.get(
            f"/api/v1/children/{child_id}/discovery-verifications/status/{trace_id}", headers=auth
        ).json()
        if status["stage"] in {"done", "unverified", "failed", "cancelled"}:
            return trace_id, status
        time.sleep(0.05)
    raise AssertionError("verification job never finished")


def _logged(trace_id: str) -> dict | None:
    """The check the flow logged for monitoring, if any."""
    return _logged_checks.get(trace_id)


def _assert_child_safe(status: dict) -> None:
    """no scores, labels or accusing words reach the child."""
    check_fields = {key: value for key, value in status.items() if key != "candidates"}  # species cards
    text = json.dumps(check_fields).casefold()
    for word in FORBIDDEN_WORDS:
        assert word not in text, f"{word!r} leaked to the child: {status}"
    assert "p_recapture" not in text and "outcome" not in text


def test_likely_genuine_runs_before_and_continues_to_wildlife_verification(flow):
    """A likely genuine photo is checked first, then goes on to wildlife verification."""
    calls = flow(_FakeDetector(0.1))
    photo = _jpeg(exif=_camera_exif(), noise=False)
    trace_id, status = _submit(photo, source="camera")
    assert status["stage"] == "done", status
    assert calls["order"] == ["authenticity", "vision"]
    assert _logged(trace_id)["outcome"] == LIKELY_GENUINE
    _assert_child_safe(status)


def test_strong_evidence_blocks_with_the_required_message(flow):
    """no wildlife verification, exact neutral message."""
    detector = _FakeDetector(0.93)
    calls = flow(detector)
    photo = _jpeg()
    trace_id, status = _submit(photo)
    assert status["stage"] == "unverified"
    assert status["message"] == BLOCK_MESSAGE
    assert calls["vision"] == [] and calls["upload"] == []
    assert detector.received == [photo]  # the original, untouched bytes
    assert _logged(trace_id)["outcome"] == POTENTIALLY_EXTERNAL
    _assert_child_safe(status)


def test_moderate_score_with_editing_app_blocks(flow):
    calls = flow(_FakeDetector(0.7))
    _, status = _submit(_jpeg(exif=_camera_exif("Snapseed 2.0")), source="gallery")
    assert status["stage"] == "unverified" and status["message"] == BLOCK_MESSAGE
    assert calls["vision"] == []


def test_unable_to_determine_continues_and_is_logged(flow):
    """A low-resolution gallery photo with no metadata, where
    the detector's flag is unreliable."""
    calls = flow(_FakeDetector(0.7, low_resolution=True))
    trace_id, status = _submit(_jpeg(noise=False), source="gallery")
    assert status["stage"] == "done", status
    assert len(calls["vision"]) == 1
    record = _logged(trace_id)
    assert record["outcome"] == UNABLE_TO_DETERMINE
    assert set(record["reasons"]) == {"possible_screen_recapture_low_resolution", "gallery_without_camera_metadata"}
    assert record["signals"]["metadata"]["available"] is False
    _assert_child_safe(status)


def test_app_metadata_reaches_the_check(flow):
    """the app's EXIF copy is used when the file has none."""
    flow(_FakeDetector(0.1))
    trace_id, status = _submit(_jpeg(noise=False), source="gallery",
                               metadata={"make": "Samsung", "model": "SM-S921B"})
    assert status["stage"] == "done"
    record = _logged(trace_id)
    assert record["outcome"] == LIKELY_GENUINE
    assert record["signals"]["metadata"]["origin"] == "app"


@pytest.mark.parametrize("detector", [
    _FakeDetector(error=RuntimeError("model crashed")),
    _FakeDetector(delay=0.5),
])
def test_technical_failure_asks_to_retry_and_is_not_suspicious(flow, monkeypatch, detector):
    """crashes and timeouts give the retry message, nothing is logged."""
    monkeypatch.setattr("app.routers.discoveries.RECAPTURE_TIMEOUT_SECONDS", 0.1)
    calls = flow(detector)
    trace_id, status = _submit(_jpeg())
    assert status["stage"] == "failed"
    assert status["message"] == RETRY_MESSAGE
    assert calls["vision"] == []
    assert _logged(trace_id) is None
    _assert_child_safe(status)


def test_undecodable_upload_is_not_suspicious(flow):
    calls = flow(_FakeDetector(error=InvalidImage("Cannot decode image")))
    trace_id, status = _submit(b"not really a jpeg")
    assert status["stage"] == "failed"
    assert calls["vision"] == [] and _logged(trace_id) is None


def test_external_ai_gets_a_metadata_free_copy(flow):
    """GPS in the original never reaches the vision AI or storage."""
    detector = _FakeDetector(0.1)
    calls = flow(detector)
    original = _jpeg(exif=_camera_exif(gps=True), noise=False)
    _, status = _submit(original)
    assert status["stage"] == "done", status
    assert detector.received == [original]
    for sent in (calls["vision"][0], calls["upload"][0]):
        assert len(Image.open(io.BytesIO(sent)).getexif()) == 0


def test_unknown_source_value_is_ignored(flow):
    flow(_FakeDetector(0.1))
    trace_id, status = _submit(_jpeg(noise=False), source="hacked-value")
    assert status["stage"] == "done"
    assert _logged(trace_id)["source"] is None


# --- raw-score API is not exposed ---------------------------------------------

def test_raw_score_api_is_not_mounted_by_default():
    _, auth = _user()
    files = {"file": ("photo.jpg", _jpeg(), "image/jpeg")}
    assert client.post("/api/v1/recapture/predict", headers=auth, files=files).status_code == 404
    assert client.get("/api/v1/recapture/model", headers=auth).status_code == 404


# --- the packaged detector and its router (mounted on a private test app) -------

detector_client = TestClient(FastAPI())
detector_client.app.include_router(recapture_router)


def test_real_model_returns_a_probability():
    result = get_detector().predict(_jpeg())
    assert 0.0 <= result["p_recapture"] <= 1.0
    assert result["is_recapture"] == (result["p_recapture"] >= result["threshold"])
    assert result["low_resolution"] is True


def test_detector_router_predicts_a_valid_jpeg():
    response = detector_client.post("/predict", files={"file": ("photo.jpg", _jpeg(), "image/jpeg")})
    assert response.status_code == 200, response.text
    assert set(response.json()) == {"filename", "p_recapture", "is_recapture", "verdict", "threshold",
                                    "width", "height", "low_resolution", "note"}


@pytest.mark.parametrize("content", [b"", b"plain text, not an image"])
def test_detector_router_rejects_empty_and_non_image_files(content):
    response = detector_client.post("/predict", files={"file": ("photo.jpg", content, "image/jpeg")})
    assert response.status_code == 400


def test_detector_router_reports_model_info():
    response = detector_client.get("/model")
    assert response.json()["sha256"].startswith("e22049033c831970")
