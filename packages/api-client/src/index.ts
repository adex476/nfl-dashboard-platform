import type {
  Player,
  TeamStats,
  PredictionRequest,
  PredictionResult,
  NullClawMessage,
  NullClawResponse,
} from "@nfl/types";

async function apiFetch<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Data Lake client ─────────────────────────────────────────────────────────
export class DataLakeClient {
  constructor(private base = "https://claw-hub.tailca9d37.ts.net") {}

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

// ─── Model Platform client ────────────────────────────────────────────────────
export class ModelClient {
  constructor(private base = "https://claw-hub.tailca9d37.ts.net/models") {}

  predict(req: PredictionRequest): Promise<PredictionResult> {
    return apiFetch(this.base, `/${req.model}/predict`, {
      method: "POST",
      body: JSON.stringify(req.inputs),
    });
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/health");
  }
}

// ─── NanoClaw client ──────────────────────────────────────────────────────────
export class NanoClawClient {
  constructor(private base = "https://claw-hub.tailca9d37.ts.net/nanoclaw") {}

  chat(messages: NullClawMessage[]): Promise<NullClawResponse> {
    return apiFetch(this.base, "/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/health");
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────
export const dataLake = new DataLakeClient(
  import.meta.env.VITE_DATA_LAKE_URL ?? "https://claw-hub.tailca9d37.ts.net"
);
export const modelApi = new ModelClient(
  import.meta.env.VITE_MODEL_API_URL ?? "https://claw-hub.tailca9d37.ts.net/models"
);
export const nanoClawApi = new NanoClawClient(
  import.meta.env.VITE_NANOCLAW_URL ?? "https://claw-hub.tailca9d37.ts.net/nanoclaw"
);

