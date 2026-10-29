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
  getFastShipAndVermilionInteractions,
} from '../../src/world/interactions/FastShipAndVermilionInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { createNpcsByMap } from '../../src/world/npcData';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-WORLD-SS-AQUA-VERMILION-01: S.S. Aqua Voyage, Fast Ship Lost Granddaughter Quest & Vermilion City Arrival', () => {
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
    // Inflict damage, depleted PP, and status on party to test healing
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
        mockContext.inventory!.items[itemId] = (mockContext.inventory!.items[itemId] || 0) + 1;
      }),
    };
  });

  // Assertion 1: Should require S.S. Ticket to pass Olivine Port barrier
  it('1. should require S.S. Ticket to pass Olivine Port barrier', () => {
    const guardNpc: any = { id: 'port_sailor_guard', x: 7, y: 15, speaker: '⚓ SAILOR' };
    const handled = handlePortSailorGuard(guardNpc, {} as any, mockContext as NpcInteractionContext);

    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain("you're not allowed onto the pier without an S.S. TICKET");
    expect(guardNpc.x).toBe(7); // Remains blocking
    expect(mockContext.storyFlags!.has('port_barrier_cleared')).toBe(false);
  });

  // Assertion 2: Should allow boarding S.S. Aqua when player has ss-ticket or hall_of_fame_inducted
  it('2. should allow boarding S.S. Aqua when player has ss-ticket or hall_of_fame_inducted', () => {
    mockContext.storyFlags!.add('hall_of_fame_inducted');
    const guardNpc: any = { id: 'port_sailor_guard', x: 7, y: 15, speaker: '⚓ SAILOR' };
    const handled = handlePortSailorGuard(guardNpc, {} as any, mockContext as NpcInteractionContext);

    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain('Welcome aboard the FAST SHIP S.S. AQUA');
    expect(guardNpc.x).toBe(6); // Stepped aside
    expect(mockContext.storyFlags!.has('port_barrier_cleared')).toBe(true);

    // Also test with inventory items['ss-ticket']
    mockContext.storyFlags!.delete('hall_of_fame_inducted');
    mockContext.inventory!.items['ss-ticket'] = 1;
    const guardNpc2: any = { id: 'port_sailor_guard', x: 7, y: 15, speaker: '⚓ SAILOR' };
    handlePortSailorGuard(guardNpc2, {} as any, mockContext as NpcInteractionContext);
    expect(guardNpc2.x).toBe(6);
  });

  // Assertion 3: Should heal party upon resting in S.S. Aqua cabin bed
  it('3. should heal party upon resting in S.S. Aqua cabin bed', () => {
    const bedNpc: any = { id: 'bed', x: 2, y: 1, speaker: '🛏️ CABIN BED' };
    handleFastShipCabinRest(bedNpc, {} as any, mockContext as NpcInteractionContext);

    expect(mockContext.healPlayerParty).toHaveBeenCalled();
    expect(restAnimationCalled).toBe(true);
    expect(mockContext.playerParty![0].currentHp).toBe(mockContext.playerParty![0].stats.hp);
    expect(mockContext.playerParty![0].status).toBeUndefined();
    expect(mockContext.playerParty![0].moves![0].currentPp).toBe(mockContext.playerParty![0].moves![0].maxPp);
    expect(mockContext.saveCurrentGame).toHaveBeenCalled();
  });

  // Assertion 4: Should trigger Grandpa quest and track lost granddaughter in Captain's Cabin
  it('4. should trigger Grandpa quest and track lost granddaughter in Captain\'s Cabin', () => {
    const grandpaNpc: any = { id: 'fast_ship_1f_gentleman_3', x: 19, y: 6, speaker: '👴 WORRIED GENTLEMAN' };
    handleFastShipGrandpa(grandpaNpc, {} as any, mockContext as NpcInteractionContext);
    expect(lastDialoguePages[0]).toContain('Where did my little granddaughter wander off to?');

    const granddaughterNpc: any = { id: 'fast_ship_cabins_se_sse_captains_cabin_twin_2', x: 2, y: 25, speaker: '👧 LITTLE GIRL' };
    handleFastShipGranddaughter(granddaughterNpc, {} as any, mockContext as NpcInteractionContext);
    expect(lastDialoguePages[0]).toContain("I'm playing with the Captain");
    expect(mockContext.storyFlags!.has('granddaughter_found')).toBe(true);

    const captainNpc: any = { id: 'fast_ship_cabins_se_sse_captains_cabin_gentleman_0', x: 2, y: 17, speaker: '👨‍✈️ SHIP CAPTAIN' };
    handleFastShipCaptain(captainNpc, {} as any, mockContext as NpcInteractionContext);
    expect(lastDialoguePages[0]).toContain('I was just keeping this little girl entertained');
  });

  // Assertion 5: Should award metal_coat upon returning granddaughter to Grandpa
  it('5. should award metal_coat upon returning granddaughter to Grandpa', () => {
    mockContext.storyFlags!.add('granddaughter_found');
    const grandpaNpc: any = { id: 'fast_ship_1f_gentleman_3', x: 19, y: 6, speaker: '👴 WORRIED GENTLEMAN' };
    handleFastShipGrandpa(grandpaNpc, {} as any, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('got_metal_coat')).toBe(true);
    expect(mockContext.storyFlags!.has('granddaughter_returned')).toBe(true);
    expect(mockContext.storyFlags!.has('fast_ship_arrived_vermilion')).toBe(true);
    expect(mockContext.inventory!.items['metal_coat']).toBeGreaterThanOrEqual(1);
    expect(lastDialoguePages[1]).toContain('FAST SHIP S.S. AQUA has arrived in VERMILION CITY');
  });

  // Assertion 6: Should set fast_ship_arrived_vermilion and unlock exit warp at (25, 1)
  it('6. should set fast_ship_arrived_vermilion and unlock exit warp at (25, 1)', () => {
    const sailorNpc: any = { id: 'fast_ship_1f_sailor_0', x: 25, y: 2, speaker: '⚓ SAILOR' };

    // Before arrival: sailor blocks exit
    handleFastShipSailorExit(sailorNpc, {} as any, mockContext as NpcInteractionContext);
    expect(sailorNpc.x).toBe(25);
    expect(lastDialoguePages[0]).toContain('is en route to VERMILION CITY');

    // After arrival: sailor steps aside to x = 24
    mockContext.storyFlags!.add('fast_ship_arrived_vermilion');
    handleFastShipSailorExit(sailorNpc, {} as any, mockContext as NpcInteractionContext);
    expect(sailorNpc.x).toBe(24);
    expect(lastDialoguePages[0]).toContain('has arrived in VERMILION CITY');
  });

  // Assertion 7: Should warp player to vermilion_port (7, 18)
  it('7. should warp player to vermilion_port (7, 18)', () => {
    const fastShip1fPath = path.join(mapsDir, 'fast_ship_1f.json');
    const fastShip1f: MapData = JSON.parse(fs.readFileSync(fastShip1fPath, 'utf8'));

    const exitWarp = fastShip1f.warps.find((w) => w.x === 25 && w.y === 1);
    expect(exitWarp).toBeDefined();
    expect(exitWarp!.targetMapId).toBe('vermilion_port');
    expect(exitWarp!.targetX).toBe(7);
    expect(exitWarp!.targetY).toBe(18);

    // Verify target landing tile at vermilion_port (7, 18) is walkable
    const vermilionPortPath = path.join(mapsDir, 'vermilion_port.json');
    const vermilionPort: MapData = JSON.parse(fs.readFileSync(vermilionPortPath, 'utf8'));
    const landingTileCollision = vermilionPort.collisionGrid[18 * vermilionPort.width + 7];
    expect(landingTileCollision).toBe(0);
  });

  // Assertion 8: Should connect vermilion_port through vermilion_port_passage into vermilion_city
  it('8. should connect vermilion_port through vermilion_port_passage into vermilion_city', () => {
    const portPath = path.join(mapsDir, 'vermilion_port.json');
    const passagePath = path.join(mapsDir, 'vermilion_port_passage.json');
    const cityPath = path.join(mapsDir, 'vermilion_city.json');

    const port: MapData = JSON.parse(fs.readFileSync(portPath, 'utf8'));
    const passage: MapData = JSON.parse(fs.readFileSync(passagePath, 'utf8'));
    const city: MapData = JSON.parse(fs.readFileSync(cityPath, 'utf8'));

    // Port to passage warp
    const portToPassage = port.warps.find((w) => w.targetMapId === 'vermilion_port_passage');
    expect(portToPassage).toBeDefined();
    expect(portToPassage!.x).toBe(9);
    expect(portToPassage!.y).toBe(5);

    // Passage to city warp
    const passageToCity = passage.warps.find((w) => w.targetMapId === 'vermilion_city');
    expect(passageToCity).toBeDefined();
    expect(passageToCity!.targetX).toBeGreaterThanOrEqual(19);
    expect(passageToCity!.targetY).toBe(30);

    // City to passage reciprocal warps
    const cityToPassage = city.warps.filter((w) => w.targetMapId === 'vermilion_port_passage');
    expect(cityToPassage.length).toBeGreaterThanOrEqual(2);
    expect(cityToPassage[0].y).toBe(31);
  });

  // Assertion 9: Should verify all Vermilion City NPCs stand on strictly walkable tiles
  it('9. should verify all Vermilion City NPCs stand on strictly walkable tiles', () => {
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

  // Assertion 10: Should assert Sleeping Snorlax blocks Diglett's Cave entrance
  it('10. should assert Sleeping Snorlax blocks Diglett\'s Cave entrance', () => {
    const cityPath = path.join(mapsDir, 'vermilion_city.json');
    const city: MapData = JSON.parse(fs.readFileSync(cityPath, 'utf8'));

    // Diglett's Cave warp is at (34, 7)
    const diglettsCaveWarp = city.warps.find((w) => w.targetMapId === 'digletts_cave');
    expect(diglettsCaveWarp).toBeDefined();
    expect(diglettsCaveWarp!.x).toBe(34);
    expect(diglettsCaveWarp!.y).toBe(7);

    // Snorlax is placed at (34, 8) directly blocking the entrance row
    const npcsByMap = createNpcsByMap();
    const snorlax = npcsByMap['vermilion_city'].find((n) => n.id === 'vermilion_city_snorlax');
    expect(snorlax).toBeDefined();
    expect(snorlax!.x).toBe(34);
    expect(snorlax!.y).toBe(8);

    // Snorlax interaction dialogue
    handleSleepingSnorlax(snorlax!, city, mockContext as NpcInteractionContext);
    expect(lastDialoguePages[0]).toContain('SNORLAX is snoring peacefully');
    expect(lastDialoguePages[1]).toContain('A POKéGEAR broadcast might wake it up');
  });

  // Assertion 11: Should verify presence rules in isNpcActiveForStoryFlags for granddaughter and grandpa
  it('11. should verify presence rules in isNpcActiveForStoryFlags for granddaughter and grandpa', () => {
    const flags = new Set<string>();

    // Initial state: granddaughter in Captain's room, grandpa on 1F, cabin versions inactive
    expect(isNpcActiveForStoryFlags('fast_ship_cabins_se_sse_captains_cabin_twin_2', flags)).toBe(true);
    expect(isNpcActiveForStoryFlags('fast_ship_1f_gentleman_3', flags)).toBe(true);
    expect(isNpcActiveForStoryFlags('fast_ship_cabins_se_sse_captains_cabin_twin_cabin', flags)).toBe(false);
    expect(isNpcActiveForStoryFlags('fast_ship_cabins_se_sse_captains_cabin_gentleman_cabin', flags)).toBe(false);

    // After granddaughter found: moved to cabin
    flags.add('granddaughter_found');
    expect(isNpcActiveForStoryFlags('fast_ship_cabins_se_sse_captains_cabin_twin_2', flags)).toBe(false);
    expect(isNpcActiveForStoryFlags('fast_ship_1f_gentleman_3', flags)).toBe(false);
    expect(isNpcActiveForStoryFlags('fast_ship_cabins_se_sse_captains_cabin_twin_cabin', flags)).toBe(true);
    expect(isNpcActiveForStoryFlags('fast_ship_cabins_se_sse_captains_cabin_gentleman_cabin', flags)).toBe(true);
  });

  // Assertion 12: Router registration check and dialogue macro sanitization
  it('12. should register all Fast Ship & Vermilion handlers in default interaction router with zero raw macros', () => {
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
