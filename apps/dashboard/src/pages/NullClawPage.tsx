import { useState, useRef, useEffect } from "react";
import type { NullClawMessage } from "@nfl/types";
import { nanoClawApi } from "@nfl/api-client"; // ← was: modelApi

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
      const res = await nanoClawApi.chat(next); // ← was: modelApi.nullclaw(next)
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages([...next, {
        role: "assistant",
        content: `⚠ Could not reach NanoClaw: ${String(e)}\n\nMake sure NanoClaw is running on :8002`, // ← updated
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "42px", letterSpacing: "3px", lineHeight: 1 }}>
          NULL<span style={{ color: "var(--accent)" }}>CLAW</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          AI draft analyst · powered by NanoClaw on :8002
        </p>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
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
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minHeight: "200px",
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: "var(--radius-lg)",
              background: msg.role === "user" ? "var(--accent)" : "var(--bg-surface)",
              color: msg.role === "user" ? "var(--bg-base)" : "var(--text-primary)",
              border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-faint)",
            }}>
              thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex",
        gap: "8px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "8px",
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="Ask NanoClaw anything about the draft…"
          disabled={loading}
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
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "var(--bg-elevated)" : "var(--accent)",
            color: loading || !input.trim() ? "var(--text-faint)" : "var(--bg-base)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "6px 16px",
            fontWeight: 700,
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}