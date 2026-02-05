import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import ArenaScene from './scenes/ArenaScene.js';
import { connectToXPServer, isConnected } from './utils/socket.js';
import RebirthManager from './systems/RebirthManager.js';

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

// Meta-progression upgrades (persistent across runs)
window.VIBE_UPGRADES = {
  // Upgrade definitions: { name, description, maxLevel, costBase, costScale, effect }
  upgrades: {
    damage: { name: 'DAMAGE+', desc: '+10% damage per level', maxLevel: 10, costBase: 100, costScale: 1.5, effect: 0.1 },
    health: { name: 'HEALTH+', desc: '+15% max health per level', maxLevel: 10, costBase: 100, costScale: 1.5, effect: 0.15 },
    speed: { name: 'SPEED+', desc: '+8% move speed per level', maxLevel: 8, costBase: 150, costScale: 1.6, effect: 0.08 },
    attackRate: { name: 'ATTACK+', desc: '+12% attack speed per level', maxLevel: 8, costBase: 150, costScale: 1.6, effect: 0.12 },
    xpGain: { name: 'XP GAIN+', desc: '+15% XP earned per level', maxLevel: 10, costBase: 200, costScale: 1.8, effect: 0.15 },
    critChance: { name: 'CRIT+', desc: '+5% crit chance per level', maxLevel: 6, costBase: 250, costScale: 2.0, effect: 0.05 },
    weaponDuration: { name: 'DURATION+', desc: '+20% weapon duration per level', maxLevel: 5, costBase: 300, costScale: 1.7, effect: 0.2 }
  },

  // Current upgrade levels (loaded from localStorage)
  levels: {},

  // Lifetime currency for upgrades
  currency: 0,

  // Load from localStorage
  load() {
    const saved = localStorage.getItem('vibeCoderUpgrades');
    if (saved) {
      const data = JSON.parse(saved);
      this.levels = data.levels || {};
      this.currency = data.currency || 0;
    } else {
      this.levels = {};
      this.currency = 0;
    }
    // Initialize missing upgrade levels
    for (const key of Object.keys(this.upgrades)) {
      if (this.levels[key] === undefined) this.levels[key] = 0;
    }
  },

  // Save to localStorage
  save() {
    localStorage.setItem('vibeCoderUpgrades', JSON.stringify({
      levels: this.levels,
      currency: this.currency
    }));
  },

  // Get cost for next level of an upgrade
  getCost(upgradeKey) {
    const upgrade = this.upgrades[upgradeKey];
    const level = this.levels[upgradeKey] || 0;
    if (level >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.costBase * Math.pow(upgrade.costScale, level));
  },

  // Purchase an upgrade
  purchase(upgradeKey) {
    const cost = this.getCost(upgradeKey);
    if (this.currency >= cost && this.levels[upgradeKey] < this.upgrades[upgradeKey].maxLevel) {
      this.currency -= cost;
      this.levels[upgradeKey]++;
      this.save();
      return true;
    }
    return false;
  },

  // Add currency (called at end of run)
  addCurrency(amount) {
    this.currency += amount;
    this.save();
  },

  // Get bonus multiplier for a stat
  getBonus(upgradeKey) {
    const upgrade = this.upgrades[upgradeKey];
    const level = this.levels[upgradeKey] || 0;
    return 1 + (level * upgrade.effect);
  }
};

// Load upgrades on startup
window.VIBE_UPGRADES.load();

// Legendary weapons - permanent unlocks that persist forever
window.VIBE_LEGENDARIES = {
  // Legendary weapon definitions
  weapons: {
    huntersWarglaive: {
      name: "HUNTER'S WARGLAIVE",
      desc: 'Twin blades of the Creator. Spins around you dealing massive damage.',
      dropRate: 0.0001, // 0.01% drop rate
      damage: 10, // Buffed - it's super rare!
      spinSpeed: 0.025, // Slower, sexier spin
      color: 0x2a2a2a,
      melee: true,
      orbitalCount: 2,
      radius: 45 // Closer hula-hoop style
    },
    voidReaper: {
      name: 'VOID REAPER',
      desc: 'A scythe that consumes souls.',
      dropRate: 0.0005,
      damage: 4,
      spinSpeed: 0.06,
      color: 0x660066,
      melee: true,
      orbitalCount: 1,
      radius: 70
    },
    celestialBlade: {
      name: 'CELESTIAL BLADE',
      desc: 'Forged from starlight.',
      dropRate: 0.0003,
      damage: 3.5,
      spinSpeed: 0.07,
      color: 0xffd700,
      melee: true,
      orbitalCount: 3,
      radius: 55
    }
  },

  // Unlocked legendaries (persisted)
  unlocked: [],

  // Currently equipped legendary (null if none)
  equipped: null,

  load() {
    const saved = localStorage.getItem('vibeCoderLegendaries');
    if (saved) {
      const data = JSON.parse(saved);
      this.unlocked = data.unlocked || [];
      this.equipped = data.equipped || null;
    }
  },

  save() {
    localStorage.setItem('vibeCoderLegendaries', JSON.stringify({
      unlocked: this.unlocked,
      equipped: this.equipped
    }));
  },

  unlock(weaponKey) {
    if (!this.unlocked.includes(weaponKey)) {
      this.unlocked.push(weaponKey);
      this.save();
      return true;
    }
    return false;
  },

  equip(weaponKey) {
    if (this.unlocked.includes(weaponKey)) {
      this.equipped = weaponKey;
      this.save();
      return true;
    }
    return false;
  },

  unequip() {
    this.equipped = null;
    this.save();
  },

  hasUnlocked(weaponKey) {
    return this.unlocked.includes(weaponKey);
  },

  getEquipped() {
    if (this.equipped && this.weapons[this.equipped]) {
      return { key: this.equipped, ...this.weapons[this.equipped] };
    }
    return null;
  },

  // Force unlock (for testing/creator mode)
  forceUnlock(weaponKey) {
    if (this.weapons[weaponKey]) {
      this.unlock(weaponKey);
      console.log(`🗡️ LEGENDARY UNLOCKED: ${this.weapons[weaponKey].name}`);
      return true;
    }
    return false;
  }
};

// Load legendaries on startup
window.VIBE_LEGENDARIES.load();

// Melee weapons (non-legendary, drop normally)
window.VIBE_MELEE = {
  sword: { name: 'SWORD', damage: 1.5, attackRate: 1.2, range: 50, type: 'slash', color: 0xcccccc },
  spear: { name: 'SPEAR', damage: 1.2, attackRate: 0.8, range: 80, type: 'thrust', pierces: 3, color: 0x8b4513 },
  boomerang: { name: 'BOOMERANG', damage: 1.0, attackRate: 0.6, range: 150, type: 'return', color: 0xdaa520 },
  kunai: { name: 'KUNAI', damage: 0.8, attackRate: 2.0, range: 120, type: 'throw', projectiles: 3, color: 0x2f2f2f }
};

// Game settings - persisted to localStorage
window.VIBE_SETTINGS = {
  autoMove: true,         // Auto-move when coding is detected
  sfxEnabled: true,       // Sound effects (weapons, hits)
  musicEnabled: true,     // Background music
  masterVolume: 0.7,      // Master volume (0-1)
  sfxVolume: 0.8,         // SFX volume (0-1)
  musicVolume: 0.5,       // Music volume (0-1)
  playerName: '',         // Player name for personalization
  immortalMode: false,    // Respawn instead of game over (accessibility)
  xpPenaltyOnDeath: 0.5,  // 50% XP penalty when respawning in immortal mode

  load() {
    const saved = localStorage.getItem('vibeCoderSettings');
    if (saved) {
      const data = JSON.parse(saved);
      this.autoMove = data.autoMove !== undefined ? data.autoMove : true;
      this.sfxEnabled = data.sfxEnabled !== undefined ? data.sfxEnabled : true;
      this.musicEnabled = data.musicEnabled !== undefined ? data.musicEnabled : true;
      this.masterVolume = data.masterVolume !== undefined ? data.masterVolume : 0.7;
      this.sfxVolume = data.sfxVolume !== undefined ? data.sfxVolume : 0.8;
      this.musicVolume = data.musicVolume !== undefined ? data.musicVolume : 0.5;
      this.playerName = data.playerName || '';
      this.immortalMode = data.immortalMode !== undefined ? data.immortalMode : false;
      this.xpPenaltyOnDeath = data.xpPenaltyOnDeath !== undefined ? data.xpPenaltyOnDeath : 0.5;
    }
  },

  save() {
    localStorage.setItem('vibeCoderSettings', JSON.stringify({
      autoMove: this.autoMove,
      sfxEnabled: this.sfxEnabled,
      musicEnabled: this.musicEnabled,
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
      playerName: this.playerName,
      immortalMode: this.immortalMode,
      xpPenaltyOnDeath: this.xpPenaltyOnDeath
    }));
  },

  toggle(setting) {
    if (typeof this[setting] === 'boolean') {
      this[setting] = !this[setting];
      this.save();
      return this[setting];
    }
    return null;
  },

  setVolume(type, value) {
    if (type === 'master') this.masterVolume = Math.max(0, Math.min(1, value));
    if (type === 'sfx') this.sfxVolume = Math.max(0, Math.min(1, value));
    if (type === 'music') this.musicVolume = Math.max(0, Math.min(1, value));
    this.save();
  },

  setPlayerName(name) {
    this.playerName = name.slice(0, 20); // Max 20 chars
    this.save();
  },

  getEffectiveSfxVolume() {
    return this.sfxEnabled ? this.masterVolume * this.sfxVolume : 0;
  },

  getEffectiveMusicVolume() {
    return this.musicEnabled ? this.masterVolume * this.musicVolume : 0;
  }
};

// Load settings on startup
window.VIBE_SETTINGS.load();

// Game state - will be updated by XP events
window.VIBE_CODER = {
  xp: 0,
  level: 1,
  totalXP: 0,
  streak: 1,
  kills: 0,
  lastCodingTime: 0,        // Timestamp of last coding activity
  lastXPSource: null,       // { name, color } of last XP source
  codingTimeout: 5000,      // How long after last activity to consider "active"

  // Calculate XP needed for next level
  xpForLevel: (level) => Math.floor(100 * Math.pow(level, 1.5)),

  // Add XP and handle level ups
  addXP: function(amount, source = null) {
    // Only track coding activity time when XP comes from actual coding (has source)
    if (source) {
      this.lastCodingTime = Date.now();
      this.lastXPSource = source;
    }

    // Apply XP gain bonus from upgrades + rebirth bonus
    const xpBonus = window.VIBE_UPGRADES.getBonus('xpGain');
    const rebirthXPBonus = RebirthManager.getXPMultiplier();
    const totalMultiplier = Math.min(this.streak * xpBonus * rebirthXPBonus, 3.5);
    const multipliedXP = Math.floor(amount * totalMultiplier);
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
    window.dispatchEvent(new CustomEvent('xpgained', { detail: { amount: multipliedXP, total: this.xp, source } }));

    return multipliedXP;
  },

  // Check if coding activity is recent (for auto-move)
  isCodingActive() {
    return Date.now() - this.lastCodingTime < this.codingTimeout;
  },

  // Reset for new run
  reset() {
    this.xp = 0;
    this.level = 1;
    this.totalXP = 0;
    this.streak = 1;
    this.kills = 0;
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
