/**
 * @fileoverview route26And27Npcs domain module implementation.
 * @module world/npcs/route26And27Npcs
 * @role Route 26, Route 27 & Border Gatehouse NPCs Component
 * @exports createRoute26And27Npcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-115: Route 27 & Sandstorm House NPCs | L116-200: Route 26 & Heal House NPCs
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createRoute26And27Npcs(): Record<string, GridEntity[]> {
  return {
    route_27: [
      makeNpc('route_27_fisher', 21, 10, 'LEFT', 'fisher', '🎣 FISHER', [
        'Hey! Do you know what you just did?',
        "You've taken your first step into KANTO! Check your POKéGEAR MAP and see!",
      ], { action: 'FIRST_STEP_KANTO_FISHER' }),
      makeNpc('cooltrainer_m_blake', 48, 7, 'UP', 'cooltrainer_m', '⚡ COOLTRAINER♂ BLAKE', [
        'BLAKE: My Pokémon and I have trained for the League!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_m_blake',
        trainerName: 'Cooltrainer Blake',
        visionRange: 2,
        challengePages: ['BLAKE: You plan to challenge the POKéMON LEAGUE? Show me what you got!'],
        trainerPokemon: { speciesId: 'magneton', level: 33, moves: ['thundershock', 'supersonic', 'sonicboom', 'triattack'] },
        trainerTeam: [
          { speciesId: 'magneton', level: 33, moves: ['thundershock', 'supersonic', 'sonicboom', 'triattack'] },
          { speciesId: 'quagsire', level: 31, moves: ['watergun', 'slam', 'amnesia', 'earthquake'] },
          { speciesId: 'exeggcute', level: 31, moves: ['barrage', 'hypnosis', 'confusion', 'leechseed'] },
        ],
      }),
      makeNpc('cooltrainer_m_brian', 58, 6, 'RIGHT', 'cooltrainer_m', '⚡ COOLTRAINER♂ BRIAN', [
        'BRIAN: What power! You can definitely reach Indigo Plateau!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_m_brian',
        trainerName: 'Cooltrainer Brian',
        visionRange: 2,
        challengePages: ['BRIAN: Only elite trainers make it past Tohjo Falls!'],
        trainerPokemon: { speciesId: 'sandslash', level: 35, moves: ['slash', 'poisonsting', 'sandattack', 'swift'] },
        trainerTeam: [
          { speciesId: 'sandslash', level: 35, moves: ['slash', 'poisonsting', 'sandattack', 'swift'] },
        ],
      }),
      makeNpc('cooltrainer_f_reena', 72, 10, 'UP', 'cooltrainer_f', '🌺 COOLTRAINER♀ REENA', [
        'REENA: You are totally ready for Victory Road!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_f_reena',
        trainerName: 'Cooltrainer Reena',
        visionRange: 2,
        challengePages: ['REENA: You smell like fresh Johto air! Can your team stand against Kanto strength?'],
        trainerPokemon: { speciesId: 'starmie', level: 31, moves: ['watergun', 'rapidspin', 'recover', 'swift'] },
        trainerTeam: [
          { speciesId: 'starmie', level: 31, moves: ['watergun', 'rapidspin', 'recover', 'swift'] },
          { speciesId: 'nidoqueen', level: 33, moves: ['bodyslam', 'poisonsting', 'bite', 'tailwhip'] },
          { speciesId: 'starmie', level: 31, moves: ['watergun', 'rapidspin', 'recover', 'swift'] },
        ],
      }),
      makeNpc('cooltrainer_f_megan', 37, 6, 'DOWN', 'cooltrainer_f', '🌺 COOLTRAINER♀ MEGAN', [
        'MEGAN: Oh! You raised your Pokémon with genuine care!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_f_megan',
        trainerName: 'Cooltrainer Megan',
        visionRange: 2,
        challengePages: ['MEGAN: I raised the grass starters with all my heart!'],
        trainerPokemon: { speciesId: 'bulbasaur', level: 32, moves: ['tackle', 'vinewhip', 'poisonpowder', 'growth'] },
        trainerTeam: [
          { speciesId: 'bulbasaur', level: 32, moves: ['tackle', 'vinewhip', 'poisonpowder', 'growth'] },
          { speciesId: 'ivysaur', level: 32, moves: ['tackle', 'vinewhip', 'poisonpowder', 'razorleaf'] },
          { speciesId: 'venusaur', level: 32, moves: ['tackle', 'vinewhip', 'razorleaf', 'sweetscent'] },
        ],
      }),
      makeNpc('psychic_gilbert', 65, 7, 'LEFT', 'psychic', '🔮 PSYCHIC GILBERT', [
        'GILBERT: Your psychic aura burns bright!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'psychic_gilbert',
        trainerName: 'Psychic Gilbert',
        visionRange: 2,
        challengePages: ['GILBERT: I foresee... a battle between two determined souls!'],
        trainerPokemon: { speciesId: 'starmie', level: 30, moves: ['watergun', 'confusion', 'recover', 'swift'] },
        trainerTeam: [
          { speciesId: 'starmie', level: 30, moves: ['watergun', 'confusion', 'recover', 'swift'] },
          { speciesId: 'exeggcute', level: 30, moves: ['hypnosis', 'confusion', 'barrage', 'leechseed'] },
          { speciesId: 'girafarig', level: 34, moves: ['psybeam', 'agility', 'batonpass', 'stomp'] },
        ],
      }),
      makeNpc('bird_keeper_jose', 58, 13, 'RIGHT', 'bird_keeper', '🦅 BIRD KEEPER JOSE', [
        'JOSE: My bird and I need more wind beneath our wings!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'bird_keeper_jose',
        trainerName: 'Bird Keeper Jose',
        visionRange: 2,
        challengePages: ['JOSE: Have you seen my prized Farfetch\'d? It can slice through gale winds!'],
        trainerPokemon: { speciesId: 'farfetchd', level: 34, moves: ['slash', 'swordsdance', 'agility', 'furycutter'] },
        trainerTeam: [
          { speciesId: 'farfetchd', level: 34, moves: ['slash', 'swordsdance', 'agility', 'furycutter'] },
        ],
      }),
    ],

    route_27_sandstorm_house: [
      makeNpc('route_27_sandstorm_woman', 2, 4, 'DOWN', 'teacher', '👩 WOMAN', [
        'Where are you going in such a rush? Your POKéMON look very attached to you! Take this TM37 SANDSTORM!',
      ], { action: 'ROUTE27_SANDSTORM_EVENT' }),
    ],

    route_26: [
      makeNpc('cooltrainer_m_jake', 14, 24, 'LEFT', 'cooltrainer_m', '⚡ COOLTRAINER♂ JAKE', [
        'JAKE: You have the stamina needed for Victory Road!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_m_jake',
        trainerName: 'Cooltrainer Jake',
        visionRange: 2,
        challengePages: ['JAKE: Route 26 is the final test before the Pokémon League Gate!'],
        trainerPokemon: { speciesId: 'parasect', level: 33, moves: ['spore', 'slash', 'leechlife', 'stunspore'] },
        trainerTeam: [
          { speciesId: 'parasect', level: 33, moves: ['spore', 'slash', 'leechlife', 'stunspore'] },
          { speciesId: 'golduck', level: 35, moves: ['confusion', 'waterfall', 'screech', 'psychup'] },
        ],
      }),
      makeNpc('cooltrainer_m_gaven', 9, 38, 'LEFT', 'cooltrainer_m', '⚡ COOLTRAINER♂ GAVEN', [
        'GAVEN: Remarkable versatility!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_m_gaven',
        trainerName: 'Cooltrainer Gaven',
        visionRange: 2,
        challengePages: ['GAVEN: Balanced types make for an ironclad team!'],
        trainerPokemon: { speciesId: 'victreebel', level: 32, moves: ['vinewhip', 'razorleaf', 'poisonpowder', 'sleeppowder'] },
        trainerTeam: [
          { speciesId: 'victreebel', level: 32, moves: ['vinewhip', 'razorleaf', 'poisonpowder', 'sleeppowder'] },
          { speciesId: 'kingler', level: 32, moves: ['bubblebeam', 'crabhammer', 'stomp', 'visegrip'] },
          { speciesId: 'flareon', level: 32, moves: ['ember', 'quickattack', 'bite', 'firespin'] },
        ],
      }),
      makeNpc('cooltrainer_f_joyce', 10, 56, 'DOWN', 'cooltrainer_f', '🌺 COOLTRAINER♀ JOYCE', [
        'JOYCE: Incredible strength! The Elite Four awaits you!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_f_joyce',
        trainerName: 'Cooltrainer Joyce',
        visionRange: 2,
        challengePages: ['JOYCE: My partners are ready to unleash full power!'],
        trainerPokemon: { speciesId: 'pikachu', level: 36, moves: ['thunderbolt', 'quickattack', 'thunderwave', 'slam'] },
        trainerTeam: [
          { speciesId: 'pikachu', level: 36, moves: ['thunderbolt', 'quickattack', 'thunderwave', 'slam'] },
          { speciesId: 'blastoise', level: 32, moves: ['waterfall', 'bite', 'withdraw', 'rapidspin'] },
        ],
      }),
      makeNpc('cooltrainer_f_beth', 5, 8, 'RIGHT', 'cooltrainer_f', '🌺 COOLTRAINER♀ BETH', [
        'BETH: Blazing speed wasn\'t enough!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'cooltrainer_f_beth',
        trainerName: 'Cooltrainer Beth',
        visionRange: 2,
        challengePages: ['BETH: My Rapidash runs faster than lightning on Route 26!'],
        trainerPokemon: { speciesId: 'rapidash', level: 36, moves: ['firespin', 'stomp', 'takedown', 'agility'] },
        trainerTeam: [
          { speciesId: 'rapidash', level: 36, moves: ['firespin', 'stomp', 'takedown', 'agility'] },
        ],
      }),
      makeNpc('psychic_richard', 13, 79, 'RIGHT', 'psychic', '🔮 PSYCHIC RICHARD', [
        'RICHARD: My mind could not foresee your winning move!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'psychic_richard',
        trainerName: 'Psychic Richard',
        visionRange: 2,
        challengePages: ['RICHARD: Psychic power transcends distance and borders!'],
        trainerPokemon: { speciesId: 'espeon', level: 36, moves: ['psybeam', 'psychic', 'quickattack', 'swift'] },
        trainerTeam: [
          { speciesId: 'espeon', level: 36, moves: ['psybeam', 'psychic', 'quickattack', 'swift'] },
        ],
      }),
      makeNpc('fisher_scott', 10, 92, 'DOWN', 'fisher', '🎣 FISHER SCOTT', [
        'SCOTT: Reeled in by a master trainer!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'fisher_scott',
        trainerName: 'Fisher Scott',
        visionRange: 2,
        challengePages: ['SCOTT: I fish in the sea right next to Route 26! Watch out for my catches!'],
        trainerPokemon: { speciesId: 'qwilfish', level: 30, moves: ['poisonsting', 'watergun', 'pinmissile', 'takedown'] },
        trainerTeam: [
          { speciesId: 'qwilfish', level: 30, moves: ['poisonsting', 'watergun', 'pinmissile', 'takedown'] },
          { speciesId: 'qwilfish', level: 30, moves: ['poisonsting', 'watergun', 'pinmissile', 'takedown'] },
          { speciesId: 'seaking', level: 34, moves: ['waterfall', 'hornattack', 'flail', 'supersonic'] },
        ],
      }),
    ],

    route_26_heal_house: [
      makeNpc('route_26_heal_woman', 2, 3, 'DOWN', 'teacher', '👩 KIND WOMAN', [
        'Hello, young traveler! Rest here before challenging the POKéMON LEAGUE.',
      ], { action: 'ROUTE26_HEAL_EVENT' }),
    ],

    victory_road_gate: [
      makeNpc('victory_road_gate_officer', 8, 11, 'RIGHT', 'officer', '👮 OFFICER', [
        'Only trainers who have proven themselves may pass.',
      ], { action: 'VICTORY_ROAD_GATE_OFFICER', talkAcrossCounter: true }),
      makeNpc('victory_road_gate_mt_silver_guard', 7, 5, 'RIGHT', 'blackbelt', '🥋 BLACK BELT', [
        'This way leads to MT. SILVER. The wild POKéMON out there are terrifyingly powerful!',
      ], { action: 'MT_SILVER_GATE_GUARD' }),
      makeNpc('victory_road_gate_kanto_guard', 12, 5, 'LEFT', 'blackbelt', '🥋 BLACK BELT', [
        "Off to the POKéMON LEAGUE, are you? The ELITE FOUR are ready for you!",
      ], { action: 'KANTO_GATE_GUARD' }),
    ],
  };
}
