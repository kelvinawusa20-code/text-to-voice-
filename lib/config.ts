export type FeatureFlags = {
  enableVoiceDiagnostics?: boolean;
  enableVerboseLogging?: boolean;
};

export type AiProvider = "openai" | "azure" | "local";

export interface FrontendConfig {
  apiBaseUrl: string;
  environment: string;
  featureFlags: FeatureFlags;
  aiProvider: AiProvider;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const environment = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development";
const featureFlags: FeatureFlags = {
  enableVoiceDiagnostics: false,
  enableVerboseLogging: false,
};
const aiProvider = (process.env.NEXT_PUBLIC_AI_PROVIDER as AiProvider) ?? "openai";

export const config: FrontendConfig = {
  apiBaseUrl,
  environment,
  featureFlags,
  aiProvider,
};

export function getConfig(): FrontendConfig {
  return config;
}

export function isProduction(): boolean {
  return config.environment === "production";
}
