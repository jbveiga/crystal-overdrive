/**
 * @fileoverview Generated object events, trainers, and dialogues for Central & Goldenrod
 * @module world/generated-npcs/centralJohtoGeneratedNpcs
 * @role Central & Goldenrod Generated NPC records
 * @exports CENTRAL_JOHTO_GENERATED_NPCS
 * @layer world
 * @sections L1-25: Micro-Header & Helpers | L26-320: Map Generated NPC Records
 */
import type { GeneratedNpc } from "../generatedNpcs";

const D1 = "Trainers from all over pass through here on their way to the POKéMON LEAGUE.";
const D2 = "Training every day is the secret to a strong team!";
const D3 = "RECEPTIONIST";
const D4 = "The weather has been fierce lately, but the POKéMON here are tough!";
const D5 = "COOLTRAINER M";
const D6 = "If your POKéMON gets hurt, head to the nearest POKéMON CENTER.";
const D7 = "COOLTRAINER F";
const D8 = "Have you filled your POKéDEX yet? Keep exploring!";
const D9 = "I heard strange rumors about a legendary POKéMON in this region…";
const D10 = "🏆 GYM GUIDE";
const D11 = "👩‍⚕️ NURSE JOY";
const D12 = "Welcome to our POKéMON CENTER!";
const D13 = "We can heal your POKéMON to full health.";
const D14 = "Welcome! How may I help you?";
const D15 = "FISHING GURU";

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

export const CENTRAL_JOHTO_GENERATED_NPCS: Record<string, GeneratedNpc[]> = {
  "viridian_nickname_house": [
    n("viridian_nickname_house_pokefan_m_0",2,4,"RIGHT","fat_man","POKEFAN M",[D1]),
    n("viridian_nickname_house_lass_1",5,4,"UP","girl","LASS",[D2]),
  ],
  "trainer_house_1f": [
    n("trainer_house_1f_receptionist_0",0,11,"RIGHT","teacher",D3,[D4]),
    n("trainer_house_1f_cooltrainer_m_1",7,11,"UP","boy",D5,[D6]),
    n("trainer_house_1f_cooltrainer_f_2",6,2,"DOWN","girl",D7,[D2]),
    n("trainer_house_1f_youngster_3",4,8,"LEFT","boy","YOUNGSTER",[D8]),
    n("trainer_house_1f_gentleman_4",2,4,"RIGHT","fat_man","GENTLEMAN",[D2]),
  ],
  "trainer_house_b1f": [
    n("trainer_house_b1f_receptionist_0",7,1,"DOWN","teacher",D3,[D9]),
  ],
  "route_2": [
    t("route_2_bug_catcher_0",10,45,"LEFT","bug_catcher","⚔️ ROB",["Rob: That was a great battle!"],"route_2_rob","Bug Catcher Rob",4,["ROB: Let's battle!"],[m("beedrill",32),m("butterfree",32)]),
    t("route_2_bug_catcher_1",6,4,"DOWN","bug_catcher","⚔️ ED",["Ed: That was a great battle!"],"route_2_ed","Bug Catcher Ed",3,["ED: Let's battle!"],[m("beedrill",30),m("beedrill",30),m("beedrill",30)]),
    t("route_2_bug_catcher_2",0,40,"RIGHT","bug_catcher","⚔️ DOUG",["Doug: That was a great battle!"],"route_2_doug","Bug Catcher Doug",3,["DOUG: Let's battle!"],[m("ariados",34)]),
  ],
  "route_2_gate": [
    n("route_2_gate_scientist_0",6,4,"UP","boy","SCIENTIST",[D2]),
  ],
  "route_2_nugget_house": [
    n("route_2_nugget_house_fisher_0",2,4,"UP","fisherman","FISHER",[D1]),
  ],
  "pewter_city": [
    n("pewter_city_cooltrainer_f_0",19,11,"DOWN","girl",D7,[D1]),
    n("pewter_city_bug_catcher_1",14,29,"DOWN","bug_catcher","BUG CATCHER",[D9]),
    n("pewter_city_gramps_2",29,17,"LEFT","fat_man","GRAMPS",[D1]),
  ],
  "pewter_gym": [
    n("pewter_gym_brock_0",5,1,"DOWN","boy","🏆 LEADER BROCK",[D1], {"action":"BROCK_EVENT","trainerId":"brock","trainerName":"Leader Brock","team":[{"speciesId":"graveler","level":41,"moves":["defensecurl","rockslide","rollout","earthquake"]},{"speciesId":"rhyhorn","level":41,"moves":["furyattack","scaryface","earthquake","horndrill"]},{"speciesId":"omastar","level":42,"moves":["bite","surf","protect","spikecannon"]},{"speciesId":"onix","level":44,"moves":["bind","rockslide","bide","sandstorm"]},{"speciesId":"kabutops","level":42,"moves":["slash","surf","endure","gigadrain"]}]}),
    t("pewter_gym_youngster_1",2,5,"RIGHT","boy","⚔️ JERRY",["Jerry: That was a great battle!"],"pewter_gym_jerry","Camper Jerry",3,["JERRY: Let's battle!"],[m("sandslash",37)]),
    n("pewter_gym_gym_guide_2",6,11,"DOWN","boy",D10,[D6]),
  ],
  "pewter_poke_center": [
    n("pewter_poke_center_nurse_0",3,1,"DOWN","teacher",D11,[D12,D13], {"action":"HEAL_AND_SAVE","counter":true}),
    n("pewter_poke_center_teacher_1",8,6,"DOWN","teacher","TEACHER",[D8]),
    n("pewter_poke_center_bug_catcher_2",2,3,"DOWN","bug_catcher","BUG CATCHER",[D6]),
    n("pewter_poke_center_pokefan_m_3",7,2,"DOWN","fat_man","POKEFAN M",[D1]),
  ],
  "pewter_mart": [
    n("pewter_mart_clerk_0",1,3,"RIGHT","boy","🏪 CLERK",[D14], {"action":"OPEN_MART","counter":true}),
    n("pewter_mart_youngster_1",9,2,"LEFT","boy","YOUNGSTER",[D1]),
    n("pewter_mart_super_nerd_2",6,6,"DOWN","fat_man","SUPER NERD",[D9]),
  ],
  "pewter_nidoran_house": [
    n("pewter_nidoran_house_super_nerd_0",3,5,"RIGHT","fat_man","SUPER NERD",[D9]),
  ],
  "pewter_snooze_house": [
    n("pewter_snooze_house_gramps_0",5,3,"LEFT","fat_man","GRAMPS",[D9]),
  ],
  "route_3": [
    t("route_3_fisher_0",26,12,"UP","fisherman","⚔️ OTIS",["Otis: That was a great battle!"],"route_3_otis","Firebreather Otis",2,["OTIS: Let's battle!"],[m("magmar",29),m("weezing",32),m("magmar",29)]),
    t("route_3_youngster_1",10,7,"LEFT","boy","⚔️ WARREN",["Warren: That was a great battle!"],"route_3_warren","Youngster Warren",3,["WARREN: Let's battle!"],[m("fearow",35)]),
    t("route_3_youngster_2",16,3,"DOWN","boy","⚔️ JIMMY",["Jimmy: That was a great battle!"],"route_3_jimmy","Youngster Jimmy",1,["JIMMY: Let's battle!"],[m("raticate",33),m("arbok",33)]),
    t("route_3_fisher_3",49,5,"DOWN","fisherman","⚔️ BURT",["Burt: That was a great battle!"],"route_3_burt","Firebreather Burt",3,["BURT: Let's battle!"],[m("koffing",32),m("slugma",32)]),
  ],
  "mount_moon_gift_shop": [
    n("mount_moon_gift_shop_gramps_0",4,3,"DOWN","fat_man","GRAMPS",[D6]),
    n("mount_moon_gift_shop_gramps_1",1,2,"RIGHT","fat_man","GRAMPS",[D2]),
    n("mount_moon_gift_shop_lass_2",1,6,"LEFT","girl","LASS",[D8]),
    n("mount_moon_gift_shop_lass_3",5,4,"UP","girl","LASS",[D1]),
  ],
  "route_4": [
    t("route_4_youngster_0",17,9,"DOWN","boy","⚔️ HANK",["Hank: That was a great battle!"],"route_4_hank","Bird Keeper Hank",3,["HANK: Let's battle!"],[m("pidgey",12),m("pidgeot",34)]),
    t("route_4_lass_1",9,7,"LEFT","girl","⚔️ HOPE",["Hope: That was a great battle!"],"route_4_hope","Picnicker Hope",4,["HOPE: Let's battle!"],[m("flaaffy",34)]),
  ],
  "cerulean_city": [
    n("cerulean_city_cooltrainer_m_0",15,23,"DOWN","boy",D5,[D9]),
    n("cerulean_city_super_nerd_1",23,15,"DOWN","fat_man","SUPER NERD",[D8]),
    n("cerulean_city_cooltrainer_f_2",21,24,"LEFT","girl",D7,[D4]),
    n("cerulean_city_fisher_3",30,26,"LEFT","fisherman","FISHER",[D4]),
    n("cerulean_city_youngster_4",6,12,"DOWN","boy","YOUNGSTER",[D2]),
  ],
  "cerulean_gym": [
    n("cerulean_gym_rocket_0",4,10,"DOWN","boy","ROCKET",[D9]),
    n("cerulean_gym_misty_1",5,3,"DOWN","girl","🏆 LEADER MISTY",[D8], {"action":"MISTY_EVENT","trainerId":"misty","trainerName":"Leader Misty","team":[{"speciesId":"golduck","level":42,"moves":["surf","disable","psychup","psychic"]},{"speciesId":"quagsire","level":42,"moves":["surf","amnesia","earthquake","raindance"]},{"speciesId":"lapras","level":44,"moves":["surf","perishsong","blizzard","raindance"]},{"speciesId":"starmie","level":47,"moves":["surf","confuseray","recover","icebeam"]}]}),
    t("cerulean_gym_swimmer_girl_2",4,7,"RIGHT","girl","⚔️ DIANA",["Diana: That was a great battle!"],"cerulean_gym_diana","Swimmerf Diana",3,["DIANA: Let's battle!"],[m("golduck",37)]),
    t("cerulean_gym_swimmer_girl_3",0,9,"RIGHT","girl","⚔️ BRIANA",["Briana: That was a great battle!"],"cerulean_gym_briana","Swimmerf Briana",1,["BRIANA: Let's battle!"],[m("seaking",35),m("seaking",35)]),
    n("cerulean_gym_gym_guide_4",7,13,"DOWN","boy",D10,[D1]),
  ],
  "cerulean_poke_center": [
    n("cerulean_poke_center_nurse_0",3,1,"DOWN","teacher",D11,[D12,D13], {"action":"HEAL_AND_SAVE","counter":true}),
    n("cerulean_poke_center_super_nerd_1",8,4,"LEFT","fat_man","SUPER NERD",[D6]),
    n("cerulean_poke_center_gym_guide_2",1,5,"DOWN","boy",D10,[D9]),
  ],
  "cerulean_mart": [
    n("cerulean_mart_clerk_0",1,3,"RIGHT","boy","🏪 CLERK",[D14], {"action":"OPEN_MART","counter":true}),
    n("cerulean_mart_cooltrainer_m_1",1,6,"DOWN","boy",D5,[D9]),
    n("cerulean_mart_cooltrainer_f_2",7,2,"LEFT","girl",D7,[D4]),
  ],
  "cerulean_police_station": [
    n("cerulean_police_station_fishing_guru_0",5,1,"UP","fisherman",D15,[D1]),
    n("cerulean_police_station_pokefan_f_1",5,4,"LEFT","teacher","POKEFAN F",[D2]),
  ],
  "cerulean_trade_house": [
    n("cerulean_trade_house_granny_0",2,4,"RIGHT","teacher","GRANNY",[D1]),
    n("cerulean_trade_house_gramps_1",1,2,"DOWN","fat_man","GRAMPS",[D2]),
  ],
  "cerulean_badge_house": [
    n("cerulean_badge_house_pokefan_m_0",2,3,"RIGHT","fat_man","POKEFAN M",[D4]),
  ],
  "route_25": [
    t("route_25_youngster_0",12,8,"DOWN","boy","⚔️ DUDLEY",["Dudley: That was a great battle!"],"route_25_dudley","Schoolboy Dudley",3,["DUDLEY: Let's battle!"],[m("oddish",35)]),
    t("route_25_lass_1",16,11,"UP","girl","⚔️ ELLEN",["Ellen: That was a great battle!"],"route_25_ellen","Lass Ellen",3,["ELLEN: Let's battle!"],[m("wigglytuff",30),m("granbull",34)]),
    t("route_25_youngster_2",21,8,"DOWN","boy","⚔️ JOE",["Joe: That was a great battle!"],"route_25_joe","Schoolboy Joe",1,["JOE: Let's battle!"],[m("tangela",33),m("vaporeon",33)]),
    t("route_25_lass_3",22,6,"RIGHT","girl","⚔️ LAURA",["Laura: That was a great battle!"],"route_25_laura","Lass Laura",3,["LAURA: Let's battle!"],[m("gloom",28),m("pidgeotto",31),m("bellossom",31)]),
    t("route_25_youngster_4",25,4,"DOWN","boy","⚔️ LLOYD",["Lloyd: That was a great battle!"],"route_25_lloyd","Camper Lloyd",2,["LLOYD: Let's battle!"],[m("nidoking",34)]),
    t("route_25_lass_5",28,11,"UP","girl","⚔️ SHANNON",["Shannon: That was a great battle!"],"route_25_shannon","Lass Shannon",1,["SHANNON: Let's battle!"],[m("paras",29),m("paras",29),m("parasect",32)]),
    t("route_25_super_nerd_6",31,7,"DOWN","fat_man","⚔️ PAT",["Pat: That was a great battle!"],"route_25_pat","Super Nerd Pat",1,["PAT: Let's battle!"],[m("porygon",36)]),
    n("route_25_cooltrainer_m_7",37,8,"LEFT","boy",D5,[D2]),
  ],
  "bills_house": [
    n("bills_house_gramps_0",2,3,"UP","fat_man","GRAMPS",[D4]),
  ],
  "route_5": [
    n("route_5_pokefan_m_0",17,16,"DOWN","fat_man","POKEFAN M",undefined),
  ],
  "route_5_underground_entrance": [
    n("route_5_underground_entrance_teacher_0",2,2,"DOWN","teacher","TEACHER",undefined),
  ],
  "route_5_saffron_gate": [
    n("route_5_saffron_gate_officer_0",0,4,"RIGHT","fat_man","OFFICER",undefined),
  ],
  "route_5_cleanse_tag_house": [
    n("route_5_cleanse_tag_house_granny_0",2,5,"DOWN","teacher","GRANNY",undefined),
    n("route_5_cleanse_tag_house_teacher_1",5,3,"LEFT","teacher","TEACHER",undefined),
  ],
  "route_6": [
    n("route_6_pokefan_m_0",17,4,"DOWN","fat_man","POKEFAN M",undefined),
    t("route_6_pokefan_m_1",9,12,"RIGHT","fat_man","⚔️ REX",["Rex: That was a great battle!"],"route_6_rex","Pokefanm Rex",2,["REX: Let's battle!"],[m("phanpy",35)]),
    t("route_6_pokefan_m_2",10,12,"LEFT","fat_man","⚔️ ALLAN",["Allan: That was a great battle!"],"route_6_allan","Pokefanm Allan",2,["ALLAN: Let's battle!"],[m("teddiursa",35)]),
  ],
  "route_6_saffron_gate": [
    n("route_6_saffron_gate_officer_0",0,4,"RIGHT","fat_man","OFFICER",undefined),
  ],
  "vermilion_city": [
    n("vermilion_city_teacher_0",18,9,"DOWN","teacher","TEACHER",undefined),
    n("vermilion_city_gramps_1",23,6,"RIGHT","fat_man","GRAMPS",undefined),
    n("vermilion_city_super_nerd_2",14,16,"DOWN","fat_man","SUPER NERD",undefined),
    n("vermilion_city_pokefan_m_3",31,12,"DOWN","fat_man","POKEFAN M",undefined),
  ],
  "vermilion_gym": [
    n("vermilion_gym_surge_0",5,2,"DOWN","boy","🏆 LEADER SURGE",undefined, {"action":"SURGE_EVENT","trainerId":"surge","trainerName":"Leader Surge","team":[{"speciesId":"raichu","level":44,"moves":["thunderwave","quickattack","thunderbolt","thunder"]},{"speciesId":"electrode","level":40,"moves":["screech","doubleteam","swift","explosion"]},{"speciesId":"magneton","level":40,"moves":["lockon","doubleteam","swift","zapcannon"]},{"speciesId":"electrode","level":40,"moves":["screech","doubleteam","swift","explosion"]},{"speciesId":"electabuzz","level":46,"moves":["quickattack","thunderpunch","lightscreen","thunder"]}]}),
    t("vermilion_gym_gentleman_1",8,8,"LEFT","fat_man","⚔️ GREGORY",["Gregory: That was a great battle!"],"vermilion_gym_gregory","Gentleman Gregory",4,["GREGORY: Let's battle!"],[m("pikachu",37),m("flaaffy",33)]),
    t("vermilion_gym_rocker_2",4,7,"DOWN","boy","⚔️ VINCENT",["Vincent: That was a great battle!"],"vermilion_gym_vincent","Guitarist Vincent",3,["VINCENT: Let's battle!"],[m("magnemite",27),m("voltorb",33),m("magnemite",32),m("magnemite",32)]),
    t("vermilion_gym_super_nerd_3",0,10,"RIGHT","fat_man","⚔️ HORTON",["Horton: That was a great battle!"],"vermilion_gym_horton","Juggler Horton",4,["HORTON: Let's battle!"],[m("electrode",33),m("electrode",33),m("electrode",33),m("electrode",33)]),
    n("vermilion_gym_gym_guide_4",7,15,"DOWN","boy",D10,undefined),
  ],
  "vermilion_poke_center": [
    n("vermilion_poke_center_nurse_0",3,1,"DOWN","teacher",D11,[D12,D13], {"action":"HEAL_AND_SAVE","counter":true}),
    n("vermilion_poke_center_fishing_guru_1",7,2,"DOWN","fisherman",D15,undefined),
    n("vermilion_poke_center_sailor_2",6,5,"UP","fisherman","SAILOR",undefined),
    n("vermilion_poke_center_bug_catcher_3",1,5,"DOWN","bug_catcher","BUG CATCHER",undefined),
  ],
  "vermilion_mart": [
    n("vermilion_mart_clerk_0",1,3,"RIGHT","boy","🏪 CLERK",[D14], {"action":"OPEN_MART","counter":true}),
    n("vermilion_mart_super_nerd_1",5,2,"DOWN","fat_man","SUPER NERD",undefined),
    n("vermilion_mart_beauty_2",8,6,"LEFT","girl","BEAUTY",undefined),
  ],
  "vermilion_fishing_house": [
    n("vermilion_fishing_house_fishing_guru_0",2,4,"DOWN","fisherman",D15,undefined),
  ],
  "vermilion_magnet_train_house": [
    n("vermilion_magnet_train_house_pokefan_f_0",2,3,"LEFT","teacher","POKEFAN F",undefined),
    n("vermilion_magnet_train_house_youngster_1",0,3,"DOWN","boy","YOUNGSTER",undefined),
  ],
  "vermilion_digletts_house": [
    n("vermilion_digletts_house_gentleman_0",1,3,"UP","fat_man","GENTLEMAN",undefined),
  ],
  "vermilion_port_passage": [
    n("vermilion_port_passage_teacher_0",17,1,"LEFT","teacher","TEACHER",undefined),
  ],
  "vermilion_port": [
    n("vermilion_port_sailor_0",8,11,"LEFT","fisherman","SAILOR",undefined),
    n("vermilion_port_sailor_1",6,11,"RIGHT","fisherman","SAILOR",undefined),
    n("vermilion_port_super_nerd_2",11,11,"LEFT","fat_man","SUPER NERD",undefined),
  ],
  "fast_ship_1f": [
    n("fast_ship_1f_sailor_0",24,2,"RIGHT","fisherman","SAILOR",undefined),
    n("fast_ship_1f_sailor_1",14,7,"RIGHT","fisherman","SAILOR",undefined),
    n("fast_ship_1f_sailor_2",22,17,"LEFT","fisherman","SAILOR",undefined),
    n("fast_ship_1f_gentleman_3",19,6,"RIGHT","fat_man","GENTLEMAN",undefined),
  ],
  "fast_ship_cabins_nnw_nne_ne": [
    t("fast_ship_cabins_nnw_nne_ne_cooltrainer_m_0",4,3,"DOWN","boy","⚔️ SEAN",["Sean: That was a great battle!"],"fast_ship_cabins_nnw_nne_ne_sean","Cooltrainerm Sean",2,["SEAN: Let's battle!"],[m("flareon",35),m("tangela",35),m("tauros",35)]),
    t("fast_ship_cabins_nnw_nne_ne_cooltrainer_f_1",1,5,"UP","girl","⚔️ CAROL",["Carol: That was a great battle!"],"fast_ship_cabins_nnw_nne_ne_carol","Cooltrainerf Carol",3,["CAROL: Let's battle!"],[m("electrode",35),m("starmie",35),m("ninetales",35)]),
    t("fast_ship_cabins_nnw_nne_ne_pokefan_m_2",4,17,"UP","fat_man","⚔️ NOLAND",["Noland: That was a great battle!"],"fast_ship_cabins_nnw_nne_ne_noland","Hiker Noland",3,["NOLAND: Let's battle!"],[m("sandslash",31),m("golem",33)]),
    n("fast_ship_cabins_nnw_nne_ne_sailor_3",4,26,"DOWN","fisherman","SAILOR",undefined),
    t("fast_ship_cabins_nnw_nne_ne_gentleman_4",7,30,"DOWN","fat_man","⚔️ EDWARD",["Edward: That was a great battle!"],"fast_ship_cabins_nnw_nne_ne_edward","Gentleman Edward",1,["EDWARD: Let's battle!"],[m("persian",33)]),
    t("fast_ship_cabins_nnw_nne_ne_pharmacist_5",2,30,"UP","teacher","⚔️ COREY",["Corey: That was a great battle!"],"fast_ship_cabins_nnw_nne_ne_corey","Burglar Corey",4,["COREY: Let's battle!"],[m("koffing",25),m("magmar",28),m("koffing",25),m("koffing",30)]),
  ],
  "fast_ship_cabins_sw_ssw_nw": [
    t("fast_ship_cabins_sw_ssw_nw_fisher_0",1,15,"DOWN","fisherman","⚔️ LYLE",["Lyle: That was a great battle!"],"fast_ship_cabins_sw_ssw_nw_lyle","Firebreather Lyle",2,["LYLE: Let's battle!"],[m("koffing",28),m("flareon",31),m("koffing",28)]),
    t("fast_ship_cabins_sw_ssw_nw_bug_catcher_1",6,15,"DOWN","bug_catcher","⚔️ KEN",["Ken: That was a great battle!"],"fast_ship_cabins_sw_ssw_nw_ken","Bug Catcher Ken",2,["KEN: Let's battle!"],[m("ariados",30),m("pinsir",32)]),
    t("fast_ship_cabins_sw_ssw_nw_beauty_2",1,26,"DOWN","girl","⚔️ CASSIE",["Cassie: That was a great battle!"],"fast_ship_cabins_sw_ssw_nw_cassie","Beauty Cassie",3,["CASSIE: Let's battle!"],[m("vileplume",28),m("butterfree",34)]),
    t("fast_ship_cabins_sw_ssw_nw_rocker_3",3,28,"DOWN","boy","⚔️ CLYDE",["Clyde: That was a great battle!"],"fast_ship_cabins_sw_ssw_nw_clyde","Guitarist Clyde",2,["CLYDE: Let's battle!"],[m("electabuzz",34)]),
  ],
  "fast_ship_cabins_se_sse_captains_cabin": [
    n("fast_ship_cabins_se_sse_captains_cabin_gentleman_0",2,17,"RIGHT","fat_man","GENTLEMAN",undefined),
    n("fast_ship_cabins_se_sse_captains_cabin_twin_1",3,17,"DOWN","girl","TWIN",undefined),
    n("fast_ship_cabins_se_sse_captains_cabin_twin_2",2,25,"DOWN","girl","TWIN",undefined),
    t("fast_ship_cabins_se_sse_captains_cabin_pokefan_m_3",5,6,"LEFT","fat_man","⚔️ COLIN",["Colin: That was a great battle!"],"fast_ship_cabins_se_sse_captains_cabin_colin","Pokefanm Colin",4,["COLIN: Let's battle!"],[m("delibird",32)]),
    t("fast_ship_cabins_se_sse_captains_cabin_super_nerd_6",5,5,"LEFT","fat_man","⚔️ RODNEY",["Rodney: That was a great battle!"],"fast_ship_cabins_se_sse_captains_cabin_rodney","Psychic T Rodney",4,["RODNEY: Let's battle!"],[m("drowzee",29),m("hypno",33)]),
    t("fast_ship_cabins_se_sse_captains_cabin_pokefan_m_7",2,3,"DOWN","fat_man","⚔️ JEREMY",["Jeremy: That was a great battle!"],"fast_ship_cabins_se_sse_captains_cabin_jeremy","Pokefanm Jeremy",3,["JEREMY: Let's battle!"],[m("meowth",28),m("meowth",28),m("meowth",28)]),
    t("fast_ship_cabins_se_sse_captains_cabin_super_nerd_8",1,15,"DOWN","fat_man","⚔️ SHAWN",["Shawn: That was a great battle!"],"fast_ship_cabins_se_sse_captains_cabin_shawn","Super Nerd Shawn",2,["SHAWN: Let's battle!"],[m("magnemite",31),m("muk",33),m("magnemite",31)]),
  ],
  "fast_ship_b1f": [
    n("fast_ship_b1f_sailor_0",30,6,"DOWN","fisherman","SAILOR",undefined),
    n("fast_ship_b1f_sailor_1",31,6,"DOWN","fisherman","SAILOR",undefined),
    t("fast_ship_b1f_sailor_2",9,11,"UP","fisherman","⚔️ JEFF",["Jeff: That was a great battle!"],"fast_ship_b1f_jeff","Sailor Jeff",3,["JEFF: Let's battle!"],[m("raticate",32),m("raticate",32)]),
    t("fast_ship_b1f_lass_3",6,4,"UP","girl","⚔️ DEBRA",["Debra: That was a great battle!"],"fast_ship_b1f_debra","Picnicker Debra",1,["DEBRA: Let's battle!"],[m("seaking",33)]),
    t("fast_ship_b1f_super_nerd_4",26,9,"RIGHT","fat_man","⚔️ FRITZ",["Fritz: That was a great battle!"],"fast_ship_b1f_fritz","Juggler Fritz",1,["FRITZ: Let's battle!"],[m("mrmime",29),m("magmar",29),m("machoke",29)]),
    t("fast_ship_b1f_sailor_5",17,4,"RIGHT","fisherman","⚔️ GARRETT",["Garrett: That was a great battle!"],"fast_ship_b1f_garrett","Sailor Garrett",4,["GARRETT: Let's battle!"],[m("kingler",34)]),
    t("fast_ship_b1f_fisher_6",25,8,"UP","fisherman","⚔️ JONAH",["Jonah: That was a great battle!"],"fast_ship_b1f_jonah","Fisher Jonah",3,["JONAH: Let's battle!"],[m("shellder",25),m("octillery",29),m("remoraid",25),m("cloyster",29)]),
    t("fast_ship_b1f_black_belt_7",15,11,"DOWN","fat_man","⚔️ WAI",["Wai: That was a great battle!"],"fast_ship_b1f_wai","Blackbelt T Wai",3,["WAI: Let's battle!"],[m("machoke",30),m("machoke",32),m("machoke",34)]),
    t("fast_ship_b1f_sailor_8",23,4,"RIGHT","fisherman","⚔️ KENNETH",["Kenneth: That was a great battle!"],"fast_ship_b1f_kenneth","Sailor Kenneth",4,["KENNETH: Let's battle!"],[m("machop",28),m("machop",28),m("poliwrath",28),m("machop",28)]),
    t("fast_ship_b1f_youngster_9",14,9,"DOWN","boy","⚔️ NATE",["Nate: That was a great battle!"],"fast_ship_b1f_nate","Schoolboy Nate",1,["NATE: Let's battle!"],[m("ledian",32),m("exeggutor",32)]),
    t("fast_ship_b1f_youngster_10",14,11,"DOWN","boy","⚔️ RICKY",["Ricky: That was a great battle!"],"fast_ship_b1f_ricky","Schoolboy Ricky",1,["RICKY: Let's battle!"],[m("aipom",32),m("ditto",32)]),
  ],
  "olivine_port_passage": [
    n("olivine_port_passage_pokefan_m_0",17,1,"LEFT","fat_man","POKEFAN M",undefined),
  ],
  "olivine_port": [
    n("olivine_port_sailor_0",6,14,"DOWN","fisherman","SAILOR",undefined),
    n("olivine_port_sailor_1",7,15,"UP","fisherman","SAILOR",undefined),
    n("olivine_port_sailor_2",6,15,"RIGHT","fisherman","SAILOR",undefined),
    n("olivine_port_fishing_guru_3",4,14,"UP","fisherman",D15,undefined),
    n("olivine_port_fishing_guru_4",13,14,"UP","fisherman",D15,undefined),
    n("olivine_port_youngster_5",4,15,"DOWN","boy","YOUNGSTER",undefined),
    n("olivine_port_cooltrainer_f_6",11,15,"DOWN","girl",D7,undefined),
  ],
  "route_11": [
    t("route_11_youngster_0",22,14,"DOWN","boy","⚔️ OWEN",["Owen: That was a great battle!"],"route_11_owen","Youngster Owen",3,["OWEN: Let's battle!"],[m("growlithe",35)]),
    t("route_11_youngster_1",20,4,"DOWN","boy","⚔️ JASON",["Jason: That was a great battle!"],"route_11_jason","Youngster Jason",3,["JASON: Let's battle!"],[m("sandslash",33),m("crobat",33)]),
    t("route_11_youngster_2",28,7,"DOWN","boy","⚔️ HERMAN",["Herman: That was a great battle!"],"route_11_herman","Psychic T Herman",1,["HERMAN: Let's battle!"],[m("exeggcute",30),m("exeggcute",30),m("exeggutor",30)]),
    t("route_11_youngster_3",8,6,"DOWN","boy","⚔️ FIDEL",["Fidel: That was a great battle!"],"route_11_fidel","Psychic T Fidel",3,["FIDEL: Let's battle!"],[m("xatu",34)]),
  ],
  "digletts_cave": [
    n("digletts_cave_pokefan_m_0",3,31,"DOWN","fat_man","POKEFAN M",undefined),
  ],
  "route_9": [
    t("route_9_youngster_0",23,11,"LEFT","boy","⚔️ DEAN",["Dean: That was a great battle!"],"route_9_dean","Camper Dean",3,["DEAN: Let's battle!"],[m("golduck",33),m("sandslash",31)]),
    t("route_9_lass_1",39,8,"DOWN","girl","⚔️ HEIDI",["Heidi: That was a great battle!"],"route_9_heidi","Picnicker Heidi",3,["HEIDI: Let's battle!"],[m("skiploom",32),m("skiploom",32)]),
    t("route_9_youngster_2",11,4,"DOWN","boy","⚔️ SID",["Sid: That was a great battle!"],"route_9_sid","Camper Sid",4,["SID: Let's battle!"],[m("dugtrio",32),m("primeape",29),m("poliwrath",29)]),
    t("route_9_lass_3",12,15,"UP","girl","⚔️ EDNA",["Edna: That was a great battle!"],"route_9_edna","Picnicker Edna",1,["EDNA: Let's battle!"],[m("nidorina",30),m("raichu",34)]),
    t("route_9_pokefan_m_4",28,3,"RIGHT","fat_man","⚔️ TIM",["Tim: That was a great battle!"],"route_9_tim","Hiker Tim",2,["TIM: Let's battle!"],[m("graveler",31),m("graveler",31),m("graveler",31)]),
    t("route_9_pokefan_m_5",36,15,"RIGHT","fat_man","⚔️ SIDNEY",["Sidney: That was a great battle!"],"route_9_sidney","Hiker Sidney",4,["SIDNEY: Let's battle!"],[m("dugtrio",34),m("onix",32)]),
  ],
  "route_10_south": [
    t("route_10_south_pokefan_m_0",17,3,"LEFT","fat_man","⚔️ JIM",["Jim: That was a great battle!"],"route_10_south_jim","Hiker Jim",3,["JIM: Let's battle!"],[m("machamp",35)]),
    t("route_10_south_pokefan_m_1",8,10,"DOWN","fat_man","⚔️ ROBERT",["Robert: That was a great battle!"],"route_10_south_robert","Pokefanm Robert",3,["ROBERT: Let's battle!"],[m("quagsire",33)]),
  ],
  "route_10_poke_center": [
    n("route_10_poke_center_nurse_0",3,1,"DOWN","teacher",D11,[D12,D13], {"action":"HEAL_AND_SAVE","counter":true}),
    n("route_10_poke_center_gentleman_1",7,6,"LEFT","fat_man","GENTLEMAN",undefined),
    n("route_10_poke_center_gym_guide_2",7,2,"DOWN","boy",D10,undefined),
    n("route_10_poke_center_cooltrainer_f_3",1,3,"DOWN","girl",D7,undefined),
  ],
  "lavender_town": [
    n("lavender_town_pokefan_m_0",12,7,"LEFT","fat_man","POKEFAN M",undefined),
    n("lavender_town_teacher_1",2,15,"LEFT","teacher","TEACHER",undefined),
    n("lavender_town_gramps_2",14,12,"UP","fat_man","GRAMPS",undefined),
    n("lavender_town_youngster_3",6,11,"LEFT","boy","YOUNGSTER",undefined),
  ],
  "lavender_poke_center": [
    n("lavender_poke_center_nurse_0",3,1,"DOWN","teacher",D11,[D12,D13], {"action":"HEAL_AND_SAVE","counter":true}),
    n("lavender_poke_center_gentleman_1",7,6,"LEFT","fat_man","GENTLEMAN",undefined),
    n("lavender_poke_center_teacher_2",5,3,"DOWN","teacher","TEACHER",undefined),
    n("lavender_poke_center_youngster_3",1,5,"UP","boy","YOUNGSTER",undefined),
  ],
};
