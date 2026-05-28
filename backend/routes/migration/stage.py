"""
POST /migrate-stage handler.

Upload a batch of local analysis history records to the staging area.
Server validates and stores records for later merge.

Supports batch sizes up to 1000 records per upload.
Larger migrations should be chunked by the client.
"""

import uuid
import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from typing import List

from backend.db.database import init_db
from backend.services.merge_service import get_merge_service

logger = logging.getLogger(__name__)
router = APIRouter()


class CloudHistoryRecord(BaseModel):
    """A single analysis history record to migrate."""
    id: str
    timestamp: str
    transcript: str
    result: dict
    summaryText: str
    userMetadata: dict | None = None


class MigrateStageRequest(BaseModel):
    """Request to stage a batch of records for migration."""
    mappingId: str
    batch: List[CloudHistoryRecord]
    batchMeta: dict | None = None
    idempotencyKey: str | None = None


class MigrateStageResponse(BaseModel):
    """Response with staging acceptance summary."""
    batchId: str
    recordCount: int
    acceptedCount: int
    rejectedCount: int
    warnings: List[str] = []


@router.post("/stage", response_model=MigrateStageResponse)
async def migrate_stage(req: MigrateStageRequest) -> MigrateStageResponse:
    """
    Upload a batch of local analysis history records to the staging area.
    Server validates records and stores them for merge.
    
    Returns acceptance counts and any validation warnings.
    """
    try:
        if not req.mappingId:
            raise HTTPException(status_code=400, detail="mappingId is required")
        if not req.batch or len(req.batch) == 0:
            raise HTTPException(status_code=400, detail="batch must contain at least one record")

        # Validate batch size (1000 records max per upload)
        if len(req.batch) > 1000:
            raise HTTPException(status_code=413, detail="batch too large (max 1000 records)")

        # Ensure database is initialized
        init_db()

        # Generate unique batch ID
        batch_id = str(uuid.uuid4())

        # Store batch in staging area
        merge_service = get_merge_service()
        accepted_count, rejected_count, rejection_reasons = merge_service.store_staging_batch(
            batch_id=batch_id,
            mapping_id=req.mappingId,
            batch_data=[record.model_dump() for record in req.batch],
        )

        return MigrateStageResponse(
            batchId=batch_id,
            recordCount=len(req.batch),
            acceptedCount=accepted_count,
            rejectedCount=rejected_count,
            warnings=rejection_reasons,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in migrate_stage: {e}")
        raise HTTPException(status_code=500, detail=str(e))
