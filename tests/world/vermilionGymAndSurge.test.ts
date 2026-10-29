import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createKantoVermilionNpcs } from '../../src/world/npcs/kantoVermilionNpcs';
import {
  handleVermilionGymTrashCan,
  handleLtSurgeInteraction,
  handleVermilionGymTrainer,
  handleVermilionGymGuideAndStatues,
  handlePokemonFanClubInteractions,
  handleVermilionCutTree,
  getPuzzleState,
  setPuzzleState,
  resetPuzzleState,
  TRASH_CAN_COORDINATES,
  TRASH_CAN_NEIGHBORS,
  getVermilionGymInteractions,
} from '../../src/world/interactions/VermilionGymInteractions';
import { OverworldWarpAndMapTransitionController } from '../../src/world/OverworldWarpAndMapTransitionController';

describe('TICKET-BATTLE-VERMILION-GYM-SURGE-01: Vermilion Gym, Lt. Surge & Fan Club Verification', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let vermilionCity: MapData;
  let vermilionGym: MapData;
  let pokemonFanClub: MapData;

  beforeEach(() => {
    vermilionCity = JSON.parse(
      fs.readFileSync(path.join(mapsDir, 'vermilion_city.json'), 'utf8')
    );
    vermilionGym = JSON.parse(
      fs.readFileSync(path.join(mapsDir, 'vermilion_gym.json'), 'utf8')
    );
    pokemonFanClub = JSON.parse(
      fs.readFileSync(path.join(mapsDir, 'pokemon_fan_club.json'), 'utf8')
    );
    resetPuzzleState();
  });

  describe('1. Map & Reciprocal Warp Integrity', () => {
    it('verifies pokemon_fan_club map dimensions and tileset', () => {
      expect(pokemonFanClub.id).toBe('pokemon_fan_club');
      expect(pokemonFanClub.width).toBe(10);
      expect(pokemonFanClub.height).toBe(8);
      expect(pokemonFanClub.warps.length).toBeGreaterThanOrEqual(2);
      expect(pokemonFanClub.warps).toContainEqual({
        x: 2,
        y: 7,
        targetMapId: 'vermilion_city',
        targetX: 7,
        targetY: 13,
      });
      expect(pokemonFanClub.warps).toContainEqual({
        x: 3,
        y: 7,
        targetMapId: 'vermilion_city',
        targetX: 7,
        targetY: 13,
      });
    });

    it('verifies vermilion_city contains reciprocal warp to pokemon_fan_club at (7, 13)', () => {
      const fanClubWarp = vermilionCity.warps.find(
        (w) => w.x === 7 && w.y === 13
      );
      expect(fanClubWarp).toBeDefined();
      expect(fanClubWarp?.targetMapId).toBe('pokemon_fan_club');
      expect(fanClubWarp?.targetX).toBe(2);
      expect(fanClubWarp?.targetY).toBe(7);
    });

    it('verifies vermilion_gym warps correctly return to vermilion_city at (10, 20)', () => {
      expect(vermilionGym.id).toBe('vermilion_gym');
      expect(vermilionGym.width).toBe(10);
      expect(vermilionGym.height).toBe(18);
      expect(vermilionGym.warps).toContainEqual({
        x: 4,
        y: 17,
        targetMapId: 'vermilion_city',
        targetX: 10,
        targetY: 20,
      });
      expect(vermilionGym.warps).toContainEqual({
        x: 5,
        y: 17,
        targetMapId: 'vermilion_city',
        targetX: 10,
        targetY: 20,
      });
    });
  });

  describe('2. Vermilion Gym Trash Can Puzzle Geometry & Mechanics', () => {
    it('verifies all 15 canonical trash can coordinates exist and match authentic pokecrystal positions', () => {
      expect(TRASH_CAN_COORDINATES).toHaveLength(15);
      const expectedCoords = [
        { x: 1, y: 7 }, { x: 3, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 7 }, { x: 9, y: 7 },
        { x: 1, y: 9 }, { x: 3, y: 9 }, { x: 5, y: 9 }, { x: 7, y: 9 }, { x: 9, y: 9 },
        { x: 1, y: 11 }, { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 9, y: 11 },
      ];
      expect(TRASH_CAN_COORDINATES).toEqual(expectedCoords);
    });

    it('validates 15 trash can bgEvents are registered in vermilion_gym.json', () => {
      for (let i = 0; i < 15; i++) {
        const can = TRASH_CAN_COORDINATES[i];
        const event = vermilionGym.bgEvents.find(
          (b) => b.x === can.x && b.y === can.y && b.action === `VERMILION_GYM_TRASH_CAN_${i}`
        );
        expect(event, `Trash can ${i} at (${can.x}, ${can.y}) must be in bgEvents`).toBeDefined();
      }
    });

    it('verifies orthogonal neighbor adjacency matrix for all 15 cans', () => {
      for (let i = 0; i < 15; i++) {
        const neighbors = TRASH_CAN_NEIGHBORS[i];
        expect(neighbors.length).toBeGreaterThanOrEqual(2);
        expect(neighbors.length).toBeLessThanOrEqual(4);
        const { x, y } = TRASH_CAN_COORDINATES[i];
        for (const n of neighbors) {
          const nCoord = TRASH_CAN_COORDINATES[n];
          const dist = Math.abs(x - nCoord.x) + Math.abs(y - nCoord.y);
          expect(dist).toBe(2); // In 2-step coordinate grid: dx=2 or dy=2
        }
      }
    });

    it('handles first switch trigger and neighbor second switch barrier clearance', () => {
      setPuzzleState({
        firstSwitchIndex: 2,
        secondSwitchIndex: 3,
        firstSwitchPressed: false,
        barrierOpen: false,
      });

      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[], _spk?: string, onComplete?: () => void) => {
          dialogText = pages.join(' ');
          onComplete?.();
        },
        mapManager: {
          getCurrentMap: () => vermilionGym,
        },
        showToast: () => {},
        saveCurrentGame: () => {},
      };

      // 1. Inspect wrong can
      handleVermilionGymTrashCan(0, ctx);
      expect(dialogText).toContain('Nope! Nothing here but trash.');
      expect(getPuzzleState().firstSwitchPressed).toBe(false);

      // 2. Inspect first switch
      handleVermilionGymTrashCan(2, ctx);
      expect(dialogText).toContain('first electric lock was deactivated');
      expect(getPuzzleState().firstSwitchPressed).toBe(true);
      expect(getPuzzleState().barrierOpen).toBe(false);

      // 3. Inspect second switch (neighbor)
      handleVermilionGymTrashCan(3, ctx);
      expect(dialogText).toContain('second electric lock opened');
      expect(getPuzzleState().barrierOpen).toBe(true);
      expect(ctx.storyFlags.has('vermilion_gym_barrier_open')).toBe(true);

      // Barrier tiles cleared
      expect(vermilionGym.collisionGrid[4 * 10 + 4]).toBe(0);
      expect(vermilionGym.collisionGrid[4 * 10 + 5]).toBe(0);
    });

    it('resets puzzle and first switch when second can inspected is incorrect', () => {
      setPuzzleState({
        firstSwitchIndex: 6,
        secondSwitchIndex: 7,
        firstSwitchPressed: true,
        barrierOpen: false,
      });

      let dialogText = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          dialogText = pages.join(' ');
        },
        mapManager: { getCurrentMap: () => vermilionGym },
      };

      // Inspect wrong second can
      handleVermilionGymTrashCan(1, ctx);
      expect(dialogText).toContain('electric fences are back on');
      expect(dialogText).toContain('switches reset');
      expect(getPuzzleState().firstSwitchPressed).toBe(false);
      expect(getPuzzleState().barrierOpen).toBe(false);
    });

    it('returns trash dialogue once barrier is already open or surge defeated', () => {
      const ctx: any = {
        storyFlags: new Set<string>(['surge_defeated']),
        openDialogue: (pages: string[]) => {
          expect(pages[0]).toBe('Nope! Nothing here but trash.');
        },
        mapManager: { getCurrentMap: () => vermilionGym },
      };

      handleVermilionGymTrashCan(0, ctx);
      handleVermilionGymTrashCan(4, ctx);
    });
  });

  describe('3. Dynamic Map Mutations & Barrier Collision Integrity', () => {
    it('blocks (4, 4) and (5, 4) in vermilion_gym when barrier is closed', () => {
      const ctx: any = {
        storyFlags: new Set<string>(),
      };
      OverworldWarpAndMapTransitionController.applyMapStoryMutations(ctx, vermilionGym);
      expect(vermilionGym.collisionGrid[4 * vermilionGym.width + 4]).toBe(1);
      expect(vermilionGym.collisionGrid[4 * vermilionGym.width + 5]).toBe(1);
    });

    it('unblocks (4, 4) and (5, 4) in vermilion_gym when vermilion_gym_barrier_open is set', () => {
      const ctx: any = {
        storyFlags: new Set<string>(['vermilion_gym_barrier_open']),
      };
      OverworldWarpAndMapTransitionController.applyMapStoryMutations(ctx, vermilionGym);
      expect(vermilionGym.collisionGrid[4 * vermilionGym.width + 4]).toBe(0);
      expect(vermilionGym.collisionGrid[4 * vermilionGym.width + 5]).toBe(0);
    });

    it('unblocks (4, 4) and (5, 4) in vermilion_gym when surge_defeated is set', () => {
      const ctx: any = {
        storyFlags: new Set<string>(['surge_defeated']),
      };
      OverworldWarpAndMapTransitionController.applyMapStoryMutations(ctx, vermilionGym);
      expect(vermilionGym.collisionGrid[4 * vermilionGym.width + 4]).toBe(0);
      expect(vermilionGym.collisionGrid[4 * vermilionGym.width + 5]).toBe(0);
    });
  });

  describe('4. Lt. Surge Boss Battle, ThunderBadge & TM34 Swagger', () => {
    it('triggers Lt. Surge boss battle with authentic 5-Pokémon roster and awards ThunderBadge & TM34', async () => {
      const npcs = createKantoVermilionNpcs();
      const surgeNpc = npcs.vermilion_gym.find((n) => n.id === 'vermilion_gym_surge');
      expect(surgeNpc).toBeDefined();

      let battleTriggered = false;
      let battleOptions: any = null;
      let dialogText = '';

      const ctx: any = {
        playerName: 'GOLD',
        playerParty: [],
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        inventory: { badges: [], tms: [], items: {} },
        audioManager: { playSfx: () => {} },
        mapManager: { getCurrentMap: () => vermilionGym },
        openDialogue: (pages: string[], _spk?: string, onComplete?: () => void) => {
          dialogText = pages.join(' ');
          onComplete?.();
        },
        triggerBattle: async (_pkmn: any, options: any) => {
          battleTriggered = true;
          battleOptions = options;
        },
        addOverworldItemToInventory: (itemId: string) => {
          ctx.inventory.items[itemId] = 1;
        },
        saveCurrentGame: () => {},
        showToast: () => {},
      };

      handleLtSurgeInteraction(surgeNpc!, ctx);
      expect(dialogText).toContain('When it comes to electric POKéMON, I\'m number one!');
      expect(battleTriggered).toBe(true);
      expect(battleOptions.isGymLeader).toBe(true);
      expect(battleOptions.trainerName).toBe('LT. SURGE');

      // Verify 5-Pokémon team
      const team = battleOptions.trainerTeam;
      expect(team).toHaveLength(5);
      expect(team[0].speciesId).toBe('raichu');
      expect(team[0].level).toBe(44);
      expect(team[1].speciesId).toBe('electrode');
      expect(team[1].level).toBe(40);
      expect(team[2].speciesId).toBe('magneton');
      expect(team[2].level).toBe(40);
      expect(team[3].speciesId).toBe('electrode');
      expect(team[3].level).toBe(40);
      expect(team[4].speciesId).toBe('electabuzz');
      expect(team[4].level).toBe(46);

      // Simulate victory callback
      battleOptions.onVictory();
      expect(ctx.storyFlags.has('surge_defeated')).toBe(true);
      expect(ctx.storyFlags.has('thunder_badge')).toBe(true);
      expect(ctx.inventory.badges).toContain('thunder');
      expect(ctx.inventory.tms).toContain('TM34');
      expect(dialogText).toContain('received the THUNDERBADGE');
      expect(dialogText).toContain('TM34 contains SWAGGER');

      // Subsequent interaction recognizes defeat
      dialogText = '';
      handleLtSurgeInteraction(surgeNpc!, ctx);
      expect(dialogText).toContain('An electric soul never dims');
    });

    it('verifies Gym Guide advice before battle and congratulation after battle', () => {
      const npcs = createKantoVermilionNpcs();
      const guideNpc = npcs.vermilion_gym.find((n) => n.id === 'vermilion_gym_guide');
      expect(guideNpc).toBeDefined();

      let text = '';
      const ctx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          text = pages.join(' ');
        },
      };

      handleVermilionGymGuideAndStatues(guideNpc!, ctx);
      expect(text).toContain('Ground-type Pokémon are immune to electric attacks');

      ctx.storyFlags.add('surge_defeated');
      handleVermilionGymGuideAndStatues(guideNpc!, ctx);
      expect(text).toContain('That was an electrifying battle');
    });

    it('verifies dynamic Gym Statues reflect RED and player name upon victory', () => {
      let text = '';
      const ctx: any = {
        playerName: 'GOLD',
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          text = pages.join('\n');
        },
      };

      const statueEntity: any = { action: 'VERMILION_GYM_STATUE', id: 'vermilion_gym_statue_left' };
      handleVermilionGymGuideAndStatues(statueEntity, ctx);
      expect(text).toContain('WINNING TRAINERS:\nRED');
      expect(text).not.toContain('GOLD');

      ctx.storyFlags.add('surge_defeated');
      handleVermilionGymGuideAndStatues(statueEntity, ctx);
      expect(text).toContain('WINNING TRAINERS:\nRED\nGOLD');
    });

    it('verifies Vermilion Gym trainers (Horton, Gregory, Vincent) challenge and defeat logic', () => {
      const npcs = createKantoVermilionNpcs();
      const horton = npcs.vermilion_gym.find((n) => n.id === 'vermilion_gym_juggler_horton');
      const gregory = npcs.vermilion_gym.find((n) => n.id === 'vermilion_gym_gentleman_gregory');
      const vincent = npcs.vermilion_gym.find((n) => n.id === 'vermilion_gym_guitarist_vincent');

      expect(horton).toBeDefined();
      expect(gregory).toBeDefined();
      expect(vincent).toBeDefined();

      let battleTriggered = false;
      const ctx: any = {
        defeatedTrainers: new Set<string>(),
        buildTrainerTeamInstances: (npc: any) => npc.team || [],
        openDialogue: (_pages: string[], _spk?: string, onComplete?: () => void) => {
          onComplete?.();
        },
        triggerBattle: async (_pkmn: any, options: any) => {
          battleTriggered = true;
          options.onVictory();
        },
        saveCurrentGame: () => {},
      };

      handleVermilionGymTrainer(horton!, ctx);
      expect(battleTriggered).toBe(true);
      expect(ctx.defeatedTrainers.has('juggler_horton')).toBe(true);

      // Talking after victory shows defeat monologue
      let postText = '';
      ctx.openDialogue = (pages: string[]) => {
        postText = pages.join(' ');
      };
      handleVermilionGymTrainer(horton!, ctx);
      expect(postText).toContain('My balls dropped completely out of rhythm');
    });
  });

  describe('5. Pokémon Fan Club Interactions', () => {
    it('awards Rare Candy upon listening to Chairman monologue and sets got_fan_club_rare_candy', () => {
      const npcs = createKantoVermilionNpcs();
      const chairman = npcs.pokemon_fan_club.find((n) => n.id === 'fan_club_chairman');
      expect(chairman).toBeDefined();

      let dialogPages: string[] = [];
      const ctx: any = {
        playerName: 'GOLD',
        storyFlags: new Set<string>(),
        inventory: { items: {} },
        openDialogue: (pages: string[], _spk?: string, onComplete?: () => void) => {
          dialogPages = pages;
          onComplete?.();
        },
        addOverworldItemToInventory: (item: string) => {
          ctx.inventory.items[item] = (ctx.inventory.items[item] || 0) + 1;
        },
        saveCurrentGame: () => {},
        showToast: () => {},
      };

      handlePokemonFanClubInteractions(chairman!, ctx);
      expect(dialogPages.join(' ')).toContain('received RARE CANDY from the FAN CLUB CHAIRMAN');
      expect(ctx.storyFlags.has('got_fan_club_rare_candy')).toBe(true);
      expect(ctx.inventory.items['rare-candy']).toBe(1);

      // Speaking to Chairman again produces Rapidash conversation without re-awarding
      dialogPages = [];
      handlePokemonFanClubInteractions(chairman!, ctx);
      expect(dialogPages.join(' ')).toContain('Did I tell you about my RAPIDASH today?');
      expect(ctx.inventory.items['rare-candy']).toBe(1);
    });

    it('handles Clefairy Guy Lost Item doll quest integration', () => {
      const npcs = createKantoVermilionNpcs();
      const clefairyGuy = npcs.pokemon_fan_club.find((n) => n.id === 'fan_club_clefairy_guy');
      expect(clefairyGuy).toBeDefined();

      let text = '';
      const ctx: any = {
        playerName: 'GOLD',
        storyFlags: new Set<string>(),
        inventory: { keyItems: [] },
        openDialogue: (pages: string[], _spk?: string, onComplete?: () => void) => {
          text = pages.join(' ');
          onComplete?.();
        },
        addOverworldItemToInventory: (keyItem: string) => {
          ctx.inventory.keyItems.push(keyItem);
        },
        saveCurrentGame: () => {},
        showToast: () => {},
      };

      // 1. Without Copycat quest active
      handlePokemonFanClubInteractions(clefairyGuy!, ctx);
      expect(text).toContain('I just love CLEFAIRY');
      expect(ctx.storyFlags.has('got_lost_item_clefairy_doll')).toBe(false);

      // 2. With Copycat quest active
      ctx.storyFlags.add('copycat_lost_doll');
      handlePokemonFanClubInteractions(clefairyGuy!, ctx);
      expect(text).toContain('received the LOST ITEM from the POKéFAN');
      expect(ctx.storyFlags.has('got_lost_item_clefairy_doll')).toBe(true);
      expect(ctx.storyFlags.has('has_lost_item')).toBe(true);
      expect(ctx.inventory.keyItems).toContain('lost-item');

      // 3. After receiving Lost Item
      text = '';
      handlePokemonFanClubInteractions(clefairyGuy!, ctx);
      expect(text).toContain('I hope COPYCAT is overjoyed');
    });
  });

  describe('6. Vermilion City Cut Tree Obstacle at (10, 20)', () => {
    it('blocks access if player cannot use Cut', () => {
      let text = '';
      const ctx: any = {
        playerName: 'GOLD',
        inventory: { badges: [], tms: [] },
        storyFlags: new Set<string>(),
        playerParty: [],
        openDialogue: (pages: string[]) => {
          text = pages.join(' ');
        },
      };

      handleVermilionCutTree(ctx, 10, 20);
      expect(text).toContain('This tree looks like it can be CUT down');
      expect(ctx.storyFlags.has('vermilion_cut_tree_cleared')).toBe(false);
    });

    it('clears tree and collision at (10, 20) when player has HM01 Cut & HiveBadge', () => {
      let text = '';
      const ctx: any = {
        playerName: 'GOLD',
        inventory: { badges: ['hive'], tms: ['HM01'] },
        storyFlags: new Set<string>(),
        playerParty: [{ nickname: 'ODDISH', speciesId: 'oddish', types: ['Grass', 'Poison'], moves: [] }],
        mapManager: { getCurrentMap: () => vermilionCity },
        openDialogue: (pages: string[], _spk?: string, onComplete?: () => void) => {
          text = pages.join(' ');
          onComplete?.();
        },
        renderMap: () => {},
        syncMapOverworldItems: () => {},
        saveCurrentGame: () => {},
        showToast: () => {},
      };

      handleVermilionCutTree(ctx, 10, 20);
      expect(text).toContain('ODDISH hacked away with CUT');
      expect(ctx.storyFlags.has('vermilion_cut_tree_cleared')).toBe(true);
      expect(vermilionCity.collisionGrid[20 * vermilionCity.width + 10]).toBe(0);
    });
  });

  describe('7. 100% Walkability of all Vermilion NPCs', () => {
    it('verifies all NPCs across vermilion_gym, pokemon_fan_club, vermilion_city, and houses stand on walkable tiles (0 or 2)', () => {
      const allNpcs = createKantoVermilionNpcs();
      const mapFiles: Record<string, MapData> = {
        vermilion_gym: vermilionGym,
        pokemon_fan_club: pokemonFanClub,
        vermilion_city: vermilionCity,
        vermilion_fishing_house: JSON.parse(
          fs.readFileSync(path.join(mapsDir, 'vermilion_fishing_house.json'), 'utf8')
        ),
        vermilion_magnet_train_house: JSON.parse(
          fs.readFileSync(path.join(mapsDir, 'vermilion_magnet_train_house.json'), 'utf8')
        ),
        vermilion_digletts_house: JSON.parse(
          fs.readFileSync(path.join(mapsDir, 'vermilion_digletts_house.json'), 'utf8')
        ),
      };

      for (const [mapId, npcs] of Object.entries(allNpcs)) {
        const map = mapFiles[mapId];
        if (!map) continue;
        for (const npc of npcs) {
          const tileIdx = npc.y * map.width + npc.x;
          const collision = map.collisionGrid[tileIdx];
          expect(
            collision === 0 || collision === 2,
            `NPC "${npc.id}" on map "${mapId}" at (${npc.x}, ${npc.y}) must stand on walkable tile (0 or 2), received: ${collision}`
          ).toBe(true);
        }
      }
    });
  });

  describe('8. Interaction Router Integration', () => {
    it('verifies all Vermilion Gym & Fan Club interaction registrations are valid and have non-empty handlers', () => {
      const registrations = getVermilionGymInteractions();
      expect(registrations.length).toBeGreaterThanOrEqual(20);
      for (const reg of registrations) {
        expect(typeof reg.handler).toBe('function');
      }
    });
  });
});
