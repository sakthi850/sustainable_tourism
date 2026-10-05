import { DiscoveryMeta } from '../types';
export function DiscoveryDebugPanel({ latitude, longitude, accuracy, discovery }: { latitude: number; longitude: number; accuracy: number | null; discovery: DiscoveryMeta | null }) {
  if (!import.meta.env.DEV) return null;
  const d = discovery?.diagnostics;
  return <details className="panel" style={{ marginBottom: '1rem' }}><summary><b>Live discovery diagnostics</b></summary>
    <div className="small" style={{ marginTop: '.75rem', lineHeight: 1.7 }}>
      <div>GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}</div><div>Accuracy: {accuracy === null ? 'Unavailable' : `${Math.round(accuracy)} metres`}</div>
      <div>Radius: {discovery ? `${discovery.radiusMeters / 1000} km` : 'Pending'}</div><div>Category: {discovery?.selectedCategory ?? 'Pending'}</div>
      <div>Selected provider: {discovery?.source ?? 'Pending'}</div>
      {discovery?.providers && Object.entries(discovery.providers).map(([provider, status]) => <div key={provider}>{provider}: {status.attempted ? `${status.succeeded ? 'success' : 'failed'} (${status.count})${status.error ? `: ${status.error}` : ''}` : 'not configured'}</div>)}
      <div>Overpass HTTP: {d?.overpassStatus ?? (discovery?.error ? 'Failed' : 'Pending')}</div><div>Raw OSM elements: {d?.rawElements ?? 'Pending'}</div>
      <div>Discovery state: {discovery?.state ?? 'Pending'}</div><div>Response length: {d?.responseLength ?? 'Pending'} bytes</div>
      <div>Nodes: {d?.nodeCount ?? 'Pending'}</div><div>Ways: {d?.wayCount ?? 'Pending'}</div><div>Relations: {d?.relationCount ?? 'Pending'}</div>
      <div>Valid coordinates: {d?.validCoordinates ?? 'Pending'}</div><div>Named places: {d?.namedElements ?? 'Pending'}</div>
      <div>Invalid coordinates removed: {d?.invalidCoordinatesRemoved ?? 'Pending'}</div>
      <div>Unnamed removed: {d?.unnamedRemoved ?? 'Pending'}</div><div>Outside radius removed: {d?.outsideRadiusRemoved ?? 'Pending'}</div>
      <div>After normalization: {d?.normalized ?? 'Pending'}</div><div>After OSM deduplication: {d?.deduplicated ?? 'Pending'}</div>
      <div>Duplicates removed: {d?.duplicatesRemoved ?? 'Pending'}</div>
      <div>Category-filtered removed: {d?.categoryFilteredRemoved ?? 'Pending'}</div>
      {d?.perCategory && Object.entries(d.perCategory).map(([category, counts]) => <div key={category}>{category}: {counts?.success ? `${counts.final} final / ${counts.raw} raw (HTTP ${counts.status})` : `FAILED${counts?.status ? ` HTTP ${counts.status}` : ''}: ${counts?.error}`}</div>)}
      <div>MongoDB: {d?.mongodb ?? 'Pending'}</div><div>After MongoDB merge: {d?.afterMongoMerge ?? 'Pending'}</div>
      <div>After name filter: {d?.afterNameFilter ?? 'Pending'}</div><div>After category filter: {d?.afterCategoryFilter ?? 'Pending'}</div><div>After rating filter: {d?.afterRatingFilter ?? 'Pending'}</div>
      <div>After budget filter: {d?.afterBudgetFilter ?? 'Pending'}</div><div>After eco filter: {d?.afterEcoFilter ?? 'Pending'}</div>
      <div>Final live results: {d?.finalLiveResults ?? 'Pending'}</div><div>S-CADE count: {d?.scadeCount ?? 'Pending'}</div>
      <div>Frontend count: {discovery?.afterScade ?? 'Pending'}</div>{discovery?.error && <div>Live discovery error: {discovery.error}</div>}
      {discovery?.warnings.map((warning) => <div key={warning}>Warning: {warning}</div>)}
    </div></details>;
}
