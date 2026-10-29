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
  "route_17_route_18_gate": [
    n(undefined,5,2,"DOWN","fat_man",undefined,undefined),
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
