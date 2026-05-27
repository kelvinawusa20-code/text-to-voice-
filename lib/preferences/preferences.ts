export type UiDensity = "default" | "compact";

export interface UserPreferences {
  selectedVoiceName: string;
  voicePlaybackEnabled: boolean;
  autoPlayAnalysisResults: boolean;
  microphoneAutoStart: boolean;
  uiDensity: UiDensity;
  languageCode: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  selectedVoiceName: "",
  voicePlaybackEnabled: true,
  autoPlayAnalysisResults: true,
  microphoneAutoStart: false,
  uiDensity: "default",
  languageCode: "en-US",
};

export function normalizePreferences(partial: Partial<UserPreferences> | undefined): UserPreferences {
  return {
    selectedVoiceName: partial?.selectedVoiceName ?? DEFAULT_PREFERENCES.selectedVoiceName,
    voicePlaybackEnabled: partial?.voicePlaybackEnabled ?? DEFAULT_PREFERENCES.voicePlaybackEnabled,
    autoPlayAnalysisResults: partial?.autoPlayAnalysisResults ?? DEFAULT_PREFERENCES.autoPlayAnalysisResults,
    microphoneAutoStart: partial?.microphoneAutoStart ?? DEFAULT_PREFERENCES.microphoneAutoStart,
    uiDensity: partial?.uiDensity ?? DEFAULT_PREFERENCES.uiDensity,
    languageCode: partial?.languageCode ?? DEFAULT_PREFERENCES.languageCode,
  };
}
