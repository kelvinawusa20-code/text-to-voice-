import { AnalysisRequest, AnalysisResponse } from "@/types/analysis";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";

const ANALYZE_ENDPOINT = "/analyze";

function isValidResponse(body: unknown): body is AnalysisResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "score" in body &&
    "analysis" in body &&
    typeof (body as any).score === "string" &&
    typeof (body as any).analysis === "string"
  );
}

export async function analyzeText(request: AnalysisRequest, timeoutMs = 15000): Promise<AnalysisResponse> {
  const config = getConfig();
  if (!config.apiBaseUrl) {
    logger.error("Missing NEXT_PUBLIC_API_URL configuration.");
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.apiBaseUrl}${ANALYZE_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      const message = `Backend Error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`;
      logger.error(message);
      throw new Error(message);
    }

    const body = await response.json();
    if (!isValidResponse(body)) {
      logger.error("Malformed backend response for analyzeText.", body);
      throw new Error("Unexpected backend response format. Please try again.");
    }

    return body;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      logger.warn("Analyze request timed out.");
      throw new Error("Request timed out. Please try again.");
    }
    logger.error("Analyze request failed.", error);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
