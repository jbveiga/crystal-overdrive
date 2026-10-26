import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createGoldenrodCityNpcs(): Record<string, GridEntity[]> {
  return {
    route_34: [
      makeNpc(
        'camper_todd',
        13,
        7,
        'LEFT',
        'camper',
        '⛺ CAMPER TODD',
        ["I'm confident in my ability to raise POKéMON. Want to see?"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'camper_todd',
          trainerName: 'Camper Todd',
          visionRange: 5,
          challengePages: ["CAMPER TODD: I'm confident in my ability to raise POKéMON. Want to see?"],
          trainerPokemon: { speciesId: 'psyduck', level: 14, moves: ['scratch', 'tailwhip', 'watergun', 'confusion'] },
          trainerTeam: [
            { speciesId: 'psyduck', level: 14, moves: ['scratch', 'tailwhip', 'watergun', 'confusion'] },
          ],
        }
      ),
      makeNpc(
        'youngster_samuel',
        15,
        32,
        'DOWN',
        'youngster',
        '🧢 YOUNGSTER SAMUEL',
        ['This is where I do my training!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_samuel',
          trainerName: 'Youngster Samuel',
          visionRange: 3,
          challengePages: ['YOUNGSTER SAMUEL: This is where I do my training!'],
          trainerPokemon: { speciesId: 'rattata', level: 7, moves: ['tackle', 'tailwhip', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 7, moves: ['tackle', 'tailwhip', 'quickattack'] },
            { speciesId: 'sandshrew', level: 10, moves: ['scratch', 'defensecurl', 'sandattack'] },
            { speciesId: 'spearow', level: 8, moves: ['peck', 'growl', 'leer'] },
            { speciesId: 'spearow', level: 8, moves: ['peck', 'growl', 'leer'] },
          ],
        }
      ),
      makeNpc(
        'youngster_ian',
        11,
        20,
        'DOWN',
        'youngster',
        '🧢 YOUNGSTER IAN',
        ["I'm the best in my class at POKéMON."],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_ian',
          trainerName: 'Youngster Ian',
          visionRange: 3,
          challengePages: ["YOUNGSTER IAN: I'm the best in my class at POKéMON."],
          trainerPokemon: { speciesId: 'mankey', level: 10, moves: ['scratch', 'leer', 'lowkick', 'karatechop'] },
          trainerTeam: [
            { speciesId: 'mankey', level: 10, moves: ['scratch', 'leer', 'lowkick', 'karatechop'] },
            { speciesId: 'diglett', level: 12, moves: ['scratch', 'growl', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'picnicker_gina',
        10,
        26,
        'RIGHT',
        'picnicker',
        '👧 PICNICKER GINA',
        ["Are you a trainer? Let's have a practice battle."],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'picnicker_gina',
          trainerName: 'Picnicker Gina',
          visionRange: 3,
          challengePages: ["PICNICKER GINA: Are you a trainer? Let's have a practice battle."],
          trainerPokemon: { speciesId: 'hoppip', level: 9, moves: ['splash', 'tailwhip', 'tackle'] },
          trainerTeam: [
            { speciesId: 'hoppip', level: 9, moves: ['splash', 'tailwhip', 'tackle'] },
            { speciesId: 'hoppip', level: 9, moves: ['splash', 'tailwhip', 'tackle'] },
            { speciesId: 'bulbasaur', level: 12, moves: ['tackle', 'growl', 'leechseed', 'vinewhip'] },
          ],
        }
      ),
      makeNpc(
        'officer_keith',
        9,
        11,
        'DOWN',
        'officer',
        '👮 OFFICER KEITH',
        ["I'm on patrol for suspicious individuals.", "It's safe now, but trouble stirs after dark."],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'officer_keith',
          trainerName: 'Officer Keith',
          visionRange: 3,
          challengePages: ['OFFICER KEITH: Who goes there? What are you up to?'],
          trainerPokemon: { speciesId: 'growlithe', level: 17, moves: ['bite', 'roar', 'ember', 'leer'] },
          trainerTeam: [
            { speciesId: 'growlithe', level: 17, moves: ['bite', 'roar', 'ember', 'leer'] },
          ],
        }
      ),
      makeNpc(
        'pokefan_brandon',
        18,
        28,
        'LEFT',
        'fat_man',
        '🎀 POKéFAN BRANDON',
        ["I just got my POKéMON back from DAY-CARE. Let's see how much stronger it got!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokefan_brandon',
          trainerName: 'Pokefan Brandon',
          visionRange: 3,
          challengePages: ["POKéFAN BRANDON: I just got my POKéMON back from DAY-CARE. Let's see how much stronger it got!"],
          trainerPokemon: { speciesId: 'snubbull', level: 13, moves: ['tackle', 'scaryface', 'bite', 'charm'], heldItem: 'berry' },
          trainerTeam: [
            { speciesId: 'snubbull', level: 13, moves: ['tackle', 'scaryface', 'bite', 'charm'], heldItem: 'berry' },
          ],
        }
      ),
      makeNpc(
        'cooltrainer_irene',
        11,
        48,
        'LEFT',
        'girl',
        '🏊 COOLTRAINER IRENE',
        ['Kyaaah! Someone entered our swimming lagoon!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'cooltrainer_irene',
          trainerName: 'Cooltrainer Irene',
          visionRange: 5,
          challengePages: ['COOLTRAINER IRENE: Kyaaah! Someone entered our swimming lagoon!'],
          trainerPokemon: { speciesId: 'goldeen', level: 22, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
          trainerTeam: [
            { speciesId: 'goldeen', level: 22, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
            { speciesId: 'seaking', level: 24, moves: ['peck', 'tailwhip', 'waterfall', 'hornattack'] },
          ],
        }
      ),
      makeNpc(
        'cooltrainer_jenn',
        3,
        48,
        'RIGHT',
        'girl',
        '🏊 COOLTRAINER JENN',
        ["You can't defeat the three of us!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'cooltrainer_jenn',
          trainerName: 'Cooltrainer Jenn',
          visionRange: 3,
          challengePages: ["COOLTRAINER JENN: You can't defeat the three of us!"],
          trainerPokemon: { speciesId: 'staryu', level: 24, moves: ['tackle', 'harden', 'watergun', 'recover'] },
          trainerTeam: [
            { speciesId: 'staryu', level: 24, moves: ['tackle', 'harden', 'watergun', 'recover'] },
            { speciesId: 'starmie', level: 26, moves: ['watergun', 'recover', 'swift', 'confuseray'] },
          ],
        }
      ),
      makeNpc(
        'cooltrainer_kate',
        6,
        51,
        'UP',
        'girl',
        '🏊 COOLTRAINER KATE',
        ["I'm the strongest sister! Let's see what you've got!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'cooltrainer_kate',
          trainerName: 'Cooltrainer Kate',
          visionRange: 2,
          challengePages: ["COOLTRAINER KATE: I'm the strongest sister! Let's see what you've got!"],
          trainerPokemon: { speciesId: 'shellder', level: 26, moves: ['tackle', 'withdraw', 'iciclespear', 'clamp'] },
          trainerTeam: [
            { speciesId: 'shellder', level: 26, moves: ['tackle', 'withdraw', 'iciclespear', 'clamp'] },
            { speciesId: 'cloyster', level: 28, moves: ['withdraw', 'aurorabeam', 'spikedepp', 'clamp'] },
          ],
        }
      ),
    ],
    day_care: [
      makeNpc(
        'day_care_man',
        2,
        3,
        'DOWN',
        'elder',
        '👴 DAY-CARE MAN',
        [
          "I'm the DAY-CARE MAN. We were shocked to find an EGG in the meadow!",
          "Wouldn't you like this EGG? Please take good care of it!",
        ]
      ),
      makeNpc(
        'day_care_lady',
        5,
        3,
        'DOWN',
        'mom',
        '👵 DAY-CARE LADY',
        [
          "I'm the DAY-CARE LADY. Should I raise a POKéMON for you?",
        ]
      ),
    ],
    goldenrod_city: [
      makeNpc(
        'goldenrod_pokefan',
        18,
        14,
        'DOWN',
        'fat_man',
        '🎩 GENTLEMAN',
        [
          'GOLDENROD CITY is the grandest metropolis in JOHTO!',
          'We have a 6-story DEPT. STORE, a bustling GAME CORNER, and the famous RADIO TOWER!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'goldenrod_lass',
        30,
        18,
        'LEFT',
        'girl',
        '👧 LASS',
        [
          'WHITNEY at the GYM is super cute, but her MILTANK’s ROLLOUT attack is terrifying!',
          'It builds up speed and power every single turn!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'goldenrod_cooltrainer',
        28,
        22,
        'UP',
        'boy',
        '🧢 COOLTRAINER',
        [
          'The MAGNET TRAIN station is just north of here! It connects JOHTO directly to KANTO at 340 miles per hour!',
        ]
      ),
      makeNpc(
        'goldenrod_fisher',
        12,
        9,
        'DOWN',
        'fisherman',
        '🎣 FISHER',
        [
          'You can take the UNDERGROUND tunnel to cross under town, browse the herb shop, and groom your POKéMON!',
        ]
      ),
    ],
    goldenrod_gym: [
      makeNpc(
        'whitney',
        10,
        3,
        'DOWN',
        'girl',
        '🎀 LEADER WHITNEY',
        [
          "WHITNEY: You're really amazing! The PLAINBADGE proves your strength!",
          'NORMAL-type POKéMON have so much versatility. Keep believing in your team!',
        ],
        {
          action: 'WHITNEY_EVENT',
          trainerId: 'whitney',
          trainerName: 'Leader Whitney',
          challengePages: [
            "WHITNEY: Hi! I'm WHITNEY! Everyone was into POKéMON, so I got into it too! POKéMON are super cute! You think you can beat mine? Don't cry if you lose!",
          ],
          trainerPokemon: { speciesId: 'miltank', level: 20, moves: ['rollout', 'attract', 'stomp', 'milkdrink'] },
          trainerTeam: [
            { speciesId: 'clefairy', level: 18, moves: ['doubleslap', 'mimic', 'encore', 'metronome'] },
            { speciesId: 'miltank', level: 20, moves: ['rollout', 'attract', 'stomp', 'milkdrink'] },
          ],
        }
      ),
      makeNpc(
        'lass_carrie',
        9,
        13,
        'DOWN',
        'girl',
        '👧 LASS CARRIE',
        ['Don’t underestimate our cute POKéMON!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'lass_carrie',
          trainerName: 'Lass Carrie',
          visionRange: 3,
          challengePages: ['LASS CARRIE: You want to see WHITNEY? You have to get through me first!'],
          trainerPokemon: { speciesId: 'snubbull', level: 18, moves: ['tackle', 'scaryface', 'bite'] },
          trainerTeam: [
            { speciesId: 'snubbull', level: 18, moves: ['tackle', 'scaryface', 'bite'] },
          ],
        }
      ),
      makeNpc(
        'lass_bridget',
        9,
        6,
        'LEFT',
        'girl',
        '👧 LASS BRIDGET',
        [
          'WHITNEY is so pretty, but she gets emotional after tough battles!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'lass_bridget',
          trainerName: 'Lass Bridget',
          visionRange: 3,
          challengePages: ['LASS BRIDGET: I like cute POKéMON! Do you like cute POKéMON too?'],
          trainerPokemon: { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
          trainerTeam: [
            { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
            { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
            { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
          ],
        }
      ),
      makeNpc(
        'beauty_victoria',
        13,
        8,
        'LEFT',
        'girl',
        '💄 BEAUTY VICTORIA',
        ['SENTRET is so fluffy and quick!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'beauty_victoria',
          trainerName: 'Beauty Victoria',
          visionRange: 3,
          challengePages: ['BEAUTY VICTORIA: Oh, what a cute challenger! Let’s have a lovely battle!'],
          trainerPokemon: { speciesId: 'sentret', level: 17, moves: ['tackle', 'defensecurl', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'sentret', level: 9, moves: ['tackle', 'defensecurl'] },
            { speciesId: 'sentret', level: 13, moves: ['tackle', 'defensecurl', 'quickattack'] },
            { speciesId: 'sentret', level: 17, moves: ['tackle', 'defensecurl', 'quickattack'] },
          ],
        }
      ),
      makeNpc(
        'beauty_samantha',
        5,
        9,
        'RIGHT',
        'girl',
        '💄 BEAUTY SAMANTHA',
        ['MEOWTH loves shiny coins and quick scratches!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'beauty_samantha',
          trainerName: 'Beauty Samantha',
          visionRange: 3,
          challengePages: ['BEAUTY SAMANTHA: Don’t blink or my MEOWTH will take your prize money!'],
          trainerPokemon: { speciesId: 'meowth', level: 16, moves: ['scratch', 'growl', 'bite', 'payday'] },
          trainerTeam: [
            { speciesId: 'meowth', level: 16, moves: ['scratch', 'growl', 'bite', 'payday'] },
            { speciesId: 'meowth', level: 16, moves: ['scratch', 'growl', 'bite', 'payday'] },
          ],
        }
      ),
      makeNpc(
        'goldenrod_gym_guide',
        3,
        15,
        'UP',
        'fat_man',
        '🥊 GYM GUIDE',
        [
          'Yo! CHAMP in the making!',
          'WHITNEY uses NORMAL-type POKéMON! FIGHTING-type moves are super effective against them!',
          'Beware of MILTANK’s MILK DRINK and ROLLOUT—if it rolls consecutively, it hits like a freight train!',
        ]
      ),
    ],
    goldenrod_poke_center: [
      makeNpc(
        'goldenrod_nurse_joy',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to the GOLDENROD POKéMON CENTER!',
          'We heal your POKéMON to full health in no time.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'goldenrod_pc_clerk',
        1,
        6,
        'RIGHT',
        'fat_man',
        '👨‍💼 NETWORK CLERK',
        ['This POKéMON CENTER connects trainers across the globe through high-speed mobile communications!']
      ),
      makeNpc(
        'goldenrod_pc_lass',
        6,
        4,
        'LEFT',
        'girl',
        '👧 LASS',
        ['A boy on the 5th floor of the DEPT. STORE traded me a MACHOP named MUSCLE!']
      ),
    ],
    goldenrod_bike_shop: [
      makeNpc(
        'bike_shop_owner',
        2,
        3,
        'DOWN',
        'fat_man',
        '🚲 BIKE SHOP OWNER',
        [
          'Welcome to MIRACLE CYCLE! I moved here from CERULEAN CITY, but nobody knows my bikes yet!',
          'Would you take one of our BICYCLES and ride it everywhere to advertise for me? It’ll double your travel speed!',
        ]
      ),
    ],
    goldenrod_flower_shop: [
      makeNpc(
        'florist',
        2,
        3,
        'DOWN',
        'girl',
        '🌸 FLORIST',
        [
          'Have you seen that weird, wiggling tree on ROUTE 36? Whenever anyone splashes water on it, it gets furious!',
          'Take this SQUIRTBOTTLE! Use it on that tree and see what happens!',
        ]
      ),
    ],
    goldenrod_game_corner: [
      makeNpc(
        'coin_guy',
        14,
        6,
        'LEFT',
        'fat_man',
        '🎰 PRIZE CLERK',
        ['You can trade GAME CORNER coins for valuable TMs like BLIZZARD, FIRE BLAST, and THUNDER, or rare POKéMON!']
      ),
      makeNpc(
        'slot_player',
        5,
        8,
        'UP',
        'boy',
        '👦 SLOT PLAYER',
        ['7-7-7! Come on! Just one more match! The slot machines here are so addictive!']
      ),
    ],
    goldenrod_name_rater: [
      makeNpc(
        'name_rater',
        2,
        3,
        'DOWN',
        'elder',
        '👴 NAME RATER',
        [
          'Hello, hello! I am the official NAME RATER! I evaluate the nicknames of POKéMON!',
          'A fine nickname deepens the friendship between you and your companion!',
        ]
      ),
    ],
    goldenrod_bill_house: [
      makeNpc(
        'bills_mother',
        2,
        3,
        'DOWN',
        'mom',
        "👩 BILL'S MOM",
        [
          'My son BILL created the POKéMON STORAGE SYSTEM! He’s in ECRUTEAK CITY right now helping friends with the TIME CAPSULE.',
        ]
      ),
      makeNpc(
        'bills_sister',
        5,
        4,
        'LEFT',
        'girl',
        "👧 BILL'S SISTER",
        ['My big brother loves EEVEE! If you visit our family in Ecruteak, he might have a gift for you!']
      ),
      makeNpc(
        'bill',
        2,
        4,
        'RIGHT',
        'boy',
        '💻 BILL',
        [
          'BILL: Hi, Gold! Thanks for helping out with the PC Storage System!',
          'I have this rare EEVEE that was sent to me. Would you take good care of it?',
        ]
      ),
    ],
    goldenrod_magnet_train_station: [
      makeNpc(
        'station_officer',
        9,
        9,
        'DOWN',
        'fat_man',
        '👮 STATION OFFICER',
        [
          'The MAGNET TRAIN reaches speeds over 340 mph between GOLDENROD and SAFFRON CITY!',
          'Only authorized travelers with a RAIL PASS may board the train.',
        ]
      ),
      makeNpc(
        'train_passenger',
        5,
        14,
        'RIGHT',
        'boy',
        '👦 PASSENGER',
        ['I can’t wait to ride the bullet train all the way to KANTO!']
      ),
    ],
    goldenrod_underground: [
      makeNpc(
        'true_director',
        24,
        25,
        'DOWN',
        'elder',
        '📻 REAL DIRECTOR',
        [
          "DIRECTOR: Ah! You found me! I was kidnapped and locked in this dark underground warehouse by TEAM ROCKET!",
          "They disguised an executive as me to hijack our broadcast frequency!",
          "Take this CARD KEY! It opens the security shutters on the 3rd floor of the RADIO TOWER!",
        ],
        { action: 'TRUE_DIRECTOR_EVENT' }
      ),
      makeNpc(
        'super_nerd_eric',
        8,
        12,
        'DOWN',
        'boy',
        '🤓 SUPER NERD ERIC',
        ['My electric and poison POKéMON thrive in the subterranean tunnels!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'super_nerd_eric',
          trainerName: 'Super Nerd Eric',
          visionRange: 3,
          challengePages: ['SUPER NERD ERIC: The underground is my secret laboratory! Prepare for a shock!'],
          trainerPokemon: { speciesId: 'grimer', level: 12, moves: ['pound', 'poisongas', 'harden'] },
          trainerTeam: [
            { speciesId: 'grimer', level: 12, moves: ['pound', 'poisongas', 'harden'] },
            { speciesId: 'magnemite', level: 12, moves: ['tackle', 'thundershock', 'supersonic'] },
          ],
        }
      ),
      makeNpc(
        'pokemaniac_donald',
        8,
        24,
        'UP',
        'boy',
        '🎒 POKÉMANIAC DONALD',
        ['SLOWPOKE may be slow, but its psychic power is immense!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokemaniac_donald',
          trainerName: 'Pokemaniac Donald',
          visionRange: 3,
          challengePages: ['POKÉMANIAC DONALD: Underground trainers have the best costume parties! Battle me!'],
          trainerPokemon: { speciesId: 'slowpoke', level: 13, moves: ['confusion', 'tackle', 'growl'] },
          trainerTeam: [
            { speciesId: 'slowpoke', level: 13, moves: ['confusion', 'tackle', 'growl'] },
          ],
        }
      ),
    ],
  };
}
