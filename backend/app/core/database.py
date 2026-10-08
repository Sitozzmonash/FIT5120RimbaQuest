from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event, inspect
from sqlalchemy.engine import Engine

from app.core.config import DATABASE_URL
from app.core.schema import metadata
from app.core.seed import (
    seed_iteration_one,
    seed_iteration_two_chat_evidence,
    seed_iteration_three_fun_facts,
)


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


def initialise_database() -> None:
    """Create missing tables and seed the static catalogue.

    create_all only adds tables that do not exist yet, so existing rows
    survive every restart; a fresh database (e.g. new Neon project) is
    populated from seed.sql in the same pass.
    """
    metadata.create_all(engine)
    # Existing battle-count rows have no expiry and are treated as ready.
    with engine.begin() as connection:
        rest_columns = {column["name"] for column in inspect(connection).get_columns("wildlife_card_rest")}
        if "rest_until" not in rest_columns:
            connection.exec_driver_sql("ALTER TABLE wildlife_card_rest ADD COLUMN rest_until TIMESTAMP WITH TIME ZONE")
    with engine.begin() as connection:
        # ``create_all`` does not add columns to an existing Render/SQLite
        # database. Keep this narrow migration beside the seed it enables.
        location_columns = {
            column["name"] for column in inspect(connection).get_columns("locations")
        }
        if "official_website" not in location_columns:
            connection.exec_driver_sql(
                "ALTER TABLE locations ADD COLUMN official_website VARCHAR"
            )
        seed_iteration_one(connection)
        seed_iteration_three_fun_facts(connection)
        seed_iteration_two_chat_evidence(connection)


initialise_database()


def rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row._mapping) for row in result]
