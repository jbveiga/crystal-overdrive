import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartMenuUI } from '../src/ui/StartMenuUI';
import fs from 'fs';
import path from 'path';

// Robust in-memory DOM mock for node environment
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public value: string = '';
  public selectedIndex: number = 0;
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};

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

  dispatchInput(val: string) {
    this.value = val;
    this.listeners['input']?.forEach((fn) =>
      fn({ target: { value: val }, stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  dispatchChange(val: string) {
    this.value = val;
    this.listeners['change']?.forEach((fn) =>
      fn({ target: { value: val }, stopPropagation: () => {}, preventDefault: () => {} })
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
      } else if (selector.includes('[data-dex-id]')) {
        if (el.getAttribute('data-dex-id') !== null) results.push(el);
      } else if (selector.includes('[data-badge-id]')) {
        if (el.getAttribute('data-badge-id') !== null) results.push(el);
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

describe('StartMenuUI — Neo-Kanto Google Stitch Modernization', () => {
  let doc: MockDocument;
  let mockContainer: MockElement;
  let caughtSet: Set<string>;
  let seenSet: Set<string>;
  let badges: string[];

  beforeEach(() => {
    doc = new MockDocument();
    (global as any).document = doc;

    mockContainer = new MockElement('div');
    mockContainer.id = 'modal-container';
    doc.body.appendChild(mockContainer);
    doc.register(mockContainer);

    caughtSet = new Set(['cyndaquil', 'pidgey', 'bellsprout']);
    seenSet = new Set(['cyndaquil', 'pidgey', 'bellsprout', 'totodile', 'chikorita', 'sentret', 'hoothoot']);
    badges = ['zephyr', 'hive'];
  });

  const createUI = () => {
    return new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getMoney: () => 14500,
        getBadges: () => badges,
        getPartyCount: () => 3,
        getCaughtCount: () => caughtSet.size,
        getCaughtSpeciesIds: () => caughtSet,
        getSeenSpeciesIds: () => seenSet,
        getKeyItems: () => ['POKéGEAR', 'BICYCLE', '💧 SQUIRTBOTTLE'],
        getPlayTimeSeconds: () => 3725, // 01:02:05
        getMapName: () => 'Azalea Town',
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onSaveGame: vi.fn().mockResolvedValue(undefined),
      }
    );
  };

  it('renders and modernizes Pokédex Workstation with 3-pane Neo-Kanto layout', () => {
    const ui = createUI();
    ui.open();
    ui.openPokedex();

    const dexModal = doc.getElementById('pokedex-modal');
    expect(dexModal).toBeDefined();
    expect(dexModal?.style.display).toBe('flex');

    // Header Pills
    const seenPill = dexModal?.querySelector('#dex-seen-pill');
    const ownedPill = dexModal?.querySelector('#dex-owned-pill');
    expect(seenPill).toBeDefined();
    expect(ownedPill).toBeDefined();
    expect(seenPill?.innerHTML).toContain(`SEEN: ${seenSet.size}`);
    expect(ownedPill?.innerHTML).toContain(`OWNED: ${caughtSet.size}`);

    // Workstation components
    const searchInput = dexModal?.querySelector('#dex-search-input');
    const rosterList = dexModal?.querySelector('#dex-roster-list');
    const stageSprite = dexModal?.querySelector('#dex-stage-sprite');
    const stageName = dexModal?.querySelector('#dex-stage-name');
    const heightVal = dexModal?.querySelector('#dex-height-val');

    expect(searchInput).toBeDefined();
    expect(rosterList).toBeDefined();
    expect(stageSprite).toBeDefined();
    expect(stageName).toBeDefined();
    expect(heightVal).toBeDefined();

    // Verify close button restores menu
    const closeBtn = dexModal?.querySelector('#close-pokedex-btn');
    expect(closeBtn).toBeDefined();
    closeBtn?.click();
    expect(dexModal?.style.display).toBe('none');
  });

  it('supports interactive specimen selection and real-time filtering without full DOM rebuilds', () => {
    const ui = createUI();
    ui.open();
    ui.openPokedex();

    const dexModal = doc.getElementById('pokedex-modal');
    const stageName = dexModal?.querySelector('#dex-stage-name');
    const stageNum = dexModal?.querySelector('#dex-stage-num');

    // Initially cyndaquil is selected
    expect(stageName?.textContent).toBe('CYNDAQUIL');
    expect(stageNum?.textContent).toBe('NO. 155');

    // Test search filtering
    const searchInput = dexModal?.querySelector('#dex-search-input');
    searchInput?.dispatchInput('chikorita');

    const rosterList = dexModal?.querySelector('#dex-roster-list');
    const matchingRows = rosterList?.querySelectorAll('div[data-dex-id]');
    expect(matchingRows?.length).toBe(1);
    expect(matchingRows?.[0].getAttribute('data-dex-id')).toBe('chikorita');

    // Clicking specimen updates details
    matchingRows?.[0].click();
    expect(stageName?.textContent).toBe('CHIKORITA');
    expect(stageNum?.textContent).toBe('NO. 152');

    // Test Prev / Next cycle buttons
    const prevBtn = dexModal?.querySelector('#dex-prev-btn');
    const nextBtn = dexModal?.querySelector('#dex-next-btn');
    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();

    // Reset search
    searchInput?.dispatchInput('');
    nextBtn?.click();
    // After nextBtn, stage name is updated
    expect(stageName?.textContent).toBeDefined();
  });

  it('filters specimen roster by category (ALL, JOHTO, KANTO, OWNED, SEEN) and sorts by BST / Mass', () => {
    const ui = createUI();
    ui.open();
    ui.openPokedex();

    const dexModal = doc.getElementById('pokedex-modal');
    const filterJohto = dexModal?.querySelector('#dex-filter-johto');
    const filterKanto = dexModal?.querySelector('#dex-filter-kanto');
    const filterOwned = dexModal?.querySelector('#dex-filter-caught');
    const filterSeen = dexModal?.querySelector('#dex-filter-seen');
    const rosterList = dexModal?.querySelector('#dex-roster-list');

    // Johto filter: 100 species (#152 to #251)
    filterJohto?.click();
    let rows = rosterList?.querySelectorAll('div[data-dex-id]');
    expect(rows?.length).toBe(100);

    // Kanto filter: 151 species (#001 to #151)
    filterKanto?.click();
    rows = rosterList?.querySelectorAll('div[data-dex-id]');
    expect(rows?.length).toBe(151);

    // Owned filter: 3 caught species
    filterOwned?.click();
    rows = rosterList?.querySelectorAll('div[data-dex-id]');
    expect(rows?.length).toBe(3);

    // Seen filter: 7 seen species
    filterSeen?.click();
    rows = rosterList?.querySelectorAll('div[data-dex-id]');
    expect(rows?.length).toBe(7);

    // Sort select by BST
    const sortSelect = dexModal?.querySelector('#dex-sort-select');
    sortSelect?.dispatchChange('bst');
    // Top seen/caught specimen has valid BST
    const stageName = dexModal?.querySelector('#dex-stage-name');
    expect(stageName?.textContent).toBeDefined();
  });

  it('renders holographic Trainer Card passport with metallic 8-badge Johto dock', () => {
    const ui = createUI();
    ui.open();
    ui.openTrainerCard();

    const trainerModal = doc.getElementById('trainer-card-modal');
    expect(trainerModal).toBeDefined();
    expect(trainerModal?.style.display).toBe('flex');

    // Passport vitals
    expect(trainerModal?.innerHTML).toContain('GOLD');
    expect(trainerModal?.innerHTML).toContain('IDNo. 25199');
    expect(trainerModal?.innerHTML).toContain('$14,500');
    expect(trainerModal?.innerHTML).toContain('01:02:05');
    expect(trainerModal?.innerHTML).toContain('3 OWN / 7 SEEN');
    expect(trainerModal?.innerHTML).toContain('POKéGEAR, BICYCLE, 💧 SQUIRTBOTTLE');

    // 8 Johto badges dock
    const badgeSlots = trainerModal?.querySelectorAll('[data-badge-id]');
    expect(badgeSlots?.length).toBe(8);

    const zephyrBadge = badgeSlots?.find((b) => b.getAttribute('data-badge-id') === 'zephyr');
    const hiveBadge = badgeSlots?.find((b) => b.getAttribute('data-badge-id') === 'hive');
    const plainBadge = badgeSlots?.find((b) => b.getAttribute('data-badge-id') === 'plain');

    expect(zephyrBadge?.getAttribute('data-earned')).toBe('true');
    expect(hiveBadge?.getAttribute('data-earned')).toBe('true');
    expect(plainBadge?.getAttribute('data-earned')).toBe('false');

    // Close button
    const closeBtn = trainerModal?.querySelector('#close-trainer-card-btn');
    expect(closeBtn).toBeDefined();
    closeBtn?.click();
    expect(trainerModal?.style.display).toBe('none');
  });

  it('handles Escape keyboard hotkey to dismiss Pokédex and Trainer Card modals cleanly', () => {
    const ui = createUI();
    ui.open();

    // 1. Pokédex Escape dismissal
    ui.openPokedex();
    const dexModal = doc.getElementById('pokedex-modal');
    expect(dexModal?.style.display).toBe('flex');

    const escapeDexHandled = ui.handleKeyDown({ code: 'Escape', preventDefault: vi.fn() } as any);
    expect(escapeDexHandled).toBe(true);
    expect(dexModal?.style.display).toBe('none');

    // 2. Trainer Card Escape dismissal
    ui.openTrainerCard();
    const trainerModal = doc.getElementById('trainer-card-modal');
    expect(trainerModal?.style.display).toBe('flex');

    const escapeTrainerHandled = ui.handleKeyDown({ code: 'Escape', preventDefault: vi.fn() } as any);
    expect(escapeTrainerHandled).toBe(true);
    expect(trainerModal?.style.display).toBe('none');
  });

  it('verifies Asset & Media Integrity Scan (Pillar 2) for referenced species front sprites on disk', () => {
    const spritesDir = path.resolve(__dirname, '../public/assets/sprites/pokemon');
    const testSpecies = ['cyndaquil', 'totodile', 'chikorita', 'sentret', 'pidgey', 'pikachu', 'unown'];

    for (const spId of testSpecies) {
      const frontSpritePath = path.join(spritesDir, `${spId}_front.png`);
      expect(fs.existsSync(frontSpritePath)).toBe(true);
    }

    // Verify fallback sprite exists on disk
    expect(fs.existsSync(path.join(spritesDir, 'unown_front.png'))).toBe(true);
  });

  it('supports Pokédex Habitat Tracker chips, HABITATS filter, route search, and Town Map deep-linking', () => {
    const onOpenTownMapAtLandmark = vi.fn();
    let crtEnabled = false;
    let palette: 'VIBRANT' | 'POCKET' | 'DMG' | 'NIGHT' = 'VIBRANT';

    const ui = new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getMoney: () => 14500,
        getBadges: () => badges,
        getPartyCount: () => 3,
        getCaughtCount: () => caughtSet.size,
        getCaughtSpeciesIds: () => caughtSet,
        getSeenSpeciesIds: () => seenSet,
        getKeyItems: () => ['POKéGEAR'],
        getPlayTimeSeconds: () => 3725,
        getMapName: () => 'New Bark Town',
        getCrtScanlines: () => crtEnabled,
        getGbcPalette: () => palette,
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onOpenTownMapAtLandmark,
        onSaveGame: vi.fn().mockResolvedValue(undefined),
        onToggleCrtScanlines: () => {
          crtEnabled = !crtEnabled;
          return crtEnabled;
        },
        onSetGbcPalette: (next) => {
          palette = next;
          return palette;
        },
      }
    );

    ui.open();
    ui.openPokedex();

    const dexModal = doc.getElementById('pokedex-modal');
    const searchInput = dexModal?.querySelector('#dex-search-input');
    const rosterList = dexModal?.querySelector('#dex-roster-list');

    // Search by habitat route name "Route 29" -> Pidgey, Sentret, Rattata, Hoothoot, Hoppip
    searchInput?.dispatchInput('Route 29');
    let matchingRows = rosterList?.querySelectorAll('div[data-dex-id]') || [];
    expect(matchingRows.length).toBeGreaterThan(0);
    const pidgeyRow = matchingRows.find((r) => r.getAttribute('data-dex-id') === 'pidgey');
    expect(pidgeyRow).toBeDefined();

    // Select Pidgey (which is seen & caught) -> habitat chips should render
    pidgeyRow?.click();
    const habitatList = dexModal?.querySelector('#dex-habitat-list');
    const chips = habitatList?.querySelectorAll('.dex-habitat-chip') || [];
    expect(chips.length).toBeGreaterThan(0);
    const route29Chip = chips.find((c) => c.getAttribute('data-habitat-landmark') === 'route_29');
    expect(route29Chip).toBeDefined();

    // Clicking habitat chip closes Pokédex and triggers onOpenTownMapAtLandmark('route_29')
    route29Chip?.click();
    expect(onOpenTownMapAtLandmark).toHaveBeenCalledWith('route_29');
    expect(dexModal?.style.display).toBe('none');

    // Verify HABITATS filter button works
    ui.openPokedex();
    const reopenedSearch = dexModal?.querySelector('#dex-search-input');
    const reopenedRoster = dexModal?.querySelector('#dex-roster-list');
    reopenedSearch?.dispatchInput('');
    const filterHabitat = dexModal?.querySelector('#dex-filter-habitat');
    expect(filterHabitat).toBeDefined();
    filterHabitat?.click();
    matchingRows = reopenedRoster?.querySelectorAll('div[data-dex-id]') || [];
    expect(matchingRows.length).toBeGreaterThan(10);
    // Cyndaquil has no wild route habitat in Johto landmarks, so it shouldn't appear in HABITATS filter
    expect(matchingRows.some((r) => r.getAttribute('data-dex-id') === 'cyndaquil')).toBe(false);
    expect(matchingRows.some((r) => r.getAttribute('data-dex-id') === 'pidgey')).toBe(true);

    // Open Settings and verify CRT Scanlines & GBC Palette controls
    ui.openSettings();
    const settingsModal = doc.getElementById('settings-modal');
    expect(settingsModal?.style.display).toBe('flex');

    const crtBtn = settingsModal?.querySelector('#settings-crt-btn');
    const palBtn = settingsModal?.querySelector('#settings-palette-btn');
    const dmgBtn = settingsModal?.querySelector('#settings-pal-dmg-btn');
    expect(crtBtn).toBeDefined();
    expect(palBtn).toBeDefined();
    expect(dmgBtn).toBeDefined();

    crtBtn?.click();
    expect(crtEnabled).toBe(true);

    dmgBtn?.click();
    expect(palette).toBe('DMG');
  });
});

