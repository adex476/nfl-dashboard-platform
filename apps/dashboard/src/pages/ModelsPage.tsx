import { useState } from "react";
import type { ModelName, PredictionResult } from "@nfl/types";
import { modelApi } from "@nfl/api-client";

interface ModelDef {
  name: ModelName;
  label: string;
  description: string;
  fields: Array<{ key: string; label: string; type: "text" | "number"; placeholder?: string }>;
}

const MODELS: ModelDef[] = [
  {
    name: "player_projection",
    label: "Player Projection",
    description: "Predict career value score from combine + draft context.",
    fields: [
      { key: "player_name", label: "Player Name",   type: "text",   placeholder: "e.g. Travis Hunter" },
      { key: "position",    label: "Position",      type: "text",   placeholder: "WR" },
      { key: "forty",       label: "40-Yard Dash",  type: "number", placeholder: "4.35" },
      { key: "draft_round", label: "Draft Round",   type: "number", placeholder: "1" },
      { key: "draft_pick",  label: "Draft Pick #",  type: "number", placeholder: "2" },
    ],
  },
  {
    name: "health_analyzer",
    label: "Health Analyzer",
    description: "Estimate injury risk probability using Cox PH model.",
    fields: [
      { key: "player_name",    label: "Player Name",        type: "text",   placeholder: "e.g. Travis Hunter" },
      { key: "position",       label: "Position",           type: "text",   placeholder: "WR" },
      { key: "injury_count",   label: "Career Injuries",    type: "number", placeholder: "2" },
      { key: "snaps_per_game", label: "Snaps / Game",       type: "number", placeholder: "52" },
    ],
  },
  {
    name: "draft_optimizer",
    label: "Draft Optimizer",
    description: "CVXPY constrained optimizer for pick value + team needs.",
    fields: [
      { key: "team",           label: "Team Abbr",    type: "text",   placeholder: "DAL" },
      { key: "pick_number",    label: "Pick Number",  type: "number", placeholder: "12" },
      { key: "needs",          label: "Position Need",type: "text",   placeholder: "WR,EDGE" },
    ],
  },
];

export default function ModelsPage() {
  const [active, setActive]   = useState<ModelDef>(MODELS[0]);
  const [inputs, setInputs]   = useState<Record<string, string>>({});
  const [result, setResult]   = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsed: Record<string, unknown> = {};
      for (const f of active.fields) {
        const v = inputs[f.key] ?? "";
        parsed[f.key] = f.type === "number" ? parseFloat(v) : v;
      }
      const res = await modelApi.predict({ model: active.name, inputs: parsed });
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleModelSwitch = (m: ModelDef) => {
    setActive(m);
    setInputs({});
    setResult(null);
    setError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "42px", letterSpacing: "3px", lineHeight: 1 }}>
          MODEL <span style={{ color: "var(--accent)" }}>RUNNER</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          Run predictions against the model platform API on :8001
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
        {/* Model selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {MODELS.map((m) => (
            <button
              key={m.name}
              onClick={() => handleModelSwitch(m)}
              style={{
                padding: "12px 14px",
                textAlign: "left",
                background: active.name === m.name ? "var(--accent-dim)" : "var(--bg-surface)",
                border: `1px solid ${active.name === m.name ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius)",
                color: active.name === m.name ? "var(--accent)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              {m.label}
            </button>
          ))}
          <p style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
          }}>
            + 4 models pending
          </p>
        </div>

        {/* Run panel */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "1px" }}>
              {active.label}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              {active.description}
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
            {active.fields.map((f) => (
              <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                  {f.label}
                </span>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={inputs[f.key] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </label>
            ))}
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              alignSelf: "flex-start",
              background: loading ? "var(--bg-elevated)" : "var(--accent)",
              color: loading ? "var(--text-faint)" : "var(--bg-base)",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.5px",
              fontFamily: "var(--font-body)",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Running…" : "Run Prediction"}
          </button>

          {/* Result */}
          {error && (
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--radius)",
              padding: "14px 16px",
              color: "var(--danger)",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 0 20px var(--accent-dim)",
            }}>
              <div style={{ display: "flex", gap: "32px" }}>
                <Metric label="Score"      value={result.score.toFixed(3)} accent />
                <Metric label="Confidence" value={`${(result.confidence * 100).toFixed(1)}%`} />
                <Metric label="Model"      value={result.model} mono />
              </div>
              {result.shap_values && (
                <ShapChart shap={result.shap_values} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>
      <span style={{
        fontFamily: accent ? "var(--font-display)" : mono ? "var(--font-mono)" : "var(--font-body)",
        fontSize: accent ? "28px" : "16px",
        color: accent ? "var(--accent)" : "var(--text-primary)",
        letterSpacing: accent ? "1px" : 0,
      }}>{value}</span>
    </div>
  );
}

function ShapChart({ shap }: { shap: Record<string, number> }) {
  const entries = Object.entries(shap).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8);
  const max = Math.max(...entries.map(([, v]) => Math.abs(v)));
  return (
    <div>
      <p style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
        SHAP Feature Importance
      </p>
      {entries.map(([feat, val]) => (
        <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", width: "160px", flexShrink: 0 }}>
            {feat}
          </span>
          <div style={{ flex: 1, height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              width: `${(Math.abs(val) / max) * 100}%`,
              height: "100%",
              background: val > 0 ? "var(--success)" : "var(--danger)",
              borderRadius: "3px",
            }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: val > 0 ? "var(--success)" : "var(--danger)", width: "52px", textAlign: "right" }}>
            {val > 0 ? "+" : ""}{val.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}
