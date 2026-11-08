import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const viteConfig = fs.readFileSync(path.resolve(__dirname, '../vite.config.ts'), 'utf8');

describe('Build chunk strategy invariants (vite.config.ts)', () => {
  it('keeps @pkmn/dex learnsets out of the eager dex chunk so they stay lazily loaded', () => {
    expect(viteConfig).toMatch(/@pkmn\/dex'\)\s*&&\s*!id\.includes\('learnsets'\)/);
  });

  it('does not route learnsets into the vendor chunk (must return undefined for automatic lazy chunk)', () => {
    expect(viteConfig).toMatch(/id\.includes\('learnsets'\)\)\s*\{\s*return undefined;/);
  });

  it('shares one chunk between src/ui and src/world/interactions to avoid a circular chunk', () => {
    expect(viteConfig).toMatch(/src\/ui\/'\)\s*\|\|\s*id\.includes\('src\/world\/interactions\/'\)/);
    expect(viteConfig).not.toMatch(/return 'world-interactions'/);
  });

  it('registers the global browser-globals test setup file, and the file exists', () => {
    expect(viteConfig).toContain("setupFiles: ['./tests/setup/browserGlobals.ts']");
    expect(fs.existsSync(path.resolve(__dirname, 'setup/browserGlobals.ts'))).toBe(true);
  });
});
