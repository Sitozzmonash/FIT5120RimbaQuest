# RimbaQuest

RimbaQuest is a child-friendly wildlife discovery application developed for FIT5120. A shared Expo and React Native codebase targets Web, Android, and iOS. The current repository architecture runs a Dockerised FastAPI service on Render and uses Supabase PostgreSQL plus private Supabase Storage for durable production data.

Iteration 1 is a **manual wildlife recording and learning experience**. A photo is kept as the child's personal discovery record; it is not sent to an AI model to identify the animal.

## Current deployments

| Service | Address |
|---|---|
| Web application | [rimbaquest-preview--latest.expo.app](https://rimbaquest-preview--latest.expo.app/) |
| Backend API base URL | `https://fit5120rimbaquest.onrender.com` |
| API health | [fit5120rimbaquest.onrender.com/health](https://fit5120rimbaquest.onrender.com/health) |
| Interactive API documentation | [fit5120rimbaquest.onrender.com/docs](https://fit5120rimbaquest.onrender.com/docs) |

Render's free service can take time to wake after inactivity. The first API request may therefore be slower than later requests.

> **Deployment status (verified 27 August 2026):** the production API reports `"database": "postgresql"` and `"version": "1.2.0"`. Supabase PostgreSQL and the private `discovery-photos` Storage bucket are live, and the EAS Hosting `latest` alias has been redeployed from commit `65c6a52` with JWT session recovery and server-authoritative Gallery loading. A browser session created before the PostgreSQL/JWT migration must sign in again; an account that existed only in the former ephemeral SQLite database may need to register again.

## Iteration 1 scope

The primary discovery flow is:

```text
Home
  → Take a photo
  → Choose Mammals / Birds / Butterflies / Reptiles
  → Search and manually select a supported species
  → Confirm species, location, date, and time
  → Record discovery
  → Unlock Wildlife Card on the first discovery
  → View Collection and learn about the species
  → Complete species quiz and track progress
```

Implemented Iteration 1 behaviour includes:

- Account registration, login, prototype recovery-code password reset, and editable child profile.
- Home dashboard with unique discoveries, Explorer Points, and recent captures.
- Device-camera capture and photo-library selection.
- Manual category and species selection across 155 supported species.
- Case-insensitive, partial species-name search with clear and no-result states.
- Confirmation of the selected species and human-readable location.
- A confirmed first discovery unlocks one Wildlife Card and awards 100 Explorer Points.
- Repeat sightings are retained in the species gallery without duplicating the card or its first-discovery reward.
- Collection ordering with unlocked species before undiscovered species.
- Species About, Fun Facts, Gallery, and species-specific Quiz content.
- Overall and per-category progress based on the authenticated child's records.

Not active in Iteration 1:

- AI photo identification.
- Automatic species confirmation.
- BM25/RAG-generated learning content.
- Runtime calls to DeepSeek, GLM vision models, or GBIF.
- Iteration 2 or Iteration 3 gameplay and social features.

DeepSeek V4 Flash, GLM-4.6V-Flash, BM25, and GBIF remain possible future architecture components only. They must not be described as active Iteration 1 functionality.

## Repository and target production architecture

```mermaid
flowchart LR
    U[Child on Web, Android, or iOS] -->|Expo / React Native UI| C[RimbaQuest client]
    C -->|HTTPS REST + Bearer JWT| A[FastAPI on Render]
    A -->|SQLAlchemy + psycopg| P[(Supabase PostgreSQL)]
    A -->|Service-side Storage API| S[(Private Supabase Storage)]
    P -->|Accounts, profiles, sightings, cards, progress| A
    S -->|One-hour signed photo URL| A
    A -->|JSON response| C
    C -->|Bundled reference images| B[155 local species assets]
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| Expo client | Screens, navigation, camera/gallery access, validation, search, and presentation across Web/Android/iOS |
| FastAPI service | Authentication, ownership checks, discovery rules, XP/card updates, catalogue APIs, and signed-photo access |
| Supabase PostgreSQL | Durable production storage for accounts, child profiles, sightings, collections, quizzes, and static catalogue data |
| Supabase Storage | Private storage for child discovery photos under child-scoped object paths |
| Seed SQL | Reproducible source catalogue for 155 species, learning fields, quizzes, locations, and image metadata |
| Bundled Expo assets | Offline-friendly reference images used during manual species selection and in Wildlife Cards |

### Discovery data flow

1. The client captures or selects a photo.
2. The child manually chooses a category and supported species.
3. The client uploads the photo to the authenticated child's photo endpoint.
4. FastAPI validates the JWT and child ownership, then stores the file in the private `discovery-photos` bucket.
5. FastAPI writes the sighting to PostgreSQL using the private object path, not a permanent public URL.
6. The first sighting of a species creates one collection entry and awards 100 XP.
7. Gallery and recent-capture responses contain short-lived signed photo URLs.

## Technology stack

| Layer | Technologies |
|---|---|
| Client | TypeScript, React 19, React Native 0.81, Expo SDK 54, Expo Router |
| Client capabilities | Expo Camera, Expo Image Picker, Expo SecureStore, React Native Web |
| API | Python 3.12, FastAPI 0.115, Uvicorn, Pydantic |
| Data access | SQLAlchemy 2.0, psycopg 3 |
| Production database | Supabase PostgreSQL through the Session pooler |
| Local/test database | SQLite |
| Authentication | Backend-issued HS256 JWTs, Argon2 password hashing, legacy SHA-256 login upgrade |
| Photo storage | Private Supabase Storage, 5 MB server-side upload limit, one-hour signed URLs |
| Deployment | Docker and Render for the API; EAS Hosting/Build for the client |
| Testing | Pytest, FastAPI TestClient, TypeScript compiler, Expo static export |

## Repository layout

```text
FIT5120RimbaQuest/
├── backend/
│   ├── app/
│   │   ├── core/               # Configuration, schema, seeding, JWT ownership
│   │   ├── routers/            # Auth, species, locations, discoveries, progress
│   │   ├── schemas/            # Request models
│   │   └── services/           # Private Storage and domain services
│   ├── data/seed.sql           # Versioned static source catalogue
│   ├── tests/                  # Backend regression tests
│   ├── .env.example
│   └── requirements.txt
├── rimbaquest/
│   ├── assets/species/         # 155 species images plus attribution metadata
│   ├── src/app/                # Expo Router application entry and screens
│   ├── src/components/         # Reusable UI components
│   ├── src/constants/          # API, asset, and session configuration
│   ├── app.json                # Expo native/web configuration
│   ├── eas.json                # EAS build profiles
│   └── package.json
├── Dockerfile                  # Render-compatible backend image
├── render.yaml                 # Render Blueprint
└── README.md
```

`doc/`, `docs/`, local databases, `.env` files, editor settings, QR images, and agent instruction files are intentionally excluded from Git.

## Local development

### Prerequisites

- Node.js LTS and npm.
- Python 3.11 or newer; the Docker image uses Python 3.12.
- Expo Go on a compatible physical device, or Android Studio for an Android emulator.
- macOS and Xcode only when performing local iOS builds or using the iOS Simulator.

### Option A: run the client against the deployed API

This is the simplest way to run the client without starting Python locally. Check the API health response first: while it reports SQLite/version 1.1, the hosted service is suitable for UI testing but not for validating durable Supabase persistence or the new private-photo flow. Redeploy the backend as described below before using it for those checks.

```powershell
cd rimbaquest
Copy-Item .env.example .env
```

Set `rimbaquest/.env` to:

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://fit5120rimbaquest.onrender.com
```

Then install and start the client:

```powershell
npm install
npx expo start --clear
```

Useful variants:

```powershell
npx expo start --web
npx expo start --tunnel --clear
```

For Expo Go on iPhone, scan the Metro QR code with the iPhone Camera app. A physical phone must not use `localhost` for a backend running on the computer.

### Option B: run both backend and client locally

Start the API in one PowerShell window:

```powershell
cd backend
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --env-file .env
```

The default example uses SQLite at `backend/data/RimbaQuest.db`. To exercise discovery-photo upload with a local API, also provide a server-side Supabase Secret Key and use a private development bucket. Without private Storage configuration, catalogue and authentication routes work, but the photo-upload endpoint returns `503`.

Configure the client according to where it runs:

```dotenv
# Web or iOS Simulator
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000

# Physical phone on the same Wi-Fi
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

Start the client from a second PowerShell window:

```powershell
cd rimbaquest
npx expo start --clear
```

## Environment variables

### Expo client

Only one public client variable is required:

| Variable | Example | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://fit5120rimbaquest.onrender.com` | Base URL of the FastAPI service |

Anything beginning with `EXPO_PUBLIC_` is included in the client bundle and must never contain a secret.

### FastAPI backend

| Variable | Required in production | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL Session-pooler connection string |
| `SUPABASE_SECRET_KEY` | Yes | Server-only key used for private Storage operations |
| `JWT_SECRET` | Yes | Random value of at least 32 bytes used to sign access tokens |
| `CORS_ALLOWED_ORIGINS` | Yes for Web | Comma-separated browser origins, or `*` for prototype access |
| `SUPABASE_URL` | No | Overrides the configured project URL |
| `SUPABASE_STORAGE_BUCKET` | No | Overrides the default `discovery-photos` bucket |
| `SEED_SQL_PATH` | No | Overrides the default `./data/seed.sql` path |
| `DEEPSEEK_API_KEY` | No | Reserved for a future iteration; unused by Iteration 1 |
| `ZHIPU_API_KEY` | No | Reserved for a future iteration; unused by Iteration 1 |

Never place `DATABASE_URL`, `SUPABASE_SECRET_KEY`, `JWT_SECRET`, or model-provider keys in the Expo project.

## Production backend deployment

### Supabase preparation

1. Create or select the Supabase project.
2. Create a **private** Storage bucket named `discovery-photos`.
3. Copy the PostgreSQL **Session pooler** connection string on port `5432`.
4. Create a server-side Supabase Secret Key.
5. Rotate any password or key that has appeared in a chat, screenshot, terminal recording, or commit.

No manual schema SQL is required for an empty database. On startup, FastAPI uses SQLAlchemy to create the current Iteration 1 tables and idempotently seeds static catalogue data. A SHA-256 seed version prevents the full catalogue from being rewritten on every Render cold start. Seeding does not delete registered accounts, sightings, cards, or progress.

### Render configuration

Create a Docker Web Service from the repository root, or apply `render.yaml`. The service uses the root `Dockerfile`; no Render persistent disk is required.

Configure:

```text
DATABASE_URL=postgresql://postgres.ekwbvjikckuvvfkakhff:URL_ENCODED_DATABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
SUPABASE_SECRET_KEY=<paste the current rotated server-side key from Supabase API settings>
JWT_SECRET=GENERATE_A_RANDOM_VALUE_OF_AT_LEAST_32_BYTES
CORS_ALLOWED_ORIGINS=*
```

The project URL and bucket already have non-secret defaults:

```text
SUPABASE_URL=https://ekwbvjikckuvvfkakhff.supabase.co
SUPABASE_STORAGE_BUCKET=discovery-photos
```

After saving the variables, deploy the latest `master` commit and verify:

```powershell
Invoke-RestMethod https://fit5120rimbaquest.onrender.com/health
```

Expected fields:

```json
{
  "status": "ok",
  "database": "postgresql",
  "version": "1.2.0"
}
```

If the response says `sqlite`, the Render `DATABASE_URL` is missing or still points to the old local database. Existing data from an earlier ephemeral Render SQLite container is not automatically transferred to Supabase.

## Web deployment with EAS Hosting

Run all Expo/EAS commands from the `rimbaquest` directory:

```powershell
cd rimbaquest
npx eas-cli@latest init --id 38bbcfcf-87f3-4003-8ec5-5bcccc181bbb
npx expo export --platform web
npx eas-cli@latest deploy --alias latest
```

`eas init` is only needed when the checkout is not already connected to the RimbaQuest EAS project. Review the resulting `app.json` change before committing it.

The deployment command produces an immutable deployment URL and updates the reusable alias:

```text
https://rimbaquest-preview--latest.expo.app
```

If a previous immutable URL still shows old code, open the `latest` alias or the new URL printed by EAS.

## Android and iOS builds

### Android preview APK

The existing `preview` profile creates an installable APK:

```powershell
cd rimbaquest
npx eas-cli@latest build --platform android --profile preview
```

View previous Android builds and download links:

```powershell
npx eas-cli@latest build:list --platform android --build-profile preview
```

### iOS

Expo Go can preview compatible JavaScript during development. Installing an independently built iOS app on physical devices normally requires Apple signing and an Apple Developer Program account. EAS can perform the cloud build, but it does not remove Apple's signing and distribution requirements.

### EAS Update

EAS Update can deliver JavaScript and bundled-asset changes only to an already installed build with compatible runtime and channel configuration. Changes to native dependencies, permissions, app identifiers, native plugins, or runtime version require a new native build. Confirm the channel in `eas.json` before treating OTA updates as part of the release workflow.

## Database and security behaviour

- PostgreSQL is the production source of truth; SQLite is a local/test fallback.
- The static seed contains 155 supported species and one quiz per species.
- New passwords are hashed with Argon2.
- A valid login using a legacy SHA-256 password upgrades that password hash once.
- Registration and login issue a 30-day bearer JWT.
- Protected routes validate that the token owns the requested child profile.
- Cross-child profile, sighting, collection, gallery, progress, photo, and battle requests return an authorization error.
- Collection uniqueness and foreign-key constraints prevent duplicate unlock rows and orphaned child/species records.
- Discovery photos use paths such as `children/{child_id}/discoveries/{uuid}.jpg` in a private bucket.
- The client never receives the Supabase Secret Key.
- Native sessions use Expo SecureStore; Web sessions use browser local storage because SecureStore is not available on Web.

This is still an educational prototype. A public child-facing launch additionally requires guardian-consent design, photo retention/deletion controls, rate limiting, audit/monitoring, backups, production CORS restrictions, and a reviewed privacy policy.

## Verification

Backend regression suite:

```powershell
cd backend
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
python -m pytest -q -p no:cacheprovider
```

The cache provider is disabled because some Windows environments have a cache-path issue when the checkout directory contains Chinese characters.

Client type check and static export:

```powershell
cd rimbaquest
npx tsc --noEmit
npx expo export --platform web
```

Before release, manually verify this complete chain on Web and a physical phone:

```text
Register/Login → Take Photo → Category → Search Species → Confirm
→ Success → Collection → Wildlife Card → Quiz → Recent Captures → Progress
```

## Troubleshooting

### `package.json does not exist`

Expo was started from the repository root. Change to the Expo project first:

```powershell
cd rimbaquest
```

### Local works but hosted Web registration does not

Check the `EXPO_PUBLIC_API_BASE_URL` used when the Web bundle was exported, Render CORS settings, and whether the Render API has woken successfully. Expo public environment variables are embedded at export time, so rebuild and redeploy Web after changing them.

### Data disappears after a restart

Check `/health`. Production must report `"database": "postgresql"`. Render's local filesystem is ephemeral on the free plan and must not be used for account or discovery persistence.

### Photo upload returns `503`

Verify that `SUPABASE_SECRET_KEY` is present on Render and that the private bucket is named `discovery-photos`.

### Expo Go reports an incompatible SDK

Update Expo Go and confirm that it supports Expo SDK 54. If Expo Go no longer supports the project's SDK, use an EAS development/preview build or upgrade the SDK as a separate, tested change.

## Data and attribution

- The source catalogue is versioned in `backend/data/seed.sql`.
- The Expo client bundles 155 species reference images.
- Image attribution metadata is stored in `rimbaquest/assets/species/commons-attribution.json`.
- Five hard-to-source gap-fill visuals are educational illustrations rather than photographic evidence and should be reviewed before public redistribution.
- Discovery location data is currently a human-readable label; it is not presented as precise GPS evidence.

## Secret and repository hygiene

Never commit:

- `.env` files or database connection strings.
- Supabase Secret Keys, JWT secrets, or AI-provider keys.
- Local SQLite databases or personal discovery photos.
- `.claude`, `.vscode`, `AGENTS.md`, `CLAUDE.md`, QR-code images, `doc/`, or `docs/`.

If a credential is pasted into chat or included in a screenshot, rotate it even if it was never committed to Git.

## Licence

RimbaQuest is an academic project. Confirm each image's attribution and licence requirements before redistributing the asset set outside the assessment context.
