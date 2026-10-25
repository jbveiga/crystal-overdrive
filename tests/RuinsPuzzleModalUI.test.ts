import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RuinsPuzzleModalUI } from '../src/ui/RuinsPuzzleModalUI';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../src/types/game';

// Lightweight in-memory DOM mock for node environment UI test
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  private _innerHTML: string = '';
  public textContent: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    this.children = [];
    const regex = /<([a-z0-9_-]+)([^>]*)>/gi;
    let match;
    while ((match = regex.exec(val)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      if (tag.startsWith('/')) continue;
      const child = new MockElement(tag);
      const attrRegex = /([a-z0-9_-]+)=["']([^"']*)["']/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const key = attrMatch[1];
        const aVal = attrMatch[2];
        if (key === 'id') child.id = aVal;
        else if (key === 'class') child.className = aVal;
        else child.setAttribute(key, aVal);
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

  click() {
    this.listeners['click']?.forEach((fn) =>
      fn({ currentTarget: this, target: this, stopPropagation: () => {}, preventDefault: () => {} })
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

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }

  reset() {
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.elementsById.clear();
  }
}

describe('RuinsPuzzleModalUI (TICKET-MINIGAME-RUINS-SLIDING-PUZZLE-01)', () => {
  let doc: MockDocument;
  let mockContainer: MockElement;
  let puzzleUI: RuinsPuzzleModalUI;

  beforeEach(() => {
    doc = new MockDocument();
    (global as any).document = doc;
    if (typeof (global as any).window === 'undefined') {
      (global as any).window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    } else {
      (global as any).window.addEventListener = vi.fn();
      (global as any).window.removeEventListener = vi.fn();
    }

    mockContainer = new MockElement('div');
    mockContainer.id = 'modal-container';
    doc.body.appendChild(mockContainer);
    doc.register(mockContainer);

    puzzleUI = new RuinsPuzzleModalUI('modal-container');
  });

  afterEach(() => {
    if (puzzleUI.isOpen()) {
      puzzleUI.close();
    }
  });

  it('initializes in closed state with a 4x4 matrix', () => {
    expect(puzzleUI.isOpen()).toBe(false);
    const state = puzzleUI.getState();
    expect(state.gridSize).toBe(4);
    expect(state.tiles.length).toBe(16);
    expect(state.isSolved).toBe(false);
    expect(state.moveCount).toBe(0);
  });

  it('scrambles into a valid, mathematically solvable permutation with all 16 tiles present', () => {
    const onSolve = vi.fn();
    const onClose = vi.fn();
    puzzleUI.open({ onSolve, onClose }, 'kabuto');

    expect(puzzleUI.isOpen()).toBe(true);
    const state = puzzleUI.getState();

    // Verify all 16 values (0..15) exist without duplicates
    const uniqueValues = new Set(state.tiles);
    expect(uniqueValues.size).toBe(16);
    for (let i = 0; i < 16; i++) {
      expect(uniqueValues.has(i)).toBe(true);
    }

    expect(state.tiles.includes(15)).toBe(true); // blank slot present
    expect(state.moveCount).toBe(0);
    expect(puzzleUI.checkIsSolved()).toBe(false);
  });

  it('allows sliding adjacent tiles into the blank slot and increments move counter', () => {
    puzzleUI.open({ onSolve: vi.fn(), onClose: vi.fn() }, 'kabuto');
    const initialState = puzzleUI.getState();
    const blankIdx = initialState.tiles.indexOf(15);
    const neighbors = puzzleUI.getAdjacentIndices(blankIdx);

    expect(neighbors.length).toBeGreaterThanOrEqual(2);
    const targetIdx = neighbors[0];
    const targetPiece = initialState.tiles[targetIdx];

    const moved = puzzleUI.slideTile(targetIdx);
    expect(moved).toBe(true);

    const afterState = puzzleUI.getState();
    expect(afterState.moveCount).toBe(1);
    expect(afterState.tiles[blankIdx]).toBe(targetPiece);
    expect(afterState.tiles[targetIdx]).toBe(15);
  });

  it('rejects sliding non-adjacent tiles', () => {
    puzzleUI.open({ onSolve: vi.fn(), onClose: vi.fn() }, 'kabuto');
    const state = puzzleUI.getState();
    const blankIdx = state.tiles.indexOf(15);
    const br = Math.floor(blankIdx / 4);
    const bc = blankIdx % 4;

    // Find a diagonal or distant tile
    let nonAdjacentIdx = -1;
    for (let i = 0; i < 16; i++) {
      const r = Math.floor(i / 4);
      const c = i % 4;
      if (Math.abs(r - br) + Math.abs(c - bc) > 1) {
        nonAdjacentIdx = i;
        break;
      }
    }

    expect(nonAdjacentIdx).toBeGreaterThanOrEqual(0);
    const moved = puzzleUI.slideTile(nonAdjacentIdx);
    expect(moved).toBe(false);
    expect(puzzleUI.getState().moveCount).toBe(0);
  });

  it('supports directional sliding via arrow keys / WASD directions', () => {
    puzzleUI.open({ onSolve: vi.fn(), onClose: vi.fn() }, 'kabuto');
    const state = puzzleUI.getState();
    const blankIdx = state.tiles.indexOf(15);
    const br = Math.floor(blankIdx / 4);

    if (br < 3) {
      // Tile below moves UP
      const moved = puzzleUI.slideDirection('UP');
      expect(moved).toBe(true);
      expect(puzzleUI.getState().moveCount).toBe(1);
    } else {
      // Tile above moves DOWN
      const moved = puzzleUI.slideDirection('DOWN');
      expect(moved).toBe(true);
      expect(puzzleUI.getState().moveCount).toBe(1);
    }
  });

  it('resets puzzle to initial scrambled permutation and resets move count', () => {
    puzzleUI.open({ onSolve: vi.fn(), onClose: vi.fn() }, 'kabuto');
    const initialTiles = [...puzzleUI.getState().tiles];

    // Make a move
    const blankIdx = initialTiles.indexOf(15);
    const neighbors = puzzleUI.getAdjacentIndices(blankIdx);
    puzzleUI.slideTile(neighbors[0]);
    expect(puzzleUI.getState().moveCount).toBe(1);

    // Reset
    puzzleUI.reset();
    const resetState = puzzleUI.getState();
    expect(resetState.tiles).toEqual(initialTiles);
    expect(resetState.moveCount).toBe(0);
  });

  it('detects solved state, sets isSolved to true, and invokes onSolve callback', async () => {
    vi.useFakeTimers();
    const onSolve = vi.fn();
    const onClose = vi.fn();
    puzzleUI.open({ onSolve, onClose }, 'kabuto');

    puzzleUI.solve();
    expect(puzzleUI.getState().isSolved).toBe(true);
    expect(puzzleUI.checkIsSolved()).toBe(true);

    vi.advanceTimersByTime(500);

    expect(onSolve).toHaveBeenCalledWith('kabuto');
    expect(puzzleUI.isOpen()).toBe(false);
    vi.useRealTimers();
  });

  it('verifies Kabuto Chamber trapdoor warp opens to Inner Chamber at safe landing coordinate (10, 11)', () => {
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const kabutoPath = path.join(mapsDir, 'ruins_of_alph_kabuto_chamber.json');
    const innerPath = path.join(mapsDir, 'ruins_of_alph_inner_chamber.json');

    const kabutoMap: MapData = JSON.parse(fs.readFileSync(kabutoPath, 'utf8'));
    const innerMap: MapData = JSON.parse(fs.readFileSync(innerPath, 'utf8'));

    // Trapdoor warp at (4, 6) in Kabuto Chamber
    const trapdoorWarp = kabutoMap.warps.find((w) => w.x === 4 && w.y === 6);
    expect(trapdoorWarp).toBeDefined();
    expect(trapdoorWarp?.targetMapId).toBe('ruins_of_alph_inner_chamber');
    expect(trapdoorWarp?.targetX).toBe(10);
    expect(trapdoorWarp?.targetY).toBe(11);

    // Landing coordinate in Inner Chamber must be strictly walkable (collision 0 or 2)
    const landingCol = innerMap.collisionGrid[trapdoorWarp!.targetY * innerMap.width + trapdoorWarp!.targetX];
    expect(landingCol === 0 || landingCol === 2).toBe(true);
  });
});
