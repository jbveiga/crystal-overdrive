# Crystal Overdrive — Agent Operating Guidelines & Rules

## 1. Operating Directives
1. **Separation of Concerns:**
   - `src/core/`, `src/world/`, and `src/battle/` must contain **PURE TypeScript logic** with ZERO imports from `pixi.js`, `@pixi/`, or the browser DOM.
   - `src/render/` handles all PixiJS v8 rendering.
   - `src/ui/` handles all HTML5/CSS vector overlays.
2. **Implementation Pipeline:**
   - Always implement directly after creating or receiving a ticket.
   - Run `npm test` and `npm run build` after every single ticket to maintain 100% test passing baseline.
3. **Attribution & Documentation Integrity:**
   - Update `ARCHITECTURE.md` when data schemas or lifecycle logic change.
   - Update `CREDITS.md` when new external sprites, sounds, or tools are added.

---

## 2. Mandatory Periodic Project Optimization & Health Reviews

### 2.1 Review Cadence
- **Trigger:** Automatically orchestrated **every 5 to 10 completed feature implementations** (e.g. at the conclusion of Tickets 5.1–5.5, Tickets 6.1–6.5, Tickets 7.1–7.5, etc.).
- **Execution Command:** `npm run review` (`node scripts/project-optimization-review.cjs`).

### 2.2 Seven-Point Review Checklist
Every periodic review must audit and report on all 7 dimensions:
1. **Architectural Purity & Layer Boundary Scan:**
   - Ensure zero DOM/PixiJS imports in `src/core/`, `src/world/`, and `src/battle/`.
2. **NPC Coordinates & Collision Integrity:**
   - Verify that 100% of all NPCs across all registered maps stand on strictly walkable tiles (`0` or `2`).
3. **Map Connectivity & Reciprocal Warps:**
   - Assert all warps point to valid, registered target maps with matching return warps where applicable.
4. **Automated Test Suite (100% Pass Guarantee):**
   - Run `npx vitest run` ensuring 0 failures, 0 regressions, and updating test counts in `ARCHITECTURE.md`.
5. **Production Bundle Budgets & Code-Splitting:**
   - Run `npm run build` (`tsc` + Vite).
   - Ensure bundle code-splitting is clean (`dex`, `pixi`, `audio`, `vendor`, `index`) and core `index.js` remains compact (<500 kB).
6. **Mobile Ergonomics & Zero UI Collision:**
   - Ensure mobile touch controls (D-Pad, A/B buttons) do not collide with UI buttons or overlap dialogs.
   - Verify `100dvh` safe-area constraint and viewport containment on iOS/Android.
7. **Memory & Zero-Allocation Ticker Guarantees:**
   - Audit `OverworldRenderer.app.ticker` and `GridPhysics.updateEntity` to ensure zero per-frame array or object allocations during overworld traversal.

### 2.3 Review Deliverable
At the end of every periodic review, present the structured **Project Health & Optimization Report** summarizing:
- Current Test Baseline (Total tests / suites)
- Bundle Chunk Sizes
- Architectural & Walkability status
- Any performance bottlenecks identified or refactored
