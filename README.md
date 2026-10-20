# Crystal Overdrive

A high-performance, browser-based recreation of **Pokémon Crystal** built with PixiJS v8, modern WebGL/WebGPU acceleration, authentic binary map extraction from `pret/pokecrystal`, real-time Showdown Dex battle math, and decoupled speed scaling.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![PixiJS](https://img.shields.io/badge/PixiJS-v8-e91e63.svg)](https://pixijs.com/)
[![Vitest](https://img.shields.io/badge/Tests-41%2F41%20Passing-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Non--Commercial%20Fan%20Tribute-yellow.svg)](CREDITS.md)

---

## 🎮 Key Features

* **Authentic Johto World:** 100% binary-faithful map recreation (New Bark Town, Route 29, Cherrygrove City, Route 30, Route 31, Violet City) directly extracted from `pret/pokecrystal` disassembly with GBC palettes and metatiles.
* **Modernized Battle Engine:** Gen 4+ Physical/Special move split, live *Pokémon Unbound*-style type effectiveness pills, accurate Pokémon Showdown stats and damage formulas, EXP level-up animations, and active status effects.
* **Decoupled Speed Multipliers (`1x` / `2x` / `3x`):** Accelerate player movement or battles independently while world ambient water and NPC wander cycles remain at authentic real-time speeds.
* **Overworld Depth & Immersion:** Tall grass wading with foot clipping and leaf rustling, directional one-way ledge hopping, seamless cross-map NPC rendering, and line-of-sight trainer exclamation triggers.
* **Dynamic Roaming Beasts:** Raikou, Entei, and Suicune Markov adjacency graph with route transition roaming.
* **Full Out-of-Battle & In-Battle UI:** Start Menu (Pokédex, Pokémon Party, Bag, Pokégear, Trainer Card, Save), party management, and medicine item usage.

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
Runs the 41-test Vitest test suite across physics, battle math, catch rates, and save serialization.

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

* **[CREDITS.md](CREDITS.md)** — Full attribution for `pret/pokecrystal`, Pokémon Showdown (`@pkmn/dex`), open-source libraries, and legal disclaimers.
