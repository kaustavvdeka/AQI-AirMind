import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline, Polygon, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { api } from "../api/client.js";
import { getAqiClass, getAqiLabel, getBadgeClass } from "../components/AqiCard.jsx";
import { useLocation } from "../context/LocationContext.jsx";

// Recenter subcomponent to animate map panning to search coordinates
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lon], 12, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

const OSM_FACILITIES = [
  { type: "Hospital", name: "Regional Hospital Facility", offsetLat: 0.011, offsetLon: 0.025 },
  { type: "School", name: "Central Educational Institution", offsetLat: -0.007, offsetLon: -0.015 },
  { type: "Industrial Area", name: "Local Processing Zone", offsetLat: 0.035, offsetLon: 0.048 },
  { type: "Park", name: "Green Canopy Reserve", offsetLat: -0.002, offsetLon: -0.024 },
];

export default function MapPage() {
  const { location, coords, aqi } = useLocation();
  const [stations, setStations] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [weather, setWeather] = useState(null);
  const [forecastHour, setForecastHour] = useState(0); // 0 (Live), 24, 48, 72 hours
  const [layers, setLayers] = useState({
    stations: true,
    heatmap: true,
    hotspots: true,
    windVectors: true,
    Hospital: true,
    School: true,
    "Industrial Area": true,
    Park: true,
  });
  const [loading, setLoading] = useState(true);

  // Load weather and hotspots
  useEffect(() => {
    async function loadData() {
      try {
        const wx = await api.liveWeather(coords.lat, coords.lon);
        setWeather(wx);
        
        // Fetch hotspots with wind vectors from AI clustering service
        const ws = wx?.windSpeed || 3.0;
        const wd = wx?.windDeg || 180.0;
        const hs = await api.hotspots(ws, wd);
        setHotspots(hs);
      } catch (err) {
        console.error("Could not fetch hotspots or weather data:", err);
      }
    }
    loadData();
  }, [coords]);

  // Load stations
  useEffect(() => {
    async function loadStations() {
      setLoading(true);
      try {
        const data = await api.latestAqi();
        if (data && data.length > 0) {
          setStations(data);
        } else {
          setStations([
            { location: "Guwahati Central", lat: 26.1445, lon: 91.7362, aqi: 154, pm25: 61, pm10: 110, no2: 45, so2: 12, co: 1.8, o3: 80 },
            { location: "Dispur", lat: 26.1398, lon: 91.7915, aqi: 82, pm25: 27, pm10: 55, no2: 24, so2: 8, co: 0.9, o3: 62 },
            { location: "Jalukbari", lat: 26.152, lon: 91.674, aqi: 185, pm25: 78, pm10: 132, no2: 52, so2: 15, co: 2.1, o3: 94 },
            { location: "Khanapara", lat: 26.115, lon: 91.815, aqi: 240, pm25: 115, pm10: 190, no2: 70, so2: 22, co: 3.2, o3: 110 },
          ]);
        }
      } catch {
        setStations([
          { location: "Guwahati Central", lat: 26.1445, lon: 91.7362, aqi: 154, pm25: 61, pm10: 110, no2: 45, so2: 12, co: 1.8, o3: 80 },
          { location: "Dispur", lat: 26.1398, lon: 91.7915, aqi: 82, pm25: 27, pm10: 55, no2: 24, so2: 8, co: 0.9, o3: 62 },
          { location: "Jalukbari", lat: 26.152, lon: 91.674, aqi: 185, pm25: 78, pm10: 132, no2: 52, so2: 15, co: 2.1, o3: 94 },
          { location: "Khanapara", lat: 26.115, lon: 91.815, aqi: 240, pm25: 115, pm10: 190, no2: 70, so2: 22, co: 3.2, o3: 110 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadStations();
  }, []);

  function toggle(type) {
    setLayers((l) => ({ ...l, [type]: !l[type] }));
  }

  function getAqiColor(val) {
    if (val <= 50)  return "#22c55e";
    if (val <= 100) return "#84cc16";
    if (val <= 200) return "#eab308";
    if (val <= 300) return "#f97316";
    if (val <= 400) return "#ef4444";
    return "#a855f7";
  }

  // Prepend current active location from context
  const activeStation = aqi ? {
    location: location,
    lat: coords.lat,
    lon: coords.lon,
    aqi: aqi.aqi,
    pm25: aqi.pm25,
    pm10: aqi.pm10,
    no2: aqi.no2,
    so2: aqi.so2,
    co: aqi.co,
    o3: aqi.o3
  } : null;

  const displayStations = [...stations];
  if (activeStation && !displayStations.some((s) => s.location.toLowerCase() === activeStation.location.toLowerCase())) {
    displayStations.unshift(activeStation);
  }

  // Apply forecast offsets: simulate drift & pollution accumulation over selected hours
  const mappedStations = displayStations.map((s) => {
    if (forecastHour === 0) return s;
    
    // Simulate forecast accumulation: standard weather parameters influence growth
    const wd = weather?.windSpeed || 3.0;
    const direction_deg = weather?.windDeg || 180.0;
    
    // If wind is high, dispersion reduces forecast AQI slightly, low wind traps and raises it
    const dispersion_factor = wd < 3.0 ? 1.25 : 0.85;
    const time_multiplier = forecastHour / 24;
    
    const aqi_delta = time_multiplier * 18 * dispersion_factor * Math.sin(s.lat + forecastHour);
    const forecastedAqi = Math.max(0, Math.min(500, s.aqi + aqi_delta));
    
    return {
      ...s,
      aqi: forecastedAqi,
      // Apply offset to lat/lon showing simulated pollutant clouds drifting downwind
      lat: s.lat + (time_multiplier * wd * Math.cos(direction_deg * Math.PI / 180.0) * 0.003),
      lon: s.lon + (time_multiplier * wd * Math.sin(direction_deg * Math.PI / 180.0) * 0.003)
    };
  });

  const dynamicFacilities = OSM_FACILITIES.map((f) => ({
    ...f,
    position: [coords.lat + f.offsetLat, coords.lon + f.offsetLon]
  }));

  // Build wind vector arrow line offsets
  const windLines = mappedStations.map((s) => {
    const ws = weather?.windSpeed || 3.0;
    const wd = weather?.windDeg || 180.0;
    const rad = (wd * Math.PI) / 180.0;
    
    // Length of wind vector arrow
    const len = 0.006 * ws;
    const endLat = s.lat + len * Math.cos(rad);
    const endLon = s.lon + len * Math.sin(rad);
    
    // Draw simple arrowhead lines
    const headLen = len * 0.25;
    const arrowLeftLat = endLat - headLen * Math.cos(rad - Math.PI / 6);
    const arrowLeftLon = endLon - headLen * Math.sin(rad - Math.PI / 6);
    const arrowRightLat = endLat - headLen * Math.cos(rad + Math.PI / 6);
    const arrowRightLon = endLon - headLen * Math.sin(rad + Math.PI / 6);

    return {
      line: [[s.lat, s.lon], [endLat, endLon]],
      arrowLeft: [[endLat, endLon], [arrowLeftLat, arrowLeftLon]],
      arrowRight: [[endLat, endLon], [arrowRightLat, arrowRightLon]]
    };
  });

  return (
    <div className="page animate-in">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Interactive GIS Hotspot Map</h1>
          <p>Analyze localized ground station AQI values combined with municipal facility layers.</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
          📍 Centered Location: {location}
        </span>
      </header>

      {/* Map Control Settings Panel */}
      <div className="map-controls animate-in stagger-1">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", marginRight: 8 }}>
          🗺️ Layer Toggles:
        </div>
        <div className="map-layer-controls">
          <label>
            <input type="checkbox" checked={layers.stations} onChange={() => toggle("stations")} />
            Ground Stations
          </label>
          <label>
            <input type="checkbox" checked={layers.heatmap} onChange={() => toggle("heatmap")} />
            Pollution Heatmap
          </label>
          <label>
            <input type="checkbox" checked={layers.hotspots} onChange={() => toggle("hotspots")} />
            🔥 DBSCAN Hotspots
          </label>
          <label>
            <input type="checkbox" checked={layers.windVectors} onChange={() => toggle("windVectors")} />
            💨 Wind Vectors
          </label>
          <span style={{ margin: "0 8px", color: "var(--border-strong)" }}>|</span>
          <label>
            <input type="checkbox" checked={layers.Hospital} onChange={() => toggle("Hospital")} />
            🏥 Hospitals
          </label>
          <label>
            <input type="checkbox" checked={layers.School} onChange={() => toggle("School")} />
            🏫 Schools
          </label>
          <label>
            <input type="checkbox" checked={layers["Industrial Area"]} onChange={() => toggle("Industrial Area")} />
            🏭 Industrial
          </label>
          <label>
            <input type="checkbox" checked={layers.Park} onChange={() => toggle("Park")} />
            🌳 Parks
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading GIS datasets and map tiles…</p>
        </div>
      ) : (
        <div className="map-container animate-in stagger-2" style={{ position: "relative" }}>
          <MapContainer 
            center={[coords.lat, coords.lon]} 
            zoom={12} 
            style={{ height: "600px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <RecenterMap coords={coords} />

            {/* Heatmap overlay using large translucent circles around station hotspots */}
            {layers.heatmap && mappedStations.map((s, idx) => (
              <Circle
                key={`heat-${idx}`}
                center={[s.lat, s.lon]}
                radius={2400}
                pathOptions={{
                  fillColor: getAqiColor(s.aqi),
                  fillOpacity: 0.18,
                  stroke: false
                }}
              />
            ))}

            {/* DBSCAN Hotspots and Wind Drift Polygons */}
            {layers.hotspots && hotspots.map((h, idx) => (
              <div key={`hotspot-group-${idx}`}>
                {/* Hotspot Center Boundary */}
                <Circle
                  center={h.center}
                  radius={h.radius_meters}
                  pathOptions={{
                    fillColor: "#ef4444",
                    fillOpacity: 0.22,
                    color: "#ef4444",
                    weight: 2,
                    dashArray: "4, 6"
                  }}
                />
                
                {/* Bounding Polygon shifted downwind */}
                <Polygon
                  positions={h.drift_bounds}
                  pathOptions={{
                    fillColor: "#f97316",
                    fillOpacity: 0.08,
                    color: "#f97316",
                    weight: 1,
                    dashArray: "3, 5"
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <h3 style={{ fontSize: "0.9rem", margin: "0 0 6px 0", color: "#f97316" }}>
                        🔥 DBSCAN Cluster {h.cluster_id + 1}
                      </h3>
                      <div>Active Points: <strong>{h.sample_count} nodes</strong></div>
                      <div>Mean Cluster AQI: <strong>{h.mean_aqi} ({getAqiLabel(h.mean_aqi)})</strong></div>
                      <div style={{ margin: "4px 0" }}>
                        Hotspot Confidence: <span style={{ color: "#ef4444", fontWeight: 700 }}>{h.confidence_score}%</span>
                      </div>
                      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />
                      <div style={{ fontSize: "0.78rem" }}>
                        <strong>Estimated Source Apportionment:</strong>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span>Traffic: {h.source_attribution?.Traffic}%</span>
                          <span>Industry: {h.source_attribution?.Industry}%</span>
                          <span>Biomass: {h.source_attribution?.Biomass}%</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              </div>
            ))}

            {/* Wind Vector Lines */}
            {layers.windVectors && windLines.map((wl, idx) => (
              <div key={`wind-${idx}`}>
                <Polyline positions={wl.line} pathOptions={{ color: "#2dd4bf", weight: 2, opacity: 0.8 }} />
                <Polyline positions={wl.arrowLeft} pathOptions={{ color: "#2dd4bf", weight: 2, opacity: 0.8 }} />
                <Polyline positions={wl.arrowRight} pathOptions={{ color: "#2dd4bf", weight: 2, opacity: 0.8 }} />
              </div>
            ))}

            {/* Ground Stations */}
            {layers.stations && mappedStations.map((s, idx) => (
              <CircleMarker
                key={`station-${idx}`}
                center={[s.lat, s.lon]}
                radius={14}
                pathOptions={{
                  fillColor: getAqiColor(s.aqi),
                  fillOpacity: 0.9,
                  color: s.location.toLowerCase() === location.toLowerCase() ? "var(--accent)" : "#060a10",
                  weight: s.location.toLowerCase() === location.toLowerCase() ? 3 : 2
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200, padding: "4px 0" }}>
                    <h3 style={{ fontSize: "0.95rem", margin: "0 0 6px 0", fontWeight: 800 }}>
                      📍 {s.location}
                    </h3>
                    <div style={{ marginBottom: 12 }}>
                      <span className={`badge ${getBadgeClass(s.aqi)}`}>
                        AQI {Math.round(s.aqi)} · {getAqiLabel(s.aqi)}
                      </span>
                    </div>
                    {forecastHour > 0 && (
                      <div style={{ fontSize: "0.78rem", color: "var(--accent)", marginBottom: 8, fontWeight: 600 }}>
                        🔮 Forecast Shift: +{forecastHour} Hours
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: "0.78rem" }}>
                      <div>PM2.5: <strong>{s.pm25 ? s.pm25.toFixed(1) : "—"} µg/m³</strong></div>
                      <div>PM10: <strong>{s.pm10 ? s.pm10.toFixed(1) : "—"} µg/m³</strong></div>
                      <div>NO₂: <strong>{s.no2 ? s.no2.toFixed(1) : "—"} µg/m³</strong></div>
                      <div>O₃: <strong>{s.o3 ? s.o3.toFixed(1) : "—"} µg/m³</strong></div>
                      <div>SO₂: <strong>{s.so2 ? s.so2.toFixed(1) : "—"} µg/m³</strong></div>
                      <div>CO: <strong>{s.co ? s.co.toFixed(2) : "—"} mg/m³</strong></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Municipal/OSM Overpass facility layers */}
            {dynamicFacilities.filter((f) => layers[f.type]).map((f, idx) => {
              const markerIcons = {
                Hospital: "🏥",
                School: "🏫",
                "Industrial Area": "🏭",
                Park: "🌳"
              };
              return (
                <Marker 
                  key={`facility-${idx}`} 
                  position={f.position}
                >
                  <Popup>
                    <div style={{ fontWeight: 600 }}>
                      {markerIcons[f.type]} {f.type}: {f.name} ({location} branch)
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Time Slider Overlay */}
          <div 
            style={{ 
              position: "absolute", 
              bottom: 24, 
              left: "50%", 
              transform: "translateX(-50%)", 
              zIndex: 1000,
              width: "80%",
              maxWidth: 500,
              padding: "12px 24px",
              borderRadius: "100px",
              background: "rgba(13, 18, 25, 0.95)",
              border: "1px solid var(--border-strong)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
              <span>🕒 Time Horizon Slider:</span>
              <span style={{ color: "var(--accent)" }}>
                {forecastHour === 0 ? "LIVE Ground Station Metrics" : `🔮 Forecast +${forecastHour} Hours`}
              </span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={72} 
              step={24} 
              value={forecastHour} 
              onChange={(e) => setForecastHour(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
              <span>Live</span>
              <span>24h Forecast</span>
              <span>48h Forecast</span>
              <span>72h Forecast</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div 
        className="card-glass" 
        style={{ 
          marginTop: 20, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          padding: "16px 24px"
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <strong>CPCB AQI Scale Legend:</strong>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }}></span> Good (0-50)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#84cc16" }}></span> Satisfactory (51-100)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }}></span> Moderate (101-200)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f97316" }}></span> Poor (201-300)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }}></span> Very Poor (301-400)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#a855f7" }}></span> Severe (401-500)
          </span>
        </div>
      </div>
    </div>
  );
}
