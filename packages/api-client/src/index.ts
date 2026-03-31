// ─── Singleton instances ──────────────────────────────────────────────────────
import { MockDataLakeClient, MockModelClient } from "./mockClient";

import type {
  Player,
  TeamStats,
  PredictionRequest,
  PredictionResult,
  NullClawMessage,
  NullClawResponse,
  
} from "@nfl/types";
// ─── Base fetcher ─────────────────────────────────────────────────────────────
async function apiFetch<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Data Lake client (port 8000) ─────────────────────────────────────────────
export class DataLakeClient {
  constructor(private base = "http://localhost:8000") {}

  query(sql: string): Promise<Record<string, unknown>[]> {
    return apiFetch(this.base, "/query", {
      method: "POST",
      body: JSON.stringify({ sql }),
    });
  }

  players(position?: string, year?: number): Promise<Player[]> {
    const params = new URLSearchParams();
    if (position) params.set("position", position);
    if (year) params.set("year", String(year));
    return apiFetch(this.base, `/players?${params}`);
  }

  player(name: string): Promise<Player> {
    return apiFetch(this.base, `/players/${encodeURIComponent(name)}`);
  }

  teamStats(team: string, yearStart?: number, yearEnd?: number): Promise<TeamStats[]> {
    const params = new URLSearchParams();
    if (yearStart) params.set("year_start", String(yearStart));
    if (yearEnd) params.set("year_end", String(yearEnd));
    return apiFetch(this.base, `/teams/${team}/stats?${params}`);
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/health");
  }
}

// ─── Model Platform client (port 8001) ───────────────────────────────────────
export class ModelClient {
  constructor(private base = "http://localhost:8001") {}

  predict(req: PredictionRequest): Promise<PredictionResult> {
    return apiFetch(this.base, `/predict/${req.model}`, {
      method: "POST",
      body: JSON.stringify(req.inputs),
    });
  }

  nullclaw(messages: NullClawMessage[]): Promise<NullClawResponse> {
    return apiFetch(this.base, "/nullclaw/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/health");
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────
// export const dataLake = new DataLakeClient();
// export const modelApi = new ModelClient();



const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

export const dataLake: DataLakeClient | MockDataLakeClient = isDemoMode
  ? new MockDataLakeClient()
  : new DataLakeClient(import.meta.env.VITE_DATA_LAKE_URL ?? "http://localhost:8000");

export const modelApi: ModelClient | MockModelClient = isDemoMode
  ? new MockModelClient()
  : new ModelClient(import.meta.env.VITE_MODEL_API_URL ?? "http://localhost:8001");