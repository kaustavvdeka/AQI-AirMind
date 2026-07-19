import { useState, useEffect } from "react";

export default function SimulatorPage() {
  const [baselineAqi, setBaselineAqi] = useState(245);
  const [trafficPct, setTrafficPct] = useState(30);
  const [industryPct, setIndustryPct] = useState(20);
  const [constructionBan, setConstructionBan] = useState(true);
  const [wasteBan, setWasteBan] = useState(true);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  function runSimulation() {
    setLoading(true);
    fetch("/api/intelligence/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseline_aqi: baselineAqi,
        traffic_reduction_pct: trafficPct,
        industry_shutdown_pct: industryPct,
        construction_ban: constructionBan,
        waste_burn_ban: wasteBan,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSimulation(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }

  useEffect(() => {
    runSimulation();
  }, [baselineAqi, trafficPct, industryPct, constructionBan, wasteBan]);

  return (
    <div className="page-container" style={{ padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
          🎛️ Policy Intervention Simulator ("What-If" Engine)
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Simulate targeted city administrator actions and quantify predicted AQI reductions, health risk mitigation, and CPCB category shifts.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {/* Controls Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Policy Control Knobs</h3>
          
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Baseline City AQI</label>
              <span style={{ color: "var(--accent)", fontWeight: 800 }}>{baselineAqi} AQI</span>
            </div>
            <input
              type="range"
              min="50"
              max="450"
              value={baselineAqi}
              onChange={(e) => setBaselineAqi(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Reduce Traffic Density</label>
              <span style={{ color: "var(--accent)", fontWeight: 800 }}>{trafficPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={trafficPct}
              onChange={(e) => setTrafficPct(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Shutdown Industrial Boiler Stacks</label>
              <span style={{ color: "var(--accent)", fontWeight: 800 }}>{industryPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={industryPct}
              onChange={(e) => setIndustryPct(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={constructionBan}
                onChange={(e) => setConstructionBan(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Halt Uncovered Construction & Excavation
            </label>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={wasteBan}
                onChange={(e) => setWasteBan(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Enforce Strict Ban on Open Waste & Biomass Burning
            </label>
          </div>
        </div>

        {/* Results Output Card */}
        <div className="card" style={{ padding: 24, background: "rgba(20, 24, 33, 0.75)", border: "1px solid var(--border-strong)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Simulated Air Quality Outcomes</h3>

          {simulation && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Baseline Status</span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: 4 }}>{simulation.baseline_aqi}</div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>{simulation.baseline_category}</span>
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: `${simulation.category_color}15`, border: `1px solid ${simulation.category_color}44` }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: simulation.category_color, fontWeight: 700 }}>Projected AQI</span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: simulation.category_color, marginTop: 4 }}>{simulation.simulated_aqi}</div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: simulation.category_color }}>{simulation.simulated_category}</span>
                </div>
              </div>

              <div style={{ padding: 16, borderRadius: 12, background: "rgba(0, 230, 118, 0.08)", border: "1px solid rgba(0, 230, 118, 0.25)", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00e676" }}>Expected Improvement</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#00e676" }}>-{simulation.aqi_reduction_points} AQI Points ({simulation.percentage_improvement}%)</div>
                  </div>
                  <span style={{ fontSize: "2rem" }}>🌱</span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 10 }}>Health Impact Shift</h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                  {simulation.health_impact_after_policy}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 10 }}>Projected Concentrations</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "center" }}>
                  {Object.entries(simulation.simulated_pollutant_concentrations || {}).map(([p, val]) => (
                    <div key={p} style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>{p}</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
