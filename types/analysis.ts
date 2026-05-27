export interface AnalysisResult {
  score: string;
  analysis: string;
  clarityScore?: number;
  fluencyScore?: number;
  pronunciationScore?: number;
  auraScore?: number;
  dialectAnalysis?: string;
  intelligibilityScore?: number;
  coachingFeedback?: string;
}

export interface AnalysisRequest {
  text: string;
}

export interface AnalysisResponse extends AnalysisResult {}
