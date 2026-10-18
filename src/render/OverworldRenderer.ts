import { Application, Container, Graphics } from 'pixi.js';
import type { MapData } from '../types/game';
import type { GridEntity } from '../world/GridPhysics';

export class OverworldRenderer {
  public app!: Application;
  private stageContainer!: Container;
  private mapContainer!: Container;
  private entityContainer!: Container;
  private playerGraphic!: Graphics;
  private npcGraphics: Map<string, Graphics> = new Map();
  private tileSize: number = 64;

  public async init(containerElement: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      resizeTo: containerElement,
      backgroundColor: 0x0f172a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    containerElement.appendChild(this.app.canvas);

    this.stageContainer = new Container();
    this.mapContainer = new Container();
    this.entityContainer = new Container();

    this.stageContainer.addChild(this.mapContainer);
    this.stageContainer.addChild(this.entityContainer);
    this.app.stage.addChild(this.stageContainer);

    this.createPlayerGraphic();
  }

  private createPlayerGraphic(): void {
    this.playerGraphic = new Graphics();
    this.entityContainer.addChild(this.playerGraphic);
    this.drawPlayerCharacter('DOWN');
  }

  private drawPlayerCharacter(direction: string): void {
    this.playerGraphic.clear();

    const size = this.tileSize;
    const padding = size * 0.15;
    const radius = (size - padding * 2) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    // Shadow
    this.playerGraphic.ellipse(centerX, size - 10, radius * 0.8, 6);
    this.playerGraphic.fill({ color: 0x000000, alpha: 0.3 });

    // Body (Gold / Ethan inspired red jacket & blue pants)
    this.playerGraphic.circle(centerX, centerY - 2, radius);
    this.playerGraphic.fill({ color: 0xdc2626 }); // Red cap/jacket
    this.playerGraphic.stroke({ width: 3, color: 0x991b1b });

    // Direction visor / eye indicator
    let eyeX = centerX;
    let eyeY = centerY - 4;
    switch (direction) {
      case 'UP':
        eyeY -= 8;
        break;
      case 'DOWN':
        eyeY += 8;
        break;
      case 'LEFT':
        eyeX -= 8;
        break;
      case 'RIGHT':
        eyeX += 8;
        break;
    }

    this.playerGraphic.circle(eyeX, eyeY, 5);
    this.playerGraphic.fill({ color: 0xffffff });
    this.playerGraphic.circle(eyeX, eyeY, 2.5);
    this.playerGraphic.fill({ color: 0x1e293b });
  }

  /**
   * Rebuilds the visual tile representation for the current map
   */
  public renderMap(map: MapData): void {
    this.mapContainer.removeChildren();
    this.tileSize = map.tileSize;

    const g = new Graphics();

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const collision = map.collisionGrid[index];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        // Base tile
        if (collision === 1) {
          // Solid Tree / Mountain / Building
          g.rect(px, py, this.tileSize, this.tileSize);
          g.fill({ color: 0x1e3a1e }); // Deep forest green
          g.stroke({ width: 1, color: 0x142814 });

          // Tree canopy detail
          g.circle(px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize * 0.38);
          g.fill({ color: 0x2d5a27 });
        } else if (collision === 2) {
          // Tall Grass (encounter zone)
          g.rect(px, py, this.tileSize, this.tileSize);
          g.fill({ color: 0x4d7c0f }); // Vibrant grass green
          g.stroke({ width: 1, color: 0x3f6212 });

          // Grass blade texture hints
          g.rect(px + 12, py + 14, 8, 20);
          g.fill({ color: 0x65a30d });
          g.rect(px + 36, py + 26, 8, 24);
          g.fill({ color: 0x65a30d });
          g.rect(px + 24, py + 34, 8, 16);
          g.fill({ color: 0x65a30d });
        } else if (collision === 3) {
          // Water
          g.rect(px, py, this.tileSize, this.tileSize);
          g.fill({ color: 0x0284c7 });
          g.stroke({ width: 1, color: 0x0369a1 });

          // Water ripple
          g.rect(px + 16, py + 20, 24, 4);
          g.fill({ color: 0x38bdf8, alpha: 0.7 });
        } else {
          // Walkable Path / Normal Ground (0)
          g.rect(px, py, this.tileSize, this.tileSize);
          g.fill({ color: 0xd6c49e }); // Path beige
          g.stroke({ width: 1, color: 0xc4b28c, alpha: 0.5 });
        }
      }
    }

    this.mapContainer.addChild(g);
  }

  /**
   * Updates player sprite position & camera smoothly without allocating new objects
   */
  public update(player: GridEntity, npcs: GridEntity[] = []): void {
    // 1. Update player position & facing
    const playerPixelX = player.renderX * this.tileSize;
    const playerPixelY = player.renderY * this.tileSize;
    this.playerGraphic.position.set(playerPixelX, playerPixelY);
    this.drawPlayerCharacter(player.direction);

    // 2. Update NPCs
    for (const npc of npcs) {
      let g = this.npcGraphics.get(npc.id);
      if (!g) {
        g = new Graphics();
        this.entityContainer.addChild(g);
        this.npcGraphics.set(npc.id, g);
      }
      g.clear();
      const nSize = this.tileSize;
      const nPx = npc.renderX * nSize;
      const nPy = npc.renderY * nSize;
      g.position.set(nPx, nPy);

      // Simple friendly NPC sprite
      g.circle(nSize / 2, nSize / 2, nSize * 0.35);
      g.fill({ color: 0x3b82f6 }); // Blue outfit
      g.stroke({ width: 2, color: 0x1d4ed8 });
    }

    // 3. Smooth Camera centering on player
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    const cameraTargetX = screenWidth / 2 - playerPixelX - this.tileSize / 2;
    const cameraTargetY = screenHeight / 2 - playerPixelY - this.tileSize / 2;

    this.stageContainer.position.set(cameraTargetX, cameraTargetY);
  }
}
