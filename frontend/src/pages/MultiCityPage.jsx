import { useState, useEffect } from "react";

export default function MultiCityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMultiCityData() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/intelligence/multi-city");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch multi-city data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMultiCityData();
    const interval = setInterval(fetchMultiCityData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: 80 }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-muted)" }}>Fusing Dynamic Multi-City Weather & Air Quality Feeds...</p>
      </div>
    );
  }

  return (
    <div className="page-container animate-in" style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
            🌆 Multi-City Real-Time Intelligence Command Center
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Dynamic real-time AQI rankings, CPCB sub-index breakdown, 24h forecasts, live weather vectors, and intervention scores across 8 Indian metropolises.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {data?.updated_at && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              ⏱️ Last Synced: {new Date(data.updated_at).toLocaleTimeString()}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchMultiCityData}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {refreshing ? "🔄 Syncing..." : "🔄 Refresh Feeds"}
          </button>
        </div>
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
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Live Metro Air Quality Leaderboard & Forecast Standing</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>National Rank</th>
              <th style={{ padding: "12px 16px" }}>City & State</th>
              <th style={{ padding: "12px 16px" }}>Live AQI</th>
              <th style={{ padding: "12px 16px" }}>Dominant / PM2.5</th>
              <th style={{ padding: "12px 16px" }}>Weather</th>
              <th style={{ padding: "12px 16px" }}>24h Forecast</th>
              <th style={{ padding: "12px 16px" }}>Hotspot Zones</th>
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
                <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: "1.1rem", color: c.color }}>
                  {c.aqi}
                  <div style={{ fontSize: "0.75rem", color: c.color, fontWeight: 600 }}>{c.category}</div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 700 }}>PM2.5: {c.pm25} µg/m³</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PM10: {c.pm10} | NO₂: {c.no2}</div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: "0.82rem" }}>
                  <div>🌡️ {c.temperature_c}°C</div>
                  <div style={{ color: "var(--text-muted)" }}>💨 {c.wind_speed_ms} m/s</div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontWeight: 700 }}>{c.forecast_24h} AQI</span>
                  <span style={{ marginLeft: 6, fontSize: "0.75rem", color: c.trend === "Worsening" ? "#ff3d00" : (c.trend === "Improving" ? "#00e676" : "#ffea00") }}>
                    ({c.trend === "Worsening" ? "▲" : (c.trend === "Improving" ? "▼" : "•")} {c.trend})
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: c.active_hotspots > 4 ? "#ff3d00" : "var(--text-main)" }}>
                  {c.active_hotspots} Active Zones
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
