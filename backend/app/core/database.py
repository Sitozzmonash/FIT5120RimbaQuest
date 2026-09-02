from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event
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


def initialise_database() -> None:
    """Create missing tables and seed the static catalogue.

    create_all only adds tables that do not exist yet, so existing rows
    survive every restart; a fresh database (e.g. new Neon project) is
    populated from seed.sql in the same pass.
    """
    metadata.create_all(engine)
    with engine.begin() as connection:
        seed_iteration_one(connection)


initialise_database()


def rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row._mapping) for row in result]
