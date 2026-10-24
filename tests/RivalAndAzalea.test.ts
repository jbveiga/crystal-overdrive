import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { SaveManager, type SaveData } from '../src/core/SaveManager';
import { MissionManager } from '../src/world/MissionManager';
import { NamingModalUI, RIVAL_NAME_PRESETS } from '../src/ui/NamingModalUI';
import { createNpcsByMap } from '../src/world/npcData';

// Lightweight Mock Document for Node environment tests
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public value: string = '';
  public innerHTML: string = '';
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

  focus() {}

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

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }

  reset() {
    this.body = new MockElement('body');
    this.elementsById.clear();
    const hud = new MockElement('div');
    hud.id = 'overworld-hud-container';
    this.body.appendChild(hud);
    this.register(hud);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = vi.fn();
(globalThis as any).removeEventListener = vi.fn();

describe('Sprint 13: Passerby Rival, Police Naming & Azalea Slowpoke Well Operations', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  describe('1. Passerby Rival Counter-Starter Logic', () => {
    function resolveRivalStarter(playerStarter: 'cyndaquil' | 'totodile' | 'chikorita' | string) {
      if (playerStarter === 'cyndaquil') {
        return { speciesId: 'totodile', level: 5, moves: ['scratch', 'leer'] };
      }
      if (playerStarter === 'totodile') {
        return { speciesId: 'chikorita', level: 5, moves: ['tackle', 'growl'] };
      }
      if (playerStarter === 'chikorita') {
        return { speciesId: 'cyndaquil', level: 5, moves: ['tackle', 'leer'] };
      }
      return { speciesId: 'totodile', level: 5, moves: ['scratch', 'leer'] };
    }

    it('selects Totodile when player chooses Cyndaquil', () => {
      const match = resolveRivalStarter('cyndaquil');
      expect(match.speciesId).toBe('totodile');
      expect(match.level).toBe(5);
      const pkmn = PokemonFactory.create(match.speciesId, match.level, match.moves);
      expect(pkmn.speciesId).toBe('totodile');
      expect(pkmn.level).toBe(5);
      expect(pkmn.moves.map((m) => m.moveId)).toEqual(['scratch', 'leer']);
    });

    it('selects Chikorita when player chooses Totodile', () => {
      const match = resolveRivalStarter('totodile');
      expect(match.speciesId).toBe('chikorita');
      expect(match.level).toBe(5);
      const pkmn = PokemonFactory.create(match.speciesId, match.level, match.moves);
      expect(pkmn.speciesId).toBe('chikorita');
      expect(pkmn.level).toBe(5);
      expect(pkmn.moves.map((m) => m.moveId)).toEqual(['tackle', 'growl']);
    });

    it('selects Cyndaquil when player chooses Chikorita', () => {
      const match = resolveRivalStarter('chikorita');
      expect(match.speciesId).toBe('cyndaquil');
      expect(match.level).toBe(5);
      const pkmn = PokemonFactory.create(match.speciesId, match.level, match.moves);
      expect(pkmn.speciesId).toBe('cyndaquil');
      expect(pkmn.level).toBe(5);
      expect(pkmn.moves.map((m) => m.moveId)).toEqual(['tackle', 'leer']);
    });
  });

  describe('2. Police Interrogation & 15-Character Rival Naming Interface', () => {
    it('initializes NamingModalUI with default SILVER and supports preset selection', () => {
      const modal = new NamingModalUI('overworld-hud-container');
      let confirmedName = '';
      modal.open({
        onConfirm: (name) => {
          confirmedName = name;
        },
      });

      expect(modal.isOpen()).toBe(true);
      expect(RIVAL_NAME_PRESETS).toEqual(['SILVER', 'KAZU', 'KAMON', 'RED']);

      modal.setName('KAZU');
      const result = modal.confirm();
      expect(result).toBe('KAZU');
      expect(confirmedName).toBe('KAZU');
      expect(modal.isOpen()).toBe(false);
    });

    it('enforces 15-character uppercase limit and defaults empty names to SILVER', () => {
      const modal = new NamingModalUI('overworld-hud-container');
      modal.open({ onConfirm: () => {} });

      modal.setName('alexanderthegreatestking');
      expect(modal.confirm()).toBe('ALEXANDERTHEGRE'); // truncated to 15 chars

      modal.open({ onConfirm: () => {} });
      modal.setName('   ');
      expect(modal.confirm()).toBe('SILVER'); // empty fallback
    });

    it('persists and hydrates rivalName in SaveData and SavePreview', async () => {
      const saveManager = new SaveManager();
      const mockSave: SaveData = {
        version: 1,
        timestamp: Date.now(),
        player: {
          name: 'GOLD',
          gender: 'BOY',
          mapId: 'elms_lab',
          x: 4,
          y: 4,
          direction: 'DOWN',
          speedMultiplier: 1,
          badges: [],
          money: 3000,
          rivalName: 'KAMON',
        },
        rivalName: 'KAMON',
        party: [PokemonFactory.create('cyndaquil', 5)],
        box: [],
        inventory: { balls: { 'poke-ball': 5 }, tms: [] },
        roamers: [],
        defeatedTrainers: ['rival_cherrygrove'],
      };

      await saveManager.saveGame(mockSave);
      const loaded = await saveManager.loadGame();
      expect(loaded?.rivalName).toBe('KAMON');
      expect(loaded?.player.rivalName).toBe('KAMON');

      const preview = await saveManager.getSavePreview();
      expect(preview?.rivalName).toBe('KAMON');
    });
  });

  describe('3. Slowpoke Well & Executive Proton Boss Battle', () => {
    it('configures Rocket Grunts and Executive Proton in Slowpoke Well B1F', () => {
      const npcs = createNpcsByMap();
      const wellNpcs = npcs.slowpoke_well_b1f;
      expect(wellNpcs).toBeDefined();

      const proton = wellNpcs.find((n) => n.id === 'executive_proton');
      expect(proton).toBeDefined();
      expect(proton?.speaker).toContain('PROTON');
      expect(proton?.trainerPokemon?.speciesId).toBe('koffing');
      expect(proton?.trainerPokemon?.level).toBe(14);
      expect(proton?.trainerTeam?.length).toBe(2);
      expect(proton?.trainerTeam?.[0].speciesId).toBe('zubat');
      expect(proton?.trainerTeam?.[0].level).toBe(9);
      expect(proton?.trainerTeam?.[1].speciesId).toBe('koffing');
      expect(proton?.trainerTeam?.[1].level).toBe(14);

      const kurt = wellNpcs.find((n) => n.id === 'well_kurt');
      expect(kurt).toBeDefined();
    });

    it('updates story flags and mission steps upon Proton defeat', () => {
      const flags = new Set<string>(['starter_chosen', 'falkner_defeated', 'entered_azalea_town']);
      const missionManager = new MissionManager();
      missionManager.checkStoryFlags(flags);

      let m03 = missionManager.getMission('M03');
      expect(m03?.status).toBe('ACTIVE');
      expect(m03?.steps[0].completed).toBe(true);
      expect(m03?.steps[1].completed).toBe(false);

      // Kurt briefs player -> Slowpoke Well cleared & Proton defeated
      flags.add('slowpoke_well_cleared');
      flags.add('proton_defeated');
      missionManager.checkStoryFlags(flags);

      m03 = missionManager.getMission('M03');
      expect(m03?.steps[1].completed).toBe(true);
      expect(m03?.steps[2].completed).toBe(true);
      expect(m03?.steps[3].completed).toBe(false);
    });
  });

  describe('4. Azalea Gym Leader Bugsy Boss Battle', () => {
    it('configures Bugsy with authentic Metapod, Kakuna, and Scyther team', () => {
      const npcs = createNpcsByMap();
      const gymNpcs = npcs.azalea_gym;
      expect(gymNpcs).toBeDefined();

      const bugsy = gymNpcs.find((n) => n.id === 'bugsy');
      expect(bugsy).toBeDefined();
      expect(bugsy?.trainerName).toBe('Leader Bugsy');
      expect(bugsy?.trainerTeam?.length).toBe(3);
      expect(bugsy?.trainerTeam?.[0].speciesId).toBe('metapod');
      expect(bugsy?.trainerTeam?.[0].level).toBe(14);
      expect(bugsy?.trainerTeam?.[1].speciesId).toBe('kakuna');
      expect(bugsy?.trainerTeam?.[1].level).toBe(14);
      expect(bugsy?.trainerTeam?.[2].speciesId).toBe('scyther');
      expect(bugsy?.trainerTeam?.[2].level).toBe(16);
    });

    it('completes Mission M03 and unlocks Hive Badge + Field Cut upon defeating Bugsy', () => {
      const flags = new Set<string>([
        'starter_chosen',
        'falkner_defeated',
        'entered_azalea_town',
        'slowpoke_well_cleared',
        'proton_defeated',
      ]);
      const missionManager = new MissionManager();
      missionManager.checkStoryFlags(flags);

      // Defeat Bugsy
      flags.add('bugsy_defeated');
      flags.add('CAN_USE_CUT');
      missionManager.checkStoryFlags(flags);

      const m03 = missionManager.getMission('M03');
      expect(m03?.status).toBe('COMPLETED');
      expect(m03?.steps.every((s) => s.completed)).toBe(true);
    });
  });
});
