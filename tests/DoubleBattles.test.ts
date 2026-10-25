import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleStateMachine } from '../src/battle/BattleStateMachine';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { StadiumArenaManager } from '../src/battle/StadiumArenaManager';
import { BattleHUD } from '../src/ui/BattleHUD';

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
  public classList = {
    add: (..._cls: string[]) => {},
    remove: (..._cls: string[]) => {},
    contains: (_cls: string) => false,
  };

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
        if (prop === 'cssText' && typeof val === 'string') {
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

  reset() {
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.elementsById.clear();
  }
}

describe('Double Battles (2v2) & Advanced Stadium Modes', () => {
  let doc: MockDocument;

  beforeEach(() => {
    doc = new MockDocument();
    (global as any).document = doc;
    const hudContainer = new MockElement('div');
    hudContainer.id = 'battle-hud-container';
    doc.body.appendChild(hudContainer);
    doc.register(hudContainer);
  });

  it('sorts 4 combatants by priority and speed in executeDoubleRound and redirects when primary target faints', () => {
    const allyLead = PokemonFactory.create('typhlosion', 40, ['quickattack', 'flamewheel']);
    const allyPartner = PokemonFactory.create('feraligatr', 40, ['slash', 'bite']);
    const foeLead = PokemonFactory.create('pidgey', 10, ['tackle']);
    const foePartner = PokemonFactory.create('rattata', 15, ['tackle']);

    // Make foeLead at 1 HP so allyLead's priority Quick Attack KOs foeLead immediately
    foeLead.currentHp = 1;

    const sm = new BattleStateMachine(allyLead, foeLead, false, {
      isDoubleBattle: true,
      playerPartner: allyPartner,
      enemyPartner: foePartner,
    });

    // Both allyLead (Quick Attack, priority +1) and allyPartner (Slash) target foe slot 0 (foeLead)
    const result = sm.executeDoubleRound(
      { type: 'FIGHT', moveId: 'quickattack', targetSlot: 0 },
      { type: 'FIGHT', moveId: 'slash', targetSlot: 0 }
    );

    // Quick Attack faints foeLead first, then allyPartner's Slash automatically redirects to foePartner (slot 1)!
    expect(foeLead.currentHp).toBe(0);
    expect(foePartner.currentHp).toBeLessThan(foePartner.stats.hp);
    const damageEvents = result.events.filter((e) => e.type === 'DAMAGE');
    expect(damageEvents.some((e) => e.type === 'DAMAGE' && e.targetId === foeLead.uid)).toBe(true);
    expect(damageEvents.some((e) => e.type === 'DAMAGE' && e.targetId === foePartner.uid)).toBe(true);
  });

  it('applies 0.75x spread move damage across both opposing targets for Surf / Earthquake / Razor Leaf', () => {
    const surfer = PokemonFactory.create('feraligatr', 35, ['surf', 'watergun']);
    const allyPartner = PokemonFactory.create('meganium', 35, ['synthesis']);
    const foe1 = PokemonFactory.create('sandslash', 30, ['growl']);
    const foe2 = PokemonFactory.create('graveler', 30, ['growl']);

    const sm = new BattleStateMachine(surfer, foe1, false, {
      isDoubleBattle: true,
      playerPartner: allyPartner,
      enemyPartner: foe2,
    });

    const result = sm.executeDoubleRound(
      { type: 'FIGHT', moveId: 'surf', targetSlot: 0 },
      { type: 'FIGHT', moveId: 'synthesis', targetSlot: 0 }
    );

    const damageToFoe1 = result.events.find((e) => e.type === 'DAMAGE' && e.targetId === foe1.uid);
    const damageToFoe2 = result.events.find((e) => e.type === 'DAMAGE' && e.targetId === foe2.uid);
    expect(damageToFoe1).toBeDefined();
    expect(damageToFoe2).toBeDefined();
  });

  it('enforces Stadium Rules: Level Cap scaling, Item Clause deduplication, and Weather Clash multipliers', () => {
    const arena = new StadiumArenaManager();

    const p1 = PokemonFactory.create('typhlosion', 50, ['flamewheel']);
    p1.heldItem = 'leftovers';
    const p2 = PokemonFactory.create('feraligatr', 45, ['surf']);
    p2.heldItem = 'leftovers'; // Duplicate held item!

    const sanitized = arena.preparePartyForRules([p1, p2], {
      levelCap: 30,
      itemClause: true,
      weather: 'RAIN',
    });

    expect(sanitized[0].level).toBe(30);
    expect(sanitized[1].level).toBe(30);
    expect(sanitized[0].heldItem).toBe('leftovers');
    expect(sanitized[1].heldItem).toBeUndefined(); // Stripped by Item Clause!

    // Verify Weather multipliers in BattleStateMachine
    const foe = PokemonFactory.create('meganium', 30, ['tackle']);
    const rainSM = new BattleStateMachine(sanitized[0], foe, false, {
      isDoubleBattle: false,
      stadiumRules: { weather: 'RAIN', itemClause: true, levelCap: 30 },
    });

    expect(rainSM.getWeatherDamageMultiplier('Water')).toBe(1.5);
    expect(rainSM.getWeatherDamageMultiplier('Fire')).toBe(0.5);
  });

  it('renders 2v2 Partner & Secondary Foe cards and queues dual ally moves in BattleHUD', () => {
    const hud = new BattleHUD('battle-hud-container');
    const ally1 = PokemonFactory.create('cyndaquil', 20, ['ember', 'quickattack']);
    const ally2 = PokemonFactory.create('totodile', 20, ['watergun', 'bite']);
    const foe1 = PokemonFactory.create('pidgeotto', 22, ['gust']);
    const foe2 = PokemonFactory.create('scyther', 22, ['slash']);

    const onDoubleMovesSelected = vi.fn();

    hud.initBattle(
      ally1,
      foe1,
      {
        onMoveSelected: vi.fn(),
        onDoubleMovesSelected,
        onPokemonSelected: vi.fn(),
        onBagSelected: vi.fn(),
        onItemUsed: vi.fn(),
        onRunSelected: vi.fn(),
        onSpeedToggle: () => 1,
      },
      { 'poke-ball': 5 },
      [ally1, ally2]
    );

    hud.setDoubleBattlePeers(ally2, foe2, {
      cupId: 'prime_double_cup',
      cupName: '⚡ PRIME TAG CUP (2v2 DOUBLES)',
      isDoubleBattle: true,
      weather: 'RAIN',
    });

    const enemyPartnerCard = doc.getElementById('enemy-partner-card');
    const playerPartnerCard = doc.getElementById('player-partner-card');
    const stadiumBadge = doc.getElementById('battle-stadium-badge');

    expect(enemyPartnerCard?.style.display).toBe('block');
    expect(playerPartnerCard?.style.display).toBe('block');
    expect(stadiumBadge?.innerText).toContain('PRIME TAG CUP');

    // Open Fight menu in 2v2 mode: queues Ally 1 move, then Ally 2 move, then fires onDoubleMovesSelected
    const fightBtn = doc.getElementById('btn-fight');
    fightBtn?.click();

    const targetBar = doc.getElementById('double-battle-target-bar');
    expect(targetBar?.style.display).toBe('flex');

    // Select Target Foe #2 (slot 1) for Ally 1 and click Move 0 ('ember')
    const targetFoe1Btn = doc.getElementById('target-foe-1-btn');
    targetFoe1Btn?.click();
    const move0Btn = doc.getElementById('move-btn-0');
    move0Btn?.click();

    // Now Ally 2 is prompted; select Move 0 ('watergun')
    const ally2Move0Btn = doc.getElementById('move-btn-0');
    ally2Move0Btn?.click();

    expect(onDoubleMovesSelected).toHaveBeenCalledWith('ember', 'watergun', 1, 1);
  });
});
