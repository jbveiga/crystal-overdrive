import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createOlivineToIndigoNpcs } from '../../src/world/npcs/olivineToIndigoNpcs';
import { getJohtoTownServiceInteractions } from '../../src/world/interactions/JohtoTownServiceInteractions';
import { getMidToLateJohtoQuestInteractions } from '../../src/world/interactions/MidToLateJohtoQuestInteractions';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import type { PokemonInstance } from '../../src/types/game';

describe('TICKET-WORLD-CIANWOOD-CITY-AND-PHARMACY-01: Cianwood City Overworld & 500-Year Pharmacy', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const itemsPath = path.resolve(__dirname, '../../public/assets/data/overworld_items.json');
  const spritesDir = path.resolve(__dirname, '../../public/assets/sprites/characters');

  const cianwood: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_city.json'), 'utf8'));
  const maniasHouse: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'manias_house.json'), 'utf8'));
  const pokeSeersHouse: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'poke_seers_house.json'), 'utf8'));
  const pharmacy: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_pharmacy.json'), 'utf8'));
  const photoStudio: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_photo_studio.json'), 'utf8'));
  const pokeCenter: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_poke_center.json'), 'utf8'));
  const gym: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_gym.json'), 'utf8'));
  const lugiaHouse: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_lugia_speech_house.json'), 'utf8'));

  describe('1. Map Connectivity & Reciprocal Warps', () => {
    it('verifies cianwood_city dimensions and seamless connection to route_41', () => {
      expect(cianwood.id).toBe('cianwood_city');
      expect(cianwood.width).toBe(30);
      expect(cianwood.height).toBe(54);
      expect(cianwood.collisionGrid.length).toBe(30 * 54);
      expect(cianwood.connections?.EAST?.mapId).toBe('route_41');
    });

    it('asserts all 7 interior maps have valid dimensions and collision grids', () => {
      const interiors8x8 = [
        { map: maniasHouse, id: 'manias_house' },
        { map: pokeSeersHouse, id: 'poke_seers_house' },
        { map: pharmacy, id: 'cianwood_pharmacy' },
        { map: photoStudio, id: 'cianwood_photo_studio' },
        { map: lugiaHouse, id: 'cianwood_lugia_speech_house' },
      ];

      for (const { map, id } of interiors8x8) {
        expect(map.id).toBe(id);
        expect(map.width).toBe(8);
        expect(map.height).toBe(8);
        expect(map.collisionGrid.length).toBe(64);
      }

      expect(pokeCenter.id).toBe('cianwood_poke_center');
      expect(pokeCenter.width).toBe(10);
      expect(pokeCenter.height).toBe(8);
      expect(pokeCenter.collisionGrid.length).toBe(80);

      expect(gym.id).toBe('cianwood_gym');
      expect(gym.width).toBe(10);
      expect(gym.height).toBe(18);
    });

    it('verifies reciprocal warps and walkable landing aprons for all 7 doorways', () => {
      const doors = [
        { name: 'Poke Center', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'cianwood_poke_center'), interior: pokeCenter },
        { name: 'Pharmacy', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'cianwood_pharmacy'), interior: pharmacy },
        { name: 'Mania House', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'manias_house'), interior: maniasHouse },
        { name: 'Photo Studio', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'cianwood_photo_studio'), interior: photoStudio },
        { name: 'Lugia House', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'cianwood_lugia_speech_house'), interior: lugiaHouse },
        { name: 'Poke Seer', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'poke_seers_house'), interior: pokeSeersHouse },
        { name: 'Gym', warpIndex: cianwood.warps?.find(w => w.targetMapId === 'cianwood_gym'), interior: gym },
      ];

      for (const { name, warpIndex, interior } of doors) {
        expect(warpIndex, `${name} door warp must exist in cianwood_city`).toBeDefined();
        if (!warpIndex) continue;

        // Landing tile inside must be walkable (0 or 2)
        const insideCol = interior.collisionGrid[warpIndex.targetY * interior.width + warpIndex.targetX];
        expect(insideCol === 0 || insideCol === 2, `${name} inside landing tile must be walkable, got ${insideCol}`).toBe(true);

        // Reciprocal exit warps
        expect(interior.warps?.length).toBeGreaterThan(0);
        for (const exitWarp of interior.warps ?? []) {
          expect(exitWarp.targetMapId).toBe('cianwood_city');
          const cityCol = cianwood.collisionGrid[exitWarp.targetY * cianwood.width + exitWarp.targetX];
          expect(cityCol === 0 || cityCol === 2, `${name} exit landing in city must be walkable, got ${cityCol}`).toBe(true);
        }
      }
    });

    it('asserts all 6 canonical signposts exist in bgEvents on solid tiles', () => {
      const signs = [
        { x: 20, y: 34, speaker: '🌊 CIANWOOD CITY' },
        { x: 7, y: 45, speaker: '🥋 CIANWOOD GYM' },
        { x: 19, y: 47, speaker: '💊 CIANWOOD PHARMACY' },
        { x: 24, y: 43, speaker: '🏥 POKéMON CENTER' },
        { x: 8, y: 32, speaker: '📸 PHOTO STUDIO' },
        { x: 8, y: 24, speaker: '🔮 POKé SEER' },
      ];

      for (const s of signs) {
        const found = cianwood.bgEvents?.find(b => b.x === s.x && b.y === s.y);
        expect(found, `Signpost at (${s.x}, ${s.y}) must exist`).toBeDefined();
        expect(cianwood.collisionGrid[s.y * cianwood.width + s.x], `Signpost at (${s.x}, ${s.y}) must be solid tile 1`).toBe(1);
      }
    });
  });

  describe('2. Canonical NPC Population & Sprites', () => {
    const allNpcs = createOlivineToIndigoNpcs();

    it('verifies Cianwood interior and outdoor NPCs exist on walkable tiles', () => {
      const cianwoodNpcs = allNpcs.cianwood_city ?? [];
      expect(cianwoodNpcs.find(n => n.id === 'cianwood_suicune')).toBeDefined();
      expect(cianwoodNpcs.find(n => n.id === 'cianwood_youngster')).toBeDefined();
      expect(cianwoodNpcs.find(n => n.id === 'cianwood_pokefan_m')).toBeDefined();
      expect(cianwoodNpcs.find(n => n.id === 'cianwood_lass')).toBeDefined();
      expect(cianwoodNpcs.find(n => n.id === 'chucks_wife')).toBeDefined();
      expect(cianwoodNpcs.find(n => n.id === 'cianwood_eusine')).toBeDefined();

      const kirk = allNpcs.manias_house?.find(n => n.id === 'cianwood_kirk');
      expect(kirk).toBeDefined();
      expect(kirk?.action).toBe('MANIA_SHUCKLE_EVENT');
      expect(maniasHouse.collisionGrid[kirk!.y * maniasHouse.width + kirk!.x]).toBe(0);

      const seer = allNpcs.poke_seers_house?.find(n => n.id === 'poke_seer');
      expect(seer).toBeDefined();
      expect(pokeSeersHouse.collisionGrid[seer!.y * pokeSeersHouse.width + seer!.x]).toBe(0);

      const photographer = allNpcs.cianwood_photo_studio?.find(n => n.id === 'cianwood_photographer');
      expect(photographer).toBeDefined();
      expect(photographer?.action).toBe('PHOTO_STUDIO_EVENT');
      expect(photoStudio.collisionGrid[photographer!.y * photoStudio.width + photographer!.x]).toBe(0);

      const pharmacist = allNpcs.cianwood_pharmacy?.find(n => n.id === 'cianwood_pharmacist');
      expect(pharmacist).toBeDefined();
      expect(pharmacist?.action).toBe('PHARMACY_SECRET_POTION_EVENT');
    });

    it('asserts 100% of referenced sprites exist on disk', () => {
      const spritesToCheck = ['suicune', 'eusine', 'gramps', 'fisherman', 'boy', 'girl', 'fat_man', 'teacher'];
      for (const s of spritesToCheck) {
        const direct = path.join(spritesDir, `${s}.png`);
        const prefixed = path.join(spritesDir, `npc_${s}.png`);
        expect(fs.existsSync(direct) || fs.existsSync(prefixed), `Sprite ${s} must exist on disk`).toBe(true);
      }
    });

    it('verifies dynamic lifecycle flags for Suicune and Eusine', () => {
      const flags = new Set<string>();
      expect(isNpcActiveForStoryFlags('cianwood_suicune', flags)).toBe(true);
      expect(isNpcActiveForStoryFlags('cianwood_eusine', flags)).toBe(true);

      flags.add('EVENT_SAW_SUICUNE_AT_CIANWOOD_CITY');
      expect(isNpcActiveForStoryFlags('cianwood_suicune', flags)).toBe(false);
      expect(isNpcActiveForStoryFlags('cianwood_eusine', flags)).toBe(true);

      flags.add('EVENT_FOUGHT_EUSINE');
      expect(isNpcActiveForStoryFlags('cianwood_eusine', flags)).toBe(false);
    });
  });

  describe('3. 500-Year Pharmacy SecretPotion Flow', () => {
    it('grants SecretPotion, updates keyItems inventory and sets has_secret_potion flag', () => {
      const interactions = getJohtoTownServiceInteractions();
      const pharmacyEntry = interactions.find(i => i.actions?.includes('PHARMACY_SECRET_POTION_EVENT'));
      expect(pharmacyEntry).toBeDefined();

      const storyFlags = new Set<string>();
      const inventory = { keyItems: [] as string[] };
      let dialogueOpened = false;

      const mockCtx: any = {
        storyFlags,
        inventory,
        playerName: 'Gold',
        openDialogue: (_pages: string[], _speaker: string, cb?: () => void) => {
          dialogueOpened = true;
          cb?.();
        },
        audioManager: { playSfx: vi.fn() },
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };

      const pharmacistNpc = { id: 'cianwood_pharmacist', speaker: '💊 PHARMACIST' } as any;
      pharmacyEntry?.handler(pharmacistNpc, pharmacy, mockCtx);

      expect(storyFlags.has('has_secret_potion')).toBe(true);
      expect(inventory.keyItems).toContain('SecretPotion');
      expect(dialogueOpened).toBe(true);
      expect(mockCtx.saveCurrentGame).toHaveBeenCalled();
    });
  });

  describe('4. Mania / Kirk Shuckie Gift & Party Overflow Guard', () => {
    it('blocks Shuckie gift when player party is already full (6 Pokémon)', () => {
      const interactions = getMidToLateJohtoQuestInteractions();
      const shuckleEntry = interactions.find(i => i.actions?.includes('MANIA_SHUCKLE_EVENT'));
      expect(shuckleEntry).toBeDefined();

      const storyFlags = new Set<string>();
      const playerParty = [
        { speciesId: 'typhlosion' },
        { speciesId: 'pidgeot' },
        { speciesId: 'ampharos' },
        { speciesId: 'heracross' },
        { speciesId: 'quagsire' },
        { speciesId: 'steelix' },
      ] as PokemonInstance[];

      let openedPages: string[] = [];
      const mockCtx: any = {
        storyFlags,
        playerParty,
        playerName: 'Gold',
        openDialogue: (pages: string[]) => {
          openedPages = pages;
        },
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };

      const kirkNpc = { id: 'cianwood_kirk', speaker: '🐢 KIRK' } as any;
      shuckleEntry?.handler(kirkNpc, maniasHouse, mockCtx);

      expect(storyFlags.has('received_shuckie')).toBe(false);
      expect(playerParty.length).toBe(6);
      expect(openedPages[0]).toContain('Your party is full');
    });

    it('safely delivers Shuckie (Lv. 20, Berry, OT: KIRK, authentic moves) when party has room', () => {
      const interactions = getMidToLateJohtoQuestInteractions();
      const shuckleEntry = interactions.find(i => i.actions?.includes('MANIA_SHUCKLE_EVENT'));

      const storyFlags = new Set<string>();
      const playerParty: PokemonInstance[] = [];

      let toastMsg = '';
      const mockCtx: any = {
        storyFlags,
        playerParty,
        playerName: 'Gold',
        openDialogue: (_pages: string[], _speaker: string, cb?: () => void) => {
          cb?.();
        },
        saveCurrentGame: vi.fn(),
        showToast: (msg: string) => {
          toastMsg = msg;
        },
      };

      const kirkNpc = { id: 'cianwood_kirk', speaker: '🐢 KIRK' } as any;
      shuckleEntry?.handler(kirkNpc, maniasHouse, mockCtx);

      expect(storyFlags.has('received_shuckie')).toBe(true);
      expect(storyFlags.has('EVENT_GOT_SHUCKIE')).toBe(true);
      expect(playerParty.length).toBe(1);

      const shuckie = playerParty[0];
      expect(shuckie.speciesId).toBe('shuckle');
      expect(shuckie.level).toBe(20);
      expect(shuckie.nickname).toBe('SHUCKIE');
      expect(shuckie.heldItem).toBe('berry');
      expect(shuckie.originalTrainer).toBe('KIRK');
      expect(shuckie.moves.map(m => m.moveId)).toEqual(['constrict', 'bide', 'encore', 'safeguard']);
      expect(toastMsg).toContain('Received SHUCKIE from Kirk');
    });
  });

  describe('5. Suicune Beach Sighting & Mysticalman Eusine Battle Cutscene', () => {
    it('runs Suicune fleeing sequence and triggers battle against canonical Eusine team', () => {
      const storyFlags = new Set<string>();
      const defeatedTrainers = new Set<string>();
      let triggeredBattleOptions: any = null;

      const mockCtx: any = {
        player: { x: 11, y: 16, isMoving: false, progress: 0 },
        storyFlags,
        defeatedTrainers,
        playerName: 'Gold',
        setCutsceneLocked: vi.fn(),
        audioManager: {
          playBattleBgm: vi.fn(),
          restoreOverworldBgm: vi.fn(),
        },
        overworldHUD: {
          openDialogue: (_pages: string[], _speaker: string, cb?: () => void) => {
            cb?.();
          },
          showToast: vi.fn(),
        },
        saveCurrentGame: vi.fn(),
        triggerBattle: (_opponent: PokemonInstance, options: any) => {
          triggeredBattleOptions = options;
        },
      };

      StoryCutscenes.triggerCianwoodSuicuneAndEusine(mockCtx);

      expect(storyFlags.has('EVENT_SAW_SUICUNE_AT_CIANWOOD_CITY')).toBe(true);
      expect(triggeredBattleOptions).toBeDefined();
      expect(triggeredBattleOptions.isTrainer).toBe(true);
      expect(triggeredBattleOptions.trainerName).toBe('Mysticalman Eusine');

      const team: PokemonInstance[] = triggeredBattleOptions.trainerTeam;
      expect(team.length).toBe(3);
      expect(team[0].speciesId).toBe('drowzee');
      expect(team[0].level).toBe(23);
      expect(team[1].speciesId).toBe('haunter');
      expect(team[1].level).toBe(23);
      expect(team[2].speciesId).toBe('electrode');
      expect(team[2].level).toBe(25);

      // Simulate player victory
      triggeredBattleOptions.onVictory();
      expect(storyFlags.has('EVENT_FOUGHT_EUSINE')).toBe(true);
      expect(defeatedTrainers.has('eusine_cianwood')).toBe(true);
    });
  });

  describe('6. Photo Studio & Hidden Items', () => {
    it('records commemorative photo taken at photo studio', () => {
      const interactions = getMidToLateJohtoQuestInteractions();
      const photoEntry = interactions.find(i => i.actions?.includes('PHOTO_STUDIO_EVENT'));
      expect(photoEntry).toBeDefined();

      const storyFlags = new Set<string>();
      const mockCtx: any = {
        storyFlags,
        playerName: 'Gold',
        openDialogue: (_pages: string[], _speaker: string, cb?: () => void) => cb?.(),
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };

      const photoNpc = { id: 'cianwood_photographer', speaker: '📸 CAMERAMAN' } as any;
      photoEntry?.handler(photoNpc, photoStudio, mockCtx);

      expect(storyFlags.has('photo_taken')).toBe(true);
      expect(storyFlags.has('EVENT_TOOK_PHOTO_IN_CIANWOOD')).toBe(true);
    });

    it('verifies overworld hidden items for Cianwood City exist in overworld_items.json', () => {
      const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
      const hiddenList: Array<{ id: string; mapId: string }> = itemsData.hiddenItems || [];

      const revive = hiddenList.find(i => i.id === 'cianwood_city_hidden_4_19_revive');
      expect(revive).toBeDefined();
      expect(revive?.mapId).toBe('cianwood_city');

      const maxEther = hiddenList.find(i => i.id === 'cianwood_city_hidden_5_29_max_ether');
      expect(maxEther).toBeDefined();
      expect(maxEther?.mapId).toBe('cianwood_city');
    });
  });
});
