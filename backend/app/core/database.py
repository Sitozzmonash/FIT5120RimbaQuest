from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine

from app.core.config import DATABASE_URL
from app.core.schema import metadata
from app.core.seed import seed_iteration_one


CATALOGUE_SPECIES_MERGES = {
    "sp_collared_mongoose_2": "sp_collared_mongoose",
    "sp_short_tailed_mongoose_2": "sp_short_tailed_mongoose",
}
RETIRED_CATALOGUE_SPECIES_ID = "sp_black_crowned_pitta_2"


def _engine() -> Engine:
    kwargs: dict[str, Any] = {"pool_pre_ping": True}
    if DATABASE_URL.startswith("sqlite:///"):
        path = Path(DATABASE_URL.removeprefix("sqlite:///"))
        path.parent.mkdir(parents=True, exist_ok=True)
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(DATABASE_URL, **kwargs)


engine = _engine()


if engine.dialect.name == "sqlite":
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection: Any, _connection_record: Any) -> None:
        """Mirror PostgreSQL foreign-key enforcement in local/test SQLite."""
        dbapi_connection.execute("PRAGMA foreign_keys = ON")


def _add_legacy_columns() -> None:
    """Non-destructively upgrade databases created before later Iteration 1 fields."""
    if engine.dialect.name != "sqlite":
        inspector = inspect(engine)
        if inspector.has_table("species"):
            existing = {column["name"] for column in inspector.get_columns("species")}
            if "is_active" not in existing:
                with engine.begin() as connection:
                    connection.execute(
                        text("ALTER TABLE species ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE")
                    )
        return
    additions = {
        "users": {
            "username": "VARCHAR",
            "email": "VARCHAR",
            "password_hash": "VARCHAR",
            "age": "INTEGER",
            "avatar": "VARCHAR DEFAULT 'hornbill'",
            "recovery_token": "VARCHAR",
        },
        "child_profiles": {
            "avatar": "VARCHAR DEFAULT 'hornbill'",
            "age": "INTEGER DEFAULT 10",
        },
        "sightings": {
            "recorded_at": "DATETIME",
            "location_label": "VARCHAR",
            "photo_path": "VARCHAR",
            "photo_url": "VARCHAR",
            "notes": "TEXT",
        },
        "locations": {"area": "VARCHAR", "typical_wildlife": "VARCHAR"},
        "species": {"is_active": "BOOLEAN DEFAULT 1"},
    }
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table_name, columns in additions.items():
            if not inspector.has_table(table_name):
                continue
            existing = {column["name"] for column in inspector.get_columns(table_name)}
            for name, sql_type in columns.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN "{name}" {sql_type}'))


def _migrate_retired_catalogue() -> None:
    """Safely retire duplicate catalogue rows without losing child history."""
    with engine.begin() as connection:
        for retired_id, canonical_id in CATALOGUE_SPECIES_MERGES.items():
            # Avoid a uniqueness collision when a child has unlocked both the
            # duplicate and canonical card, then repoint all remaining history.
            connection.execute(
                text("""DELETE FROM collection_entries
                    WHERE species_id=:retired
                    AND EXISTS (
                        SELECT 1 FROM collection_entries AS canonical
                        WHERE canonical.child_id=collection_entries.child_id
                        AND canonical.species_id=:canonical
                    )"""),
                {"retired": retired_id, "canonical": canonical_id},
            )
            connection.execute(
                text("UPDATE collection_entries SET species_id=:canonical WHERE species_id=:retired"),
                {"retired": retired_id, "canonical": canonical_id},
            )
            connection.execute(
                text("UPDATE sightings SET species_id=:canonical WHERE species_id=:retired"),
                {"retired": retired_id, "canonical": canonical_id},
            )
            # Reference images and quizzes cascade with this duplicate row.
            connection.execute(text("DELETE FROM species WHERE id=:retired"), {"retired": retired_id})

        # Keep incorrect historical data referentially intact, but do not let
        # new users select, unlock, search, or count this record.
        connection.execute(
            text("UPDATE species SET is_active=:is_active WHERE id=:id"),
            {"id": RETIRED_CATALOGUE_SPECIES_ID, "is_active": False},
        )


def initialise_database() -> None:
    _add_legacy_columns()
    metadata.create_all(engine)
    with engine.begin() as connection:
        # The app now has one shared set of image avatars. Existing emoji-era
        # values are safely moved to the default new avatar on startup.
        for table_name in ("users", "child_profiles"):
            connection.execute(
                text(
                    f"UPDATE {table_name} SET avatar='hornbill' "
                    "WHERE avatar IS NULL OR avatar NOT IN ('hornbill', 'tiger', 'panda')"
                )
            )
        seed_iteration_one(connection)
    _migrate_retired_catalogue()


initialise_database()


def rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row._mapping) for row in result]
