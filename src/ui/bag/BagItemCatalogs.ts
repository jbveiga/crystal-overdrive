/**
 * @fileoverview BagItemCatalogs domain module implementation.
 * @module ui/bag/BagItemCatalogs
 * @role BagItemCatalogs Component
 * @exports BagInventory, TMDefinition, MartBallItem
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-199: Implementation | L200-398: Handlers & Exports
 */

import type { PokeballId, MedicineId, RepelId } from '../../types/game';

export interface BagInventory {
  balls: Partial<Record<PokeballId, number>>;
  items?: Partial<Record<string, number>>;
  berries?: Partial<Record<string, number>>;
  tms: string[];
  money: number;
  badges: string[];
  keyItems?: string[];
}

export interface TMDefinition {
  id: string; // e.g. 'TM54'
  moveId: string; // 'falseswipe'
  name: string;
  type: string;
  desc: string;
}

export interface MartBallItem {
  id: PokeballId;
  name: string;
  price: number;
  requiredBadges: number;
  multiplierLabel: string;
  desc: string;
}

export interface MedicineItemDef {
  id: MedicineId;
  name: string;
  price: number;
  badgeLabel: string;
  desc: string;
  icon: string;
  farmExclusive?: boolean;
  deptStoreFloor?: '3F' | '4F' | '6F';
}

export const MART_MEDICINE_CATALOG: MedicineItemDef[] = [
  { id: 'potion', name: 'Potion', price: 300, badgeLabel: '+20 HP', desc: 'A spray-type medicine for wounds. Restores the HP of one Pokémon by 20 points.', icon: '🧪', },
  { id: 'super-potion', name: 'Super Potion', price: 700, badgeLabel: '+50 HP', desc: 'A concentrated spray-type medicine. Restores the HP of one Pokémon by 50 points.', icon: '⚗️', },
  { id: 'moomoo-milk', name: 'Moomoo Milk', price: 500, badgeLabel: '+100 HP', desc: 'Nutritious farm milk rich in calcium. Restores the HP of one Pokémon by 100 points.', icon: '🥛', farmExclusive: true, },
  { id: 'antidote', name: 'Antidote', price: 100, badgeLabel: 'CURES PSN', desc: 'A spray-type medicine that lifts the effects of poison from one Pokémon.', icon: '💛', },
  { id: 'parlyz-heal', name: 'Parlyz Heal', price: 200, badgeLabel: 'CURES PAR', desc: 'A spray-type medicine that eliminates paralysis from a single Pokémon.', icon: '⚡', },
  { id: 'awakening', name: 'Awakening', price: 250, badgeLabel: 'WAKES SLP', desc: 'A spray-type medicine that awakens a sleeping Pokémon immediately.', icon: '🔔', },
  { id: 'revive', name: 'Revive', price: 1500, badgeLabel: 'REVIVE 50%', desc: 'A medicine that revives a fainted Pokémon and restores half its maximum HP.', icon: '💎', },
  // 6F Drinks
  { id: 'fresh-water', name: 'Fresh Water', price: 200, badgeLabel: '+50 HP', desc: 'Mineral water from Mt. Silver. Restores the HP of one Pokémon by 50 points.', icon: '💧', farmExclusive: true, deptStoreFloor: '6F', },
  { id: 'soda-pop', name: 'Soda Pop', price: 300, badgeLabel: '+60 HP', desc: 'A fizzy soda drink. Restores the HP of one Pokémon by 60 points.', icon: '🥤', farmExclusive: true, deptStoreFloor: '6F', },
  { id: 'lemonade', name: 'Lemonade', price: 350, badgeLabel: '+80 HP', desc: 'A very sweet citrus drink. Restores the HP of one Pokémon by 80 points.', icon: '🍋', farmExclusive: true, deptStoreFloor: '6F', },
  // 4F Permanent Stat Vitamins
  { id: 'hp-up', name: 'HP Up', price: 9800, badgeLabel: '+HP STAT', desc: 'A nutritious drink that permanently raises the base HP stat and friendship of one Pokémon.', icon: '❤️', farmExclusive: true, deptStoreFloor: '4F', },
  { id: 'protein', name: 'Protein', price: 9800, badgeLabel: '+ATK STAT', desc: 'A nutritious drink that permanently raises the Attack stat and friendship of one Pokémon.', icon: '💪', farmExclusive: true, deptStoreFloor: '4F', },
  { id: 'iron', name: 'Iron', price: 9800, badgeLabel: '+DEF STAT', desc: 'A nutritious drink that permanently raises the Defense stat and friendship of one Pokémon.', icon: '🛡️', farmExclusive: true, deptStoreFloor: '4F', },
  { id: 'carbos', name: 'Carbos', price: 9800, badgeLabel: '+SPE STAT', desc: 'A nutritious drink that permanently raises the Speed stat and friendship of one Pokémon.', icon: '⚡', farmExclusive: true, deptStoreFloor: '4F', },
  { id: 'calcium', name: 'Calcium', price: 9800, badgeLabel: '+SPA STAT', desc: 'A nutritious drink that permanently raises the Special stats and friendship of one Pokémon.', icon: '🔮', farmExclusive: true, deptStoreFloor: '4F', },
  // 3F Battle Collection Enhancers
  { id: 'x-attack', name: 'X Attack', price: 500, badgeLabel: '+ATK BOOST', desc: 'Sharply boosts Attack power and battle readiness.', icon: '⚔️', farmExclusive: true, deptStoreFloor: '3F', },
  { id: 'x-defend', name: 'X Defend', price: 550, badgeLabel: '+DEF BOOST', desc: 'Sharply boosts Defense and resilience.', icon: '🛡️', farmExclusive: true, deptStoreFloor: '3F', },
  { id: 'x-speed', name: 'X Speed', price: 350, badgeLabel: '+SPE BOOST', desc: 'Sharply boosts Speed and agility.', icon: '💨', farmExclusive: true, deptStoreFloor: '3F', },
  { id: 'x-special', name: 'X Special', price: 350, badgeLabel: '+SPA BOOST', desc: 'Sharply boosts Special Attack and focus.', icon: '✨', farmExclusive: true, deptStoreFloor: '3F', },
  { id: 'dire-hit', name: 'Dire Hit', price: 650, badgeLabel: '+CRIT RATE', desc: 'Focuses energy to raise critical-hit ratio.', icon: '🎯', farmExclusive: true, deptStoreFloor: '3F', },
  { id: 'guard-spec', name: 'Guard Spec.', price: 700, badgeLabel: 'STAT GUARD', desc: 'Prevents stat reduction from enemy moves.', icon: '🔰', farmExclusive: true, deptStoreFloor: '3F', },
];

export interface RepelItemDef {
  id: RepelId;
  name: string;
  price: number;
  steps: number;
  badgeLabel: string;
  desc: string;
  icon: string;
}

export const MART_REPEL_CATALOG: RepelItemDef[] = [
  { id: 'repel', name: 'Repel', price: 350, steps: 100, badgeLabel: '100 STEPS', desc: 'An aerosol spray that keeps wild Pokémon away for 100 steps.', icon: '🛡️', },
  { id: 'super-repel', name: 'Super Repel', price: 500, steps: 200, badgeLabel: '200 STEPS', desc: 'Keeps wild Pokémon away for 200 steps. Lasts twice as long as standard Repel.', icon: '🛡️', },
  { id: 'max-repel', name: 'Max Repel', price: 700, steps: 250, badgeLabel: '250 STEPS', desc: 'Maximum-strength spray that keeps wild Pokémon away for 250 steps.', icon: '🛡️', },
];

export const MART_POKEBALL_CATALOG: MartBallItem[] = [
  { id: 'poke-ball', name: 'Poké Ball', price: 200, requiredBadges: 0, multiplierLabel: '1.0x', desc: 'Standard device for catching wild Pokémon.', },
  { id: 'great-ball', name: 'Great Ball', price: 600, requiredBadges: 1, multiplierLabel: '1.5x', desc: 'High-performance Ball with a higher catch rate than a Poké Ball.', },
  { id: 'net-ball', name: 'Net Ball', price: 1000, requiredBadges: 1, multiplierLabel: '3.5x Water/Bug', desc: 'Works especially well on Water- and Bug-type Pokémon (ideal for Suicune!).', },
  { id: 'nest-ball', name: 'Nest Ball', price: 1000, requiredBadges: 1, multiplierLabel: 'Up to 4.0x', desc: 'Works better the lower the wild Pokémon level is.', },
  { id: 'ultra-ball', name: 'Ultra Ball', price: 800, requiredBadges: 3, multiplierLabel: '2.0x', desc: 'Ultra-high performance Ball with double the standard catch rate.', },
  { id: 'quick-ball', name: 'Quick Ball', price: 1000, requiredBadges: 3, multiplierLabel: '5.0x Turn 1', desc: 'Provides a 5.0x catch multiplier if thrown on the very first turn of battle!', },
  { id: 'dusk-ball', name: 'Dusk Ball', price: 1000, requiredBadges: 3, multiplierLabel: '3.0x Night/Cave', desc: 'Makes it easier to catch wild Pokémon at night or inside dark caves.', },
  { id: 'timer-ball', name: 'Timer Ball', price: 1000, requiredBadges: 5, multiplierLabel: 'Up to 4.0x', desc: 'Becomes progressively more effective the more turns are taken in battle.', },
  { id: 'repeat-ball', name: 'Repeat Ball', price: 1000, requiredBadges: 5, multiplierLabel: '3.5x Registered', desc: 'Works especially well on Pokémon species that have been caught before.', },
  { id: 'fast-ball', name: 'Fast Ball', price: 1000, requiredBadges: 5, multiplierLabel: '4.0x Speed ≥ 100', desc: '4.0x catch rate on Pokémon with Base Speed ≥ 100 (Raikou, Entei & Suicune!).', },
  { id: 'dream-ball', name: 'Dream Ball', price: 1200, requiredBadges: 8, multiplierLabel: '4.0x Asleep', desc: '4.0x catch multiplier when the target Pokémon is asleep (SLP).', },
];

export const INFINITE_TMS: Record<string, TMDefinition> = {
  // --- Hidden Machines (HM01 - HM07) ---
  HM01: {
    id: 'HM01',
    moveId: 'cut',
    name: 'Cut',
    type: 'Normal',
    desc: '50 Power Normal attack. Cuts down small overworld trees (Hive Badge; no move slot needed).',
  },
  HM02: {
    id: 'HM02',
    moveId: 'fly',
    name: 'Fly',
    type: 'Flying',
    desc: '70 Power Flying attack. Soars into the sky on turn 1 and strikes on turn 2. Flies to visited towns (Storm Badge).',
  },
  HM03: {
    id: 'HM03',
    moveId: 'surf',
    name: 'Surf',
    type: 'Water',
    desc: '95 Power Water attack. Carries the player across water (Fog Badge; no move slot needed).',
  },
  HM04: {
    id: 'HM04',
    moveId: 'strength',
    name: 'Strength',
    type: 'Normal',
    desc: '80 Power Normal attack. Pushes heavy overworld boulders (Plain Badge; no move slot needed).',
  },
  HM05: {
    id: 'HM05',
    moveId: 'flash',
    name: 'Flash',
    type: 'Normal',
    desc: 'Illuminates dark caves in the field (Zephyr Badge; no move slot needed) and lowers target accuracy in battle.',
  },
  HM06: {
    id: 'HM06',
    moveId: 'whirlpool',
    name: 'Whirlpool',
    type: 'Water',
    desc: '15 Power Water attack that traps the target in a vortex. Crosses ocean whirlpools (Glacier Badge).',
  },
  HM07: {
    id: 'HM07',
    moveId: 'waterfall',
    name: 'Waterfall',
    type: 'Water',
    desc: '80 Power Water attack. Charges with enough momentum to scale rushing waterfalls (Rising Badge).',
  },

  // --- Technical Machines (TM01 - TM50) ---
  TM01: {
    id: 'TM01',
    moveId: 'dynamicpunch',
    name: 'DynamicPunch',
    type: 'Fighting',
    desc: '100 Power Fighting attack that always confuses the target if it hits.',
  },
  TM02: {
    id: 'TM02',
    moveId: 'headbutt',
    name: 'Headbutt',
    type: 'Normal',
    desc: '70 Power Normal attack that may cause flinching. Shakes forest trees.',
  },
  TM03: {
    id: 'TM03',
    moveId: 'curse',
    name: 'Curse',
    type: 'Ghost',
    desc: 'Ghost types pay half max HP to curse the foe; other types raise Attack & Defense while lowering Speed.',
  },
  TM04: {
    id: 'TM04',
    moveId: 'rollout',
    name: 'Rollout',
    type: 'Rock',
    desc: '30 Power Rock attack that rolls for 5 turns, doubling in power each consecutive hit.',
  },
  TM05: {
    id: 'TM05',
    moveId: 'roar',
    name: 'Roar',
    type: 'Normal',
    desc: 'Scents out wild foes to end battle or forces opponent to switch Pokémon in trainer matches.',
  },
  TM06: {
    id: 'TM06',
    moveId: 'toxic',
    name: 'Toxic',
    type: 'Poison',
    desc: 'Badly poisons the target with damage that steadily intensifies each turn.',
  },
  TM07: {
    id: 'TM07',
    moveId: 'zapcannon',
    name: 'Zap Cannon',
    type: 'Electric',
    desc: '100 Power Electric attack that is guaranteed to paralyze the target if it connects.',
  },
  TM08: {
    id: 'TM08',
    moveId: 'rocksmash',
    name: 'Rock Smash',
    type: 'Fighting',
    desc: '20 Power Fighting attack that may lower Defense and shatters cracked boulders.',
  },
  TM09: {
    id: 'TM09',
    moveId: 'psychup',
    name: 'Psych Up',
    type: 'Normal',
    desc: 'Hypnotizes the user into copying all stat changes of the target.',
  },
  TM10: {
    id: 'TM10',
    moveId: 'hiddenpower',
    name: 'Hidden Power',
    type: 'Normal',
    desc: 'Special attack whose type and damage power vary according to the Pokémon individual values.',
  },
  TM11: {
    id: 'TM11',
    moveId: 'sunnyday',
    name: 'Sunny Day',
    type: 'Fire',
    desc: 'Intensifies sunlight for 5 turns, boosting Fire moves by 50% and weakening Water moves.',
  },
  TM12: {
    id: 'TM12',
    moveId: 'sweetscent',
    name: 'Sweet Scent',
    type: 'Normal',
    desc: 'Lowers foe evasiveness in battle; lures wild Pokémon when used in grass or caves.',
  },
  TM13: {
    id: 'TM13',
    moveId: 'snore',
    name: 'Snore',
    type: 'Normal',
    desc: '40 Power Normal attack that can be used while asleep and may cause flinching.',
  },
  TM14: {
    id: 'TM14',
    moveId: 'blizzard',
    name: 'Blizzard',
    type: 'Ice',
    desc: '120 Power Ice attack that may freeze the target.',
  },
  TM15: {
    id: 'TM15',
    moveId: 'hyperbeam',
    name: 'Hyper Beam',
    type: 'Normal',
    desc: '150 Power Normal attack with devastating force. Must recharge on the next turn.',
  },
  TM16: {
    id: 'TM16',
    moveId: 'icywind',
    name: 'Icy Wind',
    type: 'Ice',
    desc: '55 Power chilling attack that inflicts damage and always lowers target Speed.',
  },
  TM17: {
    id: 'TM17',
    moveId: 'protect',
    name: 'Protect',
    type: 'Normal',
    desc: 'Completely evades all attacks for one turn. Chance of failure rises if used consecutively.',
  },
  TM18: {
    id: 'TM18',
    moveId: 'raindance',
    name: 'Rain Dance',
    type: 'Water',
    desc: 'Causes heavy rainfall for 5 turns, boosting Water moves by 50% and weakening Fire moves.',
  },
  TM19: {
    id: 'TM19',
    moveId: 'gigadrain',
    name: 'Giga Drain',
    type: 'Grass',
    desc: '60 Power Grass attack that restores HP equal to half the damage inflicted.',
  },
  TM20: {
    id: 'TM20',
    moveId: 'endure',
    name: 'Endure',
    type: 'Normal',
    desc: 'Always leaves the user with at least 1 HP when struck by a fatal hit this turn.',
  },
  TM21: {
    id: 'TM21',
    moveId: 'frustration',
    name: 'Frustration',
    type: 'Normal',
    desc: 'Up to 102 Power Normal attack that hits harder the lower the user friendship.',
  },
  TM22: {
    id: 'TM22',
    moveId: 'solarbeam',
    name: 'Solar Beam',
    type: 'Grass',
    desc: '120 Power Grass attack that absorbs light on turn 1 and blasts energy on turn 2.',
  },
  TM23: {
    id: 'TM23',
    moveId: 'irontail',
    name: 'Iron Tail',
    type: 'Steel',
    desc: '100 Power Steel attack using a hardened tail that may lower target Defense.',
  },
  TM24: {
    id: 'TM24',
    moveId: 'dragonbreath',
    name: 'DragonBreath',
    type: 'Dragon',
    desc: '60 Power Dragon breath blast that strikes the target and may inflict paralysis.',
  },
  TM25: {
    id: 'TM25',
    moveId: 'thunder',
    name: 'Thunder',
    type: 'Electric',
    desc: '120 Power Electric attack that strikes with lightning and may paralyze the target.',
  },
  TM26: {
    id: 'TM26',
    moveId: 'earthquake',
    name: 'Earthquake',
    type: 'Ground',
    desc: '100 Power Ground attack that violently shakes the ground, dealing double damage to Underground foes.',
  },
  TM27: {
    id: 'TM27',
    moveId: 'return',
    name: 'Return',
    type: 'Normal',
    desc: 'Up to 102 Power Normal attack that grows stronger with high friendship.',
  },
  TM28: {
    id: 'TM28',
    moveId: 'dig',
    name: 'Dig',
    type: 'Ground',
    desc: '60 Power Ground attack. Burrows underground on turn 1 and attacks on turn 2. Escapes caves.',
  },
  TM29: {
    id: 'TM29',
    moveId: 'psychic',
    name: 'Psychic',
    type: 'Psychic',
    desc: '90 Power telekinetic blast that may lower the target Special Defense.',
  },
  TM30: {
    id: 'TM30',
    moveId: 'shadowball',
    name: 'Shadow Ball',
    type: 'Ghost',
    desc: '80 Power Ghost attack that hurls shadowy energy and may lower target Special Defense.',
  },
  TM31: {
    id: 'TM31',
    moveId: 'mudslap',
    name: 'Mud-Slap',
    type: 'Ground',
    desc: '20 Power Ground attack that inflicts damage and lowers target accuracy.',
  },
  TM32: {
    id: 'TM32',
    moveId: 'doubleteam',
    name: 'Double Team',
    type: 'Normal',
    desc: 'Creates illusory copies of the user to raise evasiveness in battle.',
  },
  TM33: {
    id: 'TM33',
    moveId: 'icepunch',
    name: 'Ice Punch',
    type: 'Ice',
    desc: '75 Power Ice attack that may freeze the target.',
  },
  TM34: {
    id: 'TM34',
    moveId: 'swagger',
    name: 'Swagger',
    type: 'Normal',
    desc: 'Confuses the target and sharply raises its Attack stat.',
  },
  TM35: {
    id: 'TM35',
    moveId: 'sleeptalk',
    name: 'Sleep Talk',
    type: 'Normal',
    desc: 'While asleep, randomly uses one of the user other known moves.',
  },
  TM36: {
    id: 'TM36',
    moveId: 'sludgebomb',
    name: 'Sludge Bomb',
    type: 'Poison',
    desc: '90 Power Poison attack that hurls toxic sludge and may poison the target.',
  },
  TM37: {
    id: 'TM37',
    moveId: 'sandstorm',
    name: 'Sandstorm',
    type: 'Rock',
    desc: 'Summons a raging sandstorm for 5 turns, buffeting all non-Rock, Ground, or Steel types.',
  },
  TM38: {
    id: 'TM38',
    moveId: 'fireblast',
    name: 'Fire Blast',
    type: 'Fire',
    desc: '120 Power Fire attack that incinerates with a fiery star and may burn the target.',
  },
  TM39: {
    id: 'TM39',
    moveId: 'swift',
    name: 'Swift',
    type: 'Normal',
    desc: '60 Power Normal attack that fires star-shaped rays that never miss the target.',
  },
  TM40: {
    id: 'TM40',
    moveId: 'defensecurl',
    name: 'Defense Curl',
    type: 'Normal',
    desc: 'Curls up compactly to boost Defense. Doubles the power of Rollout when used beforehand.',
  },
  TM41: {
    id: 'TM41',
    moveId: 'thunderpunch',
    name: 'ThunderPunch',
    type: 'Electric',
    desc: '75 Power Electric attack that may paralyze the target.',
  },
  TM42: {
    id: 'TM42',
    moveId: 'dreameater',
    name: 'Dream Eater',
    type: 'Psychic',
    desc: '100 Power Psychic attack that drains 1/2 damage dealt from a sleeping foe.',
  },
  TM43: {
    id: 'TM43',
    moveId: 'detect',
    name: 'Detect',
    type: 'Fighting',
    desc: 'Completely evades all attacks for one turn. Chance of failure rises if used consecutively.',
  },
  TM44: {
    id: 'TM44',
    moveId: 'rest',
    name: 'Rest',
    type: 'Psychic',
    desc: 'The user sleeps for two turns to fully restore HP and cure all status ailments.',
  },
  TM45: {
    id: 'TM45',
    moveId: 'attract',
    name: 'Attract',
    type: 'Normal',
    desc: 'Infatuates opposite-gender targets, giving them a 50% chance to fail attacking each turn.',
  },
  TM46: {
    id: 'TM46',
    moveId: 'thief',
    name: 'Thief',
    type: 'Dark',
    desc: '40 Power Dark attack that attacks and steals any wild or enemy held item.',
  },
  TM47: {
    id: 'TM47',
    moveId: 'steelwing',
    name: 'Steel Wing',
    type: 'Steel',
    desc: '70 Power Steel attack that strikes with rigid wings and may raise user Defense.',
  },
  TM48: {
    id: 'TM48',
    moveId: 'firepunch',
    name: 'Fire Punch',
    type: 'Fire',
    desc: '75 Power Fire attack that may burn the target.',
  },
  TM49: {
    id: 'TM49',
    moveId: 'furycutter',
    name: 'Fury Cutter',
    type: 'Bug',
    desc: '40 Power Bug attack that doubles in power with consecutive hits.',
  },
  TM50: {
    id: 'TM50',
    moveId: 'nightmare',
    name: 'Nightmare',
    type: 'Ghost',
    desc: 'Inflicts a Nightmare on a sleeping target, draining 1/4 max HP each turn.',
  },

  // --- Overdrive Exclusive / Special TMs ---
  TM54: {
    id: 'TM54',
    moveId: 'falseswipe',
    name: 'False Swipe',
    type: 'Normal',
    desc: '40 Power Physical attack that never reduces the target HP below 1.',
  },
  TM73: {
    id: 'TM73',
    moveId: 'thunderwave',
    name: 'Thunder Wave',
    type: 'Electric',
    desc: 'Paralyzes the target (1.5x catch rate, -50% Speed).',
  },
  TM99: {
    id: 'TM99',
    moveId: 'meanlook',
    name: 'Mean Look',
    type: 'Normal',
    desc: 'Locks the target in battle, preventing roaming beasts from fleeing.',
  },
};

/**
 * Normalizes raw or legacy TM/HM strings (e.g. 'TM02_HEADBUTT', 'HM01_CUT', 'tm05')
 * to their canonical short identifier (e.g. 'TM02', 'HM01', 'TM05').
 */
export function normalizeTmId(rawId: string): string {
  if (!rawId) return '';
  const trimmed = rawId.trim().toUpperCase();
  const match = trimmed.match(/^(TM|HM)\d{2}/);
  if (match) {
    return match[0];
  }
  return trimmed;
}

/**
 * Deduplicates and sorts an array of TM/HM identifiers alphanumerically by TM/HM ID.
 * Standard Gen 2 order: HM01..HM07 followed by TM01..TM50, then any bonus TMs.
 */
export function deduplicateAndSortTms(tms: string[]): string[] {
  if (!Array.isArray(tms)) return [];
  const uniqueNormalized = new Set<string>();
  for (const raw of tms) {
    const norm = normalizeTmId(raw);
    if (norm) {
      uniqueNormalized.add(norm);
    }
  }
  return Array.from(uniqueNormalized).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export interface DeptStoreTMDef {
  id: string;
  moveId: string;
  name: string;
  type: string;
  price: number;
  desc: string;
}

export const DEPT_STORE_5F_TM_CATALOG: DeptStoreTMDef[] = [
  { id: 'TM41', moveId: 'thunderpunch', name: 'ThunderPunch', type: 'Electric', price: 3000, desc: '75 Power Electric punch that may paralyze.' },
  { id: 'TM48', moveId: 'firepunch', name: 'Fire Punch', type: 'Fire', price: 3000, desc: '75 Power Fire punch that may burn.' },
  { id: 'TM33', moveId: 'icepunch', name: 'Ice Punch', type: 'Ice', price: 3000, desc: '75 Power Ice punch that may freeze.' },
  { id: 'TM02', moveId: 'headbutt', name: 'Headbutt', type: 'Normal', price: 2000, desc: '70 Power Normal attack that shakes trees.' },
  { id: 'TM08', moveId: 'rocksmash', name: 'Rock Smash', type: 'Fighting', price: 1000, desc: '40 Power Fighting attack that breaks rocks.' },
];

export interface EvolutionStoneItemDef {
  id: string;
  altId: string;
  name: string;
  price: number;
  badgeLabel: string;
  desc: string;
  icon: string;
  isLinkStone?: boolean;
}

export const EVOLUTION_STONE_CATALOG: EvolutionStoneItemDef[] = [
  { id: 'fire-stone', altId: 'fire_stone', name: 'Fire Stone', price: 2100, badgeLabel: 'EVOLVE STONE', desc: 'A peculiar stone that makes certain Fire-type Pokémon evolve (e.g. Eevee, Growlithe, Vulpix).', icon: '🔥', },
  { id: 'water-stone', altId: 'water_stone', name: 'Water Stone', price: 2100, badgeLabel: 'EVOLVE STONE', desc: 'A peculiar stone that makes certain Water-type Pokémon evolve (e.g. Eevee, Poliwhirl, Shellder, Staryu).', icon: '💧', },
  { id: 'thunder-stone', altId: 'thunder_stone', name: 'Thunder Stone', price: 2100, badgeLabel: 'EVOLVE STONE', desc: 'A peculiar stone that makes certain Electric-type Pokémon evolve (e.g. Eevee, Pikachu).', icon: '⚡', },
  { id: 'leaf-stone', altId: 'leaf_stone', name: 'Leaf Stone', price: 2100, badgeLabel: 'EVOLVE STONE', desc: 'A peculiar stone that makes certain Grass-type Pokémon evolve (e.g. Gloom, Weepinbell, Exeggcute).', icon: '🍃', },
  { id: 'moon-stone', altId: 'moon_stone', name: 'Moon Stone', price: 2100, badgeLabel: 'EVOLVE STONE', desc: 'A peculiar stone that makes certain Pokémon evolve (e.g. Clefairy, Jigglypuff, Nidorino, Nidorina).', icon: '🌙', },
  { id: 'sun-stone', altId: 'sun_stone', name: 'Sun Stone', price: 2100, badgeLabel: 'EVOLVE STONE', desc: 'A peculiar stone that makes certain Pokémon evolve (e.g. Gloom into Bellossom, Sunkern into Sunflora).', icon: '☀️', },
  { id: 'link-stone', altId: 'link_stone', name: 'Link Stone', price: 3000, badgeLabel: 'TRADE EVOLVE', desc: 'Unbound-style Link Cable stone that triggers trade evolutions (e.g. Haunter, Kadabra, Machoke, Graveler).', icon: '🔗', isLinkStone: true, },
];

export type BagTabId = 'ITEMS' | 'TMS' | 'BALLS' | 'MART';

export const CARD_STYLE =
  'background:#141E33;border:1.5px solid #22324F;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 3px 0 0 #070B14;';
