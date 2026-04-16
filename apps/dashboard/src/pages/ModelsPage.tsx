import { useState } from "react";
import { dataLake, modelApi } from "@nfl/api-client";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bgBase: "#080c10",
  bgSurface: "#0e1420",
  bgEl: "#161e2e",
  accent: "#00d4ff",
  accentDim: "rgba(0,212,255,0.10)",
  gold: "#f0b429",
  success: "#00c48c",
  danger: "#ff4d6d",
  warn: "#ff8c42",
  purple: "#a78bfa",
  border: "rgba(255,255,255,0.08)",
  muted: "rgba(255,255,255,0.5)",
  faint: "rgba(255,255,255,0.25)",
  display: "'Bebas Neue', sans-serif",
  body: "'IBM Plex Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const gradeColor: Record<string, string> = {
  Elite: "#00d4ff",
  High: "#00c48c",
  Mid: "#f0b429",
  Low: "#ff8c42",
  Bust: "#ff4d6d",
};
const riskColor: Record<string, string> = {
  Low: "#00c48c",
  Medium: "#f0b429",
  High: "#ff8c42",
  "Very High": "#ff4d6d",
};
const flexTierColor: Record<string, string> = {
  "Elite Flex": "#00d4ff",
  "Multi-Position": "#00c48c",
  "Limited Flex": "#f0b429",
  "One-Trick": "#ff8c42",
};
const weaknessColor = (score: number) =>
  score >= 0.7
    ? T.danger
    : score >= 0.45
      ? T.warn
      : score >= 0.25
        ? T.gold
        : T.success;

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.mono,
        fontSize: "10px",
        letterSpacing: "2px",
        color: T.faint,
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      {children}
    </div>
  );
}
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: T.bgEl,
        border: `1px solid ${T.border}`,
        borderRadius: "10px",
        padding: "20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontFamily: T.mono,
          fontSize: "10px",
          letterSpacing: "1.5px",
          color: T.faint,
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          padding: "10px 14px",
          color: "#fff",
          fontFamily: T.body,
          fontSize: "14px",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.accent)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </div>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontFamily: T.mono,
          fontSize: "10px",
          letterSpacing: "1.5px",
          color: T.faint,
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          padding: "10px 14px",
          color: "#fff",
          fontFamily: T.body,
          fontSize: "14px",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
function RunButton({
  onClick,
  loading,
  label = "RUN PREDICTION",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "12px 28px",
        background: loading ? T.bgEl : T.accent,
        color: loading ? T.muted : T.bgBase,
        border: "none",
        borderRadius: "6px",
        fontFamily: T.display,
        fontSize: "16px",
        letterSpacing: "2px",
        cursor: loading ? "not-allowed" : "pointer",
        alignSelf: "flex-end",
      }}
    >
      {loading ? "RUNNING…" : label}
    </button>
  );
}

// ─── Score Arc gauge ──────────────────────────────────────────────────────────

function ScoreArc({
  score,
  grade,
  label = "CAR AV SCORE",
}: {
  score: number;
  grade: string;
  label?: string;
}) {
  const r = 70;
  const cx = 100;
  const cy = 100;
  const toXY = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });
  const pct = score / 100;
  const angle = -150 + pct * 300;
  const startPt = toXY(-150);
  const endPt = toXY(angle);
  const largeArc = pct > 0.5 ? 1 : 0;
  const arcPath = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;
  const color = gradeColor[grade] ?? T.accent;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <svg width="200" height="140" viewBox="0 0 200 140">
        <path
          d={`M ${toXY(-150).x} ${toXY(-150).y} A ${r} ${r} 0 1 1 ${toXY(150).x} ${toXY(150).y}`}
          fill="none"
          stroke={T.border}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text
          x="100"
          y="98"
          textAnchor="middle"
          fill="#fff"
          fontSize="32"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="2"
        >
          {score}
        </text>
        <text
          x="100"
          y="116"
          textAnchor="middle"
          fill={T.faint}
          fontSize="9"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="1"
        >
          {label}
        </text>
      </svg>
      <div
        style={{
          background: color,
          color: grade === "Elite" ? T.bgBase : "#fff",
          fontFamily: T.display,
          fontSize: "18px",
          letterSpacing: "3px",
          padding: "4px 18px",
          borderRadius: "4px",
          marginTop: "-4px",
        }}
      >
        {grade}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER PROJECTION
// ═══════════════════════════════════════════════════════════════════════════════

interface PlayerProjectionResult {
  career_value_score: number;
  grade: string;
  confidence: number;
  draft_context: { label: string; value: number; avg: number };
  comparables: Array<{
    name: string;
    position: string;
    car_av: number;
    draft_pick: number;
  }>;
  shap_values: Array<{ feature: string; contribution: number }>;
}

function mockProjectionResult(
  pick: number,
  round: number,
): PlayerProjectionResult {
  const score = Math.max(
    5,
    Math.min(98, 95 - pick * 0.6 - round * 3 + Math.random() * 8),
  );
  const grade =
    score >= 75
      ? "Elite"
      : score >= 58
        ? "High"
        : score >= 40
          ? "Mid"
          : score >= 22
            ? "Low"
            : "Bust";
  return {
    career_value_score: Math.round(score),
    grade,
    confidence: Math.round(60 + Math.random() * 30),
    draft_context: {
      label: `Round ${round}, Pick ${pick}`,
      value: Math.round(score),
      avg: Math.round(score - 8 + Math.random() * 16),
    },
    comparables: [
      { name: "DeAndre Hopkins", position: "WR", car_av: 84, draft_pick: 27 },
      { name: "Stefon Diggs", position: "WR", car_av: 72, draft_pick: 146 },
      { name: "A.J. Brown", position: "WR", car_av: 61, draft_pick: 51 },
    ],
    shap_values: [
      { feature: "Draft Value Score", contribution: 18.4 },
      { feature: "Speed Score", contribution: 11.2 },
      { feature: "Agility Score", contribution: 8.7 },
      { feature: "Size Score", contribution: 6.1 },
      { feature: "Burst Score", contribution: 4.9 },
      { feature: "Strength Score", contribution: -2.3 },
      { feature: "Round × Draft Value", contribution: -5.8 },
    ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
  };
}

function PlayerProjectionResult({
  result,
}: {
  result: PlayerProjectionResult;
}) {
  const shapMax = Math.max(
    ...result.shap_values.map((s) => Math.abs(s.contribution)),
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <Card
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <SectionLabel>Career Value Score</SectionLabel>
          <ScoreArc score={result.career_value_score} grade={result.grade} />
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontFamily: T.mono,
              fontSize: "11px",
              color: T.muted,
            }}
          >
            <span>
              CONFIDENCE{" "}
              <span style={{ color: "#fff" }}>{result.confidence}%</span>
            </span>
            <span>{result.draft_context.label}</span>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Card>
            <SectionLabel>Draft Slot Context</SectionLabel>
            {[
              {
                label: "This projection",
                value: result.draft_context.value,
                color: T.accent,
              },
              {
                label: "Pick-slot avg",
                value: result.draft_context.avg,
                color: T.gold,
              },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "11px",
                      color: T.muted,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "12px",
                      color: row.color,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
                <div
                  style={{
                    height: "7px",
                    background: T.bgSurface,
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${row.value}%`,
                      background: row.color,
                      borderRadius: "4px",
                      boxShadow: `0 0 8px ${row.color}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </Card>
          <Card style={{ flex: 1 }}>
            <SectionLabel>Comparable Players</SectionLabel>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              {result.comparables.map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: T.bgSurface,
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        background: T.accentDim,
                        border: `1px solid ${T.accent}`,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: T.mono,
                        fontSize: "8px",
                        color: T.accent,
                      }}
                    >
                      {c.position}
                    </div>
                    <span style={{ fontFamily: T.body, fontSize: "13px" }}>
                      {c.name}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      fontFamily: T.mono,
                      fontSize: "11px",
                    }}
                  >
                    <span style={{ color: T.muted }}>Pk {c.draft_pick}</span>
                    <span style={{ color: T.accent }}>AV {c.car_av}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Card>
        <SectionLabel>Feature Contributions (SHAP)</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          {result.shap_values.map((s) => (
            <div
              key={s.feature}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "11px",
                  color: T.muted,
                  width: "180px",
                  flexShrink: 0,
                }}
              >
                {s.feature}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "8px",
                  background: T.bgSurface,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(Math.abs(s.contribution) / shapMax) * 100}%`,
                    background: s.contribution >= 0 ? T.success : T.danger,
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "11px",
                  color: s.contribution >= 0 ? T.success : T.danger,
                  width: "48px",
                  textAlign: "right",
                }}
              >
                {s.contribution >= 0 ? "+" : ""}
                {s.contribution.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlayerProjectionPanel() {
  const [name, setName] = useState("");
  const [draftYear, setDraftYear] = useState(String(new Date().getFullYear()));
  const [result, setResult] = useState<PlayerProjectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a player name before running the projection.");
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await modelApi.predict({
        model: "player_projection",
        inputs: {
          player_name: trimmedName,
          draft_year: parseInt(draftYear) || new Date().getFullYear(),
        },
      });
      setResult(res as unknown as PlayerProjectionResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to run projection.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ModelHeader
        title="PLAYER"
        accent="PROJECTION"
        tag="XGBoost · career_value_score · SHAP · comparables"
        desc="XGBoost model predicting Career Approximate Value from gold athletic profiles + draft context. Outputs a 0–100 career value score, grade, comparable players, and SHAP feature drivers."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        <InputField
          label="Player Name"
          value={name}
          onChange={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          placeholder="e.g. Travis Hunter"
        />
        <InputField
          label="Draft Year"
          value={draftYear}
          onChange={setDraftYear}
          placeholder={String(new Date().getFullYear())}
          type="number"
        />
      </div>
      {error && (
        <div
          style={{
            color: T.danger,
            fontFamily: T.body,
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}
      <RunButton onClick={run} loading={loading} />
      {result && <PlayerProjectionResult result={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

interface HealthAnalyzerResult {
  risk_tier: string;
  survival_curve: Array<{ season: number; probability: number }>;
  seasonal_risk: Array<{ season: string; injury_pct: number }>;
  key_factors: Array<{ factor: string; impact: string }>;
  expected_games_played?: number;
  season_injury_probability?: number;
  position_group?: string;
  position_percentile?: number;
}

interface HealthAnalyzerApiResult {
  risk_tier?: string;
  injury_risk_tier?: string;
  survival_curve?: number[];
  seasonal_risk?: Array<{ season: string; injury_pct: number }>;
  key_factors?: Array<{ factor: string; impact: string }>;
  primary_risk_factors?: string[];
  expected_games_played?: number;
  season_injury_probability?: number;
  position_group?: string;
  position_percentile?: number;
}

function normalizeHealthResult(data: HealthAnalyzerApiResult): HealthAnalyzerResult {
  const tier = data.risk_tier ?? data.injury_risk_tier ?? "Low";
  const injuryProbability = Math.max(
    0,
    Math.min(1, data.season_injury_probability ?? 0),
  );
  const survivalCurve =
    Array.isArray(data.survival_curve) && data.survival_curve.length > 0
      ? data.survival_curve.map((probability, index) => ({
          season: index + 1,
          probability: Math.round(
            Math.max(0, Math.min(1, probability)) * 1000,
          ) / 10,
        }))
      : [];

  const seasonalRisk =
    Array.isArray(data.seasonal_risk) && data.seasonal_risk.length > 0
      ? data.seasonal_risk
      : survivalCurve.map((entry, index) => ({
          season: `Yr ${index + 1}`,
          injury_pct: Math.round(
            Math.min(
              99,
              (injuryProbability + index * 0.025) * 100,
            ) * 10,
          ) / 10,
        }));

  const keyFactors =
    Array.isArray(data.key_factors) && data.key_factors.length > 0
      ? data.key_factors
      : Array.isArray(data.primary_risk_factors) && data.primary_risk_factors.length > 0
        ? data.primary_risk_factors.map((factor) => ({
            factor,
            impact: "Risk factor",
          }))
        : [
            {
              factor: "No primary risk factors flagged",
              impact: "Stable profile",
            },
          ];

  return {
    risk_tier: tier,
    survival_curve: survivalCurve,
    seasonal_risk: seasonalRisk,
    key_factors: keyFactors,
    expected_games_played: data.expected_games_played,
    season_injury_probability: data.season_injury_probability,
    position_group: data.position_group,
    position_percentile: data.position_percentile,
  };
}

function mockHealthResult(
  injuries: number,
  snaps: number,
): HealthAnalyzerResult {
  const baseRisk = Math.min(0.85, 0.15 + injuries * 0.12 + (snaps / 70) * 0.15);
  const tier =
    baseRisk < 0.25
      ? "Low"
      : baseRisk < 0.45
        ? "Medium"
        : baseRisk < 0.65
          ? "High"
          : "Very High";
  return {
    risk_tier: tier,
    survival_curve: [1, 2, 3, 4, 5].map((s) => ({
      season: s,
      probability: Math.max(5, Math.round((1 - baseRisk) ** s * 100)),
    })),
    seasonal_risk: [1, 2, 3, 4, 5].map((s) => ({
      season: `Yr ${s}`,
      injury_pct: Math.min(
        95,
        Math.round(baseRisk * 100 * (1 + (s - 1) * 0.08)),
      ),
    })),
    key_factors: [
      {
        factor: `${injuries} prior injury${injuries !== 1 ? "ies" : ""}`,
        impact: injuries > 1 ? "↑ risk" : "↓ risk",
      },
      {
        factor: `${snaps} snaps/game workload`,
        impact: snaps > 55 ? "↑ risk" : "↓ risk",
      },
      { factor: "Positional contact rate", impact: "↑ risk" },
      { factor: "Age / draft timing", impact: "↓ risk" },
    ],
  };
}

function HealthAnalyzerResult({ result }: { result: HealthAnalyzerResult }) {
  const rc = riskColor[result.risk_tier];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          background: `${rc}18`,
          border: `1px solid ${rc}`,
          borderRadius: "8px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: "10px",
              color: T.faint,
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            INJURY RISK TIER
          </div>
          <div
            style={{
              fontFamily: T.display,
              fontSize: "32px",
              letterSpacing: "3px",
              color: rc,
            }}
          >
            {result.risk_tier.toUpperCase()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignItems: "flex-end",
          }}
        >
          {typeof result.expected_games_played === "number" && (
            <div
              style={{
                fontFamily: T.mono,
                fontSize: "11px",
                color: T.muted,
              }}
            >
              EXPECTED GAMES: {result.expected_games_played.toFixed(2)}
            </div>
          )}
          {result.key_factors.map((f) => (
            <div
              key={f.factor}
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <span
                style={{ fontFamily: T.body, fontSize: "12px", color: T.muted }}
              >
                {f.factor}
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "10px",
                  color:
                    f.impact.includes("↑") || /risk/i.test(f.impact)
                      ? T.danger
                      : T.success,
                  padding: "2px 6px",
                  border: `1px solid ${
                    f.impact.includes("↑") || /risk/i.test(f.impact)
                      ? T.danger
                      : T.success
                  }`,
                  borderRadius: "4px",
                }}
              >
                {f.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Card>
        <SectionLabel>Injury-Free Survival Probability by Season</SectionLabel>
        <div style={{ height: "200px", marginTop: "8px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={result.survival_curve}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="season"
                tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
                tickFormatter={(v) => `Yr ${v}`}
                axisLine={{ stroke: T.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                axisLine={{ stroke: T.border }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: T.bgSurface,
                  border: `1px solid ${T.border}`,
                  fontFamily: T.mono,
                  fontSize: "11px",
                }}
                formatter={(v: number) => [`${v}%`, "Survival"]}
                labelFormatter={(l) => `Season ${l}`}
              />
              <ReferenceLine y={50} stroke={T.faint} strokeDasharray="4 4" />
              <Line
                dataKey="probability"
                stroke={rc}
                strokeWidth={2.5}
                dot={{ fill: rc, r: 4, strokeWidth: 0 }}
                style={{ filter: `drop-shadow(0 0 4px ${rc})` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <SectionLabel>Projected Injury Risk Per Season</SectionLabel>
        <div style={{ height: "160px", marginTop: "8px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={result.seasonal_risk}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="season"
                tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: T.bgSurface,
                  border: `1px solid ${T.border}`,
                  fontFamily: T.mono,
                  fontSize: "11px",
                }}
                formatter={(v: number) => [`${v}%`, "Injury risk"]}
              />
              <Bar dataKey="injury_pct" radius={[4, 4, 0, 0]}>
                {result.seasonal_risk.map((_, i) => (
                  <Cell key={i} fill={rc} opacity={0.5 + i * 0.1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function HealthAnalyzerPanel() {
  const [name, setName] = useState("");
  const [pos, setPos] = useState("WR");
  const [injuries, setInjuries] = useState("1");
  const [snaps, setSnaps] = useState("52");
  const [result, setResult] = useState<HealthAnalyzerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const res = await modelApi.predict({
        model: "health_analyzer",
        inputs: {
          name,
          position: pos,
          career_injuries: parseInt(injuries) || 1,
          snaps_per_game: parseInt(snaps) || 52,
        },
      });
      setResult(normalizeHealthResult(res as HealthAnalyzerApiResult));
    } catch {
      setResult(
        mockHealthResult(parseInt(injuries) || 1, parseInt(snaps) || 52),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ModelHeader
        title="HEALTH"
        accent="ANALYZER"
        tag="Cox PH · survival curve · injury risk per season"
        desc="Cox Proportional Hazards model estimating injury-free survival probability across seasons. Outputs a risk tier, season-by-season survival curve, and key risk factor flags from durability profiles."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "14px",
        }}
      >
        <InputField
          label="Player Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Travis Hunter"
        />
        <SelectField
          label="Position"
          value={pos}
          onChange={setPos}
          options={[
            "QB",
            "WR",
            "RB",
            "TE",
            "OT",
            "IOL",
            "EDGE",
            "DT",
            "LB",
            "CB",
            "S",
          ]}
        />
        <InputField
          label="Career Injuries"
          value={injuries}
          onChange={setInjuries}
          placeholder="1"
          type="number"
        />
        <InputField
          label="Snaps / Game"
          value={snaps}
          onChange={setSnaps}
          placeholder="52"
          type="number"
        />
      </div>
      <RunButton onClick={run} loading={loading} />
      {result && <HealthAnalyzerResult result={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAFT OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════════

interface DraftOptimizerResult {
  picks: Array<{
    rank: number;
    name: string;
    position: string;
    projected_av: number;
    adp_value: number;
    value_over_adp: number;
    need_match: number;
  }>;
  need_coverage: Array<{ position: string; need: number; filled: number }>;
  board?: DraftOptimizerResult["picks"];
  solver_status?: string;
  meta?: { error?: string };
}

function mockOptimizerResult(
  pick: number,
  needs: string[],
): DraftOptimizerResult {
  const candidates = [
    { name: "Travis Hunter", position: "WR", base_av: 91 },
    { name: "Shedeur Sanders", position: "QB", base_av: 78 },
    { name: "Abdul Carter", position: "EDGE", base_av: 85 },
    { name: "Mason Graham", position: "DT", base_av: 73 },
    { name: "Will Campbell", position: "OT", base_av: 70 },
    { name: "Tetairoa McMillan", position: "WR", base_av: 76 },
    { name: "Jalon Walker", position: "LB", base_av: 68 },
  ];
  const scored = candidates
    .map((c) => {
      const adp = Math.round(pick + (Math.random() - 0.5) * 10);
      const need_match = needs.some((n) => c.position.includes(n))
        ? 85 + Math.random() * 15
        : 30 + Math.random() * 40;
      return {
        ...c,
        adp_value: adp,
        projected_av: c.base_av,
        value_over_adp:
          Math.round((c.base_av - adp * 0.4 + need_match * 0.1) * 10) / 10,
        need_match: Math.round(need_match),
      };
    })
    .sort((a, b) => b.value_over_adp - a.value_over_adp)
    .slice(0, 5)
    .map((c, i) => ({ ...c, rank: i + 1 }));
  return {
    picks: scored,
    need_coverage: (needs.length > 0 ? needs : ["WR", "EDGE"]).map((pos) => ({
      position: pos,
      need: 90,
      filled: scored.some((p) => p.position.includes(pos))
        ? 75 + Math.random() * 20
        : 15 + Math.random() * 20,
    })),
  };
}

function DraftOptimizerResult({ result }: { result: DraftOptimizerResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card>
        <SectionLabel>Value-Ranked Recommendations</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          {(result.picks ?? []).map((p) => (
            <div
              key={p.name}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr 48px 48px 80px 80px",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: p.rank === 1 ? T.accentDim : T.bgSurface,
                border: `1px solid ${p.rank === 1 ? T.accent : T.border}`,
                borderRadius: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: T.display,
                  fontSize: "18px",
                  color: p.rank === 1 ? T.accent : T.faint,
                }}
              >
                #{p.rank}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: T.body,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: "10px",
                    color: T.muted,
                  }}
                >
                  {p.position}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: T.mono, fontSize: "13px" }}>
                  {p.projected_av}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: "9px",
                    color: T.faint,
                  }}
                >
                  proj AV
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: "13px",
                    color: T.muted,
                  }}
                >
                  {p.adp_value}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: "9px",
                    color: T.faint,
                  }}
                >
                  ADP val
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: "13px",
                    color: p.value_over_adp >= 0 ? T.success : T.danger,
                  }}
                >
                  {p.value_over_adp >= 0 ? "+" : ""}
                  {p.value_over_adp}
                </span>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: "9px",
                    color: T.faint,
                  }}
                >
                  vs ADP
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "3px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "9px",
                      color: T.faint,
                    }}
                  >
                    need fit
                  </span>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "9px",
                      color: T.muted,
                    }}
                  >
                    {p.need_match}%
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: T.bgEl,
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${p.need_match}%`,
                      background: p.need_match >= 70 ? T.success : T.gold,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionLabel>Positional Need Coverage</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "10px",
          }}
        >
          {(result.need_coverage ?? []).map((n) => (
            <div key={n.position}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: T.display,
                    fontSize: "16px",
                    letterSpacing: "1px",
                  }}
                >
                  {n.position}
                </span>
                <div style={{ display: "flex", gap: "16px" }}>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "11px",
                      color: T.faint,
                    }}
                  >
                    need <span style={{ color: T.danger }}>{n.need}%</span>
                  </span>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "11px",
                      color: T.faint,
                    }}
                  >
                    best fit{" "}
                    <span style={{ color: T.success }}>
                      {Math.round(n.filled)}%
                    </span>
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: "10px",
                  background: T.bgSurface,
                  borderRadius: "5px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: `${n.need}%`,
                    background: `${T.danger}30`,
                    borderRadius: "5px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: `${n.filled}%`,
                    background: T.success,
                    borderRadius: "5px",
                    boxShadow: `0 0 8px ${T.success}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DraftOptimizerPanel() {
  const [team, setTeam] = useState("DAL");
  const [pick, setPick] = useState("12");
  const [draftYear, setDraftYear] = useState(String(new Date().getFullYear()));
  const [needs, setNeeds] = useState("WR,EDGE");
  const [result, setResult] = useState<DraftOptimizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    const needsList = needs
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    try {
      const raw = await modelApi.predict({
        model: "draft_optimizer",
        inputs: {
          team,
          pick_number: parseInt(pick) || 12,
          positional_needs: needsList,
          draft_year: parseInt(draftYear) || new Date().getFullYear(),
        },
      }) as unknown as DraftOptimizerResult;
      const res: DraftOptimizerResult = {
        ...raw,
        picks: raw.picks ?? raw.board ?? [],
        need_coverage: raw.need_coverage ?? [],
      };
      setResult(res);
    } catch {
      setResult(mockOptimizerResult(parseInt(pick) || 12, needsList));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ModelHeader
        title="DRAFT"
        accent="OPTIMIZER"
        tag="CVXPY · pick value · positional needs · value-over-ADP"
        desc="CVXPY constrained optimizer balancing Player Projection scores, pick slot value, and team positional needs. Outputs ranked recommendations with value-over-ADP and need-fit scores."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 2fr",
          gap: "14px",
        }}
      >
        <InputField
          label="Team Abbr"
          value={team}
          onChange={setTeam}
          placeholder="DAL"
        />
        <InputField
          label="Pick Number"
          value={pick}
          onChange={setPick}
          placeholder="12"
          type="number"
        />
        <InputField
          label="Draft Year"
          value={draftYear}
          onChange={setDraftYear}
          placeholder="2025"
          type="number"
        />
        <InputField
          label="Position Needs (comma-separated)"
          value={needs}
          onChange={setNeeds}
          placeholder="WR,EDGE"
        />
      </div>
      <RunButton onClick={run} loading={loading} />
      {result && <DraftOptimizerResult result={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSITIONAL FLEXIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

interface FlexResult {
  versatility_tier: string;
  versatility_score: number;
  primary_position: string;
  secondary_positions: Array<{
    position: string;
    probability: number;
    role: string;
  }>;
  personnel_usage: Array<{ package: string; snap_pct: number }>;
  shap_values: Array<{ feature: string; contribution: number }>;
  comparables: Array<{ name: string; positions: string[]; note: string }>;
}

interface FlexApiPositionScore {
  affinity_score: number;
  percentile: number;
  viable_backup: boolean;
  package_player: boolean;
}

interface FlexApiComparable {
  distance: number;
  player_name: string;
  draft_year: number;
  primary_group: string;
  label_QB: number;
  label_SKILL: number;
  label_OL: number;
  label_DL: number;
  label_LB: number;
  label_DB: number;
  label_SPEC: number;
}

interface FlexApiResult {
  primary_group?: string;
  position_scores?: Record<string, FlexApiPositionScore>;
  flex_candidates?: string[];
  comparables?: FlexApiComparable[];
}

function normalizeFlexResult(data: FlexApiResult): FlexResult {
  const positionScores = data.position_scores ?? {};
  const primary = data.primary_group ?? "SKILL";
  const primaryScore = positionScores[primary];
  const secondaryPositions = Object.entries(positionScores)
    .filter(([group]) => group !== primary)
    .map(([group, score]) => ({
      position: group,
      role: score.package_player
        ? "Package player"
        : score.viable_backup
          ? "Viable backup"
          : "Developmental fit",
      probability: Math.round(score.percentile),
    }))
    .sort((a, b) => b.probability - a.probability);

  const personnelUsage = Object.entries(positionScores)
    .map(([group, score]) => ({
      package: group,
      snap_pct: Math.round(score.percentile),
    }))
    .sort((a, b) => b.snap_pct - a.snap_pct);

  const shapValues = Object.entries(positionScores)
    .map(([group, score]) => ({
      feature: `${group} affinity`,
      contribution: Math.round((score.affinity_score * 100 - 20) * 10) / 10,
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const comparables = (data.comparables ?? []).map((player) => {
    const labels = [
      "QB",
      "SKILL",
      "OL",
      "DL",
      "LB",
      "DB",
      "SPEC",
    ].filter((group) => {
      const key = `label_${group}` as keyof FlexApiComparable;
      const value = player[key];
      return typeof value === "number" && value > 0;
    });

    return {
      name: player.player_name,
      positions: labels.length > 0 ? labels : [player.primary_group],
      note: `${player.primary_group} · ${player.draft_year} · dist ${player.distance.toFixed(2)}`,
    };
  });

  const topScore = primaryScore?.percentile ?? 0;
  const versatilityScore = Math.round(topScore);
  const tier =
    versatilityScore >= 85
      ? "Elite Flex"
      : versatilityScore >= 65
        ? "Multi-Position"
        : versatilityScore >= 45
          ? "Limited Flex"
          : "One-Trick";

  return {
    versatility_tier: tier,
    versatility_score: versatilityScore,
    primary_position: primary,
    secondary_positions: secondaryPositions,
    personnel_usage: personnelUsage,
    shap_values: shapValues,
    comparables,
  };
}

function mockFlexResult(pos: string, snapShare: number): FlexResult {
  const skillPos = ["WR", "RB", "TE", "CB", "S", "LB"];
  const isSkill = skillPos.includes(pos);
  const score = Math.round(40 + Math.random() * 55);
  const tier =
    score >= 80
      ? "Elite Flex"
      : score >= 60
        ? "Multi-Position"
        : score >= 40
          ? "Limited Flex"
          : "One-Trick";

  const secondaryMap: Record<
    string,
    Array<{ position: string; role: string }>
  > = {
    WR: [
      { position: "Slot WR", role: "Slot receiver / motion weapon" },
      { position: "RB (H-back)", role: "Jet sweep / gadget" },
    ],
    RB: [
      { position: "Slot WR", role: "Receiving back / RPO target" },
      { position: "FB", role: "Lead blocker" },
    ],
    TE: [
      { position: "FB", role: "Inline blocker / motion" },
      { position: "Slot WR", role: "Move TE" },
    ],
    CB: [
      { position: "S", role: "Nickel / dime safety" },
      { position: "Slot CB", role: "Interior coverage" },
    ],
    S: [
      { position: "CB", role: "Man coverage outside" },
      { position: "LB", role: "Box safety / run force" },
    ],
    LB: [
      { position: "EDGE", role: "Stand-up pass rusher" },
      { position: "S", role: "Spy / robber coverage" },
    ],
    EDGE: [
      { position: "DT", role: "3-tech interior on passing downs" },
      { position: "OLB", role: "Two-gap / coverage" },
    ],
    DT: [
      { position: "EDGE", role: "Kick-out on 3rd down" },
      { position: "NT", role: "Two-gap nose" },
    ],
    OT: [
      { position: "IOL", role: "Guard kick-inside" },
      { position: "TE", role: "H-back blocker" },
    ],
    IOL: [
      { position: "C", role: "Emergency center" },
      { position: "OT", role: "Swing tackle" },
    ],
    QB: [
      { position: "Wildcat", role: "RPO runner" },
      { position: "WR", role: "Gadget / trick plays" },
    ],
  };
  const secondaries = (secondaryMap[pos] ?? secondaryMap["WR"])
    .map(({ position, role }) => ({
      position,
      role,
      probability: Math.round(30 + Math.random() * 60),
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    versatility_tier: tier,
    versatility_score: score,
    primary_position: pos,
    secondary_positions: secondaries,
    personnel_usage: [
      { package: "11 (3WR)", snap_pct: Math.round(20 + Math.random() * 50) },
      { package: "12 (2WR2TE)", snap_pct: Math.round(10 + Math.random() * 30) },
      { package: "21 (2RB)", snap_pct: Math.round(5 + Math.random() * 20) },
      { package: "13 (3TE)", snap_pct: Math.round(2 + Math.random() * 15) },
    ].sort((a, b) => b.snap_pct - a.snap_pct),
    shap_values: [
      { feature: "Agility Score", contribution: 14.2 },
      { feature: "Size Score", contribution: isSkill ? 9.1 : -3.2 },
      { feature: "Snap Share", contribution: snapShare > 0.5 ? 7.4 : -2.1 },
      { feature: "Personnel Pkg Diversity", contribution: 11.6 },
      { feature: "Speed Score", contribution: 8.3 },
      { feature: "Strength Score", contribution: -4.5 },
    ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    comparables: [
      {
        name: "Taysom Hill",
        positions: ["TE", "QB", "WR", "RB"],
        note: "Elite gadget weapon",
      },
      {
        name: "Kyle Pitts",
        positions: ["TE", "Slot WR"],
        note: "Move TE archetype",
      },
      {
        name: "Deion Sanders",
        positions: ["CB", "S", "PR"],
        note: "DB positional flex",
      },
    ],
  };
}

function PositionalFlexResult({ result }: { result: FlexResult }) {
  const tc = flexTierColor[result.versatility_tier] ?? T.accent;
  const shapMax = Math.max(
    ...result.shap_values.map((s) => Math.abs(s.contribution)),
  );
  const radarData = result.personnel_usage.map((p) => ({
    subject: p.package,
    value: p.snap_pct,
    fullMark: 100,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tier banner */}
      <div
        style={{
          background: `${tc}18`,
          border: `1px solid ${tc}`,
          borderRadius: "8px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: "10px",
              color: T.faint,
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            VERSATILITY TIER
          </div>
          <div
            style={{
              fontFamily: T.display,
              fontSize: "32px",
              letterSpacing: "3px",
              color: tc,
            }}
          >
            {result.versatility_tier.toUpperCase()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          <div style={{ fontFamily: T.mono, fontSize: "11px", color: T.muted }}>
            VERSATILITY INDEX
          </div>
          <div
            style={{
              fontFamily: T.display,
              fontSize: "42px",
              letterSpacing: "2px",
              color: tc,
              lineHeight: 1,
            }}
          >
            {result.versatility_score}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: "10px", color: T.faint }}>
            primary: {result.primary_position}
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Secondary positions */}
        <Card>
          <SectionLabel>Learnable Secondary Positions</SectionLabel>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {result.secondary_positions.map((s) => (
              <div key={s.position}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: T.display,
                        fontSize: "16px",
                        letterSpacing: "1px",
                        color: tc,
                      }}
                    >
                      {s.position}
                    </span>
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: "10px",
                        color: T.faint,
                        marginLeft: "10px",
                      }}
                    >
                      {s.role}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "13px",
                      color: "#fff",
                    }}
                  >
                    {s.probability}%
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: T.bgSurface,
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${s.probability}%`,
                      background: tc,
                      borderRadius: "4px",
                      boxShadow: `0 0 8px ${tc}80`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Personnel package usage radar */}
        <Card>
          <SectionLabel>Personnel Package Usage</SectionLabel>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke={tc}
                  fill={tc}
                  fillOpacity={0.18}
                  strokeWidth={2}
                  dot={{ fill: tc, r: 3 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* SHAP */}
      <Card>
        <SectionLabel>Feature Contributions (SHAP)</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          {result.shap_values.map((s) => (
            <div
              key={s.feature}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "11px",
                  color: T.muted,
                  width: "200px",
                  flexShrink: 0,
                }}
              >
                {s.feature}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "8px",
                  background: T.bgSurface,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(Math.abs(s.contribution) / shapMax) * 100}%`,
                    background: s.contribution >= 0 ? T.success : T.danger,
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "11px",
                  color: s.contribution >= 0 ? T.success : T.danger,
                  width: "48px",
                  textAlign: "right",
                }}
              >
                {s.contribution >= 0 ? "+" : ""}
                {s.contribution.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparables */}
      <Card>
        <SectionLabel>Historical Flex Comparables</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          {result.comparables.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: T.bgSurface,
                borderRadius: "6px",
                border: `1px solid ${T.border}`,
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: T.body,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {c.name}
                </span>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: "11px",
                    color: T.muted,
                    marginLeft: "10px",
                  }}
                >
                  {c.note}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {c.positions.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontFamily: T.mono,
                      fontSize: "10px",
                      color: tc,
                      border: `1px solid ${tc}`,
                      padding: "2px 7px",
                      borderRadius: "4px",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PositionalFlexPanel() {
  const [name, setName] = useState("");
  const [draftYear, setDraftYear] = useState("2024");
  const [result, setResult] = useState<FlexResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const res = await modelApi.predict({
        model: "positional_flexibility",
        inputs: {
          player_name: name,
          draft_year: parseInt(draftYear) || 2024,
        },
      });
      setResult(normalizeFlexResult(res as FlexApiResult));
    } catch {
      setResult(mockFlexResult("WR", 0.62));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ModelHeader
        title="POSITIONAL"
        accent="FLEXIBILITY"
        tag="XGBoost multi-label · secondary positions · personnel usage"
        desc="Multi-label XGBoost classifier predicting which secondary positions a prospect can viably play. Uses depth chart history, snap counts, and personnel package deployment from PBP data."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        <InputField
          label="Player Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Taysom Hill"
        />
        <InputField
          label="Draft Year"
          value={draftYear}
          onChange={setDraftYear}
          placeholder="2024"
          type="number"
        />
      </div>
      <RunButton onClick={run} loading={loading} />
      {result && <PositionalFlexResult result={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROSTER FIT
// ═══════════════════════════════════════════════════════════════════════════════

interface RosterFitResult {
  fit_score: number;
  fit_tier: string;
  dimensions: Array<{ name: string; player: number; team: number }>;
  top_fits: Array<{ team: string; score: number; reason: string }>;
  bottom_fits: Array<{ team: string; score: number; reason: string }>;
  key_alignments: Array<{
    factor: string;
    verdict: "Strong Fit" | "Neutral" | "Mismatch";
  }>;
}

function mockRosterFitResult(pos: string, team: string): RosterFitResult {
  const score = Math.round(35 + Math.random() * 60);
  const tier =
    score >= 80
      ? "Elite Fit"
      : score >= 62
        ? "Strong Fit"
        : score >= 44
          ? "Moderate"
          : "Poor Fit";
  return {
    fit_score: score,
    fit_tier: tier,
    dimensions: [
      {
        name: "Scheme Alignment",
        player: Math.round(50 + Math.random() * 45),
        team: Math.round(50 + Math.random() * 45),
      },
      {
        name: "Athletic Profile",
        player: Math.round(55 + Math.random() * 40),
        team: Math.round(55 + Math.random() * 40),
      },
      {
        name: "Role Availability",
        player: Math.round(40 + Math.random() * 55),
        team: Math.round(40 + Math.random() * 55),
      },
      {
        name: "Depth Chart Gap",
        player: Math.round(45 + Math.random() * 50),
        team: Math.round(45 + Math.random() * 50),
      },
      {
        name: "Cap / Contract Fit",
        player: Math.round(60 + Math.random() * 35),
        team: Math.round(60 + Math.random() * 35),
      },
    ],
    top_fits: [
      {
        team: "SF",
        score: 88,
        reason: "Shanahan's motion-heavy scheme matches athletic profile",
      },
      {
        team: "DET",
        score: 84,
        reason: "Deep chart vacancy + Ben Johnson's receiver usage",
      },
      {
        team: "PHI",
        score: 81,
        reason: "Physical scheme, high snap share potential",
      },
    ],
    bottom_fits: [
      {
        team: "NE",
        score: 34,
        reason: "Limited role clarity under new OC + depth concerns",
      },
      {
        team: "NYG",
        score: 38,
        reason: "Scheme mismatch — requires different athletic archetype",
      },
      {
        team: "CAR",
        score: 42,
        reason: "Roster already saturated at position group",
      },
    ],
    key_alignments: [
      {
        factor: "Run-after-catch scheme fit",
        verdict: score > 60 ? "Strong Fit" : "Neutral",
      },
      {
        factor: "Target volume opportunity",
        verdict:
          score > 70 ? "Strong Fit" : score > 45 ? "Neutral" : "Mismatch",
      },
      {
        factor: "Athletic comp to roster profile",
        verdict: score > 55 ? "Strong Fit" : "Neutral",
      },
      {
        factor: "Positional depth chart vacancy",
        verdict:
          score > 65 ? "Strong Fit" : score > 40 ? "Neutral" : "Mismatch",
      },
      { factor: "Rookie contract cap efficiency", verdict: "Strong Fit" },
    ],
  };
}

const fitTierColor: Record<string, string> = {
  "Elite Fit": "#00d4ff",
  "Strong Fit": "#00c48c",
  Moderate: "#f0b429",
  "Poor Fit": "#ff4d6d",
};
const verdictColor: Record<string, string> = {
  "Strong Fit": T.success,
  Neutral: T.gold,
  Mismatch: T.danger,
};

function RosterFitResult({ result }: { result: RosterFitResult }) {
  const tc = fitTierColor[result.fit_tier] ?? T.accent;
  const radarData = result.dimensions.map((d) => ({
    subject: d.name.split(" ")[0],
    player: d.player,
    team: d.team,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Fit score banner */}
      <div
        style={{
          background: `${tc}18`,
          border: `1px solid ${tc}`,
          borderRadius: "8px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: "10px",
              color: T.faint,
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            ROSTER FIT TIER
          </div>
          <div
            style={{
              fontFamily: T.display,
              fontSize: "32px",
              letterSpacing: "3px",
              color: tc,
            }}
          >
            {result.fit_tier.toUpperCase()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span
            style={{
              fontFamily: T.display,
              fontSize: "64px",
              letterSpacing: "2px",
              color: tc,
              lineHeight: 1,
            }}
          >
            {result.fit_score}
          </span>
          <span
            style={{ fontFamily: T.mono, fontSize: "12px", color: T.faint }}
          >
            /100
          </span>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Radar: player profile vs team profile */}
        <Card>
          <SectionLabel>Profile Match — Player vs Team</SectionLabel>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Player"
                  dataKey="player"
                  stroke={T.accent}
                  fill={T.accent}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Radar
                  name="Team"
                  dataKey="team"
                  stroke={T.gold}
                  fill={T.gold}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Tooltip
                  contentStyle={{
                    background: T.bgSurface,
                    border: `1px solid ${T.border}`,
                    fontFamily: T.mono,
                    fontSize: "11px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{ display: "flex", gap: "16px", justifyContent: "center" }}
          >
            {[
              { label: "Player", color: T.accent },
              { label: "Team Profile", color: T.gold },
            ].map((l) => (
              <div
                key={l.label}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{ width: "12px", height: "2px", background: l.color }}
                />
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: "10px",
                    color: T.muted,
                  }}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Key alignment verdicts */}
        <Card>
          <SectionLabel>Fit Breakdown</SectionLabel>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {result.key_alignments.map((a) => (
              <div
                key={a.factor}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: T.bgSurface,
                  borderRadius: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: T.body,
                    fontSize: "12px",
                    color: T.muted,
                  }}
                >
                  {a.factor}
                </span>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: "10px",
                    color: verdictColor[a.verdict],
                    border: `1px solid ${verdictColor[a.verdict]}`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {a.verdict}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top / bottom fit teams */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <Card>
          <SectionLabel>Best Team Fits</SectionLabel>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {result.top_fits.map((t) => (
              <div
                key={t.team}
                style={{
                  padding: "10px 14px",
                  background: `${T.success}12`,
                  border: `1px solid ${T.success}40`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.display,
                      fontSize: "18px",
                      letterSpacing: "1px",
                      color: T.success,
                    }}
                  >
                    {t.team}
                  </span>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "13px",
                      color: T.success,
                    }}
                  >
                    {t.score}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: T.body,
                    fontSize: "11px",
                    color: T.muted,
                    margin: 0,
                  }}
                >
                  {t.reason}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionLabel>Worst Team Fits</SectionLabel>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {result.bottom_fits.map((t) => (
              <div
                key={t.team}
                style={{
                  padding: "10px 14px",
                  background: `${T.danger}12`,
                  border: `1px solid ${T.danger}40`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.display,
                      fontSize: "18px",
                      letterSpacing: "1px",
                      color: T.danger,
                    }}
                  >
                    {t.team}
                  </span>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "13px",
                      color: T.danger,
                    }}
                  >
                    {t.score}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: T.body,
                    fontSize: "11px",
                    color: T.muted,
                    margin: 0,
                  }}
                >
                  {t.reason}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function RosterFitPanel() {
  const [name, setName] = useState("");
  const [pos, setPos] = useState("WR");
  const [team, setTeam] = useState("SF");
  const [year, setYear] = useState("2024");
  const [result, setResult] = useState<RosterFitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    const season = parseInt(year) || 2024;
    const normalizedTeam = team.trim().toUpperCase() || "SF";

    setLoading(true);
    try {
      const res = await modelApi.predict({
        model: "roster_fit",
        inputs: {
          name: name.trim(),
          position: pos,
          team: normalizedTeam,
          season,
        },
      });
      setResult(res as unknown as RosterFitResult);
    } catch {
      setResult(mockRosterFitResult(pos, normalizedTeam));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ModelHeader
        title="ROSTER"
        accent="FIT"
        tag="Cosine similarity + Ridge weights · fit score (0–100) · team matching"
        desc="Cosine similarity with Ridge-learned dimension weights comparing a prospect's athletic + scheme profile to each team's existing roster identity. Returns a 0–100 fit score, dimension radar, and league-wide team rankings."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "14px",
        }}
      >
        <InputField
          label="Player Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Travis Hunter"
        />
        <SelectField
          label="Position"
          value={pos}
          onChange={setPos}
          options={[
            "QB",
            "WR",
            "RB",
            "TE",
            "OT",
            "IOL",
            "EDGE",
            "DT",
            "LB",
            "CB",
            "S",
          ]}
        />
        <InputField
          label="Target Team"
          value={team}
          onChange={setTeam}
          placeholder="SF"
        />
        <InputField
          label="Year"
          value={year}
          onChange={setYear}
          placeholder="2024"
          type="number"
        />
      </div>
      <RunButton onClick={run} loading={loading} />
      {result && <RosterFitResult result={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM DIAGNOSIS
// ═══════════════════════════════════════════════════════════════════════════════

interface TeamDiagnosisResult {
  team: string;
  season: number;
  overall_weakness: number;
  position_scores: Array<{
    group: string;
    weakness: number;
    epa: number;
    rank: number;
  }>;
  radar_data: Array<{ subject: string; weakness: number }>;
  top_needs: Array<{
    priority: number;
    group: string;
    diagnosis: string;
    draft_urgency: "Critical" | "High" | "Medium" | "Low";
  }>;
  shap_values: Array<{ feature: string; contribution: number }>;
}

const urgencyColor: Record<string, string> = {
  Critical: T.danger,
  High: T.warn,
  Medium: T.gold,
  Low: T.success,
};

function mockTeamDiagnosisResult(
  team: string,
  year: number,
): TeamDiagnosisResult {
  const groups = ["QB", "Skill (WR/RB/TE)", "OL", "DL", "LB", "DB"];
  const scores = groups
    .map((group) => ({
      group,
      weakness: Math.round(Math.random() * 90 + 5) / 100,
      epa: Math.round((Math.random() - 0.5) * 20 * 10) / 10,
      rank: Math.round(1 + Math.random() * 31),
    }))
    .sort((a, b) => b.weakness - a.weakness);

  const radarData = scores.map((s) => ({
    subject: s.group.split(" ")[0],
    weakness: Math.round(s.weakness * 100),
  }));

  const urgencies: Array<"Critical" | "High" | "Medium" | "Low"> = [
    "Critical",
    "High",
    "Medium",
    "Low",
  ];
  const diagnosisMap: Record<string, string[]> = {
    QB: [
      "Starter aging curve concerns",
      "Limited depth behind starter",
      "No established bridge QB",
    ],
    "Skill (WR/RB/TE)": [
      "Top receiver departed in free agency",
      "Below-average YPRR league-wide",
      "Thin depth after WR1",
    ],
    OL: [
      "Interior pass-pro ranking bottom-10",
      "Aging starter at LG/RG",
      "Limited swing tackle depth",
    ],
    DL: [
      "Interior run-stop rate below average",
      "Pass rush win rate ranks 28th",
      "Aging edge presence",
    ],
    LB: [
      "Coverage LB exposure in slot",
      "Run-fill grade below average",
      "Limited depth after injury",
    ],
    DB: [
      "CB2/CB3 below-average PFF grades",
      "Safety over-age and limited range",
      "High opposing target share",
    ],
  };

  const topNeeds = scores.slice(0, 4).map((s, i) => ({
    priority: i + 1,
    group: s.group,
    diagnosis: (diagnosisMap[s.group] ?? ["Positional weakness identified"])[
      i % 3
    ],
    draft_urgency:
      s.weakness >= 0.7
        ? "Critical"
        : s.weakness >= 0.5
          ? "High"
          : s.weakness >= 0.3
            ? "Medium"
            : ("Low" as "Critical" | "High" | "Medium" | "Low"),
  }));

  return {
    team,
    season: year,
    overall_weakness: Math.round(
      (scores.reduce((a, b) => a + b.weakness, 0) / scores.length) * 100,
    ),
    position_scores: scores,
    radar_data: radarData,
    top_needs: topNeeds,
    shap_values: [
      { feature: "EPA/play vs league avg", contribution: -12.4 },
      { feature: "Snap count turnover rate", contribution: 9.7 },
      { feature: "PFF grade differential", contribution: 8.1 },
      { feature: "Positional cap spend", contribution: -6.3 },
      { feature: "Depth chart age curve", contribution: 7.2 },
      { feature: "Injury-adjusted snaps", contribution: 5.8 },
    ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
  };
}

function TeamDiagnosisResultPanel({ result }: { result: TeamDiagnosisResult }) {
  const shapMax = Math.max(
    ...result.shap_values.map((s) => Math.abs(s.contribution)),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "20px",
          alignItems: "center",
          background: T.bgEl,
          border: `1px solid ${T.border}`,
          borderRadius: "8px",
          padding: "16px 20px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: "10px",
              color: T.faint,
              letterSpacing: "2px",
            }}
          >
            TEAM DIAGNOSIS — {result.season}
          </div>
          <div
            style={{
              fontFamily: T.display,
              fontSize: "42px",
              letterSpacing: "4px",
              color: T.accent,
              lineHeight: 1.1,
            }}
          >
            {result.team}
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: "12px",
              color: T.muted,
              marginTop: "4px",
            }}
          >
            Overall roster weakness index
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: T.display,
              fontSize: "72px",
              letterSpacing: "2px",
              color: weaknessColor(result.overall_weakness / 100),
              lineHeight: 1,
            }}
          >
            {result.overall_weakness}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: "10px", color: T.faint }}>
            /100 weakness
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Positional weakness radar */}
        <Card>
          <SectionLabel>Positional Weakness Radar</SectionLabel>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={result.radar_data}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="weakness"
                  stroke={T.danger}
                  fill={T.danger}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ fill: T.danger, r: 3 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Positional group scores */}
        <Card>
          <SectionLabel>Position Group Scores</SectionLabel>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "6px",
            }}
          >
            {result.position_scores.map((s) => (
              <div key={s.group}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: "11px",
                      color: T.muted,
                    }}
                  >
                    {s.group}
                  </span>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: "10px",
                        color: T.faint,
                      }}
                    >
                      Rank #{s.rank}
                    </span>
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: "10px",
                        color: s.epa >= 0 ? T.success : T.danger,
                      }}
                    >
                      EPA {s.epa >= 0 ? "+" : ""}
                      {s.epa}
                    </span>
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: "11px",
                        color: weaknessColor(s.weakness),
                      }}
                    >
                      {Math.round(s.weakness * 100)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: "6px",
                    background: T.bgSurface,
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${s.weakness * 100}%`,
                      background: weaknessColor(s.weakness),
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Draft priorities */}
      <Card>
        <SectionLabel>Draft Priority Diagnosis</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          {result.top_needs.map((n) => {
            const uc = urgencyColor[n.draft_urgency];
            return (
              <div
                key={n.group}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 140px 1fr auto",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  background: `${uc}10`,
                  border: `1px solid ${uc}40`,
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{ fontFamily: T.display, fontSize: "22px", color: uc }}
                >
                  {n.priority}
                </span>
                <span
                  style={{
                    fontFamily: T.display,
                    fontSize: "16px",
                    letterSpacing: "1px",
                    color: uc,
                  }}
                >
                  {n.group}
                </span>
                <span
                  style={{
                    fontFamily: T.body,
                    fontSize: "12px",
                    color: T.muted,
                  }}
                >
                  {n.diagnosis}
                </span>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: "10px",
                    color: uc,
                    border: `1px solid ${uc}`,
                    padding: "3px 10px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.draft_urgency}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* SHAP */}
      <Card>
        <SectionLabel>Diagnosis Feature Contributions (SHAP)</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          {result.shap_values.map((s) => (
            <div
              key={s.feature}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "11px",
                  color: T.muted,
                  width: "220px",
                  flexShrink: 0,
                }}
              >
                {s.feature}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "8px",
                  background: T.bgSurface,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(Math.abs(s.contribution) / shapMax) * 100}%`,
                    background: s.contribution >= 0 ? T.success : T.danger,
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: "11px",
                  color: s.contribution >= 0 ? T.success : T.danger,
                  width: "48px",
                  textAlign: "right",
                }}
              >
                {s.contribution >= 0 ? "+" : ""}
                {s.contribution.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TeamDiagnosisPanel() {
  const [team, setTeam] = useState("DAL");
  const [year, setYear] = useState("2024");
  const [result, setResult] = useState<TeamDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    const normalizedTeam = team.trim().toUpperCase() || "DAL";
    const season = parseInt(year) || 2024;

    setError(null);
    setLoading(true);
    try {
      const teamStats = await dataLake.teamStats(normalizedTeam, season, season);
      const teamStatsDf = teamStats.map((row) => ({
        ...row,
        season: row.year,
      }));

      if (teamStatsDf.length === 0) {
        throw new Error(`No team stats found for ${normalizedTeam} in ${season}.`);
      }

      const res = await modelApi.predict({
        model: "team_diagnosis",
        inputs: {
          team: normalizedTeam,
          season,
          team_stats_df: teamStatsDf,
        },
      });
      setResult(res as unknown as TeamDiagnosisResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to run diagnosis.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ModelHeader
        title="TEAM"
        accent="DIAGNOSIS"
        tag="Multi-task XGBoost · positional weakness 0–1 · EPA/WPA · SHAP"
        desc="Multi-task XGBoost model scoring each positional group's weakness (0–1) using snap counts, EPA/WPA, PFF grades, depth chart age, and contract data. Outputs a prioritized draft needs list with urgency ratings."
      />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
      >
        <InputField
          label="Team Abbreviation"
          value={team}
          onChange={(value) => {
            setTeam(value);
            if (error) setError(null);
          }}
          placeholder="DAL"
        />
        <InputField
          label="Season"
          value={year}
          onChange={(value) => {
            setYear(value);
            if (error) setError(null);
          }}
          placeholder="2024"
          type="number"
        />
      </div>
      {error && (
        <div
          style={{
            color: T.danger,
            fontFamily: T.body,
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}
      <RunButton onClick={run} loading={loading} label="RUN DIAGNOSIS" />
      {result && <TeamDiagnosisResultPanel result={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ModelHeader
// ═══════════════════════════════════════════════════════════════════════════════

function ModelHeader({
  title,
  accent,
  tag,
  desc,
}: {
  title: string;
  accent: string;
  tag: string;
  desc: string;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: T.display,
          fontSize: "26px",
          letterSpacing: "3px",
          lineHeight: 1,
        }}
      >
        {title} <span style={{ color: T.accent }}>{accent}</span>
      </h2>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: "10px",
          color: T.faint,
          letterSpacing: "1px",
          marginTop: "4px",
        }}
      >
        {tag}
      </div>
      <p
        style={{
          color: T.muted,
          marginTop: "8px",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type ModelKey =
  | "player_projection"
  | "health_analyzer"
  | "draft_optimizer"
  | "positional_flexibility"
  | "roster_fit"
  | "team_diagnosis";

const MODELS: Array<{
  key: ModelKey;
  label: string;
  tag: string;
  group: string;
}> = [
  {
    key: "player_projection",
    label: "Player Projection",
    tag: "XGBoost · car_av",
    group: "Player",
  },
  {
    key: "health_analyzer",
    label: "Health Analyzer",
    tag: "Cox PH · survival",
    group: "Player",
  },
  {
    key: "positional_flexibility",
    label: "Positional Flexibility",
    tag: "XGBoost multi-label",
    group: "Player",
  },
  {
    key: "roster_fit",
    label: "Roster Fit",
    tag: "Cosine sim · fit score",
    group: "Team",
  },
  {
    key: "draft_optimizer",
    label: "Draft Optimizer",
    tag: "CVXPY · pick value",
    group: "Team",
  },
  {
    key: "team_diagnosis",
    label: "Team Diagnosis",
    tag: "Multi-task XGBoost",
    group: "Team",
  },
];

export default function ModelsPage() {
  const [active, setActive] = useState<ModelKey>("player_projection");

  const playerModels = MODELS.filter((m) => m.group === "Player");
  const teamModels = MODELS.filter((m) => m.group === "Team");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        fontFamily: T.body,
        color: "#fff",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: T.display,
            fontSize: "42px",
            letterSpacing: "3px",
            lineHeight: 1,
          }}
        >
          MODEL <span style={{ color: T.accent }}>RUNNER</span>
        </h1>
        <p style={{ color: T.muted, marginTop: "8px", fontSize: "13px" }}>
          Run predictions against the model platform API on :8001
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { label: "PLAYER MODELS", items: playerModels },
            { label: "TEAM MODELS", items: teamModels },
          ].map((group) => (
            <div key={group.label} style={{ marginBottom: "10px" }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: "9px",
                  letterSpacing: "2px",
                  color: T.faint,
                  padding: "4px 6px",
                  marginBottom: "4px",
                }}
              >
                {group.label}
              </div>
              {group.items.map((m) => {
                const isActive = active === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setActive(m.key)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background: isActive ? T.accentDim : "transparent",
                      border: `1px solid ${isActive ? T.accent : "transparent"}`,
                      borderRadius: "7px",
                      color: isActive ? T.accent : T.muted,
                      fontFamily: T.body,
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          T.bgEl;
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                        (e.currentTarget as HTMLElement).style.color = T.muted;
                      }
                    }}
                  >
                    {m.label}
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: "9px",
                        color: isActive ? T.accent : T.faint,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {m.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Panel */}
        <div
          style={{
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: "12px",
            padding: "28px",
          }}
        >
          {active === "player_projection" && <PlayerProjectionPanel />}
          {active === "health_analyzer" && <HealthAnalyzerPanel />}
          {active === "draft_optimizer" && <DraftOptimizerPanel />}
          {active === "positional_flexibility" && <PositionalFlexPanel />}
          {active === "roster_fit" && <RosterFitPanel />}
          {active === "team_diagnosis" && <TeamDiagnosisPanel />}
        </div>
      </div>
    </div>
  );
}
