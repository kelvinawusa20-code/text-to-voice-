import { useCallback, useState } from "react";
import { AnalysisResponse } from "@/types/analysis";
import { analyzeText } from "@/services/api";
import { logger } from "@/lib/logger";

export function useVoiceAnalysis() {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (text: string) => {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await analyzeText({ text });
      setResult(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      logger.error("Voice analysis failed.", err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    result,
    loading,
    error,
    analyze,
    setError,
  };
}
