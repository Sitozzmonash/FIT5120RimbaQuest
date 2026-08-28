from __future__ import annotations

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)


metadata = MetaData()

app_metadata = Table(
    "app_metadata",
    metadata,
    Column("key", String(100), primary_key=True),
    Column("value", Text, nullable=False),
)

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("role", String(30), nullable=False, default="child"),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("username", String(20), nullable=False),
    Column("email", String(120), nullable=False),
    Column("password_hash", String(255), nullable=False),
    Column("age", Integer, nullable=False),
    Column("avatar", String(30), nullable=False, default="hornbill"),
    Column("recovery_token", String(255)),
)
Index("uq_users_username_ci", func.lower(users.c.username), unique=True)
Index("uq_users_email_ci", func.lower(users.c.email), unique=True)

child_profiles = Table(
    "child_profiles",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("parent_user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
    Column("display_name", String(30), nullable=False),
    Column("age_band", String(20), nullable=False, default="8-11"),
    Column("xp", Integer, nullable=False, default=0),
    Column("level", Integer, nullable=False, default=1),
    Column("safety_briefing_done", Boolean, nullable=False, default=False),
    Column("learning_streak", Integer, nullable=False, default=0),
    Column("avatar", String(30), nullable=False, default="hornbill"),
    Column("age", Integer, nullable=False, default=10),
)

species = Table(
    "species",
    metadata,
    Column("id", String, primary_key=True),
    Column("common_name", String, nullable=False),
    Column("scientific_name", String),
    Column("category", String),
    Column("habitat", Text),
    Column("diet", Text),
    Column("threats", Text),
    Column("conservation_status", String),
    Column("fun_fact", Text),
    Column("responsible_observation", Text),
    Column("source_name", String),
    Column("source_ref", String),
    Column("sensitive", Boolean, nullable=False, default=False),
    Column("emoji", String),
    Column("image_url", String),
    Column("name_zh", String),
    Column("distinctive_features", Text),
    Column("habitat_zh", Text),
    Column("diet_zh", Text),
    Column("threats_zh", Text),
    Column("fun_fact_zh", Text),
    Column("responsible_zh", Text),
    Column("act716_schedule", String),
    Column("act716_status", String),
)

species_images = Table(
    "species_images",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("species_id", String, ForeignKey("species.id", ondelete="CASCADE"), nullable=False),
    Column("uri", String, nullable=False),
    Column("licence", String),
    Column("attribution", Text),
)

locations = Table(
    "locations",
    metadata,
    Column("id", String, primary_key=True),
    Column("name", String, nullable=False),
    Column("type", String),
    Column("lat", Float),
    Column("lng", Float),
    Column("verified", Boolean, nullable=False, default=False),
    Column("description", Text),
    Column("facilities", JSON),
    Column("best_time", String),
    Column("distance_km", Float),
    Column("why_recommended", Text),
    Column("area", String),
    Column("typical_wildlife", String),
)

quizzes = Table(
    "quizzes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("species_id", String, ForeignKey("species.id", ondelete="CASCADE"), nullable=False),
    Column("version", Integer, nullable=False, default=1),
    Column("questions_json", JSON, nullable=False),
    UniqueConstraint("species_id", "version", name="uq_quizzes_species_version"),
)

sightings = Table(
    "sightings",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("child_id", Integer, ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False),
    Column("species_id", String, ForeignKey("species.id"), nullable=False),
    Column("lat_private", Float),
    Column("lng_private", Float),
    Column("public_geohash", String),
    Column("status", String, nullable=False, default="confirmed"),
    Column("sensitive_species", Boolean, nullable=False, default=False),
    Column("recorded_at", DateTime(timezone=True), nullable=False),
    Column("location_label", String(120), nullable=False),
    Column("photo_path", String(500)),
    Column("photo_url", String(1000)),
    Column("notes", Text),
)
Index("ix_sightings_child_recorded", sightings.c.child_id, sightings.c.recorded_at)

collection_entries = Table(
    "collection_entries",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("child_id", Integer, ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False),
    Column("species_id", String, ForeignKey("species.id", ondelete="CASCADE"), nullable=False),
    Column("unlock_reason", String, nullable=False, default="discovery"),
    Column("observed_boolean", Boolean, nullable=False, default=True),
    UniqueConstraint("child_id", "species_id", name="uq_collection_child_species"),
)
