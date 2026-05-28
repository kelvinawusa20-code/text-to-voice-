# Auth Migration Plan: Anonymous → Authenticated SaaS

This document describes a production-ready migration and merge strategy for moving from the current anonymous local-only model to a future authenticated, cloud-backed SaaS architecture.

## 1. Current architecture

- Local-only persistence: application state (transcript, lastAnalysisResult, preferences, session history) is persisted locally via `LocalDataLayer` to the existing `aura_app_state_v1` payload.
- Anonymous metadata system: `getOrCreateUserMetadata()` generates and persists `anonymousUserId`, `deviceId`, `createdAt`, and `lastActiveAt` in local storage.
- Session structure: `SessionState` contains `sessionId`, `startedAt`, `lastActiveAt`, and `history` (array of analysis entries). Session IDs are now created client-side only to avoid SSR mismatches.
- Analysis history structure: `AnalysisHistoryEntry` contains `id`, `timestamp`, `transcript`, `result`, `summaryText`, and an optional `userMetadata` (the anonymous metadata attached to each entry).

## 2. Future SaaS architecture goals

- Authenticated users (user accounts) mapped to cloud `userId`.
- Cloud persistence of user data (history, preferences, sessions) with eventual multi-device sync.
- Controlled account recovery and data reconciliation for lost devices.
- Subscription and billing readiness (feature flags, tiered quotas, enterprise plans).

Key non-goals for this phase: no backend or auth implemented yet. This plan focuses on migration strategy only.

## 3. Anonymous → Authenticated migration flow

Overview:

1. User signs up / signs in (future flow). At sign-in, the client obtains a `userId` (server-side). The client will then optionally map the existing `anonymousUserId` to that authenticated `userId` via a server-side mapping endpoint (not implemented yet).
2. Migration occurs as an explicit opt-in: the user is shown a consent screen explaining upload and merge behavior.
3. Client uploads local data (history, preferences) to a cloud staging area associated with `userId` and `anonymousUserId` mapping.
4. Server returns a merge result indicating conflicts, duplicates, or a successful merge.
5. Client resolves conflicts via either an automatic merge policy or a user-facing resolution UI (depending on conflict severity).

Mapping rules:
- `anonymousUserId` → `userId` mapping will be stored server-side once user consents and logs in.
- The mapping is one-to-one, but server may keep a history of previous `anonymousUserId`s to support account recovery/merge from multiple devices.

When merge occurs:
- Merge should happen once, at first authenticated sign-in where the user opts in to migrate their data.
- Optionally provide a `preview` mode where the server returns a diff/summary of what will be merged.

## 4. Merge strategy options

Options for merging history and session data when both local and cloud copies exist:

1. Merge histories (recommended default): combine entries deduplicated by strong keys (id, timestamp, hash of transcript+analysis). Keep newest entries based on timestamp when duplicates conflict.
2. Replace local with cloud: drop local data and use cloud data (safe when cloud is authoritative, e.g., user restored from backup). This is destructive and should be opt-in.
3. Cloud overwrites local: cloud takes precedence; local data is replaced. Use where cloud is canonical and synced across devices.
4. Local overwrites cloud: local data becomes canonical. Use only in explicit recovery workflows.

Recommendation: adopt option (1) with deterministic deduplication and user-visible conflict resolution for ambiguous cases. This minimizes data loss and is safest for production.

## 5. Conflict resolution architecture

Conflict types and resolution:

- Duplicate analysis entries: detect by `id` or by stable hash of `{transcript, result.analysis, timestamp}`; keep single canonical entry.
- Multiple devices: merge histories across devices, annotate entries with `deviceId` in metadata to aid debugging.
- Stale local data: compare `lastActiveAt` and entry timestamps; prefer newer entries unless user explicitly chooses otherwise.
- Offline sessions: queue local writes and upload on network availability; each queued item includes client-generated `opaqueId` and `userMetadata`.

Conflict workflow:
1. Client uploads local dataset to a server staging area.
2. Server compares cloud dataset and returns a `MergeResult` containing actions: `keep`, `drop`, or `ask_user` for entries needing resolution.
3. If `ask_user` is present, present a compact UI showing differences (most recent first) and let the user accept per-entry or accept server merge policy.
4. Server performs final merge and returns canonical cloud dataset.

## 6. Privacy & consent design

- Make cloud sync opt-in. Do not upload any data without explicit user consent.
- Show clear, minimal privacy notice describing what is uploaded and how it is stored.
- Provide `Delete my data` and `Disconnect account` flows that remove cloud-stored data and break the `anonymousUserId` mapping.
- Support export of raw analysis history in a common format (JSON) on request.
- Log only metadata for analytics; exclude transcript content unless user has explicitly opted into cloud sync.

GDPR/CCPA compatibility:
- Provide data access and deletion endpoints (server-side). On client, provide UI and a local workflow to request deletion and then confirm completion.

## 7. Security considerations

- Never store credentials in localStorage. For future token storage, prefer secure HTTP-only cookies or platform-specific secure storage (Keychain, Keystore, secure storage on mobile).
- Tokens in local storage are susceptible to XSS — design server sessions and use refresh tokens with appropriate revocation.
- All sync must use TLS with certificate pinning when possible in native clients.
- Consider encrypting sensitive fields (transcripts) client-side before upload if privacy demands it; use per-user keys managed by the server or user-provided passphrase.

## 8. SaaS scalability planning

- Multi-tenant architecture: design user data partitioning by `userId` with tenant-aware tenancy for enterprise accounts.
- Organizations & teams: support an `organizationId` mapping and ACLs for shared data and roles.
- Usage quotas: implement per-user and per-organization quotas and rate limits; track AI usage metrics server-side.
- Tiered features: separate storage and retention policies by plan (e.g., free: 30 days retention; pro: unlimited retention).

## Appendix: Minimal sequence for initial SaaS rollout

1. Implement server account model and secure auth (OAuth or email+password with verification).
2. Add server-side mapping endpoint to map `anonymousUserId` → `userId` at consented sign-in.
3. Implement server merge API (staging + merge result). Client shows preview and consent UI.
4. Implement background sync and conflict resolution as described.

---
This plan is intentionally conservative and opt-in focused to preserve user privacy and prevent data loss during migration.
