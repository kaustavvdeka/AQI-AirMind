import { useState, useEffect } from "react";

export default function MultiCityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intelligence/multi-city")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: 80 }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-muted)" }}>Loading Multi-City Air Quality Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
          🌆 Multi-City Intelligence Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Comparative real-time AQI rankings, 24h trends, active hotspots, and intervention effectiveness across major Indian metropolitan centers.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>National Average AQI</span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", marginTop: 6 }}>{data?.national_average_aqi || "--"}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Across {data?.cities_count} Metro Cities</span>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Most Polluted Metro</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ff3d00", marginTop: 6 }}>{data?.most_polluted_city || "--"}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Requires Immediate Intervention</span>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Cleanest Metro</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#00e676", marginTop: 6 }}>{data?.cleanest_city || "--"}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Best Air Quality Standing</span>
        </div>
      </div>

      <div className="card" style={{ padding: 24, overflowX: "auto" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>City AQI Leaderboard & Forecast Standing</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>National Rank</th>
              <th style={{ padding: "12px 16px" }}>City & State</th>
              <th style={{ padding: "12px 16px" }}>Current AQI</th>
              <th style={{ padding: "12px 16px" }}>Category</th>
              <th style={{ padding: "12px 16px" }}>24h Forecast</th>
              <th style={{ padding: "12px 16px" }}>Active Hotspots</th>
              <th style={{ padding: "12px 16px" }}>Intervention Score</th>
            </tr>
          </thead>
          <tbody>
            {data?.rankings?.map((c) => (
              <tr key={c.city} style={{ borderBottom: "1px solid var(--border-strong)", fontSize: "0.9rem" }}>
                <td style={{ padding: "14px 16px", fontWeight: 800 }}>#{c.national_rank}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 700 }}>{c.city}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.state}</div>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: "1.1rem", color: c.color }}>{c.aqi}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 12, background: `${c.color}22`, color: c.color, fontWeight: 700, fontSize: "0.8rem" }}>
                    {c.category}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontWeight: 700 }}>{c.forecast_24h}</span>
                  <span style={{ marginLeft: 6, fontSize: "0.75rem", color: c.trend === "Worsening" ? "#ff3d00" : "#00e676" }}>
                    ({c.trend === "Worsening" ? "▲" : "▼"} {c.trend})
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: c.active_hotspots > 5 ? "#ff3d00" : "var(--text-main)" }}>
                  {c.active_hotspots} Zones
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flexGrow: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${c.intervention_effectiveness}%`, height: "100%", background: "var(--accent)", borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{c.intervention_effectiveness}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
