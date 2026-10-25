import type { GbcPaletteMode } from '../types/game';

export interface PaletteSpec {
  id: GbcPaletteMode;
  label: string;
  shortLabel: string;
  cssFilter: string;
  accentColor: string;
  description: string;
}

export const GBC_PALETTE_SPECS: Record<GbcPaletteMode, PaletteSpec> = {
  VIBRANT: {
    id: 'VIBRANT',
    label: '🎨 VIBRANT GBC',
    shortLabel: 'VIBRANT',
    cssFilter: 'none',
    accentColor: '#38bdf8',
    description: 'Authentic Game Boy Color full-spectrum 56-color vibrant output',
  },
  POCKET: {
    id: 'POCKET',
    label: '📟 GB POCKET',
    shortLabel: 'POCKET',
    cssFilter: 'sepia(0.36) hue-rotate(36deg) saturate(0.76) contrast(1.06)',
    accentColor: '#a3e635',
    description: '1996 Game Boy Pocket silver-olive reflective LCD tone',
  },
  DMG: {
    id: 'DMG',
    label: '🟩 CLASSIC DMG',
    shortLabel: 'DMG-01',
    cssFilter: 'sepia(0.82) hue-rotate(48deg) saturate(1.32) contrast(1.12) brightness(0.95)',
    accentColor: '#84cc16',
    description: '1989 Dot Matrix Game Boy classic 4-shade pea-green matrix',
  },
  NIGHT: {
    id: 'NIGHT',
    label: '🌙 MIDNIGHT CRT',
    shortLabel: 'MIDNIGHT',
    cssFilter: 'brightness(0.88) contrast(1.08) saturate(0.86) hue-rotate(-8deg)',
    accentColor: '#818cf8',
    description: 'Low-glare late-night indigo phosphor display calibration',
  },
};

export class DisplayThemeManager {
  private crtEnabled: boolean = false;
  private palette: GbcPaletteMode = 'VIBRANT';
  private overlayEl: HTMLDivElement | null = null;

  constructor(initialCrt: boolean = false, initialPalette: GbcPaletteMode = 'VIBRANT') {
    this.crtEnabled = initialCrt;
    this.palette = initialPalette;
    this.apply();
  }

  public isCrtEnabled(): boolean {
    return this.crtEnabled;
  }

  public getPalette(): GbcPaletteMode {
    return this.palette;
  }

  public setCrtScanlines(enabled: boolean): boolean {
    this.crtEnabled = Boolean(enabled);
    this.apply();
    return this.crtEnabled;
  }

  public toggleCrtScanlines(): boolean {
    this.crtEnabled = !this.crtEnabled;
    this.apply();
    return this.crtEnabled;
  }

  public setPalette(palette: GbcPaletteMode): GbcPaletteMode {
    if (GBC_PALETTE_SPECS[palette]) {
      this.palette = palette;
      this.apply();
    }
    return this.palette;
  }

  public cyclePalette(): GbcPaletteMode {
    const order: GbcPaletteMode[] = ['VIBRANT', 'POCKET', 'DMG', 'NIGHT'];
    const next = order[(order.indexOf(this.palette) + 1) % order.length];
    return this.setPalette(next);
  }

  public apply(): void {
    if (typeof document === 'undefined') return;

    // 1. Apply CRT scanline & vignette overlay
    let overlay = document.getElementById('crt-scanline-overlay') as HTMLDivElement | null;
    if (!overlay && document.body) {
      overlay = document.createElement('div');
      overlay.id = 'crt-scanline-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9000;
        background:
          repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.22) 0px,
            rgba(0, 0, 0, 0.22) 1px,
            transparent 1px,
            transparent 3px
          ),
          radial-gradient(
            circle at center,
            transparent 62%,
            rgba(0, 0, 0, 0.42) 100%
          );
        display: none;
      `;
      document.body.appendChild(overlay);
    }
    this.overlayEl = overlay;
    if (this.overlayEl) {
      this.overlayEl.style.display = this.crtEnabled ? 'block' : 'none';
    }

    // 2. Apply GBC Color Palette filter to #canvas-container (or fallback to #app-container)
    const spec = GBC_PALETTE_SPECS[this.palette] || GBC_PALETTE_SPECS.VIBRANT;
    const canvasContainer =
      (document.getElementById('canvas-container') as HTMLElement | null) ||
      (document.getElementById('app-container') as HTMLElement | null);
    if (canvasContainer) {
      canvasContainer.style.filter = spec.cssFilter;
    }
  }
}
