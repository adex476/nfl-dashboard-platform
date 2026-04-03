import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "accent" | "gold" | "danger" | "success";
}

const colors: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "var(--text-muted)",
  accent: "var(--accent)",
  gold: "var(--accent-gold)",
  danger: "var(--danger)",
  success: "var(--success)",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const color = colors[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.5px",
        fontFamily: "var(--font-mono)",
        color,
        border: `1px solid ${color}`,
        background: `${color}18`,
      }}
    >
      {children}
    </span>
  );
}
