import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { EvolutionSceneUI } from '../src/ui/EvolutionSceneUI';

// Lightweight in-memory DOM mock for node environment UI tests
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

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
      // Also fallback check in raw innerHTML for simple ID assertions
      return null;
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
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
const keyListeners: Function[] = [];

(globalThis as unknown as Record<string, unknown>).document = mockDoc;
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

describe('Ticket 14.2: Fullscreen Evolution Sequence UI (EvolutionSceneUI)', () => {
  beforeEach(() => {
    mockDoc.reset();
    keyListeners.length = 0;
  });

  it('opens in PROMPT phase with initial dialogue and canonical front battle sprite paths', () => {
    const ui = new EvolutionSceneUI('modal-container');
    const cyndaquil = PokemonFactory.create('cyndaquil', 14);

    ui.play(cyndaquil, 'quilava', { autoAdvance: false });

    expect(ui.isOpen()).toBe(true);
    expect(ui.getPhase()).toBe('PROMPT');
    expect(ui.getDialogueText()).toBe('What? Cyndaquil is evolving!');
    expect(ui.getPreEvoSpriteUrl()).toBe('/assets/sprites/pokemon/cyndaquil_front.png');
    expect(ui.getTargetSpriteUrl()).toBe('/assets/sprites/pokemon/quilava_front.png');

    const modal = mockDoc.body.querySelector('#evolution-scene-modal');
    expect(modal).not.toBeNull();
    expect(modal?.innerHTML).toContain('cyndaquil_front.png');
    expect(modal?.innerHTML).toContain('quilava_front.png');
    expect(modal?.innerHTML).toContain('What? Cyndaquil is evolving!');
  });

  it('ramps silhouette oscillation frequency linearly from 1.0 Hz to 8.0 Hz over the 8-second window', () => {
    const ui = new EvolutionSceneUI('modal-container');
    const totodile = PokemonFactory.create('totodile', 18);

    ui.play(totodile, 'croconaw', { autoAdvance: false });
    ui.enterPulsePhase();
    expect(ui.getPhase()).toBe('PULSE');

    // Start of ramp (1.0s) -> 1.0 Hz
    expect(ui.getOscillationFrequency(1.0)).toBe(1.0);
    // Midpoint of 8s ramp (5.0s) -> 4.5 Hz
    expect(ui.getOscillationFrequency(5.0)).toBe(4.5);
    // End of 8s ramp (9.0s) -> 8.0 Hz
    expect(ui.getOscillationFrequency(9.0)).toBe(8.0);
  });

  it('allows B-button / Escape cancellation during [0.5s, 9.5s] window and resolves { evolved: false }', async () => {
    const ui = new EvolutionSceneUI('modal-container');
    const chikorita = PokemonFactory.create('chikorita', 16);

    const promise = ui.play(chikorita, 'bayleef', { autoAdvance: false });
    ui.enterPulsePhase();
    ui.setElapsedTime(4.2);
    expect(ui.canCancel()).toBe(true);

    const cancelled = ui.cancel();
    expect(cancelled).toBe(true);

    const result = await promise;
    expect(result).toEqual({ evolved: false });
    expect(ui.isOpen()).toBe(false);
    // Original Pokémon species remains unchanged
    expect(chikorita.speciesId).toBe('chikorita');
  });

  it('interrupts evolution when KeyB or Escape is pressed on the keyboard during PULSE phase', async () => {
    const ui = new EvolutionSceneUI('modal-container');
    const pikachu = PokemonFactory.create('pikachu', 25);

    const promise = ui.play(pikachu, 'raichu', { autoAdvance: false });
    ui.enterPulsePhase();
    expect(keyListeners.length).toBeGreaterThan(0);

    // Dispatch KeyB press
    keyListeners[0]({
      key: 'b',
      code: 'KeyB',
      preventDefault: () => {},
      stopPropagation: () => {},
    });

    const result = await promise;
    expect(result.evolved).toBe(false);
    expect(ui.isOpen()).toBe(false);
  });

  it('locks out B-button cancellation during the TRANSFORM climax and TRIUMPH celebration phases', async () => {
    const ui = new EvolutionSceneUI('modal-container');
    const onix = PokemonFactory.create('onix', 30);

    const promise = ui.play(onix, 'steelix', { autoAdvance: false });

    // Before 0.5s window -> locked
    ui.setElapsedTime(0.2);
    expect(ui.canCancel()).toBe(false);
    expect(ui.cancel()).toBe(false);

    // Enter TRANSFORM climax -> locked
    ui.enterTransformPhase();
    expect(ui.getPhase()).toBe('TRANSFORM');
    expect(ui.canCancel()).toBe(false);
    expect(ui.cancel()).toBe(false);

    // Enter TRIUMPH celebration -> locked
    ui.enterTriumphPhase();
    expect(ui.getPhase()).toBe('TRIUMPH');
    expect(ui.canCancel()).toBe(false);
    expect(ui.cancel()).toBe(false);

    // Complete evolution
    ui.completeEvolution();
    const result = await promise;
    expect(result.evolved).toBe(true);
    expect(result.targetSpecies).toBe('steelix');
  });

  it('progresses through all phases to TRIUMPH, renders stat deltas & new typing capsules, and resolves { evolved: true }', async () => {
    const ui = new EvolutionSceneUI('modal-container');
    const scyther = PokemonFactory.create('scyther', 25);

    const promise = ui.play(scyther, 'scizor', { autoAdvance: false, mutatePokemon: true });

    // Phase 1 -> Phase 2 (PULSE)
    ui.advance();
    expect(ui.getPhase()).toBe('PULSE');

    // Phase 2 -> Phase 3 (TRANSFORM)
    ui.advance();
    expect(ui.getPhase()).toBe('TRANSFORM');

    // Phase 3 -> Phase 4 (TRIUMPH)
    ui.advance();
    expect(ui.getPhase()).toBe('TRIUMPH');
    expect(ui.getDialogueText()).toBe('Congratulations! Your Scyther evolved into SCIZOR!');

    const modal = mockDoc.body.querySelector('#evolution-scene-modal');
    expect(modal?.innerHTML).toContain('EVOLUTION COMPLETE');
    expect(modal?.innerHTML).toContain('SCIZOR');
    expect(modal?.innerHTML).toContain('BUG');
    expect(modal?.innerHTML).toContain('STEEL');

    const deltas = ui.getStatDeltas();
    expect(deltas.attack).toBeGreaterThan(0);
    expect(deltas.defense).toBeGreaterThan(0);

    // Phase 4 -> Complete & Close
    ui.advance();
    const result = await promise;
    expect(result.evolved).toBe(true);
    expect(result.targetSpecies).toBe('scizor');
    expect(result.newSpeciesId).toBe('scizor');
    expect(result.newTypes).toEqual(['Bug', 'Steel']);
    expect(scyther.speciesId).toBe('scizor');
    expect(ui.isOpen()).toBe(false);
  });
});
