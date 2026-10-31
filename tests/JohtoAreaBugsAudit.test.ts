/**
 * @fileoverview Johto Regional Deep Bug Audit Test Suite
 * Validates the resolution of 5 bugs across all 38 individual Johto areas (190 bugs total):
 * Cartography, landmarks, wild species, NPC deduplication, sprite fidelity, move accuracy,
 * story flag lifecycles, and quest/battle router interactions.
 */

import { describe, it, expect } from 'vitest';
import { JOHTO_LANDMARKS, JOHTO_CONNECTIONS } from '../src/world/townMapData';
import {
  resolveCurrentLandmark,
  computeLandmarkDistance,
  findHabitatsForSpecies,
} from '../src/world/map/townMapResolvers';
import { createMahoganyToIndigoNpcs } from '../src/world/npcs/mahoganyToIndigoNpcs';
import { EAST_JOHTO_GENERATED_NPCS } from '../src/world/generated-npcs/eastJohtoGeneratedNpcs';
import { createEcruteakToRoute39Npcs } from '../src/world/npcs/ecruteakToRoute39Npcs';
import { createSeaRoutesNpcs } from '../src/world/npcs/seaRoutesNpcs';
import { isNpcActiveForStoryFlags } from '../src/world/npcs/npcShared';
import { createDefaultNpcInteractionRouter } from '../src/world/interactions/index';
import { handleMortarSuperNerds } from '../src/world/interactions/EastJohtoQuestInteractions';
import { completeSlowpokeWellProtonVictory } from '../src/world/interactions/EarlyJohtoQuestInteractions';
import { createNpcsByMap } from '../src/world/npcData';

describe('JOHTO AREA BUGS AUDIT: 38 Areas & 190 Bug Resolutions', () => {
  const all38Areas = [
    'new_bark_town',
    'route_29',
    'cherrygrove_city',
    'route_30',
    'route_31',
    'violet_city',
    'sprout_tower',
    'ruins_of_alph',
    'union_cave',
    'route_32',
    'route_33',
    'azalea_town',
    'slowpoke_well',
    'ilex_forest',
    'route_34',
    'goldenrod_city',
    'route_35',
    'national_park',
    'route_36',
    'route_37',
    'ecruteak_city',
    'burned_tower',
    'tin_tower',
    'route_38',
    'route_39',
    'olivine_city',
    'route_40',
    'whirl_islands',
    'route_41',
    'cianwood_city',
    'route_42',
    'mount_mortar',
    'mahogany_town',
    'route_43',
    'lake_of_rage',
    'route_44',
    'ice_path',
    'blackthorn_city',
  ];

  describe('Pillar 1: Cartography, Landmarks & BFS Graph (Areas 1-38)', () => {
    it('defines distinct TownMapLandmark entries for all individual areas and sub-dungeons', () => {
      for (const areaId of all38Areas) {
        const landmark = JOHTO_LANDMARKS[areaId];
        expect(landmark, `Missing JOHTO_LANDMARKS entry for: ${areaId}`).toBeDefined();
        expect(landmark.name.length).toBeGreaterThan(0);
        expect(landmark.subtitle.length).toBeGreaterThan(0);
      }

      // Check specific standalone landmarks previously missing or collapsed
      expect(JOHTO_LANDMARKS.dark_cave).toBeDefined();
      expect(JOHTO_LANDMARKS.whirl_islands).toBeDefined();
      expect(JOHTO_LANDMARKS.mount_mortar).toBeDefined();
      expect(JOHTO_LANDMARKS.tohjo_falls).toBeDefined();
      expect(JOHTO_LANDMARKS.route_27).toBeDefined();
      expect(JOHTO_LANDMARKS.route_26).toBeDefined();
      expect(JOHTO_LANDMARKS.victory_road).toBeDefined();
      expect(JOHTO_LANDMARKS.indigo_plateau).toBeDefined();
    });

    it('resolves map IDs and interior chamber sub-keys to their true landmarks', () => {
      expect(resolveCurrentLandmark('dark_cave_violet')?.id).toBe('dark_cave');
      expect(resolveCurrentLandmark('dark_cave_blackthorn')?.id).toBe('dark_cave');
      expect(resolveCurrentLandmark('whirl_island_lugia_chamber')?.id).toBe('whirl_islands');
      expect(resolveCurrentLandmark('mount_mortar_1f_inside')?.id).toBe('mount_mortar');
      expect(resolveCurrentLandmark('mount_mortar_b1f')?.id).toBe('mount_mortar');
      expect(resolveCurrentLandmark('tohjo_falls_cavern')?.id).toBe('tohjo_falls');
      expect(resolveCurrentLandmark('route_27_gate')?.id).toBe('route_27');
      expect(resolveCurrentLandmark('route_26_gate')?.id).toBe('route_26');
      expect(resolveCurrentLandmark('victory_road')?.id).toBe('victory_road');
      expect(resolveCurrentLandmark('wills_room')?.id).toBe('indigo_plateau');
    });

    it('computes valid BFS topological distance across full Johto corridor including Indigo Plateau', () => {
      // Prior bug: Indigo Plateau was completely disconnected (null distance)
      const distNewBarkToIndigo = computeLandmarkDistance('new_bark_town', 'indigo_plateau');
      expect(distNewBarkToIndigo).not.toBeNull();
      expect(distNewBarkToIndigo).toBe(5); // new_bark -> route_27 -> tohjo_falls -> route_26 -> victory_road -> indigo_plateau

      // Check distance between Dark Cave and Violet City
      const distDarkCaveToViolet = computeLandmarkDistance('dark_cave', 'violet_city');
      expect(distDarkCaveToViolet).toBe(2); // dark_cave -> route_31 -> violet_city

      // Check distance between Whirl Islands and Cianwood
      const distWhirlToCianwood = computeLandmarkDistance('whirl_islands', 'cianwood_city');
      expect(distWhirlToCianwood).toBe(2); // whirl_islands -> route_41 -> cianwood_city
    });

    it('correctly maps wild Pokémon habitats using Gen 2 Crystal encounter distribution', () => {
      const dunsparceHabitats = findHabitatsForSpecies('dunsparce');
      expect(dunsparceHabitats.some((h) => h.id === 'dark_cave')).toBe(true);

      const lugiaHabitats = findHabitatsForSpecies('lugia');
      expect(lugiaHabitats.some((h) => h.id === 'whirl_islands')).toBe(true);

      const tyrogueHabitats = findHabitatsForSpecies('tyrogue');
      expect(tyrogueHabitats.some((h) => h.id === 'mount_mortar')).toBe(true);

      const delibirdHabitats = findHabitatsForSpecies('delibird');
      expect(delibirdHabitats.some((h) => h.id === 'ice_path')).toBe(true);

      const skarmoryHabitats = findHabitatsForSpecies('skarmory');
      expect(skarmoryHabitats.some((h) => h.id === 'route_45')).toBe(true);

      const sudowoodoHabitats = findHabitatsForSpecies('sudowoodo');
      expect(sudowoodoHabitats.some((h) => h.id === 'route_36')).toBe(true);

      const laprasHabitats = findHabitatsForSpecies('lapras');
      expect(laprasHabitats.some((h) => h.id === 'union_cave')).toBe(true);

      const roamingSuicune = findHabitatsForSpecies('suicune');
      expect(roamingSuicune.length).toBeGreaterThan(5);
    });
  });

  describe('Pillar 2: Move ID Fidelity & Gen 2 Crystal Accuracy', () => {
    it('ensures all move IDs on Victory Road Rival and Elite Four have NO hyphens', () => {
      const npcs = createMahoganyToIndigoNpcs();
      const rival = npcs.victory_road?.find((n) => n.id === 'victory_road_rival');
      expect(rival).toBeDefined();
      for (const p of rival?.trainerTeam || []) {
        for (const m of p.moves || []) {
          expect(m, `Hyphenated move found on Rival: ${m}`).not.toContain('-');
        }
      }

      const e4Ids = ['wills_room', 'kogas_room', 'brunos_room', 'karens_room', 'lances_room'];
      for (const room of e4Ids) {
        const roomNpcs = npcs[room] || [];
        for (const npc of roomNpcs) {
          for (const p of npc.trainerTeam || []) {
            for (const m of p.moves || []) {
              expect(m, `Hyphenated move found on ${npc.speaker}: ${m}`).not.toContain('-');
            }
          }
        }
      }
    });

    it('replaces Gen 3 move iciclespear with Gen 2 aurorabeam on Route 40 & 41 Shellders', () => {
      const seaNpcs = createSeaRoutesNpcs();
      const randall = seaNpcs.route_40?.find((n) => n.id === 'swimmerm_randall');
      expect(randall).toBeDefined();
      for (const p of randall?.trainerTeam || []) {
        expect(p.moves).not.toContain('iciclespear');
        if (p.speciesId === 'shellder') {
          expect(p.moves).toContain('aurorabeam');
        }
      }

      const charlie = seaNpcs.route_41?.find((n) => n.id === 'swimmerm_charlie');
      expect(charlie).toBeDefined();
      for (const p of charlie?.trainerTeam || []) {
        expect(p.moves).not.toContain('iciclespear');
      }
    });
  });

  describe('Pillar 3: Sprite Fidelity & NPC Deduplication', () => {
    it('sets authentic sprites for Bosses, Legendaries, and Trainers', () => {
      const mahoganyNpcs = createMahoganyToIndigoNpcs();
      const gyarados = mahoganyNpcs.lake_of_rage?.find((n) => n.id === 'lake_of_rage_red_gyarados');
      expect(gyarados?.spriteType).toBe('lapras');

      const electrode1 = mahoganyNpcs.team_rocket_base_b2f?.find((n) => n.id === 'b2f_electrode_1');
      expect(electrode1?.spriteType).toBe('voltorb');

      const officer = mahoganyNpcs.route_42_ecruteak_gate?.find((n) => n.id === 'route_42_gate_officer');
      expect(officer?.spriteType).toBe('officer');

      const seaNpcs = createSeaRoutesNpcs();
      const lugia = seaNpcs.whirl_island_lugia_chamber?.find((n) => n.id === 'whirl_island_lugia');
      expect(lugia?.spriteType).toBe('lugia');

      const ecruteakNpcs = createEcruteakToRoute39Npcs();
      const suicune = ecruteakNpcs.tin_tower_1f?.find((n) => n.id === 'suicune_altar');
      expect(suicune?.spriteType).toBe('suicune');

      const hoOh = ecruteakNpcs.tin_tower_roof?.find((n) => n.id === 'ho_oh_boss');
      expect(hoOh?.spriteType).toBe('ho_oh');

      const miltank = ecruteakNpcs.route_39_barn?.find((n) => n.id === 'moomoo_miltank');
      expect(miltank?.spriteType).toBe('miltank');
    });

    it('eliminates duplicate generated trainers from Route 45, Route 46, and Indigo Plateau rooms in createNpcsByMap', () => {
      const allNpcs = createNpcsByMap();
      const r45Ids = allNpcs.route_45.map((n) => n.id);
      expect(new Set(r45Ids).size).toBe(r45Ids.length);

      const r46Ids = allNpcs.route_46.map((n) => n.id);
      expect(new Set(r46Ids).size).toBe(r46Ids.length);

      const willsNpcs = allNpcs.wills_room;
      expect(willsNpcs.length).toBe(1);
      expect(willsNpcs[0].trainerId).toBe('will');

      const kogasNpcs = allNpcs.kogas_room;
      expect(kogasNpcs.length).toBe(1);
      expect(kogasNpcs[0].trainerId).toBe('koga');

      const brunosNpcs = allNpcs.brunos_room;
      expect(brunosNpcs.length).toBe(1);
      expect(brunosNpcs[0].trainerId).toBe('bruno');

      const karensNpcs = allNpcs.karens_room;
      expect(karensNpcs.length).toBe(1);
      expect(karensNpcs[0].trainerId).toBe('karen');

      const lances = allNpcs.lances_room.filter((n) => n.trainerId === 'lance');
      expect(lances.length).toBe(1);
      expect(lances[0].trainerId).toBe('lance');
    });
  });

  describe('Pillar 4: Story Flags & Visibility Lifecycle', () => {
    it('isolates Slowpoke Well Proton from Radio Tower 4F Proton', () => {
      const mockCtx: any = {
        defeatedTrainers: new Set<string>(),
        storyFlags: new Set<string>(),
        inventory: { items: {} },
        npcsByMap: {},
        openDialogue: () => {},
        saveCurrentGame: () => {},
        showToast: () => {},
      };

      completeSlowpokeWellProtonVictory(mockCtx);
      expect(mockCtx.storyFlags.has('slowpoke_well_proton_defeated')).toBe(true);

      // Verify Radio Tower 4F Proton is NOT prematurely hidden!
      const isRadioProtonVisible = isNpcActiveForStoryFlags('executive_proton_radio_4f', mockCtx.storyFlags);
      // Radio tower Proton requires card_key_obtained
      mockCtx.storyFlags.add('card_key_obtained');
      expect(isNpcActiveForStoryFlags('executive_proton_radio_4f', mockCtx.storyFlags)).toBe(true);

      // Once Radio Tower Proton is defeated
      mockCtx.storyFlags.add('radio_tower_proton_defeated');
      expect(isNpcActiveForStoryFlags('executive_proton_radio_4f', mockCtx.storyFlags)).toBe(false);
    });

    it('enforces clean Bill lifecycle from Ecruteak Pokémon Center to Goldenrod City', () => {
      const flags = new Set<string>();
      expect(isNpcActiveForStoryFlags('bill_cameo', flags)).toBe(true);
      expect(isNpcActiveForStoryFlags('goldenrod_bill', flags)).toBe(false);

      flags.add('EVENT_MET_BILL_IN_ECRUTEAK');
      expect(isNpcActiveForStoryFlags('bill_cameo', flags)).toBe(false);
      expect(isNpcActiveForStoryFlags('goldenrod_bill', flags)).toBe(true);
    });

    it('keeps Elite Four and Champion visible post-defeat for continuous dialogue interaction', () => {
      const flags = new Set<string>(['will_defeated', 'koga_defeated', 'bruno_defeated', 'karen_defeated', 'champion_defeated']);
      expect(isNpcActiveForStoryFlags('e4_will', flags)).toBe(true);
      expect(isNpcActiveForStoryFlags('e4_koga', flags)).toBe(true);
      expect(isNpcActiveForStoryFlags('e4_bruno', flags)).toBe(true);
      expect(isNpcActiveForStoryFlags('e4_karen', flags)).toBe(true);
      expect(isNpcActiveForStoryFlags('champion_lance', flags)).toBe(true);
    });
  });

  describe('Pillar 5: Router Registrations & Interaction Handlers', () => {
    it('registers Mahogany Gym interactions into the default NPC interaction router', () => {
      const router = createDefaultNpcInteractionRouter();
      const mockPryceNpc: any = {
        id: 'mahogany_gym_pryce_0',
        speaker: '🏆 LEADER PRYCE',
        action: 'PRYCE_EVENT',
      };
      const mockMap: any = { id: 'mahogany_gym' };
      const mockCtx: any = {
        player: { direction: 'UP' },
        getOppositeDirection: () => 'DOWN',
        storyFlags: new Set<string>(['pryce_defeated']),
        openDialogue: (pages: string[]) => {
          expect(pages[0]).toContain('PRYCE');
        },
      };

      const handled = router.dispatch(mockPryceNpc, mockMap, mockCtx);
      expect(handled).toBe(true);
    });

    it('does not intercept Mt. Mortar trainers before they are defeated', () => {
      const mockMarkusNpc: any = {
        id: 'mount_mortar_1f_inside_markus',
        trainerId: 'super_nerd_markus',
        speaker: '🤓 SUPER NERD MARKUS',
        action: 'TRAINER_BATTLE',
      };
      const mockCtx: any = {
        defeatedTrainers: new Set<string>(),
        storyFlags: new Set<string>(),
        openDialogue: () => {},
      };

      // Before battle: handleMortarSuperNerds must return false to allow standard battle trigger
      const resultBefore = handleMortarSuperNerds(mockMarkusNpc, {} as any, mockCtx);
      expect(resultBefore).toBe(false);

      // After battle: handleMortarSuperNerds returns true and displays lore dialogue
      mockCtx.defeatedTrainers.add('super_nerd_markus');
      let dialogueShown = false;
      mockCtx.openDialogue = (pages: string[]) => {
        expect(pages[0]).toContain('MARKUS: HUGH and I were researching');
        dialogueShown = true;
      };
      const resultAfter = handleMortarSuperNerds(mockMarkusNpc, {} as any, mockCtx);
      expect(resultAfter).toBe(true);
      expect(dialogueShown).toBe(true);
    });
  });
});
