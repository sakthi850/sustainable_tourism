import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as favoritesService from '../services/favoritesService';
import { PlaceKind } from '../types';

export function useFavorites() {
  const { user } = useAuth();
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setFavoritedIds(new Set()); setLoaded(true); return; }
    favoritesService.listFavorites()
      .then((favs) => setFavoritedIds(new Set(favs.map((f) => f.targetId))))
      .catch(() => { /* non-critical — cards just won't show a filled heart */ })
      .finally(() => setLoaded(true));
  }, [user]);

  const isFavorited = useCallback((id: string) => favoritedIds.has(id), [favoritedIds]);

  const toggle = useCallback(async (kind: PlaceKind, id: string) => {
    const currentlyFavorited = favoritedIds.has(id);
    // Optimistic update — reverted if the request fails, so the heart never lies for long.
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      currentlyFavorited ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (currentlyFavorited) await favoritesService.removeFavorite(id);
      else await favoritesService.addFavorite(kind, id);
    } catch (e) {
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        currentlyFavorited ? next.add(id) : next.delete(id);
        return next;
      });
      throw e;
    }
  }, [favoritedIds]);

  return { isFavorited, toggle, loaded };
}
