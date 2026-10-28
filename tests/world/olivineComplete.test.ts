import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createOlivineToIndigoNpcs } from '../../src/world/npcs/olivineToIndigoNpcs';
import { getMidToLateJohtoQuestInteractions } from '../../src/world/interactions/MidToLateJohtoQuestInteractions';
import { getGymLeaderInteractions } from '../../src/world/interactions/GymLeaderInteractions';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';
import { INFINITE_TMS } from '../../src/ui/bag/BagItemCatalogs';
import { PokemonFactory } from '../../src/battle/PokemonFactory';

describe('TICKET-WORLD-OLIVINE-COMPLETE-01: Olivine Overworld, Trade, Lore & Port Verification', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const worldMapsPath = path.resolve(__dirname, '../../public/assets/data/world_maps.json');

  const cityMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'olivine_city.json'), 'utf8'));
  const houseMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'olivine_punishment_speech_house.json'), 'utf8'));
  const route39Map: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_39.json'), 'utf8'));

  describe('1. Map & Warp Integrity (Punishment Speech House & Olivine City)', () => {
    it('verifies olivine_punishment_speech_house dimensions, collision, and exit warps', () => {
      expect(houseMap.id).toBe('olivine_punishment_speech_house');
      expect(houseMap.width).toBe(8);
      expect(houseMap.height).toBe(8);
      expect(houseMap.collisionGrid.length).toBe(64);

      // Bookshelves bgEvents at (0, 1) and (1, 1)
      expect(houseMap.bgEvents?.length).toBe(2);
      expect(houseMap.bgEvents?.[0]).toEqual({
        x: 0,
        y: 1,
        speaker: '📚 BOOKSHELF',
        pages: ["It's full of books on sea journeys and ocean navigation."],
      });
      expect(houseMap.bgEvents?.[1]).toEqual({
        x: 1,
        y: 1,
        speaker: '📚 BOOKSHELF',
        pages: ['A collection of folklore about the Whirl Islands and mythical sea dragons.'],
      });

      // Warps back to olivine_city (29, 12)
      expect(houseMap.warps.length).toBe(2);
      expect(houseMap.warps).toContainEqual({
        x: 2,
        y: 7,
        targetMapId: 'olivine_city',
        targetX: 29,
        targetY: 12,
      });
      expect(houseMap.warps).toContainEqual({
        x: 3,
        y: 7,
        targetMapId: 'olivine_city',
        targetX: 29,
        targetY: 12,
      });
    });

    it('verifies olivine_city doorway warp to olivine_punishment_speech_house at (29, 11)', () => {
      const houseWarp = cityMap.warps.find((w) => w.targetMapId === 'olivine_punishment_speech_house');
      expect(houseWarp).toBeDefined();
      expect(houseWarp).toEqual({
        x: 29,
        y: 11,
        targetMapId: 'olivine_punishment_speech_house',
        targetX: 2,
        targetY: 7,
      });

      // Street landing tile at (29, 12) is walkable
      expect(cityMap.collisionGrid[12 * cityMap.width + 29]).toBe(0);
    });

    it('verifies route_39 southern cliff barrier collision row y=35 (x=2..6 are solid)', () => {
      for (let x = 2; x <= 6; x++) {
        expect(route39Map.collisionGrid[35 * route39Map.width + x]).toBe(1);
      }
    });
  });

  describe('2. Canonical Olivine City Signposts (8 bgEvents)', () => {
    it('verifies all 8 signposts exist at exact metatile coordinates with collision 1', () => {
      expect(cityMap.bgEvents?.length).toBe(8);

      const expectedSigns = [
        { x: 17, y: 11, speaker: '⚓ OLIVINE CITY', snippet: 'The Port Closest to Foreign Lands' },
        { x: 13, y: 11, speaker: '🏆 OLIVINE GYM', snippet: 'LEADER: JASMINE' },
        { x: 31, y: 27, speaker: '🗼 OLIVINE LIGHTHOUSE', snippet: 'Glitter Lighthouse' },
        { x: 20, y: 24, speaker: '⚓ OLIVINE PORT', snippet: 'S.S. AQUA' },
        { x: 5, y: 21, speaker: '☕ OLIVINE CAFÉ', snippet: 'sailor stew' },
        { x: 3, y: 23, speaker: '🗼 BATTLE TOWER', snippet: 'BATTLE TOWER AHEAD' },
        { x: 14, y: 21, speaker: '🏥 POKéMON CENTER', snippet: 'POKéMON CENTER' },
        { x: 20, y: 17, speaker: '🏪 POKé MART', snippet: 'Supplies for Long Ocean Voyages' },
      ];

      for (const expected of expectedSigns) {
        const sign = cityMap.bgEvents?.find((s) => s.x === expected.x && s.y === expected.y);
        expect(sign).toBeDefined();
        expect(sign?.speaker).toBe(expected.speaker);
        expect(sign?.pages.some((p) => p.includes(expected.snippet))).toBe(true);
        expect(cityMap.collisionGrid[expected.y * cityMap.width + expected.x]).toBe(1);
      }
    });
  });

  describe('3. Olivine NPCs & Walkability', () => {
    const npcs = createOlivineToIndigoNpcs();

    it('verifies punishment speech house NPCs', () => {
      const houseNpcs = npcs.olivine_punishment_speech_house;
      expect(houseNpcs).toBeDefined();
      expect(houseNpcs.length).toBe(2);

      const dad = houseNpcs.find((n) => n.id === 'punishment_dad');
      expect(dad).toBeDefined();
      expect(dad?.x).toBe(2);
      expect(dad?.y).toBe(4);
      expect(houseMap.collisionGrid[4 * 8 + 2]).toBe(0);

      const daughter = houseNpcs.find((n) => n.id === 'punishment_daughter');
      expect(daughter).toBeDefined();
      expect(daughter?.x).toBe(5);
      expect(daughter?.y).toBe(3);
      expect(houseMap.collisionGrid[3 * 8 + 5]).toBe(0);
    });

    it('verifies port passage and port NPCs', () => {
      const passageNpcs = npcs.olivine_port_passage;
      expect(passageNpcs).toBeDefined();
      const pokefan = passageNpcs.find((n) => n.id === 'port_passage_pokefan_m');
      expect(pokefan?.x).toBe(17);
      expect(pokefan?.y).toBe(1);

      const portNpcs = npcs.olivine_port;
      expect(portNpcs).toBeDefined();
      expect(portNpcs.length).toBe(3);

      const guard = portNpcs.find((n) => n.id === 'port_sailor_guard');
      expect(guard?.x).toBe(7);
      expect(guard?.y).toBe(15);
      expect(guard?.action).toBe('PORT_SAILOR_GUARD');

      const f1 = portNpcs.find((n) => n.id === 'port_fisher_1');
      expect(f1?.x).toBe(4);
      expect(f1?.y).toBe(14);

      const f2 = portNpcs.find((n) => n.id === 'port_fisher_2');
      expect(f2?.x).toBe(13);
      expect(f2?.y).toBe(14);
    });
  });

  describe("4. Tim's Krabby for Voltorb In-Game Trade", () => {
    const interactions = getMidToLateJohtoQuestInteractions();
    const timTradeHandler = interactions.find((i) => i.npcIds?.includes('olivine_tim'))?.handler;

    it('offers trade when player does not have Krabby in party', () => {
      expect(timTradeHandler).toBeDefined();
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        playerParty: [PokemonFactory.create('pikachu', 15)],
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      timTradeHandler!({ id: 'olivine_tim', speaker: '👦 TIM' } as any, houseMap, ctx);
      expect(dialogText).toContain('Do you have a KRABBY?');
      expect(ctx.storyFlags.has('EVENT_TRADED_TIM_VOLTORB')).toBe(false);
    });

    it('executes trade when Krabby is present in party', () => {
      let dialogText = '';
      let toastText = '';
      let saved = false;
      const krabby = PokemonFactory.create('krabby', 18);
      const ctx: any = {
        playerName: 'Gold',
        storyFlags: new Set<string>(),
        playerParty: [krabby],
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

      timTradeHandler!({ id: 'olivine_tim', speaker: '👦 TIM' } as any, houseMap, ctx);
      expect(ctx.storyFlags.has('EVENT_TRADED_TIM_VOLTORB')).toBe(true);
      expect(ctx.playerParty[0].speciesId).toBe('voltorb');
      expect(ctx.playerParty[0].nickname).toBe('VOLTY');
      expect(ctx.playerParty[0].heldItem).toBe('cheri-berry');
      expect(ctx.playerParty[0].originalTrainer).toBe('TIM');
      expect(saved).toBe(true);
      expect(toastText).toContain('Traded KRABBY for TIM’s VOLTORB (VOLTY)!');
    });

    it('displays post-trade dialogue after trade is complete', () => {
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(['EVENT_TRADED_TIM_VOLTORB']),
        playerParty: [],
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      timTradeHandler!({ id: 'olivine_tim', speaker: '👦 TIM' } as any, houseMap, ctx);
      expect(dialogText).toContain("How's that VOLTORB I traded you?");
    });
  });

  describe('5. Port Sailor Ticket Guard Barrier', () => {
    const interactions = getMidToLateJohtoQuestInteractions();
    const guardHandler = interactions.find((i) => i.actions?.includes('PORT_SAILOR_GUARD'))?.handler;

    it('blocks access if player has no S.S. Ticket', () => {
      expect(guardHandler).toBeDefined();
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        inventory: { keyItems: [] },
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      guardHandler!({ id: 'port_sailor_guard', speaker: '⚓ SAILOR' } as any, cityMap, ctx);
      expect(dialogText).toContain("not allowed onto the pier without an S.S. TICKET");
    });

    it('allows entry if player has S.S. Ticket in keyItems or storyFlags', () => {
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(['has_ss_ticket']),
        inventory: { keyItems: [] },
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      guardHandler!({ id: 'port_sailor_guard', speaker: '⚓ SAILOR' } as any, cityMap, ctx);
      expect(dialogText).toContain('Welcome aboard the FAST SHIP S.S. AQUA!');
    });
  });

  describe('6. Jasmine Absent State & Gym Guide', () => {
    const gymInteractions = getGymLeaderInteractions();
    const guideHandler = gymInteractions.find((i) => i.npcIds?.includes('olivine_gym_guide'))?.handler;
    const jasmineHandler = gymInteractions.find((i) => i.actions?.includes('JASMINE_EVENT'))?.handler;

    it('Gym Guide informs that Jasmine is at the Lighthouse caring for sick Pokémon', () => {
      expect(guideHandler).toBeDefined();
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      guideHandler!({ id: 'olivine_gym_guide', speaker: '🏆 GYM GUIDE' } as any, cityMap, ctx);
      expect(dialogText).toContain("JASMINE, the GYM LEADER, is at the LIGHTHOUSE. She's looking after a sick POKéMON");
    });

    it('Jasmine refuses gym battle before Amphy is cured', () => {
      expect(jasmineHandler).toBeDefined();
      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
      };

      jasmineHandler!({ id: 'leader_jasmine', speaker: '🔩 LEADER JASMINE' } as any, cityMap, ctx);
      expect(dialogText).toContain('Amphy is terribly ill at the top of the LIGHTHOUSE');
    });
  });

  describe('7. Rival Confrontation Outside Olivine Gym', () => {
    it('triggers confrontation, delivers monologue, and sets EVENT_RIVAL_OLIVINE_CITY', () => {
      let cutsceneLocked = false;
      let playedBgm = '';
      let restoredBgm = false;
      let dialogText = '';
      let toastText = '';
      let saved = false;

      const mockCtx: any = {
        setCutsceneLocked: (locked: boolean) => {
          cutsceneLocked = locked;
        },
        player: { isMoving: true, progress: 0.5 },
        audioManager: {
          playBattleBgm: (type: string) => {
            playedBgm = type;
          },
          restoreOverworldBgm: () => {
            restoredBgm = true;
          },
        },
        overworldHUD: {
          openDialogue: (pages: string[], _sp: string, onComplete: () => void) => {
            dialogText = pages.join(' ');
            onComplete();
          },
          showToast: (msg: string) => {
            toastText = msg;
          },
        },
        storyFlags: new Set<string>(),
        saveCurrentGame: async () => {
          saved = true;
        },
      };

      StoryCutscenes.triggerOlivineRivalConfrontation(mockCtx);
      expect(mockCtx.player.isMoving).toBe(false);
      expect(playedBgm).toBe('trainer');
      expect(dialogText).toContain("Speaking of weaklings, the city's GYM LEADER isn't here.");
      expect(mockCtx.storyFlags.has('EVENT_RIVAL_OLIVINE_CITY')).toBe(true);
      expect(cutsceneLocked).toBe(false);
      expect(restoredBgm).toBe(true);
      expect(saved).toBe(true);
      expect(toastText).toContain('Rival Silver departed for the Lighthouse!');
    });
  });

  describe('8. Overworld Items & TM34 Swagger', () => {
    it('verifies TM34 Swagger in INFINITE_TMS', () => {
      expect(INFINITE_TMS.TM34).toBeDefined();
      expect(INFINITE_TMS.TM34.moveId).toBe('swagger');
      expect(INFINITE_TMS.TM34.name).toBe('Swagger');
      expect(INFINITE_TMS.TM34.type).toBe('Normal');
    });

    it('verifies Lighthouse and Port overworld items exist in dataset', () => {
      const itemManager = new OverworldItemManager();

      // Port hidden protein
      const portHidden = itemManager.getHiddenItemsForMap('olivine_port');
      expect(portHidden.some((h) => h.itemId === 'protein' && h.x === 1 && h.y === 22)).toBe(true);

      // Lighthouse 3F item ball (Ether)
      const l3Items = itemManager.getItemsForMap('olivine_lighthouse_3f');
      expect(l3Items.some((i) => i.itemId === 'ether')).toBe(true);

      // Lighthouse 5F item balls (Rare Candy, Super Repel, TM34) & hidden Hyper Potion
      const l5Items = itemManager.getItemsForMap('olivine_lighthouse_5f');
      expect(l5Items.some((i) => i.itemId === 'rare_candy')).toBe(true);
      expect(l5Items.some((i) => i.itemId === 'super_repel')).toBe(true);
      expect(l5Items.some((i) => i.itemId === 'TM34')).toBe(true);

      const l5Hidden = itemManager.getHiddenItemsForMap('olivine_lighthouse_5f');
      expect(l5Hidden.some((h) => h.itemId === 'hyper_potion' && h.x === 3 && h.y === 13)).toBe(true);

      // Lighthouse 6F item ball (Super Potion)
      const l6Items = itemManager.getItemsForMap('olivine_lighthouse_6f');
      expect(l6Items.some((i) => i.itemId === 'super_potion')).toBe(true);
    });
  });

  describe('9. World Maps Bundling Verification', () => {
    it('verifies bundled world_maps.json contains punishment speech house and updated olivine city', () => {
      const worldMaps: MapData[] = JSON.parse(fs.readFileSync(worldMapsPath, 'utf8'));
      const house = worldMaps.find((m) => m.id === 'olivine_punishment_speech_house');
      const city = worldMaps.find((m) => m.id === 'olivine_city');

      expect(house).toBeDefined();
      expect(house?.width).toBe(8);
      expect(house?.height).toBe(8);
      expect(city).toBeDefined();
      expect(city?.bgEvents?.length).toBe(8);
      expect(city?.warps.some((w) => w.targetMapId === 'olivine_punishment_speech_house')).toBe(true);
    });
  });
});
