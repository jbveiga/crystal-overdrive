import type { GridEntity } from '../world/GridPhysics';
import type { MapManager } from '../world/MapManager';
import type { PokemonInstance } from '../types/game';
import type { BagInventory } from './BagAndMartUI';

export interface BugReportContext {
  uiOverlay: HTMLElement;
  mapManager: MapManager;
  player: GridEntity;
  getGameState: () => string;
  inventory: BagInventory;
  playerParty: PokemonInstance[];
}

export function mountGitHubReportButton(ctx: BugReportContext): void {
  const { uiOverlay, mapManager, player, getGameState, inventory, playerParty } = ctx;
  const existingBtn = document.getElementById('github-report-issue-btn');
  if (existingBtn) existingBtn.remove();

  const reportBtn = document.createElement('button');
  reportBtn.id = 'github-report-issue-btn';
  reportBtn.type = 'button';
  reportBtn.title = 'Report Bug on GitHub (Captures Screenshot & Diagnostics)';
  reportBtn.setAttribute('aria-label', 'Report Bug on GitHub');
  reportBtn.style.cssText = `
    position: fixed;
    top: max(88px, calc(env(safe-area-inset-top, 12px) + 76px));
    right: max(12px, env(safe-area-inset-right, 12px));
    background: rgba(13, 19, 34, 0.92);
    color: #F8FAFC;
    border: 2px solid #22324F;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 3px 0 0 #070B14;
    z-index: 50;
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    transition: transform 0.1s ease, border-color 0.15s ease;
  `;
  reportBtn.innerHTML = `<span>📸</span><span>BUG</span>`;

  reportBtn.addEventListener('mouseenter', () => {
    reportBtn.style.transform = 'translateY(-1px)';
    reportBtn.style.borderColor = '#38BDF8';
  });
  reportBtn.addEventListener('mouseleave', () => {
    reportBtn.style.transform = 'translateY(0px)';
    reportBtn.style.borderColor = '#22324F';
  });

  reportBtn.addEventListener('click', async () => {
    let screenshotDataUrl = '';
    let copiedToClipboard = false;
    try {
      const glCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (glCanvas) {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const blobPromise = new Promise<Blob | null>((resolve) =>
            glCanvas.toBlob((b) => resolve(b), 'image/png')
          );
          const blob = await blobPromise;
          if (blob) {
            screenshotDataUrl = URL.createObjectURL(blob);
            try {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              copiedToClipboard = true;
            } catch {
              // Browser permission or focus restriction fallback
            }
          }
        } else {
          screenshotDataUrl = glCanvas.toDataURL('image/png');
        }
      }
    } catch (err) {
      console.warn('Screenshot capture fallback:', err);
    }

    const activeMapId = mapManager.getCurrentMap()?.id || 'unknown';
    const issueTitle = encodeURIComponent(
      `[Bug Report] Issue at ${activeMapId} (${player.x}, ${player.y})`
    );
    const issueBody = encodeURIComponent(
      [
        '### Issue Description',
        'Describe what happened:',
        '',
        '### Screenshot',
        copiedToClipboard
          ? '*(📸 Screenshot is copied to your clipboard — press **Ctrl+V** or **Cmd+V** right here to paste it!)*'
          : '*(Attach or drag-and-drop your downloaded screenshot below)*',
        '',
        '### Game Diagnostics',
        `- **Map**: \`${activeMapId}\` (\`${player.x}, ${player.y}\`, facing \`${player.direction}\`)`,
        `- **State**: \`${getGameState()}\``,
        `- **Badges**: ${inventory.badges.length} (${inventory.badges.join(', ') || 'none'})`,
        `- **Party**: ${playerParty.map((p) => `${p.nickname || p.speciesId} Lv.${p.level}`).join(', ') || 'Empty'}`,
        `- **Viewport**: ${window.innerWidth}x${window.innerHeight}`,
      ].join('\n')
    );
    const githubIssueUrl = `https://github.com/jbveiga/crystal-overdrive/issues/new?title=${issueTitle}&body=${issueBody}`;

    const existingCard = document.getElementById('github-report-modal-card');
    existingCard?.remove();

    const modalCard = document.createElement('div');
    modalCard.id = 'github-report-modal-card';
    modalCard.style.cssText = `
      position: fixed;
      top: max(136px, calc(env(safe-area-inset-top, 12px) + 124px));
      right: max(12px, env(safe-area-inset-right, 12px));
      width: 310px;
      max-width: 90vw;
      background: #0D1322;
      border: 2px solid #38BDF8;
      border-radius: 12px;
      padding: 14px;
      z-index: 99;
      pointer-events: auto;
      color: #F8FAFC;
      box-shadow: 0 6px 0 0 #070B14;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    modalCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 800; color: #38BDF8; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">📸 SCREENSHOT CAPTURED</span>
        <button id="close-report-card-btn" aria-label="Close Report Dialog" style="background: none; border: none; color: #94A3B8; font-size: 14px; cursor: pointer; font-family: 'Space Mono', monospace; font-weight: 800;">✕</button>
      </div>
      ${
        screenshotDataUrl
          ? `<div style="background: #141E33; border: 1.5px solid #22324F; border-radius: 6px; overflow: hidden; display: flex;"><img src="${screenshotDataUrl}" alt="Current Screen Capture" style="width: 100%; height: 110px; object-fit: cover;" /></div>`
          : ''
      }
      <div style="font-size: 11.5px; color: #CBD5E1; line-height: 1.5; display: flex; flex-direction: column; gap: 4px;">
        <div><strong>1. Save screenshot:</strong> Tap below to download the PNG image.</div>
        <div><strong>2. Open issue:</strong> Tap the link to open GitHub, fill in details, and attach the image.</div>
        ${
          copiedToClipboard
            ? '<div style="color: #38BDF8; font-size: 10.5px; font-family: \'Space Mono\', monospace;"><em>(Desktop: Also copied to clipboard)</em></div>'
            : ''
        }
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${
          screenshotDataUrl
            ? `<a id="github-screenshot-download-link" href="${screenshotDataUrl}" download="crystal-overdrive-${activeMapId}.png" style="
                display: block;
                text-align: center;
                text-decoration: none;
                background: #2563EB;
                color: #FFFFFF;
                border: 1.5px solid #60A5FA;
                border-radius: 8px;
                padding: 9px 12px;
                font-size: 12px;
                font-weight: 800;
                box-shadow: 0 3px 0 0 #070B14;
                font-family: 'Space Mono', monospace;
              ">💾 SAVE SCREENSHOT PNG</a>`
            : ''
        }
        <a id="github-issues-redirect-link" href="${githubIssueUrl}" target="_blank" rel="noopener noreferrer" style="
          display: block;
          text-align: center;
          text-decoration: none;
          background: #141E33;
          color: #38BDF8;
          border: 1.5px solid #38BDF8;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">🚀 OPEN GITHUB ISSUE ↗</a>
      </div>
    `;
    uiOverlay.appendChild(modalCard);

    modalCard.querySelector('#close-report-card-btn')?.addEventListener('click', () => {
      modalCard.remove();
    });
  });

  uiOverlay.appendChild(reportBtn);
}
