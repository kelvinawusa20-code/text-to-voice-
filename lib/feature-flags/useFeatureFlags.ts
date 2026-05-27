import { useMemo } from "react";
import { getFeatureFlags, FeatureFlags, FeatureFlagName } from "@/lib/feature-flags/featureFlags";

export function useFeatureFlags() {
  const flags: FeatureFlags = useMemo(() => getFeatureFlags(), []);

  return {
    flags,
    isEnabled: (flag: FeatureFlagName) => flags[flag],
  };
}
