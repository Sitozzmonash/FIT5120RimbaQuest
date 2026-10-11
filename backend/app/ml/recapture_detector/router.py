import threading

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.core.config import RECAPTURE_MAX_UPLOAD_MB, RECAPTURE_THREADS, RECAPTURE_THRESHOLD, RECAPTURE_TILE_GRID

from .recapture_detector import InvalidImage, RecaptureDetector

MAX_UPLOAD_BYTES = RECAPTURE_MAX_UPLOAD_MB * 1024 * 1024
router = APIRouter()
_detector = None
_load_lock = threading.Lock()


def get_detector() -> RecaptureDetector:
    """The process-wide detector, loaded once."""
    global _detector
    if _detector is None:
        with _load_lock:
            if _detector is None:
                _detector = RecaptureDetector(threshold=RECAPTURE_THRESHOLD, num_threads=RECAPTURE_THREADS,
                                              tile_grid=(RECAPTURE_TILE_GRID, RECAPTURE_TILE_GRID))
    return _detector


@router.get('/model')
def model_info():
    return get_detector().info()


@router.post('/predict')
async def predict(file: UploadFile = File(..., description='Photo to check (JPEG, PNG, WebP, HEIC)')):
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f'File larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB')
    if not data:
        raise HTTPException(400, 'Empty file')
    try:
        result = await run_in_threadpool(get_detector().predict, data)   # keep the event loop free
    except InvalidImage as e:
        raise HTTPException(400, str(e))
    return {'filename': file.filename, **result}
