/**
 * Lightweight GET cache for slowly-changing API resources.
 *
 * - Deduplicates concurrent identical GETs (one in-flight request shared
 *   by all callers).
 * - TTL caching so remounts (route changes) don't refetch stale-safe data.
 * - Call `seed` after a successful PATCH/PUT to keep the cache truthful
 *   without a follow-up GET.
 * - Not for transactional data (sales, stock, ledger) — those must always
 *   hit the API fresh.
 */
import apiClient from '../../api/axiosConfig';

interface Entry {
  data: any;
  at: number;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<any>>();

export async function cachedGet<T = any>(path: string, ttlMs = 60_000): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;

  const pending = inflight.get(path);
  if (pending) return pending as Promise<T>;

  const req = apiClient
    .get(path)
    .then((res) => {
      cache.set(path, { data: res.data, at: Date.now() });
      return res.data as T;
    })
    .finally(() => {
      inflight.delete(path);
    });
  inflight.set(path, req);
  return req;
}

export function seed(path: string, data: any): void {
  cache.set(path, { data, at: Date.now() });
}

export function invalidate(path?: string): void {
  if (path) {
    cache.delete(path);
  } else {
    cache.clear();
  }
}
