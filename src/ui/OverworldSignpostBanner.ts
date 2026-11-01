/**
 * @fileoverview Route name and landmark signpost banner logic for OverworldHUD.
 * @module ui/OverworldSignpostBanner
 * @layer ui
 */

export function updateRouteNameBanner(banner: HTMLElement | null, name: string): void {
  if (!banner) return;
  const lower = name.toLowerCase();
  let icon = '🏛️';
  let bg = 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)';
  let border = '2px solid #38bdf8';
  let accentColor = '#7dd3fc';

  if (lower.includes('route') || lower.includes('forest') || lower.includes('park') || lower.includes('path')) {
    icon = '🌲';
    bg = 'linear-gradient(135deg, rgba(120, 53, 15, 0.95) 0%, rgba(69, 26, 3, 0.98) 100%)';
    border = '2px solid #f59e0b';
    accentColor = '#fef08a';
  } else if (
    lower.includes('cave') ||
    lower.includes('ruin') ||
    lower.includes('tower') ||
    lower.includes('tunnel') ||
    lower.includes('mount') ||
    lower.includes('mt.') ||
    lower.includes('den')
  ) {
    icon = '🪨';
    bg = 'linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)';
    border = '2px solid #94a3b8';
    accentColor = '#e2e8f0';
  } else if (
    lower.includes('whirl') ||
    lower.includes('lake') ||
    lower.includes('sea') ||
    lower.includes('water') ||
    lower.includes('beach') ||
    lower.includes('port')
  ) {
    icon = '🌊';
    bg = 'linear-gradient(135deg, rgba(3, 105, 161, 0.95) 0%, rgba(8, 47, 73, 0.98) 100%)';
    border = '2px solid #38bdf8';
    accentColor = '#67e8f9';
  }

  banner.style.background = bg;
  banner.style.border = border;
  banner.style.boxShadow = '0 6px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.2)';
  banner.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.24s ease';
  banner.style.transform = 'translateY(-6px) scale(0.96)';
  banner.innerHTML = `<span style="margin-right: 6px;">${icon}</span><span style="color: ${accentColor}; font-weight: 800; letter-spacing: 0.6px;">${name.toUpperCase()}</span>`;
  setTimeout(() => {
    if (banner) {
      banner.style.transform = 'translateY(0px) scale(1.0)';
    }
  }, 20);
}
