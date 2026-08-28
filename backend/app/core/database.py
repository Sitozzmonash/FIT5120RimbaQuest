from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine

from app.core.config import DATABASE_URL
from app.core.schema import metadata
from app.core.seed import seed_iteration_one


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
    """Non-destructively upgrade existing local SQLite databases from Iteration 1."""
    if engine.dialect.name != "sqlite":
        return
    additions = {
        "users": {
            "username": "VARCHAR",
            "email": "VARCHAR",
            "password_hash": "VARCHAR",
            "age": "INTEGER",
            "avatar": "VARCHAR DEFAULT 'tapir'",
            "recovery_token": "VARCHAR",
        },
        "child_profiles": {
            "avatar": "VARCHAR DEFAULT 'tapir'",
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


def initialise_database() -> None:
    _add_legacy_columns()
    metadata.create_all(engine)
    with engine.begin() as connection:
        seed_iteration_one(connection)


initialise_database()


def rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row._mapping) for row in result]
