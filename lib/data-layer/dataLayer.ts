import { storage } from "@/lib/storage/storage";
import { SessionState, AnalysisHistoryEntry } from "@/lib/session/session";
import { AnalysisResponse } from "@/types/analysis";
import { getOrCreateUserMetadata } from "@/lib/user/user-session";

const STORAGE_KEY = "aura_app_state_v1";

export interface DataLayerPayload {
  currentTranscript?: string;
  lastAnalysisResult?: AnalysisResponse | null;
  preferences?: any;
  session?: SessionState;
}

export interface DataLayer {
  saveSession(payload: DataLayerPayload): void;
  getSession(): DataLayerPayload | null;
  saveAnalysis(entry: AnalysisHistoryEntry): void;
  getHistory(): AnalysisHistoryEntry[];
  clearHistory(): void;
}

export class LocalDataLayer implements DataLayer {
  saveSession(payload: DataLayerPayload) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  getSession(): DataLayerPayload | null {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as DataLayerPayload;
    } catch {
      return null;
    }
  }

  saveAnalysis(entry: AnalysisHistoryEntry) {
    // attach lightweight user metadata to the entry if missing
    try {
      const meta = getOrCreateUserMetadata();
      const payload = this.getSession() ?? {};
      const session = payload.session ?? { ...({} as SessionState) };
      session.history = session.history ?? [];
      session.history = [entry, ...session.history].slice(0, 10);
      payload.session = { ...session } as SessionState;
      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  getHistory(): AnalysisHistoryEntry[] {
    try {
      const payload = this.getSession();
      if (!payload || !payload.session) return [];
      return payload.session.history ?? [];
    } catch {
      return [];
    }
  }

  clearHistory(): void {
    try {
      const payload = this.getSession() ?? {};
      if (payload.session) {
        payload.session.history = [];
        storage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // ignore
    }
  }
}
