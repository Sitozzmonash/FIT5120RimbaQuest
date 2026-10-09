# RimbaQuest — Iteration 2 Entity-Relationship Diagram

This ERD represents the implemented relational schema in `backend/app/core/schema.py`.
It covers the Iteration 1 catalogue and discovery foundation plus the Iteration 2
verification, learning, fun-fact, and chatbot-evidence additions.

```mermaid
erDiagram
    USERS {
        int id PK
        string role
        string username UK
        string email UK
        string password_hash
        datetime created_at
    }

    CHILD_PROFILES {
        int id PK
        int user_id FK, UK
        string display_name
        string age_band
        int xp
        int level
        boolean safety_briefing_done
        int learning_streak
    }

    SPECIES {
        string id PK
        string common_name
        string scientific_name
        string category
        string conservation_status
        boolean sensitive
        boolean is_active
    }

    SPECIES_IMAGES {
        int id PK
        string species_id FK
        string uri
        string licence
    }

    SPECIES_FUN_FACTS {
        int id PK
        string species_id FK
        int display_order
        string fact_text
        string source_name
        string source_url
        string verification_status
        datetime retrieved_at
    }

    SPECIES_FUN_FACT_SOURCES {
        int id PK
        int fact_id FK
        string source_role
        string source_name
        string source_url
    }

    SPECIES_CHAT_EVIDENCE {
        int id PK
        string species_id FK
        string source_id
        string source_url
        string topic
        string excerpt
        string verification_status
        string verified_by
        datetime verified_at
    }

    QUIZZES {
        int id PK
        string species_id FK
        int version
        json questions_json
    }

    SIGHTINGS {
        int id PK
        int child_id FK
        string species_id FK
        string status
        datetime recorded_at
        string location_label
        string photo_path
    }

    COLLECTION_ENTRIES {
        int id PK
        int child_id FK
        string species_id FK
        string unlock_reason
        boolean observed_boolean
    }

    CHILD_SPECIES_ACTIVITY {
        int id PK
        int child_id FK
        string species_id FK
        datetime last_interacted_at
        string activity_type
    }

    CHILD_QUIZ_PROGRESS {
        int id PK
        int child_id FK
        string species_id FK
        boolean easy_passed
        boolean medium_passed
        boolean hard_passed
    }

    DISCOVERY_VERIFICATIONS {
        string id PK
        int child_id FK
        string verified_species_id FK
        string photo_path
        json candidate_species_ids
        float confidence
        string model
        string status
        datetime expires_at
    }

    LOCATIONS {
        string id PK
        string name
        string type
        float lat
        float lng
        boolean verified
    }

    APP_METADATA {
        string key PK
        string value
    }

    USERS ||--|| CHILD_PROFILES : owns
    CHILD_PROFILES ||--o{ SIGHTINGS : records
    CHILD_PROFILES ||--o{ COLLECTION_ENTRIES : unlocks
    CHILD_PROFILES ||--o{ CHILD_SPECIES_ACTIVITY : continues_learning
    CHILD_PROFILES ||--o{ CHILD_QUIZ_PROGRESS : progresses
    CHILD_PROFILES ||--o{ DISCOVERY_VERIFICATIONS : submits

    SPECIES ||--o{ SPECIES_IMAGES : has
    SPECIES ||--o{ SPECIES_FUN_FACTS : has
    SPECIES_FUN_FACTS ||--o{ SPECIES_FUN_FACT_SOURCES : cites
    SPECIES ||--o{ SPECIES_CHAT_EVIDENCE : supports
    SPECIES ||--o{ QUIZZES : has_versions
    SPECIES ||--o{ SIGHTINGS : is_observed_in
    SPECIES ||--o{ COLLECTION_ENTRIES : is_collected_in
    SPECIES ||--o{ CHILD_SPECIES_ACTIVITY : is_learned_about_in
    SPECIES ||--o{ CHILD_QUIZ_PROGRESS : has_progress_for
    SPECIES ||--o{ DISCOVERY_VERIFICATIONS : is_verified_as
```

## Iteration 2 additions

| Entity | Purpose |
|---|---|
| `discovery_verifications` | Stores the server-owned AI verification result, candidate IDs, confidence, expiry, and completion state before a discovery can be saved. |
| `child_quiz_progress` | Stores each child's Easy/Medium/Hard completion state for a species. |
| `child_species_activity` | Deduplicated “Continue Learning” activity per child and species. |
| `species_fun_facts` | Ten ordered, source-linked child-facing facts per species. |
| `species_fun_fact_sources` | Additional citations for a fun-fact record. |
| `species_chat_evidence` | Approved source excerpts used by the current-species chatbot. |

## Important constraints

- `child_profiles.user_id` is unique: one authenticated user has at most one explorer profile.
- `collection_entries`, `child_species_activity`, and `child_quiz_progress` each have a unique `(child_id, species_id)` pair.
- `species_fun_facts` has a unique `(species_id, display_order)` pair, preserving the ten-fact order.
- `quizzes` has a unique `(species_id, version)` pair.
- `species_chat_evidence` has a unique `(species_id, source_id, source_url, topic)` tuple.
- `locations` is intentionally not connected by a foreign key: a sighting stores a privacy-preserving `location_label`, rather than an exact location ID or coordinates.
- `app_metadata` holds seed/version markers and has no foreign-key relationship.
