import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";
import { useApiHealth } from "../../hooks/useApiHealth";
import styles from "./AppShell.module.css";

const NAV = [
  { to: "/overview", label: "Overview", icon: "◈" },
  { to: "/players", label: "Players", icon: "◉" },
  { to: "/models", label: "Models", icon: "◆" },
  { to: "/nanoclaw", label: "NanoClaw", icon: "✦" },
  { to: "/query", label: "SQL Query", icon: "⌘" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { dataLakeOk, modelsOk, nanoClawOk } = useApiHealth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.logo}>
          {!collapsed && <span className={styles.logoAccent}>NFL</span>}
          {!collapsed && <span className={styles.logoSub}>SCOUT</span>}
          {collapsed && <span className={styles.logoAccentSmall}>N</span>}
        </div>

        {!collapsed && <DemoModeBanner />}

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ""} ${collapsed ? styles.navItemCollapsed : ""}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className={styles.sidebarFooter}>
            <p className={styles.footerLabel}>Services</p>
            <StatusRow label="Data Lake" port={8000} ok={dataLakeOk} />
            <StatusRow label="Models" port={8001} ok={modelsOk} />
            <StatusRow label="NanoClaw" port={8002} ok={nanoClawOk} />
          </div>
        )}

        <button
          className={styles.toggleBtn}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </aside>

      <main className={styles.main}>
        <div className="fade-in">{children}</div>
      </main>

      <button
        className={styles.nanoclawFab}
        onClick={() => navigate("/nanoclaw")}
        title="Open NanoClaw"
      >
        🤖
      </button>
    </div>
  );
}

function DemoModeBanner() {
  const { isDemoMode } = useApiHealth();
  if (!isDemoMode) return null;

  return (
    <div
      style={{
        margin: "12px 0",
        padding: "10px 14px",
        background: "rgba(240, 180, 41, 0.12)",
        border: "1px solid var(--accent-gold)",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "16px" }}>⚡</span>
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: "var(--accent-gold)",
            textTransform: "uppercase",
          }}
        >
          Demo Mode
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "2px",
          }}
        >
          Showing sample data — live API pending
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  port,
  ok,
}: {
  label: string;
  port: number;
  ok: boolean | null;
}) {
  const color =
    ok === null ? "var(--text-faint)" : ok ? "var(--success)" : "var(--danger)";

  return (
    <div className={styles.statusRow}>
      <span
        className={styles.statusDot}
        style={{
          background: color,
          boxShadow: ok ? `0 0 6px ${color}` : "none",
        }}
      />
      <span className={styles.statusLabel}>{label}</span>
      <span className={styles.statusPort}>:{port}</span>
    </div>
  );
}
