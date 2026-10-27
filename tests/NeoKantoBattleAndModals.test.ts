import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattleHUD } from '../src/ui/BattleHUD';
import { BattleLogUI } from '../src/ui/BattleLogUI';
import { mountGitHubReportButton } from '../src/ui/BugReportModal';
import { NamingModalUI } from '../src/ui/NamingModalUI';
import { TitleScreenUI } from '../src/ui/TitleScreenUI';
import { PokemonFactory } from '../src/battle/PokemonFactory';

class MockElement {
  public tagName: string;
  public id: string = '';
  public _className: string = '';
  public value: string = '';
  public textContent: string = '';
  public innerText: string = '';
  public children: MockElement[] = [];
  public parentNode: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};

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

  public setAttribute(name: string, val: string) {
    this.attributes[name] = val;
  }

  public getAttribute(name: string): string | null {
    return this.attributes[name] || null;
  }

  public appendChild(child: MockElement) {
    child.parentNode = this;
    this.children.push(child);
  }

  public removeChild(child: MockElement) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
  }

  public remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  public addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  public click() {
    if (this.listeners['click']) {
      this.listeners['click'].forEach((fn) => fn({ stopPropagation: () => {} }));
    }
  }

  get innerHTML(): string {
    return this.children.map((c) => c.innerHTML || c.textContent).join(' ');
  }

  set innerHTML(val: string) {
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
      const attrRegex = /([a-z0-9_-]+)=(?:"([^"]*)"|'([^']*)')/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
        child.setAttribute(attrName, attrVal);
        if (attrName === 'id') child.id = attrVal;
        if (attrName === 'class') child.className = attrVal;
        if (attrName === 'style') {
          child.style.cssText = attrVal;
        }
      }
      this.appendChild(child);
    }
  }

  public querySelector(selector: string): MockElement | null {
    return this.findChild((el) => {
      if (selector.startsWith('#')) return el.id === selector.slice(1);
      if (selector.startsWith('.')) return el.classList.contains(selector.slice(1));
      if (selector.startsWith('[')) {
        const inner = selector.slice(1, -1);
        const eqIdx = inner.indexOf('=');
        if (eqIdx !== -1) {
          const k = inner.slice(0, eqIdx).trim();
          const v = inner.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim();
          return el.attributes[k] === v;
        }
        return Boolean(el.attributes[inner]);
      }
      return el.tagName.toLowerCase() === selector.toLowerCase();
    });
  }

  public querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    this.findAllChildren(selector, results);
    return results;
  }

  private findChild(predicate: (el: MockElement) => boolean): MockElement | null {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child.findChild(predicate);
      if (found) return found;
    }
    return null;
  }

  private findAllChildren(selector: string, results: MockElement[]) {
    for (const child of this.children) {
      let matches = false;
      if (selector.startsWith('#')) matches = child.id === selector.slice(1);
      else if (selector.startsWith('.')) matches = child.classList.contains(selector.slice(1));
      else if (selector.startsWith('[')) {
        const inner = selector.slice(1, -1);
        const eqIdx = inner.indexOf('=');
        if (eqIdx !== -1) {
          const k = inner.slice(0, eqIdx).trim();
          const v = inner.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim();
          matches = child.attributes[k] === v;
        } else {
          matches = Boolean(child.attributes[inner]);
        }
      } else matches = child.tagName.toLowerCase() === selector.toLowerCase();

      if (matches) results.push(child);
      child.findAllChildren(selector, results);
    }
  }
}

class MockDocument {
  public head: MockElement = new MockElement('head');
  public body: MockElement = new MockElement('body');
  private elementsById: Map<string, MockElement> = new Map();

  public createElement(tag: string): MockElement {
    return new MockElement(tag);
  }

  public getElementById(id: string): MockElement | null {
    return this.elementsById.get(id) || this.body.querySelector(`#${id}`) || null;
  }

  public querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector);
  }

  public querySelectorAll(selector: string): MockElement[] {
    return this.body.querySelectorAll(selector);
  }

  public register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
    for (const c of el.children) this.register(c);
  }
}

let doc: MockDocument;

beforeEach(() => {
  doc = new MockDocument();
  (global as any).document = doc;
  (global as any).window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
});

describe('Neo-Kanto Google Stitch Overhaul — Sprint 16 Slice 2 UI Modules', () => {
  it('1. verifies BattleHUD Neo-Kanto tokens, typography, and hard-offset block shadows', () => {
    const hudContainer = doc.createElement('div');
    hudContainer.id = 'battle-hud-container';
    doc.body.appendChild(hudContainer);

    const player = PokemonFactory.create('cyndaquil', 15);
    const foe = PokemonFactory.create('totodile', 14);

    const hud = new BattleHUD('battle-hud-container', player, foe, [player], {
      potion: 3,
    }, {
      'poke-ball': 5,
    });

    const root = doc.getElementById('battle-hud-root');
    expect(root).toBeDefined();

    // Verify enemy and player status cards have classic glass cards
    const enemyCard = doc.getElementById('enemy-card');
    const playerCard = doc.getElementById('player-card');
    expect(enemyCard).toBeDefined();
    expect(playerCard).toBeDefined();
    expect(enemyCard?.style.background).toBe('rgba(15, 23, 42, 0.92)');
    expect(enemyCard?.style.border).toBe('2px solid rgba(226, 232, 240, 0.25)');
    expect(enemyCard?.style.boxShadow).toBe('0 6px 18px rgba(0, 0, 0, 0.55)');

    expect(playerCard?.style.background).toBe('rgba(15, 23, 42, 0.92)');
    expect(playerCard?.style.border).toBe('2px solid rgba(226, 232, 240, 0.25)');
    expect(playerCard?.style.boxShadow).toBe('0 6px 18px rgba(0, 0, 0, 0.55)');

    // Verify Speed Toggle button has #2563eb 1x indicator and Space Mono telemetry
    const speedBtn = doc.getElementById('battle-speed-btn');
    expect(speedBtn).toBeDefined();
    expect(speedBtn?.style.background).toBe('#2563eb');
    expect(speedBtn?.style.fontFamily).toContain('Space Mono');

    // Verify command panel and 4 tactical action buttons
    const bottomPanel = doc.getElementById('battle-bottom-panel');
    expect(bottomPanel?.style.background).toBe('rgba(15, 23, 42, 0.95)');
    expect(bottomPanel?.style.boxShadow).toBe('0 6px 24px rgba(0, 0, 0, 0.65)');

    const btnFight = doc.getElementById('btn-fight');
    const btnBag = doc.getElementById('btn-bag');
    const btnPokemon = doc.getElementById('btn-pokemon');
    const btnRun = doc.getElementById('btn-run');
    expect(btnFight?.style.boxShadow).toBe('0 4px 0 0 #070B14');
    expect(btnBag?.style.boxShadow).toBe('0 4px 0 0 #070B14');
    expect(btnPokemon?.style.boxShadow).toBe('0 4px 0 0 #070B14');
    expect(btnRun?.style.boxShadow).toBe('0 4px 0 0 #070B14');

    // Verify Move Replacement Modal (promptMoveForget) adopts #0D1322 chassis & 0 8px 0 0 #070B14 shadow
    const newMove = PokemonFactory.getMoveData('flamethrower');
    hud.promptMoveForget(player, newMove);
    const moveLearnModal = doc.getElementById('move-learn-modal');
    expect(moveLearnModal).toBeDefined();
    expect(moveLearnModal?.style.background).toBe('#0D1322');
    expect(moveLearnModal?.style.border).toBe('2px solid #38BDF8');
    expect(moveLearnModal?.style.boxShadow).toBe('0 8px 0 0 #070B14');
    expect(moveLearnModal?.style.fontFamily).toContain('Plus Jakarta Sans');

    const cancelLearnBtn = doc.getElementById('cancel-learn-btn');
    expect(cancelLearnBtn?.style.boxShadow).toBe('0 3px 0 0 #070B14');
    expect(cancelLearnBtn?.style.fontFamily).toContain('Space Mono');
  });

  it('2. verifies BattleLogUI Neo-Kanto drawer styling and Space Mono turn dividers', () => {
    const container = doc.createElement('div');
    const battleLog = new BattleLogUI(container as any);

    const toggleBtn = container.querySelector('.battle-log-toggle-btn') as HTMLElement;
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn?.style.background).toBe('#0D1322');
    expect(toggleBtn?.style.border).toBe('2px solid #38BDF8');
    expect(toggleBtn?.style.boxShadow).toBe('0 4px 12px rgba(0, 0, 0, 0.5)');
    expect(toggleBtn?.style.borderRadius).toBe('999px');
    expect(toggleBtn?.style.fontFamily).toContain('Space Mono');

    const panel = container.querySelector('.battle-log-panel');
    expect(panel).toBeDefined();
    expect(panel?.style.background).toBe('rgba(13, 19, 34, 0.96)');
    expect(panel?.style.border).toBe('2px solid #38BDF8');
    expect(panel?.style.boxShadow).toBe('0 6px 0 0 #070B14');
    expect(panel?.style.fontFamily).toContain('Plus Jakarta Sans');

    // Add turn and move entry
    battleLog.startTurn(1);
    battleLog.addEntry('move', 'Cyndaquil used Flame Wheel!');

    const items = container.querySelectorAll('.battle-log-item');
    expect(items.length).toBe(2);
    expect(items[0].style.fontFamily).toContain('Space Mono');
    expect(items[0].style.color).toBe('#38BDF8');
    expect(items[1].style.fontFamily).toContain('Plus Jakarta Sans');
  });

  it('3. verifies BugReportModal tactical diagnostic button and modal card', () => {
    const uiOverlay = doc.createElement('div');
    doc.body.appendChild(uiOverlay);

    const mockCtx: any = {
      uiOverlay,
      mapManager: { getCurrentMap: () => ({ id: 'new_bark_town' }) },
      player: { x: 10, y: 8, direction: 'down' },
      getGameState: () => 'OVERWORLD',
      inventory: { badges: ['ZEPHYR'] },
      playerParty: [PokemonFactory.create('cyndaquil', 15)],
    };

    mountGitHubReportButton(mockCtx);

    const reportBtn = doc.getElementById('github-report-issue-btn');
    expect(reportBtn).toBeDefined();
    expect(reportBtn?.style.background).toBe('rgba(13, 19, 34, 0.92)');
    expect(reportBtn?.style.border).toBe('2px solid #22324F');
    expect(reportBtn?.style.boxShadow).toBe('0 4px 12px rgba(0, 0, 0, 0.4)');
    expect(reportBtn?.style.borderRadius).toBe('999px');
    expect(reportBtn?.style.fontFamily).toContain('Space Mono');

    // Click to mount diagnostic card
    reportBtn?.click();

    const modalCard = doc.getElementById('github-report-modal-card');
    expect(modalCard).toBeDefined();
    expect(modalCard?.style.background).toBe('#0D1322');
    expect(modalCard?.style.border).toBe('2px solid #38BDF8');
    expect(modalCard?.style.boxShadow).toBe('0 6px 0 0 #070B14');
    expect(modalCard?.style.fontFamily).toContain('Plus Jakarta Sans');

    const redirectLink = doc.getElementById('github-issues-redirect-link');
    expect(redirectLink).toBeDefined();
    expect(redirectLink?.style.boxShadow).toBe('0 3px 0 0 #070B14');
    expect(redirectLink?.style.fontFamily).toContain('Space Mono');
  });

  it('4. verifies NamingModalUI Neo-Kanto Crimson Alert card, slots, and keyboard styling', () => {
    const container = doc.createElement('div');
    container.id = 'overworld-hud-container';
    doc.body.appendChild(container);

    const namingModal = new NamingModalUI('overworld-hud-container');
    namingModal.open({ onConfirm: vi.fn() });

    const card = doc.getElementById('rival-naming-card');
    expect(card).toBeDefined();
    expect(card?.style.background).toBe('#0D1322');
    expect(card?.style.border).toBe('2px solid #EF4444');
    expect(card?.style.boxShadow).toBe('0 8px 0 0 #070B14');
    expect(card?.style.fontFamily).toContain('Plus Jakarta Sans');

    // Verify slot characters
    const slots = container.querySelectorAll('.rival-slot-char');
    expect(slots.length).toBe(15);
    expect(slots[0].style.background).toBe('#141E33');
    expect(slots[0].style.fontFamily).toContain('Space Mono');

    // Verify preset chips
    const presets = container.querySelectorAll('.rival-preset-btn');
    expect(presets.length).toBe(4);
    expect(presets[0].style.boxShadow).toBe('0 3px 0 0 #070B14');
    expect(presets[0].style.fontFamily).toContain('Space Mono');

    // Verify DEL and OK action buttons
    const clearBtn = doc.getElementById('rival-clear-btn');
    const confirmBtn = doc.getElementById('rival-confirm-btn');
    expect(clearBtn?.style.boxShadow).toBe('0 4px 0 0 #070B14');
    expect(clearBtn?.style.fontFamily).toContain('Space Mono');
    expect(confirmBtn?.style.boxShadow).toBe('0 4px 0 0 #070B14');
    expect(confirmBtn?.style.fontFamily).toContain('Space Mono');
  });

  it('5. verifies TitleScreenUI Neo-Kanto tokens, gate, and option modal inner cards', () => {
    const container = doc.createElement('div');
    container.id = 'modal-container';
    doc.body.appendChild(container);

    const titleScreen = new TitleScreenUI('modal-container', null);

    const root = doc.getElementById('title-screen-root');
    expect(root).toBeDefined();
    expect(root?.style.fontFamily).toContain('Plus Jakarta Sans');

    // Audio Unlock Gate
    const gate = doc.getElementById('title-unlock-gate');
    expect(gate).toBeDefined();
    expect(gate?.style.background).toBe('rgba(15, 23, 42, 0.78)');
    expect(gate?.style.border).toBe('2px solid rgba(56, 189, 248, 0.65)');
    expect(gate?.style.boxShadow).toBe('0 0 24px rgba(56, 189, 248, 0.35)');
    expect(gate?.style.borderRadius).toBe('999px');
    expect(gate?.style.fontFamily).toContain('Space Mono');

    // Unlock Gate to reveal main menu
    titleScreen.unlockGate();

    const newGameOpt = doc.getElementById('title-opt-new-game');
    const optionsOpt = doc.getElementById('title-opt-options');
    expect(newGameOpt).toBeDefined();
    expect(optionsOpt).toBeDefined();

    // Open Options Modal
    titleScreen.openOptionsModal();
    const optionsModal = doc.getElementById('title-options-modal');
    expect(optionsModal).toBeDefined();
    const innerCard = optionsModal?.children[0] as HTMLElement;
    expect(innerCard?.style.borderRadius).toBe('14px');
    expect(innerCard?.style.fontFamily).toContain('Plus Jakarta Sans');

    // Verify Battle Speed options in TitleScreenUI
    const battleSpeedBtns = optionsModal?.querySelectorAll('[data-battle-speed]');
    expect(battleSpeedBtns?.length).toBe(3);
    const spd2Btn = optionsModal?.querySelector('[data-battle-speed="2"]');
    expect(spd2Btn).toBeDefined();
    spd2Btn?.click();
    expect(titleScreen.getOptions().battleSpeedMultiplier).toBe(2);
  });
});
