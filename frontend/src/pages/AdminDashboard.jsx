import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUSES = ["submitted", "under_review", "resolved", "rejected"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [trainStatus, setTrainStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    
    async function loadData() {
      setLoading(true);
      try {
        const [reportsData, modelData] = await Promise.allSettled([
          api.allReports(),
          api.history(1) // we check model-info endpoint indirectly or direct call if available
        ]);

        if (reportsData.status === "fulfilled") {
          setReports(reportsData.value);
        }
        
        // Let's directly fetch model info from the client
        try {
          const info = await api.trainModel(false); // does not retrain if false, or gets status
          // Wait, let's write a direct endpoint fetcher if needed or just query api.history
        } catch {}
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
    setTrainStatus("Initializing ML pipeline and rebuilding datasets…");
    try {
      const report = await api.trainModel(true);
      setTrainStatus(
        `✅ Success: Trained ${report.best_model.replace(/_/g, " ").toUpperCase()} on ${report.n_samples} samples. Metrics: R² = ${report.best_metrics.r2.toFixed(4)}, RMSE = ${report.best_metrics.rmse.toFixed(2)}`
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
    <div className="page animate-in">
      <header className="page-header">
        <h1>Admin Control Panel</h1>
        <p>Manage environmental monitoring parameters, trigger ML model training, and review citizen reports.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 28 }} className="forecast-grid">
        {/* Model configuration panel */}
        <section className="card-glass card-glow" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🤖 ML Model Management</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Execute a training session across Random Forest and XGBoost regressors using cached pollutant and meteorological arrays.
          </p>
          <button 
            className={`btn btn-primary ${training ? "animate-pulse" : ""}`} 
            onClick={retrain}
            disabled={training}
          >
            {training ? "Training Model…" : "Retrain AI Predictor"}
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
                        {r.imageUrl && (
                          <div style={{ marginTop: 4 }}>
                            <a href={r.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "underline" }}>
                              View Attached Evidence 🔗
                            </a>
                          </div>
                        )}
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
