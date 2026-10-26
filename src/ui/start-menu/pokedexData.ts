import { Dex } from '@pkmn/dex';

export const JOHTO_DEX_SPECIES: Array<{ id: string; name: string; types: string[] }> = [
  { id: 'cyndaquil', name: 'Cyndaquil', types: ['Fire'] },
  { id: 'sentret', name: 'Sentret', types: ['Normal'] },
  { id: 'pidgey', name: 'Pidgey', types: ['Normal', 'Flying'] },
  { id: 'pidgeotto', name: 'Pidgeotto', types: ['Normal', 'Flying'] },
  { id: 'spearow', name: 'Spearow', types: ['Normal', 'Flying'] },
  { id: 'rattata', name: 'Rattata', types: ['Normal'] },
  { id: 'hoot-hoot', name: 'Hoothoot', types: ['Normal', 'Flying'] },
  { id: 'hoppip', name: 'Hoppip', types: ['Grass', 'Flying'] },
  { id: 'caterpie', name: 'Caterpie', types: ['Bug'] },
  { id: 'weedle', name: 'Weedle', types: ['Bug', 'Poison'] },
  { id: 'ledyba', name: 'Ledyba', types: ['Bug', 'Flying'] },
  { id: 'spinarak', name: 'Spinarak', types: ['Bug', 'Poison'] },
  { id: 'bellsprout', name: 'Bellsprout', types: ['Grass', 'Poison'] },
  { id: 'poliwag', name: 'Poliwag', types: ['Water'] },
  { id: 'poliwhirl', name: 'Poliwhirl', types: ['Water'] },
  { id: 'marill', name: 'Marill', types: ['Water'] },
  { id: 'togepi', name: 'Togepi', types: ['Normal'] },
  { id: 'sudowoodo', name: 'Sudowoodo', types: ['Rock'] },
  { id: 'geodude', name: 'Geodude', types: ['Rock', 'Ground'] },
  { id: 'gastly', name: 'Gastly', types: ['Ghost', 'Poison'] },
  { id: 'smeargle', name: 'Smeargle', types: ['Normal'] },
  { id: 'raikou', name: 'Raikou', types: ['Electric'] },
  { id: 'entei', name: 'Entei', types: ['Fire'] },
  { id: 'suicune', name: 'Suicune', types: ['Water'] },
  { id: 'miltank', name: 'Miltank', types: ['Normal'] },
  { id: 'eevee', name: 'Eevee', types: ['Normal'] },
  { id: 'crobat', name: 'Crobat', types: ['Poison', 'Flying'] },
  { id: 'chinchou', name: 'Chinchou', types: ['Water', 'Electric'] },
  { id: 'lanturn', name: 'Lanturn', types: ['Water', 'Electric'] },
  { id: 'pichu', name: 'Pichu', types: ['Electric'] },
  { id: 'cleffa', name: 'Cleffa', types: ['Normal'] },
  { id: 'igglybuff', name: 'Iglybuff', types: ['Normal'] },
  { id: 'togetic', name: 'Togetic', types: ['Normal', 'Flying'] },
  { id: 'natu', name: 'Natu', types: ['Psychic', 'Flying'] },
  { id: 'xatu', name: 'Xatu', types: ['Psychic', 'Flying'] },
  { id: 'mareep', name: 'Mareep', types: ['Electric'] },
  { id: 'flaaffy', name: 'Flaaffy', types: ['Electric'] },
  { id: 'ampharos', name: 'Ampharos', types: ['Electric'] },
  { id: 'bellossom', name: 'Bellossom', types: ['Grass'] },
  { id: 'azumarill', name: 'Azumarill', types: ['Water'] },
  { id: 'sudowoodo', name: 'Sudowoodo', types: ['Rock'] },
  { id: 'politoed', name: 'Politoed', types: ['Water'] },
  { id: 'wooper', name: 'Wooper', types: ['Water', 'Ground'] },
  { id: 'quagsire', name: 'Quagsire', types: ['Water', 'Ground'] },
  { id: 'espeon', name: 'Espeon', types: ['Psychic'] },
  { id: 'umbreon', name: 'Umbreon', types: ['Dark'] },
  { id: 'murkrow', name: 'Murkrow', types: ['Dark', 'Flying'] },
  { id: 'slowking', name: 'Slowking', types: ['Water', 'Psychic'] },
  { id: 'misdreavus', name: 'Misdreavus', types: ['Ghost'] },
  { id: 'wobbuffet', name: 'Wobbuffet', types: ['Psychic'] },
  { id: 'girafarig', name: 'Girafarig', types: ['Normal', 'Psychic'] },
  { id: 'pineco', name: 'Pineco', types: ['Bug'] },
  { id: 'forretress', name: 'Forretress', types: ['Bug', 'Steel'] },
  { id: 'dunsparce', name: 'Dunsparce', types: ['Normal'] },
  { id: 'gligar', name: 'Gligar', types: ['Ground', 'Flying'] },
  { id: 'steelix', name: 'Steelix', types: ['Steel', 'Ground'] },
  { id: 'snubbull', name: 'Snubbull', types: ['Normal'] },
  { id: 'granbull', name: 'Granbull', types: ['Normal'] },
  { id: 'qwilfish', name: 'Qwilfish', types: ['Water', 'Poison'] },
  { id: 'scizor', name: 'Scizor', types: ['Bug', 'Steel'] },
  { id: 'shuckle', name: 'Shuckle', types: ['Bug', 'Rock'] },
  { id: 'heracross', name: 'Heracross', types: ['Bug', 'Fighting'] },
  { id: 'sneasel', name: 'Sneasel', types: ['Dark', 'Ice'] },
  { id: 'teddiursa', name: 'Teddiursa', types: ['Normal'] },
  { id: 'ursaring', name: 'Ursaring', types: ['Normal'] },
  { id: 'slugma', name: 'Slugma', types: ['Fire'] },
  { id: 'magcargo', name: 'Magcargo', types: ['Fire', 'Rock'] },
  { id: 'swinub', name: 'Swinub', types: ['Ice', 'Ground'] },
  { id: 'piloswine', name: 'Piloswine', types: ['Ice', 'Ground'] },
  { id: 'corsola', name: 'Corsola', types: ['Water', 'Rock'] },
  { id: 'remoraid', name: 'Remoraid', types: ['Water'] },
  { id: 'octillery', name: 'Octillery', types: ['Water'] },
  { id: 'delibird', name: 'Delibird', types: ['Ice', 'Flying'] },
  { id: 'mantine', name: 'Mantine', types: ['Water', 'Flying'] },
  { id: 'skarmory', name: 'Skarmory', types: ['Steel', 'Flying'] },
  { id: 'houndour', name: 'Houndour', types: ['Dark', 'Fire'] },
  { id: 'houndoom', name: 'Houndoom', types: ['Dark', 'Fire'] },
  { id: 'kingdra', name: 'Kingdra', types: ['Water', 'Dragon'] },
  { id: 'phanpy', name: 'Phanpy', types: ['Ground'] },
  { id: 'donphan', name: 'Donphan', types: ['Ground'] },
  { id: 'porygon2', name: 'Porygon2', types: ['Normal'] },
  { id: 'stantler', name: 'Stantler', types: ['Normal'] },
  { id: 'tyrogue', name: 'Tyrogue', types: ['Fighting'] },
  { id: 'hitmontop', name: 'Hitmontop', types: ['Fighting'] },
  { id: 'smoochum', name: 'Smoochum', types: ['Ice', 'Psychic'] },
  { id: 'elekid', name: 'Elekid', types: ['Electric'] },
  { id: 'magby', name: 'Magby', types: ['Fire'] },
  { id: 'blissey', name: 'Blissey', types: ['Normal'] },
  { id: 'larvitar', name: 'Larvitar', types: ['Rock', 'Ground'] },
  { id: 'pupitar', name: 'Pupitar', types: ['Rock', 'Ground'] },
  { id: 'tyranitar', name: 'Tyranitar', types: ['Rock', 'Dark'] },
  { id: 'lugia', name: 'Lugia', types: ['Psychic', 'Flying'] },
  { id: 'ho-oh', name: 'Ho-Oh', types: ['Fire', 'Flying'] },
  { id: 'celebi', name: 'Celebi', types: ['Psychic', 'Grass'] },
];

export interface DexSpeciesData {
  num: number;
  id: string;
  name: string;
  types: string[];
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  bst: number;
  weightkg: number;
  heightm: number;
  category: string;
  lore: string;
  gen: number;
}

export const CANONICAL_SPECIES_DATA: Record<
  string,
  { category: string; heightm: number; lore: string }
> = {
  cyndaquil: {
    category: 'Fire Mouse Pokémon',
    heightm: 0.5,
    lore: 'It is timid, and always curls itself up in a ball. If attacked, it flares up its back for protection.',
  },
  totodile: {
    category: 'Big Jaw Pokémon',
    heightm: 0.6,
    lore: 'Its well-developed jaws are powerful and capable of crushing anything. Even its trainer must be careful.',
  },
  chikorita: {
    category: 'Leaf Pokémon',
    heightm: 0.9,
    lore: 'A sweet aroma gently wafts from the leaf on its head. It is docile and loves to soak up the sun.',
  },
  pidgey: {
    category: 'Tiny Bird Pokémon',
    heightm: 0.3,
    lore: 'Very docile. If attacked, it will often kick up sand to protect itself rather than fight back.',
  },
  sentret: {
    category: 'Scout Pokémon',
    heightm: 0.8,
    lore: 'When acting as a lookout, it warns others of danger by screeching loudly and thumping the ground with its tail.',
  },
  rattata: {
    category: 'Mouse Pokémon',
    heightm: 0.3,
    lore: 'Bites anything when it attacks. Small and very quick, it is a common sight in places across Johto.',
  },
  bellsprout: {
    category: 'Flower Pokémon',
    heightm: 0.7,
    lore: 'Even though its body is extremely skinny, it is blindingly fast when catching its prey.',
  },
  geodude: {
    category: 'Rock Pokémon',
    heightm: 0.4,
    lore: 'Most people do not notice, but when you look closely at rocks along paths, they may be Geodude.',
  },
  gastly: {
    category: 'Gas Pokémon',
    heightm: 1.3,
    lore: 'Almost invisible, this gaseous Pokémon cloaks the target and puts it to sleep without warning.',
  },
  zubat: {
    category: 'Bat Pokémon',
    heightm: 0.8,
    lore: 'Capable of flying safely in dark places, it emits ultrasonic cries to check for any obstacles.',
  },
  slowpoke: {
    category: 'Dopey Pokémon',
    heightm: 1.2,
    lore: 'It is always vacantly lost in thought, but nobody knows what it is thinking about in Slowpoke Well.',
  },
  mareep: {
    category: 'Wool Pokémon',
    heightm: 0.6,
    lore: 'Its fleece grows continually. In summer, the fleece is sheared, but it grows back in a week.',
  },
  marill: {
    category: 'Aqua Mouse Pokémon',
    heightm: 0.4,
    lore: 'The tip of its tail, which contains oil lighter than water, lets it swim without drowning.',
  },
  sudowoodo: {
    category: 'Imitation Pokémon',
    heightm: 1.2,
    lore: 'Although it always pretends to be a tree, its composition is closer to a rock than a plant.',
  },
  togepi: {
    category: 'Spike Ball Pokémon',
    heightm: 0.3,
    lore: 'The shell seems to be filled with joy. It is said that it will share good luck when treated kindly.',
  },
  scyther: {
    category: 'Mantis Pokémon',
    heightm: 1.5,
    lore: 'It slashes through grass with its sharp scythes, moving too fast for the human eye to track.',
  },
  heracross: {
    category: 'Single Horn Pokémon',
    heightm: 1.5,
    lore: 'Usually docile, but if disturbed while sipping honey, it chases off intruders with its great horn.',
  },
  raikou: {
    category: 'Thunder Pokémon',
    heightm: 1.9,
    lore: 'The rain clouds it carries let it fire thunderbolts at will. They say that it descended with lightning.',
  },
  entei: {
    category: 'Volcano Pokémon',
    heightm: 2.1,
    lore: 'Volcanoes erupt when it barks. Unable to restrain its extreme power, it races headlong around the land.',
  },
  suicune: {
    category: 'Aurora Pokémon',
    heightm: 2.0,
    lore: 'Said to be the reincarnation of north winds, it can instantly purify filthy, murky water.',
  },
  pikachu: {
    category: 'Mouse Pokémon',
    heightm: 0.4,
    lore: 'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
  },
  bulbasaur: {
    category: 'Seed Pokémon',
    heightm: 0.7,
    lore: 'A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.',
  },
  charmander: {
    category: 'Lizard Pokémon',
    heightm: 0.6,
    lore: 'The flame on its tail indicates its life force. If the Pokémon is healthy, the flame burns brightly.',
  },
  squirtle: {
    category: 'Tiny Turtle Pokémon',
    heightm: 0.5,
    lore: 'Shoots water at prey while in the water. Withdraws into its shell when in danger from foes.',
  },
};

export function getNeoKantoTypeColor(type: string): { bg: string; text: string } {
  switch (type.toLowerCase()) {
    case 'fire': return { bg: '#EE4238', text: '#F6F8F3' };
    case 'water': return { bg: '#2A75D3', text: '#F6F8F3' };
    case 'grass': return { bg: '#48C774', text: '#0D1322' };
    case 'electric': return { bg: '#FFD028', text: '#0D1322' };
    case 'ice': return { bg: '#98D8D8', text: '#0D1322' };
    case 'fighting': return { bg: '#C03028', text: '#F6F8F3' };
    case 'poison': return { bg: '#9B51E0', text: '#F6F8F3' };
    case 'ground': return { bg: '#E0C068', text: '#0D1322' };
    case 'flying': return { bg: '#74B9FF', text: '#0D1322' };
    case 'psychic': return { bg: '#F85888', text: '#F6F8F3' };
    case 'bug': return { bg: '#A8B820', text: '#0D1322' };
    case 'rock': return { bg: '#B8A038', text: '#F6F8F3' };
    case 'ghost': return { bg: '#705898', text: '#F6F8F3' };
    case 'dragon': return { bg: '#5E5CE6', text: '#F6F8F3' };
    case 'steel': return { bg: '#8A9BA8', text: '#0D1322' };
    case 'dark': return { bg: '#705746', text: '#F6F8F3' };
    case 'fairy': return { bg: '#EE99AC', text: '#0D1322' };
    default: return { bg: '#8A9BA8', text: '#0D1322' };
  }
}

let cachedDexList: DexSpeciesData[] | null = null;
export function getCompleteDexSpecies(): DexSpeciesData[] {
  if (cachedDexList) return cachedDexList;

  const raw = Dex.species.all().filter((s) => s.num >= 1 && s.num <= 251 && !s.forme);
  cachedDexList = raw.map((sp) => {
    const custom = CANONICAL_SPECIES_DATA[sp.id];
    const category = custom?.category || `${sp.types.join('/')} POKéMON`;
    const heightm = custom?.heightm || Number(((sp.weightkg || 10) * 0.08 + 0.3).toFixed(1));
    const lore =
      custom?.lore ||
      `Specimen #${String(sp.num).padStart(3, '0')} recorded in the regional Johto/Kanto research archives. Baseline battle telemetry BST is ${sp.bst}.`;

    return {
      num: sp.num,
      id: sp.id,
      name: sp.name,
      types: sp.types,
      baseStats: sp.baseStats,
      bst: sp.bst,
      weightkg: sp.weightkg,
      heightm,
      category,
      lore,
      gen: sp.gen || (sp.num <= 151 ? 1 : 2),
    };
  });

  return cachedDexList;
}
