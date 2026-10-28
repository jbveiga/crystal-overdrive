import { describe, it, expect, beforeEach } from 'vitest';
import { getGymLeaderInteractions } from '../../src/world/interactions/GymLeaderInteractions';
import { getGoldenrodAndRoute34Interactions } from '../../src/world/interactions/GoldenrodAndRoute34Interactions';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-BUGFIX-WHITNEY-PLAINBADGE-SQUIRTBOTTLE-01: Whitney PlainBadge Grant & Flower Shop Squirtbottle', () => {
  let mockContext: Partial<NpcInteractionContext>;

  beforeEach(() => {
    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('cyndaquil', 20)],
      inventory: { money: 3000, badges: ['zephyr', 'hive'], items: {}, balls: {}, tms: [], keyItems: [] },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      audioManager: { playSfx: () => {} } as any,
      openDialogue: (_pages, _speaker, onComplete) => {
        if (onComplete) onComplete();
      },
      showToast: () => {},
      saveCurrentGame: () => {},
      triggerBattle: () => {},
      buildTrainerTeamInstances: () => [PokemonFactory.create('miltank', 20)],
    };
  });

  describe('1. Goldenrod Gym: Whitney Defeat, Sobbing & Auto-Calm Flow', () => {
    it('asserts Whitney battle victory sets whitney_defeated and defeatedTrainers', () => {
      const interactions = getGymLeaderInteractions();
      const whitneyReg = interactions.find((i) => i.actions?.includes('WHITNEY_EVENT'))!;

      let battleTriggered = false;
      mockContext.triggerBattle = (_mon, opts: any) => {
        battleTriggered = true;
        opts.onVictory();
      };

      const targetNpc = {
        id: 'whitney',
        speaker: '🎀 LEADER WHITNEY',
        trainerName: 'Leader Whitney',
        x: 8,
        y: 3,
      } as any;

      whitneyReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(battleTriggered).toBe(true);
      expect(mockContext.storyFlags!.has('whitney_defeated')).toBe(true);
      expect(mockContext.defeatedTrainers!.has('whitney')).toBe(true);
    });

    it('asserts interacting with crying Whitney automatically calms her and prompts Bridget', () => {
      const interactions = getGymLeaderInteractions();
      const whitneyReg = interactions.find((i) => i.actions?.includes('WHITNEY_EVENT'))!;

      mockContext.storyFlags!.add('whitney_defeated');
      expect(mockContext.storyFlags!.has('whitney_calmed')).toBe(false);

      let dialogueShown: string[] = [];
      mockContext.openDialogue = (pages, _speaker, onComplete) => {
        dialogueShown = pages;
        if (onComplete) onComplete();
      };

      const targetNpc = { id: 'whitney', speaker: '🎀 LEADER WHITNEY', x: 8, y: 3 } as any;
      whitneyReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('whitney_calmed')).toBe(true);
      expect(dialogueShown.some((p) => p.includes('Waaaaah'))).toBe(true);
      expect(dialogueShown.some((p) => p.includes('LASS BRIDGET'))).toBe(true);
    });

    it('asserts talking to Whitney once calmed awards PLAINBADGE, ENGINE_PLAINBADGE, and TM45 ATTRACT', () => {
      const interactions = getGymLeaderInteractions();
      const whitneyReg = interactions.find((i) => i.actions?.includes('WHITNEY_EVENT'))!;

      mockContext.storyFlags!.add('whitney_defeated');
      mockContext.storyFlags!.add('whitney_calmed');

      let toastShown = '';
      mockContext.showToast = (msg) => {
        toastShown = msg;
      };

      const targetNpc = { id: 'whitney', speaker: '🎀 LEADER WHITNEY', x: 8, y: 3 } as any;
      whitneyReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('plain_badge_received')).toBe(true);
      expect(mockContext.storyFlags!.has('ENGINE_PLAINBADGE')).toBe(true);
      expect(mockContext.inventory!.badges).toContain('plain');
      expect(mockContext.inventory!.tms).toContain('TM45');
      expect(toastShown).toContain('PLAIN BADGE & TM45 ATTRACT');

      // Subsequent interaction confirms badge ownership
      let afterDialogue: string[] = [];
      mockContext.openDialogue = (pages, _speaker, onComplete) => {
        afterDialogue = pages;
        if (onComplete) onComplete();
      };
      whitneyReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(afterDialogue[0]).toContain('Ah, that was a good cry! Come for a visit again! Bye-bye!');
    });

    it('asserts Lass Bridget also calms Whitney if spoken to directly', () => {
      const interactions = getGymLeaderInteractions();
      const bridgetReg = interactions.find((i) => i.npcIds?.includes('lass_bridget'))!;

      mockContext.storyFlags!.add('whitney_defeated');
      expect(mockContext.storyFlags!.has('whitney_calmed')).toBe(false);

      const targetNpc = { id: 'lass_bridget', speaker: '👧 LASS BRIDGET', x: 9, y: 5 } as any;
      bridgetReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('whitney_calmed')).toBe(true);
    });
  });

  describe('2. Flower Shop Squirtbottle Award & Route 36 Sudowoodo Awakening', () => {
    it('asserts Florist withholds Squirtbottle until PLAINBADGE is earned', () => {
      const interactions = getGoldenrodAndRoute34Interactions();
      const floristReg = interactions.find((i) => i.npcIds?.includes('florist'))!;

      let dialogue: string[] = [];
      mockContext.openDialogue = (pages, _speaker, onComplete) => {
        dialogue = pages;
        if (onComplete) onComplete();
      };

      const floristNpc = { id: 'florist', speaker: '🌸 FLORIST', x: 2, y: 3 } as any;
      floristReg.handler(floristNpc, {} as any, mockContext as NpcInteractionContext);

      expect(dialogue.some((p) => p.includes('conquered the GOLDENROD GYM and earned the PLAINBADGE'))).toBe(true);
      expect(mockContext.inventory!.keyItems).not.toContain('SQUIRTBOTTLE');
      expect(mockContext.storyFlags!.has('has_squirtbottle')).toBe(false);
    });

    it('asserts Florist awards SQUIRTBOTTLE once PLAINBADGE is owned', () => {
      const interactions = getGoldenrodAndRoute34Interactions();
      const floristReg = interactions.find((i) => i.npcIds?.includes('florist'))!;

      mockContext.inventory!.badges.push('plain');
      mockContext.storyFlags!.add('plain_badge_received');

      let toast = '';
      mockContext.showToast = (msg) => {
        toast = msg;
      };

      const floristNpc = { id: 'florist', speaker: '🌸 FLORIST', x: 2, y: 3 } as any;
      floristReg.handler(floristNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('has_squirtbottle')).toBe(true);
      expect(mockContext.storyFlags!.has('HAS_SQUIRTBOTTLE')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_GOT_SQUIRTBOTTLE')).toBe(true);
      expect(mockContext.inventory!.keyItems).toContain('SQUIRTBOTTLE');
      expect(toast).toContain('Received SQUIRTBOTTLE');
    });

    it('asserts Route 36 Sudowoodo recognizes uppercase SQUIRTBOTTLE and triggers battle', () => {
      const interactions = getGoldenrodAndRoute34Interactions();
      const sudoReg = interactions.find((i) => i.actions?.includes('SUDOWOODO_EVENT'))!;

      // Case with only keyItems: ['SQUIRTBOTTLE'] (no prior flags)
      mockContext.inventory!.keyItems = ['SQUIRTBOTTLE'];

      let battleTriggered = false;
      mockContext.triggerBattle = (_mon, opts: any) => {
        battleTriggered = true;
        opts.onBattleEnd();
      };
      mockContext.mapManager = { getCurrentMap: () => null } as any;
      mockContext.npcsByMap = { route_36: [{ id: 'sudowoodo' } as any] } as any;

      const sudoNpc = { id: 'sudowoodo', speaker: '🌲 SUDOWOODO', x: 35, y: 9 } as any;
      sudoReg.handler(sudoNpc, {} as any, mockContext as NpcInteractionContext);

      expect(battleTriggered).toBe(true);
      expect(mockContext.storyFlags!.has('sudowoodo_cleared')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_FOUGHT_SUDOWOODO')).toBe(true);
      expect(mockContext.npcsByMap!.route_36).toHaveLength(0);
    });
  });
});
