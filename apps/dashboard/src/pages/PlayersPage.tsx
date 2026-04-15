import { useState, useEffect, useRef, useCallback } from "react";
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

const ROW_HEIGHT = 42;
const OVERSCAN = 10;

// Module-level cache — survives tab switches, cleared on page reload
let playersCache: Player[] | null = null;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>(playersCache ?? []);
  const [filtered, setFiltered] = useState<Player[]>(playersCache ?? []);
  const [loading, setLoading] = useState(playersCache === null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Player>("draft_pick");
  const [sortAsc, setSortAsc] = useState(true);

  // Virtual scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Debounce ref
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Fetch — skip if cache hit
  useEffect(() => {
    if (playersCache !== null) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    dataLake
      .players(undefined, undefined, 10000)
      .then((data) => {
        if (controller.signal.aborted) return;
        const list = data.players || [];
        playersCache = list;
        setPlayers(list);
        setLoading(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(String(e));
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Debounce search input
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(val), 250);
  }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...players];
    if (position !== "All") result = result.filter((p) => p.position === position);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
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
    // Reset scroll to top on filter/sort change
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [players, position, debouncedSearch, sortKey, sortAsc]);

  // Track container height via ResizeObserver
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, [loading]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  const handleRefresh = useCallback(() => {
    playersCache = null;
    setPlayers([]);
    setFiltered([]);
    setLoading(true);
    setError(null);
    dataLake
      .players(undefined, undefined, 10000)
      .then((data) => {
        const list = data.players || [];
        playersCache = list;
        setPlayers(list);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const toggleSort = (key: keyof Player) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Virtual window calculation
  const totalHeight = filtered.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(filtered.length, startIndex + visibleCount);
  const visibleRows = filtered.slice(startIndex, endIndex);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, totalHeight - endIndex * ROW_HEIGHT);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
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
          onChange={(e) => handleSearchChange(e.target.value)}
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
                background: position === p ? "var(--accent-dim)" : "transparent",
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
        <button
          onClick={handleRefresh}
          title="Reload players from data lake"
          style={{
            ...chipStyle,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          ↺ refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRefresh} />
      ) : (
        // Single table — thead sticky so columns stay aligned with body on scroll
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            overflowX: "auto",
            overflowY: "auto",
            height: "calc(100vh - 320px)",
            flex: 1,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  position: "sticky",
                  top: 0,
                  background: "var(--bg-base)",
                  zIndex: 1,
                }}
              >
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
                        sortKey === col.key ? "var(--accent)" : "var(--text-faint)",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginLeft: "4px" }}>{sortAsc ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Top spacer */}
              {paddingTop > 0 && (
                <tr style={{ height: paddingTop }}>
                  <td colSpan={COLS.length} />
                </tr>
              )}

              {visibleRows.map((player, i) => (
                <tr
                  key={player.player_name ?? startIndex + i}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    height: ROW_HEIGHT,
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
                        fontFamily: col.mono ? "var(--font-mono)" : "var(--font-body)",
                        color:
                          col.key === "player_name"
                            ? "var(--text-primary)"
                            : "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {player[col.key] !== null && player[col.key] !== undefined ? (
                        String(player[col.key])
                      ) : (
                        <span style={{ color: "var(--text-faint)" }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Bottom spacer */}
              {paddingBottom > 0 && (
                <tr style={{ height: paddingBottom }}>
                  <td colSpan={COLS.length} />
                </tr>
              )}

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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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
      <button
        onClick={onRetry}
        style={{
          marginTop: "16px",
          padding: "8px 16px",
          background: "transparent",
          border: "1px solid var(--danger)",
          borderRadius: "var(--radius)",
          color: "var(--danger)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        retry
      </button>
    </div>
  );
}
