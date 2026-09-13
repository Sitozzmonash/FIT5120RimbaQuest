from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text


def record_species_activity(
    connection: Any,
    child_id: int,
    species_id: str,
    activity_type: str,
    *,
    occurred_at: datetime | None = None,
) -> None:
    """Upsert the one Continue Learning row for a child/species pair."""
    timestamp = occurred_at or datetime.now(timezone.utc)
    connection.execute(
        text(
            """INSERT INTO child_species_activity
                (child_id, species_id, last_interacted_at, activity_type)
                VALUES (:child_id, :species_id, :last_interacted_at, :activity_type)
                ON CONFLICT (child_id, species_id) DO UPDATE SET
                    last_interacted_at=excluded.last_interacted_at,
                    activity_type=excluded.activity_type"""
        ),
        {
            "child_id": child_id,
            "species_id": species_id,
            "last_interacted_at": timestamp,
            "activity_type": activity_type,
        },
    )
