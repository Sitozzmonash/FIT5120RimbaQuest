# RimbaQuest

RimbaQuest is a child-friendly wildlife discovery app built for FIT5120. It uses one Expo/React Native codebase for iOS, Android and the web, backed by a Python FastAPI API and SQLite.

Iteration 1 is intentionally a **manual wildlife-recording experience**. A child takes a personal photo, chooses a category and species from reference cards, confirms the discovery, unlocks a Wildlife Card, learns about the species, and tracks progress. The photo is **not** sent to AI for automatic identification in this iteration.

## Iteration 1 experience

```text
See wildlife
  -> Take a photo
  -> Choose category
  -> Select species
  -> Confirm discovery
  -> Unlock Wildlife Card
  -> View collection and learn
  -> Track progress
```

The app includes:

- Home dashboard with total cards, Explorer Points, and dynamic recent captures.
- Device camera capture through Expo Camera.
- Four wildlife categories: Mammals, Birds, Butterflies, and Reptiles.
- Manual image-led species selection across 155 seeded species.
- Confirmation screen with species, category, location label, and time.
- A confirmed discovery awards 100 Explorer Points and unlocks the species card on first discovery.
- Collection with unlocked cards sorted first and locked/undiscovered cards after them.
- Species Detail pages with About, Fun Facts, Gallery, and a stored species-specific quiz.
- Progress summary by category and overall collection count.

## Technology stack

| Area | Technology |
|---|---|
| Cross-platform client | React 19, React Native 0.81, TypeScript, Expo SDK 54 |
| Navigation/runtime | Expo Router, React Native Web, Expo Camera |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Persistence | SQLAlchemy 2.0 and SQLite |
| Data and assets | Seed SQL, local species JPEG assets, image attribution metadata |
| Container/deployment | Docker, Render web service, Render persistent disk |
| Build/distribution | Expo Go for compatible development testing; EAS Build/Update for installable builds and updates |

### Planned, but not active in Iteration 1

The target architecture includes BM25 retrieval, DeepSeek V4 Flash for constrained learning content, GLM-4.6V-Flash for optional wildlife-image suggestions, and GBIF Species API enrichment. None of these decides the child's species selection in the current Iteration 1 flow. Any future AI feature must preserve manual confirmation, show uncertainty, use reviewed wildlife sources, and obtain suitable consent before analysing a photo.

## Repository layout

```text
RimbaQuest构建/
├── rimbaquest/                  # Expo client
│   ├── src/app/                 # Expo Router screens
│   └── assets/species/          # Bundled wildlife reference assets
├── backend/                     # FastAPI application, tests, seed data
│   ├── app/main.py
│   ├── data/seed.sql
│   └── tests/
├── Dockerfile                   # Root-level Render Docker image
├── render.yaml                  # Render Blueprint configuration
└── README.md
```

`doc/` and `docs/` are intentionally local-only directories. They are ignored by Git and are not part of the repository deliverable.

## Run locally

### Prerequisites

- Node.js LTS and npm
- Python 3.11+ (Python 3.12 is used in Docker)
- An iOS simulator/macOS setup, Android emulator, or Expo Go-compatible physical device for native testing

### 1. Start the API

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Configure the Expo client

Create `rimbaquest/.env` locally (this file is ignored by Git):

```dotenv
# Browser on the same computer
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Or use the deployed HTTPS API for a phone/remote preview
# EXPO_PUBLIC_API_BASE_URL=https://fit5120rimbaquest.onrender.com
```

For a physical phone, do not use `localhost`: it refers to the phone itself. Use the deployed Render URL, or a reachable LAN/tunnel address during local development.

### 3. Start Expo

```powershell
cd rimbaquest
npm install
npx expo start
```

Useful variants:

```powershell
npx expo start --web
npx expo start --tunnel --clear
```

## Test and build checks

Run the backend tests:

```powershell
cd backend
python -m pytest
```

Run the client type check and web export:

```powershell
cd rimbaquest
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\expo\bin\cli export --platform web
```

Before a release, manually test the complete chain on both a mobile device and web: photo, category, species, confirmation, success, collection, Wildlife Card, quiz, recent captures, and progress.

## Render deployment

The repository includes a root `Dockerfile` and `render.yaml` for the FastAPI service. Render must attach a persistent disk at `/var/data` and use:

```text
DATABASE_URL=sqlite:////var/data/RimbaQuest.db
```

This prevents the SQLite database from being lost when the container is redeployed. The current deployed API URL is:

```text
https://fit5120rimbaquest.onrender.com
```

Set deployment secrets only in Render environment variables, never in source control:

```text
DEEPSEEK_API_KEY=...
ZHIPU_API_KEY=...
```

The current Iteration 1 app does not make runtime language-model or vision-model calls, so these keys are reserved for later work. Restrict `CORS_ALLOWED_ORIGINS` to known deployed web origins before a public launch.

## EAS and device distribution

Expo Go is useful for compatible development testing. For stable iOS/Android installs, create a development or preview build with EAS:

```powershell
npx eas-cli@latest build --profile development
```

EAS Update can deliver compatible JavaScript and asset updates to an installed build. A new native build is still required after changing native dependencies or native configuration.

## Data and content notes

- The seed database contains 155 species, learning fields, image mappings, and one quiz per species.
- Species visual assets are bundled into the Expo client and source/attribution metadata is retained in `rimbaquest/assets/species/commons-attribution.json`.
- Five hard-to-source gap-fill visuals are educational illustrations rather than photographic evidence; they require source/accuracy review before public release.
- A discovery records a human-readable location label and timestamp. It does not promise GPS precision.
- A local SQLite file and local `.env` are intentionally ignored; the versioned `backend/data/seed.sql` is the reproducible baseline.

## Security and privacy

Do not commit API keys, `.env` files, local databases, personal photos, `.claude`, `.vscode`, `AGENTS.md`, `CLAUDE.md`, or local documentation folders. Rotate any credential that has been shared in a terminal, screenshot, chat, or commit history.

This is an educational prototype. Public child-facing use requires authentication/ownership controls, parent or guardian consent, clear photo retention/deletion policies, rate limiting, backups, monitoring, explicit production CORS rules, and reviewed/cited species content.

## Licence

This repository is an academic project. Confirm the attribution and licence requirements of each bundled species image before any redistribution outside the assessment context.
