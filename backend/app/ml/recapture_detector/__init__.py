"""Screen-recapture detector package.

    from recapture_detector import router, get_detector, RecaptureDetector, InvalidImage
"""
from .recapture_detector import InvalidImage, RecaptureDetector
from .router import get_detector, router

__all__ = ['InvalidImage', 'RecaptureDetector', 'get_detector', 'router']
