import { describe, it, expect } from 'vitest';
import { SaveManager, type SaveData, STARTER_LINEAGE_MAP } from '../src/core/SaveManager';
import { MissionManager } from '../src/world/MissionManager';
import { resolveElmLabDialogue } from '../src/world/npcData';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';

describe('GitHub Issue #26: Legacy Save Starter & Mission M01/M02 Auto-Reconciliation', () => {
  const createLegacySave = (
    speciesId: string = 'cyndaquil',
    level: number = 9,
    storyFlags: string[] = []
  ): SaveData => {
    const starter = PokemonFactory.create(speciesId, level);
    return {
      version: 1,
      timestamp: Date.now(),
      player: {
        name: 'GOLD',
        gender: 'BOY',
        mapId: 'elms_lab',
        x: 6,
        y: 4,
        direction: 'UP',
        speedMultiplier: 3,
        badges: [],
        money: 3000,
      },
      party: [starter],
      box: [],
      inventory: {
        balls: { 'poke-ball': 5 },
        tms: [],
      },
      roamers: [],
      defeatedTrainers: [],
      storyFlags,
      seenSpecies: [speciesId],
      options: SaveManager.getDefaultOptions(),
    };
  };

  it('1. Reconciles legacy save with Cyndaquil Lv. 9 at Elm Lab on SaveManager loadGame()', async () => {
    const saveManager = new SaveManager();
    const legacySave = createLegacySave('cyndaquil', 9, []);

    // Save into in-memory store
    await saveManager.saveGame(legacySave);

    // Load back and verify auto-reconciliation
    const loaded = await saveManager.loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.storyFlags).toBeDefined();
    expect(loaded?.storyFlags).toContain('starter_chosen');
    expect(loaded?.storyFlags).toContain('starter_cyndaquil');
  });

  it('2. Synchronously reconciles starter flags via SaveManager.reconcileStarterFlags', () => {
    const legacySave = createLegacySave('totodile', 5, []);
    SaveManager.reconcileStarterFlags(legacySave);

    expect(legacySave.storyFlags).toContain('starter_chosen');
    expect(legacySave.storyFlags).toContain('starter_totodile');
    expect(legacySave.storyFlags).not.toContain('starter_cyndaquil');
  });

  it('3. Reconciles mission progression from M01 Step 0 to Step 1, unlocking M02, S03, and S04', () => {
    const missionManager = new MissionManager();
    const storyFlags = new Set<string>();
    const party = [PokemonFactory.create('cyndaquil', 9)];

    // Before reconciliation: M01 is at step 0 (incomplete), M02 is LOCKED
    const m01Before = missionManager.getMission('M01');
    const m02Before = missionManager.getMission('M02');
    const s03Before = missionManager.getMission('S03');
    const s04Before = missionManager.getMission('S04');

    expect(m01Before?.status).toBe('ACTIVE');
    expect(m01Before?.currentStepIndex).toBe(0);
    expect(m01Before?.steps[0].completed).toBe(false);
    expect(m02Before?.status).toBe('LOCKED');
    expect(s03Before?.status).toBe('LOCKED');
    expect(s04Before?.status).toBe('LOCKED');

    // Reconcile starter state
    const result = missionManager.reconcileStarterState(party, storyFlags);

    expect(storyFlags.has('starter_chosen')).toBe(true);
    expect(storyFlags.has('starter_cyndaquil')).toBe(true);

    // M01 Step 0 (m01_step_1: "Choose your partner Pokémon...") is now completed
    const m01After = missionManager.getMission('M01');
    expect(m01After?.steps[0].completed).toBe(true);
    expect(m01After?.currentStepIndex).toBe(1);

    // M02, S03, and S04 are unlocked into ACTIVE status
    const m02After = missionManager.getMission('M02');
    const s03After = missionManager.getMission('S03');
    const s04After = missionManager.getMission('S04');

    expect(m02After?.status).toBe('ACTIVE');
    expect(s03After?.status).toBe('ACTIVE');
    expect(s04After?.status).toBe('ACTIVE');

    expect(result.newlyUnlocked.map((m) => m.id)).toContain('M02');
  });

  it('4. Reconciles all 9 evolutionary stages of the 3 Johto starters', () => {
    const testCases: Array<{ species: string; expectedBase: 'cyndaquil' | 'totodile' | 'chikorita' }> = [
      { species: 'chikorita', expectedBase: 'chikorita' },
      { species: 'bayleef', expectedBase: 'chikorita' },
      { species: 'meganium', expectedBase: 'chikorita' },
      { species: 'cyndaquil', expectedBase: 'cyndaquil' },
      { species: 'quilava', expectedBase: 'cyndaquil' },
      { species: 'typhlosion', expectedBase: 'cyndaquil' },
      { species: 'totodile', expectedBase: 'totodile' },
      { species: 'croconaw', expectedBase: 'totodile' },
      { species: 'feraligatr', expectedBase: 'totodile' },
    ];

    for (const tc of testCases) {
      expect(STARTER_LINEAGE_MAP[tc.species]).toBe(tc.expectedBase);

      const flags = new Set<string>();
      const mm = new MissionManager();
      mm.reconcileStarterState([{ speciesId: tc.species }], flags);

      expect(flags.has('starter_chosen')).toBe(true);
      expect(flags.has(`starter_${tc.expectedBase}`)).toBe(true);

      const m01 = mm.getMission('M01');
      expect(m01?.steps[0].completed).toBe(true);
      expect(mm.getMission('M02')?.status).toBe('ACTIVE');
    }
  });

  it('5. Fresh Game Guardrail: Empty party does NOT set starter_chosen and keeps M01 step 0', () => {
    const freshSave: SaveData = {
      version: 1,
      timestamp: Date.now(),
      player: {
        name: 'GOLD',
        gender: 'BOY',
        mapId: 'players_house_2f',
        x: 3,
        y: 3,
        direction: 'DOWN',
        speedMultiplier: 3,
        badges: [],
        money: 3000,
      },
      party: [],
      box: [],
      inventory: { balls: {}, tms: [] },
      roamers: [],
      defeatedTrainers: [],
      storyFlags: [],
    };

    SaveManager.reconcileStarterFlags(freshSave);
    expect(freshSave.storyFlags).not.toContain('starter_chosen');

    const flags = new Set<string>();
    const mm = new MissionManager();
    mm.reconcileStarterState([], flags);

    expect(flags.has('starter_chosen')).toBe(false);
    expect(mm.getMission('M01')?.steps[0].completed).toBe(false);
    expect(mm.getMission('M01')?.currentStepIndex).toBe(0);
    expect(mm.getMission('M02')?.status).toBe('LOCKED');
  });

  it('6. Prof. Elm Dialogue: Resolves post-starter guidance for players owning a partner Pokémon', () => {
    const party = [PokemonFactory.create('cyndaquil', 9)];

    // 1. With starter in party (legacy save prior to flag update)
    const d1 = resolveElmLabDialogue('GOLD', new Set(), party);
    expect(d1.action).toBe('HEAL_AND_SAVE');
    expect(d1.pages[0]).toContain('How is your partner POKéMON doing?');
    expect(d1.pages[1]).toContain('MR. POKéMON lives a bit past CHERRYGROVE CITY on ROUTE 30');

    // 2. Fresh player with no starter
    const dFresh = resolveElmLabDialogue('GOLD', new Set(), []);
    expect(dFresh.action).toBe('PROMPT_STARTER');
    expect(dFresh.pages[2]).toContain('Choose one of the POKéMON in the BALLS on that table');

    // 3. Player with Mystery Egg, post-rival defeat but pre-naming
    const dPolice = resolveElmLabDialogue(
      'GOLD',
      new Set(['starter_chosen', 'HAS_MYSTERY_EGG', 'EVENT_RIVAL_CHERRYGROVE_DEFEATED']),
      party
    );
    expect(dPolice.action).toBe('PROMPT_POLICE');
    expect(dPolice.pages[1]).toContain('Please speak to the POLICE OFFICER first');

    // 4. Mystery Egg delivery
    const dEgg = resolveElmLabDialogue(
      'GOLD',
      new Set(['starter_chosen', 'HAS_MYSTERY_EGG', 'EVENT_RIVAL_CHERRYGROVE_DEFEATED', 'EVENT_RIVAL_NAMED']),
      party
    );
    expect(dEgg.action).toBe('DELIVER_MYSTERY_EGG');
    expect(dEgg.pages[1]).toContain('And you brought the MYSTERY EGG!');

    // 5. Post-Egg delivery Gym journey
    const dGym = resolveElmLabDialogue(
      'GOLD',
      new Set(['starter_chosen', 'EVENT_GAVE_MYSTERY_EGG_TO_ELM']),
      party
    );
    expect(dGym.action).toBe('HEAL_AND_SAVE');
    expect(dGym.pages[1]).toContain('FALKNER, a master of BIRD POKéMON!');
  });

  it('7. OverworldItemManager: Table starter balls filter out player starter once reconciled', () => {
    const reconciledFlags = new Set(['starter_chosen', 'starter_cyndaquil']);
    const balls = OverworldItemManager.getStarterBallsForLab(reconciledFlags, 'cyndaquil');

    // Cyndaquil ball is taken by player; Totodile and Chikorita balls remain on table
    expect(balls.some((b) => b.id === 'cyndaquil_ball')).toBe(false);
    expect(balls.some((b) => b.id === 'totodile_ball')).toBe(true);
    expect(balls.some((b) => b.id === 'chikorita_ball')).toBe(true);
  });
});
