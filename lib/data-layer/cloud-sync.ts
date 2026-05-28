// Placeholder cloud sync service for future SaaS integration.
// NOTE: This file intentionally does not implement any network or auth logic.
// It only defines the interface and a no-op stub for future implementation.

import { UserMetadata } from "@/lib/user/user-metadata";
import { SessionState } from "@/lib/session/session";

export interface CloudSyncService {
  saveUserData(userId: string, data: any): Promise<void>;
  loadUserData(userId: string): Promise<any>;
  syncSession(session: SessionState, userMeta: UserMetadata | null): Promise<void>;
}

export class CloudSyncStub implements CloudSyncService {
  async saveUserData(_: string, __: any) {
    // stub - not implemented
    return;
  }

  async loadUserData(_: string) {
    // stub - not implemented
    return null;
  }

  async syncSession(_: SessionState, __: UserMetadata | null) {
    // stub - not implemented
    return;
  }
}
