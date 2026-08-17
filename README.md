# RimbaQuest — Iteration 1

RimbaQuest is an Expo (React Native) app for Web, Android and iOS with a FastAPI + SQLite backend. Iteration 1 supports a child manually recording a wildlife discovery, unlocking a Wildlife Card, reviewing their collection and tracking progress.

## Run locally

```powershell
# Terminal 1 — API
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2 — Expo app
cd rimbaquest
npx expo start
```

For Expo Go on a physical phone, configure `rimbaquest/.env` with either your LAN API address or the deployed Render HTTPS API URL. See [`docs/RENDER_DEPLOYMENT.md`](docs/RENDER_DEPLOYMENT.md) for the Docker + Render deployment setup.

## Project structure

- `rimbaquest/` — active Expo client
- `backend/` — FastAPI API and supplied SQLite data
- `render.yaml` and `Dockerfile` — Render Docker deployment
