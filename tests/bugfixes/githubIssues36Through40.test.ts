// Mock minimal browser globals for PixiJS environment hydration in node
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import { NPC_SHEET_PATHS } from '../../src/render/OverworldNpcAndItemSprites';
import { RoamingManager, JOHTO_GRASS_ROUTES } from '../../src/world/RoamingManager';
import { OverworldHUD } from '../../src/ui/OverworldHUD';

describe('GitHub Issues #36–#40 & Pokémon Crystal Roaming Beasts Verification', () => {
  it('Issue #36: ensures Route 40 northern border behind Battle Tower Gate roof (x=8..11, y=0..1) is solid tree tiles (collision=1)', () => {
    const r40Path = path.resolve(__dirname, '../../public/assets/data/maps/route_40.json');
    const r40 = JSON.parse(fs.readFileSync(r40Path, 'utf8'));
    const w = r40.width;

    for (let x = 8; x <= 11; x++) {
      expect(r40.tileMap[0 * w + x]).toBe('jt_1e_1f_2e_2f');
      expect(r40.collisionGrid[0 * w + x]).toBe(1);
      expect(r40.tileMap[1 * w + x]).toBe('jt_2e_2f_3e_3f');
      expect(r40.collisionGrid[1 * w + x]).toBe(1);
    }
  });

  it('Issue #37: assigns dedicated swimmer_m and swimmer_f water sprites to all Swimmers on Route 40 and Route 41', () => {
    expect(NPC_SHEET_PATHS.swimmer_m).toBe('./assets/sprites/characters/swimmer_m.png');
    expect(NPC_SHEET_PATHS.swimmer_f).toBe('./assets/sprites/characters/swimmer_f.png');

    const swimmerMFile = path.resolve(__dirname, '../../public/assets/sprites/characters/swimmer_m.png');
    const swimmerFFile = path.resolve(__dirname, '../../public/assets/sprites/characters/swimmer_f.png');
    expect(fs.existsSync(swimmerMFile)).toBe(true);
    expect(fs.existsSync(swimmerFFile)).toBe(true);

    const npcs = createNpcsByMap();
    const r40Swimmers = npcs.route_40.filter((n) => n.id.startsWith('swimmer'));
    expect(r40Swimmers.length).toBe(4);
    for (const s of r40Swimmers) {
      expect(s.spriteType).toBe(s.id.startsWith('swimmerm_') ? 'swimmer_m' : 'swimmer_f');
    }

    const r41Swimmers = npcs.route_41.filter((n) => n.id.startsWith('swimmer'));
    expect(r41Swimmers.length).toBe(10);
    for (const s of r41Swimmers) {
      expect(s.spriteType).toBe(s.id.startsWith('swimmerm_') ? 'swimmer_m' : 'swimmer_f');
    }
  });

  it('Issue #38 & Crystal Roaming Rules: roams only Raikou & Entei (Lv. 40) on Johto grass routes and auto-dismisses non-blocking top HUD banner', () => {
    const rm = new RoamingManager();
    rm.awakenBeasts();

    const active = rm.getActiveRoamers();
    expect(active.map((r) => r.speciesId).sort()).toEqual(['entei', 'raikou']);
    expect(active.every((r) => r.pokemon.level === 40)).toBe(true);
    expect(rm.getRoamer('suicune')).toBeUndefined();

    // Simulate 50 transitions including indoor/dungeon maps like olivine_lighthouse_1f and towns like olivine_city
    const testMaps = ['olivine_lighthouse_1f', 'olivine_city', 'ecruteak_city', 'route_38', 'route_39', 'burned_tower_b1f'];
    for (let i = 0; i < 50; i++) {
      const target = testMaps[i % testMaps.length];
      rm.onPlayerRouteChange(target, () => (i % 10) / 10);
      for (const roamer of rm.getActiveRoamers()) {
        expect(JOHTO_GRASS_ROUTES.has(roamer.currentMapId)).toBe(true);
      }
      expect(rm.getActiveRoamerOnRoute('olivine_lighthouse_1f')).toBeUndefined();
      expect(rm.getActiveRoamerOnRoute('olivine_city')).toBeUndefined();
    }

    // Verify HUD banner auto-dismisses after 2500ms and hides on hideRoamerAlert
    vi.useFakeTimers();
    const fakeBanner: any = { innerText: '', style: { display: 'none' } };
    const fakeHud: any = Object.create(OverworldHUD.prototype);
    fakeHud.roamerAlertBanner = fakeBanner;

    fakeHud.showRoamerAlert('raikou', 'route_38');
    expect(fakeBanner.style.display).toBe('block');
    expect(fakeBanner.innerText).toContain('RAIKOU');

    vi.advanceTimersByTime(2600);
    expect(fakeBanner.style.display).toBe('none');
    vi.useRealTimers();
  });

  it('Issues #39 & #40: maps miltank spriteType to authentic miltank.png for Route 39 pasture Miltanks and Route 39 Barn Moomoo', () => {
    expect(NPC_SHEET_PATHS.miltank).toBe('./assets/sprites/characters/miltank.png');
    const miltankFile = path.resolve(__dirname, '../../public/assets/sprites/characters/miltank.png');
    expect(fs.existsSync(miltankFile)).toBe(true);

    const npcs = createNpcsByMap();
    const r39Miltanks = npcs.route_39.filter((n) => n.id.includes('miltank'));
    expect(r39Miltanks.length).toBe(4);
    for (const m of r39Miltanks) {
      expect(m.spriteType).toBe('miltank');
    }

    const moomoo = npcs.route_39_barn.find((n) => n.id === 'moomoo_miltank');
    expect(moomoo).toBeDefined();
    expect(moomoo?.spriteType).toBe('miltank');
  });
});
