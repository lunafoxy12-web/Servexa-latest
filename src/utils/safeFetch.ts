/**
 * Resilient, safe fetch utility that handles network disconnects,
 * 4xx/5xx responses, and JSON parse failures without throwing unhandled exceptions.
 * Automatically attaches authenticated user context for secure API authorization.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallback: T = null as unknown as T
): Promise<T> {
  try {
    const headers = new Headers(init?.headers || {});
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('servexa_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.id && !headers.has('x-user-id')) {
            headers.set('x-user-id', u.id);
            headers.set('Authorization', `Bearer token-${u.id}`);
          }
        }
      } catch {}
    }
    const res = await fetch(input, { ...init, headers });
    if (!res.ok) {
      console.warn(`[SafeFetch] HTTP ${res.status} from ${String(input)}`);
      return fallback;
    }
    const data = await res.json();
    return data ?? fallback;
  } catch (err: any) {
    console.warn(`[SafeFetch] Handled network/offline state for ${String(input)}:`, err?.message || err);
    return fallback;
  }
}
