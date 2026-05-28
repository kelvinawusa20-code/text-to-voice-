"""
Merge service: core reconciliation logic for migration merge operations.

Implements:
- Batch staging and persistence
- Deduplication by stable hash
- Timestamp reconciliation
- Conflict detection
- Idempotency tracking
- Safe merge execution

Design: Synchronous for now, but structured for future async/queue integration.
"""

import json
import sqlite3
import hashlib
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

from backend.db.database import get_connection, close_connection

logger = logging.getLogger(__name__)


class MergeStrategy(str, Enum):
    """Available merge strategies."""
    APPEND_WITH_DEDUP = "append_with_dedup"
    REPLACE_LOCAL = "replace_local"
    REPLACE_CLOUD = "replace_cloud"


class ConflictPolicy(str, Enum):
    """Conflict resolution policies."""
    ASK_USER = "ask_user"
    PREFER_NEWEST = "prefer_newest"
    PREFER_OLDEST = "prefer_oldest"


@dataclass
class MergeConflict:
    """Represents a detected conflict during merge."""
    local_id: str
    cloud_id: Optional[str]
    reason: str  # e.g., "duplicate_content", "conflicting_timestamps", "corrupted_entry"
    local_record: Optional[Dict[str, Any]] = None
    cloud_record: Optional[Dict[str, Any]] = None


@dataclass
class MergeResult:
    """Result of a merge operation."""
    merged_count: int
    skipped_count: int
    conflicts: List[MergeConflict]
    canonical_record_count: int
    strategy_used: str
    timestamp: str


def compute_record_hash(record: Dict[str, Any]) -> str:
    """
    Compute stable hash for a record to detect duplicates.
    
    Hash combines:
    - transcript (core content)
    - analysis text (semantic content)
    - timestamp (grouped to 1-hour windows for fuzzy matching)
    
    This allows detecting copies of the same analysis even if timestamps differ slightly.
    """
    transcript = record.get("transcript", "").strip().lower()
    analysis_text = record.get("result", {}).get("analysis", "").strip().lower()
    timestamp = record.get("timestamp", "")
    
    # Group timestamps to 1-hour windows for fuzzy deduplication
    # This catches records from the same session even if created at slightly different times
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        hour_key = dt.strftime("%Y-%m-%d %H:00:00")
    except (ValueError, AttributeError):
        hour_key = "unknown"
    
    # Create stable hash
    content = f"{transcript}|{analysis_text}|{hour_key}"
    return hashlib.sha256(content.encode()).hexdigest()


def detect_duplicates(
    local_records: List[Dict[str, Any]],
    cloud_records: List[Dict[str, Any]],
    processed_hashes: set,
) -> Tuple[List[Dict[str, Any]], List[MergeConflict]]:
    """
    Detect and filter duplicate records.
    
    Returns:
    - deduplicated_records: merged list with duplicates removed
    - conflicts: list of detected conflicts
    """
    deduplicated = []
    conflicts = []
    seen_hashes = processed_hashes.copy()
    
    # Process cloud records first (they are "canonical")
    for cloud_record in cloud_records:
        record_hash = compute_record_hash(cloud_record)
        if record_hash not in seen_hashes:
            deduplicated.append(cloud_record)
            seen_hashes.add(record_hash)
    
    # Process local records, detecting duplicates
    for local_record in local_records:
        record_hash = compute_record_hash(local_record)
        if record_hash in seen_hashes:
            # This is a duplicate
            conflicts.append(MergeConflict(
                local_id=local_record.get("id", "unknown"),
                cloud_id=None,
                reason="duplicate_content",
                local_record=local_record,
                cloud_record=None,
            ))
        else:
            deduplicated.append(local_record)
            seen_hashes.add(record_hash)
    
    return deduplicated, conflicts


def reconcile_by_timestamp(
    records: List[Dict[str, Any]],
    conflict_policy: ConflictPolicy = ConflictPolicy.PREFER_NEWEST,
) -> Tuple[List[Dict[str, Any]], List[MergeConflict]]:
    """
    Reconcile records with conflicting timestamps.
    
    For records with same transcript/analysis but different timestamps,
    apply conflict policy to determine which version to keep.
    """
    reconciled = []
    conflicts = []
    
    # Group records by content hash
    content_groups: Dict[str, List[Dict[str, Any]]] = {}
    for record in records:
        hash_key = compute_record_hash(record)
        if hash_key not in content_groups:
            content_groups[hash_key] = []
        content_groups[hash_key].append(record)
    
    # For each group, apply reconciliation policy
    for hash_key, group in content_groups.items():
        if len(group) == 1:
            # No conflict, use as-is
            reconciled.append(group[0])
        else:
            # Multiple versions of same content
            if conflict_policy == ConflictPolicy.PREFER_NEWEST:
                # Sort by timestamp, take newest
                sorted_group = sorted(
                    group,
                    key=lambda r: r.get("timestamp", ""),
                    reverse=True
                )
                reconciled.append(sorted_group[0])
                for other in sorted_group[1:]:
                    conflicts.append(MergeConflict(
                        local_id=other.get("id", "unknown"),
                        cloud_id=sorted_group[0].get("id"),
                        reason="conflicting_timestamps",
                        local_record=other,
                        cloud_record=sorted_group[0],
                    ))
            elif conflict_policy == ConflictPolicy.PREFER_OLDEST:
                # Sort by timestamp, take oldest
                sorted_group = sorted(
                    group,
                    key=lambda r: r.get("timestamp", ""),
                )
                reconciled.append(sorted_group[0])
                for other in sorted_group[1:]:
                    conflicts.append(MergeConflict(
                        local_id=other.get("id", "unknown"),
                        cloud_id=sorted_group[0].get("id"),
                        reason="conflicting_timestamps",
                        local_record=other,
                        cloud_record=sorted_group[0],
                    ))
            else:  # ASK_USER
                # Keep first, flag others as conflicts
                reconciled.append(group[0])
                for other in group[1:]:
                    conflicts.append(MergeConflict(
                        local_id=other.get("id", "unknown"),
                        cloud_id=group[0].get("id"),
                        reason="conflicting_timestamps",
                        local_record=other,
                        cloud_record=group[0],
                    ))
    
    return reconciled, conflicts


class MergeService:
    """Main merge service for migration reconciliation."""
    
    def __init__(self):
        """Initialize merge service."""
        self.conn = None
    
    def _get_conn(self) -> Any:
        """Get database connection (lazy initialization)."""
        if not self.conn:
            self.conn = get_connection()
        return self.conn
    
    def record_mapping(
        self,
        mapping_id: str,
        anonymous_user_id: str,
        merge_policy: str = "append_with_dedup",
    ) -> None:
        """Record a new mapping from anonymousUserId to mappingId."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO mappings (mapping_id, anonymous_user_id, created_at, merge_policy, status)
                VALUES (?, ?, ?, ?, 'pending')
            """, (mapping_id, anonymous_user_id, datetime.utcnow().isoformat(), merge_policy))
            conn.commit()
            logger.info(f"Recorded mapping {mapping_id} for {anonymous_user_id}")
        except sqlite3.IntegrityError as e:
            logger.warning(f"Mapping already exists: {e}")
            conn.rollback()
        except Exception as e:
            logger.error(f"Error recording mapping: {e}")
            conn.rollback()
            raise
    
    def store_staging_batch(
        self,
        batch_id: str,
        mapping_id: str,
        batch_data: List[Dict[str, Any]],
    ) -> Tuple[int, int, List[str]]:
        """
        Store a staging batch.
        
        Returns:
        - accepted_count: number of valid records
        - rejected_count: number of rejected records
        - rejection_reasons: list of rejection reasons
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        accepted_count = 0
        rejected_count = 0
        rejection_reasons = []
        
        try:
            # Validate records
            for record in batch_data:
                if not self._validate_record(record):
                    rejected_count += 1
                    rejection_reasons.append(f"Invalid record: {record.get('id', 'unknown')}")
                else:
                    accepted_count += 1
            
            # Store batch
            cursor.execute("""
                INSERT INTO staging_batches 
                (batch_id, mapping_id, batch_data, record_count, accepted_count, rejected_count, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                batch_id,
                mapping_id,
                json.dumps(batch_data),
                len(batch_data),
                accepted_count,
                rejected_count,
                datetime.utcnow().isoformat(),
            ))
            conn.commit()
            logger.info(f"Stored batch {batch_id}: {accepted_count} accepted, {rejected_count} rejected")
            return accepted_count, rejected_count, rejection_reasons
        except Exception as e:
            logger.error(f"Error storing staging batch: {e}")
            conn.rollback()
            raise
    
    def _validate_record(self, record: Dict[str, Any]) -> bool:
        """Validate a history record."""
        required_fields = ["id", "timestamp", "transcript", "result"]
        for field in required_fields:
            if field not in record:
                return False
        return True
    
    def merge_batches(
        self,
        operation_id: str,
        mapping_id: str,
        batch_id: str,
        strategy: MergeStrategy = MergeStrategy.APPEND_WITH_DEDUP,
        conflict_policy: ConflictPolicy = ConflictPolicy.PREFER_NEWEST,
    ) -> MergeResult:
        """
        Execute merge operation for a staging batch.
        
        Reconciles local (staged) history with cloud (canonical) history.
        Returns MergeResult with counts and conflicts.
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        try:
            # Fetch staging batch
            cursor.execute("SELECT batch_data FROM staging_batches WHERE batch_id = ?", (batch_id,))
            row = cursor.fetchone()
            if not row:
                raise ValueError(f"Batch {batch_id} not found")
            
            local_records = json.loads(row["batch_data"])
            
            # Fetch processed records for this mapping (to avoid re-merging)
            cursor.execute(
                "SELECT record_hash FROM processed_records WHERE mapping_id = ?",
                (mapping_id,)
            )
            processed_hashes = {row["record_hash"] for row in cursor.fetchall()}
            
            # For now, assume cloud_records is empty (future: fetch from cloud DB)
            cloud_records = []
            
            all_conflicts = []
            
            # Apply merge strategy
            if strategy == MergeStrategy.APPEND_WITH_DEDUP:
                # Detect and filter duplicates
                deduplicated, dup_conflicts = detect_duplicates(
                    local_records,
                    cloud_records,
                    processed_hashes,
                )
                all_conflicts.extend(dup_conflicts)
                
                # Reconcile by timestamp
                reconciled, ts_conflicts = reconcile_by_timestamp(
                    deduplicated,
                    conflict_policy,
                )
                all_conflicts.extend(ts_conflicts)
                
                merged_records = reconciled
                merged_count = len(merged_records)
                skipped_count = len(local_records) - merged_count
                
            else:
                # Other strategies (replace) not implemented yet
                merged_records = local_records
                merged_count = len(merged_records)
                skipped_count = 0
            
            # Record merged records as processed (prevents re-merging)
            for record in merged_records:
                record_hash = compute_record_hash(record)
                cursor.execute("""
                    INSERT OR IGNORE INTO processed_records (record_hash, mapping_id, original_id, processed_at)
                    VALUES (?, ?, ?, ?)
                """, (record_hash, mapping_id, record.get("id"), datetime.utcnow().isoformat()))
            
            # Update merge operation status
            result = MergeResult(
                merged_count=merged_count,
                skipped_count=skipped_count,
                conflicts=all_conflicts,
                canonical_record_count=len(cloud_records) + merged_count,
                strategy_used=strategy.value,
                timestamp=datetime.utcnow().isoformat(),
            )
            
            cursor.execute("""
                UPDATE merge_operations
                SET status = 'completed', merge_result = ?, conflicts = ?, completed_at = ?
                WHERE operation_id = ?
            """, (
                json.dumps(asdict(result), default=str),
                json.dumps([asdict(c) for c in all_conflicts], default=str),
                datetime.utcnow().isoformat(),
                operation_id,
            ))
            
            # Update staging batch status
            cursor.execute("""
                UPDATE staging_batches SET status = 'merged' WHERE batch_id = ?
            """, (batch_id,))
            
            conn.commit()
            logger.info(f"Merge operation {operation_id} completed: {merged_count} merged, {skipped_count} skipped, {len(all_conflicts)} conflicts")
            return result
            
        except Exception as e:
            logger.error(f"Error during merge: {e}")
            conn.rollback()
            raise
    
    def get_merge_status(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """Fetch merge operation status and result."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT operation_id, status, merge_result, conflicts, completed_at
                FROM merge_operations
                WHERE operation_id = ?
            """, (operation_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            return {
                "operation_id": row["operation_id"],
                "status": row["status"],
                "merge_result": json.loads(row["merge_result"]) if row["merge_result"] else None,
                "conflicts": json.loads(row["conflicts"]) if row["conflicts"] else [],
                "completed_at": row["completed_at"],
            }
        except Exception as e:
            logger.error(f"Error fetching merge status: {e}")
            return None
    
    def record_operation(
        self,
        operation_id: str,
        mapping_id: str,
        batch_id: Optional[str] = None,
        strategy: str = MergeStrategy.APPEND_WITH_DEDUP.value,
        conflict_policy: str = ConflictPolicy.PREFER_NEWEST.value,
        idempotency_key: Optional[str] = None,
    ) -> None:
        """Record a merge operation in the database."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO merge_operations
                (operation_id, mapping_id, batch_id, strategy, conflict_policy, idempotency_key, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
            """, (
                operation_id,
                mapping_id,
                batch_id,
                strategy,
                conflict_policy,
                idempotency_key,
                datetime.utcnow().isoformat(),
            ))
            conn.commit()
            logger.info(f"Recorded merge operation {operation_id}")
        except Exception as e:
            logger.error(f"Error recording operation: {e}")
            conn.rollback()
            raise


# Global merge service instance
_merge_service: Optional[MergeService] = None


def get_merge_service() -> MergeService:
    """Get or create the global merge service instance."""
    global _merge_service
    if not _merge_service:
        _merge_service = MergeService()
    return _merge_service
