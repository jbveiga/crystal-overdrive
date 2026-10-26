import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { DayCareManager, type DayCareSlot } from '../src/world/DayCareManager';
import { DayCareModalUI } from '../src/ui/DayCareModalUI';
import { npcsByMap } from '../src/world/npcData';
import { AudioManager } from '../src/audio/AudioManager';
import { GameClock } from '../src/core/GameClock';
import type { MapData, PokemonInstance } from '../src/types/game';

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

describe('TICKET-WORLD-ROUTE34-DAYCARE-01: Route 34 & Day-Care Center 10-Point Package', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const route34: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_34.json'), 'utf8'));
  const dayCare: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'day_care.json'), 'utf8'));
  const gate: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_34_ilex_forest_gate.json'), 'utf8'));
  const overworldItems = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../public/assets/data/overworld_items.json'), 'utf8')
  );

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

  describe('Dimension 1: Reciprocal Navigation & Safe Landing Aprons', () => {
    it('asserts reciprocal warps between route_34 and route_34_ilex_forest_gate with walkable thresholds', () => {
      const r34ToGate1 = route34.warps.find((w) => w.x === 13 && w.y === 37);
      const r34ToGate2 = route34.warps.find((w) => w.x === 14 && w.y === 37);
      expect(r34ToGate1).toBeDefined();
      expect(r34ToGate2).toBeDefined();
      expect(r34ToGate1!.targetMapId).toBe('route_34_ilex_forest_gate');
      expect(r34ToGate2!.targetMapId).toBe('route_34_ilex_forest_gate');

      // Gate return warps
      const gateToR34_1 = gate.warps.find((w) => w.x === 4 && w.y === 0);
      const gateToR34_2 = gate.warps.find((w) => w.x === 5 && w.y === 0);
      expect(gateToR34_1).toBeDefined();
      expect(gateToR34_2).toBeDefined();
      expect(gateToR34_1!.targetMapId).toBe('route_34');
      expect(gateToR34_1!.targetX).toBe(13);
      expect(gateToR34_1!.targetY).toBe(37);

      // Check walkability of thresholds
      expect(route34.collisionGrid[37 * route34.width + 13]).toBe(0);
      expect(route34.collisionGrid[37 * route34.width + 14]).toBe(0);
      expect(gate.collisionGrid[0 * gate.width + 4]).toBe(0);
      expect(gate.collisionGrid[0 * gate.width + 5]).toBe(0);
    });

    it('asserts reciprocal warps between route_34 and day_care with safe landing thresholds', () => {
      const r34ToDayCare1 = route34.warps.find((w) => w.x === 11 && w.y === 14);
      const r34ToDayCare2 = route34.warps.find((w) => w.x === 11 && w.y === 15);
      expect(r34ToDayCare1).toBeDefined();
      expect(r34ToDayCare2).toBeDefined();
      expect(r34ToDayCare1!.targetMapId).toBe('day_care');
      expect(r34ToDayCare2!.targetMapId).toBe('day_care');

      // Day-care return warps
      const dcToR34_1 = dayCare.warps.find((w) => w.x === 2 && w.y === 7);
      const dcToR34_2 = dayCare.warps.find((w) => w.x === 3 && w.y === 7);
      expect(dcToR34_1).toBeDefined();
      expect(dcToR34_2).toBeDefined();
      expect(dcToR34_1!.targetMapId).toBe('route_34');
      expect(dcToR34_1!.targetX).toBe(11);
      expect(dcToR34_1!.targetY).toBe(15);

      // Walkability
      expect(route34.collisionGrid[14 * route34.width + 11]).toBe(0);
      expect(route34.collisionGrid[15 * route34.width + 11]).toBe(0);
      expect(dayCare.collisionGrid[7 * dayCare.width + 2]).toBe(0);
      expect(dayCare.collisionGrid[7 * dayCare.width + 3]).toBe(0);
    });

    it('asserts reciprocal warps between gate and ilex_forest', () => {
      const gateToIlex1 = gate.warps.find((w) => w.x === 4 && w.y === 7);
      const gateToIlex2 = gate.warps.find((w) => w.x === 5 && w.y === 7);
      expect(gateToIlex1).toBeDefined();
      expect(gateToIlex2).toBeDefined();
      expect(gateToIlex1!.targetMapId).toBe('ilex_forest');
      expect(gateToIlex1!.targetX).toBe(1);
      expect(gateToIlex1!.targetY).toBe(5);
    });
  });

  describe('Dimension 2 & 3: NPC Population, 100% Walkability & Combat Specs', () => {
    it('asserts 100% of Route 34 and Day-Care NPCs stand on strictly walkable tiles (0 or 2)', () => {
      const r34Npcs = npcsByMap.route_34 || [];
      expect(r34Npcs.length).toBe(9);

      for (const n of r34Npcs) {
        const tileVal = route34.collisionGrid[n.y * route34.width + n.x];
        expect([0, 2]).toContain(tileVal);
      }

      const dcNpcs = npcsByMap.day_care || [];
      expect(dcNpcs.length).toBe(2);
      for (const n of dcNpcs) {
        const tileVal = dayCare.collisionGrid[n.y * dayCare.width + n.x];
        expect([0, 2]).toContain(tileVal);
      }
    });

    it('asserts all 7 canonical Route 34 trainers and 3 coastal sisters have complete teams and vision ranges', () => {
      const r34Npcs = npcsByMap.route_34 || [];
      const todd = r34Npcs.find((n) => n.id === 'camper_todd')!;
      const samuel = r34Npcs.find((n) => n.id === 'youngster_samuel')!;
      const ian = r34Npcs.find((n) => n.id === 'youngster_ian')!;
      const gina = r34Npcs.find((n) => n.id === 'picnicker_gina')!;
      const keith = r34Npcs.find((n) => n.id === 'officer_keith')!;
      const brandon = r34Npcs.find((n) => n.id === 'pokefan_brandon')!;
      const irene = r34Npcs.find((n) => n.id === 'cooltrainer_irene')!;
      const jenn = r34Npcs.find((n) => n.id === 'cooltrainer_jenn')!;
      const kate = r34Npcs.find((n) => n.id === 'cooltrainer_kate')!;

      expect(todd.visionRange).toBe(5);
      expect(todd.trainerTeam?.[0].speciesId).toBe('psyduck');
      expect(todd.trainerTeam?.[0].level).toBe(14);

      expect(samuel.visionRange).toBe(3);
      expect(samuel.trainerTeam?.length).toBe(4);

      expect(ian.visionRange).toBe(3);
      expect(ian.trainerTeam?.length).toBe(2);

      expect(gina.visionRange).toBe(3);
      expect(gina.trainerTeam?.length).toBe(3);

      expect(keith.trainerTeam?.[0].speciesId).toBe('growlithe');
      expect(keith.trainerTeam?.[0].level).toBe(17);

      expect(brandon.trainerTeam?.[0].speciesId).toBe('snubbull');
      expect(brandon.trainerTeam?.[0].heldItem).toBe('berry');

      expect(irene.visionRange).toBe(5);
      expect(irene.trainerTeam?.length).toBe(2);

      expect(jenn.visionRange).toBe(3);
      expect(jenn.trainerTeam?.length).toBe(2);

      expect(kate.visionRange).toBe(2);
      expect(kate.trainerTeam?.length).toBe(2);
    });
  });

  describe('Dimension 4: Odd Egg Grant & Party Space Invariant', () => {
    it('creates authentic Odd Egg with valid candidate baby species and shiny chance', () => {
      const egg = PokemonFactory.createOddEgg('pichu', 1.0, 256);
      expect(egg.isEgg).toBe(true);
      expect(egg.isOddEgg).toBe(true);
      expect(egg.isShiny).toBe(true);
      expect(egg.eggSteps).toBe(256);
      expect(egg.nickname).toBe('EGG');
      expect(egg.speciesId).toBe('pichu');
    });

    it('contains all 7 canonical Crystal baby species candidates', () => {
      expect(PokemonFactory.ODD_EGG_CANDIDATES).toEqual([
        'pichu',
        'cleffa',
        'igglybuff',
        'tyrogue',
        'smoochum',
        'elekid',
        'magby',
      ]);
    });

    it('verifies main.ts has party-full check before granting Odd Egg and awards flag HAS_ODD_EGG', () => {
      const mainSrc =
        fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
        '\n' +
        fs.readFileSync(
          path.resolve(__dirname, '../src/world/interactions/GoldenrodAndRoute34Interactions.ts'),
          'utf8'
        );
      expect(mainSrc).toMatch(/(targetNpc\.id === 'day_care_man'|'day_care_man')/);
      expect(mainSrc).toContain("HAS_ODD_EGG");
      expect(mainSrc).toContain('playerParty.length >= 6');
      expect(mainSrc).toContain("storyFlags.add('HAS_ODD_EGG')");
      expect(mainSrc).toContain('PokemonFactory.createOddEgg()');
    });

    it('verifies Officer Keith conditional night-only challenge logic in main.ts', () => {
      const tickerPath = path.resolve(__dirname, '../src/world/OverworldTickerCoordinator.ts');
      const mainSrc =
        fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
        '\n' +
        fs.readFileSync(
          path.resolve(__dirname, '../src/world/interactions/GoldenrodAndRoute34Interactions.ts'),
          'utf8'
        ) +
        (fs.existsSync(tickerPath) ? '\n' + fs.readFileSync(tickerPath, 'utf8') : '');
      expect(mainSrc).toMatch(/(targetNpc\.id === 'officer_keith'|'officer_keith').*getTimeOfDay\(\) !== 'NIGHT'/s);
      expect(mainSrc).toContain("spottedTrainer.id === 'officer_keith' && gameClock.getTimeOfDay() !== 'NIGHT'");
    });

    it('verifies Camper Todd, Picnicker Gina, and Cooltrainer Kate defeat reward handlers in main.ts', () => {
      const tourPath = path.resolve(__dirname, '../src/world/OverworldTrainerSightAndTourController.ts');
      const mainSrc =
        fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
        (fs.existsSync(tourPath) ? '\n' + fs.readFileSync(tourPath, 'utf8') : '');
      expect(mainSrc).toContain("storyFlags.add('TODD_REGISTERED')");
      expect(mainSrc).toContain("storyFlags.add('GINA_REGISTERED')");
      expect(mainSrc).toContain("storyFlags.add('KATE_DEFEATED_REWARD')");
      expect(mainSrc).toContain("inventory.items['soft_sand']");
    });
  });

  describe('Dimension 5 & 9: Ground Item Balls & Buried Hidden Items', () => {
    it('verifies Route 34 Nugget ground item ball at (7, 30) is registered on a walkable tile', () => {
      const r34Items = overworldItems.byMap.route_34;
      expect(r34Items).toBeDefined();
      const nugget = r34Items.itemBalls.find((b: any) => b.itemId === 'nugget');
      expect(nugget).toBeDefined();
      expect(nugget.x).toBe(7);
      expect(nugget.y).toBe(30);
      expect(nugget.eventFlag).toBe('EVENT_ROUTE_34_NUGGET');

      // Tile 0 check
      expect(route34.collisionGrid[30 * route34.width + 7]).toBe(0);
    });

    it('verifies Route 34 hidden Rare Candy at (8, 32) and Super Potion at (17, 19) are indexed', () => {
      const r34Items = overworldItems.byMap.route_34;
      const rareCandy = r34Items.hiddenItems.find((h: any) => h.itemId === 'rare_candy');
      const superPotion = r34Items.hiddenItems.find((h: any) => h.itemId === 'super_potion');

      expect(rareCandy).toBeDefined();
      expect(rareCandy.x).toBe(8);
      expect(rareCandy.y).toBe(32);

      expect(superPotion).toBeDefined();
      expect(superPotion.x).toBe(17);
      expect(superPotion.y).toBe(19);
    });
  });

  describe('Dimension 7: Signposts & Directional Lore', () => {
    it('verifies Route Sign (12, 6), Day-Care Sign (10, 13), and Trainer Tips (13, 33) bgEvents', () => {
      const routeSign = route34.bgEvents.find((b) => b.x === 12 && b.y === 6);
      const dayCareSign = route34.bgEvents.find((b) => b.x === 10 && b.y === 13);
      const tipsSign = route34.bgEvents.find((b) => b.x === 13 && b.y === 33);

      expect(routeSign).toBeDefined();
      expect(routeSign!.pages.join(' ')).toContain('GOLDENROD CITY');

      expect(dayCareSign).toBeDefined();
      expect(dayCareSign!.pages.join(' ')).toContain('DAY-CARE');

      expect(tipsSign).toBeDefined();
      expect(tipsSign!.pages.join(' ')).toContain('TRAINER TIPS');
    });
  });

  describe('Dimension 10: Zone BGM Mapping', () => {
    it('resolves route_34 and day_care cleanly to bgm_route_29', () => {
      const am = new AudioManager();
      expect(am.getTrackForMap('route_34')).toBe('bgm_route_29');
      expect(am.getTrackForMap('day_care')).toBe('bgm_route_29');
    });
  });

  describe('DayCareManager Domain Logic (Pillars 1 & 4)', () => {
    function makePkmn(speciesId: string, level: number = 20): PokemonInstance {
      return PokemonFactory.create(speciesId, level);
    }

    it('deposits and withdraws Pokémon accurately', () => {
      const mgr = new DayCareManager();
      const p1 = makePkmn('pikachu', 20);
      const p2 = makePkmn('raichu', 25);

      expect(mgr.deposit(p1)).toBe(0);
      expect(mgr.deposit(p2)).toBe(1);
      expect(mgr.getOccupiedCount()).toBe(2);

      // Cannot deposit 3rd
      const p3 = makePkmn('eevee', 15);
      expect(mgr.deposit(p3)).toBe(-1);

      // Cannot deposit Egg
      const egg = PokemonFactory.createEgg('togepi');
      expect(mgr.deposit(egg)).toBe(-1);

      const w1 = mgr.withdraw(0);
      expect(w1?.speciesId).toBe('pikachu');
      expect(mgr.getOccupiedCount()).toBe(1);
      expect(mgr.getSlot(0)).toBeNull();
    });

    it('computes canonical retrieval fee: $100 base + $100 per level gained', () => {
      const mgr = new DayCareManager();
      const p = makePkmn('cyndaquil', 15);
      mgr.deposit(p);

      const slot = mgr.getSlot(0)!;
      expect(DayCareManager.calculateFee(slot)).toBe(100);

      // Level up Pokémon by 3 levels
      slot.pokemon.level = 18;
      expect(DayCareManager.calculateFee(slot)).toBe(400); // 100 + 100 * 3
    });

    it('evaluates breeding compatibility tiers accurately', () => {
      const p1 = makePkmn('pikachu');
      p1.uid = 'trainer_a';
      const p2 = makePkmn('pikachu');
      p2.uid = 'trainer_b';

      // Tier 3: Same species, different OT
      const compat3 = DayCareManager.evaluateCompatibility(p1, p2);
      expect(compat3.tier).toBe(3);
      expect(compat3.message).toBe('The two seem to get along very well!');

      // Tier 2: Same species, same OT
      p2.uid = 'trainer_a';
      const compat2 = DayCareManager.evaluateCompatibility(p1, p2);
      expect(compat2.tier).toBe(2);
      expect(compat2.message).toBe('The two seem to get along.');

      // Tier 0: Undiscovered baby Pokémon (Pichu) cannot breed
      const pichu = makePkmn('pichu');
      const compat0 = DayCareManager.evaluateCompatibility(pichu, p1);
      expect(compat0.tier).toBe(0);
      expect(compat0.message).toBe('The two prefer to play with other Pokémon.');
    });

    it('handles step progression, EXP advancement, and Egg discovery', () => {
      const mgr = new DayCareManager();
      const p1 = makePkmn('pikachu', 10);
      const p2 = makePkmn('raichu', 10);
      p2.uid = 'other_ot';
      mgr.deposit(p1);
      mgr.deposit(p2);

      const initialExp = mgr.getSlot(0)!.pokemon.exp!;
      for (let s = 0; s < 50; s++) {
        mgr.onStepTaken();
      }
      expect(mgr.getSlot(0)!.pokemon.exp).toBe(initialExp + 50);

      // Force egg readiness and collect
      mgr.setEggReady(true, 'pichu');
      expect(mgr.isEggReady()).toBe(true);

      const collected = mgr.collectEgg();
      expect(collected).toBeDefined();
      expect(collected!.isEgg).toBe(true);
      expect(collected!.speciesId).toBe('pichu');
      expect(mgr.isEggReady()).toBe(false);
    });
  });

  describe('DayCareModalUI Workstation (Google Stitch Neo-Kanto Protocol)', () => {
    it('renders empty bays, occupied bay telemetry, and triggers callbacks', () => {
      const mgr = new DayCareManager();
      const p = PokemonFactory.create('chikorita', 12);
      mgr.deposit(p);

      const ui = new DayCareModalUI(mgr);
      let closed = false;
      let withdrawnIdx: any = null;

      ui.open({
        onClose: () => {
          closed = true;
        },
        onDeposit: () => true,
        onWithdraw: (idx) => {
          withdrawnIdx = idx;
          return mgr.withdraw(idx);
        },
        onCollectEgg: () => null,
        getPlayerMoney: () => 5000,
        getPlayerParty: () => [p, PokemonFactory.create('totodile', 12)],
      });

      expect(ui.isOpen()).toBe(true);
      const container = doc.getElementById('daycare-modal-container');
      expect(container).toBeDefined();

      // Check Slot 0 is occupied and shows Chikorita
      const slot0 = doc.getElementById('daycare-slot-0');
      expect(slot0?.innerHTML.toUpperCase()).toContain('CHIKORITA');
      expect(slot0?.innerHTML).toContain('RETRIEVAL FEE:');

      // Check Slot 1 is vacant
      const slot1 = doc.getElementById('daycare-slot-1');
      expect(slot1?.innerHTML).toContain('SLOT 02: VACANT');

      // Click withdraw on slot 0
      const withdrawBtn = doc.getElementById('daycare-withdraw-slot-0-btn');
      expect(withdrawBtn).toBeDefined();
      withdrawBtn?.click();
      expect(withdrawnIdx).toBe(0);

      // Close modal
      const closeBtn = doc.getElementById('daycare-close-btn');
      closeBtn?.click();
      expect(closed).toBe(true);
      expect(ui.isOpen()).toBe(false);
    });

    it('renders egg alert banner when an egg is discovered and allows collection', () => {
      const mgr = new DayCareManager();
      mgr.setEggReady(true, 'cleffa');

      const ui = new DayCareModalUI(mgr);
      let collected = false;

      ui.open({
        onClose: () => {},
        onDeposit: () => true,
        onWithdraw: () => null,
        onCollectEgg: () => {
          collected = true;
          return mgr.collectEgg();
        },
        getPlayerMoney: () => 5000,
        getPlayerParty: () => [PokemonFactory.create('cyndaquil', 15)],
      });

      const eggAlert = doc.getElementById('daycare-egg-alert');
      expect(eggAlert).toBeDefined();
      expect(eggAlert?.innerHTML).toContain('AN EGG WAS DISCOVERED IN THE MEADOW!');

      const collectBtn = doc.getElementById('daycare-collect-egg-btn');
      collectBtn?.click();
      expect(collected).toBe(true);
      ui.close();
    });

    it('adapts responsive layout parameters on mobile viewports (< 768px)', () => {
      (globalThis as any).window.innerWidth = 390;
      const mgr = new DayCareManager();
      const ui = new DayCareModalUI(mgr);

      ui.open({
        onClose: () => {},
        onDeposit: () => true,
        onWithdraw: () => null,
        onCollectEgg: () => null,
        getPlayerMoney: () => 1000,
        getPlayerParty: () => [],
      });

      const container = doc.getElementById('daycare-modal-container');
      expect(container?.style.width).toBe('100vw');
      expect(container?.style.height).toBe('100dvh');
      ui.close();
    });
  });
});
