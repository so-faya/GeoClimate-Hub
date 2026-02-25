let scpCache: any | null = null;

async function loadScp2025(): Promise<any> {
  if (scpCache) return scpCache;

  const res = await fetch("/data/scp-2025.json");
  if (!res.ok) throw new Error("Failed to load SCP 2025 JSON");
  scpCache = await res.json();
  return scpCache;
}

/**
 * Returns LGA-specific SCP if available, else state-level fallback (_state).
 */
export async function getScpOutlook(stateName: string, lgaName: string) {
  const scp = await loadScp2025();
  const state = scp?.[stateName];
  if (!state) return null;

  return state?.[lgaName] || state?._state || null;
}
