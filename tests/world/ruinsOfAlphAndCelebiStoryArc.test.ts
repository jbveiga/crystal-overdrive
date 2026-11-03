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
import { FieldObstacleDispatcher } from '../../src/world/interactions/FieldObstacleDispatcher';
import { getAzaleaAndRuinsQuestInteractions } from '../../src/world/interactions/AzaleaAndRuinsQuestInteractions';
import { OverworldWarpAndMapTransitionController } from '../../src/world/OverworldWarpAndMapTransitionController';
import type { MapData, BgEvent } from '../../src/types/game';

describe('Story Arc B: Ruins of Alph & Celebi Time-Travel Story Arc', () => {
  const createMockContext = (overrides: Partial<any> = {}) => {
    return {
      playerName: 'Gold',
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      inventory: { items: {}, balls: {}, keyItems: [], tms: [], badges: [] } as any,
      playerParty: [
        {
          speciesId: 'typhlosion',
          level: 45,
          moves: [{ moveId: 'flamethrower' }, { moveId: 'swift' }],
        },
      ] as any,
      openDialogue: vi.fn((pages: string[], speaker?: string, onComplete?: () => void) => {
        onComplete?.();
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      triggerBattle: vi.fn(),
      openRuinsPuzzleModal: vi.fn(),
      handleRuinsPuzzleSolve: vi.fn(),
      mapManager: {
        getCurrentMap: () => ({ id: 'ruins_of_alph_kabuto_chamber', width: 8, height: 10 }),
        checkBgEvent: vi.fn((x: number, y: number) => undefined),
      },
      player: { x: 4, y: 3, direction: 'UP' },
      ...overrides,
    };
  };

  it('1. Interactive Puzzle Chambers launch puzzle modal at (3, 2) and record completion flags', () => {
    const ctx = createMockContext();
    const bgEvent: BgEvent = { x: 3, y: 2, speaker: '🧩 KABUTO PUZZLE', pages: ['Ancient stone puzzle'] };
    const map: MapData = { id: 'ruins_of_alph_kabuto_chamber', width: 8, height: 10, bgEvents: [bgEvent] } as any;

    // Player faces (3, 2) from (3, 3) facing UP
    const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(
      ctx,
      map,
      3,
      2
    );

    expect(handled).toBe(true);
    expect(ctx.openDialogue).toHaveBeenCalled();
    expect(ctx.openRuinsPuzzleModal).toHaveBeenCalled();

    // Verify solve handler sets flags and collapses floor
    const transCtx: any = {
      storyFlags: new Set<string>(),
      overworldHUD: { openDialogue: vi.fn((pages: string[], speaker?: string, onComplete?: () => void) => onComplete?.()) },
      triggerCanvasEarthquake: vi.fn(),
    };
    OverworldWarpAndMapTransitionController.executeWarpTransition = vi.fn() as any;

    OverworldWarpAndMapTransitionController.handleRuinsPuzzleSolve(transCtx, 'kabuto');
    expect(transCtx.storyFlags.has('unown_awakened_kabuto')).toBe(true);
    expect(transCtx.storyFlags.has('EVENT_SOLVED_KABUTO_PUZZLE')).toBe(true);
    expect(transCtx.storyFlags.has('EVENT_MADE_UNOWN_APPEAR_IN_RUINS')).toBe(true);
    expect(transCtx.triggerCanvasEarthquake).toHaveBeenCalled();
  });

  it('2. Unown Inscription Secret Vaults unlock upon presenting the matching ancient key items', () => {
    const bgEvent: BgEvent = { x: 4, y: 2, speaker: '📜 ANCIENT INSCRIPTION', pages: ['Ancient inscription'] };

    // 2a. Kabuto Chamber (ESCAPE): Requires Escape Rope
    const kabutoCtx = createMockContext({
      inventory: { items: { escape_rope: 1 }, keyItems: [] },
    });
    const kabutoMap: MapData = { id: 'ruins_of_alph_kabuto_chamber', width: 8, height: 10, bgEvents: [bgEvent] } as any;

    FieldObstacleDispatcher.handleFieldAndBgInteraction(kabutoCtx, kabutoMap, 4, 2);
    expect(kabutoCtx.storyFlags.has('ruins_kabuto_vault_opened')).toBe(true);
    expect(kabutoCtx.inventory.items['heal_powder']).toBe(1);
    expect(kabutoCtx.inventory.items['oran_berry']).toBe(1);

    // 2b. Omanyte Chamber (WATER): Requires Water Stone
    const omanyteCtx = createMockContext({
      inventory: { items: { water_stone: 1 }, keyItems: [] },
    });
    const omanyteMap: MapData = { id: 'ruins_of_alph_omanyte_chamber', width: 8, height: 10, bgEvents: [bgEvent] } as any;

    FieldObstacleDispatcher.handleFieldAndBgInteraction(omanyteCtx, omanyteMap, 4, 2);
    expect(omanyteCtx.storyFlags.has('ruins_omanyte_vault_opened')).toBe(true);
    expect(omanyteCtx.inventory.items['mystic_water']).toBe(1);
    expect(omanyteCtx.inventory.items['star_piece']).toBe(1);

    // 2c. Aerodactyl Chamber (LIGHT): Requires HM05 Flash or move Flash
    const aerodactylCtx = createMockContext({
      inventory: { items: {}, keyItems: ['HM05'] },
    });
    const aeroMap: MapData = { id: 'ruins_of_alph_aerodactyl_chamber', width: 8, height: 10, bgEvents: [bgEvent] } as any;

    FieldObstacleDispatcher.handleFieldAndBgInteraction(aerodactylCtx, aeroMap, 4, 2);
    expect(aerodactylCtx.storyFlags.has('ruins_aerodactyl_vault_opened')).toBe(true);
    expect(aerodactylCtx.inventory.items['moon_stone']).toBe(1);

    // 2d. Ho-Oh Chamber (HO-OH): Requires Ho-Oh or Rainbow Wing
    const hoOhCtx = createMockContext({
      inventory: { items: {}, keyItems: ['RAINBOW_WING'] },
    });
    const hoOhMap: MapData = { id: 'ruins_of_alph_ho_oh_chamber', width: 8, height: 10, bgEvents: [bgEvent] } as any;

    FieldObstacleDispatcher.handleFieldAndBgInteraction(hoOhCtx, hoOhMap, 4, 2);
    expect(hoOhCtx.storyFlags.has('ruins_ho_oh_vault_opened')).toBe(true);
    expect(hoOhCtx.inventory.items['sacred_ash']).toBe(1);
    expect(hoOhCtx.inventory.items['charcoal']).toBe(1);
  });

  it('3. Research Center Scientist upgrades Pokédex with Unown Mode and grants fossil milestones', () => {
    const interactions = getAzaleaAndRuinsQuestInteractions();
    const researcher = interactions.find((i) => i.actions?.includes('UNOWN_DEX_EVENT'));
    expect(researcher).toBeDefined();

    const ctx = createMockContext({
      storyFlags: new Set<string>(['unown_awakened_kabuto', 'unown_awakened_omanyte']),
    });

    // First visit with 2 chambers awakened upgrades Unown Dex
    researcher?.handler({ speaker: '👨‍🔬 SCIENTIST' } as any, {} as any, ctx);
    expect(ctx.storyFlags.has('ENGINE_UNOWN_DEX')).toBe(true);
    expect(ctx.storyFlags.has('unown_dex_upgraded')).toBe(true);

    // Second visit awards Helix Fossil milestone
    researcher?.handler({ speaker: '👨‍🔬 SCIENTIST' } as any, {} as any, ctx);
    expect(ctx.storyFlags.has('ruins_fossil_helix_given')).toBe(true);
    expect(ctx.inventory.items['helix_fossil']).toBe(1);

    // Third visit awards Dome Fossil milestone
    researcher?.handler({ speaker: '👨‍🔬 SCIENTIST' } as any, {} as any, ctx);
    expect(ctx.storyFlags.has('ruins_fossil_dome_given')).toBe(true);
    expect(ctx.inventory.items['dome_fossil']).toBe(1);
  });

  it('4. Celebi Time-Travel Memory Event triggers Giovanni boss battle and awards Master Ball', () => {
    const ctx = createMockContext({
      storyFlags: new Set<string>(['EVENT_CAUGHT_CELEBI', 'radio_tower_cleared']),
      playerParty: [
        {
          speciesId: 'celebi',
          level: 30,
          moves: [{ moveId: 'ancientpower' }, { moveId: 'healbell' }],
        },
      ],
    });

    const shrineBg: BgEvent = { x: 8, y: 23, speaker: '⛩️ ILEX FOREST SHRINE', pages: ['ILEX FOREST SHRINE...'] };
    const ilexMap: MapData = { id: 'ilex_forest', width: 30, height: 40, bgEvents: [shrineBg] } as any;

    // Player interacts facing UP at shrine (8, 23)
    const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(
      ctx,
      ilexMap,
      8,
      23
    );

    expect(handled).toBe(true);
    expect(ctx.triggerBattle).toHaveBeenCalled();

    // Verify trainer battle configuration for Giovanni
    const battleCall = ctx.triggerBattle.mock.calls[0];
    expect(battleCall[1]?.isTrainer).toBe(true);
    expect(battleCall[1]?.trainerName).toBe('Boss Giovanni');
    expect(battleCall[1]?.trainerTeam.length).toBe(6);

    // Trigger victory callback
    battleCall[1]?.onVictory();
    expect(ctx.storyFlags.has('celebi_giovanni_memory_complete')).toBe(true);
    expect(ctx.inventory.items['master_ball']).toBe(1);
    expect(ctx.inventory.balls['master_ball']).toBe(1);
  });
});
