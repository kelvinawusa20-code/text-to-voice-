"use client";

import { useMemo, useState } from "react";
import { useAnalysisHistory, useSession } from "@/lib/state/app-state-context";

function formatTimestamp(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

function summarizeText(text: string, maxLength = 80) {
  if (!text) {
    return "No transcript available.";
  }
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}…`;
}

export function HistoryPanel() {
  const { history, removeHistoryEntry, clearHistory } = useAnalysisHistory();
  const { session, resetSession } = useSession();
  const [isOpen, setIsOpen] = useState(true);

  const visibleHistory = useMemo(() => history.slice(0, 10), [history]);
  const hasHistory = visibleHistory.length > 0;

  const handleClearHistory = () => {
    if (window.confirm("Clear all analysis history? This cannot be undone.")) {
      clearHistory();
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Reset the current session? This will start a new session but keep your preferences.")) {
      resetSession();
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm("Delete this history entry? This action cannot be undone.")) {
      removeHistoryEntry(entryId);
    }
  };

  return (
    <section className="mb-8 rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">History Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Session {session.sessionId ? session.sessionId.slice(0, 8) : "unknown"} · {formatTimestamp(session.startedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetSession}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
          >
            Reset session
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Clear history
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
          >
            {isOpen ? "Hide history" : "Show history"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 space-y-4">
          {!hasHistory ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No analysis history is available yet. Run an analysis to add the first entry.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleHistory.map((entry) => (
                <article key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{formatTimestamp(entry.timestamp)}</p>
                      <p className="mt-2 text-base font-semibold text-slate-900 truncate">{summarizeText(entry.transcript, 70)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                        {entry.result.score || "No score"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Summary</p>
                      <p className="mt-2 text-sm text-slate-800">
                        {entry.summaryText || summarizeText(entry.result.analysis, 100)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Detail</p>
                      <p className="mt-2 text-sm text-slate-800">
                        {entry.result.auraScore !== undefined ? `Aura ${entry.result.auraScore}` : "No aura score"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
