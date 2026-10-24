import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartyManagementUI } from '../src/ui/PartyManagementUI';
import type { PokemonInstance } from '../src/types/game';

// Lightweight in-memory DOM mock for node environment
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public value: string = '';
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};
  public dataset: Record<string, string> = {};

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

      // Extract all attributes
      const attrRegex = /([a-z0-9_-]+)=["']([^"']*)["']/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal = attrMatch[2];
        child.setAttribute(attrName, attrVal);
        if (attrName === 'id') child.id = attrVal;
        if (attrName === 'class') child.className = attrVal;
        if (attrName.startsWith('data-')) {
          const dataKey = attrName.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
          child.dataset[dataKey] = attrVal;
        }
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
      } else if (selector.includes('[data-slot-index]')) {
        if (el.dataset.slotIndex !== undefined || el.getAttribute('data-slot-index') !== null) {
          results.push(el);
        }
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

  querySelectorAll(selector: string): MockElement[] {
    return this.body.querySelectorAll(selector);
  }

  register(el: MockElement) {
    if (el.id) this.allElements.set(el.id, el);
  }

  reset() {
    this.body = new MockElement('body');
    this.head = new MockElement('head');
    this.allElements.clear();

    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;

function createMockPokemon(
  nickname: string,
  speciesId: string,
  level: number,
  currentHp: number,
  maxHp: number
): PokemonInstance {
  return {
    id: `pkmn-${nickname.toLowerCase()}`,
    speciesId,
    nickname,
    level,
    currentHp,
    status: 'NONE',
    types: ['Fire'],
    baseStats: {
      hp: maxHp,
      attack: 52,
      defense: 43,
      spAttack: 60,
      spDefense: 50,
      speed: 65,
    },
    moves: [
      { moveId: 'tackle', currentPp: 35, maxPp: 35 },
      { moveId: 'growl', currentPp: 40, maxPp: 40 },
    ],
    stats: {
      hp: maxHp,
      attack: 52,
      defense: 43,
      spAttack: 60,
      spDefense: 50,
      speed: 65,
    },
    ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
    evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    experience: 125,
    nature: 'Hardy',
    ability: 'Blaze',
    friendship: 70,
  } as PokemonInstance;
}

describe('PartyManagementUI (Neo-Kanto Protocol & Interactive Verification)', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  it('renders party slot cards with tactical count badge, lead indicator, and Space Mono typography', () => {
    const party = [
      createMockPokemon('CYNDAQUIL', 'cyndaquil', 7, 24, 24),
      createMockPokemon('PIDGEY', 'pidgey', 4, 18, 18),
    ];

    const ui = new PartyManagementUI('modal-container', party);
    ui.open();

    expect(ui.isOpen()).toBe(true);

    const countBadge = mockDoc.querySelector('#party-count-badge') as MockElement;
    expect(countBadge.innerText).toBe('2 / 6');

    const cards = mockDoc.querySelectorAll('.party-slot-card');
    expect(cards.length).toBe(2);

    // Slot 0 should have the lead callout
    expect(cards[0].innerHTML).toContain('★ LEAD');
    expect(cards[0].innerHTML).toContain('CYNDAQUIL');
    expect(cards[0].innerHTML).toContain('HP 24 / 24');

    // Slot 1 should have Pidgey
    expect(cards[1].innerHTML).toContain('PIDGEY');
    expect(cards[1].innerHTML).toContain('HP 18 / 18');
  });

  it('opens tactical action popover on slot click and allows switching battle order', () => {
    const party = [
      createMockPokemon('CYNDAQUIL', 'cyndaquil', 7, 24, 24),
      createMockPokemon('PIDGEY', 'pidgey', 4, 18, 18),
    ];
    const onOrderChanged = vi.fn();

    const ui = new PartyManagementUI('modal-container', party, onOrderChanged);
    ui.open();

    const cards = mockDoc.querySelectorAll('.party-slot-card');
    // Click on slot 0 to open action popover
    cards[0].click();

    const switchBtn = mockDoc.querySelector('.party-action-switch-btn') as MockElement;
    expect(switchBtn).not.toBeNull();
    expect(switchBtn.innerText).toContain('SWITCH');

    // Click switch
    switchBtn.click();

    // Now clicking slot 1 swaps party order
    const updatedCards = mockDoc.querySelectorAll('.party-slot-card');
    updatedCards[1].click();

    expect(party[0].nickname).toBe('PIDGEY');
    expect(party[1].nickname).toBe('CYNDAQUIL');
    expect(onOrderChanged).toHaveBeenCalledTimes(1);
  });

  it('renders comprehensive Summary View with 6 combat stats, moves grid, and back navigation', () => {
    const party = [createMockPokemon('CYNDAQUIL', 'cyndaquil', 7, 24, 24)];
    const ui = new PartyManagementUI('modal-container', party);
    ui.open();

    const card = mockDoc.querySelector('.party-slot-card') as MockElement;
    card.click();

    const summaryBtn = mockDoc.querySelector('.party-action-summary-btn') as MockElement;
    expect(summaryBtn).not.toBeNull();
    summaryBtn.click();

    // Summary view should now be active
    const backBtn = mockDoc.querySelector('#summary-back-btn') as MockElement;
    expect(backBtn).not.toBeNull();
    expect(backBtn.innerText).toContain('BACK TO PARTY LIST');

    const content = mockDoc.querySelector('#party-content-area') as MockElement;
    expect(content.innerHTML).toContain('COMBAT STATS');
    expect(content.innerHTML).toContain('KNOWN MOVES');

    // Clicking back button restores normal roster view
    backBtn.click();
    expect(mockDoc.querySelector('#summary-back-btn')).toBeNull();
    expect(mockDoc.querySelectorAll('.party-slot-card').length).toBe(1);
  });

  it('displays tactical empty party prompt when party has 0 Pokémon', () => {
    const party: PokemonInstance[] = [];
    const ui = new PartyManagementUI('modal-container', party);
    ui.open();

    const banner = mockDoc.querySelector('#party-prompt-banner') as MockElement;
    expect(banner.innerText).toContain('No POKéMON in your party yet');

    const countBadge = mockDoc.querySelector('#party-count-badge') as MockElement;
    expect(countBadge.innerText).toBe('0 / 6');
  });

  it('hides party modal when #close-party-modal-btn is clicked', () => {
    const party = [createMockPokemon('CYNDAQUIL', 'cyndaquil', 7, 24, 24)];
    const ui = new PartyManagementUI('modal-container', party);
    ui.open();
    expect(ui.isOpen()).toBe(true);

    const closeBtn = mockDoc.querySelector('#close-party-modal-btn') as MockElement;
    closeBtn.click();

    expect(ui.isOpen()).toBe(false);
  });
});
