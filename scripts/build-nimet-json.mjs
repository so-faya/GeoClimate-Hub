import fs from "fs";

function norm(s) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Trim all object keys to avoid hidden spaces in headers */
function cleanRowKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    out[String(k).trim()] = v;
  }
  return out;
}

/** Parse numbers safely: blank => null (NOT 0) */
function toNumber(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

console.log("🚀 Starting NiMet JSON build...");

const raw = JSON.parse(fs.readFileSync("./public/data/nimet_raw.json", "utf-8"));

const lgaOutput = {};
const stateMap = {};

for (const rawRow of raw) {
  const row = cleanRowKeys(rawRow);

  const state = String(row.state ?? "").trim();
  const lga = String(row.lga ?? "").trim();
  if (!state || !lga) continue;

  // ✅ FIXED: correct key is (mm), not (mmm)
  const rainfall = toNumber(row["Annual Rainfall (mm)"]);

  // Season length in your raw is "Season Length (days)"
  const seasonLength = toNumber(row["Season Length (days)"]);

  const key = `${norm(lga)}|${norm(state)}`;

  lgaOutput[key] = {
    state,
    lga,
    onset_date: row["onset_date"] ?? "",
    season_end_date: row["season_end_date"] ?? "",
    season_length_days: seasonLength,
    annual_rainfall_mm: rainfall,

    // ✅ FIXED: match raw file keys
    cessation_date: row["cessation_date"] ?? "",
    severe_dry_spell: row["Severe Dry Spell"] ?? "",
    little_dry_season: row["Little Dry Season"] ?? "",
  };

  const sKey = norm(state);
  if (!stateMap[sKey]) {
    stateMap[sKey] = {
      state,
      lga_count: 0,
      rainfalls: [],
    };
  }

  stateMap[sKey].lga_count += 1;

  // ✅ only include real numbers, ignore null/blank
  if (rainfall != null) {
    stateMap[sKey].rainfalls.push(rainfall);
  }
}

// Build state summary safely
const stateSummary = {};

for (const sKey in stateMap) {
  const entry = stateMap[sKey];
  const rains = entry.rainfalls;

  const avg =
    rains.length > 0 ? rains.reduce((a, b) => a + b, 0) / rains.length : null;

  stateSummary[sKey] = {
    state: entry.state,
    lga_count: entry.lga_count,
    avg_annual_rainfall_mm: avg != null ? Math.round(avg) : null,
    min_annual_rainfall_mm: rains.length ? Math.min(...rains) : null,
    max_annual_rainfall_mm: rains.length ? Math.max(...rains) : null,
  };
}

fs.writeFileSync("./public/data/nimet-lga.json", JSON.stringify(lgaOutput, null, 2));
fs.writeFileSync(
  "./public/data/nimet-state-summary.json",
  JSON.stringify(stateSummary, null, 2)
);

console.log("✅ NiMet JSON files generated successfully!");