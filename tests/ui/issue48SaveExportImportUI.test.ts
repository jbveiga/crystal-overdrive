import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveManager } from "../../src/core/SaveManager";
import { StartMenuUI } from "../../src/ui/StartMenuUI";

// Lightweight in-memory DOM mock for node testing
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
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
      const dataLmMatch = attrs.match(/data-landmark-id=["']([^"']+)["']/i);
      const dataFilterMatch = attrs.match(/data-filter=["']([^"']+)["']/i);
      const styleMatch = attrs.match(/style=["']([^"']+)["']/i);

      const child = new MockElement(tag);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (dataLmMatch) child.setAttribute('data-landmark-id', dataLmMatch[1]);
      if (dataFilterMatch) child.setAttribute('data-filter', dataFilterMatch[1]);
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

describe("Issue #48 — Cross-Device Save Game Export & Import (SaveManager + StartMenu Save Console)", () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  it("exports and imports both raw JSON and CRYSTAL_SAVE_V1 base64 portable strings in SaveManager", async () => {
    const saveManager = new SaveManager();
    const fresh = SaveManager.createFreshSaveData("GOLD", "BOY");
    fresh.player.mapId = "violet_city";
    fresh.player.x = 18;
    fresh.player.y = 25;
    fresh.player.badges = ["zephyr"];

    await saveManager.saveGame(fresh);
    const exportedJson = await saveManager.exportSaveJson();
    expect(exportedJson).toContain('"violet_city"');

    // Wipe and re-import from JSON
    await saveManager.deleteSave();
    expect(await saveManager.hasSave()).toBe(false);
    expect(await saveManager.importSaveJson(exportedJson)).toBe(true);

    const restored = await saveManager.loadGame();
    expect(restored?.player.mapId).toBe("violet_city");
    expect(restored?.player.badges).toEqual(["zephyr"]);

    // Also support CRYSTAL_SAVE_V1 base64 portable string
    const portableCode = "CRYSTAL_SAVE_V1:" + btoa(unescape(encodeURIComponent(exportedJson)));
    await saveManager.deleteSave();
    expect(await saveManager.importSaveJson(portableCode)).toBe(true);
    const restoredFromCode = await saveManager.loadGame();
    expect(restoredFromCode?.player.x).toBe(18);
    expect(restoredFromCode?.player.y).toBe(25);
  });

  it("wires Export Save and Import Save buttons in the Start Menu Save Console modal", async () => {
    const onExportSave = vi.fn().mockResolvedValue('{"player":{"name":"GOLD"},"party":[]}');
    const onImportSave = vi.fn().mockResolvedValue(true);

    const ui = new StartMenuUI(
      "modal-container",
      {
        getTrainerName: () => "GOLD",
        getMoney: () => 5000,
        getBadges: () => ["zephyr"],
        getPartyCount: () => 3,
        getMapName: () => "New Bark Town",
        getPlayTimeSeconds: () => 300,
        getCaughtCount: () => 5,
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onSaveGame: vi.fn().mockResolvedValue(undefined),
        onExportSave,
        onImportSave,
      }
    );

    ui.openSaveConfirm();
    const saveModal = mockDoc.getElementById("save-confirm-modal")!;
    expect(saveModal).toBeDefined();
    expect(saveModal.innerHTML).toContain("EXPORT SAVE");
    expect(saveModal.innerHTML).toContain("IMPORT SAVE");

    const exportBtn = saveModal.querySelector("#export-save-btn") as any;
    expect(exportBtn).not.toBeNull();
    await exportBtn.listeners["click"][0]();
    expect(onExportSave).toHaveBeenCalledTimes(1);

    const textarea = saveModal.querySelector("#portable-save-textarea") as any;
    expect(textarea.value).toContain('"GOLD"');

    const confirmImportBtn = saveModal.querySelector("#confirm-import-save-btn") as any;
    await confirmImportBtn.listeners["click"][0]();
    expect(onImportSave).toHaveBeenCalledWith('{"player":{"name":"GOLD"},"party":[]}');
  });
});
