from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine

from app.core.config import DATABASE_URL
from app.core.schema import metadata
from app.core.seed import (
    seed_iteration_one,
    seed_iteration_two_chat_evidence,
    seed_iteration_two_fun_facts_pilot,
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


def _rename_child_profile_user_column(target_engine: Engine = engine) -> None:
    """Rename the legacy ownership column without changing its relationship.

    Earlier iterations called the authenticated account owner a "parent" even
    though the current app creates child accounts directly.  Both SQLite and
    PostgreSQL preserve the foreign key, uniqueness rule, and existing values
    when a column is renamed.  Fresh databases simply skip this migration.
    """
    inspector = inspect(target_engine)
    if not inspector.has_table("child_profiles"):
        return
    columns = {column["name"] for column in inspector.get_columns("child_profiles")}
    if "parent_user_id" not in columns or "user_id" in columns:
        return
    with target_engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE child_profiles RENAME COLUMN parent_user_id TO user_id")
        )


def initialise_database() -> None:
    """Create missing tables and seed the static catalogue.

    create_all only adds tables that do not exist yet, so existing rows
    survive every restart; a fresh database (e.g. new Neon project) is
    populated from seed.sql in the same pass.
    """
    _rename_child_profile_user_column()
    metadata.create_all(engine)
    with engine.begin() as connection:
        seed_iteration_one(connection)
        seed_iteration_two_fun_facts_pilot(connection)
        seed_iteration_two_chat_evidence(connection)


initialise_database()


def rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row._mapping) for row in result]
