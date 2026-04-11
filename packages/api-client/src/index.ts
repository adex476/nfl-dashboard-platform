import type {
  Player,
  TeamStats,
  PredictionRequest,
  PredictionResult,
  NanoClawMessage,
  NanoClawResponse,
} from "@nfl/types";

async function apiFetch<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Data Lake client ─────────────────────────────────────────────────────────
export class DataLakeClient {
  constructor(private base = "https://nfl-dashboard.duckdns.org") {}

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
    return apiFetch(this.base, `/api/players?${params}`);
  }

  searchPlayers(q: string): Promise<Player[]> {
    return apiFetch(this.base, `api/players/search?q=${encodeURIComponent(q)}`);
  }

  player(name: string): Promise<Player> {
    return apiFetch(this.base, `/api/players/${encodeURIComponent(name)}`);
  }

  playerProfile(id: string): Promise<Record<string, unknown>> {
    return apiFetch(this.base, `/api/players/id/${encodeURIComponent(id)}/profile`);
  }

  playerAthletic(id: string): Promise<Record<string, unknown>> {
    return apiFetch(
      this.base,
      `/api/players/id/${encodeURIComponent(id)}/athletic`,
    );
  }

  playerProduction(id: string): Promise<Record<string, unknown>> {
    return apiFetch(
      this.base,
      `/api/players/id/${encodeURIComponent(id)}/production`,
    );
  }

  playerDurability(id: string): Promise<Record<string, unknown>> {
    return apiFetch(
      this.base,
      `/api/players/id/${encodeURIComponent(id)}/durability`,
    );
  }

  playerDraftValue(id: string): Promise<Record<string, unknown>> {
    return apiFetch(
      this.base,
      `/api/players/id/${encodeURIComponent(id)}/draft-value`,
    );
  }

  leaderboardAthletic(): Promise<Player[]> {
    return apiFetch(this.base, "/api/players/leaderboard/athletic");
  }

  leaderboardProduction(): Promise<Player[]> {
    return apiFetch(this.base, "/api/players/leaderboard/production");
  }

  leaderboardDraftValue(): Promise<Player[]> {
    return apiFetch(this.base, "/api/players/leaderboard/draft-value");
  }

  teams(): Promise<{ abbr: string; name: string }[]> {
    return apiFetch(this.base, "/api/teams");
  }

  teamStats(
    team: string,
    yearStart?: number,
    yearEnd?: number,
  ): Promise<TeamStats[]> {
    const params = new URLSearchParams();
    if (yearStart) params.set("year_start", String(yearStart));
    if (yearEnd) params.set("year_end", String(yearEnd));
    return apiFetch(this.base, `/api/teams/${team}/stats?${params}`);
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/api/health");
  }
}

// ─── Model Platform client ────────────────────────────────────────────────────
// ModelName uses underscores (player_projection) but API paths use hyphens (player-projection)
function toApiPath(model: string): string {
  return model.replace(/_/g, "-");
}

export class ModelClient {
  constructor(private base = "https://nfl-dashboard.duckdns.org/api/models") {}

  predict(req: PredictionRequest): Promise<PredictionResult> {
    return apiFetch(this.base, `/${toApiPath(req.model)}/predict`, {
      method: "POST",
      body: JSON.stringify(req.inputs),
    });
  }

  schema(model: string): Promise<Record<string, unknown>> {
    return apiFetch(this.base, `/${toApiPath(model)}/schema`);
  }

  modelsHealth(): Promise<Record<string, unknown>> {
    return apiFetch(this.base, " /api/models/health");
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/api/health");
  }
}

// ─── NanoClaw client ──────────────────────────────────────────────────────────
export class NanoClawClient {
  constructor(
    private base = "https://nfl-dashboard.duckdns.org/api/nanoclaw",
  ) {}

  chat(messages: NanoClawMessage[], sessionId: string): Promise<NanoClawResponse> {
    return apiFetch(this.base, "/api/nanoclaw/chat", {
      method: "POST",
      body: JSON.stringify({ messages, session_id: sessionId }),
    });
  }

  tools(): Promise<Record<string, unknown>[]> {
    return apiFetch(this.base, "/api/nanoclaw/tools");
  }

  chatHistory(sessionId: string): Promise<NanoClawMessage[]> {
    return apiFetch(
      this.base,
      `/api/nanoclaw/chat/history/${encodeURIComponent(sessionId)}`,
    );
  }

  health(): Promise<{ status: string }> {
    return apiFetch(this.base, "/api/nanoclaw/health");
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────
// Defaults use relative paths so the Vite proxy handles dev routing and
// same-origin requests work in production without CORS issues.
export const dataLake = new DataLakeClient(
  import.meta.env.VITE_DATA_LAKE_URL || "/api",
);
export const modelApi = new ModelClient(
  import.meta.env.VITE_MODEL_API_URL || "/api/models",
);
export const nanoClawApi = new NanoClawClient(
  import.meta.env.VITE_NANOCLAW_URL || "/api/nanoclaw",
);
