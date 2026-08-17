# RimbaQuest Species Image Enrichment Prompt

You are maintaining the **RimbaQuest** React Native + Expo project.

## Goal

Add correct, real species photographs to the Iteration 1 Wildlife Card catalogue. Do **not** implement Iteration 2 or 3 features and do not change the existing Iteration 1 discovery flow:

`Take photo → Choose category → Select species manually → Confirm discovery → Unlock card`

## Project locations

- Project root: `D:\Documents\ChatGPT\RimbaQuest构建`
- SQLite database: `backend\data\RimbaQuest.db`
- Species image folder: `rimbaquest\assets\species`
- Main Expo app: `rimbaquest\src\app\index.tsx`
- Existing Wikimedia download script: `rimbaquest\tools\fetch_commons_species_images.ps1`
- Attribution manifest: `rimbaquest\assets\species\commons-attribution.json`

## Current data

The `species` table has 155 records:

| Category | Count |
| --- | ---: |
| Mammal | 86 |
| Bird | 60 |
| Butterfly | 2 |
| Reptile | 7 |

The project originally had 15 manually curated real image assets. It now has approximately 39 local image-backed species. Do not overwrite existing assets.

The catalogue intentionally hides any species that has no real local reference image. Never use a generic placeholder or a picture of a different species as a substitute.

## Required work

1. Read all database species:

   ```powershell
   sqlite3 "backend/data/RimbaQuest.db" "SELECT id, common_name, scientific_name, category FROM species;"
   ```

2. Find species that do not have a matching file in `rimbaquest/assets/species`.

3. Source a correct, real wildlife photo for each missing species.

   - Prefer Wikimedia Commons and search by `scientific_name`.
   - Confirm that the image is genuinely the target species, not merely a similar species or genus.
   - Prefer a JPEG thumbnail around 800–1000px wide to control bundle size.
   - Keep a safe request rate. Wikimedia Commons can return HTTP `429` if queried too quickly.
   - Download in batches of 5–10 with at least about 1.5 seconds between requests.

4. Save the image using the **exact database ID**:

   ```text
   sp_bornean_orangutan.jpg
   sp_clouded_leopard.jpg
   ```

5. Preserve copyright and attribution metadata in `commons-attribution.json`. Each new entry must include, at minimum:

   ```json
   {
     "species": "Bornean Orangutan",
     "scientific_name": "Pongo pygmaeus",
     "page": "Wikimedia Commons file page URL",
     "url": "downloaded thumbnail URL",
     "licence": "CC BY-SA 4.0",
     "licence_url": "licence URL",
     "author": "author name"
   }
   ```

## Required application updates

Adding a file alone is not enough. For every newly downloaded image:

1. Add its static `require(...)` entry to `SPECIES_IMAGES` in `rimbaquest/src/app/index.tsx`.

   ```ts
   sp_bornean_orangutan: require('../../assets/species/sp_bornean_orangutan.jpg'),
   ```

2. Add the species to the offline `SEED` list with its ID, common name, scientific name, category, habitat, diet and fun fact. The App uses `OFFLINE_SPECIES` to deduplicate this data.

3. Keep the category exactly one of `Mammal`, `Bird`, `Butterfly`, or `Reptile`.

4. Ensure there are no duplicate IDs in `SEED`, `SPECIES_IMAGES` or the image folder.

This is necessary because the iPhone app may not be able to reach the developer machine's local FastAPI server. Newly image-backed species must therefore work in the offline catalogue as well.

## Script notes

`rimbaquest/tools/fetch_commons_species_images.ps1` is intended to query Commons, download thumbnails, rate-limit requests, retry transient failures and append attribution metadata. Inspect it before use. Improve it only when doing so keeps the above constraints intact.

Do not claim a species is complete merely because a search result exists. If no trustworthy, correct image is available, leave it without an image rather than using the wrong animal.

## Verification

Run both checks after asset and source updates:

```powershell
cd "D:\Documents\ChatGPT\RimbaQuest构建\rimbaquest"
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\expo\bin\cli export --platform web
```

## Acceptance criteria

- Add as many correctly identified, image-backed species as possible from the 155 database entries.
- Newly image-backed species appear in both offline Collection and Select Species screens.
- Species without a real photo remain hidden from selection / locked in the collection; no generic placeholders.
- Database ID, filename, `SPECIES_IMAGES` mapping and offline data stay consistent.
- Every downloaded image has auditable source and licence details.
- Do not modify the Iteration 1 manual discovery flow and do not add AI automatic identification.
