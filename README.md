# VIBE CODER 🎮⚡

A vampire survivors-style idle game where you earn XP from real coding activity. Code to conquer!

### [▶️ Play Now](https://daredev256.github.io/vibe-coder/) | [⬇️ Download Desktop App](#-desktop-app) | [📖 Setup Guide](./SETUP.md) | [📋 Changelog](./CHANGELOG.md)

![Phaser 3](https://img.shields.io/badge/Phaser-3.x-blue) ![Vite](https://img.shields.io/badge/Vite-7.x-purple) ![Electron](https://img.shields.io/badge/Electron-33.x-9feaf9) ![Node](https://img.shields.io/badge/Node-18+-green) ![Tests](https://img.shields.io/badge/Tests-102_passing-brightgreen) ![Deploy](https://img.shields.io/github/actions/workflow/status/DareDev256/vibe-coder/deploy.yml?label=Deploy) ![Play Online](https://img.shields.io/badge/Play-Online-brightgreen)

<div align="center">
  <img src="docs/gameplay.png" alt="Vibe Coder gameplay — Wave 7 with Double XP event, enemies, shrines, and procedural map" width="720">
  <br><em>Wave 7 in Debug Zone — Double XP event active, enemies swarming, shrines waiting</em>
</div>

## 🎯 About

Vibe Coder is an idle survival game that rewards you for coding. Connect it to your development workflow and watch your character grow stronger as you write code. Every tool call, every prompt, every commit powers up your in-game character.

**While you code, your character:**
- 🎯 Hunts enemies with smart auto-play AI (HUNT / EVADE / IDLE modes)
- ⚔️ Auto-attacks with 30 weapons including 11 evolved combos
- 🔄 Earns permanent prestige bonuses through the Rebirth system
- 🎲 Discovers interactive shrines with risk/reward choices
- 💬 Comments on your coding with 75+ unique quotes

### How It Works

```
 You Code                    Vibe Coder
┌──────────┐  WebSocket   ┌──────────────────────────────┐
│ Claude   │──on-prompt──▶│  XP Server (:3333)           │
│ Code     │  hook fires  │    │                          │
│          │              │    ▼                          │
│ IDE      │──HTTP POST──▶│  Game Engine (Phaser 3)      │
│ Terminal │              │    ├─ Auto-Play AI            │
│ etc.     │              │    ├─ 18 Enemy Types + Bosses │
└──────────┘              │    ├─ Weapon Evolution        │
                          │    └─ Prestige System         │
                          └──────────────────────────────┘
```

## ✨ Core Gameplay

### 🎮 Smart Auto-Play AI
- **HUNT Mode** ⚔️ - Actively pursues nearest enemy within optimal range
- **EVADE Mode** 🛡️ - Circle-strafes when HP < 30% or swarmed by 4+ enemies
- **IDLE Mode** 😴 - Gentle wander toward center when area is clear
- Mode-specific speech bubbles and visual indicators

### 👾 18 Enemy Types
| Type | Examples | Unique Behaviors |
|------|----------|-----------------|
| **Classic** | Bug, Glitch, Memory Leak, Syntax Error | Teleporting, orbiting, erratic speed |
| **Coding** | Segfault, Dependency Hell, Git Conflict | Instant-kill zones, minion spawning, splitting |
| **AI-Themed** | Hallucination, Prompt Injection, Mode Collapse | Fake enemies, movement hijacking, self-cloning |

### 👹 4 Epic Bosses + Mini-Boss
| Boss | Wave | Special Ability |
|------|------|-----------------|
| **Stack Overflow** | 20 | Spawns minions |
| **Null Pointer** | 40 | Teleportation |
| **Memory Leak Prime** | 60 | Splits on damage |
| **Kernel Panic** | 80 | Enrages at low HP |
| **Deadlock** | Mini | Freezes player on hit |

### ⚔️ 30 Weapons & Evolution System
| Category | Count | Examples |
|----------|-------|----------|
| Ranged | 9 | Basic, Spread, Pierce, Homing, Freeze |
| Melee | 4 | Sword, Spear, Boomerang, Kunai |
| Rare | 3 | `rm -rf`, `sudo`, Fork Bomb |
| Legendary | 3 | Hunter's Warglaive, Void Reaper, Celestial Blade |
| **Evolved** | **11** | **Combine 2 weapons for super forms** |

**All 11 Weapon Evolution Recipes** — Collect both ingredients to evolve:

| Recipe | Result | Special |
|--------|--------|---------|
| Spread + Pierce | LASER BEAM | Multi-pierce |
| Orbital + Rapid | PLASMA ORB | 5 orbitals |
| Pierce + Rapid | CHAIN LIGHTNING | 3-chain arcs |
| Spread + Rapid | BULLET HELL | 8-projectile spray |
| Orbital + Spread | RING OF FIRE | 8-orbital ring |
| Homing + Pierce | SEEKING MISSILE | Piercing tracker |
| Bounce + Spread | CHAOS BOUNCE | 5-bounce scatter |
| AOE + Orbital | DEATH AURA | 150px kill zone |
| Freeze + Pierce | ICE LANCE | 3s freeze-through |
| Homing + Rapid | SWARM | 3 homing drones |
| Freeze + AOE | BLIZZARD | AoE freeze field |

### 🌍 6 Biome Stages
Each biome has distinct visuals, environmental hazards, and destructible objects:

Debug Zone → Memory Banks → Network Layer → Kernel Space → Cloud Cluster → Singularity

**Map features:** Walls (block movement + projectiles), hazard zones (5-20 damage), destructible crates (drop XP/weapons), and teleporter pairs for fast traversal.

## 🔄 Meta-Progression

### 🏆 Rebirth (Prestige) System
Reach wave milestones to permanently power up across all future runs:

| Rank | Wave | Bonus |
|------|------|-------|
| Junior Dev | 50 | +5% all stats, +10% XP |
| Mid-Level | 100 | +10% all stats, +20% XP, +1 starting weapon |
| Senior Dev | 150 | +15% all stats, +30% XP, +2 starting weapons |
| Tech Lead | 200 | +20% all stats, +40% XP, +3 starting weapons |
| Architect | 250 | +25% all stats, +50% XP, +3 starting weapons |

Tracks lifetime stats: total rebirths, lifetime kills, highest wave ever reached.

### 📊 7 Permanent Upgrades
Spend XP on persistent buffs that carry across runs:

| Upgrade | Per Level | Max | Total Bonus |
|---------|-----------|-----|-------------|
| DAMAGE+ | +10% | 10 | +100% |
| HEALTH+ | +15% | 10 | +150% |
| SPEED+ | +8% | 8 | +64% |
| ATTACK+ | +12% | 8 | +96% |
| XP GAIN+ | +15% | 10 | +150% |
| CRIT+ | +5% | 6 | +30% |
| DURATION+ | +20% | 5 | +100% |

### 🎖️ 3 Legendary Weapons
Ultra-rare permanent unlocks that persist forever:

| Legendary | Drop Rate | Effect |
|-----------|-----------|--------|
| Hunter's Warglaive | 0.01% | Twin spinning blades |
| Void Reaper | 0.05% | Soul-consuming scythe |
| Celestial Blade | 0.03% | Triple starlight orbitals |

## 🎲 Run Variety

### ⚔️ Run Modifiers
Mutators applied at run start that change how you play:

| Modifier | Effect |
|----------|--------|
| **Glass Cannon** | 2x damage, 50% max health |
| **Vampiric Enemies** | Enemies heal 10% of damage dealt |
| **Weapon Frenzy** | -50% weapon duration, +50% drop rate |
| **Bullet Hell** | +100% projectiles, +50% enemies |
| **Marathon** | Waves 50% longer, +25% XP |

### 🎪 Mid-Wave Events
15% chance per wave (starting wave 5) to trigger dynamic chaos:

| Event | Duration | Effect |
|-------|----------|--------|
| **Boss Incoming** 💀 | 30s | Countdown, then mini-boss spawns |
| **Double XP** ⭐ | 20s | 2x XP from all sources |
| **Curse** 😈 | 60s | All enemies +50% speed |
| **Jackpot** 🎰 | 30s | Only rare weapon drops |
| **Swarm** 🐛 | 15s | 20 enemies spawn rapidly |

### 🏛️ Interactive Shrines
2 shrines spawn per stage. Walk up and press **E** to activate:

| Shrine | Cost | Reward |
|--------|------|--------|
| **Power** ⚔️ | 25% HP | +50% damage for 30s |
| **Gamble** 🎲 | Free | Random: Jackpot XP, Weapon, Heal, Curse, or Nothing |
| **Wisdom** 📚 | 500 XP | Instant level up |
| **Protection** 🛡️ | Current weapon | 10s invincibility |
| **Chaos** 🌀 | 10% HP | Random: Double XP, Speed, Invincibility, Enemy Freeze, Curse, or Boss |

### 💾 Save & Continue
- Auto-saves at wave completion
- **CONTINUE** option on title screen with "Wave X, Stage Y, Xm ago" summary
- Saves expire after 24 hours

## 🎮 Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| E | Interact with Shrines |
| ESC / P | Pause |
| M | Toggle Music |
| SPACE | Manual XP (offline mode) |
| G | Secret: Unlock Hunter's Warglaive |

**Immortal Mode** — Toggle in Settings. Respawn on death instead of game over (50% XP penalty). Great for idle play while coding.

## 🚀 Quick Start

### Play Online (No Install)
**[▶️ Play Vibe Coder Now](https://daredev256.github.io/vibe-coder/)**

Press **SPACE** to manually gain XP, or connect the hooks for real coding rewards!

### Local Development
```bash
npm install       # Install dependencies
npm run dev       # Start the game
npm run server    # (Optional) XP server for live coding rewards
```

Open http://localhost:5173 in your browser.

## 🖥️ Desktop App

Run Vibe Coder as a native desktop app with system tray integration!

### Download
Check the [Releases](https://github.com/DareDev256/vibe-coder/releases) page for pre-built binaries:
- **macOS**: `.dmg` installer (Universal - Intel + Apple Silicon)
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` or `.deb`

### Features
- **System Tray** - Lives in your menu bar, always accessible
- **Built-in XP Server** - No separate server needed
- **4 Window Modes** - Floating, Corner Snap, Desktop Widget, Mini HUD
- **Global Shortcuts** - `Cmd/Ctrl+Shift+V` toggle, `Cmd/Ctrl+Shift+W` cycle modes

### Build from Source
```bash
npm run electron:dev    # Development mode (hot reload)
npm run electron:build  # Build distributable
```

## 🔌 AI Coding Tool Integration

Connect Vibe Coder to your AI coding assistant for real XP gains while coding!

> **Note:** The online demo doesn't support live XP (requires local server). For the full experience, run locally with hooks connected.

**Supported tools** — pre-built hooks included for each:

| Tool | Hook Script | Bonus XP |
|------|-------------|----------|
| **Claude Code** | `hooks/claude-code-hook.sh` | +15 per action |
| **Codex** | `hooks/codex-hook.sh` | +12 per action |
| **Gemini** | `hooks/gemini-hook.sh` | +12 per action |
| **Cursor** | `hooks/cursor-hook.sh` | +10 per action |
| **Generic** | `hooks/vibe-coder-hook.sh` | +8 per action |

**Quick Setup (Claude Code):**
1. Clone the repo and run `npm install`
2. Start the XP server: `npm run server`
3. Copy `hooks/on-prompt.sh` to `~/.claude/hooks/`
4. Start the game: `npm run dev`
5. Code normally — XP flows into the game automatically!

**[📖 Full Setup Guide](./SETUP.md)** — Detailed instructions, troubleshooting, custom integrations

## 📁 Project Structure

```
vibe-coder/
├── src/
│   ├── main.js               # Game config, upgrades, legendaries
│   ├── __tests__/             # Vitest unit tests (102 tests)
│   ├── scenes/
│   │   ├── BootScene.js       # Procedural texture generation
│   │   ├── TitleScene.js      # Menu, upgrades, weapon gallery
│   │   └── ArenaScene.js      # Main gameplay, enemies, bosses
│   ├── systems/
│   │   ├── EventManager.js    # Mid-wave random events
│   │   ├── MapManager.js      # Procedural map generation & biomes
│   │   ├── RebirthManager.js  # Prestige system (permanent bonuses)
│   │   ├── RunModifiers.js    # Run-start mutators
│   │   ├── SaveManager.js     # Run continuation & auto-save
│   │   └── ShrineManager.js   # Interactive risk/reward shrines
│   └── utils/
│       ├── SpatialHash.js     # O(n) spatial collision detection
│       ├── audio.js           # Procedural sound system
│       └── socket.js          # WebSocket XP client
├── electron/                  # Desktop app (main, tray, windows)
├── server/                    # Standalone XP server
├── hooks/                     # Claude Code hooks
└── index.html
```

## 🏗️ Technical Highlights

| Decision | Why |
|----------|-----|
| **Zero external assets** | All graphics + audio generated procedurally at runtime via Canvas/Web Audio API — no sprite sheets, no sound files, instant load |
| **Spatial hashing** | O(n) collision detection via `SpatialHash` grid instead of O(n²) pairwise checks — handles 200+ entities at 60fps |
| **Real-time XP pipeline** | WebSocket bridge turns any dev tool (Claude Code, IDE, CLI) into a game controller via simple HTTP POST |
| **Procedural maps** | Each biome generates walls, hazards, destructibles, and teleporters at runtime — no static level data |
| **Single-source color system** | All 30 weapon colors derived from `weaponTypes`/`evolutionRecipes` — zero duplication, impossible to mismatch |
| **102 unit tests** | Core systems (SpatialHash, RunModifiers, SaveManager, EventManager, RebirthManager) tested with Vitest |

## 🔧 Tech Stack

- **Phaser 3** - Game engine
- **Vite** - Build tool & dev server
- **Electron** - Desktop app wrapper
- **Vitest** - Unit testing (102 tests)
- **Web Audio API** - Procedural sound generation
- **Canvas API** - Procedural graphics (no external assets!)
- **WebSocket** - Real-time XP streaming
- **Node.js** - XP server backend

## 🧪 Testing

```bash
npm test            # Run all tests once
npm run test:watch  # Watch mode (re-runs on file changes)
```

102 unit tests cover core game systems: `SpatialHash`, `RunModifiers`, `SaveManager`, `EventManager`, and `RebirthManager`.

## 📋 Changelog

**v0.7.0** — README hero screenshot, multi-CLI integration docs, Immortal Mode docs, quote count fix.

**v0.6.9** — Single-source weapon color system, eliminated duplicate color map.

**v0.6.8** — Fixed evolved weapon expiry, respawn invincibility race, stage text, XP multipliers.

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

## 🎨 Credits

Built with [Claude Code](https://claude.ai/claude-code) - the AI coding assistant.

Hunter's Warglaive artwork inspired by Luu.

---

**Code to Conquer!** 🚀
