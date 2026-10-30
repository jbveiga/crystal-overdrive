/**
 * @fileoverview OverworldTrainerSightAndTourController domain module implementation.
 * @module world/OverworldTrainerSightAndTourController
 * @role OverworldTrainerSightAndTourController Component
 * @exports TM_MOVE_CODE_MAP, OverworldTrainerSightAndTourController
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-266: Implementation | L267-533: Handlers & Exports
 */

import type { Direction, PokemonInstance, PokeballId } from '../types/game';
import type { BagInventory } from '../ui/BagAndMartUI';
import type { GridEntity } from './GridPhysics';
import { BattleAudio } from '../audio/BattleAudio';
import { BattleController } from '../battle/BattleController';
import { PokemonFactory } from '../battle/PokemonFactory';
import { OverworldItemManager } from './OverworldItemManager';
import type { MissionManager } from './MissionManager';
import { StoryCutscenes, type StoryCutsceneContext } from './StoryCutscenes';
import type { OverworldTrainerSightContext } from '../types/gameContext';

export const TM_MOVE_CODE_MAP: Record<string, string> = {
  tm_dynamicpunch: 'TM01',
  tm_headbutt: 'TM02',
  tm_curse: 'TM03',
  tm_rollout: 'TM04',
  tm_roar: 'TM05',
  tm_toxic: 'TM06',
  tm_zap_cannon: 'TM07',
  tm_rocksmash: 'TM08',
  tm_psych_up: 'TM09',
  tm_hidden_power: 'TM10',
  tm_sunny_day: 'TM11',
  tm_sweet_scent: 'TM12',
  tm_snore: 'TM13',
  tm_blizzard: 'TM14',
  tm_hyper_beam: 'TM15',
  tm_icy_wind: 'TM16',
  tm_protect: 'TM17',
  tm_rain_dance: 'TM18',
  tm_giga_drain: 'TM19',
  tm_endure: 'TM20',
  tm_frustration: 'TM21',
  tm_solarbeam: 'TM22',
  tm_iron_tail: 'TM23',
  tm_dragonbreath: 'TM24',
  tm_thunder: 'TM25',
  tm_earthquake: 'TM26',
  tm_return: 'TM27',
  tm_dig: 'TM28',
  tm_psychic: 'TM29',
  tm_shadow_ball: 'TM30',
  tm_shadowball: 'TM30',
  tm_mud_slap: 'TM31',
  tm_mudslap: 'TM31',
  tm_double_team: 'TM32',
  tm_ice_punch: 'TM33',
  tm_swagger: 'TM34',
  tm_sleep_talk: 'TM35',
  tm_sludge_bomb: 'TM36',
  tm_sandstorm: 'TM37',
  tm_fire_blast: 'TM38',
  tm_swift: 'TM39',
  tm_defense_curl: 'TM40',
  tm_thunderpunch: 'TM41',
  tm_dream_eater: 'TM42',
  tm_detect: 'TM43',
  tm_rest: 'TM44',
  tm_attract: 'TM45',
  tm_thief: 'TM46',
  tm_steel_wing: 'TM47',
  tm_fire_punch: 'TM48',
  tm_fury_cutter: 'TM49',
  tm_nightmare: 'TM50',
  tm_false_swipe: 'TM54',
  tm_thunder_wave: 'TM73',
  hm_cut: 'HM01',
  hm_fly: 'HM02',
  hm_surf: 'HM03',
  hm_strength: 'HM04',
  hm_flash: 'HM05',
  hm_whirlpool: 'HM06',
  hm_waterfall: 'HM07',
};

export class OverworldTrainerSightAndTourController {
  public static addOverworldItemToInventory(
    ctxOrRawId: OverworldTrainerSightContext | string,
    rawItemIdOrInventory?: string | BagInventory,
    storyFlags?: Set<string>,
    missionManager?: MissionManager
  ): void {
    let rawItemId: string;
    let inventory: BagInventory;
    let flags: Set<string>;
    let mm: MissionManager;

    if (typeof ctxOrRawId === 'string') {
      rawItemId = ctxOrRawId;
      inventory = rawItemIdOrInventory as BagInventory;
      flags = storyFlags!;
      mm = missionManager!;
    } else {
      rawItemId = rawItemIdOrInventory as string;
      inventory = ctxOrRawId.inventory;
      flags = ctxOrRawId.storyFlags;
      mm = ctxOrRawId.missionManager;
    }

    const norm = rawItemId.toLowerCase().replace(/_/g, '-');
    const pocket = OverworldItemManager.resolveItemPocket(rawItemId);
    if (pocket === 'TMS') {
      const lower = rawItemId.toLowerCase();
      const code =
        TM_MOVE_CODE_MAP[lower] ||
        rawItemId.toUpperCase().match(/^(TM\d+|HM\d+)/)?.[1] ||
        rawItemId.toUpperCase().split('_')[0];
      if (!inventory.tms.includes(code)) {
        inventory.tms.push(code);
      }
    } else if (pocket === 'BALLS') {
      const ballKey = norm as PokeballId;
      inventory.balls[ballKey] = (inventory.balls[ballKey] || 0) + 1;
    } else if (pocket === 'BERRIES') {
      if (!inventory.berries) inventory.berries = {};
      inventory.berries[rawItemId] = (inventory.berries[rawItemId] || 0) + 1;
    } else if (pocket === 'KEY_ITEMS') {
      if (!inventory.keyItems) inventory.keyItems = [];
      if (!inventory.keyItems.includes(rawItemId)) {
        inventory.keyItems.push(rawItemId);
      }
    } else {
      if (!inventory.items) inventory.items = {};
      inventory.items[norm] = (inventory.items[norm] || 0) + 1;
    }

    // Auto-detect key progression HMs/items and trigger associated story/mission flags
    if (rawItemId.toLowerCase().includes('waterfall') || rawItemId.toLowerCase().includes('hm07')) {
      if (!inventory.tms.includes('HM07')) inventory.tms.push('HM07');
      if (!inventory.tms.includes('HM07_WATERFALL')) inventory.tms.push('HM07_WATERFALL');
      flags.add('has_hm07_waterfall');
      flags.add('EVENT_GOT_HM07_WATERFALL');
      mm.checkStoryFlags(flags);
    }
    if (rawItemId.toLowerCase().includes('basement')) {
      flags.add('has_basement_key');
      flags.add('warehouse_unlocked');
      mm.checkStoryFlags(flags);
    }
    if (rawItemId.toLowerCase().includes('card')) {
      flags.add('has_card_key');
      flags.add('card_key_obtained');
      mm.checkStoryFlags(flags);
    }
    if (rawItemId.toLowerCase().includes('clear_bell') || rawItemId.toLowerCase().includes('clear-bell')) {
      flags.add('has_clear_bell');
      mm.checkStoryFlags(flags);
    }
  }

  public static getApricornCount(
    ctxOrId: OverworldTrainerSightContext | string,
    apricornIdOrInv?: string | BagInventory
  ): number {
    let apricornId: string;
    let inventory: BagInventory;
    if (typeof ctxOrId === 'string') {
      apricornId = ctxOrId;
      inventory = apricornIdOrInv as BagInventory;
    } else {
      apricornId = apricornIdOrInv as string;
      inventory = ctxOrId.inventory;
    }
    const normUnderscore = apricornId.toLowerCase().replace(/-/g, '_');
    const normHyphen = apricornId.toLowerCase().replace(/_/g, '-');
    return (
      (inventory.berries?.[normUnderscore] || 0) +
      (inventory.berries?.[normHyphen] || 0) +
      ((inventory as any).items?.[normUnderscore] || 0) +
      ((inventory as any).items?.[normHyphen] || 0) +
      ((inventory as any).apricorns?.[normUnderscore] || 0) +
      ((inventory as any).apricorns?.[normHyphen] || 0)
    );
  }

  public static deductApricorn(
    ctxOrId: OverworldTrainerSightContext | string,
    apricornIdOrQty: string | number,
    qtyOrInv?: number | BagInventory
  ): void {
    let apricornId: string;
    let quantity: number;
    let inventory: BagInventory;
    if (typeof ctxOrId === 'string') {
      apricornId = ctxOrId;
      quantity = apricornIdOrQty as number;
      inventory = qtyOrInv as BagInventory;
    } else {
      apricornId = apricornIdOrQty as string;
      quantity = qtyOrInv as number;
      inventory = ctxOrId.inventory;
    }
    const normUnderscore = apricornId.toLowerCase().replace(/-/g, '_');
    const normHyphen = apricornId.toLowerCase().replace(/_/g, '-');
    let remaining = quantity;
    const buckets = [inventory.berries, (inventory as any).items, (inventory as any).apricorns];
    for (const bucket of buckets) {
      if (!bucket || remaining <= 0) continue;
      for (const key of [normUnderscore, normHyphen]) {
        if (bucket[key]) {
          const take = Math.min(bucket[key], remaining);
          bucket[key] -= take;
          remaining -= take;
          if (bucket[key] <= 0) delete bucket[key];
          if (remaining <= 0) break;
        }
      }
    }
  }

  public static launchStadiumChallenge(
    ctxOrChallengerId: OverworldTrainerSightContext | string,
    cupIdOrChallengerId: string,
    ctxParam?: OverworldTrainerSightContext
  ): void {
    const ctx = (typeof ctxOrChallengerId === 'string' ? ctxParam : ctxOrChallengerId) as OverworldTrainerSightContext;
    const challengerId = typeof ctxOrChallengerId === 'string' ? ctxOrChallengerId : cupIdOrChallengerId;
    const cupId = typeof ctxOrChallengerId === 'string' ? cupIdOrChallengerId : (ctxParam as any);
    const {
      gameState,
      isCutsceneLocked,
      playerParty,
      overworldHUD,
      stadiumArenaManager,
      triggerBattle,
      inventory,
      storyFlags,
      saveCurrentGame,
    } = ctx;

    if (gameState() !== 'OVERWORLD' || isCutsceneLocked()) return;
    if (playerParty.length === 0) {
      overworldHUD.showToast('⚠️ You need at least 1 Pokémon in your party to enter the Stadium Arena!');
      return;
    }

    // Temporarily provide a rental partner if player only has 1 Pokémon for a 2v2 Double Battle
    const cup = stadiumArenaManager.getCupById(cupId);
    const effectiveParty = [...playerParty];
    if (
      (cup?.isDoubleBattle || challengerId !== 'stadium_cal') &&
      effectiveParty.filter((p) => !p.isEgg && p.currentHp > 0).length < 2
    ) {
      const rentalPikachu = PokemonFactory.create('pikachu', effectiveParty[0]?.level || 20, [
        'thundershock',
        'quickattack',
        'swift',
        'thunderwave',
      ]);
      rentalPikachu.nickname = 'PIKACHU (RENTAL)';
      effectiveParty.push(rentalPikachu);
    }

    const battleSetup = stadiumArenaManager.createStadiumBattle(
      effectiveParty,
      challengerId,
      challengerId === 'stadium_weather_lance_clair' ? 'weather_clash_cup' : cupId
    );
    if (!battleSetup) return;

    const { challenger, enemyLead, doubleConfig, rules } = battleSetup;
    const badgeParts: string[] = [cup?.cupName || 'STADIUM CUP'];
    if (rules.weather && rules.weather !== 'NONE') {
      badgeParts.push(`WEATHER: ${rules.weather}`);
    }
    if (rules.itemClause) {
      badgeParts.push('ITEM CLAUSE');
    }

    overworldHUD.openDialogue(
      [`🏟️ ${challenger.name} (${challenger.title}) challenges you under ${rules.cupName || 'Stadium'} rules!`],
      `🏟️ ${challenger.title.toUpperCase()}`,
      () => {
        void triggerBattle(enemyLead, {
          isTrainer: true,
          isGymLeader: true,
          trainerName: challenger.name,
          trainerTeam: doubleConfig.enemyPartner
            ? [enemyLead, doubleConfig.enemyPartner]
            : [enemyLead],
          doubleConfig,
          stadiumBadgeLabel: `🏟️ ${badgeParts.join(' • ')}`,
          onVictory: () => {
            inventory.money += challenger.rewardMoney;
            stadiumArenaManager.recordVictory(challenger.id);
            storyFlags.add(`stadium_${challenger.id}_cleared`);
            BattleAudio.playOverworldSound('FANFARE');
            saveCurrentGame();
            overworldHUD.showToast(
              `🏆 Defeated ${challenger.name} in the Stadium Arena! Bonus +$${challenger.rewardMoney}!`
            );
          },
        });
      }
    );
  }

  public static buildTrainerTeamInstances(trainer: GridEntity): PokemonInstance[] {
    return BattleController.buildTrainerTeamInstances(trainer);
  }

  public static getOppositeDirection(dir: Direction): Direction {
    return BattleController.getOppositeDirection(dir);
  }

  public static async runTrainerSightSequence(
    trainer: GridEntity,
    cutsceneContext: StoryCutsceneContext
  ): Promise<void> {
    return BattleController.runTrainerSightSequence(trainer, cutsceneContext);
  }

  public static completeSlowpokeWellProtonVictory(ctx: OverworldTrainerSightContext): void {
    const {
      defeatedTrainers,
      storyFlags,
      npcsByMap,
      missionManager,
      overworldHUD,
      healPlayerParty,
      mapManager,
      player,
      overworldRenderer,
      lookupMap,
      syncMapOverworldItems,
      audioManager,
      inventory,
      playerName,
      saveCurrentGame,
    } = ctx;

    defeatedTrainers.add('executive_proton');
    storyFlags.add('proton_defeated');
    storyFlags.add('slowpoke_well_cleared');
    if (npcsByMap.slowpoke_well_b1f) {
      npcsByMap.slowpoke_well_b1f = npcsByMap.slowpoke_well_b1f.filter(
        (n) => !n.id.startsWith('rocket_grunt') && n.id !== 'executive_proton'
      );
    }
    if (npcsByMap.azalea_town) {
      npcsByMap.azalea_town = npcsByMap.azalea_town.filter(
        (n) => n.id !== 'azalea_well_grunt' && n.id !== 'azalea_gym_grunt'
      );
    }
    missionManager.checkStoryFlags(storyFlags);
    overworldHUD.openDialogue(
      [
        "PROTON: You did OK today, but don't think you've stopped us!",
        'TEAM ROCKET will never give up! Retreat!',
        'The Rocket Grunts and Executive Proton scrambled out of the cavern!',
        "KURT: Way to go! Team Rocket has taken off! Let's get out of here.",
      ],
      '⚡ EXECUTIVE PROTON',
      () => {
        overworldHUD.playFieldRestAnimation(() => {
          healPlayerParty(false);
          const kurtMap = mapManager.setCurrentMap('kurts_house');
          player.x = 3;
          player.y = 4;
          player.targetX = 3;
          player.targetY = 4;
          player.renderX = 3;
          player.renderY = 4;
          player.direction = 'UP';
          overworldRenderer.renderMap(kurtMap, lookupMap);
          syncMapOverworldItems(kurtMap);
          overworldHUD.updateRouteName(kurtMap.name);
          audioManager.playMapBgm(kurtMap.id, 0.8);

          inventory.balls['lure-ball'] = (inventory.balls['lure-ball'] || 0) + 1;
          storyFlags.add('EVENT_KURT_GAVE_YOU_LURE_BALL');
          storyFlags.add('APRICORN_CRAFTING_UNLOCKED');
          missionManager.checkStoryFlags(storyFlags);
          BattleAudio.playOverworldSound('KEY_ITEM');
          overworldHUD.openDialogue(
            [
              "KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You're a wonderful trainer!",
              'Take this LURE BALL as a token of my gratitude!',
              `${playerName} received a LURE BALL from KURT!`,
              "KURT: Bring me any APRICORNS you find on trees, and I'll gladly craft custom POKé BALLS for you free of charge!",
            ],
            '👴 KURT',
            () => {
              saveCurrentGame();
              overworldHUD.showToast('⚡ Rescued the Slowpoke & received LURE BALL from Kurt!');
            }
          );
        });
      }
    );
  }

  public static handleTrainerDefeatRewards(
    trainer: GridEntity,
    ctx: OverworldTrainerSightContext
  ): void {
    const {
      defeatedTrainers,
      storyFlags,
      inventory,
      missionManager,
      audioManager,
      overworldHUD,
      playerName,
      saveCurrentGame,
    } = ctx;

    if (
      trainer.id === 'executive_proton' ||
      trainer.trainerId === 'executive_proton' ||
      trainer.action === 'PROTON_EVENT'
    ) {
      this.completeSlowpokeWellProtonVictory(ctx);
      return;
    }
    if (
      trainer.id === 'bugsy' ||
      trainer.trainerId === 'bugsy' ||
      trainer.action === 'BUGSY_EVENT'
    ) {
      defeatedTrainers.add('bugsy');
      storyFlags.add('bugsy_defeated');
      storyFlags.add('CAN_USE_CUT');
      if (!inventory.badges.includes('hive')) inventory.badges.push('hive');
      if (!inventory.tms.includes('TM49')) inventory.tms.push('TM49');
      missionManager.checkStoryFlags(storyFlags);
      missionManager.completeMission('M03');
      audioManager.playSfx?.('sfx_badge_get');
      BattleAudio.playOverworldSound('KEY_ITEM');
      overworldHUD.openDialogue(
        [
          "BUGSY: Whoa, amazing! You're an expert on POKéMON! My research isn't complete yet… OK, you win. Take this BADGE.",
          `${playerName} received the HIVEBADGE from BUGSY!`,
          "BUGSY: If you have the HIVEBADGE, POKéMON up to Lv. 30 will obey you without question! POKéMON that know CUT can also chop down small trees outside of battle! Here, take TM49 FURY CUTTER too!",
        ],
        trainer.speaker || '🐞 LEADER BUGSY',
        () => {
          saveCurrentGame();
          overworldHUD.showToast('🐞 Received HIVE BADGE & TM49 FURY CUTTER from Leader Bugsy!');
        }
      );
      return;
    }
    if (trainer.trainerId === 'camper_todd') {
      storyFlags.add('TODD_REGISTERED');
      overworldHUD.showToast("📱 Registered Todd's number in Pokégear!");
      saveCurrentGame();
    } else if (trainer.trainerId === 'picnicker_gina') {
      storyFlags.add('GINA_REGISTERED');
      overworldHUD.showToast("📱 Registered Gina's number in Pokégear!");
      saveCurrentGame();
    } else if (trainer.trainerId === 'cooltrainer_kate') {
      if (!storyFlags.has('KATE_DEFEATED_REWARD')) {
        storyFlags.add('KATE_DEFEATED_REWARD');
        if (!inventory.items) inventory.items = {};
        inventory.items['soft_sand'] = (inventory.items['soft_sand'] || 0) + 1;
        BattleAudio.playOverworldSound('KEY_ITEM');
        overworldHUD.showToast('✨ Received SOFT SAND from Cooltrainer Kate!');
        saveCurrentGame();
      }
    }

    // Reset line-of-sight trainer back to origin coordinates upon defeat so paths/corridors stay unblocked
    if (
      trainer.originX !== undefined &&
      trainer.originY !== undefined &&
      (trainer.x !== trainer.originX || trainer.y !== trainer.originY)
    ) {
      trainer.x = trainer.originX;
      trainer.y = trainer.originY;
      trainer.gridX = trainer.originX;
      trainer.gridY = trainer.originY;
      trainer.targetX = trainer.originX;
      trainer.targetY = trainer.originY;
      trainer.renderX = trainer.originX;
      trainer.renderY = trainer.originY;
      if (trainer.originDirection) {
        trainer.direction = trainer.originDirection;
      }
      trainer.isMoving = false;
      trainer.progress = 0;
    }
  }

  public static async runGuideGentWalkingTour(guide: GridEntity, cutsceneContext: StoryCutsceneContext): Promise<void> {
    const ctx = cutsceneContext;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;

    if (ctx.player.x === 31 && ctx.player.y === 6) {
      ctx.player.x = 32;
      ctx.player.y = 7;
      ctx.player.direction = 'UP';
    }

    const walkLegSteps = async (steps: Direction[], isFinalDespawn: boolean = false) => {
      const stepMs = (GridPhysics.BASE_TRAVERSAL_TIME * 1000) / ctx.gameClock.playerSpeed;
      for (let s = 0; s < steps.length; s++) {
        const stepDir = steps[s];
        const prevGuideX = guide.x;
        const prevGuideY = guide.y;
        const prevGuideDir = guide.direction;

        const nextGuideX = guide.x + (stepDir === 'LEFT' ? -1 : stepDir === 'RIGHT' ? 1 : 0);
        const nextGuideY = guide.y + (stepDir === 'UP' ? -1 : stepDir === 'DOWN' ? 1 : 0);

        guide.direction = stepDir;
        guide.targetX = nextGuideX;
        guide.targetY = nextGuideY;
        guide.isMoving = true;
        guide.progress = 0;

        let playerTargetX = ctx.player.x;
        let playerTargetY = ctx.player.y;
        let playerStepDir = ctx.player.direction;

        if (!isFinalDespawn) {
          playerTargetX = prevGuideX;
          playerTargetY = prevGuideY;
          playerStepDir = prevGuideDir;
          ctx.player.direction = playerStepDir;
          ctx.player.targetX = playerTargetX;
          ctx.player.targetY = playerTargetY;
          ctx.player.isMoving = true;
          ctx.player.progress = 0;
        }

        const startGuideX = guide.x;
        const startGuideY = guide.y;
        const startPlayerX = ctx.player.x;
        const startPlayerY = ctx.player.y;

        await new Promise<void>((resolve) => {
          const t0 = performance.now();
          const animate = (now: number) => {
            const p = Math.min(1, (now - t0) / stepMs);
            guide.progress = p;
            guide.renderX = startGuideX + (nextGuideX - startGuideX) * p;
            guide.renderY = startGuideY + (nextGuideY - startGuideY) * p;

            if (!isFinalDespawn) {
              ctx.player.progress = p;
              ctx.player.renderX = startPlayerX + (playerTargetX - startPlayerX) * p;
              ctx.player.renderY = startPlayerY + (playerTargetY - startPlayerY) * p;
            }

            if (p < 1) {
              requestAnimationFrame(animate);
            } else {
              guide.x = nextGuideX;
              guide.y = nextGuideY;
              guide.gridX = nextGuideX;
              guide.gridY = nextGuideY;
              guide.renderX = nextGuideX;
              guide.renderY = nextGuideY;
              guide.isMoving = false;
              guide.progress = 0;

              if (!isFinalDespawn) {
                ctx.player.x = playerTargetX;
                ctx.player.y = playerTargetY;
                ctx.player.gridX = playerTargetX;
                ctx.player.gridY = playerTargetY;
                ctx.player.renderX = playerTargetX;
                ctx.player.renderY = playerTargetY;
                ctx.player.isMoving = false;
                ctx.player.progress = 0;
              }
              resolve();
            }
          };
          requestAnimationFrame(animate);
        });
      }
    };

    // Leg 1: (32, 6) -> Pokemon Center
    await walkLegSteps(GUIDE_GENT_TOUR_LEGS[0].steps);
    guide.direction = GUIDE_GENT_TOUR_LEGS[0].guideEnd.direction;
    ctx.player.direction = GUIDE_GENT_TOUR_LEGS[0].playerEnd.direction;
    ctx.overworldHUD.openDialogue(
      GUIDE_GENT_TOUR_LEGS[0].dialoguePages || [],
      '👴 GUIDE GENT',
      async () => {
        // Leg 2: -> Poke Mart
        await walkLegSteps(GUIDE_GENT_TOUR_LEGS[1].steps);
        guide.direction = GUIDE_GENT_TOUR_LEGS[1].guideEnd.direction;
        ctx.player.direction = GUIDE_GENT_TOUR_LEGS[1].playerEnd.direction;
        ctx.overworldHUD.openDialogue(
          GUIDE_GENT_TOUR_LEGS[1].dialoguePages || [],
          '👴 GUIDE GENT',
          async () => {
            // Leg 3: -> Route 30
            await walkLegSteps(GUIDE_GENT_TOUR_LEGS[2].steps);
            guide.direction = GUIDE_GENT_TOUR_LEGS[2].guideEnd.direction;
            ctx.player.direction = GUIDE_GENT_TOUR_LEGS[2].playerEnd.direction;
            ctx.overworldHUD.openDialogue(
              GUIDE_GENT_TOUR_LEGS[2].dialoguePages || [],
              '👴 GUIDE GENT',
              async () => {
                // Leg 4: -> The Sea
                await walkLegSteps(GUIDE_GENT_TOUR_LEGS[3].steps);
                guide.direction = GUIDE_GENT_TOUR_LEGS[3].guideEnd.direction;
                ctx.player.direction = GUIDE_GENT_TOUR_LEGS[3].playerEnd.direction;
                ctx.overworldHUD.openDialogue(
                  GUIDE_GENT_TOUR_LEGS[3].dialoguePages || [],
                  '👴 GUIDE GENT',
                  async () => {
                    // Leg 5: -> House Porch
                    await walkLegSteps(GUIDE_GENT_TOUR_LEGS[4].steps);
                    guide.direction = GUIDE_GENT_TOUR_LEGS[4].guideEnd.direction;
                    ctx.player.direction = GUIDE_GENT_TOUR_LEGS[4].playerEnd.direction;
                    ctx.overworldHUD.openDialogue(
                      GUIDE_GENT_TOUR_LEGS[4].dialoguePages || [],
                      '👴 GUIDE GENT',
                      async () => {
                        BattleAudio.playOverworldSound('KEY_ITEM');
                        ctx.storyFlags.add('has_map_card');
                        ctx.storyFlags.add('GUIDE_GENT_TOUR_COMPLETED');
                        ctx.saveCurrentGame();
                        ctx.overworldHUD.showToast('🗺️ Received MAP CARD! Town Map unlocked in Pokégear!');

                        // Leg 6: Guide Gent enters house & despawns
                        await walkLegSteps(GUIDE_GENT_TOUR_LEGS[5].steps, true);
                        BattleAudio.playOverworldSound('DOOR_ENTER');

                        if (ctx.npcsByMap.cherrygrove_city) {
                          ctx.npcsByMap.cherrygrove_city = ctx.npcsByMap.cherrygrove_city.filter(
                            (n) => n.id !== 'cg_guide_gent'
                          );
                        }
                        ctx.setCutsceneLocked(false);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }

  public static healParty(playerParty: PokemonInstance[], playSound: boolean = true): void {
    if (playSound) BattleAudio.playOverworldSound('HEAL_JINGLE');
    for (let i = 0; i < playerParty.length; i++) {
      const pkmn = playerParty[i];
      pkmn.currentHp = pkmn.stats.hp;
      pkmn.status = 'NONE';
      pkmn.isTrapped = false;
      for (let j = 0; j < pkmn.moves.length; j++) {
        pkmn.moves[j].currentPp = pkmn.moves[j].maxPp;
      }
    }
  }

  public static detectChosenStarterSpecies(
    storyFlags: Set<string>,
    playerParty: PokemonInstance[],
    playerBox: PokemonInstance[],
    seenSpecies: Set<string>
  ): 'cyndaquil' | 'totodile' | 'chikorita' | undefined {
    if (storyFlags.has('starter_cyndaquil')) return 'cyndaquil';
    if (storyFlags.has('starter_totodile')) return 'totodile';
    if (storyFlags.has('starter_chikorita')) return 'chikorita';
    const allOwned = [
      ...playerParty.map((p) => p.speciesId),
      ...playerBox.map((p) => p.speciesId),
      ...Array.from(seenSpecies),
    ];
    if (allOwned.some((id) => id === 'totodile' || id === 'croconaw' || id === 'feraligatr')) return 'totodile';
    if (allOwned.some((id) => id === 'chikorita' || id === 'bayleef' || id === 'meganium')) return 'chikorita';
    if (allOwned.some((id) => id === 'cyndaquil' || id === 'quilava' || id === 'typhlosion')) return 'cyndaquil';
    return undefined;
  }
}
