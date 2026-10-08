import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clsx } from 'clsx';
import { RISK_COLORS, RISK_LABEL, SOURCE_LABEL, formatDate } from '../../utils/format';

// OpenStreetMap tiles (no API key). Override with VITE_MAP_TILE_URL for production traffic.
// The "light" variant uses the same tiles with a muted CSS filter (see .map-light in index.css).
const TILE = {
  url: import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

// Default view: India. Only used until real coordinates are known.
const DEFAULT_CENTER = { latitude: 22.9734, longitude: 78.6569 };

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const zonePopupHtml = (p) => `
  <div style="font-family:Poppins,sans-serif;min-width:190px;max-width:240px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span style="width:10px;height:10px;border-radius:9999px;background:${RISK_COLORS[p.riskLevel]}"></span>
      <strong style="font-size:13px;color:#1F2937">${escapeHtml(p.name)}</strong>
    </div>
    <div style="font-size:11px;font-weight:700;color:${RISK_COLORS[p.riskLevel]};margin-bottom:4px">${RISK_LABEL[p.riskLevel]}${
      p.activeHours && p.activeHours !== 'ALWAYS' ? ` · ${p.activeHours === 'NIGHT' ? 'Night only' : 'Day only'}` : ''
    }</div>
    ${p.description ? `<div style="font-size:11px;color:#6B7280;margin-bottom:6px">${escapeHtml(p.description)}</div>` : ''}
    <div style="font-size:10px;color:#6B7280;line-height:1.5">
      Source: <b>${escapeHtml(SOURCE_LABEL[p.sourceType] || p.sourceType || '—')}</b>${p.sourceName ? ` (${escapeHtml(p.sourceName)})` : ''}<br/>
      Confidence: <b>${Math.round((Number(p.confidence) || 0) * 100)}%</b><br/>
      Last updated: <b>${escapeHtml(formatDate(p.updatedAt))}</b>
    </div>
  </div>`;

const MARKER_HTML = {
  current:
    '<div style="position:relative;width:22px;height:22px"><div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(91,95,239,.25);animation:ping 1.6s cubic-bezier(0,0,.2,1) infinite"></div><div style="position:relative;width:22px;height:22px;border-radius:9999px;background:#5B5FEF;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)"></div></div>',
  origin: '<div style="width:18px;height:18px;border-radius:9999px;background:#fff;border:5px solid #5B5FEF;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>',
  destination:
    '<div style="width:32px;height:32px;border-radius:9999px;background:#EF4444;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.25)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
  sos: '<div style="width:30px;height:30px;border-radius:9999px;background:#E11D48;border:2px solid #fff;color:#fff;font:800 9px Poppins,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(225,29,72,.5)">SOS</div>',
  user: '<div style="width:16px;height:16px;border-radius:9999px;background:#5B5FEF;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
};
const MARKER_SIZE = { current: 22, origin: 18, destination: 32, sos: 30, user: 16, poi: 26 };

const POI_GLYPH = { hospital: 'H', police: 'P', pharmacy: 'Rx', fuel: 'F' };
const POI_COLOR = { hospital: '#EF4444', police: '#5B5FEF', pharmacy: '#22C55E', fuel: '#F59E0B' };

const markerIcon = (marker) => {
  const size = MARKER_SIZE[marker.kind] || 16;
  let html = MARKER_HTML[marker.kind] || MARKER_HTML.user;
  if (marker.kind === 'poi') {
    const color = POI_COLOR[marker.category] || '#5B5FEF';
    html = `<div style="width:26px;height:26px;border-radius:9999px;background:#fff;border:2px solid ${color};color:${color};font:700 10px Poppins,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2)">${POI_GLYPH[marker.category] || '•'}</div>`;
  }
  return L.divIcon({ html, className: 'saferoute-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
};

const zoneStyle = (feature) => {
  const p = feature.properties || {};
  const color = RISK_COLORS[p.riskLevel] || RISK_COLORS.LOW;
  return {
    color,
    weight: 1.5,
    fillColor: color,
    fillOpacity: p.active === false ? 0.08 : 0.22,
    // DEMO zones get a dashed outline so they are visibly different from real data.
    dashArray: p.isDemo ? '6 6' : null,
  };
};

/** Mapbox-style [[minLng, minLat], [maxLng, maxLat]] → Leaflet bounds. */
const toLatLngBounds = ([[w, s], [e, n]]) => L.latLngBounds([s, w], [n, e]);

const toFitOptions = (padding) => {
  if (typeof padding === 'number') return { padding: [padding, padding] };
  const { top = 40, bottom = 40, left = 40, right = 40 } = padding || {};
  return { paddingTopLeft: [left, top], paddingBottomRight: [right, bottom] };
};

/**
 * Interactive Leaflet map (OpenStreetMap tiles) used by every map screen.
 * Renders risk zones (GeoJSON), routes and markers.
 *
 * bottomInset lifts Leaflet's bottom controls (attribution/zoom) above overlays like the bottom nav.
 */
const MapView = ({
  center,
  zoom = 12,
  zones,
  routes = [],
  markers = [],
  fitBounds,
  fitKey,
  flyTo,
  onMapClick,
  onBoundsChange,
  onRouteClick,
  interactive = true,
  zoomControl = false,
  variant = 'streets',
  attributionPosition = 'bottomright',
  bottomInset = 0,
  attributionText,
  className,
  padding = 60,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const callbacks = useRef({});
  callbacks.current = { onMapClick, onBoundsChange, onRouteClick };

  // Create the map once.
  useEffect(() => {
    const start = center || DEFAULT_CENTER;
    const map = L.map(containerRef.current, {
      center: [start.latitude, start.longitude],
      zoom: center ? zoom : 5,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });
    mapRef.current = map;

    L.tileLayer(TILE.url, { attribution: attributionText || TILE.attribution, maxZoom: TILE.maxZoom }).addTo(map);
    L.control.attribution({ position: attributionPosition, prefix: false }).addTo(map);
    if (zoomControl && interactive) L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Separate panes keep zones under routes, and routes under markers.
    map.createPane('zones').style.zIndex = 410;
    map.createPane('routes').style.zIndex = 420;
    layersRef.current = {
      zones: L.layerGroup().addTo(map),
      routes: L.layerGroup().addTo(map),
      markers: L.layerGroup().addTo(map),
    };

    map.on('click', (e) => callbacks.current.onMapClick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    const reportBounds = () => {
      const b = map.getBounds();
      callbacks.current.onBoundsChange?.(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`);
    };
    map.on('moveend', reportBounds);
    map.whenReady(reportBounds);

    // Keep tiles correct when the container is resized (bottom sheets, layout changes).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bottom controls offset
  useEffect(() => {
    containerRef.current?.querySelectorAll('.leaflet-bottom').forEach((el) => {
      el.style.bottom = `${bottomInset}px`;
    });
  }, [bottomInset]);

  // Zones
  useEffect(() => {
    const group = layersRef.current.zones;
    if (!group) return;
    group.clearLayers();
    if (!zones?.features?.length) return;
    L.geoJSON(zones, {
      pane: 'zones',
      style: zoneStyle,
      onEachFeature: (feature, layer) => layer.bindPopup(zonePopupHtml(feature.properties || {}), { maxWidth: 260 }),
    }).addTo(group);
  }, [zones]);

  // Routes: alternatives in grey (clickable), selected route in primary with a white casing.
  useEffect(() => {
    const group = layersRef.current.routes;
    if (!group) return;
    group.clearLayers();
    const valid = routes.filter((r) => r?.geometry?.coordinates?.length);
    valid
      .filter((r) => !r.selected)
      .forEach((r) => {
        L.geoJSON(r.geometry, { pane: 'routes', style: { color: '#94A3B8', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round' } })
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            callbacks.current.onRouteClick?.(r.id);
          })
          .addTo(group);
      });
    valid
      .filter((r) => r.selected)
      .forEach((r) => {
        L.geoJSON(r.geometry, { pane: 'routes', interactive: false, style: { color: '#FFFFFF', weight: 9, opacity: 1, lineCap: 'round', lineJoin: 'round' } }).addTo(group);
        L.geoJSON(r.geometry, { pane: 'routes', interactive: false, style: { color: '#5B5FEF', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' } }).addTo(group);
      });
  }, [routes]);

  // Markers
  useEffect(() => {
    const group = layersRef.current.markers;
    if (!group) return;
    group.clearLayers();
    markers
      .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
      .forEach((m) => {
        const marker = L.marker([m.latitude, m.longitude], { icon: markerIcon(m), title: m.label || '', keyboard: false });
        if (m.popup) marker.bindPopup(m.popup, { maxWidth: 240 });
        if (m.onClick) marker.on('click', m.onClick);
        marker.addTo(group);
      });
  }, [markers]);

  // Fit to bounds when the caller changes fitKey
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitBounds) return;
    const [[w, s], [e, n]] = fitBounds;
    if (w === e && s === n) map.flyTo([s, w], 14, { duration: 0.8 });
    else map.fitBounds(toLatLngBounds(fitBounds), { ...toFitOptions(padding), maxZoom: 15, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Fly to a point
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.flyTo([flyTo.latitude, flyTo.longitude], flyTo.zoom ?? 14, { duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.key, flyTo?.latitude, flyTo?.longitude]);

  return <div ref={containerRef} className={clsx('w-full h-full isolate', variant === 'light' && 'map-light', className)} />;
};

export default MapView;
