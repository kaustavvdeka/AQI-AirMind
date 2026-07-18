import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api/client.js";
import { getAqiClass, getAqiLabel, getBadgeClass } from "../components/AqiCard.jsx";

export default function Prediction() {
  const [predictions, setPredictions] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [predResult, recResult] = await Promise.allSettled([
          api.predict(), 
          api.recommendations()
        ]);

        if (predResult.status === "fulfilled") setPredictions(predResult.value);
        else setError(predResult.reason.message);

        if (recResult.status === "fulfilled") setExplanation(recResult.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const importanceData =
    explanation?.global_feature_importance?.map(([feature, score]) => ({
      feature: feature.replace(/_/g, " ").toUpperCase(),
      importance: Number((score * 100).toFixed(1)),
    })) || [];

  const attribution = explanation?.source_attribution?.contributions || {};
  const explanationText = explanation?.source_attribution?.explanation || "";
  const cpcb = explanation?.cpcb_details || {};

  return (
    <div className="page animate-in">
      <header className="page-header">
        <h1>AI Predictions, Advisories & Source Apportionment</h1>
        <p>SaaS analytics using Random Forest & XGBoost with CPCB calculator step-by-step verification.</p>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing model parameters and running predictions…</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="notice notice-error" style={{ marginBottom: 24 }}>
              <p>
                ⚠️ <strong>No trained model found.</strong> {error}. Access the Admin Panel to run the training cycle, or run training manually to make predictions available.
              </p>
            </div>
          )}

          {predictions && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                🔮 Multi-Day AQI Forecast
              </h2>
              <div className="forecast-grid">
                {Object.entries(predictions).map(([horizon, p]) => {
                  const aqiClass = getAqiClass(p.predicted_aqi);
                  return (
                    <div className={`forecast-card ${aqiClass}`} key={horizon}>
                      <div className="forecast-horizon">{horizon} Horizon</div>
                      <div className="forecast-aqi">{Math.round(p.predicted_aqi)}</div>
                      <div style={{ marginBottom: 12 }}>
                        <span className={`badge ${getBadgeClass(p.predicted_aqi)}`}>
                          {getAqiLabel(p.predicted_aqi)}
                        </span>
                      </div>
                      <div className="forecast-time">
                        🕒 {new Date(p.target_time).toLocaleString(undefined, { 
                          month: "short", 
                          day: "numeric", 
                          hour: "numeric", 
                          minute: "2-digit" 
                        })}
                      </div>
                      <div className="forecast-model">
                        ⚙️ Model: {p.model} (R² = {p.model_metrics?.r2 || "N/A"})
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }} className="forecast-grid">
            {/* Drivers and recommendations */}
            <section className="card-glass card-glow" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                  🧠 Current AQI Driver Analysis
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Primary pollution contributors relative to clean atmospheric references.
                </p>
              </div>

              {explanation?.active_drivers?.length > 0 ? (
                <ul className="driver-list">
                  {explanation.active_drivers.map((d) => (
                    <li key={d.factor}>
                      <span className="driver-label">🚨 {d.factor}</span>
                      <span className="driver-value">
                        {d.value} {d.pct_above_reference ? `(+${d.pct_above_reference}%)` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: 24, textAlign: "center", background: "var(--bg-surface)", border: "1px dashed var(--border)", borderRadius: 12, color: "var(--text-muted)" }}>
                  No pollutant levels currently exceed reference parameters.
                </div>
              )}

              {explanation?.recommendations && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                      📋 AI Mitigation Guidelines
                    </h3>
                    <span className="badge badge-info" style={{ fontSize: "0.68rem" }}>
                      Source: {explanation.recommendations.source.toUpperCase()}
                    </span>
                  </div>
                  <div className="rec-list">
                    {explanation.recommendations.recommendations.map((r, i) => (
                      <div className="rec-item" key={i}>
                        <div className="rec-icon">⚡</div>
                        <div className="rec-text">{r}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Pollution Source Attribution Section */}
            <section className="card-glass" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                  🏭 Pollution Source Attribution Model
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Mathematical apportionment of active pollution vectors using chemical ratios and wind drift.
                </p>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(attribution).map(([source, percentage]) => (
                  <div key={source}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>
                      <span>{source}</span>
                      <span style={{ color: "var(--accent)" }}>{percentage}%</span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percentage}%`, background: "var(--accent)", borderRadius: 4 }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {explanationText && (
                <div className="notice notice-info" style={{ fontSize: "0.82rem", marginTop: 8 }}>
                  <strong>Model Reasoning:</strong> {explanationText}
                </div>
              )}
            </section>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }} className="forecast-grid">
            {/* CPCB Step-by-Step Calculations */}
            <section className="card-glass" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                  🧮 CPCB Sub-Index Verification Steps
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Breakpoints interpolation: Subindex = [ (I_hi - I_lo) / (C_hi - C_lo) ] * (C - C_lo) + I_lo
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cpcb.calculation_steps && Object.entries(cpcb.calculation_steps).map(([poll, step]) => (
                  <div key={poll} style={{ padding: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ textTransform: "uppercase" }}>{poll} Sub-Index</span>
                      <span style={{ color: "var(--accent)" }}>{cpcb.sub_indices?.[poll]}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      Formula: {step}
                    </div>
                  </div>
                ))}
              </div>

              {cpcb.dominant_pollutant && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "12px 18px", background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 12 }}>
                  <div>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Dominant Pollutant:</span>
                    <strong style={{ fontSize: "0.95rem", marginLeft: 8, textTransform: "uppercase", color: "white" }}>
                      {cpcb.dominant_pollutant}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Calculated AQI:</span>
                    <strong style={{ fontSize: "1.2rem", marginLeft: 8, color: "var(--accent)" }}>
                      {cpcb.aqi}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            {/* Feature Importance Chart */}
            <section className="chart-section" style={{ margin: 0 }}>
              <div>
                <h2>📊 Global Model Feature Importance</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                  Relevance score percentage of individual parameters contributing to the predictive network.
                </p>
              </div>

              {importanceData.length > 0 ? (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={importanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis type="category" dataKey="feature" width={110} stroke="var(--text-secondary)" fontSize={10} />
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                      <Bar dataKey="importance" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 12 }}>
                  Feature importance data is unavailable. Train model to generate importance weights.
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
