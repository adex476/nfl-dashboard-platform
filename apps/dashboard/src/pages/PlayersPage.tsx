import { useState, useEffect } from "react";
import type { Player } from "@nfl/types";
import { dataLake } from "@nfl/api-client";

const POSITIONS = [
  "All",
  "QB",
  "RB",
  "WR",
  "TE",
  "OT",
  "IOL",
  "EDGE",
  "DT",
  "LB",
  "CB",
  "S",
];

const COLS: Array<{ key: keyof Player; label: string; mono?: boolean }> = [
  { key: "player_name", label: "Name" },
  { key: "position", label: "Pos", mono: true },
  { key: "school", label: "College" },
  { key: "height_in", label: "Ht", mono: true },
  { key: "weight_lbs", label: "Wt", mono: true },
  { key: "draft_year", label: "Year", mono: true },
  { key: "draft_round", label: "Rd", mono: true },
  { key: "draft_pick", label: "Pick", mono: true },
  { key: "draft_team", label: "Team" },
  { key: "forty_yard", label: "40yd", mono: true },
  { key: "vertical_in", label: "Vert", mono: true },
  { key: "bench_reps", label: "Bench", mono: true },
  { key: "broad_jump_in", label: "Broad", mono: true },
  { key: "three_cone", label: "3-Cone", mono: true },
  { key: "shuttle", label: "Shuttle", mono: true },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filtered, setFiltered] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Player>("draft_pick");
  const [sortAsc, setSortAsc] = useState(true);

  // Load players
  useEffect(() => {
    setLoading(true);
    setError(null);
    dataLake
      .players()
      .then((data) => {
        setPlayers(data.players || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...players];
    if (position !== "All")
      result = result.filter((p) => p.position === position);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.player_name.toLowerCase().includes(q) ||
          (p.school || "").toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    setFiltered(result);
  }, [players, position, search, sortKey, sortAsc]);

  const toggleSort = (key: keyof Player) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

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
          PLAYER <span style={{ color: "var(--accent)" }}>DATABASE</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          2025 combine class · {players.length} players
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or college…"
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {POSITIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              style={{
                ...chipStyle,
                color: position === p ? "var(--accent)" : "var(--text-muted)",
                background:
                  position === p ? "var(--accent-dim)" : "transparent",
                border:
                  position === p
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-faint)",
          }}
        >
          {filtered.length} results
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color:
                        sortKey === col.key
                          ? "var(--accent)"
                          : "var(--text-faint)",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginLeft: "4px" }}>
                        {sortAsc ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((player, i) => (
                <tr
                  key={player.player_name ?? i}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-elevated)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {COLS.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "10px 12px",
                        fontSize: "13px",
                        fontFamily: col.mono
                          ? "var(--font-mono)"
                          : "var(--font-body)",
                        color:
                          col.key === "player_name"
                            ? "var(--text-primary)"
                            : "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {player[col.key] !== null &&
                      player[col.key] !== undefined ? (
                        String(player[col.key])
                      ) : (
                        <span style={{ color: "var(--text-faint)" }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={COLS.length}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-faint)",
                    }}
                  >
                    No players match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "8px 12px",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  outline: "none",
  width: "220px",
};

const chipStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: "4px",
  fontSize: "11px",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  letterSpacing: "0.3px",
  transition: "all 0.15s",
};

// ─── States ───────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px",
        color: "var(--text-faint)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          margin: "0 auto 12px",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      Loading players from data lake…
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--danger)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        color: "var(--danger)",
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
      }}
    >
      <strong>Could not reach Data Lake</strong>
      <p
        style={{
          marginTop: "8px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-body)",
        }}
      >
        {message}
      </p>
      <p style={{ marginTop: "8px", color: "var(--text-faint)" }}>
        Make sure the data lake API is reachable at /api/health
      </p>
    </div>
  );
}
