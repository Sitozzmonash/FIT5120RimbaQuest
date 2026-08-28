from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS, IS_POSTGRES
from app.routers import auth, battles, discoveries, locations, species

app = FastAPI(title="RimbaQuest API", version="1.2.0")

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
    return {"status": "ok", "database": "postgresql" if IS_POSTGRES else "sqlite", "version": "1.2.0"}


# Register Domain Routers
app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(species.router)
app.include_router(discoveries.router)
app.include_router(battles.router)
