/**
 * @fileoverview kantoCeladonNpcs domain module implementation.
 * @module world/npcs/kantoCeladonNpcs
 * @role Celadon City, Celadon Gym, Dept Store, Mansion, Cafe & Route 8 NPCs Component
 * @exports createKantoCeladonNpcs
 * @layer world
 * @sections L1-20: Micro-Header & Imports | L21-120: Route 7/8 & Gates | L121-230: Celadon City & Gym | L231-330: Mansion & Cafe | L331-450: Dept Store & Elevator
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

/**
 * Creates handcrafted NPC lists for Route 7 Gate, Route 8 Gate, Route 8,
 * Celadon City Hub, Celadon Gym, Celadon Cafe, Celadon Mansion,
 * Celadon Dept Store (1F-6F), and Elevator.
 */
export function createKantoCeladonNpcs(): Record<string, GridEntity[]> {
  return {
    route_7_saffron_gate: [
      makeNpc( 'route_7_saffron_gate_officer', 5, 2, 'DOWN', 'officer', '👮 OFFICER', [ "Welcome to the SAFFRON CITY WEST GATE.", "CELADON CITY is just down ROUTE 7 to the west. Watch out for rowdy trainers along the way!", ] ),
    ],

    route_8_saffron_gate: [
      makeNpc( 'route_8_saffron_gate_officer', 5, 2, 'DOWN', 'officer', '👮 OFFICER', [ "Welcome to the SAFFRON CITY EAST GATE.", "ROUTE 8 extends eastward toward LAVENDER TOWN. The KANTO POKéMON FEDERATION bikers roam the roads ahead.", ] ),
    ],

    route_8: [
      makeNpc( 'route_8_dwayne', 10, 8, 'LEFT', 'youngster', '🏍️ BIKER DWAYNE', ['The KANTO POKéMON FEDERATION will never fall!'], {
          action: 'ROUTE_8_TRAINER',
          trainerId: 'biker_dwayne',
          trainerName: 'Biker Dwayne',
          visionRange: 3,
          challengePages: [
            "We're the KANTO POKéMON FEDERATION trainer group.",
            "We'll drive you under our wheels!",
          ],
          defeatPages: ['S-sorry!'],
          trainerTeam: [
            { speciesId: 'koffing', level: 27, moves: ['tackle', 'smog', 'poisongas'] },
            { speciesId: 'koffing', level: 27, moves: ['tackle', 'smog', 'poisongas'] },
          ],
        }
      ),
      makeNpc( 'route_8_harris', 10, 9, 'LEFT', 'youngster', '🏍️ BIKER HARRIS', ['Wiped out by some punk from JOHTO…'], {
          action: 'ROUTE_8_TRAINER',
          trainerId: 'biker_harris',
          trainerName: 'Biker Harris',
          visionRange: 3,
          challengePages: [
            "The cops shut down our UNDERGROUND PATH! That really fries me!",
          ],
          defeatPages: ['F-forgive me!'],
          trainerTeam: [
            { speciesId: 'flareon', level: 34, moves: ['tackle', 'bite', 'quickattack', 'ember'] },
          ],
        }
      ),
      makeNpc( 'route_8_zeke', 10, 10, 'LEFT', 'youngster', '🏍️ BIKER ZEKE', ['We will try not to disturb anyone from now on…'], {
          action: 'ROUTE_8_TRAINER',
          trainerId: 'biker_zeke',
          trainerName: 'Biker Zeke',
          visionRange: 3,
          challengePages: [
            "We're the KANTO POKéMON FEDERATION! Right on!",
          ],
          defeatPages: ['Yikes! Sorry!'],
          trainerTeam: [
            { speciesId: 'koffing', level: 32, moves: ['tackle', 'smog', 'sludge'] },
          ],
        }
      ),
      makeNpc( 'route_8_sam', 23, 2, 'DOWN', 'super_nerd', '👓 SUPER NERD SAM', ['The power of magnets is awesome!'], {
          action: 'ROUTE_8_TRAINER',
          trainerId: 'super_nerd_sam',
          trainerName: 'Super Nerd Sam',
          visionRange: 3,
          challengePages: [
            'How does the MAGNET TRAIN work? Care to show me your team?',
          ],
          defeatPages: ['I just want to see the MAGNET TRAIN…'],
          trainerTeam: [
            { speciesId: 'grimer', level: 34, moves: ['pound', 'disable', 'sludge'] },
            { speciesId: 'muk', level: 34, moves: ['pound', 'sludge', 'minimize'] },
          ],
        }
      ),
      makeNpc( 'route_8_tom', 31, 12, 'DOWN', 'super_nerd', '👓 SUPER NERD TOM', ['GYM BADGES give you immense advantages in battles.'], {
          action: 'ROUTE_8_TRAINER',
          trainerId: 'super_nerd_tom',
          trainerName: 'Super Nerd Tom',
          visionRange: 3,
          challengePages: [
            "Hm… You've got many GYM BADGES. Let's see if you can handle my electric power!",
          ],
          defeatPages: ['Just as I thought… You are tough!'],
          trainerTeam: [
            { speciesId: 'magnemite', level: 32, moves: ['thundershock', 'sonicboom', 'thunderwave'] },
            { speciesId: 'magneton', level: 32, moves: ['thundershock', 'sonicboom', 'thunderwave'] },
          ],
        }
      ),
    ],

    celadon_city: [
      makeNpc( 'celadon_city_cut_tree', 10, 31, 'DOWN', 'fruit_tree', '🌳 CUTTABLE TREE', ['This tree looks like it can be CUT down!'], { action: 'CELADON_CUT_TREE' }
      ),
      makeNpc( 'celadon_city_fisher', 26, 11, 'RIGHT', 'fisherman', '🎣 FISHER', [ "This small pond is full of lively aquatic Pokémon!", "Celadon is a huge city, but there are peaceful spots if you look carefully.", ] ),
      makeNpc( 'celadon_city_teacher_1', 20, 24, 'LEFT', 'teacher', '👩 TEACHER', [ "The CELADON DEPT. STORE has everything a trainer could ever desire!", "I spent my entire month's salary on healing items and evolution stones!", ] ),
      makeNpc( 'celadon_city_gramps_1', 13, 16, 'DOWN', 'fat_man', '👴 GRAMPS', [ "The CELADON MANSION stands tall right behind me.", "Talented folks work in there, including the famous GAME FREAK developers!", ] ),
      makeNpc( 'celadon_city_gramps_2', 8, 31, 'UP', 'fat_man', '👴 GRAMPS', [ "Hehehe! This GYM is delightful! It is only for girls!", "ERIKA is our city's pride and joy. Her grass Pokémon are simply majestic!", ] ),
      makeNpc( 'celadon_city_youngster_1', 18, 13, 'LEFT', 'youngster', '👦 YOUNGSTER', [ "Have you tried the Eatathon contest at the Celadon Cafe?", "The food smells delicious, but the contestants eat like Snorlax!", ] ),
      makeNpc( 'celadon_city_youngster_2', 24, 33, 'UP', 'youngster', '👦 YOUNGSTER', [ "If you want to enter the CELADON GYM, you'll need HM01 CUT to slice through the shrub!", ] ),
      makeNpc( 'celadon_city_teacher_2', 6, 14, 'DOWN', 'teacher', '👩 CITIZEN', [ "Celadon is known as the City of the Rainbow's Colors. It lives up to its name!", ] ),
      makeNpc( 'celadon_city_lass', 7, 22, 'UP', 'lass', '👧 LASS', [ "I love walking around Celadon! Everything feels bright and cheerful.", ] ),
    ],

    celadon_gym: [
      makeNpc( 'celadon_gym_erika', 5, 3, 'DOWN', 'kimono_girl', '🌸 LEADER ERIKA', [ "Hello… Lovely weather, isn't it? It's so pleasant… …I'm afraid I may doze off…", "My name is ERIKA. I am the LEADER of CELADON GYM.", "…Oh? All the way from JOHTO, you say? How nice… Very well, but I shall not lose.", ], {
          action: 'ERIKA_EVENT',
          trainerId: 'erika',
          trainerName: 'Leader Erika',
          team: [
            { speciesId: 'tangela', level: 42, moves: ['gigadrain', 'vinewhip', 'bind', 'sleeppowder'] },
            { speciesId: 'jumpluff', level: 41, moves: ['gigadrain', 'megadrain', 'leechseed', 'cottonspore'] },
            { speciesId: 'victreebel', level: 46, moves: ['gigadrain', 'sludgebomb', 'razorleaf', 'sweetscent'] },
            { speciesId: 'bellossom', level: 46, moves: ['gigadrain', 'sunnyday', 'solarbeam', 'synthesis'] },
          ],
        }
      ),
      makeNpc( 'celadon_gym_michelle', 7, 8, 'LEFT', 'lass', '🎀 LASS MICHELLE', ['I just got careless, that is all!'], {
          action: 'CELADON_GYM_TRAINER',
          trainerId: 'celadon_gym_michelle',
          trainerName: 'Lass Michelle',
          visionRange: 2,
          challengePages: ['Do you think a girls-only GYM is rare?'],
          defeatPages: ['Oh, bleah!'],
          trainerTeam: [
            { speciesId: 'skiploom', level: 32, moves: ['tackle', 'tailwhip', 'megadrain', 'leechseed'] },
            { speciesId: 'hoppip', level: 33, moves: ['tackle', 'tailwhip', 'megadrain', 'cottonspore'] },
            { speciesId: 'jumpluff', level: 34, moves: ['tackle', 'tailwhip', 'megadrain', 'leechseed'] },
          ],
        }
      ),
      makeNpc( 'celadon_gym_tanya', 2, 8, 'RIGHT', 'picnicker', '🧺 PICNICKER TANYA', ['Oh, look at all your BADGES. No wonder I could not win!'], {
          action: 'CELADON_GYM_TRAINER',
          trainerId: 'celadon_gym_tanya',
          trainerName: 'Picnicker Tanya',
          visionRange: 2,
          challengePages: ['Oh, a battle? That is kind of scary, but OK!'],
          defeatPages: ['Oh, that is it?'],
          trainerTeam: [
            { speciesId: 'exeggutor', level: 37, moves: ['confusion', 'stomp', 'solarbeam', 'hypnosis'] },
          ],
        }
      ),
      makeNpc( 'celadon_gym_julia', 3, 5, 'RIGHT', 'beauty', '💄 BEAUTY JULIA', ['How do I go about becoming ladylike like ERIKA?'], {
          action: 'CELADON_GYM_TRAINER',
          trainerId: 'celadon_gym_julia',
          trainerName: 'Beauty Julia',
          visionRange: 2,
          challengePages: ['Were you looking at these flowers or at me?'],
          defeatPages: ['How annoying!'],
          trainerTeam: [
            { speciesId: 'paras', level: 32, moves: ['scratch', 'spore', 'slash', 'leechlife'] },
            { speciesId: 'exeggcute', level: 32, moves: ['barrage', 'hypnosis', 'confusion', 'reflect'] },
            { speciesId: 'parasect', level: 35, moves: ['slash', 'spore', 'gigadrain', 'furyswipes'] },
          ],
        }
      ),
      makeNpc( 'celadon_gym_twins_jo_zoe_1', 4, 10, 'DOWN', 'lass', '👯 TWINS JO & ZOE', ['ERIKA will get you back for us!'], {
          action: 'CELADON_GYM_TRAINER',
          trainerId: 'celadon_gym_twins_jo_zoe',
          trainerName: 'Twins Jo & Zoe',
          visionRange: 1,
          challengePages: ["We'll show you Pokémon moves that ERIKA taught us!"],
          defeatPages: ['Oh… We lost…'],
          trainerTeam: [
            { speciesId: 'victreebel', level: 35, moves: ['vinewhip', 'acid', 'razorleaf', 'sweetscent'] },
            { speciesId: 'vileplume', level: 35, moves: ['petaldance', 'toxic', 'megadrain', 'sleeppowder'] },
          ],
        }
      ),
      makeNpc( 'celadon_gym_twins_jo_zoe_2', 5, 10, 'DOWN', 'lass', '👯 TWINS JO & ZOE', ['ERIKA is much, much stronger than both of us!'], {
          action: 'CELADON_GYM_TRAINER',
          trainerId: 'celadon_gym_twins_jo_zoe',
          trainerName: 'Twins Jo & Zoe',
          visionRange: 1,
          challengePages: ["We're going to protect ERIKA!"],
          defeatPages: ["We couldn't win…"],
          trainerTeam: [
            { speciesId: 'victreebel', level: 35, moves: ['vinewhip', 'acid', 'razorleaf', 'sweetscent'] },
            { speciesId: 'vileplume', level: 35, moves: ['petaldance', 'toxic', 'megadrain', 'sleeppowder'] },
          ],
        }
      ),
      makeNpc( 'celadon_gym_guide', 3, 16, 'UP', 'fat_man', '🏆 GYM GUIDE', [ "Yo! CHAMP in making!", "CELADON GYM is full of graceful Grass-type Pokémon users.", "Fire, Flying, and Ice attacks will wither their floral defenses!", ], { action: 'CELADON_GYM_GUIDE' }
      ),
    ],

    celadon_cafe: [
      makeNpc( 'celadon_cafe_chef', 9, 3, 'LEFT', 'super_nerd', '👨‍🍳 CAFE CHEF', [ "Hi! We're holding an eatathon contest.", "We can't serve you right now. Sorry!", ] ),
      makeNpc( 'celadon_cafe_fisher_1', 4, 6, 'LEFT', 'fisherman', '🎣 CONTESTANT', [ "…Snarfle, chew…", "Don't talk to me! You'll break my concentration!", ] ),
      makeNpc( 'celadon_cafe_fisher_2', 1, 7, 'RIGHT', 'fisherman', '🎣 CONTESTANT', [ "…Gulp… Chew…", "I take quantity over quality! I'm happy when I'm full!", ] ),
      makeNpc( 'celadon_cafe_fisher_3', 1, 2, 'RIGHT', 'fisherman', '🎣 CONTESTANT', [ "Munch, munch…", "The food is good here, but GOLDENROD has the best food anywhere.", ] ),
      makeNpc( 'celadon_cafe_teacher', 4, 3, 'LEFT', 'teacher', '👩 EATING CHAMPION', [ "Crunch… Crunch…", "I can keep eating all day! More, CHEF!", ] ),
    ],

    celadon_mansion_1f: [
      makeNpc( 'celadon_mansion_granny', 1, 5, 'DOWN', 'fat_man', '👵 APARTMENT MANAGER', [ "Welcome to the CELADON MANSION!", "The upper floors are bustling with creative developers and residents.", ] ),
    ],

    celadon_mansion_3f: [
      makeNpc( 'game_freak_designer', 3, 6, 'DOWN', 'super_nerd', '🎮 GAME DESIGNER', [ "I'm the GAME DESIGNER!", "Filling up your Pokédex is tough, but keep at it!", ] ),
      makeNpc( 'game_freak_programmer', 3, 4, 'UP', 'super_nerd', '💻 PROGRAMMER', [ "I'm the PROGRAMMER! Playing this game is great, but coding it was even more fun!", ] ),
      makeNpc( 'game_freak_artist', 0, 7, 'UP', 'super_nerd', '🎨 GRAPHIC ARTIST', [ "I'm the GRAPHIC ARTIST! Aren't the Pokémon sprites beautifully animated?", ] ),
      makeNpc( 'game_freak_producer', 0, 4, 'UP', 'fisherman', '🎬 PRODUCER', [ "I'm the PRODUCER! Thank you so much for playing CRYSTAL OVERDRIVE!", ] ),
    ],

    celadon_mansion_roof: [
      makeNpc( 'celadon_mansion_roof_fisher', 7, 5, 'UP', 'fisherman', '🎣 ROOF TOURIST', [ "High places are so invigorating! You can see the whole city of Celadon from up here!", ] ),
    ],

    celadon_mansion_roof_house: [
      makeNpc( 'celadon_mansion_storyteller', 3, 2, 'DOWN', 'fat_man', '📖 STORYTELLER', [ "Let me recount a terrifying tale…", ], { action: 'CELADON_MANSION_STORYTELLER' }
      ),
    ],

    celadon_dept_store_1f: [
      makeNpc( 'celadon_dept_store_1f_receptionist', 10, 1, 'DOWN', 'receptionist', '💁 RECEPTIONIST', [ "Welcome to CELADON DEPT. STORE!", "1F: SERVICE COUNTER\n2F: TRAINER'S MARKET\n3F: TM SHOP\n4F: WISE MAN GIFTS\n5F: DRUG STORE\n6F: ROOFTOP SQUARE", ] ),
      makeNpc( 'celadon_dept_store_1f_gentleman', 11, 4, 'DOWN', 'gentleman', '🎩 GENTLEMAN', [ "This department store has everything you could ever need on an adventure.", ] ),
      makeNpc( 'celadon_dept_store_1f_shopper', 5, 3, 'LEFT', 'teacher', '👩 SHOPPER', [ "I come here every weekend to check out the latest inventory!", ] ),
    ],

    celadon_dept_store_2f: [
      makeNpc( 'celadon_dept_store_2f_clerk_left', 13, 5, 'UP', 'clerk', '🏪 2F CLERK', ['Welcome to the 2F TRAINER\'S MARKET!'], { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc( 'celadon_dept_store_2f_clerk_right', 14, 5, 'UP', 'clerk', '🏪 2F CLERK', ['Welcome to the 2F TRAINER\'S MARKET!'], { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc( 'celadon_dept_store_2f_pokefan_m', 5, 2, 'UP', 'pokefan_m', '🧢 POKéFAN', [ "Top-grade items make tough battles so much easier!", ] ),
      makeNpc( 'celadon_dept_store_2f_youngster', 6, 2, 'LEFT', 'youngster', '👦 BOY', [ "Super Potions and Revives are essential when challenging Gym Leaders.", ] ),
    ],

    celadon_dept_store_3f: [
      makeNpc( 'celadon_dept_store_3f_clerk', 7, 1, 'DOWN', 'clerk', '🏪 3F TM CLERK', ['Welcome to the 3F TM SHOP!'], { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc( 'celadon_dept_store_3f_youngster', 6, 4, 'UP', 'youngster', '👦 BOY', [ "TMs in Crystal Overdrive can be used infinitely! Isn't that wonderful?", ] ),
      makeNpc( 'celadon_dept_store_3f_super_nerd', 13, 4, 'DOWN', 'super_nerd', '👓 SUPER NERD', [ "Sunny Day and Rain Dance let you command the weather on the battlefield!", ] ),
    ],

    celadon_dept_store_4f: [
      makeNpc( 'celadon_dept_store_4f_clerk', 13, 5, 'UP', 'clerk', '🏪 4F GIFT CLERK', ['Welcome to the 4F WISE MAN GIFTS!'], { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc( 'celadon_dept_store_4f_super_nerd', 7, 6, 'LEFT', 'super_nerd', '👓 SUPER NERD', [ "Poké Dolls can distract wild Pokémon so you can escape smoothly.", ] ),
      makeNpc( 'celadon_dept_store_4f_youngster', 8, 2, 'UP', 'youngster', '👦 BOY', [ "Sending Mail to friends makes Pokémon trading so memorable!", ] ),
    ],

    celadon_dept_store_5f: [
      makeNpc( 'celadon_dept_store_5f_clerk_left', 7, 5, 'UP', 'clerk', '🏪 5F STONE CLERK', ['Welcome to the 5F EVOLUTION STONE COUNTER!'], { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc( 'celadon_dept_store_5f_clerk_right', 8, 5, 'UP', 'clerk', '🏪 5F VITAMIN CLERK', ['Welcome to the 5F DRUG STORE!'], { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc( 'celadon_dept_store_5f_gentleman', 13, 5, 'DOWN', 'gentleman', '🎩 GENTLEMAN', [ "Vitamins permanently boost your Pokémon's core effort attributes!", ] ),
      makeNpc( 'celadon_dept_store_5f_sailor', 3, 4, 'DOWN', 'fisherman', '⚓ SAILOR', [ "Water Stones trigger evolutions for Poliwhirl, Shellder, and Staryu!", ] ),
      makeNpc( 'celadon_dept_store_5f_shopper', 1, 7, 'RIGHT', 'teacher', '👩 SHOPPER', [ "Thunder Stones and Fire Stones are tough to find in Johto, so stock up here!", ] ),
    ],

    celadon_dept_store_6f: [
      makeNpc( 'celadon_dept_store_6f_super_nerd', 9, 2, 'UP', 'super_nerd', '👓 SUPER NERD', [ "The vending machines here sell Fresh Water, Soda Pop, and Lemonade!", ] ),
      makeNpc( 'celadon_dept_store_6f_youngster', 12, 5, 'DOWN', 'youngster', '👦 BOY', [ "The view from the rooftop garden is spectacular!", ] ),
    ],

    celadon_poke_center: [
      makeNpc('celadon_poke_center_nurse', 3, 1, 'DOWN', 'teacher', '👩‍⚕️ NURSE JOY', ["Hello, and welcome to the POKéMON CENTER.", "We restore your tired POKéMON to full health."], { action: 'HEAL_AND_SAVE', talkAcrossCounter: true }),
      makeNpc('celadon_poke_center_gentleman', 1, 5, 'LEFT', 'gentleman', '🎩 GENTLEMAN', ["The CELADON DEPT. STORE is so enormous, I lost my way on the 4th floor!"]),
      makeNpc('celadon_poke_center_pharmacist', 0, 3, 'DOWN', 'super_nerd', '👓 RESEARCHER', ["Grass-type Pokémon are deeply tied to nature and environmental effects."]),
      makeNpc('celadon_poke_center_cooltrainer_f', 8, 6, 'LEFT', 'cooltrainer_f', '👩 COOLTRAINER', ["ERIKA is admired by trainers all across Kanto for her calm demeanor."]),
      makeNpc('celadon_poke_center_super_nerd', 4, 3, 'DOWN', 'super_nerd', '👓 SUPER NERD', ["Did you know? In Kanto, badges allow you to face the greatest masters."]),
    ],

    celadon_game_corner: [
      makeNpc('celadon_game_corner_clerk', 5, 2, 'DOWN', 'clerk', '🏪 COIN CLERK', ["Welcome to the CELADON GAME CORNER!"], { action: 'OPEN_MART', talkAcrossCounter: true }),
      makeNpc('celadon_game_corner_receptionist', 3, 2, 'DOWN', 'receptionist', '💁 ATTENDANT', ["Play the slot machines and exchange coins for fabulous prizes next door!"]),
      makeNpc('celadon_game_corner_pokefan_m', 14, 10, 'LEFT', 'pokefan_m', '🧢 POKéFAN', ["I'm on a roll! Just one more spin!"]),
      makeNpc('celadon_game_corner_teacher', 17, 7, 'RIGHT', 'teacher', '👩 TEACHER', ["The bright lights and music here are so exciting!"]),
      makeNpc('celadon_game_corner_guru', 11, 7, 'RIGHT', 'fisherman', '🎣 FISHING GURU', ["I won a whole bucket of coins today!"]),
      makeNpc('celadon_game_corner_fisher', 8, 10, 'LEFT', 'fisherman', '🎣 FISHER', ["Luck comes and goes like the ocean tides."]),
      makeNpc('celadon_game_corner_guide', 11, 3, 'DOWN', 'youngster', '👦 BOY', ["The prize room is right next door to the east."]),
      makeNpc('celadon_game_corner_gramps', 2, 8, 'LEFT', 'fat_man', '👴 GRAMPS', ["These slot machines remind me of my younger days in Kanto."]),
    ],

    celadon_game_corner_prize_room: [
      makeNpc('celadon_prize_room_gentleman', 0, 2, 'DOWN', 'gentleman', '🎩 PRIZE CLERK', ["Welcome to the PRIZE EXCHANGE!"]),
      makeNpc('celadon_prize_room_pharmacist', 4, 4, 'UP', 'super_nerd', '👓 COLLECTOR', ["You can trade your coins for rare TMs and Pokémon here!"]),
    ],
  };
}
