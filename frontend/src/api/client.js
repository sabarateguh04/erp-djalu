async function get(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return res.json();
}

export const api = {
  getSummary: () => get("/summary"),
  getProducts: () => get("/products"),
  getTrend: () => get("/trend"),
  getNotifications: () => get("/notifications"),
  getAIRecommendations: () => get("/ai-recommendations"),
  getNextRelease: () => get("/next-release"),
  getFinalProducts: () => get("/final-products"),
};
