# RimbaQuest Expo Client

This directory contains the RimbaQuest cross-platform client built with Expo SDK 54, React Native, TypeScript, and Expo Router. The same codebase targets Web, Android, and iOS.

For the complete system architecture, Iteration 1 scope, Supabase/Render deployment, database behaviour, and security notes, see the [repository README](../README.md).

## Iteration 1 behaviour

RimbaQuest uses a manual wildlife discovery flow:

```text
Take a photo → Choose category → Search and select species
→ Confirm discovery → Unlock Wildlife Card → Learn and track progress
```

The photo is a child's personal discovery record. Iteration 1 does not send it to an AI model for automatic species identification.

The supported catalogue contains:

- 152 active species.
- 152 species quizzes.
- 151 verified bundled reference images.
- Six wildlife locations returned by the backend.

Malaysian Mole currently has no verified reference image. The client must not display an unrelated substitute image.

## Requirements

- Node.js LTS and npm.
- Expo Go on a compatible physical device, or an Expo development/preview build.
- Android Studio for an Android emulator.
- macOS and Xcode only for local iOS Simulator or local iOS build workflows.

## Install and configure

Run commands from this `rimbaquest` directory:

```powershell
npm install
Copy-Item .env.example .env
```

For the deployed Render API, configure:

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://fit5120rimbaquest.onrender.com
```

`EXPO_PUBLIC_` values are embedded into the client bundle. Never place a database password, Supabase Secret Key, JWT secret, or AI-provider key in this directory's environment file.

## Start the client

```powershell
npx expo start --clear
```

Useful alternatives:

```powershell
npx expo start --web
npx expo start --tunnel --clear
```

On iPhone, scan the Metro QR code with the Camera app. A physical phone cannot use `localhost` to reach a backend running on the development computer.

When using a local FastAPI server, use the appropriate API base:

```dotenv
# Web or iOS Simulator
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000

# Physical phone on the same Wi-Fi
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

## Validate the client

```powershell
npx tsc --noEmit
npx expo export --platform web
```

Before release, manually verify:

```text
Register/Login → Take Photo → Category → Search Species → Confirm
→ Success → Collection → Wildlife Card → Quiz → Recent Captures → Progress
```

## Deploy Web with EAS Hosting

The Expo project is already linked to EAS project `38bbcfcf-87f3-4003-8ec5-5bcccc181bbb`.

```powershell
npx expo export --platform web
npx eas-cli@latest deploy --alias latest
```

The reusable Web URL is:

```text
https://rimbaquest-preview--latest.expo.app/
```

Each EAS Hosting deployment is immutable. Deploying with `--alias latest` moves the reusable alias to the new deployment.

## Build an Android preview APK

The `preview` profile in `eas.json` produces an installable APK:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

List previous APK builds and download links:

```powershell
npx eas-cli@latest build:list --platform android --build-profile preview
```

## iOS and EAS Update

Expo Go can preview compatible development JavaScript. Installing a separately built app on a physical iPhone still requires Apple signing and the relevant Apple distribution process.

EAS Update can deliver compatible JavaScript and bundled-asset changes to an installed build. Native dependency, permission, plugin, identifier, or runtime changes require a new native build. The project derives `runtimeVersion` from `appVersion`, so confirm build/channel compatibility before publishing an update.

## Client structure

```text
rimbaquest/
├── assets/
│   ├── auth/                    # Supported profile avatars
│   └── species/                 # 151 verified reference images and attribution
├── src/
│   ├── app/                     # Expo Router entry
│   ├── components/              # Screens and reusable UI
│   ├── constants/               # API, seed assets, and session configuration
│   ├── styles/                  # Shared and screen-specific styles
│   └── types/                   # TypeScript application types
├── app.json                         # Expo app/native configuration
├── eas.json                         # EAS build profiles
└── package.json
```

## Licence note

RimbaQuest does not currently declare a project-wide open-source licence. The `LICENSE` file in this directory came from the Expo starter template and names Expo/650 Industries; it does not establish licensing terms for the RimbaQuest application or wildlife asset collection.
