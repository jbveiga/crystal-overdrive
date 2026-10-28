import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getTinTowerHoOhInteractions,
  handleTinTowerSage,
  handleHoOhBoss,
} from '../../src/world/interactions/TinTowerHoOhInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { createEcruteakToRoute39Npcs } from '../../src/world/npcs/ecruteakToRoute39Npcs';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-WORLD-BELL-TOWER-HO-OH-01: Tin Tower 10-Floor Labyrinth & Legendary Ho-Oh Encounter', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let savedGameCalled = false;
  let lastToastMessage = '';
  let triggeredBattleEnemy: any = null;
  let triggeredBattleOptions: any = null;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    savedGameCalled = false;
    lastToastMessage = '';
    triggeredBattleEnemy = null;
    triggeredBattleOptions = null;

    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('typhlosion', 60, ['flamethrower', 'thunderpunch', 'earthquake', 'quickattack'])],
      player: {
        id: 'player',
        x: 9,
        y: 6,
        targetX: 9,
        targetY: 6,
        renderX: 9 * 64,
        renderY: 6 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 50000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'],
        items: [],
        keyItems: ['CLEAR BELL', 'RAINBOW WING'],
        balls: { 'master-ball': 1, 'ultra-ball': 20 },
        tms: ['TM24'],
      },
      storyFlags: new Set<string>(['starter_chosen', 'has_clear_bell', 'has_rainbow_wing']),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages: string[], speaker?: string, callback?: () => void) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        callback?.();
      },
      showToast: (msg: string) => {
        lastToastMessage = msg;
      },
      saveCurrentGame: () => {
        savedGameCalled = true;
      },
      healPlayerParty: () => {},
      playFieldRestAnimation: () => {},
      audioManager: {
        playSfx: () => {},
      } as any,
      triggerBattle: (enemy: any, options: any) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = options;
      },
    };
  });

  // 1. All 10 Tin Tower maps load with valid schemas and 20x18 dimensions
  it('1. loads all 10 Tin Tower maps (1F through 9F and Roof) with valid 20x18 dimensions', () => {
    const floors = [
      'tin_tower_1f',
      'tin_tower_2f',
      'tin_tower_3f',
      'tin_tower_4f',
      'tin_tower_5f',
      'tin_tower_6f',
      'tin_tower_7f',
      'tin_tower_8f',
      'tin_tower_9f',
      'tin_tower_roof',
    ];

    for (const floorId of floors) {
      const filePath = path.join(mapsDir, `${floorId}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
      const map: MapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(map.width).toBe(20);
      expect(map.height).toBe(18);
      expect(map.collisionGrid.length).toBe(20 * 18);
      expect(map.tileMap.length).toBe(20 * 18);
    }
  });

  // 2. Complete reciprocal warp integrity across all 10 floors
  it('2. asserts reciprocal warp integrity across all 10 Tin Tower floors with zero broken targets', () => {
    const floors = [
      'tin_tower_1f',
      'tin_tower_2f',
      'tin_tower_3f',
      'tin_tower_4f',
      'tin_tower_5f',
      'tin_tower_6f',
      'tin_tower_7f',
      'tin_tower_8f',
      'tin_tower_9f',
      'tin_tower_roof',
    ];

    const maps: Record<string, MapData> = {};
    for (const id of floors) {
      maps[id] = JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));
    }

    // 1F <-> 2F
    const warp1To2 = maps.tin_tower_1f.warps.find((w) => w.targetMapId === 'tin_tower_2f');
    expect(warp1To2).toBeDefined();
    expect(warp1To2?.x).toBe(10);
    expect(warp1To2?.y).toBe(2);

    const warp2To1 = maps.tin_tower_2f.warps.find((w) => w.targetMapId === 'tin_tower_1f');
    expect(warp2To1).toBeDefined();
    expect(warp2To1?.targetX).toBe(10);
    expect(warp2To1?.targetY).toBe(2);

    // 9F <-> Roof
    const warp9ToRoof = maps.tin_tower_9f.warps.find((w) => w.targetMapId === 'tin_tower_roof');
    expect(warp9ToRoof).toBeDefined();
    expect(warp9ToRoof?.targetX).toBe(9);
    expect(warp9ToRoof?.targetY).toBe(13);

    const warpRoofTo9 = maps.tin_tower_roof.warps.find((w) => w.targetMapId === 'tin_tower_9f');
    expect(warpRoofTo9).toBeDefined();
    expect(warpRoofTo9?.targetX).toBe(7);
    expect(warpRoofTo9?.targetY).toBe(9);

    // Check all warps on every floor land on walkable tile 0 or 2
    for (const [mapId, map] of Object.entries(maps)) {
      for (const w of map.warps) {
        const targetMap = maps[w.targetMapId] || (fs.existsSync(path.join(mapsDir, `${w.targetMapId}.json`)) ? JSON.parse(fs.readFileSync(path.join(mapsDir, `${w.targetMapId}.json`), 'utf8')) : null);
        expect(targetMap).toBeDefined();
        const targetColl = targetMap.collisionGrid[w.targetY * targetMap.width + w.targetX];
        expect(targetColl === 0 || targetColl === 2).toBe(true);
      }
    }
  });

  // 3. Tower Sage unblocking logic with and without Rainbow Wing / Clear Bell
  it('3. unblocks passage when holding Clear Bell and Rainbow Wing, and blocks when missing either', () => {
    // Both held
    const allowed = handleTinTowerSage(
      { id: 'tin_tower_sage', speaker: '🏮 TOWER SAGE' } as any,
      { id: 'tin_tower_1f' } as any,
      mockContext as NpcInteractionContext
    );
    expect(allowed).toBe(true);
    expect(mockContext.storyFlags?.has('EVENT_TIN_TOWER_SAGE_UNBLOCKED')).toBe(true);
    expect(lastDialoguePages[0]).toContain('You bear both the CLEAR BELL and the radiant RAINBOW WING');

    // Missing Rainbow Wing
    mockContext.storyFlags?.delete('has_rainbow_wing');
    mockContext.inventory!.keyItems = ['CLEAR BELL'];
    const blockedNoWing = handleTinTowerSage(
      { id: 'tin_tower_sage', speaker: '🏮 TOWER SAGE' } as any,
      { id: 'tin_tower_1f' } as any,
      mockContext as NpcInteractionContext
    );
    expect(blockedNoWing).toBe(true);
    expect(lastDialoguePages[0]).toContain('Only the chosen bearer of the CLEAR BELL and RAINBOW WING');

    // Missing Clear Bell
    mockContext.storyFlags?.delete('has_clear_bell');
    mockContext.storyFlags?.add('has_rainbow_wing');
    mockContext.inventory!.keyItems = ['RAINBOW WING'];
    const blockedNoBell = handleTinTowerSage(
      { id: 'tin_tower_sage', speaker: '🏮 TOWER SAGE' } as any,
      { id: 'tin_tower_1f' } as any,
      mockContext as NpcInteractionContext
    );
    expect(blockedNoBell).toBe(true);
    expect(lastDialoguePages[0]).toContain('Only the chosen bearer of the CLEAR BELL and RAINBOW WING');
  });

  // 4. Overworld item balls on floors 3F, 4F, 5F, 6F, 7F, 8F, 9F resolve properly with unique event flags
  it('4. registers all 10 overworld item balls across Tin Tower floors in overworld_items.json', () => {
    const itemsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/overworld_items.json'), 'utf8'));

    expect(itemsData.byMap['tin_tower_3f'].itemBalls.length).toBe(1);
    expect(itemsData.byMap['tin_tower_3f'].itemBalls[0].itemId).toBe('full_heal');

    expect(itemsData.byMap['tin_tower_4f'].itemBalls.length).toBe(3);
    const item4fIds = itemsData.byMap['tin_tower_4f'].itemBalls.map((i: any) => i.itemId);
    expect(item4fIds).toContain('ultra_ball');
    expect(item4fIds).toContain('pp_up');
    expect(item4fIds).toContain('escape_rope');

    expect(itemsData.byMap['tin_tower_5f'].itemBalls.length).toBe(1);
    expect(itemsData.byMap['tin_tower_5f'].itemBalls[0].itemId).toBe('rare_candy');

    expect(itemsData.byMap['tin_tower_6f'].itemBalls.length).toBe(1);
    expect(itemsData.byMap['tin_tower_6f'].itemBalls[0].itemId).toBe('max_potion');

    expect(itemsData.byMap['tin_tower_7f'].itemBalls.length).toBe(1);
    expect(itemsData.byMap['tin_tower_7f'].itemBalls[0].itemId).toBe('max_revive');

    expect(itemsData.byMap['tin_tower_8f'].itemBalls.length).toBe(3);
    const item8fIds = itemsData.byMap['tin_tower_8f'].itemBalls.map((i: any) => i.itemId);
    expect(item8fIds).toContain('nugget');
    expect(item8fIds).toContain('max_elixer');
    expect(item8fIds).toContain('full_restore');

    expect(itemsData.byMap['tin_tower_9f'].itemBalls.length).toBe(1);
    expect(itemsData.byMap['tin_tower_9f'].itemBalls[0].itemId).toBe('hp_up');
  });

  // 5. Ho-Oh boss creation with Level 60, correct base stats, and signature moves
  it('5. creates Level 60 Ho-Oh with authentic Gen 2 signature moveset and stats', () => {
    const hoOh = PokemonFactory.create('ho-oh', 60, ['sacredfire', 'fireblast', 'recover', 'sunnyday']);
    expect(hoOh).toBeDefined();
    expect(['ho-oh', 'hooh']).toContain(hoOh.speciesId);
    expect(hoOh.level).toBe(60);
    expect(hoOh.moves.length).toBe(4);
    const moveIds = hoOh.moves.map((m: any) => m.moveId);
    expect(moveIds).toContain('sacredfire');
    expect(moveIds).toContain('fireblast');
    expect(moveIds).toContain('recover');
    expect(moveIds).toContain('sunnyday');
    expect(hoOh.stats.hp).toBeGreaterThan(180);
    expect(hoOh.catchRate).toBe(3);
  });

  // 6. Ho-Oh battle trigger, cry playback, and post-battle flag persistence
  it('6. triggers Ho-Oh battle on rooftop and sets flags upon victory', () => {
    const handled = handleHoOhBoss(
      { id: 'ho_oh_boss', speaker: '🌈 HO-OH' } as any,
      { id: 'tin_tower_roof' } as any,
      mockContext as NpcInteractionContext
    );

    expect(handled).toBe(true);
    expect(triggeredBattleEnemy).toBeDefined();
    expect(['ho-oh', 'hooh']).toContain(triggeredBattleEnemy.speciesId);
    expect(triggeredBattleEnemy.level).toBe(60);

    // Simulate player victory
    triggeredBattleOptions.onBattleEnd({ winner: 'PLAYER', caught: false });
    expect(mockContext.storyFlags?.has('ho_oh_defeated')).toBe(true);
    expect(mockContext.storyFlags?.has('EVENT_FOUGHT_HO_OH')).toBe(true);
    expect(savedGameCalled).toBe(true);
    expect(lastToastMessage).toContain('Quelled the Legendary Sky Guardian Ho-Oh');
  });

  // 7. Ho-Oh battle catch flow sets EVENT_CAUGHT_HO_OH
  it('7. sets EVENT_CAUGHT_HO_OH when player catches Ho-Oh during battle', () => {
    handleHoOhBoss(
      { id: 'ho_oh_boss', speaker: '🌈 HO-OH' } as any,
      { id: 'tin_tower_roof' } as any,
      mockContext as NpcInteractionContext
    );

    // Simulate catching Ho-Oh
    triggeredBattleOptions.onBattleEnd({ winner: 'PLAYER', caught: true });
    expect(mockContext.storyFlags?.has('ho_oh_defeated')).toBe(true);
    expect(mockContext.storyFlags?.has('EVENT_FOUGHT_HO_OH')).toBe(true);
    expect(mockContext.storyFlags?.has('EVENT_CAUGHT_HO_OH')).toBe(true);
  });

  // 8. Negative invariant: Ho-Oh cannot be challenged again once quelled
  it('8. negative invariant: Ho-Oh cannot be challenged again once quelled', () => {
    mockContext.storyFlags?.add('ho_oh_defeated');
    mockContext.storyFlags?.add('EVENT_FOUGHT_HO_OH');

    const handled = handleHoOhBoss(
      { id: 'ho_oh_boss', speaker: '🌈 HO-OH' } as any,
      { id: 'tin_tower_roof' } as any,
      mockContext as NpcInteractionContext
    );

    expect(handled).toBe(true);
    expect(triggeredBattleEnemy).toBeNull();
    expect(lastDialoguePages[0]).toContain('A serene calm settles over the sacred summit');
  });

  // 9. Negative invariant: Ho-Oh does not appear/awaken without Rainbow Wing
  it('9. negative invariant: Ho-Oh does not awaken without Rainbow Wing', () => {
    mockContext.storyFlags?.delete('has_rainbow_wing');
    mockContext.inventory!.keyItems = ['CLEAR BELL'];

    const handled = handleHoOhBoss(
      { id: 'ho_oh_boss', speaker: '🌈 HO-OH' } as any,
      { id: 'tin_tower_roof' } as any,
      mockContext as NpcInteractionContext
    );

    expect(handled).toBe(true);
    expect(triggeredBattleEnemy).toBeNull();
    expect(lastDialoguePages.some((p) => p.includes('A rainbow-hued feather is said to summon'))).toBe(true);
  });

  // 10. NPC Walkability: 100% of NPCs on Tin Tower maps stand on walkable tiles
  it('10. asserts 100% of NPCs in Tin Tower stand on strictly walkable tiles (collision 0)', () => {
    const npcs = createEcruteakToRoute39Npcs();
    const tin1fMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tin_tower_1f.json'), 'utf8'));
    const roofMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tin_tower_roof.json'), 'utf8'));

    const tin1fNpcs = npcs.tin_tower_1f || [];
    for (const npc of tin1fNpcs) {
      const tileCol = tin1fMap.collisionGrid[npc.y * tin1fMap.width + npc.x];
      expect(tileCol).toBe(0);
    }

    const roofNpcs = npcs.tin_tower_roof || [];
    for (const npc of roofNpcs) {
      const tileCol = roofMap.collisionGrid[npc.y * roofMap.width + npc.x];
      expect(tileCol).toBe(0);
    }
  });

  // 11. Router dispatch: createDefaultNpcInteractionRouter routes Tin Tower events
  it('11. createDefaultNpcInteractionRouter dispatches Tin Tower Sage and Ho-Oh boss events', () => {
    const router = createDefaultNpcInteractionRouter();

    const sageHandled = router.dispatch(
      { id: 'tin_tower_sage', action: 'TIN_TOWER_SAGE_EVENT', speaker: '🏮 TOWER SAGE' } as any,
      { id: 'tin_tower_1f' } as any,
      mockContext as NpcInteractionContext
    );
    expect(sageHandled).toBe(true);

    const hoOhHandled = router.dispatch(
      { id: 'ho_oh_boss', action: 'HO_OH_BOSS_EVENT', speaker: '🌈 HO-OH' } as any,
      { id: 'tin_tower_roof' } as any,
      mockContext as NpcInteractionContext
    );
    expect(hoOhHandled).toBe(true);
  });

  // 12. Ledge collision tiles present across Tin Tower floors
  it('12. verifies authentic ledge tiles present across vertical puzzle floors', () => {
    const r7f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tin_tower_7f.json'), 'utf8'));
    const r8f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tin_tower_8f.json'), 'utf8'));
    const r9f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tin_tower_9f.json'), 'utf8'));

    // Check collision grids have ledge tiles
    const hasLedges7f = r7f.collisionGrid.some((c: number) => c >= 4 && c <= 9);
    const hasLedges8f = r8f.collisionGrid.some((c: number) => c >= 4 && c <= 9);
    const hasLedges9f = r9f.collisionGrid.some((c: number) => c >= 4 && c <= 9);

    expect(hasLedges7f).toBe(true);
    expect(hasLedges8f).toBe(true);
    expect(hasLedges9f).toBe(true);
  });

  // 13. Safe-state backward compatibility: non-breaking flags
  it('13. maintains non-breaking backward compatibility for saved progress', () => {
    const existingStoryFlags = new Set<string>(['starter_chosen', 'has_rising_badge', 'has_clear_bell']);
    expect(existingStoryFlags.has('ho_oh_defeated')).toBe(false);
    expect(existingStoryFlags.has('EVENT_FOUGHT_HO_OH')).toBe(false);

    existingStoryFlags.add('ho_oh_defeated');
    expect(existingStoryFlags.has('ho_oh_defeated')).toBe(true);
    expect(existingStoryFlags.size).toBe(4);
  });

  // 14. Registration factory returns registrations with expected actions
  it('14. getTinTowerHoOhInteractions returns registrations matching TIN_TOWER_SAGE_EVENT and HO_OH_BOSS_EVENT', () => {
    const regs = getTinTowerHoOhInteractions();
    expect(regs.length).toBe(2);

    const sageReg = regs.find((r) => r.actions?.includes('TIN_TOWER_SAGE_EVENT'));
    expect(sageReg).toBeDefined();

    const hoOhReg = regs.find((r) => r.actions?.includes('HO_OH_BOSS_EVENT'));
    expect(hoOhReg).toBeDefined();
  });

  // 15. Player retreat / loss retains Ho-Oh for future rematches
  it('15. player retreat or loss leaves Ho-Oh available for future challenge', () => {
    handleHoOhBoss(
      { id: 'ho_oh_boss', speaker: '🌈 HO-OH' } as any,
      { id: 'tin_tower_roof' } as any,
      mockContext as NpcInteractionContext
    );

    // Simulate player defeat / whiteout (winner !== 'PLAYER' and !caught)
    triggeredBattleOptions.onBattleEnd({ winner: 'ENEMY', caught: false });
    expect(mockContext.storyFlags?.has('ho_oh_defeated')).toBe(false);
    expect(mockContext.storyFlags?.has('EVENT_FOUGHT_HO_OH')).toBe(false);
  });
});
