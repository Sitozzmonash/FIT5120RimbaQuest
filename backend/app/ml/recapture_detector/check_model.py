import sys
from pathlib import Path

from .recapture_detector import InvalidImage, RecaptureDetector

EXT = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.heic', '.heif', '.tif', '.tiff', '.avif'}

folder = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
detector = RecaptureDetector()
print(detector.info())
for f in sorted(p for p in folder.rglob('*') if p.suffix.lower() in EXT):
    try:
        r = detector.predict(f.read_bytes())
        print(f"{r['p_recapture']:.4f}  {r['verdict']:<9}  {f.name}" + ('   [low resolution]' if r['low_resolution'] else ''))
    except InvalidImage as e:
        print(f'  ERROR    {f.name}: {e}')
