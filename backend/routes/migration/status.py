"""
GET /migrate-status handler.

Fetch the status of a merge operation and retrieve merge results/conflicts.

Supports polling to check async-ready operation progress.
Currently returns synchronous results, but designed for future async integration.
"""

import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from typing import List

from backend.db.database import init_db
from backend.services.merge_service import get_merge_service

logger = logging.getLogger(__name__)
router = APIRouter()


class MergeConflict(BaseModel):
    """A detected conflict during merge."""
    localId: str
    cloudId: str | None = None
    reason: str
    localRecord: dict | None = None
    cloudRecord: dict | None = None


class MergeResult(BaseModel):
    """Result of a completed merge operation."""
    mergedCount: int
    skippedCount: int
    conflicts: List[MergeConflict] = []
    canonicalRecordCount: int = 0
    strategyUsed: str = "append_with_dedup"
    timestamp: str | None = None


class MigrateStatusResponse(BaseModel):
    """Response with merge operation status and results."""
    operationId: str
    status: str
    mergeResult: MergeResult | None = None
    conflicts: List[MergeConflict] = []


@router.get("/status", response_model=MigrateStatusResponse)
async def migrate_status(operationId: str | None = None, batchId: str | None = None) -> MigrateStatusResponse:
    """
    Fetch the status of a merge operation and retrieve results.
    
    Supports polling to check operation progress.
    Returns merge results and conflicts when available.
    """
    try:
        if not operationId and not batchId:
            raise HTTPException(status_code=400, detail="operationId or batchId is required")

        # Ensure database is initialized
        init_db()

        # Fetch operation status from database
        merge_service = get_merge_service()
        status_data = merge_service.get_merge_status(operationId or "")

        if not status_data:
            # Operation not found
            raise HTTPException(status_code=404, detail="Operation not found")

        # Parse merge result
        merge_result = None
        if status_data.get("merge_result"):
            mr = status_data["merge_result"]
            merge_result = MergeResult(
                mergedCount=mr.get("merged_count", 0),
                skippedCount=mr.get("skipped_count", 0),
                canonicalRecordCount=mr.get("canonical_record_count", 0),
                strategyUsed=mr.get("strategy_used", "append_with_dedup"),
                timestamp=mr.get("timestamp"),
            )

        # Parse conflicts
        conflicts = []
        for conflict_data in status_data.get("conflicts", []):
            conflicts.append(MergeConflict(
                localId=conflict_data.get("local_id", ""),
                cloudId=conflict_data.get("cloud_id"),
                reason=conflict_data.get("reason", ""),
                localRecord=conflict_data.get("local_record"),
                cloudRecord=conflict_data.get("cloud_record"),
            ))

        return MigrateStatusResponse(
            operationId=status_data["operation_id"],
            status=status_data["status"],
            mergeResult=merge_result,
            conflicts=conflicts,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in migrate_status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
