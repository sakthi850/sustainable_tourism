import { useEffect, useState, useCallback, useRef } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendations } from '../services/recommendationsService';
import { ApiClientError } from '../services/api';
import { Recommendation, RecommendationsResponse, UserPreferences } from '../types';
import { RecommendationCard } from '../components/RecommendationCard';
import { FilterBar, FilterState } from '../components/FilterBar';
import { MapView } from '../components/MapView';
import { LoadingState, ErrorState, EmptyState } from '../components/StateViews';
import { WeatherBanner } from '../components/WeatherBanner';
import { useAuth } from '../context/AuthContext';
import { getMyPreferences } from '../services/preferencesService';
import { DiscoveryDebugPanel } from '../components/DiscoveryDebugPanel';

export function HomePage() {
  const geo = useGeolocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({ category: '', ecoFriendly: false });
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [discoveryNote, setDiscoveryNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<RecommendationsResponse['weather'] | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [discovery, setDiscovery] = useState<RecommendationsResponse['discovery'] | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => { geo.locate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if(user) getMyPreferences().then(setPrefs).catch(()=>setPrefs(null)); else setPrefs(null); }, [user]);

  const fetchRecs = useCallback(async () => {
    if (geo.latitude === null || geo.longitude === null) return;
    const requestId = ++requestSequence.current;
    setLoading(true); setError(null);
    try {
      const res = await getRecommendations({
        latitude: geo.latitude, longitude: geo.longitude,
        accuracy: geo.accuracy ?? undefined,
        category: filters.category || undefined, ecoFriendly: filters.ecoFriendly || undefined,
      });
      if (requestId !== requestSequence.current) return;
      setRecs(res.recommendations);
      setWeather(res.weather);
      setDiscovery(res.discovery);
      const providerName = res.discovery.source === 'mixed' ? 'Geoapify and OpenStreetMap' : res.discovery.source === 'geoapify' ? 'Geoapify' : 'OpenStreetMap';
      setDiscoveryNote(
        res.discovery.state === 'LIVE_FAILED' ? `Live place request failed: ${res.discovery.error ?? 'unknown error'}`
        : res.discovery.state === 'PARTIAL' ? `Live discovery used its fallback; ${res.discovery.liveResultsIncluded} place(s) were included. ${res.discovery.warnings.join(' ')}`
        : res.discovery.liveResultsIncluded > 0 ? `Includes ${res.discovery.liveResultsIncluded} live ${providerName} place(s).`
        : `Live discovery succeeded but no mapped places were found within ${res.discovery.radiusMeters / 1000} km.`
      );
    } catch (err) {
      if (requestId !== requestSequence.current) return;
      const e = err as ApiClientError;
      setError(e.status === 0
        ? 'Could not reach the Wayfinder backend. Confirm it is running (see README) and try again.'
        : e.message || 'Failed to load recommendations.');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [geo.latitude, geo.longitude, geo.accuracy, geo.revision, filters]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  if (geo.status === 'idle' || geo.status === 'locating') {
    return <LoadingState label="Getting your location…" />;
  }
  if (geo.status === 'denied' || geo.status === 'unsupported' || geo.status === 'error') {
    // Per spec §31: a clear message and a real retry — never a silent fallback to a fixed location.
    return <ErrorState message={geo.errorMessage ?? 'Location is unavailable.'} onRetry={geo.locate} />;
  }

  return (
    <div className="home-page">
      <h1>Discover nearby</h1>
      <div className="spread location-line">
        <span>
          📍 Current location: {geo.latitude?.toFixed(6)}, {geo.longitude?.toFixed(6)}
          {geo.accuracy !== null && ` · GPS accuracy: approximately ${Math.round(geo.accuracy)} metres`}
        </span>
        <button className="btn ghost" onClick={geo.locate}>Refresh location</button>
      </div>
      {geo.accuracy !== null && geo.accuracy > 100 && (
        <p className="state state-error">Location accuracy is approximately {Math.round(geo.accuracy)} metres.</p>
      )}
      <DiscoveryDebugPanel latitude={geo.latitude!} longitude={geo.longitude!} accuracy={geo.accuracy} discovery={discovery} />
      <WeatherBanner weather={weather}/>
      {prefs && <div className="prefs-summary"><b>Your trip context:</b> {prefs.interests.length?prefs.interests.join(', '):'Any interest'} · {prefs.travelMode.replace('_',' ')} · {prefs.availableTimeMin} min · budget {prefs.budget}</div>}
      <FilterBar value={filters} onChange={setFilters} />
      {discoveryNote && <p className="small discovery-note">{discoveryNote}</p>}

      {loading && <LoadingState label="Scoring nearby places with S-CADE…" />}
      {!loading && error && <ErrorState message={error} onRetry={fetchRecs} />}
      {!loading && !error && recs && recs.length === 0 && (
        <EmptyState message={discovery?.error ? 'Live discovery is temporarily unavailable.'
          : (discovery?.diagnostics?.rawElements ?? 0) > 0 ? 'No places matched the selected filters.'
        : discovery?.succeeded ? 'No live places were found for this search.' : 'No nearby places were found.'} />
      )}

      {!loading && !error && recs && recs.length > 0 && (
        <>
          <MapView
            center={{ lat: geo.latitude!, lng: geo.longitude! }}
            userMarker={{ lat: geo.latitude!, lng: geo.longitude! }}
            markers={recs.map((r) => ({ id: r.id, name: r.name, lat: r.latitude, lng: r.longitude, rec: r }))}
          />
          <div className="rec-grid">
            {recs.map((r) => <RecommendationCard key={r.id} rec={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
