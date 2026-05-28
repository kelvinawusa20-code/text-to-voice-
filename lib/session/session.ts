import { AnalysisResponse } from "@/types/analysis";
import { getOrCreateUserMetadata } from "@/lib/user/user-session";
import { UserMetadata } from "@/lib/user/user-metadata";

export const MAX_HISTORY_ENTRIES = 10;

export type AnalysisHistoryEntry = {
  id: string;
  timestamp: string;
  transcript: string;
  result: AnalysisResponse;
  summaryText: string;
  userMetadata?: UserMetadata; // lightweight anonymous metadata for SaaS readiness
};

export type SessionState = {
  sessionId: string;
  startedAt: string;
  lastActiveAt: string;
  history: AnalysisHistoryEntry[];
  // optional anonymous identifiers for future SaaS mapping
  anonymousUserId?: string;
  deviceId?: string;
};

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function createSessionState(): SessionState {
  const now = new Date().toISOString();
  return {
    sessionId: createSessionId(),
    startedAt: now,
    lastActiveAt: now,
    history: [],
  };
}

export function createHistoryEntry(
  transcript: string,
  result: AnalysisResponse,
  summaryText: string,
): AnalysisHistoryEntry {
  const meta = getOrCreateUserMetadata();
  return {
    id: createSessionId(),
    timestamp: new Date().toISOString(),
    transcript,
    result,
    summaryText,
    userMetadata: meta,
  };
}

export function addHistoryEntry(
  session: SessionState,
  entry: AnalysisHistoryEntry,
): SessionState {
  const history = [entry, ...session.history].slice(0, MAX_HISTORY_ENTRIES);
  return {
    ...session,
    lastActiveAt: new Date().toISOString(),
    history,
  };
}

export function hydrateSessionState(state: Partial<SessionState> | null): SessionState {
  if (!state || !state.sessionId) {
    return createSessionState();
  }

  return {
    sessionId: state.sessionId,
    startedAt: state.startedAt ?? new Date().toISOString(),
    lastActiveAt: state.lastActiveAt ?? new Date().toISOString(),
    history: Array.isArray(state.history) ? state.history.slice(0, MAX_HISTORY_ENTRIES) : [],
  };
}
