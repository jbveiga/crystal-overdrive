# Crystal Overdrive — Acknowledgements & Credits

**Crystal Overdrive** is a non-commercial, open-source educational fan project built out of profound appreciation for the Pokémon series, specifically *Pokémon Crystal Version* (Game Boy Color, 2000/2001).

This project is made possible thanks to the tireless preservation work, reverse-engineering efforts, and open-source tooling created by the Pokémon community.

---

## 1. Upstream Reverse-Engineering & ROM Disassembly

### [pret/pokecrystal](https://github.com/pret/pokecrystal)
* **Authors:** The **Pokémon Reverse Engineering Team (pret)** and open-source contributors.
* **Repository:** [https://github.com/pret/pokecrystal](https://github.com/pret/pokecrystal)
* **Assets & Data Utilized:**
  - Authentic binary overworld and interior map block files (`.blk`).
  - Metatile definitions (`data/tilesets/*_metatiles.bin`) and collision maps (`data/tilesets/*_collision.asm`).
  - Game Boy Color 15-bit RGB palette maps (`gfx/tilesets/*_palette_map.asm` and `.pal`).
  - Authentic warp triggers, NPC spawn coordinates, and movement path scripts (`maps/*.asm`).
  - Overworld signpost text and canonical character dialogue scripts.
  - Supplemental tile references via [nikouu/Pokemon-gen-2-style-tilemap](https://github.com/nikouu/Pokemon-gen-2-style-tilemap).

---

## 2. Battle Mechanics, Dex Data & Sprites

### [Pokémon Showdown](https://pokemonshowdown.com/) & [@pkmn/dex](https://github.com/pkmn/ps)
* **Authors:** Guangcong Luo (Zarel) and the Pokémon Showdown / Smogon development community.
* **Repositories:**
  - Dex Package: [https://github.com/pkmn/ps](https://github.com/pkmn/ps)
  - Battle Engine: [https://github.com/smogon/pokemon-showdown](https://github.com/smogon/pokemon-showdown)
  - Sprite Server: [https://play.pokemonshowdown.com/sprites/](https://play.pokemonshowdown.com/sprites/)
* **Assets & Data Utilized:**
  - Modern Pokémon Showdown database providing pre-validated base stats, types, EXP growth formulas, and catch rates.
  - Gen 4+ Physical/Special move classification and live type effectiveness multipliers.
  - 2D front and back battle sprite renders and trainer battle poses.

### [Sierraffinity/CrystalDust](https://github.com/Sierraffinity/CrystalDust)
* **Authors:** Sierraffinity and the CrystalDust decompilation community.
* **Repository:** [https://github.com/Sierraffinity/CrystalDust](https://github.com/Sierraffinity/CrystalDust)
* **Assets Utilized:**
  - 9-frame overworld walk sheets (144x32px RGBA) for Silver, Prof. Elm, Mom, Teacher, Fisherman, Bug Catcher, Falkner, Sage, Earl, Bird Keeper, Elder Li, and Johto civilian NPCs.

### [PokeAPI / sprites](https://github.com/PokeAPI/sprites)
* **Authors:** Paul Hallett and the PokeAPI community.
* **License:** BSD 3-Clause / CC-BY-SA 4.0
* **Assets Utilized:**
  - Supplementary 2D Pokémon battle front and back renders.

---

## 3. Original Game Design, Art & Music Composition

The artistic soul and musical heritage of Johto belong to the original creators at **GAME FREAK inc.**:
* **Satoshi Tajiri:** Series Creator & Executive Direction.
* **Ken Sugimori:** Original Pokémon Designs, Character Concept Art, and Visual Direction.
* **Junichi Masuda & Go Ichinose:** Original Johto Soundtrack & Sound Effects Composition (including Violet City, Sprout Tower, Gym Leader Battles, and Victory Fanfares transcribed via `pret/pokecrystal`).

---

## 4. Core Open-Source Technologies

The engine and development tooling of Crystal Overdrive rely on the following open-source libraries:

| Library | Author / Organization | License | Usage in Crystal Overdrive |
| :--- | :--- | :--- | :--- |
| **[PixiJS v8](https://pixijs.com/)** | Goodboy Digital & PixiJS Team | MIT | High-performance WebGL 2.0 / WebGPU canvas renderer for 64x64 metatiles and battle arenas. |
| **[GSAP](https://gsap.com/)** | GreenSock | Standard License | Tweening engine powering decoupled 1x/2x/3x battle animation timescales and camera shakes. |
| **[Howler.js](https://howlerjs.com/)** | James Simpson (GoldFire Studios) | MIT | Web Audio API management and fallback audio playback. |
| **[idb](https://github.com/jakearchibald/idb)** | Jake Archibald | ISC | Asynchronous IndexedDB storage wrapper for game save state serialization. |
| **[Vite](https://vitejs.dev/)** | Evan You & Vite Contributors | MIT | Fast frontend development server and Rollup-based production bundler. |
| **[Vitest](https://vitest.dev/)** | Vitest Team | MIT | Headless unit testing framework powering our 43+ automated engine test suites. |
| **[TypeScript](https://www.typescriptlang.org/)** | Microsoft Corporation | Apache 2.0 | Type safety, architectural contracts, and strict separation of concerns. |
| **[FFmpeg](https://ffmpeg.org/)** | Fabrice Bellard & FFmpeg Team | LGPL 2.1+ / GPL 2+ | Transcoding and mastering audio loops (WebM/Opus & MP3). |

---

## 5. Legal & Non-Commercial Fan Project Disclaimer

* **Pokémon**, Pokémon character names, Pokémon game mechanics, and Game Boy Color are trademarks and registered copyrights of **Nintendo Co., Ltd.**, **Creatures Inc.**, and **GAME FREAK inc.**
* **Crystal Overdrive** is an unofficial, non-commercial, non-profit fan tribute created solely for educational, technical, and game-preservation purposes.
* This project is not affiliated with, endorsed by, sponsored by, or associated with Nintendo, GAME FREAK, or The Pokémon Company in any way.
* No monetization, subscriptions, advertisements, or paid distribution are associated with this project.
