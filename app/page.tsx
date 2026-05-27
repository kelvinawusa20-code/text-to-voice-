"use client";

import { useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { TranscriptInput } from "@/components/voice/TranscriptInput";
import { AnalyzeResults } from "@/components/voice/AnalyzeResults";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceAnalysis } from "@/hooks/useVoiceAnalysis";
import { VOICE_OPTIONS } from "@/constants/voiceOptions";
import { AppStateProvider, useAppState } from "@/lib/state/app-state-context";

function HomePageContent() {
  const {
    state,
    setTranscript,
    setAnalysisResult,
    setAnalysisLoading,
    setSpeechStatus,
    setTtsStatus,
    setUiError,
    setSelectedVoiceName,
    addHistoryEntry,
  } = useAppState();

  const {
    currentTranscript,
    lastAnalysisResult,
    analysisLoading,
    speechStatus,
    ttsStatus,
    uiError,
    preferences,
  } = state;

  const {
    scriptText,
    setScriptText,
    isListening,
    isSupported: speechRecognitionSupported,
    supportMessage: recognitionSupportMessage,
    toggleListening,
    error: recognitionError,
  } = useSpeechRecognition(currentTranscript);

  const {
    voices: synthesisVoices,
    supported: speechSynthesisSupported,
    supportMessage: synthesisSupportMessage,
    speak,
  } = useSpeechSynthesis();

  const { result, loading, error: analysisError, analyze } = useVoiceAnalysis();

  useEffect(() => {
    setTranscript(scriptText);
  }, [scriptText, setTranscript]);

  useEffect(() => {
    if (!scriptText && currentTranscript) {
      setScriptText(currentTranscript);
    }
  }, [currentTranscript, scriptText, setScriptText]);

  useEffect(() => {
    setSpeechStatus(isListening ? "listening" : "idle");
    if (recognitionError) {
      setUiError(recognitionError);
    }
  }, [isListening, recognitionError, setSpeechStatus, setUiError]);

  useEffect(() => {
    setAnalysisLoading(loading);
  }, [loading, setAnalysisLoading]);

  useEffect(() => {
    if (result) {
      setAnalysisResult(result);
      addHistoryEntry(scriptText, result, result.analysis);
    }
  }, [result, scriptText, setAnalysisResult, addHistoryEntry]);

  useEffect(() => {
    if (analysisError) {
      setUiError(analysisError);
    }
  }, [analysisError, setUiError]);

  const combinedError = useMemo(
    () => recognitionError || analysisError || uiError,
    [recognitionError, analysisError, uiError],
  );

  const supportWarning = useMemo(() => {
    if (!recognitionSupportMessage && !synthesisSupportMessage) {
      return null;
    }

    return recognitionSupportMessage || synthesisSupportMessage;
  }, [recognitionSupportMessage, synthesisSupportMessage]);

  const selectedVoiceName = preferences.selectedVoiceName || VOICE_OPTIONS[0]?.value || "";
  const actionLabel = analysisLoading
    ? "Analyzing..."
    : preferences.autoPlayAnalysisResults
    ? "Analyze and Speak"
    : "Analyze";

  const handleAnalyze = async () => {
    const trimmedText = scriptText.trim();
    if (!trimmedText) {
      return;
    }

    setUiError(null);

    try {
      await analyze(trimmedText);
      if (speechSynthesisSupported && preferences.voicePlaybackEnabled && preferences.autoPlayAnalysisResults) {
        setTtsStatus("playing");
        speak(trimmedText, selectedVoiceName);
        setTtsStatus("idle");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed.";
      setUiError(message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 sm:px-10 sm:py-14 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Header />

        <VoiceRecorder
          selectedVoiceName={selectedVoiceName}
          voiceOptions={VOICE_OPTIONS}
          voices={synthesisVoices}
          isListening={isListening}
          isSpeechRecognitionSupported={speechRecognitionSupported}
          isMicrophoneEnabled={speechStatus !== "error"}
          supportMessage={recognitionSupportMessage}
          toggleListening={toggleListening}
          onVoiceChange={setSelectedVoiceName}
        />

        <SettingsPanel />

        <TranscriptInput scriptText={scriptText} onChange={setScriptText} />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analysisLoading || !scriptText.trim()}
            className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-8 py-5 text-lg font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {analysisLoading ? "Analyzing..." : "Analyze and Speak"}
          </button>

          {combinedError && (
            <p className="text-sm font-semibold text-red-700">{combinedError}</p>
          )}
        </div>

        {supportWarning && (
          <div className="mb-6 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {supportWarning}
          </div>
        )}

        <AnalyzeResults result={lastAnalysisResult} error={combinedError} />

        <HistoryPanel />
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <AppStateProvider>
      <HomePageContent />
    </AppStateProvider>
  );
}
