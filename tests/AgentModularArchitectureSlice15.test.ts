import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Lightweight in-memory DOM mock for node environment UI test
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public style: Record<string, string> = {};
  public listeners: Record<string, Function[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get innerHTML(): string {
    return this._innerHTML + this.children.map((c) => `<${c.tagName.toLowerCase()}>${c.innerHTML}</${c.tagName.toLowerCase()}>`).join('');
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    if (!val) {
      this.children = [];
    }
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  appendChild(child: MockElement) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) results.push(this);
      for (const child of this.children) {
        results.push(...child.querySelectorAll(selector));
      }
    }
    return results;
  }
}

class MockDocument {
  public head = new MockElement('head');
  public body = new MockElement('body');
  private elementsById: Map<string, MockElement> = new Map();

  createElement(tag: string) {
    return new MockElement(tag);
  }

  getElementById(id: string): MockElement | null {
    return this.head.querySelector(`#${id}`) || this.body.querySelector(`#${id}`) || null;
  }

  querySelectorAll(selector: string): MockElement[] {
    return [...this.head.querySelectorAll(selector), ...this.body.querySelectorAll(selector)];
  }

  reset() {
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.elementsById.clear();
  }
}

const mockDoc = new MockDocument();
(globalThis as unknown as Record<string, unknown>).document = mockDoc;

import {
  TYPE_COLORS,
  STATUS_COLORS,
  ensureNeoKantoPartyStyles,
  renderPartyMemberSummaryHtml,
} from '../src/ui/styles/partyStylesAndSummary';
import { injectRuinsPuzzleStyles } from '../src/ui/styles/ruinsPuzzleStyles';
import { injectNeoKantoEvolutionStyles } from '../src/ui/styles/evolutionStyles';
import { injectKeyframeStyles, createBattleHUDTemplateHtml } from '../src/ui/styles/battleHudStyles';

import {
  TYPE_COLORS as RE_TYPE_COLORS,
  STATUS_COLORS as RE_STATUS_COLORS,
} from '../src/ui/PartyManagementUI';
import { injectNeoKantoEvolutionStyles as RE_INJECT_EVO } from '../src/ui/evolution/EvolutionDomAndStyles';
import {
  injectKeyframeStyles as RE_INJECT_HUD,
  createBattleHUDTemplateHtml as RE_CREATE_HUD_HTML,
} from '../src/ui/battle/BattleItemCatalogAndStyles';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import type { PokemonInstance } from '../src/types/game';

describe('AgentModularArchitectureSlice15: UI Logic vs. Stylesheet Separation (src/ui/styles/)', () => {
  const rootDir = path.resolve(__dirname, '..');

  const fileCeilings: Record<string, number> = {
    'src/ui/PartyManagementUI.ts': 480,
    'src/ui/styles/partyStylesAndSummary.ts': 500,
    'src/ui/RuinsPuzzleModalUI.ts': 430,
    'src/ui/styles/ruinsPuzzleStyles.ts': 500,
    'src/ui/evolution/EvolutionDomAndStyles.ts': 250,
    'src/ui/styles/evolutionStyles.ts': 500,
    'src/ui/battle/BattleItemCatalogAndStyles.ts': 230,
    'src/ui/styles/battleHudStyles.ts': 500,
  };

  describe('Pillar 1: File Line Ceilings & Token Ergonomics', () => {
    for (const [relPath, ceiling] of Object.entries(fileCeilings)) {
      it(`asserts ${relPath} strictly stays within <= ${ceiling} lines`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
        expect(lines, `${relPath} line count (${lines}) exceeds ceiling (${ceiling})`).toBeLessThanOrEqual(ceiling);
      });
    }

    it('asserts all 4 stylesheet modules exist in src/ui/styles/ with @fileoverview headers', () => {
      const stylesDir = path.join(rootDir, 'src/ui/styles');
      const expectedModules = [
        'partyStylesAndSummary.ts',
        'ruinsPuzzleStyles.ts',
        'evolutionStyles.ts',
        'battleHudStyles.ts',
      ];

      for (const mod of expectedModules) {
        const fullPath = path.join(stylesDir, mod);
        expect(fs.existsSync(fullPath), `Expected ${mod} to exist in src/ui/styles/`).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).toContain('@fileoverview');
        expect(content).toContain('@module ui/styles/');
      }
    });
  });

  describe('Pillar 2: Style Injection & DOM Idempotency', () => {
    beforeEach(() => {
      mockDoc.reset();
    });

    it('injectNeoKantoEvolutionStyles creates #nk-evolution-scene-styles and is idempotent', () => {
      expect(mockDoc.getElementById('nk-evolution-scene-styles')).toBeNull();
      injectNeoKantoEvolutionStyles();
      const el = mockDoc.getElementById('nk-evolution-scene-styles');
      expect(el).not.toBeNull();
      expect(el?.tagName.toLowerCase()).toBe('style');

      // Idempotency check: calling again should not duplicate
      injectNeoKantoEvolutionStyles();
      const allEls = mockDoc.querySelectorAll('#nk-evolution-scene-styles');
      expect(allEls.length).toBe(1);
    });

    it('injectRuinsPuzzleStyles creates #ruins-puzzle-styles and is idempotent', () => {
      expect(mockDoc.getElementById('ruins-puzzle-styles')).toBeNull();
      injectRuinsPuzzleStyles();
      const el = mockDoc.getElementById('ruins-puzzle-styles');
      expect(el).not.toBeNull();
      expect(el?.tagName.toLowerCase()).toBe('style');

      injectRuinsPuzzleStyles();
      const allEls = mockDoc.querySelectorAll('#ruins-puzzle-styles');
      expect(allEls.length).toBe(1);
    });

    it('injectKeyframeStyles creates #crystal-battle-hud-styles and is idempotent', () => {
      expect(mockDoc.getElementById('crystal-battle-hud-styles')).toBeNull();
      injectKeyframeStyles();
      const el = mockDoc.getElementById('crystal-battle-hud-styles');
      expect(el).not.toBeNull();
      expect(el?.tagName.toLowerCase()).toBe('style');

      injectKeyframeStyles();
      const allEls = mockDoc.querySelectorAll('#crystal-battle-hud-styles');
      expect(allEls.length).toBe(1);
    });

    it('ensureNeoKantoPartyStyles creates #neo-kanto-party-styles and is idempotent', () => {
      expect(mockDoc.getElementById('neo-kanto-party-styles')).toBeNull();
      ensureNeoKantoPartyStyles();
      const el = mockDoc.getElementById('neo-kanto-party-styles');
      expect(el).not.toBeNull();
      expect(el?.tagName.toLowerCase()).toBe('style');

      ensureNeoKantoPartyStyles();
      const allEls = mockDoc.querySelectorAll('#neo-kanto-party-styles');
      expect(allEls.length).toBe(1);
    });
  });

  describe('Pillar 3: HTML Vector & Summary Generators', () => {
    it('createBattleHUDTemplateHtml returns markup with #enemy-card and #player-card', () => {
      const html = createBattleHUDTemplateHtml();
      expect(typeof html).toBe('string');
      expect(html).toContain('id="enemy-card"');
      expect(html).toContain('id="player-card"');
      expect(html).toContain('id="battle-fight-menu"');
    });

    it('renderPartyMemberSummaryHtml produces comprehensive stats and moves vector markup', () => {
      const mockMon = PokemonFactory.create('charizard', 36);

      const contentEl = mockDoc.createElement('div') as unknown as HTMLElement;
      const bannerEl = mockDoc.createElement('div') as unknown as HTMLElement;
      let backed = false;

      renderPartyMemberSummaryHtml(mockMon, () => { backed = true; }, contentEl, bannerEl);
      expect((bannerEl as any).innerText).toContain('CHARIZARD');
      expect((bannerEl as any).innerText).toContain('Lv. 36');
      expect((contentEl as any).innerHTML).toContain('ATTACK');
      expect((contentEl as any).innerHTML).toContain('DEFENSE');
      expect((contentEl as any).innerHTML).toContain('SPEED');
      expect((contentEl as any).innerHTML).toContain('KNOWN MOVES');
    });
  });

  describe('Pillar 4: Re-export Backward Compatibility', () => {
    it('verifies PartyManagementUI re-exports match underlying style constants', () => {
      expect(RE_TYPE_COLORS).toBe(TYPE_COLORS);
      expect(RE_STATUS_COLORS).toBe(STATUS_COLORS);
    });

    it('verifies EvolutionDomAndStyles re-exports injectNeoKantoEvolutionStyles', () => {
      expect(RE_INJECT_EVO).toBe(injectNeoKantoEvolutionStyles);
    });

    it('verifies BattleItemCatalogAndStyles re-exports injectKeyframeStyles and createBattleHUDTemplateHtml', () => {
      expect(RE_INJECT_HUD).toBe(injectKeyframeStyles);
      expect(RE_CREATE_HUD_HTML).toBe(createBattleHUDTemplateHtml);
    });
  });
});
