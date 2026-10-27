/**
 * @fileoverview Route 38 & Route 39 Canonical Completion Verification Suite
 * @module tests/world/route38AndRoute39Completion.test
 * @role Route 38 & Route 39 Invariant Test Suite
 * @layer tests
 */

import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import { getJohtoTownServiceInteractions } from '../../src/world/interactions/JohtoTownServiceInteractions';
import { MART_MEDICINE_CATALOG } from '../../src/ui/bag/BagItemCatalogs';
import { BagPartyTargetRenderer } from '../../src/ui/bag/BagPartyTargetRenderer';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { BattleAudio } from '../../src/audio/BattleAudio';
import type { MapData } from '../../src/types/game';

describe('TICKET-WORLD-ROUTE38-ROUTE39-COMPLETE-01: Route 38 & Route 39 Canonical Completion', () => {
  const root = path.resolve(__dirname, '../..');
  const route38Json: MapData = JSON.parse(
    fs.readFileSync(path.join(root, 'public/assets/data/maps/route_38.json'), 'utf8')
  );
  const route39Json: MapData = JSON.parse(
    fs.readFileSync(path.join(root, 'public/assets/data/maps/route_39.json'), 'utf8')
  );

  describe('1. NPC Coordinates, Roster & Collision Walkability Audits', () => {
    const allNpcs = createNpcsByMap();
    const route38Npcs = allNpcs['route_38'] || [];
    const route39Npcs = allNpcs['route_39'] || [];

    it('asserts all Route 38 NPCs exist with authentic positions and walkable tiles', () => {
      const expectedIds = [
        'schoolboy_chad',
        'lass_dana',
        'beauty_valerie',
        'sailor_harry',
        'bird_keeper_toby',
        'beauty_olivia',
      ];
      for (const id of expectedIds) {
        const npc = route38Npcs.find((n) => n.id === id);
        expect(npc, `Route 38 NPC ${id} must exist`).toBeDefined();
        const tileIdx = npc!.y * route38Json.width + npc!.x;
        const colVal = route38Json.collisionGrid[tileIdx];
        expect([0, 2]).toContain(colVal);
      }

      const toby = route38Npcs.find((n) => n.id === 'bird_keeper_toby')!;
      expect(toby.x).toBe(12);
      expect(toby.y).toBe(15);
      expect(toby.trainerId).toBe('bird_keeper_toby');
      expect(toby.trainerTeam?.length).toBe(3);
      expect(toby.trainerTeam?.map((p) => p.speciesId)).toEqual(['doduo', 'doduo', 'doduo']);
      expect(toby.trainerTeam?.map((p) => p.level)).toEqual([15, 16, 17]);
      expect(toby.trainerTeam?.[0].moves).toEqual(['peck', 'growl', 'pursuit', 'furyattack']);

      const olivia = route38Npcs.find((n) => n.id === 'beauty_olivia')!;
      expect(olivia.x).toBe(5);
      expect(olivia.y).toBe(8);
      expect(olivia.trainerId).toBe('beauty_olivia');
      expect(olivia.trainerTeam?.length).toBe(1);
      expect(olivia.trainerTeam?.[0].speciesId).toBe('corsola');
      expect(olivia.trainerTeam?.[0].level).toBe(19);
      expect(olivia.trainerTeam?.[0].moves).toEqual(['tackle', 'harden', 'watergun', 'recover']);
    });

    it('asserts all Route 39 NPCs exist including 4 Pasture Miltank on walkable tiles', () => {
      const expectedIds = [
        'sailor_eugene',
        'pokefan_derek',
        'pokefan_ruth',
        'psychic_norman',
        'pokefan_jaime',
        'route_39_miltank_1',
        'route_39_miltank_2',
        'route_39_miltank_3',
        'route_39_miltank_4',
      ];
      for (const id of expectedIds) {
        const npc = route39Npcs.find((n) => n.id === id);
        expect(npc, `Route 39 NPC ${id} must exist`).toBeDefined();
        const tileIdx = npc!.y * route39Json.width + npc!.x;
        const colVal = route39Json.collisionGrid[tileIdx];
        expect([0, 2]).toContain(colVal);
      }

      const eugene = route39Npcs.find((n) => n.id === 'sailor_eugene')!;
      expect(eugene.x).toBe(13);
      expect(eugene.y).toBe(29);
      expect(eugene.trainerTeam?.length).toBe(3);
      expect(eugene.trainerTeam?.map((p) => p.speciesId)).toEqual(['poliwhirl', 'raticate', 'krabby']);
      expect(eugene.trainerTeam?.map((p) => p.level)).toEqual([17, 17, 19]);

      const ruth = route39Npcs.find((n) => n.id === 'pokefan_ruth')!;
      expect(ruth.x).toBe(11);
      expect(ruth.y).toBe(19);
      expect(ruth.trainerPokemon?.speciesId).toBe('pikachu');
      expect(ruth.trainerPokemon?.heldItem).toBe('berry');

      const norman = route39Npcs.find((n) => n.id === 'psychic_norman')!;
      expect(norman.x).toBe(13);
      expect(norman.y).toBe(7);
      expect(norman.trainerTeam?.length).toBe(2);
      expect(norman.trainerTeam?.map((p) => p.speciesId)).toEqual(['slowpoke', 'slowpoke']);
      expect(norman.trainerTeam?.map((p) => p.level)).toEqual([17, 20]);

      const jaime = route39Npcs.find((n) => n.id === 'pokefan_jaime')!;
      expect(jaime.action).toBe('TRAINER_BATTLE');
      expect(jaime.trainerId).toBe('pokefan_jaime');
      expect(jaime.trainerPokemon?.speciesId).toBe('meowth');
      expect(jaime.trainerPokemon?.heldItem).toBe('berry');

      const m1 = route39Npcs.find((n) => n.id === 'route_39_miltank_1')!;
      const m2 = route39Npcs.find((n) => n.id === 'route_39_miltank_2')!;
      const m3 = route39Npcs.find((n) => n.id === 'route_39_miltank_3')!;
      const m4 = route39Npcs.find((n) => n.id === 'route_39_miltank_4')!;
      expect([m1.x, m1.y]).toEqual([3, 12]);
      expect([m2.x, m2.y]).toEqual([6, 11]);
      expect([m3.x, m3.y]).toEqual([4, 15]);
      expect([m4.x, m4.y]).toEqual([8, 13]);
    });
  });

  describe('2. Moomoo Farm Service Interactions, Berry Deduction & Moomoo Milk Shop', () => {
    const registrations = getJohtoTownServiceInteractions();
    const pastureHandler = registrations.find((r) => r.npcIds?.includes('route_39_miltank_1'))?.handler!;
    const miltankHandler = registrations.find((r) => r.npcIds?.includes('moomoo_miltank'))?.handler!;
    const farmerWifeHandler = registrations.find((r) => r.npcIds?.includes('farmer_wife'))?.handler!;
    const dairyFarmerHandler = registrations.find((r) => r.npcIds?.includes('dairy_farmer'))?.handler!;

    it('interacts with Pasture Miltank, plays cry and displays Moo', () => {
      const crySpy = vi.spyOn(BattleAudio, 'playCry').mockImplementation(() => {});
      let openedPages: string[] = [];
      const ctx: any = {
        openDialogue: (pages: string[]) => { openedPages = pages; },
      };
      const result = pastureHandler({ id: 'route_39_miltank_2', speaker: '🐮 MILTANK' } as any, {} as any, ctx);
      expect(result).toBe(true);
      expect(crySpy).toHaveBeenCalledWith('miltank');
      expect(openedPages).toEqual(['MILTANK: Mooo!']);
      crySpy.mockRestore();
    });

    it('handles Moomoo Miltank Berry deduction and healing lifecycle', () => {
      const crySpy = vi.spyOn(BattleAudio, 'playCry').mockImplementation(() => {});
      const sfxSpy = vi.spyOn(BattleAudio, 'playMenuSound').mockImplementation(() => {});
      const storyFlags = new Set<string>();
      const inventory: any = { berries: { berry: 3 }, items: {} };
      let openedPages: string[] = [];
      let toastMsg = '';
      const saveSpy = vi.fn();
      const ctx: any = {
        playerName: 'GOLD',
        storyFlags,
        inventory,
        openDialogue: (pages: string[], _spk: any, cb?: () => void) => {
          openedPages = pages;
          cb?.();
        },
        saveCurrentGame: saveSpy,
        showToast: (msg: string) => { toastMsg = msg; },
      };

      // 1. Without berries
      inventory.berries.berry = 0;
      miltankHandler({ id: 'moomoo_miltank', speaker: '🐮 MILTANK' } as any, {} as any, ctx);
      expect(storyFlags.has('moomoo_healed')).toBe(false);
      expect(openedPages[0]).toContain('needs sweet BERRIES');

      // 2. With 2 berries
      inventory.berries.berry = 2;
      miltankHandler({ id: 'moomoo_miltank', speaker: '🐮 MILTANK' } as any, {} as any, ctx);
      expect(inventory.berries.berry).toBe(1);
      expect(storyFlags.has('moomoo_healed')).toBe(true);
      expect(storyFlags.has('EVENT_HEALED_MOOMOO')).toBe(true);
      expect(saveSpy).toHaveBeenCalled();
      expect(toastMsg).toContain('Moomoo Miltank was restored');
      expect(crySpy).toHaveBeenCalledWith('miltank');
      expect(sfxSpy).toHaveBeenCalledWith('HEAL');

      // 3. Interacting when already healed
      miltankHandler({ id: 'moomoo_miltank', speaker: '🐮 MILTANK' } as any, {} as any, ctx);
      expect(openedPages[0]).toContain('bursting with energy and happiness');

      crySpy.mockRestore();
      sfxSpy.mockRestore();
    });

    it('awards TM13 Snore from Farmer Wife upon healing Moomoo', () => {
      const storyFlags = new Set<string>(['moomoo_healed']);
      const inventory: any = { tms: [], keyItems: [], money: 1000, items: {} };
      let toastMsg = '';
      const ctx: any = {
        storyFlags,
        inventory,
        audioManager: { playSfx: vi.fn() },
        openDialogue: (_pages: any, _spk: any, cb?: () => void) => { cb?.(); },
        saveCurrentGame: vi.fn(),
        showToast: (msg: string) => { toastMsg = msg; },
      };

      farmerWifeHandler({ id: 'farmer_wife', speaker: "👩‍🌾 FARMER'S WIFE" } as any, {} as any, ctx);
      expect(storyFlags.has('has_tm13_snore')).toBe(true);
      expect(storyFlags.has('EVENT_GOT_TM13_SNORE_FROM_MOOMOO_FARM')).toBe(true);
      expect(inventory.tms).toContain('TM13');
      expect(toastMsg).toContain('TM13 SNORE');
    });

    it('operates Dairy Farmer Moomoo Milk shop for ¥500 once healed and rewarded', () => {
      const sfxSpy = vi.spyOn(BattleAudio, 'playMenuSound').mockImplementation(() => {});
      const storyFlags = new Set<string>(['moomoo_healed', 'has_tm13_snore']);
      const inventory: any = { money: 600, items: {} };
      let openedPages: string[] = [];
      let toastMsg = '';
      const ctx: any = {
        storyFlags,
        inventory,
        audioManager: { playSfx: vi.fn() },
        openDialogue: (pages: string[], _spk: any, cb?: () => void) => {
          openedPages = pages;
          cb?.();
        },
        saveCurrentGame: vi.fn(),
        showToast: (msg: string) => { toastMsg = msg; },
      };

      // Purchase 1x Moomoo Milk with ¥600
      dairyFarmerHandler({ id: 'dairy_farmer', speaker: '👨‍🌾 DAIRY FARMER' } as any, {} as any, ctx);
      expect(inventory.money).toBe(100);
      expect(inventory.items['moomoo-milk']).toBe(1);
      expect(toastMsg).toContain('Purchased MOOMOO MILK for ¥500');
      expect(sfxSpy).toHaveBeenCalledWith('CONFIRM');

      // Attempt purchase with insufficient funds (¥100 < ¥500)
      dairyFarmerHandler({ id: 'dairy_farmer', speaker: '👨‍🌾 DAIRY FARMER' } as any, {} as any, ctx);
      expect(inventory.money).toBe(100);
      expect(inventory.items['moomoo-milk']).toBe(1);
      expect(openedPages[0]).toContain('No cash, no sale');
      expect(sfxSpy).toHaveBeenCalledWith('CANCEL');

      sfxSpy.mockRestore();
    });
  });

  describe('3. Moomoo Milk Catalog & Out-of-Battle Healing (+100 HP)', () => {
    it('defines Moomoo Milk in medicine catalog as farm-exclusive (+100 HP, ¥500)', () => {
      const milk = MART_MEDICINE_CATALOG.find((m) => m.id === 'moomoo-milk');
      expect(milk).toBeDefined();
      expect(milk?.price).toBe(500);
      expect(milk?.badgeLabel).toBe('+100 HP');
      expect(milk?.farmExclusive).toBe(true);
    });

    it('heals 100 HP on damaged Pokémon out of battle via BagPartyTargetRenderer', () => {
      const sfxSpy = vi.spyOn(BattleAudio, 'playMenuSound').mockImplementation(() => {});
      const cyndaquil = PokemonFactory.create('cyndaquil', 30);
      cyndaquil.stats.hp = 120;
      cyndaquil.currentHp = 10;

      const inventory: any = { items: { 'moomoo-milk': 2 } };
      let feedback = '';
      const milkDef = MART_MEDICINE_CATALOG.find((m) => m.id === 'moomoo-milk')!;

      const success = BagPartyTargetRenderer.useMedicineOnTarget({
        med: milkDef,
        target: cyndaquil,
        inventory,
        showFeedback: (msg: string) => { feedback = msg; },
        onInventoryChanged: () => {},
        reRender: () => {},
      });

      expect(success).toBe(true);
      expect(cyndaquil.currentHp).toBe(110);
      expect(inventory.items['moomoo-milk']).toBe(1);
      expect(feedback).toContain('restored by 100 point(s)');
      expect(sfxSpy).toHaveBeenCalledWith('HEAL');

      // Clamps to max HP on second heal
      BagPartyTargetRenderer.useMedicineOnTarget({
        med: milkDef,
        target: cyndaquil,
        inventory,
        showFeedback: (msg: string) => { feedback = msg; },
        onInventoryChanged: () => {},
        reRender: () => {},
      });
      expect(cyndaquil.currentHp).toBe(120);
      expect(inventory.items['moomoo-milk']).toBe(0);

      sfxSpy.mockRestore();
    });

    it('rejects Moomoo Milk usage if target is at full HP or fainted', () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 20);
      const inventory: any = { items: { 'moomoo-milk': 1 } };
      const milkDef = MART_MEDICINE_CATALOG.find((m) => m.id === 'moomoo-milk')!;

      // Already full HP
      let feedback = '';
      const resFull = BagPartyTargetRenderer.useMedicineOnTarget({
        med: milkDef,
        target: cyndaquil,
        inventory,
        showFeedback: (msg: string) => { feedback = msg; },
        onInventoryChanged: () => {},
        reRender: () => {},
      });
      expect(resFull).toBe(false);
      expect(feedback).toContain('already at full HP');
      expect(inventory.items['moomoo-milk']).toBe(1);

      // Fainted
      cyndaquil.currentHp = 0;
      const resFaint = BagPartyTargetRenderer.useMedicineOnTarget({
        med: milkDef,
        target: cyndaquil,
        inventory,
        showFeedback: (msg: string) => { feedback = msg; },
        onInventoryChanged: () => {},
        reRender: () => {},
      });
      expect(resFaint).toBe(false);
      expect(feedback).toContain('has fainted');
      expect(inventory.items['moomoo-milk']).toBe(1);
    });
  });

  describe('4. Wild Encounters & Signpost Background Events', () => {
    it('verifies Farfetchd wild encounters in Route 38 and Route 39 in Morning and Day', () => {
      const r38Morning = route38Json.grassEncounters.find((e) => e.speciesId === 'farfetchd' && e.timeOfDay === 'MORNING');
      const r38Day = route38Json.grassEncounters.find((e) => e.speciesId === 'farfetchd' && e.timeOfDay === 'DAY');
      expect(r38Morning).toBeDefined();
      expect(r38Morning?.minLevel).toBe(16);
      expect(r38Morning?.weight).toBe(10);
      expect(r38Day).toBeDefined();

      const r39Morning = route39Json.grassEncounters.find((e) => e.speciesId === 'farfetchd' && e.timeOfDay === 'MORNING');
      const r39Day = route39Json.grassEncounters.find((e) => e.speciesId === 'farfetchd' && e.timeOfDay === 'DAY');
      expect(r39Morning).toBeDefined();
      expect(r39Morning?.minLevel).toBe(16);
      expect(r39Morning?.weight).toBe(10);
      expect(r39Day).toBeDefined();
    });

    it('verifies canonical signposts on Route 39', () => {
      const sign39 = route39Json.bgEvents.find((b) => b.x === 15 && b.y === 7);
      expect(sign39).toBeDefined();
      expect(sign39?.pages).toEqual(['ROUTE 39', 'OLIVINE CITY - ECRUTEAK CITY']);

      const tips = route39Json.bgEvents.find((b) => b.x === 5 && b.y === 31);
      expect(tips).toBeDefined();
      expect(tips?.pages[1]).toContain('HEADBUTT');
    });
  });
});
