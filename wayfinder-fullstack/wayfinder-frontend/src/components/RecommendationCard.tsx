import { Link } from 'react-router-dom';
import { Recommendation } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitRecommendationFeedback } from '../services/feedbackService';

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const eco = rec.sustainability !== null && rec.sustainability >= 0.65;
  const detailsPath = rec.source === 'platform' ? `/${rec.kind === 'place' ? 'places' : 'businesses'}/${rec.id}` : null;
  const nameEl = detailsPath ? <Link to={detailsPath}><h3>{rec.name}</h3></Link> : <h3>{rec.name}</h3>;
  return (
    <article className="rec-card">
      <div className="rec-card-top">
        {nameEl}
        <div className="row" style={{ gap: '.3rem' }}>
          <span className="score-badge">Recommendation score: {rec.recommendationScore}</span>
          <FavoriteButton kind={rec.kind} id={rec.id} canFavorite={rec.source === 'platform'} />
        </div>
      </div>
      <div className="rec-card-meta">
        {rec.category.map((c) => <span key={c} className="pill">{c}</span>)}
        <span className="pill">{rec.distanceKm.toFixed(1)} km</span>
        {rec.hasRating && rec.rating !== null ? <span className="pill">★ {rec.rating.toFixed(1)}</span> : <span className="pill">Rating unavailable</span>}
        {eco && <span className="pill eco">🌱 Eco-friendly</span>}
        {rec.verified && <span className="pill">✓ Verified</span>}
        {rec.source === 'osm' && <span className="pill live">Live OpenStreetMap</span>}
        {rec.source === 'geoapify' && <span className="pill live">Live Geoapify</span>}
        {rec.source === 'platform' && <span className="pill">Platform</span>}
        <span className="pill">{rec.locationLabel ?? 'Map location'}</span>
        <span className="pill">{rec.kind === 'place' ? 'Tourist place' : 'Local business'}</span>
      </div>
      {/* Plain-language explanation only — the underlying weighted formula is never shown to the user, per spec §6 */}
      <p className="rec-explanation">{rec.explanation}</p>
      {rec.address && <p className="small">{rec.address}</p>}
      <div className="row card-actions">
        {detailsPath && <Link className="btn" to={detailsPath}>View details</Link>}
        <a className="btn ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${rec.latitude},${rec.longitude}`}>Navigate</a>
      </div>
      {rec.sustainability === null && <small>Sustainability information unavailable{rec.sustainabilityEvidence?.length ? `; OSM signals: ${rec.sustainabilityEvidence.join(', ')}` : ''}.</small>}
      {rec.source !== 'platform' && <small> Live discoveries are transient and cannot be favorited or reviewed.</small>}
      {user && rec.source === 'platform' && <div className="feedback-row">
        <span>Was this recommendation useful?</span>
        <button className={`btn ghost ${feedback === true ? 'active' : ''}`} onClick={async()=>{try{await submitRecommendationFeedback(rec.kind,rec.id,rec.scadeScore,true);setFeedback(true);setFeedbackError(null)}catch(e:any){setFeedbackError(e.message)}}}>👍 Useful</button>
        <button className={`btn ghost ${feedback === false ? 'active' : ''}`} onClick={async()=>{try{await submitRecommendationFeedback(rec.kind,rec.id,rec.scadeScore,false);setFeedback(false);setFeedbackError(null)}catch(e:any){setFeedbackError(e.message)}}}>👎 Not useful</button>
        {feedback !== null && <small>Thanks for your feedback.</small>}{feedbackError && <small>{feedbackError}</small>}
      </div>}
    </article>
  );
}
