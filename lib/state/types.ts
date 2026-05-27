import { AnalysisResponse } from "@/types/analysis";
import { SessionState } from "@/lib/session/session";

export type SpeechStatus = "idle" | "listening" | "error";
export type TtsStatus = "idle" | "playing" | "error";

export interface UserPreferences {
  selectedVoiceName: string;
  voicePlaybackEnabled: boolean;
  autoPlayAnalysisResults: boolean;
  microphoneAutoStart: boolean;
  uiDensity: "default" | "compact";
  languageCode: string;
}

export interface AppState {
  currentTranscript: string;
  lastAnalysisResult: AnalysisResponse | null;
  analysisLoading: boolean;
  speechStatus: SpeechStatus;
  ttsStatus: TtsStatus;
  uiError: string | null;
  preferences: UserPreferences;
  session: SessionState;
}

export type AppAction =
  | { type: "LOAD_PERSISTED_STATE"; payload: Partial<AppState> }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "SET_ANALYSIS_RESULT"; payload: AnalysisResponse | null }
  | { type: "SET_ANALYSIS_LOADING"; payload: boolean }
  | { type: "SET_SPEECH_STATUS"; payload: SpeechStatus }
  | { type: "SET_TTS_STATUS"; payload: TtsStatus }
  | { type: "SET_UI_ERROR"; payload: string | null }
  | { type: "SET_SELECTED_VOICE_NAME"; payload: string }
  | { type: "SET_VOICE_PLAYBACK_ENABLED"; payload: boolean }
  | { type: "SET_AUTO_PLAY_ANALYSIS_RESULTS"; payload: boolean }
  | { type: "SET_MICROPHONE_AUTO_START"; payload: boolean }
  | { type: "SET_UI_DENSITY"; payload: "default" | "compact" }
  | { type: "SET_LANGUAGE_CODE"; payload: string }
  | { type: "ADD_HISTORY_ENTRY"; payload: import("@/lib/session/session").AnalysisHistoryEntry }
  | { type: "REMOVE_HISTORY_ENTRY"; payload: string }
  | { type: "CLEAR_HISTORY" }
  | { type: "CLEAR_STATE" }
  | { type: "RESET_SESSION" };
