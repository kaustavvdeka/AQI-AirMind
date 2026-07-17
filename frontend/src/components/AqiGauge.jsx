/**
 * AQI Semicircle Gauge — SVG-based, animated.
 * value: 0-500  |  size: px
 */
export default function AqiGauge({ value, size = 200 }) {
  const clamped = Math.max(0, Math.min(500, value || 0));
  const pct = clamped / 500;

  // AQI color stops
  const stops = [
    "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#a855f7"
  ];

  // Pick color based on AQI
  function getColor(v) {
    if (v <= 50)  return stops[0];
    if (v <= 100) return stops[1];
    if (v <= 200) return stops[2];
    if (v <= 300) return stops[3];
    if (v <= 400) return stops[4];
    return stops[5];
  }

  function getLabel(v) {
    if (v <= 50)  return "Good";
    if (v <= 100) return "Satisfactory";
    if (v <= 200) return "Moderate";
    if (v <= 300) return "Poor";
    if (v <= 400) return "Very Poor";
    return "Severe";
  }

  const color = getColor(clamped);
  const r = 70;
  const cx = size / 2;
  const cy = size / 2 + 10;
  // Semicircle arc: from 180° to 0° (left to right)
  const startAngle = Math.PI;   // 180°
  const endAngle   = 0;         // 0°
  const arc = startAngle - pct * Math.PI;

  function polarToXY(angle) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle),
    };
  }

  const start = polarToXY(startAngle);
  const end   = polarToXY(endAngle);
  const needle = polarToXY(arc);

  const trackD = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const fillD  = `M ${start.x} ${start.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${needle.x} ${needle.y}`;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Track */}
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
        {/* Value arc */}
        <path
          d={fillD}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          style={{ transition: "d 1s cubic-bezier(0.4,0,0.2,1), stroke 0.5s" }}
        />
        {/* Needle dot */}
        <circle
          cx={needle.x}
          cy={needle.y}
          r={7}
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "all 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Value text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={28} fontWeight={900} fontFamily="Inter">
          {value != null ? Math.round(clamped) : "—"}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily="Inter">
          {getLabel(clamped)}
        </text>
      </svg>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        AQI Index
      </div>
    </div>
  );
}
