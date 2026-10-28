import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createOlivineToIndigoNpcs } from '../../src/world/npcs/olivineToIndigoNpcs';
import { getJohtoTownServiceInteractions } from '../../src/world/interactions/JohtoTownServiceInteractions';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';

describe('TICKET-WORLD-GLITTER-LIGHTHOUSE-COMPLETE-01: Glitter Lighthouse Multi-Floor Dungeon Ascent', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const lighthouseMaps: Record<string, MapData> = {};

  for (let floor = 1; floor <= 6; floor++) {
    const mapId = `olivine_lighthouse_${floor}f`;
    lighthouseMaps[mapId] = JSON.parse(fs.readFileSync(path.join(mapsDir, `${mapId}.json`), 'utf8'));
  }

  describe('1. Map Integrity (1F through 6F)', () => {
    it.each([1, 2, 3, 4, 5, 6])('loads olivine_lighthouse_%if with valid 20x18 dimensions', (floor) => {
      const mapId = `olivine_lighthouse_${floor}f`;
      const map = lighthouseMaps[mapId];

      expect(map).toBeDefined();
      expect(map.id).toBe(mapId);
      expect(map.width).toBe(20);
      expect(map.height).toBe(18);
      expect(map.collisionGrid.length).toBe(360);
      if (map.tileMap) {
        expect(map.tileMap.length).toBe(360);
      }
    });
  });

  describe('2. Warp Integrity & Walkable Aprons (1F through 6F)', () => {
    it('asserts 100% of warps across all 6 floors land on valid maps and walkable tiles', () => {
      for (let floor = 1; floor <= 6; floor++) {
        const mapId = `olivine_lighthouse_${floor}f`;
        const map = lighthouseMaps[mapId];
        expect(map.warps.length).toBeGreaterThan(0);

        for (const warp of map.warps) {
          const targetPath = path.join(mapsDir, `${warp.targetMapId}.json`);
          expect(fs.existsSync(targetPath), `Target map ${warp.targetMapId} must exist on disk`).toBe(true);

          const targetMap: MapData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
          const landingIndex = warp.targetY * targetMap.width + warp.targetX;
          const landingCol = targetMap.collisionGrid[landingIndex];
          expect(
            landingCol === 0 || landingCol === 2,
            `Warp from ${mapId} (${warp.x}, ${warp.y}) to ${warp.targetMapId} (${warp.targetX}, ${warp.targetY}) must land on walkable tile (0 or 2), received ${landingCol}`
          ).toBe(true);

          const sourceIndex = warp.y * map.width + warp.x;
          const sourceCol = map.collisionGrid[sourceIndex];
          expect(
            sourceCol === 0 || sourceCol === 2,
            `Source warp on ${mapId} at (${warp.x}, ${warp.y}) must be walkable (0 or 2), received ${sourceCol}`
          ).toBe(true);
        }
      }
    });
  });

  describe('3. Canonical Trainer Population & Teams', () => {
    const npcs = createOlivineToIndigoNpcs();

    const expectedTrainers = [
      {
        mapId: 'olivine_lighthouse_2f',
        id: 'sailor_huey',
        x: 9,
        y: 3,
        dir: 'RIGHT',
        species: ['poliwag', 'poliwhirl'],
      },
      {
        mapId: 'olivine_lighthouse_2f',
        id: 'gentleman_alfred',
        x: 17,
        y: 8,
        dir: 'LEFT',
        species: ['noctowl'],
      },
      {
        mapId: 'olivine_lighthouse_3f',
        id: 'bird_keeper_theo',
        x: 3,
        y: 9,
        dir: 'UP',
        species: ['fearow'],
      },
      {
        mapId: 'olivine_lighthouse_3f',
        id: 'sailor_terrell',
        x: 9,
        y: 2,
        dir: 'DOWN',
        species: ['poliwhirl', 'poliwhirl'],
      },
      {
        mapId: 'olivine_lighthouse_3f',
        id: 'gentleman_preston',
        x: 13,
        y: 5,
        dir: 'RIGHT',
        species: ['growlithe', 'growlithe'],
      },
      {
        mapId: 'olivine_lighthouse_4f',
        id: 'lass_connie',
        x: 11,
        y: 2,
        dir: 'DOWN',
        species: ['marill'],
      },
      {
        mapId: 'olivine_lighthouse_4f',
        id: 'sailor_kent',
        x: 7,
        y: 14,
        dir: 'LEFT',
        species: ['krabby', 'krabby'],
      },
      {
        mapId: 'olivine_lighthouse_5f',
        id: 'sailor_ernest',
        x: 8,
        y: 11,
        dir: 'DOWN',
        species: ['machop', 'machop', 'poliwhirl'],
      },
      {
        mapId: 'olivine_lighthouse_5f',
        id: 'bird_keeper_denis',
        x: 8,
        y: 3,
        dir: 'LEFT',
        species: ['spearow', 'fearow'],
      },
    ];

    it.each(expectedTrainers)(
      'registers $id on $mapId at ($x, $y) with valid team',
      ({ mapId, id, x, y, dir, species }) => {
        const floorNpcs = npcs[mapId];
        expect(floorNpcs).toBeDefined();

        const trainer = floorNpcs.find((n) => n.id === id);
        expect(trainer).toBeDefined();
        expect(trainer?.x).toBe(x);
        expect(trainer?.y).toBe(y);
        expect(trainer?.direction).toBe(dir);
        expect(trainer?.action).toBe('TRAINER_BATTLE');
        expect(trainer?.trainerTeam).toBeDefined();

        const teamSpecies = trainer!.trainerTeam!.map((t) => t.speciesId);
        expect(teamSpecies).toEqual(species);

        // Check walkability of trainer coordinate on respective map
        const map = lighthouseMaps[mapId];
        const col = map.collisionGrid[y * map.width + x];
        expect(col, `Trainer ${id} at (${x}, ${y}) must stand on walkable tile (0)`).toBe(0);
      }
    );
  });

  describe('4. Quest Flag & Amphy Healing Narrative (6F)', () => {
    const npcs = createOlivineToIndigoNpcs().olivine_lighthouse_6f;
    const interactions = getJohtoTownServiceInteractions();
    const amphyHandler = interactions.find((i) => i.actions?.includes('AMPHY_EVENT'))?.handler;

    it('registers Jasmine and Amphy on 6F with AMPHY_EVENT action', () => {
      const jasmine = npcs.find((n) => n.id === 'lighthouse_jasmine');
      const amphy = npcs.find((n) => n.id === 'lighthouse_amphy');

      expect(jasmine).toBeDefined();
      expect(jasmine?.x).toBe(8);
      expect(jasmine?.y).toBe(8);
      expect(jasmine?.action).toBe('AMPHY_EVENT');

      expect(amphy).toBeDefined();
      expect(amphy?.x).toBe(9);
      expect(amphy?.y).toBe(8);
      expect(amphy?.action).toBe('AMPHY_EVENT');
    });

    it('informs player of Amphy sickness when SecretPotion is not present', () => {
      expect(amphyHandler).toBeDefined();
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      amphyHandler!({ id: 'lighthouse_jasmine', speaker: '🔩 JASMINE' } as any, lighthouseMaps.olivine_lighthouse_6f, ctx);
      expect(dialogText).toContain('CIANWOOD CITY');
      expect(ctx.storyFlags.has('amphy_cured')).toBe(false);
    });

    it('cures Amphy when player presents SECRETPOTION', () => {
      let dialogText = '';
      let toastText = '';
      let saved = false;

      const ctx: any = {
        playerName: 'Gold',
        storyFlags: new Set<string>(['has_secret_potion']),
        audioManager: { playSfx: () => {} },
        openDialogue: (pages: string[], _sp: string, onComplete: () => void) => {
          dialogText = pages.join(' ');
          onComplete?.();
        },
        saveCurrentGame: () => {
          saved = true;
        },
        showToast: (msg: string) => {
          toastText = msg;
        },
      };

      amphyHandler!({ id: 'lighthouse_jasmine', speaker: '🔩 JASMINE' } as any, lighthouseMaps.olivine_lighthouse_6f, ctx);
      expect(ctx.storyFlags.has('amphy_cured')).toBe(true);
      expect(dialogText).toContain('handed over the SECRETPOTION to JASMINE');
      expect(saved).toBe(true);
      expect(toastText).toContain('Amphy recovered');
    });

    it('delivers post-curing dialogue once amphy_cured is set', () => {
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(['amphy_cured']),
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      amphyHandler!({ id: 'lighthouse_jasmine', speaker: '🔩 JASMINE' } as any, lighthouseMaps.olivine_lighthouse_6f, ctx);
      expect(dialogText).toContain('Amphy is all better now');
    });
  });

  describe('5. Overworld Items Dataset Integrity', () => {
    const itemManager = new OverworldItemManager();

    it('verifies all Lighthouse item balls and hidden items exist at valid coordinates', () => {
      // 3F Ether at (8, 2)
      const l3Items = itemManager.getItemsForMap('olivine_lighthouse_3f');
      expect(l3Items.some((i) => i.itemId === 'ether' && i.x === 8 && i.y === 2)).toBe(true);

      // 5F Rare Candy at (15, 12)
      const l5Items = itemManager.getItemsForMap('olivine_lighthouse_5f');
      expect(l5Items.some((i) => i.itemId === 'rare_candy' && i.x === 15 && i.y === 12)).toBe(true);

      // 5F Super Repel at (6, 15)
      expect(l5Items.some((i) => i.itemId === 'super_repel' && i.x === 6 && i.y === 15)).toBe(true);

      // 5F TM34 at (2, 13)
      expect(l5Items.some((i) => i.itemId === 'TM34' && i.x === 2 && i.y === 13)).toBe(true);

      // 5F Hidden Hyper Potion at (3, 13)
      const l5Hidden = itemManager.getHiddenItemsForMap('olivine_lighthouse_5f');
      expect(l5Hidden.some((h) => h.itemId === 'hyper_potion' && h.x === 3 && h.y === 13)).toBe(true);

      // 6F Super Potion at (3, 4)
      const l6Items = itemManager.getItemsForMap('olivine_lighthouse_6f');
      expect(l6Items.some((i) => i.itemId === 'super_potion' && i.x === 3 && i.y === 4)).toBe(true);
    });
  });
});
