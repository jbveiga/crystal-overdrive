import { Application, Container, Sprite, Texture, Rectangle, Assets, Graphics, Text, TextStyle } from 'pixi.js';
import type { MapData, Direction, OverworldItemBall, OverworldFruitTree } from '../types/game';
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

import { ANIMATED_WATER_TILES } from './tileConstants';
export { ANIMATED_WATER_TILES };

export class OverworldRenderer {
  public app!: Application;
  private stageContainer!: Container;
  private mapContainer!: Container;
  private itemBallContainer!: Container;
  private entityContainer!: Container;
  private foregroundContainer!: Container;
  private playerShadow!: Graphics;
  private playerSprite!: Sprite;
  private playerGrassMask!: Graphics;
  private itemBallGraphics: Map<string, Container> = new Map();
  private npcSprites: Map<string, Sprite> = new Map();
  private activeNpcSpriteList: Sprite[] = [];
  private npcGrassMasks: Map<string, Graphics> = new Map();
  private activeNpcGrassMaskList: Graphics[] = [];
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
  private fruitTreeTexture: Texture | null = null;

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
    this.itemBallContainer = new Container();
    this.entityContainer = new Container();
    this.foregroundContainer = new Container();
    this.ambientOverlay = new Graphics();
    this.ambientOverlay.visible = false;
    this.ambientOverlay.eventMode = 'none';
    this.fadeOverlay = new Graphics();
    this.fadeOverlay.visible = false;

    this.stageContainer.addChild(this.mapContainer);
    this.stageContainer.addChild(this.itemBallContainer);
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
      'in_cave_14_14_14_14',
      'in_cave_0a_26_17_14',
      'in_cave_26_26_14_14',
      'in_cave_26_0b_14_15',
      'in_cave_17_14_17_14',
      'in_cave_14_15_14_15',
      'in_cave_14_25_14_14',
      'in_cave_27_14_14_14',
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
      // Authentic johto_modern tiles for Azalea Town, Slowpoke Well entrance & Route 33
      'jt_m_1e_1f_13_15',
      'jt_m_13_15_3e_3f',
      'jt_m_1e_1f_3e_3f',
      'jt_m_05_05_05_05',
      'jt_m_2b_2c_3b_3c',
      'jt_m_2c_2d_3c_3d',
      'jt_m_3b_3c_4b_4c',
      'jt_m_3c_3d_4c_4d',
      'jt_m_3b_3b_3b_3b',
      'jt_m_3c_3c_3c_3c',
      'jt_m_10_11_0d_0e_az',
      'jt_m_11_11_0e_0e_az',
      'jt_m_0d_0e_0a_0b_az',
      'jt_m_0e_0e_0b_0b_az',
      'jt_m_11_12_0e_0f_az',
      'jt_m_0e_0f_0b_0c_az',
      'jt_m_3b_4b_4b_4c',
      'jt_m_4c_4c_4c_4c',
      'jt_m_10_11_0a_0b_az',
      'jt_m_11_11_0b_0b_az',
      'jt_m_1a_1b_01_02',
      'jt_m_37_38_39_3a',
      'jt_m_11_12_0b_0c_az',
      'jt_m_1b_1b_02_02',
      'jt_m_1b_1c_02_16',
      'jt_m_1a_07_1a_07_az',
      'jt_m_07_07_07_07_az',
      'jt_m_1a_07_01_02_az',
      'jt_m_07_1c_07_1c_az',
      'jt_m_18_19_17_17',
      'jt_m_07_1c_02_16_az',
      'jt_m_05_05_4c_4c',
      'jt_m_06_06_06_06',
      'jt_m_06_06_4c_4c',
      'jt_m_06_06_5b_5b',
      'jt_m_4e_4f_5e_5f',
      'jt_m_29_2a_4b_48',
      'jt_m_55_57_35_35',
      'jt_m_29_2a_47_48',
      'jt_m_32_32_46_46',
      'jt_m_32_34_46_44',
      'jt_m_46_46_52_52',
      'jt_m_46_44_52_54',
      'jt_m_5a_5a_59_59',
      'jt_m_06_4a_06_4a',
      'jt_m_08_09_17_17',
      'jt_m_3b_4c_4b_4c',
      'jt_m_5b_5b_5b_5b',
      'jt_m_4c_3d_4c_4d',
      'jt_m_1b_1b_1b_26',
      'jt_m_1b_1c_26_1c',
      'jt_m_40_40_40_40',
      'jt_m_00_00_00_00',
      'jt_m_06_00_00_00',
      'jt_m_05_05_5b_5b',
      'jt_m_1a_1b_1a_26',
      'jt_m_1b_1b_26_1b',
      'jt_m_23_24_1b_1b',
      'jt_m_1b_1b_1b_1b',
      'jt_m_3d_3d_3d_3d',
      'jt_m_4c_4c_4c_3b',
      'jt_m_45_22_27_28',
      'jt_m_4d_3d_4c_4d',
      'jt_m_3b_05_3b_05',
      'jt_m_05_2b_2b_3b',
      'jt_m_2c_2c_3c_3c',
      'jt_m_2d_05_3d_2d',
      'jt_m_3b_05_4b_4c',
      'jt_m_04_04_04_04',
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
    for (const wName of ANIMATED_WATER_TILES) {
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
      sudowoodo: './assets/sprites/characters/sudowoodo.png',
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
      oak: './assets/sprites/characters/oak.png',
      lapras: './assets/sprites/characters/lapras.png',
      whitney: './assets/sprites/characters/whitney.png',
      bike_shop_owner: './assets/sprites/characters/bike_shop_owner.png',
      clerk: './assets/sprites/characters/clerk.png',
      receptionist: './assets/sprites/characters/receptionist.png',
      gentleman: './assets/sprites/characters/gentleman.png',
      lass: './assets/sprites/characters/lass.png',
      beauty: './assets/sprites/characters/beauty.png',
      rocket_grunt_m: './assets/sprites/characters/rocket_grunt_m.png',
      rocket_grunt_f: './assets/sprites/characters/rocket_grunt_f.png',
      officer: './assets/sprites/characters/officer.png',
      camper: './assets/sprites/characters/camper.png',
      picnicker: './assets/sprites/characters/picnicker.png',
      psychic: './assets/sprites/characters/psychic.png',
      schoolboy: './assets/sprites/characters/schoolboy.png',
      juggler: './assets/sprites/characters/juggler.png',
      firebreather: './assets/sprites/characters/firebreather.png',
      pokefan_m: './assets/sprites/characters/pokefan_m.png',
      pokefan_f: './assets/sprites/characters/pokefan_f.png',
      super_nerd: './assets/sprites/characters/super_nerd.png',
      youngster: './assets/sprites/characters/youngster.png',
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

    try {
      const treeTex = await Assets.load<Texture>('./assets/sprites/fruit_tree_64.png');
      treeTex.source.scaleMode = 'nearest';
      this.fruitTreeTexture = treeTex;
    } catch (err) {
      console.warn('Could not load fruit tree sprite:', err);
    }
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
   * Plays a crisp diagonal blade slash and foliage burst when HM01 Cut chops a tree in the field
   */
  public playCutSlashEffect(tileX: number, tileY: number): void {
    if (!this.foregroundContainer) return;
    const centerX = (tileX + 0.5) * this.tileSize;
    const centerY = (tileY + 0.5) * this.tileSize;

    // 1. Diagonal silver-white blade arc
    const slash = new Graphics();
    slash
      .moveTo(-26, -26)
      .lineTo(26, 26)
      .stroke({ color: 0xffffff, width: 6 });
    slash
      .moveTo(26, -26)
      .lineTo(-26, 26)
      .stroke({ color: 0xe2e8f0, width: 4 });
    slash.position.set(centerX, centerY);
    this.foregroundContainer.addChild(slash);
    this.grassParticles.push({
      graphic: slash,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.24,
    });

    // 2. Scatter 6 cut leaf particles
    const angles = [-2.6, -2.0, -1.5, -1.0, -0.5, 0.2];
    for (let i = 0; i < angles.length; i++) {
      const leaf = new Graphics();
      leaf.rect(-5, -4, 10, 8).fill({ color: i % 2 === 0 ? 0x4ade80 : 0x16a34a });
      leaf.position.set(centerX + (i - 2.5) * 6, centerY);
      this.foregroundContainer.addChild(leaf);
      this.grassParticles.push({
        graphic: leaf,
        vx: Math.cos(angles[i]) * 78,
        vy: Math.sin(angles[i]) * 88,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  /**
   * Plays a radiant golden-white illumination pulse across the screen when HM05 Flash is used in the field
   */
  public async playFlashEffect(durationMs: number = 380): Promise<void> {
    if (!this.fadeOverlay || !this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.fadeOverlay.clear().rect(0, 0, w, h).fill({ color: 0xfef08a });
    this.fadeOverlay.alpha = 0.85;
    this.fadeOverlay.visible = true;

    await new Promise<void>((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        this.fadeOverlay.alpha = 0.85 * (1 - t);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          this.fadeOverlay.alpha = 0;
          this.fadeOverlay.visible = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
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
   * Returns the current alpha opacity of the transition fade overlay.
   */
  public getFadeOverlayAlpha(): number {
    return this.fadeOverlay ? this.fadeOverlay.alpha : 0;
  }

  /**
   * Returns whether the transition fade overlay is actively visible.
   */
  public isFadeOverlayVisible(): boolean {
    return this.fadeOverlay ? this.fadeOverlay.visible : false;
  }

  /**
   * Returns whether a tile texture key is buffered in memory.
   */
  public hasTileTexture(name: string): boolean {
    return this.tileTextures.has(name);
  }

  /**
   * Returns a cached tile texture by name, if loaded.
   */
  public getTileTexture(name: string): Texture | undefined {
    return this.tileTextures.get(name);
  }

  /**
   * Returns whether a tile has 4-step animated water frames registered.
   */
  public hasWaterAnimFrames(name: string): boolean {
    return this.waterAnimFrames.has(name);
  }

  /**
   * Returns 4-step animated water frames for a tile, if registered.
   */
  public getWaterAnimFrames(name: string): [Texture, Texture, Texture, Texture] | undefined {
    return this.waterAnimFrames.get(name);
  }

  /**
   * Plays a crisp authentic 160ms doorway fade-to-black / 160ms fade-in transition (320ms total)
   */
  public async playDoorwayFade(onMidpoint: () => void | Promise<void>, durationMs: number = 160): Promise<void> {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.fadeOverlay.clear().rect(0, 0, w, h).fill({ color: 0x000000 });
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = true;

    const animateAlpha = (from: number, to: number, ms: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / ms);
          this.fadeOverlay.alpha = from + (to - from) * t;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });

    await animateAlpha(0, 1, durationMs);
    this.fadeOverlay.alpha = 1;
    await onMidpoint();
    await animateAlpha(1, 0, durationMs);
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = false;
  }

  private renderMapChunk(map: MapData, offsetTileX: number, offsetTileY: number, isNight: boolean = false): void {
    const isOutdoor = Object.keys(map.connections || {}).length > 0;
    const grassTex = this.tileTextures.get('grass') || Texture.WHITE;
    if (!map.tileMap || map.tileMap.length !== map.width * map.height) return;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const tileName = map.tileMap[index];
        const px = (x + offsetTileX) * this.tileSize;
        const py = (y + offsetTileY) * this.tileSize;

        const isOpaqueTile =
          tileName === 'water' ||
          tileName.startsWith('jt_') ||
          tileName.startsWith('in_') ||
          tileName.startsWith('kt_');

        if (!isOpaqueTile && isOutdoor) {
          const baseSprite = new Sprite(grassTex);
          baseSprite.position.set(px, py);
          baseSprite.width = this.tileSize;
          baseSprite.height = this.tileSize;
          this.mapContainer.addChild(baseSprite);
        }

        const waterFrames = this.waterAnimFrames.get(tileName);
        const resolvedTex = waterFrames
          ? waterFrames[this.waterAnimStep]
          : this.tileTextures.get(tileName);

        // Zero fallback rendering: only use grassTex on outdoor maps where grass is expected;
        // for cave and indoor maps, never flash grassTex!
        const tex = resolvedTex || (isOutdoor ? grassTex : Texture.WHITE);
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
   * Ensures all tiles referenced by a map (base tileMap, overlayMap, and adjacent neighbor chunks) are loaded into tileTextures.
   * Loads textures on-demand from ./assets/tiles/${name}.png so maps (such as Route 32 cave rocks,
   * Union Cave, and shoreline water) never fallback to grassTex.
   */
  public async ensureMapTilesLoaded(
    map: MapData,
    lookupMap?: (mapId: string) => MapData | undefined
  ): Promise<void> {
    if (!map.tileMap) return;
    const missingTileNames: string[] = [];

    const collectMissing = (m: MapData) => {
      if (m.tileMap) {
        for (const name of m.tileMap) {
          if (name && !this.tileTextures.has(name) && !missingTileNames.includes(name)) {
            missingTileNames.push(name);
          }
        }
      }
      if (m.overlayMap) {
        for (const name of m.overlayMap) {
          if (name && !this.tileTextures.has(name) && !missingTileNames.includes(name)) {
            missingTileNames.push(name);
          }
        }
      }
    };

    collectMissing(map);

    if (lookupMap && map.connections) {
      for (const dir of ['WEST', 'EAST', 'NORTH', 'SOUTH'] as const) {
        const conn = map.connections[dir];
        if (conn) {
          const neighbor = lookupMap(conn.mapId);
          if (neighbor) collectMissing(neighbor);
        }
      }
    }

    if (missingTileNames.length === 0) return;

    await Promise.all(
      missingTileNames.map(async (name) => {
        try {
          const tex = await Assets.load<Texture>(`./assets/tiles/${name}.png`);
          if (tex) {
            tex.source.scaleMode = 'nearest';
            this.tileTextures.set(name, tex);
          }
          if (ANIMATED_WATER_TILES.includes(name) && !this.waterAnimFrames.has(name) && tex) {
            const f1 = await Assets.load<Texture>(`./assets/tiles/${name}__w1.png`);
            const f2 = await Assets.load<Texture>(`./assets/tiles/${name}__w2.png`);
            f1.source.scaleMode = 'nearest';
            f2.source.scaleMode = 'nearest';
            this.waterAnimFrames.set(name, [tex, f1, f2, f1]);
          }
        } catch (err) {
          console.warn(`Could not load tile ${name}:`, err);
        }
      })
    );
  }

  /**
   * Builds the textured overworld tilemap, including seamlessly connected neighbor maps (W/E/N/S) and outdoor border blocks
   */
  public renderMap(map: MapData, lookupMap?: (mapId: string) => MapData | undefined): void {
    this.mapContainer.removeChildren();
    this.animatedWaterSprites.length = 0;
    this.currentRenderedMap = map;
    this.tileSize = map.tileSize;

    if (map.tileMap) {
      const hasMissing = map.tileMap.some((name) => name && !this.tileTextures.has(name));
      if (hasMissing) {
        console.warn(
          `[OverworldRenderer] renderMap invoked with unbuffered textures for map "${map.id}". Caller should await ensureMapTilesLoaded(map) before calling renderMap.`
        );
        this.ensureMapTilesLoaded(map, lookupMap).then(() => {
          if (this.currentRenderedMap === map) {
            this.renderMap(map, lookupMap);
          }
        });
      }
    }

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

    // 2. Smooth Camera Centering (with responsive mobile zoom)
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    const stageScale = screenWidth < 640 ? Math.min(1.0, Math.max(0.72, screenWidth / 520)) : 1.0;
    this.stageContainer.scale.set(stageScale);

    const cameraTargetX = screenWidth / 2 - (player.renderX + 0.5) * this.tileSize * stageScale;
    const cameraTargetY = screenHeight / 2 - (player.renderY + 0.5) * this.tileSize * stageScale;

    this.stageContainer.position.set(cameraTargetX, cameraTargetY);

    // 3. Update NPCs across active & connected maps with playing-window viewport culling (Zero-allocation pass)
    for (let i = 0; i < this.activeNpcSpriteList.length; i++) {
      this.activeNpcSpriteList[i].visible = false;
    }
    for (let i = 0; i < this.activeNpcGrassMaskList.length; i++) {
      this.activeNpcGrassMaskList[i].visible = false;
    }

    const cullMargin = this.tileSize * stageScale;

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const offsetX = npc.worldOffsetX || 0;
      const offsetY = npc.worldOffsetY || 0;
      const npcPxX = (npc.renderX + offsetX + 0.5) * this.tileSize;
      const npcPxY = (npc.renderY + offsetY + 0.85) * this.tileSize;

      const screenX = cameraTargetX + npcPxX * stageScale;
      const screenY = cameraTargetY + npcPxY * stageScale;
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
        this.activeNpcSpriteList.push(sprite);
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
          this.activeNpcGrassMaskList.push(mask);
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

  /**
   * Renders active uncollected Overworld Item Balls and Fruit Tree berry indicators on the current map (Sprint 12)
   */
  public renderOverworldItems(
    itemBalls: OverworldItemBall[],
    fruitTrees: OverworldFruitTree[] = [],
    pickedTreeIds: Set<string> = new Set()
  ): void {
    if (!this.itemBallContainer) return;
    this.itemBallContainer.removeChildren();
    this.itemBallGraphics.clear();

    for (const ball of itemBalls) {
      const node = new Container();
      const px = (ball.x + 0.5) * this.tileSize;
      const py = (ball.y + 0.55) * this.tileSize;
      node.position.set(px, py);

      const g = new Graphics();
      // Drop shadow
      g.ellipse(0, 12, 13, 5).fill({ color: 0x000000, alpha: 0.35 });
      // Outer black border
      g.circle(0, 0, 13).fill({ color: 0x111827 });
      // Bottom white half
      g.arc(0, 0, 10, 0, Math.PI).fill({ color: 0xf8fafc });
      // Top red half
      g.arc(0, 0, 10, Math.PI, Math.PI * 2).fill({ color: 0xef4444 });
      // Center band & button
      g.rect(-11, -2, 22, 4).fill({ color: 0x111827 });
      g.circle(0, 0, 4.5).fill({ color: 0x111827 });
      g.circle(0, 0, 2.5).fill({ color: 0xf8fafc });
      // Specular highlight
      g.circle(-4, -5, 2.2).fill({ color: 0xfca5a5, alpha: 0.9 });

      node.addChild(g);
      this.itemBallContainer.addChild(node);
      this.itemBallGraphics.set(ball.eventFlag, node);
      this.itemBallGraphics.set(ball.id, node);
    }

    for (const tree of fruitTrees) {
      const node = new Container();
      const px = (tree.x + 0.5) * this.tileSize;
      const py = (tree.y + 0.5) * this.tileSize;
      node.position.set(px, py);

      const isPicked = pickedTreeIds.has(tree.treeId);

      if (this.fruitTreeTexture) {
        const sprite = new Sprite(this.fruitTreeTexture);
        sprite.anchor.set(0.5, 0.5);
        sprite.width = this.tileSize;
        sprite.height = this.tileSize;
        node.addChild(sprite);
      } else {
        // High-fidelity procedural Gen 2 berry tree fallback
        const g = new Graphics();
        // Drop shadow
        g.ellipse(0, 22, 24, 8).fill({ color: 0x000000, alpha: 0.35 });
        // Textured wooden trunk base
        g.rect(-8, 6, 16, 20).fill({ color: 0x5c3317 });
        g.rect(-6, 8, 4, 16).fill({ color: 0x78350f });
        g.rect(2, 8, 4, 16).fill({ color: 0x451a03 });
        // Multi-tiered leafy green canopy
        g.circle(0, 0, 24).fill({ color: 0x14532d });
        g.circle(-10, -6, 18).fill({ color: 0x166534 });
        g.circle(10, -6, 18).fill({ color: 0x166534 });
        g.circle(0, -12, 19).fill({ color: 0x15803d });
        // Leaf highlights
        g.circle(-6, -14, 10).fill({ color: 0x22c55e });
        g.circle(8, -12, 8).fill({ color: 0x22c55e });

        // Bare foliage branches if already harvested
        if (isPicked) {
          g.moveTo(-10, -4).lineTo(-16, -10).stroke({ width: 2, color: 0x451a03 });
          g.moveTo(10, -4).lineTo(16, -10).stroke({ width: 2, color: 0x451a03 });
          g.moveTo(0, 2).lineTo(0, -6).stroke({ width: 2, color: 0x451a03 });
        }
        node.addChild(g);
      }

      // Hanging colored berries matching fruit type when not picked
      if (!isPicked) {
        const berryColor = this.resolveBerryColor(tree.berryId);
        const berries = new Graphics();
        // Left berry cluster
        berries.circle(-10, -2, 5.5).fill({ color: berryColor });
        berries.circle(-11, -4, 1.8).fill({ color: 0xffffff, alpha: 0.85 });
        // Right berry cluster
        berries.circle(10, -2, 5.5).fill({ color: berryColor });
        berries.circle(9, -4, 1.8).fill({ color: 0xffffff, alpha: 0.85 });
        // Center-front berry
        berries.circle(0, 6, 6).fill({ color: berryColor });
        berries.circle(-1, 4, 2).fill({ color: 0xffffff, alpha: 0.85 });
        node.addChild(berries);
      }

      this.itemBallContainer.addChild(node);
      this.itemBallGraphics.set(tree.treeId, node);
    }
  }

  private resolveBerryColor(berryId?: string): number {
    if (!berryId) return 0xf59e0b;
    const norm = berryId.toLowerCase().replace(/[^a-z]/g, '');
    if (norm.includes('psncure')) return 0xf97316; // Orange (Psncureberry)
    if (norm.includes('przcure')) return 0x3b82f6; // Blue (Przcureberry)
    if (norm.includes('burnt')) return 0x06b6d4;   // Ice Cyan (Burnt Berry)
    if (norm.includes('bitter')) return 0xeab308;  // Yellow (Bitter Berry)
    if (norm.includes('mint')) return 0x10b981;    // Green (Mint Berry)
    if (norm.includes('ice')) return 0xef4444;     // Red (Ice Berry)
    if (norm.includes('mystery')) return 0x8b5cf6; // Purple (Mystery Berry)
    if (norm.includes('miracle')) return 0xfacc15; // Gold (Miracle Berry)
    return 0xf43f5e;                               // Red/Pink (Berry)
  }

  public removeItemBall(flagOrId: string): void {
    const node = this.itemBallGraphics.get(flagOrId);
    if (node) {
      node.visible = false;
      if (node.parent) {
        node.parent.removeChild(node);
      }
      this.itemBallGraphics.delete(flagOrId);
    }
  }
}
