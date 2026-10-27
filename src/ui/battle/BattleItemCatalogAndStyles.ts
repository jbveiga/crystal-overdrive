/**
 * @fileoverview BattleItemCatalogAndStyles domain module implementation.
 * @module ui/battle/BattleItemCatalogAndStyles
 * @role BattleItemCatalogAndStyles Component
 * @exports BattleBagTab, BattleUsableItemMeta, BATTLE_ITEM_CATALOG
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-106: Implementation | L107-212: Handlers & Exports
 */

import type { PokemonType, StatId, MoveData } from '../../types/game';

export type BattleBagTab = 'ALL' | 'MEDICINE' | 'BALLS';

export interface BattleUsableItemMeta {
  id: string;
  name: string;
  badge: string;
  desc: string;
  icon: string;
  color: string;
  kind: 'HEAL_HP' | 'FULL_RESTORE' | 'REVIVE' | 'CURE_STATUS' | 'X_STAT';
  healAmount?: number;
  curesStatus?: string[];
  statBoost?: StatId;
}

export const BATTLE_ITEM_CATALOG: BattleUsableItemMeta[] = [
  { id: 'potion', name: 'Potion', badge: '+20 HP', desc: 'Restores 20 HP to a party Pokémon.', icon: '🧪', color: '#10b981', kind: 'HEAL_HP', healAmount: 20 },
  { id: 'super-potion', name: 'Super Potion', badge: '+50 HP', desc: 'Restores 50 HP to a party Pokémon.', icon: '⚗️', color: '#059669', kind: 'HEAL_HP', healAmount: 50 },
  { id: 'hyper-potion', name: 'Hyper Potion', badge: '+200 HP', desc: 'Restores 200 HP to a party Pokémon.', icon: '🧪', color: '#0284c7', kind: 'HEAL_HP', healAmount: 200 },
  { id: 'max-potion', name: 'Max Potion', badge: 'FULL HP', desc: 'Fully restores HP to a party Pokémon.', icon: '✨', color: '#2563eb', kind: 'HEAL_HP', healAmount: 9999 },
  { id: 'full-restore', name: 'Full Restore', badge: 'FULL + CURE', desc: 'Fully restores HP and cures all status conditions.', icon: '🌟', color: '#eab308', kind: 'FULL_RESTORE', healAmount: 9999 },
  { id: 'fresh-water', name: 'Fresh Water', badge: '+50 HP', desc: 'Mineral water that restores 50 HP.', icon: '💧', color: '#38bdf8', kind: 'HEAL_HP', healAmount: 50 },
  { id: 'soda-pop', name: 'Soda Pop', badge: '+60 HP', desc: 'Fizzy soda that restores 60 HP.', icon: '🥤', color: '#f43f5e', kind: 'HEAL_HP', healAmount: 60 },
  { id: 'lemonade', name: 'Lemonade', badge: '+80 HP', desc: 'Sweet lemonade that restores 80 HP.', icon: '🍋', color: '#facc15', kind: 'HEAL_HP', healAmount: 80 },
  { id: 'moomoo-milk', name: 'Moomoo Milk', badge: '+100 HP', desc: 'Nutritious farm milk that restores 100 HP.', icon: '🥛', color: '#f8fafc', kind: 'HEAL_HP', healAmount: 100 },
  { id: 'berry', name: 'Berry', badge: '+10 HP', desc: 'Natural berry that restores 10 HP.', icon: '🍒', color: '#fb7185', kind: 'HEAL_HP', healAmount: 10 },
  { id: 'gold-berry', name: 'Gold Berry', badge: '+30 HP', desc: 'Rare golden berry that restores 30 HP.', icon: '🍒', color: '#f59e0b', kind: 'HEAL_HP', healAmount: 30 },
  { id: 'antidote', name: 'Antidote', badge: 'CURES PSN', desc: 'Cures a poisoned Pokémon.', icon: '💛', color: '#a855f7', kind: 'CURE_STATUS', curesStatus: ['PSN', 'TOX'] },
  { id: 'parlyz-heal', name: 'Parlyz Heal', badge: 'CURES PAR', desc: 'Cures a paralyzed Pokémon.', icon: '⚡', color: '#eab308', kind: 'CURE_STATUS', curesStatus: ['PAR'] },
  { id: 'awakening', name: 'Awakening', badge: 'WAKES SLP', desc: 'Wakes up a sleeping Pokémon.', icon: '🔔', color: '#38bdf8', kind: 'CURE_STATUS', curesStatus: ['SLP'] },
  { id: 'burn-heal', name: 'Burn Heal', badge: 'CURES BRN', desc: 'Heals a Pokémon suffering from a burn.', icon: '🔥', color: '#ef4444', kind: 'CURE_STATUS', curesStatus: ['BRN'] },
  { id: 'ice-heal', name: 'Ice Heal', badge: 'CURES FRZ', desc: 'Defrosts a frozen Pokémon.', icon: '❄️', color: '#06b6d4', kind: 'CURE_STATUS', curesStatus: ['FRZ'] },
  { id: 'full-heal', name: 'Full Heal', badge: 'CURES ALL', desc: 'Cures any status problem on a party Pokémon.', icon: '💫', color: '#ec4899', kind: 'CURE_STATUS', curesStatus: ['PAR', 'SLP', 'PSN', 'TOX', 'BRN', 'FRZ'] },
  { id: 'revive', name: 'Revive', badge: 'REVIVE 50%', desc: 'Revives a fainted Pokémon and restores half HP.', icon: '💎', color: '#f59e0b', kind: 'REVIVE', healAmount: 0.5 },
  { id: 'max-revive', name: 'Max Revive', badge: 'REVIVE 100%', desc: 'Revives a fainted Pokémon to full HP.', icon: '💎', color: '#ec4899', kind: 'REVIVE', healAmount: 1.0 },
  { id: 'x-attack', name: 'X Attack', badge: 'ATK +1', desc: 'Raises Attack of the active Pokémon by 1 stage.', icon: '⚔️', color: '#ef4444', kind: 'X_STAT', statBoost: 'atk' },
  { id: 'x-defend', name: 'X Defend', badge: 'DEF +1', desc: 'Raises Defense of the active Pokémon by 1 stage.', icon: '🛡️', color: '#3b82f6', kind: 'X_STAT', statBoost: 'def' },
  { id: 'x-speed', name: 'X Speed', badge: 'SPE +1', desc: 'Raises Speed of the active Pokémon by 1 stage.', icon: '💨', color: '#10b981', kind: 'X_STAT', statBoost: 'spe' },
  { id: 'x-special', name: 'X Special', badge: 'SPA +1', desc: 'Raises Sp. Atk of the active Pokémon by 1 stage.', icon: '🔮', color: '#a855f7', kind: 'X_STAT', statBoost: 'spa' },
];

export const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: '#94a3b8',
  Fire: '#ef4444',
  Water: '#3b82f6',
  Grass: '#22c55e',
  Electric: '#eab308',
  Ice: '#06b6d4',
  Fighting: '#c2410c',
  Poison: '#a855f7',
  Ground: '#d97706',
  Flying: '#6366f1',
  Psychic: '#ec4899',
  Bug: '#84cc16',
  Rock: '#78716c',
  Ghost: '#6d28d9',
  Dragon: '#4f46e5',
  Steel: '#64748b',
  Dark: '#334155',
};

export const STATUS_COLORS: Record<string, string> = {
  PAR: '#eab308',
  SLP: '#64748b',
  FRZ: '#06b6d4',
  BRN: '#ef4444',
  PSN: '#a855f7',
  TOX: '#9333ea',
};

export const MOVE_SHORTCUT_LABELS = ['1 / Q', '2 / W', '3 / A', '4 / S'];

export { injectKeyframeStyles, createBattleHUDTemplateHtml } from "../styles/battleHudStyles";

export function getCategorySvg(category: 'Physical' | 'Special' | 'Status'): string {
  if (category === 'Physical') {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#dc2626" stroke-width="1.5" title="Physical Move">
      <polygon points="12,2 14.8,8.5 22,9.2 16.5,14 18.2,21 12,17.3 5.8,21 7.5,14 2,9.2 9.2,8.5"/>
    </svg>`;
  }
  if (category === 'Special') {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" title="Special Move">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="12" cy="12" r="1.5" fill="#38bdf8"/>
    </svg>`;
  }
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" title="Status Move">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`;
}

export function getGenderOrLegendBadge(speciesId: string): string {
  if (['raikou', 'entei', 'suicune'].includes(speciesId)) {
    return `<span style="color: #facc15; font-size: 13px;" title="Legendary Beast">★</span>`;
  }
  const isFemale = ['chikorita', 'sentret', 'pidgey'].includes(speciesId);
  return isFemale
    ? `<span style="color: #f43f5e; font-size: 13px; font-weight: 800;">♀</span>`
    : `<span style="color: #38bdf8; font-size: 13px; font-weight: 800;">♂</span>`;
}

export function getMoveEffectDescription(moveData: MoveData): string {
  const parts: string[] = [];
  if (moveData.priority > 0) {
    parts.push(`Priority +${moveData.priority} (strikes first).`);
  } else if (moveData.priority < 0) {
    parts.push(`Priority ${moveData.priority} (strikes last).`);
  }
  if (moveData.trapsTarget) {
    parts.push('Prevents target from fleeing or switching.');
  }
  if (moveData.leavesOneHp) {
    parts.push('Always leaves the target with at least 1 HP.');
  }
  if (moveData.id === 'furycutter') {
    parts.push('Power doubles with each consecutive hit (up to 160).');
  }
  if (moveData.id === 'swift') {
    parts.push('Bypasses accuracy checks and never misses.');
  }
  if (moveData.inflictsStatus && moveData.inflictsStatus !== 'NONE') {
    parts.push(`Inflicts ${moveData.inflictsStatus} status on the target.`);
  }
  if (moveData.secondaryStatus) {
    const pct = Math.round(moveData.secondaryStatus.chance * 100);
    parts.push(`${pct}% chance to inflict ${moveData.secondaryStatus.status}.`);
  }
  if (moveData.statChanges) {
    const statNames: Record<StatId, string> = {
      atk: 'Attack',
      def: 'Defense',
      spa: 'Sp. Atk',
      spd: 'Sp. Def',
      spe: 'Speed',
      acc: 'Accuracy',
      eva: 'Evasion',
    };
    const who = moveData.statChanges.target === 'self' ? "user's" : "foe's";
    const dir = moveData.statChanges.stages > 0 ? 'Raises' : 'Lowers';
    const amt = Math.abs(moveData.statChanges.stages);
    parts.push(`${dir} ${who} ${statNames[moveData.statChanges.stat]} by ${amt} stage${amt > 1 ? 's' : ''}.`);
  }
  if (parts.length === 0) {
    parts.push(`Deals ${moveData.category.toLowerCase()} ${moveData.type}-type damage.`);
  }
  return parts.join(' ');
}

export function renderPartyDockHtml(playerParty: any[]): string {
  let html = '';
  for (let i = 0; i < 6; i++) {
    const member = playerParty[i];
    if (!member) {
      html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #0f172a; border: 1.5px solid #334155; display: inline-block;" title="Empty Slot"></span>`;
    } else if (member.currentHp <= 0) {
      html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #7f1d1d; border: 1.5px solid #ef4444; opacity: 0.55; display: inline-block;" title="${member.nickname} (Fainted)"></span>`;
    } else if (member.status && member.status !== 'NONE') {
      html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #fef08a; display: inline-block;" title="${member.nickname} (${member.status})"></span>`;
    } else {
      html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #22c55e; border: 1.5px solid #bbf7d0; box-shadow: 0 0 4px rgba(34, 197, 94, 0.7); display: inline-block;" title="${member.nickname} (Healthy)"></span>`;
    }
  }
  return html;
}

export function renderStatusBadgesHtml(pkmn: any): string {
  if (!pkmn) return '';
  let html = '';
  if (pkmn.status && pkmn.status !== 'NONE') {
    const bg = STATUS_COLORS[pkmn.status] || '#64748b';
    html += `<span class="status-condition-badge" style="background: ${bg}; color: white; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">${pkmn.status}</span>`;
  }
  if (pkmn.isTrapped) {
    html += `<span style="background: #7c3aed; color: white; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">🔒 TRAPPED</span>`;
  }
  if (pkmn.statStages) {
    const shortLabels: Record<string, string> = {
      atk: 'ATK',
      def: 'DEF',
      spa: 'SPA',
      spd: 'SPD',
      spe: 'SPE',
      acc: 'ACC',
      eva: 'EVA',
    };
    for (const [k, v] of Object.entries(pkmn.statStages) as Array<[string, number]>) {
      if (v !== 0) {
        const isBoost = v > 0;
        const bg = isBoost ? 'rgba(6, 78, 59, 0.9)' : 'rgba(136, 19, 55, 0.9)';
        const border = isBoost ? '#10b981' : '#f43f5e';
        const textCol = isBoost ? '#6ee7b7' : '#fda4af';
        const sign = isBoost ? `+${v}` : `${v}`;
        const arrow = isBoost ? '▲' : '▼';
        html += `<span class="stat-stage-badge" data-stat="${k}" data-stage="${v}" title="${shortLabels[k]} Stage ${sign}" style="background: ${bg}; color: ${textCol}; border: 1px solid ${border}; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; font-family: monospace;">${shortLabels[k]}${sign}${arrow}</span>`;
      }
    }
  }
  return html;
}

