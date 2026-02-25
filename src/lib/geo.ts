import type { FeatureCollection } from "geojson";

export async function loadGeoJSON(url: string): Promise<FeatureCollection> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

export function getAdm1Name(f: any): string {
  const p = f?.properties ?? {};
   return (
    p.adm1_name ||     
    p.ADM1_EN ||
    p.ADM1_NAME ||
    p.NAME_1 ||
    p.STATE_NAME ||
    p.shapeName ||
    p.name ||
    ""
  );
}

export function getAdm2Name(f: any): string {
  const p = f?.properties ?? {};
  return (
    p.adm2_name ||     
    p.ADM2_EN ||
    p.ADM2_NAME ||
    p.NAME_2 ||
    p.LGA_NAME ||
    p.shapeName ||
    p.name ||
    ""
  );
}

export function getFeatureName(f: any): string {
  // Prefer ADM1/ADM2 English names when present
  return (
    getAdm2Name(f) ||
    getAdm1Name(f) ||
    f?.properties?.shapeName ||
    f?.properties?.name ||
    "Unknown"
  );
}
