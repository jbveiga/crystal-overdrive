/**
 * @fileoverview OfflinePlaySection: the "OFFLINE PLAY" block shown inside the title screen Options modal.
 * @module ui/offline/OfflinePlaySection
 * @role Renders status, progress bar and the enable/remove button for OfflineManager
 * @exports mountOfflinePlaySection, describeOfflineState
 * @layer ui
 * @sections L1-15: Header | L16-90: Renderer
 */

import type { OfflineManager, OfflineProgress, OfflineState } from './OfflineManager';

const mb = (b: number): string => `${(b / 1048576).toFixed(1)} MB`;

export function describeOfflineState(state: OfflineState, p?: OfflineProgress, error = '', sizeBytes = 0): { label: string; button: string; color: string } {
  switch (state) {
    case 'UNSUPPORTED':
      return { label: 'Not available in this browser (needs a secure page and service workers).', button: '', color: '#94a3b8' };
    case 'UNAVAILABLE':
      return { label: error || 'The offline pack is not part of this build.', button: '', color: '#94a3b8' };
    case 'DOWNLOADING':
      return { label: p && p.total ? `Downloading… ${p.done}/${p.total} files (${mb(p.bytes)} of ${mb(p.totalBytes)})` : 'Preparing download…', button: '', color: '#fbbf24' };
    case 'READY':
      return { label: `Ready: the game runs without internet${sizeBytes ? ` (${mb(sizeBytes)} stored)` : ''}. Saves stay on this device.`, button: 'REMOVE OFFLINE COPY', color: '#34d399' };
    case 'ERROR':
      return { label: `Download failed: ${error}`, button: 'RETRY DOWNLOAD', color: '#f87171' };
    default:
      return { label: 'Download the game to this device to play without internet. Saves already stay on this device.', button: 'DOWNLOAD FOR OFFLINE', color: '#38bdf8' };
  }
}

/** Appends (or refreshes) the Offline Play block at the end of the given modal card. */
export function mountOfflinePlaySection(modal: HTMLElement, manager: OfflineManager): void {
  const host = modal.firstElementChild ?? modal;
  host.querySelector('#offline-play-section')?.remove();
  const section = document.createElement('div');
  section.id = 'offline-play-section';
  section.style.cssText = 'display:flex;flex-direction:column;gap:8px;border-top:1px solid #334155;padding-top:14px;';
  host.appendChild(section);

  const render = (state: OfflineState, p?: OfflineProgress) => {
    if (!section.isConnected) return;
    const d = describeOfflineState(state, p, manager.getError(), manager.getRecord()?.bytes ?? 0);
    const pct = p && p.totalBytes ? Math.min(100, Math.round((p.bytes / p.totalBytes) * 100)) : 0;
    section.innerHTML = `
      <span style="font-size:13px;font-weight:700;">📴 OFFLINE PLAY</span>
      <span id="offline-status" style="font-size:12px;line-height:1.4;color:${d.color};">${d.label}</span>
      ${state === 'DOWNLOADING' ? `<div style="height:8px;background:#1e293b;border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:#38bdf8;"></div></div>` : ''}
      ${d.button ? `<button id="offline-toggle-btn" style="min-height:44px;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;background:#1e293b;color:#fff;border:1px solid ${d.color};">${d.button}</button>` : ''}
    `;
    section.querySelector('#offline-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (manager.getState() === 'READY') void manager.disable();
      else void manager.enable();
    });
  };

  const off = manager.onChange(render);
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!section.isConnected) { off(); observer.disconnect(); }
    });
    observer.observe(modal, { childList: true, subtree: true });
  }
  render(manager.getState());
}
