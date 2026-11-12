/**
 * Resilient, safe fetch utility that handles network disconnects,
 * 4xx/5xx responses, and JSON parse failures without throwing unhandled exceptions.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallback: T = null as unknown as T
): Promise<T> {
  try {
    const res = await fetch(input, init);
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
