/**
 * @fileoverview PixiJS v8 combat renderer driving Pokémon battle animations, health gauges, and visual effects.
 * @module render/BattleRenderer
 * @role Battle Scene Renderer
 * @exports BattleRenderer
 * @layer render
 * @sections L1-7: Micro-Header & Types | L8-274: Core Implementation | L275-548: Public Interface & Exports
 */

import { Application, Container, Sprite, Texture, Assets, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { PokemonInstance, SpeedMultiplier, PokemonType, MoveCategory, PokeballId } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import { EffectivenessHelper } from '../battle/EffectivenessHelper';
import {
  animateSendOutNextPokemon as runSendOutNextPokemon,
  animateSwitchPlayerPokemon as runSwitchPlayerPokemon,
  animateFaint as runFaint,
  animateThrowBall as runThrowBall,
  animateShake as runShake,
} from './BattlePokeballAndSwitchAnimations';

export class BattleRenderer {
  public app: Application;
  public container: Container;
  public arenaContainer: Container;
  public fxContainer: Container;
  public playerPokemonSprite!: Sprite;
  public enemyPokemonSprite!: Sprite;
  public playerShadow!: Graphics;
  public enemyShadow!: Graphics;
  public playerIdleTween: gsap.core.Tween | null = null;
  public enemyIdleTween: gsap.core.Tween | null = null;
  public speedMultiplier: SpeedMultiplier = 1;
  private lastMoveCategory: MoveCategory = 'Physical';

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.arenaContainer = new Container();
    this.fxContainer = new Container();
    this.container.addChild(this.arenaContainer);
    this.container.addChild(this.fxContainer);
    this.container.visible = false;
    this.app.stage.addChild(this.container);
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    this.playerIdleTween?.timeScale(speed);
    this.enemyIdleTween?.timeScale(speed);
  }

  public startIdleBreathing(sprite: Sprite, baseScale: number, isPlayer: boolean): void {
    if (isPlayer && this.playerIdleTween) {
      this.playerIdleTween.kill();
    } else if (!isPlayer && this.enemyIdleTween) {
      this.enemyIdleTween.kill();
    }

    const tween = gsap.to(sprite.scale, {
      x: baseScale * 1.03,
      y: baseScale * 0.96,
      duration: 0.75 / this.speedMultiplier,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });

    if (isPlayer) {
      this.playerIdleTween = tween;
    } else {
      this.enemyIdleTween = tween;
    }
  }

  private clearDisplayContainers(): void {
    gsap.killTweensOf(this.arenaContainer.children);
    gsap.killTweensOf(this.fxContainer.children);
    const oldArena = this.arenaContainer.removeChildren();
    for (let i = 0; i < oldArena.length; i++) {
      oldArena[i].destroy({ children: true, texture: false });
    }
    const oldFx = this.fxContainer.removeChildren();
    for (let i = 0; i < oldFx.length; i++) {
      oldFx[i].destroy({ children: true, texture: false });
    }
  }

  public async startBattle(playerPokemon: PokemonInstance, enemyPokemon: PokemonInstance): Promise<void> {
    this.container.visible = true;
    this.clearDisplayContainers();

    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const horizonY = Math.floor(height * 0.54);

    // 1. Draw Rich Layered Johto Arena Background
    const bg = new Graphics();

    // Sky bands (Classic Gen 3/4 upper sky to warm horizon gradient)
    bg.rect(0, 0, width, horizonY * 0.45);
    bg.fill({ color: 0x38bdf8 });
    bg.rect(0, horizonY * 0.45, width, horizonY * 0.35);
    bg.fill({ color: 0x7dd3fc });
    bg.rect(0, horizonY * 0.8, width, horizonY * 0.2);
    bg.fill({ color: 0xbae6fd });

    // Retro pixel clouds
    const drawCloud = (cx: number, cy: number, s: number) => {
      bg.ellipse(cx, cy, 46 * s, 16 * s);
      bg.ellipse(cx - 24 * s, cy + 4 * s, 28 * s, 12 * s);
      bg.ellipse(cx + 26 * s, cy + 4 * s, 30 * s, 12 * s);
      bg.fill({ color: 0xffffff, alpha: 0.88 });
    };
    drawCloud(width * 0.18, horizonY * 0.26, 1.0);
    drawCloud(width * 0.55, horizonY * 0.18, 1.25);
    drawCloud(width * 0.84, horizonY * 0.32, 0.9);

    // Distant Johto mountains & rolling hills
    bg.ellipse(width * 0.25, horizonY, width * 0.38, 75);
    bg.fill({ color: 0x4ade80 });
    bg.ellipse(width * 0.78, horizonY, width * 0.45, 92);
    bg.fill({ color: 0x22c55e });

    // Distant treeline silhouette along horizon
    for (let tx = 0; tx < width + 40; tx += 36) {
      const treeH = 22 + ((tx * 17) % 14);
      bg.circle(tx, horizonY - 4, treeH);
      bg.fill({ color: 0x15803d });
    }

    // Ground plane with classic horizontal perspective stripes
    bg.rect(0, horizonY, width, height - horizonY);
    bg.fill({ color: 0x4ade80 });
    for (let gy = horizonY + 12; gy < height; gy += 28) {
      bg.rect(0, gy, width, 12);
      bg.fill({ color: 0x22c55e, alpha: 0.45 });
    }

    // Enemy Bevelled Platform (Top Right)
    const enemyPlatformX = width * 0.72;
    const enemyPlatformY = height * 0.39;
    bg.ellipse(enemyPlatformX, enemyPlatformY + 7, 148, 46);
    bg.fill({ color: 0x14532d, alpha: 0.55 });
    bg.ellipse(enemyPlatformX, enemyPlatformY + 3, 144, 44);
    bg.fill({ color: 0x15803d });
    bg.ellipse(enemyPlatformX, enemyPlatformY, 138, 40);
    bg.fill({ color: 0x86efac });
    bg.stroke({ width: 3, color: 0x16a34a });
    bg.ellipse(enemyPlatformX, enemyPlatformY, 118, 32);
    bg.fill({ color: 0xbbf7d0 });

    // Player Bevelled Platform (Bottom Left)
    const playerPlatformX = width * 0.28;
    const playerPlatformY = height * 0.73;
    bg.ellipse(playerPlatformX, playerPlatformY + 9, 188, 58);
    bg.fill({ color: 0x14532d, alpha: 0.55 });
    bg.ellipse(playerPlatformX, playerPlatformY + 4, 184, 55);
    bg.fill({ color: 0x15803d });
    bg.ellipse(playerPlatformX, playerPlatformY, 176, 50);
    bg.fill({ color: 0x86efac });
    bg.stroke({ width: 3.5, color: 0x16a34a });
    bg.ellipse(playerPlatformX, playerPlatformY, 152, 41);
    bg.fill({ color: 0xbbf7d0 });

    this.arenaContainer.addChild(bg);

    // 2. Ground Drop Shadows under Pokémon
    this.enemyShadow = new Graphics();
    this.enemyShadow.ellipse(0, 0, 56, 15);
    this.enemyShadow.fill({ color: 0x0f172a, alpha: 0.32 });
    this.enemyShadow.position.set(enemyPlatformX, enemyPlatformY + 6);
    this.arenaContainer.addChild(this.enemyShadow);

    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 0, 74, 20);
    this.playerShadow.fill({ color: 0x0f172a, alpha: 0.32 });
    this.playerShadow.position.set(playerPlatformX, playerPlatformY + 10);
    this.arenaContainer.addChild(this.playerShadow);

    // 3. Load Pokémon Sprites
    const [enemyTex, playerTex] = await Promise.all([
      Assets.load<Texture>(`./assets/sprites/pokemon/${enemyPokemon.speciesId}_front.png`),
      Assets.load<Texture>(`./assets/sprites/pokemon/${playerPokemon.speciesId}_back.png`),
    ]);

    enemyTex.source.scaleMode = 'nearest';
    playerTex.source.scaleMode = 'nearest';

    // Enemy Sprite
    this.enemyPokemonSprite = new Sprite(enemyTex);
    this.enemyPokemonSprite.anchor.set(0.5, 1.0);
    this.enemyPokemonSprite.position.set(enemyPlatformX + 300, enemyPlatformY + 10);
    this.enemyPokemonSprite.scale.set(2.4, 2.4);
    this.arenaContainer.addChild(this.enemyPokemonSprite);

    // Player Sprite
    this.playerPokemonSprite = new Sprite(playerTex);
    this.playerPokemonSprite.anchor.set(0.5, 1.0);
    this.playerPokemonSprite.position.set(playerPlatformX - 300, playerPlatformY + 15);
    this.playerPokemonSprite.scale.set(3.2, 3.2);
    this.arenaContainer.addChild(this.playerPokemonSprite);

    // 4. Classic Encounter Flash + Shutter Wipe + Slide-In + Crystal 2-Frame Bounce
    const shutterTop = new Graphics();
    shutterTop.rect(0, 0, width, height / 2);
    shutterTop.fill({ color: 0x0f172a });
    const shutterBottom = new Graphics();
    shutterBottom.rect(0, height / 2, width, height / 2);
    shutterBottom.fill({ color: 0x0f172a });
    const whiteFlash = new Graphics();
    whiteFlash.rect(0, 0, width, height);
    whiteFlash.fill({ color: 0xffffff });

    this.fxContainer.addChild(shutterTop, shutterBottom, whiteFlash);

    const flashDur = 0.05 / this.speedMultiplier;
    const slideDur = 0.30 / this.speedMultiplier;

    await new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          this.fxContainer.removeChildren();
          this.startIdleBreathing(this.enemyPokemonSprite, 2.4, false);
          this.startIdleBreathing(this.playerPokemonSprite, 3.2, true);
          resolve();
        },
      });

      tl.to(whiteFlash, { alpha: 0, duration: flashDur, yoyo: true, repeat: 2 });
      tl.to(shutterTop, { y: -height / 2, duration: slideDur, ease: 'power2.inOut' }, 'wipe');
      tl.to(shutterBottom, { y: height / 2, duration: slideDur, ease: 'power2.inOut' }, 'wipe');
      tl.to(this.enemyPokemonSprite, { x: enemyPlatformX, duration: slideDur, ease: 'power2.out' }, 'wipe');
      tl.to(this.playerPokemonSprite, { x: playerPlatformX, duration: slideDur, ease: 'power2.out' }, 'wipe');

      tl.call(() => {
        BattleAudio.playCry(enemyPokemon.speciesId);
      });
      tl.to(this.enemyPokemonSprite, {
        y: enemyPlatformY - 8,
        duration: 0.065 / this.speedMultiplier,
        yoyo: true,
        repeat: 2,
        ease: 'power1.out',
      });
    });
  }

  /**
   * Animates a move with Physical lunge + crimson hit distinction vs Special cast pulse + projectile vector
   */
  public animateAttack(
    attackerIsPlayer: boolean,
    moveType: PokemonType = 'Normal',
    moveCategory: MoveCategory = 'Physical'
  ): Promise<void> {
    this.lastMoveCategory = moveCategory;
    BattleAudio.playMoveAttack(moveType, moveCategory);

    return new Promise((resolve) => {
      const attacker = attackerIsPlayer ? this.playerPokemonSprite : this.enemyPokemonSprite;
      const defender = attackerIsPlayer ? this.enemyPokemonSprite : this.playerPokemonSprite;
      const targetDeltaX = attackerIsPlayer ? 46 : -46;
      const targetDeltaY = attackerIsPlayer ? -24 : 24;
      const dur = 0.12 / this.speedMultiplier;

      if (moveCategory === 'Status') {
        gsap.to(attacker, {
          y: '-=12',
          duration: dur,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
          onComplete: () => resolve(),
        });
        return;
      }

      if (moveCategory === 'Physical') {
        // Physical move: Attacker lunges forcefully toward target
        gsap.to(attacker, {
          x: `+=${targetDeltaX}`,
          y: `+=${targetDeltaY}`,
          duration: dur,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        });
      } else {
        // Special move: Attacker pulses with elemental energy
        const baseScale = attackerIsPlayer ? 3.2 : 2.4;
        gsap.to(attacker.scale, {
          x: baseScale * 1.14,
          y: baseScale * 1.14,
          duration: dur,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        });
      }

      // Spawn Elemental Particle FX from attacker to defender
      const startX = attacker.x + (attackerIsPlayer ? 30 : -30);
      const startY = attacker.y - 45;
      const endX = defender.x;
      const endY = defender.y - 45;

      const colorMap: Partial<Record<PokemonType, number>> = {
        Fire: 0xf97316,
        Water: 0x38bdf8,
        Electric: 0xfacc15,
        Grass: 0x22c55e,
        Ice: 0x67e8f9,
        Psychic: 0xf472b6,
        Poison: 0xa855f7,
        Dark: 0x334155,
        Flying: 0x93c5fd,
        Normal: 0xf8fafc,
      };
      const fxColor = colorMap[moveType] ?? 0xf8fafc;

      const particleCount = moveCategory === 'Special' ? 6 : 4;
      const fxGroup = new Container();
      this.fxContainer.addChild(fxGroup);

      let completedCount = 0;
      for (let i = 0; i < particleCount; i++) {
        const p = new Graphics();
        if (moveType === 'Electric') {
          p.poly([-6, -12, 4, -2, -2, 2, 6, 12, -4, 2, 2, -2]);
          p.fill({ color: 0xfef08a });
          p.stroke({ width: 2, color: 0xeab308 });
        } else if (moveType === 'Grass') {
          p.ellipse(0, 0, 12, 5);
          p.fill({ color: 0x4ade80 });
          p.stroke({ width: 1.5, color: 0x15803d });
        } else if (moveType === 'Fire') {
          p.circle(0, 0, 11);
          p.fill({ color: 0xef4444 });
          p.circle(0, 0, 6);
          p.fill({ color: 0xfde047 });
        } else if (moveType === 'Water' || moveType === 'Ice') {
          p.circle(0, 0, 10);
          p.fill({ color: fxColor, alpha: 0.85 });
          p.stroke({ width: 2, color: 0xffffff });
        } else {
          p.star(0, 0, 5, 12, 5);
          p.fill({ color: fxColor });
          p.stroke({ width: 1.5, color: 0xfbbf24 });
        }

        if (moveCategory === 'Special') {
          p.position.set(startX, startY);
          const travelDur = (0.22 + i * 0.03) / this.speedMultiplier;
          gsap.to(p, {
            x: endX + (Math.random() - 0.5) * 44,
            y: endY + (Math.random() - 0.5) * 44,
            rotation: Math.PI * 2,
            duration: travelDur,
            ease: 'power1.in',
            onComplete: () => {
              completedCount++;
              if (completedCount === particleCount) {
                this.fxContainer.removeChild(fxGroup);
                resolve();
              }
            },
          });
        } else {
          p.position.set(endX, endY);
          const angle = (i / particleCount) * Math.PI * 2;
          const burstDur = 0.2 / this.speedMultiplier;
          gsap.to(p, {
            x: endX + Math.cos(angle) * 45,
            y: endY + Math.sin(angle) * 45,
            alpha: 0,
            scale: 1.4,
            duration: burstDur,
            ease: 'power2.out',
            onComplete: () => {
              completedCount++;
              if (completedCount === particleCount) {
                this.fxContainer.removeChild(fxGroup);
                resolve();
              }
            },
          });
        }
        fxGroup.addChild(p);
      }
    });
  }

  /**
   * Animates rising boost aura or falling drop aura on stat stage change
   */
  public animateStatChange(targetIsPlayer: boolean, isBoost: boolean): Promise<void> {
    BattleAudio.playStatChange(isBoost);

    return new Promise((resolve) => {
      const sprite = targetIsPlayer ? this.playerPokemonSprite : this.enemyPokemonSprite;
      const auraGroup = new Container();
      this.fxContainer.addChild(auraGroup);

      const color = isBoost ? 0x38bdf8 : 0xf43f5e;
      const count = 5;
      let finished = 0;

      for (let i = 0; i < count; i++) {
        const arrow = new Graphics();
        const dir = isBoost ? -1 : 1;
        arrow.poly([-8, 4 * dir, 0, -6 * dir, 8, 4 * dir]);
        arrow.fill({ color });

        const offsetX = (i - 2) * 20;
        const startY = sprite.y - (isBoost ? 15 : 85);
        arrow.position.set(sprite.x + offsetX, startY);
        auraGroup.addChild(arrow);

        gsap.to(arrow, {
          y: startY + (isBoost ? -55 : 55),
          alpha: 0,
          duration: (0.34 + i * 0.03) / this.speedMultiplier,
          ease: 'power1.out',
          onComplete: () => {
            finished++;
            if (finished === count) {
              this.fxContainer.removeChild(auraGroup);
              resolve();
            }
          },
        });
      }
    });
  }

  /**
   * Flashes damaged sprite (crimson 0xef4444 for Physical, bright white 0xffffff for Special / Super Effective)
   * and shakes screen & target horizontally scaled by effectiveness & critical hit (Ticket 3.9).
   */
  public animateDamage(
    targetIsPlayer: boolean,
    effectiveness: number = 1,
    isCritical: boolean = false,
    moveCategory: MoveCategory = this.lastMoveCategory
  ): Promise<void> {
    BattleAudio.playHitImpact(effectiveness, isCritical);
    const spec = EffectivenessHelper.getDamageShakeSpec(effectiveness, isCritical, moveCategory);

    return new Promise((resolve) => {
      const sprite = targetIsPlayer ? this.playerPokemonSprite : this.enemyPokemonSprite;
      const originX = sprite.x;
      const scaledShakeDur = spec.durationSec / this.speedMultiplier;
      const stepDur = scaledShakeDur / 4;

      // Apply Physical crimson tint (0xef4444) or Special/Crit white flash
      sprite.tint = moveCategory === 'Physical' ? 0xef4444 : spec.flashTint;

      if (spec.screenWhiteFlash) {
        const flashOverlay = new Graphics();
        flashOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
        flashOverlay.fill({ color: 0xffffff, alpha: 0.45 });
        this.fxContainer.addChild(flashOverlay);
        gsap.to(flashOverlay, {
          alpha: 0,
          duration: (0.12 / this.speedMultiplier),
          onComplete: () => {
            this.fxContainer.removeChild(flashOverlay);
          },
        });
      }

      // Arena & Target Horizontal Shake scaled by effectiveness (2px / 4px / 8px)
      gsap.to(this.arenaContainer, {
        x: spec.amplitude,
        y: spec.amplitude * 0.4,
        duration: stepDur,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.arenaContainer.position.set(0, 0);
        },
      });

      gsap.to(sprite, {
        x: originX + spec.amplitude,
        alpha: 0.25,
        duration: stepDur,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          sprite.x = originX;
          sprite.alpha = 1;
          sprite.tint = 0xffffff;
          resolve();
        },
      });
    });
  }

  /**
   * Sends out the next Pokémon (player or trainer foe) with a parabolic Pokéball toss,
   * expanding radial light/particle burst, authentic emergence scale-up, and cry (Ticket 5.5).
   */
  public async animateSendOutNextPokemon(
    targetIsPlayer: boolean,
    newPokemon: PokemonInstance
  ): Promise<void> {
    return runSendOutNextPokemon(this, targetIsPlayer, newPokemon);
  }

  /**
   * Animates switching out current player Pokémon (crimson/white recall beam)
   * and sending in a new party member via Pokéball arc & light burst (Ticket 5.5).
   */
  public async animateSwitchPlayerPokemon(newPokemon: PokemonInstance): Promise<void> {
    return runSwitchPlayerPokemon(this, newPokemon);
  }

  public animateFaint(targetIsPlayer: boolean): Promise<void> {
    return runFaint(this, targetIsPlayer);
  }

  /**
   * Throws an authentic custom-styled Pokéball along a parabolic arc (Ticket 3.9).
   */
  public async animateThrowBall(ballId: PokeballId | string = 'poke-ball'): Promise<Graphics> {
    return runThrowBall(this, ballId);
  }

  public animateShake(ball: Graphics, shakes: 0 | 1 | 2 | 3 | 4, caught: boolean): Promise<void> {
    return runShake(this, ball, shakes, caught);
  }

  public endBattle(): void {
    if (this.playerIdleTween) {
      this.playerIdleTween.kill();
      this.playerIdleTween = null;
    }
    if (this.enemyIdleTween) {
      this.enemyIdleTween.kill();
      this.enemyIdleTween = null;
    }
    this.container.visible = false;
    this.clearDisplayContainers();
  }
}
