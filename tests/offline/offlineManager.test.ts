import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { OfflineManager, OFFLINE_CACHE_NAME, OFFLINE_RECORD_KEY, type OfflineDeps } from '../../src/ui/offline/OfflineManager';
import { describeOfflineState } from '../../src/ui/offline/OfflinePlaySection';

const BASE = 'https://game.test/app/';
const manifest = (version = 'v1', files = ['index.html', 'assets/a.js', 'assets/data/m.json']) => ({
  version, totalBytes: files.length * 10, files: files.map((url) => ({ url, size: 10 })),
});

function setup(opts: { manifest?: any; failUrl?: string; online?: boolean } = {}) {
  const store = new Map<string, Response>();
  const cacheObj = {
    put: async (u: any, r: Response) => { store.set(typeof u === 'string' ? u : u.url, r); },
    keys: async () => [...store.keys()].map((url) => ({ url }) as Request),
    delete: async (r: any) => store.delete(typeof r === 'string' ? r : r.url),
  };
  let cachesDeleted = false; let registered: string | null = null; let unregistered = 0; let persisted = false;
  const ls = new Map<string, string>();
  let currentManifest = opts.manifest === undefined ? manifest() : opts.manifest;
  const fetchFn = (async (input: any) => {
    const url = String(input);
    if (url.endsWith('offline-manifest.json')) return currentManifest ? new Response(JSON.stringify(currentManifest)) : new Response('', { status: 404 });
    if (url.includes('fonts.googleapis')) return new Response('@font-face{src:url(https://fonts.gstatic.com/x.woff2)}');
    if (url.includes('fonts.gstatic')) return new Response('font');
    if (opts.failUrl && url.endsWith(opts.failUrl)) return new Response('nope', { status: 500 });
    return new Response(`body:${url}`);
  }) as typeof fetch;
  const deps: OfflineDeps = {
    caches: { open: async () => cacheObj as any, delete: async () => { cachesDeleted = true; store.clear(); return true; } },
    fetchFn,
    storage: { getItem: (k) => ls.get(k) ?? null, setItem: (k, v) => void ls.set(k, v), removeItem: (k) => void ls.delete(k) },
    serviceWorker: { register: async (u) => { registered = u; return {}; }, ready: Promise.resolve({}), getRegistrations: async () => [{ unregister: async () => { unregistered++; return true; } }] },
    persistStorage: async () => (persisted = true),
    baseUrl: BASE,
    isOnline: () => opts.online ?? true,
  };
  return { deps, store, ls, setManifest: (m: any) => (currentManifest = m), get: () => ({ cachesDeleted, registered, unregistered, persisted }) };
}

describe('OfflineManager', () => {
  it('is UNSUPPORTED without caches or service workers', () => {
    const { deps } = setup();
    expect(new OfflineManager({ ...deps, caches: undefined }).getState()).toBe('UNSUPPORTED');
    expect(new OfflineManager({ ...deps, serviceWorker: undefined }).getState()).toBe('UNSUPPORTED');
  });

  it('enable downloads every manifest file, registers the worker, records the version and requests persistent storage', async () => {
    const t = setup();
    const m = new OfflineManager(t.deps);
    expect(m.getState()).toBe('OFF');
    const seen: string[] = [];
    m.onChange((s) => seen.push(s));
    expect(await m.enable()).toBe(true);
    expect(m.getState()).toBe('READY');
    expect(seen[0]).toBe('DOWNLOADING');
    for (const f of ['index.html', 'assets/a.js', 'assets/data/m.json']) expect(t.store.has(BASE + f)).toBe(true);
    expect(t.get().registered).toBe(BASE + 'sw.js');
    expect(t.get().persisted).toBe(true);
    expect(JSON.parse(t.ls.get(OFFLINE_RECORD_KEY)!).version).toBe('v1');
    expect(OFFLINE_CACHE_NAME).toBe('crystal-overdrive-offline');
    // fonts are cached best-effort
    expect([...t.store.keys()].some((k) => k.includes('fonts.gstatic'))).toBe(true);
    // a fresh manager on the same storage starts READY
    expect(new OfflineManager(t.deps).getState()).toBe('READY');
  });

  it('a failed file ends in ERROR, records nothing, and can be retried', async () => {
    const t = setup({ failUrl: 'assets/a.js' });
    const m = new OfflineManager(t.deps);
    expect(await m.enable()).toBe(false);
    expect(m.getState()).toBe('ERROR');
    expect(m.getError()).toContain('assets/a.js');
    expect(t.ls.has(OFFLINE_RECORD_KEY)).toBe(false);
    const ok = setup();
    expect(await new OfflineManager(ok.deps).enable()).toBe(true);
  });

  it('missing manifest (dev build) is UNAVAILABLE', async () => {
    const t = setup({ manifest: null });
    const m = new OfflineManager(t.deps);
    expect(await m.enable()).toBe(false);
    expect(m.getState()).toBe('UNAVAILABLE');
  });

  it('disable clears cache, worker and record but never touches save data keys', async () => {
    const t = setup();
    t.ls.set('crystal_overdrive_save', 'SAVE');
    const m = new OfflineManager(t.deps);
    await m.enable();
    await m.disable();
    expect(m.getState()).toBe('OFF');
    expect(t.get().cachesDeleted).toBe(true);
    expect(t.get().unregistered).toBe(1);
    expect(t.ls.has(OFFLINE_RECORD_KEY)).toBe(false);
    expect(t.ls.get('crystal_overdrive_save')).toBe('SAVE');
  });

  it('refreshIfStale re-downloads on a new version, drops removed files, and skips when offline or current', async () => {
    const t = setup();
    const m = new OfflineManager(t.deps);
    await m.enable();
    expect(await m.refreshIfStale()).toBe(false); // same version
    t.setManifest(manifest('v2', ['index.html', 'assets/b.js']));
    expect(await m.refreshIfStale()).toBe(true);
    expect(JSON.parse(t.ls.get(OFFLINE_RECORD_KEY)!).version).toBe('v2');
    expect(t.store.has(BASE + 'assets/b.js')).toBe(true);
    expect(t.store.has(BASE + 'assets/a.js')).toBe(false);

    const off = setup({ online: false });
    const m2 = new OfflineManager(off.deps);
    await m2.enable();
    off.setManifest(manifest('v9'));
    expect(await m2.refreshIfStale()).toBe(false);
  });

  it('describes each state for the UI', () => {
    expect(describeOfflineState('OFF').button).toBe('DOWNLOAD FOR OFFLINE');
    expect(describeOfflineState('READY').button).toBe('REMOVE OFFLINE COPY');
    expect(describeOfflineState('DOWNLOADING', { done: 1, total: 4, bytes: 1048576, totalBytes: 4194304 }).label).toContain('1/4');
    expect(describeOfflineState('ERROR', undefined, 'x').button).toBe('RETRY DOWNLOAD');
    expect(describeOfflineState('UNSUPPORTED').button).toBe('');
  });
});

describe('offline manifest builder', () => {
  const { buildManifest } = createRequire(import.meta.url)('../../scripts/build-offline-manifest.cjs');
  it('lists built files (excluding the worker and itself) with a stable, content-sensitive version', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'co-dist-'));
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<html>1</html>');
    fs.writeFileSync(path.join(dir, 'assets/a.js'), 'abc');
    fs.writeFileSync(path.join(dir, 'sw.js'), 'sw');
    fs.writeFileSync(path.join(dir, 'offline-manifest.json'), '{}');
    const a = buildManifest(dir);
    expect(a.files.map((f: any) => f.url)).toEqual(['assets/a.js', 'index.html']);
    expect(buildManifest(dir).version).toBe(a.version);
    fs.writeFileSync(path.join(dir, 'index.html'), '<html>2</html>');
    expect(buildManifest(dir).version).not.toBe(a.version);
  });
  it('the service worker file serves from the offline cache and falls back to the app shell', () => {
    const sw = fs.readFileSync(path.resolve(__dirname, '../../public/sw.js'), 'utf8');
    expect(sw).toContain("'crystal-overdrive-offline'");
    expect(sw).toContain("cache.match(req)");
    expect(sw).toContain("index.html");
  });
});
