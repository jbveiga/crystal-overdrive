import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import type { PokemonInstance, PokeballId } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import { EffectivenessHelper } from '../battle/EffectivenessHelper';

export interface BattleAnimationHost {
  app: Application;
  playerPokemonSprite: Sprite;
  enemyPokemonSprite: Sprite;
  playerIdleTween: gsap.core.Tween | null;
  enemyIdleTween: gsap.core.Tween | null;
  fxContainer: Container;
  arenaContainer: Container;
  speedMultiplier: number;
  startIdleBreathing: (sprite: Sprite, targetScale: number, isPlayer: boolean) => void;
}

/**
 * Sends out the next Pokémon (player or trainer foe) with a parabolic Pokéball toss,
 * expanding radial light/particle burst, authentic emergence scale-up, and cry (Ticket 5.5).
 */
export async function animateSendOutNextPokemon(
  host: BattleAnimationHost,
  targetIsPlayer: boolean,
  newPokemon: PokemonInstance
): Promise<void> {
  const sprite = targetIsPlayer ? host.playerPokemonSprite : host.enemyPokemonSprite;
  if (targetIsPlayer && host.playerIdleTween) {
    host.playerIdleTween.kill();
  } else if (!targetIsPlayer && host.enemyIdleTween) {
    host.enemyIdleTween.kill();
  }
  gsap.killTweensOf(sprite);
  gsap.killTweensOf(sprite.scale);

  const width = host.app.screen.width;
  const height = host.app.screen.height;
  const platformX = targetIsPlayer ? width * 0.28 : width * 0.72;
  const platformY = targetIsPlayer ? height * 0.73 : height * 0.39;
  const anchorY = targetIsPlayer ? platformY + 15 : platformY + 10;
  const targetScale = targetIsPlayer ? 3.2 : 2.4;

  // 1. Construct custom Pokéball graphic and toss along a parabolic arc onto the platform
  BattleAudio.playBallEvent('THROW');
  const palette = EffectivenessHelper.getPokeballPalette('poke-ball');
  const ball = new Graphics();
  ball.arc(0, 0, 13, Math.PI, 0);
  ball.fill({ color: palette.topColor });
  ball.arc(0, 0, 13, 0, Math.PI);
  ball.fill({ color: palette.bottomColor });
  ball.rect(-13, -2, 26, 4);
  ball.fill({ color: 0x1e293b });
  ball.circle(0, 0, 4);
  ball.fill({ color: 0xffffff });
  ball.stroke({ width: 1.5, color: 0x1e293b });

  const startX = targetIsPlayer ? width * 0.06 : width * 0.94;
  const startY = targetIsPlayer ? height * 0.82 : height * 0.22;
  ball.position.set(startX, startY);
  host.fxContainer.addChild(ball);

  const tossDur = 0.32 / host.speedMultiplier;
  await new Promise<void>((resolve) => {
    const arcState = { t: 0 };
    gsap.to(arcState, {
      t: 1,
      duration: tossDur,
      ease: 'none',
      onUpdate: () => {
        const p = arcState.t;
        ball.x = startX + (platformX - startX) * p;
        ball.y = startY + (platformY - startY) * p - Math.sin(p * Math.PI) * 95;
        ball.rotation = p * Math.PI * 2 * (targetIsPlayer ? 1 : -1);
      },
      onComplete: () => {
        host.fxContainer.removeChild(ball);
        resolve();
      },
    });
  });

  // 2. Platform touchdown: Pokéball pop + expanding light/particle burst in fxContainer
  BattleAudio.playBallEvent('BREAK');
  const burstGroup = new Container();
  host.fxContainer.addChild(burstGroup);

  const flashRing = new Graphics();
  flashRing.circle(0, 0, 18);
  flashRing.fill({ color: 0xffffff, alpha: 0.9 });
  flashRing.stroke({ width: 3, color: 0xfacc15 });
  flashRing.position.set(platformX, platformY - 12);
  burstGroup.addChild(flashRing);

  gsap.to(flashRing.scale, {
    x: 3.4,
    y: 3.4,
    duration: 0.24 / host.speedMultiplier,
    ease: 'power2.out',
  });
  gsap.to(flashRing, {
    alpha: 0,
    duration: 0.24 / host.speedMultiplier,
    ease: 'power2.out',
  });

  const rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    const spark = new Graphics();
    spark.star(0, 0, 4, 8, 3);
    spark.fill({ color: i % 2 === 0 ? 0xffffff : 0xfef08a });
    spark.position.set(platformX, platformY - 12);
    burstGroup.addChild(spark);

    const angle = (i / rayCount) * Math.PI * 2;
    gsap.to(spark, {
      x: platformX + Math.cos(angle) * 58,
      y: platformY - 12 + Math.sin(angle) * 42,
      alpha: 0,
      scale: 0.4,
      duration: 0.26 / host.speedMultiplier,
      ease: 'power2.out',
    });
  }

  // 3. Load new Pokémon texture, reset platform anchor, scale up with back.out(1.6) + cry
  const suffix = targetIsPlayer ? 'back' : 'front';
  const newTex = await Assets.load<Texture>(
    `./assets/sprites/pokemon/${newPokemon.speciesId}_${suffix}.png`
  );
  newTex.source.scaleMode = 'nearest';
  sprite.texture = newTex;
  sprite.position.set(platformX, anchorY);
  sprite.alpha = 1;
  sprite.tint = 0xffffff;
  sprite.scale.set(0.1, 0.1);

  BattleAudio.playCry(newPokemon.speciesId);

  const emergeDur = 0.28 / host.speedMultiplier;
  await new Promise<void>((resolve) => {
    gsap.to(sprite.scale, {
      x: targetScale,
      y: targetScale,
      duration: emergeDur,
      ease: 'back.out(1.6)',
      onComplete: () => {
        host.fxContainer.removeChild(burstGroup);
        host.startIdleBreathing(sprite, targetScale, targetIsPlayer);
        resolve();
      },
    });
  });
}

/**
 * Animates switching out current player Pokémon (crimson/white recall beam)
 * and sending in a new party member via Pokéball arc & light burst (Ticket 5.5).
 */
export async function animateSwitchPlayerPokemon(
  host: BattleAnimationHost,
  newPokemon: PokemonInstance
): Promise<void> {
  if (host.playerIdleTween) {
    host.playerIdleTween.kill();
  }
  gsap.killTweensOf(host.playerPokemonSprite);
  gsap.killTweensOf(host.playerPokemonSprite.scale);

  BattleAudio.playBallEvent('THROW');
  const dur = 0.22 / host.speedMultiplier;
  host.playerPokemonSprite.tint = 0xff4d6d;

  const beamFlash = new Graphics();
  beamFlash.circle(0, 0, 32);
  beamFlash.fill({ color: 0xff4d6d, alpha: 0.55 });
  beamFlash.position.set(host.playerPokemonSprite.x, host.playerPokemonSprite.y - 24);
  host.fxContainer.addChild(beamFlash);

  gsap.to(beamFlash.scale, { x: 0.1, y: 0.1, duration: dur, ease: 'power2.in' });
  gsap.to(beamFlash, {
    alpha: 0,
    duration: dur,
    onComplete: () => {
      host.fxContainer.removeChild(beamFlash);
    },
  });

  await new Promise<void>((resolve) => {
    gsap.to(host.playerPokemonSprite.scale, {
      x: 0.1,
      y: 0.1,
      duration: dur,
      ease: 'power2.in',
    });
    gsap.to(host.playerPokemonSprite, {
      alpha: 0,
      duration: dur,
      ease: 'power2.in',
      onComplete: () => {
        host.playerPokemonSprite.tint = 0xffffff;
        resolve();
      },
    });
  });

  await animateSendOutNextPokemon(host, true, newPokemon);
}

export function animateFaint(host: BattleAnimationHost, targetIsPlayer: boolean): Promise<void> {
  if (targetIsPlayer && host.playerIdleTween) {
    host.playerIdleTween.kill();
  } else if (!targetIsPlayer && host.enemyIdleTween) {
    host.enemyIdleTween.kill();
  }

  return new Promise((resolve) => {
    const sprite = targetIsPlayer ? host.playerPokemonSprite : host.enemyPokemonSprite;
    gsap.killTweensOf(sprite);
    gsap.killTweensOf(sprite.scale);
    const dur = 0.32 / host.speedMultiplier;

    gsap.to(sprite, {
      y: '+=68',
      alpha: 0,
      duration: dur,
      ease: 'power2.in',
      onComplete: () => resolve(),
    });
  });
}

/**
 * Throws an authentic custom-styled Pokéball along a parabolic arc (Ticket 3.9).
 */
export async function animateThrowBall(
  host: BattleAnimationHost,
  ballId: PokeballId | string = 'poke-ball'
): Promise<Graphics> {
  BattleAudio.playBallEvent('THROW');
  const palette = EffectivenessHelper.getPokeballPalette(ballId);

  const width = host.app.screen.width;
  const height = host.app.screen.height;

  const ball = new Graphics();
  // Upper hemisphere with custom Pokéball cap color
  ball.arc(0, 0, 14, Math.PI, 0);
  ball.fill({ color: palette.topColor });
  // Accent crest / stripe on upper cap
  ball.arc(0, -4, 7, Math.PI, 0);
  ball.fill({ color: palette.accentColor });
  // Lower hemisphere
  ball.arc(0, 0, 14, 0, Math.PI);
  ball.fill({ color: palette.bottomColor });
  // Center band & button
  ball.rect(-14, -2, 28, 4);
  ball.fill({ color: 0x1e293b });
  ball.circle(0, 0, 4.5);
  ball.fill({ color: 0xffffff });
  ball.stroke({ width: 1.5, color: 0x1e293b });

  // Overlay pixel item sprite if available
  try {
    const tex = await Assets.load<Texture>(palette.spritePath);
    if (tex) {
      tex.source.scaleMode = 'nearest';
      const spr = new Sprite(tex);
      spr.anchor.set(0.5, 0.5);
      spr.scale.set(2.0, 2.0);
      ball.addChild(spr);
    }
  } catch {
    // Fallback to custom vector Pokeball graphics
  }

  const startX = width * 0.28;
  const startY = height * 0.72;
  ball.position.set(startX, startY);
  host.arenaContainer.addChild(ball);

  const dur = 0.42 / host.speedMultiplier;
  const targetX = host.enemyPokemonSprite.x;
  const targetY = host.enemyPokemonSprite.y - 20;

  return new Promise((resolve) => {
    const arcState = { t: 0 };
    gsap.to(arcState, {
      t: 1,
      duration: dur,
      ease: 'none',
      onUpdate: () => {
        const p = arcState.t;
        ball.x = startX + (targetX - startX) * p;
        ball.y = startY + (targetY - startY) * p - Math.sin(p * Math.PI) * 110;
        ball.rotation = p * Math.PI * 2;
      },
      onComplete: () => {
        if (host.enemyIdleTween) host.enemyIdleTween.kill();
        gsap.to(host.enemyPokemonSprite, {
          alpha: 0,
          scale: 0.1,
          duration: 0.2 / host.speedMultiplier,
          onComplete: () => {
            gsap.to(ball, {
              y: targetY + 30,
              rotation: 0,
              duration: 0.24 / host.speedMultiplier,
              ease: 'bounce.out',
              onComplete: () => resolve(ball),
            });
          },
        });
      },
    });
  });
}

export function animateShake(
  host: BattleAnimationHost,
  ball: Graphics,
  shakes: 0 | 1 | 2 | 3 | 4,
  caught: boolean
): Promise<void> {
  return new Promise((resolve) => {
    const shakeDur = 0.26 / host.speedMultiplier;
    const tl = gsap.timeline({
      onComplete: () => {
        if (caught) {
          BattleAudio.playBallEvent('CAUGHT');
          const starGroup = new Container();
          host.fxContainer.addChild(starGroup);
          const offsets = [-22, 0, 22];
          offsets.forEach((ox, idx) => {
            const star = new Graphics();
            star.star(0, 0, 5, 9, 4);
            star.fill({ color: 0xfacc15 });
            star.stroke({ width: 1.5, color: 0xca8a04 });
            star.position.set(ball.x + ox * 0.3, ball.y - 8);
            starGroup.addChild(star);

            gsap.to(star, {
              x: ball.x + ox,
              y: ball.y - 34 - (idx === 1 ? 8 : 0),
              alpha: 0,
              duration: 0.45 / host.speedMultiplier,
              ease: 'power2.out',
            });
          });

          gsap.to(ball, {
            tint: 0x94a3b8,
            duration: 0.25 / host.speedMultiplier,
            onComplete: () => {
              host.fxContainer.removeChild(starGroup);
              resolve();
            },
          });
        } else {
          BattleAudio.playBallEvent('BREAK');
          host.arenaContainer.removeChild(ball);
          host.enemyPokemonSprite.alpha = 1;
          host.enemyPokemonSprite.scale.set(2.4, 2.4);
          host.startIdleBreathing(host.enemyPokemonSprite, 2.4, false);
          resolve();
        }
      },
    });

    for (let i = 0; i < shakes; i++) {
      tl.call(() => BattleAudio.playBallEvent('WOBBLE'));
      tl.to(ball, { rotation: i % 2 === 0 ? 0.38 : -0.38, duration: shakeDur * 0.5, yoyo: true, repeat: 1 });
      tl.to(ball, { rotation: 0, duration: shakeDur * 0.35 });
    }
  });
}
