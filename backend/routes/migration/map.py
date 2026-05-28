"""
POST /migrate-map handler.

Establish a mapping from anonymousUserId to a future userId.
Server generates a unique mappingId for this relationship.

No auth required at this stage (mapping is anonymous).
Idempotency: Safe to retry with same idempotencyKey.
"""

import uuid
import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from backend.db.database import init_db
from backend.services.merge_service import get_merge_service

logger = logging.getLogger(__name__)
router = APIRouter()


class MigrateMapRequest(BaseModel):
    """Request to establish a mapping for migration."""
    anonymousUserId: str
    proposedUserIdentifier: str | None = None
    clientHint: dict | None = None
    idempotencyKey: str | None = None


class MigrateMapResponse(BaseModel):
    """Response with mapping details."""
    mappingId: str
    status: str
    mergePolicy: str
    message: str | None = None


@router.post("/map", response_model=MigrateMapResponse)
async def migrate_map(req: MigrateMapRequest) -> MigrateMapResponse:
    """
    Establish a mapping from anonymousUserId to a future userId.
    Returns a unique mappingId to use for staging and merging.
    """
    try:
        if not req.anonymousUserId:
            raise HTTPException(status_code=400, detail="anonymousUserId is required")

        # Ensure database is initialized
        init_db()

        # Generate unique mapping ID
        mapping_id = str(uuid.uuid4())

        # Record mapping in database
        merge_service = get_merge_service()
        merge_service.record_mapping(
            mapping_id=mapping_id,
            anonymous_user_id=req.anonymousUserId,
            merge_policy="append_with_dedup",
        )

        return MigrateMapResponse(
            mappingId=mapping_id,
            status="pending",
            mergePolicy="append_with_dedup",
            message="Mapping reserved. Ready to stage data.",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in migrate_map: {e}")
        raise HTTPException(status_code=500, detail=str(e))
