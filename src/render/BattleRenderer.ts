import { Application, Container, Sprite, Texture, Assets, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { PokemonInstance, SpeedMultiplier } from '../types/game';

export class BattleRenderer {
  public app: Application;
  public container: Container;
  private arenaContainer: Container;
  private playerPokemonSprite!: Sprite;
  private enemyPokemonSprite!: Sprite;
  private speedMultiplier: SpeedMultiplier = 1;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.arenaContainer = new Container();
    this.container.addChild(this.arenaContainer);
    this.container.visible = false;
    this.app.stage.addChild(this.container);
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
  }

  public async startBattle(playerPokemon: PokemonInstance, enemyPokemon: PokemonInstance): Promise<void> {
    this.container.visible = true;
    this.arenaContainer.removeChildren();

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // 1. Draw Arena Background (Vibrant outdoor grass arena)
    const bg = new Graphics();
    // Sky
    bg.rect(0, 0, width, height * 0.6);
    bg.fill({ color: 0x60a5fa });
    // Distant hills
    bg.ellipse(width * 0.3, height * 0.6, width * 0.4, 80);
    bg.fill({ color: 0x4ade80 });
    bg.ellipse(width * 0.8, height * 0.6, width * 0.5, 100);
    bg.fill({ color: 0x22c55e });
    // Ground
    bg.rect(0, height * 0.6, width, height * 0.4);
    bg.fill({ color: 0x15803d });

    // Enemy Platform (Top Right)
    const enemyPlatformX = width * 0.72;
    const enemyPlatformY = height * 0.38;
    bg.ellipse(enemyPlatformX, enemyPlatformY, 140, 45);
    bg.fill({ color: 0x86efac });
    bg.stroke({ width: 3, color: 0x16a34a });

    // Player Platform (Bottom Left)
    const playerPlatformX = width * 0.28;
    const playerPlatformY = height * 0.72;
    bg.ellipse(playerPlatformX, playerPlatformY, 180, 55);
    bg.fill({ color: 0x86efac });
    bg.stroke({ width: 3, color: 0x16a34a });

    this.arenaContainer.addChild(bg);

    // 2. Load Pokémon Sprites
    const [enemyTex, playerTex] = await Promise.all([
      Assets.load<Texture>(`/assets/sprites/pokemon/${enemyPokemon.speciesId}_front.png`),
      Assets.load<Texture>(`/assets/sprites/pokemon/${playerPokemon.speciesId}_back.png`),
    ]);

    enemyTex.source.scaleMode = 'nearest';
    playerTex.source.scaleMode = 'nearest';

    // Enemy Sprite
    this.enemyPokemonSprite = new Sprite(enemyTex);
    this.enemyPokemonSprite.anchor.set(0.5, 1.0);
    this.enemyPokemonSprite.position.set(enemyPlatformX, enemyPlatformY + 10);
    this.enemyPokemonSprite.scale.set(2.4, 2.4);
    this.arenaContainer.addChild(this.enemyPokemonSprite);

    // Player Sprite
    this.playerPokemonSprite = new Sprite(playerTex);
    this.playerPokemonSprite.anchor.set(0.5, 1.0);
    this.playerPokemonSprite.position.set(playerPlatformX, playerPlatformY + 15);
    this.playerPokemonSprite.scale.set(3.2, 3.2);
    this.arenaContainer.addChild(this.playerPokemonSprite);

    // Entrance Slide Animation
    const dur = 0.5 / this.speedMultiplier;
    this.enemyPokemonSprite.x += 300;
    this.playerPokemonSprite.x -= 300;

    gsap.to(this.enemyPokemonSprite, { x: enemyPlatformX, duration: dur, ease: 'power2.out' });
    gsap.to(this.playerPokemonSprite, { x: playerPlatformX, duration: dur, ease: 'power2.out' });
  }

  public animateAttack(attackerIsPlayer: boolean): Promise<void> {
    return new Promise((resolve) => {
      const sprite = attackerIsPlayer ? this.playerPokemonSprite : this.enemyPokemonSprite;
      const targetDeltaX = attackerIsPlayer ? 40 : -40;
      const targetDeltaY = attackerIsPlayer ? -20 : 20;
      const dur = 0.12 / this.speedMultiplier;

      gsap.to(sprite, {
        x: `+=${targetDeltaX}`,
        y: `+=${targetDeltaY}`,
        duration: dur,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
        onComplete: () => resolve(),
      });
    });
  }

  public animateDamage(targetIsPlayer: boolean): Promise<void> {
    return new Promise((resolve) => {
      const sprite = targetIsPlayer ? this.playerPokemonSprite : this.enemyPokemonSprite;
      const dur = 0.06 / this.speedMultiplier;

      gsap.to(sprite, {
        alpha: 0.2,
        duration: dur,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          sprite.alpha = 1;
          resolve();
        },
      });
    });
  }

  public animateFaint(targetIsPlayer: boolean): Promise<void> {
    return new Promise((resolve) => {
      const sprite = targetIsPlayer ? this.playerPokemonSprite : this.enemyPokemonSprite;
      const dur = 0.3 / this.speedMultiplier;

      gsap.to(sprite, {
        y: '+=60',
        alpha: 0,
        duration: dur,
        ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }

  public endBattle(): void {
    this.container.visible = false;
    this.arenaContainer.removeChildren();
  }
}
