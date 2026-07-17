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
        } else {
          if (aqiData) {
            setHistoryData([{
              time: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              aqi: Math.round(aqiData.aqi)
            }]);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [coords, location, refreshCount, setAqi]);

  // Auto-refresh every 5 minutes (300,000 ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCount((c) => c + 1);
    }, 300000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page animate-in">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>National Air Quality Index</h1>
          <p>Analyze live ground sensor measurements and weather for any location in India.</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="badge badge-info" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            📍 Active Location: {location}
          </span>
          <button 
            className={`btn btn-secondary btn-sm ${loading ? 'animate-pulse' : ''}`}
            onClick={() => setRefreshCount((c) => c + 1)}
            disabled={loading}
          >
            🔄 {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {loading && historyData.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fetching environmental metrics for {location}…</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="notice notice-error" style={{ marginBottom: 24 }}>
              <p>⚠️ <strong>Error:</strong> {error}</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 24, alignItems: "stretch" }} className="forecast-grid">
            {/* Semicircle Gauge Card */}
            <div className="card-glass card-glow" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <AqiGauge value={aqi?.aqi} size={220} />
              {aqi && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <span className={`badge ${getBadgeClass(aqi.aqi)}`} style={{ fontSize: "0.85rem", padding: "4px 12px" }}>
                    {getAqiLabel(aqi.aqi)}
                  </span>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 8 }}>
                    Coordinates: {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                  </div>
                </div>
              )}
            </div>

            {/* Historical Trend Chart */}
            <div className="chart-section" style={{ margin: 0, minHeight: 320 }}>
              <h2>📈 AQI Trend — {location}</h2>
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
                  No historical trend records found for {location} in database.
                </div>
              )}
            </div>
          </div>

          <section>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              📊 Ground Sensor Pollutants
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
              🌤️ Local Weather Conditions
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
