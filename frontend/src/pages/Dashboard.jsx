import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api/client.js";
import AqiCard, { getBadgeClass, getAqiLabel } from "../components/AqiCard.jsx";
import AqiGauge from "../components/AqiGauge.jsx";
import { useLocation } from "../context/LocationContext.jsx";

export default function Dashboard() {
  const { location, coords, aqi, setAqi } = useLocation();
  const [weather, setWeather] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [cpcbData, setCpcbData] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        let aqiData = null;
        try {
          aqiData = await api.liveAqi(coords.lat, coords.lon, location);
        } catch {
          try {
            aqiData = await api.currentAqi(location);
          } catch {}
        }

        const [weatherResult, historyResult] = await Promise.allSettled([
          api.liveWeather(coords.lat, coords.lon),
          api.aqiHistory(location, 7),
        ]);

        if (aqiData) setAqi(aqiData);
        if (weatherResult.status === "fulfilled") setWeather(weatherResult.value);
        
        if (historyResult.status === "fulfilled") {
          setHistoryData(
            historyResult.value.records.map((r) => ({
              time: new Date(r.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              aqi: Math.round(r.aqi),
            }))
          );
        }

        // Fetch CPCB official AQI & Intelligence metrics
        fetch("/api/intelligence/source-attribution")
          .then((res) => res.json())
          .then((data) => setSourceData(data))
          .catch(() => {});

        fetch("/api/intelligence/explain/shap")
          .then((res) => res.json())
          .then((data) => setShapData(data))
          .catch(() => {});

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [coords, location, refreshCount, setAqi]);

  useEffect(() => {
    const timer = setInterval(() => setRefreshCount((c) => c + 1), 300000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page animate-in" style={{ paddingBottom: 40 }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>National Air Quality Intelligence Dashboard</h1>
          <p>Official CPCB Sub-Index Breakdown, Source Attribution, & AI Explainability for Smart City Interventions.</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="badge badge-info" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            📍 Active City: {location} ({coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E)
          </span>
          <button 
            className={`btn btn-secondary btn-sm ${loading ? 'animate-pulse' : ''}`}
            onClick={() => setRefreshCount((c) => c + 1)}
            disabled={loading}
          >
            🔄 {loading ? "Refreshing…" : "Refresh Data"}
          </button>
        </div>
      </header>

      {loading && historyData.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing environmental data for {location}…</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="notice notice-error" style={{ marginBottom: 24 }}>
              <p>⚠️ <strong>Error:</strong> {error}</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 28 }} className="forecast-grid">
            {/* Semicircle Gauge Card */}
            <div className="card-glass card-glow" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <AqiGauge value={aqi?.aqi || 145} size={220} />
              {aqi && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <span className={`badge ${getBadgeClass(aqi.aqi)}`} style={{ fontSize: "0.85rem", padding: "4px 14px", fontWeight: 700 }}>
                    {getAqiLabel(aqi.aqi)}
                  </span>
                  <div style={{ marginTop: 10, fontSize: "0.82rem", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 8 }}>
                    Dominant Pollutant: <strong style={{ color: "var(--accent)" }}>{aqi.dominantPollutant || "PM2.5"}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Historical Trend Chart */}
            <div className="chart-section" style={{ margin: 0, minHeight: 320 }}>
              <h2>📈 7-Day CPCB AQI Trend — {location}</h2>
              {historyData.length > 0 ? (
                <div style={{ width: "100%", height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 'auto']} />
                      <Tooltip 
                        contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }}
                        labelStyle={{ fontWeight: "bold", color: "var(--text-primary)" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="aqi" 
                        stroke="var(--accent)" 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 1, fill: "var(--bg-base)" }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  Loading historical CPCB trends for {location}...
                </div>
              )}
            </div>
          </div>

          {/* Pollution Source Attribution & SHAP Explainability Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 28 }}>
            {/* Source Attribution Card */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🏗️ Pollution Source Attribution</h3>
                {sourceData && (
                  <span style={{ fontSize: "0.75rem", background: "rgba(0, 230, 118, 0.12)", color: "#00e676", padding: "3px 8px", borderRadius: 8, fontWeight: 700 }}>
                    {sourceData.confidence_score}% Confidence
                  </span>
                )}
              </div>

              {sourceData?.contributions ? (
                <div>
                  {Object.entries(sourceData.contributions).map(([source, pct]) => (
                    <div key={source} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{source}</span>
                        <span style={{ fontWeight: 700, color: "var(--accent)" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 3 }}></div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 14, fontStyle: "italic" }}>
                    {sourceData.explanation}
                  </p>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Evaluating multi-source attribution vectors...</div>
              )}
            </div>

            {/* Explainable AI SHAP Drivers */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>💡 Explainable AI (SHAP Driver Analysis)</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Primary features driving current ML model prediction for {location}:
              </p>
              {shapData?.shap_summary?.top_shap_features ? (
                <div>
                  {shapData.shap_summary.top_shap_features.slice(0, 5).map(([feat, val]) => (
                    <div key={feat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 8, fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600 }}>{feat}</span>
                      <span style={{ fontWeight: 700, color: "#76ff03" }}>+{(val * 100).toFixed(1)}% Impact</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading SHAP explainability weights...</div>
              )}
            </div>
          </div>

          <section>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              📊 CPCB Ground Sensor Pollutant Breakdowns
            </h2>
            <div className="card-grid">
              <AqiCard label="PM2.5" value={aqi?.pm25} unit="µg/m³" sub="Fine particulate matter" />
              <AqiCard label="PM10" value={aqi?.pm10} unit="µg/m³" sub="Coarse particulate matter" />
              <AqiCard label="NO₂" value={aqi?.no2} unit="µg/m³" sub="Nitrogen dioxide" />
              <AqiCard label="SO₂" value={aqi?.so2} unit="µg/m³" sub="Sulfur dioxide" />
              <AqiCard label="CO" value={aqi?.co} unit="mg/m³" sub="Carbon monoxide" />
              <AqiCard label="O₃" value={aqi?.o3} unit="µg/m³" sub="Ozone" />
            </div>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              🌤️ Local Atmospheric Conditions
            </h2>
            <div className="card-grid">
              <AqiCard label="Temperature" value={weather?.temperature} unit="°C" sub="Ambient temperature" />
              <AqiCard label="Humidity" value={weather?.humidity} unit="%" sub="Relative humidity" />
              <AqiCard label="Wind Speed" value={weather?.windSpeed} unit="m/s" sub="Atmospheric dispersion speed" />
              <AqiCard label="Rainfall" value={weather?.rainfall} unit="mm" sub="Precipitation level" />
              <AqiCard label="Pressure" value={weather?.pressure} unit="hPa" sub="Barometric pressure" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
