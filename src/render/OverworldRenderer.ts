import { Application, Container, Sprite, Texture, Rectangle, Assets } from 'pixi.js';
import type { MapData, Direction } from '../types/game';
import type { GridEntity } from '../world/GridPhysics';

interface CharacterFrames {
  downStand: Texture;
  downWalk1: Texture;
  downWalk2: Texture;
  upStand: Texture;
  upWalk1: Texture;
  upWalk2: Texture;
  sideStand: Texture;
  sideWalk1: Texture;
  sideWalk2: Texture;
}

export class OverworldRenderer {
  public app!: Application;
  private stageContainer!: Container;
  private mapContainer!: Container;
  private entityContainer!: Container;
  private playerSprite!: Sprite;
  private npcSprites: Map<string, Sprite> = new Map();
  private tileSize: number = 64;

  // Textures
  private tileTextures: Map<string, Texture> = new Map();
  private playerFrames!: CharacterFrames;
  private npcBoyFrames!: CharacterFrames;

  public async init(containerElement: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      resizeTo: containerElement,
      backgroundColor: 0x0f172a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false, // Crisp pixel art
    });

    containerElement.appendChild(this.app.canvas);

    this.stageContainer = new Container();
    this.mapContainer = new Container();
    this.entityContainer = new Container();

    this.stageContainer.addChild(this.mapContainer);
    this.stageContainer.addChild(this.entityContainer);
    this.app.stage.addChild(this.stageContainer);

    await this.loadAssets();
    this.createPlayerSprite();
  }

  private async loadAssets(): Promise<void> {
    // 1. Load tiles
    const tileNames = [
      'grass',
      'tall_grass',
      'tree_tall_0',
      'tree_tall_1',
      'tree_short_0',
      'path',
      'path_gravel',
      'water',
      'water_edge',
      'water_shore_n',
      'water_shore_w',
      'water_shore_nw',
      'flower_0',
      'flower_1',
      'flower_red',
      'flower_yellow',
      'roof',
      'wall',
      'door',
      'sign',
      'sign_town',
      'sign_lab',
      'mailbox',
      'fence_horizontal',
      'house_roof_tl',
      'house_roof_top',
      'house_roof_tr',
      'house_roof_front_l',
      'house_roof_front_m',
      'house_roof_front_r',
      'house_wall',
      'house_window',
      'house_door',
      'lab_roof_tl',
      'lab_roof_top',
      'lab_roof_tr',
      'lab_roof_front_l',
      'lab_roof_front_m',
      'lab_roof_front_r',
      'lab_wall',
      'lab_window',
      'lab_door',
      // 66 Authentic pret/pokecrystal 64x64 Johto quadrant tiles
      'jt_03_05_05_05',
      'jt_04_04_04_04',
      'jt_05_05_05_03',
      'jt_05_05_05_05',
      'jt_05_05_4c_4c',
      'jt_05_3d_05_3d',
      'jt_05_3d_4c_4d',
      'jt_06_06_06_06',
      'jt_07_07_02_02',
      'jt_07_07_07_07',
      'jt_07_07_07_26',
      'jt_07_1c_02_16',
      'jt_07_1c_07_1c',
      'jt_07_1c_26_1c',
      'jt_08_09_17_17',
      'jt_0d_0e_0a_0b_cg',
      'jt_0d_0e_0a_0b_nb',
      'jt_0e_0e_0b_0b_cg',
      'jt_0e_0e_0b_0b_nb',
      'jt_0e_0f_0b_0c_cg',
      'jt_0e_0f_0b_0c_nb',
      'jt_10_11_0a_0b_cg',
      'jt_10_11_0a_0b_nb',
      'jt_10_11_0d_0e_cg',
      'jt_10_11_0d_0e_nb',
      'jt_11_11_0b_0b_cg',
      'jt_11_11_0b_0b_nb',
      'jt_11_11_0e_0e_cg',
      'jt_11_11_0e_0e_nb',
      'jt_11_12_0b_0c_cg',
      'jt_11_12_0b_0c_nb',
      'jt_11_12_0e_0f_cg',
      'jt_11_12_0e_0f_nb',
      'jt_13_15_45_1d',
      'jt_14_14_14_14',
      'jt_14_3b_14_3b',
      'jt_14_4b_14_14',
      'jt_18_19_17_17',
      'jt_1a_07_01_02',
      'jt_1a_07_1a_07',
      'jt_1a_1b_01_02',
      'jt_1a_1b_1a_1b',
      'jt_1a_1b_1a_26',
      'jt_1b_1b_02_02',
      'jt_1b_1b_1b_1b',
      'jt_1b_1b_1b_26',
      'jt_1b_1b_26_1b',
      'jt_1b_1c_02_16',
      'jt_1b_1c_26_1c',
      'jt_1e_1f_2e_2f',
      'jt_1e_1f_3e_3f',
      'jt_2b_2c_3b_3c',
      'jt_2c_2d_3c_3d',
      'jt_2e_2f_3e_3f',
      'jt_37_38_39_3a',
      'jt_3b_05_3b_05',
      'jt_3b_05_4b_4c',
      'jt_3b_3c_4b_4c',
      'jt_3c_3c_3c_3c',
      'jt_3c_3d_4c_4d',
      'jt_3d_14_3d_14',
      'jt_4c_4c_14_14',
      'jt_4d_14_14_14',
      'jt_4e_4f_5e_5f',
      'jt_58_58_58_58',
      'jt_5c_4c_3d_14',
    ];

    for (const name of tileNames) {
      try {
        const tex = await Assets.load<Texture>(`/assets/tiles/${name}.png`);
        tex.source.scaleMode = 'nearest';
        this.tileTextures.set(name, tex);
      } catch (err) {
        console.warn(`Could not load tile ${name}:`, err);
      }
    }

    // 2. Load character sheets (144x32 -> 9 frames of 16x32)
    const goldWalkTex = await Assets.load<Texture>('/assets/sprites/characters/gold_walk.png');
    goldWalkTex.source.scaleMode = 'nearest';
    this.playerFrames = this.extractCharacterFrames(goldWalkTex);

    const npcBoyTex = await Assets.load<Texture>('/assets/sprites/characters/npc_boy.png');
    npcBoyTex.source.scaleMode = 'nearest';
    this.npcBoyFrames = this.extractCharacterFrames(npcBoyTex);
  }

  private extractCharacterFrames(sheet: Texture): CharacterFrames {
    const fw = 16;
    const fh = 32;

    const getFrame = (idx: number) => {
      return new Texture({
        source: sheet.source,
        frame: new Rectangle(idx * fw, 0, fw, fh),
      });
    };

    return {
      // Confirmed layout from raw pixel inspection:
      // Indices 0, 1, 2: Stand frames (Down, Up, Side)
      // Indices 3, 4: Down Walk frames (Left foot, Right foot)
      // Indices 5, 6: Up Walk frames (Left foot, Right foot)
      // Indices 7, 8: Side Walk frames (Left foot, Right foot)
      downStand: getFrame(0),
      upStand: getFrame(1),
      sideStand: getFrame(2),
      downWalk1: getFrame(3),
      downWalk2: getFrame(4),
      upWalk1: getFrame(5),
      upWalk2: getFrame(6),
      sideWalk1: getFrame(7),
      sideWalk2: getFrame(8),
    };
  }

  private createPlayerSprite(): void {
    this.playerSprite = new Sprite(this.playerFrames.downStand);
    this.playerSprite.anchor.set(0.5, 0.85);
    // Scale 16x32 up to 48x96 (3x nearest-neighbor)
    this.playerSprite.scale.set(3, 3);
    this.entityContainer.addChild(this.playerSprite);
  }

  /**
   * Builds the textured overworld tilemap
   */
  public renderMap(map: MapData): void {
    this.mapContainer.removeChildren();
    this.tileSize = map.tileSize;

    const grassTex = this.tileTextures.get('grass') || Texture.WHITE;
    const tallGrassTex = this.tileTextures.get('tall_grass') || grassTex;
    const pathTex = this.tileTextures.get('path') || grassTex;
    const waterTex = this.tileTextures.get('water') || Texture.WHITE;
    const treeTallTex = this.tileTextures.get('tree_tall_0') || Texture.WHITE;
    const treeShortTex = this.tileTextures.get('tree_short_0') || treeTallTex;
    const roofTex = this.tileTextures.get('roof') || treeTallTex;
    const wallTex = this.tileTextures.get('wall') || treeTallTex;
    const doorTex = this.tileTextures.get('door') || pathTex;
    const flowerTex = this.tileTextures.get('flower_0') || grassTex;

    // 1. High-fidelity authentic TileMap rendering if defined
    if (map.tileMap && map.tileMap.length === map.width * map.height) {
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const index = y * map.width + x;
          const tileName = map.tileMap[index];
          const px = x * this.tileSize;
          const py = y * this.tileSize;

          // Authentic jt_* tiles are complete opaque 64x64 GBC quadrants; legacy tiles render over grass
          const isOpaqueTile = tileName === 'water' || tileName.startsWith('jt_');
          if (!isOpaqueTile) {
            const baseSprite = new Sprite(grassTex);
            baseSprite.position.set(px, py);
            baseSprite.width = this.tileSize;
            baseSprite.height = this.tileSize;
            this.mapContainer.addChild(baseSprite);
          }

          const tex = this.tileTextures.get(tileName) || grassTex;
          const featureSprite = new Sprite(tex);
          featureSprite.position.set(px, py);
          featureSprite.width = this.tileSize;
          featureSprite.height = this.tileSize;
          this.mapContainer.addChild(featureSprite);

          if (map.overlayMap && map.overlayMap[index]) {
            const overlayTex = this.tileTextures.get(map.overlayMap[index]!);
            if (overlayTex) {
              const overlaySprite = new Sprite(overlayTex);
              overlaySprite.position.set(px, py);
              overlaySprite.width = this.tileSize;
              overlaySprite.height = this.tileSize;
              this.mapContainer.addChild(overlaySprite);
            }
          }
        }
      }
      return;
    }

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const collision = map.collisionGrid[index];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        // Base ground sprite (always render grass underneath)
        const baseSprite = new Sprite(grassTex);
        baseSprite.position.set(px, py);
        baseSprite.width = this.tileSize;
        baseSprite.height = this.tileSize;
        this.mapContainer.addChild(baseSprite);

        // Feature sprite
        if (collision === 1) {
          // Solid: Buildings, Roofs, Walls, or Trees
          let tex = treeTallTex;
          if (map.id === 'new_bark_town' || map.id === 'cherrygrove_city') {
            // Building areas in towns
            if (y >= 2 && y <= 3 && ((x >= 2 && x <= 3) || (x >= 11 && x <= 13))) {
              tex = roofTex;
            } else if (y === 4 && ((x >= 2 && x <= 3) || (x >= 11 && x <= 13))) {
              tex = wallTex;
            } else if ((x === 5 || x === 6) && (y === 5 || y === 6)) {
              tex = treeShortTex;
            }
          }
          const featureSprite = new Sprite(tex);
          featureSprite.position.set(px, py);
          featureSprite.width = this.tileSize;
          featureSprite.height = this.tileSize;
          this.mapContainer.addChild(featureSprite);
        } else if (collision === 2) {
          // Tall Grass
          const grassOverlay = new Sprite(tallGrassTex);
          grassOverlay.position.set(px, py);
          grassOverlay.width = this.tileSize;
          grassOverlay.height = this.tileSize;
          this.mapContainer.addChild(grassOverlay);
        } else if (collision === 3) {
          // Water
          const waterSprite = new Sprite(waterTex);
          waterSprite.position.set(px, py);
          waterSprite.width = this.tileSize;
          waterSprite.height = this.tileSize;
          this.mapContainer.addChild(waterSprite);
        } else {
          // Walkable ground (0): Path, Flowers, or Doors
          if (map.warps.some((w) => w.x === x && w.y === y)) {
            const doorSprite = new Sprite(doorTex);
            doorSprite.position.set(px, py);
            doorSprite.width = this.tileSize;
            doorSprite.height = this.tileSize;
            this.mapContainer.addChild(doorSprite);
          } else if (
            // Path detection
            (map.id === 'route_29' && (y === 4 || y === 5)) ||
            (map.id === 'new_bark_town' && (y === 6 || y === 7 || x === 8))
          ) {
            const pathSprite = new Sprite(pathTex);
            pathSprite.position.set(px, py);
            pathSprite.width = this.tileSize;
            pathSprite.height = this.tileSize;
            this.mapContainer.addChild(pathSprite);
          } else if ((x + y * 7) % 11 === 0) {
            // Scattered flowers
            const flowerSprite = new Sprite(flowerTex);
            flowerSprite.position.set(px, py);
            flowerSprite.width = this.tileSize;
            flowerSprite.height = this.tileSize;
            this.mapContainer.addChild(flowerSprite);
          }
        }
      }
    }
  }

  /**
   * Helper to pick current walking animation frame
   */
  private getFrameForEntity(frames: CharacterFrames, dir: Direction, isMoving: boolean, progress: number): Texture {
    if (!isMoving) {
      switch (dir) {
        case 'UP':
          return frames.upStand;
        case 'DOWN':
          return frames.downStand;
        case 'LEFT':
        case 'RIGHT':
          return frames.sideStand;
      }
    }

    // Walking animation cycle (Step 1 -> Stand -> Step 2 -> Stand)
    const step = Math.floor((progress * 4) % 4);
    switch (dir) {
      case 'UP':
        if (step === 0) return frames.upWalk1;
        if (step === 2) return frames.upWalk2;
        return frames.upStand;
      case 'DOWN':
        if (step === 0) return frames.downWalk1;
        if (step === 2) return frames.downWalk2;
        return frames.downStand;
      case 'LEFT':
      case 'RIGHT':
        if (step === 0) return frames.sideWalk1;
        if (step === 2) return frames.sideWalk2;
        return frames.sideStand;
    }
  }

  /**
   * Updates player & NPC sprite animations and centers camera smoothly
   */
  public update(player: GridEntity, npcs: GridEntity[] = []): void {
    const scale = 3;

    // 1. Update Player
    const playerPxX = (player.renderX + 0.5) * this.tileSize;
    const playerPxY = (player.renderY + 0.85) * this.tileSize;
    this.playerSprite.position.set(playerPxX, playerPxY);

    const playerTex = this.getFrameForEntity(this.playerFrames, player.direction, player.isMoving, player.progress);
    this.playerSprite.texture = playerTex;

    // Raw side frames naturally face LEFT; mirror horizontally for RIGHT
    if (player.direction === 'RIGHT') {
      this.playerSprite.scale.set(-scale, scale);
    } else {
      this.playerSprite.scale.set(scale, scale);
    }

    // 2. Update NPCs (Zero-allocation visibility pass)
    for (const sprite of this.npcSprites.values()) {
      sprite.visible = false;
    }

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      let sprite = this.npcSprites.get(npc.id);
      if (!sprite) {
        sprite = new Sprite(this.npcBoyFrames.downStand);
        sprite.anchor.set(0.5, 0.85);
        sprite.scale.set(scale, scale);
        this.entityContainer.addChild(sprite);
        this.npcSprites.set(npc.id, sprite);
      }
      sprite.visible = true;

      const npcPxX = (npc.renderX + 0.5) * this.tileSize;
      const npcPxY = (npc.renderY + 0.85) * this.tileSize;
      sprite.position.set(npcPxX, npcPxY);

      const npcTex = this.getFrameForEntity(this.npcBoyFrames, npc.direction, npc.isMoving, npc.progress);
      sprite.texture = npcTex;

      if (npc.direction === 'RIGHT') {
        sprite.scale.set(-scale, scale);
      } else {
        sprite.scale.set(scale, scale);
      }
    }

    // 3. Smooth Camera Centering
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    const cameraTargetX = screenWidth / 2 - (player.renderX + 0.5) * this.tileSize;
    const cameraTargetY = screenHeight / 2 - (player.renderY + 0.5) * this.tileSize;

    this.stageContainer.position.set(cameraTargetX, cameraTargetY);
  }
}
