import { useEffect, useState } from "react";

export default function CommunityRankings() {
  const [rankings, setRankings] = useState(null);
  const [activeTab, setActiveTab] = useState("wards");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRankings() {
      try {
        const res = await fetch("/api/intelligence/agent/community-rankings");
        if (res.ok) {
          const data = await res.json();
          setRankings(data);
        }
      } catch (err) {
        console.error("Failed to load community rankings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, []);

  return (
    <div className="page animate-in" style={{ paddingBottom: 40 }}>
      <header className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>🏆 Community Green Rankings & Recognition</h1>
        <p>Evidence-based evaluation based on official Green Community Score weights (40% AQI Imp, 20% Poll Red, 15% Reports, 10% Trees, 10% Waste Red, 5% Awareness).</p>
      </header>

      {/* Formula Weight Chips */}
      {rankings?.formula_weight_breakdown && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
            📉 AQI Imp: 40%
          </span>
          <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
            🚗 Poll Red: 20%
          </span>
          <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
            📋 Reports Res: 15%
          </span>
          <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
            🌳 Tree Plantation: 10%
          </span>
          <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
            🔥 Waste Red: 10%
          </span>
          <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
            📢 Public Awareness: 5%
          </span>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          className={`btn ${activeTab === "wards" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("wards")}
        >
          🏛️ Municipal Wards
        </button>
        <button
          className={`btn ${activeTab === "schools" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("schools")}
        >
          🎓 Eco-Schools & Varsities
        </button>
        <button
          className={`btn ${activeTab === "societies" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("societies")}
        >
          🏢 Residential RWAs
        </button>
        <button
          className={`btn ${activeTab === "cities" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("cities")}
        >
          🌐 Municipalities
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating Green Community Score Leaderboards...</p>
        </div>
      ) : (
        <div>
          {activeTab === "wards" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
              {rankings?.ward_rankings?.map((w) => (
                <div key={w.rank} className="card" style={{ padding: 20, position: "relative", border: "1px solid var(--border-strong)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>#{w.rank} RANK</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, padding: "4px 12px", borderRadius: 12, background: "rgba(0,230,118,0.15)", color: "#00e676" }}>
                      {w.green_score} pts
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 10px 0" }}>{w.name}</h3>
                  <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                    <div>AQI Improvement: <strong>{w.aqi_improvement}</strong></div>
                    <div>Trees Planted: <strong>{w.trees_planted}</strong></div>
                    <div>Reports Resolved: <strong>{w.reports_resolved_pct}%</strong></div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: "0.78rem", color: "var(--accent)", fontWeight: 700 }}>
                    🏆 {w.award}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "schools" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
              {rankings?.school_rankings?.map((s) => (
                <div key={s.rank} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>#{s.rank}</span>
                    <span style={{ fontWeight: 800, color: "#00e676" }}>{s.green_score} pts</span>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 6px 0" }}>{s.name}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Initiative: {s.initiatives}</div>
                  <div style={{ fontSize: "0.82rem", marginTop: 4 }}>Trees Planted: <strong>{s.trees_planted}</strong></div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "societies" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
              {rankings?.society_rankings?.map((soc) => (
                <div key={soc.rank} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>#{soc.rank}</span>
                    <span style={{ fontWeight: 800, color: "#00e676" }}>{soc.green_score} pts</span>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 6px 0" }}>{soc.name}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Key Drive: {soc.initiatives}</div>
                  <div style={{ fontSize: "0.82rem", marginTop: 4 }}>AQI Delta: <strong>{soc.aqi_delta}</strong></div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "cities" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
              {rankings?.municipality_rankings?.map((m) => (
                <div key={m.rank} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>#{m.rank}</span>
                    <span style={{ fontWeight: 800, color: "#00e676" }}>{m.green_score} pts</span>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 6px 0" }}>{m.city}</h3>
                  <div style={{ fontSize: "0.82rem" }}>Average AQI: <strong>{m.average_aqi}</strong></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
