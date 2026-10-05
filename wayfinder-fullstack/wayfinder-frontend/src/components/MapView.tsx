import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Recommendation } from '../types';

interface MapViewProps {
  center: { lat: number; lng: number };
  userMarker?: { lat: number; lng: number }; // only rendered (as "You are here") when the caller actually knows the visitor's position
  markers: Array<{ id: string; name: string; lat: number; lng: number; rec?: Recommendation }>;
  route?: [number, number][];
}

// Leaflet's default marker icons reference image files that don't resolve correctly under Vite's
// bundling by default — this is the standard, documented fix.
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export function MapView({ center, userMarker, markers, route }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([center.lat, center.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (userMarker) {
      L.circleMarker([userMarker.lat, userMarker.lng], { radius: 8, color: '#26433A', fillColor: '#E3A23C', fillOpacity: 1 })
        .bindPopup('You are here').addTo(layer);
    }
    markers.forEach((m) => {
      const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
      const popup = m.rec
        ? `<b>${escapeHtml(m.name)}</b><br>${escapeHtml(m.rec.category.join(', '))}<br>${m.rec.distanceKm.toFixed(1)} km straight-line<br>${m.rec.source === 'osm' ? 'Live OpenStreetMap' : 'Saved Wayfinder place'}<br>S-CADE recommendation score: ${m.rec.scadeScore}`
        : `<b>${escapeHtml(m.name)}</b>`;
      L.marker([m.lat, m.lng]).bindPopup(popup).addTo(layer);
    });
    if(route?.length)L.polyline(route,{color:'#A85C3E',weight:5,opacity:.85}).addTo(layer);
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, userMarker, markers, route]);

  return <div ref={containerRef} className="map-view" />;
}
