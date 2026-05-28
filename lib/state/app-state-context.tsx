"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { AppAction, AppState } from "@/lib/state/types";
import { appReducer, initialAppState } from "@/lib/state/reducer";
import { LocalDataLayer } from "@/lib/data-layer/dataLayer";
import { createHistoryEntry, createSessionState } from "@/lib/session/session";
import { AnalysisResponse } from "@/types/analysis";

const dataLayer = new LocalDataLayer();

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
    dataLayer.saveSession(payload);
  } catch {
    // Ignore persistence failures.
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  useEffect(() => {
    (async () => {
      const persisted = dataLayer.getSession();
      if (!persisted) {
        // No persisted payload: create a client-only session state to avoid SSR random IDs.
        try {
          const { createSessionState } = await import("@/lib/session/session");
          dispatch({ type: "LOAD_PERSISTED_STATE", payload: { session: createSessionState() } });
        } catch {
          // fallback: leave empty session
        }
        return;
      }

      try {
        dispatch({ type: "LOAD_PERSISTED_STATE", payload: persisted as Partial<AppState> });
      } catch {
        // If parsing fails, initialize a fresh client session
        try {
          const { createSessionState } = await import("@/lib/session/session");
          dispatch({ type: "LOAD_PERSISTED_STATE", payload: { session: createSessionState() } });
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  useEffect(() => {
    persistState(state);
  }, [state.currentTranscript, state.lastAnalysisResult, state.preferences, state.session]);

  const setTranscript = React.useCallback((transcript: string) => dispatch({ type: "SET_TRANSCRIPT", payload: transcript }), [dispatch]);
  const setAnalysisResult = React.useCallback((result: AnalysisResponse | null) => dispatch({ type: "SET_ANALYSIS_RESULT", payload: result }), [dispatch]);
  const setAnalysisLoading = React.useCallback((loading: boolean) => dispatch({ type: "SET_ANALYSIS_LOADING", payload: loading }), [dispatch]);
  const setSpeechStatus = React.useCallback((status: AppState["speechStatus"]) => dispatch({ type: "SET_SPEECH_STATUS", payload: status }), [dispatch]);
  const setTtsStatus = React.useCallback((status: AppState["ttsStatus"]) => dispatch({ type: "SET_TTS_STATUS", payload: status }), [dispatch]);
  const setUiError = React.useCallback((message: string | null) => dispatch({ type: "SET_UI_ERROR", payload: message }), [dispatch]);
  const setSelectedVoiceName = React.useCallback((name: string) => dispatch({ type: "SET_SELECTED_VOICE_NAME", payload: name }), [dispatch]);
  const setVoicePlaybackEnabled = React.useCallback((enabled: boolean) => dispatch({ type: "SET_VOICE_PLAYBACK_ENABLED", payload: enabled }), [dispatch]);
  const setAutoPlayAnalysisResults = React.useCallback((enabled: boolean) => dispatch({ type: "SET_AUTO_PLAY_ANALYSIS_RESULTS", payload: enabled }), [dispatch]);
  const setMicrophoneAutoStart = React.useCallback((enabled: boolean) => dispatch({ type: "SET_MICROPHONE_AUTO_START", payload: enabled }), [dispatch]);
  const setUiDensity = React.useCallback((density: AppState["preferences"]["uiDensity"]) => dispatch({ type: "SET_UI_DENSITY", payload: density }), [dispatch]);
  const setLanguageCode = React.useCallback((languageCode: string) => dispatch({ type: "SET_LANGUAGE_CODE", payload: languageCode }), [dispatch]);
  const addHistoryEntry = React.useCallback((transcript: string, result: AnalysisResponse, summaryText: string) => dispatch({ type: "ADD_HISTORY_ENTRY", payload: createHistoryEntry(transcript, result, summaryText) }), [dispatch]);
  const removeHistoryEntry = React.useCallback((id: string) => dispatch({ type: "REMOVE_HISTORY_ENTRY", payload: id }), [dispatch]);
  const clearHistory = React.useCallback(() => dispatch({ type: "CLEAR_HISTORY" }), [dispatch]);
  const clearState = React.useCallback(() => dispatch({ type: "CLEAR_STATE" }), [dispatch]);
  const resetSession = React.useCallback(() => dispatch({ type: "RESET_SESSION" }), [dispatch]);

  const value: AppStateContextValue = React.useMemo(
    () => ({
      state,
      setTranscript,
      setAnalysisResult,
      setAnalysisLoading,
      setSpeechStatus,
      setTtsStatus,
      setUiError,
      setSelectedVoiceName,
      setVoicePlaybackEnabled,
      setAutoPlayAnalysisResults,
      setMicrophoneAutoStart,
      setUiDensity,
      setLanguageCode,
      addHistoryEntry,
      removeHistoryEntry,
      clearHistory,
      clearState,
      resetSession,
    }),
    [
      state,
      setTranscript,
      setAnalysisResult,
      setAnalysisLoading,
      setSpeechStatus,
      setTtsStatus,
      setUiError,
      setSelectedVoiceName,
      setVoicePlaybackEnabled,
      setAutoPlayAnalysisResults,
      setMicrophoneAutoStart,
      setUiDensity,
      setLanguageCode,
      addHistoryEntry,
      removeHistoryEntry,
      clearHistory,
      clearState,
      resetSession,
    ],
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
