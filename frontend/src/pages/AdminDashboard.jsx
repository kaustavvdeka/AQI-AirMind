import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUSES = ["submitted", "under_review", "resolved", "rejected"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [enforcements, setEnforcements] = useState([]);
  const [trainStatus, setTrainStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    
    async function loadData() {
      setLoading(true);
      try {
        const [reportsData, enfData] = await Promise.allSettled([
          api.allReports(),
          fetch("/api/intelligence/enforcement").then((r) => r.json()),
        ]);

        if (reportsData.status === "fulfilled") setReports(reportsData.value);
        if (enfData.status === "fulfilled") setEnforcements(enfData.value);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function updateStatus(id, status) {
    try {
      const updated = await api.updateReportStatus(id, status);
      setReports((rs) => rs.map((r) => (r._id === id ? updated : r)));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  }

  async function retrain() {
    setTraining(true);
    setTrainStatus("Initializing ML benchmarking (Random Forest, XGBoost, LightGBM, CatBoost)...");
    try {
      const report = await api.trainModel(true);
      setTrainStatus(
        `✅ Success: Selected ${report.best_model.toUpperCase()} model on ${report.n_samples} samples. R² = ${report.best_metrics.r2.toFixed(4)}, RMSE = ${report.best_metrics.rmse.toFixed(2)}`
      );
    } catch (err) {
      setTrainStatus("❌ Training failed: " + err.message);
    } finally {
      setTraining(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="page">
        <div className="notice notice-error">
          <p>⛔ <strong>Access Denied:</strong> Municipal Admin privileges are required to view this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-in" style={{ paddingBottom: 40 }}>
      <header className="page-header">
        <h1>Smart City Enforcement & Admin Control Panel</h1>
        <p>AI Enforcement Recommendations, ML Model Benchmarking, and Municipal Incident Dispatch.</p>
      </header>

      {/* AI Enforcement Recommendations Section */}
      <section className="card" style={{ padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          🚨 AI Enforcement Action Dispatches
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {enforcements.map((enf) => (
            <div key={enf.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-strong)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", padding: "3px 8px", borderRadius: 6, fontWeight: 800, background: enf.priority === "HIGH" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)", color: enf.priority === "HIGH" ? "#ef4444" : "#eab308" }}>
                  {enf.priority} PRIORITY ({enf.confidence_score}% CONFIDENCE)
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>{enf.id}</span>
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "6px 0", color: "var(--accent)" }}>{enf.action_title}</h4>
              <div style={{ fontSize: "0.82rem", color: "var(--text-main)", fontWeight: 600, marginBottom: 8 }}>📍 {enf.ward_number}</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.4 }}>
                <strong>Reason:</strong> {enf.primary_reason}
              </p>
              <div style={{ background: "rgba(0,230,118,0.08)", padding: "6px 10px", borderRadius: 6, fontSize: "0.78rem", color: "#00e676", fontWeight: 700 }}>
                Expected Impact: {enf.expected_aqi_reduction}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 28 }} className="forecast-grid">
        {/* Model configuration panel */}
        <section className="card-glass card-glow" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🤖 ML Model Benchmarking</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Benchmark Random Forest, XGBoost, LightGBM, and CatBoost regressors using 5-fold cross-validation.
          </p>
          <button 
            className={`btn btn-primary ${training ? "animate-pulse" : ""}`} 
            onClick={retrain}
            disabled={training}
          >
            {training ? "Benchmarking Models..." : "Auto-Select & Train Best Model"}
          </button>
          {trainStatus && (
            <p className={`notice ${trainStatus.startsWith("❌") ? "notice-error" : "notice-info"}`} style={{ fontSize: "0.8rem", marginTop: 8 }}>
              {trainStatus}
            </p>
          )}
        </section>

        {/* Municipal Reports Dashboard */}
        <section className="card-glass" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>📋 Incident Reports Inbox</h2>
          {loading ? (
            <div className="loading-state" style={{ padding: 24 }}>
              <div className="spinner"></div>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 12 }}>
              No pollution reports received from citizens.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Report Description</th>
                    <th>Coordinates</th>
                    <th>Action / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.user?.name || "Anonymous"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.user?.email || "—"}</div>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", whiteSpace: "normal", wordBreak: "break-word" }}>
                          {r.description}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
                        {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                      </td>
                      <td>
                        <select 
                          value={r.status} 
                          onChange={(e) => updateStatus(r._id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ").toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
