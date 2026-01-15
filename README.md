# VIBE CODER 🎮⚡

A vampire survivors-style idle game where you earn XP from real coding activity. Code to conquer!

![Phaser 3](https://img.shields.io/badge/Phaser-3.x-blue) ![Vite](https://img.shields.io/badge/Vite-7.x-purple) ![Node](https://img.shields.io/badge/Node-18+-green)

## 🎯 About

Vibe Coder is an idle survival game that rewards you for coding. Connect it to your development workflow and watch your character grow stronger as you write code. Every keystroke, every file save, every git commit powers up your in-game character.

## ✨ Features

- **Vampire Survivors-style Gameplay** - Auto-attack enemies, collect weapons, survive waves
- **Live XP from Coding** - WebSocket server integrates with Claude Code hooks
- **Wave-based Combat** - Endless waves with increasing difficulty
- **Boss Battles** - Epic bosses every 20 waves (Stack Overflow, Null Pointer, Memory Leak Prime, Kernel Panic)
- **Weapon System** - Basic, Spread, Pierce, Orbital, Rapid Fire
- **Rare Weapons** - `rm -rf` (nuke all), `sudo` (god mode), Fork Bomb
- **Weapon Evolution** - Combine weapons for powerful upgrades
- **Stage Progression** - Debug Zone → Memory Banks → Network Layer → Kernel Space
- **Procedural Graphics** - All sprites generated with code
- **Retro Synthwave Audio** - Web Audio API generated sounds

## 🎮 Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| ESC / P | Pause |
| M | Toggle Music |
| SPACE | Manual XP (offline mode) |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the game
npm run dev

# (Optional) Start XP server for live coding rewards
npm run server
```

Open http://localhost:3000 in your browser.

## 🔌 Claude Code Integration

Connect Vibe Coder to Claude Code for real XP gains while coding:

1. Start the XP server: `npm run server`
2. Copy the hooks to your Claude Code hooks directory
3. Code normally - XP flows into the game automatically!

### Hook Events
- **Tool Use** - +5 XP per tool
- **Response** - +10 XP per response
- **Message** - +2 XP per message

## 🎖️ Enemies

| Enemy | Behavior |
|-------|----------|
| Bug | Basic chase |
| Glitch | Fast, glitchy movement |
| Memory Leak | Slow, tanky |
| Syntax Error | Teleports toward you |
| Infinite Loop | Orbits around you |
| Race Condition | Erratic speed changes |

## 👹 Bosses

| Boss | Wave | Ability |
|------|------|---------|
| Stack Overflow | 20 | Spawns minions |
| Null Pointer | 40 | Teleports |
| Memory Leak Prime | 60 | Splits on damage |
| Kernel Panic | 80 | Enrages at low HP |

## 🔧 Tech Stack

- **Phaser 3** - Game engine
- **Vite** - Build tool & dev server
- **Web Audio API** - Procedural sound generation
- **WebSocket** - Real-time XP streaming
- **Node.js** - XP server backend

## 📁 Project Structure

```
vibe-coder/
├── src/
│   ├── main.js           # Game config & state
│   ├── scenes/
│   │   ├── BootScene.js  # Texture generation
│   │   ├── TitleScene.js # Main menu
│   │   └── ArenaScene.js # Main gameplay
│   └── utils/
│       ├── audio.js      # Sound system
│       └── socket.js     # WebSocket client
├── server/
│   └── index.js          # XP WebSocket server
├── hooks/                 # Claude Code hooks
└── index.html
```

## 🎨 Credits

Built with [Claude Code](https://claude.ai/claude-code) - the AI coding assistant.

---

**Code to Conquer!** 🚀
