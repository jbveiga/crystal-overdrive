import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getRoute27AndTohjoFallsInteractions,
  handleFirstStepKantoFisher,
  handleRoute27Sandstorm,
  handleRoute26Heal,
  handleRoute27And26Trainer,
} from '../../src/world/interactions/Route27AndTohjoFallsInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { ModernHMHandler } from '../../src/world/ModernHMHandler';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-WORLD-ROUTE27-TOHJO-FALLS-KANTO-01: Route 27, Tohjo Falls & Route 26 (Kanto Border Crossing)', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let lastToastMessage = '';
  let triggeredBattleEnemy: any = null;
  let triggeredBattleOptions: any = null;
  let healedPartyCalled = false;
  let rewardHandled = false;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    lastToastMessage = '';
    triggeredBattleEnemy = null;
    triggeredBattleOptions = null;
    healedPartyCalled = false;
    rewardHandled = false;

    mockContext = {
      playerName: 'Gold',
      playerParty: [
        PokemonFactory.create('typhlosion', 50, ['flamethrower', 'thunderpunch', 'earthquake', 'quickattack']),
      ],
      player: {
        id: 'player',
        x: 21,
        y: 11,
        targetX: 21,
        targetY: 11,
        renderX: 21 * 64,
        renderY: 11 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 30000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'],
        items: [],
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
      showToast: (msg: string) => {
        lastToastMessage = msg;
      },
      healPlayerParty: (_playAnim?: boolean) => {
        healedPartyCalled = true;
      },
      buildTrainerTeamInstances: (trainer: any) => {
        if (!trainer.trainerTeam) return [];
        return trainer.trainerTeam.map((t: any) => PokemonFactory.create(t.speciesId, t.level, t.moves));
      },
      triggerBattle: async (enemy: any, opts?: any) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = opts;
      },
      handleTrainerDefeatRewards: (_trainer: any) => {
        rewardHandled = true;
      },
    };
  });

  // Test 1: Map Schemas & Dimensions
  it('1. Map schemas and dimensions are valid across Route 27, Sandstorm House, Tohjo Falls, Route 26, Heal House, and Victory Road Gate', () => {
    const r27: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27.json'), 'utf8'));
    const r27House: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27_sandstorm_house.json'), 'utf8'));
    const tohjo: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tohjo_falls.json'), 'utf8'));
    const r26: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26.json'), 'utf8'));
    const r26House: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26_heal_house.json'), 'utf8'));
    const gate: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'victory_road_gate.json'), 'utf8'));

    expect(r27.width).toBe(80);
    expect(r27.height).toBe(18);
    expect(r27House.width).toBe(8);
    expect(r27House.height).toBe(8);
    expect(tohjo.width).toBe(30);
    expect(tohjo.height).toBe(18);
    expect(r26.width).toBe(20);
    expect(r26.height).toBe(108);
    expect(r26House.width).toBe(8);
    expect(r26House.height).toBe(8);
    expect(gate.width).toBe(20);
    expect(gate.height).toBe(18);
  });

  // Test 2: Reciprocal Warps
  it('2. Reciprocal warps exist between all connected maps in the border crossing corridor', () => {
    const r27: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27.json'), 'utf8'));
    const r27House: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27_sandstorm_house.json'), 'utf8'));
    const tohjo: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tohjo_falls.json'), 'utf8'));
    const r26: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26.json'), 'utf8'));
    const r26House: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26_heal_house.json'), 'utf8'));
    const gate: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'victory_road_gate.json'), 'utf8'));

    // Route 27 <-> Sandstorm House
    expect(r27.warps.some((w) => w.targetMapId === 'route_27_sandstorm_house' && w.x === 33 && w.y === 7)).toBe(true);
    expect(r27House.warps.some((w) => w.targetMapId === 'route_27' && w.targetX === 33 && w.targetY === 7)).toBe(true);

    // Route 27 <-> Tohjo Falls (West & East)
    expect(r27.warps.some((w) => w.targetMapId === 'tohjo_falls' && w.x === 26 && w.y === 5)).toBe(true);
    expect(r27.warps.some((w) => w.targetMapId === 'tohjo_falls' && w.x === 36 && w.y === 5)).toBe(true);
    expect(tohjo.warps.some((w) => w.targetMapId === 'route_27' && w.targetX === 26 && w.targetY === 6)).toBe(true);
    expect(tohjo.warps.some((w) => w.targetMapId === 'route_27' && w.targetX === 36 && w.targetY === 6)).toBe(true);

    // Route 26 <-> Heal House
    expect(r26.warps.some((w) => w.targetMapId === 'route_26_heal_house' && w.x === 15 && w.y === 57)).toBe(true);
    expect(r26House.warps.some((w) => w.targetMapId === 'route_26' && w.targetX === 15 && w.targetY === 58)).toBe(true);

    // Route 26 <-> Victory Road Gate
    expect(r26.warps.some((w) => w.targetMapId === 'victory_road_gate' && w.x === 7 && w.y === 5)).toBe(true);
    expect(gate.warps.some((w) => w.targetMapId === 'route_26' && w.targetX === 7 && w.targetY === 6)).toBe(true);
  });

  // Test 3: Signposts (bgEvents)
  it('3. Route 27 and Route 26 bgEvents signposts are present with authentic canon text', () => {
    const r27: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27.json'), 'utf8'));
    const r26: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26.json'), 'utf8'));

    const r27Sign = r27.bgEvents?.find((b) => b.x === 25 && b.y === 7);
    expect(r27Sign).toBeDefined();
    expect(r27Sign?.pages[0]).toContain('TOHJO FALLS');
    expect(r27Sign?.pages[0]).toContain('THE LINK BETWEEN KANTO AND JOHTO');

    const r26Sign = r26.bgEvents?.find((b) => b.x === 8 && b.y === 6);
    expect(r26Sign).toBeDefined();
    expect(r26Sign?.pages[0]).toContain('ROUTE 26');
    expect(r26Sign?.pages[0]).toContain('POKéMON LEAGUE RECEPTION GATE');
  });

  // Test 4: NPC Coordinates & Walkability (100% collision integrity)
  it('4. 100% of all registered NPCs stand on walkable tiles (collision 0 or 2)', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const r27: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27.json'), 'utf8'));
    const r27House: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_27_sandstorm_house.json'), 'utf8'));
    const r26: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26.json'), 'utf8'));
    const r26House: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_26_heal_house.json'), 'utf8'));

    const mapsMap: Record<string, MapData> = {
      route_27: r27,
      route_27_sandstorm_house: r27House,
      route_26: r26,
      route_26_heal_house: r26House,
    };

    for (const [mapId, mapNpcs] of Object.entries(npcs)) {
      if (!mapsMap[mapId]) continue;
      const map = mapsMap[mapId];
      for (const npc of mapNpcs) {
        const idx = npc.y * map.width + npc.x;
        const col = map.collisionGrid[idx];
        expect([0, 2], `NPC ${npc.id} at (${npc.x}, ${npc.y}) on ${mapId} must be on walkable tile (was ${col})`).toContain(col);
      }
    }
  });

  // Test 5: Fisher First Step into Kanto Event
  it('5. Fisher First Step into Kanto triggers, speaks canon dialogue, and sets story flags', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const fisher = npcs.route_27.find((n) => n.id === 'route_27_fisher');
    expect(fisher).toBeDefined();

    expect(mockContext.storyFlags?.has('first_step_into_kanto')).toBe(false);
    expect(mockContext.storyFlags?.has('EVENT_FIRST_STEP_INTO_KANTO')).toBe(false);

    const handled = handleFirstStepKantoFisher(fisher!, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain('Hey! Do you know what you just did?');
    expect(lastDialoguePages[1]).toContain("You've taken your first step into KANTO!");
    expect(mockContext.storyFlags?.has('first_step_into_kanto')).toBe(true);
    expect(mockContext.storyFlags?.has('EVENT_FIRST_STEP_INTO_KANTO')).toBe(true);
    expect(lastToastMessage).toContain('Arrived in the Kanto Region!');
  });

  // Test 6: Fisher First Step idempotency
  it('6. Fisher First Step into Kanto is idempotent on repeat interactions', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const fisher = npcs.route_27.find((n) => n.id === 'route_27_fisher');
    mockContext.storyFlags?.add('first_step_into_kanto');
    mockContext.storyFlags?.add('EVENT_FIRST_STEP_INTO_KANTO');

    lastToastMessage = '';
    const handled = handleFirstStepKantoFisher(fisher!, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain('Hey! Do you know what you just did?');
    // Toast should not re-fire once already set
    expect(lastToastMessage).toBe('');
  });

  // Test 7: Sandstorm House TM37 Gift Event
  it('7. Sandstorm House woman awards TM37 Sandstorm and sets EVENT_GOT_TM37_SANDSTORM', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const woman = npcs.route_27_sandstorm_house.find((n) => n.id === 'route_27_sandstorm_woman');
    expect(woman).toBeDefined();

    expect(mockContext.storyFlags?.has('EVENT_GOT_TM37_SANDSTORM')).toBe(false);
    expect(mockContext.inventory?.tms).not.toContain('TM37_SANDSTORM');

    const handled = handleRoute27Sandstorm(woman!, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[1]).toContain('Take this TM37 SANDSTORM!');
    expect(mockContext.inventory?.tms).toContain('TM37_SANDSTORM');
    expect(mockContext.storyFlags?.has('EVENT_GOT_TM37_SANDSTORM')).toBe(true);
    expect(lastToastMessage).toContain('Received TM37 Sandstorm!');
  });

  // Test 8: Sandstorm House Post-Gift Advice
  it('8. Sandstorm House woman gives tactical Sandstorm advice on subsequent visits without duplicating TM', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const woman = npcs.route_27_sandstorm_house.find((n) => n.id === 'route_27_sandstorm_woman');
    mockContext.storyFlags?.add('EVENT_GOT_TM37_SANDSTORM');
    mockContext.inventory!.tms = ['TM37_SANDSTORM'];

    const countBefore = mockContext.inventory!.tms.filter((t) => t === 'TM37_SANDSTORM').length;
    const handled = handleRoute27Sandstorm(woman!, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(lastDialoguePages[0]).toContain('Sandstorm damages all POKéMON other than Rock, Ground, and Steel types.');
    const countAfter = mockContext.inventory!.tms.filter((t) => t === 'TM37_SANDSTORM').length;
    expect(countAfter).toBe(countBefore);
  });

  // Test 9: Route 26 Heal House Full Party Recovery
  it('9. Route 26 Heal House restores full party HP, status, and PP', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const healWoman = npcs.route_26_heal_house.find((n) => n.id === 'route_26_heal_woman');
    expect(healWoman).toBeDefined();

    // Damage and status the player's Pokémon
    const lead = mockContext.playerParty![0];
    lead.currentHp = 1;
    lead.status = 'psn';
    if (lead.moves) {
      lead.moves[0].currentPp = 0;
    }

    const handled = handleRoute26Heal(healWoman!, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(healedPartyCalled).toBe(true);
    expect(lead.currentHp).toBe(lead.stats.hp);
    expect(lead.status).toBeUndefined();
    expect(lead.moves![0].currentPp).toBe(lead.moves![0].maxPp);
    expect(lastDialoguePages[0]).toContain('Your POKéMON are fully refreshed!');
  });

  // Test 10: Tohjo Falls Waterfall Traversability with Rising Badge & HM07
  it('10. ModernHMHandler.canUseWaterfall validates Waterfall traversal requirements in Tohjo Falls', () => {
    const waterMon = PokemonFactory.create('feraligatr', 45, ['waterfall', 'surf', 'bite', 'slash']);

    // Case A: Has Rising Badge and Pokémon with Waterfall
    const canClimb = ModernHMHandler.canUseWaterfall(
      [waterMon],
      { badges: ['rising'], tms: ['HM07_WATERFALL'] },
      new Set(['has_rising_badge'])
    );
    expect(canClimb.allowed).toBe(true);
    expect(canClimb.canUse).toBe(true);

    // Case B: Missing Rising Badge
    const missingBadge = ModernHMHandler.canUseWaterfall(
      [waterMon],
      { badges: ['zephyr', 'glacier'], tms: ['HM07_WATERFALL'] },
      new Set()
    );
    expect(missingBadge.allowed).toBe(false);
    expect(missingBadge.reason).toContain('RISING BADGE');

    // Case C: Missing HM07 or move on party
    const noWaterMon = PokemonFactory.create('typhlosion', 45, ['flamethrower']);
    const missingHM = ModernHMHandler.canUseWaterfall(
      [noWaterMon],
      { badges: ['rising'], tms: [] },
      new Set(['has_rising_badge'])
    );
    expect(missingHM.allowed).toBe(false);
  });

  // Test 11: 12 Trainers Defined on Route 27 and Route 26
  it('11. All 12 trainers are registered across Route 27 and Route 26 with valid teams and moves', () => {
    const npcs = createMahoganyToIndigoNpcs();
    const r27Trainers = [
      'cooltrainer_m_blake',
      'cooltrainer_m_brian',
      'cooltrainer_f_reena',
      'cooltrainer_f_megan',
      'psychic_gilbert',
      'bird_keeper_jose',
    ];
    const r26Trainers = [
      'cooltrainer_m_jake',
      'cooltrainer_m_gaven',
      'cooltrainer_f_joyce',
      'cooltrainer_f_beth',
      'psychic_richard',
      'fisher_scott',
    ];

    for (const id of r27Trainers) {
      const npc = npcs.route_27.find((n) => n.id === id);
      expect(npc, `Trainer ${id} must exist on Route 27`).toBeDefined();
      expect(npc?.action).toBe('TRAINER_BATTLE');
      expect(npc?.trainerTeam?.length).toBeGreaterThan(0);
      for (const mon of npc!.trainerTeam!) {
        expect(mon.speciesId).toBeTruthy();
        expect(mon.level).toBeGreaterThanOrEqual(30);
        expect(mon.moves?.length).toBeGreaterThan(0);
      }
    }

    for (const id of r26Trainers) {
      const npc = npcs.route_26.find((n) => n.id === id);
      expect(npc, `Trainer ${id} must exist on Route 26`).toBeDefined();
      expect(npc?.action).toBe('TRAINER_BATTLE');
      expect(npc?.trainerTeam?.length).toBeGreaterThan(0);
      for (const mon of npc!.trainerTeam!) {
        expect(mon.speciesId).toBeTruthy();
        expect(mon.level).toBeGreaterThanOrEqual(30);
        expect(mon.moves?.length).toBeGreaterThan(0);
      }
    }
  });

  // Test 12: Trainer Battle Trigger and Defeat Flow
  it('12. Interacting with an undefeated trainer triggers battle and registers defeat on victory', async () => {
    const npcs = createMahoganyToIndigoNpcs();
    const blake = npcs.route_27.find((n) => n.id === 'cooltrainer_m_blake')!;

    expect(mockContext.defeatedTrainers?.has('cooltrainer_m_blake')).toBe(false);

    const handled = handleRoute27And26Trainer(blake, {} as any, mockContext as NpcInteractionContext);
    expect(handled).toBe(true);
    expect(mockContext.defeatedTrainers?.has('cooltrainer_m_blake')).toBe(true);
    expect(triggeredBattleEnemy).toBeDefined();
    expect(triggeredBattleOptions?.isTrainer).toBe(true);
    expect(triggeredBattleOptions?.trainerName).toBe('Cooltrainer Blake');

    // Simulate victory callback
    triggeredBattleOptions.onVictory();
    expect(rewardHandled).toBe(true);

    // Subsequent interaction shows defeat dialogue
    const repeatHandled = handleRoute27And26Trainer(blake, {} as any, mockContext as NpcInteractionContext);
    expect(repeatHandled).toBe(true);
    expect(lastDialoguePages[0]).toContain('My Pokémon and I have trained for the League!');
  });

  // Test 13: Overworld Items in overworld_items.json
  it('13. Overworld items on Route 27, Route 26, and Tohjo Falls are registered in overworld_items.json', () => {
    const itemsData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/overworld_items.json'), 'utf8')
    );

    const r27Items = itemsData.byMap['route_27'];
    expect(r27Items).toBeDefined();
    expect(r27Items.itemBalls.some((i: any) => i.itemId === 'tm_solarbeam' && i.x === 60 && i.y === 12)).toBe(true);
    expect(r27Items.itemBalls.some((i: any) => i.itemId === 'rare_candy' && i.x === 53 && i.y === 12)).toBe(true);

    const r26Items = itemsData.byMap['route_26'];
    expect(r26Items).toBeDefined();
    expect(r26Items.itemBalls.some((i: any) => i.itemId === 'max_elixer' && i.x === 9 && i.y === 15)).toBe(true);
    expect(r26Items.fruitTrees.some((i: any) => i.berryId === 'ice_berry' && i.x === 14 && i.y === 54)).toBe(true);

    const tohjoItems = itemsData.byMap['tohjo_falls'];
    expect(tohjoItems).toBeDefined();
    expect(tohjoItems.itemBalls.some((i: any) => i.itemId === 'moon_stone' && i.x === 2 && i.y === 6)).toBe(true);
  });

  // Test 14: Router Integration & Dispatch
  it('14. NpcInteractionRouter dispatches all Route 27 & Route 26 events cleanly', () => {
    const router = createDefaultNpcInteractionRouter();
    const npcs = createMahoganyToIndigoNpcs();

    const fisher = npcs.route_27.find((n) => n.id === 'route_27_fisher')!;
    const woman = npcs.route_27_sandstorm_house.find((n) => n.id === 'route_27_sandstorm_woman')!;
    const heal = npcs.route_26_heal_house.find((n) => n.id === 'route_26_heal_woman')!;
    const gaven = npcs.route_26.find((n) => n.id === 'cooltrainer_m_gaven')!;

    expect(router.dispatch(fisher, {} as any, mockContext as NpcInteractionContext)).toBe(true);
    expect(router.dispatch(woman, {} as any, mockContext as NpcInteractionContext)).toBe(true);
    expect(router.dispatch(heal, {} as any, mockContext as NpcInteractionContext)).toBe(true);
    expect(router.dispatch(gaven, {} as any, mockContext as NpcInteractionContext)).toBe(true);
  });

  // Test 15: Layer Purity
  it('15. Route27AndTohjoFallsInteractions and mahoganyToIndigoNpcs have ZERO imports from pixi.js or DOM', () => {
    const interactionSrc = fs.readFileSync(
      path.resolve(__dirname, '../../src/world/interactions/Route27AndTohjoFallsInteractions.ts'),
      'utf8'
    );
    const npcsSrc = fs.readFileSync(
      path.resolve(__dirname, '../../src/world/npcs/mahoganyToIndigoNpcs.ts'),
      'utf8'
    );

    for (const [name, code] of [
      ['Route27AndTohjoFallsInteractions.ts', interactionSrc],
      ['mahoganyToIndigoNpcs.ts', npcsSrc],
    ]) {
      expect(code, `${name} must not import pixi.js`).not.toMatch(/from\s+['"]pixi\.js['"]/);
      expect(code, `${name} must not import @pixi/`).not.toMatch(/from\s+['"]@pixi\//);
      expect(code, `${name} must not reference document.`).not.toMatch(/\bdocument\./);
      expect(code, `${name} must not reference window.`).not.toMatch(/\bwindow\./);
    }
  });
});
