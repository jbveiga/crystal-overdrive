import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  handlePortSailorGuard,
  handleFastShipSailorExit,
  handleFastShipCabinRest,
  handleFastShipGrandpa,
  handleFastShipGranddaughter,
  handleFastShipCaptain,
  handleVermilionPortSailor,
  handleSleepingSnorlax,
  evaluateFastShipWarp,
  getFastShipAndVermilionInteractions,
} from '../../src/world/interactions/FastShipAndVermilionInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { createNpcsByMap } from '../../src/world/npcData';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-BUGFIX-SS-AQUA-VOYAGE-FLOW-02: S.S. Aqua Voyage Flow, Return Trip & Softlock Prevention', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let lastToastMessage = '';
  let restAnimationCalled = false;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    lastToastMessage = '';
    restAnimationCalled = false;

    const testParty = [
      PokemonFactory.create('typhlosion', 50, ['flamethrower', 'thunderpunch', 'earthquake', 'quickattack']),
      PokemonFactory.create('ampharos', 48, ['thunderbolt', 'firepunch', 'thunderwave', 'flash']),
    ];
    testParty[0].currentHp = 10;
    testParty[0].status = 'PARALYSIS';
    if (testParty[0].moves) testParty[0].moves[0].currentPp = 0;

    mockContext = {
      playerName: 'Gold',
      playerParty: testParty,
      player: {
        id: 'player',
        x: 7,
        y: 16,
        targetX: 7,
        targetY: 16,
        renderX: 7 * 64,
        renderY: 16 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      inventory: {
        money: 50000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'],
        items: {},
        keyItems: [],
        balls: { 'ultra-ball': 10 },
        tms: ['TM24'],
      },
      storyFlags: new Set<string>(['starter_chosen', 'clair_defeated', 'has_rising_badge']),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        if (onComplete) onComplete();
      },
      healPlayerParty: vi.fn((_reviveFainted = false) => {
        if (mockContext.playerParty) {
          for (const p of mockContext.playerParty) {
            p.currentHp = p.stats.hp;
            p.status = undefined;
            if (p.moves) {
              for (const m of p.moves) {
                m.currentPp = m.maxPp;
              }
            }
          }
        }
      }),
      playFieldRestAnimation: vi.fn((cb?: () => void) => {
        restAnimationCalled = true;
        if (cb) cb();
      }),
      showToast: vi.fn((msg: string) => {
        lastToastMessage = msg;
      }),
      saveCurrentGame: vi.fn(),
      addOverworldItemToInventory: vi.fn((itemId: string) => {
        if (!mockContext.inventory!.items) mockContext.inventory!.items = {};
        const key = itemId.replace(/_/g, '-');
        mockContext.inventory!.items[key] = (mockContext.inventory!.items[key] || 0) + 1;
      }),
    };
  });

  // Assertion 1: Gate checks keyItems 'ss-ticket' first; refuses without ticket
  it('1. should verify ticket gate checks ss-ticket in keyItems and refuses without it', () => {
    const guardNpc: any = { id: 'port_sailor_guard', x: 7, y: 15, speaker: '⚓ SAILOR' };

    // Refused without ticket
    let handled = handlePortSailorGuard(guardNpc, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain("not allowed onto the pier without an S.S. TICKET");
    expect(guardNpc.x).toBe(7);

    // Passes with canonical ss-ticket key item granted at Indigo Plateau
    mockContext.inventory!.keyItems = ['ss-ticket'];
    handled = handlePortSailorGuard(guardNpc, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain('Welcome aboard the FAST SHIP S.S. AQUA');
    expect(guardNpc.x).toBe(6);
    expect(mockContext.storyFlags!.has('ship_bound_vermilion')).toBe(true);
  });

  // Assertion 2: Boarding from Olivine leaves player a walkable path from (25, 1) with zero softlock
  it('2. should verify boarding from Olivine leaves a clear walkable path south from (25, 1)', () => {
    const fastShip1fPath = path.join(mapsDir, 'fast_ship_1f.json');
    const fastShip1f: MapData = JSON.parse(fs.readFileSync(fastShip1fPath, 'utf8'));

    // Tile (25, 1) is entry tile; south exit tile is (25, 2)
    const tile25_1 = fastShip1f.collisionGrid[1 * fastShip1f.width + 25];
    const tile25_2 = fastShip1f.collisionGrid[2 * fastShip1f.width + 25];
    expect(tile25_1).toBe(0);
    expect(tile25_2).toBe(0);

    // Verify NPC placement on fast_ship_1f: sailor is at (24, 2), leaving (25, 2) completely unblocked
    const npcsByMap = createNpcsByMap();
    const shipNpcs = npcsByMap['fast_ship_1f'] || [];
    const sailor = shipNpcs.find((n) => n.id === 'fast_ship_1f_sailor_0');
    expect(sailor).toBeDefined();
    expect(sailor!.x).toBe(24);
    expect(sailor!.y).toBe(2);

    // Assert NO NPC is standing on (25, 1) or (25, 2)
    const blockingNpc = shipNpcs.find((n) => n.x === 25 && (n.y === 1 || n.y === 2));
    expect(blockingNpc).toBeUndefined();
  });

  // Assertion 3: Sailor never on a warp tile in either port or ship
  it('3. should verify no sailor or NPC stands on a warp tile across all port and ship maps', () => {
    const npcsByMap = createNpcsByMap();
    const mapNames = ['olivine_port', 'vermilion_port', 'fast_ship_1f'];

    for (const mapName of mapNames) {
      const mapPath = path.join(mapsDir, `${mapName}.json`);
      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      const npcs = npcsByMap[mapName] || [];

      for (const warp of mapData.warps) {
        const npcOnWarp = npcs.find((n) => n.x === warp.x && n.y === warp.y);
        expect(npcOnWarp, `Map ${mapName} has NPC ${npcOnWarp?.id} on warp (${warp.x}, ${warp.y})`).toBeUndefined();
      }
    }
  });

  // Assertion 4: Metal Coat awarded exactly once, coat count === 1 after talking 3 times
  it('4. should award metal_coat exactly once, ensuring count === 1 after talking to grandpa 3 times', () => {
    mockContext.storyFlags!.add('granddaughter_found');
    const grandpaNpc: any = { id: 'fast_ship_1f_gentleman_3', x: 19, y: 6, speaker: '👴 WORRIED GENTLEMAN' };

    // Talk 1: awards coat
    handleFastShipGrandpa(grandpaNpc, {} as any, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('got_metal_coat')).toBe(true);
    expect(mockContext.inventory!.items!['metal-coat']).toBe(1);

    // Talk 2: already awarded, thank you dialogue only
    handleFastShipGrandpa(grandpaNpc, {} as any, mockContext as NpcInteractionContext);
    expect(mockContext.inventory!.items!['metal-coat']).toBe(1);

    // Talk 3: still exactly 1 coat
    handleFastShipGrandpa(grandpaNpc, {} as any, mockContext as NpcInteractionContext);
    expect(mockContext.inventory!.items!['metal-coat']).toBe(1);
    expect(mockContext.inventory!.items!['metal_coat']).toBeUndefined(); // No duplicate phantom key
  });

  // Assertion 5: Cabin bed rest heals party and triggers arrival
  it('5. should heal party upon resting in cabin bed and trigger arrival announcement', () => {
    const bedNpc: any = { id: 'bed', x: 2, y: 1, speaker: '🛏️ CABIN BED' };
    handleFastShipCabinRest(bedNpc, {} as any, mockContext as NpcInteractionContext);

    expect(mockContext.healPlayerParty).toHaveBeenCalled();
    expect(restAnimationCalled).toBe(true);
    expect(mockContext.playerParty![0].currentHp).toBe(mockContext.playerParty![0].stats.hp);
    expect(mockContext.playerParty![0].status).toBeUndefined();
    expect(mockContext.storyFlags!.has('fast_ship_arrived_vermilion')).toBe(true);
    expect(lastDialoguePages[1]).toContain('FAST SHIP S.S. AQUA has arrived in VERMILION CITY');
  });

  // Assertion 6: Vermilion Port sailor allows return boarding and sets ship_bound_olivine
  it('6. should allow return boarding at Vermilion Port and set ship_bound_olivine', () => {
    const portSailor: any = { id: 'vermilion_port_sailor', x: 8, y: 11, speaker: '⚓ SAILOR' };

    // Refuses without ticket
    let handled = handleVermilionPortSailor(portSailor, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain('need an S.S. TICKET to board');

    // Accepts with ticket
    mockContext.inventory!.keyItems = ['ss-ticket'];
    handled = handleVermilionPortSailor(portSailor, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[1]).toContain('preparing to sail for OLIVINE CITY');
    expect(mockContext.storyFlags!.has('ship_bound_olivine')).toBe(true);
    expect(mockContext.storyFlags!.has('ship_bound_vermilion')).toBe(false);
  });

  // Assertion 7: Full round-trip state simulation: Olivine -> Vermilion -> Olivine
  it('7. should simulate complete round trip: Olivine -> Vermilion -> Olivine with state transitions', () => {
    const flags = new Set<string>();
    const inv = { keyItems: ['ss-ticket'], items: {} };

    // Step A: Board at Olivine Port
    const olivineBoardingWarp = { x: 7, y: 23, targetMapId: 'fast_ship_1f', targetX: 25, targetY: 1 };
    let evalResult = evaluateFastShipWarp('olivine_port', olivineBoardingWarp, flags, inv);
    expect(evalResult.blocked).toBe(false);
    expect(flags.has('ship_bound_vermilion')).toBe(true);
    expect(flags.has('ship_bound_olivine')).toBe(false);

    // Step B: On Fast Ship en route to Vermilion, exit warp (25, 1) is blocked
    const shipExitWarp = { x: 25, y: 1, targetMapId: 'vermilion_port', targetX: 7, targetY: 18 };
    evalResult = evaluateFastShipWarp('fast_ship_1f', shipExitWarp, flags, inv);
    expect(evalResult.blocked).toBe(true);
    expect(evalResult.blockedMessages![0]).toContain('en route to VERMILION CITY');

    // Step C: Arrival triggers (e.g., via cabin rest or grandpa quest)
    flags.add('fast_ship_arrived_vermilion');

    // Step D: Exit warp now succeeds, warps to vermilion_port (7, 18), and sets next destination to Olivine
    evalResult = evaluateFastShipWarp('fast_ship_1f', shipExitWarp, flags, inv);
    expect(evalResult.blocked).toBe(false);
    expect(shipExitWarp.targetMapId).toBe('vermilion_port');
    expect(shipExitWarp.targetX).toBe(7);
    expect(shipExitWarp.targetY).toBe(18);
    expect(flags.has('ship_bound_olivine')).toBe(true);
    expect(flags.has('fast_ship_arrived_vermilion')).toBe(false); // Arrival cleared

    // Step E: Return trip boarding at Vermilion Port
    const vermilionBoardingWarp = { x: 7, y: 17, targetMapId: 'fast_ship_1f', targetX: 25, targetY: 1 };
    evalResult = evaluateFastShipWarp('vermilion_port', vermilionBoardingWarp, flags, inv);
    expect(evalResult.blocked).toBe(false);
    expect(flags.has('ship_bound_olivine')).toBe(true);

    // Step F: On Fast Ship en route to Olivine, exit warp (25, 1) is blocked
    const returnExitWarp = { x: 25, y: 1, targetMapId: 'vermilion_port', targetX: 7, targetY: 18 };
    evalResult = evaluateFastShipWarp('fast_ship_1f', returnExitWarp, flags, inv);
    expect(evalResult.blocked).toBe(true);
    expect(evalResult.blockedMessages![0]).toContain('en route to OLIVINE CITY');

    // Step G: Arrival at Olivine triggered
    flags.add('fast_ship_arrived_olivine');

    // Step H: Return exit warp now succeeds, warps to olivine_port (7, 24), and resets destination to Vermilion
    evalResult = evaluateFastShipWarp('fast_ship_1f', returnExitWarp, flags, inv);
    expect(evalResult.blocked).toBe(false);
    expect(returnExitWarp.targetMapId).toBe('olivine_port');
    expect(returnExitWarp.targetX).toBe(7);
    expect(returnExitWarp.targetY).toBe(24);
    expect(flags.has('ship_bound_vermilion')).toBe(true);
    expect(flags.has('fast_ship_arrived_olivine')).toBe(false);
  });

  // Assertion 8: All Vermilion City NPCs stand on strictly walkable tiles
  it('8. should verify all Vermilion City NPCs stand on strictly walkable tiles', () => {
    const cityPath = path.join(mapsDir, 'vermilion_city.json');
    const city: MapData = JSON.parse(fs.readFileSync(cityPath, 'utf8'));
    const npcsByMap = createNpcsByMap();
    const vermilionNpcs = npcsByMap['vermilion_city'] || [];

    expect(vermilionNpcs.length).toBeGreaterThanOrEqual(6);
    for (const npc of vermilionNpcs) {
      const coll = city.collisionGrid[npc.y * city.width + npc.x];
      expect(coll, `NPC ${npc.id} at (${npc.x}, ${npc.y}) must be on walkable tile (0 or 2)`).toBe(0);
    }
  });

  // Assertion 9: Sleeping Snorlax blocks Diglett's Cave entrance
  it('9. should assert Sleeping Snorlax blocks Diglett\'s Cave entrance at (34, 8)', () => {
    const cityPath = path.join(mapsDir, 'vermilion_city.json');
    const city: MapData = JSON.parse(fs.readFileSync(cityPath, 'utf8'));

    const diglettsCaveWarp = city.warps.find((w) => w.targetMapId === 'digletts_cave');
    expect(diglettsCaveWarp).toBeDefined();
    expect(diglettsCaveWarp!.x).toBe(34);
    expect(diglettsCaveWarp!.y).toBe(7);

    const npcsByMap = createNpcsByMap();
    const snorlax = npcsByMap['vermilion_city'].find((n) => n.id === 'vermilion_city_snorlax');
    expect(snorlax).toBeDefined();
    expect(snorlax!.x).toBe(34);
    expect(snorlax!.y).toBe(8);

    handleSleepingSnorlax(snorlax!, city, mockContext as NpcInteractionContext);
    expect(lastDialoguePages[0]).toContain('SNORLAX is snoring peacefully');
  });

  // Assertion 10: Router registration check and dialogue macro sanitization
  it('10. should register all Fast Ship & Vermilion handlers in router with zero raw macros', () => {
    const router = createDefaultNpcInteractionRouter();
    expect(router).toBeDefined();

    const registrations = getFastShipAndVermilionInteractions();
    expect(registrations.length).toBeGreaterThanOrEqual(8);

    const npcsByMap = createNpcsByMap();
    const allNpcs = [
      ...(npcsByMap['vermilion_city'] || []),
      ...(npcsByMap['vermilion_port'] || []),
      ...(npcsByMap['fast_ship_1f'] || []),
      ...(npcsByMap['fast_ship_cabins_se_sse_captains_cabin'] || []),
    ];

    for (const npc of allNpcs) {
      if (npc.dialoguePages) {
        for (const page of npc.dialoguePages) {
          expect(page).not.toContain('#MON');
          expect(page).not.toContain('<PLAYER>');
          expect(page).not.toContain('<RIVAL>');
        }
      }
    }
  });
});
