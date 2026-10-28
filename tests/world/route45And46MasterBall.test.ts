import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getRoute45And46Interactions,
  handleRoute46GateOfficer,
  handleRoute46GateYoungster,
  handleRoute45And46Trainer,
} from '../../src/world/interactions/Route45And46Interactions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { resolveElmLabDialogue } from '../../src/world/npcs/npcShared';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import { getEarlyJohtoQuestInteractions } from '../../src/world/interactions/EarlyJohtoQuestInteractions';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-WORLD-ROUTE45-46-AND-MASTER-BALL-01: Route 45/46 Ledges, 11 Trainers, Gatehouse & Master Ball', () => {
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
      playerParty: [PokemonFactory.create('feraligatr', 45, ['surf', 'bite', 'slash', 'icepunch'])],
      player: {
        id: 'player',
        x: 10,
        y: 16,
        targetX: 10,
        targetY: 16,
        renderX: 10 * 64,
        renderY: 16 * 64,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      inventory: {
        money: 50000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'],
        items: [],
        keyItems: [],
        balls: { 'poke-ball': 10 },
        tms: ['TM24'],
      },
      storyFlags: new Set<string>(['starter_chosen', 'has_rising_badge']),
      defeatedTrainers: new Set<string>(),
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
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
      healPlayerParty: () => {
        // Mock heal
      },
      playFieldRestAnimation: () => {
        // Mock field rest
      },
      missionManager: {
        checkStoryFlags: () => {},
        reconcileStarterState: () => {},
      } as any,
      buildTrainerTeamInstances: (entity: any) => {
        return (entity.trainerTeam || []).map((spec: any) =>
          PokemonFactory.create(spec.speciesId, spec.level, spec.moves)
        );
      },
      triggerBattle: (enemy: any, options: any) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = options;
      },
      handleTrainerDefeatRewards: (entity: any) => {
        if (entity.trainerId) mockContext.defeatedTrainers?.add(entity.trainerId);
      },
    };
  });

  // 1. Map schemas and collision grid assertions
  it('1. verifies map schemas and dimensions for Route 45, Route 46 and Route 29/46 Gate', () => {
    const r45 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_45.json'), 'utf8'));
    const r46 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_46.json'), 'utf8'));
    const gate = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_29_route_46_gate.json'), 'utf8'));

    expect(r45.width).toBe(20);
    expect(r45.height).toBe(90);
    expect(r45.collisionGrid.length).toBe(20 * 90);

    expect(r46.width).toBe(20);
    expect(r46.height).toBe(36);
    expect(r46.collisionGrid.length).toBe(20 * 36);

    expect(gate.width).toBe(10);
    expect(gate.height).toBe(8);
    expect(gate.collisionGrid.length).toBe(10 * 8);
  });

  // 2. Reciprocal warps between Route 29, gatehouse, and Route 46
  it('2. asserts reciprocal warps between Route 29, Route 29/46 Gatehouse, and Route 46', () => {
    const r29 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_29.json'), 'utf8'));
    const r46 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_46.json'), 'utf8'));
    const gate = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_29_route_46_gate.json'), 'utf8'));

    const warpFrom29 = r29.warps.find((w: any) => w.targetMapId === 'route_29_route_46_gate');
    expect(warpFrom29).toBeDefined();
    expect(warpFrom29.x).toBe(27);
    expect(warpFrom29.y).toBe(1);

    const warpsFrom46 = r46.warps.filter((w: any) => w.targetMapId === 'route_29_route_46_gate');
    expect(warpsFrom46.length).toBe(2);
    expect(warpsFrom46.some((w: any) => w.x === 7 && w.y === 33)).toBe(true);
    expect(warpsFrom46.some((w: any) => w.x === 8 && w.y === 33)).toBe(true);

    const warpsTo46 = gate.warps.filter((w: any) => w.targetMapId === 'route_46');
    expect(warpsTo46.length).toBe(2);
    expect(warpsTo46.some((w: any) => w.x === 4 && w.y === 0)).toBe(true);
    expect(warpsTo46.some((w: any) => w.x === 5 && w.y === 0)).toBe(true);

    const warpsTo29 = gate.warps.filter((w: any) => w.targetMapId === 'route_29');
    expect(warpsTo29.length).toBe(2);
    expect(warpsTo29.some((w: any) => w.x === 4 && w.y === 7)).toBe(true);
    expect(warpsTo29.some((w: any) => w.x === 5 && w.y === 7)).toBe(true);
  });

  // 3. 100% of NPCs stand on walkable tiles (0 or 2)
  it('3. ensures 100% of NPCs across Route 45, Route 46, and Route 29/46 Gate stand on walkable tiles (collision 0)', () => {
    const npcsByMap = createMahoganyToIndigoNpcs();
    const r45 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_45.json'), 'utf8'));
    const r46 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_46.json'), 'utf8'));
    const gate = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_29_route_46_gate.json'), 'utf8'));

    // Route 45 NPCs (8 trainers)
    const r45Npcs = npcsByMap.route_45 || [];
    expect(r45Npcs.length).toBe(8);
    for (const npc of r45Npcs) {
      const tileCol = r45.collisionGrid[npc.y * r45.width + npc.x];
      expect(tileCol).toBe(0);
    }

    // Route 46 NPCs (3 trainers)
    const r46Npcs = npcsByMap.route_46 || [];
    expect(r46Npcs.length).toBe(3);
    for (const npc of r46Npcs) {
      const tileCol = r46.collisionGrid[npc.y * r46.width + npc.x];
      expect(tileCol).toBe(0);
    }

    // Gatehouse NPCs (2 civilians)
    const gateNpcs = npcsByMap.route_29_route_46_gate || [];
    expect(gateNpcs.length).toBe(2);
    for (const npc of gateNpcs) {
      const tileCol = gate.collisionGrid[npc.y * gate.width + npc.x];
      expect(tileCol).toBe(0);
    }
  });

  // 4. Route 45 & 46 ledge tile mechanics
  it('4. verifies ledge tile occurrences in Route 45 and Route 46 (type 4 DOWN, type 6 LEFT)', () => {
    const r45 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_45.json'), 'utf8'));
    const r46 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_46.json'), 'utf8'));

    const r45DownLedges = r45.collisionGrid.filter((tile: number) => tile === 4);
    const r45LeftLedges = r45.collisionGrid.filter((tile: number) => tile === 6);
    expect(r45DownLedges.length).toBeGreaterThanOrEqual(50);
    expect(r45LeftLedges.length).toBeGreaterThanOrEqual(5);

    const r46DownLedges = r46.collisionGrid.filter((tile: number) => tile === 4);
    const r46LeftLedges = r46.collisionGrid.filter((tile: number) => tile === 6);
    expect(r46DownLedges.length).toBeGreaterThanOrEqual(10);
    expect(r46LeftLedges.length).toBeGreaterThanOrEqual(3);
  });

  // 5. 11 Canonical Trainers definition & rosters
  it('5. defines all 11 canonical trainers with valid rosters, movesets, and dialogues', () => {
    const npcsByMap = createMahoganyToIndigoNpcs();
    const all11Trainers = [...(npcsByMap.route_45 || []), ...(npcsByMap.route_46 || [])];
    expect(all11Trainers.length).toBe(11);

    const expectedTrainers = [
      'hiker_erik',
      'hiker_michael',
      'hiker_parry',
      'hiker_timothy',
      'blackbelt_kenji',
      'cooltrainer_m_ryan',
      'cooltrainer_f_kelly',
      'camper_quentin',
      'hiker_bailey',
      'camper_ted',
      'picnicker_erin',
    ];

    for (const trainerId of expectedTrainers) {
      const npc = all11Trainers.find((n) => n.trainerId === trainerId);
      expect(npc).toBeDefined();
      expect(npc?.action).toBe('TRAINER_BATTLE');
      expect(npc?.challengePages?.length).toBeGreaterThan(0);
      expect(npc?.pages?.length).toBeGreaterThan(0);
      expect(npc?.trainerTeam?.length).toBeGreaterThan(0);
      for (const mon of npc?.trainerTeam || []) {
        expect(mon.speciesId).toBeTruthy();
        expect(mon.level).toBeGreaterThan(0);
        expect(mon.moves?.length).toBeGreaterThan(0);
      }
    }
  });

  // 6. Signposts and overworld items in Route 45 and Route 46
  it('6. verifies Route 45 and Route 46 signposts and registered overworld items', () => {
    const r45 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_45.json'), 'utf8'));
    const r46 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_46.json'), 'utf8'));
    const itemsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/overworld_items.json'), 'utf8'));

    // Route 45 signpost at (10, 4)
    const r45Sign = r45.bgEvents.find((bg: any) => bg.x === 10 && bg.y === 4);
    expect(r45Sign).toBeDefined();
    expect(r45Sign.pages[0]).toContain('ROUTE 45');

    // Route 46 signpost at (9, 27)
    const r46Sign = r46.bgEvents.find((bg: any) => bg.x === 9 && bg.y === 27);
    expect(r46Sign).toBeDefined();
    expect(r46Sign.pages[0]).toContain('ROUTE 46');

    // Overworld items on Route 45 and Route 46
    const r45Items = itemsData.byMap['route_45'];
    const r46Items = itemsData.byMap['route_46'];
    expect(r45Items.itemBalls.length).toBeGreaterThanOrEqual(4);
    expect(r46Items.itemBalls.length).toBeGreaterThanOrEqual(1);
    expect(r45Items.fruitTrees.length).toBeGreaterThanOrEqual(1);
    expect(r46Items.fruitTrees.length).toBeGreaterThanOrEqual(2);
  });

  // 7. Prof. Elm Pokégear call state evaluation
  it('7. evaluates Prof. Elm Pokégear call condition upon acquiring Rising Badge', () => {
    const flagsBefore = new Set<string>(['starter_chosen']);
    expect(flagsBefore.has('has_rising_badge') && !flagsBefore.has('ELM_CALLED_MASTER_BALL')).toBe(false);

    const flagsAfter = new Set<string>(['starter_chosen', 'has_rising_badge']);
    expect(flagsAfter.has('has_rising_badge') && !flagsAfter.has('ELM_CALLED_MASTER_BALL')).toBe(true);

    flagsAfter.add('ELM_CALLED_MASTER_BALL');
    expect(flagsAfter.has('has_rising_badge') && !flagsAfter.has('ELM_CALLED_MASTER_BALL')).toBe(false);
  });

  // 8. Prof. Elm resolves Master Ball grant when Rising Badge acquired
  it('8. resolveElmLabDialogue returns GIVE_MASTER_BALL when player holds Rising Badge', () => {
    const flags = new Set<string>(['starter_chosen', 'has_rising_badge']);
    const dialogue = resolveElmLabDialogue('Gold', flags, [{ speciesId: 'feraligatr' }]);

    expect(dialogue.action).toBe('GIVE_MASTER_BALL');
    expect(dialogue.pages.some((p) => p.includes('MASTER BALL'))).toBe(true);
    expect(dialogue.pages.some((p) => p.includes('ROUTE 27 and TOHJO FALLS'))).toBe(true);
  });

  // 9. EarlyJohtoQuestInteractions handles GIVE_MASTER_BALL, increments balls and sets flag
  it('9. elm_npc interaction executes GIVE_MASTER_BALL, awards master-ball, sets EVENT_GOT_MASTER_BALL_FROM_ELM, and saves', () => {
    const earlyInteractions = getEarlyJohtoQuestInteractions();
    const elmRegistration = earlyInteractions.find((r) => r.npcIds?.includes('elm_npc'));
    expect(elmRegistration).toBeDefined();

    mockContext.storyFlags?.add('has_rising_badge');
    expect(mockContext.inventory?.balls['master-ball']).toBeUndefined();

    const handled = elmRegistration?.handler(
      { id: 'elm_npc', x: 5, y: 2, speaker: '🔬 PROF. ELM' } as any,
      { id: 'elms_lab' } as any,
      mockContext as NpcInteractionContext
    );

    expect(handled).toBe(true);
    expect(mockContext.storyFlags?.has('EVENT_GOT_MASTER_BALL_FROM_ELM')).toBe(true);
    expect(mockContext.inventory?.balls['master-ball']).toBe(1);
    expect(savedGameCalled).toBe(true);
    expect(lastToastMessage).toContain('MASTER BALL');
  });

  // 10. Repeated interaction with Elm post-reward heals party and guides to Tohjo Falls / Kanto
  it('10. resolveElmLabDialogue provides HEAL_AND_SAVE with Tohjo Falls guidance on subsequent visits', () => {
    const flags = new Set<string>(['starter_chosen', 'has_rising_badge', 'EVENT_GOT_MASTER_BALL_FROM_ELM']);
    const dialogue = resolveElmLabDialogue('Gold', flags, [{ speciesId: 'feraligatr' }]);

    expect(dialogue.action).toBe('HEAL_AND_SAVE');
    expect(dialogue.pages.some((p) => p.includes('Have you used the MASTER BALL yet?'))).toBe(true);
    expect(dialogue.pages.some((p) => p.includes('TOHJO FALLS'))).toBe(true);
  });

  // 11. Negative invariant: Elm withholds Master Ball if player lacks Rising Badge
  it('11. negative invariant: Elm does not give Master Ball if player does not possess Rising Badge', () => {
    const flags = new Set<string>(['starter_chosen', 'EVENT_GAVE_MYSTERY_EGG_TO_ELM']);
    const dialogue = resolveElmLabDialogue('Gold', flags, [{ speciesId: 'feraligatr' }]);

    expect(dialogue.action).not.toBe('GIVE_MASTER_BALL');
    expect(dialogue.pages.some((p) => p.includes('MASTER BALL'))).toBe(false);
  });

  // 12. Gatehouse Officer and Youngster interactive dialogues
  it('12. verifies interactive dialogues for Route 29/46 Gatehouse Officer and Youngster', () => {
    const officerHandled = handleRoute46GateOfficer(
      { id: 'route_29_route_46_gate_officer', speaker: '👮 OFFICER' } as any,
      { id: 'route_29_route_46_gate' } as any,
      mockContext as NpcInteractionContext
    );
    expect(officerHandled).toBe(true);
    expect(lastDialoguePages[0]).toContain('ROUTE 45 and 46 can only be traversed one-way downhill');
    expect(lastSpeaker).toBe('👮 OFFICER');

    const youngsterHandled = handleRoute46GateYoungster(
      { id: 'route_29_route_46_gate_youngster', speaker: '👦 BOY' } as any,
      { id: 'route_29_route_46_gate' } as any,
      mockContext as NpcInteractionContext
    );
    expect(youngsterHandled).toBe(true);
    expect(lastDialoguePages[0]).toContain('If you jump down ledges, you cannot get back up');
    expect(lastSpeaker).toBe('👦 BOY');
  });

  // 13. Trainer battle trigger and victory / defeat rewards flow
  it('13. handleRoute45And46Trainer triggers battle when undefeated and speaks defeat dialogue once defeated', () => {
    const npcsByMap = createMahoganyToIndigoNpcs();
    const erik = npcsByMap.route_45?.find((n) => n.id === 'route_45_hiker_erik');
    expect(erik).toBeDefined();

    // First interaction: triggers battle
    const battleTriggered = handleRoute45And46Trainer(
      erik!,
      { id: 'route_45' } as any,
      mockContext as NpcInteractionContext
    );
    expect(battleTriggered).toBe(true);
    expect(triggeredBattleEnemy).toBeDefined();
    expect(triggeredBattleOptions?.isTrainer).toBe(true);
    expect(triggeredBattleOptions?.trainerName).toBe('Hiker Erik');
    expect(mockContext.defeatedTrainers?.has('hiker_erik')).toBe(true);

    // Second interaction: speaks defeat dialogue
    const postBattleHandled = handleRoute45And46Trainer(
      erik!,
      { id: 'route_45' } as any,
      mockContext as NpcInteractionContext
    );
    expect(postBattleHandled).toBe(true);
    expect(lastDialoguePages[0]).toContain('Beaten by an energetic youngster');
  });

  // 14. Default router routes to Route 45 and Route 46 interactions
  it('14. createDefaultNpcInteractionRouter dispatches interactions for Route 45 and Route 46', () => {
    const router = createDefaultNpcInteractionRouter();

    const gateOfficerHandled = router.dispatch(
      { id: 'route_29_route_46_gate_officer', action: 'ROUTE_46_GATE_OFFICER', speaker: '👮 OFFICER' } as any,
      { id: 'route_29_route_46_gate' } as any,
      mockContext as NpcInteractionContext
    );
    expect(gateOfficerHandled).toBe(true);

    const gateYoungsterHandled = router.dispatch(
      { id: 'route_29_route_46_gate_youngster', action: 'ROUTE_46_GATE_YOUNGSTER', speaker: '👦 BOY' } as any,
      { id: 'route_29_route_46_gate' } as any,
      mockContext as NpcInteractionContext
    );
    expect(gateYoungsterHandled).toBe(true);

    const npcsByMap = createMahoganyToIndigoNpcs();
    const erik = npcsByMap.route_45?.find((n) => n.id === 'route_45_hiker_erik');
    const trainerHandled = router.dispatch(
      erik!,
      { id: 'route_45' } as any,
      mockContext as NpcInteractionContext
    );
    expect(trainerHandled).toBe(true);
  });
});
