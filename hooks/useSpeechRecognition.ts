import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMicrophonePermissionState,
  getRecognitionSupportMessage,
  getSpeechRecognitionSupport,
  mapRecognitionError,
  MicrophonePermissionState,
} from "@/lib/speech-support";
import { isBrowser } from "@/lib/browser-capabilities";
import { logger } from "@/lib/logger";

const getSpeechRecognitionConstructor = () => {
  if (!isBrowser) {
    return null;
  }

  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export function useSpeechRecognition(initialText = "") {
  const [scriptText, setScriptText] = useState(initialText);
  const [isListening, setIsListening] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const supported = getSpeechRecognitionSupport();
    setIsSupported(supported);

    if (!supported) {
      const message = "Speech recognition is unavailable in this browser. You can still type and analyze text.";
      setSupportMessage(message);
      logger.warn(message);
      return;
    }

    let active = true;

    const initializeRecognition = async () => {
      const state = await getMicrophonePermissionState();
      if (!active) {
        return;
      }

      setPermissionState(state);
      setSupportMessage(getRecognitionSupportMessage(supported, state));

      const SpeechRecognition = getSpeechRecognitionConstructor();
      if (!SpeechRecognition) {
        const message = "Speech recognition support could not be initialized. Type input still works.";
        setSupportMessage(message);
        logger.warn(message);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        logger.info("Speech recognition started.");
        setError(null);
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (typeof transcript === "string") {
          setScriptText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        const rawMessage = event?.error || event?.message || "";
        const friendly = mapRecognitionError(rawMessage);
        setError(friendly);
        setSupportMessage(friendly);
        setIsListening(false);
        logger.error("Speech recognition error.", rawMessage, event);

        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          setPermissionState("denied");
        }
      };

      recognition.onend = () => {
        logger.info("Speech recognition ended.");
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    };

    initializeRecognition();

    return () => {
      active = false;
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;

        try {
          recognitionRef.current.stop();
        } catch {
          logger.warn("Failed to stop speech recognition during cleanup.");
        }

        recognitionRef.current = null;
      }
    };
  }, []);

  const isMicrophoneEnabled = useMemo(() => {
    return isSupported && permissionState !== "denied";
  }, [isSupported, permissionState]);

  const startListening = async () => {
    if (!isSupported) {
      const message = "Speech recognition is unsupported. Use typing for analysis.";
      setError(message);
      logger.warn(message);
      return;
    }

    if (permissionState === "denied") {
      const message = "Microphone permission is denied. Enable access in browser settings to use voice recording.";
      setError(message);
      logger.warn(message);
      return;
    }

    if (!recognitionRef.current) {
      const message = "Speech recognition is not ready. Refresh the page and try again.";
      setError(message);
      logger.warn(message);
      return;
    }

    try {
      recognitionRef.current.start();
      setError(null);
    } catch (startError: unknown) {
      const message = startError instanceof Error ? startError.message : String(startError);
      const friendly = mapRecognitionError(message);
      setError(friendly);
      logger.error("Failed to start speech recognition.", startError);
      if (message.includes("NotAllowed") || message.includes("Permission")) {
        setPermissionState("denied");
      }
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    scriptText,
    setScriptText,
    isListening,
    isSupported,
    permissionState,
    isMicrophoneEnabled,
    supportMessage,
    toggleListening,
    error,
    setError,
  };
}
