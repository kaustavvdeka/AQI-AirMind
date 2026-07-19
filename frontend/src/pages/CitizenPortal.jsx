import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "../context/LocationContext.jsx";
import { getBadgeClass } from "../components/AqiCard.jsx";

const LANGUAGES = ["English", "Hindi", "Bengali", "Assamese"];

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
  
  const [language, setLanguage] = useState("English");
  const [advisoryData, setAdvisoryData] = useState(null);

  useEffect(() => {
    api.currentAqi(location).then((data) => {
      setAqi(data);
      fetch(`/api/intelligence/health-advisory?aqi=${data?.aqi || 245}&language=${language}`)
        .then((r) => r.json())
        .then((ad) => setAdvisoryData(ad))
        .catch(() => {});
    }).catch(() => {});

    if (user) api.myReports().then(setReports).catch(() => {});
  }, [user, location, language]);

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

  return (
    <div className="page animate-in" style={{ paddingBottom: 40 }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Citizen Health & Incident Portal</h1>
          <p>Demographic-specific Health Advisories (English, Hindi, Bengali, Assamese) & Pollution Incident Filing.</p>
        </div>

        {/* Language Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>🌐 Advisory Language:</span>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: "6px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-strong)", color: "var(--text-main)", fontWeight: 700 }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Demographic Health Advisory Cards */}
      {advisoryData && (
        <section className="card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
              🏥 Local Ward Health Advisory ({language})
            </h2>
            <span style={{ padding: "4px 12px", borderRadius: 12, background: `${advisoryData.color}22`, color: advisoryData.color, fontWeight: 800, fontSize: "0.85rem" }}>
              {advisoryData.cpcb_category} (AQI {advisoryData.current_aqi})
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {Object.entries(advisoryData.advisories || {}).map(([group, text]) => (
              <div key={group} style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--accent)", fontWeight: 800, marginBottom: 4 }}>
                  {group.replace(/_/g, " ")}
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-main)", margin: 0, lineHeight: 1.5 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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
                placeholder="Describe what you are seeing (e.g. open garbage burning, thick smoke emission, industrial dump)..."
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
                  📍 {loadingCoords ? "Locating..." : "Use My GPS Location"}
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
                return (
                  <li className="report-item" key={r._id}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className={`badge ${statusColors[r.status] || "badge-info"}`} style={{ fontSize: "0.7rem", fontWeight: 800 }}>
                          {r.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="report-desc">{r.description}</div>
                      <div className="report-meta">
                        📍 Coordinates: {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
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
