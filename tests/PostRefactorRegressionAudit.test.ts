import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

// Mock minimal browser globals for PixiJS environment hydration in node
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node', maxTouchPoints: 0 },
  configurable: true,
  writable: true,
});
(globalThis as any).window = globalThis;

import { ensureGlobalNeoKantoStyles, GLOBAL_NEO_KANTO_CSS } from '../src/ui/styles/globalNeoKantoStyles';
import { SaveManager, type SaveData, LEGACY_STORAGE_KEYS } from '../src/core/SaveManager';
import { MockElement, MockDocument } from './helpers/MockDomEnv';

describe('BUGFIX-POST-REFACTOR-AUDIT-01: Regression Invariant Tests', () => {
  let Texture: any;
  let Rectangle: any;
  let Graphics: any;
  let OverworldNpcAndItemSprites: any;

  beforeAll(async () => {
    const pixi = await import('pixi.js');
    Texture = pixi.Texture;
    Rectangle = pixi.Rectangle;
    Graphics = pixi.Graphics;
    const spritesMod = await import('../src/render/OverworldNpcAndItemSprites');
    OverworldNpcAndItemSprites = spritesMod.OverworldNpcAndItemSprites;
  });
  describe('Pillar 1: Sprite Slicing & 4-Step Walk Cycle', () => {
    it('extracts 9 horizontal character frames of 16x32 with correct coordinates', () => {
      // Create mock texture with 144x32 source
      const mockSource: any = { width: 144, height: 32 };
      const mockSheet = new Texture({
        source: mockSource,
        frame: new Rectangle(0, 0, 144, 32),
      });

      const frames = OverworldNpcAndItemSprites.extractCharacterFrames(mockSheet);

      // Verify all 9 frame keys are defined
      expect(frames.downStand).toBeDefined();
      expect(frames.upStand).toBeDefined();
      expect(frames.sideStand).toBeDefined();
      expect(frames.downWalk1).toBeDefined();
      expect(frames.downWalk2).toBeDefined();
      expect(frames.upWalk1).toBeDefined();
      expect(frames.upWalk2).toBeDefined();
      expect(frames.sideWalk1).toBeDefined();
      expect(frames.sideWalk2).toBeDefined();

      // Verify exact 16x32 dimensions and horizontal frame offsets
      const verifyFrame = (tex: Texture, expectedIdx: number) => {
        expect(tex.frame.width).toBe(16);
        expect(tex.frame.height).toBe(32);
        expect(tex.frame.y).toBe(0);
        expect(tex.frame.x).toBe(expectedIdx * 16);
      };

      verifyFrame(frames.downStand, 0);
      verifyFrame(frames.upStand, 1);
      verifyFrame(frames.sideStand, 2);
      verifyFrame(frames.downWalk1, 3);
      verifyFrame(frames.downWalk2, 4);
      verifyFrame(frames.upWalk1, 5);
      verifyFrame(frames.upWalk2, 6);
      verifyFrame(frames.sideWalk1, 7);
      verifyFrame(frames.sideWalk2, 8);
    });

    it('returns standing frames for all directions when entity is not moving', () => {
      const mockSource: any = { width: 144, height: 32 };
      const sheet = new Texture({ source: mockSource, frame: new Rectangle(0, 0, 144, 32) });
      const frames = OverworldNpcAndItemSprites.extractCharacterFrames(sheet);

      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'DOWN', false, 0)).toBe(frames.downStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'UP', false, 0)).toBe(frames.upStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'LEFT', false, 0)).toBe(frames.sideStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'RIGHT', false, 0)).toBe(frames.sideStand);
    });

    it('implements authentic Gen 2 4-step walk cycle (Walk1 -> Stand -> Walk2 -> Stand)', () => {
      const mockSource: any = { width: 144, height: 32 };
      const sheet = new Texture({ source: mockSource, frame: new Rectangle(0, 0, 144, 32) });
      const frames = OverworldNpcAndItemSprites.extractCharacterFrames(sheet);

      // Step 0: progress in [0, 0.25) -> Walk1
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'DOWN', true, 0.1)).toBe(frames.downWalk1);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'UP', true, 0.1)).toBe(frames.upWalk1);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'LEFT', true, 0.1)).toBe(frames.sideWalk1);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'RIGHT', true, 0.1)).toBe(frames.sideWalk1);

      // Step 1: progress in [0.25, 0.5) -> Stand
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'DOWN', true, 0.35)).toBe(frames.downStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'UP', true, 0.35)).toBe(frames.upStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'LEFT', true, 0.35)).toBe(frames.sideStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'RIGHT', true, 0.35)).toBe(frames.sideStand);

      // Step 2: progress in [0.5, 0.75) -> Walk2
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'DOWN', true, 0.6)).toBe(frames.downWalk2);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'UP', true, 0.6)).toBe(frames.upWalk2);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'LEFT', true, 0.6)).toBe(frames.sideWalk2);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'RIGHT', true, 0.6)).toBe(frames.sideWalk2);

      // Step 3: progress in [0.75, 1.0) -> Stand
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'DOWN', true, 0.85)).toBe(frames.downStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'UP', true, 0.85)).toBe(frames.upStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'LEFT', true, 0.85)).toBe(frames.sideStand);
      expect(OverworldNpcAndItemSprites.getFrameForEntity(frames, 'RIGHT', true, 0.85)).toBe(frames.sideStand);
    });

    it('creates authentic grass wading graphic instance', () => {
      const g = OverworldNpcAndItemSprites.createGrassWadingGraphic(64);
      expect(g).toBeInstanceOf(Graphics);
    });
  });

  describe('Pillar 2: Global Neo-Kanto Styles Injection', () => {
    let mockDoc: MockDocument;

    beforeEach(() => {
      mockDoc = new MockDocument();
      (globalThis as any).document = mockDoc;
    });

    it('injects #global-neo-kanto-styles into document.head and is idempotent', () => {
      expect(mockDoc.getElementById('global-neo-kanto-styles')).toBeNull();

      ensureGlobalNeoKantoStyles();
      const styleEl = mockDoc.getElementById('global-neo-kanto-styles');
      expect(styleEl).not.toBeNull();
      expect(styleEl?.textContent).toContain('.neo-kanto-tactile-btn');
      expect(styleEl?.textContent).toContain('.neo-kanto-pulse-dot');
      expect(styleEl?.textContent).toContain('.party-scrollbar');
      expect(styleEl?.textContent).toContain('.party-tactile-btn');
      expect(styleEl?.textContent).toContain('.nk-save-slot-card');
      expect(styleEl?.textContent).toContain('.trainer-badges-rack');
      expect(styleEl?.textContent).toContain('@media (max-width: 768px)');

      // Calling again should not duplicate
      ensureGlobalNeoKantoStyles();
      const all = mockDoc.querySelectorAll('#global-neo-kanto-styles');
      expect(all.length).toBe(1);
    });
  });

  describe('Pillar 3: Dual-Persistence & Legacy Save Auto-Migration', () => {
    let mockStorage: Record<string, string>;

    beforeEach(() => {
      mockStorage = {};
      (globalThis as any).localStorage = {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, val: string) => { mockStorage[key] = val; }),
        removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
        clear: vi.fn(() => { mockStorage = {}; }),
      };
    });

    const createMockSaveData = (): SaveData => ({
      version: 1,
      timestamp: Date.now(),
      player: {
        name: 'GOLD',
        gender: 'BOY',
        mapId: 'new_bark_town',
        x: 6,
        y: 6,
        direction: 'DOWN',
        speedMultiplier: 2,
        badges: ['zephyr'],
        money: 5000,
      },
      party: [
        {
          id: 'test-mon-1',
          speciesId: 'cyndaquil',
          species: 'Cyndaquil',
          nickname: 'Cyndaquil',
          level: 10,
          currentHp: 30,
          maxHp: 30,
          types: ['Fire'],
          moves: [],
          stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 17 },
          status: null,
        } as any,
      ],
      box: [],
      inventory: { balls: { 'poke-ball': 5 }, tms: ['HM01'] },
      roamers: [],
      defeatedTrainers: [],
      options: SaveManager.getDefaultOptions(),
    });

    it('mirrors saveGame to localStorage["crystal-overdrive-save"]', async () => {
      const saveManager = new SaveManager();
      const data = createMockSaveData();

      const success = await saveManager.saveGame(data);
      expect(success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'crystal-overdrive-save',
        expect.stringContaining('"name":"GOLD"')
      );
      expect(mockStorage['crystal-overdrive-save']).toBeDefined();
    });

    it('auto-migrates legacy save from localStorage when IndexedDB has no save', async () => {
      const saveManager = new SaveManager();
      const legacyData = createMockSaveData();
      legacyData.player.name = 'KRIS';
      mockStorage['crystal_overdrive_save'] = JSON.stringify(legacyData);

      const loaded = await saveManager.loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded?.player.name).toBe('KRIS');

      // Subsequent hasSave and getSavePreview should see the loaded save
      const hasSave = await saveManager.hasSave();
      expect(hasSave).toBe(true);

      const preview = await saveManager.getSavePreview();
      expect(preview).not.toBeNull();
      expect(preview?.playerName).toBe('KRIS');
      expect(preview?.badgeCount).toBe(1);
    });

    it('deletes both IndexedDB and all legacy keys in localStorage on deleteSave', async () => {
      const saveManager = new SaveManager();
      for (const k of LEGACY_STORAGE_KEYS) {
        mockStorage[k] = JSON.stringify(createMockSaveData());
      }

      await saveManager.deleteSave();
      for (const k of LEGACY_STORAGE_KEYS) {
        expect(mockStorage[k]).toBeUndefined();
      }
    });
  });
});
