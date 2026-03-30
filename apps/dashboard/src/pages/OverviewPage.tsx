import { useApiHealth } from "../hooks/useApiHealth";

const MODELS = [
  { name: "Player Projection",      key: "player_projection",      status: "ready" },
  { name: "Draft Optimizer",        key: "draft_optimizer",        status: "pending" },
  { name: "Team Diagnosis",         key: "team_diagnosis",         status: "pending" },
  { name: "Career Simulator",       key: "career_simulator",       status: "pending" },
  { name: "Roster Fit",             key: "roster_fit",             status: "pending" },
  { name: "Positional Flexibility", key: "positional_flexibility", status: "pending" },
  { name: "Health Analyzer",        key: "health_analyzer",        status: "pending" },
];

export default function OverviewPage() {
  const { dataLakeOk, modelsOk } = useApiHealth();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "42px",
          letterSpacing: "3px",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}>
          SCOUT <span style={{ color: "var(--accent)" }}>OVERVIEW</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          NFL draft intelligence platform — data lake, ML models, NullClaw assistant
        </p>
      </div>

      {/* Service status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <ServiceCard
          label="Data Lake"
          description="DuckDB · Neo4j · FastAPI"
          port={8000}
          ok={dataLakeOk}
        />
        <ServiceCard
          label="Model Platform"
          description="7 ML models · FastAPI"
          port={8001}
          ok={modelsOk}
        />
        <ServiceCard
          label="NullClaw"
          description="Claude assistant · tool routing"
          port={8001}
          ok={modelsOk}
          sub
        />
      </div>

      {/* Model registry */}
      <section>
        <SectionHeader title="Model Registry" count={MODELS.length} />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "12px",
          marginTop: "16px",
        }}>
          {MODELS.map((m) => (
            <ModelCard key={m.key} {...m} />
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section>
        <SectionHeader title="Data Flow" />
        <div style={{
          marginTop: "16px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-muted)",
          lineHeight: 2,
        }}>
          <FlowRow nodes={["Sources (.xls / .csv)", "Ingestion pipeline", "Raw lake"]} />
          <FlowRow nodes={["Raw lake", "Staged (Parquet)", "Curated (Parquet)"]} indent />
          <FlowRow nodes={["Curated", "DuckDB SQL  ·  Neo4j Graph"]} indent />
          <FlowRow nodes={["DuckDB · Neo4j", "FastAPI :8000", "Dashboard :3000"]} indent />
          <FlowRow nodes={["FastAPI :8000", "Model Platform :8001", "NullClaw"]} indent />
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceCard({
  label, description, port, ok, sub,
}: {
  label: string;
  description: string;
  port: number;
  ok: boolean | null;
  sub?: boolean;
}) {
  const color =
    ok === null ? "var(--text-faint)" :
    ok          ? "var(--success)"    :
                  "var(--danger)";

  const statusText =
    ok === null ? "checking…" :
    ok          ? "online"    :
                  "offline";

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${ok ? "var(--border)" : ok === false ? "var(--danger)" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", letterSpacing: "1px" }}>
          {label}
        </span>
        <span style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color,
          border: `1px solid ${color}`,
          borderRadius: "4px",
          padding: "2px 7px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          {statusText}
        </span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{description}</p>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)" }}>
        :{port}{sub ? " (sub-service)" : ""}
      </span>
    </div>
  );
}

function ModelCard({
  name, status,
}: {
  name: string;
  status: "ready" | "pending";
}) {
  const isReady = status === "ready";
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${isReady ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: isReady ? "0 0 16px var(--accent-dim)" : "none",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 500 }}>{name}</span>
      <span style={{
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: isReady ? "var(--accent)" : "var(--text-faint)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {isReady ? "✓ ready" : "pending"}
      </span>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: "20px",
        letterSpacing: "2px",
        color: "var(--text-muted)",
      }}>
        {title}
      </h2>
      {count !== undefined && (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text-faint)",
        }}>
          {count} items
        </span>
      )}
    </div>
  );
}

function FlowRow({ nodes, indent }: { nodes: string[]; indent?: boolean }) {
  return (
    <div style={{ paddingLeft: indent ? "16px" : 0, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      {indent && <span style={{ color: "var(--border)" }}>└─</span>}
      {nodes.map((n, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: i === 0 ? "var(--text-muted)" : "var(--accent)", fontWeight: i > 0 ? 600 : 400 }}>
            {n}
          </span>
          {i < nodes.length - 1 && <span style={{ color: "var(--text-faint)" }}>→</span>}
        </span>
      ))}
    </div>
  );
}
