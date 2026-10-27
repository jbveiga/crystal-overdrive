/**
 * @fileoverview Generated object events, trainers, and dialogues for East & Early Johto
 * @module world/generated-npcs/eastJohtoGeneratedNpcs
 * @role East & Early Johto Generated NPC records
 * @exports EAST_JOHTO_GENERATED_NPCS
 * @layer world
 * @sections L1-25: Micro-Header & Helpers | L26-320: Map Generated NPC Records
 */
import type { GeneratedNpc } from "../generatedNpcs";

const D1 = "If your POKéMON gets hurt, head to the nearest POKéMON CENTER.";
const D2 = "I heard strange rumors about a legendary POKéMON in this region…";
const D3 = "Have you filled your POKéDEX yet? Keep exploring!";
const D4 = "Training every day is the secret to a strong team!";
const D5 = "The weather has been fierce lately, but the POKéMON here are tough!";
const D6 = "Trainers from all over pass through here on their way to the POKéMON LEAGUE.";
const D7 = "🏆 GYM GUIDE";
const D8 = "👩‍⚕️ NURSE JOY";
const D9 = "Welcome to our POKéMON CENTER!";
const D10 = "We can heal your POKéMON to full health.";
const D11 = "COOLTRAINER F";
const D12 = "🏆 LEADER CLAIR";
const D13 = "Welcome! How may I help you?";
const D14 = "COOLTRAINER M";
const D15 = "LANCE: You are truly strong. Go on!";

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

export const EAST_JOHTO_GENERATED_NPCS: Record<string, GeneratedNpc[]> = {
  "route_42": [
    t("route_42_fisher_0",40,10,"LEFT","fisherman","⚔️ TULLY",["Tully: That was a great battle!"],"route_42_tully","Fisher Tully",1,["TULLY: Let's battle!"],[m("qwilfish",18)]),
    t("route_42_pokefan_m_1",51,9,"DOWN","fat_man","⚔️ BENJAMIN",["Benjamin: That was a great battle!"],"route_42_benjamin","Hiker Benjamin",3,["BENJAMIN: Let's battle!"],[m("diglett",14),m("geodude",14),m("dugtrio",16)]),
    t("route_42_super_nerd_2",47,8,"DOWN","fat_man","⚔️ SHANE",["Shane: That was a great battle!"],"route_42_shane","Pokemaniac Shane",3,["SHANE: Let's battle!"],[m("nidorina",16),m("nidorino",16)]),
  ],
  "route_42_ecruteak_gate": [
    n("route_42_ecruteak_gate_officer_0",5,2,"DOWN","fat_man","OFFICER",[D1]),
  ],
  "mount_mortar_1f_inside": [
    t("mount_mortar_1f_inside_super_nerd_0",33,43,"LEFT","fat_man","⚔️ MILLER",["Miller: That was a great battle!"],"mount_mortar_1f_inside_miller","Pokemaniac Miller",3,["MILLER: Let's battle!"],[m("nidoking",17),m("nidoqueen",17)]),
    t("mount_mortar_1f_inside_super_nerd_1",24,28,"DOWN","fat_man","⚔️ MARKUS",["Markus: That was a great battle!"],"mount_mortar_1f_inside_markus","Super Nerd Markus",3,["MARKUS: Let's battle!"],[m("slowpoke",19,["curse","watergun","growl","strength"])]),
  ],
  "mount_mortar_2f_inside": [
    t("mount_mortar_2f_inside_super_nerd_0",13,26,"DOWN","fat_man","⚔️ HUGH",["Hugh: That was a great battle!"],"mount_mortar_2f_inside_hugh","Super Nerd Hugh",2,["HUGH: Let's battle!"],[m("seadra",39,["smokescreen","twister","surf","waterfall"])]),
  ],
  "mount_mortar_b1f": [
    n("mount_mortar_b1f_black_belt_0",16,4,"DOWN","fat_man","BLACK BELT",[D2]),
  ],
  "mahogany_town": [
    n("mahogany_town_pokefan_m_0",19,8,"DOWN","fat_man","POKEFAN M",[D3]),
    n("mahogany_town_gramps_1",6,9,"LEFT","fat_man","GRAMPS",[D4]),
    n("mahogany_town_fisher_2",6,14,"DOWN","fisherman","FISHER",[D4]),
    n("mahogany_town_lass_3",12,8,"DOWN","girl","LASS",[D5]),
  ],
  "mahogany_mart": [
    n("mahogany_mart_pharmacist_0",4,3,"DOWN","teacher","PHARMACIST",[D1]),
    n("mahogany_mart_black_belt_1",1,6,"DOWN","fat_man","BLACK BELT",[D2]),
    n("mahogany_mart_granny_2",1,3,"RIGHT","teacher","GRANNY",[D6]),
  ],
  "mahogany_gym": [
    n("mahogany_gym_pryce_0",5,4,"DOWN","boy","🏆 LEADER PRYCE",[D3], {"action":"PRYCE_EVENT","trainerId":"pryce","trainerName":"Leader Pryce","team":[{"speciesId":"seel","level":27,"moves":["headbutt","icywind","aurorabeam","rest"]},{"speciesId":"dewgong","level":29,"moves":["headbutt","icywind","aurorabeam","rest"]},{"speciesId":"piloswine","level":31,"moves":["icywind","furyattack","mist","blizzard"]}]}),
    t("mahogany_gym_beauty_1",4,7,"DOWN","girl","⚔️ ROXANNE",["Roxanne: That was a great battle!"],"mahogany_gym_roxanne","Skier Roxanne",1,["ROXANNE: Let's battle!"],[m("jynx",28)]),
    t("mahogany_gym_rocker_2",0,16,"UP","boy","⚔️ RONALD",["Ronald: That was a great battle!"],"mahogany_gym_ronald","Boarder Ronald",1,["RONALD: Let's battle!"],[m("seel",24),m("dewgong",25),m("seel",24)]),
    t("mahogany_gym_beauty_3",9,16,"UP","girl","⚔️ CLARISSA",["Clarissa: That was a great battle!"],"mahogany_gym_clarissa","Skier Clarissa",1,["CLARISSA: Let's battle!"],[m("dewgong",28)]),
    t("mahogany_gym_rocker_4",5,10,"DOWN","boy","⚔️ BRAD",["Brad: That was a great battle!"],"mahogany_gym_brad","Boarder Brad",1,["BRAD: Let's battle!"],[m("swinub",26),m("swinub",26)]),
    t("mahogany_gym_rocker_5",3,4,"DOWN","boy","⚔️ DOUGLAS",["Douglas: That was a great battle!"],"mahogany_gym_douglas","Boarder Douglas",1,["DOUGLAS: Let's battle!"],[m("shellder",24),m("cloyster",25),m("shellder",24)]),
    n("mahogany_gym_gym_guide_6",7,15,"DOWN","boy",D7,[D4]),
  ],
  "mahogany_poke_center": [
    n("mahogany_poke_center_nurse_0",3,1,"DOWN","teacher",D8,[D9,D10], {"action":"HEAL_AND_SAVE","counter":true}),
    n("mahogany_poke_center_pokefan_m_1",7,2,"DOWN","fat_man","POKEFAN M",[D4]),
    n("mahogany_poke_center_youngster_2",1,3,"RIGHT","boy","YOUNGSTER",[D6]),
    n("mahogany_poke_center_cooltrainer_f_3",2,3,"LEFT","girl",D11,[D2]),
  ],
  "mahogany_red_gyarados_speech_house": [
    n("mahogany_red_gyarados_speech_house_black_belt_0",2,3,"RIGHT","fat_man","BLACK BELT",[D5]),
    n("mahogany_red_gyarados_speech_house_teacher_1",6,5,"UP","teacher","TEACHER",[D6]),
  ],
  "route_43": [
    t("route_43_super_nerd_0",13,5,"LEFT","fat_man","⚔️ BEN",["Ben: That was a great battle!"],"route_43_ben","Pokemaniac Ben",2,["BEN: Let's battle!"],[m("slowbro",19)]),
    t("route_43_super_nerd_1",13,20,"DOWN","fat_man","⚔️ BRENT",["Brent: That was a great battle!"],"route_43_brent","Pokemaniac Brent",3,["BRENT: Let's battle!"],[m("lickitung",19)]),
    t("route_43_super_nerd_2",14,7,"DOWN","fat_man","⚔️ RON",["Ron: That was a great battle!"],"route_43_ron","Pokemaniac Ron",2,["RON: Let's battle!"],[m("nidoking",19)]),
    t("route_43_fisher_3",4,16,"RIGHT","fisherman","⚔️ MARVIN",["Marvin: That was a great battle!"],"route_43_marvin","Fisher Marvin",4,["MARVIN: Let's battle!"],[m("magikarp",10),m("gyarados",10),m("magikarp",15),m("gyarados",15)]),
    t("route_43_lass_4",9,25,"DOWN","girl","⚔️ TIFFANY",["Tiffany: That was a great battle!"],"route_43_tiffany","Picnicker Tiffany",2,["TIFFANY: Let's battle!"],[m("clefairy",31,["encore","sing","doubleslap","minimize"])]),
    t("route_43_youngster_5",13,40,"DOWN","boy","⚔️ SPENCER",["Spencer: That was a great battle!"],"route_43_spencer","Camper Spencer",3,["SPENCER: Let's battle!"],[m("sandshrew",17),m("sandslash",17),m("zubat",19)]),
  ],
  "route_43_mahogany_gate": [
    n("route_43_mahogany_gate_officer_0",0,4,"RIGHT","fat_man","OFFICER",[D4]),
  ],
  "route_43_gate": [
    n("route_43_gate_officer_0",0,4,"RIGHT","fat_man","OFFICER",[D4]),
    n("route_43_gate_rocket_1",2,4,"DOWN","boy","ROCKET",[D1]),
    n("route_43_gate_rocket_2",7,4,"UP","boy","ROCKET",[D1]),
  ],
  "lake_of_rage": [
    n("lake_of_rage_super_nerd_0",36,13,"LEFT","fat_man","SUPER NERD",[D1]),
    n("lake_of_rage_cooltrainer_f_1",25,28,"LEFT","girl",D11,[D6]),
    t("lake_of_rage_cooltrainer_f_2",36,7,"LEFT","girl","⚔️ LOIS",["Lois: That was a great battle!"],"lake_of_rage_lois","Cooltrainerf Lois",2,["LOIS: Let's battle!"],[m("skiploom",25,["synthesis","poisonpowder","megadrain","leechseed"]),m("ninetales",25,["ember","quickattack","confuseray","safeguard"])]),
    n("lake_of_rage_super_nerd_3",4,4,"DOWN","fat_man","SUPER NERD",[D5]),
  ],
  "lake_of_rage_hidden_power_house": [
    n("lake_of_rage_hidden_power_house_fisher_0",2,3,"DOWN","fisherman","FISHER",[D5]),
  ],
  "lake_of_rage_magikarp_house": [
    n("lake_of_rage_magikarp_house_fishing_guru_0",2,3,"DOWN","fisherman","FISHING GURU",[D5]),
  ],
  "route_44": [
    t("route_44_fisher_0",35,3,"DOWN","fisherman","⚔️ WILTON",["Wilton: That was a great battle!"],"route_44_wilton","Fisher Wilton",1,["WILTON: Let's battle!"],[m("goldeen",23),m("goldeen",23),m("seaking",25)]),
    t("route_44_fisher_1",19,13,"RIGHT","fisherman","⚔️ EDGAR",["Edgar: That was a great battle!"],"route_44_edgar","Fisher Edgar",1,["EDGAR: Let's battle!"],[m("remoraid",25,["lockon","psybeam","aurorabeam","bubblebeam"]),m("remoraid",25,["lockon","psybeam","aurorabeam","bubblebeam"])]),
    t("route_44_youngster_2",10,9,"DOWN","boy","⚔️ PHIL",["Phil: That was a great battle!"],"route_44_phil","Psychic T Phil",3,["PHIL: Let's battle!"],[m("natu",24,["leer","nightshade","futuresight","confuseray"]),m("kadabra",26,["disable","psybeam","recover","futuresight"])]),
    t("route_44_super_nerd_3",43,2,"DOWN","fat_man","⚔️ ZACH",["Zach: That was a great battle!"],"route_44_zach","Pokemaniac Zach",3,["ZACH: Let's battle!"],[m("rhyhorn",27)]),
    t("route_44_youngster_4",51,5,"DOWN","boy","⚔️ VANCE",["Vance: That was a great battle!"],"route_44_vance","Bird Keeper Vance",2,["VANCE: Let's battle!"],[m("pidgeotto",25),m("pidgeotto",25)]),
    t("route_44_cooltrainer_m_5",41,15,"LEFT","boy","⚔️ ALLEN",["Allen: That was a great battle!"],"route_44_allen","Cooltrainerm Allen",4,["ALLEN: Let's battle!"],[m("charmeleon",27,["ember","smokescreen","rage","scaryface"])]),
    t("route_44_cooltrainer_f_6",31,14,"LEFT","girl","⚔️ CYBIL",["Cybil: That was a great battle!"],"route_44_cybil","Cooltrainerf Cybil",4,["CYBIL: Let's battle!"],[m("butterfree",25,["confusion","sleeppowder","whirlwind","gust"]),m("bellossom",25,["absorb","stunspore","acid","solarbeam"])]),
  ],
  "blackthorn_city": [
    n("blackthorn_city_super_nerd_0",18,12,"DOWN","fat_man","SUPER NERD",[D6]),
    n("blackthorn_city_super_nerd_1",19,12,"DOWN","fat_man","SUPER NERD",[D2]),
    n("blackthorn_city_gramps_2",20,2,"DOWN","fat_man","GRAMPS",[D6]),
    n("blackthorn_city_gramps_3",21,2,"LEFT","fat_man","GRAMPS",[D2]),
    n("blackthorn_city_black_belt_4",24,31,"LEFT","fat_man","BLACK BELT",[D5]),
    n("blackthorn_city_cooltrainer_f_5",9,25,"LEFT","girl",D11,[D3]),
    n("blackthorn_city_cooltrainer_f_6",35,19,"UP","girl",D11,[D6]),
  ],
  "blackthorn_gym_1f": [
    n("blackthorn_gym_1f_clair_0",5,3,"DOWN","boy",D12,[D2], {"action":"CLAIR_EVENT","trainerId":"clair","trainerName":"Leader Clair","team":[{"speciesId":"dragonair","level":37,"moves":["thunderwave","surf","slam","dragonbreath"]},{"speciesId":"dragonair","level":37,"moves":["thunderwave","thunderbolt","slam","dragonbreath"]},{"speciesId":"dragonair","level":37,"moves":["thunderwave","icebeam","slam","dragonbreath"]},{"speciesId":"kingdra","level":40,"moves":["smokescreen","surf","hyperbeam","dragonbreath"]}]}),
    t("blackthorn_gym_1f_cooltrainer_m_1",6,6,"DOWN","boy","⚔️ MIKE",["Mike: That was a great battle!"],"blackthorn_gym_1f_mike","Cooltrainerm Mike",3,["MIKE: Let's battle!"],[m("dragonair",37)]),
    t("blackthorn_gym_1f_cooltrainer_m_2",1,14,"DOWN","boy","⚔️ PAUL",["Paul: That was a great battle!"],"blackthorn_gym_1f_paul","Cooltrainerm Paul",3,["PAUL: Let's battle!"],[m("dratini",34),m("dratini",34),m("dratini",34)]),
    t("blackthorn_gym_1f_cooltrainer_f_3",9,2,"DOWN","girl","⚔️ LOLA",["Lola: That was a great battle!"],"blackthorn_gym_1f_lola","Cooltrainerf Lola",1,["LOLA: Let's battle!"],[m("dratini",34),m("dragonair",36)]),
    n("blackthorn_gym_1f_gym_guide_4",7,15,"DOWN","boy",D7,[D2]),
  ],
  "blackthorn_gym_2f": [
    t("blackthorn_gym_2f_cooltrainer_m_0",4,1,"RIGHT","boy","⚔️ CODY",["Cody: That was a great battle!"],"blackthorn_gym_2f_cody","Cooltrainerm Cody",1,["CODY: Let's battle!"],[m("horsea",34),m("seadra",36)]),
    t("blackthorn_gym_2f_cooltrainer_f_1",4,11,"LEFT","girl","⚔️ FRAN",["Fran: That was a great battle!"],"blackthorn_gym_2f_fran","Cooltrainerf Fran",1,["FRAN: Let's battle!"],[m("seadra",37)]),
  ],
  "blackthorn_dragon_speech_house": [
    n("blackthorn_dragon_speech_house_granny_0",2,3,"DOWN","teacher","GRANNY",[D5]),
  ],
  "blackthorn_emys_house": [
    n("blackthorn_emys_house_lass_0",2,3,"DOWN","girl","LASS",[D5]),
  ],
  "blackthorn_mart": [
    n("blackthorn_mart_clerk_0",1,3,"RIGHT","boy","🏪 CLERK",[D13], {"action":"OPEN_MART","counter":true}),
    n("blackthorn_mart_cooltrainer_m_1",7,6,"LEFT","boy",D14,[D2]),
    n("blackthorn_mart_black_belt_2",5,2,"DOWN","fat_man","BLACK BELT",[D3]),
  ],
  "blackthorn_poke_center": [
    n("blackthorn_poke_center_nurse_0",3,1,"DOWN","teacher",D8,[D9,D10], {"action":"HEAL_AND_SAVE","counter":true}),
    n("blackthorn_poke_center_gentleman_1",5,3,"DOWN","fat_man","GENTLEMAN",[D3]),
    n("blackthorn_poke_center_twin_2",1,4,"DOWN","girl","TWIN",[D1]),
    n("blackthorn_poke_center_cooltrainer_m_3",7,6,"LEFT","boy",D14,[D4]),
  ],
  "move_deleters_house": [
    n("move_deleters_house_super_nerd_0",2,3,"DOWN","fat_man","SUPER NERD",[D5]),
  ],
  "dragons_den_b1f": [
    n("dragons_den_b1f_clair_0",14,30,"UP","boy",D12,[D2], {"action":"CLAIR_EVENT","trainerId":"clair","trainerName":"Leader Clair","team":[{"speciesId":"dragonair","level":37,"moves":["thunderwave","surf","slam","dragonbreath"]},{"speciesId":"dragonair","level":37,"moves":["thunderwave","thunderbolt","slam","dragonbreath"]},{"speciesId":"dragonair","level":37,"moves":["thunderwave","icebeam","slam","dragonbreath"]},{"speciesId":"kingdra","level":40,"moves":["smokescreen","surf","hyperbeam","dragonbreath"]}]}),
    t("dragons_den_b1f_cooltrainer_m_1",20,8,"UP","boy","⚔️ DARIN",["Darin: That was a great battle!"],"dragons_den_b1f_darin","Cooltrainerm Darin",4,["DARIN: Let's battle!"],[m("dragonair",37,["wrap","surf","dragonrage","slam"])]),
    t("dragons_den_b1f_cooltrainer_f_2",8,8,"DOWN","girl","⚔️ CARA",["Cara: That was a great battle!"],"dragons_den_b1f_cara","Cooltrainerf Cara",3,["CARA: Let's battle!"],[m("horsea",33,["smokescreen","leer","whirlpool","twister"]),m("horsea",33,["smokescreen","leer","whirlpool","twister"]),m("seadra",35,["swift","leer","waterfall","twister"])]),
  ],
  "dragon_shrine": [
    n("dragon_shrine_elder_0",5,1,"DOWN","boy","ELDER",[D6]),
    n("dragon_shrine_elder_1",2,4,"RIGHT","boy","ELDER",[D1]),
    n("dragon_shrine_elder_2",7,4,"LEFT","boy","ELDER",[D1]),
    n("dragon_shrine_clair_3",4,8,"UP","boy",D12,[D3], {"action":"CLAIR_EVENT","trainerId":"clair","trainerName":"Leader Clair","team":[{"speciesId":"dragonair","level":37,"moves":["thunderwave","surf","slam","dragonbreath"]},{"speciesId":"dragonair","level":37,"moves":["thunderwave","thunderbolt","slam","dragonbreath"]},{"speciesId":"dragonair","level":37,"moves":["thunderwave","icebeam","slam","dragonbreath"]},{"speciesId":"kingdra","level":40,"moves":["smokescreen","surf","hyperbeam","dragonbreath"]}]}),
  ],
  "route_45": [
    t("route_45_pokefan_m_0",10,15,"RIGHT","fat_man","⚔️ ERIK",["Erik: That was a great battle!"],"route_45_erik","Hiker Erik",1,["ERIK: Let's battle!"],[m("machop",24),m("graveler",27),m("machop",27)]),
    t("route_45_pokefan_m_1",15,65,"RIGHT","fat_man","⚔️ MICHAEL",["Michael: That was a great battle!"],"route_45_michael","Hiker Michael",2,["MICHAEL: Let's battle!"],[m("geodude",25),m("graveler",25),m("golem",25)]),
    t("route_45_pokefan_m_2",5,27,"UP","fat_man","⚔️ PARRY",["Parry: That was a great battle!"],"route_45_parry","Hiker Parry",2,["PARRY: Let's battle!"],[m("onix",35),m("swinub",33)]),
    t("route_45_pokefan_m_3",9,65,"LEFT","fat_man","⚔️ TIMOTHY",["Timothy: That was a great battle!"],"route_45_timothy","Hiker Timothy",1,["TIMOTHY: Let's battle!"],[m("diglett",27,["magnitude","dig","sandattack","slash"]),m("dugtrio",27,["magnitude","dig","sandattack","slash"])]),
    t("route_45_black_belt_4",11,50,"DOWN","fat_man","⚔️ KENJI",["Kenji: That was a great battle!"],"route_45_kenji","Blackbelt T Kenji",2,["KENJI: Let's battle!"],[m("onix",27),m("hitmonlee",30),m("onix",27),m("machoke",32)]),
    t("route_45_cooltrainer_m_5",17,17,"LEFT","boy","⚔️ RYAN",["Ryan: That was a great battle!"],"route_45_ryan","Cooltrainerm Ryan",1,["RYAN: Let's battle!"],[m("pidgeot",25,["sandattack","quickattack","whirlwind","wingattack"]),m("electabuzz",27,["thunderpunch","lightscreen","swift","screech"])]),
    t("route_45_cooltrainer_f_6",5,36,"DOWN","girl","⚔️ KELLY",["Kelly: That was a great battle!"],"route_45_kelly","Cooltrainerf Kelly",3,["KELLY: Let's battle!"],[m("marill",27),m("wartortle",24),m("wartortle",24)]),
    n("route_45_youngster_7",4,70,"DOWN","boy","YOUNGSTER",[D3]),
  ],
  "route_46": [
    t("route_46_pokefan_m_0",12,19,"LEFT","fat_man","⚔️ BAILEY",["Bailey: That was a great battle!"],"route_46_bailey","Hiker Bailey",2,["BAILEY: Let's battle!"],[m("geodude",13),m("geodude",13),m("geodude",13),m("geodude",13),m("geodude",13)]),
    t("route_46_youngster_1",4,14,"UP","boy","⚔️ TED",["Ted: That was a great battle!"],"route_46_ted","Camper Ted",2,["TED: Let's battle!"],[m("mankey",17)]),
    t("route_46_lass_2",2,13,"DOWN","girl","⚔️ ERIN",["Erin: That was a great battle!"],"route_46_erin","Picnicker Erin",2,["ERIN: Let's battle!"],[m("ponyta",16),m("ponyta",16)]),
  ],
  "team_rocket_base_b1f": [
    n("team_rocket_base_b1f_rocket_0",0,1,"DOWN","boy","ROCKET",[D1]),
    t("team_rocket_base_b1f_scientist_2",18,12,"LEFT","boy","⚔️ JED",["Jed: That was a great battle!"],"team_rocket_base_b1f_jed","Scientist Jed",3,["JED: Let's battle!"],[m("magnemite",20),m("magnemite",20),m("magnemite",20)]),
  ],
  "team_rocket_base_b2f": [
    n("team_rocket_base_b2f_rocket_0",20,16,"UP","boy","ROCKET",[D6]),
  ],
  "team_rocket_base_b3f": [
    n("team_rocket_base_b3f_rocket_0",8,3,"UP","boy","ROCKET",[D5]),
    t("team_rocket_base_b3f_scientist_3",23,11,"UP","boy","⚔️ ROSS",["Ross: That was a great battle!"],"team_rocket_base_b3f_ross","Scientist Ross",2,["ROSS: Let's battle!"],[m("koffing",22),m("koffing",22)]),
    t("team_rocket_base_b3f_scientist_4",11,15,"RIGHT","boy","⚔️ MITCH",["Mitch: That was a great battle!"],"team_rocket_base_b3f_mitch","Scientist Mitch",3,["MITCH: Let's battle!"],[m("ditto",24)]),
    n("team_rocket_base_b3f_rocket_5",24,14,"DOWN","boy","ROCKET",[D1]),
  ],
  "route_27": [
    t("route_27_cooltrainer_m_0",48,7,"UP","boy","⚔️ BLAKE",["Blake: That was a great battle!"],"route_27_blake","Cooltrainerm Blake",3,["BLAKE: Let's battle!"],[m("magneton",33,["thunderbolt","supersonic","swift","screech"]),m("quagsire",31,["watergun","slam","amnesia","earthquake"]),m("exeggcute",31,["leechseed","confusion","sleeppowder","solarbeam"])]),
    t("route_27_cooltrainer_m_1",58,6,"RIGHT","boy","⚔️ BRIAN",["Brian: That was a great battle!"],"route_27_brian","Cooltrainerm Brian",4,["BRIAN: Let's battle!"],[m("sandslash",35,["sandattack","poisonsting","slash","swift"])]),
    t("route_27_cooltrainer_f_2",72,10,"UP","girl","⚔️ REENA",["Reena: That was a great battle!"],"route_27_reena","Cooltrainerf Reena",4,["REENA: Let's battle!"],[m("starmie",31),m("nidoqueen",33),m("starmie",31)]),
    t("route_27_cooltrainer_f_3",37,6,"DOWN","girl","⚔️ MEGAN",["Megan: That was a great battle!"],"route_27_megan","Cooltrainerf Megan",2,["MEGAN: Let's battle!"],[m("bulbasaur",32,["growl","leechseed","poisonpowder","razorleaf"]),m("ivysaur",32,["growl","leechseed","poisonpowder","razorleaf"]),m("venusaur",32,["bodyslam","sleeppowder","razorleaf","sweetscent"])]),
    t("route_27_youngster_4",65,7,"LEFT","boy","⚔️ GILBERT",["Gilbert: That was a great battle!"],"route_27_gilbert","Psychic T Gilbert",3,["GILBERT: Let's battle!"],[m("starmie",30),m("exeggcute",30),m("girafarig",34)]),
    t("route_27_youngster_5",58,13,"RIGHT","boy","⚔️ JOSE",["Jose: That was a great battle!"],"route_27_jose","Bird Keeper Jose",3,["JOSE: Let's battle!"],[m("farfetchd",36)]),
    n("route_27_fisher_6",21,10,"DOWN","fisherman","FISHER",[D1]),
  ],
  "route_27_sandstorm_house": [
    n("route_27_sandstorm_house_granny_0",2,4,"DOWN","teacher","GRANNY",[D6]),
  ],
  "route_26": [
    t("route_26_cooltrainer_m_0",14,24,"LEFT","boy","⚔️ JAKE",["Jake: That was a great battle!"],"route_26_jake","Cooltrainerm Jake",2,["JAKE: Let's battle!"],[m("parasect",33,["leechlife","spore","slash","swordsdance"]),m("golduck",35,["confusion","screech","psychup","furyswipes"])]),
    t("route_26_cooltrainer_m_1",9,38,"LEFT","boy","⚔️ GAVEN",["Gaven: That was a great battle!"],"route_26_gaven","Cooltrainerm Gaven",3,["GAVEN: Let's battle!"],[m("victreebel",35,["wrap","toxic","acid","razorleaf"]),m("kingler",35,["bubblebeam","stomp","guillotine","protect"]),m("flareon",35,["sandattack","quickattack","bite","firespin"])]),
    t("route_26_cooltrainer_f_2",10,56,"DOWN","girl","⚔️ JOYCE",["Joyce: That was a great battle!"],"route_26_joyce","Cooltrainerf Joyce",3,["JOYCE: Let's battle!"],[m("pikachu",36,["quickattack","doubleteam","thunderbolt","thunder"]),m("blastoise",32,["bite","curse","surf","raindance"])]),
    t("route_26_cooltrainer_f_3",5,8,"RIGHT","girl","⚔️ BETH",["Beth: That was a great battle!"],"route_26_beth","Cooltrainerf Beth",4,["BETH: Let's battle!"],[m("rapidash",36,["stomp","firespin","furyattack","agility"])]),
    t("route_26_youngster_4",13,79,"RIGHT","boy","⚔️ RICHARD",["Richard: That was a great battle!"],"route_26_richard","Psychic T Richard",2,["RICHARD: Let's battle!"],[m("espeon",36)]),
    t("route_26_fisher_5",10,92,"DOWN","fisherman","⚔️ SCOTT",["Scott: That was a great battle!"],"route_26_scott","Fisher Scott",3,["SCOTT: Let's battle!"],[m("qwilfish",30),m("qwilfish",30),m("seaking",34)]),
  ],
  "route_26_heal_house": [
    n("route_26_heal_house_teacher_0",2,3,"DOWN","teacher","TEACHER",[D5]),
  ],
  "victory_road_gate": [
    n("victory_road_gate_officer_0",8,11,"RIGHT","fat_man","OFFICER",[D1]),
    n("victory_road_gate_black_belt_1",7,5,"RIGHT","fat_man","BLACK BELT",[D1]),
    n("victory_road_gate_black_belt_2",12,5,"LEFT","fat_man","BLACK BELT",[D1]),
  ],
  "indigo_plateau_poke_center": [
    n("indigo_plateau_poke_center_nurse_0",3,7,"DOWN","teacher",D8,[D9,D10], {"action":"HEAL_AND_SAVE","counter":true}),
    n("indigo_plateau_poke_center_clerk_1",11,7,"DOWN","boy","🏪 CLERK",[D13], {"action":"OPEN_MART","counter":true}),
    n("indigo_plateau_poke_center_cooltrainer_m_2",11,11,"DOWN","boy",D14,[D6]),
    n("indigo_plateau_poke_center_gramps_3",1,9,"DOWN","fat_man","GRAMPS",[D1]),
  ],
  "wills_room": [
    n("wills_room_will_0",5,7,"DOWN","boy","🏆 WILL",["WILL: You are truly strong. Go on!"], {"action":"E4_EVENT","trainerId":"will","trainerName":"Elite Four Will","team":[{"speciesId":"xatu","level":40,"moves":["quickattack","futuresight","confuseray","psychic"]},{"speciesId":"jynx","level":41,"moves":["doubleslap","lovelykiss","icepunch","psychic"]},{"speciesId":"exeggutor","level":41,"moves":["reflect","leechseed","eggbomb","psychic"]},{"speciesId":"slowbro","level":41,"moves":["curse","amnesia","bodyslam","psychic"]},{"speciesId":"xatu","level":42,"moves":["quickattack","futuresight","confuseray","psychic"]}],"challenge":["WILL: I have been waiting for a challenger. Show me your strength!"]}),
  ],
  "kogas_room": [
    n("kogas_room_koga_0",5,7,"DOWN","boy","🏆 KOGA",["KOGA: You are truly strong. Go on!"], {"action":"E4_EVENT","trainerId":"koga","trainerName":"Elite Four Koga","team":[{"speciesId":"ariados","level":40,"moves":["doubleteam","spiderweb","batonpass","gigadrain"]},{"speciesId":"venomoth","level":41,"moves":["supersonic","gust","psychic","toxic"]},{"speciesId":"forretress","level":43,"moves":["protect","swift","explosion","spikes"]},{"speciesId":"muk","level":42,"moves":["minimize","acidarmor","sludgebomb","toxic"]},{"speciesId":"crobat","level":44,"moves":["doubleteam","quickattack","wingattack","toxic"]}],"challenge":["KOGA: I have been waiting for a challenger. Show me your strength!"]}),
  ],
  "brunos_room": [
    n("brunos_room_bruno_0",5,7,"DOWN","boy","🏆 BRUNO",["BRUNO: You are truly strong. Go on!"], {"action":"E4_EVENT","trainerId":"bruno","trainerName":"Elite Four Bruno","team":[{"speciesId":"hitmontop","level":42,"moves":["pursuit","quickattack","dig","detect"]},{"speciesId":"hitmonlee","level":42,"moves":["swagger","doublekick","hijumpkick","foresight"]},{"speciesId":"hitmonchan","level":42,"moves":["thunderpunch","icepunch","firepunch","machpunch"]},{"speciesId":"onix","level":43,"moves":["bind","earthquake","sandstorm","rockslide"]},{"speciesId":"machamp","level":46,"moves":["rockslide","foresight","vitalthrow","crosschop"]}],"challenge":["BRUNO: I have been waiting for a challenger. Show me your strength!"]}),
  ],
  "karens_room": [
    n("karens_room_karen_0",5,7,"DOWN","boy","🏆 KAREN",["KAREN: You are truly strong. Go on!"], {"action":"E4_EVENT","trainerId":"karen","trainerName":"Elite Four Karen","team":[{"speciesId":"umbreon","level":42,"moves":["sandattack","confuseray","faintattack","meanlook"]},{"speciesId":"vileplume","level":42,"moves":["stunspore","acid","moonlight","petaldance"]},{"speciesId":"gengar","level":45,"moves":["lick","spite","curse","destinybond"]},{"speciesId":"murkrow","level":44,"moves":["quickattack","whirlwind","pursuit","faintattack"]},{"speciesId":"houndoom","level":47,"moves":["roar","pursuit","flamethrower","crunch"]}],"challenge":["KAREN: I have been waiting for a challenger. Show me your strength!"]}),
  ],
  "lances_room": [
    n("lances_room_lance_0",5,3,"DOWN","boy","🏆 LANCE",[D15], {"action":"E4_EVENT","trainerId":"lance","trainerName":"Champion Lance","team":[{"speciesId":"gyarados","level":44,"moves":["flail","raindance","surf","hyperbeam"]},{"speciesId":"dragonite","level":47,"moves":["thunderwave","twister","thunder","hyperbeam"]},{"speciesId":"dragonite","level":47,"moves":["thunderwave","twister","blizzard","hyperbeam"]},{"speciesId":"aerodactyl","level":46,"moves":["wingattack","ancientpower","rockslide","hyperbeam"]},{"speciesId":"charizard","level":46,"moves":["flamethrower","wingattack","slash","hyperbeam"]},{"speciesId":"dragonite","level":50,"moves":["fireblast","safeguard","outrage","hyperbeam"]}],"challenge":["LANCE: I have been waiting for a challenger. Show me your strength!"]}),
    n("lances_room_teacher_1",4,7,"UP","teacher","TEACHER",[D6]),
  ],
  "hall_of_fame": [
    n("hall_of_fame_lance_0",4,12,"UP","boy","🏆 LANCE",[D15], {"action":"E4_EVENT","trainerId":"lance","trainerName":"Champion Lance","team":[{"speciesId":"gyarados","level":44,"moves":["flail","raindance","surf","hyperbeam"]},{"speciesId":"dragonite","level":47,"moves":["thunderwave","twister","thunder","hyperbeam"]},{"speciesId":"dragonite","level":47,"moves":["thunderwave","twister","blizzard","hyperbeam"]},{"speciesId":"aerodactyl","level":46,"moves":["wingattack","ancientpower","rockslide","hyperbeam"]},{"speciesId":"charizard","level":46,"moves":["flamethrower","wingattack","slash","hyperbeam"]},{"speciesId":"dragonite","level":50,"moves":["fireblast","safeguard","outrage","hyperbeam"]}],"challenge":["LANCE: I have been waiting for a challenger. Show me your strength!"]}),
  ],
  "route_28_steel_wing_house": [
    n("route_28_steel_wing_house_cooltrainer_f_0",2,3,"DOWN","girl",D11,[D5]),
  ],
  "silver_cave_poke_center": [
    n("silver_cave_poke_center_nurse_0",3,1,"DOWN","teacher",D8,[D9,D10], {"action":"HEAL_AND_SAVE","counter":true}),
    n("silver_cave_poke_center_granny_1",1,5,"LEFT","teacher","GRANNY",[D1]),
  ],
  "silver_cave_room_3": [
    n("silver_cave_room_3_red_0",9,10,"UP","boy","🏆 RED",["RED: You are truly strong. Go on!"], {"action":"E4_EVENT","trainerId":"red","trainerName":"Trainer Red","team":[{"speciesId":"pikachu","level":81,"moves":["charm","quickattack","thunderbolt","thunder"]},{"speciesId":"espeon","level":73,"moves":["mudslap","reflect","swift","psychic"]},{"speciesId":"snorlax","level":75,"moves":["amnesia","snore","rest","bodyslam"]},{"speciesId":"venusaur","level":77,"moves":["sunnyday","gigadrain","synthesis","solarbeam"]},{"speciesId":"charizard","level":77,"moves":["flamethrower","wingattack","slash","firespin"]},{"speciesId":"blastoise","level":77,"moves":["raindance","surf","blizzard","whirlpool"]}],"challenge":["RED: I have been waiting for a challenger. Show me your strength!"]}),
  ],
  "pallet_town": [
    n("pallet_town_teacher_0",3,8,"DOWN","teacher","TEACHER",[D5]),
    n("pallet_town_fisher_1",12,14,"LEFT","fisherman","FISHER",[D3]),
  ],
  "oaks_lab": [
    n("oaks_lab_scientist_0",1,8,"LEFT","boy","SCIENTIST",[D3]),
    n("oaks_lab_scientist_1",8,9,"UP","boy","SCIENTIST",[D6]),
    n("oaks_lab_scientist_2",1,4,"DOWN","boy","SCIENTIST",[D1]),
  ],
  "route_1": [
    t("route_1_youngster_0",4,11,"RIGHT","boy","⚔️ DANNY",["Danny: That was a great battle!"],"route_1_danny","Schoolboy Danny",4,["DANNY: Let's battle!"],[m("jynx",31),m("electabuzz",31),m("magmar",31)]),
    t("route_1_cooltrainer_f_1",9,25,"DOWN","girl","⚔️ QUINN",["Quinn: That was a great battle!"],"route_1_quinn","Cooltrainerf Quinn",2,["QUINN: Let's battle!"],[m("ivysaur",38),m("starmie",38)]),
  ],
  "viridian_city": [
    n("viridian_city_gramps_0",18,5,"DOWN","fat_man","GRAMPS",[D5]),
    n("viridian_city_fisher_1",6,23,"DOWN","fisherman","FISHER",[D6]),
    n("viridian_city_youngster_2",17,21,"DOWN","boy","YOUNGSTER",[D4]),
  ],
  "viridian_gym": [
    n("viridian_gym_blue_0",5,3,"DOWN","boy","🏆 LEADER BLUE",[D2], {"action":"BLUE_EVENT","trainerId":"blue","trainerName":"Leader Blue","team":[{"speciesId":"pidgeot","level":56,"moves":["quickattack","whirlwind","wingattack","mirrormove"]},{"speciesId":"alakazam","level":54,"moves":["disable","recover","psychic","reflect"]},{"speciesId":"rhydon","level":56,"moves":["furyattack","sandstorm","rockslide","earthquake"]},{"speciesId":"gyarados","level":58,"moves":["twister","hydropump","raindance","hyperbeam"]},{"speciesId":"exeggutor","level":58,"moves":["sunnyday","leechseed","eggbomb","solarbeam"]},{"speciesId":"arcanine","level":58,"moves":["roar","swift","flamethrower","extremespeed"]}]}),
    n("viridian_gym_gym_guide_1",7,13,"DOWN","boy",D7,[D3]),
  ],
  "viridian_poke_center": [
    n("viridian_poke_center_nurse_0",3,1,"DOWN","teacher",D8,[D9,D10], {"action":"HEAL_AND_SAVE","counter":true}),
    n("viridian_poke_center_cooltrainer_m_1",8,4,"LEFT","boy",D14,[D1]),
    n("viridian_poke_center_cooltrainer_f_2",5,3,"UP","girl",D11,[D4]),
    n("viridian_poke_center_bug_catcher_3",1,6,"RIGHT","bug_catcher","BUG CATCHER",[D4]),
  ],
  "viridian_mart": [
    n("viridian_mart_clerk_0",1,3,"RIGHT","boy","🏪 CLERK",[D13], {"action":"OPEN_MART","counter":true}),
    n("viridian_mart_lass_1",7,2,"LEFT","girl","LASS",[D4]),
    n("viridian_mart_cooltrainer_m_2",1,6,"UP","boy",D14,[D3]),
  ],
};
