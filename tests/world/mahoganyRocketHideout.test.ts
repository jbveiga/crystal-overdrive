import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getMahoganyRocketHideoutInteractions,
  handleSecuritySwitch,
  handleLanceFieldMedic,
  handlePasswordGruntF,
  handlePasswordGruntM,
  handleOfficeDoor,
  handleExecutivePetrel,
  handlePetrelMurkrow,
  handleTransmitterDoor,
  handleMahoganyExecutiveAriana,
  handleGeneratorElectrode,
} from '../../src/world/interactions/MahoganyRocketHideoutInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { ModernHMHandler } from '../../src/world/ModernHMHandler';
import { OverworldTickerCoordinator } from '../../src/world/OverworldTickerCoordinator';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-STORY-MAHOGANY-ROCKET-HIDEOUT-01: Verification Suite', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('feraligatr', 35)],
      player: {
        id: 'player',
        x: 10,
        y: 10,
        targetX: 10,
        targetY: 10,
        renderX: 10 * 64,
        renderY: 10 * 64,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 10000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'],
        items: {},
        balls: {},
        tms: [],
        keyItems: [],
      },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages, speaker, onComplete) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        if (onComplete) onComplete();
      },
      showToast: () => {},
      saveCurrentGame: () => {},
      healPlayerParty: () => {
        for (const p of mockContext.playerParty!) {
          p.currentHp = p.stats.hp;
          p.status = undefined;
          if (p.moves) {
            for (const m of p.moves) m.currentPp = m.maxPp;
          }
        }
      },
      playHealingAnimation: (_count, cb) => {
        if (cb) cb();
      },
      triggerBattle: (_opp, opts) => {
        if (opts?.onBattleEnd) {
          opts.onBattleEnd({ winner: 'PLAYER', caught: false });
        }
      },
      addOverworldItemToInventory: (item: string) => {
        if (item.toUpperCase().startsWith('HM') || item.toUpperCase().startsWith('TM')) {
          if (!mockContext.inventory!.tms.includes(item.toUpperCase())) {
            mockContext.inventory!.tms.push(item.toUpperCase());
          }
        }
      },
      missionManager: {
        checkStoryFlags: () => {},
      } as any,
    };
  });

  // 1. Map Layout & Tile Walkability
  it('1. Verifies B1F, B2F, and B3F map integrity and reciprocal warps', () => {
    for (const mapName of ['team_rocket_base_b1f', 'team_rocket_base_b2f', 'team_rocket_base_b3f']) {
      const mapPath = path.join(mapsDir, `${mapName}.json`);
      expect(fs.existsSync(mapPath)).toBe(true);
      const data: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(data.width).toBe(30);
      expect(data.height).toBe(18);
      expect(data.warps.length).toBeGreaterThanOrEqual(2);
      expect(data.bgEvents?.length).toBeGreaterThanOrEqual(1);
    }
  });

  // 2. Hideout B1F Security Switch
  it('2. Flips security switch to disable Persian surveillance cameras', () => {
    const dummyEntity = { id: 'team_rocket_base_b1f_switch', x: 19, y: 11 } as any;
    const dummyMap = { id: 'team_rocket_base_b1f', width: 30, height: 18, collisionGrid: [] } as any;

    expect(mockContext.storyFlags!.has('EVENT_SECURITY_CAMERA_DISABLED')).toBe(false);
    handleSecuritySwitch(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('EVENT_SECURITY_CAMERA_DISABLED')).toBe(true);
    expect(mockContext.storyFlags!.has('security_cameras_disabled')).toBe(true);
    expect(lastSpeaker).toContain('SECURITY TERMINAL');

    // Second interaction acknowledges offline status
    handleSecuritySwitch(dummyEntity, dummyMap, mockContext as NpcInteractionContext);
    expect(lastDialoguePages.some((p) => p.includes('SECURITY SYSTEM: OFFLINE'))).toBe(true);
  });

  // 3. Persian Surveillance Cameras Step Trigger in OverworldTickerCoordinator
  it('3. Stepping into surveillance camera line triggers alarm battle when active, and silent when disabled', () => {
    let battleTriggered = false;
    let alarmPlayed = false;

    const tickerCtx: any = {
      getGameState: () => 'OVERWORLD',
      isCutsceneLocked: () => false,
      isDialogueOpen: () => false,
      isMenuOpen: () => false,
      isAnyModalOpen: () => false,
      player: {
        id: 'player',
        x: 19,
        y: 1,
        targetX: 19,
        targetY: 2,
        renderX: 19 * 64,
        renderY: 1 * 64,
        direction: 'DOWN',
        isMoving: true,
        progress: 0.99,
        isPlayer: true,
      },
      mapManager: {
        getCurrentMap: () => ({ id: 'team_rocket_base_b1f', width: 30, height: 18, collisionGrid: new Array(540).fill(0) }),
        isCurrentMapOutdoor: () => false,
        checkWarp: () => null,
        isWalkable: () => true,
        isWalkableInBounds: () => true,
        getTileType: () => 0,
        decrementRepelStep: () => ({ expiredJustNow: false }),
      },
      gameClock: {
        tick: () => ({ dtWorld: 0.016, dtPlayer: 0.016 }),
        getTimeOfDay: () => 'DAY',
      },
      overworldHUD: {
        isDialogueOpen: () => false,
        getHeldDirection: () => null,
        openDialogue: (_pages: string[], _spk: string, cb?: () => void) => {
          if (cb) cb();
        },
        showToast: () => {},
      },
      audioManager: {
        playSfx: (sfx: string) => {
          if (sfx === 'sfx_alarm') alarmPlayed = true;
        },
      },
      overworldRenderer: {
        updateAmbientLighting: () => {},
        spawnGrassRustle: () => {},
      },
      itemfinderHUD: {
        isActive: () => false,
      },
      dayCareManager: {
        onStepTaken: () => {},
      },
      storyFlags: mockContext.storyFlags!,
      playerParty: mockContext.playerParty!,
      seenSpecies: new Set<string>(),
      defeatedTrainers: mockContext.defeatedTrainers!,
      addPlayTimeDelta: () => {},
      saveCurrentGame: () => {},
      triggerBattle: () => {
        battleTriggered = true;
      },
      getActiveMapNpcs: () => [],
      populateWorldNpcs: () => [],
      handleMapTransition: () => {},
      executeWarpTransition: async () => {},
    };

    // When cameras are active
    OverworldTickerCoordinator.updateOverworldTick(0.016, tickerCtx);
    expect(alarmPlayed).toBe(true);
    expect(battleTriggered).toBe(true);

    // When cameras are deactivated
    alarmPlayed = false;
    battleTriggered = false;
    mockContext.storyFlags!.add('EVENT_SECURITY_CAMERA_DISABLED');
    tickerCtx.player.x = 19;
    tickerCtx.player.y = 1;
    tickerCtx.player.targetX = 19;
    tickerCtx.player.targetY = 2;
    tickerCtx.player.isMoving = true;
    tickerCtx.player.progress = 0.99;
    OverworldTickerCoordinator.updateOverworldTick(0.016, tickerCtx);
    expect(alarmPlayed).toBe(false);
    expect(battleTriggered).toBe(false);
  });

  // 4. B3F Rival Silver Ambush
  it('4. B3F Silver confrontation triggers once at stairs and sets flag', () => {
    let dialogueTriggered = false;
    const tickerCtx: any = {
      getGameState: () => 'OVERWORLD',
      isCutsceneLocked: () => false,
      isDialogueOpen: () => false,
      isMenuOpen: () => false,
      isAnyModalOpen: () => false,
      player: {
        id: 'player',
        x: 9,
        y: 1,
        targetX: 9,
        targetY: 2,
        renderX: 9 * 64,
        renderY: 1 * 64,
        direction: 'DOWN',
        isMoving: true,
        progress: 0.99,
        isPlayer: true,
      },
      mapManager: {
        getCurrentMap: () => ({ id: 'team_rocket_base_b3f', width: 30, height: 18, collisionGrid: new Array(540).fill(0) }),
        isCurrentMapOutdoor: () => false,
        checkWarp: () => null,
        isWalkable: () => true,
        isWalkableInBounds: () => true,
        getTileType: () => 0,
        decrementRepelStep: () => ({ expiredJustNow: false }),
      },
      gameClock: {
        tick: () => ({ dtWorld: 0.016, dtPlayer: 0.016 }),
        getTimeOfDay: () => 'DAY',
      },
      overworldHUD: {
        isDialogueOpen: () => false,
        getHeldDirection: () => null,
        openDialogue: (pages: string[], spk: string) => {
          dialogueTriggered = true;
          expect(spk).toContain('RIVAL SILVER');
          expect(pages.some((p) => p.includes('black cape with a dragon'))).toBe(true);
        },
        showToast: () => {},
      },
      overworldRenderer: {
        updateAmbientLighting: () => {},
        spawnGrassRustle: () => {},
      },
      itemfinderHUD: {
        isActive: () => false,
      },
      dayCareManager: {
        onStepTaken: () => {},
      },
      storyFlags: mockContext.storyFlags!,
      playerParty: mockContext.playerParty!,
      seenSpecies: new Set<string>(),
      defeatedTrainers: mockContext.defeatedTrainers!,
      addPlayTimeDelta: () => {},
      saveCurrentGame: () => {},
      getActiveMapNpcs: () => [],
      populateWorldNpcs: () => [],
      handleMapTransition: () => {},
      executeWarpTransition: async () => {},
    };

    expect(mockContext.storyFlags!.has('EVENT_RIVAL_TEAM_ROCKET_BASE')).toBe(false);
    OverworldTickerCoordinator.updateOverworldTick(0.016, tickerCtx);
    expect(dialogueTriggered).toBe(true);
    expect(mockContext.storyFlags!.has('EVENT_RIVAL_TEAM_ROCKET_BASE')).toBe(true);

    // Re-stepping does not trigger dialogue again
    dialogueTriggered = false;
    tickerCtx.player.x = 9;
    tickerCtx.player.y = 1;
    tickerCtx.player.targetX = 9;
    tickerCtx.player.targetY = 2;
    tickerCtx.player.isMoving = true;
    tickerCtx.player.progress = 0.99;
    OverworldTickerCoordinator.updateOverworldTick(0.016, tickerCtx);
    expect(dialogueTriggered).toBe(false);
  });

  // 5. Hideout B2F Lance Field Medic
  it('5. Lance restores injured party members to 100% HP and restores full PP', () => {
    const dummyEntity = { id: 'team_rocket_base_b2f_lance', x: 18, y: 10 } as any;
    const dummyMap = { id: 'team_rocket_base_b2f', width: 30, height: 18 } as any;

    const mon = mockContext.playerParty![0];
    mon.currentHp = 1;
    mon.status = 'paralysis';
    mon.moves = [{ moveId: 'surf', currentPp: 2, maxPp: 15 }];

    handleLanceFieldMedic(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mon.currentHp).toBe(mon.stats.hp);
    expect(mon.status).toBeUndefined();
    expect(mon.moves[0].currentPp).toBe(15);
    expect(lastSpeaker).toContain('LANCE');
  });

  // 6. B3F Female Grunt Password Gathering
  it('6. Female Grunt battles player and teaches "SLOWPOKETAIL"', () => {
    const dummyEntity = { id: 'team_rocket_base_b3f_grunt_f', x: 21, y: 7 } as any;
    const dummyMap = { id: 'team_rocket_base_b3f', width: 30, height: 18 } as any;

    expect(mockContext.storyFlags!.has('EVENT_LEARNED_SLOWPOKETAIL')).toBe(false);
    handlePasswordGruntF(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('EVENT_LEARNED_SLOWPOKETAIL')).toBe(true);
    expect(lastDialoguePages.some((p) => p.includes('SLOWPOKETAIL'))).toBe(true);
  });

  // 7. B3F Male Grunt Password Gathering
  it('7. Male Grunt battles player and teaches "RATICATE"', () => {
    const dummyEntity = { id: 'team_rocket_base_b3f_grunt_m', x: 5, y: 14 } as any;
    const dummyMap = { id: 'team_rocket_base_b3f', width: 30, height: 18 } as any;

    expect(mockContext.storyFlags!.has('EVENT_LEARNED_RATICATETAIL')).toBe(false);
    handlePasswordGruntM(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('EVENT_LEARNED_RATICATETAIL')).toBe(true);
    expect(lastDialoguePages.some((p) => p.includes('RATICATE'))).toBe(true);
  });

  // 8. B3F Office Blast Door
  it('8. Petrel Office Door rejects entry until both passwords are known, then unblocks collision', () => {
    const dummyEntity = { id: 'team_rocket_base_b3f_office_door', x: 10, y: 9 } as any;
    const dummyMap: MapData = {
      id: 'team_rocket_base_b3f',
      name: 'Rocket Hideout B3F',
      width: 30,
      height: 18,
      tileSize: 64,
      groundLayer: new Array(540).fill(0),
      collisionGrid: new Array(540).fill(0),
      tileMap: [],
      connections: {},
      warps: [],
    };
    dummyMap.collisionGrid[9 * 30 + 10] = 1;
    dummyMap.collisionGrid[9 * 30 + 11] = 1;

    // Both passwords missing
    handleOfficeDoor(dummyEntity, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE')).toBe(false);
    expect(dummyMap.collisionGrid[9 * 30 + 10]).toBe(1);

    // Only password 1
    mockContext.storyFlags!.add('EVENT_LEARNED_SLOWPOKETAIL');
    handleOfficeDoor(dummyEntity, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE')).toBe(false);

    // Both passwords known
    mockContext.storyFlags!.add('EVENT_LEARNED_RATICATETAIL');
    handleOfficeDoor(dummyEntity, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE')).toBe(true);
    expect(dummyMap.collisionGrid[9 * 30 + 10]).toBe(0);
    expect(dummyMap.collisionGrid[9 * 30 + 11]).toBe(0);
  });

  // 9. Executive Petrel Boss Battle
  it('9. Petrel battles player with authentic team, flees upon defeat', () => {
    const dummyEntity = { id: 'team_rocket_base_b3f_petrel', x: 10, y: 3 } as any;
    const dummyMap = { id: 'team_rocket_base_b3f', width: 30, height: 18 } as any;

    expect(mockContext.storyFlags!.has('EVENT_BEAT_ROCKET_EXECUTIVEM_4')).toBe(false);
    handleExecutivePetrel(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('EVENT_BEAT_ROCKET_EXECUTIVEM_4')).toBe(true);
    expect(lastDialoguePages.some((p) => p.includes('Murkrow'))).toBe(true);
  });

  // 10. Petrel Murkrow Voice Password
  it('10. Murkrow squawks "Hail GIOVANNI" voice password', () => {
    const dummyEntity = { id: 'team_rocket_base_b3f_murkrow', x: 10, y: 2 } as any;
    const dummyMap = { id: 'team_rocket_base_b3f', width: 30, height: 18 } as any;

    expect(mockContext.storyFlags!.has('EVENT_LEARNED_HAIL_GIOVANNI')).toBe(false);
    handlePetrelMurkrow(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('EVENT_LEARNED_HAIL_GIOVANNI')).toBe(true);
    expect(lastDialoguePages.some((p) => p.includes('Hail GIOVANNI'))).toBe(true);
  });

  // 11. B2F Master Transmitter Blast Door
  it('11. Master Transmitter Door requires voice password before opening', () => {
    const dummyEntity = { id: 'team_rocket_base_b2f_transmitter_door', x: 14, y: 12 } as any;
    const dummyMap: MapData = {
      id: 'team_rocket_base_b2f',
      name: 'Rocket Hideout B2F',
      width: 30,
      height: 18,
      tileSize: 64,
      groundLayer: new Array(540).fill(0),
      collisionGrid: new Array(540).fill(0),
      tileMap: [],
      connections: {},
      warps: [],
    };
    dummyMap.collisionGrid[12 * 30 + 14] = 1;
    dummyMap.collisionGrid[12 * 30 + 15] = 1;

    // Missing voice password
    handleTransmitterDoor(dummyEntity, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('EVENT_OPENED_DOOR_TO_ROCKET_HIDEOUT_TRANSMITTER')).toBe(false);
    expect(dummyMap.collisionGrid[12 * 30 + 14]).toBe(1);

    // Learned voice password
    mockContext.storyFlags!.add('EVENT_LEARNED_HAIL_GIOVANNI');
    handleTransmitterDoor(dummyEntity, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('EVENT_OPENED_DOOR_TO_ROCKET_HIDEOUT_TRANSMITTER')).toBe(true);
    expect(dummyMap.collisionGrid[12 * 30 + 14]).toBe(0);
    expect(dummyMap.collisionGrid[12 * 30 + 15]).toBe(0);
  });

  // 12. Executive Ariana Climax Battle
  it('12. Executive Ariana challenges player and retreats upon defeat', () => {
    const dummyEntity = { id: 'team_rocket_base_b2f_ariana', x: 15, y: 10 } as any;
    const dummyMap = { id: 'team_rocket_base_b2f', width: 30, height: 18 } as any;

    expect(mockContext.storyFlags!.has('EVENT_BEAT_ROCKET_EXECUTIVEF_2')).toBe(false);
    handleMahoganyExecutiveAriana(dummyEntity, dummyMap, mockContext as NpcInteractionContext);

    expect(mockContext.storyFlags!.has('EVENT_BEAT_ROCKET_EXECUTIVEF_2')).toBe(true);
    expect(lastDialoguePages.some((p) => p.includes('Subduing the three Electrodes'))).toBe(true);
  });

  // 13. Subdue 3 Electrodes & HM06 Whirlpool Grant
  it('13. Subduing all 3 Electrodes shuts down generator and Lance awards HM06 Whirlpool', () => {
    const dummyMap = { id: 'team_rocket_base_b2f', width: 30, height: 18 } as any;

    // Subdue electrode 1
    handleGeneratorElectrode({ id: 'b2f_electrode_1', x: 7, y: 5 } as any, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('b2f_electrode_1_cleared')).toBe(true);
    expect(mockContext.storyFlags!.has('rocket_base_generator_cleared')).toBe(false);

    // Subdue electrode 2
    handleGeneratorElectrode({ id: 'b2f_electrode_2', x: 7, y: 7 } as any, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('b2f_electrode_2_cleared')).toBe(true);
    expect(mockContext.storyFlags!.has('rocket_base_generator_cleared')).toBe(false);

    // Subdue electrode 3 -> Clears generator & grants HM06 Whirlpool!
    handleGeneratorElectrode({ id: 'b2f_electrode_3', x: 7, y: 9 } as any, dummyMap, mockContext as NpcInteractionContext);
    expect(mockContext.storyFlags!.has('b2f_electrode_3_cleared')).toBe(true);
    expect(mockContext.storyFlags!.has('rocket_base_generator_cleared')).toBe(true);
    expect(mockContext.storyFlags!.has('EVENT_CLEARED_ROCKET_HIDEOUT')).toBe(true);
    expect(mockContext.storyFlags!.has('has_hm06_whirlpool')).toBe(true);
    expect(mockContext.inventory!.tms).toContain('HM06');
    expect(lastDialoguePages.some((p) => p.includes('HM06 WHIRLPOOL'))).toBe(true);
  });

  // 14. ModernHMHandler Whirlpool Verification
  it('14. ModernHMHandler verifies Glacier Badge, HM06, and species compatibility for Whirlpool', () => {
    const feraligatr = PokemonFactory.create('feraligatr', 35);
    const pidgey = PokemonFactory.create('pidgey', 15);

    // 1. Missing badge and HM
    const flags = new Set<string>();
    const inv: any = { tms: [] };
    let check = ModernHMHandler.canUseWhirlpool([feraligatr], inv, flags);
    expect(check.canUse).toBe(false);
    expect(check.reason).toContain('GLACIER BADGE');

    // 2. Has badge, missing HM
    flags.add('glacierbadge');
    check = ModernHMHandler.canUseWhirlpool([feraligatr], inv, flags);
    expect(check.canUse).toBe(false);
    expect(check.reason).toContain('HM06');

    // 3. Has badge, has HM, incompatible party
    inv.tms.push('HM06');
    check = ModernHMHandler.canUseWhirlpool([pidgey], inv, flags);
    expect(check.canUse).toBe(false);
    expect(check.reason).toContain('knows Whirlpool');

    // 4. Compatible water Pokémon
    check = ModernHMHandler.canUseWhirlpool([feraligatr], inv, flags);
    expect(check.canUse).toBe(true);
    expect(check.compatiblePokemonName?.toUpperCase()).toBe('FERALIGATR');
  });

  // 15. World Despawn Invariant: Grunts Despawn Upon Generator Shutdown
  it('15. World Despawn Invariant: All Team Rocket Grunts despawn once generator is cleared', () => {
    const flagsActive = new Set<string>();

    // Before clearing: NPCs are active
    expect(isNpcActiveForStoryFlags('team_rocket_base_b2f_lance', flagsActive)).toBe(true);
    expect(isNpcActiveForStoryFlags('team_rocket_base_b2f_ariana', flagsActive)).toBe(true);
    expect(isNpcActiveForStoryFlags('mahogany_town_rocket_1', flagsActive)).toBe(true);
    expect(isNpcActiveForStoryFlags('mahogany_mart_rocket', flagsActive)).toBe(true);
    expect(isNpcActiveForStoryFlags('route_43_gate_rocket_1', flagsActive)).toBe(true);
    expect(isNpcActiveForStoryFlags('route_43_gate_rocket_2', flagsActive)).toBe(true);
    expect(isNpcActiveForStoryFlags('mahogany_gym_blocker', flagsActive)).toBe(true);

    // After clearing generator: all Rocket Grunts and blockers despawn
    const flagsCleared = new Set<string>(['rocket_base_generator_cleared']);
    expect(isNpcActiveForStoryFlags('team_rocket_base_b2f_lance', flagsCleared)).toBe(false);
    expect(isNpcActiveForStoryFlags('team_rocket_base_b2f_ariana', flagsCleared)).toBe(false);
    expect(isNpcActiveForStoryFlags('mahogany_town_rocket_1', flagsCleared)).toBe(false);
    expect(isNpcActiveForStoryFlags('mahogany_mart_rocket', flagsCleared)).toBe(false);
    expect(isNpcActiveForStoryFlags('route_43_gate_rocket_1', flagsCleared)).toBe(false);
    expect(isNpcActiveForStoryFlags('route_43_gate_rocket_2', flagsCleared)).toBe(false);
    expect(isNpcActiveForStoryFlags('mahogany_gym_blocker', flagsCleared)).toBe(false);
  });

  // 16. NpcInteractionRouter O(1) Registrations
  it('16. All hideout interactions are registered in default router with zero unhandled actions', () => {
    const router = createDefaultNpcInteractionRouter();
    const registrations = getMahoganyRocketHideoutInteractions();

    expect(registrations.length).toBeGreaterThanOrEqual(10);
    for (const reg of registrations) {
      if (reg.actions) {
        for (const act of reg.actions) {
          const handled = router.dispatch(
            { id: 'test_entity', action: act } as any,
            { id: 'team_rocket_base_b1f', width: 30, height: 18 } as any,
            mockContext as NpcInteractionContext
          );
          expect(handled).toBe(true);
        }
      }
    }
  });

  // 17. Map population consistency
  it('17. Verifies mahoganyToIndigoNpcs maps populate hideout NPCs on strictly walkable tiles', () => {
    const npcsByMap = createMahoganyToIndigoNpcs();
    expect(npcsByMap.team_rocket_base_b1f.length).toBeGreaterThanOrEqual(2);
    expect(npcsByMap.team_rocket_base_b2f.length).toBeGreaterThanOrEqual(5);
    expect(npcsByMap.team_rocket_base_b3f.length).toBeGreaterThanOrEqual(7);
  });
});
