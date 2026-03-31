// ─── Data Lake types ──────────────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  position: string;
  college: string;
  draft_year: number;
  draft_round: number;
  draft_pick: number;
  draft_team: string;
  ht_inches: number;
  wt: number;
  forty: number | null;
  bench: number | null;
  vertical: number | null;
  broad_jump: number | null;
  cone: number | null;
  shuttle: number | null;
}

export interface TeamStats {
  team: string;
  year: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  offense_yards: number;
  defense_yards: number;
}

// ─── Model Platform types ─────────────────────────────────────────────────────
export type ModelName =
  | "player_projection"
  | "draft_optimizer"
  | "team_diagnosis"
  | "career_simulator"
  | "roster_fit"
  | "positional_flexibility"
  | "health_analyzer";

export interface PredictionRequest {
  model: ModelName;
  inputs: Record<string, unknown>;
}

export interface PredictionResult {
  model: ModelName;
  score: number;
  confidence: number;
  shap_values?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface NullClawMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NullClawResponse {
  reply: string;
  tool_calls?: Array<{
    model: ModelName;
    result: PredictionResult;
  }>;
}

// ─── API response wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  status: "ok" | "error";
  message?: string;
}

export * from "./mockData"
