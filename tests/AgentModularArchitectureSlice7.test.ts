import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  BattleHUD,
  BATTLE_ITEM_CATALOG,
} from '../src/ui/BattleHUD';
import {
  BagAndMartUI,
  MART_MEDICINE_CATALOG,
  MART_REPEL_CATALOG,
  MART_POKEBALL_CATALOG,
  INFINITE_TMS,
  EVOLUTION_STONE_CATALOG,
} from '../src/ui/BagAndMartUI';
import { PokemonFactory } from '../src/battle/PokemonFactory';

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
  public classList = {
    add: (..._cls: string[]) => {},
    remove: (..._cls: string[]) => {},
    contains: (_cls: string) => false,
  };

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

  public querySelector(sel: string): MockElement | null {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return this.findById(id);
    }
    return this.children[0] || null;
  }

  public querySelectorAll(_sel: string): MockElement[] {
    return this.children;
  }

  public findById(id: string): MockElement | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }

  public addEventListener(event: string, handler: Function): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  public setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
  }
}

class MockDocument {
  public body: MockElement = new MockElement('BODY');
  public head: MockElement = new MockElement('HEAD');
  private elementsById: Map<string, MockElement> = new Map();

  constructor() {
    this.elementsById.set('battle-hud-container', new MockElement('div'));
    this.elementsById.set('modal-container', new MockElement('div'));
  }

  public createElement(tag: string): MockElement {
    return new MockElement(tag);
  }

  public getElementById(id: string): MockElement | null {
    if (this.elementsById.has(id)) {
      return this.elementsById.get(id)!;
    }
    const found = this.body.findById(id) || this.head.findById(id);
    if (found) return found;
    const el = new MockElement('div');
    el.id = id;
    this.elementsById.set(id, el);
    return el;
  }
}

describe('TICKET-REFACTOR-AGENT-OPT-SLICE-07: BattleHUD & BagAndMartUI Modularization Invariant Tests', () => {
  const rootDir = path.resolve(__dirname, '..');

  beforeEach(() => {
    (global as any).document = new MockDocument();
    (global as any).window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      innerWidth: 1024,
    };
  });

  it('1. Enforces strict file ceilings (< 750L for BattleHUD, < 700L for BagAndMartUI, < 800L for sub-modules)', () => {
    const battleHUDPath = path.join(rootDir, 'src/ui/BattleHUD.ts');
    const bagAndMartPath = path.join(rootDir, 'src/ui/BagAndMartUI.ts');

    const battleHUDLines = fs.readFileSync(battleHUDPath, 'utf8').split('\n').length;
    const bagAndMartLines = fs.readFileSync(bagAndMartPath, 'utf8').split('\n').length;

    expect(battleHUDLines).toBeLessThanOrEqual(750);
    expect(bagAndMartLines).toBeLessThanOrEqual(700);

    const battleSubDir = path.join(rootDir, 'src/ui/battle');
    const battleFiles = fs.readdirSync(battleSubDir).filter((f) => f.endsWith('.ts'));
    expect(battleFiles.length).toBeGreaterThanOrEqual(3);
    for (const f of battleFiles) {
      const filePath = path.join(battleSubDir, f);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
      expect(lines).toBeLessThanOrEqual(800);
    }

    const bagSubDir = path.join(rootDir, 'src/ui/bag');
    const bagFiles = fs.readdirSync(bagSubDir).filter((f) => f.endsWith('.ts'));
    expect(bagFiles.length).toBeGreaterThanOrEqual(3);
    for (const f of bagFiles) {
      const filePath = path.join(bagSubDir, f);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
      expect(lines).toBeLessThanOrEqual(800);
    }
  });

  it('2. Preserves 100% backward-compatible catalog re-exports from BattleHUD and BagAndMartUI', () => {
    expect(Array.isArray(BATTLE_ITEM_CATALOG)).toBe(true);
    expect(BATTLE_ITEM_CATALOG.length).toBeGreaterThan(10);
    expect(BATTLE_ITEM_CATALOG.some((i) => i.id === 'potion')).toBe(true);

    expect(Array.isArray(MART_MEDICINE_CATALOG)).toBe(true);
    expect(MART_MEDICINE_CATALOG.length).toBeGreaterThan(3);

    expect(Array.isArray(MART_REPEL_CATALOG)).toBe(true);
    expect(MART_REPEL_CATALOG.length).toBeGreaterThan(2);

    expect(Array.isArray(MART_POKEBALL_CATALOG)).toBe(true);
    expect(MART_POKEBALL_CATALOG.length).toBeGreaterThan(5);

    expect(typeof INFINITE_TMS).toBe('object');
    expect(INFINITE_TMS['TM54']).toBeDefined();

    expect(Array.isArray(EVOLUTION_STONE_CATALOG)).toBe(true);
    expect(EVOLUTION_STONE_CATALOG.length).toBeGreaterThan(5);
  });

  it('3. Preserves BattleHUD instantiation and public API surface', () => {
    const hud = new BattleHUD('battle-hud-container');
    expect(hud).toBeDefined();
    expect(typeof hud.initBattle).toBe('function');
    expect(typeof hud.showFightMenu).toBe('function');
    expect(typeof hud.showBagMenu).toBe('function');
    expect(typeof hud.showPartyMenu).toBe('function');
    expect(typeof hud.updateHp).toBe('function');
    expect(typeof hud.showMessage).toBe('function');

    const moveData = PokemonFactory.getMoveData('tackle');
    expect(BattleHUD.getMoveEffectDescription(moveData)).toBeDefined();
  });

  it('4. Preserves BagAndMartUI instantiation and public API surface', () => {
    const inventory = {
      money: 1000,
      badges: [],
      balls: { 'poke-ball': 5 },
      tms: ['TM54'],
      items: { potion: 2 },
    };
    const party = [PokemonFactory.create('pikachu', 10)];

    const ui = new BagAndMartUI('modal-container', inventory, party);
    expect(ui).toBeDefined();
    expect(typeof ui.open).toBe('function');
    expect(typeof ui.openMart).toBe('function');
    expect(typeof ui.hide).toBe('function');
    expect(typeof ui.useMedicineOnTarget).toBe('function');
    expect(typeof ui.useEvolutionStoneOnTarget).toBe('function');
    expect(typeof ui.teachTM).toBe('function');
  });
});
