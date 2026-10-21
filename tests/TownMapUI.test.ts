import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TownMapUI } from '../src/ui/TownMapUI';
import { resolveCurrentLandmark, JOHTO_LANDMARKS } from '../src/world/townMapData';
import type { RoamerState } from '../src/types/game';
import { PokemonFactory } from '../src/battle/PokemonFactory';

// Lightweight in-memory DOM mock for node testing
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
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

      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const classMatch = attrs.match(/class=["']([^"']+)["']/i);
      const dataLmMatch = attrs.match(/data-landmark-id=["']([^"']+)["']/i);
      const styleMatch = attrs.match(/style=["']([^"']+)["']/i);

      const child = new MockElement(tag);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (dataLmMatch) child.setAttribute('data-landmark-id', dataLmMatch[1]);
      if (styleMatch) child.style.cssText = styleMatch[1];
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

  click() {
    this.listeners['click']?.forEach((fn) =>
      fn({ currentTarget: this, stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  getAttribute(attr: string) {
    return this.attributes[attr] || null;
  }

  setAttribute(attr: string, val: string) {
    this.attributes[attr] = val;
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.find((el) => el.id === id);
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.find((el) => el.className.split(/\s+/).includes(cls));
    }
    return this.find((el) => el.tagName.toLowerCase() === selector.toLowerCase());
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const check = (el: MockElement) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        if (el.className.split(/\s+/).includes(cls)) results.push(el);
      } else if (selector.startsWith('#')) {
        const id = selector.slice(1);
        if (el.id === id) results.push(el);
      } else if (el.tagName.toLowerCase() === selector.toLowerCase()) {
        results.push(el);
      }
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
  public body = new MockElement('body');
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
    this.elementsById.clear();
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = vi.fn();
(globalThis as any).removeEventListener = vi.fn();

describe('Johto Town Map Engine & UI (TICKET-FEATURE-TOWN-MAP-ENGINE-01)', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  describe('1. Regional Cartography & Landmark Domain (townMapData.ts)', () => {
    it('registers all canonical Johto towns, routes, and landmarks with valid grid coordinates', () => {
      const all = Object.values(JOHTO_LANDMARKS);
      expect(all.length).toBeGreaterThanOrEqual(30);

      // Verify grid boundary constraints: 0 <= x <= 15, 0 <= y <= 13
      for (const lm of all) {
        expect(lm.gridX).toBeGreaterThanOrEqual(0);
        expect(lm.gridX).toBeLessThanOrEqual(15);
        expect(lm.gridY).toBeGreaterThanOrEqual(0);
        expect(lm.gridY).toBeLessThanOrEqual(13);
        expect(lm.name.length).toBeGreaterThan(0);
        expect(lm.subtitle.length).toBeGreaterThan(0);
      }
    });

    it('resolves interior maps cleanly to their parent overworld landmarks', () => {
      expect(resolveCurrentLandmark('elms_lab')?.id).toBe('new_bark_town');
      expect(resolveCurrentLandmark('players_house_1f')?.id).toBe('new_bark_town');
      expect(resolveCurrentLandmark('cherrygrove_poke_center')?.id).toBe('cherrygrove_city');
      expect(resolveCurrentLandmark('sprout_tower_3f')?.id).toBe('sprout_tower');
      expect(resolveCurrentLandmark('union_cave_b2f')?.id).toBe('union_cave');
      expect(resolveCurrentLandmark('slowpoke_well_b1f')?.id).toBe('slowpoke_well');
      expect(resolveCurrentLandmark('route_29')?.id).toBe('route_29');
      expect(resolveCurrentLandmark('violet_city')?.id).toBe('violet_city');
    });
  });

  describe('2. Interactive Neo-Kanto TownMapUI DOM Component', () => {
    it('opens TownMapUI, sets player landmark, and default selects current location', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      expect(ui.isOpen()).toBe(false);

      ui.open('union_cave_1f');
      expect(ui.isOpen()).toBe(true);
      expect(ui.getCurrentPlayerLandmark()?.id).toBe('union_cave');
      expect(ui.getSelectedLandmark()?.id).toBe('union_cave');

      const modal = mockDoc.getElementById('town-map-modal');
      const card = mockDoc.getElementById('town-map-card');
      expect(modal).not.toBeNull();
      expect(card).not.toBeNull();

      ui.close();
      expect(ui.isOpen()).toBe(false);
      expect(mockDoc.getElementById('town-map-modal')).toBeNull();
    });

    it('selects landmark on node click and updates telemetry inspector', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      ui.open('new_bark_town');

      ui.selectLandmark('violet_city');
      const sel = ui.getSelectedLandmark();
      expect(sel).not.toBeNull();
      expect(sel?.id).toBe('violet_city');
      expect(sel?.gymLeader).toBe('Falkner');
      expect(sel?.badgeName).toBe('Zephyr Badge');

      ui.close();
    });

    it('navigates spatially between landmarks via keyboard arrow keys', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      ui.open('cherrygrove_city');
      expect(ui.getSelectedLandmark()?.id).toBe('cherrygrove_city');

      // Cherrygrove is at (10, 10). New Bark is to the right at (14, 10)
      const handledRight = ui.handleKeyDown({ key: 'ArrowRight', preventDefault: vi.fn() } as any);
      expect(handledRight).toBe(true);
      // Moved eastward
      expect(ui.getSelectedLandmark()?.gridX).toBeGreaterThan(10);

      // Pressing Escape closes the Town Map
      const handledEsc = ui.handleKeyDown({ key: 'Escape', preventDefault: vi.fn() } as any);
      expect(handledEsc).toBe(true);
      expect(ui.isOpen()).toBe(false);
    });

    it('detects live roaming beasts on active routes and renders alert telemetry', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });

      const raikouRoamer: RoamerState = {
        speciesId: 'raikou',
        currentMapId: 'route_32',
        pokemon: PokemonFactory.create('raikou', 40),
        isAwakened: true,
        isCaught: false,
        isDefeated: false,
      };

      ui.open('violet_city', ['violet_city', 'route_32'], [raikouRoamer]);

      // Inspect Route 32
      ui.selectLandmark('route_32');
      const card = mockDoc.getElementById('town-map-card');
      expect(card).not.toBeNull();

      // Roamer detected callout should be rendered in card innerHTML
      expect(card?.innerHTML).toContain('ROAMING BEAST DETECTED');
      expect(card?.innerHTML).toContain('RAIKOU');

      ui.close();
    });
  });
});
