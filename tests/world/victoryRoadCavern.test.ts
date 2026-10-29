import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createNpcsByMap, applyMapNpcStoryMutations } from '../../src/world/npcData';
import {
  handleVictoryRoadRival,
  handleVictoryRoadBoulder,
  handleVictoryRoadStep,
  getVictoryRoadRivalTeam,
  getVictoryRoadInteractions,
  VICTORY_ROAD_RIVAL_CHALLENGE,
  VICTORY_ROAD_RIVAL_DEFEAT,
  VICTORY_ROAD_RIVAL_POST_DEFEAT,
} from '../../src/world/interactions/VictoryRoadInteractions';
import type { PokemonInstance } from '../../src/types/pokemon';
import type { MapData } from '../../src/types/game';

describe('TICKET-WORLD-VICTORY-ROAD-CAVERN-02: Victory Road 3-Tier Cavern & Rival Silver', () => {
  const root = path.resolve(__dirname, '../..');
  const vrPath = path.join(root, 'public/assets/data/maps/victory_road.json');
  const vrMap: MapData = JSON.parse(fs.readFileSync(vrPath, 'utf8'));
  const npcs = createNpcsByMap();

  it('1. victory_road.json has authentic 20x72 dimensions and 1,440 tiles', () => {
    expect(vrMap.width).toBe(20);
    expect(vrMap.height).toBe(72);
    expect(vrMap.collisionGrid.length).toBe(1440);
  });

  it('2. all warps in victory_road.json match valid coordinates and reciprocal connections', () => {
    expect(vrMap.warps.length).toBe(9);

    // South entrance from Victory Road Gate
    const southWarp = vrMap.warps.find((w) => w.x === 9 && w.y === 67);
    expect(southWarp).toBeDefined();
    expect(southWarp?.targetMapId).toBe('victory_road_gate');
    expect(southWarp?.targetX).toBe(9);
    expect(southWarp?.targetY).toBe(0);

    // Internal stairs 1: (1, 49) <-> (1, 35)
    const stair1A = vrMap.warps.find((w) => w.x === 1 && w.y === 49);
    const stair1B = vrMap.warps.find((w) => w.x === 1 && w.y === 35);
    expect(stair1A?.targetX).toBe(1);
    expect(stair1A?.targetY).toBe(35);
    expect(stair1B?.targetX).toBe(1);
    expect(stair1B?.targetY).toBe(49);

    // Internal stairs 2: (13, 31) <-> (13, 17)
    const stair2A = vrMap.warps.find((w) => w.x === 13 && w.y === 31);
    const stair2B = vrMap.warps.find((w) => w.x === 13 && w.y === 17);
    expect(stair2A?.targetX).toBe(13);
    expect(stair2A?.targetY).toBe(17);
    expect(stair2B?.targetX).toBe(13);
    expect(stair2B?.targetY).toBe(31);

    // Internal stairs 3: (17, 33) <-> (17, 19)
    const stair3A = vrMap.warps.find((w) => w.x === 17 && w.y === 33);
    const stair3B = vrMap.warps.find((w) => w.x === 17 && w.y === 19);
    expect(stair3A?.targetX).toBe(17);
    expect(stair3A?.targetY).toBe(19);
    expect(stair3B?.targetX).toBe(17);
    expect(stair3B?.targetY).toBe(33);

    // Ledge/hole drop: (0, 11) -> (0, 27)
    const dropA = vrMap.warps.find((w) => w.x === 0 && w.y === 11);
    expect(dropA?.targetX).toBe(0);
    expect(dropA?.targetY).toBe(27);

    // North exit to Route 23 / Indigo Plateau
    const northExit = vrMap.warps.find((w) => w.x === 13 && w.y === 5);
    expect(northExit).toBeDefined();
    expect(northExit?.targetMapId).toBe('route_23');
    expect(northExit?.targetX).toBe(9);
    expect(northExit?.targetY).toBe(13);
  });

  it('3. 100% of victory_road NPCs stand on walkable tile 0', () => {
    const vrNpcs = npcs.victory_road;
    expect(vrNpcs.length).toBe(3);

    for (const npc of vrNpcs) {
      const tileCol = vrMap.collisionGrid[npc.y * vrMap.width + npc.x];
      expect(tileCol).toBe(0);
    }
  });

  it('4. Rival Silver is located at (13, 7) facing DOWN with VICTORY_ROAD_RIVAL_EVENT action', () => {
    const silver = npcs.victory_road.find((n) => n.id === 'victory_road_rival');
    expect(silver).toBeDefined();
    expect(silver?.x).toBe(13);
    expect(silver?.y).toBe(7);
    expect(silver?.direction).toBe('DOWN');
    expect(silver?.spriteType).toBe('silver');
    expect(silver?.action).toBe('VICTORY_ROAD_RIVAL_EVENT');
    expect(silver?.trainerId).toBe('rival_victory_road');
  });

  it('5. Strength boulders exist at (4, 28) and (16, 33) with STRENGTH_BOULDER action', () => {
    const b1 = npcs.victory_road.find((n) => n.id === 'victory_road_boulder_1');
    const b2 = npcs.victory_road.find((n) => n.id === 'victory_road_boulder_2');

    expect(b1).toBeDefined();
    expect(b1?.x).toBe(4);
    expect(b1?.y).toBe(28);
    expect(b1?.spriteType).toBe('boulder');
    expect(b1?.action).toBe('STRENGTH_BOULDER');

    expect(b2).toBeDefined();
    expect(b2?.x).toBe(16);
    expect(b2?.y).toBe(33);
    expect(b2?.spriteType).toBe('boulder');
    expect(b2?.action).toBe('STRENGTH_BOULDER');
  });

  it('6. dynamic starter resolver provides correct starter advantage for Rival Silver team', () => {
    // If player chose Cyndaquil, Silver has Feraligatr Lv. 38 (water beats fire)
    const cyndTeam = getVictoryRoadRivalTeam([], new Set(['starter_cyndaquil']));
    expect(cyndTeam.length).toBe(6);
    expect(cyndTeam[5].speciesId).toBe('feraligatr');
    expect(cyndTeam[5].level).toBe(38);

    // If player chose Totodile, Silver has Meganium Lv. 38 (grass beats water)
    const totoTeam = getVictoryRoadRivalTeam([], new Set(['starter_totodile']));
    expect(totoTeam[5].speciesId).toBe('meganium');
    expect(totoTeam[5].level).toBe(38);

    // If player chose Chikorita, Silver has Typhlosion Lv. 38 (fire beats grass)
    const chikoTeam = getVictoryRoadRivalTeam([], new Set(['starter_chikorita']));
    expect(chikoTeam[5].speciesId).toBe('typhlosion');
    expect(chikoTeam[5].level).toBe(38);

    // Default team includes Sneasel, Golbat, Magneton, Kadabra, Haunter
    expect(cyndTeam[0].speciesId).toBe('sneasel');
    expect(cyndTeam[1].speciesId).toBe('golbat');
    expect(cyndTeam[2].speciesId).toBe('magneton');
    expect(cyndTeam[3].speciesId).toBe('kadabra');
    expect(cyndTeam[4].speciesId).toBe('haunter');
  });

  it('7. handleVictoryRoadRival triggers challenge dialogue and battle, then moves Silver to (12, 7) facing RIGHT', () => {
    const silver = { ...npcs.victory_road.find((n) => n.id === 'victory_road_rival')! };
    const storyFlags = new Set<string>();
    const defeatedTrainers = new Set<string>();
    let battleTriggered = false;
    let onVictoryCb: (() => void) | undefined;

    const ctx: any = {
      playerParty: [],
      inventory: { badges: [], tms: [] },
      storyFlags,
      defeatedTrainers,
      openDialogue: vi.fn((pages: string[], speaker?: string, onComplete?: () => void) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'sneasel', level: 36, moves: [] }]),
      triggerBattle: vi.fn((_p, opts) => {
        battleTriggered = true;
        onVictoryCb = opts.onVictory;
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      renderMap: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    handleVictoryRoadRival(silver, vrMap, ctx);
    expect(battleTriggered).toBe(true);

    // Simulate winning the battle
    onVictoryCb?.();

    expect(storyFlags.has('victory_road_rival_defeated')).toBe(true);
    expect(defeatedTrainers.has('rival_victory_road')).toBe(true);
    expect(silver.x).toBe(12);
    expect(silver.y).toBe(7);
    expect(silver.direction).toBe('RIGHT');
    expect(ctx.showToast).toHaveBeenCalled();
  });

  it('8. speaking to Silver after defeat gives League encouragement', () => {
    const silver = { ...npcs.victory_road.find((n) => n.id === 'victory_road_rival')!, x: 12, y: 7 };
    const storyFlags = new Set(['victory_road_rival_defeated']);
    let openedDialogue: string[] = [];

    const ctx: any = {
      playerParty: [],
      inventory: { badges: [], tms: [] },
      storyFlags,
      defeatedTrainers: new Set(['rival_victory_road']),
      openDialogue: vi.fn((pages: string[]) => {
        openedDialogue = pages;
      }),
    };

    handleVictoryRoadRival(silver, vrMap, ctx);
    expect(openedDialogue).toEqual(VICTORY_ROAD_RIVAL_POST_DEFEAT);
  });

  it('9. handleVictoryRoadStep intercepts player stepping on exit chokepoint (12..14, 8) before defeat', () => {
    const storyFlags = new Set<string>();
    let battleTriggered = false;

    const ctx: any = {
      player: { x: 13, y: 8, isMoving: true, progress: 0.5, direction: 'UP' },
      npcsByMap: { victory_road: npcs.victory_road },
      playerParty: [],
      inventory: { badges: [], tms: [] },
      storyFlags,
      defeatedTrainers: new Set<string>(),
      openDialogue: vi.fn((pages: string[], speaker?: string, onComplete?: () => void) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'sneasel', level: 36, moves: [] }]),
      triggerBattle: vi.fn(() => {
        battleTriggered = true;
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    const intercepted = handleVictoryRoadStep({ x: 13, y: 8 }, vrMap, ctx);
    expect(intercepted).toBe(true);
    expect(ctx.player.isMoving).toBe(false);
    expect(ctx.player.direction).toBe('UP');
    expect(battleTriggered).toBe(true);
  });

  it('10. handleVictoryRoadStep ignores steps if Silver is already defeated', () => {
    const storyFlags = new Set(['victory_road_rival_defeated']);
    const ctx: any = {
      player: { x: 13, y: 8, isMoving: true, progress: 0.5, direction: 'UP' },
      npcsByMap: { victory_road: npcs.victory_road },
      storyFlags,
    };

    const intercepted = handleVictoryRoadStep({ x: 13, y: 8 }, vrMap, ctx);
    expect(intercepted).toBe(false);
  });

  it('11. applyMapNpcStoryMutations positions defeated Silver at (12, 7) facing RIGHT', () => {
    const storyFlags = new Set(['victory_road_rival_defeated']);
    const mutated = applyMapNpcStoryMutations('victory_road', npcs.victory_road, storyFlags);

    const silver = mutated.find((n) => n.id === 'victory_road_rival');
    expect(silver).toBeDefined();
    expect(silver?.x).toBe(12);
    expect(silver?.y).toBe(7);
    expect(silver?.direction).toBe('RIGHT');
  });

  it('12. handleVictoryRoadBoulder prevents push if player lacks STRENGTH or Plain Badge', () => {
    const b1 = { ...npcs.victory_road.find((n) => n.id === 'victory_road_boulder_1')! };
    let openedDialogue: string[] = [];

    const ctx: any = {
      player: { x: 4, y: 29, direction: 'UP' },
      playerParty: [],
      inventory: { badges: [], tms: [] },
      storyFlags: new Set<string>(),
      openDialogue: vi.fn((pages: string[]) => {
        openedDialogue = pages;
      }),
    };

    handleVictoryRoadBoulder(b1, vrMap, ctx);
    expect(openedDialogue[0]).toContain('A giant boulder blocks the path!');
    expect(b1.x).toBe(4);
    expect(b1.y).toBe(28);
  });

  it('13. handleVictoryRoadBoulder moves boulder 1 tile into walkable space when STRENGTH active', () => {
    const b1 = { ...npcs.victory_road.find((n) => n.id === 'victory_road_boulder_1')! };
    const machop: PokemonInstance = {
      id: 'p1',
      speciesId: 'machop',
      level: 25,
      moves: [{ moveId: 'strength', currentPp: 15, maxPp: 15 }],
      types: ['Fighting'],
      currentHp: 60,
      maxHp: 60,
    } as any;

    const storyFlags = new Set(['plain_badge']);
    let toastMsg = '';

    const ctx: any = {
      player: { x: 4, y: 29, direction: 'UP' }, // Player facing UP pushed boulder north: (4, 28) -> (4, 27)
      playerParty: [machop],
      inventory: { badges: ['plain'], tms: ['HM04'] },
      storyFlags,
      openDialogue: vi.fn((_p: string[], _s?: string, onComplete?: () => void) => {
        onComplete?.();
      }),
      showToast: vi.fn((msg: string) => {
        toastMsg = msg;
      }),
      saveCurrentGame: vi.fn(),
      renderMap: vi.fn(),
    };

    handleVictoryRoadBoulder(b1, vrMap, ctx);
    expect(b1.x).toBe(4);
    expect(b1.y).toBe(27);
    expect(storyFlags.has('EVENT_VICTORY_ROAD_BOULDER_1_MOVED')).toBe(true);
    expect(toastMsg).toContain('(4, 27)');
  });

  it('14. handleVictoryRoadBoulder blocks push into impassable wall tiles', () => {
    const b1 = { ...npcs.victory_road.find((n) => n.id === 'victory_road_boulder_1')! };
    const machop: PokemonInstance = {
      id: 'p1',
      speciesId: 'machop',
      level: 25,
      moves: [{ moveId: 'strength', currentPp: 15, maxPp: 15 }],
      types: ['Fighting'],
    } as any;

    let dialogueOpened: string[] = [];
    const ctx: any = {
      player: { x: 4, y: 27, direction: 'UP' }, // (4, 27) north is (4, 26) which is wall '#'
      playerParty: [machop],
      inventory: { badges: ['plain'], tms: ['HM04'] },
      storyFlags: new Set<string>(),
      openDialogue: vi.fn((pages: string[]) => {
        dialogueOpened = pages;
      }),
    };

    // Set boulder at (4, 26) where (4, 25) is wall
    b1.x = 4;
    b1.y = 26;
    handleVictoryRoadBoulder(b1, vrMap, ctx);
    expect(dialogueOpened[0]).toContain("couldn't budge the boulder");
    expect(b1.x).toBe(4);
    expect(b1.y).toBe(26);
  });

  it('15. all 5 item balls and 2 hidden items in victory_road exist in overworld_items.json', () => {
    const itemsPath = path.join(root, 'public/assets/data/overworld_items.json');
    const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
    const vrItems = itemsData.byMap.victory_road;

    expect(vrItems).toBeDefined();
    expect(vrItems.itemBalls.length).toBe(5);
    expect(vrItems.hiddenItems.length).toBe(2);

    const ballItems = vrItems.itemBalls.map((b: any) => b.itemId);
    expect(ballItems).toContain('tm_earthquake');
    expect(ballItems).toContain('max_revive');
    expect(ballItems).toContain('full_restore');
    expect(ballItems).toContain('full_heal');
    expect(ballItems).toContain('hp_up');

    const hiddenItems = vrItems.hiddenItems.map((h: any) => h.itemId);
    expect(hiddenItems).toContain('max_potion');
    expect(hiddenItems).toContain('full_heal');

    // Verify all item coordinates are within bounds
    for (const item of [...vrItems.itemBalls, ...vrItems.hiddenItems]) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThan(vrMap.width);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThan(vrMap.height);
    }
  });

  it('16. getVictoryRoadInteractions returns registrations for rival and boulders', () => {
    const regs = getVictoryRoadInteractions();
    expect(regs.length).toBe(2);

    const rivalReg = regs.find((r) => r.actions?.includes('VICTORY_ROAD_RIVAL_EVENT'));
    expect(rivalReg).toBeDefined();
    expect(rivalReg?.npcIds).toContain('victory_road_rival');

    const boulderReg = regs.find((r) => r.npcIds?.includes('victory_road_boulder_1'));
    expect(boulderReg).toBeDefined();
    expect(boulderReg?.npcIds).toContain('victory_road_boulder_2');
  });
});
