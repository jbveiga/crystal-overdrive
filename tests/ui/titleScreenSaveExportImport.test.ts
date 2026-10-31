import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitleScreenUI } from '../../src/ui/TitleScreenUI';
import { SaveManager } from '../../src/core/SaveManager';
import type { SavePreview } from '../../src/types/game';

// Lightweight in-memory DOM mock for node testing
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public value: string = '';
  public files: any[] = [];
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
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

      const child = new MockElement(tag);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (styleMatch) child.style.cssText = styleMatch[1];
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
  public head = new MockElement('head');
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
    this.head = new MockElement('head');
    this.elementsById.clear();
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = {
  addEventListener: (_evt: string, _fn: Function) => {},
  removeEventListener: (_evt: string, _fn: Function) => {},
};

const MOCK_PREVIEW: SavePreview = {
  playerName: 'GOLD',
  gender: 'BOY',
  badgeCount: 4,
  pokedexCount: 25,
  playTimeFormatted: '05:30',
  currentLocationName: 'Goldenrod City',
  partyLeadSpeciesId: 'totodile',
  partyLeadLevel: 22,
  timestamp: 1700000000000,
};

describe('Issue #59 — Title Screen Save Data Management (Export / Import)', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  it('renders SAVE DATA card in title menu and opens save modal on selection', async () => {
    const ui = new TitleScreenUI('modal-container', MOCK_PREVIEW);
    await ui.unlockGate();

    const menuEl = mockDoc.getElementById('title-main-menu')!;
    expect(menuEl.innerHTML).toContain('SAVE DATA');
    expect(menuEl.innerHTML).toContain('Import / Export Cross-Device Save');

    // Move cursor to SAVE_DATA (index 3)
    ui.moveCursor(1); // 0 -> 1 (NEW_GAME)
    ui.moveCursor(1); // 1 -> 2 (OPTIONS)
    ui.moveCursor(1); // 2 -> 3 (SAVE_DATA)
    expect(ui.getFocusedOption()).toBe('SAVE_DATA');
    expect(ui.isSaveModalOpen()).toBe(false);

    // Confirm opens modal
    await ui.confirmSelection();
    expect(ui.isSaveModalOpen()).toBe(true);

    const modalEl = mockDoc.getElementById('title-save-modal')!;
    expect(modalEl.style.display).toBe('flex');
    expect(modalEl.innerHTML).toContain('SAVE DATA MANAGEMENT');
    expect(modalEl.innerHTML).toContain('EXPORT SAVE FILE');
    expect(modalEl.innerHTML).toContain('IMPORT SAVE FILE');

    // Esc / cancel closes modal
    ui.cancelModal();
    expect(ui.isSaveModalOpen()).toBe(false);
  });

  it('exports save JSON, displays in textarea, and shows success feedback', async () => {
    const onExportSave = vi.fn().mockResolvedValue('{"player":{"name":"GOLD"},"party":[]}');
    const ui = new TitleScreenUI('modal-container', MOCK_PREVIEW, undefined, {
      onContinue: vi.fn(),
      onNewGame: vi.fn(),
      onExportSave,
    });
    await ui.unlockGate();
    ui.openSaveModal();

    const modalEl = mockDoc.getElementById('title-save-modal')!;
    const exportBtn = modalEl.querySelector('#title-export-save-btn') as any;
    expect(exportBtn).not.toBeNull();

    await exportBtn.listeners['click'][0]({ stopPropagation: () => {} });
    expect(onExportSave).toHaveBeenCalledTimes(1);

    const exportTextarea = modalEl.querySelector('#title-save-export-textarea') as any;
    expect(exportTextarea.value).toBe('{"player":{"name":"GOLD"},"party":[]}');

    const statusMsg = modalEl.querySelector('#title-save-status-msg') as any;
    expect(statusMsg.textContent).toContain('Save exported!');
  });

  it('imports valid save, updates preview, and enables CONTINUE option', async () => {
    const onImportSave = vi.fn().mockImplementation(async (raw: string) => {
      return raw.includes('KRIS');
    });

    const ui = new TitleScreenUI('modal-container', null, undefined, {
      onContinue: vi.fn(),
      onNewGame: vi.fn(),
      onImportSave,
    });
    await ui.unlockGate();
    expect(ui.hasSave()).toBe(false);
    expect(ui.getFocusedOption()).toBe('NEW_GAME');

    ui.openSaveModal();
    const modalEl = mockDoc.getElementById('title-save-modal')!;
    const importTextarea = modalEl.querySelector('#title-save-import-textarea') as any;
    const confirmImportBtn = modalEl.querySelector('#title-confirm-import-btn') as any;

    // 1. Empty import attempt shows warning
    await confirmImportBtn.listeners['click'][0]({ stopPropagation: () => {} });
    const statusMsg = modalEl.querySelector('#title-save-status-msg') as any;
    expect(statusMsg.textContent).toContain('Please select a file or paste save data');

    // 2. Invalid import attempt shows failure
    importTextarea.value = '{"bad":"data"}';
    await confirmImportBtn.listeners['click'][0]({ stopPropagation: () => {} });
    expect(statusMsg.textContent).toContain('Invalid save data format');

    // 3. Valid import succeeds and updates preview
    importTextarea.value = '{"player":{"name":"KRIS"}}';
    await confirmImportBtn.listeners['click'][0]({ stopPropagation: () => {} });
    expect(statusMsg.textContent).toContain('Save data imported successfully!');

    // Simulate main.ts setting updated preview after import
    ui.setSavePreview({
      playerName: 'KRIS',
      gender: 'GIRL',
      badgeCount: 8,
      pokedexCount: 150,
      playTimeFormatted: '25:00',
      currentLocationName: 'Blackthorn City',
      partyLeadSpeciesId: 'feraligatr',
      partyLeadLevel: 55,
      timestamp: 1700000000000,
    });

    expect(ui.hasSave()).toBe(true);
    expect(ui.getFocusedOption()).toBe('CONTINUE');
  });

  it('works seamlessly with SaveManager exportSaveJson and importSaveJson roundtrip', async () => {
    const saveManager = new SaveManager();
    const fresh = SaveManager.createFreshSaveData('CHRIS', 'BOY');
    fresh.player.mapId = 'route_33';
    fresh.player.x = 11;
    fresh.player.y = 14;
    await saveManager.saveGame(fresh);

    const onExportSave = async () => saveManager.exportSaveJson();
    const onImportSave = async (raw: string) => saveManager.importSaveJson(raw);

    const ui = new TitleScreenUI('modal-container', await saveManager.getSavePreview(), undefined, {
      onContinue: vi.fn(),
      onNewGame: vi.fn(),
      onExportSave,
      onImportSave,
    });

    // Verify export
    const exportedJson = await ui.exportSave();
    expect(exportedJson).toContain('"route_33"');
    expect(exportedJson).toContain('"CHRIS"');

    // Wipe save
    await saveManager.deleteSave();
    ui.setSavePreview(null);
    expect(ui.hasSave()).toBe(false);

    // Re-import via TitleScreenUI
    const importOk = await ui.importSave(exportedJson);
    expect(importOk).toBe(true);

    const restoredPreview = await saveManager.getSavePreview();
    expect(restoredPreview?.playerName).toBe('CHRIS');
    ui.setSavePreview(restoredPreview);
    expect(ui.hasSave()).toBe(true);
    expect(ui.getFocusedOption()).toBe('CONTINUE');
  });
});
