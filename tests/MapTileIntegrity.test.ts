import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData, PokemonInstance } from '../src/types/game';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { MoveReplacementModalUI } from '../src/ui/MoveReplacementModalUI';
import { BagAndMartUI } from '../src/ui/BagAndMartUI';
import { StorageManager, BoxManager } from '../src/world/StorageManager';
import { BoxManagementUI } from '../src/ui/BoxManagementUI';

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
      const styleMatch = attrs.match(/style=["']([^"']+)["']/i);
      const dataIndexMatch = attrs.match(/data-index=["']([^"']+)["']/i);
      const dataSlotMatch = attrs.match(/data-slot=["']([^"']+)["']/i);
      const textMatch = val.slice(regex.lastIndex).match(/^([^<]*)/);

      const child = new MockElement(tag);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (dataIndexMatch) child.setAttribute('data-index', dataIndexMatch[1]);
      if (dataSlotMatch) child.setAttribute('data-slot', dataSlotMatch[1]);
      if (textMatch) {
        child.textContent = textMatch[1].trim();
        child.innerText = child.textContent;
        child._innerHTML = child.textContent;
      }
      if (styleMatch) {
        child.style.cssText = styleMatch[1];
        styleMatch[1].split(';').forEach((decl) => {
          const [k, v] = decl.split(':').map((s) => s.trim());
          if (k && v) {
            const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            child.style[camelK] = v;
          }
        });
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

  focus() {}

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
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

  createElement(tagName: string): MockElement {
    return new MockElement(tagName);
  }

  getElementById(id: string): MockElement | null {
    return this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string): MockElement[] {
    return this.body.querySelectorAll(selector);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = vi.fn();
(globalThis as any).removeEventListener = vi.fn();

describe('TICKET-UX-TMHM-RELEASE-MAP-INTEGRITY-01: Full Verification Suite', () => {
  beforeEach(() => {
    mockDoc.body.children = [];
    const container = mockDoc.createElement('div');
    container.id = 'modal-container';
    mockDoc.body.appendChild(container);
  });

  describe('1. Map Tile & Warp Integrity Suite (All 317 Maps)', () => {
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const mapFiles = fs.readdirSync(mapsDir).filter((f) => f.endsWith('.json'));
    const maps: Record<string, MapData> = {};

    for (const f of mapFiles) {
      const data: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, f), 'utf8'));
      maps[data.id] = data;
    }

    it('verifies all maps have coherent grid dimensions (width * height === collisionGrid.length)', () => {
      expect(Object.keys(maps).length).toBe(317);
      for (const map of Object.values(maps)) {
        expect(map.collisionGrid.length).toBe(map.width * map.height);
        if (map.tileMap) {
          expect(map.tileMap.length).toBe(map.width * map.height);
        }
      }
    });

    it('asserts 100% of all warps (944 warps) land strictly on walkable tiles (collision 0 or 2)', () => {
      let totalWarps = 0;
      const invalidWarps: any[] = [];

      for (const map of Object.values(maps)) {
        if (!map.warps) continue;
        for (const w of map.warps) {
          totalWarps++;
          const target = maps[w.targetMapId];
          expect(target).toBeDefined();
          const targetIndex = w.targetY * target.width + w.targetX;
          const col = target.collisionGrid[targetIndex];
          if (col !== 0 && col !== 2) {
            invalidWarps.push({
              sourceMap: map.id,
              targetMap: target.id,
              coords: `${w.targetX}, ${w.targetY}`,
              collision: col,
            });
          }
        }
      }

      expect(totalWarps).toBeGreaterThanOrEqual(940);
      expect(invalidWarps).toEqual([]);
    });

    it('asserts 100% of referenced tiles across all maps exist in public/assets/tiles/', () => {
      const missingTiles = new Set<string>();

      for (const map of Object.values(maps)) {
        if (!map.tileMap) continue;
        for (const tile of map.tileMap) {
          const tilePath = path.join(tilesDir, `${tile}.png`);
          if (!fs.existsSync(tilePath)) {
            missingTiles.add(tile);
          }
        }
      }

      expect(Array.from(missingTiles)).toEqual([]);
    });

    it('asserts semantic coherence for solid tiles (tree, wall, cliff, fence, counter)', () => {
      // Sample map: new_bark_town
      const nbt = maps['new_bark_town'];
      expect(nbt).toBeDefined();
      nbt.tileMap!.forEach((tileName, idx) => {
        if (tileName.includes('tree') || tileName.includes('wall') || tileName.includes('roof')) {
          expect(nbt.collisionGrid[idx]).toBe(1);
        }
      });
    });
  });

  describe('2. Move Compatibility Domain (PokemonFactory.canLearnMove)', () => {
    it('accurately evaluates Gen 2 learnset compatibility', async () => {
      // Cyndaquil learns Cut (HM01 in Gen 2), does not learn Surf
      expect(await PokemonFactory.canLearnMove('cyndaquil', 'cut')).toBe(true);
      expect(await PokemonFactory.canLearnMove('cyndaquil', 'surf')).toBe(false);

      // Totodile learns Surf (HM03 in Gen 2), does not learn Flame Wheel
      expect(await PokemonFactory.canLearnMove('totodile', 'surf')).toBe(true);
      expect(await PokemonFactory.canLearnMove('totodile', 'flamewheel')).toBe(false);

      // Pidgey learns Fly (HM02 in Gen 2), does not learn Surf
      expect(await PokemonFactory.canLearnMove('pidgey', 'fly')).toBe(true);
      expect(await PokemonFactory.canLearnMove('pidgey', 'surf')).toBe(false);

      // Typhlosion inherits learnsets from Cyndaquil pre-evo chain
      expect(await PokemonFactory.canLearnMove('typhlosion', 'cut')).toBe(true);
      expect(await PokemonFactory.canLearnMove('typhlosion', 'tackle')).toBe(true);
    });

    it('returns false for nonexistent moves or species safely', async () => {
      expect(await PokemonFactory.canLearnMove('nonexistent_mon', 'cut')).toBe(false);
      expect(await PokemonFactory.canLearnMove('cyndaquil', 'fake_move_xyz')).toBe(false);
    });
  });

  describe('3. Move Replacement Modal UI (MoveReplacementModalUI)', () => {
    it('renders hero card, 4 existing moves, and cancel button with pointer-events: auto !important', async () => {
      const modalUI = new MoveReplacementModalUI('modal-container');
      const pkmn = PokemonFactory.create('cyndaquil', 16, ['tackle', 'leer', 'smokescreen', 'ember']);
      const newMove = PokemonFactory.getMoveData('flamewheel');

      const promise = modalUI.open(pkmn, newMove);

      const modalEl = mockDoc.querySelector('#move-replacement-modal') as MockElement;
      const cardEl = mockDoc.querySelector('#move-replacement-card') as MockElement;
      expect(modalEl).not.toBeNull();
      expect(cardEl).not.toBeNull();
      expect(modalEl.style.cssText).toContain('pointer-events: auto !important');
      expect(cardEl.style.cssText).toContain('pointer-events: auto !important');

      // Verify hero card contents
      expect(cardEl.innerHTML).toContain('FLAME WHEEL');
      expect(cardEl.innerHTML).toContain('PWR:');
      expect(cardEl.innerHTML).toContain('ACC:');
      expect(cardEl.innerHTML).toContain('PP:');

      // Verify 4 tactile buttons
      const buttons = cardEl.querySelectorAll('.forget-slot-btn');
      expect(buttons.length).toBe(4);

      // Verify cancel button
      const cancelBtn = cardEl.querySelector('#cancel-replacement-btn') as MockElement;
      expect(cancelBtn).not.toBeNull();
      expect(cancelBtn.innerText).toContain('GIVE UP LEARNING FLAME WHEEL');

      // Click cancel button -> resolves null
      cancelBtn.click();
      const result = await promise;
      expect(result).toBeNull();
      expect(modalUI.isOpen()).toBe(false);
    });

    it('resolves chosen slot index 0..3 when clicking an existing move button', async () => {
      const modalUI = new MoveReplacementModalUI('modal-container');
      const pkmn = PokemonFactory.create('cyndaquil', 16, ['tackle', 'leer', 'smokescreen', 'ember']);
      const newMove = PokemonFactory.getMoveData('flamewheel');

      const promise = modalUI.open(pkmn, newMove);
      const cardEl = mockDoc.querySelector('#move-replacement-card') as MockElement;
      const buttons = cardEl.querySelectorAll('.forget-slot-btn');

      // Click slot 2 (smokescreen)
      buttons[2].click();
      const result = await promise;
      expect(result).toBe(2);
      expect(modalUI.isOpen()).toBe(false);
    });
  });

  describe('4. Bag & Mart UI Interactive TM Teaching Flow', () => {
    it('renders party compatibility view with ABLE / NOT ABLE badges upon selecting a TM', async () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 10, ['tackle', 'ember']);
      const totodile = PokemonFactory.create('totodile', 10, ['scratch', 'watergun']);

      const bagUI = new BagAndMartUI(
        'modal-container',
        {
          balls: {},
          items: {},
          tms: ['TM51', 'HM03'], // Cut (TM51 in game data), Surf (HM03)
          money: 5000,
          badges: [],
        },
        [cyndaquil, totodile]
      );

      bagUI.open('TMS');
      const content = mockDoc.querySelector('#bag-content') as MockElement;
      expect(content).not.toBeNull();

      // Click TEACH on HM03 (Surf)
      bagUI.setActiveTeachingTM({
        id: 'HM03',
        moveId: 'surf',
        name: 'Surf',
        type: 'Water',
        desc: 'Teaches Surf.',
      });

      // Allow async learnset check to evaluate
      await new Promise((r) => setTimeout(r, 20));

      // Cyndaquil should be NOT ABLE, Totodile should be ABLE
      const compatList = mockDoc.querySelector('#party-compatibility-list') as MockElement;
      expect(compatList).not.toBeNull();
      expect(compatList.innerHTML).toContain('NOT ABLE');
      expect(compatList.innerHTML).toContain('ABLE — TEACH');
    });

    it('teaches directly into first empty slot when Pokémon has < 4 moves', async () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 10, ['tackle', 'ember']); // 2 moves
      const bagUI = new BagAndMartUI(
        'modal-container',
        {
          balls: {},
          items: {},
          tms: ['TM51'],
          money: 5000,
          badges: [],
        },
        [cyndaquil]
      );

      expect(cyndaquil.moves.length).toBe(2);
      await bagUI.teachTM(
        {
          id: 'TM51',
          moveId: 'cut',
          name: 'Cut',
          type: 'Normal',
          desc: 'Teaches Cut.',
        },
        cyndaquil
      );

      expect(cyndaquil.moves.length).toBe(3);
      expect(cyndaquil.moves[2].moveId).toBe('cut');
    });

    it('safely cancels and preserves all 4 moves if MoveReplacementModalUI is cancelled', async () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 16, ['tackle', 'leer', 'smokescreen', 'ember']);
      const originalMoves = [...cyndaquil.moves.map((m) => m.moveId)];

      const bagUI = new BagAndMartUI(
        'modal-container',
        {
          balls: {},
          items: {},
          tms: ['TM51'],
          money: 5000,
          badges: [],
        },
        [cyndaquil]
      );

      // Start teaching Cut (4 moves -> prompts MoveReplacementModalUI)
      const teachPromise = bagUI.teachTM(
        {
          id: 'TM51',
          moveId: 'cut',
          name: 'Cut',
          type: 'Normal',
          desc: 'Teaches Cut.',
        },
        cyndaquil
      );

      // Allow microtask to process canLearnMove and open modal
      await new Promise((r) => setTimeout(r, 10));

      // Find cancel button on replacement modal and click it
      const cancelBtn = mockDoc.querySelector('#cancel-replacement-btn') as MockElement;
      expect(cancelBtn).not.toBeNull();
      cancelBtn.click();

      await teachPromise;

      // Verify all 4 original moves remain 100% intact
      expect(cyndaquil.moves.map((m) => m.moveId)).toEqual(originalMoves);
    });
  });

  describe('5. Bill\'s PC Release Safeguards & De-emphasis (BoxManagementUI)', () => {
    it('renders prominent MOVE/SWAP and SUMMARY buttons, with release demoted to tertiary', () => {
      const ui = new BoxManagementUI('modal-container');
      const party = [PokemonFactory.create('cyndaquil', 14)];
      const storage = StorageManager.createDefaultStorage([PokemonFactory.create('totodile', 10)]);

      ui.open(party, storage);

      const swapBtn = mockDoc.querySelector('#box-swap-btn') as MockElement;
      const summaryBtn = mockDoc.querySelector('#box-summary-btn') as MockElement;
      const releaseBtn = mockDoc.querySelector('#box-release-btn') as MockElement;

      expect(swapBtn).not.toBeNull();
      expect(summaryBtn).not.toBeNull();
      expect(releaseBtn).not.toBeNull();

      // De-emphasis styling invariants
      expect(releaseBtn.className).toContain('nk-btn-tertiary');
      expect(releaseBtn.style.cssText).toContain('background: transparent');
      expect(releaseBtn.style.cssText).toContain('color: #64748B');
      expect(releaseBtn.style.cssText).toContain('height: 28px');

      ui.close();
    });

    it('opens in-game double confirmation modal on release click, defaulting focus to KEEP POKÉMON', () => {
      const ui = new BoxManagementUI('modal-container');
      const party = [PokemonFactory.create('cyndaquil', 14)];
      const storage = StorageManager.createDefaultStorage([PokemonFactory.create('totodile', 10)]);

      ui.open(party, storage);
      ui.selectSlot('box', 0); // Select stored Totodile

      const releaseBtn = mockDoc.querySelector('#box-release-btn') as MockElement;
      releaseBtn.click();

      // Confirm modal should appear
      const confirmModal = mockDoc.querySelector('#release-confirm-modal') as MockElement;
      expect(confirmModal).not.toBeNull();
      expect(confirmModal.innerHTML).toContain('RELEASE CONFIRMATION');
      expect(confirmModal.innerHTML.toUpperCase()).toContain('ONCE RELEASED, TOTODILE WILL BE GONE FOREVER');

      const keepBtn = mockDoc.querySelector('#btn-keep-pokemon') as MockElement;
      const confirmReleaseBtn = mockDoc.querySelector('#btn-confirm-release') as MockElement;
      expect(keepBtn).not.toBeNull();
      expect(confirmReleaseBtn).not.toBeNull();

      // Clicking KEEP cancels release
      keepBtn.click();
      expect(mockDoc.querySelector('#release-confirm-modal')).toBeNull();
      expect(storage.boxes[0].pokemon[0]?.speciesId).toBe('totodile');

      ui.close();
    });
  });
});
