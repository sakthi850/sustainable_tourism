const API_BASE = '/api'; // proxied to the backend by vite.config.ts in dev

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem('wf_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('wf_token', token);
  else localStorage.removeItem('wf_token');
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach the Bearer token — default true
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  const url = `${API_BASE}${path}`;
  const startedAt = performance.now();
  if (import.meta.env.DEV) console.info('[API REQUEST]', { method, url, proxyTarget: import.meta.env.VITE_API_URL || 'http://localhost:5000' });
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // The backend is unreachable entirely (not running, wrong URL, CORS blocked, offline) —
    // this is a distinct failure mode from a proper HTTP error response, per spec §18.
    const detail = networkErr instanceof Error ? networkErr.message : 'Failed to fetch';
    throw new ApiClientError(0, import.meta.env.DEV
      ? `Live request failed. Backend: ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}; endpoint: ${url}; error: ${detail}. Check backend availability, the Vite proxy, and CORS.`
      : 'Could not reach the Wayfinder backend. Please try again.');
  }

  let data: any = null;
  try { data = await res.json(); } catch { /* empty/non-JSON body */ }
  if (import.meta.env.DEV) console.info('[API RESPONSE]', {
    method, url, status: res.status, durationMs: Math.round(performance.now() - startedAt),
    count: data?.count, liveResultsIncluded: data?.discovery?.liveResultsIncluded,
  });

  if (!res.ok) {
    if (res.status === 401 && getToken()) {
      setToken(null);
      window.dispatchEvent(new Event('wf:auth-expired'));
    }
    throw new ApiClientError(res.status, data?.message || `Request failed with HTTP ${res.status}`);
  }
  return data as T;
}
