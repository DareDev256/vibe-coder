# VIBE CODER 🎮⚡

A vampire survivors-style idle game where you earn XP from real coding activity. Code to conquer!

### [▶️ Play Now](https://daredev256.github.io/vibe-coder/) | [⬇️ Download Desktop App](#-desktop-app) | [📖 Setup Guide](./SETUP.md) | [📋 Changelog](./CHANGELOG.md)

![Phaser 3](https://img.shields.io/badge/Phaser-3.x-blue) ![Vite](https://img.shields.io/badge/Vite-7.x-purple) ![Electron](https://img.shields.io/badge/Electron-33.x-9feaf9) ![Node](https://img.shields.io/badge/Node-18+-green) ![Play Online](https://img.shields.io/badge/Play-Online-brightgreen)

## 🎯 About

Vibe Coder is an idle survival game that rewards you for coding. Connect it to your development workflow and watch your character grow stronger as you write code. Every tool call, every prompt, every commit powers up your in-game character.

**While you code, your character:**
- 🎯 Hunts enemies intelligently
- 🛡️ Evades when overwhelmed
- 💬 Comments on your coding with 80+ unique quotes
- ⚔️ Auto-attacks with your equipped weapons
- 📈 Levels up from your real coding XP

## ✨ Features

### 🎮 Smart Auto-Play AI
- **HUNT Mode** - Actively moves toward enemies
- **EVADE Mode** - Kites when low HP or swarmed
- **IDLE Mode** - Wanders when area is clear
- Mode-specific quotes and visual indicators

### 👾 18 Enemy Types
| Type | Examples |
|------|----------|
| **Classic** | Bug, Glitch, Memory Leak, Syntax Error |
| **Coding** | Segfault, Dependency Hell, Git Conflict, CORS Error |
| **AI-Themed** | Hallucination, Token Overflow, Prompt Injection, Mode Collapse |

### 👹 4 Epic Bosses
- **Stack Overflow** (Wave 20) - Spawns minions
- **Null Pointer** (Wave 40) - Teleports
- **Memory Leak Prime** (Wave 60) - Splits on damage
- **Kernel Panic** (Wave 80) - Enrages at low HP

### ⚔️ 26 Weapons
| Category | Count | Examples |
|----------|-------|----------|
| Ranged | 9 | Basic, Spread, Pierce, Homing, Freeze |
| Melee | 4 | Sword, Spear, Boomerang, Kunai |
| Rare | 3 | `rm -rf`, `sudo`, Fork Bomb |
| Legendary | 3 | Hunter's Warglaive, Void Reaper, Celestial Blade |
| Evolved | 10 | Laser Beam, Chain Lightning, Blizzard |

### 🌍 6 Stage Themes
Debug Zone → Memory Banks → Network Layer → Kernel Space → Cloud Cluster → Singularity

### 📊 7 Meta-Progression Upgrades
Persistent buffs: Damage, Health, Speed, Attack Rate, XP Gain, Crit Chance, Duration

### 🎵 Full Audio System
- 5 procedural synthwave music tracks
- 13+ sound effects (weapons, hits, pickups)
- Master/SFX/Music volume controls

### 💬 80+ Character Quotes
- Coding reactions: "Code go brrrr", "10x developer mode"
- AI-specific: Claude, Cursor, Gemini, Codex reactions
- Time-based easter eggs for late night coding

## 🎮 Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| ESC / P | Pause |
| M | Toggle Music |
| SPACE | Manual XP (offline mode) |
| G | Secret: Unlock Hunter's Warglaive |

## 🚀 Quick Start

### Play Online (No Install)
**[▶️ Play Vibe Coder Now](https://daredev256.github.io/vibe-coder/)**

Press **SPACE** to manually gain XP, or connect the hooks for real coding rewards!

### Local Development
```bash
# Install dependencies
npm install

# Start the game
npm run dev

# (Optional) Start XP server for live coding rewards
npm run server
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
- **Rich Tray Menu** - See game stats at a glance

### Build from Source
```bash
# Development mode (hot reload)
npm run electron:dev

# Build distributable
npm run electron:build
```

The desktop app includes a built-in WebSocket server on port 3001, so Claude Code hooks connect automatically!

## 🔌 Claude Code Integration

Connect Vibe Coder to Claude Code for real XP gains while coding!

> **Note:** The online demo doesn't support live XP (requires local server). For the full experience, run locally with hooks connected.

**Quick Setup:**
1. Clone the repo and run `npm install`
2. Start the XP server: `npm run server`
3. Copy `hooks/on-prompt.sh` to `~/.claude/hooks/`
4. Start the game: `npm run dev`
5. Code normally - XP flows into the game automatically!

**[📖 Full Setup Guide](./SETUP.md)** - Detailed instructions, troubleshooting, custom integrations

### Hook Events
| Event | XP |
|-------|-----|
| Tool Use | +10 |
| Response | +5 |
| Message | +10 |

The character reacts in real-time to your coding activity with speech bubbles and intelligent auto-play!

## 📁 Project Structure

```
vibe-coder/
├── src/
│   ├── main.js               # Game config, upgrades, legendaries
│   ├── __tests__/             # Vitest unit tests (102 tests)
│   │   ├── SpatialHash.test.js
│   │   ├── RunModifiers.test.js
│   │   ├── SaveManager.test.js
│   │   ├── EventManager.test.js
│   │   └── RebirthManager.test.js
│   ├── scenes/
│   │   ├── BootScene.js       # Procedural texture generation
│   │   ├── TitleScene.js      # Menu, upgrades, weapon gallery
│   │   └── ArenaScene.js      # Main gameplay, enemies, bosses
│   ├── systems/
│   │   ├── EventManager.js    # Mid-wave random events (boss, double XP, curse)
│   │   ├── MapManager.js      # Procedural map generation & biomes
│   │   ├── RebirthManager.js  # Prestige system (permanent bonuses)
│   │   ├── RunModifiers.js    # Run-start mutators (glass cannon, etc.)
│   │   ├── SaveManager.js     # Run continuation & auto-save
│   │   └── ShrineManager.js   # Interactive risk/reward shrines
│   └── utils/
│       ├── SpatialHash.js     # O(n) spatial collision detection
│       ├── audio.js           # Procedural sound system
│       └── socket.js          # WebSocket XP client
├── electron/                  # Desktop app wrapper
│   ├── main.js                # Electron main process
│   ├── preload.js             # IPC bridge
│   ├── server.js              # Built-in WebSocket server
│   ├── tray.js                # System tray integration
│   └── windows.js             # Window mode management
├── server/                    # Standalone XP server
├── hooks/                     # Claude Code hooks
│   └── on-prompt.sh
└── index.html
```

## 🎖️ Legendary Weapons

Ultra-rare permanent unlocks that persist forever:

| Legendary | Drop Rate | Effect |
|-----------|-----------|--------|
| Hunter's Warglaive | 0.01% | Twin spinning blades |
| Void Reaper | 0.05% | Soul-consuming scythe |
| Celestial Blade | 0.03% | Triple starlight orbitals |

## 🔧 Tech Stack

- **Phaser 3** - Game engine
- **Vite** - Build tool & dev server
- **Electron** - Desktop app wrapper
- **Web Audio API** - Procedural sound generation
- **Canvas API** - Procedural graphics (no external assets!)
- **WebSocket** - Real-time XP streaming
- **Node.js** - XP server backend
- **electron-builder** - Cross-platform packaging

## 🧪 Testing

```bash
npm test            # Run all tests once
npm run test:watch  # Watch mode (re-runs on file changes)
```

102 unit tests cover core game systems: `SpatialHash`, `RunModifiers`, `SaveManager`, `EventManager`, and `RebirthManager`.

## 📋 Changelog

**v0.6.4** — Added 36 RebirthManager unit tests (milestones, bonuses, multipliers, weapon selection, prestige info). 102 total tests.

**v0.6.3** — Fixed double hazard damage, MapManager tween memory leak, WebSocket reconnect race condition, negative health values.

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

## 🎨 Credits

Built with [Claude Code](https://claude.ai/claude-code) - the AI coding assistant.

Hunter's Warglaive artwork inspired by Luu.

---

**Code to Conquer!** 🚀
