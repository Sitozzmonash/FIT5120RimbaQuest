# Screen recapture detector: production package

Tells whether a photo was taken of a **screen** (a "recapture") or is a **genuine** camera photo.

| | |
| --- | --- |
| Model | D: dual-view MobileNetV3-Small, distilled from a DINOv2 teacher, FP16 TensorFlow Lite |
| File | `model/recapture_float16.tflite`, 2.1 MB, sha256 `e22049033c831970…` |
| Threshold | 0.607 (chosen on validation data; `p_recapture ≥ 0.607` means recapture) |
| Speed | about 10 ms of model time per image on one desktop CPU core; decoding a 12 MP JPEG takes longer than that |
| Held-out accuracy | detects 93.6% (FHDMi) and 97.8% (UHDM) of screen photos; wrongly flags 2.6% of genuine Unsplash photos |

Do not swap in the INT8 file from the training runs: with this model INT8 wrongly flags 3–10× as many genuine photos and misses 17% more FHDMi screens.

## Folder contents

```
prod/
  model/recapture_float16.tflite   the model
  model/mobile_contract.json       input spec, threshold, preprocessing (read by the code)
  __init__.py                      makes the folder an importable package (recapture_detector)
  recapture_detector.py            loading, preprocessing, prediction (no web framework needed)
  router.py                        FastAPI APIRouter to plug into an existing app
  app.py                           standalone FastAPI service
  check_model.py                   smoke test on a folder of images
  requirements.txt, Dockerfile
```

## Option 1: add it to your existing FastAPI app (recommended)

1. Copy this whole folder into your project as a package named `recapture_detector/`, next to your app's code. The `model/` folder must stay inside it.
2. Add the dependencies from `requirements.txt` (`ai-edge-litert`, `pillow`, `numpy`, `python-multipart`, optionally `pillow-heif`).
3. Include the router:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from recapture_detector import router as recapture_router, get_detector

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_detector()                # load the model once at startup (add to your existing lifespan if you have one)
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(recapture_router, prefix="/recapture", tags=["recapture"])
```

This adds `POST /recapture/predict` and `GET /recapture/model`.

To check images inside your own endpoint instead, for example during a document upload, call the detector directly:

```python
from fastapi.concurrency import run_in_threadpool
from recapture_detector import InvalidImage, get_detector

@app.post("/documents")
async def upload_document(file: UploadFile):
    data = await file.read()
    try:
        check = await run_in_threadpool(get_detector().predict, data)
    except InvalidImage:
        raise HTTPException(400, "Not a valid image")
    if check["is_recapture"]:
        raise HTTPException(422, "This looks like a photo of a screen. Please photograph the original.")
    ...
```

Always call `predict` through `run_in_threadpool` (or from a normal `def` endpoint) so image decoding does not block the event loop.

## Option 2: run it as its own service

```bash
cd prod
python -m venv .venv
.venv/bin/pip install -r requirements.txt          # Windows: .venv\Scripts\pip install -r requirements.txt
.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
```

Or with Docker:

```bash
docker build -t recapture-detector prod
docker run -p 8000:8000 recapture-detector
```

Interactive docs are at http://localhost:8000/docs.

## API

`POST /predict` (or `/recapture/predict` via the router), multipart form with field `file`:

```bash
curl -F "file=@photo.jpg" http://localhost:8000/predict
```

```python
import requests
r = requests.post("http://localhost:8000/predict", files={"file": open("photo.jpg", "rb")})
print(r.json())
```

Response:

```json
{
  "filename": "photo.jpg",
  "p_recapture": 0.926332,
  "is_recapture": true,
  "verdict": "recapture",
  "threshold": 0.6069220900535583,
  "width": 3072,
  "height": 4096,
  "low_resolution": false,
  "note": null
}
```

| Field | Meaning |
| --- | --- |
| `p_recapture` | Model probability that the photo is of a screen (0 to 1) |
| `is_recapture`, `verdict` | `p_recapture ≥ threshold` |
| `low_resolution` | `true` when the long side is under 1,600 px; the verdict is then less reliable (see below) |
| `note` | Human-readable explanation when `low_resolution` is true |

Errors: `400` empty or undecodable file, `413` file over 40 MB.
`GET /model` returns the model file name, sha256 and threshold; `GET /health` returns `{"status": "ok"}` (standalone app only).

Supported formats: JPEG, PNG, WebP, BMP, TIFF, AVIF, and HEIC/HEIF if `pillow-heif` is installed.

## Important for the app that sends photos

- **Send the original file.** The model finds screens from moiré, a fine pixel-level pattern. Resizing or recompressing the photo before upload (a common default in mobile image pickers and messaging apps) removes it, and screen photos then pass as genuine. On mobile, upload the full-resolution camera file.
- **`low_resolution: true` means "don't trust the verdict much."** Treat it as "needs review" or ask the user for the original photo rather than accepting it outright.
- **Do not crop or rotate the image** before sending. The service applies the EXIF orientation itself, exactly as in training.

## Configuration (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `RECAPTURE_THRESHOLD` | 0.607 (from `mobile_contract.json`) | Raise it to flag fewer genuine photos (and catch fewer screens); lower it for the opposite |
| `RECAPTURE_MODEL` | `model/recapture_float16.tflite` | Path to a different model file; its `mobile_contract.json` must sit next to it |
| `RECAPTURE_THREADS` | 1 | CPU threads per model call |
| `RECAPTURE_MAX_UPLOAD_MB` | 40 | Upload size limit |

**Scaling.** Each process holds one model (about 2 MB) and handles one prediction at a time (thread-safe, behind a lock). For more throughput, run more uvicorn workers (`--workers N`, about one per CPU core) rather than more threads.

## Before going live

The accuracy numbers come from public datasets: Unsplash for genuine photos, FHDMi and UHDM for screens. Run a test on real photos from your users first, about 300 genuine and 150 screen photos taken with the phones they actually use:

```bash
python check_model.py path/to/your/test/photos
```

If too many genuine photos are flagged, raise `RECAPTURE_THRESHOLD` (for example to 0.7) and re-check how many screens are still caught.

## Verified

- The packaged model gives the same verdicts as the evaluated model on all 17 sample images in `final/test_images`, with scores within 0.01.
- The API was tested in a fresh environment: correct responses, 400 on corrupt or empty files, AVIF decoding, 16 parallel requests returning identical scores, and the router mounted inside another FastAPI app.
