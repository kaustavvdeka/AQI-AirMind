const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

async function request(path, options = {}) {
  const token = localStorage.getItem("airmind_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || body.detail || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name, email, password) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  // AQI
  currentAqi: (location) => request(`/api/aqi/current?location=${encodeURIComponent(location)}`),
  liveAqi: (lat, lon, location) => request(`/api/aqi/live?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`),
  latestAqi: () => request("/api/aqi/latest"),
  aqiHistory: (location, days = 7) =>
    request(`/api/aqi/history?location=${encodeURIComponent(location)}&days=${days}`),

  // Weather
  liveWeather: (lat, lon) => request(`/api/weather/live?lat=${lat}&lon=${lon}`),

  // Prediction
  predict: (hours) => request(hours ? `/api/prediction?hours=${hours}` : "/api/prediction"),
  trainModel: (forceRebuildData = false) =>
    request("/api/prediction/train", { method: "POST", body: JSON.stringify({ forceRebuildData }) }),

  // Recommendations / explainability
  recommendations: () => request("/api/recommendations"),

  // History (combined actual + predicted)
  history: (location, days = 30) =>
    request(`/api/history?location=${encodeURIComponent(location)}&days=${days}`),

  // Citizen reports
  submitReport: (payload) => request("/api/reports", { method: "POST", body: JSON.stringify(payload) }),
  myReports: () => request("/api/reports/mine"),

  // Admin
  allReports: () => request("/api/reports"),
  updateReportStatus: (id, status) =>
    request(`/api/reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
