import { useCallback, useEffect, useRef, useState } from 'react';
import { MapView } from '../components/MapView';
import { DiscoveryDebugPanel } from '../components/DiscoveryDebugPanel';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendations } from '../services/recommendationsService';
import { DiscoveryMeta, Recommendation } from '../types';
import { getRoute, RouteResult } from '../services/routingService';

export function MapPage() {
  const geo = useGeolocation();
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryMeta | null>(null);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => geo.locate(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    if (geo.latitude === null || geo.longitude === null) return;
    const requestId = ++requestSequence.current;
    setError(null);
    try {
      const response = await getRecommendations({ latitude: geo.latitude, longitude: geo.longitude, accuracy: geo.accuracy ?? undefined });
      if (requestId !== requestSequence.current) return;
      setItems(response.recommendations); setDiscovery(response.discovery);
    } catch (caught: any) {
      if (requestId === requestSequence.current) setError(caught.message);
    }
  }, [geo.latitude, geo.longitude, geo.accuracy, geo.revision]);
  useEffect(() => { void load(); }, [load]);

  if (geo.status === 'idle' || geo.status === 'locating') return <LoadingState label="Getting your location…" />;
  if (geo.status !== 'granted') return <ErrorState message={geo.errorMessage || 'Location unavailable.'} onRetry={geo.locate} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <LoadingState label="Loading map results…" />;
  return <section>
    <div className="spread"><h1>Map navigation</h1><button className="btn ghost" onClick={geo.locate}>Refresh nearby places</button></div>
    <p className="small">Result distances are straight-line distances. Select a result to calculate a road route; Google Maps remains available as a fallback.</p>
    <DiscoveryDebugPanel latitude={geo.latitude!} longitude={geo.longitude!} accuracy={geo.accuracy} discovery={discovery} />
    {discovery?.state === 'LIVE_FAILED' && <p className="state state-error">Overpass request failed: {discovery.error}. Showing saved Wayfinder places.</p>}
    {discovery?.state === 'PARTIAL' && <p className="state state-error">Some Overpass categories failed. Available categories are still shown.</p>}
    <MapView center={{ lat: geo.latitude!, lng: geo.longitude! }} userMarker={{ lat: geo.latitude!, lng: geo.longitude! }} markers={items.map((x) => ({ id: x.id, name: x.name, lat: x.latitude, lng: x.longitude, rec: x }))} route={route?.geometry} />
    <div className="map-list">{items.slice(0, 12).map((x) => <button key={x.id} className="map-result" onClick={() => { setSelected(x); setRoute(null); setRouteError(null); }}><b>{x.name}</b><span>{x.distanceKm.toFixed(1)} km straight-line · recommendation score {x.scadeScore} · {x.source === 'osm' ? 'Live OpenStreetMap' : 'Saved Wayfinder place'}</span></button>)}</div>
    {selected && <div className="panel"><h2>{selected.name}</h2><p>{selected.explanation}</p>{route && <p><b>Driving route:</b> {route.distanceKm} km · about {route.durationMin} min</p>}{routeError && <p className="state state-error">Route service unavailable — open in Google Maps.</p>}<div className="row"><button className="btn" disabled={routeBusy} onClick={async () => { setRouteBusy(true); setRouteError(null); try { setRoute(await getRoute(geo.latitude!, geo.longitude!, selected.latitude, selected.longitude)); } catch (caught: any) { setRouteError(caught.message); } finally { setRouteBusy(false); } }}>{routeBusy ? 'Calculating…' : 'Show driving route'}</button><a className="btn ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}>Open in Google Maps</a></div></div>}
  </section>;
}
