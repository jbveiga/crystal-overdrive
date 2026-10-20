import { Application, Container, Sprite, Texture, Rectangle, Assets, Graphics, Text, TextStyle } from 'pixi.js';
import type { MapData, Direction } from '../types/game';
import type { GridEntity, NpcSpriteType } from '../world/GridPhysics';

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

interface GrassParticle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class OverworldRenderer {
  public app!: Application;
  private stageContainer!: Container;
  private mapContainer!: Container;
  private entityContainer!: Container;
  private foregroundContainer!: Container;
  private playerShadow!: Graphics;
  private playerSprite!: Sprite;
  private playerGrassMask!: Graphics;
  private npcSprites: Map<string, Sprite> = new Map();
  private npcGrassMasks: Map<string, Graphics> = new Map();
  private grassParticles: GrassParticle[] = [];
  private exclamationContainer: Container | null = null;
  private ambientOverlay!: Graphics;
  private fadeOverlay!: Graphics;
  private currentRenderedMap: MapData | null = null;
  private tileSize: number = 64;

  // Textures
  private tileTextures: Map<string, Texture> = new Map();
  private waterAnimFrames: Map<string, [Texture, Texture, Texture, Texture]> = new Map();
  private animatedWaterSprites: Array<{ sprite: Sprite; frames: [Texture, Texture, Texture, Texture] }> = [];
  private waterAnimTimer: number = 0;
  private waterAnimStep: number = 0;
  private goldFrames!: CharacterFrames;
  private krisFrames!: CharacterFrames;
  private playerFrames!: CharacterFrames;
  private npcFrames: Map<NpcSpriteType, CharacterFrames> = new Map();

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
    this.foregroundContainer = new Container();
    this.ambientOverlay = new Graphics();
    this.ambientOverlay.visible = false;
    this.ambientOverlay.eventMode = 'none';
    this.fadeOverlay = new Graphics();
    this.fadeOverlay.visible = false;

    this.stageContainer.addChild(this.mapContainer);
    this.stageContainer.addChild(this.entityContainer);
    this.stageContainer.addChild(this.foregroundContainer);
    this.app.stage.addChild(this.stageContainer);
    this.app.stage.addChild(this.ambientOverlay);
    this.app.stage.addChild(this.fadeOverlay);

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
      // Route 30 & Route 31 additional authentic quadrant tiles
      'jt_06_06_4c_4c',
      'jt_06_3d_06_3d',
      'jt_07_07_26_07',
      'jt_1a_07_1a_26',
      'jt_31_36_41_48',
      'jt_36_34_48_44',
      'jt_36_36_48_48',
      'jt_3b_3b_3b_3b',
      'jt_3b_4b_4b_4c',
      'jt_3d_3d_3d_3d',
      'jt_40_40_40_40',
      'jt_41_48_51_52',
      'jt_46_47_56_57',
      'jt_48_44_52_54',
      'jt_48_48_52_52',
      'jt_4c_4c_4c_4c',
      'jt_4c_5d_14_3b',
      'jt_4d_3d_4c_4d',
      // Phase 5 Violet City, Route 31 Gate, Sprout Tower, Violet Gym, Academy & Houses tiles
      'in_elite_four_room_00_00_00_00',
      'in_elite_four_room_01_01_01_01',
      'in_elite_four_room_04_04_14_14',
      'in_elite_four_room_10_10_10_10',
      'in_elite_four_room_11_11_01_01',
      'in_elite_four_room_13_13_12_12',
      'in_elite_four_room_20_21_30_31',
      'in_elite_four_room_22_23_32_33',
      'in_elite_four_room_55_56_57_58',
      'in_gate_01_01_01_01',
      'in_gate_07_07_24_25',
      'in_gate_08_09_18_19',
      'in_gate_0e_0f_20_21',
      'in_gate_11_01_11_01',
      'in_gate_11_11_01_01',
      'in_gate_11_11_11_01',
      'in_gate_18_19_18_19',
      'in_gate_18_19_24_25',
      'in_gate_28_29_28_29',
      'in_gate_38_39_15_16',
      'in_gate_5c_5d_08_09',
      'in_gate_5c_5d_10_10',
      'in_house_00_00_40_41',
      'in_house_01_4f_01_01',
      'in_house_20_21_42_43',
      'in_house_37_28_38_3f',
      'in_house_37_28_38_4e',
      'in_house_44_45_00_00',
      'in_house_49_4b_5a_5b',
      'in_house_50_51_50_51',
      'in_house_56_57_3c_3a',
      'in_lab_03_04_35_36',
      'in_lab_05_07_13_14',
      'in_lab_24_24_24_24',
      'in_lab_2a_2b_3a_3b',
      'in_lab_2b_2c_3b_3c',
      'in_lab_2e_2e_3e_3e',
      'in_lab_2f_34_3f_34',
      'in_lab_34_2d_34_3d',
      'in_lab_34_34_24_24',
      'in_lab_34_34_34_34',
      'in_lab_40_41_50_51',
      'in_tower_01_01_01_01',
      'in_tower_01_2c_4e_4f',
      'in_tower_02_02_02_02',
      'in_tower_07_08_17_18',
      'in_tower_08_09_18_19',
      'in_tower_0a_0b_1a_1b',
      'in_tower_0b_0b_1b_1b',
      'in_tower_0c_0d_1c_1d',
      'in_tower_0e_0f_1e_1f',
      'in_tower_11_11_21_21',
      'in_tower_11_11_40_20',
      'in_tower_11_48_21_58',
      'in_tower_1a_1b_1a_1b',
      'in_tower_1b_1b_1b_1b',
      'in_tower_2d_2e_3d_3e',
      'in_tower_2e_2f_3e_3f',
      'in_tower_3c_3e_4d_4e',
      'in_tower_41_31_41_31',
      'in_tower_42_43_5a_5b',
      'in_tower_49_11_59_21',
      'in_tower_4a_4b_5a_5b',
      'in_tower_4c_5c_36_37',
      'in_tower_4d_4e_5d_5e',
      'in_tower_4e_4f_5e_5f',
      'jt_06_06_9a_9a',
      'jt_06_3d_4c_4d',
      'jt_0d_0e_0a_0b_vc',
      'jt_0e_0e_0b_0b_vc',
      'jt_0e_0f_0b_0c_vc',
      'jt_10_11_0a_0b_vc',
      'jt_10_11_0d_0e_vc',
      'jt_11_11_0b_0b_vc',
      'jt_11_11_0e_0e_vc',
      'jt_11_12_0b_0c_vc',
      'jt_11_12_0e_0f_vc',
      'jt_1a_94_97_98',
      'jt_1a_95_97_98',
      'jt_1c_3d_99_3d',
      'jt_22_41_50_51',
      'jt_23_24_1b_1b',
      'jt_27_28_29_2a',
      'jt_2c_2c_3c_3c',
      'jt_2d_3c_3d_2d',
      'jt_31_53_41_53',
      'jt_3b_06_4b_4c',
      'jt_3b_1a_3b_97',
      'jt_41_53_51_52',
      'jt_44_25_54_55',
      'jt_53_34_53_44',
      'jt_53_44_52_54',
      'jt_53_53_52_52',
      'jt_53_53_53_53',
      'jt_94_95_52_52',
      'jt_94_95_98_98',
      'jt_95_95_98_98',
      'jt_95_96_52_52',
      'jt_95_96_98_98',
      'jt_96_1c_98_99',
    ];

    await Promise.all(
      tileNames.map(async (name) => {
        try {
          const tex = await Assets.load<Texture>(`./assets/tiles/${name}.png`);
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
      'jt_4c_5d_14_3b',
      'jt_5c_4c_3d_14',
    ];

    for (const wName of animatedWaterTileNames) {
      const f0 = this.tileTextures.get(wName);
      if (!f0) continue;
      try {
        const f1 = await Assets.load<Texture>(`./assets/tiles/${wName}__w1.png`);
        const f2 = await Assets.load<Texture>(`./assets/tiles/${wName}__w2.png`);
        f1.source.scaleMode = 'nearest';
        f2.source.scaleMode = 'nearest';
        this.waterAnimFrames.set(wName, [f0, f1, f2, f1]);
      } catch (err) {
        console.warn(`Could not load water animation frames for ${wName}:`, err);
      }
    }

    // 2. Load character sheets (144x32 -> 9 frames of 16x32)
    const goldWalkTex = await Assets.load<Texture>('./assets/sprites/characters/gold_walk.png');
    goldWalkTex.source.scaleMode = 'nearest';
    this.goldFrames = this.extractCharacterFrames(goldWalkTex);
    this.playerFrames = this.goldFrames;

    const npcSheetPaths: Record<NpcSpriteType, string> = {
      boy: './assets/sprites/characters/npc_boy.png',
      girl: './assets/sprites/characters/npc_girl.png',
      fat_man: './assets/sprites/characters/npc_fat_man.png',
      kris: './assets/sprites/characters/kris_walk.png',
      silver: './assets/sprites/characters/silver.png',
      fisherman: './assets/sprites/characters/fisherman.png',
      bug_catcher: './assets/sprites/characters/bug_catcher.png',
      teacher: './assets/sprites/characters/teacher.png',
      mom: './assets/sprites/characters/mom.png',
      prof_elm: './assets/sprites/characters/prof_elm.png',
      sage: './assets/sprites/characters/sage.png',
      elder: './assets/sprites/characters/elder.png',
      elder_li: './assets/sprites/characters/elder_li.png',
      falkner: './assets/sprites/characters/falkner.png',
      bird_keeper: './assets/sprites/characters/bird_keeper.png',
      earl: './assets/sprites/characters/earl.png',
    };

    await Promise.all(
      (Object.entries(npcSheetPaths) as Array<[NpcSpriteType, string]>).map(async ([spriteType, sheetPath]) => {
        const tex = await Assets.load<Texture>(sheetPath);
        tex.source.scaleMode = 'nearest';
        const extracted = this.extractCharacterFrames(tex);
        this.npcFrames.set(spriteType, extracted);
        if (spriteType === 'kris') {
          this.krisFrames = extracted;
        }
      })
    );
  }

  /**
   * Switches the active player sprite sheet between Boy (`gold_walk.png`) and Girl (`kris_walk.png`).
   */
  public setPlayerGender(gender: 'BOY' | 'GIRL'): void {
    this.playerFrames = gender === 'GIRL' && this.krisFrames ? this.krisFrames : this.goldFrames;
    if (this.playerSprite && this.playerFrames) {
      this.playerSprite.texture = this.playerFrames.downStand;
    }
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

  private createGrassWadingGraphic(): Graphics {
    const g = new Graphics();
    // Draw authentic Gen 2 grass blades overlapping the lower 14px of the character sprite
    g.rect(-22, -12, 44, 14).fill({ color: 0x3b8a3e, alpha: 0.92 });
    // Dark green pixel blade tips
    for (let bx = -20; bx <= 16; bx += 8) {
      g.moveTo(bx, -12)
        .lineTo(bx + 4, -20)
        .lineTo(bx + 8, -12)
        .fill({ color: 0x1e5926 });
      g.moveTo(bx + 2, -10)
        .lineTo(bx + 5, -16)
        .lineTo(bx + 8, -10)
        .fill({ color: 0x65c458 });
    }
    g.visible = false;
    return g;
  }

  private createPlayerSprite(): void {
    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 0, 18, 7).fill({ color: 0x000000, alpha: 0.38 });
    this.playerShadow.visible = false;
    this.entityContainer.addChild(this.playerShadow);

    this.playerSprite = new Sprite(this.playerFrames.downStand);
    this.playerSprite.anchor.set(0.5, 0.85);
    this.playerSprite.scale.set(3, 3);
    this.entityContainer.addChild(this.playerSprite);

    this.playerGrassMask = this.createGrassWadingGraphic();
    this.foregroundContainer.addChild(this.playerGrassMask);
  }

  /**
   * Returns authentic Gen 2 Real-Time Clock (RTC) outdoor tint:
   * - Morning (04:00 - 09:59): warm golden-amber (0xfff4db)
   * - Day     (10:00 - 17:59): crisp daylight (0xffffff)
   * - Night   (18:00 - 03:59): cool nocturnal indigo (0x9aa8f8)
   */
  public getTimeOfDayTint(): { period: 'MORNING' | 'DAY' | 'NIGHT'; tint: number } {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 10) {
      return { period: 'MORNING', tint: 0xfff4db };
    }
    if (hour >= 10 && hour < 18) {
      return { period: 'DAY', tint: 0xffffff };
    }
    return { period: 'NIGHT', tint: 0x9aa8f8 };
  }

  /**
   * Spawns 4 fluttering grass leaf particles when an entity steps onto a tall_grass tile
   */
  public spawnGrassRustle(tileX: number, tileY: number): void {
    const centerX = (tileX + 0.5) * this.tileSize;
    const centerY = (tileY + 0.65) * this.tileSize;
    const angles = [-2.4, -1.9, -1.2, -0.7];
    for (let i = 0; i < 4; i++) {
      const leaf = new Graphics();
      leaf.rect(-4, -3, 8, 6).fill({ color: i % 2 === 0 ? 0x65c458 : 0x2a7a32 });
      leaf.rect(-2, -1, 4, 2).fill({ color: 0xb4f09c });
      leaf.position.set(centerX + (i - 1.5) * 8, centerY);
      this.foregroundContainer.addChild(leaf);
      this.grassParticles.push({
        graphic: leaf,
        vx: Math.cos(angles[i]) * 52,
        vy: Math.sin(angles[i]) * 64,
        life: 0,
        maxLife: 0.28,
      });
    }
  }

  /**
   * Displays a classic Gen 2 `[!]` exclamation balloon above an NPC trainer's head
   */
  public async showExclamationBubble(npc: GridEntity, durationMs: number = 600): Promise<void> {
    if (this.exclamationContainer) {
      this.exclamationContainer.destroy({ children: true });
      this.exclamationContainer = null;
    }

    const offsetX = npc.worldOffsetX || 0;
    const offsetY = npc.worldOffsetY || 0;
    const npcPxX = (npc.renderX + offsetX + 0.5) * this.tileSize;
    const npcPxY = (npc.renderY + offsetY + 0.85) * this.tileSize;

    const bubble = new Container();
    bubble.position.set(npcPxX, npcPxY - 102);

    const bg = new Graphics();
    bg.roundRect(-18, -22, 36, 36, 6)
      .fill({ color: 0xffffff })
      .stroke({ color: 0x111827, width: 3 });
    // Speech pointer triangle
    bg.moveTo(-5, 14).lineTo(0, 22).lineTo(5, 14).fill({ color: 0x111827 });
    bubble.addChild(bg);

    const bang = new Text({
      text: '!',
      style: new TextStyle({
        fontFamily: ' monospace',
        fontSize: 26,
        fontWeight: '900',
        fill: 0xdc2626,
      }),
    });
    bang.anchor.set(0.5);
    bang.position.set(0, -4);
    bubble.addChild(bang);

    this.foregroundContainer.addChild(bubble);
    this.exclamationContainer = bubble;

    await new Promise<void>((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        // Quick pop bounce on entry
        const bounce = t < 0.25 ? Math.sin((t / 0.25) * Math.PI) * 10 : 0;
        bubble.position.set(npcPxX, npcPxY - 102 - bounce);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          if (this.exclamationContainer === bubble) {
            bubble.destroy({ children: true });
            this.exclamationContainer = null;
          }
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  /**
   * Plays a crisp 0.15s doorway fade-to-black / fade-in transition
   */
  public async playDoorwayFade(onMidpoint: () => void): Promise<void> {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.fadeOverlay.clear().rect(0, 0, w, h).fill({ color: 0x000000 });
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = true;

    const animateAlpha = (from: number, to: number, durationMs: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          this.fadeOverlay.alpha = from + (to - from) * t;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });

    await animateAlpha(0, 1, 140);
    onMidpoint();
    await animateAlpha(1, 0, 140);
    this.fadeOverlay.visible = false;
  }

  private renderMapChunk(map: MapData, offsetTileX: number, offsetTileY: number, isNight: boolean = false): void {
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

        // At night, give outdoor building window tiles a warm lantern glow
        if (
          isNight &&
          (tileName.includes('10_11') || tileName.includes('11_12') || tileName.includes('18_19'))
        ) {
          const glow = new Graphics();
          glow.rect(px + 8, py + 12, this.tileSize - 16, this.tileSize - 24).fill({
            color: 0xfde047,
            alpha: 0.22,
          });
          this.mapContainer.addChild(glow);
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
   * Builds the textured overworld tilemap, including seamlessly connected neighbor maps (W/E/N/S) and outdoor border blocks
   */
  public renderMap(map: MapData, lookupMap?: (mapId: string) => MapData | undefined): void {
    this.mapContainer.removeChildren();
    this.animatedWaterSprites.length = 0;
    this.currentRenderedMap = map;
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

    const isOutdoor = Object.keys(map.connections || {}).length > 0;
    const rtc = this.getTimeOfDayTint();
    this.mapContainer.tint = isOutdoor ? rtc.tint : 0xffffff;
    const isNight = isOutdoor && rtc.period === 'NIGHT';

    // 1. High-fidelity authentic TileMap rendering if defined
    if (map.tileMap && map.tileMap.length === map.width * map.height) {
      if (isOutdoor) {
        // Render surrounding Johto pine tree border blocks (border_block 0x05) so the camera never shows empty black void
        const treeTopTex = this.tileTextures.get('jt_1e_1f_2e_2f') || treeTallTex;
        const treeBotTex = this.tileTextures.get('jt_2e_2f_3e_3f') || treeTallTex;
        const padX = 16;
        const padY = 12;

        const westConn = map.connections.WEST && lookupMap ? lookupMap(map.connections.WEST.mapId) : undefined;
        const eastConn = map.connections.EAST && lookupMap ? lookupMap(map.connections.EAST.mapId) : undefined;
        const northConn = map.connections.NORTH && lookupMap ? lookupMap(map.connections.NORTH.mapId) : undefined;
        const southConn = map.connections.SOUTH && lookupMap ? lookupMap(map.connections.SOUTH.mapId) : undefined;

        const westOff = map.connections.WEST?.offset ?? 0;
        const eastOff = map.connections.EAST?.offset ?? 0;
        const northOff = map.connections.NORTH?.offset ?? 0;
        const southOff = map.connections.SOUTH?.offset ?? 0;

        for (let ty = -padY; ty < map.height + padY; ty++) {
          for (let tx = -padX; tx < map.width + padX; tx++) {
            // Skip tiles inside current map
            if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) continue;
            // Skip tiles inside connected West map
            if (
              westConn &&
              tx >= -westConn.width &&
              tx < 0 &&
              ty >= westOff &&
              ty < westOff + westConn.height
            ) {
              continue;
            }
            // Skip tiles inside connected East map
            if (
              eastConn &&
              tx >= map.width &&
              tx < map.width + eastConn.width &&
              ty >= eastOff &&
              ty < eastOff + eastConn.height
            ) {
              continue;
            }
            // Skip tiles inside connected North map
            if (
              northConn &&
              tx >= northOff &&
              tx < northOff + northConn.width &&
              ty >= -northConn.height &&
              ty < 0
            ) {
              continue;
            }
            // Skip tiles inside connected South map
            if (
              southConn &&
              tx >= southOff &&
              tx < southOff + southConn.width &&
              ty >= map.height &&
              ty < map.height + southConn.height
            ) {
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
          this.renderMapChunk(westConn, -westConn.width, westOff, isNight);
        }
        if (eastConn && map.connections.EAST) {
          this.renderMapChunk(eastConn, map.width, eastOff, isNight);
        }
        if (northConn && map.connections.NORTH) {
          this.renderMapChunk(northConn, northOff, -northConn.height, isNight);
        }
        if (southConn && map.connections.SOUTH) {
          this.renderMapChunk(southConn, southOff, map.height, isNight);
        }
      }

      // Render active map at (0, 0)
      this.renderMapChunk(map, 0, 0, isNight);
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

  private isEntityOnTallGrass(entity: GridEntity): boolean {
    const map = this.currentRenderedMap;
    if (!map || entity.isJumping) return false;
    const tx = Math.round(entity.renderX);
    const ty = Math.round(entity.renderY);
    if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return false;
    return map.collisionGrid[ty * map.width + tx] === 2;
  }

  /**
   * Updates player & NPC sprite animations, grass wading overlays, ledge jump arcs, ambient 1.0x water animations, and camera
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

    // 0b. Update active Grass Rustle Leaf Particles
    if (dtWorld > 0 && this.grassParticles.length > 0) {
      for (let i = this.grassParticles.length - 1; i >= 0; i--) {
        const p = this.grassParticles[i];
        p.life += dtWorld;
        if (p.life >= p.maxLife) {
          p.graphic.destroy();
          this.grassParticles.splice(i, 1);
          continue;
        }
        p.graphic.x += p.vx * dtWorld;
        p.graphic.y += p.vy * dtWorld;
        p.vy += 150 * dtWorld; // gravity
        p.graphic.alpha = 1 - p.life / p.maxLife;
      }
    }

    // 1. Update Player (including parabolic Ledge Hop arc & ground shadow)
    const playerPxX = (player.renderX + 0.5) * this.tileSize;
    const playerPxY = (player.renderY + 0.85) * this.tileSize;
    const jumpArcOffset = player.isJumping ? Math.sin(player.progress * Math.PI) * 30 : 0;

    if (player.isJumping) {
      this.playerShadow.visible = true;
      this.playerShadow.position.set(playerPxX, playerPxY - 4);
    } else {
      this.playerShadow.visible = false;
    }

    this.playerSprite.position.set(playerPxX, playerPxY - jumpArcOffset);

    const playerTex = this.getFrameForEntity(this.playerFrames, player.direction, player.isMoving, player.progress);
    this.playerSprite.texture = playerTex;

    // Raw side frames naturally face LEFT; mirror horizontally for RIGHT
    if (player.direction === 'RIGHT') {
      this.playerSprite.scale.set(-scale, scale);
    } else {
      this.playerSprite.scale.set(scale, scale);
    }

    // Tall Grass Wading Overlay on Player's feet
    if (this.isEntityOnTallGrass(player)) {
      this.playerGrassMask.visible = true;
      this.playerGrassMask.position.set(playerPxX, playerPxY);
    } else {
      this.playerGrassMask.visible = false;
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
    for (const mask of this.npcGrassMasks.values()) {
      mask.visible = false;
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
        this.npcFrames.get(npc.spriteType || 'boy') || this.npcFrames.get('boy') || this.playerFrames;

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

      if (offsetX === 0 && offsetY === 0 && this.isEntityOnTallGrass(npc)) {
        let mask = this.npcGrassMasks.get(npc.id);
        if (!mask) {
          mask = this.createGrassWadingGraphic();
          this.foregroundContainer.addChild(mask);
          this.npcGrassMasks.set(npc.id, mask);
        }
        mask.visible = true;
        mask.position.set(npcPxX, npcPxY);
      }
    }
  }

  /**
   * Updates ambient day/night color tint overlay (Ticket 6.2).
   * Automatically disables on indoor maps.
   */
  public updateAmbientLighting(timeOfDay: 'MORNING' | 'DAY' | 'NIGHT', isOutdoor: boolean): void {
    if (!this.ambientOverlay) return;

    if (!isOutdoor) {
      this.ambientOverlay.visible = false;
      return;
    }

    const screenW = this.app.screen?.width || 800;
    const screenH = this.app.screen?.height || 600;

    let color = 0x000000;
    let alpha = 0.0;

    if (timeOfDay === 'MORNING') {
      // Warm golden morning amber
      color = 0xfbbf24;
      alpha = 0.12;
    } else if (timeOfDay === 'NIGHT') {
      // Atmospheric nocturnal navy tint
      color = 0x0f172a;
      alpha = 0.38;
    }

    if (alpha <= 0) {
      this.ambientOverlay.visible = false;
    } else {
      this.ambientOverlay.clear();
      this.ambientOverlay.rect(0, 0, screenW, screenH);
      this.ambientOverlay.fill({ color, alpha });
      this.ambientOverlay.visible = true;
    }
  }
}
