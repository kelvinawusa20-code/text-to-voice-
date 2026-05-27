import { isBrowser } from "@/lib/browser-capabilities";

const safeConsole = typeof console !== "undefined" ? console : null;

const formatArgs = (args: unknown[]) => ["[AuraFrontend]", ...args];

export const logger = {
  info: (...args: unknown[]) => {
    if (!isBrowser || !safeConsole?.info) {
      return;
    }
    safeConsole.info(...formatArgs(args));
  },
  warn: (...args: unknown[]) => {
    if (!isBrowser || !safeConsole?.warn) {
      return;
    }
    safeConsole.warn(...formatArgs(args));
  },
  error: (...args: unknown[]) => {
    if (!isBrowser || !safeConsole?.error) {
      return;
    }
    safeConsole.error(...formatArgs(args));
  },
  debug: (...args: unknown[]) => {
    if (!isBrowser || !safeConsole?.debug) {
      return;
    }
    safeConsole.debug(...formatArgs(args));
  },
};
