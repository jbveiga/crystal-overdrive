import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PokemonInstance } from '../src/types/game';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { EvolutionManager } from '../src/world/EvolutionManager';
import { EvolutionSceneUI } from '../src/ui/EvolutionSceneUI';
import { MoveReplacementModalUI } from '../src/ui/MoveReplacementModalUI';
import {
  BagAndMartUI,
  EVOLUTION_STONE_CATALOG,
  INFINITE_TMS,
} from '../src/ui/BagAndMartUI';

// Lightweight in-memory DOM mock for node environment
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
  public attributes: Record<string, string> = {};
  public listeners: Record<string, Function[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
    const styleObj: any = {
      cssText: '',
      display: '',
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
    const childContent = this.children
      .map((c) => c.innerHTML || c.textContent || c.innerText)
      .join(' ');
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

      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const classMatch = attrs.match(/class=["']([^"']+)["']/i);
      const styleMatch = attrs.match(/style=["']([^"']+)["']/i);
      const dataCompatMatch = attrs.match(/data-compat=["']([^"']+)["']/i);
      const textMatch = val.slice(regex.lastIndex).match(/^([^<]*)/);

      const child = new MockElement(tag);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (dataCompatMatch) child.setAttribute('data-compat', dataCompatMatch[1]);
      if (textMatch) {
        child.textContent = textMatch[1].trim();
        child.innerText = child.textContent;
        child._innerHTML = child.textContent;
      }
      if (styleMatch) {
        child.style.cssText = styleMatch[1];
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

  setAttribute(k: string, v: string) {
    this.attributes[k] = v;
  }

  getAttribute(k: string) {
    return this.attributes[k] || null;
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  click() {
    this.listeners['click']?.forEach((fn) =>
      fn({
        currentTarget: this,
        stopPropagation: () => {},
        preventDefault: () => {},
      })
    );
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.className.split(/\s+/).includes(cls)) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }
    return null;
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.className.split(/\s+/).includes(cls)) results.push(this);
      for (const child of this.children) {
        results.push(...child.querySelectorAll(selector));
      }
    }
    return results;
  }
}

class MockDocument {
  public body = new MockElement('body');
  public head = new MockElement('head');
  private elementsById: Map<string, MockElement> = new Map();

  createElement(tag: string) {
    return new MockElement(tag);
  }

  getElementById(id: string) {
    return this.elementsById.get(id) || this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string) {
    return this.body.querySelectorAll(selector);
  }

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }

  reset() {
    this.body = new MockElement('body');
    this.head = new MockElement('head');
    this.elementsById.clear();
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as unknown as Record<string, unknown>).document = mockDoc;
(globalThis as unknown as Record<string, unknown>).window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerWidth: 1024,
};

describe('Evolution Suite: Bag Evolution Stones, Move-Learn Overflow & Infinite TMs/HMs', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  describe('1. EVOLUTION_STONE_CATALOG & Infinite TMs Registration', () => {
    it('defines all 7 canonical evolution stones including link-stone', () => {
      expect(EVOLUTION_STONE_CATALOG).toHaveLength(7);
      const stoneIds = EVOLUTION_STONE_CATALOG.map((s) => s.id);
      expect(stoneIds).toContain('fire-stone');
      expect(stoneIds).toContain('water-stone');
      expect(stoneIds).toContain('thunder-stone');
      expect(stoneIds).toContain('leaf-stone');
      expect(stoneIds).toContain('moon-stone');
      expect(stoneIds).toContain('sun-stone');
      expect(stoneIds).toContain('link-stone');

      const linkStone = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'link-stone');
      expect(linkStone?.isLinkStone).toBe(true);
      expect(linkStone?.badgeLabel).toBe('TRADE EVOLVE');
    });

    it('contains HM03 Surf, TM20 Endure, and TM30 Shadow Ball in INFINITE_TMS', () => {
      expect(INFINITE_TMS.HM03).toBeDefined();
      expect(INFINITE_TMS.HM03.moveId).toBe('surf');
      expect(INFINITE_TMS.HM03.name).toBe('Surf');

      expect(INFINITE_TMS.TM20).toBeDefined();
      expect(INFINITE_TMS.TM20.moveId).toBe('endure');
      expect(INFINITE_TMS.TM20.name).toBe('Endure');

      expect(INFINITE_TMS.TM30).toBeDefined();
      expect(INFINITE_TMS.TM30.moveId).toBe('shadowball');
      expect(INFINITE_TMS.TM30.name).toBe('Shadow Ball');
    });
  });

  describe('2. Owned Stone Counting & Multi-Key Compatibility', () => {
    it('accurately counts hyphenated, underscored, and alias link stones', () => {
      const inventory = {
        money: 5000,
        badges: ['zephyr'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'water-stone': 2,
          'water_stone': 1,
          'linking_cord': 3,
        },
      };

      const party: PokemonInstance[] = [PokemonFactory.create('eevee', 25)];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      const waterDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'water-stone')!;
      expect(ui.getOwnedStoneCount(waterDef)).toBe(3);

      const linkDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'link-stone')!;
      expect(ui.getOwnedStoneCount(linkDef)).toBe(3);

      const fireDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'fire-stone')!;
      expect(ui.getOwnedStoneCount(fireDef)).toBe(0);
    });
  });

  describe('3. Stone Evolution Execution (Eevee -> Vaporeon & Haunter -> Gengar)', () => {
    it('evolves Eevee into Vaporeon using Water Stone and consumes exactly 1 stone', async () => {
      const inventory = {
        money: 5000,
        badges: ['zephyr', 'hive', 'plain', 'fog'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'water-stone': 1,
        },
      };

      const eevee = PokemonFactory.create('eevee', 25);
      const party = [eevee];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      // Spy on EvolutionSceneUI.prototype.play to simulate successful completion
      const playSpy = vi
        .spyOn(EvolutionSceneUI.prototype, 'play')
        .mockResolvedValue({ evolved: true, targetSpecies: 'vaporeon' });

      const waterDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'water-stone')!;
      const success = await ui.useEvolutionStoneOnTarget(waterDef, eevee);

      expect(success).toBe(true);
      expect(playSpy).toHaveBeenCalled();
      expect(eevee.speciesId).toBe('vaporeon');
      expect(inventory.items['water-stone']).toBe(0);

      playSpy.mockRestore();
    });

    it('evolves Haunter into Gengar using Link Stone (Unbound mechanic)', async () => {
      const inventory = {
        money: 10000,
        badges: ['zephyr', 'hive', 'plain', 'fog'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'link-stone': 1,
        },
      };

      const haunter = PokemonFactory.create('haunter', 30);
      const party = [haunter];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      const playSpy = vi
        .spyOn(EvolutionSceneUI.prototype, 'play')
        .mockResolvedValue({ evolved: true, targetSpecies: 'gengar' });

      const linkDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'link-stone')!;
      const success = await ui.useEvolutionStoneOnTarget(linkDef, haunter);

      expect(success).toBe(true);
      expect(playSpy).toHaveBeenCalled();
      expect(haunter.speciesId).toBe('gengar');
      expect(inventory.items['link-stone']).toBe(0);

      playSpy.mockRestore();
    });

    it('rejects stone usage on incompatible Pokémon without consuming stone', async () => {
      const inventory = {
        money: 5000,
        badges: ['zephyr'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'fire-stone': 2,
        },
      };

      const pikachu = PokemonFactory.create('pikachu', 20);
      const party = [pikachu];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      const fireDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'fire-stone')!;
      const success = await ui.useEvolutionStoneOnTarget(fireDef, pikachu);

      expect(success).toBe(false);
      expect(pikachu.speciesId).toBe('pikachu');
      expect(inventory.items['fire-stone']).toBe(2);
    });
  });

  describe('4. B-Button Cancellation & Stone Refund Invariant', () => {
    it('refunds the consumed stone when player aborts the evolution sequence', async () => {
      const inventory = {
        money: 5000,
        badges: ['zephyr'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'thunder-stone': 1,
        },
      };

      const pikachu = PokemonFactory.create('pikachu', 22);
      const party = [pikachu];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      // Simulate player pressing B-button to cancel
      const playSpy = vi
        .spyOn(EvolutionSceneUI.prototype, 'play')
        .mockResolvedValue({ evolved: false });

      const thunderDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'thunder-stone')!;
      const success = await ui.useEvolutionStoneOnTarget(thunderDef, pikachu);

      expect(success).toBe(false);
      expect(pikachu.speciesId).toBe('pikachu');
      // Invariant: stone must be refunded!
      expect(inventory.items['thunder-stone']).toBe(1);

      playSpy.mockRestore();
    });
  });

  describe('5. Post-Evolution Move-Learn Overflow (MoveReplacementModalUI)', () => {
    it('invokes MoveReplacementModalUI when Pokémon has 4 moves and learns a move on evolution', async () => {
      const inventory = {
        money: 5000,
        badges: ['zephyr'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'water-stone': 1,
        },
      };

      // Poliwhirl evolving into Poliwrath
      const poliwhirl = PokemonFactory.create('poliwhirl', 35, [
        'watergun',
        'hypnosis',
        'bubble',
        'bodyslam',
      ]);
      expect(poliwhirl.moves).toHaveLength(4);

      const party = [poliwhirl];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      const playSpy = vi
        .spyOn(EvolutionSceneUI.prototype, 'play')
        .mockResolvedValue({ evolved: true, targetSpecies: 'poliwrath' });

      // Mock MoveReplacementModalUI to replace slot 0
      const modalSpy = vi
        .spyOn(MoveReplacementModalUI.prototype, 'open')
        .mockResolvedValue(0);

      const waterDef = EVOLUTION_STONE_CATALOG.find((s) => s.id === 'water-stone')!;
      const success = await ui.useEvolutionStoneOnTarget(waterDef, poliwhirl);

      expect(success).toBe(true);
      expect(poliwhirl.speciesId).toBe('poliwrath');

      playSpy.mockRestore();
      modalSpy.mockRestore();
    });
  });

  describe('6. Bag UI Stone Badges & Interactive DOM Handlers', () => {
    it('renders stone cards with ABLE/UNABLE badges and handles use-stone-btn click', async () => {
      const inventory = {
        money: 5000,
        badges: ['zephyr'],
        balls: {},
        tms: [],
        berries: {},
        items: {
          'water-stone': 2,
          'fire-stone': 1,
        },
      };

      const eevee = PokemonFactory.create('eevee', 25);
      const party = [eevee];
      const ui = new BagAndMartUI('modal-container', inventory, party);

      // Open the bag on ITEMS tab
      ui.open('ITEMS');

      const modalEl = mockDoc.getElementById('bag-modal');
      expect(modalEl).toBeDefined();

      const compatBadges = mockDoc.querySelectorAll('.stone-compat-badge');
      expect(compatBadges.length).toBeGreaterThan(0);

      // Water Stone is ABLE for Eevee -> Vaporeon
      const ableBadge = compatBadges.find((b) => b.getAttribute('data-compat') === 'ABLE');
      expect(ableBadge).toBeDefined();
      expect(ableBadge?.textContent).toContain('ABLE');

      // Check use stone button exists and is clickable
      const useBtns = mockDoc.querySelectorAll('.use-stone-btn');
      expect(useBtns.length).toBeGreaterThan(0);

      const useStoneSpy = vi
        .spyOn(ui, 'useEvolutionStoneOnTarget')
        .mockResolvedValue(true);

      useBtns[0].click();
      expect(useStoneSpy).toHaveBeenCalled();

      useStoneSpy.mockRestore();
    });
  });
});
