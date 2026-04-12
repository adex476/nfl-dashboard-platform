// ─── Data Lake types ──────────────────────────────────────────────────────────
export interface Player {
  player_name: string;
  position: string;
  school: string | null;
  height_in: number | null;
  weight_lbs: number | null;
  forty_yard: number | null;
  vertical_in: number | null;
  bench_reps: number | null;
  broad_jump_in: number | null;
  three_cone: number | null;
  shuttle: number | null;
  draft_team: string | null;
  draft_round: string | null;
  draft_pick: number | null;
  draft_year: number | null;
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

export interface NanoClawMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NanoClawResponse {
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

