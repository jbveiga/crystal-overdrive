/**
 * BugContestHUDWidget.ts
 * Persistent overworld telemetry HUD widget for the active Bug-Catching Contest.
 * Neo-Kanto Protocol styling (Space Mono typography, hard block shadows).
 */
import type { PokemonInstance } from '../types/game';

export class BugContestHUDWidget {
  private containerId: string;
  private rootElement: HTMLElement | null = null;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  public mount(balls: number, timeSec: number, specimen?: PokemonInstance): void {
    if (this.rootElement) return;
    const parent = document.getElementById(this.containerId);
    if (!parent) return;

    this.rootElement = document.createElement('div');
    this.rootElement.id = 'bug-contest-hud-widget';
    this.rootElement.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(13, 19, 34, 0.94);
      backdrop-filter: blur(8px);
      border: 1px solid #2A3A5E;
      border-top: 3px solid #48C774;
      box-shadow: 0 4px 0 0 #070B14;
      border-radius: 4px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 100;
      font-family: 'Space Mono', 'Courier New', monospace;
      color: #F6F8F3;
      pointer-events: auto !important;
    `;

    parent.appendChild(this.rootElement);
    this.update(balls, timeSec, specimen);
  }

  public update(balls: number, timeSec: number, specimen?: PokemonInstance): void {
    if (!this.rootElement) return;

    const m = Math.floor(timeSec / 60);
    const s = timeSec % 60;
    const timeFormatted = `${m}:${s.toString().padStart(2, '0')}`;

    const specimenLabel = specimen
      ? `<span style="color: #48C774; font-weight: 700;">${(specimen.nickname || specimen.speciesId).toUpperCase()} LV.${specimen.level}</span>`
      : `<span style="color: #8A9DBF;">NO SPECIMEN</span>`;

    const ballColor = balls <= 3 ? '#EE4238' : '#FFD028';
    const timerColor = timeSec <= 120 ? '#EE4238' : '#F6F8F3';

    this.rootElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
        <span style="font-weight: 700; color: ${ballColor};">⚾ BALLS:</span>
        <span style="font-weight: 700;">${balls}/20</span>
      </div>

      <div style="width: 1px; height: 16px; background: #2A3A5E;"></div>

      <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
        <span>⏱️</span>
        <span style="font-weight: 700; color: ${timerColor};">${timeFormatted}</span>
      </div>

      <div style="width: 1px; height: 16px; background: #2A3A5E;"></div>

      <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
        <span style="color: #8A9DBF;">SPECIMEN:</span>
        ${specimenLabel}
      </div>
    `;
  }

  public destroy(): void {
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
      this.rootElement = null;
    }
  }
}
