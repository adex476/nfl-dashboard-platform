interface StatBlockProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatBlock({ label, value, sub, accent }: StatBlockProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "32px",
          letterSpacing: "1px",
          lineHeight: 1,
          color: accent ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{sub}</span>
      )}
    </div>
  );
}
