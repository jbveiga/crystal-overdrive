# Crystal Overdrive — Acknowledgements & Credits

**Crystal Overdrive** is a non-commercial, open-source educational fan project built out of profound appreciation for classic 90s handheld monster RPGs, specifically the 2000/2001 Crystal Version (Game Boy Color).

This project is made possible thanks to the tireless preservation work, reverse-engineering efforts, and open-source tooling created by the fan community.

---

## 1. Upstream Reverse-Engineering & ROM Disassembly

### [pret/pokecrystal](https://github.com/pret/pokecrystal)
* **Authors:** The **pret reverse-engineering team** and open-source contributors.
* **Repository:** [https://github.com/pret/pokecrystal](https://github.com/pret/pokecrystal)
* **Assets & Data Utilized:**
  - Authentic binary overworld and interior map block files (`.blk`).
  - Metatile definitions (`data/tilesets/*_metatiles.bin`) and collision maps (`data/tilesets/*_collision.asm`).
  - Game Boy Color 15-bit RGB palette maps (`gfx/tilesets/*_palette_map.asm` and `.pal`).
  - Authentic warp triggers, NPC spawn coordinates, and movement path scripts (`maps/*.asm`).
  - Overworld signpost text and canonical character dialogue scripts.
  - Authentic Gen 2 creature front and back battle sprites (`gfx/pokemon/marill/front.png`, `back.png`, and classic region roster sprites).
  - In-battle move attack animation VFX sprites (`gfx/battle_anims/*.png`: `hit`, `cut`, `fire`, `water`, `bubble`, `lightning`, `ice`, `plant`, `rocks`, `smoke`, `shine`, `poison`, `wind`, `speed`).
  - Authentic overworld object event sprites (`gfx/sprites/fruit_tree.png` with authentic `PAL_OW_TREE` GBC palette).
  - Supplemental tile references via [nikouu/Pokemon-gen-2-style-tilemap](https://github.com/nikouu/Pokemon-gen-2-style-tilemap).

---

## 2. Battle Mechanics, Dex Data & Sprites

### [Showdown Battle Engine](https://pokemonshowdown.com/) & [@pkmn/dex](https://github.com/pkmn/ps)
* **Authors:** Guangcong Luo (Zarel) and the Showdown / Smogon development community.
* **Repositories:**
  - Dex Package: [https://github.com/pkmn/ps](https://github.com/pkmn/ps)
  - Battle Engine: [https://github.com/smogon/pokemon-showdown](https://github.com/smogon/pokemon-showdown)
  - Sprite Server: [https://play.pokemonshowdown.com/sprites/](https://play.pokemonshowdown.com/sprites/)
* **Assets & Data Utilized:**
  - Modern battle database providing pre-validated base stats, types, EXP growth formulas, and catch rates.
  - Gen 4+ Physical/Special move classification and live type effectiveness multipliers.
  - 2D front and back battle sprite renders and trainer battle poses.

### [Sierraffinity/CrystalDust](https://github.com/Sierraffinity/CrystalDust)
* **Authors:** Sierraffinity and the CrystalDust decompilation community.
* **Repository:** [https://github.com/Sierraffinity/CrystalDust](https://github.com/Sierraffinity/CrystalDust)
* **Assets Utilized:**
  - 9-frame overworld walk sheets (144x32px RGBA) for Silver, Prof. Elm, Prof. Oak, Sudowoodo, Mom, Teacher, Fisherman, Bug Catcher, Falkner, Sage, Earl, Bird Keeper, Elder Li, and classic region civilian NPCs.

### [PokeAPI / sprites](https://github.com/PokeAPI/sprites)
* **Authors:** Paul Hallett and the PokeAPI community.
* **License:** BSD 3-Clause / CC-BY-SA 4.0
* **Assets Utilized:**
  - Complete Generation 1 & 2 creature battle front and back renders across all 251 species (Bulbasaur to Celebi, `public/assets/sprites/pokemon/*_{front,back}.png`).
  - Generation 1 & 2 Party and PC Box menu mini-sprites across all 251 species (`public/assets/sprites/pokemon/icons/*.png`).
  - Authentic capture ball item and throw sprites (`sprites/items/*.png`: Standard, Great, Ultra, Master, Fast, Heavy, Level, Lure, Moon, Friend, Love, Dusk, Net, Quick, Timer, Repeat, Nest Balls).

### Modern Ergonomic Battle UI Inspiration
* **Authors:** Skeli and the community development team.
* **Design Inspiration Utilized:**
  - Real-time 2x2 Fight move matrix with live type effectiveness pills (`4x ULTRA`, `2x SUPER`, `1x NORMAL`, `0.5x NOT VERY`, `0.25x RESIST`, `0x IMMUNE`), Physical/Special/Status category icons, and modern asymmetric battle HUD ergonomics.

---

## 3. Original Game Design, Art & Music Composition

The artistic heritage and musical composition of the classic handheld region belong to the original creators at **GAME FREAK inc.**:
* **Satoshi Tajiri:** Series Creator & Executive Direction.
* **Ken Sugimori:** Original Creature Designs, Character Concept Art, and Visual Direction.
* **Junichi Masuda & Go Ichinose:** Original Classic Region Soundtrack & Sound Effects Composition (including New Bark Town, Route 29/30/31, Cherrygrove City, Elm's Lab, Wild Battle, Trainer Battle, Violet City, Sprout Tower, Gym Leader Battles, and Fanfares transcribed via `pret/pokecrystal`).

---

## 4. Legal & Non-Commercial Fan Project Disclaimer

* All original character names, creature designs, mechanics, and Game Boy Color are trademarks and registered copyrights of their respective owners (**Nintendo Co., Ltd.**, **Creatures Inc.**, and **GAME FREAK inc.**).
* **Crystal Overdrive** is an unofficial, non-commercial, non-profit fan tribute created solely for educational, technical, and game-preservation purposes.
* This project is not affiliated with, endorsed by, sponsored by, or associated with Nintendo, GAME FREAK, or any related entity in any way.
* No monetization, subscriptions, advertisements, or paid distribution are associated with this project. See [LICENSE](LICENSE) for full licensing terms.
