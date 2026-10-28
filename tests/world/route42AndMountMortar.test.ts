import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import {
  handleKarateKingKiyo,
  handleRoute42GateOfficer,
  handleRoute42SuicuneInteraction,
  handleMortarSuperNerds,
  createEastJohtoQuestInteractions,
} from '../../src/world/interactions/EastJohtoQuestInteractions';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';
import { PokemonFactory } from '../../src/battle/PokemonFactory';

describe('TICKET-WORLD-ROUTE42-AND-MT-MORTAR-01: Route 42 & Mount Mortar Caverns', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const r42Map: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_42.json'), 'utf8'));
  const gateMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_42_ecruteak_gate.json'), 'utf8'));
  const m1fOutsideMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mount_mortar_1f_outside.json'), 'utf8'));
  const m1fInsideMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mount_mortar_1f_inside.json'), 'utf8'));
  const m2fInsideMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mount_mortar_2f_inside.json'), 'utf8'));
  const mb1fMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mount_mortar_b1f.json'), 'utf8'));

  const allNpcs = createMahoganyToIndigoNpcs();
  const r42Npcs = allNpcs['route_42'] || [];
  const gateNpcs = allNpcs['route_42_ecruteak_gate'] || [];
  const m1fInsideNpcs = allNpcs['mount_mortar_1f_inside'] || [];
  const m2fInsideNpcs = allNpcs['mount_mortar_2f_inside'] || [];
  const mb1fNpcs = allNpcs['mount_mortar_b1f'] || [];

  describe('1. Route 42 Geometry, Warps & Canonical Signposts', () => {
    it('verifies route_42 dimensions and east connection to mahogany_town', () => {
      expect(r42Map.id).toBe('route_42');
      expect(r42Map.width).toBe(60);
      expect(r42Map.height).toBe(18);
      expect(r42Map.collisionGrid.length).toBe(60 * 18);
      expect(r42Map.connections?.EAST?.mapId).toBe('mahogany_town');
    });

    it('asserts 5 warps connect to route_42_ecruteak_gate and mount_mortar_1f_outside', () => {
      expect(r42Map.warps.length).toBe(5);

      const gateWarps = r42Map.warps.filter((w) => w.targetMapId === 'route_42_ecruteak_gate');
      expect(gateWarps.length).toBe(2);
      expect(gateWarps.every((w) => w.targetX === 8)).toBe(true);

      const mortarWarps = r42Map.warps.filter((w) => w.targetMapId === 'mount_mortar_1f_outside');
      expect(mortarWarps.length).toBe(3);
    });

    it('asserts reciprocal warps from route_42_ecruteak_gate lead to route_42', () => {
      const exitWarps = gateMap.warps.filter((w) => w.targetMapId === 'route_42');
      expect(exitWarps.length).toBe(2);
      expect(exitWarps.some((w) => w.x === 9 && w.y === 4 && w.targetX === 1 && w.targetY === 8)).toBe(true);
      expect(exitWarps.some((w) => w.x === 9 && w.y === 5 && w.targetX === 1 && w.targetY === 9)).toBe(true);
    });

    it('asserts all 4 canonical signposts in bgEvents reside on solid collision tiles (1)', () => {
      expect(r42Map.bgEvents?.length).toBe(4);

      const signs = [
        { x: 4, y: 10, snippet: 'ROUTE 42' },
        { x: 7, y: 5, snippet: 'MT.MORTAR' },
        { x: 45, y: 9, snippet: 'MT.MORTAR' },
        { x: 54, y: 8, snippet: 'ROUTE 42' },
      ];

      for (const expected of signs) {
        const bg = r42Map.bgEvents?.find((b) => b.x === expected.x && b.y === expected.y);
        expect(bg, `Sign at (${expected.x}, ${expected.y}) must exist in bgEvents`).toBeDefined();
        expect(bg?.pages.join(' ')).toContain(expected.snippet);

        const colIdx = expected.y * r42Map.width + expected.x;
        expect(r42Map.collisionGrid[colIdx], `Sign tile at (${expected.x}, ${expected.y}) must be solid (1)`).toBe(1);
      }
    });

    it('verifies Cut tree at (24, 13) has solid collision (1)', () => {
      const cutIdx = 13 * r42Map.width + 24;
      expect(r42Map.collisionGrid[cutIdx]).toBe(1);
      expect(r42Map.tileMap[cutIdx]).toBe('jt_13_15_45_1d');
    });
  });

  describe('2. Route 42 Trainers, Apricorns & Suicune Encounter', () => {
    it('verifies all 4 Route 42 NPCs stand on walkable tiles (0)', () => {
      expect(r42Npcs.length).toBe(4);
      for (const npc of r42Npcs) {
        const idx = npc.y * r42Map.width + npc.x;
        expect(r42Map.collisionGrid[idx], `NPC ${npc.id} must stand on walkable collision 0`).toBe(0);
      }
    });

    it('verifies Fisher Tully at (40, 10) facing LEFT with Qwilfish Lv. 19', () => {
      const tully = r42Npcs.find((n) => n.id === 'route_42_fisher_tully');
      expect(tully).toBeDefined();
      expect(tully?.x).toBe(40);
      expect(tully?.y).toBe(10);
      expect(tully?.direction).toBe('LEFT');
      expect(tully?.visionRange).toBe(1);
      expect(tully?.action).toBe('TRAINER_BATTLE');
      expect(tully?.trainerTeam).toEqual([
        { speciesId: 'qwilfish', level: 19, moves: ['tackle', 'poisonsting', 'watergun', 'harden'] },
      ]);
    });

    it('verifies Hiker Benjamin at (51, 9) facing DOWN with Diglett, Geodude, Dugtrio', () => {
      const benjamin = r42Npcs.find((n) => n.id === 'route_42_hiker_benjamin');
      expect(benjamin).toBeDefined();
      expect(benjamin?.x).toBe(51);
      expect(benjamin?.y).toBe(9);
      expect(benjamin?.direction).toBe('DOWN');
      expect(benjamin?.visionRange).toBe(3);
      expect(benjamin?.wanders).toBe(true);
      expect(benjamin?.trainerTeam).toEqual([
        { speciesId: 'diglett', level: 14, moves: ['scratch', 'growl', 'magnitude'] },
        { speciesId: 'geodude', level: 14, moves: ['tackle', 'defensecurl', 'rockthrow'] },
        { speciesId: 'dugtrio', level: 16, moves: ['scratch', 'growl', 'magnitude', 'dig'] },
      ]);
    });

    it('verifies Pokémaniac Shane at (47, 8) facing DOWN with Nidorina and Nidorino', () => {
      const shane = r42Npcs.find((n) => n.id === 'route_42_pokemaniac_shane');
      expect(shane).toBeDefined();
      expect(shane?.x).toBe(47);
      expect(shane?.y).toBe(8);
      expect(shane?.direction).toBe('DOWN');
      expect(shane?.visionRange).toBe(3);
      expect(shane?.trainerTeam).toEqual([
        { speciesId: 'nidorina', level: 16, moves: ['growl', 'tackle', 'scratch', 'poisonsting'] },
        { speciesId: 'nidorino', level: 16, moves: ['leer', 'tackle', 'hornattack', 'poisonsting'] },
      ]);
    });

    it('asserts Suicune at (26, 16) despawns when EVENT_SAW_SUICUNE_ON_ROUTE_42 is set', () => {
      const flagsBefore = new Set<string>();
      expect(isNpcActiveForStoryFlags('route_42_suicune', flagsBefore)).toBe(true);

      const flagsAfter = new Set<string>(['EVENT_SAW_SUICUNE_ON_ROUTE_42']);
      expect(isNpcActiveForStoryFlags('route_42_suicune', flagsAfter)).toBe(false);
    });

    it('triggers Suicune leap sequence via StoryCutscenes.triggerRoute42Suicune', () => {
      let cutsceneLocked = false;
      let toastText = '';
      let saved = false;

      const mockCtx: any = {
        player: { isMoving: true, progress: 0.5 },
        storyFlags: new Set<string>(),
        setCutsceneLocked: (locked: boolean) => {
          cutsceneLocked = locked;
        },
        overworldHUD: {
          openDialogue: (pages: string[], _sp: string, cb?: () => void) => {
            expect(pages.join(' ')).toContain('SUICUNE bounds effortlessly');
            cb?.();
          },
          showToast: (msg: string) => {
            toastText = msg;
          },
        },
        saveCurrentGame: () => {
          saved = true;
        },
      };

      StoryCutscenes.triggerRoute42Suicune(mockCtx);

      expect(mockCtx.storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_42')).toBe(true);
      expect(cutsceneLocked).toBe(false);
      expect(saved).toBe(true);
      expect(toastText).toContain('Suicune dashed across Route 42');
    });

    it('delivers direct dialogue if player talks to Suicune', () => {
      let dialogueText = '';
      const mockCtx: any = {
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const suicuneNpc = r42Npcs.find((n) => n.id === 'route_42_suicune')!;
      handleRoute42SuicuneInteraction(suicuneNpc, r42Map, mockCtx);
      expect(dialogueText).toContain('SUICUNE: Gurr-oooh!');
    });
  });

  describe('3. Route 42 Ecruteak Gate Officer', () => {
    it('verifies Gate Officer at (5, 2) on walkable tile (0) with warning dialogue', () => {
      const officer = gateNpcs.find((n) => n.id === 'route_42_gate_officer');
      expect(officer).toBeDefined();
      expect(officer?.x).toBe(5);
      expect(officer?.y).toBe(2);

      const idx = 2 * gateMap.width + 5;
      expect(gateMap.collisionGrid[idx]).toBe(0);

      let dialogueText = '';
      const mockCtx: any = {
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      handleRoute42GateOfficer(officer!, gateMap, mockCtx);
      expect(dialogueText).toContain('MT. MORTAR is like a maze inside');
    });
  });

  describe('4. Mount Mortar Trainers, Boulders & Super Nerds Dialogue', () => {
    it('verifies 1F Inside Miller (33, 43), Markus (24, 28) and Boulder (21, 43)', () => {
      expect(m1fInsideNpcs.length).toBe(3);

      const miller = m1fInsideNpcs.find((n) => n.id === 'mount_mortar_1f_inside_miller');
      expect(miller?.x).toBe(33);
      expect(miller?.y).toBe(43);
      expect(miller?.direction).toBe('LEFT');
      expect(miller?.trainerTeam).toEqual([
        { speciesId: 'nidoking', level: 17, moves: ['tackle', 'hornattack', 'poisonsting', 'focusenergy'] },
        { speciesId: 'nidoqueen', level: 17, moves: ['tackle', 'scratch', 'poisonsting', 'tailwhip'] },
      ]);

      const markus = m1fInsideNpcs.find((n) => n.id === 'mount_mortar_1f_inside_markus');
      expect(markus?.x).toBe(24);
      expect(markus?.y).toBe(28);
      expect(markus?.trainerTeam).toEqual([
        { speciesId: 'slowpoke', level: 19, moves: ['tackle', 'growl', 'watergun', 'confusion'] },
      ]);

      const boulder = m1fInsideNpcs.find((n) => n.id === 'mount_mortar_1f_inside_boulder');
      expect(boulder?.x).toBe(21);
      expect(boulder?.y).toBe(43);
      expect(boulder?.action).toBe('STRENGTH_BOULDER');
    });

    it('verifies 2F Inside Hugh at (13, 26) with Seadra Lv. 39', () => {
      expect(m2fInsideNpcs.length).toBe(1);
      const hugh = m2fInsideNpcs.find((n) => n.id === 'mount_mortar_2f_inside_hugh');
      expect(hugh?.x).toBe(13);
      expect(hugh?.y).toBe(26);
      expect(hugh?.direction).toBe('DOWN');
      expect(hugh?.visionRange).toBe(2);
      expect(hugh?.trainerTeam).toEqual([
        { speciesId: 'seadra', level: 39, moves: ['bubblebeam', 'smokescreen', 'twister', 'agility'] },
      ]);
    });

    it('verifies B1F Boulder at (9, 10)', () => {
      const boulder = mb1fNpcs.find((n) => n.id === 'mount_mortar_b1f_boulder');
      expect(boulder).toBeDefined();
      expect(boulder?.x).toBe(9);
      expect(boulder?.y).toBe(10);
      expect(boulder?.action).toBe('STRENGTH_BOULDER');
    });

    it('handles after-battle dialogue for Markus, Hugh, and Miller', () => {
      let text = '';
      const mockCtx: any = {
        openDialogue: (pages: string[]) => {
          text = pages.join(' ');
        },
      };

      const markus = m1fInsideNpcs.find((n) => n.id === 'mount_mortar_1f_inside_markus')!;
      handleMortarSuperNerds(markus, m1fInsideMap, mockCtx);
      expect(text).toContain('HUGH and I were researching');

      const hugh = m2fInsideNpcs.find((n) => n.id === 'mount_mortar_2f_inside_hugh')!;
      handleMortarSuperNerds(hugh, m2fInsideMap, mockCtx);
      expect(text).toContain('I hope MARKUS is okay');

      const miller = m1fInsideNpcs.find((n) => n.id === 'mount_mortar_1f_inside_miller')!;
      handleMortarSuperNerds(miller, m1fInsideMap, mockCtx);
      expect(text).toContain('SURF and WATERFALL');
    });
  });

  describe('5. Karate King Kiyo Battle & Tyrogue Gift', () => {
    const kiyoNpc = mb1fNpcs.find((n) => n.id === 'mount_mortar_b1f_kiyo')!;

    it('verifies Kiyo stands at (16, 4) in B1F with Hitmonlee Lv. 34 and Hitmonchan Lv. 34', () => {
      expect(kiyoNpc).toBeDefined();
      expect(kiyoNpc.x).toBe(16);
      expect(kiyoNpc.y).toBe(4);
      expect(kiyoNpc.action).toBe('KIYO_EVENT');
      expect(kiyoNpc.trainerTeam).toEqual([
        { speciesId: 'hitmonlee', level: 34, moves: ['doublekick', 'meditate', 'jumpkick', 'focusenergy'] },
        { speciesId: 'hitmonchan', level: 34, moves: ['cometpunch', 'agility', 'firepunch', 'icepunch'] },
      ]);
    });

    it('triggers Kiyo battle, guards full party (length >= 6) against receiving Tyrogue', () => {
      let battleTriggered = false;
      let battleConfig: any = null;
      let dialogueText = '';
      let toastText = '';

      const fullParty = Array.from({ length: 6 }, () => PokemonFactory.create('pidgey', 10));

      const mockCtx: any = {
        playerName: 'Gold',
        playerParty: fullParty,
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        audioManager: { playSfx: vi.fn() },
        openDialogue: (pages: string[], _sp: string, cb?: () => void) => {
          dialogueText = pages.join(' ');
          cb?.();
        },
        triggerBattle: (_opp: any, config: any) => {
          battleTriggered = true;
          battleConfig = config;
        },
        saveCurrentGame: vi.fn(),
        showToast: (msg: string) => {
          toastText = msg;
        },
      };

      handleKarateKingKiyo(kiyoNpc, mb1fMap, mockCtx);
      expect(battleTriggered).toBe(true);
      expect(battleConfig.trainerName).toBe('Karate King Kiyo');
      expect(battleConfig.trainerTeam.length).toBe(2);

      // Simulate battle victory with full party
      battleConfig.onVictory();

      expect(mockCtx.storyFlags.has('EVENT_BEAT_BLACKBELT_KIYO')).toBe(true);
      expect(mockCtx.storyFlags.has('received_kiyo_tyrogue')).toBe(false);
      expect(mockCtx.playerParty.length).toBe(6);
      expect(dialogueText).toContain('no room in your party');
      expect(toastText).toContain('Make room in party for reward');
    });

    it('awards Tyrogue Lv. 10 once player returns with room in party', () => {
      let dialogueText = '';
      let toastText = '';
      let saved = false;

      const fiveParty = Array.from({ length: 5 }, () => PokemonFactory.create('pidgey', 10));

      const mockCtx: any = {
        playerName: 'Gold',
        playerParty: fiveParty,
        storyFlags: new Set<string>(['EVENT_BEAT_BLACKBELT_KIYO']),
        defeatedTrainers: new Set<string>(['blackbelt_kiyo']),
        audioManager: { playSfx: vi.fn() },
        openDialogue: (pages: string[], _sp: string, cb?: () => void) => {
          dialogueText = pages.join(' ');
          cb?.();
        },
        saveCurrentGame: () => {
          saved = true;
        },
        showToast: (msg: string) => {
          toastText = msg;
        },
      };

      handleKarateKingKiyo(kiyoNpc, mb1fMap, mockCtx);

      expect(mockCtx.playerParty.length).toBe(6);
      const tyrogue = mockCtx.playerParty[5];
      expect(tyrogue.speciesId).toBe('tyrogue');
      expect(tyrogue.level).toBe(10);
      expect(mockCtx.storyFlags.has('received_kiyo_tyrogue')).toBe(true);
      expect(mockCtx.storyFlags.has('EVENT_GOT_TYROGUE_FROM_KIYO')).toBe(true);
      expect(dialogueText).toContain('received TYROGUE from the KARATE KING');
      expect(toastText).toContain('Received TYROGUE');
      expect(saved).toBe(true);
    });

    it('gives encouragement dialogue once Tyrogue has already been acquired', () => {
      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(['EVENT_BEAT_BLACKBELT_KIYO', 'received_kiyo_tyrogue']),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      handleKarateKingKiyo(kiyoNpc, mb1fMap, mockCtx);
      expect(dialogueText).toContain('Keep training your TYROGUE with dedication');
    });
  });

  describe('6. Overworld Items & Apricorn Trees Dataset Verification', () => {
    const itemManager = new OverworldItemManager();

    it('asserts 3 Apricorn trees and 2 item balls exist on Route 42', () => {
      const trees = itemManager.getFruitTreesForMap('route_42');
      expect(trees.length).toBe(3);
      expect(trees.some((t) => t.x === 27 && t.y === 16 && t.berryId === 'pnk_apricorn')).toBe(true);
      expect(trees.some((t) => t.x === 28 && t.y === 16 && t.berryId === 'grn_apricorn')).toBe(true);
      expect(trees.some((t) => t.x === 29 && t.y === 16 && t.berryId === 'ylw_apricorn')).toBe(true);

      const items = itemManager.getItemsForMap('route_42');
      expect(items.some((i) => i.itemId === 'ultra_ball' && i.x === 6 && i.y === 4)).toBe(true);
      expect(items.some((i) => i.itemId === 'super_potion' && i.x === 33 && i.y === 8)).toBe(true);
    });

    it('asserts Mount Mortar multi-floor item balls exist', () => {
      const b1fItems = itemManager.getItemsForMap('mount_mortar_b1f');
      expect(b1fItems.some((i) => i.itemId === 'hyper_potion' && i.x === 29 && i.y === 12)).toBe(true);
      expect(b1fItems.some((i) => i.itemId === 'carbos' && i.x === 4 && i.y === 16)).toBe(true);
      expect(b1fItems.some((i) => i.itemId === 'full_restore' && i.x === 34 && i.y === 24)).toBe(true);
      expect(b1fItems.some((i) => i.itemId === 'max_ether' && i.x === 32 && i.y === 3)).toBe(true);
      expect(b1fItems.some((i) => i.itemId === 'pp_up' && i.x === 21 && i.y === 26)).toBe(true);
    });
  });

  describe('7. Interaction Registrations Validation', () => {
    it('verifies createEastJohtoQuestInteractions registers all required actions and ids', () => {
      const registrations = createEastJohtoQuestInteractions();
      expect(registrations.some((r) => r.actions?.includes('KIYO_EVENT'))).toBe(true);
      expect(registrations.some((r) => r.actions?.includes('ROUTE_42_SUICUNE_EVENT'))).toBe(true);
      expect(registrations.some((r) => r.actions?.includes('ROUTE_42_GATE_OFFICER'))).toBe(true);
      expect(registrations.some((r) => r.npcIds?.includes('mount_mortar_1f_inside_markus'))).toBe(true);
    });
  });
});
