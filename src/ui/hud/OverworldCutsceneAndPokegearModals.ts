/**
 * @fileoverview OverworldCutsceneAndPokegearModals domain module implementation.
 * @module ui/hud/OverworldCutsceneAndPokegearModals
 * @role OverworldCutsceneAndPokegearModals Component
 * @exports CutsceneAndPokegearContext, OverworldCutsceneAndPokegearModals
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-215: Implementation | L216-431: Handlers & Exports
 */

import type { RoamerState } from '../../types/game';
import { BattleAudio } from '../../audio/BattleAudio';

export interface CutsceneAndPokegearContext {
  rootElement: HTMLElement;
  toastBanner: HTMLDivElement;
  onClearActiveDirection: () => void;
}

export class OverworldCutsceneAndPokegearModals {
  private ctx: CutsceneAndPokegearContext;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  constructor(ctx: CutsceneAndPokegearContext) {
    this.ctx = ctx;
  }

  public isAnyModalOpen(): boolean {
    const starterModal = this.ctx.rootElement.querySelector('#starter-choice-modal') as HTMLElement | null;
    const starterOpen = starterModal ? starterModal.style.display === 'flex' : false;
    const healOverlay = this.ctx.rootElement.querySelector('#pokecenter-heal-overlay') as HTMLElement | null;
    const healOpen = healOverlay ? healOverlay.style.display === 'flex' : false;
    const fieldRestOverlay = this.ctx.rootElement.querySelector('#field-rest-overlay') as HTMLElement | null;
    const fieldRestOpen = fieldRestOverlay ? fieldRestOverlay.style.display === 'block' : false;
    return starterOpen || healOpen || fieldRestOpen;
  }

  public playFieldRestAnimation(onComplete?: () => void): void {
    this.ctx.onClearActiveDirection();
    let overlay = this.ctx.rootElement.querySelector('#field-rest-overlay') as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'field-rest-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        z-index: 60;
        opacity: 0;
        pointer-events: auto;
        display: none;
        transition: opacity 0.22s ease-in-out;
      `;
      this.ctx.rootElement.appendChild(overlay);
    } else {
      overlay.style.background = '#ffffff';
    }

    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    BattleAudio.playOverworldSound('HEAL_JINGLE');

    setTimeout(() => {
      if (overlay) overlay.style.opacity = '0';
    }, 870);

    setTimeout(() => {
      if (overlay) overlay.style.display = 'none';
      if (onComplete) onComplete();
    }, 1120);
  }

  public playHealingAnimation(partyCount: number, onComplete?: () => void): void {
    this.ctx.onClearActiveDirection();
    const clampedCount = Math.max(1, Math.min(6, partyCount || 1));

    let overlay = this.ctx.rootElement.querySelector('#pokecenter-heal-overlay') as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pokecenter-heal-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(250, 204, 21, 0.16) 0%, rgba(15, 23, 42, 0.55) 100%);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 65;
        pointer-events: auto;
        transition: opacity 0.22s ease;
      `;
      this.ctx.rootElement.appendChild(overlay);
    }

    const slotsHtml = Array.from({ length: 6 })
      .map((_, i) => {
        const occupied = i < clampedCount;
        return `
          <div id="heal-tray-slot-${i}" data-occupied="${occupied}" style="
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid ${occupied ? '#64748b' : 'rgba(71, 85, 105, 0.35)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            opacity: ${occupied ? '0.45' : '0.2'};
            transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
          ">${occupied ? '🔴' : '⚪'}</div>
        `;
      })
      .join('');

    overlay.innerHTML = `
      <div style="
        width: min(380px, 90vw);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
        border: 3px solid #facc15;
        outline: 3px solid #1e293b;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.85), 0 0 28px rgba(250, 204, 21, 0.35);
        border-radius: 14px;
        padding: 20px 22px;
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      ">
        <div style="font-size: 11px; font-weight: 800; color: #facc15; letter-spacing: 1.2px;">💖 POKéMON CENTER HEALING MACHINE</div>
        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          padding: 12px 18px;
          background: rgba(30, 41, 59, 0.85);
          border: 1.5px solid rgba(250, 204, 21, 0.35);
          border-radius: 12px;
        ">
          ${slotsHtml}
        </div>
        <div id="heal-tray-status" style="font-size: 14px; font-weight: 800; color: #fef08a; text-align: center;">
          Restoring POKéMON to full health…
        </div>
      </div>
    `;

    overlay.style.opacity = '1';
    overlay.style.display = 'flex';
    BattleAudio.playOverworldSound('HEAL_JINGLE');

    const stepMs = 180;
    for (let i = 0; i < clampedCount; i++) {
      setTimeout(() => {
        const slotEl = overlay?.querySelector(`#heal-tray-slot-${i}`) as HTMLElement | null;
        if (slotEl) {
          slotEl.style.opacity = '1';
          slotEl.style.borderColor = '#facc15';
          slotEl.style.boxShadow = '0 0 14px #facc15';
          slotEl.style.transform = 'scale(1.14)';
        }
      }, i * stepMs);
    }

    const pulseDelay = clampedCount * stepMs + 250;
    setTimeout(() => {
      for (let i = 0; i < clampedCount; i++) {
        const slotEl = overlay?.querySelector(`#heal-tray-slot-${i}`) as HTMLElement | null;
        if (slotEl) {
          slotEl.style.borderColor = '#4ade80';
          slotEl.style.boxShadow = '0 0 18px #4ade80';
          slotEl.style.transform = 'scale(1.0)';
        }
      }
      const statusEl = overlay?.querySelector('#heal-tray-status') as HTMLElement | null;
      if (statusEl) {
        statusEl.style.color = '#4ade80';
        statusEl.innerText = '✨ Your POKéMON were fully healed!';
      }
    }, pulseDelay);

    const totalDuration = pulseDelay + 1400;
    setTimeout(() => {
      if (overlay) overlay.style.display = 'none';
      if (onComplete) onComplete();
    }, totalDuration);
  }

  public openStarterChoiceModal(
    speciesId: 'cyndaquil' | 'totodile' | 'chikorita',
    speciesLabel: string,
    typeLabel: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.ctx.onClearActiveDirection();
    let modal = this.ctx.rootElement.querySelector('#starter-choice-modal') as HTMLDivElement | null;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'starter-choice-modal';
      modal.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(420px, 92vw);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
        border: 3px solid #f8fafc;
        outline: 3px solid #1e293b;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.85), inset 0 0 0 2px #38bdf8;
        border-radius: 12px;
        padding: 18px 20px;
        color: #f8fafc;
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        z-index: 60;
        pointer-events: auto;
      `;
      this.ctx.rootElement.appendChild(modal);
    }

    const accentColor =
      speciesId === 'cyndaquil' ? '#ef4444' : speciesId === 'totodile' ? '#38bdf8' : '#22c55e';

    modal.innerHTML = `
      <div style="font-size: 11px; font-weight: 800; color: ${accentColor}; letter-spacing: 1px;">🔴 PROF. ELM'S STARTER POKé BALL</div>
      <div style="
        width: 88px;
        height: 88px;
        background: rgba(30, 41, 59, 0.85);
        border: 2px solid ${accentColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 18px ${accentColor}55;
      ">
        <img src="./assets/sprites/pokemon/${speciesId}_front.png" alt="${speciesLabel}" onerror="this.onerror=null;this.src='./assets/sprites/pokemon/marill_front.png';" style="width: 68px; height: 68px; image-rendering: pixelated; object-fit: contain;" />
      </div>
      <div style="font-size: 15px; font-weight: 700; text-align: center; line-height: 1.45;">
        It's <strong>${speciesLabel}</strong>, a <strong>${typeLabel}</strong> POKéMON!<br/>
        Do you want this POKéMON?
      </div>
      <div style="display: flex; gap: 12px; width: 100%; margin-top: 4px;">
        <button id="starter-confirm-yes" style="
          flex: 1;
          background: #16a34a;
          color: #ffffff;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">YES</button>
        <button id="starter-confirm-no" style="
          flex: 1;
          background: #475569;
          color: #ffffff;
          border: 2px solid #94a3b8;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">NO</button>
      </div>
    `;

    modal.style.display = 'flex';

    const close = () => {
      if (modal) modal.style.display = 'none';
      window.removeEventListener('keydown', keyHandler);
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (!modal || modal.style.display !== 'flex') return;
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
        e.preventDefault();
        close();
        onConfirm();
      } else if (e.code === 'Escape' || e.code === 'KeyX') {
        e.preventDefault();
        close();
        if (onCancel) onCancel();
      }
    };
    setTimeout(() => {
      if (modal && modal.style.display === 'flex') {
        window.addEventListener('keydown', keyHandler);
      }
    }, 0);

    modal.querySelector('#starter-confirm-yes')!.addEventListener('click', () => {
      close();
      onConfirm();
    });
    modal.querySelector('#starter-confirm-no')!.addEventListener('click', () => {
      close();
      if (onCancel) onCancel();
    });
  }

  public showToast(message: string, durationMs: number = 3200): void {
    if (!this.ctx.toastBanner) return;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.ctx.toastBanner.style.borderColor = '#38bdf8';
    this.ctx.toastBanner.innerText = message;
    this.ctx.toastBanner.style.display = 'block';
    this.toastTimeout = setTimeout(() => {
      this.ctx.toastBanner.style.display = 'none';
    }, durationMs);
  }

  public showMissionToast(
    title: string,
    subtitle: string,
    type: 'unlocked' | 'progress' | 'completed' = 'progress',
    durationMs: number = 3800
  ): void {
    if (!this.ctx.toastBanner) return;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    const borderColor = type === 'completed' ? '#4ade80' : type === 'unlocked' ? '#facc15' : '#38bdf8';
    const headerIcon = type === 'completed' ? '🏆 MISSION COMPLETED' : type === 'unlocked' ? '✨ NEW MISSION' : '📜 MISSION PROGRESS';

    this.ctx.toastBanner.style.borderColor = borderColor;
    this.ctx.toastBanner.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 3px; text-align: center;">
        <span style="font-size: 11px; font-weight: 900; color: ${borderColor}; letter-spacing: 0.8px;">${headerIcon}: ${title}</span>
        <span style="font-size: 13px; font-weight: 700; color: #f8fafc;">${subtitle}</span>
      </div>
    `;
    this.ctx.toastBanner.style.display = 'block';
    this.toastTimeout = setTimeout(() => {
      this.ctx.toastBanner.style.display = 'none';
    }, durationMs);
  }

  public updatePokegear(roamers: RoamerState[], listElement?: HTMLDivElement): void {
    const list = listElement || (this.ctx.rootElement.querySelector('#roamer-status-list') as HTMLDivElement);
    if (!list) return;

    list.innerHTML = '';
    const anyAwakened = roamers.some((r) => r.isAwakened);

    if (!anyAwakened) {
      list.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 14px; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.5;">
          📡 <strong>ROAMER RADAR:</strong> Inactive.<br/>No anomalous electromagnetic signatures detected across Johto.
        </div>
      `;
      return;
    }

    for (const r of roamers) {
      if (!r.isAwakened) continue;

      const card = document.createElement('div');
      card.style.cssText = `
        background: #1e293b;
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      `;

      const formattedName = r.speciesId.toUpperCase();
      const formattedRoute = r.currentMapId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      let statusBadge = `<span style="background: #2563eb; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ROAMING</span>`;
      if (r.isCaught) {
        statusBadge = `<span style="background: #16a34a; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CAUGHT</span>`;
      } else if (r.isDefeated) {
        statusBadge = `<span style="background: #dc2626; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">DEFEATED</span>`;
      }

      const hpPct = Math.max(0, Math.min(100, (r.pokemon.currentHp / r.pokemon.stats.hp) * 100));
      const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';
      const condBadge =
        r.pokemon.status && r.pokemon.status !== 'NONE'
          ? `<span style="background: #eab308; color: #0f172a; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">${r.pokemon.status}</span>`
          : '';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 14px; color: #f8fafc;">
              <span>⚡ ${formattedName} (Lv. ${r.pokemon.level})</span>
              ${condBadge}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">📍 ${formattedRoute}</div>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-bottom: 3px; font-weight: 600;">
            <span>PERSISTENT HP</span>
            <span>${r.pokemon.currentHp} / ${r.pokemon.stats.hp}</span>
          </div>
          <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;">
            <div style="width: ${hpPct}%; height: 100%; background: ${hpColor};"></div>
          </div>
        </div>
      `;

      list.appendChild(card);
    }
  }

  public openPokegear(): void {
    const pokegearModal = this.ctx.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
    if (pokegearModal) pokegearModal.style.display = 'block';
  }

  public isPokegearOpen(): boolean {
    const pokegearModal = this.ctx.rootElement.querySelector('#pokegear-modal') as HTMLDivElement | null;
    return pokegearModal?.style.display === 'block';
  }
}
