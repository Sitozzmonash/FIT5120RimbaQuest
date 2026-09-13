from __future__ import annotations

import logging
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text

from app.core.auth import AuthenticatedUser, require_child_access
from app.core.database import engine, rows
from app.schemas.chat import SpeciesChatIn, SpeciesChatOut
from app.services.activity import record_species_activity
from app.services.chatbot import (
    DeepSeekChatUnavailable,
    EMPTY_QUESTION_MESSAGE,
    SERVICE_FAILURE_MESSAGE,
    answer_species_question,
)


router = APIRouter(tags=["Species-Specific Wildlife Chatbot"])
logger = logging.getLogger("uvicorn.error")

APPROVED_SPECIES_SELECT = """
    species.id AS id, species.common_name, species.scientific_name,
    species.category, species.habitat, species.diet, species.threats,
    species.conservation_status, species.fun_fact,
    species.responsible_observation, species.distinctive_features,
    species.act716_schedule, species.act716_status
"""


@router.post(
    "/api/v1/children/{child_id}/species/{species_id}/chat",
    response_model=SpeciesChatOut,
)
def chat_about_discovered_species(
    child_id: int,
    species_id: str,
    payload: SpeciesChatIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    """Answer only from the authenticated child's current discovered card."""
    trace_id = uuid4().hex[:12]
    with engine.connect() as connection:
        current = connection.execute(
            text(
                f"""SELECT {APPROVED_SPECIES_SELECT}
                    FROM species
                    JOIN collection_entries
                      ON collection_entries.species_id=species.id
                    WHERE collection_entries.child_id=:child_id
                      AND species.id=:species_id AND species.is_active=TRUE"""
            ),
            {"child_id": child_id, "species_id": species_id},
        ).mappings().first()
        if not current:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Discovered Wildlife Card not found")
        other_species = rows(connection.execute(
            text("""SELECT id, common_name, scientific_name FROM species
                    WHERE is_active=TRUE AND id <> :species_id"""),
            {"species_id": species_id},
        ))

    try:
        reply = answer_species_question(payload.question, dict(current), other_species, trace_id=trace_id)
    except ValueError as error:
        if str(error) == "empty_question":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, EMPTY_QUESTION_MESSAGE) from error
        raise
    except DeepSeekChatUnavailable as error:
        logger.warning("species_chat_failed trace_id=%s child_id=%s species_id=%s reason=%s", trace_id, child_id, species_id, error)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, SERVICE_FAILURE_MESSAGE) from error

    # Empty input and real-provider failures return above, so neither changes
    # Continue Learning. Controlled 200 guardrails still count as an attempt
    # to learn about this current card.
    with engine.begin() as connection:
        record_species_activity(connection, child_id, species_id, "chat")
    return SpeciesChatOut(
        species_id=species_id,
        answer=reply.answer,
        source=reply.source,
        fallback=reply.fallback,
    )
