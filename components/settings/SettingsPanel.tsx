import { usePreferences } from "@/lib/preferences/usePreferences";
import { useFeatureFlags } from "@/lib/feature-flags/useFeatureFlags";

export function SettingsPanel() {
  const {
    preferences,
    setVoicePlaybackEnabled,
    setAutoPlayAnalysisResults,
    setMicrophoneAutoStart,
    setUiDensity,
    setLanguageCode,
  } = usePreferences();

  const { flags, isEnabled } = useFeatureFlags();

  return (
    <section className="mb-8 rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Density: {preferences.uiDensity}
        </span>
      </div>

      <div className="grid gap-4">
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900">
          <span>Voice playback</span>
          <input
            type="checkbox"
            checked={preferences.voicePlaybackEnabled}
            onChange={(event) => setVoicePlaybackEnabled(event.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900">
          <span>Auto-play analysis results</span>
          <input
            type="checkbox"
            checked={preferences.autoPlayAnalysisResults}
            onChange={(event) => setAutoPlayAnalysisResults(event.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900">
          <span>Microphone auto-start</span>
          <input
            type="checkbox"
            checked={preferences.microphoneAutoStart}
            onChange={(event) => setMicrophoneAutoStart(event.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900">
          <span>Compact UI</span>
          <input
            type="checkbox"
            checked={preferences.uiDensity === "compact"}
            onChange={(event) => setUiDensity(event.target.checked ? "compact" : "default")}
          />
        </label>

        <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900">
          <span>Language</span>
          <select
            value={preferences.languageCode}
            onChange={(event) => setLanguageCode(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Feature flags</p>
        <p>Advanced scoring UI: {isEnabled("enableAdvancedScoringUI") ? "ON" : "OFF"}</p>
        <p>Voice insights panel: {isEnabled("enableVoiceInsightsPanel") ? "ON" : "OFF"}</p>
        <p>Beta AI responses: {isEnabled("enableBetaAIResponses") ? "ON" : "OFF"}</p>
        <p>History tracking UI: {isEnabled("enableHistoryTrackingUI") ? "ON" : "OFF"}</p>
      </div>
    </section>
  );
}
