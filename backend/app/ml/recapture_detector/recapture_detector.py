import hashlib
import io
import json
import os
import threading
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
MODEL_DIR = HERE / 'model'
# Training photos reach 96 MP; above this Pillow refuses to decode (decompression-bomb guard).
Image.MAX_IMAGE_PIXELS = 150_000_000
# Below this long side the image has usually been downscaled (messaging apps, screenshots of thumbnails),
# which removes the fine moire the model relies on: the verdict is then less reliable.
MIN_RELIABLE_LONG_SIDE = 1600

try:
    import pillow_heif
    pillow_heif.register_heif_opener()   # iPhone HEIC/HEIF uploads
except ImportError:
    pass


def _interpreter_class():
    try:
        from ai_edge_litert.interpreter import Interpreter
        return Interpreter
    except ImportError:
        pass
    try:
        from tflite_runtime.interpreter import Interpreter
        return Interpreter
    except ImportError:
        pass
    try:
        import tensorflow as tf
        return tf.lite.Interpreter
    except ImportError:
        raise ImportError('No TFLite interpreter found. Install one: pip install ai-edge-litert')


def center_crop(im, size=224):
    """Training's centre crop: symmetric black padding if smaller than `size`, Python rounding."""
    w, h = im.size
    dw, dh = max(size - w, 0), max(size - h, 0)
    if dw or dh:
        im = ImageOps.expand(im, (dw // 2, dh // 2, (dw + 1) // 2, (dh + 1) // 2), fill=0)
    w, h = im.size
    left, top = round((w - size) / 2), round((h - size) / 2)
    return im.crop((left, top, left + size, top + size))


def make_views(im):
    """PIL image -> (local, global) float32 arrays of shape [1, 224, 224, 3] in [0, 1]."""
    im = ImageOps.exif_transpose(im).convert('RGB')
    local = center_crop(im)
    global_view = center_crop(im.resize((256, 256), Image.Resampling.BILINEAR))
    to_input = lambda v: (np.asarray(v, dtype=np.float32) / 255.)[None]
    return to_input(local), to_input(global_view)


class InvalidImage(ValueError):
    """The upload could not be decoded as an image."""


class RecaptureDetector:
    def __init__(self, model_path=None, threshold=None, num_threads=None):
        model_path = Path(model_path or os.environ.get('RECAPTURE_MODEL', MODEL_DIR / 'recapture_float16.tflite'))
        self.contract = json.loads((model_path.parent / 'mobile_contract.json').read_text())
        env_threshold = os.environ.get('RECAPTURE_THRESHOLD')
        self.threshold = float(threshold if threshold is not None else env_threshold if env_threshold else self.contract['threshold'])
        self.model_sha256 = hashlib.sha256(model_path.read_bytes()).hexdigest()
        self.model_name = model_path.name
        threads = num_threads or int(os.environ.get('RECAPTURE_THREADS', '1'))
        self._interpreter = _interpreter_class()(model_path=str(model_path), num_threads=threads)
        self._interpreter.allocate_tensors()
        # Map inputs by name, never by position: converters may reorder them.
        self._inputs = {}
        for d in self._interpreter.get_input_details():
            for name in ('local_rgb', 'global_rgb'):
                if name in d['name']:
                    self._inputs[name] = d['index']
        if len(self._inputs) != 2:
            raise RuntimeError(f'Unexpected model inputs: {self._interpreter.get_input_details()}')
        self._output = self._interpreter.get_output_details()[0]['index']
        self._recapture_index = int(self.contract.get('recapture_index', 1))
        self._lock = threading.Lock()

    def info(self):
        return dict(model=self.model_name, sha256=self.model_sha256, arch=self.contract.get('arch'),
                    threshold=self.threshold, classes=self.contract.get('classes'),
                    min_reliable_long_side=MIN_RELIABLE_LONG_SIDE)

    def predict_image(self, im):
        """PIL image -> result dict."""
        width, height = ImageOps.exif_transpose(im).size
        local, global_view = make_views(im)
        with self._lock:
            self._interpreter.set_tensor(self._inputs['local_rgb'], local)
            self._interpreter.set_tensor(self._inputs['global_rgb'], global_view)
            self._interpreter.invoke()
            prob = float(self._interpreter.get_tensor(self._output)[0, self._recapture_index])
        is_recapture = prob >= self.threshold
        low_res = max(width, height) < MIN_RELIABLE_LONG_SIDE
        return dict(
            p_recapture=round(prob, 6),
            is_recapture=is_recapture,
            verdict='recapture' if is_recapture else 'genuine',
            threshold=self.threshold,
            width=width, height=height,
            low_resolution=low_res,
            note=(f'Image is only {max(width, height)} px on its long side; downscaled images lose the fine '
                  'moire the model relies on, so this verdict is less reliable.') if low_res else None,
        )

    def predict(self, data: bytes):
        """Encoded image bytes (JPEG, PNG, WebP, HEIC, ...) -> result dict. Raises InvalidImage."""
        try:
            with Image.open(io.BytesIO(data)) as im:
                im.load()
                return self.predict_image(im)
        except (Image.UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError) as e:
            raise InvalidImage('Cannot decode image: unsupported format or corrupt file') from e
