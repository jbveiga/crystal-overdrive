/**
 * @fileoverview FieldObstacleDispatcher domain module implementation.
 * @module world/interactions/FieldObstacleDispatcher
 * @role FieldObstacleDispatcher Component
 * @exports FieldObstacleDispatcher
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-283: Implementation | L284-567: Handlers & Exports
 */

import type { MapData } from '../../types/game';
import type { FieldObstacleContext } from '../../types/gameContext';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import { handleLugiaShrineOrBoss } from './WhirlIslandsInteractions';
import { handleFastShipCabinRest } from './FastShipAndVermilionInteractions';
import { handleVermilionGymTrashCan } from './VermilionGymInteractions';
import { handleCeladonCafeTrashCan, handleCeladonGymGuideAndStatues } from './CeladonAndGymErikaInteractions';
import { handleCeruleanGymMachinePart, handleCeruleanGymGuideAndStatues } from './CeruleanPowerPlantAndMistyInteractions';
import { handleFuchsiaGymGuideAndStatues } from './CyclingRoadAndFuchsiaJanineInteractions';
import { handleOfficeDoor, handleTransmitterDoor } from './MahoganyRocketHideoutInteractions';
import {
  resolveCutReplacementTile,
  handleOverworldItemsAndHMObstacles,
} from './FieldCutRockAndWaterDispatcher';

export class FieldObstacleDispatcher {
  /**
   * Helper to resolve the correct walkable ground tile beneath a cut tree.
   */
  public static resolveCutReplacementTile(
    map: MapData,
    tileX: number,
    tileY: number,
    currentTile?: string
  ): string {
    return resolveCutReplacementTile(map, tileX, tileY, currentTile);
  }

  /**
   * Handles street signs, interactive background events (bgEvents), item balls, hidden items,
   * fruit trees, cuttable trees (HM01 CUT), and water surfing (HM03 SURF).
   * Extracted from src/main.ts to maintain pure domain isolation and agent readability.
   *
   * @returns true if an interaction was executed, false otherwise.
   */
  public static handleFieldAndBgInteraction(
    ctx: FieldObstacleContext,
    currentMap: MapData,
    facingX: number,
    facingY: number
  ): boolean {
    // Dept Store Elevator Interaction Trigger
    if (
      ((currentMap.id.startsWith('goldenrod_dept_store_') &&
        currentMap.id !== 'goldenrod_dept_store_roof' &&
        (facingX === 2 || facingX === 3) &&
        facingY === 0) ||
        (currentMap.id === 'goldenrod_underground_warehouse' &&
          (facingX === 16 || facingX === 17) &&
          facingY === 0)) &&
      ctx.openDeptElevatorModal
    ) {
      ctx.openDeptElevatorModal(currentMap.id, (targetMapId) => {
        if (targetMapId !== currentMap.id) {
          void ctx.executeWarpTransition?.({
            x: ctx.player.x,
            y: ctx.player.y,
            targetMapId,
            targetX:
              targetMapId === 'goldenrod_dept_store_roof'
                ? 13
                : targetMapId === 'goldenrod_underground_warehouse'
                  ? 17
                  : 2,
            targetY:
              targetMapId === 'goldenrod_dept_store_roof'
                ? 2
                : targetMapId === 'goldenrod_underground_warehouse'
                  ? 2
                  : 1,
            direction: 'DOWN',
          });
        }
      });
      return true;
    }

    // 2. Check Street Signs & Interactive Background Objects (bgEvents)
    const bgEvent = typeof ctx.mapManager?.checkBgEvent === 'function'
      ? (ctx.mapManager.checkBgEvent(facingX, facingY) ?? currentMap.bgEvents?.find((b: any) => b.x === facingX && b.y === facingY))
      : currentMap.bgEvents?.find((b: any) => b.x === facingX && b.y === facingY);
    if (bgEvent && bgEvent.pages && bgEvent.pages.length > 0) {
      // Starter Pokéball Selection in Elm's Lab (Ticket 6.1)
      if (
        bgEvent.action === 'STARTER_CYNDAQUIL' ||
        bgEvent.action === 'STARTER_TOTODILE' ||
        bgEvent.action === 'STARTER_CHIKORITA'
      ) {
        if (ctx.storyFlags.has('starter_chosen') || ctx.playerParty.length > 0) {
          const tableSpecies: 'cyndaquil' | 'totodile' | 'chikorita' =
            bgEvent.action === 'STARTER_CYNDAQUIL' ? 'cyndaquil' : bgEvent.action === 'STARTER_TOTODILE' ? 'totodile' : 'chikorita';
          const tableName = tableSpecies.toUpperCase();
          const chosenSpecies = ctx.detectChosenStarterSpecies();

          // A. The spot of the ball the player took
          if (chosenSpecies === tableSpecies) {
            ctx.openDialogue([`It's an empty spot. You already chose ${tableName}!`], bgEvent.speaker);
            return true;
          }

          // B. The spot of the ball the Rival stole after Elm's emergency call
          const counterPickMap: Record<string, string> = { cyndaquil: 'totodile', totodile: 'chikorita', chikorita: 'cyndaquil' };
          const rivalStolen = chosenSpecies ? counterPickMap[chosenSpecies] : null;
          if (ctx.storyFlags.has('ELM_CALLED_ABOUT_THEFT') && rivalStolen === tableSpecies) {
            ctx.openDialogue(['The POKé BALL was stolen from the table!'], bgEvent.speaker);
            return true;
          }

          // C. A ball still sitting on the table
          const tableType = tableSpecies === 'cyndaquil' ? 'FIRE' : tableSpecies === 'totodile' ? 'WATER' : 'GRASS';
          ctx.openDialogue([`It's ${tableName}, a ${tableType} POKéMON!`, 'PROF. ELM: You already chose your partner!'], bgEvent.speaker);
          return true;
        }

        const starterConfig: Record<string, { speciesId: 'cyndaquil' | 'totodile' | 'chikorita'; name: string; type: string }> = {
          STARTER_CYNDAQUIL: { speciesId: 'cyndaquil', name: 'CYNDAQUIL', type: 'FIRE' },
          STARTER_TOTODILE: { speciesId: 'totodile', name: 'TOTODILE', type: 'WATER' },
          STARTER_CHIKORITA: { speciesId: 'chikorita', name: 'CHIKORITA', type: 'GRASS' },
        };

        const chosen = starterConfig[bgEvent.action];
        if (chosen) {
          BattleAudio.playCry(chosen.speciesId);
          ctx.openStarterChoiceModal(
            chosen.speciesId,
            chosen.name,
            chosen.type,
            () => {
              const starterPokemon = PokemonFactory.create(chosen.speciesId, 5);
              ctx.playerParty.push(starterPokemon);
              ctx.storyFlags.add('starter_chosen');
              ctx.storyFlags.add(`starter_${chosen.speciesId}`);
              ctx.missionManager.reconcileStarterState(ctx.playerParty, ctx.storyFlags);
              ctx.removeItemBall(`${chosen.speciesId}_ball`);
              ctx.syncMapOverworldItems(currentMap);
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  `${ctx.playerName} received ${chosen.name} from PROF. ELM!`,
                  "PROF. ELM: Excellent choice! That POKéMON is really energetic! Now, please visit MR. POKéMON's house on ROUTE 30 to retrieve the MYSTERY EGG!",
                ],
                '🔬 PROF. ELM',
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast(`✨ Received ${chosen.name} (Lv. 5)!`);
                }
              );
            },
            () => {
              BattleAudio.playMenuSound('CANCEL');
            }
          );
          return true;
        }
      }

      // Ilex Forest Shrine Celebi Event (Crystal Exclusive Event)
      if (
        currentMap.id === 'ilex_forest' &&
        facingX === 8 &&
        (facingY === 22 || facingY === 23)
      ) {
        if (ctx.storyFlags.has('EVENT_CAUGHT_CELEBI') || ctx.storyFlags.has('EVENT_FOUGHT_CELEBI')) {
          const hasCelebi =
            ctx.playerParty.some((p) => p.speciesId === 'celebi') ||
            ctx.storyFlags.has('EVENT_CAUGHT_CELEBI') ||
            ctx.storyFlags.has('EVENT_FOUGHT_CELEBI');
          const radioTowerSaved =
            ctx.storyFlags.has('radio_tower_cleared') ||
            ctx.storyFlags.has('GOLDENROD_ROCKET_TAKEOVER_CLEARED') ||
            ctx.storyFlags.has('has_radio_card');

          if (hasCelebi && radioTowerSaved && !ctx.storyFlags.has('celebi_giovanni_memory_complete')) {
            BattleAudio.playCry('celebi');
            BattleAudio.playOverworldSound('FANFARE');
            ctx.openDialogue(
              [
                'ILEX FOREST SHRINE…',
                'The woodland air suddenly trembles with a dazzling emerald glow!',
                'CELEBI begins to radiate an ancient, rippling temporal aura!',
                'A gentle vortex of time spirals outward, enveloping you and the shrine…',
                '…… …… …… (Three Years Ago — Tohjo Roadway)',
                'SILVER: Why are you running away, Father?! What happened to TEAM ROCKET?!',
                'GIOVANNI: One child defeated me in the VIRIDIAN GYM... Team Rocket is finished. I must go into solitude to reflect on my weakness.',
                "SILVER: Weakness?! I won't accept this! If Team Rocket was beaten by one kid, you are all pathetic! I'll become the strongest trainer entirely on my own!",
                'Giovanni turned away in silence and dissolved into the cold mountain mist…',
                '…… …… …… (Present Day — Hidden Cavern beneath Tohjo Falls)',
                'A warm flash of green light returns you to the present day, deep inside a secret waterfall cavern!',
                'GIOVANNI: Who is there?! ...Wait. You are no Rocket Grunt. How did you pierce through time to find my secret hermitage?!',
                'I sense an extraordinary bond between you and your POKéMON... Show me the true strength that dismantled Team Rocket!',
              ],
              '⏳ TIME RIPPLE',
              () => {
                const giovanniTeam = [
                  PokemonFactory.create('nidoking', 50, ['earthpower', 'sludgebomb', 'megahorn', 'icebeam']),
                  PokemonFactory.create('dugtrio', 48, ['earthquake', 'slash', 'rockslide', 'suckerpunch']),
                  PokemonFactory.create('persian', 48, ['fakeout', 'slash', 'nightslash', 'powergem']),
                  PokemonFactory.create('nidoqueen', 50, ['earthpower', 'sludgebomb', 'superpower', 'thunderbolt']),
                  PokemonFactory.create('kangaskhan', 50, ['dizzypunch', 'crunch', 'earthquake', 'suckerpunch']),
                  PokemonFactory.create('rhydon', 52, ['earthquake', 'stoneedge', 'megahorn', 'hammerarm']),
                ];

                ctx.triggerBattle(giovanniTeam[0], {
                  isTrainer: true,
                  trainerName: 'Boss Giovanni',
                  trainerTeam: giovanniTeam,
                  onVictory: () => {
                    ctx.storyFlags.add('celebi_giovanni_memory_complete');
                    if (!ctx.inventory.items) ctx.inventory.items = {};
                    ctx.inventory.items['master_ball'] = (ctx.inventory.items['master_ball'] || 0) + 1;
                    if (!ctx.inventory.balls) ctx.inventory.balls = {};
                    ctx.inventory.balls['master_ball'] = (ctx.inventory.balls['master_ball'] || 0) + 1;
                    BattleAudio.playOverworldSound('KEY_ITEM');
                    ctx.openDialogue(
                      [
                        'GIOVANNI: Truly magnificent... It is not cold cruelty that makes a trainer formidable, but mutual devotion.',
                        'My son Silver sought strength without compassion, but you have shown me what a true champion embodies.',
                        'Take this MASTER BALL, young trainer. A testament to one who mastered both power and heart.',
                        `${ctx.playerName} received MASTER BALL from GIOVANNI!`,
                        'Giovanni bowed quietly and vanished into the swirling waterfall mists…',
                      ],
                      '👑 GIOVANNI',
                      () => {
                        ctx.saveCurrentGame();
                        ctx.showToast('⏳ Time-Travel Event Complete: Giovanni defeated!');
                      }
                    );
                  },
                });
              }
            );
            return true;
          }

          ctx.openDialogue(
            [
              'ILEX FOREST SHRINE…',
              'A peaceful, verdant silence gently envelopes the woodland clearing.',
            ],
            '⛩️ ILEX FOREST SHRINE'
          );
          return true;
        }

        const hasGsBall =
          ctx.inventory.keyItems?.includes('GS_BALL') ||
          ctx.inventory.keyItems?.includes('gs_ball') ||
          ctx.storyFlags.has('HAS_GS_BALL');

        if (hasGsBall) {
          if (!ctx.storyFlags.has('KURT_CHECKED_GS_BALL')) {
            ctx.openDialogue(
              [
                'ILEX FOREST SHRINE…',
                "It is dedicated to the forest's protector.",
                'There is a small, carved hollow on the front. Perhaps KURT in AZALEA TOWN could inspect the mysterious GS BALL?',
              ],
              '⛩️ ILEX FOREST SHRINE'
            );
            return true;
          }

          const promptPages = [
            'ILEX FOREST SHRINE…',
            "There's a carved hollow niche in the shrine... It fits the inspected GS BALL perfectly!",
            'Would you like to place the GS BALL in the shrine?',
          ];

          const onChoice = (choice: 'YES' | 'NO') => {
            if (choice === 'YES') {
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  `${ctx.playerName} gently placed the GS BALL into the shrine niche!`,
                  '…… …… ……',
                  'A warm, ethereal breeze suddenly stirs through the leaves!',
                  'A melodious flutter of translucent wings descends from the canopy above!',
                ],
                '⛩️ ILEX FOREST SHRINE',
                () => {
                  BattleAudio.playCry('celebi');
                  const celebi = PokemonFactory.create('celebi', 30, [
                    'healbell',
                    'safeguard',
                    'ancientpower',
                    'batonpass',
                  ]);
                  ctx.storyFlags.add('EVENT_FOUGHT_CELEBI');
                  if (ctx.inventory.keyItems) {
                    ctx.inventory.keyItems = ctx.inventory.keyItems.filter(
                      (k) => k !== 'GS_BALL' && k !== 'gs_ball'
                    );
                  }
                  void ctx.triggerBattle(celebi, { isLegendary: true });
                }
              );
            } else {
              ctx.openDialogue(
                ['The GS BALL remains safely tucked in your BAG.'],
                '⛩️ ILEX FOREST SHRINE'
              );
            }
          };

          if (ctx.openChoiceDialogue) {
            ctx.openChoiceDialogue(promptPages, '⛩️ ILEX FOREST SHRINE', onChoice);
          } else {
            onChoice('YES');
          }
          return true;
        }
      }

      // Bill's PC Storage Terminal Interaction
      if (
        bgEvent.action === 'OPEN_PC' ||
        bgEvent.speaker?.includes('PC') ||
        bgEvent.pages.some((p) => p.includes('PC'))
      ) {
        ctx.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
          ctx.openPcStorage();
        });
        return true;
      }

      // Town Map Wall Poster Interaction
      if (
        bgEvent.action === 'POKECENTER_MAP' ||
        bgEvent.action === 'OPEN_MAP' ||
        bgEvent.pages.some((p) => p.toUpperCase().includes('TOWN MAP')) ||
        bgEvent.speaker?.toUpperCase().includes('TOWN MAP')
      ) {
        ctx.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
          ctx.openTownMap(currentMap.id, ctx.visitedMaps, ctx.roamingManager.getActiveRoamers());
        });
        return true;
      }

      // Gym Statues Dynamic Winning Trainers Inspection
      if (
        bgEvent.speaker?.includes('STATUE') ||
        (bgEvent.pages && bgEvent.pages.some((p) => p.includes('GYM STATUE') || p.includes('POKéMON GYM')))
      ) {
        const gymLeaders: Record<string, { city: string; leader: string; flag: string }> = {
          violet_gym: { city: 'VIOLET CITY', leader: 'FALKNER', flag: 'falkner_defeated' },
          azalea_gym: { city: 'AZALEA TOWN', leader: 'BUGSY', flag: 'bugsy_defeated' },
          ecruteak_gym: { city: 'ECRUTEAK CITY', leader: 'MORTY', flag: 'morty_defeated' },
          mahogany_gym: { city: 'MAHOGANY TOWN', leader: 'PRYCE', flag: 'pryce_defeated' },
          vermilion_gym: { city: 'VERMILION CITY', leader: 'LT. SURGE', flag: 'surge_defeated' },
        };
        const gym = gymLeaders[currentMap.id] || (bgEvent.action === 'MAHOGANY_GYM_STATUE' ? gymLeaders.mahogany_gym : undefined);
        if (gym) {
          const winner = ctx.storyFlags.has(gym.flag) ? `WINNING TRAINERS: SILVER, ${ctx.playerName}` : 'WINNING TRAINERS: SILVER';
          ctx.openDialogue([`${gym.city} POKéMON GYM`, `LEADER: ${gym.leader}`, winner], bgEvent.speaker);
          return true;
        }
      }


      // Ruins of Alph Chambers Altar & Inscription Interaction (Kabuto, Omanyte, Aerodactyl, Ho-Oh)
      const ruinsChamberMap = {
        'ruins_of_alph_kabuto_chamber': {
          puzzleId: 'kabuto', name: 'KABUTO', flag: 'unown_awakened_kabuto',
          inscription: ['A POKéMON that hid on the sea floor.', 'Eyes on its back scanned the area.'],
        },
        ruins_of_alph_omanyte_chamber: {
          puzzleId: 'omanyte', name: 'OMANYTE', flag: 'unown_awakened_omanyte',
          inscription: ['A prehistoric POKéMON that swam by twisting its 10 tentacles.', 'It lived in ancient seas long ago.'],
        },
        ruins_of_alph_aerodactyl_chamber: {
          puzzleId: 'aerodactyl', name: 'AERODACTYL', flag: 'unown_awakened_aerodactyl',
          inscription: ['A ferocious prehistoric POKéMON that soared through the skies.', 'It attacked with saw-like teeth.'],
        },
        ruins_of_alph_ho_oh_chamber: {
          puzzleId: 'ho_oh', name: 'HO-OH', flag: 'unown_awakened_ho_oh',
          inscription: ['A legendary rainbow POKéMON said to fly continuously on magnificent wings.', 'It reveals itself only to pure-hearted trainers.'],
        },
      } as const;

      if (currentMap.id in ruinsChamberMap) {
        const chamber = ruinsChamberMap[currentMap.id as keyof typeof ruinsChamberMap];
        if (facingX === 3 && facingY === 2) {
          if (ctx.storyFlags.has(chamber.flag)) {
            ctx.openDialogue([`A completed stone panel of ${chamber.name}.`], `🧩 ${chamber.name} PUZZLE`);
          } else {
            ctx.openDialogue(
              [`It's an ancient stone puzzle depicting ${chamber.name}.`, 'Attempt to assemble the sliding panels?'],
              `🧩 ${chamber.name} PUZZLE`,
              () => { ctx.openRuinsPuzzleModal({ onSolve: (puzzleId) => { ctx.handleRuinsPuzzleSolve(puzzleId || chamber.puzzleId); }, onClose: () => {} }); }
            );
          }
          return true;
        }

        if (facingX === 4 && facingY === 2) {
          const helperAddItem = (itemId: string, count: number = 1) => {
            if (!ctx.inventory.items) ctx.inventory.items = {};
            ctx.inventory.items[itemId] = (ctx.inventory.items[itemId] || 0) + count;
          };

          // 1. Kabuto Chamber -> Inscription "ESCAPE"
          if (currentMap.id === 'ruins_of_alph_kabuto_chamber') {
            if (ctx.storyFlags.has('ruins_kabuto_vault_opened')) {
              ctx.openDialogue(['The hidden vault in the rear stone wall stands open.'], '📜 ANCIENT INSCRIPTION');
              return true;
            }
            const hasEscapeRope = (ctx.inventory.items?.['escape_rope'] || 0) > 0 || (ctx.inventory.items?.['escape-rope'] || 0) > 0;
            if (hasEscapeRope) {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.storyFlags.add('ruins_kabuto_vault_opened');
              helperAddItem('heal_powder', 1); helperAddItem('energypowder', 1); helperAddItem('oran_berry', 1); helperAddItem('pecha_berry', 1);
              ctx.openDialogue(
                [
                  'Ancient UNOWN glyphs glow across the wall: "E - S - C - A - P - E"',
                  'The glyphs resonate deeply with the ESCAPE ROPE in your BAG!',
                  'A hidden doorway slides open in the rear wall, revealing an ancient secret vault!',
                  `${ctx.playerName} retrieved HEAL POWDER, ENERGYPOWDER, ORAN BERRY, and PECHA BERRY!`,
                ],
                '📜 KABUTO VAULT',
                () => { ctx.saveCurrentGame(); ctx.showToast('🗝️ Kabuto Chamber Secret Vault opened!'); }
              );
              return true;
            }
            ctx.openDialogue([...chamber.inscription, 'Carved beneath the text are mysterious UNOWN glyphs: "E - S - C - A - P - E"', 'The wall seems to be waiting for an item associated with "ESCAPE"…'], '📜 ANCIENT INSCRIPTION');
            return true;
          }

          // 2. Omanyte Chamber -> Inscription "WATER"
          if (currentMap.id === 'ruins_of_alph_omanyte_chamber') {
            if (ctx.storyFlags.has('ruins_omanyte_vault_opened')) {
              ctx.openDialogue(['The hidden vault in the rear stone wall stands open.'], '📜 ANCIENT INSCRIPTION');
              return true;
            }
            const hasWaterStone = (ctx.inventory.items?.['water_stone'] || 0) > 0 || (ctx.inventory.items?.['waterstone'] || 0) > 0;
            if (hasWaterStone) {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.storyFlags.add('ruins_omanyte_vault_opened');
              helperAddItem('mystic_water', 1); helperAddItem('star_piece', 1); helperAddItem('stardust', 2);
              ctx.openDialogue(
                [
                  'Ancient UNOWN glyphs pulse with an aquatic blue light: "W - A - T - E - R"',
                  'The stone glyphs resonate with the WATER STONE in your BAG!',
                  'The carved stone wall grinds backward, revealing a shimmering secret vault!',
                  `${ctx.playerName} retrieved MYSTIC WATER, STAR PIECE, and STARDUST!`,
                ],
                '📜 OMANYTE VAULT',
                () => { ctx.saveCurrentGame(); ctx.showToast('🗝️ Omanyte Chamber Secret Vault opened!'); }
              );
              return true;
            }
            ctx.openDialogue([...chamber.inscription, 'Carved beneath the text are mysterious UNOWN glyphs: "W - A - T - E - R"', 'The wall seems to be waiting for a source of ancient "WATER"…'], '📜 ANCIENT INSCRIPTION');
            return true;
          }

          // 3. Aerodactyl Chamber -> Inscription "LIGHT"
          if (currentMap.id === 'ruins_of_alph_aerodactyl_chamber') {
            if (ctx.storyFlags.has('ruins_aerodactyl_vault_opened')) {
              ctx.openDialogue(['The hidden vault in the rear stone wall stands open.'], '📜 ANCIENT INSCRIPTION');
              return true;
            }
            const hasFlash = ctx.inventory.keyItems?.includes('HM05') || ctx.inventory.keyItems?.includes('hm05') || ctx.playerParty.some((p) => p.moves.some((m) => m.moveId === 'flash'));
            if (hasFlash) {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.storyFlags.add('ruins_aerodactyl_vault_opened');
              helperAddItem('moon_stone', 1); helperAddItem('heal_powder', 2); helperAddItem('energy_root', 1);
              ctx.openDialogue(
                [
                  'Ancient UNOWN glyphs gleam brightly: "L - I - G - H - T"',
                  'A burst of luminous radiance from FLASH illuminates the ancient stone!',
                  'A hidden passage rumbles open into a secret vault filled with ancient relics!',
                  `${ctx.playerName} retrieved MOON STONE, HEAL POWDER, and ENERGY ROOT!`,
                ],
                '📜 AERODACTYL VAULT',
                () => { ctx.saveCurrentGame(); ctx.showToast('🗝️ Aerodactyl Chamber Secret Vault opened!'); }
              );
              return true;
            }
            ctx.openDialogue([...chamber.inscription, 'Carved beneath the text are mysterious UNOWN glyphs: "L - I - G - H - T"', 'The wall seems to be waiting for a radiant beam of "LIGHT"…'], '📜 ANCIENT INSCRIPTION');
            return true;
          }

          // 4. Ho-Oh Chamber -> Inscription "HO-OH"
          if (currentMap.id === 'ruins_of_alph_ho_oh_chamber') {
            if (ctx.storyFlags.has('ruins_ho_oh_vault_opened')) {
              ctx.openDialogue(['The hidden royal vault in the rear stone wall stands open.'], '📜 ANCIENT INSCRIPTION');
              return true;
            }
            const hasHoOh = ctx.playerParty.some((p) => p.speciesId === 'ho-oh' || p.speciesId === 'ho_oh') || ctx.inventory.keyItems?.includes('RAINBOW_WING') || ctx.inventory.keyItems?.includes('rainbow_wing') || ctx.storyFlags.has('caught_ho_oh');
            if (hasHoOh) {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.storyFlags.add('ruins_ho_oh_vault_opened');
              helperAddItem('sacred_ash', 1); helperAddItem('revival_herb', 2); helperAddItem('charcoal', 1);
              ctx.openDialogue(
                [
                  'Ancient UNOWN glyphs shimmer with prismatic rainbow fire: "H - O - - - O - H"',
                  'A magnificent rainbow radiance cascades across the wall in honor of the sky guardian!',
                  'The sacred royal vault glides open, revealing timeless sacred treasures!',
                  `${ctx.playerName} retrieved SACRED ASH, REVIVAL HERB, and CHARCOAL!`,
                ],
                '📜 HO-OH VAULT',
                () => { ctx.saveCurrentGame(); ctx.showToast('🗝️ Ho-Oh Chamber Sacred Vault opened!'); }
              );
              return true;
            }
            ctx.openDialogue([...chamber.inscription, 'Carved beneath the text are mysterious UNOWN glyphs: "H - O - - - O - H"', 'The wall seems to be waiting for the majestic presence of "HO-OH"…'], '📜 ANCIENT INSCRIPTION');
            return true;
          }

          ctx.openDialogue([...chamber.inscription], '📜 ANCIENT INSCRIPTION');
          return true;
        }
      }

      // Vending Machine bgEvent (Issue #32)
      if (bgEvent.action === 'VENDING_MACHINE' || bgEvent.speaker?.includes('VENDING MACHINE')) {
        ctx.openDialogue(
          bgEvent.pages.length > 0 ? bgEvent.pages : ['VENDING MACHINE: Clang! Refreshing drinks in stock!'],
          bgEvent.speaker || '🥤 VENDING MACHINE',
          () => ctx.openMart('goldenrod_dept_store_6f')
        );
        return true;
      }

      // Dept Store Elevator Panel bgEvent (Issue #29 & #33)
      if (bgEvent.action === 'DEPT_ELEVATOR_PANEL' || bgEvent.action === 'DEPT_ELEVATOR') {
        const curMap = ctx.mapManager.getCurrentMap();
        ctx.openDeptElevatorModal?.(curMap?.id || 'goldenrod_dept_store_1f', (targetMapId) => {
          if (targetMapId === curMap?.id) {
            ctx.openDialogue(['You are already on this floor!'], bgEvent.speaker);
            return;
          }
          ctx.executeWarpTransition?.({
            x: ctx.player.x,
            y: ctx.player.y,
            targetMapId,
            targetX: targetMapId === 'goldenrod_dept_store_roof' ? 13 : targetMapId === 'goldenrod_underground_warehouse' ? 17 : 2,
            targetY: targetMapId === 'goldenrod_dept_store_roof' || targetMapId === 'goldenrod_underground_warehouse' ? 2 : 1,
            direction: 'DOWN',
          });
        });
        return true;
      }

      // Goldenrod Underground Switch Room Switches
      if (
        currentMap.id === 'goldenrod_underground_switch_room_entrances' &&
        (bgEvent.speaker?.toUpperCase().includes('SWITCH') || bgEvent.action?.toUpperCase().includes('SWITCH'))
      ) {
        let flagName = 'SWITCH_1_ON', label = 'SWITCH 1';
        if (facingX === 10 || bgEvent.speaker?.includes('2')) { flagName = 'SWITCH_2_ON'; label = 'SWITCH 2'; }
        else if (facingX === 2 || bgEvent.speaker?.includes('3')) { flagName = 'SWITCH_3_ON'; label = 'SWITCH 3'; }
        else if (facingX === 20 || bgEvent.speaker?.toUpperCase().includes('EMERGENCY')) { flagName = 'SWITCH_EMERGENCY_ON'; label = 'EMERGENCY SWITCH'; }

        const toggleSwitch = () => {
          const wasOn = ctx.storyFlags.has(flagName);
          if (wasOn) ctx.storyFlags.delete(flagName);
          else ctx.storyFlags.add(flagName);
          BattleAudio.playMenuSound('CONFIRM');
          const stateText = wasOn ? 'Turned it OFF.' : 'Turned it ON.';
          ctx.openDialogue([`Click! ${stateText}`], bgEvent.speaker || `🔌 ${label}`, () => { ctx.saveCurrentGame(); });
        };

        if (ctx.openChoiceDialogue) {
          const isCurrentlyOn = ctx.storyFlags.has(flagName);
          ctx.openChoiceDialogue(
            [`It's labeled ${label} (currently ${isCurrentlyOn ? 'ON' : 'OFF'}). Press it?`],
            bgEvent.speaker || `🔌 ${label}`,
            (choice) => {
              if (choice === 'YES') toggleSwitch();
              else ctx.openDialogue(['Left the switch alone.'], bgEvent.speaker || `🔌 ${label}`);
            }
          );
        } else {
          toggleSwitch();
        }
        return true;
      }

      if (bgEvent.action === 'FAST_SHIP_CABIN_REST') { handleFastShipCabinRest(bgEvent as any, currentMap, ctx as any); return true; }
      if (bgEvent.action?.startsWith('VERMILION_GYM_TRASH_CAN_')) { handleVermilionGymTrashCan(parseInt(bgEvent.action.replace('VERMILION_GYM_TRASH_CAN_', ''), 10), ctx as any); return true; }
      if (bgEvent.action === 'CELADON_CAFE_TRASH') { handleCeladonCafeTrashCan(ctx as any); return true; }
      if (bgEvent.action === 'CELADON_GYM_STATUE') { handleCeladonGymGuideAndStatues({ id: 'celadon_gym_statue', x: facingX, y: facingY, action: 'CELADON_GYM_STATUE' } as any, ctx as any); return true; }
      if (bgEvent.action === 'CERULEAN_GYM_MACHINE_PART') { handleCeruleanGymMachinePart(ctx as any, facingX, facingY); return true; }
      if (bgEvent.action === 'CERULEAN_GYM_STATUE') { handleCeruleanGymGuideAndStatues({ id: 'cerulean_gym_statue', x: facingX, y: facingY, action: 'CERULEAN_GYM_STATUE' } as any, ctx as any); return true; }
      if (bgEvent.action === 'FUCHSIA_GYM_STATUE') { handleFuchsiaGymGuideAndStatues({ id: 'fuchsia_gym_statue', x: facingX, y: facingY, action: 'FUCHSIA_GYM_STATUE' } as any, ctx as any); return true; }
      if (bgEvent.action === 'ROCKET_BASE_OFFICE_DOOR') { handleOfficeDoor({ id: 'team_rocket_base_b3f_office_door', x: facingX, y: facingY } as any, currentMap, ctx as any); return true; }
      if (bgEvent.action === 'ROCKET_BASE_TRANSMITTER_DOOR') { handleTransmitterDoor({ id: 'team_rocket_base_b2f_transmitter_door', x: facingX, y: facingY } as any, currentMap, ctx as any); return true; }

      ctx.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
        if (
          currentMap.id === 'earls_pokemon_academy' &&
          bgEvent.speaker.includes('BLACKBOARD') &&
          !ctx.storyFlags.has('earls_academy_graduated')
        ) {
          ctx.storyFlags.add('earls_academy_graduated');
          ctx.inventory.items['parlyz-heal'] = (ctx.inventory.items['parlyz-heal'] || 0) + 1;
          ctx.inventory.items['antidote'] = (ctx.inventory.items['antidote'] || 0) + 1;
          ctx.inventory.items['awakening'] = (ctx.inventory.items['awakening'] || 0) + 1;
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);
          BattleAudio.playOverworldSound('FANFARE');
          ctx.showToast('🎓 Blackboard studied! Received Status Cure Kit!');
          ctx.saveCurrentGame();
        } else if (bgEvent.action === 'HEAL_AND_SAVE') {
          ctx.healPlayerParty(false);
          ctx.saveCurrentGame();
          if (currentMap.id.endsWith('_poke_center')) {
            ctx.playHealingAnimation(ctx.playerParty.length);
          } else {
            ctx.playFieldRestAnimation();
          }
        } else if (bgEvent.action === 'OPEN_MART') {
          ctx.openMart(currentMap.id);
        } else if (bgEvent.action === 'ROCKET_BASE_SECURITY_SWITCH') {
          if (!ctx.storyFlags.has('EVENT_SECURITY_CAMERA_DISABLED')) {
            ctx.storyFlags.add('EVENT_SECURITY_CAMERA_DISABLED');
            ctx.storyFlags.add('security_cameras_disabled');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.showToast('🚨 Surveillance cameras deactivated!');
            ctx.saveCurrentGame();
          }
        } else if (bgEvent.action === 'LUGIA_SHRINE_EVENT' || bgEvent.speaker?.includes('LUGIA')) {
          handleLugiaShrineOrBoss({ id: 'lugia_shrine', x: facingX, y: facingY } as any, currentMap, ctx as any);
        }
      });
      return true;
    }

    // 2a-fallback. Universal Pokémon Center & Bedroom PC Terminal Fallback
    if ((currentMap.id.endsWith('_poke_center') && facingX === 9 && facingY === 1) || (currentMap.id === 'players_house_2f' && facingX === 0 && facingY === 1)) {
      ctx.openDialogue(["Accessed BILL'S PC!", 'POKéMON Storage System is online and synced.'], "💻 BILL'S PC", () => { ctx.openPcStorage(); });
      return true;
    }

    if (currentMap.id === 'cerulean_gym' && ((facingX === 4 && facingY === 8) || (facingX === 3 && facingY === 8))) {
      return handleCeruleanGymMachinePart(ctx as any, facingX, facingY);
    }

    if (currentMap.id === 'ruins_of_alph_outside' && facingX === 16 && facingY === 8) {
      ctx.openDialogue(['MYSTERY STONE PANEL CHAMBER'], '🪧 MYSTERY CHAMBER');
      return true;
    }

    return handleOverworldItemsAndHMObstacles(ctx, currentMap, facingX, facingY);
  }
}
