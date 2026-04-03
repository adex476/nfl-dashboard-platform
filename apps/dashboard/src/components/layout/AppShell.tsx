import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useApiHealth } from "../../hooks/useApiHealth";
import styles from "./AppShell.module.css";

const NAV = [
  { to: "/overview", label: "Overview",  icon: "◈" },
  { to: "/players",  label: "Players",   icon: "◉" },
  { to: "/models",   label: "Models",    icon: "◆" },
  { to: "/nanoclaw", label: "NanoClaw",  icon: "✦" },
  { to: "/query",    label: "SQL Query", icon: "⌘" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { dataLakeOk, modelsOk, nanoClawOk } = useApiHealth();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>NFL</span>
          <span className={styles.logoSub}>SCOUT</span>
        </div>

        <DemoModeBanner />

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ""}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.footerLabel}>Services</p>
          <StatusRow label="Data Lake" port={8000} ok={dataLakeOk} />
          <StatusRow label="Models"    port={8001} ok={modelsOk} />
          <StatusRow label="NanoClaw"  port={8002} ok={nanoClawOk} />
        </div>
      </aside>

      <main className={styles.main}>
        <div className="fade-in">{children}</div>
      </main>
    </div>
  );
}

function DemoModeBanner() {
  const { isDemoMode } = useApiHealth();
  if (!isDemoMode) return null;

  return (
    <div style={{
      margin: "12px 0",
      padding: "10px 14px",
      background: "rgba(240, 180, 41, 0.12)",
      border: "1px solid var(--accent-gold)",
      borderRadius: "var(--radius)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      <span style={{ fontSize: "16px" }}>⚡</span>
      <div>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "1px",
          color: "var(--accent-gold)",
          textTransform: "uppercase",
        }}>
          Demo Mode
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          Showing sample data — live API pending
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, port, ok }: { label: string; port: number; ok: boolean | null }) {
  const color =
    ok === null ? "var(--text-faint)" :
    ok          ? "var(--success)"    :
                  "var(--danger)";

  return (
    <div className={styles.statusRow}>
      <span className={styles.statusDot} style={{ background: color, boxShadow: ok ? `0 0 6px ${color}` : "none" }} />
      <span className={styles.statusLabel}>{label}</span>
      <span className={styles.statusPort}>:{port}</span>
    </div>
  );
}
