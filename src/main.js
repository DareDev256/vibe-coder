import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import ArenaScene from './scenes/ArenaScene.js';
import { connectToXPServer, isConnected } from './utils/socket.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  pixelArt: true, // Crisp pixel art rendering
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Top-down, no gravity
      debug: false // Set to true to see hitboxes
    }
  },
  scene: [BootScene, TitleScene, ArenaScene]
};

// Game state - will be updated by XP events
window.VIBE_CODER = {
  xp: 0,
  level: 1,
  totalXP: 0,
  streak: 1,
  kills: 0,

  // Calculate XP needed for next level
  xpForLevel: (level) => Math.floor(100 * Math.pow(level, 1.5)),

  // Add XP and handle level ups
  addXP: function(amount) {
    const multipliedXP = Math.floor(amount * this.streak);
    this.xp += multipliedXP;
    this.totalXP += multipliedXP;

    // Check for level up
    while (this.xp >= this.xpForLevel(this.level)) {
      this.xp -= this.xpForLevel(this.level);
      this.level++;
      // Dispatch level up event
      window.dispatchEvent(new CustomEvent('levelup', { detail: { level: this.level } }));
    }

    // Dispatch XP gained event
    window.dispatchEvent(new CustomEvent('xpgained', { detail: { amount: multipliedXP, total: this.xp } }));

    return multipliedXP;
  }
};

const game = new Phaser.Game(config);

// Connect to XP server for real-time coding rewards
connectToXPServer();

// Show connection status
window.addEventListener('xpserver-connected', () => {
  console.log('🎮 LIVE MODE: Earning XP from real coding activity!');
});

window.addEventListener('xpserver-disconnected', () => {
  console.log('⚠️ XP server disconnected. Press SPACE for manual XP.');
});

console.log('Vibe Coder initialized! Ready to code and conquer.');
console.log('Start the XP server with: npm run server');
