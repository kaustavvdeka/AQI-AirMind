const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

async function callAiService(path, options = {}) {
  const res = await fetch(`${AI_SERVICE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.detail || `AI service error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const aiClient = {
  predict: (hours) => callAiService(hours ? `/predict?hours=${hours}` : "/predict"),
  explain: () => callAiService("/explain"),
  modelInfo: () => callAiService("/model-info"),
  train: (forceRebuildData = false) =>
    callAiService("/train", { method: "POST", body: JSON.stringify({ force_rebuild_data: forceRebuildData }) }),
  retrain: () => callAiService("/retrain", { method: "POST" }),
};
