import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GameClock } from '../src/core/GameClock';
import { BattleHUD } from '../src/ui/BattleHUD';
import { OverworldHUD } from '../src/ui/OverworldHUD';
import type { SpeedMultiplier } from '../src/types/game';

// Lightweight in-memory DOM mock for node environment UI test
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
      const textMatch = val.slice(regex.lastIndex).match(/^([^<]*)/);

      if (idMatch || classMatch || tag.toLowerCase() === 'button' || styleMatch) {
        const child = new MockElement(tag);
        if (idMatch) child.id = idMatch[1];
        if (classMatch) child.className = classMatch[1];
        if (textMatch) {
          child.textContent = textMatch[1].trim();
          child.innerText = child.textContent;
          child._innerHTML = child.textContent;
        }
        if (styleMatch) {
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
  }

  appendChild(child: MockElement) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: MockElement) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
    return child;
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  click() {
    this.listeners['click']?.forEach((fn) =>
      fn({ stopPropagation: () => {}, preventDefault: () => {} })
    );
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
    const recurse = (node: MockElement) => {
      for (const child of node.children) {
        if (selector.startsWith('#') && child.id === selector.slice(1)) results.push(child);
        else if (selector.startsWith('.') && child.className.split(/\s+/).includes(selector.slice(1))) results.push(child);
        else if (child.tagName.toLowerCase() === selector.toLowerCase()) results.push(child);
        recurse(child);
      }
    };
    recurse(this);
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
  private allElements: Map<string, MockElement> = new Map();

  createElement(tagName: string) {
    return new MockElement(tagName);
  }

  getElementById(id: string): MockElement | null {
    if (this.allElements.has(id)) return this.allElements.get(id)!;
    return this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector);
  }

  register(el: MockElement) {
    if (el.id) this.allElements.set(el.id, el);
  }

  reset() {
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.allElements.clear();
  }
}

describe('TICKET-UX-BATTLE-3X-SPEED-AND-PACING-01: Battle 3x Speed Ceiling & Pacing', () => {
  let doc: MockDocument;

  beforeEach(() => {
    doc = new MockDocument();
    (globalThis as any).document = doc;
    (globalThis as any).window = {
      innerWidth: 1024,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  describe('1. GameClock 3x Ceiling & Delta Decoupling', () => {
    it('sets MAX_BATTLE_SPEED to 3', () => {
      expect(GameClock.MAX_BATTLE_SPEED).toBe(3);
    });

    it('cycles battle speed smoothly 1x -> 2x -> 3x -> 1x', () => {
      const clock = new GameClock(3, 1);
      expect(clock.battleSpeed).toBe(1);
      expect(clock.cycleBattleSpeed()).toBe(2);
      expect(clock.cycleBattleSpeed()).toBe(3);
      expect(clock.cycleBattleSpeed()).toBe(1);
    });

    it('clamps battleSpeed assignments above 3 to MAX_BATTLE_SPEED', () => {
      const clock = new GameClock(3, 1);
      clock.battleSpeed = 4;
      expect(clock.battleSpeed).toBe(3);

      const clockClampedInit = new GameClock(1, 4 as SpeedMultiplier);
      expect(clockClampedInit.battleSpeed).toBe(3);
    });

    it('scales battle dt by 3x while keeping world dt strictly 1x', () => {
      const clock = new GameClock(1, 3);
      const rawDt = 0.016;
      const deltas = clock.tick(rawDt);

      expect(deltas.dtWorld).toBeCloseTo(0.016);
      expect(deltas.dtBattle).toBeCloseTo(0.048);
    });
  });

  describe('2. BattleHUD Speed Display & Interactive Cycling (6-Pillar Clickability & Styling)', () => {
    function setupBattleHud(): { hud: BattleHUD; speedBtn: MockElement; clock: GameClock } {
      const container = doc.createElement('div');
      container.id = 'battle-hud-container';
      doc.body.appendChild(container);
      doc.register(container);

      const clock = new GameClock(3, 1);
      const hud = new BattleHUD('battle-hud-container');
      const speedBtn = doc.getElementById('battle-speed-btn')!;

      // Wire HUD with mock callbacks
      (hud as any).callbacks = {
        onMoveSelected: vi.fn(),
        onBagSelected: vi.fn(),
        onRunSelected: vi.fn(),
        onSpeedToggle: () => {
          return clock.cycleBattleSpeed();
        },
      };

      return { hud, speedBtn, clock };
    }

    it('renders the speed button and updates text and background color across 1x, 2x, and 3x', () => {
      const { hud, speedBtn } = setupBattleHud();
      expect(speedBtn).toBeTruthy();

      // 1x speed styling
      hud.updateSpeedDisplay(1);
      expect(speedBtn.innerHTML).toContain('SPEED: 1x');
      expect(speedBtn.style.background).toBe('#2563eb');

      // 2x speed styling
      hud.updateSpeedDisplay(2);
      expect(speedBtn.innerHTML).toContain('SPEED: 2x');
      expect(speedBtn.style.background).toBe('#d97706');

      // 3x speed styling (Crimson #dc2626)
      hud.updateSpeedDisplay(3);
      expect(speedBtn.innerHTML).toContain('SPEED: 3x');
      expect(speedBtn.style.background).toBe('#dc2626');
      expect(speedBtn.style.boxShadow).toBe('0 2px 8px rgba(220, 38, 38, 0.4)');
    });

    it('simulates actual DOM click events on #battle-speed-btn to cycle speed through 1 -> 2 -> 3 -> 1', () => {
      const { speedBtn, clock } = setupBattleHud();
      expect(clock.battleSpeed).toBe(1);

      // Click 1: 1x -> 2x
      speedBtn.click();
      expect(clock.battleSpeed).toBe(2);
      expect(speedBtn.innerHTML).toContain('SPEED: 2x');
      expect(speedBtn.style.background).toBe('#d97706');

      // Click 2: 2x -> 3x
      speedBtn.click();
      expect(clock.battleSpeed).toBe(3);
      expect(speedBtn.innerHTML).toContain('SPEED: 3x');
      expect(speedBtn.style.background).toBe('#dc2626');

      // Click 3: 3x -> 1x
      speedBtn.click();
      expect(clock.battleSpeed).toBe(1);
      expect(speedBtn.innerHTML).toContain('SPEED: 1x');
      expect(speedBtn.style.background).toBe('#2563eb');
    });

    it('renders responsive mobile label on handheld viewports (<= 768px)', () => {
      (globalThis as any).window.innerWidth = 390;
      const { hud, speedBtn } = setupBattleHud();

      hud.updateSpeedDisplay(3);
      expect(speedBtn.innerHTML).toBe('<span>⚡ SPEED: 3x</span>');
      expect(speedBtn.innerHTML).not.toContain('Shift');
    });
  });

  describe('3. Dialogue Pacing Decoupling & Accelerated Constants', () => {
    it('defines DIALOGUE_CHAR_DELAY_MS = 12 and DIALOGUE_POST_DELAY_MS = 500 in BattleHUD', () => {
      expect(BattleHUD.DIALOGUE_CHAR_DELAY_MS).toBe(12);
      expect(BattleHUD.DIALOGUE_POST_DELAY_MS).toBe(500);
    });

    it('defines DIALOGUE_CHAR_DELAY_MS = 12 in OverworldHUD', () => {
      expect(OverworldHUD.DIALOGUE_CHAR_DELAY_MS).toBe(12);
    });

    it('guarantees battle dialogue typewriter runs at 12ms/char + 500ms post-delay across all speeds', async () => {
      const container = doc.createElement('div');
      container.id = 'battle-hud-container';
      doc.body.appendChild(container);
      doc.register(container);

      const hud = new BattleHUD('battle-hud-container');

      vi.useFakeTimers();
      try {
        for (const speed of [1, 2, 3] as const) {
          hud.setSpeedMultiplier(speed);
          let finished = false;
          const msg = 'PIKACHU used THUNDERBOLT!';
          const expectedTotalMs = 12 * msg.length + 500;

          const promise = hud.showMessage(msg).then(() => {
            finished = true;
          });

          await vi.advanceTimersByTimeAsync(expectedTotalMs - 10);
          expect(finished).toBe(false);

          await vi.advanceTimersByTimeAsync(15);
          await promise;
          expect(finished).toBe(true);
        }
      } finally {
        vi.useRealTimers();
      }
    });

    it('executes overworld dialogue typewriter ticker with 12ms character pacing', () => {
      const container = doc.createElement('div');
      container.id = 'overworld-hud-container';
      doc.body.appendChild(container);
      doc.register(container);

      const overworldHud = new OverworldHUD('overworld-hud-container');
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      overworldHud.openDialogue(['Welcome to the world of Pokémon!'], 'PROF. ELM');
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 12);

      setIntervalSpy.mockRestore();
    });
  });

  describe('4. BattleRenderer Snappy Intro Animation Invariants', () => {
    it('verifies BattleRenderer has tuned flashDur (0.05), slideDur (0.30), and cry bounce (0.065 / repeat 2)', () => {
      const rendererFile = path.resolve(__dirname, '../src/render/BattleRenderer.ts');
      const content = fs.readFileSync(rendererFile, 'utf-8');

      expect(content).toContain('const flashDur = 0.05 / this.speedMultiplier;');
      expect(content).toContain('const slideDur = 0.30 / this.speedMultiplier;');
      expect(content).toContain('duration: 0.065 / this.speedMultiplier,');
      expect(content).toContain('repeat: 2,');
    });
  });
});
