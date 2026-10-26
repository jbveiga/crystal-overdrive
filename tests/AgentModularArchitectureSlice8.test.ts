import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock minimal browser globals for PixiJS environment hydration in node
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node', maxTouchPoints: 0 },
  configurable: true,
  writable: true,
});
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
  };
}

import { OverworldHUD } from '../src/ui/OverworldHUD';
import { OverworldTouchAndKeyController } from '../src/ui/hud/OverworldTouchAndKeyController';
import { OverworldCutsceneAndPokegearModals } from '../src/ui/hud/OverworldCutsceneAndPokegearModals';
import type { RoamerState } from '../src/types/game';

class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public style: any;
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public listeners: Record<string, Function[]> = {};
  public attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
    const styleObj: any = {
      setProperty: (prop: string, val: string) => {
        const camelK = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        styleObj[camelK] = val;
      },
    };
    this.style = new Proxy(styleObj, {
      get: (target, prop: string) => target[prop] || '',
      set: (target, prop: string, val: string) => {
        target[prop] = val;
        return true;
      },
    });
  }

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    this.children = [];
    const idMatches = val.matchAll(/id=["']([^"']+)["']/g);
    for (const match of idMatches) {
      const child = new MockElement('div');
      child.id = match[1];
      child.parent = this;
      this.children.push(child);
    }
  }

  public appendChild(child: MockElement): void {
    child.parent = this;
    this.children.push(child);
  }

  public removeChild(child: MockElement): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  public querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.findChildById(id);
    }
    return null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    if (selector.startsWith('#')) {
      const el = this.querySelector(selector);
      if (el) results.push(el);
    }
    return results;
  }

  private findChildById(id: string): MockElement | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findChildById(id);
      if (found) return found;
    }
    return null;
  }

  public addEventListener(event: string, handler: Function): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  public removeEventListener(event: string, handler: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
  }

  public dispatchEvent(event: { type: string; stopPropagation?: Function; preventDefault?: Function }): boolean {
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) {
      h(event);
    }
    return true;
  }
}

class MockDocument {
  public elements: Map<string, MockElement> = new Map();
  public head = new MockElement('head');

  public createElement(tag: string): MockElement {
    return new MockElement(tag);
  }

  public getElementById(id: string): MockElement | null {
    return this.elements.get(id) || null;
  }
}

describe('Agent Modular Architecture — Slice 8 Invariant Guardrails', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('asserts src/render/OverworldRenderer.ts is strictly < 750 lines', () => {
    const filePath = path.join(rootDir, 'src/render/OverworldRenderer.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThan(750);
  });

  it('asserts src/ui/OverworldHUD.ts is strictly < 700 lines', () => {
    const filePath = path.join(rootDir, 'src/ui/OverworldHUD.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThan(700);
  });

  it('asserts all overworld render modules in src/render/*.ts are strictly < 800 lines', () => {
    const renderDir = path.join(rootDir, 'src/render');
    const targetFiles = [
      'OverworldRenderer.ts',
      'OverworldNpcAndItemSprites.ts',
      'OverworldParticleAndVfxPool.ts',
      'GraphicParticlePool.ts',
      'tileConstants.ts',
    ];

    for (const file of targetFiles) {
      const filePath = path.join(renderDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;
      expect(lineCount, `${file} line count exceeds 800`).toBeLessThan(800);
    }
  });

  it('asserts all files in src/ui/hud/*.ts are strictly < 800 lines', () => {
    const hudDir = path.join(rootDir, 'src/ui/hud');
    const files = fs.readdirSync(hudDir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThanOrEqual(2);

    for (const file of files) {
      const filePath = path.join(hudDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;
      expect(lineCount, `${file} line count exceeds 800`).toBeLessThan(800);
    }
  });

  it('asserts OverworldRenderer re-exports ANIMATED_WATER_TILES and NPC_SHEET_PATHS', async () => {
    const { ANIMATED_WATER_TILES, NPC_SHEET_PATHS } = await import('../src/render/OverworldRenderer');
    expect(Array.isArray(ANIMATED_WATER_TILES)).toBe(true);
    expect(ANIMATED_WATER_TILES.length).toBeGreaterThan(0);
    expect(typeof NPC_SHEET_PATHS).toBe('object');
    expect(NPC_SHEET_PATHS.boy).toBeDefined();
    expect(NPC_SHEET_PATHS.sudowoodo).toBeDefined();
  });

  it('asserts OverworldRenderer exposes all public facade methods', async () => {
    const { OverworldRenderer } = await import('../src/render/OverworldRenderer');
    const proto = OverworldRenderer.prototype;
    const requiredMethods = [
      'init',
      'ensureNpcSpriteLoaded',
      'setNpcLookup',
      'ensureMapNpcSpritesLoaded',
      'hasNpcSpriteLoaded',
      'hasSpawnedNpcSprite',
      'getSpawnedNpcSpriteCount',
      'setPlayerGender',
      'getTimeOfDayTint',
      'spawnGrassRustle',
      'playCutSlashEffect',
      'getParticlePoolStats',
      'playFlashEffect',
      'showExclamationBubble',
      'getFadeOverlayAlpha',
      'isFadeOverlayVisible',
      'hasTileTexture',
      'getTileTexture',
      'hasWaterAnimFrames',
      'getWaterAnimFrames',
      'playDoorwayFade',
      'ensureMapTilesLoaded',
      'evictDistantTileTextures',
      'spawnMapNpcs',
      'evictDistantNpcSprites',
      'renderMap',
      'update',
      'updateAmbientLighting',
      'renderOverworldItems',
      'removeItemBall',
    ];

    for (const method of requiredMethods) {
      expect(typeof (proto as any)[method], `Missing OverworldRenderer.${method}`).toBe('function');
    }
  });

  it('asserts OverworldHUD exposes all public facade methods', () => {
    const proto = OverworldHUD.prototype;
    const requiredMethods = [
      'setTextSpeed',
      'getTextSpeed',
      'getEffectiveCharDelayMs',
      'show',
      'hide',
      'isVisible',
      'isDialogueOpen',
      'playFieldRestAnimation',
      'playHealingAnimation',
      'openStarterChoiceModal',
      'openDialogue',
      'advanceDialogue',
      'showToast',
      'showMissionToast',
      'updatePokegear',
      'toggleGamepad',
      'isGamepadActive',
      'setGamepadVisible',
      'setTouchControlStyle',
      'getTouchControlStyle',
      'toggleTouchControlStyle',
      'updateSpeedDisplay',
      'updateMuteDisplay',
      'updateRadarDisplay',
      'updateRouteName',
      'showRoamerAlert',
      'hideRoamerAlert',
      'openPokegear',
      'isPokegearOpen',
      'getHeldDirection',
    ];

    for (const method of requiredMethods) {
      expect(typeof (proto as any)[method], `Missing OverworldHUD.${method}`).toBe('function');
    }
  });

  describe('OverworldTouchAndKeyController & OverworldCutsceneAndPokegearModals Unit Guarantees', () => {
    let mockDoc: MockDocument;
    let containerEl: MockElement;

    beforeEach(() => {
      mockDoc = new MockDocument();
      containerEl = new MockElement('div');
      containerEl.id = 'overworld-hud-container';
      mockDoc.elements.set('overworld-hud-container', containerEl);

      (globalThis as any).document = mockDoc;
      (globalThis as any).window = {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      (globalThis as any).navigator = { maxTouchPoints: 0 };
    });

    it('asserts OverworldHUD initializes DOM cleanly and delegates to sub-controllers', () => {
      const hud = new OverworldHUD('overworld-hud-container', {});
      expect(hud.isVisible()).toBe(true);

      // Verify text speed mechanics
      hud.setTextSpeed('FAST');
      expect(hud.getTextSpeed()).toBe('FAST');
      expect(hud.getEffectiveCharDelayMs()).toBe(5);

      hud.setTextSpeed('INSTANT');
      expect(hud.getEffectiveCharDelayMs()).toBe(0);

      // Verify touch style toggling
      expect(hud.getTouchControlStyle()).toBe('DPAD');
      expect(hud.toggleTouchControlStyle()).toBe('JOYSTICK');
      expect(hud.getTouchControlStyle()).toBe('JOYSTICK');
      expect(hud.toggleTouchControlStyle()).toBe('DPAD');

      // Verify gamepad toggle
      const initialState = hud.isGamepadActive();
      const nextState = hud.toggleGamepad();
      expect(nextState).toBe(!initialState);
      expect(hud.isGamepadActive()).toBe(!initialState);
    });

    it('asserts OverworldCutsceneAndPokegearModals handles roamer updates correctly', () => {
      const root = new MockElement('div');
      const toastBanner = new MockElement('div');
      const roamerList = new MockElement('div');
      roamerList.id = 'roamer-status-list';
      root.appendChild(roamerList);

      const modals = new OverworldCutsceneAndPokegearModals({
        rootElement: root as any,
        toastBanner: toastBanner as any,
        onClearActiveDirection: vi.fn(),
      });

      // When unawakened, shows inactive notice
      const mockRoamers: RoamerState[] = [
        {
          speciesId: 'raikou',
          currentMapId: 'route_29',
          isAwakened: false,
          isCaught: false,
          isDefeated: false,
          pokemon: {
            id: 'raikou_1',
            speciesId: 'raikou',
            level: 40,
            currentHp: 120,
            stats: { hp: 120, attack: 85, defense: 75, specialAttack: 115, specialDefense: 100, speed: 115 },
            moves: [],
            status: 'NONE',
            friendship: 70,
            types: ['ELECTRIC'],
            nature: 'hardy',
            experience: 0,
            nextLevelExp: 1000,
          } as any,
        },
      ];

      modals.updatePokegear(mockRoamers, roamerList as any);
      expect(roamerList.innerHTML).toContain('ROAMER RADAR:');
      expect(roamerList.innerHTML).toContain('Inactive');

      // When awakened, shows active card
      mockRoamers[0].isAwakened = true;
      modals.updatePokegear(mockRoamers, roamerList as any);
      expect(roamerList.children.length).toBe(1);
    });
  });
});
