# RimbaQuest System Stack

Last updated: 17 August 2026

## Product boundary

**Iteration 1 — Discover & Collect:** a child manually records a wildlife discovery, confirms it, unlocks a Wildlife Card, then reviews their collection and progress.

Excluded: automatic photo identification, parent map/adventure planning, virtual habitat, and advanced RAG chat UI.

## Active stack

| Layer | Technology | Status | Notes |
|---|---|---|---|
| Universal client | React Native + Expo SDK 54 + TypeScript + Expo Router | Implemented | `rimbaquest/` is the active shared client for Web, Android and iOS. |
| Legacy browser client | Next.js 15 + React 19 | Superseded | Retained as a reference while the Expo client takes over. |
| API backend | Python 3.12 + FastAPI | Implemented | REST API for species, discoveries, collection and progress. |
| Persistence / ORM | SQLite + SQLAlchemy 2.x | Implemented | Uses the supplied schema and seed SQL. |
| Backend deployment | Docker + Render persistent disk | Configured | SQLite path: `/var/data/RimbaQuest.db`; one backend instance only. |
| Web deployment | Expo static web export | Configured | `npx expo export -p web` creates `rimbaquest/dist/`. |
| Source control | Git | Implemented | Local repository includes the Iteration 1 backend and Expo migration. |

## Client targets

| Target | Development |
|---|---|
| Android | Expo Go or Android Emulator; `npx expo start`. |
| Web | `npx expo start --web`; production: `npx expo export -p web`. |
| iOS | Shared code supports iOS; local simulator/build needs macOS + Xcode. EAS cloud builds can be used later. |

The Android Emulator calls the local backend as `http://10.0.2.2:8000`. Expo web calls `http://127.0.0.1:8000`; this development origin is explicitly included in local FastAPI CORS.

## Iteration 1 API surface

| Endpoint | Purpose |
|---|---|
| `GET /health` | Backend health check. |
| `GET /api/v1/species` | Supported species catalogue; optional category filter. |
| `GET /api/v1/species/{id}` | Species detail. |
| `POST /api/v1/children/{childId}/discoveries` | Confirms and persists a discovery; first discovery unlocks one card. |
| `GET /api/v1/children/{childId}/collection` | Discovered/undiscovered collection state. |
| `GET /api/v1/children/{childId}/progress` | Overall and category progress. |

## Data, security and AI boundary

- SQLite retains the provided schema and seed data.
- GBIF records are Malaysia-filtered and deduplicated before a supported catalogue upsert; Act 716 status only appears after verified scientific-name matching.
- Exact child locations and sensitive-species locations are never public. No uploaded images are persisted in the Iteration 1 manual flow.
- `EXPO_PUBLIC_API_BASE_URL` may contain only a public backend address. All provider keys remain server-side environment variables.
- GLM-4.6V-Flash is reserved for future vision recognition; manual selection remains mandatory in Iteration 1.
- DeepSeek V4 Flash and BM25 remain backend-only services; no chat UI is added.

## Architecture

```text
React Native + Expo client (Android / iOS / Web)
        |
        | HTTPS REST API
        v
FastAPI backend
        |
        +-- SQLite + SQLAlchemy
        +-- GBIF Species API (server-side taxonomy validation)
        +-- BM25 + DeepSeek route when an approved answer endpoint exists
        `-- GLM vision route only when a future iteration activates it
```

## Required local development tools

- Node.js 20.19+ or newer (Expo SDK 54 requirement).
- Android Studio with Android SDK, Build Tools, Platform Tools, Command-line Tools and Android Emulator when using an emulator.
- Expo Go on an Android/iOS device for quick device testing.
- VS Code with Expo/React Native tooling, or Android Studio.
- Git (already available).

Start local development:

```powershell
# Terminal 1: backend
cd backend
uv run --with-requirements requirements.txt uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Expo web / Android client
cd rimbaquest
npx expo start
```
