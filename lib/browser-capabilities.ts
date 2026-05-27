export const isBrowser = typeof window !== "undefined";

export function hasSpeechRecognitionApi(): boolean {
  if (!isBrowser) {
    return false;
  }

  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function hasSpeechSynthesisApi(): boolean {
  if (!isBrowser) {
    return false;
  }

  return typeof window.speechSynthesis !== "undefined";
}

export function isIosSafari(): boolean {
  if (!isBrowser) {
    return false;
  }

  const ua = navigator.userAgent || "";
  return /iP(ad|hone|od)/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|Edg|OPiOS|Chrome/i.test(ua);
}

export function isAndroidChrome(): boolean {
  if (!isBrowser) {
    return false;
  }

  const ua = navigator.userAgent || "";
  return /Android/i.test(ua) && /Chrome\/\d+/i.test(ua) && !/OPR|Edg/i.test(ua);
}

export function isCapacitorWebView(): boolean {
  if (!isBrowser) {
    return false;
  }

  return typeof (window as any).Capacitor !== "undefined" ||
    typeof (window as any).webkit?.messageHandlers?.capacitor !== "undefined";
}
