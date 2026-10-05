import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlaceDetail } from '../services/placesService';
import { PlaceDetail, PlaceKind } from '../types';
import { LoadingState, ErrorState } from '../components/StateViews';
import { FavoriteButton } from '../components/FavoriteButton';
import { ReviewsSection } from '../components/ReviewsSection';
import { MapView } from '../components/MapView';

export function PlaceDetailsPage({ kind }: { kind: PlaceKind }) {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setDetail(null); setError(null);
    getPlaceDetail(kind, id).catch((e) => setError(e.message || 'Failed to load this listing.')).then((d) => d && setDetail(d));
  }, [kind, id]);

  if (error) return <ErrorState message={error} />;
  if (!detail || !id) return <LoadingState label="Loading details…" />;

  const eco = detail.sustainability >= 0.65;

  return (
    <div className="details-page">
      <Link to="/" className="small">&larr; Back to Discover</Link>
      <div className="details-top">
        <h1>{detail.name}</h1>
        <FavoriteButton kind={kind} id={detail._id} />
      </div>
      <div className="rec-card-meta">
        {detail.category.map((c) => <span key={c} className="pill">{c}</span>)}
        {detail.ratingCount > 0 ? <span className="pill">★ {detail.rating.toFixed(1)} ({detail.ratingCount})</span> : <span className="pill">No rating yet</span>}
        {eco && <span className="pill eco">🌱 Eco-friendly</span>}
        {detail.verified && <span className="pill">✓ Verified</span>}
        <span className="pill">{detail.openTime}–{detail.closeTime}</span>
        <span className="pill">{['Free', 'Low', 'Medium', 'High'][detail.costLevel]}</span>
      </div>

      {detail.description && <p>{detail.description}</p>}
      {detail.images && detail.images.length > 0 && <div className="image-strip">{detail.images.map(src => <img key={src} src={src} alt={detail.name} />)}</div>}
      <div className="action-grid">
        <a className="btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${detail.latitude},${detail.longitude}`}>Navigate</a>
        <Link className="btn alt" to={`/ar?destination=${detail._id}&kind=${kind}`}>AR direction</Link>
      </div>

      <div className="details-contact">
        {detail.address && <p><b>Address:</b> {detail.address}</p>}
        {detail.phone && <p><b>Phone:</b> {detail.phone}</p>}
        {detail.website && <p><b>Website:</b> <a href={detail.website} target="_blank" rel="noreferrer">{detail.website}</a></p>}
        {detail.visitDurationMin && <p><b>Typical visit:</b> {detail.visitDurationMin} min</p>}
      </div>

      <MapView center={{ lat: detail.latitude, lng: detail.longitude }} markers={[{ id: detail._id, name: detail.name, lat: detail.latitude, lng: detail.longitude }]} />

      <ReviewsSection targetType={kind} targetId={detail._id} />
    </div>
  );
}
