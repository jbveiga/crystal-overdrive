import { describe, it, expect, vi, beforeEach } from 'vitest';

class MockElement {
  public tagName: string;
  public id = '';
  public className = '';
  public innerHTML = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public style: Record<string, string> = {};
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }
  appendChild(c: MockElement) {
    c.parent = this;
    this.children.push(c);
    return c;
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  addEventListener() {}
  focus() {}
  querySelector(): MockElement | null {
    return null;
  }
  querySelectorAll(): MockElement[] {
    return [];
  }
}

const body = new MockElement('body');
(globalThis as any).document = {
  body,
  getElementById: () => null,
  createElement: (t: string) => new MockElement(t),
};
(globalThis as any).window = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

import { INFINITE_TMS } from '../src/ui/BagAndMartUI';
import { NamingModalUI } from '../src/ui/NamingModalUI';
import { createNpcsByMap } from '../src/world/npcData';

describe('BUGFIX-PROGRESSION-NARRATIVE-02', () => {
  beforeEach(() => {
    body.children = [];
  });

  it('defines HM05, TM31, TM49 and HM01 in the TMs & HMs pocket', () => {
    expect(INFINITE_TMS.HM05.moveId).toBe('flash');
    expect(INFINITE_TMS.TM70).toBeUndefined();
    expect(INFINITE_TMS.TM31.moveId).toBe('mudslap');
    expect(INFINITE_TMS.TM49.moveId).toBe('furycutter');
    expect(INFINITE_TMS.TM49.type).toBe('Bug');
    expect(INFINITE_TMS.HM01.moveId).toBe('cut');
  });

  it('renders the rival naming modal with pointer-events auto, mobile input attrs and CLEAR button', () => {
    const ui = new NamingModalUI('overworld-hud-container');
    ui.open({ onConfirm: () => {} });
    expect(ui.isOpen()).toBe(true);

    const backdrop = body.children[0];
    expect(backdrop.className).toContain('interactive');
    const card = backdrop.children[0];
    expect(card.className).toContain('interactive');
    expect(card.innerHTML).toContain('pointer-events: auto !important');
    expect(card.innerHTML).toContain('inputmode="text"');
    expect(card.innerHTML).toContain('autocapitalize="characters"');
    expect(card.innerHTML).toContain('font-size: 16px');
    expect(card.innerHTML).toContain('rival-clear-btn');
    ui.close();
    expect(ui.isOpen()).toBe(false);
  });

  it('falls back to SILVER when an empty name is confirmed', () => {
    const ui = new NamingModalUI('overworld-hud-container');
    const onConfirm = vi.fn();
    ui.open({ onConfirm });
    ui.setName('');
    expect(ui.confirm()).toBe('SILVER');
    expect(onConfirm).toHaveBeenCalledWith('SILVER');
  });

  it('places the peeking rival in New Bark Town (despawn handled by main.ts story flags)', () => {
    const npcs = createNpcsByMap();
    expect(npcs.new_bark_town.some((n) => n.id === 'nbt_rival')).toBe(true);
  });
});
