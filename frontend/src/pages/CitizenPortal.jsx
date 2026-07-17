import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "../context/LocationContext.jsx";
import { getBadgeClass } from "../components/AqiCard.jsx";

function healthAdvisory(aqi) {
  if (aqi == null) return { text: "AQI data unavailable.", icon: "⚪" };
  if (aqi <= 50) return { text: "Air quality is excellent. Safe for all outdoor recreational activities.", icon: "🟢" };
  if (aqi <= 100) return { text: "Satisfactory. Sensitive individuals should consider reducing heavy outdoor exertion.", icon: "🟡" };
  if (aqi <= 200) return { text: "Moderate. Sensitive groups may experience health symptoms; outdoor exertion should be limited.", icon: "🟠" };
  if (aqi <= 300) return { text: "Poor. Avoid prolonged outdoor exertion. Wearing an N95 mask outdoors is recommended.", icon: "🔴" };
  if (aqi <= 400) return { text: "Very Poor. Severe risk of respiratory issues. Avoid outdoor activities and keep windows shut.", icon: "🟤" };
  return { text: "Severe. Emergency conditions. Avoid all outdoor activity. Use high-efficiency air purifiers indoors.", icon: "🟣" };
}

export default function CitizenPortal() {
  const { location } = useLocation();
  const { user } = useAuth();
  const [aqi, setAqi] = useState(null);
  const [reports, setReports] = useState([]);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("");
  const [loadingCoords, setLoadingCoords] = useState(false);

  useEffect(() => {
    api.currentAqi(location).then(setAqi).catch(() => {});
    if (user) api.myReports().then(setReports).catch(() => {});
  }, [user, location]);

  function useMyLocation() {
    setLoadingCoords(true);
    setStatus("");
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported by this browser.");
      setLoadingCoords(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoadingCoords(false);
      },
      () => {
        setStatus("Could not get your location — enter details or allow browser access.");
        setLoadingCoords(false);
      }
    );
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("");
    if (!user) {
      setStatus("Please log in to submit a report.");
      return;
    }
    if (!coords) {
      setStatus("Please capture your current location first.");
      return;
    }
    try {
      await api.submitReport({ 
        description, 
        imageUrl: imageUrl || undefined, 
        lat: coords.lat, 
        lon: coords.lon 
      });
      setDescription("");
      setImageUrl("");
      setCoords(null);
      setStatus("Success: Your report has been submitted to smart city admin.");
      const updated = await api.myReports();
      setReports(updated);
    } catch (err) {
      setStatus(err.message);
    }
  }

  const advisory = healthAdvisory(aqi?.aqi);

  return (
    <div className="page animate-in">
      <header className="page-header">
        <h1>Citizen Portal</h1>
        <p>Report environmental incidents directly to municipal planners and access current health guidelines.</p>
      </header>

      {/* Health Advisory Banner */}
      <section className="advisory-banner">
        <div className="advisory-icon">{advisory.icon}</div>
        <div>
          <div className="advisory-title">
            Health Advisory {aqi && (
              <span className={`badge ${getBadgeClass(aqi.aqi)}`} style={{ marginLeft: 8 }}>
                AQI {Math.round(aqi.aqi)}
              </span>
            )}
          </div>
          <div className="advisory-text">{advisory.text}</div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="forecast-grid">
        {/* Pollution Reporting Form */}
        <section className="card-glass card-glow">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
            📢 File a New Incident Report
          </h2>
          <form className="report-form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Incident Description</label>
              <textarea
                className="form-input"
                placeholder="Describe what you are seeing (e.g. open garbage burning, thick smoke emission, industrial dump)…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Evidence Image URL (Optional)</label>
              <input
                className="form-input"
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Geographic Location</label>
              <div className="report-form-location">
                <button 
                  type="button" 
                  className={`btn btn-secondary btn-sm ${loadingCoords ? 'animate-pulse' : ''}`}
                  onClick={useMyLocation}
                  disabled={loadingCoords}
                >
                  📍 {loadingCoords ? "Locating…" : "Use My GPS Location"}
                </button>
                {coords && (
                  <span className="location-coords">
                    {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                  </span>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Submit Incident Report
            </button>
          </form>
          {status && (
            <p className={`notice ${status.startsWith("Success") ? "notice-info" : "notice-warning"}`} style={{ marginTop: 14 }}>
              {status}
            </p>
          )}
        </section>

        {/* User's Reports */}
        <section className="card-glass">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
            📂 Your Submitted Incidents
          </h2>
          {!user ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
              Please sign in to view and track your environmental reports.
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 12 }}>
              You haven't submitted any pollution reports yet.
            </div>
          ) : (
            <ul className="report-list">
              {reports.map((r) => {
                const statusColors = {
                  submitted: "badge-info",
                  under_review: "badge-moderate",
                  resolved: "badge-good",
                  rejected: "badge-vpoor"
                };
                const statusLabels = {
                  submitted: "SUBMITTED",
                  under_review: "UNDER REVIEW",
                  resolved: "RESOLVED",
                  rejected: "REJECTED"
                };
                return (
                  <li className="report-item" key={r._id}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className={`badge ${statusColors[r.status] || "badge-info"}`} style={{ fontSize: "0.7rem", fontWeight: 800 }}>
                          {statusLabels[r.status] || r.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="report-desc">{r.description}</div>
                      <div className="report-meta">
                        📍 Coordinates: {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                        {r.imageUrl && (
                          <span style={{ marginLeft: 8 }}>
                            · <a href={r.imageUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>View Photo</a>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
