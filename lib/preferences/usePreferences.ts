import { useAppState } from "@/lib/state/app-state-context";

export function usePreferences() {
  const {
    state,
    setSelectedVoiceName,
    setVoicePlaybackEnabled,
    setAutoPlayAnalysisResults,
    setMicrophoneAutoStart,
    setUiDensity,
    setLanguageCode,
  } = useAppState();

  return {
    preferences: state.preferences,
    setSelectedVoiceName,
    setVoicePlaybackEnabled,
    setAutoPlayAnalysisResults,
    setMicrophoneAutoStart,
    setUiDensity,
    setLanguageCode,
  };
}
