import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline, Polygon, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { api } from "../api/client.js";
import { getAqiClass, getAqiLabel, getBadgeClass } from "../components/AqiCard.jsx";
import { useLocation } from "../context/LocationContext.jsx";

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lon], 12, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export default function MapPage() {
  const { location, coords, aqi } = useLocation();
  const [stations, setStations] = useState([]);
  const [gridData, setGridData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [dispersionData, setDispersionData] = useState(null);
  const [trafficLayer, setTrafficLayer] = useState(null);
  const [industryLayer, setIndustryLayer] = useState(null);
  const [constructionLayer, setConstructionLayer] = useState(null);
  const [wasteLayer, setWasteLayer] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecastHour, setForecastHour] = useState(0);

  const [layers, setLayers] = useState({
    grid: true,
    hotspots: true,
    dispersion: true,
    traffic: true,
    industry: true,
    construction: true,
    waste: true,
    stations: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const wx = await api.liveWeather(coords.lat, coords.lon);
        setWeather(wx);

        // Fetch Intelligence API layers
        const [gRes, hRes, dRes, tRes, iRes, cRes, wRes] = await Promise.allSettled([
          fetch(`/api/intelligence/grid-prediction?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/source-attribution`).then((r) => r.json()),
          fetch(`/api/intelligence/dispersion?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/layers/traffic?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/layers/industry?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/layers/construction?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/layers/waste-burning?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
        ]);

        if (gRes.status === "fulfilled") setGridData(gRes.value);
        if (dRes.status === "fulfilled") setDispersionData(dRes.value);
        if (tRes.status === "fulfilled") setTrafficLayer(tRes.value);
        if (iRes.status === "fulfilled") setIndustryLayer(iRes.value);
        if (cRes.status === "fulfilled") setConstructionLayer(cRes.value);
        if (wRes.status === "fulfilled") setWasteLayer(wRes.value);

        const ws = wx?.windSpeed || 3.2;
        const wd = wx?.windDeg || 180.0;
        const hs = await api.hotspots(ws, wd);
        setHotspots(hs);

        setStations([
          { location: location, lat: coords.lat, lon: coords.lon, aqi: aqi?.aqi || 145, pm25: aqi?.pm25 || 65 },
          { location: "Jalukbari Transit Hub", lat: coords.lat + 0.015, lon: coords.lon - 0.04, aqi: 185, pm25: 88 },
          { location: "Khanapara Industrial Gate", lat: coords.lat - 0.03, lon: coords.lon + 0.08, aqi: 240, pm25: 115 },
        ]);
      } catch (err) {
        console.error("GIS Layer Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coords, location]);

  function toggle(type) {
    setLayers((l) => ({ ...l, [type]: !l[type] }));
  }

  function getAqiColor(val) {
    if (val <= 50) return "#00e676";
    if (val <= 100) return "#76ff03";
    if (val <= 200) return "#ffea00";
    if (val <= 300) return "#ff9100";
    if (val <= 400) return "#ff3d00";
    return "#dd2c00";
  }

  return (
    <div className="page animate-in" style={{ paddingBottom: 40 }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>GIS Air Quality Command Center</h1>
          <p>Hyperlocal 1 km × 1 km Prediction Grid, DBSCAN Hotspots, Dispersion Physics & Multi-Layer Intelligence.</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
          📍 Centered Location: {location} ({coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E)
        </span>
      </header>

      {/* Layer Toggle Bar */}
      <div className="map-controls" style={{ marginBottom: 16, background: "rgba(15, 20, 28, 0.85)", padding: "12px 18px", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 8 }}>
          🗺️ Intelligence GIS Layers:
        </div>
        <div className="map-layer-controls" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.grid} onChange={() => toggle("grid")} />
            🔲 1km Grid Prediction
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.hotspots} onChange={() => toggle("hotspots")} />
            🔥 DBSCAN Hotspots
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.dispersion} onChange={() => toggle("dispersion")} />
            💨 Gaussian Dispersion Plume
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.traffic} onChange={() => toggle("traffic")} />
            🚗 Traffic Density
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.industry} onChange={() => toggle("industry")} />
            🏭 Industrial Stacks
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.construction} onChange={() => toggle("construction")} />
            🏗️ Construction Sites
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.waste} onChange={() => toggle("waste")} />
            🔥 Waste Burning (FIRMS)
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Rendering Hyperlocal GIS Layers & Satellite Grids...</p>
        </div>
      ) : (
        <div className="map-container" style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
          <MapContainer center={[coords.lat, coords.lon]} zoom={12} style={{ height: "650px", width: "100%" }}>
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <RecenterMap coords={coords} />

            {/* 1. Hyperlocal 1 km x 1 km Prediction Grid Polygons */}
            {layers.grid && gridData?.features?.map((f) => {
              const props = f.properties;
              const aqiVal = forecastHour === 24 ? props.aqi_24h : (forecastHour === 48 ? props.aqi_48h : (forecastHour === 72 ? props.aqi_72h : props.aqi_current));
              return (
                <Polygon
                  key={f.id}
                  positions={f.geometry.coordinates[0].map(([lon, lat]) => [lat, lon])}
                  pathOptions={{
                    fillColor: props.color,
                    fillOpacity: 0.25,
                    color: props.color,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <h4 style={{ fontSize: "0.88rem", margin: "0 0 4px 0", color: props.color }}>Cell {props.cell_id}</h4>
                      <div>AQI ({forecastHour === 0 ? "Current" : `+${forecastHour}h`}): <strong>{aqiVal}</strong></div>
                      <div>Category: <strong>{props.category}</strong></div>
                      <div>Traffic Density: <strong>{props.traffic_density_pct}%</strong></div>
                      <div>Satellite NO₂: <strong>{props.satellite_no2} mol/m²</strong></div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* 2. DBSCAN Hotspots */}
            {layers.hotspots && hotspots.map((h, idx) => (
              <Circle
                key={`hs-${idx}`}
                center={h.center}
                radius={h.radius_meters}
                pathOptions={{ fillColor: "#ff3d00", fillOpacity: 0.35, color: "#ff3d00", weight: 2 }}
              >
                <Popup>
                  <div>
                    <h4 style={{ margin: 0, color: "#ff3d00" }}>🔥 Hotspot Cluster {h.cluster_id + 1}</h4>
                    <div>Mean AQI: <strong>{h.mean_aqi}</strong></div>
                    <div>Confidence: <strong>{h.confidence_score}%</strong></div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* 3. Gaussian Plume Dispersion */}
            {layers.dispersion && dispersionData?.plume_geojson && (
              <Polygon
                positions={dispersionData.plume_geojson.geometry.coordinates[0].map(([lon, lat]) => [lat, lon])}
                pathOptions={{ fillColor: "#ffea00", fillOpacity: 0.2, color: "#ffea00", weight: 2, dashArray: "4, 4" }}
              >
                <Popup>
                  <div>
                    <h4 style={{ margin: 0, color: "#ffea00" }}>💨 Gaussian Plume Dispersion</h4>
                    <div>Peak Ground Conc: <strong>{dispersionData.summary.peak_concentration_ug_m3} µg/m³</strong></div>
                    <div>Reach: <strong>{dispersionData.summary.max_reach_km} km</strong></div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* 4. Traffic Layer */}
            {layers.traffic && trafficLayer?.segments?.map((seg) => (
              <Polyline
                key={seg.segment_id}
                positions={seg.coordinates}
                pathOptions={{ color: seg.congestion_percentage > 80 ? "#ff3d00" : "#ffea00", weight: 5, opacity: 0.85 }}
              >
                <Popup>
                  <div>
                    <h4>🚗 {seg.corridor_name}</h4>
                    <div>Congestion: <strong>{seg.congestion_percentage}%</strong></div>
                    <div>Avg Speed: <strong>{seg.avg_speed_kmh} km/h</strong></div>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* 5. Industrial Stack Layer */}
            {layers.industry && industryLayer?.facilities?.map((f) => (
              <CircleMarker
                key={f.stack_id}
                center={f.coordinates}
                radius={12}
                pathOptions={{ fillColor: "#ff3d00", fillOpacity: 0.9, color: "#ffffff", weight: 2 }}
              >
                <Popup>
                  <div>
                    <h4>🏭 {f.facility_name}</h4>
                    <div>Type: <strong>{f.industry_type}</strong></div>
                    <div>SO₂ Rate: <strong>{f.so2_emission_ug_m3} µg/m³</strong></div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* 6. Construction Site Layer */}
            {layers.construction && constructionLayer?.sites?.map((s) => (
              <Circle
                key={s.site_id}
                center={s.coordinates}
                radius={s.buffer_radius_meters}
                pathOptions={{ fillColor: "#ff9100", fillOpacity: 0.3, color: "#ff9100", weight: 2, dashArray: "2, 4" }}
              >
                <Popup>
                  <div>
                    <h4>🏗️ {s.project_name}</h4>
                    <div>Dust Severity: <strong>{s.dust_severity}</strong></div>
                    <div>PM10 Emission: <strong>{s.pm10_fugitive_emission} µg/m³</strong></div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* 7. Waste Burning Layer (NASA FIRMS) */}
            {layers.waste && wasteLayer?.incidents?.map((inc) => (
              <CircleMarker
                key={inc.incident_id}
                center={inc.coordinates}
                radius={14}
                pathOptions={{ fillColor: "#dd2c00", fillOpacity: 0.95, color: "#ffea00", weight: 3 }}
              >
                <Popup>
                  <div>
                    <h4>🔥 NASA FIRMS Thermal Anomaly</h4>
                    <div>Location: <strong>{inc.location_name}</strong></div>
                    <div>FRP: <strong>{inc.fire_radiative_power_mw} MW</strong></div>
                    <div>Confidence: <strong>{inc.detection_confidence_pct}%</strong></div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Time Slider Controls */}
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "80%", maxWidth: 480, padding: "12px 24px", borderRadius: 100, background: "rgba(10, 14, 22, 0.95)", border: "1px solid var(--border-strong)", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "var(--accent)" }}>
              🔮 1km Grid Prediction Horizon: +{forecastHour} Hours
            </div>
            <input
              type="range"
              min={0}
              max={72}
              step={24}
              value={forecastHour}
              onChange={(e) => setForecastHour(Number(e.target.value))}
              style={{ width: "100%", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
              <span>Live Now</span>
              <span>+24 Hours</span>
              <span>+48 Hours</span>
              <span>+72 Hours</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
