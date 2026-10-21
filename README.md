# Crystal Overdrive

A high-performance, browser-based recreation of a **Classic 90s Handheld Monster RPG Engine** built with PixiJS v8, modern WebGL/WebGPU acceleration, authentic binary map extraction from reverse-engineered disassembly, real-time Showdown Dex battle math, and decoupled speed scaling.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![PixiJS](https://img.shields.io/badge/PixiJS-v8-e91e63.svg)](https://pixijs.com/)
[![Vitest](https://img.shields.io/badge/Tests-25%20Suites-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Non--Commercial%20Fan%20Tribute-yellow.svg)](LICENSE)

---

## 🎮 Key Features

* **Authentic Classic Region World:** 100% binary-faithful map recreation (New Bark Town, Route 29, Cherrygrove City, Route 30, Route 31, Violet City, Route 32, Ruins of Alph, Union Cave, Azalea Town, and beyond) directly extracted from upstream disassembly with authentic GBC palettes and metatiles.
* **Modernized Battle Engine:** Gen 4+ Physical/Special move split, live effectiveness pills, accurate competitive battle stats and damage formulas, EXP level-up animations, and active status effects.
* **Decoupled Speed Multipliers (`1x` / `2x` / `3x`):** Accelerate player movement or battles independently while world ambient water and NPC wander cycles remain at authentic real-time speeds.
* **Overworld Depth & Immersion:** Tall grass wading with foot clipping and leaf rustling, directional one-way ledge hopping, seamless cross-map NPC rendering, and line-of-sight trainer exclamation triggers.
* **Dynamic Roaming Beasts:** Legendary beast trio Markov adjacency graph with route transition roaming.
* **Full Out-of-Battle & In-Battle UI:** Start Menu (Monster Dex, Creature Party, Bag, Pocket Gear, Trainer Card, Save), party management, box storage, and medicine item usage.

---

## 🚀 Quick Start

### Prerequisites
* Node.js 18+
* npm or pnpm

### Installation
```bash
git clone https://github.com/jbveiga/crystal-overdrive.git
cd crystal-overdrive
npm install
```

### Running Locally
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### Running Automated Tests
```bash
npm test
```
Runs the Vitest test suite across physics, battle math, catch rates, UI modals, and save serialization.

### Production Build
```bash
npm run build
```

---

## 📚 Technical Documentation & Architecture

For deep dives into the engine architecture, module boundaries, state machines, and testing standards, see:
* **[ARCHITECTURE.md](ARCHITECTURE.md)** — Detailed technical specification, layered topology, and invariant guardrails.

---

## 🙏 Credits & Acknowledgements

* **[CREDITS.md](CREDITS.md)** — Full attribution for upstream disassembly contributors, Showdown Dex (@pkmn/dex), open-source libraries, and legal disclaimers.
* **[LICENSE](LICENSE)** — Non-Commercial Fan-Made Educational Tribute License.
