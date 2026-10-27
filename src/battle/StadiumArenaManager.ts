/**
 * @fileoverview StadiumArenaManager domain module implementation.
 * @module battle/StadiumArenaManager
 * @role StadiumArenaManager Component
 * @exports StadiumChallengerSpec, STADIUM_CUPS, STADIUM_CHALLENGERS
 * @layer battle
 * @sections L1-15: Micro-Header & Imports | L16-127: Implementation | L128-254: Handlers & Exports
 */

/**
 * StadiumArenaManager.ts
 * Pure TypeScript domain manager for Advanced Stadium Cups & 2v2 Double Battle Challengers.
 */
import type { PokemonInstance } from '../types/game';
import { PokemonFactory } from './PokemonFactory';
import type { StadiumRuleSet, StadiumWeather } from './BattleStateMachine';

export interface StadiumChallengerSpec {
  id: string;
  name: string;
  title: string;
  cupId: string;
  rewardMoney: number;
  rules: StadiumRuleSet;
  team: Array<{ speciesId: string; level: number; moves?: string[] }>;
}

export const STADIUM_CUPS: StadiumRuleSet[] = [
  {
    cupId: 'poke_cup',
    cupName: '🏆 POKé CUP (1v1 STANDARD)',
    isDoubleBattle: false,
    weather: 'NONE',
    itemClause: true,
    levelCap: 50,
  },
  {
    cupId: 'prime_double_cup',
    cupName: '⚡ PRIME TAG CUP (2v2 DOUBLES)',
    isDoubleBattle: true,
    weather: 'NONE',
    itemClause: true,
    levelCap: 50,
  },
  {
    cupId: 'weather_clash_cup',
    cupName: '🌪️ WEATHER MASTERS (2v2 ARENA)',
    isDoubleBattle: true,
    weather: 'RAIN',
    itemClause: true,
    levelCap: 50,
  },
];

export const STADIUM_CHALLENGERS: StadiumChallengerSpec[] = [
  {
    id: 'stadium_cal',
    name: 'TRAINER CAL',
    title: 'Viridian Trainer House Ace',
    cupId: 'poke_cup',
    rewardMoney: 1500,
    rules: STADIUM_CUPS[0],
    team: [
      { speciesId: 'meganium', level: 30, moves: ['razorleaf', 'reflect', 'synthesis', 'bodyslam'] },
      { speciesId: 'typhlosion', level: 30, moves: ['flamewheel', 'swift', 'smokescreen', 'quickattack'] },
      { speciesId: 'feraligatr', level: 30, moves: ['surf', 'bite', 'icepunches', 'slash'] },
    ],
  },
  {
    id: 'stadium_duo_kai_maya',
    name: 'ACE DUO KAI & MAYA',
    title: 'Prime Cup Tag Specialists',
    cupId: 'prime_double_cup',
    rewardMoney: 2400,
    rules: STADIUM_CUPS[1],
    team: [
      { speciesId: 'raichu', level: 28, moves: ['thunderbolt', 'quickattack', 'thunderwave', 'swift'] },
      { speciesId: 'gyarados', level: 28, moves: ['surf', 'bite', 'icywind', 'tackle'] },
      { speciesId: 'arcanine', level: 28, moves: ['flamewheel', 'extremespeed', 'bite', 'roar'] },
      { speciesId: 'alakazam', level: 28, moves: ['psybeam', 'recover', 'reflect', 'kinesis'] },
    ],
  },
  {
    id: 'stadium_gym_tag_falkner_bugsy',
    name: 'LEADERS FALKNER & BUGSY',
    title: 'Johto Sky & Swarm Alliance',
    cupId: 'prime_double_cup',
    rewardMoney: 3200,
    rules: STADIUM_CUPS[1],
    team: [
      { speciesId: 'pidgeot', level: 32, moves: ['wingattack', 'quickattack', 'mudslap', 'sandattack'] },
      { speciesId: 'scyther', level: 32, moves: ['furycutter', 'wingattack', 'slash', 'quickattack'] },
      { speciesId: 'noctowl', level: 30, moves: ['hypnosis', 'peck', 'confusion', 'growl'] },
      { speciesId: 'pinsir', level: 30, moves: ['vicegrip', 'rockthrow', 'harden', 'focusenergy'] },
    ],
  },
  {
    id: 'stadium_weather_lance_clair',
    name: 'DRAGON MASTERS CLAIR & LANCE',
    title: 'Tempest Storm 2v2 Champions',
    cupId: 'weather_clash_cup',
    rewardMoney: 5000,
    rules: STADIUM_CUPS[2],
    team: [
      { speciesId: 'kingdra', level: 40, moves: ['surf', 'dragonbreath', 'icywind', 'smokescreen'] },
      { speciesId: 'dragonite', level: 40, moves: ['thunder', 'wingattack', 'twister', 'thunderwave'] },
      { speciesId: 'lapras', level: 38, moves: ['surf', 'icebeam', 'sing', 'bodyslam'] },
      { speciesId: 'aerodactyl', level: 38, moves: ['rockslide', 'wingattack', 'bite', 'supersonic'] },
    ],
  },
];

export class StadiumArenaManager {
  private selectedCupId: string = 'prime_double_cup';
  private customWeather: StadiumWeather = 'NONE';
  private winsByChallenger: Set<string> = new Set();

  public getCups(): StadiumRuleSet[] {
    return STADIUM_CUPS;
  }

  public getSelectedCup(): StadiumRuleSet {
    const base = STADIUM_CUPS.find((c) => c.cupId === this.selectedCupId) || STADIUM_CUPS[1];
    return {
      ...base,
      weather: this.customWeather !== 'NONE' ? this.customWeather : base.weather,
    };
  }

  public setSelectedCup(cupId: string): StadiumRuleSet {
    if (STADIUM_CUPS.some((c) => c.cupId === cupId)) {
      this.selectedCupId = cupId;
    }
    return this.getSelectedCup();
  }

  public setCustomWeather(weather: StadiumWeather): StadiumWeather {
    this.customWeather = weather;
    return this.customWeather;
  }

  public getCustomWeather(): StadiumWeather {
    return this.customWeather;
  }

  public getChallengersForCup(cupId?: string): StadiumChallengerSpec[] {
    const targetCup = cupId || this.selectedCupId;
    return STADIUM_CHALLENGERS.filter((c) => c.cupId === targetCup);
  }

  public getAllChallengers(): StadiumChallengerSpec[] {
    return STADIUM_CHALLENGERS;
  }

  public buildChallengerTeam(
    challenger: StadiumChallengerSpec,
    scaleToPartyLevel?: number
  ): PokemonInstance[] {
    return challenger.team.map((spec) => {
      const lvl = scaleToPartyLevel
        ? Math.max(10, Math.min(spec.level, scaleToPartyLevel))
        : spec.level;
      return PokemonFactory.create(spec.speciesId, lvl);
    });
  }

  public getCupById(cupId: string): StadiumRuleSet | undefined {
    return STADIUM_CUPS.find((c) => c.cupId === cupId);
  }

  public preparePartyForRules(
    party: PokemonInstance[],
    rules: StadiumRuleSet
  ): PokemonInstance[] {
    const seenHeldItems = new Set<string>();
    return party
      .filter((p) => !p.isEgg)
      .map((p) => {
        const clone: PokemonInstance = {
          ...p,
          stats: { ...p.stats },
          moves: p.moves.map((m) => ({ ...m })),
        };
        if (rules.levelCap && clone.level > rules.levelCap) {
          const scaled = PokemonFactory.create(
            clone.speciesId,
            rules.levelCap,
            clone.moves.map((m) => m.moveId)
          );
          clone.level = rules.levelCap;
          clone.stats = { ...scaled.stats };
          clone.currentHp = Math.min(clone.currentHp, clone.stats.hp);
        }
        if (rules.itemClause && clone.heldItem) {
          const normItem = clone.heldItem.toLowerCase();
          if (seenHeldItems.has(normItem)) {
            clone.heldItem = undefined;
          } else {
            seenHeldItems.add(normItem);
          }
        }
        return clone;
      });
  }

  public createStadiumBattle(
    playerParty: PokemonInstance[],
    challengerId: string,
    cupId?: string
  ): {
    challenger: StadiumChallengerSpec;
    enemyLead: PokemonInstance;
    doubleConfig: {
      isDoubleBattle: boolean;
      playerPartner?: PokemonInstance;
      enemyPartner?: PokemonInstance;
      stadiumRules: StadiumRuleSet;
    };
    rules: StadiumRuleSet;
  } | null {
    const challenger = STADIUM_CHALLENGERS.find((c) => c.id === challengerId);
    if (!challenger) return null;

    const cup = (cupId && this.getCupById(cupId)) || challenger.rules;
    const sanitizedParty = this.preparePartyForRules(playerParty, cup);
    const activeAllies = sanitizedParty.filter((p) => p.currentHp > 0);
    if (activeAllies.length === 0) return null;

    const maxPartyLvl = Math.max(...activeAllies.map((p) => p.level || 20));
    const foeTeam = this.buildChallengerTeam(challenger, Math.max(20, maxPartyLvl));
    const enemyLead = foeTeam[0];
    const isDouble = Boolean(cup.isDoubleBattle || challenger.rules.isDoubleBattle);

    return {
      challenger,
      enemyLead,
      rules: cup,
      doubleConfig: {
        isDoubleBattle: isDouble,
        playerPartner: isDouble ? activeAllies[1] : undefined,
        enemyPartner: isDouble ? foeTeam[1] : undefined,
        stadiumRules: cup,
      },
    };
  }

  public recordVictory(challengerId: string): void {
    this.winsByChallenger.add(challengerId);
  }

  public hasDefeated(challengerId: string): boolean {
    return this.winsByChallenger.has(challengerId);
  }
}
