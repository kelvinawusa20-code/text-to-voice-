import { AppAction, AppState, UserPreferences } from "@/lib/state/types";
import { addHistoryEntry, hydrateSessionState } from "@/lib/session/session";
import { DEFAULT_PREFERENCES } from "@/lib/preferences/preferences";

// Avoid generating session IDs at module initialization to prevent SSR/client hydration mismatches.
export const initialAppState: AppState = {
  currentTranscript: "",
  lastAnalysisResult: null,
  analysisLoading: false,
  speechStatus: "idle",
  ttsStatus: "idle",
  uiError: null,
  preferences: DEFAULT_PREFERENCES,
  // Session will be initialized on the client during AppStateProvider mount.
  session: {
    sessionId: "",
    startedAt: "",
    lastActiveAt: "",
    history: [],
  },
};

function hydratePreferences(preferences: Partial<UserPreferences> | undefined): UserPreferences {
  return {
    selectedVoiceName: preferences?.selectedVoiceName ?? DEFAULT_PREFERENCES.selectedVoiceName,
    voicePlaybackEnabled: preferences?.voicePlaybackEnabled ?? DEFAULT_PREFERENCES.voicePlaybackEnabled,
    autoPlayAnalysisResults:
      preferences?.autoPlayAnalysisResults ?? DEFAULT_PREFERENCES.autoPlayAnalysisResults,
    microphoneAutoStart: preferences?.microphoneAutoStart ?? DEFAULT_PREFERENCES.microphoneAutoStart,
    uiDensity: preferences?.uiDensity ?? DEFAULT_PREFERENCES.uiDensity,
    languageCode: preferences?.languageCode ?? DEFAULT_PREFERENCES.languageCode,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_PERSISTED_STATE": {
      return {
        ...state,
        currentTranscript: action.payload.currentTranscript ?? state.currentTranscript,
        lastAnalysisResult: action.payload.lastAnalysisResult ?? state.lastAnalysisResult,
        preferences: hydratePreferences(action.payload.preferences),
        session: hydrateSessionState(action.payload.session ?? null),
      };
    }

    case "SET_TRANSCRIPT":
      return {
        ...state,
        currentTranscript: action.payload,
      };

    case "SET_ANALYSIS_RESULT":
      return {
        ...state,
        lastAnalysisResult: action.payload,
        session: state.session,
      };

    case "SET_ANALYSIS_LOADING":
      return {
        ...state,
        analysisLoading: action.payload,
      };

    case "SET_SPEECH_STATUS":
      return {
        ...state,
        speechStatus: action.payload,
      };

    case "SET_TTS_STATUS":
      return {
        ...state,
        ttsStatus: action.payload,
      };

    case "SET_UI_ERROR":
      return {
        ...state,
        uiError: action.payload,
      };

    case "SET_SELECTED_VOICE_NAME":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          selectedVoiceName: action.payload,
        },
      };

    case "SET_VOICE_PLAYBACK_ENABLED":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          voicePlaybackEnabled: action.payload,
        },
      };

    case "SET_AUTO_PLAY_ANALYSIS_RESULTS":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          autoPlayAnalysisResults: action.payload,
        },
      };

    case "SET_MICROPHONE_AUTO_START":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          microphoneAutoStart: action.payload,
        },
      };

    case "SET_UI_DENSITY":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          uiDensity: action.payload,
        },
      };

    case "SET_LANGUAGE_CODE":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          languageCode: action.payload,
        },
      };

    case "ADD_HISTORY_ENTRY":
      return {
        ...state,
        session: addHistoryEntry(state.session, action.payload),
      };

    case "REMOVE_HISTORY_ENTRY":
      return {
        ...state,
        session: {
          ...state.session,
          history: state.session.history.filter((entry) => entry.id !== action.payload),
          lastActiveAt: new Date().toISOString(),
        },
      };

    case "CLEAR_HISTORY":
      return {
        ...state,
        session: {
          ...state.session,
          history: [],
          lastActiveAt: new Date().toISOString(),
        },
      };

    case "CLEAR_STATE":
      return {
        ...state,
        currentTranscript: "",
        lastAnalysisResult: null,
        analysisLoading: false,
        speechStatus: "idle",
        ttsStatus: "idle",
        uiError: null,
      };

    case "RESET_SESSION":
      return {
        ...state,
        session: createSessionState(),
      };

    default:
      return state;
  }
}
