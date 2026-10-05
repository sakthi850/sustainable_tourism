import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendations } from '../services/recommendationsService';
import { CATEGORIES, DiscoveryMeta, PlaceKind, Recommendation, RecommendationsResponse } from '../types';
import { RecommendationCard } from '../components/RecommendationCard';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { WeatherBanner } from '../components/WeatherBanner';
import { DiscoveryDebugPanel } from '../components/DiscoveryDebugPanel';

export function ExplorePage({ initialKind }: { initialKind?: PlaceKind }) {
  const geo = useGeolocation();
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState<PlaceKind | ''>(initialKind || '');
  const [radius, setRadius] = useState(5000);
  const [rating, setRating] = useState(0);
  const [budget, setBudget] = useState(3);
  const [eco, setEco] = useState(false);
  const [weather, setWeather] = useState<RecommendationsResponse['weather'] | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryMeta | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => geo.locate(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    if (geo.latitude === null || geo.longitude === null) return;
    const requestId = ++requestSequence.current;
    setError(null); setItems(null);
    try {
      const response = await getRecommendations({ latitude: geo.latitude, longitude: geo.longitude, accuracy: geo.accuracy ?? undefined, category: category || undefined, radius, budget, ecoFriendly: eco || undefined, search: query || undefined });
      if (requestId !== requestSequence.current) return;
      setItems(response.recommendations); setWeather(response.weather); setDiscovery(response.discovery);
    } catch (caught: any) { if (requestId === requestSequence.current) setError(caught.message); }
  }, [geo.latitude, geo.longitude, geo.accuracy, geo.revision, category, radius, budget, eco, query]);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => items?.filter((item) =>
    (!kind || item.kind === kind) &&
    (!query || `${item.name} ${item.category.join(' ')}`.toLowerCase().includes(query.toLowerCase())) &&
    (!rating || item.hasRating && item.rating !== null && item.rating >= rating)
  ) ?? null, [items, kind, query, rating]);

  if (geo.status === 'idle' || geo.status === 'locating') return <LoadingState label="Getting your location…" />;
  if (geo.status !== 'granted') return <ErrorState message={geo.errorMessage || 'Location unavailable.'} onRetry={geo.locate} />;
  return <section><div className="spread"><h1>Explore nearby</h1><button className="btn ghost" onClick={geo.locate}>Refresh location</button></div>
    <p className="location-line">Location detected: {geo.latitude?.toFixed(5)}, {geo.longitude?.toFixed(5)}</p>
    <DiscoveryDebugPanel latitude={geo.latitude!} longitude={geo.longitude!} accuracy={geo.accuracy} discovery={discovery} />
    <WeatherBanner weather={weather} />
    <div className="filter-panel">
      <label>Search<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or category" /></label>
      <label>Type<select value={kind} onChange={(e) => setKind(e.target.value as PlaceKind | '')}><option value="">All</option><option value="place">Tourist places</option><option value="business">Businesses</option></select></label>
      <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Radius<select value={radius} onChange={(e) => setRadius(Number(e.target.value))}><option value={1000}>1 km</option><option value={2000}>2 km</option><option value={5000}>5 km</option><option value={10000}>10 km</option><option value={25000}>25 km</option></select></label>
      <label>Minimum rating<select value={rating} onChange={(e) => setRating(Number(e.target.value))}><option value={0}>Any</option><option value={3}>3+</option><option value={4}>4+</option></select></label>
      <label>Budget<select value={budget} onChange={(e) => setBudget(Number(e.target.value))}><option value={0}>Free</option><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>Any</option></select></label>
      <label className="check"><input type="checkbox" checked={eco} onChange={(e) => setEco(e.target.checked)} />Eco-friendly</label>
    </div>
    {discovery && <p className="small discovery-note">{discovery.state === 'LIVE_FAILED'
      ? `Live place request failed: ${discovery.error ?? 'unknown error'}`
      : discovery.state === 'PARTIAL' ? `Live discovery used its fallback; ${discovery.liveResultsIncluded} result(s) were included. ${discovery.warnings.join(' ')}`
      : discovery.liveResultsIncluded > 0 ? `${discovery.liveResultsIncluded} live ${discovery.source === 'mixed' ? 'Geoapify and OpenStreetMap' : discovery.source === 'geoapify' ? 'Geoapify' : 'OpenStreetMap'} result(s) included.`
      : `Live discovery completed with no supported results inside ${discovery.radiusMeters / 1000} km.`}</p>}
    {error ? <ErrorState message={error} onRetry={load} /> : shown === null ? <LoadingState label="Finding and ranking nearby results…" />
      : shown.length === 0 ? <EmptyState message={discovery?.error ? 'Live discovery is temporarily unavailable.'
        : (discovery?.diagnostics?.rawElements ?? 0) > 0 ? 'No places matched the selected filters.'
        : discovery?.succeeded ? `No mapped live places were found within ${radius / 1000} km.` : 'No nearby places were found.'} />
      : <div className="rec-grid">{shown.map((item) => <RecommendationCard key={item.id} rec={item} />)}</div>}
  </section>;
}
