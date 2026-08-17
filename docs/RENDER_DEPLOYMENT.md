# Deploy the RimbaQuest API on Render

This repository deploys the FastAPI backend as a Docker web service. The Expo app can then call the public Render HTTPS URL when it is run through an Expo tunnel.

## Important data note

The current Iteration 1 backend uses SQLite. Render's normal filesystem is ephemeral, so a SQLite file outside a persistent disk is lost on a restart or deploy. The supplied [`render.yaml`](../render.yaml) therefore mounts a 1 GB disk at `/var/data` and configures:

```text
DATABASE_URL=sqlite:////var/data/RimbaQuest.db
```

Render persistent disks require a paid web-service plan and bind the service to one instance. This is suitable for the small, single-instance Iteration 1 prototype. For a scalable production deployment, migrate the database to Render Postgres instead of SQLite.

## Deploy

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render reads `render.yaml` from the repository root.
3. Confirm the `rimbaquest-api` service, using the **Starter** plan so the persistent disk is available.
4. In the service's Environment page, add the real `DEEPSEEK_API_KEY` and `ZHIPU_API_KEY` values. Do not put API keys in Git or the Dockerfile.
5. Deploy, then open:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/health
   ```

   It should return an `ok` status.

## Connect Expo to Render

Copy the Expo example environment file to a local `.env` file:

```powershell
cd rimbaquest
Copy-Item .env.example .env
```

Set the generated Render URL, for example:

```text
EXPO_PUBLIC_API_BASE_URL=https://rimbaquest-api.onrender.com
```

Restart Expo so it reads the changed environment variable:

```powershell
npx expo start --tunnel --clear
```

Everyone who opens the tunnel now uses the same deployed API. The Expo tunnel only exposes Metro; it does not expose a local FastAPI service.

## CORS

The Blueprint sets `CORS_ALLOWED_ORIGINS=*`. That is acceptable for this unauthenticated Iteration 1 JSON API because it does not use browser cookies or credentialed requests. Before adding authentication, replace `*` with the exact deployed web-app origin(s).
