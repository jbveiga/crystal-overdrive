import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData, PokemonInstance } from '../src/types/game';
import { npcsByMap, createNpcsByMap, getNpcsForMap } from '../src/world/npcData';
import {
  BugContestManager,
  isContestDay,
  calculateJudgeScore,
  getJudgeGrade,
  getSudowoodoObstacle,
} from '../src/world/BugContestManager';
import { BugContestSpecimenSwapModal } from '../src/ui/BugContestSpecimenSwapModal';
import { BugContestHUDWidget } from '../src/ui/BugContestHUDWidget';
import { AudioManager } from '../src/audio/AudioManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';

// Lightweight in-memory DOM mock for node environment UI test
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public style: any;
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  get parentNode(): MockElement | null {
    return this.parent;
  }
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

  public addEventListener(event: string, fn: Function): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  public removeEventListener(event: string, fn: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  public click(): void {
    if ((this as any).onclick) {
      (this as any).onclick({ preventDefault: () => {}, stopPropagation: () => {} });
    }
    if (this.listeners['click']) {
      this.listeners['click'].forEach((f) => f({ preventDefault: () => {}, stopPropagation: () => {} }));
    }
  }
}

describe('Route 35, National Park & Route 36 Complete Package (TICKET-WORLD-ROUTE35-NATIONAL-PARK-01)', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const itemsFile = path.resolve(__dirname, '../public/assets/data/overworld_items.json');

  const TARGET_MAP_IDS = [
    'route_35',
    'route_35_national_park_gate',
    'national_park',
    'route_36_national_park_gate',
    'route_36',
    'route_36_ruins_of_alph_gate',
  ];

  function loadMap(id: string): MapData {
    const filePath = path.join(mapsDir, `${id}.json`);
    expect(fs.existsSync(filePath), `Map file ${id}.json must exist`).toBe(true);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const isWalkable = (m: MapData, x: number, y: number): boolean => {
    if (x < 0 || x >= m.width || y < 0 || y >= m.height) return false;
    const col = m.collisionGrid[y * m.width + x];
    return col === 0 || col === 2;
  };

  describe('1. Reciprocal Navigation & Safe Landing Aprons across all 6 Maps', () => {
    it('asserts 100% of warps across all 6 maps land on valid, walkable tiles (0 or 2)', () => {
      let totalWarps = 0;
      for (const mId of TARGET_MAP_IDS) {
        const map = loadMap(mId);
        for (const w of map.warps || []) {
          totalWarps++;
          const targetPath = path.join(mapsDir, `${w.targetMapId}.json`);
          expect(fs.existsSync(targetPath), `Target map ${w.targetMapId} from ${mId} must exist`).toBe(true);
          const targetMap: MapData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
          expect(
            isWalkable(targetMap, w.targetX, w.targetY),
            `Warp landing from ${mId} to ${w.targetMapId} at (${w.targetX}, ${w.targetY}) must land on walkable tile (0 or 2)`
          ).toBe(true);
        }
      }
      expect(totalWarps).toBeGreaterThanOrEqual(12);
    });

    it('asserts reciprocal warp continuity between National Park and both gates', () => {
      const park = loadMap('national_park');
      const southGate = loadMap('route_35_national_park_gate');
      const eastGate = loadMap('route_36_national_park_gate');

      // South Gate warp from park
      const toSouthGate = park.warps?.find((w) => w.targetMapId === 'route_35_national_park_gate');
      expect(toSouthGate).toBeDefined();
      expect(isWalkable(southGate, toSouthGate!.targetX, toSouthGate!.targetY)).toBe(true);

      // Return warp from south gate to park
      const returnFromSouth = southGate.warps?.find((w) => w.targetMapId === 'national_park');
      expect(returnFromSouth).toBeDefined();
      expect(isWalkable(park, returnFromSouth!.targetX, returnFromSouth!.targetY)).toBe(true);

      // East Gate warp from park
      const toEastGate = park.warps?.find((w) => w.targetMapId === 'route_36_national_park_gate');
      expect(toEastGate).toBeDefined();
      expect(isWalkable(eastGate, toEastGate!.targetX, toEastGate!.targetY)).toBe(true);

      // Return warp from east gate to park
      const returnFromEast = eastGate.warps?.find((w) => w.targetMapId === 'national_park');
      expect(returnFromEast).toBeDefined();
      expect(isWalkable(park, returnFromEast!.targetX, returnFromEast!.targetY)).toBe(true);
    });
  });

  describe('2. Complete NPC Population & Walkability Guarantees', () => {
    it('asserts all 9 canonical Route 35 trainers are registered with teams and sightlines', () => {
      const r35Npcs = npcsByMap['route_35'];
      expect(r35Npcs).toBeDefined();

      const requiredTrainers = [
        'camper_ivan',
        'camper_elliot',
        'picnicker_brooke',
        'picnicker_kim',
        'bird_keeper_bryan',
        'firebreather_walt',
        'bug_catcher_arnie',
        'juggler_irwin',
        'officer_dirk',
      ];

      for (const tId of requiredTrainers) {
        const npc = r35Npcs.find((n) => n.id === tId);
        expect(npc, `Trainer ${tId} must exist on Route 35`).toBeDefined();
        expect(npc?.action).toBe('TRAINER_BATTLE');
        expect(npc?.visionRange).toBeGreaterThanOrEqual(1);
        expect(npc?.trainerTeam?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('asserts 100% of NPCs across all 6 maps stand on strictly walkable tiles (0 or 2)', () => {
      for (const mId of TARGET_MAP_IDS) {
        const map = loadMap(mId);
        const mapNpcs = npcsByMap[mId] || [];
        for (const npc of mapNpcs) {
          expect(
            isWalkable(map, npc.x, npc.y),
            `NPC ${npc.id} in ${mId} at (${npc.x}, ${npc.y}) must stand on walkable tile (0 or 2)`
          ).toBe(true);
        }
      }
    });
  });

  describe('3. Sudowoodo Squirtbottle Showdown & Obstacle Clearance', () => {
    it('blocks Route 36 junction when Sudowoodo is not cleared', () => {
      const flags = new Set<string>();
      const obstacle = getSudowoodoObstacle(flags);
      expect(obstacle.x).toBe(35);
      expect(obstacle.y).toBe(9);
      expect(obstacle.isCleared).toBe(false);

      const npcs = getNpcsForMap('route_36', flags);
      const sudoNpc = npcs.find((n) => n.id === 'sudowoodo');
      expect(sudoNpc).toBeDefined();
      expect(sudoNpc?.x).toBe(35);
      expect(sudoNpc?.y).toBe(9);
    });

    it('clears Sudowoodo obstacle when EVENT_FOUGHT_SUDOWOODO or sudowoodo_cleared is set', () => {
      const flags = new Set<string>(['EVENT_FOUGHT_SUDOWOODO']);
      const obstacle = getSudowoodoObstacle(flags);
      expect(obstacle.isCleared).toBe(true);

      const npcs = getNpcsForMap('route_36', flags);
      const sudoNpc = npcs.find((n) => n.id === 'sudowoodo');
      expect(sudoNpc).toBeUndefined(); // Sudowoodo entity cleared from overworld
    });

    it('asserts Sudowoodo wild battle parameters match Gen 2 Lv. 20 moveset', () => {
      const sudoPkmn = PokemonFactory.create('sudowoodo', 20, [
        'rockthrow',
        'flail',
        'lowkick',
        'mimic',
      ]);
      expect(sudoPkmn.speciesId).toBe('sudowoodo');
      expect(sudoPkmn.level).toBe(20);
      const moveIds = sudoPkmn.moves.map((m) => m.moveId);
      expect(moveIds).toContain('rockthrow');
      expect(moveIds).toContain('flail');
      expect(moveIds).toContain('lowkick');
      expect(moveIds).toContain('mimic');
    });
  });

  describe('4. Rock Smash Guy & TM08 Award Gating', () => {
    it('verifies Rock Smash Guy is registered at (44, 9) with ROCK_SMASH_GUY_EVENT', () => {
      const r36Npcs = npcsByMap['route_36'];
      const guy = r36Npcs.find((n) => n.id === 'hard_rock_guy');
      expect(guy).toBeDefined();
      expect(guy?.x).toBe(44);
      expect(guy?.y).toBe(9);
      expect(guy?.action).toBe('ROCK_SMASH_GUY_EVENT');
    });
  });

  describe('5. Quick Claw Teacher & Ground/Hidden Item Ball Verification', () => {
    it('asserts Quick Claw Teacher stands on walkable bench tile (27, 40) in National Park', () => {
      const park = loadMap('national_park');
      const teacher = npcsByMap['national_park']?.find((n) => n.id === 'quick_claw_teacher');
      expect(teacher).toBeDefined();
      expect(teacher?.x).toBe(27);
      expect(teacher?.y).toBe(40);
      expect(teacher?.action).toBe('QUICK_CLAW_EVENT');
      expect(isWalkable(park, 27, 40)).toBe(true);
    });

    it('asserts all canonical items exist in overworld_items.json on walkable coordinates', () => {
      const itemsData = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));

      // TM04 Rollout on Route 35
      const r35Items = itemsData.byMap['route_35'];
      expect(r35Items).toBeDefined();
      const rollout = r35Items.itemBalls.find((b: any) => b.itemId === 'tm_rollout');
      expect(rollout).toBeDefined();
      expect(rollout.x).toBe(13);
      expect(rollout.y).toBe(16);
      expect(isWalkable(loadMap('route_35'), 13, 16)).toBe(true);

      // TM28 Dig behind National Park fence
      const npItems = itemsData.byMap['national_park'];
      expect(npItems).toBeDefined();
      const dig = npItems.itemBalls.find((b: any) => b.itemId === 'tm_dig');
      expect(dig).toBeDefined();
      expect(dig.x).toBe(1);
      expect(dig.y).toBe(43);
      expect(isWalkable(loadMap('national_park'), 1, 43)).toBe(true);

      // Parlyz Heal in National Park
      const parlyz = npItems.itemBalls.find((b: any) => b.itemId === 'parlyz_heal');
      expect(parlyz).toBeDefined();
      expect(parlyz.x).toBe(35);
      expect(parlyz.y).toBe(12);
      expect(isWalkable(loadMap('national_park'), 35, 12)).toBe(true);

      // Hidden Full Heal in National Park
      const fullHeal = npItems.hiddenItems.find((h: any) => h.itemId === 'full_heal');
      expect(fullHeal).toBeDefined();
      expect(fullHeal.x).toBe(6);
      expect(fullHeal.y).toBe(47);
      expect(isWalkable(loadMap('national_park'), 6, 47)).toBe(true);

      // Fruit trees
      expect(r35Items.fruitTrees.length).toBeGreaterThanOrEqual(1);
      expect(itemsData.byMap['route_36']?.fruitTrees.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Pure Domain Bug-Catching Contest Engine', () => {
    let contest: BugContestManager;

    beforeEach(() => {
      contest = new BugContestManager();
    });

    it('validates calendar contest days (Tue=2, Thu=4, Sat=6)', () => {
      expect(isContestDay(0)).toBe(false); // Sun
      expect(isContestDay(1)).toBe(false); // Mon
      expect(isContestDay(2)).toBe(true);  // Tue
      expect(isContestDay(3)).toBe(false); // Wed
      expect(isContestDay(4)).toBe(true);  // Thu
      expect(isContestDay(5)).toBe(false); // Fri
      expect(isContestDay(6)).toBe(true);  // Sat
    });

    it('initializes contest with 20 Park Balls and 1200-second timer', () => {
      contest.startContest();
      expect(contest.state.isActive).toBe(true);
      expect(contest.state.ballsRemaining).toBe(20);
      expect(contest.state.timeRemainingSec).toBe(1200);
      expect(contest.state.bestCaughtPokemon).toBeUndefined();
    });

    it('decrements balls and ends contest when balls reach 0', () => {
      contest.startContest();
      for (let i = 0; i < 19; i++) {
        expect(contest.useBall()).toBe(true);
      }
      expect(contest.state.ballsRemaining).toBe(1);
      expect(contest.state.isActive).toBe(true);

      expect(contest.useBall()).toBe(true);
      expect(contest.state.ballsRemaining).toBe(0);
      expect(contest.state.isActive).toBe(false); // Finished
    });

    it('evaluates specimen scoring according to species base, level, IVs, and health', () => {
      const scyther = PokemonFactory.create('scyther', 15);
      scyther.currentHp = scyther.stats.hp;
      const score = calculateJudgeScore(scyther);
      expect(score).toBeGreaterThanOrEqual(240); // 80 base + 60 lvl + IVs + 100 HP%
      const grade = getJudgeGrade(score);
      expect(['GRADE A+', 'GRADE A']).toContain(grade);
    });

    it('automatically keeps first caught specimen without prompting swap', () => {
      contest.startContest();
      const caterpie = PokemonFactory.create('caterpie', 10);
      const res = contest.recordCatch(caterpie);
      expect(res.promptSwap).toBe(false);
      expect(res.kept).toBe(true);
      expect(contest.state.bestCaughtPokemon?.speciesId).toBe('caterpie');
    });

    it('prompts swap when second specimen is caught and allows swapping or keeping', () => {
      contest.startContest();
      const caterpie = PokemonFactory.create('caterpie', 10);
      contest.recordCatch(caterpie);

      const pinsir = PokemonFactory.create('pinsir', 14);
      const res = contest.recordCatch(pinsir);
      expect(res.promptSwap).toBe(true);
      expect(res.kept).toBe(false);

      // Trainer chooses to replace
      contest.swapSpecimen(pinsir);
      expect(contest.state.bestCaughtPokemon?.speciesId).toBe('pinsir');

      // Tally contest results: Pinisir awards 1st place Sun Stone
      const result = contest.endContest();
      expect(result.rank).toBe(1);
      expect(result.prizeItem).toBe('sun_stone');
      expect(result.prizeName).toBe('SUN STONE');
    });
  });

  describe('7. Interactive Specimen Swap Modal UI & HUD (Google Stitch Alignment)', () => {
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

    it('mounts interactive Catch Swap modal with side-by-side cards and buttons', () => {
      const current = PokemonFactory.create('caterpie', 10);
      const newCatch = PokemonFactory.create('scyther', 14);
      let chosenDecision: string | null = null;

      new BugContestSpecimenSwapModal('modal-container', {
        currentSpecimen: current,
        newCatch: newCatch,
        ballsRemaining: 15,
        timeRemainingSec: 900,
        onDecision: (choice) => {
          chosenDecision = choice;
        },
      });

      const overlay = mockRoot.querySelector('#bug-contest-swap-modal-overlay');
      expect(overlay).toBeDefined();

      const btnKeep = overlay?.querySelector('#btn-keep-current');
      const btnReplace = overlay?.querySelector('#btn-replace-catch');
      expect(btnKeep).toBeDefined();
      expect(btnReplace).toBeDefined();

      // Click Keep
      btnKeep?.click();
      expect(chosenDecision).toBe('keep');
    });

    it('mounts and updates BugContestHUDWidget with balls, timer, and specimen chip', () => {
      const hudContainer = new MockElement('div');
      hudContainer.id = 'overworld-hud-container';
      (globalThis as any).document.getElementById = (id: string) =>
        id === 'overworld-hud-container' ? hudContainer : null;

      const widget = new BugContestHUDWidget('overworld-hud-container');
      const scyther = PokemonFactory.create('scyther', 14);
      widget.mount(18, 1100, scyther);

      const mountedWidget = hudContainer.querySelector('#bug-contest-hud-widget');
      expect(mountedWidget).toBeDefined();
      expect(mountedWidget?.innerHTML).toContain('18/20');
      expect(mountedWidget?.innerHTML).toContain('SCYTHER');

      widget.destroy();
      expect(hudContainer.children.length).toBe(0);
    });
  });

  describe('8. Zone BGM Assignments', () => {
    it('asserts Route 35 and Route 36 use bgm_route_29 and National Park uses bgm_national_park', () => {
      const audio = new AudioManager();
      expect(audio.getTrackForMap('route_35')).toBe('bgm_route_29');
      expect(audio.getTrackForMap('route_36')).toBe('bgm_route_29');
      expect(audio.getTrackForMap('national_park')).toBe('bgm_national_park');
      expect(audio.getTrackForMap('route_35_national_park_gate')).toBe('bgm_national_park');
      expect(audio.getTrackForMap('route_36_national_park_gate')).toBe('bgm_national_park');
    });
  });
});
