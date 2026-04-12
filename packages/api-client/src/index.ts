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

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${text}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(
        `Expected JSON from ${baseUrl}${path}, got: ${text.slice(0, 200)}`,
      );
    }
  }

  // ─── Data Lake client ─────────────────────────────────────────────────────────
  export class DataLakeClient {
    constructor(private base = "/api") {}

    query(sql: string): Promise<Record<string, unknown>[]> {
      return apiFetch(this.base, "/query", {
        method: "POST",
        body: JSON.stringify({ sql }),
      });
    }

    players(position?: string, year?: number, limit = 10000): Promise<Player[]> {
      const params = new URLSearchParams();
      if (position) params.set("position", position);
      if (year) params.set("year", String(year));
      params.set("limit", String(limit));
      return apiFetch(this.base, `/players?${params}`);
    }

    searchPlayers(q: string): Promise<Player[]> {
      return apiFetch(this.base, `/players/search?q=${encodeURIComponent(q)}`);
    }

    player(name: string): Promise<Player> {
      return apiFetch(this.base, `/players/${encodeURIComponent(name)}`);
    }

    playerProfile(id: string): Promise<Record<string, unknown>> {
      return apiFetch(this.base, `/players/id/${encodeURIComponent(id)}/profile`);
    }

    playerAthletic(id: string): Promise<Record<string, unknown>> {
      return apiFetch(this.base, `/players/id/${encodeURIComponent(id)}/athletic`);
    }

    playerProduction(id: string): Promise<Record<string, unknown>> {
      return apiFetch(this.base, `/players/id/${encodeURIComponent(id)}/production`);
    }

    playerDurability(id: string): Promise<Record<string, unknown>> {
      return apiFetch(this.base, `/players/id/${encodeURIComponent(id)}/durability`);
    }

    playerDraftValue(id: string): Promise<Record<string, unknown>> {
      return apiFetch(this.base, `/players/id/${encodeURIComponent(id)}/draft-value`);
    }

    leaderboardAthletic(): Promise<Player[]> {
      return apiFetch(this.base, "/players/leaderboard/athletic");
    }

    leaderboardProduction(): Promise<Player[]> {
      return apiFetch(this.base, "/players/leaderboard/production");
    }

    leaderboardDraftValue(): Promise<Player[]> {
      return apiFetch(this.base, "/players/leaderboard/draft-value");
    }

    teams(): Promise<{ abbr: string; name: string }[]> {
      return apiFetch(this.base, "/teams");
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
  function toApiPath(model: string): string {
    return model.replace(/_/g, "-");
  }

  export class ModelClient {
    constructor(private base = "/api/models") {}

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
      return apiFetch(this.base, "/health/models");
    }

    health(): Promise<{ status: string }> {
      return apiFetch(this.base, "/health");
    }
  }

  // ─── NanoClaw client ──────────────────────────────────────────────────────────
  export class NanoClawClient {
    constructor(private base = "/api/nanoclaw") {}

    chat(messages: NanoClawMessage[], sessionId: string): Promise<NanoClawResponse> {
      return apiFetch(this.base, "/chat", {
        method: "POST",
        body: JSON.stringify({ messages, session_id: sessionId }),
      });
    }

    tools(): Promise<Record<string, unknown>[]> {
      return apiFetch(this.base, "/tools");
    }

    chatHistory(sessionId: string): Promise<NanoClawMessage[]> {
      return apiFetch(this.base, `/chat/history/${encodeURIComponent(sessionId)}`);
    }

    health(): Promise<{ status: string }> {
      return apiFetch(this.base, "/health");
    }
  }

  // ─── Singleton instances ──────────────────────────────────────────────────────
  export const dataLake = new DataLakeClient(
    import.meta.env.VITE_DATA_LAKE_URL?.trim() || "/api",
  );

  export const modelApi = new ModelClient(
    import.meta.env.VITE_MODEL_API_URL?.trim() || "/api/models",
  );

  export const nanoClawApi = new NanoClawClient(
    import.meta.env.VITE_NANOCLAW_URL?.trim() || "/api/nanoclaw",
  );