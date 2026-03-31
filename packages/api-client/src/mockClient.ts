/**
 * mockClient.ts
 * Drop-in replacement for DataLakeClient and ModelClient when
 * VITE_DEMO_MODE=true.  Import `dataLake` and `modelApi` from
 * @nfl/api-client — they already resolve to the right client.
 */


import type {
  Player,
  TeamStats,
  PredictionRequest,
  PredictionResult,
  NullClawMessage,
  NullClawResponse,
} from "@nfl/types";

import {
  MOCK_PLAYERS,
  MOCK_TEAM_STATS,
  MOCK_PREDICTIONS,
  MOCK_NULLCLAW_RESPONSES,
  MOCK_QUERY_RESULTS,
} from "../../types/src/mockData";

// Simulates network latency so the UI feels real
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Mock Data Lake ───────────────────────────────────────────────────────────
export class MockDataLakeClient {
  async query(_sql: string): Promise<Record<string, unknown>[]> {
    await delay();
    return MOCK_QUERY_RESULTS;
  }

  async players(position?: string, _year?: number): Promise<Player[]> {
    await delay();
    if (!position) return MOCK_PLAYERS;
    return MOCK_PLAYERS.filter((p) => p.position === position);
  }

  async player(name: string): Promise<Player> {
    await delay();
    const found = MOCK_PLAYERS.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!found) throw new Error(`Player not found: ${name}`);
    return found;
  }

  async teamStats(team: string, _yearStart?: number, _yearEnd?: number): Promise<TeamStats[]> {
    await delay();
    const results = MOCK_TEAM_STATS.filter((t) => t.team === team.toUpperCase());
    return results.length ? results : MOCK_TEAM_STATS.slice(0, 3);
  }

  async health(): Promise<{ status: string }> {
    return { status: "demo" };
  }
}

// ─── Mock Model Platform ──────────────────────────────────────────────────────
export class MockModelClient {
  async predict(req: PredictionRequest): Promise<PredictionResult> {
    await delay(800); // models are "slower"
    return (
      MOCK_PREDICTIONS[req.model] ?? {
        model: req.model,
        score: Math.round(70 + Math.random() * 20),
        confidence: parseFloat((0.65 + Math.random() * 0.25).toFixed(2)),
        shap_values: { feature_a: 0.4, feature_b: 0.3, feature_c: 0.2, feature_d: 0.1 },
      }
    );
  }

  async nullclaw(_messages: NullClawMessage[]): Promise<NullClawResponse> {
    await delay(1200); // chat feels like it's "thinking"
    const idx = Math.floor(Math.random() * MOCK_NULLCLAW_RESPONSES.length);
    return MOCK_NULLCLAW_RESPONSES[idx];
  }

  async health(): Promise<{ status: string }> {
    return { status: "demo" };
  }
}