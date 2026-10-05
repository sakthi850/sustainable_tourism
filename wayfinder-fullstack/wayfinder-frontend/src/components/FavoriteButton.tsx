import { useState } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { PlaceKind } from '../types';

export function FavoriteButton({ kind, id, canFavorite = true }: { kind: PlaceKind; id: string; canFavorite?: boolean }) {
  const { isFavorited, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);
  const favorited = isFavorited(id);

  if (!canFavorite) {
    return (
      <button className="btn ghost fav-btn" disabled title="Live discoveries aren't saved to the database yet, so they can't be favorited — this works for platform places and businesses.">
        🤍
      </button>
    );
  }

  return (
    <button
      className="btn ghost fav-btn"
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault(); e.stopPropagation(); // so clicking the heart on a card doesn't also navigate into details
        setBusy(true);
        try { await toggle(kind, id); } catch { /* the hook already reverted the optimistic change */ }
        setBusy(false);
      }}
      title={favorited ? 'Remove from favorites' : 'Save to favorites'}
    >
      {favorited ? '❤️' : '🤍'}
    </button>
  );
}
