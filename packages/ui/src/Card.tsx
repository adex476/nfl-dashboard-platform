import type { ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  accent?: boolean;
}

export function Card({ children, style, accent }: CardProps) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        boxShadow: accent ? "0 0 24px var(--accent-dim)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
