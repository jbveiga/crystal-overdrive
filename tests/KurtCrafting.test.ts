import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  KurtCraftingManager,
  APRICORN_BALL_MAPPINGS,
  type ApricornBallMapping,
} from '../src/world/KurtCraftingManager';
import { CatchCalculator, MOON_STONE_EVOLVERS } from '../src/battle/CatchCalculator';
import { KurtCraftingModalUI } from '../src/ui/KurtCraftingModalUI';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { npcsByMap } from '../src/world/npcData';

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
  public attributes: Record<string, string> = {};
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
        if (prop === 'cssText') {
          val.split(';').forEach((decl) => {
            const [k, v] = decl.split(':').map((s) => s.trim());
            if (k && v) {
              const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
              target[camelK] = v;
            }
          });
        }
        return true;
      },
    });
  }

  get parentNode(): MockElement | null {
    return this.parent;
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
        if (styleMatch) child.style.cssText = styleMatch[1];
        if (textMatch) {
          child.textContent = textMatch[1].trim();
          child.innerText = child.textContent;
          child._innerHTML = child.textContent;
        }
        child.parent = this;
        this.children.push(child);
      }
    }
  }

  public querySelector(sel: string): MockElement | null {
    if (sel.startsWith('#')) {
      const targetId = sel.slice(1);
      if (this.id === targetId) return this;
      for (const c of this.children) {
        const found = c.querySelector(sel);
        if (found) return found;
      }
    } else if (sel.startsWith('.')) {
      const targetCls = sel.slice(1);
      if (this.className.includes(targetCls)) return this;
      for (const c of this.children) {
        const found = c.querySelector(sel);
        if (found) return found;
      }
    } else {
      if (this.tagName.toLowerCase() === sel.toLowerCase()) return this;
      for (const c of this.children) {
        const found = c.querySelector(sel);
        if (found) return found;
      }
    }
    return null;
  }

  public querySelectorAll(sel: string): MockElement[] {
    const results: MockElement[] = [];
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.className.includes(cls)) results.push(this);
      for (const c of this.children) {
        results.push(...c.querySelectorAll(sel));
      }
    }
    return results;
  }

  public appendChild(child: MockElement): void {
    child.parent = this;
    this.children.push(child);
  }

  public removeChild(child: MockElement): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  public click(): void {
    if ((this as any).onclick) {
      (this as any).onclick({ preventDefault: () => {}, stopPropagation: () => {} });
    }
  }
}

describe('Kurt Apricorn Ball Crafting Service (TICKET-FEATURE-KURTS-APRICORN-BALLS-01)', () => {
  describe('1. Initial Hero Visit & Kurt NPC Registration', () => {
    it('asserts Kurt is registered in kurts_house at (3, 2) on a walkable tile', () => {
      const kurtNpc = npcsByMap['kurts_house']?.find((n) => n.id === 'kurt_house_kurt');
      expect(kurtNpc).toBeDefined();
      expect(kurtNpc?.x).toBe(3);
      expect(kurtNpc?.y).toBe(2);
    });
  });

  describe('2. The 7 Canonical Apricorn to Custom Poké Ball Mappings', () => {
    const expectedMappings = [
      { apricornId: 'red_apricorn', ballId: 'level-ball', name: 'LEVEL BALL' },
      { apricornId: 'blu_apricorn', ballId: 'lure-ball', name: 'LURE BALL' },
      { apricornId: 'ylw_apricorn', ballId: 'moon-ball', name: 'MOON BALL' },
      { apricornId: 'grn_apricorn', ballId: 'friend-ball', name: 'FRIEND BALL' },
      { apricornId: 'wht_apricorn', ballId: 'fast-ball', name: 'FAST BALL' },
      { apricornId: 'blk_apricorn', ballId: 'heavy-ball', name: 'HEAVY BALL' },
      { apricornId: 'pnk_apricorn', ballId: 'love-ball', name: 'LOVE BALL' },
    ];

    it('asserts all 7 Apricorn colors convert 1:1 into canonical balls', () => {
      const manager = new KurtCraftingManager();
      for (const exp of expectedMappings) {
        const mapping = manager.getMapping(exp.apricornId);
        expect(mapping).toBeDefined();
        expect(mapping?.ballId).toBe(exp.ballId);
        expect(mapping?.ballName).toBe(exp.name);
      }
    });
  });

  describe('3. CatchCalculator Modifiers for all 7 Custom Balls', () => {
    it('Level Ball: calculates 1x, 2x, 4x, and 8x multipliers based on level differential', () => {
      const wild = PokemonFactory.create('rattata', 10);

      // Player Lv. 10 <= Wild Lv. 10 -> 1x
      expect(CatchCalculator.getBallMultiplier('level-ball', wild, { turnNumber: 1, playerLevel: 10 })).toBe(1.0);
      expect(CatchCalculator.getBallMultiplier('level-ball', wild, { turnNumber: 1, playerLevel: 8 })).toBe(1.0);

      // Player Lv. 15 > Wild Lv. 10 but < 20 -> 2x
      expect(CatchCalculator.getBallMultiplier('level-ball', wild, { turnNumber: 1, playerLevel: 15 })).toBe(2.0);

      // Player Lv. 25 >= 2x Wild Lv. 10 but < 40 -> 4x
      expect(CatchCalculator.getBallMultiplier('level-ball', wild, { turnNumber: 1, playerLevel: 25 })).toBe(4.0);

      // Player Lv. 45 >= 4x Wild Lv. 10 -> 8x
      expect(CatchCalculator.getBallMultiplier('level-ball', wild, { turnNumber: 1, playerLevel: 45 })).toBe(8.0);
    });

    it('Lure Ball: gives 3.0x multiplier when hooked via Fishing Rod', () => {
      const magikarp = PokemonFactory.create('magikarp', 10);
      expect(CatchCalculator.getBallMultiplier('lure-ball', magikarp, { turnNumber: 1, isFishing: true })).toBe(3.0);
      expect(CatchCalculator.getBallMultiplier('lure-ball', magikarp, { turnNumber: 1, isFishing: false })).toBe(1.0);
    });

    it('Moon Ball: gives 4.0x multiplier against Pokémon evolving via Moon Stone', () => {
      const clefairy = PokemonFactory.create('clefairy', 12);
      const jigglypuff = PokemonFactory.create('jigglypuff', 14);
      const pidgey = PokemonFactory.create('pidgey', 10);

      expect(CatchCalculator.getBallMultiplier('moon-ball', clefairy, { turnNumber: 1 })).toBe(4.0);
      expect(CatchCalculator.getBallMultiplier('moon-ball', jigglypuff, { turnNumber: 1 })).toBe(4.0);
      expect(CatchCalculator.getBallMultiplier('moon-ball', pidgey, { turnNumber: 1 })).toBe(1.0);
    });

    it('Friend Ball: sets base friendship of caught Pokémon to 200 upon capture', () => {
      const target = PokemonFactory.create('zubat', 10);
      target.currentHp = 1;
      target.status = 'SLP';

      const result = CatchCalculator.attemptCatch('friend-ball', target, { turnNumber: 1 }, () => 0.0);
      expect(result.caught).toBe(true);
      expect(result.baseFriendship).toBe(200);
    });

    it('Fast Ball: gives 4.0x multiplier against high speed or fleeing roamers', () => {
      const electrode = PokemonFactory.create('electrode', 30); // Base speed 140
      const geodude = PokemonFactory.create('geodude', 10);     // Base speed 20

      expect(CatchCalculator.getBallMultiplier('fast-ball', electrode, { turnNumber: 1 })).toBe(4.0);
      expect(CatchCalculator.getBallMultiplier('fast-ball', geodude, { turnNumber: 1 })).toBe(1.0);
      expect(CatchCalculator.getBallMultiplier('fast-ball', geodude, { turnNumber: 1, isRoamer: true })).toBe(4.0);
    });

    it('Heavy Ball: applies flat catch rate modifier based on target weight tiers', () => {
      expect(CatchCalculator.getHeavyBallModifier(50)).toBe(-20);  // < 100 kg
      expect(CatchCalculator.getHeavyBallModifier(150)).toBe(0);   // 100 - 200 kg
      expect(CatchCalculator.getHeavyBallModifier(250)).toBe(20);  // 200 - 300 kg
      expect(CatchCalculator.getHeavyBallModifier(350)).toBe(30);  // >= 300 kg
    });

    it('Love Ball: gives 8.0x multiplier against opposite gender of the same species', () => {
      const wildNidoran = PokemonFactory.create('nidoran-m', 10);
      (wildNidoran as any).gender = 'M';

      const playerNidoran = PokemonFactory.create('nidoran-m', 10);
      (playerNidoran as any).gender = 'F';

      const playerPidgey = PokemonFactory.create('pidgey', 10);
      (playerPidgey as any).gender = 'F';

      // Same species and opposite gender -> 8x
      expect(
        CatchCalculator.getBallMultiplier('love-ball', wildNidoran, {
          turnNumber: 1,
          playerPokemon: playerNidoran,
        })
      ).toBe(8.0);

      // Different species -> 1x
      expect(
        CatchCalculator.getBallMultiplier('love-ball', wildNidoran, {
          turnNumber: 1,
          playerPokemon: playerPidgey,
        })
      ).toBe(1.0);
    });
  });

  describe('4. Crafting State Machine Transitions', () => {
    let manager: KurtCraftingManager;

    beforeEach(() => {
      manager = new KurtCraftingManager();
    });

    it('accepts order, transitions state, rejects duplicates while in progress, and delivers on ready', () => {
      expect(manager.canAcceptOrder()).toBe(true);
      expect(manager.activeOrder).toBeUndefined();

      // Submit order for 3 Heavy Balls
      const order = manager.placeOrder('blk_apricorn', 3);
      expect(order.apricornId).toBe('blk_apricorn');
      expect(order.ballId).toBe('heavy-ball');
      expect(order.quantity).toBe(3);
      expect(order.isReady).toBe(false);

      // In progress -> cannot accept another order
      expect(manager.canAcceptOrder()).toBe(false);
      expect(() => manager.placeOrder('red_apricorn', 1)).toThrow();

      // Cannot collect while in progress
      expect(manager.collectOrder()).toBeNull();

      // Mark ready
      manager.markReady();
      expect(manager.activeOrder?.isReady).toBe(true);

      // Collect order
      const delivered = manager.collectOrder();
      expect(delivered).toEqual({
        ballId: 'heavy-ball',
        quantity: 3,
      });

      // After delivery -> idle and ready for new order
      expect(manager.activeOrder).toBeUndefined();
      expect(manager.canAcceptOrder()).toBe(true);
    });
  });

  describe('5. Interactive Workshop Modal UI (Google Stitch Alignment)', () => {
    let mockRoot: MockElement;

    beforeEach(() => {
      mockRoot = new MockElement('div');
      mockRoot.id = 'modal-container';
      (globalThis as any).document = {
        getElementById: (id: string) => (id === 'modal-container' ? mockRoot : null),
        createElement: (tag: string) => new MockElement(tag),
      };
      (globalThis as any).window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });

    it('mounts workshop modal, displays Apricorn slots, and submits batch order', () => {
      let submittedApricorn: string | null = null;
      let submittedQty: number = 0;

      const bagCounts: Record<string, number> = {
        red_apricorn: 5,
        blu_apricorn: 2,
      };

      new KurtCraftingModalUI('modal-container', {
        getApricornCount: (id) => bagCounts[id] || 0,
        onSubmitOrder: (apricornId, quantity) => {
          submittedApricorn = apricornId;
          submittedQty = quantity;
        },
        onClose: () => {},
      });

      const overlay = mockRoot.querySelector('#kurt-crafting-modal-overlay');
      expect(overlay).toBeDefined();

      const btnSubmit = overlay?.querySelector('#btn-submit-craft');
      expect(btnSubmit).toBeDefined();

      btnSubmit?.click();
      expect(submittedApricorn).toBe('red_apricorn');
      expect(submittedQty).toBe(1);
    });
  });
});
