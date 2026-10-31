/**
 * @fileoverview JohtoTownServiceInteractions domain module implementation.
 * @module world/interactions/JohtoTownServiceInteractions
 * @role JohtoTownServiceInteractions Component
 * @exports getJohtoTownServiceInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-344: Implementation | L345-726: Handlers & Exports
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { DAY_SIBLINGS } from '../npcData';
import { ModernHMHandler } from '../ModernHMHandler';
import { getVioletAndAzaleaServiceInteractions } from './VioletAndAzaleaServiceInteractions';

/**
 * JohtoTownServiceInteractions — Day Siblings, Dance Theater Surf, Chuck's Wife,
 * Olivine Sailor & Good Rod, Moomoo Farm, Cianwood Pharmacy, Amphy, Lapras,
 * Kyle Trade, Earl's Academy, Charcoal Kiln, and Kurt's House.
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getJohtoTownServiceInteractions(): NpcInteractionRegistration[] {
  return [
    // 1. Day-of-Week Siblings (Monica, Tuscany, Wesley, Arthur, Frieda, Santos, Sunny)
    {
      actions: ['DAY_SIBLING_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        const sibling =
          DAY_SIBLINGS[targetNpc.id] ||
          Object.values(DAY_SIBLINGS).find(
            (s) =>
              s.name.toLowerCase().includes(targetNpc.id.toLowerCase()) ||
              targetNpc.id.toLowerCase().includes(s.id.toLowerCase())
          );

        if (sibling) {
          const todayDayIndex = ctx.gameClock ? ctx.gameClock.getDayOfWeek() : new Date().getDay();

          if (todayDayIndex !== sibling.dayOfWeekIndex) {
            const wrongPages =
              sibling.wrongDayPages && sibling.wrongDayPages.length > 0
                ? sibling.wrongDayPages
                : [`${sibling.name.toUpperCase()}: Today's not ${sibling.day}. How disappointing.`];
            ctx.openDialogue(wrongPages, targetNpc.speaker);
            return true;
          }

          if (ctx.storyFlags.has(sibling.flag)) {
            ctx.openDialogue(sibling.alreadyGivenPages, targetNpc.speaker);
            return true;
          }

          ctx.storyFlags.add(sibling.flag);
          if (!ctx.inventory.items) ctx.inventory.items = {};
          ctx.inventory.items[sibling.itemId] = (ctx.inventory.items[sibling.itemId] || 0) + 1;
          BattleAudio.playOverworldSound('FANFARE');
          ctx.openDialogue(sibling.giftPages, targetNpc.speaker, () => {
            ctx.saveCurrentGame();
            ctx.showToast(`🎁 Received ${sibling.itemName} from ${sibling.name}!`);
          });
          return true;
        }
        return false;
      },
    },

    // 2. Dance Theater: HM03 Surf Admirer
    {
      npcIds: ['surf_gentleman'],
      handler: (targetNpc, _map, ctx) => {
        const kimonoIds = ['kimono_naoko', 'kimono_sayo', 'kimono_zuki', 'kimono_kuni', 'kimono_miki'];
        const allKimonoDefeated =
          ctx.storyFlags.has('DEFEATED_ALL_KIMONO_GIRLS') ||
          kimonoIds.every((id) => ctx.defeatedTrainers.has(id));

        if (!allKimonoDefeated) {
          const remaining = kimonoIds.filter((id) => !ctx.defeatedTrainers.has(id)).length;
          ctx.openDialogue(
            [
              'ADMIRER: The KIMONO GIRLS are so graceful, yet so strong in battle!',
              `If you can defeat all five KIMONO GIRLS on stage (${5 - remaining}/5 defeated), I will give you a marvelous gift!`,
            ],
            targetNpc.speaker
          );
          return true;
        }

        ctx.storyFlags.add('DEFEATED_ALL_KIMONO_GIRLS');
        if (!ctx.storyFlags.has('has_hm03_surf')) {
          ctx.storyFlags.add('has_hm03_surf');
          ctx.storyFlags.add('EVENT_GOT_HM03_SURF');
          if (!ctx.inventory.tms.includes('HM03')) ctx.inventory.tms.push('HM03');
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              'ADMIRER: Bravo! Magnificent! The way you battled all five KIMONO GIRLS, it was like watching a dance!',
              'I want you to have this... Take HM03 SURF!',
              'With the FOGBADGE from Ecruteak Gym, your POKéMON can carry you across oceans and lakes!',
            ],
            targetNpc.speaker,
            () => {
              const surfCheck = ModernHMHandler.checkSurf(ctx.inventory, ctx.storyFlags, ctx.playerParty);
              if (surfCheck.canUse) {
                ctx.setSurfEnabled?.(true);
              }
              ctx.saveCurrentGame();
              ctx.showToast('🌊 Received HM03 SURF from the Dance Theater Admirer!');
            }
          );
          return true;
        }

        ctx.openDialogue(
          ['ADMIRER: That HM03 is SURF! With the FOGBADGE, your POKéMON can glide across any body of water!'],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 3. Chuck's Wife: HM02 Fly
    {
      npcIds: ['chucks_wife'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('chuck_defeated') || ctx.inventory.badges.includes('storm')) {
          if (!ctx.storyFlags.has('has_hm02_fly')) {
            ctx.storyFlags.add('has_hm02_fly');
            ctx.storyFlags.add('EVENT_GOT_HM02_FLY');
            if (!ctx.inventory.tms.includes('HM02')) ctx.inventory.tms.push('HM02');
            ctx.audioManager.playSfx?.('sfx_badge_get');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue([
              'CHUCK’S WIFE: You defeated my husband Chuck? Amazing!',
              'Take this HM02 FLY! It lets your Flying POKéMON carrying you to any town you’ve previously visited!',
            ], targetNpc.speaker, () => {
              ctx.saveCurrentGame();
              ctx.showToast('🦅 Received HM02 FLY from Chuck’s Wife!');
            });
            return true;
          }
          ctx.openDialogue(['CHUCK’S WIFE: Use FLY to soar through the skies across Johto anytime!'], targetNpc.speaker);
          return true;
        }
        ctx.openDialogue(['CHUCK’S WIFE: My husband Chuck is training inside the Gym! Defeat him to earn his respect!'], targetNpc.speaker);
        return true;
      },
    },

    // 4. Olivine Café Sailor: HM04 Strength
    {
      npcIds: ['cafe_sailor'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('has_hm04_strength')) {
          ctx.storyFlags.add('has_hm04_strength');
          ctx.storyFlags.add('EVENT_GOT_HM04_STRENGTH');
          if (!ctx.inventory.tms.includes('HM04')) ctx.inventory.tms.push('HM04');
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              'SAILOR: Whew! That meal filled me up with muscular power!',
              'You look like a tough trainer. Take this HM04 STRENGTH!',
              'Use STRENGTH to push heavy boulders out of your way in caves and routes!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('💪 Received HM04 STRENGTH from Olivine Sailor!');
            }
          );
          return true;
        }
        ctx.openDialogue(
          ['SAILOR: Muscle through any boulder blocking your path with STRENGTH!'],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 5. Olivine Good Rod Guru
    {
      npcIds: ['good_rod_guru'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('has_good_rod')) {
          ctx.storyFlags.add('has_good_rod');
          ctx.storyFlags.add('EVENT_GOT_GOOD_ROD');
          if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
          if (!ctx.inventory.keyItems.includes('good_rod')) ctx.inventory.keyItems.push('good_rod');
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              'FISHING GURU: The sea is vast and full of wondrous POKéMON!',
              'Take this GOOD ROD! It can catch bigger, stronger water species than an Old Rod!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🎣 Received GOOD ROD from Fishing Guru!');
            }
          );
          return true;
        }
        ctx.openDialogue(
          ['FISHING GURU: Cast your GOOD ROD into any lake or ocean shore!'],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 6. Route 39 Moomoo Farm: Pasture Miltank, Moomoo, Farmer's Wife & Dairy Farmer Shop
    {
      npcIds: ['route_39_miltank_1', 'route_39_miltank_2', 'route_39_miltank_3', 'route_39_miltank_4'],
      handler: (targetNpc, _map, ctx) => {
        BattleAudio.playCry('miltank');
        ctx.openDialogue(['MILTANK: Mooo!'], targetNpc.speaker);
        return true;
      },
    },
    {
      npcIds: ['moomoo_miltank'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('moomoo_healed')) {
          BattleAudio.playCry('miltank');
          ctx.openDialogue(['MILTANK: Mooo! (Moomoo is bursting with energy and happiness!)'], targetNpc.speaker);
          return true;
        }
        const berries = ctx.inventory.berries || {};
        const berryKey = Object.keys(berries).find((k) => (berries[k] || 0) > 0);
        const hasBerryBucket = berryKey && (berries[berryKey] || 0) > 0;
        const hasLegacyBerry = (ctx.inventory.items?.['berry'] || 0) > 0;

        if (hasBerryBucket || hasLegacyBerry) {
          if (hasBerryBucket && berryKey) {
            berries[berryKey] = (berries[berryKey] || 0) - 1;
            if (berries[berryKey] <= 0) delete berries[berryKey];
          } else if (hasLegacyBerry && ctx.inventory.items) {
            ctx.inventory.items['berry'] = ctx.inventory.items['berry'] - 1;
          }
          ctx.storyFlags.add('moomoo_healed');
          ctx.storyFlags.add('EVENT_HEALED_MOOMOO');
          BattleAudio.playCry('miltank');
          BattleAudio.playMenuSound('HEAL');
          ctx.openDialogue(
            [`${ctx.playerName} fed a sweet BERRY to MOOMOO!`, 'MOOMOO munched happily… Its energy came rushing back!', 'MILTANK: Mooo! Mooooo!'],
            targetNpc.speaker,
            () => { ctx.saveCurrentGame(); ctx.showToast('🐮 Moomoo Miltank was restored to full health!'); }
          );
          return true;
        }
        BattleAudio.playCry('miltank');
        ctx.openDialogue(['MILTANK: …Moo… (Its cry is weak… It needs sweet BERRIES to recover!)'], targetNpc.speaker);
        return true;
      },
    },
    {
      npcIds: ['farmer_wife'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('moomoo_healed')) {
          ctx.openDialogue(["FARMER'S WIFE: Our milk even goes out to KANTO. So if our own MILTANK won't give us any milk, we're in trouble."], targetNpc.speaker);
          return true;
        }
        if (!ctx.storyFlags.has('has_tm13_snore')) {
          ctx.storyFlags.add('has_tm13_snore');
          ctx.storyFlags.add('EVENT_GOT_TM13_SNORE_FROM_MOOMOO_FARM');
          if (!ctx.inventory.tms) ctx.inventory.tms = [];
          if (!ctx.inventory.tms.includes('TM13')) ctx.inventory.tms.push('TM13');
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            ["FARMER'S WIFE: You fixed our MILTANK, hon. Now it gives MOOMOO MILK again. Here's somethin' fer your trouble!", "That there's TM13 SNORE! It's a rare move that only works while the POKéMON is asleep."],
            targetNpc.speaker,
            () => { ctx.saveCurrentGame(); ctx.showToast('🐮 Received TM13 SNORE!'); }
          );
          return true;
        }
        ctx.openDialogue(["FARMER'S WIFE: Keeping up with a POKéMON that only attacks in its sleep isn't easy, hon!"], targetNpc.speaker);
        return true;
      },
    },
    {
      npcIds: ['dairy_farmer'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('moomoo_healed')) {
          ctx.storyFlags.add('EVENT_TALKED_TO_FARMER_ABOUT_MOOMOO');
          ctx.openDialogue(['DAIRY FARMER: Our Moomoo in the barn is sick… Feed it sweet BERRYS to nurse it back to health!'], targetNpc.speaker);
          return true;
        }
        if (!ctx.storyFlags.has('has_tm13_snore')) {
          ctx.storyFlags.add('has_tm13_snore');
          ctx.storyFlags.add('EVENT_GOT_TM13_SNORE_FROM_MOOMOO_FARM');
          if (!ctx.inventory.tms) ctx.inventory.tms = [];
          if (!ctx.inventory.tms.includes('TM13')) ctx.inventory.tms.push('TM13');
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            ['DAIRY FARMER: You healed our Moomoo? Bless your kind heart!', 'Take this TM13 SNORE as a token of our appreciation!'],
            targetNpc.speaker,
            () => { ctx.saveCurrentGame(); ctx.showToast('🐮 Received TM13 SNORE from Dairy Farmer!'); }
          );
          return true;
        }
        if (ctx.inventory.money >= 500) {
          ctx.inventory.money -= 500;
          if (!ctx.inventory.items) ctx.inventory.items = {};
          ctx.inventory.items['moomoo-milk'] = (ctx.inventory.items['moomoo-milk'] || 0) + 1;
          BattleAudio.playMenuSound('CONFIRM');
          ctx.openDialogue(
            ["DAIRY FARMER: How'd you like my MOOMOO MILK? It's my pride and joy! Give it to POKéMON to restore 100 HP!", "Here ya go! Drink up'n enjoy! (Purchased 1x MOOMOO MILK for ¥500)"],
            targetNpc.speaker,
            () => { ctx.saveCurrentGame(); ctx.showToast('🥛 Purchased MOOMOO MILK for ¥500!'); }
          );
          return true;
        }
        BattleAudio.playMenuSound('CANCEL');
        ctx.openDialogue(["DAIRY FARMER: Sorry, there. No cash, no sale! Come back when you have ¥500 for MOOMOO MILK!"], targetNpc.speaker);
        return true;
      },
    },

    // 7. Cianwood Pharmacy: SecretPotion
    {
      actions: ['PHARMACY_SECRET_POTION_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('has_secret_potion')) {
          ctx.openDialogue(
            ['PHARMACIST: My SECRETPOTION is potent! It will cure any illness, guaranteed.'],
            targetNpc.speaker
          );
        } else {
          ctx.storyFlags.add('has_secret_potion');
          if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
          if (!ctx.inventory.keyItems.includes('SecretPotion')) ctx.inventory.keyItems.push('SecretPotion');
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              'PHARMACIST: Ah, you came all the way from OLIVINE? The lighthouse POKéMON is sick?',
              'Take this! It is our ancient SECRETPOTION! It was brewed with 500 years of herbal knowledge.',
              `${ctx.playerName} received the SECRETPOTION!`,
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('💊 Received SECRETPOTION from Cianwood Pharmacist!');
            }
          );
        }
        return true;
      },
    },

    // 8. Olivine Lighthouse: Amphy & Jasmine Healing
    {
      actions: ['AMPHY_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('amphy_cured')) {
          BattleAudio.playCry('ampharos');
          if (targetNpc.id === 'lighthouse_jasmine') {
            ctx.openDialogue([
              'AMPHAROS: Palu! Palulu! (Amphy is radiating brilliant light, glowing happily!)',
              'JASMINE: Amphy is all better now! I am heading back to OLIVINE GYM. Let us battle there!',
            ], targetNpc.speaker);
            return true;
          }
          ctx.openDialogue(['AMPHAROS: Palu! Palulu! (Amphy is radiating brilliant light, glowing happily!)'], '💡 AMPHAROS');
          return true;
        }

        const hasSecretPotion =
          ctx.storyFlags.has('has_secret_potion') ||
          (ctx.inventory?.keyItems && ctx.inventory.keyItems.some((k) => k.toLowerCase().includes('secretpotion'))) ||
          (ctx.inventory?.items && ctx.inventory.items['secretpotion']);

        if (hasSecretPotion) {
          ctx.storyFlags.add('amphy_cured');
          ctx.storyFlags.add('EVENT_JASMINE_RETURNED_TO_GYM');
          ctx.storyFlags.delete('has_secret_potion');
          if (ctx.inventory?.keyItems) {
            ctx.inventory.keyItems = ctx.inventory.keyItems.filter((k) => !k.toLowerCase().includes('secretpotion'));
          }
          if (ctx.inventory?.items && ctx.inventory.items['secretpotion']) delete ctx.inventory.items['secretpotion'];

          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          BattleAudio.playCry('ampharos');

          ctx.openDialogue([
            'JASMINE: …Will that medicine cure AMPHY?',
            `${ctx.playerName} handed over the SECRETPOTION to JASMINE!`,
            'JASMINE: …Um, please do not be offended… AMPHY will not take anything from anyone but me…',
            'AMPHY swallowed the medicine… Suddenly, its tail began to glow brightly with radiant light!',
            'AMPHAROS: Palu! Paluluuu!',
            'JASMINE: …Oh, I am so relieved… This is just so wonderful… Thank you so very, very much.',
            '…I will return to the GYM in OLIVINE CITY right away. Please come challenge me there for a real GYM battle!',
          ], targetNpc.speaker, () => {
            ctx.saveCurrentGame();
            ctx.showToast('✨ Amphy recovered! Leader Jasmine returned to Olivine Gym!');
          });
          return true;
        }

        ctx.openDialogue([
          'JASMINE: …Amphy used to shine so brightly to guide ships across the dark sea…',
          "It is so weak and feverish… I will not leave its side until it gets better.",
          'I heard there is a pharmacy in CIANWOOD CITY across the sea that carries miracle medicine…',
          'AMPHAROS: …Palu… (It looks pale and feverish…)',
        ], targetNpc.speaker);
        return true;
      },
    },

    // 9-13. Union Cave Lapras, Violet City & Azalea Town Service Interactions
    ...getVioletAndAzaleaServiceInteractions(),
  ];
}
