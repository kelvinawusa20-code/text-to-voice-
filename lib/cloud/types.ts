import { SessionState } from "@/lib/session/session";

export type UserAccount = {
  userId: string;
  email?: string;
  displayName?: string;
  createdAt: string;
  // future fields: plan, roles, organizationId
};

export type CloudSession = SessionState & {
  cloudId?: string;
  userId?: string;
  // server-side canonical timestamps
  syncedAt?: string;
};

export type SyncState = {
  lastSyncAt?: string;
  pendingUploads?: number;
  pendingDownloads?: number;
  isSyncing?: boolean;
};

export type MergeResult = {
  mergedCount: number;
  skippedCount: number;
  conflicts: Array<{ localId: string; cloudId?: string; reason: string }>;
};
