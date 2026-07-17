const AQI_THRESHOLDS = [
  { max: 50,  label: "Good",       cls: "aqi-good"     },
  { max: 100, label: "Satisfactory",cls: "aqi-satisf"  },
  { max: 200, label: "Moderate",   cls: "aqi-moderate" },
  { max: 300, label: "Poor",       cls: "aqi-poor"     },
  { max: 400, label: "Very Poor",  cls: "aqi-vpoor"    },
  { max: Infinity, label: "Severe",cls: "aqi-severe"   },
];

export function getAqiClass(value) {
  if (value == null || isNaN(value)) return "";
  for (const t of AQI_THRESHOLDS) {
    if (value <= t.max) return t.cls;
  }
  return "aqi-severe";
}

export function getAqiLabel(value) {
  if (value == null || isNaN(value)) return "N/A";
  for (const t of AQI_THRESHOLDS) {
    if (value <= t.max) return t.label;
  }
  return "Severe";
}

export function getBadgeClass(value) {
  const map = {
    "aqi-good":     "badge-good",
    "aqi-satisf":   "badge-satisf",
    "aqi-moderate": "badge-moderate",
    "aqi-poor":     "badge-poor",
    "aqi-vpoor":    "badge-vpoor",
    "aqi-severe":   "badge-severe",
  };
  return map[getAqiClass(value)] || "badge-info";
}

export default function AqiCard({ label, value, unit, sub }) {
  const numVal = parseFloat(value);
  const aqiClass = label === "Current AQI" || label === "AQI"
    ? getAqiClass(numVal)
    : "";

  const displayVal =
    value == null ? "—"
    : typeof value === "number" ? Number.isInteger(value) ? value : value.toFixed(1)
    : value;

  return (
    <div className={`aqi-card ${aqiClass}`}>
      <div className="aqi-card-label">{label}</div>
      <div className="aqi-card-value">
        {displayVal}
        {unit && <span className="aqi-card-unit">&nbsp;{unit}</span>}
      </div>
      {sub && <div className="aqi-card-sub">{sub}</div>}
    </div>
  );
}
