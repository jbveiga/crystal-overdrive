import { describe, it, expect, beforeEach } from 'vitest';
import { BattleLogUI } from '../src/ui/BattleLogUI';

// Minimal DOM element mock supporting classList and querySelector
class MockElement {
  public tagName: string;
  public id: string = '';
  private _className: string = '';
  public innerHTML: string = '';
  public textContent: string = '';
  public innerText: string = '';
  public style: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentNode: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};

  public classList = {
    classes: new Set<string>(),
    add: (...names: string[]) => names.forEach((n) => this.classList.classes.add(n)),
    remove: (...names: string[]) => names.forEach((n) => this.classList.classes.delete(n)),
    contains: (name: string) => this.classList.classes.has(name),
    toggle: (name: string) => {
      if (this.classList.classes.has(name)) {
        this.classList.classes.delete(name);
      } else {
        this.classList.classes.add(name);
      }
    },
  };

  get className(): string {
    return Array.from(this.classList.classes).join(' ');
  }

  set className(val: string) {
    this._className = val;
    this.classList.classes.clear();
    val.split(/\s+/).filter(Boolean).forEach((c) => this.classList.classes.add(c));
  }

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  public appendChild(child: MockElement) {
    child.parentNode = this;
    this.children.push(child);
  }

  public addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  public click() {
    if (this.listeners['click']) {
      this.listeners['click'].forEach((fn) => fn());
    }
  }

  public querySelector(selector: string): MockElement | null {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.findChild((el) => el.classList.contains(cls));
    }
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.findChild((el) => el.id === id);
    }
    return null;
  }

  private findChild(predicate: (el: MockElement) => boolean): MockElement | null {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child.findChild(predicate);
      if (found) return found;
    }
    return null;
  }
}

if (typeof global.document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => new MockElement(tag),
    body: new MockElement('body'),
  };
}
if (typeof global.requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (fn: Function) => setTimeout(fn, 0);
}

describe('BattleLogUI Component', () => {
  let container: MockElement;
  let battleLog: BattleLogUI;

  beforeEach(() => {
    container = new MockElement('div');
    container.id = 'battle-hud-container';
    battleLog = new BattleLogUI(container as any);
  });

  it('1. initializes in collapsed state and renders toggle button in container', () => {
    expect(battleLog.isExpanded()).toBe(false);
    const toggleBtn = container.querySelector('.battle-log-toggle-btn');
    expect(toggleBtn).not.toBeNull();
    const panel = container.querySelector('.battle-log-panel');
    expect(panel?.classList.contains('hidden')).toBe(true);
    expect(panel?.style.display).toBe('none');
  });

  it('2. toggles open and closed when open(), close(), or toggle() is called', () => {
    battleLog.open();
    expect(battleLog.isExpanded()).toBe(true);
    const panel = container.querySelector('.battle-log-panel');
    expect(panel?.classList.contains('hidden')).toBe(false);
    expect(panel?.style.display).toBe('flex');

    battleLog.close();
    expect(battleLog.isExpanded()).toBe(false);
    expect(panel?.classList.contains('hidden')).toBe(true);
    expect(panel?.style.display).toBe('none');

    battleLog.toggle();
    expect(battleLog.isExpanded()).toBe(true);
    expect(panel?.style.display).toBe('flex');
  });

  it('3. appends turn markers and logs move, damage, and status entries', () => {
    battleLog.startTurn(1);
    battleLog.addEntry('move', 'Pikachu used Thunderbolt!');
    battleLog.addEntry('damage', "It's super effective! Gyarados lost 82 HP!");
    battleLog.addEntry('status', 'Gyarados was paralyzed!');

    const entries = battleLog.getEntries();
    expect(entries.length).toBe(4);
    expect(entries[0].type).toBe('turn');
    expect(entries[0].text).toContain('TURN 1');

    expect(entries[1].type).toBe('move');
    expect(entries[1].text).toBe('Pikachu used Thunderbolt!');

    expect(entries[2].type).toBe('damage');
    expect(entries[3].type).toBe('status');
  });

  it('4. updates non-turn entry count badge on toggle button', () => {
    battleLog.startTurn(1);
    battleLog.addEntry('move', 'Cyndaquil used Ember!');
    battleLog.addEntry('damage', 'Bellsprout lost 18 HP!');

    const badge = container.querySelector('.battle-log-count');
    expect(badge?.textContent).toBe('2');
  });

  it('5. clears all entries and resets count badge on clear()', () => {
    battleLog.startTurn(1);
    battleLog.addEntry('move', 'Totodile used Water Gun!');
    expect(battleLog.getEntries().length).toBe(2);

    battleLog.clear();
    expect(battleLog.getEntries().length).toBe(0);
    const badge = container.querySelector('.battle-log-count');
    expect(badge?.textContent).toBe('0');
  });
});
