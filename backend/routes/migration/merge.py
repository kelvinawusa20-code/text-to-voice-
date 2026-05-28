"""
POST /migrate-merge handler.

Trigger the merge operation for a staged batch.
Server reconciles local (staged) records with cloud (canonical) records.

Supports async-ready structure (operation tracked by operationId).
Currently synchronous, but designed for future queue/background job integration.
"""

import uuid
import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from backend.db.database import init_db
from backend.services.merge_service import (
    get_merge_service,
    MergeStrategy,
    ConflictPolicy,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class MigrateMergeRequest(BaseModel):
    """Request to execute a merge operation."""
    mappingId: str
    batchId: str | None = None
    strategy: str = "append_with_dedup"
    conflictPolicy: str = "prefer_newest"
    idempotencyKey: str | None = None


class MigrateMergeResponse(BaseModel):
    """Response with operation tracking details."""
    operationId: str
    status: str
    estimatedTimeSeconds: int | None = None
    message: str | None = None


@router.post("/merge", response_model=MigrateMergeResponse)
async def migrate_merge(req: MigrateMergeRequest) -> MigrateMergeResponse:
    """
    Trigger the merge operation for a staged batch.
    
    Reconciles local (staged) records with cloud (canonical) records
    using the specified strategy and conflict policy.
    
    Returns operationId for polling status via GET /migrate-status.
    """
    try:
        if not req.mappingId:
            raise HTTPException(status_code=400, detail="mappingId is required")
        if not req.batchId:
            raise HTTPException(status_code=400, detail="batchId is required")

        # Validate strategy and conflict policy
        try:
            strategy = MergeStrategy(req.strategy)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid strategy: {req.strategy}")

        try:
            conflict_policy = ConflictPolicy(req.conflictPolicy)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid conflictPolicy: {req.conflictPolicy}")

        # Ensure database is initialized
        init_db()

        # Generate unique operation ID
        operation_id = str(uuid.uuid4())

        # Record the merge operation
        merge_service = get_merge_service()
        merge_service.record_operation(
            operation_id=operation_id,
            mapping_id=req.mappingId,
            batch_id=req.batchId,
            strategy=strategy.value,
            conflict_policy=conflict_policy.value,
            idempotency_key=req.idempotencyKey,
        )

        # Execute merge (synchronous for now)
        try:
            result = merge_service.merge_batches(
                operation_id=operation_id,
                mapping_id=req.mappingId,
                batch_id=req.batchId,
                strategy=strategy,
                conflict_policy=conflict_policy,
            )
            logger.info(f"Merge operation {operation_id} completed: {result}")
        except Exception as e:
            logger.error(f"Merge operation {operation_id} failed: {e}")
            raise

        return MigrateMergeResponse(
            operationId=operation_id,
            status="completed",
            estimatedTimeSeconds=0,
            message=f"Merge completed: {result.merged_count} merged, {result.skipped_count} skipped, {len(result.conflicts)} conflicts",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in migrate_merge: {e}")
        raise HTTPException(status_code=500, detail=str(e))
