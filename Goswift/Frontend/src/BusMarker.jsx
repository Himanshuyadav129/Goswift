import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { bearing, distM, nearestAngle, snapToLine } from "./mapUtils";

// Top-down bus that points the way it is driving and glides smoothly between GPS updates,
// like the cars and bikes in Uber / Rapido. Pass `line` ([[lat,lng], ...] route) to keep it on the route.
const html = (big) => {
  const w = big ? 26 : 20;
  const h = big ? 44 : 34;
  return `<div style="position:relative;width:${w}px;height:${h}px">
    <span class="animate-ping" style="position:absolute;inset:25% 0;border-radius:9999px;background:#38bdf8;opacity:.55"></span>
    <div class="bm-rot" style="position:absolute;inset:0;transition:transform .6s ease-out;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))">
      <svg viewBox="0 0 24 40" width="${w}" height="${h}">
        <rect x="2" y="1" width="20" height="38" rx="6" fill="#0ea5e9" stroke="#ffffff" stroke-width="2"/>
        <rect x="5" y="5" width="14" height="8" rx="2" fill="#0c4a6e"/>
        <rect x="5" y="15" width="14" height="14" rx="2" fill="#e0f2fe" opacity=".85"/>
        <rect x="5" y="31" width="14" height="4" rx="1.5" fill="#0c4a6e"/>
      </svg>
    </div>
  </div>`;
};

const BusMarker = ({ pos, line, label, big = false }) => {
  const map = useMap();
  const st = useRef({ marker: null, cur: null, raf: 0, angle: 0, lastAt: 0 });
  const lineRef = useRef(line); // read at every GPS fix; not a dependency, so re-renders never restart the glide
  lineRef.current = line;
  const lat = pos ? pos[0] : null;
  const lng = pos ? pos[1] : null;

  // create / remove the marker
  useEffect(() => {
    const s = st.current;
    const w = big ? 26 : 20;
    const h = big ? 44 : 34;
    const icon = L.divIcon({ className: "", html: html(big), iconSize: [w, h], iconAnchor: [w / 2, h / 2] });
    s.marker = L.marker(s.cur || [0, 0], { icon, zIndexOffset: big ? 1000 : 500 });
    if (s.cur) s.marker.addTo(map);
    return () => {
      cancelAnimationFrame(s.raf);
      s.marker && s.marker.remove();
      s.marker = null;
    };
  }, [map, big]);

  // popup text
  useEffect(() => {
    const m = st.current.marker;
    if (m && label) m.bindPopup(label);
  }, [label, big]);

  // new GPS fix: snap to the route, turn towards the direction of travel and glide there
  useEffect(() => {
    const s = st.current;
    if (lat == null || !s.marker) return;
    const raw = [lat, lng];
    const snapped = snapToLine(raw, lineRef.current);
    const target = snapped ? snapped.pos : raw;

    const place = (p) => {
      s.cur = p;
      s.marker.setLatLng(p);
      if (!map.hasLayer(s.marker)) s.marker.addTo(map);
    };
    const rotate = (deg) => {
      s.angle = deg;
      const el = s.marker.getElement();
      const rot = el && el.querySelector(".bm-rot");
      if (rot) rot.style.transform = `rotate(${deg}deg)`;
    };

    if (!s.cur) {
      place(target);
      s.lastAt = performance.now();
      return;
    }

    const from = s.cur;
    const moved = distM(from, target);
    if (moved > 3) rotate(nearestAngle(s.angle, bearing(from, target)));

    const now = performance.now();
    const dur = moved > 800 ? 0 : Math.min(3500, Math.max(900, now - s.lastAt)); // far jump: just appear there
    s.lastAt = now;
    cancelAnimationFrame(s.raf);
    if (!dur) return place(target);

    const t0 = now;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      place([from[0] + (target[0] - from[0]) * k, from[1] + (target[1] - from[1]) * k]);
      if (k < 1) s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }, [lat, lng, map, big]);

  return null;
};

export default BusMarker;