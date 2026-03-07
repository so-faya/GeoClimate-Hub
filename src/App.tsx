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
import { getScpOutlook } from "./lib/scp";

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
  const [states, setStates] = useState<PolyFC | null>(null);
  const [lgasAll, setLgasAll] = useState<PolyFC | null>(null);
  const [selected, setSelected] = useState<Selected>({
    state: null,
    lga: null,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nigeriaTime, setNigeriaTime] = useState(getNigeriaDateTimeString());
  const [scpData, setScpData] = useState<any>(null);
  const [lgaInfo, setLgaInfo] = useState<Record<string, any> | null>(null);
  const [stateSummary, setStateSummary] = useState<Record<string, any> | null>(null);
  const [nimetStateOutlook, setNimetStateOutlook] = useState<Record<string, any> | null>(null);
  const [nimetLga, setNimetLga] = useState<Record<string, any> | null>(null);
  const [nimetStateSummary, setNimetStateSummary] = useState<Record<string, any> | null>(null);
  const [nimetStateSeasonal, setNimetStateSeasonal] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    (async () => {
      const adm1 = (await loadGeoJSON("/data/nga_adm1.geojson")) as any;
      setStates(adm1);

      const infoRes = await fetch("/data/lga-info.json");
      if (infoRes.ok) setLgaInfo(await infoRes.json());

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

      const nemetStateRes = await fetch("/data/nimet-state-summary.json");
      if (nemetStateRes.ok) setNimetStateSummary(await nemetStateRes.json());

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
    setScpData(null);
    if (!lgasAll) {
      const adm2 = (await loadGeoJSON("/data/nga_adm2.geojson")) as any;
      setLgasAll(adm2);
    }
  }

  async function onLgaClick(f: PolyFeat) {
    setSelected((s) => ({ ...s, lga: f }));
    setDrawerOpen(true);
    if (!stateName) {
      setScpData({ error: "Select a state first." });
      return;
    }
    try {
      const lgaName = getAdm2Name(f);
      const outlook = await getScpOutlook(stateName, lgaName);
      setScpData(
        outlook || {
          error:
            "Seasonal outlook not loaded yet (scp-2026.json). You can still use the NiMet SCP table below.",
        },
      );
    } catch (e: any) {
      setScpData({ error: `Failed to load SCP data: ${e?.message ?? e}` });
    }
  }

  function onResetMap() {
    setSelected({ state: null, lga: null });
    setDrawerOpen(false);
    setScpData(null);
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
  const stateNimet = stateName ? nimetStateSummary?.[norm(stateName)] : null;
  const stateOutlook = stateName ? nimetStateOutlook?.[norm(stateName)] : null;
  // ✅ Derived after stateName is available
  const stateSeasonal = stateName ? nimetStateSeasonal?.[norm(stateName)] : null;

  const hasNiMetLga = Boolean(nimetRow);
  const hasNiMetState = Boolean(stateNimet);
  const hasStateOutlook = Boolean(stateOutlook);
  const hasSCP = scpData && !scpData?.error;

  return (
    <div className="layout">
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
              <summary>2026 Climate Seasonal Prediction</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${hasNiMetLga ? "ok" : "miss"}`}>
                    {hasNiMetLga ? "NiMet: available" : "NiMet: missing"}
                  </span>
                  <span className={`chip ${hasSCP ? "ok" : "warn"}`}>
                    {hasSCP ? "SCP: available" : "SCP: not loaded"}
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
                    <p className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
                      2026 outlook downscaled from <b>{stateName}</b> state signal.
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

            <details className="accordion">
              <summary>Seasonal Outlook (SCP)</summary>
              <div className="accBody">
                {scpData?.error ? (
                  <div className="callout warn">
                    <b>Not loaded:</b> {scpData.error}
                  </div>
                ) : scpData ? (
                  <pre className="pre">{JSON.stringify(scpData, null, 2)}</pre>
                ) : (
                  <p className="muted">Loading SCP outlook…</p>
                )}
                <p className="muted" style={{ fontSize: 12 }}>
                  SCP is seasonal guidance — not hourly or daily.
                </p>
              </div>
            </details>

            <details className="accordion">
              <summary>Extra LGA Info</summary>
              <div className="accBody">
                {infoKey && lgaInfo?.[infoKey] ? (
                  <pre className="pre">
                    {JSON.stringify(lgaInfo[infoKey], null, 2)}
                  </pre>
                ) : (
                  <p className="muted">
                    No extra info yet.
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
              <summary>2026 Climate Seasonal Prediction</summary>
              <div className="accBody">
                <div className="chipRow">
                  <span className={`chip ${hasStateOutlook ? "ok" : "miss"}`}>
                    {hasStateOutlook ? "NiMet: available" : "NiMet: missing"}
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
                  <span className={`chip ${hasNiMetState ? "ok" : "miss"}`}>
                    {hasNiMetState ? "NiMet: available" : "NiMet: missing"}
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
                  <p className="muted">
                    No state summary yet.
                  </p>
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