import { AnalysisResponse } from "@/types/analysis";

interface AnalyzeResultsProps {
  result: AnalysisResponse | null;
  error: string | null;
}

export function AnalyzeResults({ result, error }: AnalyzeResultsProps) {
  const hasAdditionalMetrics = !!(
    result?.clarityScore ||
    result?.fluencyScore ||
    result?.pronunciationScore ||
    result?.auraScore ||
    result?.intelligibilityScore ||
    result?.dialectAnalysis ||
    result?.coachingFeedback
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-3xl border-2 border-red-500 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      {result ? (
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Score</p>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900">{result.score}</h2>
            </div>

            <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Analysis</p>
              <p className="mt-4 text-lg text-slate-700">{result.analysis}</p>
            </div>
          </div>

          {hasAdditionalMetrics && (
            <div className="grid gap-5 sm:grid-cols-2">
              {typeof result.clarityScore === "number" && (
                <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Clarity</p>
                  <p className="mt-4 text-3xl font-extrabold text-slate-900">{result.clarityScore.toFixed(1)}</p>
                </div>
              )}
              {typeof result.fluencyScore === "number" && (
                <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Fluency</p>
                  <p className="mt-4 text-3xl font-extrabold text-slate-900">{result.fluencyScore.toFixed(1)}</p>
                </div>
              )}
              {typeof result.pronunciationScore === "number" && (
                <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Pronunciation</p>
                  <p className="mt-4 text-3xl font-extrabold text-slate-900">{result.pronunciationScore.toFixed(1)}</p>
                </div>
              )}
              {typeof result.auraScore === "number" && (
                <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Aura</p>
                  <p className="mt-4 text-3xl font-extrabold text-slate-900">{result.auraScore.toFixed(1)}</p>
                </div>
              )}
            </div>
          )}

          {result.dialectAnalysis && (
            <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Dialect Analysis</p>
              <p className="mt-4 text-lg text-slate-700">{result.dialectAnalysis}</p>
            </div>
          )}

          {result.coachingFeedback && (
            <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">AI Coaching Feedback</p>
              <p className="mt-4 text-lg text-slate-700">{result.coachingFeedback}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Analysis results will appear here after you submit.</p>
        </div>
      )}
    </div>
  );
}
