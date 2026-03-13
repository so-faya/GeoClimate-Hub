import { useEffect, useMemo, useState } from "react";
import type {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
} from "geojson";

import Drawer from "./components/Drawer";
import MapView from "./components/MapView";

import { loadGeoJSON, getAdm1Name, getAdm2Name } from "./lib/geo";
import { getNigeriaDateTimeString } from "./lib/nigeriaTime";
import { getStateTemp } from "./lib/temperature";

type PolyFeat = Feature<Polygon | MultiPolygon, any>;
type PolyFC = FeatureCollection<Polygon | MultiPolygon, any>;
type Selected = { state?: PolyFeat | null; lga?: PolyFeat | null };

function norm(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default function App() {
  const [introOpen, setIntroOpen] = useState(true);
  const [introClosing, setIntroClosing] = useState(false);
  const [states, setStates] = useState<PolyFC | null>(null);
  const [lgasAll, setLgasAll] = useState<PolyFC | null>(null);
  const [selected, setSelected] = useState<Selected>({
    state: null,
    lga: null,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nigeriaTime, setNigeriaTime] = useState(getNigeriaDateTimeString());
  const [stateSummary, setStateSummary] = useState<Record<string, any> | null>(
    null,
  );
  const [nimetStateOutlook, setNimetStateOutlook] = useState<Record<
    string,
    any
  > | null>(null);
  const [nimetLga, setNimetLga] = useState<Record<string, any> | null>(null);
  const [nimetStateSeasonal, setNimetStateSeasonal] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    (async () => {
      const adm1 = (await loadGeoJSON("/data/nga_adm1.geojson")) as any;
      setStates(adm1);

      const stateRes = await fetch("/data/state-summary.json");
      if (stateRes.ok) {
        const raw = await stateRes.json();
        const map: Record<string, any> = {};
        for (const entry of raw?.states ?? []) {
          if (entry?.name) map[norm(entry.name)] = entry;
        }
        setStateSummary(map);
      }

      const nimetOutlookRes = await fetch("/data/nimet-state-outlook.json");
      if (nimetOutlookRes.ok) {
        const raw: any[] = await nimetOutlookRes.json();
        const map: Record<string, any> = {};
        for (const entry of raw) {
          if (entry?.State) map[norm(entry.State)] = entry;
        }
        setNimetStateOutlook(map);
      }

      const nemetLgaRes = await fetch("/data/nimet-lga.json");
      if (nemetLgaRes.ok) setNimetLga(await nemetLgaRes.json());

      // ✅ Fetch the new seasonal outlook data
      const seasonalRes = await fetch("/data/nimet-state-seasonal.json");
      if (seasonalRes.ok) setNimetStateSeasonal(await seasonalRes.json());
    })();
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setNigeriaTime(getNigeriaDateTimeString()),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  const stateName = useMemo(
    () => (selected.state ? getAdm1Name(selected.state) : null),
    [selected.state],
  );

  const selectedLgaName = useMemo(
    () => (selected.lga ? getAdm2Name(selected.lga) : null),
    [selected.lga],
  );

  const lgasInState: PolyFC | null = useMemo(() => {
    if (!lgasAll || !stateName) return null;
    const wanted = norm(stateName);
    const filtered = lgasAll.features.filter((f: any) => {
      const p =
        f?.properties?.adm1_name ||
        f?.properties?.ADM1_EN ||
        f?.properties?.NAME_1 ||
        f?.properties?.STATE_NAME;
      return norm(p) === wanted;
    });
    return { type: "FeatureCollection", features: filtered };
  }, [lgasAll, stateName]);

  // Sorted list of all state names for the dropdown
  const stateNames: string[] = useMemo(() => {
    if (!states?.features) return [];
    return states.features
      .map((f: any) => getAdm1Name(f as PolyFeat))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [states]);

  async function onStateClick(f: PolyFeat) {
    setSelected({ state: f, lga: null });
    setDrawerOpen(true);
    if (!lgasAll) {
      const adm2 = (await loadGeoJSON("/data/nga_adm2.geojson")) as any;
      setLgasAll(adm2);
    }
  }

  function onLgaClick(f: PolyFeat) {
    setSelected((s) => ({ ...s, lga: f }));
    setDrawerOpen(true);
  }

  function onResetMap() {
    setSelected({ state: null, lga: null });
    setDrawerOpen(false);
  }

  async function onJumpToState(name: string) {
    if (!name || !states?.features) return;
    const feature = states.features.find(
      (f: any) => norm(getAdm1Name(f as PolyFeat)) === norm(name),
    ) as PolyFeat | undefined;
    if (feature) await onStateClick(feature);
  }

  const infoKey =
    selectedLgaName && stateName
      ? `${norm(selectedLgaName)}|${norm(stateName)}`
      : null;

  const isLgaSelected = Boolean(selected.lga);
  const isStateSelected = Boolean(selected.state && stateName);

  const nimetRow = infoKey ? nimetLga?.[infoKey] : null;
  const stateOutlook = stateName ? nimetStateOutlook?.[norm(stateName)] : null;
  const stateSeasonal = stateName
    ? nimetStateSeasonal?.[norm(stateName)]
    : null;
  const stateTemp = stateName ? getStateTemp(stateName) : null;

  const hasNiMetLga = Boolean(nimetRow);
  const hasStateOutlook = Boolean(stateOutlook);

  function closeIntro() {
    setIntroClosing(true);
    setTimeout(() => {
      setIntroOpen(false);
      setIntroClosing(false);
    }, 380);
  }

  return (
    <div className="layout">
      {/* ── Intro Modal ── */}
      {introOpen && (
        <>
          <style>{`
            @keyframes introOverlayIn { from { opacity:0 } to { opacity:1 } }
            @keyframes introOverlayOut { from { opacity:1 } to { opacity:0 } }
            @keyframes introCardIn { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
            @keyframes introCardOut { from { opacity:1; transform:translateY(0) } to { opacity:0; transform:translateY(14px) } }
            .intro-overlay {
              position:fixed; inset:0; z-index:99999;
              background:rgba(15,30,10,0.68); backdrop-filter:blur(5px);
              display:flex; align-items:center; justify-content:center; padding:1.25rem;
              animation: introOverlayIn 0.35s ease forwards;
            }
            .intro-overlay.closing { animation: introOverlayOut 0.35s ease forwards; }
            .intro-card {
              background:#fff; border-radius:12px;
              max-width:640px; width:100%; overflow:hidden;
              box-shadow:0 28px 72px rgba(0,0,0,0.32);
              animation: introCardIn 0.42s cubic-bezier(0.22,1,0.36,1) forwards;
              font-family:var(--font);
            }
            .intro-card.closing { animation: introCardOut 0.32s ease forwards; }
            .intro-head {
              background:linear-gradient(135deg,#4a8a10 0%,#7bb927 60%,#a2d45e 100%);
              padding:1.75rem 1.75rem 1.4rem; position:relative; overflow:hidden;
            }
            .intro-head::after {
              content:'🌦'; position:absolute; right:1.5rem; top:50%;
              transform:translateY(-50%); font-size:4rem; opacity:0.15; pointer-events:none;
            }
            .intro-badge {
              display:inline-block; background:rgba(255,255,255,0.2);
              border:1px solid rgba(255,255,255,0.35); color:#fff;
              font-size:0.66rem; font-weight:800; letter-spacing:0.12em;
              text-transform:uppercase; padding:0.22rem 0.6rem; border-radius:99px;
              margin-bottom:0.65rem;
            }
            .intro-head h2 {
              font-size:1.55rem; font-weight:900; color:#fff;
              margin:0 0 0.3rem; line-height:1.2; letter-spacing:-0.3px;
            }
            .intro-head p {
              color:rgba(255,255,255,0.82); font-size:0.8rem; margin:0; font-weight:600;
            }
            .intro-body { padding:1.35rem 1.75rem; background:#fafaf8; }
            .intro-lead {
              font-size:0.875rem; line-height:1.72; color:#2d3a25;
              font-weight:600; margin:0 0 1rem;
            }
            .intro-hr { border:none; border-top:1px solid rgba(43,43,43,0.1); margin:0 0 1rem; }
            .intro-bullets { display:flex; flex-direction:column; gap:0.65rem; margin:0; }
            .intro-bul { display:flex; gap:0.65rem; align-items:flex-start; }
            .intro-dot {
              flex-shrink:0; width:6px; height:6px; border-radius:50%;
              background:var(--agl-green); margin-top:0.58em;
            }
            .intro-bul p { font-size:0.82rem; line-height:1.65; color:#3d4d30; margin:0; }
            .intro-foot {
              padding:0.9rem 1.75rem 1.35rem; background:#fff;
              border-top:1px solid rgba(43,43,43,0.08);
              display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;
            }
            .intro-note { font-size:0.74rem; color:#7a9060; max-width:300px; line-height:1.5; }
            .intro-btn {
              background:var(--agl-green); color:#fff; border:none; border-radius:8px;
              padding:0.6rem 1.4rem; font-family:var(--font); font-size:0.84rem;
              font-weight:800; cursor:pointer; letter-spacing:0.02em; white-space:nowrap;
              transition:background 0.15s, transform 0.12s;
            }
            .intro-btn:hover { background:var(--agl-green-dk); transform:translateY(-1px); }
            .intro-btn:active { transform:translateY(0); }
          `}</style>
          <div
            className={`intro-overlay${introClosing ? " closing" : ""}`}
            onClick={closeIntro}
          >
            <div
              className={`intro-card${introClosing ? " closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="intro-head">
                <div className="intro-badge">NiMet · 2026 Seasonal Outlook</div>
                <h2>Nigeria Seasonal Climate Outlook 2026</h2>
                <p>State-level insights for agriculture & water management</p>
              </div>
              <div className="intro-body">
                <p className="intro-lead">
                  The 2026 outlook indicates an <strong>early to normal</strong> start of the rainy season,
                  with <strong>normal to above-normal rainfall</strong> across most of Nigeria.
                  The forecast is shaped by a weak La Niña and neutral El Niño–Southern Oscillation conditions.
                </p>
                <hr className="intro-hr" />
                <div className="intro-bullets">
                  <div className="intro-bul">
                    <div className="intro-dot" />
                    <p><strong>Southern Nigeria</strong> may experience early rainfall in January–February from MJO and Mid-Latitude Waves, with risk of localised flooding in low-lying areas.</p>
                  </div>
                  <div className="intro-bul">
                    <div className="intro-dot" />
                    <p>Most states will have <strong>normal rainfall and season length</strong>, though some regions may see longer or shorter seasons. Temperatures are expected to stay <strong>above long-term averages</strong> in the first half of 2026.</p>
                  </div>
                  <div className="intro-bul">
                    <div className="intro-dot" />
                    <p>Dry spells are possible during the growing season. The <strong>Little Dry Season</strong> (around late July) may be more intense in parts of southwestern Nigeria.</p>
                  </div>
                </div>
              </div>
              <div className="intro-foot">
                <p className="intro-note">
                  Click any state on the map to explore LGA-level seasonal forecasts and agro-climate data.
                </p>
                <button className="intro-btn" onClick={closeIntro}>
                  Explore the Map →
                </button>
              </div>
            </div>
          </div>
        </>
      )}


      <div className="mapWrap">
        <MapView
          states={states}
          lgas={lgasInState}
          selectedState={selected.state}
          selectedLga={selected.lga}
          onStateClick={onStateClick}
          onLgaClick={onLgaClick}
          drawerOpen={drawerOpen}
        />

        {/* ── Floating Nav Panel (top-left, above Leaflet zoom buttons) ── */}
        <div className="mapNav">
          {/* Reset button — only visible when a state is selected */}
          {isStateSelected && (
            <button
              className="mapNavReset"
              onClick={onResetMap}
              title="Back to full Nigeria view"
            >
              <span className="mapNavResetIcon">←</span>
              <span>Nigeria</span>
            </button>
          )}

          {/* State dropdown picker */}
          <div className="mapNavPickerWrap">
            <span className="mapNavPickerIcon">📍</span>
            <select
              className="mapNavPicker"
              value={stateName ?? ""}
              onChange={(e) => onJumpToState(e.target.value)}
            >
              <option value="" disabled>
                Jump to state…
              </option>
              {stateNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span className="mapNavPickerArrow">▾</span>
          </div>
        </div>
      </div>

      {/* ── Drawer ── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedLgaName ?? stateName ?? "Select a location"}
        subtitle={stateName ? `State: ${stateName}` : undefined}
        status={isLgaSelected ? "lga" : isStateSelected ? "state" : undefined}
      >
        {/* Time */}
        <div className="section">
          <div className="sectionTitle">Local time (Nigeria)</div>
          <div className="card">
            <div className="timeBig">{nigeriaTime}</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
              Timezone: Africa/Lagos
            </div>
          </div>
        </div>

        {/* Hint */}
        {isLgaSelected ? (
          <div className="hintBanner">
            Viewing LGA-level details. Click another LGA to compare.
          </div>
        ) : isStateSelected ? (
          <div className="hintBanner">
            Click any LGA inside <b>{stateName}</b> to view LGA details and
            seasonal outlook.
          </div>
        ) : null}

        {/* ══ LGA VIEW ══ */}
        {isLgaSelected ? (
          <div className="section">
            <details className="accordion" open>
              <summary>2026 Rainfall Seasonal Prediction</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${hasNiMetLga ? "ok" : "miss"}`}>
                    {hasNiMetLga
                      ? "NiMet Rainfall Prediction: available"
                      : "NiMet: missing"}
                  </span>
                </div>
                {nimetRow ? (
                  <div className="card">
                    <div className="kv">
                      <div className="k">Onset date</div>
                      <div className="v">{nimetRow.onset_date ?? "—"}</div>
                      <div className="k">Season end</div>
                      <div className="v">{nimetRow.season_end_date ?? "—"}</div>
                      <div className="k">Season length</div>
                      <div className="v">
                        {nimetRow.season_length_days != null
                          ? `${nimetRow.season_length_days} days`
                          : "—"}
                      </div>
                      <div className="k">Annual rainfall</div>
                      <div className="v">
                        {nimetRow.annual_rainfall_mm != null
                          ? `${nimetRow.annual_rainfall_mm} mm`
                          : "—"}
                      </div>
                      <div className="k">Little dry season</div>
                      <div className="v">
                        {nimetRow.little_dry_season ?? "—"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="muted">
                    No NiMet row found for this LGA — usually a naming mismatch
                    or missing record.
                  </p>
                )}
              </div>
            </details>

            <details className="accordion" open>
              <summary>2026 Temperature Predictions (Jan–May)</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${stateTemp ? "ok" : "miss"}`}>
                    {stateTemp ? "NiMet Temperature Prediction: available" : "NiMet: missing"}
                  </span>
                </div>
                {stateTemp ? (
                  <div className="card" style={{ overflowX: "auto" }}>
                    <table className="tempTable">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Jan</th>
                          <th>Feb</th>
                          <th>Mar</th>
                          <th>Apr</th>
                          <th>May</th>
                          <th className="tempAvgCol">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="tempRowLabel">
                            <span className="tempIcon">☀️</span> Day
                          </td>
                          <td>{stateTemp.day.jan}°</td>
                          <td>{stateTemp.day.feb}°</td>
                          <td>{stateTemp.day.mar}°</td>
                          <td>{stateTemp.day.apr}°</td>
                          <td>{stateTemp.day.may}°</td>
                          <td className="tempAvgCol">{stateTemp.day.avg}°</td>
                        </tr>
                        <tr>
                          <td className="tempRowLabel">
                            <span className="tempIcon">🌙</span> Night
                          </td>
                          <td>{stateTemp.night.jan}°</td>
                          <td>{stateTemp.night.feb}°</td>
                          <td>{stateTemp.night.mar}°</td>
                          <td>{stateTemp.night.apr}°</td>
                          <td>{stateTemp.night.may}°</td>
                          <td className="tempAvgCol">{stateTemp.night.avg}°</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="tempNote">
                      All values in °C · Daytime (max) and Nighttime (min) ·
                      State-level data
                    </p>
                  </div>
                ) : (
                  <p className="muted">
                    No temperature data available for <b>{stateName}</b>.
                  </p>
                )}
              </div>
            </details>

            {/* NiMet Seasonal Outlook — downscaled from state signal */}
            <details className="accordion" open>
              <summary>NiMet Seasonal Outlook</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${stateSeasonal ? "ok" : "miss"}`}>
                    {stateSeasonal ? "NiMet: available" : "NiMet: missing"}
                  </span>
                </div>
                {stateSeasonal ? (
                  <>
                    <p
                      className="muted"
                      style={{ fontSize: 11, marginBottom: 6 }}
                    >
                      2026 outlook downscaled from <b>{stateName}</b> state
                      signal.
                    </p>
                    <div className="card">
                      <div className="kv">
                        <div className="k">Rainfall total</div>
                        <div className="v">{stateSeasonal.rainfall_total}</div>
                        <div className="k">Onset</div>
                        <div className="v">{stateSeasonal.onset}</div>
                        <div className="k">Cessation</div>
                        <div className="v">{stateSeasonal.cessation}</div>
                        <div className="k">Season length</div>
                        <div className="v">{stateSeasonal.season_length}</div>
                        <div className="k">Dry spell risk</div>
                        <div className="v">{stateSeasonal.dry_spell_risk}</div>
                        <div className="k">August break</div>
                        <div className="v">{stateSeasonal.august_break}</div>
                        <div className="k">Temp (Jan–May)</div>
                        <div className="v">{stateSeasonal.temp_jfmam}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    No seasonal outlook found for <b>{stateName}</b>.
                  </p>
                )}
              </div>
            </details>
          </div>
        ) : isStateSelected ? (
          /* ══ STATE VIEW ══ */
          <div className="section">
            {/* 2026 Climate Seasonal Prediction — open */}
            <details className="accordion" open>
              <summary>2026 Rainfall Seasonal prediction</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${hasStateOutlook ? "ok" : "miss"}`}>
                    {hasStateOutlook
                      ? "NiMet Rainfall Prediction: available"
                      : "NiMet: missing"}
                  </span>
                </div>
                {stateOutlook ? (
                  <div className="card">
                    <div className="kv">
                      <div className="k">Onset Window</div>
                      <div className="v">
                        {stateOutlook["Onset Window"] || "—"}
                      </div>
                      <div className="k">Season End Date Window</div>
                      <div className="v">
                        {stateOutlook["Season End Date Window"] || "—"}
                      </div>
                      <div className="k">Avg. season length</div>
                      <div className="v">
                        {stateOutlook["Average Season Length (days)"] || "—"}
                      </div>
                      <div className="k">Avg. annual rainfall</div>
                      <div className="v">
                        {stateOutlook["Average Annual Rainfall (mm)"] || "—"}
                      </div>
                      {stateOutlook["Severe Dry Spell (June - August)"] && (
                        <>
                          <div className="k">Severe dry spell LGAs</div>
                          <div className="v">
                            {stateOutlook["Severe Dry Spell (June - August)"]}
                          </div>
                        </>
                      )}
                      {stateOutlook["Little Dry Season"] && (
                        <>
                          <div className="k">Little dry season LGAs</div>
                          <div className="v">
                            {stateOutlook["Little Dry Season"]}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="muted">
                    No NiMet seasonal outlook found for <b>{stateName}</b>.
                  </p>
                )}
              </div>
            </details>

            {/* 2026 Temperature Predictions */}
            <details className="accordion" open>
              <summary>2026 Temperature Predictions (Jan–May)</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${stateTemp ? "ok" : "miss"}`}>
                    {stateTemp
                      ? "NiMet Temperature Prediction: available"
                      : "NiMet: missing"}
                  </span>
                </div>
                {stateTemp ? (
                  <div className="card" style={{ overflowX: "auto" }}>
                    <table className="tempTable">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Jan</th>
                          <th>Feb</th>
                          <th>Mar</th>
                          <th>Apr</th>
                          <th>May</th>
                          <th className="tempAvgCol">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="tempRowLabel">
                            <span className="tempIcon">☀️</span> Day
                          </td>
                          <td>{stateTemp.day.jan}°</td>
                          <td>{stateTemp.day.feb}°</td>
                          <td>{stateTemp.day.mar}°</td>
                          <td>{stateTemp.day.apr}°</td>
                          <td>{stateTemp.day.may}°</td>
                          <td className="tempAvgCol">{stateTemp.day.avg}°</td>
                        </tr>
                        <tr>
                          <td className="tempRowLabel">
                            <span className="tempIcon">🌙</span> Night
                          </td>
                          <td>{stateTemp.night.jan}°</td>
                          <td>{stateTemp.night.feb}°</td>
                          <td>{stateTemp.night.mar}°</td>
                          <td>{stateTemp.night.apr}°</td>
                          <td>{stateTemp.night.may}°</td>
                          <td className="tempAvgCol">{stateTemp.night.avg}°</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="tempNote">
                      All values in °C · Daytime (max) and Nighttime (min)
                    </p>
                  </div>
                ) : (
                  <p className="muted">
                    No temperature data available for <b>{stateName}</b>.
                  </p>
                )}
              </div>
            </details>

            {/* ✅ NiMet Seasonal Outlook — new section */}
            <details className="accordion" open>
              <summary>NiMet Seasonal Outlook</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${stateSeasonal ? "ok" : "miss"}`}>
                    {stateSeasonal ? "NiMet: available" : "NiMet: missing"}
                  </span>
                </div>
                {stateSeasonal ? (
                  <div className="card">
                    <div className="kv">
                      <div className="k">Rainfall total</div>
                      <div className="v">{stateSeasonal.rainfall_total}</div>
                      <div className="k">Onset</div>
                      <div className="v">{stateSeasonal.onset}</div>
                      <div className="k">Cessation</div>
                      <div className="v">{stateSeasonal.cessation}</div>
                      <div className="k">Season length</div>
                      <div className="v">{stateSeasonal.season_length}</div>
                      <div className="k">Dry spell risk</div>
                      <div className="v">{stateSeasonal.dry_spell_risk}</div>
                      <div className="k">August break</div>
                      <div className="v">{stateSeasonal.august_break}</div>
                      <div className="k">Temp (Jan–May)</div>
                      <div className="v">{stateSeasonal.temp_jfmam}</div>
                    </div>
                  </div>
                ) : (
                  <p className="muted">
                    No seasonal outlook found for <b>{stateName}</b>.
                  </p>
                )}
              </div>
            </details>

            {/* State Summary — open by default */}
            <details className="accordion" open>
              <summary>State Summary</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span
                    className={`chip ${stateName && stateSummary?.[norm(stateName)] ? "ok" : "miss"}`}
                  >
                    {stateName && stateSummary?.[norm(stateName)]
                      ? "Available"
                      : "Missing"}
                  </span>
                </div>
                {stateName && stateSummary?.[norm(stateName)] ? (
                  (() => {
                    const s = stateSummary[norm(stateName)];
                    return (
                      <>
                        <p className="stateSummaryText">{s.summary}</p>
                        <hr className="accDivider" />
                        <div className="kv">
                          <div className="k">Capital</div>
                          <div className="v">{s.capital}</div>
                          {s.largest_city && s.largest_city !== s.capital && (
                            <>
                              <div className="k">Largest city</div>
                              <div className="v">{s.largest_city}</div>
                            </>
                          )}
                          <div className="k">Region</div>
                          <div className="v">{s.region}</div>
                          <div className="k">Founded</div>
                          <div className="v">{s.founded}</div>
                          <div className="k">Area</div>
                          <div className="v">
                            {s.area_km2?.toLocaleString()} km²
                          </div>
                          <div className="k">Population</div>
                          <div className="v">
                            {s.population?.toLocaleString()}
                            {s.population_year
                              ? ` (${s.population_year} est.)`
                              : ""}
                          </div>
                          <div className="k">Governor</div>
                          <div className="v">{s.governor}</div>
                          <div className="k">Legislature</div>
                          <div className="v">{s.legislature}</div>
                          <div className="k">LGAs</div>
                          <div className="v">{s.lga_count}</div>
                          {s.borders?.length > 0 && (
                            <>
                              <div className="k">Borders</div>
                              <div className="v">{s.borders.join(", ")}</div>
                            </>
                          )}
                        </div>
                        {s.economy && (
                          <div>
                            <hr className="accDivider" />
                            <div className="summarySectionTitle">Economy</div>
                            <p className="summaryEconText">{s.economy}</p>
                          </div>
                        )}
                        {s.notable_facts?.length > 0 && (
                          <div>
                            <hr className="accDivider" />
                            <div className="summarySectionTitle">
                              Notable facts
                            </div>
                            <ul className="summaryFactsList">
                              {s.notable_facts.map(
                                (fact: string, i: number) => (
                                  <li key={i}>{fact}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <p className="muted">No state summary yet.</p>
                )}
              </div>
            </details>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 8 }}>
            Click a state on the map to view its summary.
          </p>
        )}
      </Drawer>
    </div>
  );
}