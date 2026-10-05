import { useState, useCallback, useRef } from 'react';

export type GeoStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unsupported' | 'error';

interface GeoState {
  status: GeoStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  errorMessage: string | null;
  revision: number;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle', latitude: null, longitude: null, accuracy: null, errorMessage: null, revision: 0 });
  const requestSequence = useRef(0);

  const locate = useCallback(() => {
    const requestId = ++requestSequence.current;
    if (!navigator.geolocation) {
      setState((s) => ({ status: 'unsupported', latitude: null, longitude: null, accuracy: null, errorMessage: 'This browser does not support geolocation.', revision: s.revision }));
      return;
    }
    setState((s) => ({ ...s, status: 'locating', latitude: null, longitude: null, accuracy: null, errorMessage: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (requestId !== requestSequence.current) return;
        if (import.meta.env.DEV) {
          console.info('Browser GPS position', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        }
        setState((s) => ({
          status: 'granted', latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, errorMessage: null,
          revision: s.revision + 1,
        }));
      },
      (err) => {
        if (requestId !== requestSequence.current) return;
        // Per spec §31: never silently substitute a fixed location — surface the real denial/error instead.
        const denied = err.code === err.PERMISSION_DENIED;
        setState((s) => ({
          status: denied ? 'denied' : 'error', latitude: null, longitude: null, accuracy: null,
          errorMessage: denied
            ? 'Location permission was denied. Allow location access in your browser to see nearby recommendations.'
            : `Could not determine your location (${err.message}).`,
          revision: s.revision,
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  return { ...state, locate };
}
