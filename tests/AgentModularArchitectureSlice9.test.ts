import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { TownMapUI } from '../src/ui/TownMapUI';
import {
  injectTownMapStyles,
  renderSvgTopology,
  renderTacticalNodes,
  renderInspectorCard,
  getTownMapPercentCoord,
} from '../src/ui/town-map/TownMapStylesAndInspectorRenderer';
import { BoxManagementUI } from '../src/ui/BoxManagementUI';
import {
  injectBoxNeoKantoStyles,
  showReleaseConfirmModal,
  renderSelectedPokemonInspector,
  renderStorageGrid,
  renderPartyList,
  cleanBoxSpeciesId,
  getBoxSpeciesFrontSprite,
  getBoxSpeciesIcon,
} from '../src/ui/box/BoxStylesAndReleaseModal';
import { TitleScreenUI } from '../src/ui/TitleScreenUI';
import {
  injectTitleScreenStyles,
  renderMainMenu,
  renderOverwriteModal,
  renderOptionsModal,
} from '../src/ui/title/TitleScreenModalsAndStyles';
import { JOHTO_LANDMARKS } from '../src/world/townMapData';
import type { PokemonInstance } from '../src/types/game';

describe('TICKET-REFACTOR-AGENT-OPT-SLICE-09: Agent-Optimized UI Decomposition', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('Pillar 1: Single-Window File Ceiling (< 800 Lines / Facades < 750 Lines)', () => {
    it('asserts TownMapUI.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/TownMapUI.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts TownMapStylesAndInspectorRenderer.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/town-map/TownMapStylesAndInspectorRenderer.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts BoxManagementUI.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/BoxManagementUI.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts BoxStylesAndReleaseModal.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/box/BoxStylesAndReleaseModal.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts TitleScreenUI.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/TitleScreenUI.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts TitleScreenModalsAndStyles.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/title/TitleScreenModalsAndStyles.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });
  });

  describe('Pillar 2: Facade Method & Type Preservation', () => {
    it('preserves 100% of public methods on TownMapUI', () => {
      const instance = new TownMapUI();
      expect(typeof instance.isOpen).toBe('function');
      expect(typeof instance.getCurrentMapId).toBe('function');
      expect(typeof instance.getSelectedLandmark).toBe('function');
      expect(typeof instance.getCurrentPlayerLandmark).toBe('function');
      expect(typeof instance.getActiveFilter).toBe('function');
      expect(typeof instance.setActiveFilter).toBe('function');
      expect(typeof instance.open).toBe('function');
      expect(typeof instance.close).toBe('function');
      expect(typeof instance.selectLandmark).toBe('function');
      expect(typeof instance.handleKeyDown).toBe('function');
      expect(typeof TownMapUI.getResponsiveMetrics).toBe('function');

      const metrics = TownMapUI.getResponsiveMetrics(360);
      expect(metrics.isMobile).toBe(true);
      expect(metrics.cardWidthPct).toBe(100);
    });

    it('preserves 100% of public methods on BoxManagementUI', () => {
      const instance = new BoxManagementUI();
      expect(typeof instance.isOpen).toBe('function');
      expect(typeof instance.getActiveBoxIndex).toBe('function');
      expect(typeof instance.getSelectedSlot).toBe('function');
      expect(typeof instance.isMovePending).toBe('function');
      expect(typeof instance.getMovingSource).toBe('function');
      expect(typeof instance.initiateMove).toBe('function');
      expect(typeof instance.cancelMove).toBe('function');
      expect(typeof instance.getMobileTab).toBe('function');
      expect(typeof instance.setMobileTab).toBe('function');
      expect(typeof instance.open).toBe('function');
      expect(typeof instance.close).toBe('function');
      expect(typeof instance.changeBox).toBe('function');
      expect(typeof instance.setBoxIndex).toBe('function');
      expect(typeof instance.selectSlot).toBe('function');
      expect(typeof instance.releaseSelected).toBe('function');
      expect(typeof instance.getSpeciesFrontSprite).toBe('function');
      expect(typeof instance.getSpeciesIcon).toBe('function');
    });

    it('preserves 100% of public methods on TitleScreenUI', () => {
      const instance = new TitleScreenUI();
      expect(typeof instance.hasSave).toBe('function');
      expect(typeof instance.isVisible).toBe('function');
      expect(typeof instance.isGateUnlocked).toBe('function');
      expect(typeof instance.getCursorIndex).toBe('function');
      expect(typeof instance.getFocusedOption).toBe('function');
      expect(typeof instance.isOverwriteConfirmOpen).toBe('function');
      expect(typeof instance.getOverwriteCursorIndex).toBe('function');
      expect(typeof instance.isOptionsModalOpen).toBe('function');
      expect(typeof instance.getOptions).toBe('function');
      expect(typeof instance.getSavePreview).toBe('function');
      expect(typeof instance.setSavePreview).toBe('function');
      expect(typeof instance.formatSavePreviewSummary).toBe('function');
      expect(typeof instance.unlockGate).toBe('function');
      expect(typeof instance.moveCursor).toBe('function');
      expect(typeof instance.confirmSelection).toBe('function');
      expect(typeof instance.cancelModal).toBe('function');
      expect(typeof instance.openOptionsModal).toBe('function');
      expect(typeof instance.closeOptionsModal).toBe('function');
      expect(typeof instance.updateOptions).toBe('function');
      expect(typeof instance.handleKeyDown).toBe('function');
      expect(typeof instance.show).toBe('function');
      expect(typeof instance.hide).toBe('function');
      expect(typeof instance.destroy).toBe('function');
    });
  });

  describe('Pillar 3: Extracted Sub-module Functions and Markup Contracts', () => {
    it('TownMapStylesAndInspectorRenderer correctly computes percent coordinates and renders SVG/Inspector', () => {
      const coord = getTownMapPercentCoord(0, 0);
      expect(coord.leftPct).toBe(4);
      expect(coord.topPct).toBe(9);

      const svg = renderSvgTopology(new Set(['new_bark_town']));
      expect(svg).toContain('<svg');
      expect(svg).toContain('tacticalGrid');
      expect(svg).toContain('JOHTO');

      const nodes = renderTacticalNodes({
        sel: JOHTO_LANDMARKS.new_bark_town,
        playerLandmark: JOHTO_LANDMARKS.new_bark_town,
        visitedLandmarkIds: new Set(['new_bark_town']),
        activeFilter: 'ALL',
        activeRoamers: [],
        isMobile: false,
      });
      expect(nodes).toContain('town-map-node');
      expect(nodes).toContain('data-landmark-id="new_bark_town"');
      expect(nodes).toContain('town-map-player-beacon');

      const card = renderInspectorCard({
        sel: JOHTO_LANDMARKS.new_bark_town,
        isVisited: true,
        roamersAtSel: [],
        activeRoamers: [],
        playerLandmark: JOHTO_LANDMARKS.new_bark_town,
        isMobile: false,
      });
      expect(card).toContain('town-map-inspector');
      expect(card).toContain('New Bark Town');
      expect(card).toContain('✓ VISITED LANDMARK');
    });

    it('BoxStylesAndReleaseModal correctly resolves sprite paths and renders grid/party/inspector', () => {
      expect(cleanBoxSpeciesId('CYNDAQUIL')).toBe('cyndaquil');
      expect(getBoxSpeciesFrontSprite('cyndaquil')).toBe('./assets/sprites/pokemon/cyndaquil_front.png');
      expect(getBoxSpeciesIcon('totodile')).toBe('./assets/sprites/pokemon/icons/totodile.png');

      const mockPokemon: PokemonInstance = {
        id: 'pkmn-1',
        speciesId: 'pikachu',
        nickname: 'Sparky',
        level: 25,
        currentHp: 60,
        stats: { hp: 60, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
        moves: [{ moveId: 'thunderbolt', pp: 15, maxPp: 15 }],
        types: ['electric'],
        exp: 1000,
        nature: 'timid',
        ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
        evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      };

      const inspectorHtml = renderSelectedPokemonInspector(mockPokemon);
      expect(inspectorHtml).toContain('Sparky');
      expect(inspectorHtml).toContain('Lv. 25');
      expect(inspectorHtml).toContain('electric');
      expect(inspectorHtml).toContain('THUNDERBOLT');

      const gridHtml = renderStorageGrid([mockPokemon], 0, null, false, null);
      expect(gridHtml).toContain('box-slot');
      expect(gridHtml).toContain('data-slot="0"');

      const partyHtml = renderPartyList([mockPokemon], null, false, null);
      expect(partyHtml).toContain('party-slot');
      expect(partyHtml).toContain('Sparky');
    });

    it('TitleScreenModalsAndStyles provides correct styling and modal renders', () => {
      expect(typeof injectTitleScreenStyles).toBe('function');
      expect(typeof renderMainMenu).toBe('function');
      expect(typeof renderOverwriteModal).toBe('function');
      expect(typeof renderOptionsModal).toBe('function');
    });
  });
});
