import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "../context/LocationContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/map",       label: "Map",       icon: "🗺️" },
  { to: "/satellite", label: "Satellite", icon: "🛰️" },
  { to: "/prediction",label: "Forecast",  icon: "🔮" },
  { to: "/citizen",   label: "Citizen",   icon: "👥" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { location, setLocation, setCoords } = useLocation();
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchVal.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchVal.trim() + ", India"
        )}&format=json&limit=1`
      );
      if (!response.ok) throw new Error("Search service failed");
      const data = await response.json();
      if (data.length === 0) {
        alert(`Location "${searchVal}" not found. Please clarify spelling.`);
        return;
      }
      const top = data[0];
      const newLat = parseFloat(top.lat);
      const newLon = parseFloat(top.lon);
      const name = top.name || top.display_name.split(",")[0];
      
      setLocation(name);
      setCoords({ lat: newLat, lon: newLon });
      setSearchVal("");
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  return (
    <nav className="navbar" style={{ padding: "0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <NavLink to="/" className="navbar-brand">
          AirMind AI
        </NavLink>

        <div className="navbar-links">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? "active" : ""}
            >
              <span style={{ marginRight: 5 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => isActive ? "active" : ""}
            >
              <span style={{ marginRight: 5 }}>⚙️</span>Admin
            </NavLink>
          )}
        </div>
      </div>

      {/* Global Location Search */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flexGrow: 0.3, maxWidth: 360 }}>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="text"
            className="form-input"
            placeholder={`Search places in India... (Current: ${location})`}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{ 
              padding: "7px 12px 7px 32px", 
              fontSize: "0.82rem",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-strong)"
            }}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.82rem", opacity: 0.5 }}>
            🔍
          </span>
        </div>
      </form>

      <div className="navbar-auth">
        {user ? (
          <>
            <span className="navbar-user">
              {user.name}
              <span style={{ marginLeft: 6, padding: "2px 7px", background: "rgba(45,212,191,0.12)", color: "var(--accent)", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700 }}>
                {user.role}
              </span>
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-primary btn-sm">
            Sign In
          </NavLink>
        )}
      </div>
    </nav>
  );
}
