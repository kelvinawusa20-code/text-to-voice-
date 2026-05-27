import { useEffect, useState } from "react";
import { getSpeechSynthesisSupport } from "@/lib/speech-support";
import { isBrowser } from "@/lib/browser-capabilities";
import { logger } from "@/lib/logger";

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  useEffect(() => {
    const available = getSpeechSynthesisSupport();
    setSupported(available);

    if (!available) {
      const message = "Speech synthesis is unavailable in this browser. Analysis still works without audio playback.";
      setSupportMessage(message);
      logger.warn(message);
      return;
    }

    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices() ?? []);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (isBrowser && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = (text: string, voiceName?: string) => {
    if (!supported || !isBrowser || !text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceName) {
      const selected = voices.find((item) => item.name === voiceName);
      if (selected) {
        utterance.voice = selected;
      }
    }

    try {
      window.speechSynthesis.speak(utterance);
      setSupportMessage(null);
      logger.info("Speech synthesis invoked.");
    } catch (error) {
      const message = "Speech playback failed. Analysis still works in text form.";
      setSupportMessage(message);
      logger.error(message, error);
    }
  };

  return {
    voices,
    supported,
    supportMessage,
    speak,
  };
}
