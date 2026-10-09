from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.auth import get_current_user
from app.core.config import CORS_ORIGINS, IS_POSTGRES, RECAPTURE_API_ENABLED
from app.ml.recapture_detector import get_detector, router as recapture_router
from app.routers import auth, battle_sessions, battles, chat, discoveries, friends, locations, quizzes, species, wildlife_matches


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Load the screen-recapture model once per worker, not on the first photo.
    get_detector()
    yield


app = FastAPI(title="RimbaQuest API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=CORS_ORIGINS != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root System Endpoint
@app.get("/health")
def health():
    return {"status": "ok", "database": "postgresql" if IS_POSTGRES else "sqlite", "version": "2.0.0"}


# Register Domain Routers
app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(species.router)
app.include_router(quizzes.router)
app.include_router(discoveries.router)
app.include_router(battles.router)
app.include_router(battle_sessions.router)
app.include_router(wildlife_matches.router)
app.include_router(friends.router)
app.include_router(chat.router)

if RECAPTURE_API_ENABLED:
    app.include_router(
        recapture_router,
        prefix="/api/v1/recapture",
        tags=["recapture"],
        dependencies=[Depends(get_current_user)],
    )
