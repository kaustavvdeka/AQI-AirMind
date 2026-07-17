import { Link } from "react-router-dom";

const FEATURES = [
  { icon: "📡", title: "Real-time AQI", desc: "Live pollutant readings from OpenAQ monitoring stations across the region." },
  { icon: "🔮", title: "24–72h Forecasts", desc: "Random Forest & XGBoost models trained on satellite + ground data predict AQI ahead of time." },
  { icon: "🧠", title: "Explainable AI", desc: "Understand exactly which factors — traffic, wind, weather — are driving AQI with SHAP analysis." },
  { icon: "🗺️", title: "Pollution Hotspots", desc: "Interactive GIS map overlays of hotspots, hospitals, schools, and industrial zones." },
  { icon: "✨", title: "AI Recommendations", desc: "Gemini-generated action plans for authorities, grounded in current sensor data." },
  { icon: "📱", title: "Citizen Reporting", desc: "Citizens report pollution incidents with GPS coordinates and photographic evidence." },
];

const STEPS = [
  { num: "01", text: "Satellite (Sentinel-5P) and ground-station (OpenAQ, OpenWeather) data is continuously fetched and cached." },
  { num: "02", text: "A Random Forest / XGBoost model trains on merged pollutant, weather, and satellite features with lag and rolling statistics." },
  { num: "03", text: "The FastAPI AI service serves 24/48/72h AQI predictions with feature-importance explanations." },
  { num: "04", text: "The dashboard, map, satellite viewer, and citizen portal surface it all with AI-generated policy recommendations." },
];

const STATS = [
  { value: "5P", label: "Sentinel Data" },
  { value: "72h", label: "Forecast Horizon" },
  { value: "99%", label: "Uptime SLA" },
  { value: "300+", label: "Features Engineered" },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="hero animate-in">
        <div className="hero-eyebrow">
          🌐 AI-Powered Urban Air Intelligence
        </div>
        <h1>Clean Air Starts<br />with Smart Data</h1>
        <p className="hero-tagline">Predict. Prevent. Protect.</p>
        <p className="hero-sub">
          AirMind AI combines satellite imagery, ground sensors, and machine
          learning to give citizens and governments the information they need
          to fight air pollution.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Open Dashboard →
          </Link>
          <Link to="/map" className="btn btn-secondary btn-lg">
            View Live Map
          </Link>
        </div>

        <div className="hero-stats">
          {STATS.map((s) => (
            <div key={s.label} className="hero-stat-item">
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ─── Features ─────────────────────────────────────────── */}
      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Platform Features</span>
          <h2>Everything You Need to<br />Monitor Urban Air Quality</h2>
          <p>From raw satellite data to actionable policy recommendations — all in one platform.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-card animate-in stagger-${Math.min(i + 1, 4)}`}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="section">
        <div className="section-header">
          <span className="eyebrow">How It Works</span>
          <h2>From Data to Decision<br />in Four Steps</h2>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="step">
              <div className="step-num">{s.num}</div>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="section" style={{ textAlign: "center", paddingTop: 40, paddingBottom: 80 }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(129,140,248,0.06))",
            border: "1px solid rgba(45,212,191,0.2)",
            borderRadius: 24,
            padding: "48px 32px",
          }}
        >
          <h2 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 12 }}>
            Ready to Explore?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
            Open the live dashboard or register as a citizen to report pollution in your area.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Create Account</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>
          <span>AirMind AI</span> — Urban Air Quality Intelligence Platform<br />
          <span style={{ fontSize: "0.78rem" }}>
            Powered by OpenAQ · OpenWeather · Google Earth Engine · Sentinel-5P · Gemini AI
          </span>
        </p>
      </footer>
    </div>
  );
}
