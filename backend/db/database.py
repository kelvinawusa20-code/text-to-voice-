"""
SQLite database initialization and connection management.

Stores:
- Staging migration batches
- Merge operations
- Merge results and conflicts
- Idempotency records

Purpose: Safe, simple staging layer for migration data reconciliation.
No auth assumptions. No token storage.
"""

import sqlite3
import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Database path: use env var or default to backend/data/migrations.db
DB_DIR = Path(os.getenv("AURA_DB_DIR", "backend/data"))
DB_PATH = DB_DIR / "migrations.db"


def get_db_path() -> Path:
    """Get the database path."""
    return DB_PATH


def init_db() -> None:
    """Initialize database schema if it doesn't exist."""
    # Ensure directory exists
    DB_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    try:
        # Mapping table: tracks anonymousUserId -> mappingId associations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mappings (
                mapping_id TEXT PRIMARY KEY,
                anonymous_user_id TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                merge_policy TEXT DEFAULT 'append_with_dedup',
                status TEXT DEFAULT 'pending',
                message TEXT
            )
        """)
        
        # Staging batches table: stores uploaded history records
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS staging_batches (
                batch_id TEXT PRIMARY KEY,
                mapping_id TEXT NOT NULL,
                batch_data TEXT NOT NULL,
                record_count INTEGER NOT NULL DEFAULT 0,
                accepted_count INTEGER NOT NULL DEFAULT 0,
                rejected_count INTEGER NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'staged',
                uploaded_at TEXT NOT NULL,
                FOREIGN KEY (mapping_id) REFERENCES mappings(mapping_id) ON DELETE CASCADE
            )
        """)
        
        # Merge operations table: tracks merge execution
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS merge_operations (
                operation_id TEXT PRIMARY KEY,
                mapping_id TEXT NOT NULL,
                batch_id TEXT,
                strategy TEXT NOT NULL DEFAULT 'append_with_dedup',
                conflict_policy TEXT DEFAULT 'ask_user',
                status TEXT DEFAULT 'pending',
                idempotency_key TEXT,
                merge_result TEXT,
                conflicts TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (mapping_id) REFERENCES mappings(mapping_id) ON DELETE CASCADE,
                FOREIGN KEY (batch_id) REFERENCES staging_batches(batch_id) ON DELETE SET NULL
            )
        """)
        
        # Idempotency table: prevent duplicate processing
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS idempotency_records (
                idempotency_key TEXT PRIMARY KEY,
                operation_id TEXT,
                response_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (operation_id) REFERENCES merge_operations(operation_id) ON DELETE CASCADE
            )
        """)
        
        # Processed records table: track which records have been merged (for deduplication)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processed_records (
                record_hash TEXT PRIMARY KEY,
                mapping_id TEXT NOT NULL,
                original_id TEXT,
                processed_at TEXT NOT NULL,
                FOREIGN KEY (mapping_id) REFERENCES mappings(mapping_id) ON DELETE CASCADE
            )
        """)
        
        # Indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_mappings_anonymous_id ON mappings(anonymous_user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_staging_mapping ON staging_batches(mapping_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_merge_ops_mapping ON merge_operations(mapping_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_merge_ops_status ON merge_operations(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_processed_records_mapping ON processed_records(mapping_id)")
        
        conn.commit()
        logger.info(f"Database initialized at {DB_PATH}")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def get_connection() -> sqlite3.Connection:
    """Get a database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Allow column access by name
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def close_connection(conn: sqlite3.Connection) -> None:
    """Close a database connection."""
    if conn:
        conn.close()
