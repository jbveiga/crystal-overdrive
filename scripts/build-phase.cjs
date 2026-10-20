/**
 * Generic phase builder: derives map specs, reciprocal warps/connections, landing tiles,
 * wild encounters and NPC/trainer data directly from the pret/pokecrystal asm in scripts/pokecrystal_raw.
 *
 * Usage: node scripts/build-phase.cjs <phase-name>   (phase definitions live in scripts/phases/<name>.cjs)
 * Steps: 1) fetch missing sources  2) append buildMapFromBlk specs to generate-authentic-tiles.cjs
 *        3) run generator for the phase maps  4) fix landing tiles  5) emit NPCs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RAW = path.join(__dirname, 'pokecrystal_raw');
const MAPS_DIR = path.join(ROOT, 'public/assets/data/maps');
const GEN = path.join(__dirname, 'generate-authentic-tiles.cjs');
const BASE = 'https://raw.githubusercontent.com/pret/pokecrystal/master';

const phaseName = process.argv[2];
if (!phaseName) throw new Error('phase name required');
const phase = require(`./phases/${phaseName}.cjs`);

const rawPath = (rel) => path.join(RAW, rel.replace(/\//g, '__'));
const read = (rel) => fs.readFileSync(rawPath(rel), 'utf8');

async function fetchRaw(rel) {
  if (fs.existsSync(rawPath(rel))) return true;
  const r = await fetch(`${BASE}/${rel}`);
  if (!r.ok) return false;
  fs.writeFileSync(rawPath(rel), Buffer.from(await r.arrayBuffer()));
  return true;
}

const camelToConst = (s) => s;
const attrText = read('data/maps/attributes.asm');
const constText = read('constants/map_constants.asm');
const blocksText = read('data/maps/blocks.asm');
const partiesText = read('data/trainers/parties.asm');
const grassText = read('data/wild/johto_grass.asm') + '\n' + (fs.existsSync(rawPath('data/wild/kanto_grass.asm')) ? read('data/wild/kanto_grass.asm') : '');

// asm name -> CONST, CONST -> asm name
const constOf = {};
const asmOf = {};
for (const m of attrText.matchAll(/map_attributes (\w+), (\w+),/g)) {
  constOf[m[1]] = m[2];
  asmOf[m[2]] = m[1];
}
const idOfAsm = {};
for (const d of phase.maps) idOfAsm[d.asm] = d.id;
const existingAsmToId = phase.existing || {};
const resolveId = (cst) => {
  const a = asmOf[cst];
  return (a && (idOfAsm[a] || existingAsmToId[a])) || null;
};

function dims(asm) {
  const m = constText.match(new RegExp(`map_const\\s+${constOf[asm]},\\s*(\\d+),\\s*(\\d+)`));
  return { w: +m[1], h: +m[2] };
}

function blkFor(asm) {
  const i = blocksText.indexOf(`${asm}_Blocks`);
  const m = blocksText.slice(i).match(/INCBIN\s+"([^"]+)"/);
  return m[1];
}

function warpsOf(asm) {
  const t = read(`maps/${asm}.asm`);
  const i = t.indexOf('def_warp_events');
  if (i < 0) return [];
  const end = t.indexOf('def_coord_events', i);
  return [...t.slice(i, end > 0 ? end : undefined).matchAll(/warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(-?\d+)/g)].map(
    (m) => ({ x: +m[1], y: +m[2], target: m[3], idx: +m[4] })
  );
}

function connectionsOf(asm) {
  const i = attrText.indexOf(`map_attributes ${asm},`);
  const chunk = attrText.slice(i).split(/\n\s*\n/)[0];
  const out = {};
  for (const m of chunk.matchAll(/connection (north|south|east|west), \w+, (\w+), (-?\d+)/g)) {
    const id = resolveId(m[2]);
    if (id) out[m[1].toUpperCase()] = { mapId: id, offset: +m[3] * 2 };
  }
  return out;
}

function grassOf(cst) {
  const m = grassText.match(new RegExp(`def_grass_wildmons ${cst}\\n([\\s\\S]*?)end_grass_wildmons`));
  if (!m) return [];
  const day = m[1].split('; day')[1]?.split('; nite')[0] || '';
  const slotW = [30, 30, 20, 10, 5, 4, 1];
  const mons = [...day.matchAll(/db\s+(\d+),\s*(\w+)/g)].map((x, i) => ({
    speciesId: x[2].toLowerCase().replace(/_/g, ''),
    minLevel: +x[1],
    maxLevel: +x[1],
    weight: slotW[i] || 1,
  }));
  const merged = {};
  for (const e of mons) {
    const k = e.speciesId;
    if (!merged[k]) merged[k] = { ...e };
    else {
      merged[k].weight += e.weight;
      merged[k].minLevel = Math.min(merged[k].minLevel, e.minLevel);
      merged[k].maxLevel = Math.max(merged[k].maxLevel, e.maxLevel);
    }
  }
  return Object.values(merged);
}

// ---------- trainers ----------
function partyFor(cls, name) {
  const norm = (s) => s.toLowerCase().replace(/_/g, '');
  const target = norm(cls).replace(/t$/, '') ;
  const groups = [...partiesText.matchAll(/^(\w+)Group:/gm)];
  let g = groups.find((x) => norm(x[1]) === norm(cls)) || groups.find((x) => norm(x[1]) === target);
  if (!g) g = groups.find((x) => norm(x[1]).startsWith(target));
  if (!g) return null;
  const start = g.index;
  const next = groups.find((x) => x.index > start);
  const body = partiesText.slice(start, next ? next.index : undefined);
  const base = name.replace(/\d+$/, '');
  const re = new RegExp(`db "${base}@", (TRAINERTYPE_\\w+)\\n([\\s\\S]*?)db -1`);
  const m = body.match(re);
  if (!m) return null;
  const type = m[1];
  const team = [];
  for (const line of m[2].split('\n')) {
    const l = line.split(';')[0].trim();
    if (!l.startsWith('db')) continue;
    const parts = l.replace(/^db\s+/, '').split(',').map((s) => s.trim());
    const spec = { speciesId: parts[1].toLowerCase().replace(/_/g, ''), level: +parts[0] };
    let rest = parts.slice(2);
    if (type === 'TRAINERTYPE_ITEM') rest = [];
    if (type === 'TRAINERTYPE_ITEM_MOVES') rest = rest.slice(1);
    if (type === 'TRAINERTYPE_NORMAL') rest = [];
    const moves = rest.filter((x) => x && x !== 'NO_MOVE').map((x) => (x === 'PSYCHIC_M' ? 'psychic' : x.toLowerCase().replace(/_/g, '')));
    if (moves.length) spec.moves = moves;
    team.push(spec);
  }
  return team;
}

const GIRL = ['LASS', 'BEAUTY', 'TWIN', 'SWIMMER_GIRL', 'PICNICKER', 'KIMONO_GIRL', 'COOLTRAINER_F', 'MEDIUM', 'MOM', 'JASMINE'];
const TEACH = ['POKEFAN_F', 'TEACHER', 'NURSE', 'GRANNY', 'LADY', 'PHARMACIST', 'RECEPTIONIST'];
const FISH = ['FISHER', 'SAILOR', 'FISHING_GURU', 'SWIMMER_M', 'COOK'];
const FAT = ['POKEFAN_M', 'FAT_MAN', 'GENTLEMAN', 'BLACK_BELT', 'SUPER_NERD', 'HIKER', 'OFFICER', 'GRAMPS'];
const PEOPLE = new Set([
  ...GIRL, ...TEACH, ...FISH, ...FAT, 'YOUNGSTER', 'STANDING_YOUNGSTER', 'COOLTRAINER_M', 'BUG_CATCHER', 'BIRD_KEEPER', 'SAGE', 'ROCKER',
  'SKIER', 'BOARDER', 'GUITARIST', 'FIREBREATHER', 'JUGGLER', 'PSYCHIC', 'CAMPER', 'BIKER', 'POKEMANIAC', 'GRUNT', 'ROCKET', 'CLERK',
  'WILL', 'KOGA', 'BRUNO', 'KAREN', 'LANCE', 'RED',
  'SCIENTIST', 'MYSTICALMAN', 'GYM_GUIDE', 'SILVER', 'COOLTRAINER', 'BLACKBELT', 'MANIA', 'BURGLAR', 'EUSINE', 'CLAIR', 'PRYCE', 'DRAGON_TAMER', 'ELDER', 'SCHOOLBOY', 'BLUE', 'SUPER', 'POKEFAN',
]);
function spriteInfo(sp) {
  const n = sp.replace('SPRITE_', '');
  if (!PEOPLE.has(n) && !['KURT', 'JANINE', 'ROCKET_GIRL', 'MAGIKARP_GUY'].includes(n)) return null;
  const type = GIRL.includes(n) || n === 'ROCKET_GIRL' ? 'girl' : TEACH.includes(n) ? 'teacher' : FISH.includes(n) ? 'fisherman' : FAT.includes(n) ? 'fat_man' : n === 'BUG_CATCHER' ? 'bug_catcher' : n === 'BIRD_KEEPER' ? 'bird_keeper' : n === 'SAGE' ? 'sage' : 'boy';
  return { n, type };
}

const LORE = [
  'The weather has been fierce lately, but the POKéMON here are tough!',
  'Trainers from all over pass through here on their way to the POKéMON LEAGUE.',
  'If your POKéMON gets hurt, head to the nearest POKéMON CENTER.',
  'I heard strange rumors about a legendary POKéMON in this region…',
  'Have you filled your POKéDEX yet? Keep exploring!',
  'Training every day is the secret to a strong team!',
];

function dirOf(mv) {
  if (mv.includes('UP')) return 'UP';
  if (mv.includes('LEFT')) return 'LEFT';
  if (mv.includes('RIGHT')) return 'RIGHT';
  return 'DOWN';
}

const E4 = { WILL: ['WILL', 'WILL'], KOGA: ['KOGA', 'KOGA'], BRUNO: ['BRUNO', 'BRUNO'], KAREN: ['KAREN', 'KAREN'], LANCE: ['CHAMPION', 'LANCE'], RED: ['RED', 'RED'] };

function npcsOf(asm, id, grid) {
  const t = read(`maps/${asm}.asm`);
  const i = t.indexOf('def_object_events');
  if (i < 0) return [];
  const out = [];
  let k = 0;
  for (const m of t.slice(i).matchAll(/object_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\w+),[^,]*,[^,]*,[^,]*,[^,]*,\s*\w+,\s*(OBJECTTYPE_\w+),\s*(\d+),\s*(\w+)/g)) {
    const [, xs, ys, sprite, mv, otype, sight, script] = m;
    const info = spriteInfo(sprite);
    if (!info) continue;
    let x = +xs, y = +ys;
    const ok = (a, b) => a >= 0 && b >= 0 && a < grid.w && b < grid.h && [0, 2].includes(grid.c[b * grid.w + a]);
    if (!ok(x, y)) {
      const alt = [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]].find(([a, b]) => ok(a, b));
      if (!alt) continue;
      [x, y] = alt;
    }
    if (out.some((o) => o.x === x && o.y === y)) continue;
    const nice = info.n.replace(/_/g, ' ');
    const npc = { id: `${id}_${info.n.toLowerCase()}_${k++}`, x, y, dir: dirOf(mv), sprite: info.type, speaker: nice, pages: [LORE[(x + y + k) % LORE.length]] };
    if (info.n === 'NURSE') Object.assign(npc, { action: 'HEAL_AND_SAVE', counter: true, pages: ['Welcome to our POKéMON CENTER!', 'We can heal your POKéMON to full health.'], speaker: '👩‍⚕️ NURSE JOY' });
    else if (info.n === 'CLERK') Object.assign(npc, { action: 'OPEN_MART', counter: true, pages: ['Welcome! How may I help you?'], speaker: '🏪 CLERK' });
    else if (info.n === 'GYM_GUIDE') npc.speaker = '🏆 GYM GUIDE';
    else if (E4[info.n]) {
      const [grp, nm] = E4[info.n];
      const team = partyFor(grp, nm);
      if (!team) continue;
      const pretty = nm[0] + nm.slice(1).toLowerCase();
      Object.assign(npc, { action: 'E4_EVENT', trainerId: nm.toLowerCase(), trainerName: `${info.n === 'LANCE' ? 'Champion' : info.n === 'RED' ? 'Trainer' : 'Elite Four'} ${pretty}`, team, speaker: `🏆 ${nm}`, challenge: [`${nm}: I have been waiting for a challenger. Show me your strength!`], pages: [`${nm}: You are truly strong. Go on!`] });
    }
    else if (otype === 'OBJECTTYPE_TRAINER') {
      const ln = t.match(new RegExp(`^${script}:\\n\\s*trainer (\\w+), (\\w+),`, 'm'));
      if (!ln) continue;
      const team = partyFor(ln[1], ln[2]);
      if (!team) continue;
      const nm = ln[2].replace(/\d+$/, '');
      const pretty = nm[0] + nm.slice(1).toLowerCase();
      Object.assign(npc, {
        action: 'TRAINER_BATTLE', trainerId: `${id}_${nm.toLowerCase()}`, trainerName: `${ln[1].replace(/_/g, ' ')} ${pretty}`.replace(/\w+/g, (w) => w[0] + w.slice(1).toLowerCase()),
        vision: Math.min(+sight || 2, 4), challenge: [`${nm}: Let's battle!`], team, speaker: `⚔️ ${pretty.toUpperCase()}`, pages: [`${pretty}: That was a great battle!`],
      });
    } else if (['SPRITE_PRYCE', 'SPRITE_CLAIR'].includes(sprite)) {
      const leader = sprite === 'SPRITE_PRYCE' ? 'PRYCE' : 'CLAIR';
      const team = partyFor(leader, leader);
      Object.assign(npc, { action: `${leader}_EVENT`, trainerId: leader.toLowerCase(), trainerName: `Leader ${leader[0]}${leader.slice(1).toLowerCase()}`, team, speaker: `🏆 LEADER ${leader}` });
    }
    out.push(npc);
  }
  return out;
}

(async () => {
  // 1. fetch sources
  await fetchRaw('data/wild/kanto_grass.asm');
  for (const t of phase.tilesets || []) {
    for (const f of [`gfx/tilesets/${t}.png`, `gfx/tilesets/${t}_palette_map.asm`, `data/tilesets/${t}_metatiles.bin`, `data/tilesets/${t}_collision.asm`]) await fetchRaw(f);
  }
  for (const d of phase.maps) {
    await fetchRaw(`maps/${d.asm}.asm`);
    await fetchRaw(blkFor(d.asm));
  }

  // 2. specs
  let code = `\n// ==========================================\n// ${phase.title} (auto-generated by build-phase.cjs)\n// ==========================================\n`;
  const marker = `// >>> ${phaseName} specs`;
  const specs = [];
  const warpTable = {};
  for (const d of phase.maps) warpTable[d.asm] = warpsOf(d.asm);
  for (const d of phase.maps) {
    const { w, h } = dims(d.asm);
    const warps = [];
    for (const wp of warpTable[d.asm]) {
      const tAsm = asmOf[wp.target];
      const tid = tAsm && (idOfAsm[tAsm] || existingAsmToId[tAsm]);
      if (!tid) continue;
      const tw = warpTable[tAsm] || (warpTable[tAsm] = warpsOf(tAsm));
      const dest = tw && tw[wp.idx - 1];
      if (!dest) continue;
      warps.push({ x: wp.x, y: wp.y, targetMapId: tid, targetX: dest.x, targetY: dest.y });
    }
    // inbound warps for existing maps are patched in step 4
    specs.push(`buildMapFromBlk({
  id: '${d.id}',
  name: ${JSON.stringify(d.name)},
  tileset: '${d.tileset}',
  blkFile: '${blkFor(d.asm).replace(/\//g, '__')}',
  blocksW: ${w},
  blocksH: ${h},${d.roof ? `\n  roofGroup: '${d.roof}',` : ''}
  connections: ${JSON.stringify(connectionsOf(d.asm))},
  warps: ${JSON.stringify(warps)},
  bgEvents: [],
  grassEncounters: ${JSON.stringify(grassOf(constOf[d.asm]))},
});
`);
  }
  let gen = fs.readFileSync(GEN, 'utf8');
  const tail = "console.log(`Total authentic 64x64 quadrant PNGs generated";
  const startMark = `${marker} start\n`;
  const endMark = `${marker} end\n`;
  if (gen.includes(startMark)) {
    const a = gen.indexOf(startMark);
    const b = gen.indexOf(endMark) + endMark.length;
    gen = gen.slice(0, a) + gen.slice(b);
  }
  gen = gen.replace(tail, `${startMark}${code}${specs.join('\n')}${endMark}\n${tail}`);
  fs.writeFileSync(GEN, gen);

  // 3. generate
  const ids = [...phase.maps.map((m) => m.id), ...(phase.regenerate || [])];
  execFileSync('node', [GEN, ...ids], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

  // 4. landing tiles
  for (const pc of phase.patchConnections || []) {
    const pm = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, `${pc.map}.json`), 'utf8'));
    pm.connections[pc.dir] = pc.conn;
    fs.writeFileSync(path.join(MAPS_DIR, `${pc.map}.json`), JSON.stringify(pm, null, 2) + '\n');
  }
  const load = (id) => JSON.parse(fs.readFileSync(path.join(MAPS_DIR, `${id}.json`), 'utf8'));
  const isOutdoor = (m) => Object.keys(m.connections || {}).length > 0;
  const fixIds = [...phase.maps.map((m) => m.id), ...(phase.regenerate || [])];
  for (const id of fixIds) {
    const m = load(id);
    for (const w of m.warps) {
      const tm = load(w.targetMapId);
      if (!isOutdoor(tm)) continue;
      const warpSet = new Set(tm.warps.map((q) => `${q.x},${q.y}`));
      const ok = (a, b) => a >= 0 && b >= 0 && a < tm.width && b < tm.height && [0, 2].includes(tm.collisionGrid[b * tm.width + a]) && !warpSet.has(`${a},${b}`);
      const alt = [[w.targetX, w.targetY + 1], [w.targetX - 1, w.targetY], [w.targetX + 1, w.targetY], [w.targetX, w.targetY - 1]].find(([a, b]) => ok(a, b));
      if (alt) [w.targetX, w.targetY] = alt;
    }
    fs.writeFileSync(path.join(MAPS_DIR, `${id}.json`), JSON.stringify(m, null, 2) + '\n');
  }

  // 5. NPCs
  const npcFile = path.join(__dirname, 'generated-npcs.json');
  const all = fs.existsSync(npcFile) ? JSON.parse(fs.readFileSync(npcFile, 'utf8')) : {};
  for (const d of phase.maps) {
    const m = load(d.id);
    const list = npcsOf(d.asm, d.id, { w: m.width, h: m.height, c: m.collisionGrid });
    if (list.length) all[d.id] = list;
    else delete all[d.id];
  }
  fs.writeFileSync(npcFile, JSON.stringify(all, null, 2) + '\n');
  const ts = `// AUTO-GENERATED by scripts/build-phase.cjs from pret/pokecrystal object events. Do not edit by hand.
export interface GeneratedNpc {
  id: string;
  x: number;
  y: number;
  dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  sprite: string;
  speaker: string;
  pages: string[];
  action?: string;
  counter?: boolean;
  trainerId?: string;
  trainerName?: string;
  vision?: number;
  challenge?: string[];
  team?: { speciesId: string; level: number; moves?: string[] }[];
}

export const GENERATED_NPCS: Record<string, GeneratedNpc[]> = ${JSON.stringify(all, null, 2)};
`;
  fs.writeFileSync(path.join(ROOT, 'src/world/generatedNpcs.ts'), ts);
  console.log(`Phase ${phaseName}: ${phase.maps.length} maps, ${Object.values(all).reduce((a, b) => a + b.length, 0)} generated NPCs total`);
})();
