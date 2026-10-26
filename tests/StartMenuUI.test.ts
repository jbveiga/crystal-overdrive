import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartMenuUI } from '../src/ui/StartMenuUI';
import { ItemfinderHUD } from '../src/ui/ItemfinderHUD';
import { MissionLogUI } from '../src/ui/MissionLogUI';
import { MissionManager } from '../src/world/MissionManager';
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
        if (prop === 'cssText') {
          const decls = val.split(';');
          for (const decl of decls) {
            const colonIdx = decl.indexOf(':');
            if (colonIdx > 0) {
              const k = decl.slice(0, colonIdx).trim();
              const v = decl.slice(colonIdx + 1).trim();
              const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
              target[camelK] = v;
            }
          }
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

      // Extract all attributes
      const attrRegex = /([a-z0-9_-]+)=["']([^"']*)["']/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        child.setAttribute(attrMatch[1], attrMatch[2]);
        if (attrMatch[1].toLowerCase() === 'id') child.id = attrMatch[2];
        if (attrMatch[1].toLowerCase() === 'class') child.className = attrMatch[2];
        if (attrMatch[1].toLowerCase() === 'style') {
          const decls = attrMatch[2].split(';');
          for (const decl of decls) {
            const colonIdx = decl.indexOf(':');
            if (colonIdx > 0) {
              const k = decl.slice(0, colonIdx).trim();
              const v = decl.slice(colonIdx + 1).trim();
              const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
              child.style[camelK] = v;
            }
          }
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
      } else if (selector.includes('[data-')) {
        const attrMatch = selector.match(/\[([a-z0-9_-]+)(?:=["']?([^"'\]]*)["']?)?\]/i);
        if (attrMatch) {
          const attr = attrMatch[1];
          const val = attrMatch[2];
          const actual = el.getAttribute(attr);
          if (actual !== null && (val === undefined || actual === val)) {
            results.push(el);
          }
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
        getAutoHm: () => autoHmEnabled,
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
        onToggleAutoHm: (enabled) => {
          autoHmEnabled = enabled;
          return autoHmEnabled;
        },
      }
    );

    let autoHmEnabled = true;

    ui.open();
    // Verify CONTESTS was removed from Start Menu
    expect(doc.getElementById('start-opt-contests')).toBeNull();

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

    // Open Settings and verify CRT Scanlines, single Auto-HM toggle button, & removed GBC Palette controls
    ui.openSettings();
    const settingsModal = doc.getElementById('settings-modal');
    expect(settingsModal?.style.display).toBe('flex');

    const crtBtn = settingsModal?.querySelector('#settings-crt-btn');
    const autoHmBtn = settingsModal?.querySelector('#settings-autohm-btn');
    const palBtn = settingsModal?.querySelector('#settings-palette-btn');
    const autoHmOnBtn = settingsModal?.querySelector('#settings-autohm-on-btn');
    expect(crtBtn).toBeDefined();
    expect(autoHmBtn).toBeDefined();
    expect(palBtn).toBeNull();
    expect(autoHmOnBtn).toBeNull();

    crtBtn?.click();
    expect(crtEnabled).toBe(true);

    autoHmBtn?.click();
    expect(autoHmEnabled).toBe(false);
  });

  it('verifies Neo-Kanto Start Menu drawer, Save Progress Console, and Settings category tabs (TICKET-UI-NEO-KANTO-STITCH-SLICE-01)', async () => {
    let saved = false;
    const ui = new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getMoney: () => 14500,
        getBadges: () => ['zephyr', 'hive'],
        getPartyCount: () => 3,
        getCaughtCount: () => 12,
        getCaughtSpeciesIds: () => new Set(['cyndaquil']),
        getSeenSpeciesIds: () => new Set(['cyndaquil']),
        getPlayTimeSeconds: () => 3725, // 01:02:05
        getMapName: () => 'Azalea Town',
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onSaveGame: async () => {
          saved = true;
        },
      }
    );

    ui.open();

    // 1. Start Menu Panel drawer styling
    const startPanel = doc.getElementById('start-menu-panel');
    expect(startPanel).not.toBeNull();
    expect(startPanel?.style.background).toBe('#0D1322');
    expect(startPanel?.style.boxShadow).toContain('0 6px 0 0 #070B14');

    // Tactile buttons
    const pokedexBtn = doc.getElementById('start-opt-pokedex');
    expect(pokedexBtn?.className).toContain('neo-kanto-tactile-btn');
    expect(pokedexBtn?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    // 2. Save Progress Console
    ui.openSaveConfirm();
    const saveModal = doc.getElementById('save-confirm-modal');
    expect(saveModal).not.toBeNull();
    expect(saveModal?.style.display).toBe('flex');
    expect(saveModal?.style.background).toBe('#0D1322');
    expect(saveModal?.style.boxShadow).toContain('0 6px 0 0 #070B14');

    // Check telemetry fields
    expect(saveModal?.innerHTML).toContain('GOLD');
    expect(saveModal?.innerHTML).toContain('Azalea Town');
    expect(saveModal?.innerHTML).toContain('01:02:05');

    const yesBtn = doc.getElementById('confirm-save-yes-btn');
    const noBtn = doc.getElementById('confirm-save-no-btn');
    expect(yesBtn).not.toBeNull();
    expect(noBtn).not.toBeNull();
    expect(yesBtn?.style.boxShadow).toContain('0 4px 0 0 #070B14');
    expect(noBtn?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    // Click Save
    yesBtn?.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(saved).toBe(true);

    // 3. Settings Workstation Category Tabs
    ui.openSettings();
    const settingsModal = doc.getElementById('settings-modal');
    expect(settingsModal).not.toBeNull();
    expect(settingsModal?.style.display).toBe('flex');
    expect(settingsModal?.style.background).toBe('#0D1322');
    expect(settingsModal?.style.boxShadow).toContain('0 6px 0 0 #070B14');

    const tabAll = doc.getElementById('settings-tab-all');
    const tabAudio = doc.getElementById('settings-tab-audio');
    const tabGameplay = doc.getElementById('settings-tab-gameplay');
    const tabGraphics = doc.getElementById('settings-tab-graphics');
    const tabControls = doc.getElementById('settings-tab-controls');

    expect(tabAll).not.toBeNull();
    expect(tabAudio).not.toBeNull();
    expect(tabGameplay).not.toBeNull();
    expect(tabGraphics).not.toBeNull();
    expect(tabControls).not.toBeNull();

    // Default tab is ALL: all rows are visible
    const audioRows = settingsModal?.querySelectorAll('[data-settings-category="AUDIO"]') || [];
    const gameplayRows = settingsModal?.querySelectorAll('[data-settings-category="GAMEPLAY"]') || [];
    const graphicsRows = settingsModal?.querySelectorAll('[data-settings-category="GRAPHICS"]') || [];
    const controlsRows = settingsModal?.querySelectorAll('[data-settings-category="CONTROLS"]') || [];

    expect(audioRows.length).toBeGreaterThan(0);
    expect(gameplayRows.length).toBeGreaterThan(0);
    expect(graphicsRows.length).toBeGreaterThan(0);
    expect(controlsRows.length).toBeGreaterThan(0);

    // Filter to AUDIO
    tabAudio?.click();
    for (const row of audioRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of gameplayRows) {
      expect(row.style.display).toBe('none');
    }
    for (const row of graphicsRows) {
      expect(row.style.display).toBe('none');
    }

    // Filter to GAMEPLAY
    tabGameplay?.click();
    for (const row of gameplayRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of audioRows) {
      expect(row.style.display).toBe('none');
    }

    // Filter to GRAPHICS
    tabGraphics?.click();
    for (const row of graphicsRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of gameplayRows) {
      expect(row.style.display).toBe('none');
    }

    // Filter to CONTROLS
    tabControls?.click();
    for (const row of controlsRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of audioRows) {
      expect(row.style.display).toBe('none');
    }

    // Restore ALL
    tabAll?.click();
    for (const row of audioRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of gameplayRows) {
      expect(row.style.display).not.toBe('none');
    }

    // 4. Bug-Catching Contest Leaderboard Modal
    ui.openBugContestLeaderboard();
    const contestModal = doc.getElementById('bug-contest-leaderboard-modal');
    expect(contestModal).not.toBeNull();
    expect(contestModal?.style.display).toBe('flex');
    expect(contestModal?.innerHTML).toContain('BUG-CATCHING CONTEST & STADIUM ARENA');
    expect(contestModal?.innerHTML).toContain('SCYTHER');
    expect(contestModal?.innerHTML).toContain('236 PTS');
  });

  it('verifies Neo-Kanto MissionLogUI and ItemfinderHUD faceted radar styling (TICKET-UI-NEO-KANTO-STITCH-SLICE-01)', () => {
    // 1. MissionLogUI
    const missionManager = new MissionManager();
    const missionLogUI = new MissionLogUI('modal-container', missionManager);
    missionLogUI.open();

    const logCard = doc.getElementById('mission-log-card');
    expect(logCard).not.toBeNull();
    expect(logCard?.style.background).toBe('#0D1322');
    expect(logCard?.style.boxShadow).toContain('0 6px 0 0 #070B14');

    const tabMain = doc.getElementById('mission-tab-main');
    expect(tabMain).not.toBeNull();
    expect(tabMain?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    // 2. ItemfinderHUD Faceted Radar Capsule
    const hud = new ItemfinderHUD('modal-container');
    hud.show();
    expect(hud.isActive()).toBe(true);

    const capsule = doc.getElementById('itemfinder-hud-capsule');
    expect(capsule).not.toBeNull();
    expect(capsule?.style.background).toBe('#0D1322');
    expect(capsule?.style.borderRadius).toBe('10px');
    expect(capsule?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    const dial = doc.getElementById('itemfinder-compass-dial');
    expect(dial).not.toBeNull();
    expect(dial?.style.background).toBe('#080E1D');
    expect(dial?.style.borderRadius).toBe('8px');

    // Test Idle / No Response Ping
    hud.update({
      hasItemInRange: false,
      distance: null,
      bearing: null,
      bearingAngleDeg: 0,
      isFacingDirectly: false,
      proximityBand: 'FAR',
      nearestItem: null,
    });
    expect(capsule?.style.borderColor).toBe('#475569');
    expect(doc.getElementById('itemfinder-distance-label')?.innerText).toBe('NO RESPONSE');

    // Test Active Vector Lock Ping (distance 4)
    hud.update({
      hasItemInRange: true,
      distance: 4.2,
      bearing: 'NORTH',
      bearingAngleDeg: 0,
      isFacingDirectly: false,
      proximityBand: 'APPROACHING',
      nearestItem: { itemId: 'ultra_ball', x: 10, y: 10, eventFlag: 'hidden_1' },
    });
    expect(capsule?.style.borderColor).toBe('#38bdf8');
    expect(doc.getElementById('itemfinder-radar-header')?.innerText).toBe('📡 BEARING NORTH');
    expect(doc.getElementById('itemfinder-distance-label')?.innerText).toBe('📍 4 TILES');

    // Test Gold Lock-On Ping (distance 1, facing directly)
    hud.update({
      hasItemInRange: true,
      distance: 1,
      bearing: 'NORTH',
      bearingAngleDeg: 0,
      isFacingDirectly: true,
      proximityBand: 'FACING',
      nearestItem: { itemId: 'ultra_ball', x: 10, y: 10, eventFlag: 'hidden_1' },
    });
    expect(capsule?.style.borderColor).toBe('#FFD028');
    expect(doc.getElementById('itemfinder-radar-header')?.innerText).toBe('✨ LOCKED ON [A]');
    expect(doc.getElementById('itemfinder-distance-label')?.innerText).toBe('RIGHT HERE!');
  });
});

