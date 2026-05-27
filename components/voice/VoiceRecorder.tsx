import { VoiceOption } from "@/types/speech";

interface VoiceRecorderProps {
  selectedVoiceName: string;
  voiceOptions: VoiceOption[];
  voices: SpeechSynthesisVoice[];
  isListening: boolean;
  isSpeechRecognitionSupported: boolean;
  isMicrophoneEnabled: boolean;
  supportMessage?: string | null;
  toggleListening: () => void;
  onVoiceChange: (value: string) => void;
}

export function VoiceRecorder({
  selectedVoiceName,
  voiceOptions,
  voices,
  isListening,
  isSpeechRecognitionSupported,
  isMicrophoneEnabled,
  supportMessage,
  toggleListening,
  onVoiceChange,
}: VoiceRecorderProps) {
  return (
    <div className="mb-8 p-5 rounded-3xl border-4 border-slate-900 bg-white shadow-sm">
      <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 mb-3">
        SELECT YOUR TRIBE:
      </label>
      <select
        value={selectedVoiceName}
        onChange={(event) => onVoiceChange(event.target.value)}
        className="w-full rounded-2xl border-2 border-slate-900 px-4 py-3 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <optgroup label="Niger Delta & Edo">
          {voiceOptions
            .filter((option) => option.group === "Niger Delta & Edo")
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </optgroup>
        <optgroup label="Major Nigerian Languages">
          {voiceOptions
            .filter((option) => option.group === "Major Nigerian Languages")
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </optgroup>
        {voices.length > 0 && (
          <optgroup label="System Voices">
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <div className="mt-6 flex flex-col items-end gap-3 sm:flex-row sm:justify-between">
        {supportMessage && (
          <p className="text-sm text-amber-800 sm:mr-4">{supportMessage}</p>
        )}

        <button
          type="button"
          onClick={toggleListening}
          disabled={!isSpeechRecognitionSupported || !isMicrophoneEnabled}
          className={`inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-900 text-3xl font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 ${
            isListening ? "bg-red-600 text-white" : "bg-slate-900 text-white"
          } ${!isSpeechRecognitionSupported || !isMicrophoneEnabled ? "cursor-not-allowed opacity-50" : "hover:bg-slate-800"}`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? "🛑" : "🎤"}
        </button>
      </div>
    </div>
  );
}
