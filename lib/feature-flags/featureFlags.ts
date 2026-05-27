import { isBrowser } from "@/lib/browser-capabilities";

export type FeatureFlagName =
  | "enableAdvancedScoringUI"
  | "enableVoiceInsightsPanel"
  | "enableBetaAIResponses"
  | "enableHistoryTrackingUI";

export interface FeatureFlags {
  enableAdvancedScoringUI: boolean;
  enableVoiceInsightsPanel: boolean;
  enableBetaAIResponses: boolean;
  enableHistoryTrackingUI: boolean;
}

const defaultFeatureFlags: FeatureFlags = {
  enableAdvancedScoringUI: false,
  enableVoiceInsightsPanel: false,
  enableBetaAIResponses: false,
  enableHistoryTrackingUI: true,
};

const FEATURE_FLAG_OVERRIDES_KEY = "aura_feature_flags_v1";

function parseFlagOverrides(): Partial<FeatureFlags> {
  if (!isBrowser) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(FEATURE_FLAG_OVERRIDES_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>;
    return parsed;
  } catch {
    return {};
  }
}

function parseEnvFlags(): Partial<FeatureFlags> {
  try {
    const raw = process.env.NEXT_PUBLIC_FEATURE_FLAGS;
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Partial<Record<string, boolean>>;
    return Object.keys(parsed).reduce((acc, key) => {
      if (key in defaultFeatureFlags) {
        (acc as any)[key] = Boolean(parsed[key]);
      }
      return acc;
    }, {} as Partial<FeatureFlags>);
  } catch {
    return {};
  }
}

export function getFeatureFlags(): FeatureFlags {
  return {
    ...defaultFeatureFlags,
    ...parseEnvFlags(),
    ...parseFlagOverrides(),
  };
}

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return getFeatureFlags()[flag];
}

export function setFeatureFlagOverride(flag: FeatureFlagName, value: boolean) {
  if (!isBrowser) {
    return;
  }

  try {
    const existing = parseFlagOverrides();
    const next = { ...existing, [flag]: value };
    window.localStorage.setItem(FEATURE_FLAG_OVERRIDES_KEY, JSON.stringify(next));
  } catch {
    // ignore failures
  }
}

export function clearFeatureFlagOverrides() {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.removeItem(FEATURE_FLAG_OVERRIDES_KEY);
  } catch {
    // ignore failures
  }
}
