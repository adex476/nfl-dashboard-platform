import { useState } from "react";
import { dataLake } from "@nfl/api-client";

const EXAMPLES = [
  {
    label: "All 2025 WRs",
    sql: "SELECT player_name, college, forty_yard, vertical_in FROM player_profiles WHERE position = 'WR' ORDER BY forty_yard ASC LIMIT 20",
  },
  {
    label: "Top 40 times",
    sql: "SELECT player_name, position, forty_yard FROM player_profiles WHERE forty_yard IS NOT NULL ORDER BY forty_yard ASC LIMIT 15",
  },
  {
    label: "Team stats 2022",
    sql: "SELECT team, wins, losses, points_for, points_against FROM team_performance WHERE year = 2022 ORDER BY wins DESC",
  },
  {
    label: "Draft round counts",
    sql: "SELECT draft_round, COUNT(*) AS picks FROM player_profiles GROUP BY draft_round ORDER BY draft_round",
  },
];

export default function QueryPage() {
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const runQuery = async () => {
    if (!sql.trim() || loading) return;
    setLoading(true);
    setError(null);
    setRows(null);
    const t0 = performance.now();
    try {
      const raw = await dataLake.query(sql);
      const data: Record<string, unknown>[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>).data)
          ? (raw as Record<string, unknown[]>).data as Record<string, unknown>[]
          : Array.isArray((raw as Record<string, unknown>).rows)
            ? (raw as Record<string, unknown[]>).rows as Record<string, unknown>[]
            : [];
      setRows(data);
      setElapsed(performance.now() - t0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "42px",
            letterSpacing: "3px",
            lineHeight: 1,
          }}
        >
          SQL <span style={{ color: "var(--accent)" }}>QUERY</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          DuckDB passthrough · read-only · queries run against curated Parquet
        </p>
      </div>

      {/* Example queries */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setSql(ex.sql)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "6px 12px",
              color: "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-elevated)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-faint)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            SQL Editor
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {elapsed !== null && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--success)",
                }}
              >
                {elapsed.toFixed(1)} ms
              </span>
            )}
            <button
              onClick={runQuery}
              disabled={loading}
              style={{
                background: loading ? "var(--bg-elevated)" : "var(--accent)",
                color: loading ? "var(--text-faint)" : "var(--bg-base)",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "6px 16px",
                fontWeight: 700,
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                transition: "all 0.15s",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Running…" : "▶ Run"}
            </button>
          </div>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              runQuery();
            }
          }}
          rows={5}
          spellCheck={false}
          style={{
            width: "100%",
            padding: "16px",
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            lineHeight: 1.7,
            resize: "vertical",
            outline: "none",
          }}
        />
        <div
          style={{
            padding: "6px 16px",
            borderTop: "1px solid var(--border)",
            fontSize: "11px",
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ⌘ + Enter to run · read-only (SELECT only)
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {rows && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-faint)",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {rows.length} row{rows.length !== 1 ? "s" : ""} returned
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--accent)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-elevated)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: "8px 12px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row[col] !== null && row[col] !== undefined ? (
                          String(row[col])
                        ) : (
                          <span style={{ color: "var(--text-faint)" }}>
                            null
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
