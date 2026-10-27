/**
 * @fileoverview azaleaToIlexNpcs domain module implementation.
 * @module world/npcs/azaleaToIlexNpcs
 * @role azaleaToIlexNpcs Component
 * @exports createAzaleaToIlexNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-176: Implementation | L177-352: Handlers & Exports
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createAzaleaToIlexNpcs(): Record<string, GridEntity[]> {
  return {
    azalea_town: [
      makeNpc('azalea_well_grunt', 31, 9, 'DOWN', 'rocket_grunt_m', '⚡ ROCKET GRUNT', 
        [
          "ROCKET GRUNT: Beat it, kid! SLOWPOKE WELL is off-limits today! We're busy collecting... er, doing maintenance!",
        ]
      ),
      makeNpc('azalea_gym_grunt', 10, 16, 'DOWN', 'rocket_grunt_m', '⚡ ROCKET GRUNT', 
        [
          "ROCKET GRUNT: No one gets in the GYM! Buzz off, brat!",
        ]
      ),
      makeNpc('azalea_slowpoke', 21, 10, 'DOWN', 'slowpoke', '🦛 SLOWPOKE', 
        [
          'SLOWPOKE: ... ... ...',
          'Yaaawn? It seems peaceful and blissfully unbothered.',
        ]
      ),
      makeNpc('azalea_slowpoke_2', 15, 13, 'RIGHT', 'slowpoke', '🦛 SLOWPOKE', 
        [
          'SLOWPOKE: ... ... ...',
          'Yaaawn? It seems to be enjoying the pleasant breeze in Azalea Town.',
        ]
      ),
      makeNpc('azalea_apprentice', 17, 10, 'UP', 'youngster', '👦 APPRENTICE', 
        ['The master charcoal-maker uses wood from ILEX FOREST to fire the kiln.'],
        { wanders: true }
      ),
      makeNpc('azalea_kurt', 9, 6, 'DOWN', 'elder', '🔨 BALL SMITH KURT', 
        [
          'KURT: Those TEAM ROCKET thugs are cutting off SLOWPOKE TAILS at the well! I am going to put a stop to them!',
        ]
      ),
      makeNpc('azalea_gramps', 21, 8, 'DOWN', 'gentleman', '🎩 AZALEA GENTLEMAN', 
        ["KURT creates handmade custom POKé BALLS from APRICORNS gathered from trees. No factory can match his touch!"]
      ),
    ],
    azalea_poke_center: [
      makeNpc('azalea_nurse_joy', 3, 1, 'DOWN', 'teacher', '👩‍⚕️ NURSE JOY', 
        [
          'Welcome to the AZALEA TOWN POKéMON CENTER!',
          'We heal your POKéMON to full health.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('azalea_pc_lass', 8, 4, 'LEFT', 'girl', '👧 LASS', 
        ['KURT will make special POKé BALLS like FAST BALL, LURE BALL, or FRIEND BALL if you bring him APRICORNS!']
      ),
    ],
    azalea_mart: [
      makeNpc('azalea_mart_clerk', 1, 3, 'RIGHT', 'fat_man', '🏪 MART CLERK', 
        ['Welcome to AZALEA MART! Stock up on POTIONS and POKé BALLS before venturing into ILEX FOREST!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
      makeNpc('azalea_mart_bug_catcher', 6, 6, 'UP', 'bug_catcher', '🐞 BUG CATCHER', 
        ["CHARCOAL boosts FIRE-type moves! It's great against BUGSY's bug POKéMON in the GYM!"]
      ),
    ],
    azalea_gym: [
      makeNpc('bugsy', 5, 7, 'DOWN', 'bug_catcher', '🐞 LEADER BUGSY', 
        [
          'BUGSY: Bug POKéMON are deep and complex. There are so many mysteries to unravel!',
        ],
        {
          action: 'BUGSY_EVENT',
          trainerId: 'bugsy',
          trainerName: 'Leader Bugsy',
          challengePages: [
            "BUGSY: I'm BUGSY! I never lose when it comes to bug POKéMON. My research is going to make me the authority on bug POKéMON! Let me demonstrate what I've learned from my studies!",
          ],
          trainerPokemon: { speciesId: 'scyther', level: 16, moves: ['furycutter', 'quickattack', 'leer'] },
          trainerTeam: [
            { speciesId: 'metapod', level: 14, moves: ['tackle', 'stringshot'] },
            { speciesId: 'kakuna', level: 14, moves: ['poisonsting', 'harden'] },
            { speciesId: 'scyther', level: 16, moves: ['furycutter', 'quickattack', 'leer'] },
          ],
        }
      ),
      makeNpc('bug_catcher_benny', 5, 3, 'DOWN', 'bug_catcher', '🐞 BUG CATCHER BENNY', 
        ["Just evolving isn't enough!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_benny',
          trainerName: 'Bug Catcher Benny',
          visionRange: 3,
          challengePages: ['BUG CATCHER BENNY: Bug POKéMON evolve young. So they get stronger that much faster.'],
          trainerPokemon: { speciesId: 'weedle', level: 12, moves: ['poisonsting', 'stringshot'] },
          trainerTeam: [
            { speciesId: 'weedle', level: 12, moves: ['poisonsting', 'stringshot'] },
            { speciesId: 'kakuna', level: 12, moves: ['poisonsting', 'harden'] },
            { speciesId: 'beedrill', level: 12, moves: ['furyattack', 'poisonsting'] },
          ],
        }
      ),
      makeNpc('bug_catcher_al', 8, 8, 'LEFT', 'bug_catcher', '🐞 BUG CATCHER AL', 
        ['You proved how tough you are…'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_al',
          trainerName: 'Bug Catcher Al',
          visionRange: 3,
          challengePages: ["BUG CATCHER AL: Bug POKéMON are cool and tough! I'll prove it to you!"],
          trainerPokemon: { speciesId: 'caterpie', level: 12, moves: ['tackle', 'stringshot'] },
          trainerTeam: [
            { speciesId: 'caterpie', level: 12, moves: ['tackle', 'stringshot'] },
            { speciesId: 'metapod', level: 12, moves: ['harden', 'tackle'] },
          ],
        }
      ),
      makeNpc('bug_catcher_josh', 0, 2, 'RIGHT', 'bug_catcher', '🐞 BUG CATCHER JOSH', 
        ['Urrgggh!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_josh',
          trainerName: 'Bug Catcher Josh',
          visionRange: 3,
          challengePages: ["BUG CATCHER JOSH: You saved all the SLOWPOKE? Whew, you're mighty! But my grown-up POKéMON are pretty tough too!"],
          trainerPokemon: { speciesId: 'paras', level: 13, moves: ['scratch', 'stunspore', 'poisonpowder'] },
          trainerTeam: [
            { speciesId: 'paras', level: 13, moves: ['scratch', 'stunspore', 'poisonpowder'] },
          ],
        }
      ),
      makeNpc('twins_amy', 4, 10, 'DOWN', 'girl', '👭 TWIN AMY', 
        ['AMY: Oh, double goodness!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'twins_amy',
          trainerName: 'Twin Amy',
          visionRange: 2,
          challengePages: ["TWIN AMY: Hi! You want to see the LEADER? We come first!"],
          trainerPokemon: { speciesId: 'spinarak', level: 10, moves: ['poisonsting', 'stringshot', 'scaryface'] },
          trainerTeam: [
            { speciesId: 'spinarak', level: 10, moves: ['poisonsting', 'stringshot', 'scaryface'] },
          ],
        }
      ),
      makeNpc('twins_may', 5, 10, 'DOWN', 'girl', '👭 TWIN MAY', 
        ['MAY: Our bug POKéMON lost! Oh, what a shame.'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'twins_may',
          trainerName: 'Twin May',
          visionRange: 2,
          challengePages: ["TWIN MAY: Hi! You want to see the LEADER? We come first!"],
          trainerPokemon: { speciesId: 'ledyba', level: 10, moves: ['tackle', 'supersonic', 'cometpunch'] },
          trainerTeam: [
            { speciesId: 'ledyba', level: 10, moves: ['tackle', 'supersonic', 'cometpunch'] },
          ],
        }
      ),
      makeNpc('azalea_gym_guide', 7, 13, 'UP', 'fat_man', '🥊 GYM GUIDE', 
        [
          "Yo, challenger! BUGSY's young, but his knowledge of bug POKéMON is for real. Let's see… Bug POKéMON don't like fire. Flying-type moves are super-effective too.",
        ]
      ),
    ],
    kurts_house: [
      makeNpc('kurt_house_kurt', 3, 2, 'DOWN', 'elder', '👴 KURT', 
        [
          'KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You\'re a wonderful trainer!',
          "Bring me any APRICORNS you find on trees, and I'll gladly craft custom POKé BALLS for you free of charge!",
        ]
      ),
      makeNpc('kurt_granddaughter', 5, 3, 'LEFT', 'girl', '👧 GRANDDAUGHTER', 
        ['Grandpa makes the most reliable POKé BALLS in the whole world! Everyone in Johto knows his name!']
      ),
    ],
    charcoal_kiln: [
      makeNpc('kiln_boss', 2, 3, 'DOWN', 'fat_man', '🧔 KILN BOSS', 
        ['The kiln burns day and night to cure authentic AZALEA CHARCOAL. It boosts the power of FIRE-type moves!'],
        { action: 'CHARCOAL_MASTER_EVENT' }
      ),
      makeNpc('kiln_apprentice', 5, 3, 'LEFT', 'youngster', '👦 APPRENTICE', 
        ["Thank you so much for chasing down FARFETCH'D in ILEX FOREST! Please take this CHARCOAL that we made in the kiln!"],
        { action: 'CHARCOAL_KILN_APPRENTICE_EVENT' }
      ),
      makeNpc('kiln_farfetchd', 6, 3, 'LEFT', 'farfetchd', '🦆 FARFETCH’D', 
        ["FARFETCH'D: Kwaa! It looks happy to be back home at the kiln!"]
      ),
    ],
    slowpoke_well_b1f: [
      makeNpc('rocket_grunt_1', 15, 7, 'DOWN', 'rocket_grunt_m', '⚡ ROCKET GRUNT', 
        ["Sure, we've been hacking the tails off SLOWPOKE and selling them. Everything we do is for profit. That's right! We're TEAM ROCKET, and we'll do anything for money!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'rocket_grunt_1',
          trainerName: 'Rocket Grunt',
          visionRange: 4,
          challengePages: ["ROCKET GRUNT: Darn! I was standing guard up top when some old coot yelled at me. He startled me so much that I fell down here. I think I'll vent my anger by taking it out on you!"],
          trainerPokemon: { speciesId: 'rattata', level: 9, moves: ['tackle', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 9, moves: ['tackle', 'quickattack'] },
            { speciesId: 'rattata', level: 9, moves: ['tackle', 'quickattack'] },
          ],
        }
      ),
      makeNpc('rocket_grunt_2', 5, 6, 'RIGHT', 'rocket_grunt_m', '⚡ ROCKET GRUNT', 
        ["We need the money, but selling SLOWPOKETAILS? It's tough being a ROCKET GRUNT!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'rocket_grunt_2',
          trainerName: 'Rocket Grunt',
          visionRange: 3,
          challengePages: ['ROCKET GRUNT: Quit taking SLOWPOKETAILS? If we obeyed you, TEAM ROCKET\'s rep would be ruined!'],
          trainerPokemon: { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
          trainerTeam: [
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
            { speciesId: 'ekans', level: 11, moves: ['wrap', 'leer', 'poisonsting'] },
          ],
        }
      ),
      makeNpc('rocket_grunt_3', 10, 4, 'RIGHT', 'rocket_grunt_f', '⚡ ROCKET GRUNT', 
        ["SLOWPOKETAILS grow back fast! What's wrong with selling them?"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'rocket_grunt_3',
          trainerName: 'Rocket Grunt',
          visionRange: 4,
          challengePages: ["ROCKET GRUNT: Stop taking TAILS? Yeah, just try to defeat all of us!"],
          trainerPokemon: { speciesId: 'rattata', level: 7, moves: ['tackle', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 7, moves: ['tackle', 'quickattack'] },
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
          ],
        }
      ),
      makeNpc('executive_proton', 5, 2, 'DOWN', 'rocket_grunt_m', '⚡ EXECUTIVE PROTON', 
        ["PROTON: What do you want? If you interrupt our work, don't expect any mercy! We're TEAM ROCKET, and we'll do anything for money!"],
        {
          action: 'PROTON_EVENT',
          trainerId: 'executive_proton',
          trainerName: 'Executive Proton',
          visionRange: 3,
          challengePages: [
            "PROTON: What do you want? If you interrupt our work, don't expect any mercy! We're TEAM ROCKET, and we'll do anything for money!",
          ],
          trainerPokemon: { speciesId: 'koffing', level: 14, moves: ['tackle', 'smog', 'poisongas'] },
          trainerTeam: [
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
            { speciesId: 'koffing', level: 14, moves: ['tackle', 'smog', 'poisongas'] },
          ],
        }
      ),
      makeNpc('well_kurt', 16, 14, 'UP', 'elder', '👴 KURT', 
        [
          "KURT: Hey there, rookie! The guard up top took off when I shouted at him. But then I took a tumble down the WELL. I slammed down hard on my back, so I can't move. Rats! Show them how gutsy you are in my place!",
        ]
      ),
      makeNpc('well_slowpoke', 6, 2, 'DOWN', 'slowpoke', '🦛 RESCUED SLOWPOKE', 
        [
          'SLOWPOKE: ... ... ...',
          'A SLOWPOKE with its TAIL cut off…',
        ]
      ),
      makeNpc('well_slowpoke_2', 7, 4, 'DOWN', 'slowpoke', '🦛 RESCUED SLOWPOKE', 
        [
          'SLOWPOKE: ... ... ...',
          'A SLOWPOKE with its TAIL cut off… Huh? It has MAIL.',
          "<PLAYER> read the MAIL: 'Be good and look after the house with Grandpa and SLOWPOKE. Love, Dad'",
        ]
      ),
    ],
    slowpoke_well_b2f: [
      makeNpc('well_guide', 16, 5, 'DOWN', 'fat_man', '🔦 CAVERN EXPLORER', 
        [
          "CAVERN EXPLORER: I'm waiting to see SLOWPOKE's moment of evolution. Through observation, I made a new discovery.",
          "A SLOWPOKE with a KING'S ROCK often gets bitten by a SHELLDER. Here, I'll share a KING'S ROCK with you!",
        ],
        { action: 'KINGS_ROCK_EVENT' }
      ),
    ],
    ilex_forest: [
      makeNpc('forest_apprentice', 14, 30, 'UP', 'boy', '👦 APPRENTICE', 
        [
          "The boss's FARFETCH'D escaped deeper into the forest! Can you help me find it?",
          'If you sneak up behind it, you might be able to steer it back toward the charcoal kiln!',
        ]
      ),
      makeNpc('forest_farfetchd', 15, 23, 'DOWN', 'farfetchd', '🦆 FARFETCH’D', 
        [
          "FARFETCH'D: Quaaack! It clutches its fresh green onion stalk proudly!",
        ],
        { action: 'FARFETCHD_HERD_EVENT' }
      ),
      makeNpc('cut_master', 16, 28, 'DOWN', 'elder', '🧔 CHARCOAL MASTER', 
        [
          "Thank you for finding our FARFETCH'D! Without it, we couldn't collect wood for the kiln!",
          'As a reward, take HM01 CUT! With the HIVEBADGE, you can cut down small thorny trees blocking paths!',
        ],
        { action: 'CHARCOAL_MASTER_EVENT' }
      ),
      makeNpc('headbutt_tutor', 15, 14, 'RIGHT', 'boy', '🥊 HEADBUTT GUY', 
        [
          "What am I doing? I'm shaking trees using HEADBUTT! It's so much fun!",
          "Rattle trees with HEADBUTT! Sometimes sleeping POKéMON fall right out on you!",
        ],
        { action: 'HEADBUTT_TUTOR_EVENT' }
      ),
      makeNpc('bug_catcher_wayne', 12, 1, 'DOWN', 'bug_catcher', '🐛 BUG CATCHER WAYNE', 
        [
          "BUG CATCHER WAYNE: I found all kinds of neat bug POKéMON in these woods! Don't step on them!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_wayne',
          trainerName: 'Bug Catcher Wayne',
          visionRange: 2,
          challengePages: ["BUG CATCHER WAYNE: Don't sneak up on me in the dark forest!"],
          trainerPokemon: { speciesId: 'paras', level: 10, moves: ['scratch', 'stunspore'] },
          trainerTeam: [
            { speciesId: 'paras', level: 10, moves: ['scratch', 'stunspore'] },
            { speciesId: 'spinarak', level: 12, moves: ['poisonsting', 'stringshot', 'scaryface'] },
          ],
        }
      ),
      makeNpc('forest_lass', 7, 23, 'DOWN', 'girl', '👧 LASS', 
        [
          'Did something happen to the shrine deeper in the forest?',
          'My grandma said a mythical POKéMON watches over all the trees in ILEX FOREST.',
        ]
      ),
    ],
    route_34_ilex_forest_gate: [
      makeNpc('gate_teacher', 3, 3, 'RIGHT', 'teacher', '👩‍🏫 TEACHER', 
        [
          "Oh, honey. You're making a POKéDEX? Here, take TM12 SWEET SCENT! It lures wild POKéMON right to you!",
          'Use it in tall grass to attract wild POKéMON anytime!',
        ],
        { action: 'SWEET_SCENT_TEACHER_EVENT' }
      ),
      makeNpc('gate_butterfree', 4, 3, 'LEFT', 'lass', '🦋 BUTTERFREE', 
        ['BUTTERFREE: Freeh! It spreads a sweet, soothing floral scent around the gatehouse.']
      ),
    ],
  };
}
