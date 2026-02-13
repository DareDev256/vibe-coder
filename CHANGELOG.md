# Changelog

All notable changes to Vibe Coder will be documented in this file.

## [0.7.9] - 2026-02-13

### Fixed
- **Test stderr noise causing false failures** — Error-handling tests in SaveManager and RebirthManager leaked `console.error` output to stderr (`Failed to save run: Error`, `SyntaxError`), which automated agents (Passion Agent) misinterpreted as test failures. Now mocked with `vi.spyOn(console, 'error')` and asserted for correctness
- **CI deploys without running tests** — Deploy workflow (`deploy.yml`) ran `npm ci` + `npm run build` but never ran `npm test`, allowing broken code to reach production. Added test step before build

---

## [0.7.8] - 2026-02-12

### Security
- **Input validation hardened** — All 3 XP server variants (`server/index.js`, `electron/server.js`, `xp-server.js`) now validate event type and source against strict allowlists, rejecting unknown values with 400 errors
- **Request body size limits** — Express servers limited to 1KB payloads via `express.json({ limit })`. Standalone `xp-server.js` enforces byte-level cap on raw request body, preventing memory exhaustion DoS
- **Security headers added** — All HTTP responses now include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`
- **CORS restricted** — `xp-server.js` changed from wildcard `*` origin to `http://localhost:5173` only
- **Shared validation module** — New `server/validation.js` provides `validateEvent()`, `securityHeaders()`, and `getSecureHeaders()` used by all server variants
- **.gitignore hardened** — Added `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials.json`, `secrets.json` exclusion patterns
- **npm audit fix** — Patched 4 non-breaking dependency vulnerabilities (axios, lodash, qs, brace-expansion). 10 remaining are in dev-only build tooling (electron-builder/tar chain) requiring major version bumps

---

## [0.7.7] - 2026-02-12

### Changed
- **README accuracy audit** — Corrected enemy count from 18 → 19 (including all Classic, Coding, and AI-themed enemies with per-category counts), updated quote count from 75+ → 90+ after auditing both TitleScene and ArenaScene quote pools
- **Enemy type table expanded** — Each category now lists all members with specific behavior descriptions (was previously missing 7 enemies: Infinite Loop, Race Condition, Stack Overflow, 404, CORS Error, Type Error, Token Overflow, Context Loss, Overfitting)
- **Speech bubble quote table** — New section documenting all 5 quote categories: Combat (20), Coding Activity (20), Time-of-Day (17), CLI-Specific (10), Title Screen (20+)
- **Credits** — Added DareDev256 GitHub link

### Added
- **LICENSE file** — MIT license file in repo root (was declared in package.json but missing from filesystem, preventing GitHub license badge detection)
- **License badge** — Added MIT license shield to badge row
- **License section** — New section linking to LICENSE file

---

## [0.7.6] - 2026-02-12

### Added
- **47 CombatEdgeCases unit tests** — New test suite targeting edge-case-prone combat formulas identified from recent fix history:
  - `Enemy Health Scaling` — level 0 baseline, linear scaling, 3x cap at level 40+, integer HP output
  - `Boss Health Scaling` — wave-based scaling (1.5x at wave 20, 2x at 40), mini-boss scales slower than boss
  - `Boss Selection by Wave` — tier boundaries at wave 40/60/80, boundary-exact tests (wave 39 vs 40)
  - `Crit Damage Pipeline` — non-crit passthrough, crit doubling, zero-damage crit edge case
  - `Fork Bomb Child Damage Decay` — 0.7x per generation, `damage=1` decays to 0 (terminates fork chains), floor correctness
  - `Git-Conflict Split Stats` — 40% HP + 10 floor, 1.2x speed, 0.7x damage, 0.3x XP, two children give less XP than parent
  - `Vampiric Enemy Healing` — 10% heal, max-health cap, floor on fractional heal, zero-damage no-heal
  - `Wave Complete XP Reward` — boss vs non-boss multiplier, multiplicative XP stacking, integer output
  - `Spawn Count Capping` — linear scaling, hard cap at 25, boundary wave
  - `Spawn Pool Edge Cases` — negative wave returns empty, high wave includes all types, weight correctness, total pool size validation

### Changed
- **Test count** — 193 → 240 total unit tests across 8 test suites

---

## [0.7.5] - 2026-02-12

### Added
- **31 ShrineManager unit tests** — New test suite covering shrine system data integrity and logic:
  - `SHRINES` — 5 shrine definitions with required fields, unique ids/names, valid hex colors
  - `Shrine specifics` — POWER cost/buff values, GAMBLE free entry, XP cost/levelup, SHIELD weapon-for-invincibility trade, CHAOS health-for-random-effect
  - `GAMBLE_OUTCOMES` — 5 outcomes, weight distribution sums to 100, NOTHING most common, JACKPOT rarest
  - `CHAOS_EFFECTS` — 6 effects with unique keys, includes SPAWN BOSS (dangerous) and INVINCIBILITY (beneficial)
  - `canPayCost logic` — free/null always payable, health threshold check, XP sufficiency check
  - `getBuffMultiplier` — returns 1 with no buff, correct multiplier when active, 1 for unrelated type
  - `Constructor defaults` — shrines array, activeBuffs, shrinesPerMap, interactRadius
- **19 SaveManager persistence tests** — Expanded test coverage from time formatting to full save/load lifecycle:
  - `saveRun` — success return, correct key, timestamp/version, wave/stage/player preservation, Set-to-array conversion, QuotaExceededError handling
  - `loadRun` — null for missing save, valid data round-trip, 24h expiry enforcement, corrupted JSON recovery, auto-cleanup of expired saves
  - `hasSave` — false when empty, true after save
  - `clearSave` — removes from storage, hasSave returns false after
  - `getSaveSummary` — null when empty, summary fields, "just now" for fresh saves

### Changed
- **Test count** — 143 → 193 total unit tests across 7 test suites

---

## [0.7.4] - 2026-02-12

### Added
- **41 GameMechanics unit tests** — New test suite covering core gameplay formulas and data integrity:
  - `XP Curve` — monotonicity, integer output, known-value checks, positive-only guarantees
  - `Player Stats Scaling` — base stat formulas, attack rate floor clamping, modifier stacking (damage, health, shrine, rebirth), Glass Cannon half-health
  - `Spawn Pool` — weighted pool builder, waveMin enforcement (no early spawns), spawnWeight frequency, pool growth across waves
  - `Weapon System` — 16 weapons with unique colors, damage non-negativity, melee/ranged invariants, balance relationships (spread trades damage for projectiles, pierce > basic damage)
  - `Evolution Recipes` — 11 recipes with valid base weapon ingredients, unique result names, no self-combination
  - `Enemy Balance` — XP reward scaling with difficulty, hallucination harmlessness, segfault one-shot design, waveMin completeness
  - `Crit Chance` — base 10%, upgrade scaling, non-negative guarantee

### Changed
- **Test count** — 102 → 143 total unit tests across 6 test suites

---

## [0.7.3] - 2026-02-12

### Fixed
- **Pause menu keyboard handlers accumulate** — `destroyPauseMenu()` destroyed visual elements but never called `keyboard.off()` for the 6 listeners added in `pauseGame()`. After N pauses, pressing UP/DOWN/ENTER triggered N stacked callbacks, causing erratic menu navigation and wasted CPU
- **Weapon drop infinite tweens leak after destroy** — Weapon drops created with `createTrackedTween` (infinite pulse) were destroyed via plain `drop.destroy()` on both pickup and expiry paths, leaving orphaned tweens in `activeTweens` Set. Now uses `destroyWithTweenCleanup()` to stop tweens and remove from tracking
- **Shrine interact prompt tween survives scene shutdown** — `ShrineManager.createInteractPrompt()` created an infinite `repeat: -1` pulse tween but never stored the reference. `destroy()` destroyed the container but the tween kept running against a dead target. Now stored as `this.promptPulseTween` and stopped in `destroy()`

---

## [0.7.2] - 2026-02-12

### Fixed
- **15 announcement texts invisible off-camera** — Wave complete, boss spawn, mini-boss, weapon evolution, legendary weapon, rm-rf, sudo mode, XP magnet, music toggle, game restart, and respawn texts were placed at world coordinates without `setScrollFactor(0)`, making them invisible when the player was away from the top-left corner of the 2400x1800 map
- **Event timer bar negative/overflow scale** — `EventManager` timer bar could scale below 0 or above 1 on edge cases where `remaining` exceeded `totalDuration` or went negative, causing visual glitches. Now clamped to [0, 1]
- **Empty spawn pool crash guard** — `spawnEnemy()` could crash with `TypeError` on `undefined` access if `buildSpawnPool()` ever returned an empty array (defensive guard added)

---

## [0.7.1] - 2026-02-12

### Changed
- **Data-driven enemy spawn pool** — Replaced 50-line cascading if-chain in `spawnEnemy()` with `buildSpawnPool()` method that reads `waveMin` and `spawnWeight` directly from `enemyTypes` definitions. Adding a new enemy now requires editing one line instead of three separate locations
- **Single source of truth for enemy textures** — Eliminated 19-entry `textureMap` object by adding `texture` property to `enemyTypes`. Texture resolution now falls back to the enemy type name, matching existing convention for original enemies
- **Consistent `waveMin` on all enemies** — Original 6 enemies (bug, glitch, memory-leak, syntax-error, infinite-loop, race-condition) now have explicit `waveMin` values instead of relying on hardcoded if-statements

---

## [0.7.0] - 2026-02-12

### Added
- **Gameplay screenshot** — Hero image (`docs/gameplay.png`) captured from live deployment showing Wave 7 with Double XP event, enemies, shrines, and procedural map
- **Multi-CLI integration table** — Documented pre-built hooks for Claude Code, Codex, Gemini, Cursor, and generic tools with per-tool XP bonuses
- **Immortal Mode documentation** — Added accessibility feature description to Controls section (respawn on death, 50% XP penalty)

### Fixed
- **Quote count accuracy** — Corrected "95+ unique quotes" to "75+ unique quotes" after verifying against source code (75 actual quotes across idle, coding, time-based, and CLI-specific categories)

### Changed
- **Integration section renamed** — "Claude Code Integration" → "AI Coding Tool Integration" to reflect multi-tool support
- **Changelog summary** — Updated inline changelog to show latest 3 versions

---

## [0.6.9] - 2026-02-11

### Changed
- **Weapon color single source of truth** — Eliminated 32-entry duplicate `weaponColors` map in `updateHUD()`. All weapon colors now derived from `weaponTypes` and `evolutionRecipes` definitions, making color mismatches impossible when adding weapons
- **`hexToColorStr()` utility** — Extracted 6 repeated inline `toString(16).padStart(6, '0')` conversions into a single reusable method used by stage nodes, boss names, modifiers, boss announcements, mini-boss announcements, and evolution effects
- **`getWeaponColorStr()` lookup** — New method resolves any weapon type (base, evolved, or legendary) to its CSS color string by walking `weaponTypes` first, then `evolutionRecipes`

### Fixed
- **Kunai HUD color mismatch** — Kunai displayed as `#4a4a4a` in the HUD but was defined as `0x2f2f2f` in `weaponTypes`. The duplicate color map had drifted. Now impossible since colors derive from the single definition

---

## [0.6.8] - 2026-02-11

### Fixed
- **Evolved weapons never expired** — Weapon expiry timer compared the pre-evolution weapon type instead of the final evolved type, so evolved weapons (Laser Beam, Plasma Orb, etc.) became permanent until replaced
- **Immortal respawn invincibility cut short** — The i-frame flash timer from `playerHit()` was stored as a local variable and continued running after death, overwriting the 2-second immortal respawn invincibility after only ~1 second
- **Stage transition text invisible** — "ENTERING [stage name]" text was placed at world coordinates (400, 200) without `setScrollFactor(0)`, making it off-screen unless the player happened to be near the top-left corner
- **Missing XP multipliers on alternate kill paths** — Orbital weapon kills, legendary weapon kills, and AOE blast kills all bypassed XP event/modifier multipliers, giving raw un-multiplied XP during Double XP events
- **AOE blast kills dropped no weapon pickups** — Unlike projectile and legendary kills, AOE blast enemy deaths never called `spawnWeaponDrop()`, removing a loot source

---

## [0.6.7] - 2026-02-11

### Changed
- **README accuracy pass** — Corrected weapon count from 26 to 30 (16 base + 11 evolved + 3 legendary), evolution count from 10 to 11, quote count from "80+" to "95+"
- **Architecture diagram** — Added ASCII pipeline diagram showing real-time XP flow from dev tools through WebSocket to game engine
- **Technical Highlights section** — New table showcasing engineering decisions: zero-asset procedural generation, spatial hashing, real-time XP pipeline, procedural maps, and test coverage
- **Full evolution table** — Expanded from 5 shown + "discover more" to all 11 recipes with Special column
- **Deploy badge** — Added GitHub Actions deploy workflow status badge to shield row

---

## [0.6.6] - 2026-02-11

### Fixed
- **Split enemy health calculation** — Git-conflict split enemies used `enemy.health` (already 0 at death) instead of `maxHealth`, causing them to always spawn with only 10 HP instead of the intended ~28 HP
- **Vampiric healing uncapped** — Enemies with the vampiric modifier could heal infinitely past their spawn health because `maxHealth` was never set on regular enemies, and the fallback `enemy.health + healAmount` was always equal to the healed value
- **Missing `maxHealth` on regular enemies** — Added `maxHealth` property at spawn time, fixing both the vampiric healing cap and the split health calculation
- **XP server event listener memory leak** — `xpserver-connected` and `xpserver-disconnected` window event listeners were never removed on scene shutdown, leaking handlers on every game restart

---

## [0.6.5] - 2026-02-11

### Changed
- **README overhaul** — Portfolio-grade restructure documenting all game systems:
  - Added **Rebirth (Prestige) System** — 5 ranks from Junior Dev to Architect with stat/XP/weapon bonuses
  - Added **Run Modifiers** — 5 mutators (Glass Cannon, Vampiric Enemies, Bullet Hell, etc.)
  - Added **Interactive Shrines** — 5 shrine types with risk/reward mechanics (Power, Gamble, Wisdom, Protection, Chaos)
  - Added **Mid-Wave Events** — 5 dynamic events (Boss Incoming, Double XP, Curse, Jackpot, Swarm)
  - Added **Map Features** — Walls, hazard zones, destructible crates, teleporter pairs per biome
  - Added **Weapon Evolution Recipes** — Showcased 5 of 10 evolution combos with "discover more" hook
  - Added **Deadlock mini-boss** to boss table
  - Added **E key** for shrine interaction to Controls section
  - Added **Save & Continue** system documentation
  - Restructured features into Core Gameplay → Meta-Progression → Run Variety narrative flow
  - Added Tests badge to shield row, Vitest to Tech Stack
  - Expanded Permanent Upgrades table with per-level values and max total bonuses

---

## [0.6.4] - 2026-02-11

### Added
- **36 RebirthManager unit tests** — Full coverage of the prestige/rebirth system:
  - `MILESTONES` — shape validation, ascending wave order, sequential rebirth levels
  - `load/save` — localStorage persistence, default state, corrupted JSON recovery
  - `canRebirth` — wave threshold checks, milestone progression, max level guard
  - `performRebirth` — level updates, kill accumulation, highest wave tracking
  - `getAllStatsMultiplier / getXPMultiplier` — bonus scaling per rebirth level
  - `getStartingWeaponCount / getStartingWeapons` — weapon cap, pool validation, no duplicates
  - `getRebirthInfo` — display data, INTERN fallback, next milestone, lifetime stats

### Changed
- **Test count** — 66 → 102 total unit tests across 5 test suites

---

## [0.6.3] - 2026-02-10

### Fixed
- **Double hazard damage** — `handleHazardDamage()` was subtracting health internally AND returning the damage value for the caller to subtract again, causing 2x damage from hazard zones
- **MapManager tween memory leak** — Infinite tweens (`repeat: -1`) on walls, hazards, and teleporters now tracked and explicitly stopped on `clearMap()`, preventing tween accumulation across stage transitions
- **WebSocket reconnection race condition** — Added `connecting` state guard to prevent duplicate connections when `onclose` fires during a pending reconnect attempt
- **Negative health values** — Player and enemy health from hazard damage now clamped to 0 via `Math.max()`, preventing negative health that could break HUD display and auto-play EVADE logic

---

## [Unreleased]

### Added
- **Test infrastructure** — Vitest testing framework with `npm test` and `npm run test:watch` scripts
- **102 unit tests** across 5 test suites covering core game systems:
  - `SpatialHash` — cell key mapping, insert/clear, getNearby radius queries, cross-cell boundary lookups
  - `RunModifiers` — modifier selection, combined effect multiplier/flag merging, getById/getAll lookups
  - `SaveManager` — getTimeAgo time formatting across seconds/minutes/hours/days boundaries
  - `EventManager` — event definitions, active effects, effect application/clearing, trigger guards
  - `RebirthManager` — milestones, load/save, canRebirth, performRebirth, multipliers, weapon selection, info display

### Changed
- **README** — Expanded project structure to document all 6 systems (EventManager, MapManager, RebirthManager, RunModifiers, SaveManager, ShrineManager), all 3 utils (SpatialHash, audio, socket), and the test directory
- **README** — Added Testing section with test commands and coverage summary

---

## [0.5.0] - 2025-01-15 - The AI Uprising Update

### Smart Auto-Play System
- **Intelligent Combat AI** - Character now actively hunts enemies instead of just dodging
  - **HUNT Mode** - Moves toward nearest enemy to engage
  - **EVADE Mode** - Kites and circle-strafes when low health (<30%) or swarmed (4+ enemies)
  - **IDLE Mode** - Gentle wandering when no enemies present
- **Mode-Specific Quotes** - Character speaks differently based on combat mode
  - Hunt: "Target acquired!", "Here I come!", "Easy XP"
  - Evade: "Too hot!", "*kiting*", "Tactical retreat"
  - Idle: "All clear!", "Wave done?", "*stretches*"
- **Visual Mode Indicators** - Shows ⚔️ hunt, 🛡️ evade, or 😴 idle status

### CLI Integration Fixes
- Fixed XP events not triggering auto-move (source parameter now passed correctly)
- Fixed "CONNECTING" status staying stuck when already connected
- Added in-game speech bubbles that follow player position
- Real-time connection status with 🟢 LIVE / ⚫ OFFLINE indicators

---

## [0.4.0] - 2025-01-14 - The Mega Content Update

### 18 Enemy Types
Each enemy has unique AI behavior and spawns at specific wave thresholds:

**Classic Coding Enemies**
| Enemy | Behavior | Spawns |
|-------|----------|--------|
| Bug | Basic chase | Wave 1+ |
| Glitch | Fast, glitchy | Wave 3+ |
| Memory Leak | Slow, tanky | Wave 8+ |
| Syntax Error | Teleports | Wave 10+ |
| Infinite Loop | Orbits you | Wave 12+ |
| Race Condition | Erratic speed | Wave 15+ |

**Coding-Themed Threats**
| Enemy | Behavior | Spawns |
|-------|----------|--------|
| Segfault | Instant-death zone | Wave 30+ |
| Dependency Hell | Spawns minions | Wave 35+ |
| Stack Overflow | Grows over time | Wave 25+ |
| 404 Not Found | Goes invisible | Wave 18+ |
| CORS Error | Blocks your path | Wave 22+ |
| Type Error | Shape-shifts | Wave 28+ |
| Git Conflict | Splits when hit | Wave 32+ |

**AI-Themed Enemies**
| Enemy | Behavior | Spawns |
|-------|----------|--------|
| Hallucination | Fake enemy (0 damage) | Wave 20+ |
| Token Overflow | Damage grows | Wave 25+ |
| Context Loss | Random teleport/wander | Wave 30+ |
| Prompt Injection | Hijacks movement | Wave 40+ |
| Overfitting | Predicts movement | Wave 38+ |
| Mode Collapse | Clones itself | Wave 45+ |

### 4 Epic Bosses
| Boss | Wave | HP | Special Ability |
|------|------|-----|-----------------|
| STACK OVERFLOW | 20 | 2,000 | Spawns minions |
| NULL POINTER | 40 | 3,500 | Teleportation |
| MEMORY LEAK PRIME | 60 | 5,000 | Splits on damage |
| KERNEL PANIC | 80 | 8,000 | Enrages at low HP |

### Mini-Boss
- **DEADLOCK** - 500 HP, freezes player on hit

### Weapon Arsenal

**9 Base Ranged Weapons**
| Weapon | Special |
|--------|---------|
| Basic | Standard projectile |
| Spread | 5 projectiles |
| Pierce | Pierces enemies |
| Orbital | Circles player |
| Rapid | 3x fire rate |
| Homing | Tracks enemies |
| Bounce | Bounces off walls |
| AOE | Area damage |
| Freeze | Slows enemies |

**4 Melee Weapons**
| Weapon | Type |
|--------|------|
| Sword | Slash arc |
| Spear | Thrust (pierces 3) |
| Boomerang | Returns to you |
| Kunai | 3 thrown projectiles |

**3 Legendary Weapons** (Permanent unlocks!)
| Legendary | Drop Rate | Effect |
|-----------|-----------|--------|
| Hunter's Warglaive | 0.01% | Twin spinning blades |
| Void Reaper | 0.05% | Soul-consuming scythe |
| Celestial Blade | 0.03% | Triple starlight orbitals |

**3 Rare Weapons**
| Weapon | Effect |
|--------|--------|
| rm -rf | Clears ALL enemies |
| sudo | God mode (3x damage + pierce) |
| Fork Bomb | Projectiles multiply |

**10 Evolved Weapons** (Combine 2 weapons!)
| Recipe | Result |
|--------|--------|
| Spread + Pierce | LASER BEAM |
| Orbital + Rapid | PLASMA ORB |
| Pierce + Rapid | CHAIN LIGHTNING |
| Spread + Rapid | BULLET HELL |
| Orbital + Spread | RING OF FIRE |
| Homing + Pierce | SEEKING MISSILE |
| Bounce + Spread | CHAOS BOUNCE |
| AOE + Orbital | DEATH AURA |
| Freeze + Pierce | ICE LANCE |
| Homing + Rapid | SWARM |
| Freeze + AOE | BLIZZARD |

### 7 Meta-Progression Upgrades
Persistent upgrades that carry across runs:
- **DAMAGE+** - +10% per level (10 levels)
- **HEALTH+** - +15% per level (10 levels)
- **SPEED+** - +8% per level (8 levels)
- **ATTACK+** - +12% attack speed (8 levels)
- **XP GAIN+** - +15% XP earned (10 levels)
- **CRIT+** - +5% crit chance (6 levels)
- **DURATION+** - +20% weapon duration (5 levels)

### 6 Stage Themes
| Stage | Starts | Theme Color |
|-------|--------|-------------|
| Debug Zone | Wave 1 | Cyan |
| Memory Banks | Wave 25 | Purple |
| Network Layer | Wave 50 | Green |
| Kernel Space | Wave 75 | Red |
| Cloud Cluster | Wave 100 | Blue |
| Singularity | Wave 150 | Gold |

### Audio System
**5 Dynamic Music Tracks** (Web Audio API generated)
- Retro synthwave procedural generation
- Track changes with stage progression

**13+ Sound Effects**
- Weapon firing (unique per weapon)
- Enemy hit/death
- Level up
- Pickup collection
- Boss spawn/death
- Player damage

### Title Screen
- **Animated Character** - Idle animation with bobbing and floating particles
- **Speech Bubble System** - Reacts to coding activity
- **21+ Coding Quotes** including:
  - "Code go brrrr"
  - "10x developer mode"
  - "Context window getting thicc"
  - "Ship it ship it!"
- **Time-Based Easter Eggs** - Special quotes for late night coding
- **AI-Specific Quotes** - Different reactions for Claude, Cursor, Gemini, Codex

### Full Menu System
- **START GAME** - Begin the arena
- **UPGRADES** - Meta-progression shop
- **WEAPONS** - Gallery of all weapons
- **SETTINGS** - Audio, auto-move, player name
- **CONTROLS** - Keybinds reference

### Settings & Persistence
- Master/SFX/Music volume controls
- Auto-move toggle
- Player name customization
- All progress saved to localStorage

### Map & Camera
- **Large Explorable World** (2400x1800)
- **Smooth Camera Following** with deadzone
- **Procedural Background** - Circuit board aesthetic
- **Bounds Checking** - Keeps player in play area

### HUD System
- Health bar with damage flash
- XP bar with level display
- Wave counter
- Kill counter
- Current weapon display
- Stage name
- Connection status (🟢/⚫)
- High score tracking

### Pause Menu
- Resume game
- Settings access
- Restart
- Return to title

---

## [0.3.0] - 2025-01-12 - The Hook Update

### Claude Code Integration
- **XP Server** - WebSocket server on port 3333
- **Real-time XP** from actual coding:
  - Tool use: +10 XP
  - Response: +5 XP
  - Message: +10 XP
- **Hook System** - Integrates with Claude Code's on-prompt hooks
- **Color-coded XP Popups** - Different colors for different sources
- **Reconnection Logic** - Auto-reconnects if server drops

---

## [0.2.0] - 2025-01-10 - Core Gameplay

### Initial Features
- Phaser 3 game engine with Vite bundler
- Wave-based survival gameplay
- Auto-attacking weapon system
- Basic enemy AI
- Level-up system
- Procedural graphics (no external assets)
- Pause system with ESC/P
- Manual XP with SPACE key

---

## Technical Stack

- **Engine**: Phaser 3.x
- **Bundler**: Vite 7.x
- **Audio**: Web Audio API (procedural)
- **Graphics**: Canvas API (procedural)
- **Networking**: WebSocket
- **Backend**: Node.js
- **Persistence**: localStorage

---

## Credits

Built with [Claude Code](https://claude.ai/claude-code)

Hunter's Warglaive artwork inspired by Luu

---

**Code to Conquer!** 🚀
