import { useEffect, useState } from "react";
import { MapContainer, TileLayer, ImageOverlay, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
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

const SATELLITE_LAYERS = [
  {
    id: "no2",
    name: "Sentinel-5P NO₂ (Tropospheric Column)",
    description: "Nitrogen Dioxide levels mapping vehicular traffic and combustion hotspots.",
    colors: ["#2563eb", "#3b82f6", "#10b981", "#fbbf24", "#ef4444"],
    range: "0 - 150 µmol/m²"
  },
  {
    id: "so2",
    name: "Sentinel-5P SO₂ (Sulfur Dioxide)",
    description: "Sulfur Dioxide columns identifying industrial processing and coal emissions.",
    colors: ["#2563eb", "#60a5fa", "#a7f3d0", "#fef08a", "#f87171"],
    range: "0 - 80 µmol/m²"
  },
  {
    id: "co",
    name: "Sentinel-5P CO (Carbon Monoxide)",
    description: "Carbon Monoxide density tracking incomplete combustion and open burning.",
    colors: ["#3b82f6", "#34d399", "#fbbf24", "#f97316", "#dc2626"],
    range: "0 - 0.08 mol/m²"
  },
  {
    id: "ndvi",
    name: "MODIS NDVI (Vegetation Index)",
    description: "Normalized Difference Vegetation Index tracking urban canopy and green corridors.",
    colors: ["#fca5a5", "#fef08a", "#86efac", "#22c55e", "#15803d"],
    range: "-0.1 - 0.8"
  },
  {
    id: "lst",
    name: "MODIS Land Surface Temp (LST)",
    description: "Land surface temperature mapping urban heat islands and concrete radiation.",
    colors: ["#3b82f6", "#6ee7b7", "#fef08a", "#f97316", "#ef4444"],
    range: "18°C - 38°C"
  }
];

export default function SatellitePage() {
  const { location, coords } = useLocation();
  const [selectedLayer, setSelectedLayer] = useState(SATELLITE_LAYERS[0]);

  // Calculate dynamic bounding box offsets around selected coordinates
  const dynamicBounds = [
    [coords.lat - 0.045, coords.lon - 0.125], // South-West corner
    [coords.lat + 0.045, coords.lon + 0.125]  // North-East corner
  ];

  const gradientColors = selectedLayer.colors.join(", ");
  
  // Create an inline SVG data URI representing the satellite band raster layer
  const svgOverlayUrl = `data:image/svg+xml;utf8,
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" style="stop-color:${selectedLayer.colors[4]};stop-opacity:0.65" />
          <stop offset="40%" style="stop-color:${selectedLayer.colors[3]};stop-opacity:0.5" />
          <stop offset="70%" style="stop-color:${selectedLayer.colors[2]};stop-opacity:0.35" />
          <stop offset="90%" style="stop-color:${selectedLayer.colors[1]};stop-opacity:0.2" />
          <stop offset="100%" style="stop-color:${selectedLayer.colors[0]};stop-opacity:0.0" />
        </radialGradient>
        <radialGradient id="grad2" cx="80%" cy="20%" r="40%">
          <stop offset="0%" style="stop-color:${selectedLayer.colors[3]};stop-opacity:0.6" />
          <stop offset="60%" style="stop-color:${selectedLayer.colors[2]};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${selectedLayer.colors[0]};stop-opacity:0.0" />
        </radialGradient>
      </defs>
      <rect width="300" height="200" fill="url(%23grad1)" />
      <rect width="300" height="200" fill="url(%23grad2)" />
    </svg>`.trim().replace(/#/g, "%23");

  return (
    <div className="page animate-in">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Satellite Imagery Analysis</h1>
          <p>Explore environmental parameters mapped by Sentinel-5P and MODIS spaceborne sensors.</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
          📍 Centered Location: {location}
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 24 }} className="forecast-grid">
        {/* Layer picker */}
        <section className="card-glass" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🛰️ Spaceborne Bands</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SATELLITE_LAYERS.map((layer) => (
              <div 
                key={layer.id}
                onClick={() => setSelectedLayer(layer)}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: "1px solid",
                  borderColor: selectedLayer.id === layer.id ? "var(--accent)" : "var(--border)",
                  background: selectedLayer.id === layer.id ? "rgba(45,212,191,0.06)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: selectedLayer.id === layer.id ? "var(--accent)" : "var(--text-primary)" }}>
                  {layer.name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                  {layer.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Map visualization */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="map-container">
            <MapContainer 
              center={[coords.lat, coords.lon]} 
              zoom={12} 
              style={{ height: "540px", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* Recenter sub-component triggered by coordinates state changes */}
              <RecenterMap coords={coords} />

              <ImageOverlay
                url={svgOverlayUrl}
                bounds={dynamicBounds}
                opacity={0.7}
              >
                <Popup>
                  <div>
                    <strong>{selectedLayer.name} Overlay</strong><br />
                    Active mapping zone: {location}.
                  </div>
                </Popup>
              </ImageOverlay>
            </MapContainer>
          </div>

          {/* Colorbar Scale Legend */}
          <div 
            className="card-glass" 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "16px 20px"
            }}
          >
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Selected Layer Scale
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Tropospheric dynamic concentration grid values
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div className="satellite-legend">
                <span style={{ fontSize: "0.78rem" }}>Min</span>
                <div 
                  className="legend-scale" 
                  style={{ background: `linear-gradient(90deg, ${gradientColors})` }}
                ></div>
                <span style={{ fontSize: "0.78rem" }}>Max</span>
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>
                Range: {selectedLayer.range}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
