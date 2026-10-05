import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as favoritesService from '../services/favoritesService';
import { EnrichedFavorite } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/StateViews';
import { FavoriteButton } from '../components/FavoriteButton';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<EnrichedFavorite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    favoritesService.listFavorites().then(setFavorites).catch((e) => setError(e.message || 'Failed to load favorites.'));
  }
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!favorites) return <LoadingState label="Loading your favorites…" />;
  if (!favorites.length) return <EmptyState message="You haven't favorited anything yet — the heart icon on any place or business saves it here." />;

  return (
    <div>
      <h1>My Favorites</h1>
      <div className="rec-grid">
        {favorites.map((f) => (
          <article key={f.favoriteId} className="rec-card">
            {f.item ? (
              <>
                <div className="rec-card-top">
                  <Link to={`/${f.targetType === 'place' ? 'places' : 'businesses'}/${f.item.id}`}><h3>{f.item.name}</h3></Link>
                  <FavoriteButton kind={f.targetType} id={f.item.id} />
                </div>
                <div className="rec-card-meta">
                  {f.item.category.map((c) => <span key={c} className="pill">{c}</span>)}
                  <span className="pill">★ {f.item.rating.toFixed(1)}</span>
                </div>
              </>
            ) : (
              <p className="small">This item is no longer available (it may have been removed by an admin).</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
