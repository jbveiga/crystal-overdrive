import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { isEcruteakGymSafeTile } from '../../src/world/ecruteakGymMaze';
import { createNpcsByMap } from '../../src/world/npcData';
import { getGymLeaderInteractions } from '../../src/world/interactions/GymLeaderInteractions';

describe('TICKET-BUGFIX-ECRUTEAK-GYM-01: Ecruteak Gym Audit & Bug Fixes', () => {
  // =========================================================================
  // 1. Pitfall Respawn Physics Halt & Coordinate Sync
  // =========================================================================
  describe('1. Pitfall Respawn Physics Halt & Coordinate Sync', () => {
    it('stops player movement, syncs renderX/renderY/gridX/gridY/targetX/targetY, and plays CAVE_WARP on pitfall', () => {
      const tickerPath = path.resolve(__dirname, '../../src/world/OverworldTickerCoordinator.ts');
      const source = fs.readFileSync(tickerPath, 'utf8');

      const pitfallIdx = source.indexOf("!isEcruteakGymSafeTile(coord.x, coord.y)");
      expect(pitfallIdx).toBeGreaterThan(0);

      const snippet = source.slice(pitfallIdx, pitfallIdx + 500);
      expect(snippet).toContain("BattleAudio.playOverworldSound('CAVE_WARP')");
      expect(snippet).toContain('player.isMoving = false; player.progress = 0;');
      expect(snippet).toContain('player.renderX = rx; player.renderY = ry;');
      expect(snippet).toContain('player.gridX = rx; player.gridY = ry; player.targetX = rx; player.targetY = ry;');
    });
  });

  // =========================================================================
  // 2. Entrance Aisle Tile (5, 14) & Outer Wall Collision
  // =========================================================================
  describe('2. Entrance Aisle Tile (5, 14) & Outer Wall Collision', () => {
    it('marks both (4, 14) and (5, 14) between the two Gym Statues as safe entrance floor', () => {
      expect(isEcruteakGymSafeTile(4, 14)).toBe(true);
      expect(isEcruteakGymSafeTile(5, 14)).toBe(true);
      // Statues at (3, 14) and (6, 14) remain unsafe/solid
      expect(isEcruteakGymSafeTile(6, 14)).toBe(false);
    });

    it('sets collisionGrid = 1 on outer wall strips x=0 and x=9 for y=5..12 in ecruteak_gym.json', () => {
      const mapPath = path.resolve(__dirname, '../../public/assets/data/maps/ecruteak_gym.json');
      const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      const w = mapData.width;

      for (let y = 5; y <= 12; y++) {
        expect(mapData.collisionGrid[y * w + 0], `(0, ${y}) must be solid wall (1)`).toBe(1);
        expect(mapData.collisionGrid[y * w + 9], `(9, ${y}) must be solid wall (1)`).toBe(1);
      }
    });
  });

  // =========================================================================
  // 3. Leader Morty Sprite & Gym Guide Facing Direction
  // =========================================================================
  describe('3. Leader Morty Sprite & Gym Guide Direction', () => {
    it('assigns authentic morty sprite to Leader Morty and faces Ecruteak Gym Guide DOWN', () => {
      const npcs = createNpcsByMap();
      const gymNpcs = npcs.ecruteak_gym;

      const morty = gymNpcs.find((n) => n.id === 'morty');
      expect(morty).toBeDefined();
      expect(morty?.spriteType).toBe('morty');

      const guide = gymNpcs.find((n) => n.id === 'ecruteak_gym_guide');
      expect(guide).toBeDefined();
      expect(guide?.direction).toBe('DOWN');
    });
  });

  // =========================================================================
  // 4. Mission M05 Check & Post-Victory Gym Guide Dialogue
  // =========================================================================
  describe('4. Mission M05 Completion & Post-Victory Gym Guide Dialogue', () => {
    it('invokes missionManager.checkStoryFlags upon defeating Leader Morty', () => {
      const registrations = getGymLeaderInteractions();
      const mortyReg = registrations.find((r) => r.actions?.includes('MORTY_EVENT'));
      expect(mortyReg).toBeDefined();

      const storyFlags = new Set<string>(['beasts_awakened']);
      const checkStoryFlagsMock = vi.fn();
      let dialogueCb: (() => void) | undefined;
      let victoryCb: (() => void) | undefined;

      const mockCtx: any = {
        storyFlags,
        defeatedTrainers: new Set<string>(),
        inventory: { badges: [], tms: [] },
        missionManager: { checkStoryFlags: checkStoryFlagsMock },
        audioManager: { playSfx: vi.fn() },
        openDialogue: (_pages: string[], _speaker?: string, onComplete?: () => void) => {
          dialogueCb = onComplete;
        },
        buildTrainerTeamInstances: () => [{ speciesId: 'gengar', level: 25 }],
        triggerBattle: (_lead: any, opts: any) => {
          victoryCb = opts.onVictory;
        },
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };

      const mortyNpc: any = { id: 'morty', speaker: '👻 LEADER MORTY', challengePages: ['Test spirit!'] };
      mortyReg!.handler(mortyNpc, {} as any, mockCtx);
      if (dialogueCb) dialogueCb();
      if (victoryCb) victoryCb();

      expect(storyFlags.has('morty_defeated')).toBe(true);
      expect(checkStoryFlagsMock).toHaveBeenCalledWith(storyFlags);
      expect(mockCtx.inventory.badges).toContain('fog');
      expect(mockCtx.inventory.tms).toContain('TM30');
    });

    it('provides congratulatory Fog Badge dialogue from Ecruteak Gym Guide after morty_defeated', () => {
      const registrations = getGymLeaderInteractions();
      const guideReg = registrations.find((r) => r.npcIds?.includes('ecruteak_gym_guide'));
      expect(guideReg).toBeDefined();

      let spokenPages: string[] = [];
      const mockCtx: any = {
        playerName: 'GOLD',
        storyFlags: new Set<string>(['beasts_awakened', 'morty_defeated']),
        openDialogue: (pages: string[]) => {
          spokenPages = pages;
        },
      };

      const guideNpc: any = { id: 'ecruteak_gym_guide', speaker: '🥊 GYM GUIDE' };
      const handled = guideReg!.handler(guideNpc, {} as any, mockCtx);
      expect(handled).toBe(true);
      expect(spokenPages[0]).toContain('conquered the invisible floor and defeated MORTY');
      expect(spokenPages[1]).toContain('FOGBADGE');
    });
  });
});
