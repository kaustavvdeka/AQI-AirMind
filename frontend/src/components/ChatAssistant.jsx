import { useState } from "react";

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am the AirMind AI Grounded Environmental Assistant. Ask me about current AQI, pollution source attributions, high-risk wards, or forecasts."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/intelligence/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: "bot", text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Available environmental evidence is insufficient to make a reliable conclusion." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Available environmental evidence is insufficient to make a reliable conclusion." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-primary"
          style={{
            borderRadius: 30,
            padding: "12px 22px",
            boxShadow: "0 8px 24px rgba(0, 230, 118, 0.3)",
            fontSize: "0.95rem",
            fontWeight: 800
          }}
        >
          💬 Ask AirMind AI Assistant
        </button>
      ) : (
        <div
          style={{
            width: 380,
            height: 500,
            background: "var(--bg-card, #0f172a)",
            border: "1px solid var(--border-strong, #334155)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--accent)" }}>
              🤖 AirMind AI Environmental Assistant
            </span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  background: m.sender === "user" ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: m.sender === "user" ? "#000" : "var(--text-main)",
                  fontWeight: m.sender === "user" ? 700 : 400
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Querying verified backend evidence…
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Ask why AQI is high, forecasts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                fontSize: "0.85rem"
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
