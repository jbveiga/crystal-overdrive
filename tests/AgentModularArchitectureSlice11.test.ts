import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock minimal browser globals for DOM tests
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node', maxTouchPoints: 0 },
  configurable: true,
  writable: true,
});
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    getElementById: () => null,
  };
}

import { BattleStateMachine, SPREAD_MOVE_IDS } from '../src/battle/BattleStateMachine';
import {
  SPREAD_MOVE_IDS as EXECUTOR_SPREAD_IDS,
  getWeatherDamageMultiplier,
  applyEndOfTurnResiduals,
  applyBattleItemEffect,
  STAT_LABELS,
} from '../src/battle/state/BattleMoveAndItemExecutor';

import { EvolutionSceneUI } from '../src/ui/EvolutionSceneUI';
import {
  TYPE_COLORS,
  injectNeoKantoEvolutionStyles,
  renderEvolutionModalDom,
} from '../src/ui/evolution/EvolutionDomAndStyles';

import { BattleAudio } from '../src/audio/BattleAudio';
import {
  playWarpSound,
  playOverworldSound,
  playItemfinderPing,
  playItemfinderSonar,
  playStatusSound,
  playWeatherSound,
} from '../src/audio/battle/OverworldAndEnvironmentalAudio';
import type { PokemonInstance } from '../src/types/game';

describe('TICKET-REFACTOR-AGENT-OPT-SLICE-11: Agent-Optimized Battle & Audio Decomposition', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('Pillar 1: Single-Window File Ceiling (< 800 Lines / Facades < 750 Lines)', () => {
    it('asserts BattleStateMachine.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/battle/BattleStateMachine.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts BattleMoveAndItemExecutor.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/battle/state/BattleMoveAndItemExecutor.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts EvolutionSceneUI.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/EvolutionSceneUI.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts EvolutionDomAndStyles.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/evolution/EvolutionDomAndStyles.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts BattleAudio.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/audio/BattleAudio.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts OverworldAndEnvironmentalAudio.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/audio/battle/OverworldAndEnvironmentalAudio.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });
  });

  describe('Pillar 2: Facade Method & Type Preservation', () => {
    it('preserves 100% of public methods, properties, and re-exports on BattleStateMachine', () => {
      expect(SPREAD_MOVE_IDS).toBeDefined();
      expect(SPREAD_MOVE_IDS.has('surf')).toBe(true);
      expect(SPREAD_MOVE_IDS.has('earthquake')).toBe(true);
      expect(SPREAD_MOVE_IDS.has('mudslap')).toBe(true);

      const mockPlayerPkmn: PokemonInstance = {
        uid: 'p1',
        id: 'p1',
        speciesId: 'pikachu',
        nickname: 'Pikachu',
        level: 25,
        currentHp: 60,
        stats: { hp: 60, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
        moves: [{ id: 'thunderbolt', name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 90, accuracy: 100, pp: 15, maxPp: 15 }],
        types: ['Electric'],
        exp: 1000,
        status: 'NONE',
      };

      const mockEnemyPkmn: PokemonInstance = {
        uid: 'e1',
        id: 'e1',
        speciesId: 'squirtle',
        nickname: 'Squirtle',
        level: 25,
        currentHp: 55,
        stats: { hp: 55, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
        moves: [{ id: 'watergun', name: 'Water Gun', type: 'Water', category: 'Special', power: 40, accuracy: 100, pp: 25, maxPp: 25 }],
        types: ['Water'],
        exp: 1000,
        status: 'NONE',
      };

      const bsm = new BattleStateMachine(mockPlayerPkmn, mockEnemyPkmn, false, {
        stadiumRules: { weather: 'SUN' },
      });

      expect(typeof bsm.getWeatherDamageMultiplier).toBe('function');
      expect(bsm.getWeatherDamageMultiplier('Fire')).toBe(1.5);
      expect(bsm.getWeatherDamageMultiplier('Water')).toBe(0.5);
      expect(typeof bsm.executeRound).toBe('function');
      expect(typeof bsm.executeDoubleRound).toBe('function');
      expect(typeof bsm.getEffectiveSpeed).toBe('function');
      expect(typeof bsm.calculateEscapeSuccess).toBe('function');
      expect(typeof BattleStateMachine.calculateTrainerPayout).toBe('function');
    });

    it('preserves 100% of static constants and public methods on EvolutionSceneUI', () => {
      expect(EvolutionSceneUI.CANCEL_WINDOW_MIN_SEC).toBe(0.5);
      expect(EvolutionSceneUI.CANCEL_WINDOW_MAX_SEC).toBe(9.5);
      expect(EvolutionSceneUI.MIN_OSCILLATION_HZ).toBe(1.0);
      expect(EvolutionSceneUI.MAX_OSCILLATION_HZ).toBe(8.0);

      const evoUi = new EvolutionSceneUI();
      expect(typeof evoUi.play).toBe('function');
      expect(typeof evoUi.enterPulsePhase).toBe('function');
      expect(typeof evoUi.enterTransformPhase).toBe('function');
      expect(typeof evoUi.enterTriumphPhase).toBe('function');
      expect(typeof evoUi.advance).toBe('function');
      expect(typeof evoUi.cancel).toBe('function');
      expect(typeof evoUi.completeEvolution).toBe('function');
      expect(typeof evoUi.canCancel).toBe('function');
      expect(typeof evoUi.getPhase).toBe('function');
    });

    it('preserves 100% of static methods and audio triggers on BattleAudio', () => {
      expect(typeof BattleAudio.playCry).toBe('function');
      expect(typeof BattleAudio.playMoveAttack).toBe('function');
      expect(typeof BattleAudio.playHitImpact).toBe('function');
      expect(typeof BattleAudio.playStatChange).toBe('function');
      expect(typeof BattleAudio.playBallEvent).toBe('function');
      expect(typeof BattleAudio.playMenuSound).toBe('function');
      expect(typeof BattleAudio.playWarpSound).toBe('function');
      expect(typeof BattleAudio.playOverworldSound).toBe('function');
      expect(typeof BattleAudio.playItemfinderPing).toBe('function');
      expect(typeof BattleAudio.playItemfinderSonar).toBe('function');
      expect(typeof BattleAudio.updateLowHpState).toBe('function');
      expect(typeof BattleAudio.playStatusSound).toBe('function');
      expect(typeof BattleAudio.playWeatherSound).toBe('function');

      // Muted execution runs safely without throws
      BattleAudio.muted = true;
      expect(() => BattleAudio.playWarpSound('DOOR_ENTER')).not.toThrow();
      expect(() => BattleAudio.playOverworldSound('RUSTLE')).not.toThrow();
      expect(() => BattleAudio.playItemfinderPing(true)).not.toThrow();
      expect(() => BattleAudio.playStatusSound('PAR')).not.toThrow();
      expect(() => BattleAudio.playWeatherSound('RAIN')).not.toThrow();
      BattleAudio.muted = false;
    });
  });

  describe('Pillar 3: Extracted Sub-module Functions and Behavioral Contracts', () => {
    it('BattleMoveAndItemExecutor correctly evaluates weather multipliers, residual effects, and items', () => {
      expect(EXECUTOR_SPREAD_IDS.has('surf')).toBe(true);
      expect(STAT_LABELS.atk).toBe('Attack');
      expect(STAT_LABELS.spe).toBe('Speed');

      expect(getWeatherDamageMultiplier('Fire', 'SUN')).toBe(1.5);
      expect(getWeatherDamageMultiplier('Water', 'SUN')).toBe(0.5);
      expect(getWeatherDamageMultiplier('Water', 'RAIN')).toBe(1.5);
      expect(getWeatherDamageMultiplier('Fire', 'RAIN')).toBe(0.5);
      expect(getWeatherDamageMultiplier('Grass', 'RAIN')).toBe(1.0);

      const pkmn: PokemonInstance = {
        uid: 'test-1',
        id: 'test-1',
        speciesId: 'pikachu',
        nickname: 'Sparky',
        level: 25,
        currentHp: 40,
        stats: { hp: 60, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
        moves: [],
        types: ['Electric'],
        exp: 1000,
        status: 'BRN',
      };

      const events: any[] = [];
      applyEndOfTurnResiduals({
        combatants: [pkmn],
        weather: 'NONE',
        isDoubleBattle: false,
        events,
      });

      expect(pkmn.currentHp).toBeLessThan(40);
      expect(events.some((e) => e.type === 'RESIDUAL_DAMAGE')).toBe(true);

      const healEvents: any[] = [];
      applyBattleItemEffect('potion', pkmn, healEvents);
      expect(healEvents.some((e) => e.type === 'HEAL')).toBe(true);
    });

    it('EvolutionDomAndStyles exports complete color catalog and renders modal DOM tree', () => {
      expect(TYPE_COLORS.electric).toBe('#FFD028');
      expect(TYPE_COLORS.water).toBe('#2A75D3');
      expect(TYPE_COLORS.grass).toBe('#48C774');

      expect(typeof injectNeoKantoEvolutionStyles).toBe('function');

      const dummyRoot: any = {
        innerHTML: '',
        querySelector: vi.fn().mockReturnValue(null),
      };

      renderEvolutionModalDom({
        rootElement: dummyRoot,
        phase: 'TRIUMPH',
        targetTypes: ['Grass', 'Poison'],
        statDeltas: { hp: 15, attack: 12, defense: 10, spAttack: 20, spDefense: 15, speed: 5 },
        preEvoSpeciesId: 'bulbasaur',
        preEvoName: 'BULBASAUR',
        targetSpeciesId: 'ivysaur',
        targetSpeciesName: 'IVYSAUR',
        preSpriteUrl: './assets/sprites/pokemon/bulbasaur_front.png',
        targetSpriteUrl: './assets/sprites/pokemon/ivysaur_front.png',
        dialogueText: 'Congratulations! Your BULBASAUR evolved into IVYSAUR!',
        oscHz: 1.0,
        cancelAllowed: false,
        onCancel: () => {},
        onComplete: () => {},
        onDismissCancel: () => {},
      });

      expect(dummyRoot.innerHTML).toContain('nk-evo-stage');
      expect(dummyRoot.innerHTML).toContain('IVYSAUR');
      expect(dummyRoot.innerHTML).toContain('GRASS');
      expect(dummyRoot.innerHTML).toContain('POISON');
      expect(dummyRoot.innerHTML).toContain('+15');
      expect(dummyRoot.innerHTML).toContain('CONTINUE [A / ENTER]');
    });

    it('OverworldAndEnvironmentalAudio audio functions invoke Web Audio graph when context is active', () => {
      const mockOsc = {
        type: 'sine',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      const mockGain = {
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      const mockCtx = {
        currentTime: 0,
        sampleRate: 44100,
        destination: {},
        createOscillator: vi.fn().mockReturnValue(mockOsc),
        createGain: vi.fn().mockReturnValue(mockGain),
        createBuffer: vi.fn().mockReturnValue({ getChannelData: vi.fn().mockReturnValue(new Float32Array(100)) }),
        createBufferSource: vi.fn().mockReturnValue({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null }),
        createBiquadFilter: vi.fn().mockReturnValue({ type: 'bandpass', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn() }),
      };

      const helper = {
        getContext: () => mockCtx as any,
        bindAutoDisconnect: vi.fn(),
      };

      playWarpSound('DOOR_ENTER', helper);
      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();

      playOverworldSound('HOP', helper);
      playItemfinderPing(true, helper);
      playItemfinderSonar(5, true, helper);
      playStatusSound('PAR', helper);
      playWeatherSound('SUN', helper);
    });
  });
});
