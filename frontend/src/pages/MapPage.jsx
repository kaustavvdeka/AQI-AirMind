import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { api } from "../api/client.js";
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
  const [vopGrid, setVopGrid] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [dispersionData, setDispersionData] = useState(null);
  const [trafficLayer, setTrafficLayer] = useState(null);
  const [industryLayer, setIndustryLayer] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecastHour, setForecastHour] = useState(0);

  const [layers, setLayers] = useState({
    vopGrid: true,
    hotspots: true,
    dispersion: true,
    traffic: true,
    industry: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const wx = await api.liveWeather(coords.lat, coords.lon);
        setWeather(wx);

        const [vopRes, dRes, tRes, iRes] = await Promise.allSettled([
          fetch(`/api/intelligence/spatial-fusion?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/dispersion?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/layers/traffic?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
          fetch(`/api/intelligence/layers/industry?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.json()),
        ]);

        if (vopRes.status === "fulfilled") setVopGrid(vopRes.value);
        if (dRes.status === "fulfilled") setDispersionData(dRes.value);
        if (tRes.status === "fulfilled") setTrafficLayer(tRes.value);
        if (iRes.status === "fulfilled") setIndustryLayer(iRes.value);

        const ws = wx?.windSpeed || 3.8;
        const wd = wx?.windDeg || 220.0;
        const hs = await api.hotspots(ws, wd, coords.lat, coords.lon);
        setHotspots(hs);
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

  return (
    <div className="page animate-in" style={{ paddingBottom: 40 }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>GIS Hybrid Spatial Command Center</h1>
          <p>Fusing Ground Sensors, Sentinel-5P Satellite Rasters, Road Density, and Virtual Observation Points (VOPs).</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
          📍 Centered: {location} ({coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E)
        </span>
      </header>

      {/* Layer Toggle Bar */}
      <div className="map-controls" style={{ marginBottom: 16, background: "rgba(15, 20, 28, 0.85)", padding: "12px 18px", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 8 }}>
          🗺️ GIS Fusion Layers:
        </div>
        <div className="map-layer-controls" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.vopGrid} onChange={() => toggle("vopGrid")} />
            🌐 Virtual Observation Points (VOP Grid)
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.virtualSensors} onChange={() => toggle("virtualSensors")} />
            📡 Virtual Sensor Network (GPR / Kriging)
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.hotspots} onChange={() => toggle("hotspots")} />
            🔥 Adaptive HDBSCAN Hotspots
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.dispersion} onChange={() => toggle("dispersion")} />
            💨 4D Atmospheric Digital Twin
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.traffic} onChange={() => toggle("traffic")} />
            🚗 Traffic Density
          </label>
          <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            <input type="checkbox" checked={layers.industry} onChange={() => toggle("industry")} />
            🏭 Industrial Stacks
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fusing Multi-Source Spatial Layers & VOP Grids...</p>
        </div>
      ) : (
        <div className="map-container" style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
          <MapContainer center={[coords.lat, coords.lon]} zoom={12} style={{ height: "650px", width: "100%" }}>
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <RecenterMap coords={coords} />

            {/* 1. Virtual Observation Points (VOP Grid Polygons) */}
            {layers.vopGrid && vopGrid?.features?.map((f) => {
              const props = f.properties;
              return (
                <Polygon
                  key={f.id}
                  positions={f.geometry.coordinates[0].map(([lon, lat]) => [lat, lon])}
                  pathOptions={{
                    fillColor: props.color,
                    fillOpacity: 0.22,
                    color: props.color,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <h4 style={{ fontSize: "0.88rem", margin: "0 0 4px 0", color: props.color }}>Virtual Node {props.vop_id}</h4>
                      <div>AQI: <strong>{props.aqi} ({props.category})</strong></div>
                      <div>Dominant: <strong>{props.dominant_pollutant}</strong></div>
                      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "6px 0" }} />
                      <div style={{ fontSize: "0.78rem" }}>
                        <div>Road Density: <strong>{props.road_density_km} km/km²</strong></div>
                        <div>Built-Up Ratio: <strong>{props.built_up_ratio}</strong></div>
                        <div>NDVI Canopy: <strong>{props.ndvi_index}</strong></div>
                        <div>Satellite NO₂: <strong>{props.satellite_no2_mol_m2} mol/m²</strong></div>
                        <div>Pop Density: <strong>{props.population_density_sqkm} /km²</strong></div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* 2. DBSCAN Hotspots over Enriched VOP Dataset */}
            {layers.hotspots && hotspots.map((h, idx) => (
              <Circle
                key={`hs-${idx}`}
                center={h.center}
                radius={h.radius_meters}
                pathOptions={{ fillColor: "#ff3d00", fillOpacity: 0.35, color: "#ff3d00", weight: 2 }}
              >
                <Popup>
                  <div>
                    <h4 style={{ margin: 0, color: "#ff3d00" }}>🔥 Enriched Hotspot Cluster {h.cluster_id + 1}</h4>
                    <div>Mean Cluster AQI: <strong>{h.mean_aqi}</strong></div>
                    <div>Confidence Score: <strong>{h.confidence_score}%</strong></div>
                    <div>Contributing VOP Nodes: <strong>{h.sample_count}</strong></div>
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
                    <div>Max Reach: <strong>{dispersionData.summary.max_reach_km} km</strong></div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* 4. Traffic Layer */}
            {layers.traffic && trafficLayer?.congestion_pct && (
              <CircleMarker
                center={[coords.lat + 0.01, coords.lon + 0.015]}
                radius={16}
                pathOptions={{ fillColor: "#ffea00", fillOpacity: 0.8, color: "#ffffff" }}
              >
                <Popup>
                  <div>
                    <h4>🚗 Traffic Emissions ({trafficLayer.source})</h4>
                    <div>Congestion: <strong>{trafficLayer.congestion_pct}%</strong></div>
                    <div>Emission Rate: <strong>{trafficLayer.emission_score_ug_m3} µg/m³</strong></div>
                  </div>
                </Popup>
              </CircleMarker>
            )}

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
          </MapContainer>
        </div>
      )}
    </div>
  );
}
