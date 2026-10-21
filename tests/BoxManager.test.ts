import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { StorageManager, BoxManager } from '../src/world/StorageManager';
import { SaveManager, type SaveData } from '../src/core/SaveManager';
import { BoxManagementUI } from '../src/ui/BoxManagementUI';
import type { PokemonInstance } from '../src/types/game';

// Lightweight in-memory DOM mock for node environment UI test
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public innerHTML: string = '';
  public innerText: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
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

  createElement(tag: string) {
    return new MockElement(tag);
  }

  getElementById(id: string) {
    return this.elementsById.get(id) || this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string) {
    return this.body.querySelectorAll(selector);
  }

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }

  reset() {
    this.body = new MockElement('body');
    this.elementsById.clear();
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = vi.fn();
(globalThis as any).removeEventListener = vi.fn();

describe('Sprint 13.5: Pokémon Storage System & Box Management Grid (TICKET-SPRINT-13.5-BILLS-PC-STORAGE)', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  describe('1. Pure TypeScript StorageManager Core & Invariants', () => {
    it('creates 14 boxes with 20 slots each (280 total capacity)', () => {
      const storage = StorageManager.createDefaultStorage();
      expect(storage.currentBoxIndex).toBe(0);
      expect(storage.boxes.length).toBe(14);
      expect(storage.boxes[0].name).toBe('BOX 1');
      expect(storage.boxes[13].name).toBe('BOX 14');
      for (const b of storage.boxes) {
        expect(b.pokemon.length).toBe(20);
        expect(b.pokemon.every((p) => p === null)).toBe(true);
      }
      expect(StorageManager.getTotalStoredCount(storage)).toBe(0);
    });

    it('migrates legacy flat box Pokémon into boxes sequentially with zero data loss', () => {
      const legacyPokes: PokemonInstance[] = [];
      for (let i = 0; i < 25; i++) {
        legacyPokes.push(PokemonFactory.create('pidgey', 2 + (i % 10)));
      }

      const storage = StorageManager.createDefaultStorage(legacyPokes);
      expect(StorageManager.getBoxCount(storage.boxes[0])).toBe(20); // Box 1 completely filled
      expect(StorageManager.getBoxCount(storage.boxes[1])).toBe(5);  // Box 2 filled with remaining 5
      expect(StorageManager.getTotalStoredCount(storage)).toBe(25);

      const flat = StorageManager.flattenStorage(storage);
      expect(flat.length).toBe(25);
    });

    it('deposits into active box and automatically rolls over when active box is full', () => {
      const storage = StorageManager.createDefaultStorage();
      // Fill Box 1 (20 slots)
      for (let i = 0; i < 20; i++) {
        const res = StorageManager.depositPokemon(storage, PokemonFactory.create('sentret', 3));
        expect(res.boxIndex).toBe(0);
        expect(res.slotIndex).toBe(i);
        expect(res.rolledOver).toBe(false);
      }
      expect(StorageManager.getBoxCount(storage.boxes[0])).toBe(20);

      // 21st Pokémon should roll over to Box 2
      const overflowPoke = PokemonFactory.create('hoothoot', 5);
      const res = StorageManager.depositPokemon(storage, overflowPoke);
      expect(res.boxIndex).toBe(1);
      expect(res.slotIndex).toBe(0);
      expect(res.rolledOver).toBe(true);
      expect(storage.currentBoxIndex).toBe(1);
      expect(StorageManager.getBoxCount(storage.boxes[1])).toBe(1);
    });

    it('throws error when all 280 storage slots across all 14 boxes are full', () => {
      const storage = StorageManager.createDefaultStorage();
      // Fill all 280 slots
      for (let b = 0; b < 14; b++) {
        for (let s = 0; s < 20; s++) {
          storage.boxes[b].pokemon[s] = PokemonFactory.create('rattata', 2);
        }
      }
      expect(StorageManager.getTotalStoredCount(storage)).toBe(280);

      expect(() => {
        StorageManager.depositPokemon(storage, PokemonFactory.create('caterpie', 3));
      }).toThrow('completely full');
    });

    it('withdraws Pokémon cleanly and clears the box slot', () => {
      const storage = StorageManager.createDefaultStorage();
      const p = PokemonFactory.create('totodile', 5);
      storage.boxes[0].pokemon[0] = p;

      const withdrawn = StorageManager.withdrawPokemon(storage, 0, 0);
      expect(withdrawn).toBe(p);
      expect(storage.boxes[0].pokemon[0]).toBeNull();
      expect(StorageManager.getBoxCount(storage.boxes[0])).toBe(0);
    });

    it('enforces party minimum invariant: cannot deposit last conscious Pokémon', () => {
      const storage = StorageManager.createDefaultStorage();
      const consciousLead = PokemonFactory.create('cyndaquil', 10);
      const faintedBench = PokemonFactory.create('pidgey', 5);
      faintedBench.currentHp = 0;
      const egg = PokemonFactory.createEgg('togepi');
      const party = [consciousLead, faintedBench, egg];

      // Attempt to deposit the only conscious member (cyndaquil at index 0) into empty box slot
      const canDeposit = StorageManager.swapPartyAndBox(party, 0, storage, 0, 0);
      expect(canDeposit).toBe(false);
      expect(party.length).toBe(3);
      expect(storage.boxes[0].pokemon[0]).toBeNull();

      // If we add another conscious member, deposit should succeed
      const consciousBackup = PokemonFactory.create('bellsprout', 8);
      party.push(consciousBackup);
      const canDepositNow = StorageManager.swapPartyAndBox(party, 0, storage, 0, 0);
      expect(canDepositNow).toBe(true);
      expect(party.length).toBe(3);
      expect(storage.boxes[0].pokemon[0]?.speciesId).toBe('cyndaquil');
    });

    it('protects Legendary Roaming Beasts (Raikou, Entei, Suicune) from being released', () => {
      const storage = StorageManager.createDefaultStorage();
      const raikou = PokemonFactory.create('raikou', 40);
      const common = PokemonFactory.create('caterpie', 3);
      storage.boxes[0].pokemon[0] = raikou;
      storage.boxes[0].pokemon[1] = common;

      const releaseRaikou = StorageManager.releasePokemon(storage, 0, 0);
      expect(releaseRaikou.success).toBe(false);
      expect(releaseRaikou.reason).toContain('protected');
      expect(storage.boxes[0].pokemon[0]).toBe(raikou);

      const releaseCommon = StorageManager.releasePokemon(storage, 0, 1);
      expect(releaseCommon.success).toBe(true);
      expect(storage.boxes[0].pokemon[1]).toBeNull();
    });
  });

  describe('2. SaveManager Migration & Persistence', () => {
    it('automatically migrates legacy save with only box array to structured 14-box storage', async () => {
      const saveManager = new SaveManager();
      const legacySave = {
        version: 1,
        timestamp: Date.now(),
        player: {
          name: 'GOLD',
          gender: 'BOY',
          mapId: 'new_bark_town',
          x: 4,
          y: 4,
          direction: 'DOWN',
          speedMultiplier: 1,
          badges: [],
          money: 3000,
        },
        party: [PokemonFactory.create('chikorita', 5)],
        box: [PokemonFactory.create('geodude', 4), PokemonFactory.create('zubat', 3)],
        inventory: { balls: {}, tms: [] },
        roamers: [],
        defeatedTrainers: [],
      } as unknown as SaveData;

      await saveManager.saveGame(legacySave);
      const loaded = await saveManager.loadGame();
      expect(loaded?.storage).toBeDefined();
      expect(loaded?.storage?.boxes.length).toBe(14);
      expect(loaded?.storage?.boxes[0].pokemon[0]?.speciesId).toBe('geodude');
      expect(loaded?.storage?.boxes[0].pokemon[1]?.speciesId).toBe('zubat');
      expect(StorageManager.getTotalStoredCount(loaded!.storage!)).toBe(2);
    });
  });

  describe('3. Unbound-Style BoxManagementUI DOM Interactions', () => {
    it('opens BoxManagementUI, renders 4x5 box grid and party slots, and cycles boxes 1 to 14', () => {
      const ui = new BoxManagementUI('modal-container');
      const party = [PokemonFactory.create('cyndaquil', 12)];
      const storage = StorageManager.createDefaultStorage([
        PokemonFactory.create('pidgey', 4),
        PokemonFactory.create('rattata', 3),
      ]);

      ui.open(party, storage);
      expect(ui.isOpen()).toBe(true);
      expect(ui.getActiveBoxIndex()).toBe(0);

      // Next box -> BOX 2 (index 1)
      ui.changeBox(1);
      expect(ui.isOpen()).toBe(true);
      expect(ui.getActiveBoxIndex()).toBe(1);

      // Previous box -> back to BOX 1 (index 0)
      ui.changeBox(-1);
      expect(ui.getActiveBoxIndex()).toBe(0);

      // Cycle backward from Box 1 wraps around to Box 14 (index 13)
      ui.changeBox(-1);
      expect(ui.getActiveBoxIndex()).toBe(13);

      ui.close();
      expect(ui.isOpen()).toBe(false);
    });

    it('swaps Pokémon between party and box slot upon 2-click selection', () => {
      const ui = new BoxManagementUI('modal-container');
      const lead = PokemonFactory.create('cyndaquil', 10);
      const bench = PokemonFactory.create('sentret', 6);
      const party = [lead, bench];
      const stored = PokemonFactory.create('totodile', 8);
      const storage = StorageManager.createDefaultStorage([stored]);

      ui.open(party, storage);

      // Select party slot 1 (bench: sentret)
      ui.selectSlot('party', 1);

      // Click box slot 0 (stored: totodile) -> executes swap!
      ui.selectSlot('box', 0);

      expect(party[1].speciesId).toBe('totodile');
      expect(storage.boxes[0].pokemon[0]?.speciesId).toBe('sentret');

      ui.close();
    });

    it('preserves lifted slot buffer across mobile segmented tab switching (Neo-Kanto Protocol)', () => {
      const ui = new BoxManagementUI('modal-container');
      const party = [
        PokemonFactory.create('cyndaquil', 15),
        PokemonFactory.create('hoothoot', 12),
      ];
      const stored = PokemonFactory.create('mareep', 10);
      const storage = StorageManager.createDefaultStorage([stored]);

      ui.open(party, storage);
      expect(ui.getMobileTab()).toBe('box');

      // 1. In Box view, select box slot 0 (mareep)
      ui.selectSlot('box', 0);
      const selectedBefore = ui.getSelectedSlot();
      expect(selectedBefore).not.toBeNull();
      expect(selectedBefore?.type).toBe('box');
      expect(selectedBefore?.slotIndex).toBe(0);

      // 2. Switch mobile segmented tab to 'party'
      ui.setMobileTab('party');
      expect(ui.getMobileTab()).toBe('party');

      // 3. Assert lifted selection buffer persists across tab switch
      const selectedAfterTab = ui.getSelectedSlot();
      expect(selectedAfterTab).toEqual(selectedBefore);

      // 4. Tap party slot 1 (hoothoot) -> completes swap across tabs!
      ui.selectSlot('party', 1);

      expect(party[1].speciesId).toBe('mareep');
      expect(storage.boxes[0].pokemon[0]?.speciesId).toBe('hoothoot');
      expect(ui.getSelectedSlot()).toBeNull();

      ui.close();
    });
  });
});
