import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import type {
  FeatureCollection,
  Feature,
  Polygon,
  MultiPolygon,
} from "geojson";
import L from "leaflet";
import pointOnFeature from "@turf/point-on-feature";
import { getFeatureName } from "../lib/geo";
import "leaflet/dist/leaflet.css";

type PolyFeat = Feature<Polygon | MultiPolygon, any>;
type PolyFC = FeatureCollection<Polygon | MultiPolygon, any>;

/**
 * Replaces the deprecated `whenCreated` prop.
 * Captures the map instance into the provided ref.
 */
function MapRefSetter({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function makeLgaLabelIcon(text: string) {
  return L.divIcon({
    className: "lga-label",
    html: `<div>${text}</div>`,
    iconSize: [140, 18],
    iconAnchor: [70, 9],
  });
}

/**
 * ✅ Zoom only when selected STATE changes.
 * (Do NOT depend on drawerOpen, otherwise map shifts on open/close.)
 */
function ZoomOnSelect({ feature }: { feature: PolyFeat | null | undefined }) {
  const map = useMap();
  const lastIdRef = useRef<string>("");

  function stableId(f: any) {
    if (!f) return "";
    const p = f.properties || {};
    return String(
      p.adm1_pcode || p.ADM1_PCODE || p.OBJECTID || p.ID || p.name || "",
    )
      .trim()
      .toLowerCase();
  }

  useEffect(() => {
    if (!feature) return;

    const id = stableId(feature);
    if (id && id === lastIdRef.current) return;
    lastIdRef.current = id;

    const layer = L.geoJSON(feature as any);
    const bounds = layer.getBounds();
    if (!bounds.isValid()) return;

    map.flyToBounds(bounds, { padding: [30, 30], duration: 0.7 });
  }, [map, feature]);

  return null;
}

function MapLabels({ lgas }: { lgas: PolyFC | null }) {
  const map = useMap();
  const labelsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map.getPane("labels-pane")) {
      map.createPane("labels-pane");
      const pane = map.getPane("labels-pane")!;
      pane.style.zIndex = "650";
      pane.style.pointerEvents = "none";
    }

    if (!labelsRef.current) labelsRef.current = L.layerGroup().addTo(map);
    const labels = labelsRef.current;
    labels.clearLayers();

    if (!lgas?.features?.length) return;

    for (const feature of lgas.features) {
      const name = getFeatureName(feature as any);
      if (!name) continue;

      const pt = pointOnFeature(feature as any);
      const [lng, lat] = pt.geometry.coordinates;
      labels.addLayer(
        L.marker([lat, lng], {
          pane: "labels-pane",
          icon: makeLgaLabelIcon(name),
          interactive: false,
          keyboard: false,
        }),
      );
    }

    return () => {
      labels.clearLayers();
    };
  }, [map, lgas]);

  return null;
}

function stableId(f: any) {
  if (!f) return "";
  const p = f.properties || {};

  const id =
    p.adm2_pcode ||
    p.ADM2_PCODE ||
    p.adm1_pcode ||
    p.ADM1_PCODE ||
    p.OBJECTID ||
    p.ID ||
    p.shapeID;

  if (id != null && String(id).trim() !== "") return String(id);

  const name =
    p.adm2_name ||
    p.adm1_name ||
    p.NAME_2 ||
    p.NAME_1 ||
    p.STATE_NAME ||
    p.LGA_NAME ||
    p.name;

  return String(name ?? "")
    .trim()
    .toLowerCase();
}

function FitNigeriaOnLoad({
  states,
  selectedState,
}: {
  states: PolyFC | null;
  selectedState: PolyFeat | null | undefined;
}) {
  const map = useMap();
  const didInitialFit = useRef(false);

  useEffect(() => {
    if (!states?.features?.length) return;

    const nigeriaLayer = L.geoJSON(states as any);
    const bounds = nigeriaLayer.getBounds();
    if (!bounds.isValid()) return;

    if (!didInitialFit.current) {
      didInitialFit.current = true;
      map.fitBounds(bounds, { padding: [16, 16] });
      return;
    }

    if (!selectedState) {
      map.fitBounds(bounds, { padding: [16, 16] });
    }
  }, [map, states, selectedState]);

  return null;
}

function MapView(props: {
  states: PolyFC | null;
  lgas: PolyFC | null;
  selectedState: PolyFeat | null | undefined;
  selectedLga: PolyFeat | null | undefined;
  onStateClick: (f: PolyFeat) => void;
  onLgaClick: (f: PolyFeat) => void;
  drawerOpen: boolean;
}) {
  const mapRef = useRef<L.Map | null>(null);

  const stateId = useMemo(
    () => stableId(props.selectedState),
    [props.selectedState],
  );
  const selectedLgaId = useMemo(
    () => stableId(props.selectedLga),
    [props.selectedLga],
  );

  const showLgas = useMemo(
    () => Boolean(props.lgas?.features?.length),
    [props.lgas],
  );

  // Force remount when LGAs change (keeps interactions reliable)
  const lgaLayerKey = useMemo(() => {
    const count = props.lgas?.features?.length ?? 0;
    return `lgas-${stateId}-${count}`;
  }, [stateId, props.lgas]);

  const labelsKey = useMemo(() => `labels-${stateId}`, [stateId]);

  // ✅ Instant highlight (Leaflet-side) to remove perceived lag
  const lastSelectedLayerRef = useRef<L.Path | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const invalidate = () =>
      window.setTimeout(() => map.invalidateSize(true), 50);

    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", invalidate);

    invalidate();

    return () => {
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
      vv?.removeEventListener("resize", invalidate);
    };
  }, []);

  // Keep invalidate after drawer transition (this should NOT move the map now)
  const DRAWER_TRANSITION_MS = 220;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const t = window.setTimeout(
      () => map.invalidateSize(true),
      DRAWER_TRANSITION_MS,
    );
    return () => window.clearTimeout(t);
  }, [props.drawerOpen]);

  const NIGERIA_MAX_BOUNDS: [[number, number], [number, number]] = [
    [4.0, 2.5],
    [14.7, 15.2],
  ];

  return (
    <>
      <MapContainer
        center={[9.08, 8.67]}
        zoom={6}
        maxBounds={NIGERIA_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={5}
        maxZoom={12}
        zoomControl={true}
        style={{ flex: 1, width: "100%", minHeight: 0 }}
      >
        {/* Replaces the deprecated whenCreated prop */}
        <MapRefSetter mapRef={mapRef} />

        <FitNigeriaOnLoad
          states={props.states}
          selectedState={props.selectedState}
        />
        <ZoomOnSelect feature={props.selectedState} />

        <MapLabels key={labelsKey} lgas={props.lgas} />

        {/* States */}
        {props.states && (
          <GeoJSON
            data={props.states as any}
            style={(f: any) => {
              const isSelected = stableId(f) === stateId;

              return {
                color: "#50ca17",
                weight: isSelected ? 3 : 1,
                fillColor: "#50ca17",
                fillOpacity: showLgas
                  ? isSelected
                    ? 0.18
                    : 0.1
                  : isSelected
                    ? 0.35
                    : 0.18,

                // IMPORTANT: when LGAs visible, states should not steal clicks
                interactive: !showLgas,
              };
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip(getFeatureName(feature as any), {
                permanent: true,
                direction: "center",
                className: "state-tooltip",
                opacity: 1,
              });

              layer.off("click");
              layer.on("click", () => {
                if (showLgas) return;
                props.onStateClick(feature as any);
              });
            }}
          />
        )}

        {/* LGAs */}
        {props.lgas && (
          <GeoJSON
            key={lgaLayerKey}
            data={props.lgas as any}
            style={(f: any) => {
              const isSelected = stableId(f) === selectedLgaId;

              return {
                color: isSelected ? "#111" : "#8a8a96",
                weight: isSelected ? 3 : 1,
                fillColor: isSelected ? "#111" : "#8a8a96",
                fillOpacity: isSelected ? 0.12 : 0,
              };
            }}
            onEachFeature={(feature, layer) => {
              const path = layer as unknown as L.Path;

              layer.off("click");
              layer.off("mouseover");
              layer.off("mouseout");

              layer.on("click", () => {
                // ✅ immediate visual feedback (no waiting for React rerender)
                if (lastSelectedLayerRef.current) {
                  // reset old highlight quickly
                  (lastSelectedLayerRef.current as any).setStyle?.({
                    color: "#8a8a96",
                    weight: 1,
                    fillColor: "#8a8a96",
                    fillOpacity: 0,
                  });
                }

                (path as any).bringToFront?.();
                (path as any).setStyle?.({
                  color: "#111",
                  weight: 3,
                  fillColor: "#111",
                  fillOpacity: 0.12,
                });

                lastSelectedLayerRef.current = path;

                props.onLgaClick(feature as any);
              });

              layer.bindTooltip(getFeatureName(feature as any), {
                sticky: true,
              });

              layer.on("mouseover", () => {
                (layer as any).bringToFront?.();
                (layer as any).setStyle({ weight: 2, fillOpacity: 0.06 });
              });

              layer.on("mouseout", () => {
                const isSelected = stableId(feature) === selectedLgaId;

                (layer as any).setStyle({
                  color: isSelected ? "#111" : "#8a8a96",
                  weight: isSelected ? 3 : 1,
                  fillColor: isSelected ? "#111" : "#8a8a96",
                  fillOpacity: isSelected ? 0.12 : 0,
                });
              });
            }}
          />
        )}
      </MapContainer>
      <div className="nimetAttribution">
        © NiMet 2026 – Nigerian Meteorological Agency.
      </div>
    </>
  );
}

export default React.memo(MapView);
