import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BugContestManager,
  DEFAULT_NPC_CONTEST_RECORDS,
} from '../src/world/BugContestManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { StartMenuUI } from '../src/ui/StartMenuUI';

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

      const textMatch = val.slice(regex.lastIndex).match(/^([^<]*)/);
      if (textMatch && textMatch[1].trim()) {
        child.textContent = textMatch[1].trim();
        child.innerText = child.textContent;
        child._innerHTML = child.textContent;
      }

      this.appendChild(child);
    }
  }

  appendChild(child: MockElement) {
    child.parent = this;
    this.children.push(child);
    return child;
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
      if (selector.includes('[data-contest-rank]')) {
        if (el.getAttribute('data-contest-rank') !== null) results.push(el);
      } else if (selector.includes('[data-stadium-challenger]')) {
        if (el.getAttribute('data-stadium-challenger') !== null) results.push(el);
      } else if (selector.startsWith('#')) {
        if (el.id === selector.slice(1)) results.push(el);
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

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector);
  }

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }
}

describe('Bug Catching Contest Tournaments & Leaderboards', () => {
  let doc: MockDocument;

  beforeEach(() => {
    doc = new MockDocument();
    (global as any).document = doc;
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    doc.body.appendChild(modalContainer);
    doc.register(modalContainer);
  });

  it('seeds default NPC tournament records, records player entries on endContest, and tracks personal best', () => {
    const manager = new BugContestManager();

    // Default Top 5 contains canonical rivals (Cooltrainer Nick, Bug Catcher Benny, etc.)
    const initialTop5 = manager.getTopLeaderboard(5);
    expect(initialTop5.length).toBe(5);
    expect(initialTop5[0].trainerName).toBe(DEFAULT_NPC_CONTEST_RECORDS[0].trainerName);
    expect(manager.getPersonalBestScore()).toBe(0);

    // Start a contest and catch a high-level Scyther at full HP
    manager.startContest();
    const scyther = PokemonFactory.create('scyther', 18);
    scyther.currentHp = scyther.stats.hp;
    manager.recordCatch(scyther);

    const endRes = manager.endContest('GOLD');
    expect(endRes.rank).toBe(1);
    expect(endRes.grade).toBe('GRADE A+');
    expect(endRes.prizeItem).toBe('sun_stone');
    expect(endRes.isNewPersonalBest).toBe(true);
    expect(manager.getPersonalBestScore()).toBe(endRes.score);

    // GOLD should now hold #1 on the leaderboard!
    const updatedTop5 = manager.getTopLeaderboard(5);
    expect(updatedTop5[0].trainerName).toBe('GOLD');
    expect(updatedTop5[0].isPlayer).toBe(true);
    expect(updatedTop5[0].score).toBe(endRes.score);

    // Serialize and restore into a new BugContestManager instance
    const serialized = manager.serializeRecords();
    const restoredManager = new BugContestManager(serialized);
    expect(restoredManager.getPersonalBestScore()).toBe(endRes.score);
    expect(restoredManager.getTopLeaderboard(1)[0].trainerName).toBe('GOLD');
  });

  it('renders #bug-contest-leaderboard-modal in StartMenuUI with Top 5 standings and Stadium 2v2 Arena launcher', () => {
    const manager = new BugContestManager();
    manager.startContest();
    const pinsir = PokemonFactory.create('pinsir', 16);
    manager.recordCatch(pinsir);
    manager.endContest('CRYSTAL');

    const onLaunchStadiumBattle = vi.fn();

    const ui = new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'CRYSTAL',
        getMoney: () => 8500,
        getBadges: () => ['zephyr', 'hive', 'plain'],
        getPartyCount: () => 4,
        getCaughtCount: () => 15,
        getPlayTimeSeconds: () => 4200,
        getMapName: () => 'National Park',
        getBugContestLeaderboard: () => manager.getTopLeaderboard(5),
        getBugContestPersonalBest: () => manager.getPersonalBestRecord(),
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onLaunchStadiumBattle,
        onSaveGame: vi.fn().mockResolvedValue(undefined),
      }
    );

    ui.open();
    expect(doc.getElementById('start-opt-contests')).toBeNull();
    ui.openBugContestLeaderboard();

    const modal = doc.getElementById('bug-contest-leaderboard-modal');
    expect(modal).toBeDefined();
    expect(modal?.style.display).toBe('flex');

    const pbBanner = modal?.querySelector('#contest-personal-best-banner');
    expect(pbBanner?.innerHTML).toContain('PERSONAL BEST');
    expect(pbBanner?.innerHTML).toContain('PINSIR');

    const rows = modal?.querySelectorAll('[data-contest-rank]') || [];
    expect(rows.length).toBe(5);
    expect(modal?.innerHTML).toContain('CRYSTAL (YOU)');
    expect(modal?.innerHTML).toContain('🥇 #1');

    // Launch a 2v2 Stadium Double Battle challenger from the modal
    const stadiumBtns = modal?.querySelectorAll('[data-stadium-challenger]') || [];
    expect(stadiumBtns.length).toBeGreaterThanOrEqual(4);
    const duoBtn = stadiumBtns.find(
      (b) => b.getAttribute('data-stadium-challenger') === 'stadium_duo_kai_maya'
    );
    expect(duoBtn).toBeDefined();
    duoBtn?.click();

    expect(onLaunchStadiumBattle).toHaveBeenCalledWith('stadium_duo_kai_maya', 'prime_double_cup');
    expect(modal?.style.display).toBe('none');
  });
});
