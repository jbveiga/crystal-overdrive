import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createOlivineToIndigoNpcs } from '../../src/world/npcs/olivineToIndigoNpcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { getJohtoTownServiceInteractions } from '../../src/world/interactions/JohtoTownServiceInteractions';
import { getGymLeaderInteractions } from '../../src/world/interactions/GymLeaderInteractions';
import { BattleAudio } from '../../src/audio/BattleAudio';
import { PokemonFactory } from '../../src/battle/PokemonFactory';

describe('TICKET-STORY-CURE-AMPHY-AND-JASMINE-RETURN-01: Cure Amphy & Jasmine Return', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const lighthouse6fMap: MapData = JSON.parse(
    fs.readFileSync(path.join(mapsDir, 'olivine_lighthouse_6f.json'), 'utf8')
  );
  const gymMap: MapData = JSON.parse(
    fs.readFileSync(path.join(mapsDir, 'olivine_gym.json'), 'utf8')
  );

  const allNpcs = createOlivineToIndigoNpcs();
  const lighthouse6fNpcs = allNpcs['olivine_lighthouse_6f'] || [];
  const gymNpcs = allNpcs['olivine_gym'] || [];

  describe('1. Lighthouse 6F Pre-Cure State & Active NPC Filtering', () => {
    it('verifies lighthouse_jasmine and lighthouse_amphy are present on 6F', () => {
      const jasmine = lighthouse6fNpcs.find((n) => n.id === 'lighthouse_jasmine');
      const amphy = lighthouse6fNpcs.find((n) => n.id === 'lighthouse_amphy');

      expect(jasmine).toBeDefined();
      expect(jasmine?.x).toBe(8);
      expect(jasmine?.y).toBe(8);
      expect(jasmine?.action).toBe('AMPHY_EVENT');

      expect(amphy).toBeDefined();
      expect(amphy?.x).toBe(9);
      expect(amphy?.y).toBe(8);
      expect(amphy?.action).toBe('AMPHY_EVENT');
    });

    it('asserts lighthouse_jasmine is active before amphy_cured, and leader_jasmine is inactive', () => {
      const flagsBefore = new Set<string>();

      expect(isNpcActiveForStoryFlags('lighthouse_jasmine', flagsBefore)).toBe(true);
      expect(isNpcActiveForStoryFlags('leader_jasmine', flagsBefore)).toBe(false);
    });

    it('delivers sickness dialogue when interacting with Jasmine before SecretPotion is obtained', () => {
      const townInteractions = getJohtoTownServiceInteractions();
      const amphyHandler = townInteractions.find((i) => i.actions?.includes('AMPHY_EVENT'))?.handler;
      expect(amphyHandler).toBeDefined();

      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(),
        inventory: { keyItems: [], items: {} },
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const jasmineNpc = lighthouse6fNpcs.find((n) => n.id === 'lighthouse_jasmine')!;
      const result = amphyHandler!(jasmineNpc, lighthouse6fMap, mockCtx);
      expect(result).toBe(true);
      expect(dialogueText).toContain('pharmacy in CIANWOOD CITY across the sea');
      expect(mockCtx.storyFlags.has('amphy_cured')).toBe(false);
    });
  });

  describe('2. SecretPotion Handoff & Consumption', () => {
    it('consumes SecretPotion from keyItems, sets amphy_cured and EVENT_JASMINE_RETURNED_TO_GYM', () => {
      const townInteractions = getJohtoTownServiceInteractions();
      const amphyHandler = townInteractions.find((i) => i.actions?.includes('AMPHY_EVENT'))?.handler;
      expect(amphyHandler).toBeDefined();

      const playCrySpy = vi.spyOn(BattleAudio, 'playCry').mockImplementation(() => {});

      let dialogueText = '';
      let toastText = '';
      let saved = false;

      const mockCtx: any = {
        playerName: 'Gold',
        storyFlags: new Set<string>(['has_secret_potion']),
        inventory: {
          keyItems: ['SecretPotion', 'Bicycle'],
          items: { secretpotion: 1, potion: 5 },
        },
        audioManager: { playSfx: vi.fn() },
        openDialogue: (pages: string[], _sp: string, onComplete?: () => void) => {
          dialogueText = pages.join(' ');
          onComplete?.();
        },
        saveCurrentGame: () => {
          saved = true;
        },
        showToast: (msg: string) => {
          toastText = msg;
        },
      };

      const jasmineNpc = lighthouse6fNpcs.find((n) => n.id === 'lighthouse_jasmine')!;
      const result = amphyHandler!(jasmineNpc, lighthouse6fMap, mockCtx);

      expect(result).toBe(true);
      expect(mockCtx.storyFlags.has('amphy_cured')).toBe(true);
      expect(mockCtx.storyFlags.has('EVENT_JASMINE_RETURNED_TO_GYM')).toBe(true);
      expect(mockCtx.storyFlags.has('has_secret_potion')).toBe(false);

      // SecretPotion consumed from both keyItems and items
      expect(mockCtx.inventory.keyItems).not.toContain('SecretPotion');
      expect(mockCtx.inventory.keyItems).toContain('Bicycle');
      expect(mockCtx.inventory.items['secretpotion']).toBeUndefined();
      expect(mockCtx.inventory.items['potion']).toBe(5);

      expect(dialogueText).toContain('handed over the SECRETPOTION to JASMINE');
      expect(dialogueText).toContain('return to the GYM in OLIVINE CITY right away');
      expect(playCrySpy).toHaveBeenCalledWith('ampharos');
      expect(saved).toBe(true);
      expect(toastText).toContain('Amphy recovered! Leader Jasmine returned to Olivine Gym!');

      playCrySpy.mockRestore();
    });
  });

  describe('3. Lighthouse 6F Post-Cure Lifecycle & Amphy Solo Dialogue', () => {
    it('asserts lighthouse_jasmine despawns and leader_jasmine spawns once amphy_cured is set', () => {
      const flagsAfter = new Set<string>(['amphy_cured', 'EVENT_JASMINE_RETURNED_TO_GYM']);

      expect(isNpcActiveForStoryFlags('lighthouse_jasmine', flagsAfter)).toBe(false);
      expect(isNpcActiveForStoryFlags('leader_jasmine', flagsAfter)).toBe(true);
    });

    it('gives solo radiant glowing dialogue and plays cry when interacting with Amphy on 6F after cure', () => {
      const townInteractions = getJohtoTownServiceInteractions();
      const amphyHandler = townInteractions.find((i) => i.actions?.includes('AMPHY_EVENT'))?.handler;
      expect(amphyHandler).toBeDefined();

      const playCrySpy = vi.spyOn(BattleAudio, 'playCry').mockImplementation(() => {});

      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(['amphy_cured']),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const amphyNpc = lighthouse6fNpcs.find((n) => n.id === 'lighthouse_amphy')!;
      const result = amphyHandler!(amphyNpc, lighthouse6fMap, mockCtx);

      expect(result).toBe(true);
      expect(dialogueText).toContain('Amphy is radiating brilliant light, glowing happily!');
      expect(playCrySpy).toHaveBeenCalledWith('ampharos');

      playCrySpy.mockRestore();
    });
  });

  describe('4. Olivine Gym Post-Cure Leader Jasmine Battle & Rewards', () => {
    const gymInteractions = getGymLeaderInteractions();
    const jasmineHandler = gymInteractions.find((i) => i.actions?.includes('JASMINE_EVENT'))?.handler;
    const gymLeaderNpc = gymNpcs.find((n) => n.id === 'leader_jasmine')!;

    it('verifies Leader Jasmine roster: Magnemite Lv. 30 (x2) and Steelix Lv. 35', () => {
      expect(gymLeaderNpc).toBeDefined();
      expect(gymLeaderNpc.x).toBe(5);
      expect(gymLeaderNpc.y).toBe(3);
      expect(gymLeaderNpc.trainerTeam).toEqual([
        { speciesId: 'magnemite', level: 30, moves: ['thunderbolt', 'thunderwave', 'sonicboom', 'supersonic'] },
        { speciesId: 'magnemite', level: 30, moves: ['thunderbolt', 'thunderwave', 'sonicboom', 'supersonic'] },
        { speciesId: 'steelix', level: 35, moves: ['irontail', 'rockthrow', 'sunnyday', 'screech'] },
      ]);
    });

    it('refuses battle in Gym before Amphy is cured', () => {
      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = jasmineHandler!(gymLeaderNpc, gymMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain('Amphy is terribly ill at the top of the LIGHTHOUSE');
    });

    it('triggers Leader Jasmine battle upon Amphy cure, awards Mineral Badge & TM23 Iron Tail', () => {
      let dialogueCalled = false;
      let postBattleDialogueCalled = false;
      let toastMessage = '';
      let gameSaved = false;
      let battleTriggered = false;
      let battleConfig: any = null;

      const mockCtx: any = {
        storyFlags: new Set<string>(['amphy_cured']),
        defeatedTrainers: new Set<string>(),
        inventory: { badges: [], tms: [] },
        audioManager: { playSfx: vi.fn() },
        buildTrainerTeamInstances: (npc: any) =>
          npc.trainerTeam.map((t: any) => PokemonFactory.create(t.speciesId, t.level, t.moves)),
        openDialogue: (pages: string[], _speaker?: string, callback?: () => void) => {
          if (!battleTriggered) {
            dialogueCalled = true;
            callback?.();
          } else {
            postBattleDialogueCalled = true;
            callback?.();
          }
        },
        triggerBattle: (_opponent: any, config: any) => {
          battleTriggered = true;
          battleConfig = config;
        },
        showToast: (msg: string) => {
          toastMessage = msg;
        },
        saveCurrentGame: () => {
          gameSaved = true;
        },
      };

      const res = jasmineHandler!(gymLeaderNpc, gymMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueCalled).toBe(true);
      expect(battleTriggered).toBe(true);
      expect(battleConfig.isGymLeader).toBe(true);
      expect(battleConfig.trainerName).toBe('Leader Jasmine');
      expect(battleConfig.trainerTeam.length).toBe(3);

      // Simulate player victory
      battleConfig.onVictory();

      expect(mockCtx.storyFlags.has('jasmine_defeated')).toBe(true);
      expect(mockCtx.defeatedTrainers.has('jasmine')).toBe(true);
      expect(mockCtx.inventory.badges).toContain('mineral');
      expect(mockCtx.inventory.tms).toContain('TM23');
      expect(postBattleDialogueCalled).toBe(true);
      expect(gameSaved).toBe(true);
      expect(toastMessage).toContain('Received MINERAL BADGE & TM23 IRON TAIL');
    });

    it('provides post-defeat encouragement line after Jasmine is defeated', () => {
      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(['amphy_cured', 'jasmine_defeated']),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = jasmineHandler!(gymLeaderNpc, gymMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain("good luck on your journey!");
    });
  });

  describe('5. Olivine Gym Guide 3-State Dialogue Progression', () => {
    const gymInteractions = getGymLeaderInteractions();
    const guideHandler = gymInteractions.find((i) => i.npcIds?.includes('olivine_gym_guide'))?.handler;
    const guideNpc = gymNpcs.find((n) => n.id === 'olivine_gym_guide')!;

    it('State 1: Pre-cure explains Jasmine is at the Lighthouse tending to sick Pokémon', () => {
      expect(guideHandler).toBeDefined();
      expect(guideNpc).toBeDefined();

      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = guideHandler!(guideNpc, gymMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain("JASMINE, the GYM LEADER, is at the LIGHTHOUSE. She's looking after a sick POKéMON");
    });

    it('State 2: Post-cure pre-battle gives Steel-type tactical guidance', () => {
      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(['amphy_cured']),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = guideHandler!(guideNpc, gymMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain('Jasmine specializes in the newly discovered STEEL type!');
      expect(dialogueText).toContain('FIRE, FIGHTING, or GROUND');
    });

    it('State 3: Post-defeat delivers close encounter of an unknown kind line', () => {
      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(['amphy_cured', 'jasmine_defeated']),
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = guideHandler!(guideNpc, gymMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain('That was awesome! The steel-type, huh? That was a close encounter of an unknown kind!');
    });
  });
});
