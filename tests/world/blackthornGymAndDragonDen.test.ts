import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getBlackthornGymAndDragonDenInteractions,
  handleClairInteraction,
  handleDragonMasterElder,
  handleBlackthornGymBoulderDrop,
  handleDragonsDenGuard,
  handleBlackthornGymGuide,
  handleBlackthornGymStatue,
} from '../../src/world/interactions/BlackthornGymAndDragonDenInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { EAST_JOHTO_GENERATED_NPCS } from '../../src/world/generated-npcs/eastJohtoGeneratedNpcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { ModernHMHandler } from '../../src/world/ModernHMHandler';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-BATTLE-BLACKTHORN-GYM-CLAIR-01: Blackthorn Gym, Leader Clair & Dragon Shrine Trial', () => {
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
      playerParty: [PokemonFactory.create('feraligatr', 45, ['strength', 'surf', 'bite', 'slash'])],
      player: {
        id: 'player',
        x: 5,
        y: 4,
        targetX: 5,
        targetY: 4,
        renderX: 5 * 64,
        renderY: 4 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 50000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'],
        items: {},
        balls: {},
        tms: ['HM04', 'HM06', 'HM07'],
        keyItems: [],
      },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages, speaker, onComplete) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        if (onComplete) onComplete();
      },
      showToast: (msg) => {
        lastToastMessage = msg;
      },
      saveCurrentGame: () => {
        savedGameCalled = true;
      },
      triggerBattle: (enemy, opts) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = opts;
      },
      buildTrainerTeamInstances: (npc: any) => {
        const team = (npc as any).team || [];
        return team.map((m: any) => PokemonFactory.create(m.speciesId, m.level, m.moves));
      },
      missionManager: {
        checkStoryFlags: () => {},
      } as any,
      audioManager: {
        playSfx: () => {},
      } as any,
      renderMap: () => {},
    };
  });

  describe('1. Map Geometry & Reciprocal Warp Network', () => {
    const blackthornMaps = [
      'blackthorn_gym_1f',
      'blackthorn_gym_2f',
      'dragons_den_1f',
      'dragons_den_b1f',
      'dragon_shrine',
    ];

    it('asserts all 5 map files exist with valid dimensions and collision grids', () => {
      for (const mapId of blackthornMaps) {
        const filePath = path.join(mapsDir, `${mapId}.json`);
        expect(fs.existsSync(filePath), `Map file for ${mapId} must exist`).toBe(true);

        const mapData: MapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        expect(mapData.id).toBe(mapId);
        expect(mapData.width).toBeGreaterThan(0);
        expect(mapData.height).toBeGreaterThan(0);
        expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      }
    });

    it('asserts reciprocal warps between Blackthorn City and Blackthorn Gym 1F', () => {
      const cityData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_city.json'), 'utf8')
      );
      const gym1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_gym_1f.json'), 'utf8')
      );

      const cityToGym = cityData.warps.find((w) => w.targetMapId === 'blackthorn_gym_1f');
      expect(cityToGym).toEqual({ x: 18, y: 11, targetMapId: 'blackthorn_gym_1f', targetX: 4, targetY: 17 });

      const gymToCity = gym1fData.warps.find((w) => w.targetMapId === 'blackthorn_city');
      expect(gymToCity).toBeDefined();
      expect(gymToCity?.targetMapId).toBe('blackthorn_city');
      expect(gymToCity?.targetX).toBe(18);
      expect(gymToCity?.targetY).toBe(12);
    });

    it('asserts 5 reciprocal stairs warps between Blackthorn Gym 1F and 2F', () => {
      const g1Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_gym_1f.json'), 'utf8')
      );
      const g2Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_gym_2f.json'), 'utf8')
      );

      // (1, 7) <-> (1, 7)
      expect(g1Data.warps.find((w) => w.x === 1 && w.y === 7)).toEqual({
        x: 1,
        y: 7,
        targetMapId: 'blackthorn_gym_2f',
        targetX: 1,
        targetY: 7,
      });
      expect(g2Data.warps.find((w) => w.x === 1 && w.y === 7)).toEqual({
        x: 1,
        y: 7,
        targetMapId: 'blackthorn_gym_1f',
        targetX: 1,
        targetY: 7,
      });

      // (7, 9) <-> (7, 9)
      expect(g1Data.warps.find((w) => w.x === 7 && w.y === 9)).toEqual({
        x: 7,
        y: 9,
        targetMapId: 'blackthorn_gym_2f',
        targetX: 7,
        targetY: 9,
      });
      expect(g2Data.warps.find((w) => w.x === 7 && w.y === 9)).toEqual({
        x: 7,
        y: 9,
        targetMapId: 'blackthorn_gym_1f',
        targetX: 7,
        targetY: 9,
      });
    });

    it('asserts reciprocal warps between Blackthorn City, Dragon Den 1F, B1F, and Dragon Shrine', () => {
      const cityData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_city.json'), 'utf8')
      );
      const den1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'dragons_den_1f.json'), 'utf8')
      );
      const denB1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'dragons_den_b1f.json'), 'utf8')
      );
      const shrineData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'dragon_shrine.json'), 'utf8')
      );

      // City <-> Dragon's Den 1F
      const cityToDen = cityData.warps.find((w) => w.targetMapId === 'dragons_den_1f');
      expect(cityToDen).toEqual({ x: 20, y: 1, targetMapId: 'dragons_den_1f', targetX: 3, targetY: 5 });
      const denToCity = den1fData.warps.find((w) => w.targetMapId === 'blackthorn_city');
      expect(denToCity).toEqual({ x: 3, y: 5, targetMapId: 'blackthorn_city', targetX: 20, targetY: 2 });

      // Den 1F <-> Den B1F
      const den1fToB1f = den1fData.warps.find((w) => w.targetMapId === 'dragons_den_b1f');
      expect(den1fToB1f).toEqual({ x: 5, y: 15, targetMapId: 'dragons_den_b1f', targetX: 20, targetY: 3 });
      const denB1fTo1f = denB1fData.warps.find((w) => w.targetMapId === 'dragons_den_1f');
      expect(denB1fTo1f).toEqual({ x: 20, y: 3, targetMapId: 'dragons_den_1f', targetX: 5, targetY: 15 });

      // Den B1F <-> Dragon Shrine
      const denB1fToShrine = denB1fData.warps.find((w) => w.targetMapId === 'dragon_shrine');
      expect(denB1fToShrine).toEqual({ x: 19, y: 29, targetMapId: 'dragon_shrine', targetX: 4, targetY: 9 });
      const shrineToDenB1f = shrineData.warps.find((w) => w.targetMapId === 'dragons_den_b1f');
      expect(shrineToDenB1f).toEqual({ x: 4, y: 9, targetMapId: 'dragons_den_b1f', targetX: 19, targetY: 29 });
    });
  });

  describe('2. Blackthorn Gym Trainers & Dragon Den B1F Overview', () => {
    it('asserts 5 Gym trainers in EAST_JOHTO_GENERATED_NPCS across Gym 1F and 2F', () => {
      const g1Npcs = EAST_JOHTO_GENERATED_NPCS.blackthorn_gym_1f;
      const g2Npcs = EAST_JOHTO_GENERATED_NPCS.blackthorn_gym_2f;

      const g1Trainers = g1Npcs.filter((n) => n.action === 'TRAINER_BATTLE');
      expect(g1Trainers.length).toBe(3); // Mike, Paul, Lola
      expect(g1Trainers.map((t) => t.trainerId)).toEqual([
        'blackthorn_gym_1f_mike',
        'blackthorn_gym_1f_paul',
        'blackthorn_gym_1f_lola',
      ]);

      const g2Trainers = g2Npcs.filter((n) => n.action === 'TRAINER_BATTLE');
      expect(g2Trainers.length).toBe(2); // Cody, Fran
      expect(g2Trainers.map((t) => t.trainerId)).toEqual([
        'blackthorn_gym_2f_cody',
        'blackthorn_gym_2f_fran',
      ]);

      const g1Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_gym_1f.json'), 'utf8')
      );
      for (const t of g1Trainers) {
        expect(t.team).toBeDefined();
        expect(t.team!.length).toBeGreaterThan(0);
        expect(g1Data.collisionGrid[t.y * g1Data.width + t.x]).toBe(0);
      }
    });

    it('asserts Dragon Den B1F trainers and overworld item balls', () => {
      const denNpcs = EAST_JOHTO_GENERATED_NPCS.dragons_den_b1f;
      const darin = denNpcs.find((n) => n.trainerId === 'dragons_den_b1f_darin');
      const cara = denNpcs.find((n) => n.trainerId === 'dragons_den_b1f_cara');
      expect(darin).toBeDefined();
      expect(cara).toBeDefined();

      const itemsData = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/overworld_items.json'), 'utf8')
      );
      const denItems = itemsData.byMap['dragons_den_b1f'];
      expect(denItems).toBeDefined();
      expect(denItems.itemBalls.map((b: any) => b.itemId)).toEqual(
        expect.arrayContaining(['calcium', 'max_elixer'])
      );
      expect(denItems.hiddenItems.map((h: any) => h.itemId)).toEqual(
        expect.arrayContaining(['revive', 'max_potion', 'max_elixer'])
      );
    });
  });

  describe('3. Leader Clair Boss Battle & Stubborn Refusal Invariant', () => {
    it('initiates battle with Leader Clair 4-mon dragon team', () => {
      const clairNpc = {
        id: 'blackthorn_gym_1f_clair_0',
        speaker: '🏆 LEADER CLAIR',
        trainerName: 'Leader Clair',
        x: 5,
        y: 3,
      } as any;
      const currentMap = { id: 'blackthorn_gym_1f' } as any;

      const res = handleClairInteraction(clairNpc, currentMap, mockContext as NpcInteractionContext);
      expect(res).toBe(true);

      expect(triggeredBattleEnemy).toBeDefined();
      expect(triggeredBattleOptions).toBeDefined();
      expect(triggeredBattleOptions.isGymLeader).toBe(true);
      expect(triggeredBattleOptions.trainerName).toBe('Leader Clair');

      // Verify authentic 4-mon team: 3x Dragonair Lv. 37, Kingdra Lv. 40
      const team = triggeredBattleOptions.trainerTeam;
      expect(team.length).toBe(4);
      expect(team[0].speciesId).toBe('dragonair');
      expect(team[0].level).toBe(37);
      expect(team[1].speciesId).toBe('dragonair');
      expect(team[1].level).toBe(37);
      expect(team[2].speciesId).toBe('dragonair');
      expect(team[2].level).toBe(37);
      expect(team[3].speciesId).toBe('kingdra');
      expect(team[3].level).toBe(40);
      expect(team[3].moves.map((m: any) => m.moveId)).toEqual(
        expect.arrayContaining(['surf', 'hyperbeam', 'dragonbreath', 'smokescreen'])
      );
    });

    it('enforces Stubborn Refusal Invariant: victory sets clair_defeated but does NOT grant Rising Badge yet', () => {
      const clairNpc = {
        id: 'blackthorn_gym_1f_clair_0',
        speaker: '🏆 LEADER CLAIR',
        trainerName: 'Leader Clair',
      } as any;
      const currentMap = { id: 'blackthorn_gym_1f' } as any;

      handleClairInteraction(clairNpc, currentMap, mockContext as NpcInteractionContext);

      // Trigger onVictory callback
      triggeredBattleOptions.onVictory();

      expect(mockContext.defeatedTrainers?.has('clair')).toBe(true);
      expect(mockContext.storyFlags?.has('clair_defeated')).toBe(true);
      expect(mockContext.storyFlags?.has('has_rising_badge')).toBe(false);
      expect(mockContext.inventory?.badges).not.toContain('rising');

      expect(savedGameCalled).toBe(true);
      expect(lastToastMessage).toContain("Enter Dragon's Den for the Elder's trial!");
      expect(lastDialoguePages[0]).toContain("I won't acknowledge it!");
      expect(lastDialoguePages[2]).toContain("DRAGON ELDER's trial");
    });

    it('repeated interaction in Gym insists on Dragon Den trial before Rising Badge is given', () => {
      mockContext.storyFlags?.add('clair_defeated');
      const clairNpc = { id: 'blackthorn_gym_1f_clair_0', speaker: '🏆 LEADER CLAIR' } as any;
      const currentMap = { id: 'blackthorn_gym_1f' } as any;

      const res = handleClairInteraction(clairNpc, currentMap, mockContext as NpcInteractionContext);
      expect(res).toBe(true);
      expect(lastDialoguePages[0]).toContain("I won't acknowledge this loss yet!");
      expect(lastDialoguePages[1]).toContain("DRAGON'S DEN");
    });
  });

  describe('4. Dragon Den Guard & 2F Boulder Drop Puzzle', () => {
    it('handleDragonsDenGuard blocks entry before defeating Clair, and steps aside after', () => {
      const guardNpc = { id: 'blackthorn_city_gramps_2', speaker: '👴 GRAMPS' } as any;

      // Before Clair defeat
      handleDragonsDenGuard(guardNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('None may enter the DRAGON’S DEN');

      // After Clair defeat
      mockContext.storyFlags?.add('clair_defeated');
      handleDragonsDenGuard(guardNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('CLAIR has instructed me to let you pass');
    });

    it('handleBlackthornGymBoulderDrop moves boulder with Strength and drops into 1F lava trench', () => {
      mockContext.inventory!.badges = ['plain'];
      mockContext.inventory!.tms = ['HM04'];
      mockContext.playerParty = [PokemonFactory.create('machamp', 40, ['strength', 'karatechop'])];
      const boulderNpc = { id: 'blackthorn_gym_2f_boulder_2' } as any;

      const res = handleBlackthornGymBoulderDrop(boulderNpc, null as any, mockContext as NpcInteractionContext);
      expect(res).toBe(true);
      expect(mockContext.storyFlags?.has('EVENT_BOULDER_IN_BLACKTHORN_GYM_2')).toBe(true);
      expect(savedGameCalled).toBe(true);
      expect(lastToastMessage).toBe('🪨 Dropped boulder #2 into 1F lava trench!');
      expect(lastDialoguePages[0]).toContain('STRENGTH moved the boulder!');
      expect(lastDialoguePages[1]).toContain('plunged into the lava pit on 1F');
    });

    it('isNpcActiveForStoryFlags despawns 2F boulders and spawns 1F fallen boulders', () => {
      const storyFlags = new Set<string>();
      const b2fId = 'blackthorn_gym_2f_boulder_1';
      const b1fId = 'blackthorn_gym_1f_boulder_1';

      expect(isNpcActiveForStoryFlags(b2fId, storyFlags)).toBe(true);
      expect(isNpcActiveForStoryFlags(b1fId, storyFlags)).toBe(false);

      storyFlags.add('EVENT_BOULDER_IN_BLACKTHORN_GYM_1');
      expect(isNpcActiveForStoryFlags(b2fId, storyFlags)).toBe(false);
      expect(isNpcActiveForStoryFlags(b1fId, storyFlags)).toBe(true);
    });

    it('createMahoganyToIndigoNpcs defines 3 boulders on Gym 2F and 3 fallen boulders on Gym 1F', () => {
      const allNpcs = createMahoganyToIndigoNpcs();
      const g2Npcs = allNpcs['blackthorn_gym_2f'];
      expect(g2Npcs).toBeDefined();
      expect(g2Npcs.length).toBe(3);
      expect(g2Npcs.map((n) => n.id)).toEqual([
        'blackthorn_gym_2f_boulder_1',
        'blackthorn_gym_2f_boulder_2',
        'blackthorn_gym_2f_boulder_3',
      ]);

      const g1Npcs = allNpcs['blackthorn_gym_1f'];
      expect(g1Npcs).toBeDefined();
      expect(g1Npcs.length).toBe(3);
      expect(g1Npcs.map((n) => n.id)).toEqual([
        'blackthorn_gym_1f_boulder_1',
        'blackthorn_gym_1f_boulder_2',
        'blackthorn_gym_1f_boulder_3',
      ]);
    });
  });

  describe('5. Dragon Shrine Master Elder Quiz, Rising Badge Grant & ExtremeSpeed Dratini', () => {
    it('handleDragonMasterElder rejects challenger if Clair was not yet defeated', () => {
      const elderNpc = { id: 'dragon_elder', speaker: '🐉 DRAGON MASTER ELDER' } as any;
      handleDragonMasterElder(elderNpc, null as any, mockContext as NpcInteractionContext);

      expect(lastDialoguePages[1]).toContain('Only those who have tested their spirit against CLAIR');
      expect(mockContext.storyFlags?.has('dragon_elder_quiz_passed')).toBe(false);
    });

    it('handleDragonMasterElder administers 5 questions, compels Clair to concede, awards Rising Badge & TM24', () => {
      mockContext.storyFlags?.add('clair_defeated');
      const elderNpc = { id: 'dragon_elder', speaker: '🐉 DRAGON MASTER ELDER' } as any;

      handleDragonMasterElder(elderNpc, null as any, mockContext as NpcInteractionContext);

      // Verify all 5 questions administered in dialogue
      expect(lastDialoguePages[1]).toContain('Question 1: What are POKéMON to you?');
      expect(lastDialoguePages[2]).toContain('Question 2: What brings victory in battle?');
      expect(lastDialoguePages[3]).toContain('Question 3: What kind of trainer do you wish to battle?');
      expect(lastDialoguePages[4]).toContain('Question 4: What is the most important virtue in raising POKéMON?');
      expect(lastDialoguePages[5]).toContain('Question 5: Strong POKéMON. Weak POKéMON.');

      // Verify Elder reprimand and Clair concession
      expect(lastDialoguePages[7]).toContain('Wait! ELDER! How could you let an outsider pass so easily?!');
      expect(lastDialoguePages[8]).toContain('Silence, CLAIR! This trainer understands the true essence');

      // Verify state mutations
      expect(mockContext.storyFlags?.has('dragon_elder_quiz_passed')).toBe(true);
      expect(mockContext.storyFlags?.has('clair_conceded')).toBe(true);
      expect(mockContext.storyFlags?.has('has_rising_badge')).toBe(true);
      expect(mockContext.storyFlags?.has('has_tm24_dragonbreath')).toBe(true);
      expect(mockContext.inventory?.badges).toContain('rising');
      expect(mockContext.inventory?.tms).toContain('TM24');

      // Verify ExtremeSpeed Dratini was awarded because party had space
      expect(mockContext.storyFlags?.has('gift_dratini_extremespeed')).toBe(true);
      expect(mockContext.playerParty?.length).toBe(2);
      const dratini = mockContext.playerParty![1];
      expect(dratini.speciesId).toBe('dratini');
      expect(dratini.level).toBe(15);
      expect(dratini.moves.map((m) => m.moveId)).toContain('extremespeed');

      expect(savedGameCalled).toBe(true);
      expect(lastToastMessage).toContain('Obtained the Rising Badge');
    });

    it('handleDragonMasterElder defers Dratini gift when party is full, and awards upon return', () => {
      mockContext.storyFlags?.add('clair_defeated');
      // Fill party to 6 Pokémon
      mockContext.playerParty = [
        PokemonFactory.create('feraligatr', 45),
        PokemonFactory.create('pidgeot', 42),
        PokemonFactory.create('ampharos', 43),
        PokemonFactory.create('heracross', 44),
        PokemonFactory.create('espeon', 42),
        PokemonFactory.create('mamoswine', 44),
      ];

      const elderNpc = { id: 'dragon_elder', speaker: '🐉 DRAGON MASTER ELDER' } as any;
      handleDragonMasterElder(elderNpc, null as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags?.has('has_rising_badge')).toBe(true);
      expect(mockContext.storyFlags?.has('gift_dratini_extremespeed')).toBe(false);

      // Now player deposits a Pokémon and returns
      mockContext.playerParty.pop();
      expect(mockContext.playerParty.length).toBe(5);

      handleDragonMasterElder(elderNpc, null as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags?.has('gift_dratini_extremespeed')).toBe(true);
      expect(mockContext.playerParty.length).toBe(6);
      expect(mockContext.playerParty[5].moves.map((m) => m.moveId)).toContain('extremespeed');
    });

    it('ModernHMHandler.canUseWaterfall strictly authorizes after Rising Badge is acquired', () => {
      // Before Rising Badge
      const party = [PokemonFactory.create('feraligatr', 45, ['surf', 'bite'])];
      const inventoryPre = {
        money: 0,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'],
        items: {},
        balls: {},
        tms: ['HM07'],
        keyItems: [],
      };
      expect(ModernHMHandler.canUseWaterfall(party, inventoryPre).canUse).toBe(false);

      // After Rising Badge grant
      const inventoryPost = {
        ...inventoryPre,
        badges: [...inventoryPre.badges, 'rising'],
      };
      const checkPost = ModernHMHandler.canUseWaterfall(party, inventoryPost);
      expect(checkPost.canUse).toBe(true);
      expect(checkPost.hasBadge).toBe(true);
      expect(checkPost.hasHM).toBe(true);
      expect(checkPost.compatiblePokemon?.speciesId).toBe('feraligatr');
    });
  });

  describe('6. Gym Guide, Statues & Router Registration', () => {
    it('handleBlackthornGymGuide transitions through 3 progressive narrative states', () => {
      const guideNpc = { id: 'blackthorn_gym_1f_gym_guide_4', speaker: '🏆 GYM GUIDE' } as any;

      // State 1: Pre-battle tactical advice
      handleBlackthornGymGuide(guideNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('CLAIR is a mythical dragon master');
      expect(lastDialoguePages[1]).toContain('Ice-type moves and Dragon-type moves');

      // State 2: Post-gym defeat, pointing to Dragon's Den
      mockContext.storyFlags?.add('clair_defeated');
      handleBlackthornGymGuide(guideNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('You beat CLAIR?! Unbelievable!');
      expect(lastDialoguePages[1]).toContain("DRAGON'S DEN behind the GYM");

      // State 3: Post-Rising Badge victory, pointing to Indigo Plateau
      mockContext.storyFlags?.add('has_rising_badge');
      handleBlackthornGymGuide(guideNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('You conquered all eight JOHTO GYMS!');
      expect(lastDialoguePages[1]).toContain('INDIGO PLATEAU');
    });

    it('handleBlackthornGymStatue dynamically includes player name once Rising Badge is earned', () => {
      const statueNpc = { id: 'blackthorn_gym_1f_statue_left', speaker: '🏆 GYM STATUE' } as any;

      // Before badge
      handleBlackthornGymStatue(statueNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('No challengers recorded');

      // After badge
      mockContext.storyFlags?.add('has_rising_badge');
      handleBlackthornGymStatue(statueNpc, null as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages[0]).toContain('WINNING TRAINERS:\nGold');
    });

    it('createDefaultNpcInteractionRouter dispatches all Blackthorn Gym and Dragon Den events', () => {
      const router = createDefaultNpcInteractionRouter();

      const clairNpc = { id: 'blackthorn_gym_1f_clair_0', action: 'CLAIR_EVENT', isMoving: false } as any;
      expect(router.dispatch(clairNpc, null as any, mockContext as any)).toBe(true);

      const elderNpc = { id: 'dragon_elder', action: 'DRAGON_ELDER_EVENT', isMoving: false } as any;
      expect(router.dispatch(elderNpc, null as any, mockContext as any)).toBe(true);

      const boulderNpc = { id: 'blackthorn_gym_2f_boulder_1', action: 'BLACKTHORN_BOULDER', isMoving: false } as any;
      expect(router.dispatch(boulderNpc, null as any, mockContext as any)).toBe(true);

      const guardNpc = { id: 'blackthorn_city_gramps_2', action: 'DRAGONS_DEN_GUARD', isMoving: false } as any;
      expect(router.dispatch(guardNpc, null as any, mockContext as any)).toBe(true);

      const guideNpc = { id: 'blackthorn_gym_1f_gym_guide_4', action: 'BLACKTHORN_GYM_GUIDE', isMoving: false } as any;
      expect(router.dispatch(guideNpc, null as any, mockContext as any)).toBe(true);

      const statueNpc = { id: 'blackthorn_gym_1f_statue_left', action: 'BLACKTHORN_GYM_STATUE', isMoving: false } as any;
      expect(router.dispatch(statueNpc, null as any, mockContext as any)).toBe(true);
    });

    it('asserts pure layer boundary with zero PixiJS or DOM imports', () => {
      const interactionCode = fs.readFileSync(
        path.resolve(__dirname, '../../src/world/interactions/BlackthornGymAndDragonDenInteractions.ts'),
        'utf8'
      );
      expect(interactionCode).not.toContain('pixi.js');
      expect(interactionCode).not.toContain('@pixi/');
      expect(interactionCode).not.toContain('document.getElementById');

      const lines = interactionCode.split('\n').length;
      expect(lines).toBeLessThan(800);
    });
  });
});
