import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  StartMenuUI,
  JOHTO_DEX_SPECIES,
  JOHTO_BADGES,
  type DexSpeciesData,
} from '../src/ui/StartMenuUI';
import { getCompleteDexSpecies } from '../src/ui/start-menu/pokedexData';

// Lightweight in-memory DOM mock for node environment
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public value: string = '';
  public textContent: string = '';
  public innerText: string = '';
  private _innerHTML: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
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
        if (prop === 'cssText') {
          const decls = val.split(';');
          for (const decl of decls) {
            const colonIdx = decl.indexOf(':');
            if (colonIdx > 0) {
              const k = decl.slice(0, colonIdx).trim();
              const v = decl.slice(colonIdx + 1).trim();
              const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
              target[camelK] = v;
            }
          }
        }
        return true;
      },
    });
  }

  get innerHTML(): string {
    const childContent = this.children.map((c) => c.innerHTML || c.textContent || c.innerText).join(' ');
    return (this._innerHTML + ' ' + childContent).trim();
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    this.textContent = val.replace(/<[^>]+>/g, '');
    this.innerText = this.textContent;
    this.children = [];

    const regex = /<([a-z0-9]+)([^>]*)>/gi;
    let match;
    while ((match = regex.exec(val)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      if (tag.startsWith('/')) continue;

      const child = new MockElement(tag);
      const attrRegex = /([a-z0-9_-]+)=["']([^"']*)["']/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        child.setAttribute(attrMatch[1], attrMatch[2]);
        if (attrMatch[1].toLowerCase() === 'id') child.id = attrMatch[2];
        if (attrMatch[1].toLowerCase() === 'class') child.className = attrMatch[2];
      }
      this.appendChild(child);
    }
  }

  appendChild(child: MockElement) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent = null;
    }
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event: { type: string; key?: string; code?: string; preventDefault?: Function }) {
    const list = this.listeners[event.type] || [];
    for (const fn of list) fn(event);
  }

  setAttribute(k: string, v: string) {
    this.attributes[k] = v;
  }

  getAttribute(k: string) {
    return this.attributes[k] || null;
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.find((el) => el.id === id);
    }
    return this.find((el) => el.tagName.toLowerCase() === selector.toLowerCase());
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const check = (el: MockElement) => {
      if (selector.startsWith('#') && el.id === selector.slice(1)) results.push(el);
      else if (selector.startsWith('.') && el.className.split(' ').includes(selector.slice(1))) results.push(el);
      else if (el.tagName.toLowerCase() === selector.toLowerCase()) results.push(el);
      for (const child of el.children) check(child);
    };
    for (const child of this.children) check(child);
    return results;
  }

  private find(predicate: (el: MockElement) => boolean): MockElement | null {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child.find(predicate);
      if (found) return found;
    }
    return null;
  }
}

class MockDocument {
  public head = new MockElement('head');
  public body = new MockElement('body');
  private elementsById: Map<string, MockElement> = new Map();

  createElement(tagName: string) {
    return new MockElement(tagName);
  }

  getElementById(id: string): MockElement | null {
    if (this.elementsById.has(id)) return this.elementsById.get(id)!;
    return this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string): MockElement[] {
    return this.body.querySelectorAll(selector);
  }

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }
}

describe('AgentModularArchitectureSlice4 — StartMenuUI Modularization & Semantic Routing Index', () => {
  const rootDir = path.resolve(__dirname, '..');
  const startMenuPath = path.join(rootDir, 'src/ui/StartMenuUI.ts');
  const startMenuDir = path.join(rootDir, 'src/ui/start-menu');
  const archDocPath = path.join(rootDir, 'ARCHITECTURE.md');

  const subModalModules = [
    'pokedexData.ts',
    'PokedexModalRenderer.ts',
    'TrainerCardAndSaveRenderer.ts',
    'SettingsModalRenderer.ts',
    'SettingsControlsBinding.ts',
  ];

  let doc: MockDocument;
  let mockContainer: MockElement;
  let startMenuUI: StartMenuUI;

  beforeEach(() => {
    doc = new MockDocument();
    (global as any).document = doc;

    mockContainer = new MockElement('div');
    mockContainer.id = 'modal-container';
    doc.body.appendChild(mockContainer);
    doc.register(mockContainer);
  });

  afterEach(() => {
    startMenuUI?.closeAll();
  });

  it('Pillar 6 / Section 1.6: verifies StartMenuUI.ts and all sub-modal renderers in src/ui/start-menu/ exist and stay strictly < 800 lines', () => {
    expect(fs.existsSync(startMenuPath), 'StartMenuUI.ts must exist on disk').toBe(true);
    const facadeLines = fs.readFileSync(startMenuPath, 'utf-8').split('\n').length;
    expect(
      facadeLines,
      `src/ui/StartMenuUI.ts has ${facadeLines} lines, must stay strictly < 800 lines (Single-Window Ceiling)`
    ).toBeLessThan(800);

    for (const mod of subModalModules) {
      const fullPath = path.join(startMenuDir, mod);
      expect(fs.existsSync(fullPath), `Module ${mod} must exist on disk`).toBe(true);

      const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
      expect(
        lineCount,
        `Module ${mod} has ${lineCount} lines, must stay strictly < 800 lines (Single-Window Ceiling)`
      ).toBeLessThan(800);
    }
  });

  it('Pillar 1: verifies zero PixiJS imports in src/ui/StartMenuUI.ts and src/ui/start-menu/ modules', () => {
    const forbiddenPatterns = [
      /from\s+['"]pixi\.js['"]/,
      /from\s+['"]@pixi\//,
    ];

    const filesToCheck = [startMenuPath, ...subModalModules.map((m) => path.join(startMenuDir, m))];
    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        expect(
          pattern.test(content),
          `File ${path.basename(filePath)} violates layer purity: contains PixiJS imports matching ${pattern}`
        ).toBe(false);
      }
    }
  });

  it('Pillar 3: validates backward-compatible exports from StartMenuUI facade (JOHTO_DEX_SPECIES, JOHTO_BADGES, DexSpeciesData)', () => {
    expect(Array.isArray(JOHTO_DEX_SPECIES)).toBe(true);
    expect(JOHTO_DEX_SPECIES.length).toBe(94);

    expect(Array.isArray(JOHTO_BADGES)).toBe(true);
    expect(JOHTO_BADGES.length).toBe(8);
    expect(JOHTO_BADGES[0].name).toBe('Zephyr');
    expect(JOHTO_BADGES[7].name).toBe('Rising');

    const dexList = getCompleteDexSpecies();
    expect(dexList.length).toBe(251);

    const chikorita = dexList.find((s) => s.num === 152);
    expect(chikorita?.name).toBe('Chikorita');
    expect(chikorita?.types).toContain('Grass');

    const bulbasaur = dexList.find((s) => s.num === 1);
    expect(bulbasaur?.name).toBe('Bulbasaur');
  });

  it('Pillar 1 / Interactive DOM: validates StartMenuUI drawer rendering and sub-modal opening/closing cycle', () => {
    const mockStateProvider = {
      getTrainerName: () => 'RED',
      getMoney: () => 3500,
      getBadges: () => ['zephyr', 'hive'],
      getMapName: () => 'New Bark Town',
      getPlayTimeSeconds: () => 3665,
      getCaughtCount: () => 12,
      getSeenSpeciesIds: () => new Set([152, 155, 158]),
      getKeyItems: () => ['BICYCLE', 'MYSTERY_EGG'],
      isPokedexUnlocked: () => true,
      isPokegearUnlocked: () => true,
      hasBadge: (badgeId: string) => badgeId === 'zephyr' || badgeId === 'hive',
    };

    const mockCallbacks = {
      onOpenParty: () => {},
      onOpenBag: () => {},
      onOpenPokegear: () => {},
      onOpenTrainerCard: () => {},
      onOpenSave: () => {},
      onOpenSettings: () => {},
      onOpenMissions: () => {},
      onSaveGame: async () => {},
    };

    startMenuUI = new StartMenuUI('modal-container' as any, mockStateProvider, mockCallbacks, 1);

    expect(startMenuUI.isOpen()).toBe(false);

    // Open drawer
    startMenuUI.open();
    expect(startMenuUI.isOpen()).toBe(true);

    const drawer = doc.getElementById('start-menu-panel') as any;
    expect(drawer).not.toBeNull();
    expect(drawer.style.display).toBe('flex');
    expect(drawer.innerText).toContain('RED');
    expect(drawer.innerText).toContain('$3,500');

    // Test sub-modal: Pokédex
    startMenuUI.openPokedex();
    const pokedexModal = doc.getElementById('pokedex-modal') as any;
    expect(pokedexModal.style.display).toBe('flex');
    expect(drawer.style.display).toBe('none');

    // Test sub-modal: Trainer Card
    startMenuUI.closeAll();
    startMenuUI.open();
    startMenuUI.openTrainerCard();
    const trainerModal = doc.getElementById('trainer-card-modal') as any;
    expect(trainerModal.style.display).toBe('flex');
    expect(drawer.style.display).toBe('none');

    // Test sub-modal: Save Confirm
    startMenuUI.closeAll();
    startMenuUI.open();
    startMenuUI.openSaveConfirm();
    const saveModal = doc.getElementById('save-confirm-modal') as any;
    expect(saveModal.style.display).toBe('flex');

    // Test sub-modal: Settings
    startMenuUI.closeAll();
    startMenuUI.open();
    startMenuUI.openSettings();
    const settingsModal = doc.getElementById('settings-modal') as any;
    expect(settingsModal.style.display).toBe('flex');

    // Close all
    startMenuUI.closeAll();
    expect(startMenuUI.isOpen()).toBe(false);
    expect(drawer.style.display).toBe('none');
    expect(settingsModal.style.display).toBe('none');
  });

  it('Pillar 5: validates keyboard shortcuts (KeyP, KeyK, KeyB, KeyG, KeyM, KeyT, KeyO, KeyS)', () => {
    let partyOpened = false;
    let bagOpened = false;
    let pokegearOpened = false;
    let missionsOpened = false;

    const mockStateProvider = {
      getTrainerName: () => 'GOLD',
      getMoney: () => 1000,
      getBadges: () => [],
      getMapName: () => 'Cherrygrove City',
      getPlayTimeSeconds: () => 120,
      getCaughtCount: () => 1,
    };

    const mockCallbacks = {
      onOpenParty: () => { partyOpened = true; },
      onOpenBag: () => { bagOpened = true; },
      onOpenPokegear: () => { pokegearOpened = true; },
      onOpenTrainerCard: () => {},
      onOpenSave: () => {},
      onOpenSettings: () => {},
      onOpenMissions: () => { missionsOpened = true; },
      onSaveGame: async () => {},
    };

    startMenuUI = new StartMenuUI('modal-container' as any, mockStateProvider, mockCallbacks, 1);

    expect(startMenuUI.triggerShortcut('KeyK', false)).toBe(true);
    expect(partyOpened).toBe(true);

    expect(startMenuUI.triggerShortcut('KeyB', false)).toBe(true);
    expect(bagOpened).toBe(true);

    expect(startMenuUI.triggerShortcut('KeyG', false)).toBe(true);
    expect(pokegearOpened).toBe(true);

    expect(startMenuUI.triggerShortcut('KeyM', false)).toBe(true);
    expect(missionsOpened).toBe(true);

    // Save disabled without allowSaveAndDigits
    expect(startMenuUI.triggerShortcut('KeyS', false)).toBe(false);
    expect(startMenuUI.triggerShortcut('KeyS', true)).toBe(true);
  });

  it('Pillar 6 / Section 1.6: validates ARCHITECTURE.md contains Section ## 0. Agent Semantic Routing Index (1-Hop File Lookup Table)', () => {
    expect(fs.existsSync(archDocPath), 'ARCHITECTURE.md must exist').toBe(true);
    const archContent = fs.readFileSync(archDocPath, 'utf-8');

    expect(archContent).toContain('## 0. Agent Semantic Routing Index (1-Hop File Lookup Table)');
    expect(archContent).toContain('`src/types/gameContext.d.ts`');
    expect(archContent).toContain('`src/types/game.d.ts`');
    expect(archContent).toContain('`src/battle/BattleStateMachine.ts`');
    expect(archContent).toContain('`src/world/GridPhysics.ts`');
    expect(archContent).toContain('`src/world/interactions/NpcInteractionRouter.ts`');
    expect(archContent).toContain('`src/world/npcs/npcShared.ts`');
    expect(archContent).toContain('`src/world/npcData.ts`');
    expect(archContent).toContain('`src/ui/StartMenuUI.ts`');
    expect(archContent).toContain('`src/ui/start-menu/pokedexData.ts`');
    expect(archContent).toContain('`src/ui/start-menu/PokedexModalRenderer.ts`');
    expect(archContent).toContain('`src/ui/start-menu/TrainerCardAndSaveRenderer.ts`');
    expect(archContent).toContain('`src/ui/start-menu/SettingsModalRenderer.ts`');
    expect(archContent).toContain('`src/ui/start-menu/SettingsControlsBinding.ts`');

    // 1. Every src/... and tests/... path in ARCHITECTURE.md exists on disk
    const matches = archContent.match(/`(src\/[^`]+|tests\/[^`]+)`/g) || [];
    for (const m of matches) {
      const p = path.resolve(rootDir, m.slice(1, -1));
      expect(fs.existsSync(p), `Path in ARCHITECTURE.md must exist on disk: ${m}`).toBe(true);
    }

    // 2. 100% of .ts/.d.ts files in src/ are indexed in ARCHITECTURE.md Section 0
    function getTsFilesRecursively(dir: string): string[] {
      let results: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getTsFilesRecursively(full));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
          results.push(path.relative(rootDir, full));
        }
      }
      return results;
    }

    const allSrcFiles = getTsFilesRecursively(path.resolve(rootDir, 'src'));
    const section0 = archContent.slice(
      archContent.indexOf('## 0. Agent Semantic Routing Index'),
      archContent.indexOf('## 1. Executive Overview')
    );
    for (const srcFile of allSrcFiles) {
      expect(section0, `ARCHITECTURE.md Section 0 must index ${srcFile}`).toContain('`' + srcFile + '`');
    }

    // 3. 100% of .ts files across src/ and tests/ are strictly <= 42,000 bytes (< 46,080 limit)
    const allRepoTsFiles = [
      ...getTsFilesRecursively(path.resolve(rootDir, 'src')),
      ...getTsFilesRecursively(path.resolve(rootDir, 'tests')),
    ].filter((f) => f.endsWith('.ts'));

    for (const tsFile of allRepoTsFiles) {
      const stat = fs.statSync(path.resolve(rootDir, tsFile));
      expect(stat.size, `${tsFile} size (${stat.size} bytes) must be <= 42000 bytes`).toBeLessThanOrEqual(42000);
    }

    // 4. Every .ts file in src/ with > 200 lines contains @fileoverview and @sections in lines 1-15
    for (const srcFile of allSrcFiles.filter((f) => f.endsWith('.ts'))) {
      const filePath = path.resolve(rootDir, srcFile);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      if (lines.length > 200) {
        const first15 = lines.slice(0, 15).join('\n');
        expect(first15, `${srcFile} (>200 lines) must include @fileoverview in first 15 lines`).toContain('@fileoverview');
        expect(first15, `${srcFile} (>200 lines) must include @sections in first 15 lines`).toContain('@sections');
      }
    }
  });

  it('Pillar 2: verifies Asset & Media Integrity Scan for species front sprites referenced in pokedexData', () => {
    const starterSpeciesNames = ['chikorita', 'cyndaquil', 'totodile', 'pikachu', 'eevee'];
    for (const name of starterSpeciesNames) {
      const spritePath = path.join(rootDir, `public/assets/sprites/pokemon/${name}_front.png`);
      expect(
        fs.existsSync(spritePath),
        `Front sprite for species ${name} must exist on disk at public/assets/sprites/pokemon/${name}_front.png`
      ).toBe(true);
    }
  });
});
