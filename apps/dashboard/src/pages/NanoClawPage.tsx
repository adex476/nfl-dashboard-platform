import { useState, useRef, useEffect, useCallback } from "react";
import type { NanoClawMessage, Visualization, AwaitingConfirmation, ConfirmedTool } from "@nfl/types";
import { nanoClawApi } from "@nfl/api-client";
import { useDashboard } from "../context/DashboardContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type StreamState = "idle" | "streaming" | "tool_active" | "confirming" | "done";

interface ToolBadge {
  name: string;
  status: "pending" | "ok" | "error";
}

interface AssistantTurn {
  text: string;
  visualizations: Visualization[];
  toolsBadges: ToolBadge[];
}

const SUGGESTIONS = [
  "Project Travis Hunter's career value score",
  "Which position has the highest injury risk?",
  "Optimize the first pick for a team needing WR and EDGE",
  "Compare two QBs from the 2025 class",
];

// ─── Session cache (survives tab switches / component unmount) ────────────────

interface SessionCache {
  sessionId: string;
  messages: NanoClawMessage[];
  turns: (NanoClawMessage | AssistantTurn)[];
}

const sessionCache: SessionCache = {
  sessionId: crypto.randomUUID(),
  messages: [],
  turns: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NanoClawPage() {
  const { dispatchAction } = useDashboard();

  const [messages, setMessages] = useState<NanoClawMessage[]>(() => sessionCache.messages);
  const [turns, setTurns] = useState<(NanoClawMessage | AssistantTurn)[]>(() => sessionCache.turns);
  const [input, setInput] = useState("");
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [activeBadges, setActiveBadges] = useState<ToolBadge[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<AwaitingConfirmation | null>(null);
  const [streamingText, setStreamingText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(sessionCache.sessionId);
  // keep a ref to abort controller so we can cancel if needed
  const abortRef = useRef<AbortController | null>(null);

  // Sync state back to cache so it survives unmount
  useEffect(() => { sessionCache.messages = messages; }, [messages]);
  useEffect(() => { sessionCache.turns = turns; }, [turns]);

  // Abort any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, streamingText, activeBadges, streamState]);

  const runStream = useCallback(
    async (history: NanoClawMessage[], confirmed?: ConfirmedTool | null) => {
      setStreamState("streaming");
      setStreamingText("");
      setActiveBadges([]);

      try {
        const gen = nanoClawApi.chatStream(sessionId.current, history, confirmed);

        for await (const event of gen) {
          switch (event.type) {
            case "text_delta":
              setStreamingText((t) => t + event.content);
              break;

            case "tool_call":
              setStreamState("tool_active");
              setActiveBadges((prev) => [...prev, { name: event.name, status: "pending" }]);
              break;

            case "tool_result":
              setStreamState("streaming");
              setActiveBadges((prev) =>
                prev.map((b) => (b.name === event.name ? { ...b, status: event.status } : b)),
              );
              break;

            case "ui_action":
              try {
                dispatchAction(event.action, event.payload);
              } catch (e) {
                console.warn("ui_action handler error:", e);
              }
              break;

            case "done": {
              const assistantTurn: AssistantTurn = {
                text: event.message.content,
                visualizations: event.visualizations,
                toolsBadges: activeBadges,
              };
              setMessages((prev) => [...prev, event.message]);
              setTurns((prev) => [...prev, event.message]);
              setStreamingText("");
              setActiveBadges([]);

              if (event.awaiting_confirmation) {
                setPendingConfirm(event.awaiting_confirmation);
                setStreamState("confirming");
              } else {
                // replace the streaming turn with the final one
                setTurns((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = assistantTurn;
                  return next;
                });
                setStreamState("done");
                setTimeout(() => setStreamState("idle"), 100);
              }
              break;
            }

            case "error":
              setTurns((prev) => [
                ...prev,
                { text: `⚠ ${event.content}`, visualizations: [], toolsBadges: [] },
              ]);
              setStreamingText("");
              setActiveBadges([]);
              setStreamState("idle");
              break;
          }
        }
      } catch (e) {
        setTurns((prev) => [
          ...prev,
          {
            text: `⚠ Could not reach agent: ${String(e)}`,
            visualizations: [],
            toolsBadges: [],
          },
        ]);
        setStreamingText("");
        setActiveBadges([]);
        setStreamState("idle");
      }
    },
    [dispatchAction, activeBadges],
  );

  const send = async (text: string) => {
    if (!text.trim() || streamState !== "idle") return;
    const userMsg: NanoClawMessage = { role: "user", content: text.trim() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setTurns((prev) => [...prev, userMsg]);
    setInput("");
    await runStream(nextHistory);
  };

  const handleConfirm = async (approved: boolean) => {
    if (!pendingConfirm) return;
    const confirmed = approved ? { tool: pendingConfirm.tool, args: pendingConfirm.args } : null;
    setPendingConfirm(null);
    if (approved) {
      await runStream(messages, confirmed);
    } else {
      setStreamState("idle");
    }
  };

  const isLoading = streamState === "streaming" || streamState === "tool_active";

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
          NULL<span style={{ color: "var(--accent)" }}>CLAW</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          AI draft analyst · powered by NanoClaw
        </p>
      </div>

      {/* Suggestions */}
      {turns.length === 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "6px 12px",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Message history */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minHeight: "200px",
        }}
      >
        {turns.map((turn, i) => {
          // User message
          if ("role" in turn && turn.role === "user") {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={bubbleStyle("user")}>{turn.content}</div>
              </div>
            );
          }

          // Assistant turn (with visualizations)
          const t = turn as AssistantTurn;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {t.toolsBadges.length > 0 && <ToolBadgeRow badges={t.toolsBadges} />}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={bubbleStyle("assistant")}>{t.text}</div>
              </div>
              {t.visualizations.length > 0 && <VizList vizs={t.visualizations} />}
            </div>
          );
        })}

        {/* Streaming in-progress */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeBadges.length > 0 && <ToolBadgeRow badges={activeBadges} />}
            {streamingText ? (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ ...bubbleStyle("assistant"), borderColor: "var(--accent)" }}>
                  {streamingText}
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "14px",
                      background: "var(--accent)",
                      marginLeft: "2px",
                      verticalAlign: "middle",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                </div>
              </div>
            ) : activeBadges.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-faint)",
                  }}
                >
                  thinking…
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Supervised tool confirmation */}
        {streamState === "confirming" && pendingConfirm && (
          <ConfirmDialog pending={pendingConfirm} onConfirm={handleConfirm} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "8px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          placeholder="Ask NanoClaw anything about the draft…"
          disabled={streamState !== "idle"}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            padding: "4px 8px",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={streamState !== "idle" || !input.trim()}
          style={{
            background:
              streamState !== "idle" || !input.trim()
                ? "var(--bg-elevated)"
                : "var(--accent)",
            color:
              streamState !== "idle" || !input.trim()
                ? "var(--text-faint)"
                : "var(--bg-base)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "6px 16px",
            fontWeight: 700,
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            cursor: streamState !== "idle" || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          Send
        </button>
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function bubbleStyle(role: "user" | "assistant"): React.CSSProperties {
  return {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "var(--radius-lg)",
    background: role === "user" ? "var(--accent)" : "var(--bg-surface)",
    color: role === "user" ? "var(--bg-base)" : "var(--text-primary)",
    border: role === "assistant" ? "1px solid var(--border)" : "none",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  };
}

function ToolBadgeRow({ badges }: { badges: ToolBadge[] }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingLeft: "4px" }}>
      {badges.map((b, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "var(--radius)",
            background: "var(--bg-elevated)",
            border: `1px solid ${
              b.status === "pending"
                ? "var(--border)"
                : b.status === "ok"
                  ? "var(--success)"
                  : "var(--danger)"
            }`,
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color:
              b.status === "pending"
                ? "var(--text-muted)"
                : b.status === "ok"
                  ? "var(--success)"
                  : "var(--danger)",
          }}
        >
          <span>
            {b.status === "pending" ? "⟳" : b.status === "ok" ? "✓" : "✗"}
          </span>
          {b.name}
        </span>
      ))}
    </div>
  );
}

function VizList({ vizs }: { vizs: Visualization[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {vizs.map((viz, i) => (
        <VizCard key={i} viz={viz} />
      ))}
    </div>
  );
}

function VizCard({ viz }: { viz: Visualization }) {
  if (viz.type === "table") {
    const rows = Array.isArray(viz.data) ? (viz.data as Record<string, unknown>[]) : [];
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--accent)",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {viz.title}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th
                    key={c}
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--bg-elevated)" }}>
                  {cols.map((c) => (
                    <td
                      key={c}
                      style={{
                        padding: "5px 10px",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                      }}
                    >
                      {String(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // bar / line / shap / graph — placeholder until chart lib wired
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ color: "var(--accent)", marginBottom: "6px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
        {viz.title}
      </div>
      <div style={{ color: "var(--text-faint)" }}>
        [{viz.type} chart — wire chart library to render]
      </div>
    </div>
  );
}

function ConfirmDialog({
  pending,
  onConfirm,
}: {
  pending: AwaitingConfirmation;
  onConfirm: (approved: boolean) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 32px",
          maxWidth: "480px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              letterSpacing: "2px",
              color: "var(--danger)",
              marginBottom: "8px",
            }}
          >
            SUPERVISED TOOL
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-primary)",
            }}
          >
            Agent wants to run:{" "}
            <span style={{ color: "var(--accent)" }}>{pending.tool}</span>
          </div>
        </div>
        <pre
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            overflowX: "auto",
            margin: 0,
          }}
        >
          {JSON.stringify(pending.args, null, 2)}
        </pre>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={() => onConfirm(false)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "6px 18px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Deny
          </button>
          <button
            onClick={() => onConfirm(true)}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "6px 18px",
              color: "var(--bg-base)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
