"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { AppAction, AppState } from "@/lib/state/types";
import { appReducer, initialAppState } from "@/lib/state/reducer";
import { storage } from "@/lib/storage/storage";
import { createHistoryEntry, createSessionState } from "@/lib/session/session";
import { AnalysisResponse } from "@/types/analysis";

const STORAGE_KEY = "aura_app_state_v1";

interface AppStateContextValue {
  state: AppState;
  setTranscript: (transcript: string) => void;
  setAnalysisResult: (result: AnalysisResponse | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  setSpeechStatus: (status: AppState["speechStatus"]) => void;
  setTtsStatus: (status: AppState["ttsStatus"]) => void;
  setUiError: (message: string | null) => void;
  setSelectedVoiceName: (name: string) => void;
  setVoicePlaybackEnabled: (enabled: boolean) => void;
  setAutoPlayAnalysisResults: (enabled: boolean) => void;
  setMicrophoneAutoStart: (enabled: boolean) => void;
  setUiDensity: (density: AppState["preferences"]["uiDensity"]) => void;
  setLanguageCode: (languageCode: string) => void;
  addHistoryEntry: (transcript: string, result: AnalysisResponse, summaryText: string) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  clearState: () => void;
  resetSession: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function persistState(state: AppState) {
  try {
    const payload = {
      currentTranscript: state.currentTranscript,
      lastAnalysisResult: state.lastAnalysisResult,
      preferences: state.preferences,
      session: state.session,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore persistence failures.
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  useEffect(() => {
    const persisted = storage.getItem(STORAGE_KEY);
    if (!persisted) {
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as Partial<AppState>;
      dispatch({ type: "LOAD_PERSISTED_STATE", payload: parsed });
    } catch {
      dispatch({ type: "LOAD_PERSISTED_STATE", payload: { session: createSessionState() } });
    }
  }, []);

  useEffect(() => {
    persistState(state);
  }, [state.currentTranscript, state.lastAnalysisResult, state.preferences, state.session]);

  const value = useMemo(
    () => ({
      state,
      setTranscript: (transcript: string) => dispatch({ type: "SET_TRANSCRIPT", payload: transcript }),
      setAnalysisResult: (result: AnalysisResponse | null) => dispatch({ type: "SET_ANALYSIS_RESULT", payload: result }),
      setAnalysisLoading: (loading: boolean) => dispatch({ type: "SET_ANALYSIS_LOADING", payload: loading }),
      setSpeechStatus: (status: AppState["speechStatus"]) => dispatch({ type: "SET_SPEECH_STATUS", payload: status }),
      setTtsStatus: (status: AppState["ttsStatus"]) => dispatch({ type: "SET_TTS_STATUS", payload: status }),
          setUiError: (message: string | null) => dispatch({ type: "SET_UI_ERROR", payload: message }),
      setSelectedVoiceName: (name: string) => dispatch({ type: "SET_SELECTED_VOICE_NAME", payload: name }),
      setVoicePlaybackEnabled: (enabled: boolean) => dispatch({ type: "SET_VOICE_PLAYBACK_ENABLED", payload: enabled }),
      setAutoPlayAnalysisResults: (enabled: boolean) => dispatch({ type: "SET_AUTO_PLAY_ANALYSIS_RESULTS", payload: enabled }),
      setMicrophoneAutoStart: (enabled: boolean) => dispatch({ type: "SET_MICROPHONE_AUTO_START", payload: enabled }),
      setUiDensity: (density: AppState["preferences"]["uiDensity"]) =>
        dispatch({ type: "SET_UI_DENSITY", payload: density }),
      setLanguageCode: (languageCode: string) => dispatch({ type: "SET_LANGUAGE_CODE", payload: languageCode }),
      addHistoryEntry: (transcript: string, result: AnalysisResponse, summaryText: string) =>
        dispatch({ type: "ADD_HISTORY_ENTRY", payload: createHistoryEntry(transcript, result, summaryText) }),
      removeHistoryEntry: (id: string) => dispatch({ type: "REMOVE_HISTORY_ENTRY", payload: id }),
      clearHistory: () => dispatch({ type: "CLEAR_HISTORY" }),
      clearState: () => dispatch({ type: "CLEAR_STATE" }),
      resetSession: () => dispatch({ type: "RESET_SESSION" }),
    }),
    [state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}

export function useAnalysisHistory() {
  const { state, addHistoryEntry, removeHistoryEntry, clearHistory } = useAppState();
  return {
    history: state.session.history,
    addHistoryEntry,
    removeHistoryEntry,
    clearHistory,
  };
}

export function useSession() {
  const { state, resetSession } = useAppState();
  return {
    session: state.session,
    resetSession,
  };
}
