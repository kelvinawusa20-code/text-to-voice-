# Migration API Spec: Anonymous → Authenticated Migration

This document defines the server-side API contracts and data models for safely migrating anonymous local users to authenticated SaaS accounts.

## 1. Migration Flow Overview

1. Client obtains explicit user consent to migrate local anonymous data to a cloud account.
2. Client calls `POST /migrate-map` to request a server-side mapping of `anonymousUserId` to future `userId` (authenticated-only; mapping may be provisional).
3. Client uploads a migration batch via `POST /migrate-stage` containing a batch of local history records and metadata.
4. Server validates and stores batch in a staging area and returns a `batchId` and summary.
5. Client triggers `POST /migrate-merge` to request a merge of staged data into the canonical cloud account; server performs deduplication/merge asynchronously or synchronously depending on payload size.
6. Client polls `GET /migrate-status?batchId=...` for merge progress and to retrieve a `MergeResult` and conflict list.
7. After successful merge, server marks the staging batch as completed and returns canonical cloud state for client sync.

> Notes: All endpoints require authentication in future (not implemented here). For now they are designed as authenticated endpoints; stubs will accept requests but perform no auth.

## 2. API Endpoints

### POST /migrate-map

Purpose: Reserve and record the intention to map an `anonymousUserId` to a `userId`. Server will return a `mappingId` and suggested merge policy.

Request schema:
- `anonymousUserId`: string (required)
- `proposedUserIdentifier`: string (optional) // e.g. email provided during sign-up flow
- `clientHint`: object (optional) // e.g. deviceId, user agent
- `idempotencyKey`: string (optional)

Response schema:
- `mappingId`: string
- `status`: "pending" | "ready"
- `mergePolicy`: "merge" | "replace_local" | "replace_cloud"
- `message`: string (optional)

Validation rules:
- `anonymousUserId` must be non-empty and well-formed.
- `idempotencyKey` if provided must be a GUID-like string.

Error states:
- 400 Bad Request: invalid payload
- 409 Conflict: mapping already claimed by a different authenticated account (requires manual resolution)
- 500 Server Error

Retry/idempotency:
- POST is idempotent if `idempotencyKey` is provided; server must return the same `mappingId` for same key.

---

### POST /migrate-stage

Purpose: Upload a batch of local records to server-side staging.

Request schema:
- `mappingId`: string (required)
- `batch`: array of `CloudHistoryRecord` (see Data Models)
- `batchMeta`: object (optional) { `deviceId`, `batchSize`, `clientTimestamp` }
- `idempotencyKey`: string (optional)

Response schema:
- `batchId`: string
- `recordCount`: integer
- `acceptedCount`: integer
- `rejectedCount`: integer
- `warnings`: array of strings

Validation rules:
- `mappingId` required and must reference an existing mapping.
- `batch` must be non-empty and limited to server-configured maximum (e.g., 1000 items).

Error states:
- 400 Bad Request: invalid payload
- 413 Payload Too Large: batch exceeds allowed limit
- 404 Not Found: mappingId unknown
- 500 Server Error

Retry/idempotency:
- `idempotencyKey` makes upload idempotent; duplicates are detected by server using `idempotencyKey` and stable record IDs.

---

### POST /migrate-merge

Purpose: Trigger a merge of staged batch(es) into a user's canonical cloud dataset.

Request schema:
- `mappingId`: string (required)
- `batchId`: string (optional) // if omitted, merge all pending batches
- `strategy`: "merge" | "replace_local" | "replace_cloud" (default: "merge")
- `conflictPolicy`: "prefer_newest" | "prefer_cloud" | "ask_user" (default: "prefer_newest")
- `idempotencyKey`: string (optional)

Response schema (synchronous or immediate acknowledgement):
- `operationId`: string
- `status`: "accepted" | "running" | "completed" | "failed"
- `estimatedTimeSeconds`: integer (optional)
- `message`: string (optional)

Validation rules:
- mappingId must be valid
- strategy must be one of allowed values

Error states:
- 400 Bad Request
- 404 Not Found
- 409 Conflict: concurrent merge operations for same mapping
- 500 Server Error

Retry/idempotency:
- `idempotencyKey` ensures safe retries. The server must not apply the same merge twice for the same key.

---

### GET /migrate-status

Purpose: Fetch status for a staging/merge operation, conflict list, and final MergeResult.

Query params:
- `operationId` (string) OR `batchId` (string) (one required)

Response schema:
- `operationId`: string
- `status`: "pending" | "running" | "completed" | "failed"
- `mergeResult`: `MergeResult` | null
- `conflicts`: array of `MergeConflict`
- `links`: { `downloadMerged`: url, `deleteStaging`: url }

Error states:
- 400 Bad Request
- 404 Not Found
- 500 Server Error

Retry/idempotency:
- GET is safe to retry; server should return consistent status for idempotent requests.

## 3. Data Models

### AnonymousSession

```json
{
  "anonymousUserId": "string",
  "deviceId": "string",
  "sessionId": "string",
  "startedAt": "ISO8601",
  "lastActiveAt": "ISO8601",
  "history": [ /* Analysis entries */ ]
}
```

### UserAccount

```json
{
  "userId": "string",
  "email": "string|null",
  "displayName": "string|null",
  "createdAt": "ISO8601"
}
```

### CloudHistoryRecord

```json
{
  "id": "string",
  "timestamp": "ISO8601",
  "transcript": "string",
  "result": { /* analysis result payload */ },
  "summaryText": "string",
  "userMetadata": { /* anonymous metadata optional */ }
}
```

### MigrationBatch

```json
{
  "batchId": "string",
  "mappingId": "string",
  "records": [CloudHistoryRecord],
  "meta": { "deviceId": "string", "uploadedAt": "ISO8601" }
}
```

### MergeConflict

```json
{
  "localId": "string",
  "cloudId": "string|null",
  "reason": "string",
  "localRecord": CloudHistoryRecord | null,
  "cloudRecord": CloudHistoryRecord | null
}
```

### MergeResult

```json
{
  "mergedCount": number,
  "skippedCount": number,
  "conflicts": [MergeConflict],
  "canonicalRecordCount": number
}
```

### SyncStatus

```json
{
  "lastSyncAt": "ISO8601|null",
  "pendingUploads": number,
  "pendingDownloads": number,
  "isSyncing": boolean
}
```

## 4. Merge Strategies

- Append strategy: append local records to cloud dataset with deduplication.
- Replace strategy: overwrite local with cloud or cloud with local.
- Timestamp-based reconciliation: prefer records with most recent `timestamp`.
- Duplicate detection: use `id` or deterministic hash of `transcript + result.analysis + timestamp`.

Recommendation: default to Append + deterministic deduplication + `prefer_newest` timestamp-based resolution. Provide `ask_user` for ambiguous duplicates.

## 5. Security Architecture

- Mapping must be server-side and authenticated in future. Clients must not assert identity.
- Use server-issued `mappingId` and `operationId` to coordinate migration operations.
- Use idempotency keys to protect against replay.
- Use HTTPS and require authenticated sessions (HTTP-only cookies or secure tokens) in production.
- Do not send credentials or tokens in client-side localStorage in production.

## 6. Privacy + Consent Flow

- Always present an explicit consent screen describing:
  - what data will be uploaded (history, preferences),
  - retention policy,
  - option to opt-out and delete data.
- Provide preview of items to be uploaded and a final confirmation step.
- Allow delete/export actions post-migration.

## 7. Scalability Planning

- Support chunked uploads and background merge jobs for large datasets.
- Use queues (e.g., SQS, Redis Streams) for merge processing.
- Return an `operationId` so client can poll status; operations should be idempotent and resumable.
- Rate-limit migration endpoints per user and per IP.

## 8. Future SaaS Expansion

- Support `organizationId`, role-based access, and team sharing of histories.
- Track per-user and per-organization AI usage and enforce quotas.
- Integrate billing: limit migration throughput for free plans, require upgrade for large historical imports.

---

This specification is a design contract to be used by backend and frontend engineers when implementing migration and merge features. It intentionally avoids prescribing database schemas or auth mechanisms — those are implementation details for the next phase.