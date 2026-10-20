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
  private waterAnimFrames: Map<string, [Texture, Texture, Texture, Texture]> = new Map();
  private animatedWaterSprites: Array<{ sprite: Sprite; frames: [Texture, Texture, Texture, Texture] }> = [];
  private waterAnimTimer: number = 0;
  private waterAnimStep: number = 0;
  private playerFrames!: CharacterFrames;
  private npcBoyFrames!: CharacterFrames;
  private npcGirlFrames!: CharacterFrames;
  private npcFatManFrames!: CharacterFrames;
  private npcKrisFrames!: CharacterFrames;

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
      // 184 Authentic pret/pokecrystal 64x64 Overworld (jt_*) & Indoor (in_*) quadrant tiles
      'in_house_00_00_00_00',
      'in_house_00_00_06_07',
      'in_house_00_00_0c_0d',
      'in_house_01_01_01_01',
      'in_house_02_03_12_13',
      'in_house_04_04_14_14',
      'in_house_05_2f_3c_3a',
      'in_house_0a_0b_08_09',
      'in_house_0e_0f_1e_1f',
      'in_house_0e_0f_3c_3b',
      'in_house_16_17_1e_1f',
      'in_house_1a_1b_18_19',
      'in_house_1c_1d_1e_1f',
      'in_house_24_4a_34_2c',
      'in_house_26_27_36_2f',
      'in_house_27_29_2f_39',
      'in_house_2d_2e_3d_3e',
      'in_house_2f_15_3a_3b',
      'in_house_32_33_0e_0f',
      'in_house_32_33_30_31',
      'in_lab_01_01_11_11',
      'in_lab_02_02_12_12',
      'in_lab_03_04_13_14',
      'in_lab_05_06_15_16',
      'in_lab_05_07_03_04',
      'in_lab_06_06_16_16',
      'in_lab_06_07_16_17',
      'in_lab_0a_0b_1a_1b',
      'in_lab_0c_0d_1c_1d',
      'in_lab_0e_0f_1e_1f',
      'in_lab_10_10_10_10',
      'in_lab_10_10_81_82',
      'in_lab_20_21_30_31',
      'in_lab_22_23_32_33',
      'in_lab_25_26_10_10',
      'in_lab_26_26_10_10',
      'in_lab_26_27_10_10',
      'in_lab_42_43_52_53',
      'in_lab_44_45_54_55',
      'in_lab_46_47_56_57',
      'in_lab_47_49_58_59',
      'in_lab_85_86_83_84',
      'in_lab_91_92_a1_a2',
      'in_lab_93_94_a3_a4',
      'in_mart_0b_0b_1b_1b',
      'in_mart_0c_0d_50_51',
      'in_mart_0c_0d_56_57',
      'in_mart_11_11_2a_2b',
      'in_mart_1e_2f_1a_19',
      'in_mart_20_21_30_31',
      'in_mart_26_27_36_37',
      'in_mart_28_29_38_39',
      'in_mart_3e_3f_3e_3f',
      'in_mart_40_41_50_51',
      'in_mart_42_2b_52_45',
      'in_mart_43_44_53_54',
      'in_mart_48_48_48_48',
      'in_mart_50_51_5e_5f',
      'in_mart_58_59_5a_5b',
      'in_mart_5c_5d_1f_55',
      'in_players_house_01_01_01_01',
      'in_players_house_02_03_12_13',
      'in_players_house_04_04_14_14',
      'in_players_house_05_05_05_05',
      'in_players_house_06_07_16_17',
      'in_players_house_08_09_3a_3b',
      'in_players_house_0e_0f_1e_1f',
      'in_players_house_0e_0f_2e_2f',
      'in_players_house_0e_0f_3a_3b',
      'in_players_house_11_11_06_07',
      'in_players_house_11_11_0a_0b',
      'in_players_house_11_11_11_11',
      'in_players_house_11_11_20_21',
      'in_players_house_15_35_32_34',
      'in_players_house_16_17_08_09',
      'in_players_house_1a_1b_2a_2b',
      'in_players_house_1c_1d_01_01',
      'in_players_house_1c_40_01_01',
      'in_players_house_22_24_15_35',
      'in_players_house_23_22_25_15',
      'in_players_house_25_15_33_32',
      'in_players_house_25_35_25_35',
      'in_players_house_25_35_33_34',
      'in_players_house_26_27_36_37',
      'in_players_house_28_29_38_39',
      'in_players_house_2c_2d_11_11',
      'in_players_house_2e_2f_18_19',
      'in_players_house_30_31_0c_0d',
      'in_players_house_32_34_11_11',
      'in_players_house_33_32_11_11',
      'in_players_house_40_1d_01_01',
      'in_players_house_43_45_18_19',
      'in_players_house_44_44_44_44',
      'in_players_house_48_49_58_59',
      'in_players_house_4a_4b_5a_5b',
      'in_players_house_4c_4d_5c_5d',
      'in_players_house_50_51_52_53',
      'in_players_house_aa_ab_ba_00',
      'in_pokecenter_01_01_11_11',
      'in_pokecenter_01_0f_03_25',
      'in_pokecenter_02_02_02_02',
      'in_pokecenter_02_02_02_0f',
      'in_pokecenter_02_02_20_21',
      'in_pokecenter_04_05_14_15',
      'in_pokecenter_0a_0b_1a_1b',
      'in_pokecenter_0c_0c_24_24',
      'in_pokecenter_11_11_11_11',
      'in_pokecenter_13_35_46_47',
      'in_pokecenter_1c_1d_2c_2d',
      'in_pokecenter_1e_1f_2e_2f',
      'in_pokecenter_30_31_40_41',
      'in_pokecenter_34_0c_24_24',
      'in_pokecenter_34_34_24_24',
      'in_pokecenter_3c_3d_4c_4d',
      'in_pokecenter_3d_3f_4e_4f',
      'in_pokecenter_44_45_54_55',
      'in_pokecenter_48_49_58_59',
      'in_pokecenter_51_51_50_50',
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

    await Promise.all(
      tileNames.map(async (name) => {
        try {
          const tex = await Assets.load<Texture>(`/assets/tiles/${name}.png`);
          tex.source.scaleMode = 'nearest';
          this.tileTextures.set(name, tex);
        } catch (err) {
          console.warn(`Could not load tile ${name}:`, err);
        }
      })
    );

    // Load 4-step authentic water animation frames (0 -> 1 -> 2 -> 1) from pret/pokecrystal water.png
    const animatedWaterTileNames = [
      'jt_14_14_14_14',
      'jt_14_3b_14_3b',
      'jt_14_4b_14_14',
      'jt_3d_14_3d_14',
      'jt_4c_4c_14_14',
      'jt_4d_14_14_14',
      'jt_5c_4c_3d_14',
    ];

    for (const wName of animatedWaterTileNames) {
      const f0 = this.tileTextures.get(wName);
      if (!f0) continue;
      try {
        const f1 = await Assets.load<Texture>(`/assets/tiles/${wName}__w1.png`);
        const f2 = await Assets.load<Texture>(`/assets/tiles/${wName}__w2.png`);
        f1.source.scaleMode = 'nearest';
        f2.source.scaleMode = 'nearest';
        this.waterAnimFrames.set(wName, [f0, f1, f2, f1]);
      } catch (err) {
        console.warn(`Could not load water animation frames for ${wName}:`, err);
      }
    }

    // 2. Load character sheets (144x32 -> 9 frames of 16x32)
    const goldWalkTex = await Assets.load<Texture>('/assets/sprites/characters/gold_walk.png');
    goldWalkTex.source.scaleMode = 'nearest';
    this.playerFrames = this.extractCharacterFrames(goldWalkTex);

    const npcBoyTex = await Assets.load<Texture>('/assets/sprites/characters/npc_boy.png');
    npcBoyTex.source.scaleMode = 'nearest';
    this.npcBoyFrames = this.extractCharacterFrames(npcBoyTex);

    const npcGirlTex = await Assets.load<Texture>('/assets/sprites/characters/npc_girl.png');
    npcGirlTex.source.scaleMode = 'nearest';
    this.npcGirlFrames = this.extractCharacterFrames(npcGirlTex);

    const npcFatManTex = await Assets.load<Texture>('/assets/sprites/characters/npc_fat_man.png');
    npcFatManTex.source.scaleMode = 'nearest';
    this.npcFatManFrames = this.extractCharacterFrames(npcFatManTex);

    const npcKrisTex = await Assets.load<Texture>('/assets/sprites/characters/kris_walk.png');
    npcKrisTex.source.scaleMode = 'nearest';
    this.npcKrisFrames = this.extractCharacterFrames(npcKrisTex);
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
    this.playerSprite.scale.set(3, 3);
    this.entityContainer.addChild(this.playerSprite);
  }

  private renderMapChunk(map: MapData, offsetTileX: number, offsetTileY: number): void {
    const grassTex = this.tileTextures.get('grass') || Texture.WHITE;
    if (!map.tileMap || map.tileMap.length !== map.width * map.height) return;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const tileName = map.tileMap[index];
        const px = (x + offsetTileX) * this.tileSize;
        const py = (y + offsetTileY) * this.tileSize;

        const isOpaqueTile = tileName === 'water' || tileName.startsWith('jt_') || tileName.startsWith('in_');
        if (!isOpaqueTile) {
          const baseSprite = new Sprite(grassTex);
          baseSprite.position.set(px, py);
          baseSprite.width = this.tileSize;
          baseSprite.height = this.tileSize;
          this.mapContainer.addChild(baseSprite);
        }

        const waterFrames = this.waterAnimFrames.get(tileName);
        const tex = waterFrames ? waterFrames[this.waterAnimStep] : this.tileTextures.get(tileName) || grassTex;
        const featureSprite = new Sprite(tex);
        featureSprite.position.set(px, py);
        featureSprite.width = this.tileSize;
        featureSprite.height = this.tileSize;
        this.mapContainer.addChild(featureSprite);

        if (waterFrames) {
          this.animatedWaterSprites.push({ sprite: featureSprite, frames: waterFrames });
        }

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
  }

  /**
   * Builds the textured overworld tilemap, including seamlessly connected neighbor maps and outdoor border blocks
   */
  public renderMap(map: MapData, lookupMap?: (mapId: string) => MapData | undefined): void {
    this.mapContainer.removeChildren();
    this.animatedWaterSprites.length = 0;
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
      const isOutdoor = Object.keys(map.connections || {}).length > 0;

      if (isOutdoor) {
        // Render surrounding Johto pine tree border blocks (border_block 0x05) so the camera never shows empty black void
        const treeTopTex = this.tileTextures.get('jt_1e_1f_2e_2f') || treeTallTex;
        const treeBotTex = this.tileTextures.get('jt_2e_2f_3e_3f') || treeTallTex;
        const padX = 16;
        const padY = 10;

        const westConn = map.connections.WEST && lookupMap ? lookupMap(map.connections.WEST.mapId) : undefined;
        const eastConn = map.connections.EAST && lookupMap ? lookupMap(map.connections.EAST.mapId) : undefined;

        for (let ty = -padY; ty < map.height + padY; ty++) {
          for (let tx = -padX; tx < map.width + padX; tx++) {
            // Skip tiles inside current map
            if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) continue;
            // Skip tiles inside connected West map
            if (westConn && tx >= -westConn.width && tx < 0 && ty >= 0 && ty < westConn.height) continue;
            // Skip tiles inside connected East map
            if (eastConn && tx >= map.width && tx < map.width + eastConn.width && ty >= 0 && ty < eastConn.height) {
              continue;
            }

            const isEvenY = ((ty % 2) + 2) % 2 === 0;
            const borderSprite = new Sprite(isEvenY ? treeTopTex : treeBotTex);
            borderSprite.position.set(tx * this.tileSize, ty * this.tileSize);
            borderSprite.width = this.tileSize;
            borderSprite.height = this.tileSize;
            this.mapContainer.addChild(borderSprite);
          }
        }

        // Render connected neighbor maps seamlessly adjacent to the active map
        if (westConn && map.connections.WEST) {
          this.renderMapChunk(westConn, -westConn.width, map.connections.WEST.offset);
        }
        if (eastConn && map.connections.EAST) {
          this.renderMapChunk(eastConn, map.width, map.connections.EAST.offset);
        }
      }

      // Render active map at (0, 0)
      this.renderMapChunk(map, 0, 0);
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
   * Updates player & NPC sprite animations, ambient 1.0x water animations, and centers camera smoothly
   */
  public update(player: GridEntity, npcs: GridEntity[] = [], dtWorld: number = 0): void {
    const scale = 3;

    // 0. Update Ambient Water Tile Animations at 1.0x World Time (~0.26s per Gen 2 tick)
    if (dtWorld > 0 && this.animatedWaterSprites.length > 0) {
      this.waterAnimTimer += dtWorld;
      if (this.waterAnimTimer >= 0.26) {
        this.waterAnimTimer -= 0.26;
        this.waterAnimStep = (this.waterAnimStep + 1) & 3;
        for (let i = 0; i < this.animatedWaterSprites.length; i++) {
          const entry = this.animatedWaterSprites[i];
          entry.sprite.texture = entry.frames[this.waterAnimStep];
        }
      }
    }

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

    // 2. Smooth Camera Centering
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    const cameraTargetX = screenWidth / 2 - (player.renderX + 0.5) * this.tileSize;
    const cameraTargetY = screenHeight / 2 - (player.renderY + 0.5) * this.tileSize;

    this.stageContainer.position.set(cameraTargetX, cameraTargetY);

    // 3. Update NPCs across active & connected maps with playing-window viewport culling (Zero-allocation pass)
    for (const sprite of this.npcSprites.values()) {
      sprite.visible = false;
    }

    const cullMargin = this.tileSize;

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const offsetX = npc.worldOffsetX || 0;
      const offsetY = npc.worldOffsetY || 0;
      const npcPxX = (npc.renderX + offsetX + 0.5) * this.tileSize;
      const npcPxY = (npc.renderY + offsetY + 0.85) * this.tileSize;

      const screenX = cameraTargetX + npcPxX;
      const screenY = cameraTargetY + npcPxY;
      const isInPlayingWindow =
        screenX >= -cullMargin &&
        screenX <= screenWidth + cullMargin &&
        screenY >= -cullMargin &&
        screenY <= screenHeight + cullMargin;

      if (!isInPlayingWindow) continue;

      const frames =
        npc.spriteType === 'girl'
          ? this.npcGirlFrames
          : npc.spriteType === 'fat_man'
            ? this.npcFatManFrames
            : npc.spriteType === 'kris'
              ? this.npcKrisFrames
              : this.npcBoyFrames;

      let sprite = this.npcSprites.get(npc.id);
      if (!sprite) {
        sprite = new Sprite(frames.downStand);
        sprite.anchor.set(0.5, 0.85);
        sprite.scale.set(scale, scale);
        this.entityContainer.addChild(sprite);
        this.npcSprites.set(npc.id, sprite);
      }
      sprite.visible = true;
      sprite.position.set(npcPxX, npcPxY);

      const npcTex = this.getFrameForEntity(frames, npc.direction, npc.isMoving, npc.progress);
      sprite.texture = npcTex;

      if (npc.direction === 'RIGHT') {
        sprite.scale.set(-scale, scale);
      } else {
        sprite.scale.set(scale, scale);
      }
    }
  }
}
