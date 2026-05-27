import { hasSpeechRecognitionApi, hasSpeechSynthesisApi, isBrowser } from "@/lib/browser-capabilities";

export type MicrophonePermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "dismissed"
  | "unsupported"
  | "unknown";

export function getSpeechRecognitionSupport(): boolean {
  return hasSpeechRecognitionApi();
}

export function getSpeechSynthesisSupport(): boolean {
  return hasSpeechSynthesisApi();
}

export async function getMicrophonePermissionState(): Promise<MicrophonePermissionState> {
  if (!isBrowser || !navigator.permissions) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    if (status.state === "granted") {
      return "granted";
    }
    if (status.state === "denied") {
      return "denied";
    }
    if (status.state === "prompt") {
      return "prompt";
    }
    return "unknown";
  } catch {
    return "unsupported";
  }
}

export function mapRecognitionError(message: string | null | undefined): string {
  const normalized = (message || "").toLowerCase();
  if (normalized.includes("not-allowed") || normalized.includes("permission")) {
    return "Microphone access was denied or blocked. Please allow microphone permission in browser settings.";
  }

  if (normalized.includes("service-not-allowed")) {
    return "Microphone access is blocked by browser settings. Please check your browser permissions.";
  }

  if (normalized.includes("not-found") || normalized.includes("audio-capture")) {
    return "No microphone was detected. Connect or enable a microphone, then try again.";
  }

  if (normalized.includes("no-speech")) {
    return "No speech was detected. Speak clearly and ensure your microphone is working.";
  }

  if (normalized.includes("aborted")) {
    return "Speech recognition was interrupted. Try again.";
  }

  if (normalized.includes("network")) {
    return "Speech recognition service is unavailable. Please try again later.";
  }

  if (normalized === "" || normalized.includes("error")) {
    return "Speech recognition failed. You can still type input for analysis.";
  }

  return message ?? "Speech recognition stopped unexpectedly. Please try again.";
}

export function getRecognitionSupportMessage(
  supported: boolean,
  permissionState: MicrophonePermissionState,
): string | null {
  if (!supported) {
    return "Speech recognition is unavailable in this browser. You can still type and analyze text.";
  }

  if (permissionState === "denied") {
    return "Microphone permission is denied. Voice recording is disabled, but text analysis still works.";
  }

  if (permissionState === "prompt") {
    return "Microphone permission is required to record voice. Grant access when prompted.";
  }

  if (permissionState === "unsupported") {
    return "Unable to detect microphone permission state. You can still type and analyze text.";
  }

  return null;
}
