import { describe, it, expect } from 'vitest';
import { SaveManager } from '../src/core/SaveManager';
import { ModernHMHandler } from '../src/world/ModernHMHandler';
import { MapManager } from '../src/world/MapManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import type { BagInventory } from '../src/ui/BagAndMartUI';
import type { MapData } from '../src/types/game';

const createMockInventory = (badges: string[], tms: string[], keyItems: string[] = []): BagInventory => ({
  money: 5000,
  balls: { pokeball: 10 },
  items: {},
  tms,
  keyItems,
  badges,
});

const createWaterMap = (): MapData => ({
  id: 'route_40',
  name: 'Route 40',
  width: 5,
  height: 5,
  tileSize: 64,
  groundLayer: new Array(25).fill(0),
  objectLayer: new Array(25).fill(0),
  collisionGrid: [
    0, 0, 0, 0, 0,
    0, 3, 3, 3, 0,
    0, 3, 3, 3, 0,
    0, 3, 3, 3, 0,
    0, 0, 0, 0, 0,
  ],
  connections: {},
  warps: [],
  grassEncounters: [],
  waterEncounters: [
    { speciesId: 'tentacool', minLevel: 15, maxLevel: 20, weight: 60 },
  ],
});

describe('Auto-HM Settings & Strict Taught Battle Slot Move Requirement', () => {
  it('1. defaults autoHm to true in SaveManager.getDefaultOptions()', () => {
    const opts = SaveManager.getDefaultOptions();
    expect(opts.autoHm).toBe(true);
  });

  it('2. requires a party Pokémon to have SURF taught in its battle move slots', () => {
    const totodileNoSurf = PokemonFactory.create('totodile', 18, ['scratch', 'watergun']);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain', 'fog'], ['HM03']);

    // Check without move taught
    const checkNoMove = ModernHMHandler.checkSurf(validInv, new Set(['morty_defeated']), [totodileNoSurf]);
    expect(checkNoMove.canUse).toBe(false);
    expect(checkNoMove.missingReason).toContain('must know SURF in its battle moves');

    // Check with SURF taught
    const totodileWithSurf = PokemonFactory.create('totodile', 18, ['surf', 'watergun', 'bite']);
    const checkWithMove = ModernHMHandler.checkSurf(validInv, new Set(['morty_defeated']), [totodileWithSurf]);
    expect(checkWithMove.canUse).toBe(true);
    expect(checkWithMove.hasBadge).toBe(true);
    expect(checkWithMove.hasHM).toBe(true);
    expect(checkWithMove.userPokemon?.speciesId).toBe('totodile');
  });

  it('3. requires a party Pokémon to have STRENGTH taught in its battle move slots', () => {
    const geodudeNoStrength = PokemonFactory.create('geodude', 20, ['tackle', 'defensecurl']);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain'], ['HM04']);

    const checkNoMove = ModernHMHandler.checkStrength(validInv, new Set(['whitney_defeated']), [geodudeNoStrength]);
    expect(checkNoMove.canUse).toBe(false);
    expect(checkNoMove.missingReason).toContain('must know STRENGTH in its battle moves');

    const geodudeWithStrength = PokemonFactory.create('geodude', 20, ['strength', 'rockthrow']);
    const checkWithMove = ModernHMHandler.checkStrength(validInv, new Set(['whitney_defeated']), [geodudeWithStrength]);
    expect(checkWithMove.canUse).toBe(true);
    expect(checkWithMove.userPokemon?.speciesId).toBe('geodude');
  });

  it('4. requires a party Pokémon to have FLY taught when autoHm is false, and allows Fly-compatible Pokémon when autoHm is true', () => {
    const pidgeottoNoFly = PokemonFactory.create('pidgeotto', 22, ['gust', 'quickattack']);
    const machopIncompatible = PokemonFactory.create('machop', 22, ['karatechop', 'lowkick']);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain', 'fog', 'storm'], ['HM02']);

    // Auto-HM OFF (default false): requires FLY taught in battle move slots
    const checkNoMoveManual = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [pidgeottoNoFly], false);
    expect(checkNoMoveManual.canUse).toBe(false);
    expect(checkNoMoveManual.missingReason).toContain('must know FLY in its battle moves');

    // Auto-HM ON (true): allows compatible party Pokémon even if FLY is not taught in battle move slots
    const checkNoMoveAuto = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [pidgeottoNoFly], true);
    expect(checkNoMoveAuto.canUse).toBe(true);
    expect(checkNoMoveAuto.userPokemon?.speciesId).toBe('pidgeotto');

    // Auto-HM ON (true): still rejects if no party Pokémon can be taught FLY
    const checkIncompatibleAuto = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [machopIncompatible], true);
    expect(checkIncompatibleAuto.canUse).toBe(false);
    expect(checkIncompatibleAuto.missingReason).toContain('can be taught FLY');

    // Both modes allow a Pokémon that has FLY taught in its battle move slots
    const pidgeottoWithFly = PokemonFactory.create('pidgeotto', 22, ['fly', 'gust', 'quickattack']);
    const checkWithMove = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [pidgeottoWithFly], false);
    expect(checkWithMove.canUse).toBe(true);
    expect(checkWithMove.userPokemon?.speciesId).toBe('pidgeotto');
  });

  it('5. controls water tile walkability seamlessly in MapManager via setSurfEnabled', () => {
    const map = createWaterMap();
    const mm = new MapManager();
    mm.registerMap(map);
    mm.setCurrentMap('route_40');

    expect(mm.isWalkable(0, 0)).toBe(true);

    mm.setSurfEnabled(false);
    expect(mm.isWalkable(1, 1)).toBe(false);

    mm.setSurfEnabled(true);
    expect(mm.isWalkable(1, 1)).toBe(true);
  });
});

import fs from 'fs';
import path from 'path';
import { createGoldenrodBuildingsAndParkNpcs } from '../src/world/npcs/goldenrodBuildingsAndParkNpcs';
import { getGoldenrodAndRoute34Interactions } from '../src/world/interactions/GoldenrodAndRoute34Interactions';
import { getVioletAndAzaleaServiceInteractions } from '../src/world/interactions/VioletAndAzaleaServiceInteractions';
import { getGoldenrodExpansionInteractions } from '../src/world/interactions/GoldenrodExpansionInteractions';
import { getOlivineAndVictoryRoadQuestInteractions } from '../src/world/interactions/OlivineAndVictoryRoadQuestInteractions';
import { handleBlackthornEmyTrade } from '../src/world/interactions/BlackthornGymAndDragonDenInteractions';
import { handleShutterSwitches } from '../src/world/interactions/GoldenrodTakeoverInteractions';

describe('Goldenrod Underground, Radio Tower Inline Quiz & NPC Trade Prompts', () => {
  it('6. configures radio_rec on radio_tower_1f with talkAcrossCounter: true and direction UP, and dept_elevator_b1f on goldenrod_underground_warehouse', () => {
    const npcs = createGoldenrodBuildingsAndParkNpcs();

    const radioRec = npcs.radio_tower_1f.find((n: any) => n.id === 'radio_rec') as any;
    expect(radioRec).toBeDefined();
    expect(radioRec.direction).toBe('UP');
    expect(radioRec.talkAcrossCounter).toBe(true);

    const b1fElevator = npcs.goldenrod_underground_warehouse.find((n: any) => n.id === 'dept_elevator_b1f') as any;
    expect(b1fElevator).toBeDefined();
    expect(b1fElevator.x).toBe(16);
    expect(b1fElevator.y).toBe(1);
    expect(b1fElevator.action).toBe('DEPT_ELEVATOR');
  });

  it('7. runs the 5-question Radio Tower Quiz via inline YES/NO openChoiceDialogue and awards RADIO CARD on YES, YES, NO, YES, NO', () => {
    const interactions = getGoldenrodAndRoute34Interactions();
    const quizReg = interactions.find((r) => r.npcIds?.includes('radio_rec'))!;
    expect(quizReg).toBeDefined();

    const storyFlags = new Set<string>();
    const inventory = createMockInventory([], [], []);
    const choicesQueue: Array<'YES' | 'NO'> = ['YES', 'YES', 'YES', 'NO', 'YES', 'NO'];
    const askedPrompts: string[] = [];

    const ctx: any = {
      playerName: 'GOLD',
      storyFlags,
      inventory,
      openDialogue: (_pages: string[], _speaker?: string, onComplete?: () => void) => {
        onComplete?.();
      },
      openChoiceDialogue: (pages: string[], _speaker: string | undefined, onSelect: (choice: 'YES' | 'NO') => void) => {
        askedPrompts.push(pages.join(' '));
        const next = choicesQueue.shift() || 'NO';
        onSelect(next);
      },
      saveCurrentGame: () => {},
      showToast: () => {},
    };

    quizReg.handler({ id: 'radio_rec', speaker: '📻 QUIZ RECEPTIONIST' } as any, {} as any, ctx);

    expect(askedPrompts.length).toBe(6); // 1 start confirmation + 5 quiz questions
    expect(storyFlags.has('has_radio_card')).toBe(true);
    expect(inventory.keyItems).toContain('RADIO CARD');
  });

  it('8. fixes Goldenrod Underground Warehouse tileMap vs collisionGrid inversion and makes Switch Room Entrances fully navigable', () => {
    const warehousePath = path.resolve(process.cwd(), 'public/assets/data/maps/goldenrod_underground_warehouse.json');
    const warehouse = JSON.parse(fs.readFileSync(warehousePath, 'utf8'));

    // Walkable non-warp floor tiles should use in_underground_10_10_10_10 (not horizontal shutter lines)
    expect(warehouse.collisionGrid[2 * warehouse.width + 17]).toBe(0);
    expect(warehouse.tileMap[2 * warehouse.width + 17]).toBe('in_underground_10_10_10_10');
    // Real director approachable from (8, 3)
    expect(warehouse.collisionGrid[3 * warehouse.width + 8]).toBe(0);

    const switchPath = path.resolve(process.cwd(), 'public/assets/data/maps/goldenrod_underground_switch_room_entrances.json');
    const switchMap = JSON.parse(fs.readFileSync(switchPath, 'utf8'));

    const visited = new Set<string>(['23,3']);
    const queue: Array<[number, number]> = [[23, 3]];
    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= switchMap.width || ny < 0 || ny >= switchMap.height) continue;
        const key = `${nx},${ny}`;
        if (!visited.has(key) && switchMap.collisionGrid[ny * switchMap.width + nx] === 0) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }

    expect(visited.has('16,2')).toBe(true); // Switch 1
    expect(visited.has('10,2')).toBe(true); // Switch 2
    expect(visited.has('2,2')).toBe(true);  // Switch 3
    expect(visited.has('20,12')).toBe(true); // Emergency Switch
    expect(visited.has('22,10')).toBe(true); // Warehouse entrance
    expect(visited.has('23,10')).toBe(true); // Warehouse entrance

    // Verify switch YES/NO prompt
    const flags = new Set<string>();
    handleShutterSwitches(
      { id: 'switch_1', x: 16, y: 1, speaker: '🔌 SWITCH 1' } as any,
      switchMap,
      {
        storyFlags: flags,
        openDialogue: () => {},
        openChoiceDialogue: (_pages: string[], _speaker: string | undefined, onSelect: (c: 'YES' | 'NO') => void) => {
          onSelect('YES');
        },
      } as any
    );
    expect(flags.has('SWITCH_1_ON')).toBe(true);
  });

  it('9. applies inline YES/NO choice prompts and playTradeAnimation to NPC Pokémon trades (Kyle, Mike, Tim, Emy)', () => {
    const tradeAnimations: any[] = [];
    const makeTradeCtx = (partyPokemon: any, choice: 'YES' | 'NO') => ({
      playerName: 'GOLD',
      playerParty: [partyPokemon],
      storyFlags: new Set<string>(),
      missionManager: { checkStoryFlags: () => {} },
      openDialogue: () => {},
      openChoiceDialogue: (_pages: string[], _speaker: string | undefined, onSelect: (c: 'YES' | 'NO') => void) => {
        onSelect(choice);
      },
      playTradeAnimation: (params: any, onComplete?: () => void) => {
        tradeAnimations.push(params);
        onComplete?.();
      },
      saveCurrentGame: () => {},
      showToast: () => {},
    });

    // 1. Kyle (Bellsprout -> Onix "ROCKY")
    const kyleReg = getVioletAndAzaleaServiceInteractions().find((r) => r.npcIds?.includes('kyle'))!;
    const kyleCtx = makeTradeCtx(PokemonFactory.create('bellsprout', 6), 'YES');
    kyleReg.handler({ id: 'kyle', speaker: '👦 KYLE' } as any, {} as any, kyleCtx as any);
    expect(kyleCtx.playerParty[0].speciesId).toBe('onix');
    expect(kyleCtx.playerParty[0].nickname).toBe('ROCKY');

    // 2. Mike (Drowzee -> Machop "CHRIS")
    const mikeReg = getGoldenrodExpansionInteractions().find((r) => r.npcIds?.includes('dept_5f_mike'))!;
    const mikeCtx = makeTradeCtx(PokemonFactory.create('drowzee', 12), 'YES');
    mikeReg.handler({ id: 'dept_5f_mike', speaker: '⛺ CAMPER MIKE' } as any, {} as any, mikeCtx as any);
    expect(mikeCtx.playerParty[0].speciesId).toBe('machop');
    expect(mikeCtx.playerParty[0].nickname).toBe('CHRIS');

    // 3. Tim (Krabby -> Voltorb "VOLTY")
    const timReg = getOlivineAndVictoryRoadQuestInteractions().find((r) => r.npcIds?.includes('olivine_tim'))!;
    const timCtx = makeTradeCtx(PokemonFactory.create('krabby', 18), 'YES');
    timReg.handler({ id: 'olivine_tim', speaker: '👦 TIM' } as any, {} as any, timCtx as any);
    expect(timCtx.playerParty[0].speciesId).toBe('voltorb');
    expect(timCtx.playerParty[0].nickname).toBe('VOLTY');

    // 4. Emy (Dragonair -> Dodrio "DORIS")
    const emyCtx = makeTradeCtx(PokemonFactory.create('dragonair', 30), 'YES');
    handleBlackthornEmyTrade({ id: 'blackthorn_emys_house_lass_0', speaker: '👧 EMY' } as any, {} as any, emyCtx as any);
    expect(emyCtx.playerParty[0].speciesId).toBe('dodrio');
    expect(emyCtx.playerParty[0].nickname).toBe('DORIS');

    expect(tradeAnimations.length).toBe(4);
  });
});

