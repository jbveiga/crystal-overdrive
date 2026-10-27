import { vi } from 'vitest';

/**
 * Robust in-memory DOM element mock for headless Node.js test environments.
 */
export class MockElement {
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
  public style: Record<string, string>;
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

  appendChild(child: MockElement): MockElement {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(): void {
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent = null;
    }
  }

  addEventListener(event: string, fn: Function): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  click(): void {
    this.listeners['click']?.forEach((fn) =>
      fn({ currentTarget: this, target: this, stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  dispatchInput(val: string): void {
    this.value = val;
    this.listeners['input']?.forEach((fn) =>
      fn({ target: { value: val }, stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  dispatchChange(val: string): void {
    this.value = val;
    this.listeners['change']?.forEach((fn) =>
      fn({ target: { value: val }, stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  getAttribute(attr: string): string | null {
    return this.attributes[attr] || null;
  }

  setAttribute(attr: string, val: string): void {
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

/**
 * Robust mock document implementation.
 */
export class MockDocument {
  public head = new MockElement('head');
  public body = new MockElement('body');
  private elementsById: Map<string, MockElement> = new Map();

  createElement(tagName: string): MockElement {
    return new MockElement(tagName);
  }

  getElementById(id: string): MockElement | null {
    if (this.elementsById.has(id)) return this.elementsById.get(id)!;
    return this.body.querySelector(`#${id}`) || this.head.querySelector(`#${id}`);
  }

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector) || this.head.querySelector(selector);
  }

  querySelectorAll(selector: string): MockElement[] {
    return [...this.body.querySelectorAll(selector), ...this.head.querySelectorAll(selector)];
  }

  register(el: MockElement): void {
    if (el.id) this.elementsById.set(el.id, el);
  }

  reset(): void {
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.elementsById.clear();
  }
}

/**
 * Global mock document and window installation helper.
 */
export function installMockDomGlobals(): { doc: MockDocument; keyListeners: Function[] } {
  const doc = new MockDocument();
  const keyListeners: Function[] = [];

  (globalThis as unknown as Record<string, unknown>).document = doc;
  (globalThis as unknown as Record<string, unknown>).window = {
    addEventListener: vi.fn((event: string, fn: Function) => {
      if (event === 'keydown') keyListeners.push(fn);
    }),
    removeEventListener: vi.fn((event: string, fn: Function) => {
      if (event === 'keydown') {
        const idx = keyListeners.indexOf(fn);
        if (idx >= 0) keyListeners.splice(idx, 1);
      }
    }),
  };

  return { doc, keyListeners };
}

/**
 * Creates and registers a mock container element on doc.body.
 */
export function createMockContainer(id: string, doc: MockDocument): MockElement {
  const container = doc.createElement('div');
  container.id = id;
  doc.body.appendChild(container);
  doc.register(container);
  return container;
}

/**
 * Resets the document and creates the 3 standard UI containers:
 * #modal-container, #overworld-hud-container, and #battle-hud-container.
 */
export function resetDefaultContainers(doc: MockDocument): void {
  doc.reset();
  createMockContainer('modal-container', doc);
  createMockContainer('overworld-hud-container', doc);
  createMockContainer('battle-hud-container', doc);
}
