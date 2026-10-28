import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import {
  handleIndigoTeleportGramps,
  handleIndigoLeagueGuard,
  handleWillBattle,
  handleKogaBattle,
  handleBrunoBattle,
  handleKarenBattle,
  handleLanceBattle,
  handleHallOfFameEvent,
  handleEliteFourStep,
  getEliteFourAndChampionInteractions,
  WILL_CHALLENGE_DIALOGUE,
  WILL_DEFEAT_DIALOGUE,
  WILL_POST_DEFEAT_DIALOGUE,
  KOGA_CHALLENGE_DIALOGUE,
  BRUNO_CHALLENGE_DIALOGUE,
  KAREN_CHALLENGE_DIALOGUE,
  LANCE_CHALLENGE_DIALOGUE,
  HALL_OF_FAME_INDUCTION_DIALOGUE,
} from '../../src/world/interactions/EliteFourAndChampionInteractions';
import type { MapData } from '../../src/types/game';

describe('TICKET-WORLD-INDIGO-PLATEAU-ELITE-FOUR-03: Indigo Plateau, Elite Four & Champion Lance', () => {
  const root = path.resolve(__dirname, '../..');
  const loadMap = (id: string): MapData =>
    JSON.parse(fs.readFileSync(path.join(root, `public/assets/data/maps/${id}.json`), 'utf8'));

  const lobbyMap = loadMap('indigo_plateau_poke_center');
  const willsMap = loadMap('wills_room');
  const kogasMap = loadMap('kogas_room');
  const brunosMap = loadMap('brunos_room');
  const karensMap = loadMap('karens_room');
  const lancesMap = loadMap('lances_room');
  const hofMap = loadMap('hall_of_fame');

  const npcs = createNpcsByMap();

  it('1. all 7 maps load with authentic dimensions', () => {
    expect(lobbyMap.width).toBe(18);
    expect(lobbyMap.height).toBe(14);
    expect(willsMap.width).toBe(10);
    expect(willsMap.height).toBe(18);
    expect(kogasMap.width).toBe(10);
    expect(kogasMap.height).toBe(18);
    expect(brunosMap.width).toBe(10);
    expect(brunosMap.height).toBe(18);
    expect(karensMap.width).toBe(10);
    expect(karensMap.height).toBe(18);
    expect(lancesMap.width).toBe(10);
    expect(lancesMap.height).toBe(24);
    expect(hofMap.width).toBe(10);
    expect(hofMap.height).toBe(14);
  });

  it('2. reciprocal warps between Lobby, 5 Chambers, and Hall of Fame are complete and valid', () => {
    // Lobby -> Wills Room
    const lobbyToWill = lobbyMap.warps.find((w) => w.targetMapId === 'wills_room');
    expect(lobbyToWill).toBeDefined();
    expect(lobbyToWill?.x).toBe(14);
    expect(lobbyToWill?.y).toBe(3);

    // Wills Room -> Koga
    const willToKoga = willsMap.warps.filter((w) => w.targetMapId === 'kogas_room');
    expect(willToKoga.length).toBeGreaterThanOrEqual(1);

    // Koga -> Bruno
    const kogaToBruno = kogasMap.warps.filter((w) => w.targetMapId === 'brunos_room');
    expect(kogaToBruno.length).toBeGreaterThanOrEqual(1);

    // Bruno -> Karen
    const brunoToKaren = brunosMap.warps.filter((w) => w.targetMapId === 'karens_room');
    expect(brunoToKaren.length).toBeGreaterThanOrEqual(1);

    // Karen -> Lance
    const karenToLance = karensMap.warps.filter((w) => w.targetMapId === 'lances_room');
    expect(karenToLance.length).toBeGreaterThanOrEqual(1);

    // Lance -> Hall of Fame
    const lanceToHof = lancesMap.warps.filter((w) => w.targetMapId === 'hall_of_fame');
    expect(lanceToHof.length).toBeGreaterThanOrEqual(1);

    // Hall of Fame -> Lance
    const hofToLance = hofMap.warps.filter((w) => w.targetMapId === 'lances_room');
    expect(hofToLance.length).toBeGreaterThanOrEqual(1);
  });

  it('3. 100% of NPCs across Lobby, Chambers, and Hall of Fame stand on walkable tile 0', () => {
    const allNpcGroups = [
      { map: lobbyMap, list: npcs.indigo_plateau_poke_center },
      { map: willsMap, list: npcs.wills_room },
      { map: kogasMap, list: npcs.kogas_room },
      { map: brunosMap, list: npcs.brunos_room },
      { map: karensMap, list: npcs.karens_room },
      { map: lancesMap, list: npcs.lances_room },
      { map: hofMap, list: npcs.hall_of_fame },
    ];

    for (const group of allNpcGroups) {
      for (const npc of group.list || []) {
        const col = group.map.collisionGrid[npc.y * group.map.width + npc.x];
        expect(col).toBe(0);
      }
    }
  });

  it('4. Grand Lobby contains Joy, Clerk, Teleport Gramps, Abra, and League Guard', () => {
    const lobbyNpcs = npcs.indigo_plateau_poke_center;
    expect(lobbyNpcs.some((n) => n.id === 'indigo_plateau_nurse')).toBe(true);
    expect(lobbyNpcs.some((n) => n.id === 'indigo_plateau_clerk')).toBe(true);
    expect(lobbyNpcs.some((n) => n.id === 'indigo_teleport_guy')).toBe(true);
    expect(lobbyNpcs.some((n) => n.id === 'indigo_teleport_abra')).toBe(true);
    expect(lobbyNpcs.some((n) => n.id === 'indigo_league_guard')).toBe(true);
  });

  it('5. Teleport Abra Gramps offers and executes warp to New Bark Town (9, 6)', () => {
    let warpedTo: any = null;
    const ctx: any = {
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      executeWarpTransition: vi.fn((warp) => {
        warpedTo = warp;
      }),
      showToast: vi.fn(),
    };

    handleIndigoTeleportGramps({} as any, lobbyMap, ctx);
    expect(warpedTo).toBeDefined();
    expect(warpedTo.targetMapId).toBe('new_bark_town');
    expect(warpedTo.targetX).toBe(9);
    expect(warpedTo.targetY).toBe(6);
  });

  it('6. League Guard blocks passage if player lacks 8 badges or Victory Road Rival defeat', () => {
    let openedDialogue: string[] = [];
    const ctx: any = {
      inventory: { badges: ['zephyr', 'hive'] },
      storyFlags: new Set<string>(),
      openDialogue: vi.fn((p) => {
        openedDialogue = p;
      }),
    };

    handleIndigoLeagueGuard({} as any, lobbyMap, ctx);
    expect(openedDialogue[0]).toContain('You cannot challenge the ELITE FOUR');
  });

  it('7. League Guard welcomes player when prerequisites are met', () => {
    let openedDialogue: string[] = [];
    const ctx: any = {
      inventory: {
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'],
      },
      storyFlags: new Set(['victory_road_rival_defeated']),
      openDialogue: vi.fn((p) => {
        openedDialogue = p;
      }),
    };

    handleIndigoLeagueGuard({} as any, lobbyMap, ctx);
    expect(openedDialogue[0]).toContain('You have earned all 8 JOHTO BADGES');
  });

  it('8. handleEliteFourStep blocks retreat south through entrance doors in all 5 chambers', () => {
    const ctx: any = {
      player: { x: 5, y: 17, isMoving: true },
      storyFlags: new Set<string>(),
      openDialogue: vi.fn(),
    };

    // Wills room entrance
    expect(handleEliteFourStep({ x: 5, y: 17 }, willsMap, ctx)).toBe(true);
    // Koga room entrance
    expect(handleEliteFourStep({ x: 4, y: 17 }, kogasMap, ctx)).toBe(true);
    // Bruno room entrance
    expect(handleEliteFourStep({ x: 5, y: 17 }, brunosMap, ctx)).toBe(true);
    // Karen room entrance
    expect(handleEliteFourStep({ x: 4, y: 17 }, karensMap, ctx)).toBe(true);
    // Lance room entrance
    expect(handleEliteFourStep({ x: 5, y: 23 }, lancesMap, ctx)).toBe(true);
  });

  it('9. handleEliteFourStep seals north exit door until respective E4 member is defeated', () => {
    const ctx: any = {
      player: { x: 4, y: 2, isMoving: true },
      storyFlags: new Set<string>(),
      openDialogue: vi.fn(),
    };

    // Will undefeated
    expect(handleEliteFourStep({ x: 4, y: 2 }, willsMap, ctx)).toBe(true);
    // Koga undefeated
    expect(handleEliteFourStep({ x: 5, y: 2 }, kogasMap, ctx)).toBe(true);
    // Bruno undefeated
    expect(handleEliteFourStep({ x: 4, y: 2 }, brunosMap, ctx)).toBe(true);
    // Karen undefeated
    expect(handleEliteFourStep({ x: 5, y: 2 }, karensMap, ctx)).toBe(true);
    // Lance undefeated
    expect(handleEliteFourStep({ x: 4, y: 1 }, lancesMap, ctx)).toBe(true);
  });

  it('10. handleEliteFourStep allows advance through north exit once defeated', () => {
    const ctx: any = {
      player: { x: 4, y: 2, isMoving: true },
      storyFlags: new Set([
        'will_defeated',
        'koga_defeated',
        'bruno_defeated',
        'karen_defeated',
        'champion_defeated',
      ]),
      openDialogue: vi.fn(),
    };

    expect(handleEliteFourStep({ x: 4, y: 2 }, willsMap, ctx)).toBe(false);
    expect(handleEliteFourStep({ x: 5, y: 2 }, kogasMap, ctx)).toBe(false);
    expect(handleEliteFourStep({ x: 4, y: 2 }, brunosMap, ctx)).toBe(false);
    expect(handleEliteFourStep({ x: 5, y: 2 }, karensMap, ctx)).toBe(false);
    expect(handleEliteFourStep({ x: 4, y: 1 }, lancesMap, ctx)).toBe(false);
  });

  it('11. Will battle triggers and awards will_defeated flag and toast', () => {
    const willNpc = { ...npcs.wills_room[0] };
    const storyFlags = new Set<string>();
    const defeatedTrainers = new Set<string>();
    let onVictoryCb: any = null;

    const ctx: any = {
      storyFlags,
      defeatedTrainers,
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'xatu', level: 40, moves: [] }]),
      triggerBattle: vi.fn((_p, opts) => {
        onVictoryCb = opts.onVictory;
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      renderMap: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    handleWillBattle(willNpc, willsMap, ctx);
    onVictoryCb?.();

    expect(storyFlags.has('will_defeated')).toBe(true);
    expect(defeatedTrainers.has('will')).toBe(true);
    expect(ctx.showToast).toHaveBeenCalled();
  });

  it('12. Koga battle triggers and awards koga_defeated flag', () => {
    const kogaNpc = { ...npcs.kogas_room[0] };
    const storyFlags = new Set<string>();
    const defeatedTrainers = new Set<string>();
    let onVictoryCb: any = null;

    const ctx: any = {
      storyFlags,
      defeatedTrainers,
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'ariados', level: 40, moves: [] }]),
      triggerBattle: vi.fn((_p, opts) => {
        onVictoryCb = opts.onVictory;
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    handleKogaBattle(kogaNpc, kogasMap, ctx);
    onVictoryCb?.();

    expect(storyFlags.has('koga_defeated')).toBe(true);
    expect(defeatedTrainers.has('koga')).toBe(true);
  });

  it('13. Bruno battle triggers and awards bruno_defeated flag', () => {
    const brunoNpc = { ...npcs.brunos_room[0] };
    const storyFlags = new Set<string>();
    const defeatedTrainers = new Set<string>();
    let onVictoryCb: any = null;

    const ctx: any = {
      storyFlags,
      defeatedTrainers,
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'hitmontop', level: 42, moves: [] }]),
      triggerBattle: vi.fn((_p, opts) => {
        onVictoryCb = opts.onVictory;
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    handleBrunoBattle(brunoNpc, brunosMap, ctx);
    onVictoryCb?.();

    expect(storyFlags.has('bruno_defeated')).toBe(true);
    expect(defeatedTrainers.has('bruno')).toBe(true);
  });

  it('14. Karen battle triggers and awards karen_defeated flag', () => {
    const karenNpc = { ...npcs.karens_room[0] };
    const storyFlags = new Set<string>();
    const defeatedTrainers = new Set<string>();
    let onVictoryCb: any = null;

    const ctx: any = {
      storyFlags,
      defeatedTrainers,
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'umbreon', level: 42, moves: [] }]),
      triggerBattle: vi.fn((_p, opts) => {
        onVictoryCb = opts.onVictory;
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    handleKarenBattle(karenNpc, karensMap, ctx);
    onVictoryCb?.();

    expect(storyFlags.has('karen_defeated')).toBe(true);
    expect(defeatedTrainers.has('karen')).toBe(true);
  });

  it('15. Lance battle triggers and awards champion_defeated and completes M12', () => {
    const lanceNpc = { ...npcs.lances_room[0] };
    const storyFlags = new Set<string>();
    const defeatedTrainers = new Set<string>();
    let onVictoryCb: any = null;

    const ctx: any = {
      storyFlags,
      defeatedTrainers,
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      buildTrainerTeamInstances: vi.fn(() => [{ speciesId: 'gyarados', level: 44, moves: [] }]),
      triggerBattle: vi.fn((_p, opts) => {
        onVictoryCb = opts.onVictory;
      }),
      missionManager: {
        checkStoryFlags: vi.fn(),
        completeMission: vi.fn(),
      },
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      audioManager: { playBattleBgm: vi.fn() },
    };

    handleLanceBattle(lanceNpc, lancesMap, ctx);
    onVictoryCb?.();

    expect(storyFlags.has('champion_defeated')).toBe(true);
    expect(storyFlags.has('champion_lance_defeated')).toBe(true);
    expect(storyFlags.has('lance_defeated')).toBe(true);
    expect(defeatedTrainers.has('lance')).toBe(true);
    expect(ctx.missionManager.completeMission).toHaveBeenCalledWith('M12');
  });

  it('16. Hall of Fame event inducts player, records party, awards ss-ticket and sets hall_of_fame_inducted', () => {
    const lanceNpc = { ...npcs.hall_of_fame[0] };
    const storyFlags = new Set<string>();
    const inventory: any = { keyItems: [] };
    const playerParty = [
      { speciesId: 'typhlosion', level: 52, nickname: 'BLAZE' },
      { speciesId: 'ampharos', level: 50, nickname: 'SPARK' },
    ];

    const ctx: any = {
      storyFlags,
      inventory,
      playerParty,
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      missionManager: {
        checkStoryFlags: vi.fn(),
        completeMission: vi.fn(),
      },
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      renderMap: vi.fn(),
    };

    handleHallOfFameEvent(lanceNpc, hofMap, ctx);

    expect(storyFlags.has('hall_of_fame_inducted')).toBe(true);
    expect(storyFlags.has('has_ss_ticket')).toBe(true);
    expect(inventory.keyItems).toContain('ss-ticket');
    expect(ctx.hallOfFameRecord).toHaveLength(2);
    expect(ctx.hallOfFameRecord[0].nickname).toBe('BLAZE');
    expect(ctx.showToast).toHaveBeenCalled();
  });

  it('17. handleEliteFourStep automatically triggers Hall of Fame induction at altar (4..5, 2..3)', () => {
    const storyFlags = new Set<string>();
    const inventory: any = { keyItems: [] };
    const ctx: any = {
      player: { x: 4, y: 3, isMoving: true, direction: 'UP' },
      storyFlags,
      inventory,
      playerParty: [],
      openDialogue: vi.fn((_p, _s, onComplete) => {
        onComplete?.();
      }),
      showToast: vi.fn(),
      saveCurrentGame: vi.fn(),
      missionManager: { checkStoryFlags: vi.fn(), completeMission: vi.fn() },
    };

    const triggered = handleEliteFourStep({ x: 4, y: 3 }, hofMap, ctx);
    expect(triggered).toBe(true);
    expect(storyFlags.has('hall_of_fame_inducted')).toBe(true);
    expect(inventory.keyItems).toContain('ss-ticket');
  });

  it('18. getEliteFourAndChampionInteractions returns registrations for all 8 events', () => {
    const regs = getEliteFourAndChampionInteractions();
    expect(regs.length).toBe(8);

    const willReg = regs.find((r) => r.actions?.includes('E4_WILL_EVENT'));
    expect(willReg).toBeDefined();

    const kogaReg = regs.find((r) => r.actions?.includes('E4_KOGA_EVENT'));
    expect(kogaReg).toBeDefined();

    const brunoReg = regs.find((r) => r.actions?.includes('E4_BRUNO_EVENT'));
    expect(brunoReg).toBeDefined();

    const karenReg = regs.find((r) => r.actions?.includes('E4_KAREN_EVENT'));
    expect(karenReg).toBeDefined();

    const lanceReg = regs.find((r) => r.actions?.includes('CHAMPION_LANCE_EVENT'));
    expect(lanceReg).toBeDefined();

    const teleportReg = regs.find((r) => r.actions?.includes('INDIGO_TELEPORT_EVENT'));
    expect(teleportReg).toBeDefined();

    const guardReg = regs.find((r) => r.actions?.includes('INDIGO_LEAGUE_GUARD'));
    expect(guardReg).toBeDefined();

    const hofReg = regs.find((r) => r.actions?.includes('HALL_OF_FAME_EVENT'));
    expect(hofReg).toBeDefined();
  });

  it('19. Defeated Elite Four members give post-defeat encouragement when spoken to again', () => {
    const willNpc = { ...npcs.wills_room[0] };
    const storyFlags = new Set(['will_defeated']);
    let dialogue: string[] = [];

    const ctx: any = {
      storyFlags,
      openDialogue: vi.fn((p) => {
        dialogue = p;
      }),
    };

    handleWillBattle(willNpc, willsMap, ctx);
    expect(dialogue).toEqual(WILL_POST_DEFEAT_DIALOGUE);
  });

  it('20. Hall of Fame induction repeats champion greeting if already inducted', () => {
    const lanceNpc = { ...npcs.hall_of_fame[0] };
    const storyFlags = new Set(['hall_of_fame_inducted']);
    let dialogue: string[] = [];

    const ctx: any = {
      storyFlags,
      openDialogue: vi.fn((p) => {
        dialogue = p;
      }),
    };

    handleHallOfFameEvent(lanceNpc, hofMap, ctx);
    expect(dialogue[0]).toContain('Welcome back, CHAMPION!');
  });
});
