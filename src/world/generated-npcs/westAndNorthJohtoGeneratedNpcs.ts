/**
 * @fileoverview Generated object events, trainers, and dialogues for West & North Johto
 * @module world/generated-npcs/westAndNorthJohtoGeneratedNpcs
 * @role West & North Johto Generated NPC records
 * @exports WEST_AND_NORTH_JOHTO_GENERATED_NPCS
 * @layer world
 * @sections L1-25: Micro-Header & Helpers | L26-320: Map Generated NPC Records
 */
import type { GeneratedNpc } from "../generatedNpcs";

const D1 = "Welcome! How may I help you?";
const D2 = "👩‍⚕️ NURSE JOY";
const D3 = "Welcome to our POKéMON CENTER!";
const D4 = "We can heal your POKéMON to full health.";
const D5 = "RECEPTIONIST";
const D6 = "🏆 GYM GUIDE";

const m = (speciesId: string, level: number, moves?: string[]) => moves ? { speciesId, level, moves } : { speciesId, level };
const n = (id: string | undefined, x: number, y: number, dir: GeneratedNpc["dir"], sprite: GeneratedNpc["sprite"], speaker?: string, pages?: string[], extra?: Partial<GeneratedNpc>): GeneratedNpc => {
  const o: GeneratedNpc = { x, y, dir, sprite };
  if (id !== undefined) o.id = id;
  if (speaker !== undefined) o.speaker = speaker;
  if (pages !== undefined) o.pages = pages;
  return extra ? Object.assign(o, extra) : o;
};

const t = (id: string | undefined, x: number, y: number, dir: GeneratedNpc["dir"], sprite: GeneratedNpc["sprite"], speaker: string, pages: string[], trainerId: string, trainerName: string, vision: number, challenge: string[], team: GeneratedNpc["team"], extra?: Partial<GeneratedNpc>): GeneratedNpc => {
  const o: GeneratedNpc = { id, x, y, dir, sprite, speaker, pages, action: "TRAINER_BATTLE", trainerId, trainerName, vision, challenge, team };
  if (id === undefined) delete o.id;
  return extra ? Object.assign(o, extra) : o;
};

export const WEST_AND_NORTH_JOHTO_GENERATED_NPCS: Record<string, GeneratedNpc[]> = {
  "lavender_mart": [
    n("lavender_mart_clerk_0",1,3,"RIGHT","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("lavender_mart_pokefan_m_1",6,6,"LEFT","fat_man","POKEFAN M",undefined),
    n("lavender_mart_rocker_2",9,2,"DOWN","boy","ROCKER",undefined),
  ],
  "lavender_speech_house": [
    n("lavender_speech_house_pokefan_f_0",2,3,"UP","teacher","POKEFAN F",undefined),
  ],
  "lavender_name_rater": [
    n("lavender_name_rater_gentleman_0",2,3,"DOWN","fat_man","GENTLEMAN",undefined),
  ],
  "soul_house": [
    n("soul_house_gramps_0",4,2,"DOWN","fat_man","GRAMPS",undefined),
    n("soul_house_teacher_1",7,3,"LEFT","teacher","TEACHER",undefined),
    n("soul_house_lass_2",2,5,"UP","girl","LASS",undefined),
    n("soul_house_granny_3",1,3,"UP","teacher","GRANNY",undefined),
  ],
  "route_8": [
    t("route_8_biker_0",10,8,"LEFT","boy","⚔️ DWAYNE",["Dwayne: That was a great battle!"],"route_8_dwayne","Biker Dwayne",4,["DWAYNE: Let's battle!"],[m("koffing",27),m("koffing",28),m("koffing",29),m("koffing",30)]),
    t("route_8_biker_1",10,9,"LEFT","boy","⚔️ HARRIS",["Harris: That was a great battle!"],"route_8_harris","Biker Harris",4,["HARRIS: Let's battle!"],[m("flareon",34)]),
    t("route_8_biker_2",10,10,"LEFT","boy","⚔️ ZEKE",["Zeke: That was a great battle!"],"route_8_zeke","Biker Zeke",4,["ZEKE: Let's battle!"],[m("koffing",32),m("koffing",32)]),
    t("route_8_super_nerd_3",23,2,"DOWN","fat_man","⚔️ SAM",["Sam: That was a great battle!"],"route_8_sam","Super Nerd Sam",3,["SAM: Let's battle!"],[m("grimer",34),m("muk",34)]),
    t("route_8_super_nerd_4",31,12,"DOWN","fat_man","⚔️ TOM",["Tom: That was a great battle!"],"route_8_tom","Super Nerd Tom",4,["TOM: Let's battle!"],[m("magnemite",32),m("magnemite",32),m("magnemite",32)]),
  ],
  "route_8_saffron_gate": [
    n("route_8_saffron_gate_officer_0",5,2,"DOWN","fat_man","OFFICER",undefined),
  ],
  "route_7_saffron_gate": [
    n("route_7_saffron_gate_officer_0",5,2,"DOWN","fat_man","OFFICER",undefined),
  ],
  "celadon_city": [
    n("celadon_city_fisher_0",26,11,"RIGHT","fisherman","FISHER",undefined),
    n("celadon_city_teacher_1",20,24,"LEFT","teacher","TEACHER",undefined),
    n("celadon_city_gramps_2",13,16,"DOWN","fat_man","GRAMPS",undefined),
    n("celadon_city_gramps_3",8,31,"UP","fat_man","GRAMPS",undefined),
    n("celadon_city_youngster_4",18,13,"LEFT","boy","YOUNGSTER",undefined),
    n("celadon_city_youngster_5",24,33,"UP","boy","YOUNGSTER",undefined),
    n("celadon_city_teacher_6",6,14,"DOWN","teacher","TEACHER",undefined),
    n("celadon_city_lass_7",7,22,"UP","girl","LASS",undefined),
  ],
  "celadon_gym": [
    n("celadon_gym_erika_0",5,3,"DOWN","girl","🏆 LEADER ERIKA",undefined, {"action":"ERIKA_EVENT","trainerId":"erika","trainerName":"Leader Erika","team":[{"speciesId":"tangela","level":42,"moves":["vinewhip","bind","gigadrain","sleeppowder"]},{"speciesId":"jumpluff","level":41,"moves":["megadrain","leechseed","cottonspore","gigadrain"]},{"speciesId":"victreebel","level":46,"moves":["sunnyday","synthesis","acid","razorleaf"]},{"speciesId":"bellossom","level":46,"moves":["sunnyday","synthesis","petaldance","solarbeam"]}]}),
    t("celadon_gym_lass_1",7,8,"LEFT","girl","⚔️ MICHELLE",["Michelle: That was a great battle!"],"celadon_gym_michelle","Lass Michelle",2,["MICHELLE: Let's battle!"],[m("skiploom",32),m("hoppip",33),m("jumpluff",34)]),
    t("celadon_gym_lass_2",2,8,"RIGHT","girl","⚔️ TANYA",["Tanya: That was a great battle!"],"celadon_gym_tanya","Picnicker Tanya",2,["TANYA: Let's battle!"],[m("exeggutor",37)]),
    t("celadon_gym_beauty_3",3,5,"RIGHT","girl","⚔️ JULIA",["Julia: That was a great battle!"],"celadon_gym_julia","Beauty Julia",2,["JULIA: Let's battle!"],[m("paras",32),m("exeggcute",32),m("parasect",35)]),
  ],
  "celadon_poke_center": [
    n("celadon_poke_center_nurse_0",3,1,"DOWN","teacher",D2,[D3,D4], {"action":"HEAL_AND_SAVE","counter":true}),
    n("celadon_poke_center_gentleman_1",1,5,"LEFT","fat_man","GENTLEMAN",undefined),
    n("celadon_poke_center_pharmacist_2",0,3,"DOWN","teacher","PHARMACIST",undefined),
    n("celadon_poke_center_cooltrainer_f_3",8,6,"LEFT","girl","COOLTRAINER F",undefined),
    n("celadon_poke_center_super_nerd_4",4,3,"DOWN","fat_man","SUPER NERD",undefined),
  ],
  "celadon_dept_store_1f": [
    n("celadon_dept_store_1f_receptionist_0",10,1,"DOWN","teacher",D5,undefined),
    n("celadon_dept_store_1f_gentleman_1",11,4,"DOWN","fat_man","GENTLEMAN",undefined),
    n("celadon_dept_store_1f_teacher_2",5,3,"LEFT","teacher","TEACHER",undefined),
  ],
  "celadon_dept_store_2f": [
    n("celadon_dept_store_2f_clerk_0",13,5,"UP","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_dept_store_2f_clerk_1",14,5,"UP","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_dept_store_2f_pokefan_m_2",5,2,"UP","fat_man","POKEFAN M",undefined),
    n("celadon_dept_store_2f_youngster_3",6,2,"LEFT","boy","YOUNGSTER",undefined),
  ],
  "celadon_dept_store_3f": [
    n("celadon_dept_store_3f_clerk_0",7,1,"DOWN","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_dept_store_3f_youngster_1",6,4,"UP","boy","YOUNGSTER",undefined),
    n("celadon_dept_store_3f_super_nerd_2",13,4,"DOWN","fat_man","SUPER NERD",undefined),
  ],
  "celadon_dept_store_4f": [
    n("celadon_dept_store_4f_clerk_0",13,5,"UP","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_dept_store_4f_super_nerd_1",7,6,"LEFT","fat_man","SUPER NERD",undefined),
    n("celadon_dept_store_4f_youngster_2",8,2,"UP","boy","YOUNGSTER",undefined),
  ],
  "celadon_dept_store_5f": [
    n("celadon_dept_store_5f_clerk_0",7,5,"UP","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_dept_store_5f_clerk_1",8,5,"UP","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_dept_store_5f_gentleman_2",13,5,"DOWN","fat_man","GENTLEMAN",undefined),
    n("celadon_dept_store_5f_sailor_3",3,4,"DOWN","fisherman","SAILOR",undefined),
    n("celadon_dept_store_5f_teacher_4",1,7,"RIGHT","teacher","TEACHER",undefined),
  ],
  "celadon_dept_store_6f": [
    n("celadon_dept_store_6f_super_nerd_0",9,2,"UP","fat_man","SUPER NERD",undefined),
    n("celadon_dept_store_6f_youngster_1",12,5,"DOWN","boy","YOUNGSTER",undefined),
  ],
  "celadon_mansion_1f": [
    n("celadon_mansion_1f_granny_0",1,5,"DOWN","teacher","GRANNY",undefined),
  ],
  "celadon_mansion_3f": [
    n("celadon_mansion_3f_cooltrainer_m_0",3,6,"DOWN","boy","COOLTRAINER M",undefined),
    n("celadon_mansion_3f_gym_guide_1",3,4,"UP","boy",D6,undefined),
    n("celadon_mansion_3f_super_nerd_2",0,7,"UP","fat_man","SUPER NERD",undefined),
    n("celadon_mansion_3f_fisher_3",0,4,"UP","fisherman","FISHER",undefined),
  ],
  "celadon_mansion_roof": [
    n("celadon_mansion_roof_fisher_0",7,5,"UP","fisherman","FISHER",undefined),
  ],
  "celadon_mansion_roof_house": [
    n("celadon_mansion_roof_house_pharmacist_0",3,2,"DOWN","teacher","PHARMACIST",undefined),
  ],
  "celadon_game_corner": [
    n("celadon_game_corner_clerk_0",5,2,"DOWN","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n("celadon_game_corner_receptionist_1",3,2,"DOWN","teacher",D5,undefined),
    n("celadon_game_corner_pokefan_m_2",14,10,"LEFT","fat_man","POKEFAN M",undefined),
    n("celadon_game_corner_teacher_3",17,7,"RIGHT","teacher","TEACHER",undefined),
    n("celadon_game_corner_fishing_guru_4",11,7,"RIGHT","fisherman","FISHING GURU",undefined),
    n("celadon_game_corner_fisher_5",8,10,"LEFT","fisherman","FISHER",undefined),
    n("celadon_game_corner_gym_guide_6",11,3,"DOWN","boy",D6,undefined),
    n("celadon_game_corner_gramps_7",2,8,"LEFT","fat_man","GRAMPS",undefined),
  ],
  "celadon_game_corner_prize_room": [
    n("celadon_game_corner_prize_room_gentleman_0",0,2,"DOWN","fat_man","GENTLEMAN",undefined),
    n("celadon_game_corner_prize_room_pharmacist_1",4,4,"UP","teacher","PHARMACIST",undefined),
  ],
  "celadon_cafe": [
    n("celadon_cafe_super_nerd_0",9,3,"LEFT","fat_man","SUPER NERD",undefined),
    n("celadon_cafe_fisher_1",4,6,"LEFT","fisherman","FISHER",undefined),
    n("celadon_cafe_fisher_2",1,7,"RIGHT","fisherman","FISHER",undefined),
    n("celadon_cafe_fisher_3",1,2,"RIGHT","fisherman","FISHER",undefined),
    n("celadon_cafe_teacher_4",4,3,"LEFT","teacher","TEACHER",undefined),
  ],
  "saffron_poke_center": [
    n(undefined,3,1,"DOWN","teacher",D2,[D3,D4], {"action":"HEAL_AND_SAVE","counter":true}),
    n(undefined,7,2,"DOWN","teacher",undefined,undefined),
    n(undefined,8,6,"LEFT","fisherman",undefined,undefined),
    n(undefined,1,4,"DOWN","boy",undefined,undefined),
  ],
  "saffron_mart": [
    n(undefined,1,3,"RIGHT","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n(undefined,7,2,"DOWN","boy",undefined,undefined),
    n(undefined,7,6,"LEFT","girl",undefined,undefined),
  ],
  "route_16_gate": [
    n(undefined,5,2,"DOWN","fat_man",undefined,undefined),
  ],
  "route_16_fuchsia_speech_house": [
    n(undefined,2,3,"DOWN","fat_man",undefined,undefined),
  ],
  "route_17": [
    n(undefined,4,17,"DOWN","boy","⚔️ RILEY",undefined, {"trainerName":"Biker Riley","vision":4,"team":[{"speciesId":"weezing","level":34}]}),
    n(undefined,9,68,"DOWN","boy","⚔️ JOEL",undefined, {"trainerName":"Biker Joel","vision":1,"team":[{"speciesId":"magmar","level":32},{"speciesId":"magmar","level":32}]}),
    n(undefined,3,53,"DOWN","boy","⚔️ GLENN",undefined, {"trainerName":"Biker Glenn","vision":3,"team":[{"speciesId":"koffing","level":28},{"speciesId":"magmar","level":30},{"speciesId":"weezing","level":32}]}),
    n(undefined,6,79,"RIGHT","boy","⚔️ CHARLES",undefined, {"trainerName":"Biker Charles","vision":4,"team":[{"speciesId":"koffing","level":30},{"speciesId":"charmeleon","level":30},{"speciesId":"weezing","level":30}]}),
  ],
  "route_17_route_18_gate": [
    n(undefined,5,2,"DOWN","fat_man",undefined,undefined),
  ],
  "route_18": [
    n(undefined,9,12,"DOWN","boy","⚔️ BORIS",undefined, {"trainerName":"Bird Keeper Boris","vision":3,"team":[{"speciesId":"doduo","level":30},{"speciesId":"doduo","level":28},{"speciesId":"dodrio","level":32}]}),
    n(undefined,13,6,"DOWN","boy","⚔️ BOB",undefined, {"trainerName":"Bird Keeper Bob","vision":3,"team":[{"speciesId":"noctowl","level":34}]}),
  ],
  "fuchsia_city": [
    n(undefined,23,18,"DOWN","boy",undefined,undefined),
    n(undefined,13,8,"DOWN","fat_man",undefined,undefined),
    n(undefined,16,14,"DOWN","teacher",undefined,undefined),
  ],
  "fuchsia_gym": [
    n(undefined,1,10,"DOWN","girl","🏆 LEADER JANINE",undefined, {"action":"JANINE_EVENT","trainerId":"janine","trainerName":"Leader Janine","team":[{"speciesId":"crobat","level":36,"moves":["screech","supersonic","confuseray","wingattack"]},{"speciesId":"weezing","level":36,"moves":["smog","sludgebomb","toxic","explosion"]},{"speciesId":"weezing","level":36,"moves":["smog","sludgebomb","toxic","explosion"]},{"speciesId":"ariados","level":33,"moves":["scaryface","gigadrain","stringshot","nightshade"]},{"speciesId":"venomoth","level":39,"moves":["foresight","doubleteam","gust","psychic"]}]}),
    n(undefined,7,15,"DOWN","boy",D6,undefined),
  ],
  "fuchsia_poke_center": [
    n(undefined,3,1,"DOWN","teacher",D2,[D3,D4], {"action":"HEAL_AND_SAVE","counter":true}),
    n(undefined,8,4,"LEFT","boy",undefined,undefined),
    n(undefined,1,4,"LEFT","girl",undefined,undefined),
  ],
  "fuchsia_mart": [
    n(undefined,1,3,"RIGHT","boy","🏪 CLERK",[D1], {"action":"OPEN_MART","counter":true}),
    n(undefined,3,2,"LEFT","fisherman",undefined,undefined),
    n(undefined,7,6,"LEFT","girl",undefined,undefined),
  ],
  "safari_zone_wardens_home": [
    n(undefined,2,4,"RIGHT","girl",undefined,undefined),
  ],
  "route_19_fuchsia_gate": [
    n(undefined,0,4,"RIGHT","fat_man",undefined,undefined),
  ],
  "route_15_fuchsia_gate": [
    n(undefined,5,2,"DOWN","fat_man",undefined,undefined),
  ],
  "route_12": [
    n(undefined,5,13,"DOWN","fisherman","⚔️ MARTIN",undefined, {"trainerName":"Fisher Martin","vision":1,"team":[{"speciesId":"remoraid","level":32},{"speciesId":"remoraid","level":32}]}),
  ],
  "route_12_super_rod_house": [
    n(undefined,5,3,"DOWN","fisherman",undefined,undefined),
  ],
  "route_13": [
    n(undefined,42,6,"DOWN","boy","⚔️ PERRY",undefined, {"trainerName":"Bird Keeper Perry","vision":2,"team":[{"speciesId":"farfetchd","level":34}]}),
    n(undefined,43,6,"DOWN","boy","⚔️ BRET",undefined, {"trainerName":"Bird Keeper Bret","vision":2,"team":[{"speciesId":"pidgeotto","level":32},{"speciesId":"fearow","level":32}]}),
    n(undefined,32,8,"LEFT","fat_man","⚔️ JOSHUA",undefined, {"trainerName":"Pokefanm Joshua","vision":3,"team":[{"speciesId":"pikachu","level":23},{"speciesId":"pikachu","level":23},{"speciesId":"pikachu","level":23},{"speciesId":"pikachu","level":23},{"speciesId":"pikachu","level":23},{"speciesId":"pikachu","level":23}]}),
    n(undefined,14,10,"LEFT","fat_man","⚔️ KENNY",undefined, {"trainerName":"Hiker Kenny","vision":4,"team":[{"speciesId":"sandslash","level":27},{"speciesId":"graveler","level":29},{"speciesId":"golem","level":31},{"speciesId":"graveler","level":29}]}),
    n(undefined,25,6,"RIGHT","fat_man","⚔️ ALEX",undefined, {"trainerName":"Pokefanm Alex","vision":4,"team":[{"speciesId":"nidoking","level":29},{"speciesId":"slowking","level":29},{"speciesId":"seaking","level":29}]}),
  ],
  "route_14": [
    n(undefined,11,15,"RIGHT","fat_man","⚔️ CARTER",undefined, {"trainerName":"Pokefanm Carter","vision":3,"team":[{"speciesId":"bulbasaur","level":29},{"speciesId":"charmander","level":29},{"speciesId":"squirtle","level":29}]}),
    n(undefined,11,27,"DOWN","boy","⚔️ ROY",undefined, {"trainerName":"Bird Keeper Roy","vision":3,"team":[{"speciesId":"fearow","level":29},{"speciesId":"fearow","level":35}]}),
    n(undefined,6,11,"DOWN","fat_man","⚔️ TREVOR",undefined, {"trainerName":"Pokefanm Trevor","vision":3,"team":[{"speciesId":"psyduck","level":33}]}),
    n(undefined,7,5,"LEFT","teacher",undefined,undefined),
  ],
  "route_15": [
    n(undefined,10,10,"RIGHT","boy","⚔️ KIPP",undefined, {"trainerName":"Schoolboy Kipp","vision":4,"team":[{"speciesId":"voltorb","level":27},{"speciesId":"magnemite","level":27},{"speciesId":"voltorb","level":31},{"speciesId":"magneton","level":31}]}),
    n(undefined,15,13,"UP","boy","⚔️ TOMMY",undefined, {"trainerName":"Schoolboy Tommy","vision":3,"team":[{"speciesId":"xatu","level":32},{"speciesId":"alakazam","level":34}]}),
    n(undefined,33,10,"DOWN","boy","⚔️ JOHNNY",undefined, {"trainerName":"Schoolboy Johnny","vision":3,"team":[{"speciesId":"bellsprout","level":29},{"speciesId":"weepinbell","level":31},{"speciesId":"victreebel","level":33}]}),
    n(undefined,27,10,"DOWN","boy","⚔️ BILLY",undefined, {"trainerName":"Schoolboy Billy","vision":3,"team":[{"speciesId":"paras","level":27},{"speciesId":"paras","level":27},{"speciesId":"poliwhirl","level":27},{"speciesId":"ditto","level":35}]}),
    n(undefined,30,12,"UP","teacher","⚔️ COLETTE",undefined, {"trainerName":"Teacher Colette","vision":4,"team":[{"speciesId":"clefairy","level":36}]}),
    n(undefined,20,10,"DOWN","teacher","⚔️ HILLARY",undefined, {"trainerName":"Teacher Hillary","vision":3,"team":[{"speciesId":"aipom","level":32},{"speciesId":"cubone","level":36}]}),
  ],
  "route_19": [
    n(undefined,9,5,"DOWN","fisherman",undefined,undefined),
    n(undefined,11,5,"LEFT","fisherman",undefined,undefined),
  ],
  "seafoam_gym": [
    n(undefined,5,2,"DOWN","boy","🏆 LEADER BLAINE",undefined, {"action":"BLAINE_EVENT","trainerId":"blaine","trainerName":"Leader Blaine","team":[{"speciesId":"magcargo","level":45,"moves":["curse","smog","flamethrower","rockslide"]},{"speciesId":"magmar","level":45,"moves":["thunderpunch","firepunch","sunnyday","confuseray"]},{"speciesId":"rapidash","level":50,"moves":["quickattack","firespin","furyattack","fireblast"]}]}),
    n(undefined,6,5,"UP","boy",D6,undefined),
  ],
  "cinnabar_island": [
    n(undefined,9,6,"DOWN","boy","🏆 LEADER BLUE",undefined, {"action":"BLUE_EVENT","trainerId":"blue","trainerName":"Leader Blue","team":[{"speciesId":"pidgeot","level":56,"moves":["quickattack","whirlwind","wingattack","mirrormove"]},{"speciesId":"alakazam","level":54,"moves":["disable","recover","psychic","reflect"]},{"speciesId":"rhydon","level":56,"moves":["furyattack","sandstorm","rockslide","earthquake"]},{"speciesId":"gyarados","level":58,"moves":["twister","hydropump","raindance","hyperbeam"]},{"speciesId":"exeggutor","level":58,"moves":["sunnyday","leechseed","eggbomb","solarbeam"]},{"speciesId":"arcanine","level":58,"moves":["roar","swift","flamethrower","extremespeed"]}]}),
  ],
  "cinnabar_poke_center": [
    n(undefined,3,1,"DOWN","teacher",D2,[D3,D4], {"action":"HEAL_AND_SAVE","counter":true}),
    n(undefined,7,6,"LEFT","girl",undefined,undefined),
    n(undefined,2,4,"DOWN","fisherman",undefined,undefined),
  ],
};
