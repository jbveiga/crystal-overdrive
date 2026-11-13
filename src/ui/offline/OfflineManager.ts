/**
 * @fileoverview OfflineManager: opt-in offline play (downloads the game into the browser cache and registers a service worker).
 * @module ui/offline/OfflineManager
 * @role Browser-side controller for Offline Play; saves already live in local browser storage regardless
 * @exports OfflineState, OfflineProgress, OfflineDeps, OfflineManager, OFFLINE_CACHE_NAME, OFFLINE_RECORD_KEY, OFFLINE_PROGRESS_KEY
 * @layer ui
 * @sections L1-30: Header & Types | L31-150: Manager
 */

export const OFFLINE_CACHE_NAME = 'crystal-overdrive-offline';
export const OFFLINE_RECORD_KEY = 'crystal_overdrive_offline';
/** Tracks bundles already downloaded for a build so an interrupted download resumes instead of restarting. */
export const OFFLINE_PROGRESS_KEY = 'crystal_overdrive_offline_progress';
const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap';

export type OfflineState = 'UNSUPPORTED' | 'UNAVAILABLE' | 'OFF' | 'DOWNLOADING' | 'READY' | 'ERROR';

export interface OfflineProgress { done: number; total: number; bytes: number; totalBytes: number }
interface Manifest {
  version: string;
  totalBytes: number;
  files: { url: string; size: number }[];
  /** Contiguous slices of `files` (max 500 files / 20 MB each). Absent in older builds: treated as one bundle. */
  bundles?: { start: number; end: number; bytes: number }[];
}
interface OfflineRecord { version: string; bytes: number; savedAt: number }

/** Injectable browser surface so the manager can be unit-tested without a DOM. */
export interface OfflineDeps {
  caches?: Pick<CacheStorage, 'open' | 'delete'>;
  fetchFn: typeof fetch;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  serviceWorker?: {
    register: (url: string) => Promise<unknown>;
    ready: Promise<unknown>;
    getRegistrations: () => Promise<ReadonlyArray<{ unregister: () => Promise<boolean> }>>;
  };
  persistStorage?: () => Promise<boolean>;
  baseUrl: string;
  isOnline: () => boolean;
}

export class OfflineManager {
  private state: OfflineState;
  private error = '';
  private listeners = new Set<(state: OfflineState, progress?: OfflineProgress) => void>();
  private busy = false;

  constructor(private readonly deps: OfflineDeps, private readonly concurrency = 6) {
    this.state = !deps.caches || !deps.serviceWorker ? 'UNSUPPORTED' : this.readRecord() ? 'READY' : 'OFF';
  }

  static fromBrowser(): OfflineManager {
    const w = typeof window !== 'undefined' ? window : undefined;
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const sw = nav && 'serviceWorker' in nav && w?.isSecureContext && w?.location?.href ? nav.serviceWorker : undefined;
    return new OfflineManager({
      caches: w && 'caches' in w && sw ? w.caches : undefined,
      fetchFn: (...a) => fetch(...a),
      storage: w?.localStorage ?? { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      serviceWorker: sw
        ? { register: (u) => sw.register(u), ready: sw.ready, getRegistrations: () => sw.getRegistrations() }
        : undefined,
      persistStorage: nav?.storage?.persist ? () => nav.storage.persist() : undefined,
      baseUrl: w?.location?.href ? new URL('./', w.location.href).href : './',
      isOnline: () => nav?.onLine !== false,
    });
  }

  getState(): OfflineState { return this.state; }
  getError(): string { return this.error; }
  getRecord(): OfflineRecord | null { return this.readRecord(); }
  onChange(fn: (state: OfflineState, progress?: OfflineProgress) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Downloads every game file and registers the service worker. Safe to call again to retry or update. */
  async enable(): Promise<boolean> {
    if (this.state === 'UNSUPPORTED' || this.busy) return false;
    this.busy = true;
    this.setState('DOWNLOADING', { done: 0, total: 0, bytes: 0, totalBytes: 0 });
    try {
      const manifest = await this.fetchManifest();
      if (!manifest) {
        this.error = 'The offline pack is not part of this build.';
        this.setState('UNAVAILABLE');
        return false;
      }
      await this.deps.serviceWorker!.register(new URL('sw.js', this.deps.baseUrl).href);
      await this.deps.serviceWorker!.ready;
      const cache = await this.deps.caches!.open(OFFLINE_CACHE_NAME);
      await this.downloadAll(cache, manifest);
      await this.cacheFonts(cache);
      this.deps.storage.setItem(OFFLINE_RECORD_KEY, JSON.stringify({ version: manifest.version, bytes: manifest.totalBytes, savedAt: Date.now() }));
      await this.deps.persistStorage?.().catch(() => false);
      this.error = '';
      this.setState('READY');
      return true;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.setState('ERROR');
      return false;
    } finally {
      this.busy = false;
    }
  }

  /** Removes the cached game and the service worker. Save data is untouched. */
  async disable(): Promise<void> {
    if (this.state === 'UNSUPPORTED') return;
    await this.deps.caches!.delete(OFFLINE_CACHE_NAME).catch(() => false);
    const regs = await this.deps.serviceWorker!.getRegistrations().catch(() => []);
    await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    this.deps.storage.removeItem(OFFLINE_RECORD_KEY);
    this.deps.storage.removeItem(OFFLINE_PROGRESS_KEY);
    this.error = '';
    this.setState('OFF');
  }

  /** When a newer build is online, silently refresh the offline copy. */
  async refreshIfStale(): Promise<boolean> {
    const rec = this.readRecord();
    if (!rec || this.state !== 'READY' || !this.deps.isOnline()) return false;
    const manifest = await this.fetchManifest().catch(() => null);
    if (!manifest || manifest.version === rec.version) return false;
    return this.enable();
  }

  private readRecord(): OfflineRecord | null {
    try {
      const raw = this.deps.storage.getItem(OFFLINE_RECORD_KEY);
      return raw ? (JSON.parse(raw) as OfflineRecord) : null;
    } catch {
      return null;
    }
  }

  private async fetchManifest(): Promise<Manifest | null> {
    const res = await this.deps.fetchFn(new URL('offline-manifest.json', this.deps.baseUrl).href, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as Manifest;
    return Array.isArray(data.files) ? data : null;
  }

  private readDoneBundles(version: string): Set<number> {
    try {
      const p = JSON.parse(this.deps.storage.getItem(OFFLINE_PROGRESS_KEY) ?? 'null') as { version: string; done: number[] } | null;
      return new Set(p && p.version === version ? p.done : []);
    } catch {
      return new Set();
    }
  }

  /** Downloads bundle by bundle (each <= 500 files / 20 MB); finished bundles are remembered so a retry skips them. */
  private async downloadAll(cache: Pick<Cache, 'put' | 'keys' | 'delete'>, manifest: Manifest): Promise<void> {
    const bundles = manifest.bundles?.length ? manifest.bundles : [{ start: 0, end: manifest.files.length, bytes: manifest.totalBytes }];
    const doneBundles = this.readDoneBundles(manifest.version);
    let done = 0;
    let bytes = 0;
    const progress = () =>
      this.setState('DOWNLOADING', { done, total: manifest.files.length, bytes, totalBytes: manifest.totalBytes });
    for (const [i, b] of bundles.entries()) {
      if (doneBundles.has(i)) {
        done += b.end - b.start;
        bytes += b.bytes;
        progress();
        continue;
      }
      const queue = manifest.files.slice(b.start, b.end);
      const worker = async () => {
        for (let f = queue.shift(); f; f = queue.shift()) {
          const url = new URL(f.url, this.deps.baseUrl).href;
          const res = await this.deps.fetchFn(url, { cache: 'reload' });
          if (!res.ok) throw new Error(`Could not download ${f.url} (${res.status})`);
          await cache.put(url, res);
          done++;
          bytes += f.size;
          progress();
        }
      };
      await Promise.all(Array.from({ length: Math.min(this.concurrency, queue.length) }, worker));
      doneBundles.add(i);
      this.deps.storage.setItem(OFFLINE_PROGRESS_KEY, JSON.stringify({ version: manifest.version, done: [...doneBundles] }));
    }
    this.deps.storage.removeItem(OFFLINE_PROGRESS_KEY);
    // Drop cached files that no longer belong to this build
    const keep = new Set(manifest.files.map((f) => new URL(f.url, this.deps.baseUrl).href));
    const existing = (await cache.keys?.()) ?? [];
    await Promise.all(
      existing
        .filter((r) => r.url.startsWith(this.deps.baseUrl) && !keep.has(r.url))
        .map((r) => cache.delete(r))
    );
  }

  /** Best effort: the UI fonts come from Google Fonts; system fonts are the fallback if this fails. */
  private async cacheFonts(cache: Pick<Cache, 'put'>): Promise<void> {
    try {
      const cssRes = await this.deps.fetchFn(FONT_CSS_URL, { mode: 'cors' });
      if (!cssRes.ok) return;
      const css = await cssRes.clone().text();
      await cache.put(FONT_CSS_URL, cssRes);
      const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
      await Promise.all(
        urls.map(async (u) => {
          const r = await this.deps.fetchFn(u, { mode: 'cors' }).catch(() => null);
          if (r?.ok) await cache.put(u, r);
        })
      );
    } catch {
      /* fonts are optional */
    }
  }

  private setState(next: OfflineState, progress?: OfflineProgress): void {
    this.state = next;
    for (const fn of this.listeners) fn(next, progress);
  }
}
