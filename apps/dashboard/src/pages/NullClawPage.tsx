import { useState, useRef, useEffect } from "react";
import type { NullClawMessage } from "@nfl/types";
import { modelApi } from "@nfl/api-client";

const SUGGESTIONS = [
  "Project Travis Hunter's career value score",
  "Which position has the highest injury risk?",
  "Optimize the first pick for a team needing WR and EDGE",
  "Compare two QBs from the 2025 class",
];

export default function NullClawPage() {
  const [messages, setMessages]   = useState<NullClawMessage[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: NullClawMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await modelApi.nullclaw(next);
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages([...next, {
        role: "assistant",
        content: `⚠ Could not reach NullClaw: ${String(e)}\n\nMake sure the model platform is running on :8001`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 72px)", gap: "0" }}>
      {/* Header */}
      <div style={{ paddingBottom: "20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "42px", letterSpacing: "3px", lineHeight: 1 }}>
          NULL<span style={{ color: "var(--accent)" }}>CLAW</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "13px" }}>
          Claude-powered assistant · routes queries to ML models as tools
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        {isEmpty ? (
          <EmptyState onSelect={(s) => send(s)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && <ThinkingBubble />}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        paddingTop: "16px",
        display: "flex",
        gap: "10px",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask NullClaw anything about players, models, or draft strategy…"
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "11px 16px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "var(--bg-elevated)" : "var(--accent)",
            color: loading || !input.trim() ? "var(--text-faint)" : "var(--bg-base)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "0 20px",
            fontWeight: 700,
            fontSize: "13px",
            fontFamily: "var(--font-body)",
            transition: "all 0.15s",
          }}
        >
          Send
        </button>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setInput(""); }}
            style={{
              background: "transparent",
              color: "var(--text-faint)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0 14px",
              fontSize: "12px",
              fontFamily: "var(--font-body)",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <div style={{ paddingTop: "20px" }}>
      <p style={{ color: "var(--text-faint)", fontSize: "13px", marginBottom: "20px" }}>
        Try asking:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              textAlign: "left",
              color: "var(--text-muted)",
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            ✦ {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: NullClawMessage }) {
  const isUser = message.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      gap: "10px",
      alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: "28px", height: "28px", flexShrink: 0,
          background: "var(--accent-dim)", border: "1px solid var(--accent)",
          borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", color: "var(--accent)", marginTop: "2px",
        }}>
          ✦
        </div>
      )}
      <div style={{
        maxWidth: "680px",
        background: isUser ? "var(--accent-dim)" : "var(--bg-surface)",
        border: `1px solid ${isUser ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "12px 16px",
        fontSize: "13px",
        lineHeight: 1.65,
        color: "var(--text-primary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {message.content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{
        width: "28px", height: "28px", flexShrink: 0,
        background: "var(--accent-dim)", border: "1px solid var(--accent)",
        borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", color: "var(--accent)",
      }}>
        ✦
      </div>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 20px",
        display: "flex",
        gap: "6px",
        alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--accent)",
            animation: "pulse 1.2s ease infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
