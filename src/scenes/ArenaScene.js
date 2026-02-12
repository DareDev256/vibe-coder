import Phaser from 'phaser';
import * as Audio from '../utils/audio.js';
import { isConnected } from '../utils/socket.js';
import SpatialHash from '../utils/SpatialHash.js';
import SaveManager from '../systems/SaveManager.js';
import RebirthManager from '../systems/RebirthManager.js';
import MapManager from '../systems/MapManager.js';
import RunModifiers from '../systems/RunModifiers.js';
import EventManager from '../systems/EventManager.js';
import ShrineManager from '../systems/ShrineManager.js';

export default class ArenaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ArenaScene' });

    // World dimensions (5x larger than viewport for exploration)
    this.worldWidth = 4000;
    this.worldHeight = 3000;

    // Game state
    this.player = null;
    this.enemies = null;
    this.projectiles = null;
    this.weaponDrops = null;
    this.orbitals = null;
    this.cursors = null;
    this.wasd = null;

    // Player stats (scale with level) - BUFFED for idle gameplay
    this.baseStats = {
      speed: 200,
      attackRate: 300, // ms between attacks (faster!)
      attackDamage: 25, // hits harder
      maxHealth: 200   // chonky boi
    };

    // Invincibility after hit
    this.invincible = false;

    // Wave system
    this.waveNumber = 1;
    this.enemiesPerWave = 5;
    this.spawnTimer = null;
    this.waveTimer = null;

    // Combat
    this.lastAttackTime = 0;

    // Current weapon (default: basic)
    this.currentWeapon = {
      type: 'basic',
      duration: Infinity // basic never expires
    };

    // Weapon definitions
    this.weaponTypes = {
      basic: { attackRate: 1, damage: 1, projectiles: 1, pierce: false, color: 0x00ffff },
      spread: { attackRate: 1, damage: 0.7, projectiles: 5, pierce: false, color: 0xff9900 },
      pierce: { attackRate: 0.8, damage: 1.5, projectiles: 1, pierce: true, color: 0x0099ff },
      orbital: { attackRate: 0, damage: 2, projectiles: 0, pierce: true, color: 0xaa44ff },
      rapid: { attackRate: 3, damage: 0.5, projectiles: 1, pierce: false, color: 0xffcc00 },
      // New weapons
      homing: { attackRate: 0.7, damage: 1.2, projectiles: 1, pierce: false, color: 0x00ff88, special: 'homing' },
      bounce: { attackRate: 1, damage: 0.8, projectiles: 2, pierce: false, color: 0x88ff00, special: 'bounce', bounces: 3 },
      aoe: { attackRate: 0.5, damage: 0.6, projectiles: 0, pierce: true, color: 0xff4488, special: 'aoe', radius: 100 },
      freeze: { attackRate: 0.8, damage: 0.9, projectiles: 1, pierce: false, color: 0x88ffff, special: 'freeze', slowDuration: 2000 },
      // Rare weapons - special effects
      rmrf: { attackRate: 0, damage: 0, projectiles: 0, pierce: false, color: 0xff0000, special: 'clearAll' },
      sudo: { attackRate: 2, damage: 3, projectiles: 1, pierce: true, color: 0xffd700, special: 'godMode' },
      forkbomb: { attackRate: 1.5, damage: 0.6, projectiles: 3, pierce: false, color: 0xff00ff, special: 'fork' },
      // Melee weapons
      sword: { attackRate: 1.2, damage: 1.5, projectiles: 0, pierce: false, color: 0xcccccc, melee: true, meleeType: 'slash', range: 50 },
      spear: { attackRate: 0.8, damage: 1.2, projectiles: 0, pierce: true, color: 0x8b4513, melee: true, meleeType: 'thrust', range: 80, pierces: 3 },
      boomerang: { attackRate: 0.6, damage: 1.0, projectiles: 1, pierce: false, color: 0xdaa520, melee: true, meleeType: 'return', range: 150 },
      kunai: { attackRate: 2.0, damage: 0.8, projectiles: 3, pierce: false, color: 0x2f2f2f, melee: true, meleeType: 'throw', range: 120 }
    };

    // Boss definitions
    this.bossTypes = {
      'boss-stackoverflow': {
        name: 'STACK OVERFLOW',
        health: 2000,
        speed: 30,
        damage: 15,
        xpValue: 500,
        wave: 20,
        color: 0x00ff00,
        ability: 'spawnMinions'
      },
      'boss-nullpointer': {
        name: 'NULL POINTER',
        health: 3500,
        speed: 60,
        damage: 20,
        xpValue: 1000,
        wave: 40,
        color: 0xff00ff,
        ability: 'teleport'
      },
      'boss-memoryleakprime': {
        name: 'MEMORY LEAK PRIME',
        health: 5000,
        speed: 20,
        damage: 25,
        xpValue: 1500,
        wave: 60,
        color: 0xaa00ff,
        ability: 'split'
      },
      'boss-kernelpanic': {
        name: 'KERNEL PANIC',
        health: 8000,
        speed: 40,
        damage: 35,
        xpValue: 3000,
        wave: 80,
        color: 0xff0000,
        ability: 'rage'
      }
    };

    // Stage definitions with enhanced visual properties
    this.stages = [
      { name: 'DEBUG ZONE', startWave: 1, bgColor: 0x0a0a1a, gridColor: 0x00ffff, nodeColor: 0x00ffff, particleColor: 0x00ffff, glowIntensity: 0.3 },
      { name: 'MEMORY BANKS', startWave: 25, bgColor: 0x0a001a, gridColor: 0xaa00ff, nodeColor: 0xff00ff, particleColor: 0xaa00ff, glowIntensity: 0.4 },
      { name: 'NETWORK LAYER', startWave: 50, bgColor: 0x001a0a, gridColor: 0x00ff00, nodeColor: 0x00ff88, particleColor: 0x00ff00, glowIntensity: 0.35 },
      { name: 'KERNEL SPACE', startWave: 75, bgColor: 0x1a0a0a, gridColor: 0xff0000, nodeColor: 0xff4400, particleColor: 0xff4400, glowIntensity: 0.5 },
      { name: 'CLOUD CLUSTER', startWave: 100, bgColor: 0x0a0a1a, gridColor: 0x4488ff, nodeColor: 0x88aaff, particleColor: 0x4488ff, glowIntensity: 0.4 },
      { name: 'SINGULARITY', startWave: 150, bgColor: 0x050510, gridColor: 0xffffff, nodeColor: 0xffaa00, particleColor: 0xffd700, glowIntensity: 0.6 }
    ];

    // Current stage
    this.currentStage = 0;

    // Boss state
    this.currentBoss = null;
    this.bossHealthBar = null;
    this.bossNameText = null;

    // === RunModifiers state ===
    this.activeModifiers = [];
    this.modifierEffects = null; // Combined effects from all active modifiers

    // === EventManager state ===
    this.eventManager = null;
    this.xpEventMultiplier = 1;
    this.eventEnemySpeedMod = 1;
    this.forceRareDrops = false;

    // === ShrineManager state ===
    this.shrineManager = null;
    this.shrineDamageBuff = 1;

    // New enemy types with unique behaviors
    this.enemyTypes = {
      // Original enemies
      bug: { health: 15, speed: 40, damage: 3, xpValue: 5, behavior: 'chase' },
      glitch: { health: 30, speed: 70, damage: 5, xpValue: 15, behavior: 'chase' },
      'memory-leak': { health: 60, speed: 25, damage: 10, xpValue: 30, behavior: 'chase' },
      'syntax-error': { health: 12, speed: 100, damage: 2, xpValue: 10, behavior: 'teleport', teleportCooldown: 3000 },
      'infinite-loop': { health: 40, speed: 50, damage: 4, xpValue: 20, behavior: 'orbit', orbitRadius: 120 },
      'race-condition': { health: 25, speed: 60, damage: 6, xpValue: 25, behavior: 'erratic', speedVariance: 80 },

      // NEW Coding-themed enemies
      'segfault': { health: 10, speed: 0, damage: 999, xpValue: 50, behavior: 'deathzone', lifespan: 8000, waveMin: 30 },
      'dependency-hell': { health: 80, speed: 30, damage: 6, xpValue: 80, behavior: 'spawner', spawnInterval: 3000, maxMinions: 4, waveMin: 35 },
      'stack-overflow': { health: 100, speed: 35, damage: 8, xpValue: 100, behavior: 'grow', growRate: 0.001, waveMin: 25 },

      // NEW AI-themed enemies
      'hallucination': { health: 1, speed: 50, damage: 0, xpValue: 1, behavior: 'fake', waveMin: 20 },
      'token-overflow': { health: 40, speed: 45, damage: 5, xpValue: 40, behavior: 'growDamage', growRate: 0.0005, waveMin: 25 },
      'context-loss': { health: 50, speed: 60, damage: 7, xpValue: 60, behavior: 'contextLoss', teleportCooldown: 2500, wanderChance: 0.3, waveMin: 30 },
      'prompt-injection': { health: 60, speed: 40, damage: 5, xpValue: 100, behavior: 'hijack', hijackDuration: 5000, hijackCooldown: 10000, waveMin: 40 },

      // NEW v2 enemies (Mixed AI + Coding)
      '404-not-found': { health: 25, speed: 55, damage: 4, xpValue: 20, behavior: 'invisible', waveMin: 18 },
      'cors-error': { health: 35, speed: 0, damage: 8, xpValue: 30, behavior: 'blocker', blockDuration: 5000, waveMin: 22 },
      'type-error': { health: 30, speed: 50, damage: 5, xpValue: 25, behavior: 'morph', morphInterval: 3000, waveMin: 28 },
      'git-conflict': { health: 45, speed: 40, damage: 4, xpValue: 35, behavior: 'split', waveMin: 32 },
      'overfitting': { health: 50, speed: 65, damage: 6, xpValue: 45, behavior: 'predict', waveMin: 38 },
      'mode-collapse': { health: 70, speed: 35, damage: 7, xpValue: 60, behavior: 'clone', cloneCooldown: 8000, cloneRadius: 120, waveMin: 45 }
    };

    // Mini-boss definitions (appear at waves 10, 30, 50...)
    this.miniBossTypes = {
      'miniboss-deadlock': {
        name: 'DEADLOCK',
        health: 500,
        speed: 35,
        damage: 12,
        xpValue: 150,
        color: 0xff6600,
        ability: 'freeze'
      }
    };

    // Weapon evolution recipes (combine 2 weapons to evolve)
    this.evolutionRecipes = {
      'spread+pierce': { result: 'laserbeam', name: 'LASER BEAM', attackRate: 1.2, damage: 2.5, projectiles: 3, pierce: true, color: 0xff0088 },
      'orbital+rapid': { result: 'plasmaorb', name: 'PLASMA ORB', attackRate: 0, damage: 3, projectiles: 0, pierce: true, color: 0x00ffaa, orbitalCount: 5 },
      'pierce+rapid': { result: 'chainlightning', name: 'CHAIN LIGHTNING', attackRate: 2.5, damage: 1.8, projectiles: 1, pierce: false, color: 0x00aaff, chains: 3 },
      // New evolutions
      'spread+rapid': { result: 'bullethell', name: 'BULLET HELL', attackRate: 4, damage: 0.4, projectiles: 8, pierce: false, color: 0xff6600 },
      'orbital+spread': { result: 'ringoffire', name: 'RING OF FIRE', attackRate: 0, damage: 2.5, projectiles: 0, pierce: true, color: 0xff4400, orbitalCount: 8 },
      'homing+pierce': { result: 'seekingmissile', name: 'SEEKING MISSILE', attackRate: 0.5, damage: 4, projectiles: 1, pierce: true, color: 0x00ffcc, special: 'homing' },
      'bounce+spread': { result: 'chaosbounce', name: 'CHAOS BOUNCE', attackRate: 1.2, damage: 1, projectiles: 5, pierce: false, color: 0xaaff00, special: 'bounce', bounces: 5 },
      'aoe+orbital': { result: 'deathaura', name: 'DEATH AURA', attackRate: 0, damage: 1.5, projectiles: 0, pierce: true, color: 0xff00aa, special: 'aura', radius: 150 },
      'freeze+pierce': { result: 'icelance', name: 'ICE LANCE', attackRate: 0.6, damage: 2.5, projectiles: 1, pierce: true, color: 0x00ffff, special: 'freeze', slowDuration: 3000 },
      'homing+rapid': { result: 'swarm', name: 'SWARM', attackRate: 3, damage: 0.8, projectiles: 3, pierce: false, color: 0x88ff88, special: 'homing' },
      'freeze+aoe': { result: 'blizzard', name: 'BLIZZARD', attackRate: 0.3, damage: 0.8, projectiles: 0, pierce: true, color: 0xaaffff, special: 'freezeAoe', radius: 120 }
    };

    // Collected weapon types for evolution
    this.collectedWeapons = new Set(['basic']);

    // High score tracking
    this.highScore = parseInt(localStorage.getItem('vibeCoderHighScore') || '0');
    this.highWave = parseInt(localStorage.getItem('vibeCoderHighWave') || '0');

    // Pause state
    this.isPaused = false;
    this.settingsOverlayOpen = false;
    this.pauseMenu = null;
    this.pauseSelectedOption = 0;

    // === FREEZE BUG FIXES ===
    // Track active tweens for cleanup
    this.activeTweens = new Set();

    // Track weapon timer for cleanup
    this.weaponExpiryTimer = null;

    // Track event handlers for cleanup
    this.xpPopupHandler = null;
    this.levelUpHandler = null;

    // Spatial hash for efficient collision detection
    this.spatialHash = null;

    // Map manager for obstacles and biomes
    this.mapManager = null;

    // Track if this is a continued game
    this.isContinuedGame = false;

    // Track if rebirth prompt was shown this run
    this.rebirthPromptShown = false;
  }

  /**
   * Phaser init method - receives data passed from scene.start()
   * @param {object} data - Data from scene transition
   */
  init(data) {
    this.isContinuedGame = data?.continueGame || false;
  }

  create() {
    // Set up larger world bounds for exploration
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Create tiled background
    this.createBackground();

    // Create player
    this.createPlayer();

    // Setup camera to follow player smoothly
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 100);

    // Create enemy group
    this.enemies = this.physics.add.group();

    // Create projectile group
    this.projectiles = this.physics.add.group();

    // Create weapon drops group
    this.weaponDrops = this.physics.add.group();

    // Create orbital weapons group (circle around player)
    this.orbitals = this.add.group();

    // Create legendary weapons group (permanent spinning weapons)
    this.legendaryWeapons = this.add.group();

    // Spawn equipped legendary weapon if player has one
    this.spawnEquippedLegendary();

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Secret creator key - Press G to unlock Hunter's Warglaive
    this.input.keyboard.on('keydown-G', () => {
      const legendaries = window.VIBE_LEGENDARIES;
      if (legendaries && !legendaries.hasUnlocked('huntersWarglaive')) {
        legendaries.forceUnlock('huntersWarglaive');
        legendaries.equip('huntersWarglaive');
        this.showLegendaryDrop(this.player.x, this.player.y, 'huntersWarglaive', legendaries.weapons.huntersWarglaive);
        this.spawnEquippedLegendary();
      } else if (legendaries && legendaries.hasUnlocked('huntersWarglaive') && !legendaries.equipped) {
        legendaries.equip('huntersWarglaive');
        this.spawnEquippedLegendary();
      }
    });

    // Setup collisions
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.weaponDrops, this.pickupWeapon, null, this);

    // Create HUD
    this.createHUD();

    // Handle continued game - restore saved state before starting wave
    if (this.isContinuedGame) {
      const savedRun = SaveManager.loadRun();
      if (savedRun) {
        SaveManager.applySaveToScene(savedRun, this);
        // Update HUD to reflect restored state
        this.updateHUD();
        console.log(`Continuing from Wave ${this.waveNumber}, Stage ${this.currentStage}`);
      }
    } else {
      // New game - apply rebirth starting weapons
      const startingWeapons = RebirthManager.getStartingWeapons();
      if (startingWeapons.length > 0) {
        startingWeapons.forEach(weaponType => {
          this.collectedWeapons.add(weaponType);
        });
        // Equip first starting weapon
        if (startingWeapons[0]) {
          this.currentWeapon = {
            type: startingWeapons[0],
            duration: 30000 // 30 seconds
          };
        }
        console.log(`Rebirth bonus: Starting with weapons: ${startingWeapons.join(', ')}`);
      }
    }

    // Start spawning enemies
    this.startWave();

    // Listen for XP events from hooks (store references for cleanup)
    this.xpPopupHandler = (e) => this.showXPPopup(e.detail.amount);
    this.levelUpHandler = (e) => this.showLevelUp(e.detail.level);
    window.addEventListener('xpgained', this.xpPopupHandler);
    window.addEventListener('levelup', this.levelUpHandler);

    // Initialize spatial hash for efficient collision detection
    this.spatialHash = new SpatialHash(100);

    // Initialize map manager
    this.mapManager = new MapManager(this);
    this.mapManager.init();
    this.mapManager.generateMap(this.currentStage);
    this.mapManager.setupCollisions(this.player, this.enemies, this.projectiles);

    // Initialize EventManager
    this.eventManager = new EventManager(this);

    // Initialize ShrineManager
    this.shrineManager = new ShrineManager(this);
    this.shrineManager.init();
    this.shrineManager.spawnShrines();

    // Initialize RunModifiers for new games (or load from save)
    if (!this.isContinuedGame) {
      // Select 1 modifier (2 after wave 25 - but we start at wave 1)
      this.activeModifiers = RunModifiers.selectModifiers(1);
      this.modifierEffects = RunModifiers.getCombinedEffects(this.activeModifiers);
      RunModifiers.save(this.activeModifiers);

      // Show active modifiers
      if (this.activeModifiers.length > 0) {
        this.showModifierAnnouncement();
      }
    } else {
      // Load modifiers from save
      this.activeModifiers = RunModifiers.load();
      this.modifierEffects = RunModifiers.getCombinedEffects(this.activeModifiers);
    }

    // For testing - press SPACE to simulate XP gain (only when not paused)
    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.isPaused) {
        window.VIBE_CODER.addXP(10);
      }
    });

    // Initialize audio on first interaction
    this.input.on('pointerdown', () => {
      Audio.initAudio();
      Audio.resumeAudio();
    });
    this.input.keyboard.on('keydown', () => {
      Audio.initAudio();
      Audio.resumeAudio();
    });

    // Music toggle - press M
    this.input.keyboard.on('keydown-M', () => {
      Audio.initAudio();
      const isPlaying = Audio.toggleMusic();
      this.showMusicStatus(isPlaying);
    });

    // Pause toggle - press ESC or P
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());

    console.log('Arena ready! WASD to move, auto-attack enabled. Press SPACE for XP. M for music. ESC/P to pause.');
  }

  createBackground() {
    // Clear existing background elements
    if (this.bgTileSprite) this.bgTileSprite.destroy();
    if (this.bgGraphics) this.bgGraphics.destroy();
    if (this.bgParticles) {
      this.bgParticles.forEach(p => p.destroy());
    }
    if (this.dataStreams) {
      this.dataStreams.forEach(s => s.destroy());
    }
    this.bgParticles = [];
    this.dataStreams = [];

    const stage = this.stages[this.currentStage];

    // Generate tileable background texture for this stage
    const texKey = this.generateBackgroundTexture(stage);

    // Create TileSprite that covers the entire world
    this.bgTileSprite = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, texKey);
    this.bgTileSprite.setOrigin(0, 0);
    this.bgTileSprite.setDepth(-10);

    // === ANIMATED FLOATING PARTICLES (spread across larger world) ===
    const particleCount = 40 + Math.floor(stage.glowIntensity * 50); // More for larger world
    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, this.worldWidth),
        Phaser.Math.Between(0, this.worldHeight),
        Phaser.Math.Between(1, 4),
        stage.particleColor || stage.nodeColor,
        Phaser.Math.FloatBetween(0.1, stage.glowIntensity || 0.4)
      );
      particle.setDepth(-5);
      this.bgParticles.push(particle);

      // Floating animation
      this.tweens.add({
        targets: particle,
        y: particle.y + Phaser.Math.Between(-100, 100),
        x: particle.x + Phaser.Math.Between(-50, 50),
        alpha: { from: particle.alpha, to: 0 },
        scale: { from: 1, to: Phaser.Math.FloatBetween(0.5, 1.5) },
        duration: Phaser.Math.Between(3000, 8000),
        ease: 'Sine.easeInOut',
        repeat: -1,
        yoyo: true
      });
    }

    // === STAGE-SPECIFIC EFFECTS ===
    // Singularity stage: add vortex effect at world center
    if (this.currentStage >= 5) {
      const vortex = this.add.circle(this.worldWidth / 2, this.worldHeight / 2, 80, 0x000000, 0.3);
      vortex.setStrokeStyle(3, 0xffd700, 0.5);
      vortex.setDepth(-4);
      this.bgParticles.push(vortex);

      this.tweens.add({
        targets: vortex,
        scale: { from: 0.8, to: 1.2 },
        alpha: { from: 0.3, to: 0.1 },
        duration: 2000,
        ease: 'Sine.easeInOut',
        repeat: -1,
        yoyo: true
      });

      // Inner vortex ring
      const innerVortex = this.add.circle(this.worldWidth / 2, this.worldHeight / 2, 40, 0xffd700, 0.2);
      innerVortex.setDepth(-3);
      this.bgParticles.push(innerVortex);

      this.tweens.add({
        targets: innerVortex,
        angle: 360,
        duration: 10000,
        repeat: -1
      });
    }

    // === ANIMATED DATA STREAMS (Matrix-style) - fewer but spread across world ===
    for (let i = 0; i < 8; i++) {
      this.createDataStream(stage);
    }
  }

  generateBackgroundTexture(stage) {
    const texKey = `bg-stage-${this.currentStage}`;

    // Only generate once per stage
    if (this.textures.exists(texKey)) return texKey;

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const tileW = 400; // Smaller tile for seamless tiling
    const tileH = 300;

    // === BASE LAYER: Solid background ===
    graphics.fillStyle(stage.bgColor, 1);
    graphics.fillRect(0, 0, tileW, tileH);

    // === CIRCUIT BOARD PATTERN ===
    graphics.lineStyle(1, stage.gridColor, 0.15);

    // Main grid
    for (let x = 0; x < tileW; x += 40) {
      graphics.lineBetween(x, 0, x, tileH);
    }
    for (let y = 0; y < tileH; y += 40) {
      graphics.lineBetween(0, y, tileW, y);
    }

    // Circuit traces
    graphics.lineStyle(2, stage.gridColor, 0.2);
    for (let y = 20; y < tileH; y += 60) {
      graphics.lineBetween(0, y, tileW, y);
    }

    // Circuit nodes
    for (let x = 40; x < tileW; x += 80) {
      for (let y = 40; y < tileH; y += 80) {
        graphics.fillStyle(stage.nodeColor, 0.15);
        graphics.fillCircle(x, y, 8);
        graphics.fillStyle(stage.nodeColor, 0.3);
        graphics.fillCircle(x, y, 4);
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(x, y, 2);
      }
    }

    // Data blocks
    graphics.fillStyle(stage.gridColor, 0.06);
    for (let i = 0; i < 5; i++) {
      const x = (i * 73) % (tileW - 50);
      const y = (i * 47) % (tileH - 25);
      graphics.fillRect(x, y, 40, 20);
    }

    graphics.generateTexture(texKey, tileW, tileH);
    graphics.destroy();

    return texKey;
  }

  createDataStream(stage) {
    // Spread data streams across the larger world
    const x = Phaser.Math.Between(50, this.worldWidth - 50);
    const startY = Phaser.Math.Between(0, this.worldHeight - 700);
    const streamGroup = this.add.group();

    // Create falling characters
    const chars = '01アイウエオカキクケコ';
    const charCount = Phaser.Math.Between(5, 12);

    for (let i = 0; i < charCount; i++) {
      const char = this.add.text(x, startY - (i * 20), chars[Phaser.Math.Between(0, chars.length - 1)], {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: `#${stage.nodeColor.toString(16).padStart(6, '0')}`
      }).setAlpha(0.1 + (i / charCount) * 0.4);
      char.setDepth(-5);
      streamGroup.add(char);
    }

    // Animate the stream falling
    this.tweens.add({
      targets: streamGroup.getChildren(),
      y: '+=700',
      duration: Phaser.Math.Between(4000, 8000),
      ease: 'Linear',
      onComplete: () => {
        streamGroup.destroy(true);
        // Respawn a new stream
        if (this.scene.isActive()) {
          this.createDataStream(stage);
        }
      }
    });

    if (!this.dataStreams) this.dataStreams = [];
    this.dataStreams.push(streamGroup);
  }

  checkStageChange() {
    // Check if we should transition to a new stage
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (this.waveNumber >= this.stages[i].startWave && i > this.currentStage) {
        this.currentStage = i;
        this.showStageTransition();
        this.createBackground();
        return true;
      }
    }
    return false;
  }

  showStageTransition() {
    const stage = this.stages[this.currentStage];

    // Change music track to match stage
    Audio.setTrack(this.currentStage);

    // Flash screen
    this.cameras.main.flash(500, 255, 255, 255);

    // Big stage announcement
    const stageText = this.add.text(400, 200, `ENTERING\n${stage.name}`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: stageText,
      scale: 1.3,
      alpha: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => stageText.destroy()
    });
  }

  createPlayer() {
    // Create player at center of the larger world
    this.player = this.physics.add.sprite(this.worldWidth / 2, this.worldHeight / 2, 'player');
    this.player.setCollideWorldBounds(true);

    // Player health
    this.player.health = this.getStats().maxHealth;
    this.player.maxHealth = this.getStats().maxHealth;

    // Speech bubble for in-game quotes
    this.speechBubble = this.add.graphics();
    this.speechText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 120 }
    }).setOrigin(0.5).setDepth(1000);
    this.speechBubble.setDepth(999);
    this.speechBubble.setVisible(false);
    this.speechText.setVisible(false);
    this.speechTimer = null;
    this.lastQuoteTime = 0;
    this.quoteCooldown = 4000;

    // Auto-move indicator (shows current mode)
    this.autoMoveIndicator = this.add.text(0, 0, '⚔️', {
      fontSize: '14px'
    }).setOrigin(0.5).setDepth(1001).setVisible(false);
    this.autoPlayMode = 'hunt';

    // Mode-specific quotes
    this.huntQuotes = [
      "Target acquired!",
      "Here I come!",
      "Easy XP",
      "Got you!",
      "Hunting mode",
      "Going in!",
      "Lock on!",
      "Free kills"
    ];
    this.evadeQuotes = [
      "Too hot!",
      "Backing up!",
      "*kiting*",
      "Need space!",
      "Whoa whoa",
      "Tactical retreat",
      "Low HP!"
    ];
    this.idleQuotes = [
      "All clear!",
      "Wave done?",
      "Waiting...",
      "Easy wave",
      "*stretches*"
    ];

    // Combined quotes for random selection based on mode
    this.inGameQuotes = this.huntQuotes;

    // Listen for XP events - use mode-specific quotes
    this.xpHandler = (event) => {
      const now = Date.now();
      if (event.detail?.source && now - this.lastQuoteTime > this.quoteCooldown) {
        this.lastQuoteTime = now;
        // Pick quote based on current auto-play mode
        let quotePool = this.huntQuotes;
        if (this.autoPlayMode === 'evade') quotePool = this.evadeQuotes;
        else if (this.autoPlayMode === 'idle') quotePool = this.idleQuotes;
        this.showPlayerQuote(Phaser.Utils.Array.GetRandom(quotePool));
      }
    };
    window.addEventListener('xpgained', this.xpHandler);
  }

  showPlayerQuote(text) {
    if (this.speechTimer) this.speechTimer.remove();

    const bubbleX = this.player.x;
    const bubbleY = this.player.y - 40;

    this.speechBubble.clear();
    this.speechBubble.fillStyle(0xffffff, 0.9);
    this.speechBubble.lineStyle(2, 0x00ffff, 1);
    this.speechBubble.fillRoundedRect(bubbleX - 65, bubbleY - 18, 130, 36, 6);
    this.speechBubble.strokeRoundedRect(bubbleX - 65, bubbleY - 18, 130, 36, 6);

    this.speechText.setPosition(bubbleX, bubbleY);
    this.speechText.setText(text);

    this.speechBubble.setVisible(true);
    this.speechText.setVisible(true);

    this.speechTimer = this.time.delayedCall(2000, () => {
      this.speechBubble.setVisible(false);
      this.speechText.setVisible(false);
    });
  }

  getStats() {
    // Stats scale with level - more aggressive scaling
    const level = window.VIBE_CODER.level;

    // Apply upgrade bonuses
    const upgrades = window.VIBE_UPGRADES || { getBonus: () => 1 };
    const damageBonus = upgrades.getBonus('damage');
    const healthBonus = upgrades.getBonus('health');
    const speedBonus = upgrades.getBonus('speed');
    const attackRateBonus = upgrades.getBonus('attackRate');

    // Apply rebirth all stats bonus
    const rebirthMultiplier = RebirthManager.getAllStatsMultiplier();

    // Apply modifier and shrine multipliers
    const modDamageMult = this.modifierEffects?.damageMultiplier || 1;
    const modHealthMult = this.modifierEffects?.healthMultiplier || 1;
    const shrineDamageMult = this.shrineDamageBuff || 1;

    const baseSpeed = this.baseStats.speed + (level * 8);
    const baseAttackRate = Math.max(100, this.baseStats.attackRate - (level * 15));
    const baseDamage = this.baseStats.attackDamage + (level * 5);
    const baseHealth = this.baseStats.maxHealth + (level * 20);

    return {
      speed: Math.floor(baseSpeed * speedBonus * rebirthMultiplier),
      attackRate: Math.max(50, Math.floor(baseAttackRate / (attackRateBonus * rebirthMultiplier))), // lower is faster
      attackDamage: Math.floor(baseDamage * damageBonus * rebirthMultiplier * modDamageMult * shrineDamageMult),
      maxHealth: Math.floor(baseHealth * healthBonus * rebirthMultiplier * modHealthMult)
    };
  }

  getCritChance() {
    const upgrades = window.VIBE_UPGRADES || { getBonus: () => 1 };
    const critBonus = (upgrades.getBonus('critChance') - 1); // convert 1.x to 0.x
    return 0.1 + critBonus; // base 10% + upgrade bonus
  }

  getWeaponDurationBonus() {
    const upgrades = window.VIBE_UPGRADES || { getBonus: () => 1 };
    return upgrades.getBonus('weaponDuration');
  }

  // Smart Auto-Play: Hunt enemies, evade when threatened
  calculateAutoMove() {
    const px = this.player.x;
    const py = this.player.y;
    const healthPercent = this.player.health / this.player.maxHealth;
    const nearbyCount = this.countNearbyEnemies(120);

    // Track current auto-play mode for UI
    let mode = 'hunt';

    // EVADE MODE: Low health or too many enemies nearby
    if (healthPercent < 0.3 || nearbyCount >= 4) {
      mode = 'evade';
      this.autoPlayMode = 'evade';
      return this.calculateEvadeMove(px, py);
    }

    // HUNT MODE: Find and approach nearest enemy
    const target = this.findNearestEnemy(px, py);
    if (target) {
      this.autoPlayMode = 'hunt';
      return this.calculateHuntMove(px, py, target);
    }

    // IDLE MODE: No enemies, gentle wander
    this.autoPlayMode = 'idle';
    return this.calculateWanderMove(px, py);
  }

  // Count enemies within radius
  countNearbyEnemies(radius) {
    let count = 0;
    const px = this.player.x;
    const py = this.player.y;
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist < radius) count++;
    });
    return count;
  }

  // Find nearest non-deadly enemy
  findNearestEnemy(px, py) {
    let nearest = null;
    let nearestDist = Infinity;
    const deadlyTypes = ['segfault']; // Avoid these completely

    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      if (deadlyTypes.includes(enemy.enemyType)) return; // Skip deadly

      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });
    return nearest;
  }

  // HUNT: Move toward target enemy
  calculateHuntMove(px, py, target) {
    const dist = Phaser.Math.Distance.Between(px, py, target.x, target.y);
    const optimalRange = 120; // Stay at weapon range

    // Already in range, hold position with slight adjustment
    if (dist < optimalRange) {
      return { x: 0, y: 0 };
    }

    // Move toward target
    const angle = Phaser.Math.Angle.Between(px, py, target.x, target.y);
    let moveX = Math.cos(angle);
    let moveY = Math.sin(angle);

    // Apply bounds checking
    return this.applyBoundsCheck(px, py, moveX, moveY);
  }

  // EVADE: Circle-strafe away from threats
  calculateEvadeMove(px, py) {
    let threatX = 0;
    let threatY = 0;
    let threatCount = 0;
    const detectionRadius = 200;

    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist < detectionRadius && dist > 0) {
        const weight = 1 - (dist / detectionRadius);
        // Extra weight for deadly enemies
        const dangerMult = enemy.enemyType === 'segfault' ? 3 : 1;
        threatX += (enemy.x - px) * weight * dangerMult;
        threatY += (enemy.y - py) * weight * dangerMult;
        threatCount++;
      }
    });

    if (threatCount === 0) {
      return { x: 0, y: 0 };
    }

    // Move away from threats with slight perpendicular (circle-strafe)
    let moveX = -threatX;
    let moveY = -threatY;

    // Add perpendicular component for circle-strafing
    const perpX = -moveY * 0.3;
    const perpY = moveX * 0.3;
    moveX += perpX;
    moveY += perpY;

    // Normalize
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    if (magnitude > 0) {
      moveX /= magnitude;
      moveY /= magnitude;
    }

    return this.applyBoundsCheck(px, py, moveX, moveY);
  }

  // WANDER: Gentle random movement when idle
  calculateWanderMove(px, py) {
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;
    const distToCenter = Phaser.Math.Distance.Between(px, py, centerX, centerY);

    // Drift toward center if too far out
    if (distToCenter > 500) {
      const angle = Phaser.Math.Angle.Between(px, py, centerX, centerY);
      return {
        x: Math.cos(angle) * 0.4,
        y: Math.sin(angle) * 0.4
      };
    }

    // Random gentle movement
    const time = Date.now() / 1000;
    return {
      x: Math.sin(time * 0.5) * 0.3,
      y: Math.cos(time * 0.7) * 0.3
    };
  }

  // Apply world bounds checking
  applyBoundsCheck(px, py, moveX, moveY) {
    const margin = 100;
    if (px < margin) moveX = Math.max(moveX, 0.5);
    if (px > this.worldWidth - margin) moveX = Math.min(moveX, -0.5);
    if (py < margin) moveY = Math.max(moveY, 0.5);
    if (py > this.worldHeight - margin) moveY = Math.min(moveY, -0.5);
    return { x: moveX, y: moveY };
  }

  getEnemyAnimKey(enemyType) {
    // Map enemy types to their animation keys
    const animMap = {
      'bug': 'bug-walk',
      'glitch': 'glitch-move',
      'memory-leak': 'memory-leak-pulse',
      'syntax-error': 'syntax-error-flash',
      'infinite-loop': 'infinite-loop-spin',
      'race-condition': 'race-condition-flicker'
    };
    return animMap[enemyType] || null;
  }

  createHUD() {
    // XP Bar background
    this.xpBarBg = this.add.graphics();
    this.xpBarBg.fillStyle(0x333333, 0.8);
    this.xpBarBg.fillRect(10, 10, 200, 20);
    this.xpBarBg.setScrollFactor(0);

    // XP Bar fill
    this.xpBar = this.add.graphics();
    this.xpBar.setScrollFactor(0);

    // Health bar background
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x333333, 0.8);
    this.healthBarBg.fillRect(10, 35, 200, 15);
    this.healthBarBg.setScrollFactor(0);

    // Health bar fill
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);

    // Level text
    this.levelText = this.add.text(10, 55, 'LVL 1', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setScrollFactor(0);

    // XP text
    this.xpText = this.add.text(10, 75, 'XP: 0 / 100', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa'
    }).setScrollFactor(0);

    // Wave text
    this.waveText = this.add.text(700, 10, 'WAVE 1', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0);

    // Kills text
    this.killsText = this.add.text(700, 30, 'KILLS: 0', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(1, 0).setScrollFactor(0);

    // Current weapon indicator
    this.weaponText = this.add.text(10, 95, 'WEAPON: BASIC', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ffff'
    }).setScrollFactor(0);

    // Connection status
    this.connectionText = this.add.text(400, 580, '⚡ CONNECTING... | M = MUSIC', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffff00'
    }).setOrigin(0.5).setScrollFactor(0);

    // Listen for connection events (store refs for cleanup)
    this.xpServerConnectedHandler = () => {
      this.connectionText.setText('🟢 LIVE - XP FROM CODING | M = MUSIC');
      this.connectionText.setColor('#00ff00');
    };
    this.xpServerDisconnectedHandler = () => {
      this.connectionText.setText('🔴 OFFLINE - SPACE FOR XP | M = MUSIC');
      this.connectionText.setColor('#ff6666');
    };
    window.addEventListener('xpserver-connected', this.xpServerConnectedHandler);
    window.addEventListener('xpserver-disconnected', this.xpServerDisconnectedHandler);

    // Check if already connected (connection may have happened before scene started)
    if (isConnected()) {
      this.connectionText.setText('🟢 LIVE - XP FROM CODING | M = MUSIC');
      this.connectionText.setColor('#00ff00');
    }

    // Stage text
    this.stageText = this.add.text(700, 50, 'STAGE: DEBUG ZONE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ffff'
    }).setOrigin(1, 0).setScrollFactor(0);

    // High score display
    this.highScoreText = this.add.text(700, 70, `HI-WAVE: ${this.highWave}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffd700'
    }).setOrigin(1, 0).setScrollFactor(0);

    // Collected weapons display (for evolution tracking)
    this.weaponsCollectedText = this.add.text(10, 115, 'COLLECTED: basic', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888'
    }).setScrollFactor(0);

    // Boss health bar (hidden by default)
    this.bossHealthBarBg = this.add.graphics();
    this.bossHealthBarBg.fillStyle(0x333333, 0.8);
    this.bossHealthBarBg.fillRect(200, 560, 400, 25);
    this.bossHealthBarBg.setVisible(false);
    this.bossHealthBarBg.setScrollFactor(0);

    this.bossHealthBar = this.add.graphics();
    this.bossHealthBar.setVisible(false);
    this.bossHealthBar.setScrollFactor(0);

    this.bossNameText = this.add.text(400, 545, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    this.bossNameText.setVisible(false);

    this.updateHUD();
  }

  updateHUD() {
    const state = window.VIBE_CODER;
    const xpNeeded = state.xpForLevel(state.level);
    const xpPercent = state.xp / xpNeeded;

    // Update XP bar
    this.xpBar.clear();
    this.xpBar.fillStyle(0x00ffff, 1);
    this.xpBar.fillRect(10, 10, 200 * xpPercent, 20);

    // Update health bar
    const healthPercent = this.player.health / this.player.maxHealth;
    this.healthBar.clear();
    this.healthBar.fillStyle(healthPercent > 0.3 ? 0x00ff00 : 0xff0000, 1);
    this.healthBar.fillRect(10, 35, 200 * healthPercent, 15);

    // Update text
    this.levelText.setText(`LVL ${state.level}`);
    this.xpText.setText(`XP: ${state.xp} / ${xpNeeded}`);
    this.killsText.setText(`KILLS: ${state.kills}`);
    this.waveText.setText(`WAVE ${this.waveNumber}`);

    // Update weapon text
    const weaponColors = {
      basic: '#00ffff',
      spread: '#ff9900',
      pierce: '#0099ff',
      orbital: '#aa44ff',
      rapid: '#ffcc00',
      // New weapons
      homing: '#00ff88',
      bounce: '#88ff00',
      aoe: '#ff4488',
      freeze: '#88ffff',
      // Rare weapons
      rmrf: '#ff0000',
      sudo: '#ffd700',
      forkbomb: '#ff00ff',
      // Evolved weapons
      laserbeam: '#ff0088',
      plasmaorb: '#00ffaa',
      chainlightning: '#00aaff',
      bullethell: '#ff6600',
      ringoffire: '#ff4400',
      seekingmissile: '#00ffcc',
      chaosbounce: '#aaff00',
      deathaura: '#ff00aa',
      icelance: '#00ffff',
      swarm: '#88ff88',
      blizzard: '#aaffff',
      // Melee weapons
      sword: '#cccccc',
      spear: '#8b4513',
      boomerang: '#daa520',
      kunai: '#4a4a4a'
    };
    const weaponLabel = this.currentWeapon.isEvolved ? `★${this.currentWeapon.type.toUpperCase()}★` : this.currentWeapon.type.toUpperCase();
    this.weaponText.setText(`WEAPON: ${weaponLabel}`);
    this.weaponText.setColor(weaponColors[this.currentWeapon.type] || '#00ffff');

    // Update stage text
    const stage = this.stages[this.currentStage];
    this.stageText.setText(`STAGE: ${stage.name}`);

    // Update high score display
    if (this.highScoreText) {
      this.highScoreText.setText(`HI-WAVE: ${this.highWave}`);
    }

    // Update collected weapons
    if (this.weaponsCollectedText) {
      const weapons = Array.from(this.collectedWeapons).join(', ');
      this.weaponsCollectedText.setText(`COLLECTED: ${weapons}`);
    }

    // Update boss health bar
    if (this.currentBoss && this.currentBoss.active) {
      this.bossHealthBarBg.setVisible(true);
      this.bossHealthBar.setVisible(true);
      this.bossNameText.setVisible(true);

      const bossHealthPercent = this.currentBoss.health / this.currentBoss.maxHealth;
      this.bossHealthBar.clear();
      this.bossHealthBar.fillStyle(this.currentBoss.bossColor, 1);
      this.bossHealthBar.fillRect(200, 560, 400 * bossHealthPercent, 25);

      this.bossNameText.setText(`⚠ ${this.currentBoss.bossName} ⚠`);
      this.bossNameText.setColor(`#${this.currentBoss.bossColor.toString(16).padStart(6, '0')}`);
    } else {
      this.bossHealthBarBg.setVisible(false);
      this.bossHealthBar.setVisible(false);
      this.bossNameText.setVisible(false);
    }

    // Sync game state to Electron tray (if running in desktop app)
    if (window.electronAPI?.updateGameState) {
      window.electronAPI.updateGameState({
        level: state.level,
        xp: state.xp,
        xpToNext: xpNeeded,
        weapon: weaponLabel,
        wave: this.waveNumber,
        isPlaying: true
      });
    }
  }

  showXPPopup(amount) {
    // Subtle XP blip sound
    Audio.playXPGain();

    // Check for CLI source info (from live XP server)
    const source = window.VIBE_CODER?.lastXPSource;
    const hasSource = source && source.name && source.name !== 'CODE';

    // Format text with optional source tag
    const text = hasSource ? `+${amount} XP [${source.name}]` : `+${amount} XP`;
    const color = hasSource ? source.color : '#00ffff';

    const popup = this.add.text(
      this.player.x + Phaser.Math.Between(-30, 30),
      this.player.y - 40,
      text,
      {
        fontFamily: 'monospace',
        fontSize: hasSource ? '16px' : '14px', // Slightly larger for CLI XP
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: hasSource ? 2 : 0
      }
    ).setOrigin(0.5);

    // Clear the source after displaying
    if (window.VIBE_CODER?.lastXPSource) {
      window.VIBE_CODER.lastXPSource = null;
    }

    // Animate popup
    this.tweens.add({
      targets: popup,
      y: popup.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });

    this.updateHUD();
  }

  showLevelUp(level) {
    // Level up fanfare!
    Audio.playLevelUp();

    // Screen flash
    this.cameras.main.flash(200, 0, 255, 255);

    // Big level up text (fixed to camera center)
    const levelUpText = this.add.text(400, 300, `LEVEL ${level}!`, {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);

    // Animate
    this.tweens.add({
      targets: levelUpText,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy()
    });

    // Update player health on level up
    const newMaxHealth = this.getStats().maxHealth;
    this.player.maxHealth = newMaxHealth;
    this.player.health = newMaxHealth; // Full heal on level up!

    // XP MAGNET on every level up!
    this.time.delayedCall(200, () => this.activateXPMagnet());

    this.updateHUD();
  }

  /**
   * Show modifier announcement at run start
   */
  showModifierAnnouncement() {
    if (!this.activeModifiers || this.activeModifiers.length === 0) return;

    const mod = this.activeModifiers[0];

    // Create banner container
    const banner = this.add.container(400, 100).setScrollFactor(0).setDepth(1000);

    // Background
    const bg = this.add.rectangle(0, 0, 350, 60, 0x000000, 0.9);
    bg.setStrokeStyle(3, mod.color);

    // Modifier text
    const modText = this.add.text(0, -10, `${mod.icon} ${mod.name}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: `#${mod.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Description
    const descText = this.add.text(0, 15, mod.desc, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    banner.add([bg, modText, descText]);

    // Animate in
    banner.y = -60;
    this.tweens.add({
      targets: banner,
      y: 100,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Animate out after delay
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: banner,
        y: -60,
        alpha: 0,
        duration: 500,
        onComplete: () => banner.destroy()
      });
    });

    console.log(`Run modifier active: ${mod.name}`);
  }

  startWave() {
    // Check for stage transition
    this.checkStageChange();

    // Check if this is a boss wave (every 20 waves)
    if (this.waveNumber % 20 === 0) {
      this.spawnBoss();
      // Don't spawn normal enemies on boss waves
      this.spawnTimer = { getRemaining: () => 0 };

      this.waveTimer = this.time.addEvent({
        delay: 2000,
        callback: () => this.checkWaveComplete(),
        loop: true
      });
      return;
    }

    // Mini-boss waves: 10, 30, 50, 70... (every 20 starting at 10)
    const isMiniBossWave = this.waveNumber >= 10 && this.waveNumber % 20 === 10;
    if (isMiniBossWave) {
      this.spawnMiniBoss();
    }

    // Try to trigger a random event
    if (this.eventManager) {
      this.eventManager.tryTriggerEvent(this.waveNumber);
    }

    // Spawn enemies over time (cap the scaling so it doesn't get insane)
    let spawned = 0;
    const toSpawn = Math.min(this.enemiesPerWave + (this.waveNumber * 2), 25);

    this.spawnTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (spawned < toSpawn) {
          this.spawnEnemy();
          spawned++;
        }
      },
      repeat: toSpawn - 1
    });

    // Check for wave completion
    this.waveTimer = this.time.addEvent({
      delay: 2000,
      callback: () => this.checkWaveComplete(),
      loop: true
    });

    // Update high wave record
    if (this.waveNumber > this.highWave) {
      this.highWave = this.waveNumber;
      localStorage.setItem('vibeCoderHighWave', this.highWave.toString());
    }
  }

  checkWaveComplete() {
    const bossAlive = this.currentBoss && this.currentBoss.active;
    const enemiesCleared = this.enemies.countActive() === 0;
    const spawnDone = this.spawnTimer && !this.spawnTimer.getRemaining();

    if (enemiesCleared && spawnDone && !bossAlive) {
      // Wave complete sound!
      Audio.playWaveComplete();

      this.waveNumber++;
      this.waveText.setText(`WAVE ${this.waveNumber}`);

      // Wave complete bonus XP (more for boss waves)
      const wassBossWave = (this.waveNumber - 1) % 20 === 0;
      const waveXpMult = (this.xpEventMultiplier || 1) * (this.modifierEffects?.xpMult || 1);
      window.VIBE_CODER.addXP(Math.floor(this.waveNumber * (wassBossWave ? 100 : 25) * waveXpMult));

      // Auto-save at wave completion
      this.autoSaveRun();

      // Check for rebirth milestone
      const rebirthMilestone = RebirthManager.canRebirth(this.waveNumber);
      if (rebirthMilestone && !this.rebirthPromptShown) {
        this.showRebirthPrompt(rebirthMilestone);
        return; // Don't auto-start next wave, wait for player choice
      }

      // Start next wave after delay
      this.time.delayedCall(2000, () => this.startWave());

      // Show wave text with special boss wave indicator
      const isBossWave = this.waveNumber % 20 === 0;
      const waveColor = isBossWave ? '#ff0000' : '#ff00ff';
      const waveText = isBossWave ? `⚠ BOSS WAVE ${this.waveNumber} ⚠` : `WAVE ${this.waveNumber}`;

      const waveAnnounce = this.add.text(400, 200, waveText, {
        fontFamily: 'monospace',
        fontSize: isBossWave ? '28px' : '32px',
        color: waveColor,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: waveAnnounce,
        alpha: 0,
        scale: isBossWave ? 1.5 : 1,
        duration: 2000,
        onComplete: () => waveAnnounce.destroy()
      });

      // Screen shake for boss wave announcement
      if (isBossWave) {
        this.cameras.main.shake(500, 0.01);
      }
    }
  }

  spawnBoss() {
    // Determine which boss to spawn based on wave
    let bossKey = 'boss-stackoverflow';
    if (this.waveNumber >= 80) bossKey = 'boss-kernelpanic';
    else if (this.waveNumber >= 60) bossKey = 'boss-memoryleakprime';
    else if (this.waveNumber >= 40) bossKey = 'boss-nullpointer';

    const bossData = this.bossTypes[bossKey];

    // Scale boss health with wave number
    const healthScale = 1 + Math.floor(this.waveNumber / 20) * 0.5;

    // Spawn boss near player (above them)
    const bossX = Phaser.Math.Clamp(this.player.x, 100, this.worldWidth - 100);
    const bossY = Math.max(50, this.player.y - 300);
    const boss = this.enemies.create(bossX, bossY, bossKey);
    boss.health = Math.floor(bossData.health * healthScale);
    boss.maxHealth = boss.health;
    boss.speed = bossData.speed;
    boss.damage = bossData.damage;
    boss.xpValue = bossData.xpValue;
    boss.enemyType = bossKey;
    boss.isBoss = true;
    boss.bossName = bossData.name;
    boss.bossColor = bossData.color;
    boss.ability = bossData.ability;
    boss.lastAbilityTime = 0;

    // Set boss as current boss for health bar
    this.currentBoss = boss;

    // Boss warning sound!
    Audio.playBossWarning();

    // Switch to boss fight music (track 4)
    Audio.setTrack(4);

    // Boss entrance effect
    this.cameras.main.shake(1000, 0.02);
    this.cameras.main.flash(300, 255, 0, 0);

    // Boss announcement
    const bossAnnounce = this.add.text(400, 150, `${bossData.name}\nHAS APPEARED!`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${bossData.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: bossAnnounce,
      scale: 1.3,
      alpha: 0,
      duration: 3000,
      onComplete: () => bossAnnounce.destroy()
    });

    this.updateHUD();
  }

  spawnEnemy() {
    // CAP enemies on screen to prevent overwhelming at high levels
    const MAX_ENEMIES = 30;
    if (this.enemies.countActive() >= MAX_ENEMIES) return;

    // Spawn in a ring around the player (not screen edges)
    const spawnRadius = 500; // Distance from player
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    let x = this.player.x + Math.cos(angle) * spawnRadius;
    let y = this.player.y + Math.sin(angle) * spawnRadius;

    // Clamp to world bounds
    x = Phaser.Math.Clamp(x, 50, this.worldWidth - 50);
    y = Phaser.Math.Clamp(y, 50, this.worldHeight - 50);

    // Choose enemy type based on wave with scaling pools
    const playerLevel = window.VIBE_CODER.level;
    const healthScale = 1 + Math.min(playerLevel * 0.05, 2); // Cap at 3x health

    // Build spawn pool based on wave progression
    const spawnPool = ['bug', 'bug', 'bug']; // bugs always common

    if (this.waveNumber >= 3) spawnPool.push('glitch', 'glitch');
    if (this.waveNumber >= 5) spawnPool.push('memory-leak');

    // New enemy types unlock at higher waves
    if (this.waveNumber >= 8) spawnPool.push('syntax-error', 'syntax-error');
    if (this.waveNumber >= 12) spawnPool.push('infinite-loop');
    if (this.waveNumber >= 15) spawnPool.push('race-condition');

    // NEW AI-themed enemies (wave 20+)
    if (this.waveNumber >= 20) spawnPool.push('hallucination', 'hallucination');

    // NEW enemies (wave 25+)
    if (this.waveNumber >= 25) {
      spawnPool.push('stack-overflow', 'token-overflow');
    }

    // NEW enemies (wave 30+)
    if (this.waveNumber >= 30) {
      spawnPool.push('segfault', 'context-loss');
    }

    // NEW enemies (wave 35+)
    if (this.waveNumber >= 35) {
      spawnPool.push('dependency-hell');
    }

    // NEW Prompt Injection (wave 40+) - rare and dangerous
    if (this.waveNumber >= 40) {
      spawnPool.push('prompt-injection');
    }

    // NEW v2 enemies
    if (this.waveNumber >= 18) {
      spawnPool.push('404-not-found');
    }
    if (this.waveNumber >= 22) {
      spawnPool.push('cors-error');
    }
    if (this.waveNumber >= 28) {
      spawnPool.push('type-error');
    }
    if (this.waveNumber >= 32) {
      spawnPool.push('git-conflict');
    }
    if (this.waveNumber >= 38) {
      spawnPool.push('overfitting');
    }
    if (this.waveNumber >= 45) {
      spawnPool.push('mode-collapse');
    }

    const type = Phaser.Utils.Array.GetRandom(spawnPool);
    const typeData = this.enemyTypes[type];

    // Map enemy type to texture name
    const textureMap = {
      'bug': 'bug',
      'glitch': 'glitch',
      'memory-leak': 'memory-leak',
      'syntax-error': 'syntax-error',
      'infinite-loop': 'infinite-loop',
      'race-condition': 'race-condition',
      'segfault': 'enemy-segfault',
      'dependency-hell': 'enemy-dependency-hell',
      'stack-overflow': 'enemy-stack-overflow',
      'hallucination': 'enemy-hallucination',
      'token-overflow': 'enemy-token-overflow',
      'context-loss': 'enemy-context-loss',
      'prompt-injection': 'enemy-prompt-injection',
      // NEW v2 enemies
      '404-not-found': 'enemy-404-not-found',
      'cors-error': 'enemy-cors-error',
      'type-error': 'enemy-type-error',
      'git-conflict': 'enemy-git-conflict',
      'overfitting': 'enemy-overfitting',
      'mode-collapse': 'enemy-mode-collapse'
    };
    const textureName = textureMap[type] || type;

    const enemy = this.enemies.create(x, y, textureName);
    enemy.health = Math.floor(typeData.health * healthScale);
    enemy.maxHealth = enemy.health;
    // Apply event speed modifier (e.g., CURSE event)
    const speedMod = this.eventEnemySpeedMod || 1;
    enemy.speed = Math.floor(typeData.speed * speedMod);
    enemy.damage = typeData.damage;
    enemy.xpValue = typeData.xpValue;
    enemy.enemyType = type;
    enemy.behavior = typeData.behavior;

    // Play enemy animation based on type
    const animKey = this.getEnemyAnimKey(type);
    if (animKey && this.anims.exists(animKey)) {
      enemy.play(animKey);
    }

    // Behavior-specific setup
    if (typeData.behavior === 'teleport') {
      enemy.lastTeleport = 0;
      enemy.teleportCooldown = typeData.teleportCooldown;
    }
    if (typeData.behavior === 'orbit') {
      enemy.orbitAngle = Math.random() * Math.PI * 2;
      enemy.orbitRadius = typeData.orbitRadius;
      enemy.orbitDirection = Math.random() > 0.5 ? 1 : -1;
    }
    if (typeData.behavior === 'erratic') {
      enemy.speedVariance = typeData.speedVariance;
      enemy.nextSpeedChange = this.time.now + Phaser.Math.Between(500, 1500);
      enemy.currentSpeedMod = 1;
    }

    // NEW: Segfault death zone setup - despawns after lifespan
    if (typeData.behavior === 'deathzone') {
      enemy.spawnTime = this.time.now;
      enemy.lifespan = typeData.lifespan;
      // Pulsing effect - === FREEZE BUG FIX: Use tracked tween ===
      this.createTrackedTween({
        targets: enemy,
        alpha: 0.5,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // NEW: Dependency Hell spawner setup
    if (typeData.behavior === 'spawner') {
      enemy.lastSpawn = this.time.now;
      enemy.spawnInterval = typeData.spawnInterval;
      enemy.maxMinions = typeData.maxMinions;
      enemy.minionCount = 0;
    }

    // NEW: Stack Overflow grow setup
    if (typeData.behavior === 'grow' || typeData.behavior === 'growDamage') {
      enemy.growRate = typeData.growRate;
      enemy.originalScale = 1;
      enemy.currentScale = 1;
    }

    // NEW: Hallucination - make semi-transparent
    if (typeData.behavior === 'fake') {
      enemy.setAlpha(0.5);
    }

    // NEW: Context Loss teleport setup
    if (typeData.behavior === 'contextLoss') {
      enemy.lastTeleport = 0;
      enemy.teleportCooldown = typeData.teleportCooldown;
      enemy.wanderChance = typeData.wanderChance;
      enemy.isWandering = false;
      enemy.wanderAngle = 0;
    }

    // NEW: Prompt Injection hijack setup
    if (typeData.behavior === 'hijack') {
      enemy.lastHijack = 0;
      enemy.hijackCooldown = typeData.hijackCooldown;
      enemy.hijackDuration = typeData.hijackDuration;
    }

    // NEW v2 behaviors
    if (typeData.behavior === 'invisible') {
      // 404 - Only visible when close to player
      enemy.setAlpha(0.1);
    }
    if (typeData.behavior === 'blocker') {
      // CORS Error - Creates blocking damage zone, stationary
      enemy.blockDuration = typeData.blockDuration;
      enemy.spawnTime = this.time.now;
      // Pulsing danger zone effect - === FREEZE BUG FIX: Use tracked tween ===
      this.createTrackedTween({
        targets: enemy,
        scale: 1.3,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
    if (typeData.behavior === 'morph') {
      // Type Error - Changes appearance every few seconds
      enemy.nextMorph = this.time.now + typeData.morphInterval;
      enemy.morphInterval = typeData.morphInterval;
      enemy.originalTint = 0xffffff;
    }
    if (typeData.behavior === 'split') {
      // Git Conflict - Splits into 2 smaller enemies on death (handled in hitEnemy)
      enemy.canSplit = true;
    }
    if (typeData.behavior === 'predict') {
      // Overfitting - Moves toward where player is going
      enemy.playerLastX = this.player.x;
      enemy.playerLastY = this.player.y;
    }
    if (typeData.behavior === 'clone') {
      // Mode Collapse - Converts nearby enemies to copies
      enemy.lastClone = 0;
      enemy.cloneCooldown = typeData.cloneCooldown;
      enemy.cloneRadius = typeData.cloneRadius;
    }
  }

  spawnMiniBoss() {
    const miniBossData = this.miniBossTypes['miniboss-deadlock'];

    // Scale mini-boss health with wave
    const healthScale = 1 + Math.floor(this.waveNumber / 20) * 0.3;

    // Spawn mini-boss near player
    const mbX = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-200, 200), 100, this.worldWidth - 100);
    const mbY = Math.max(50, this.player.y - 250);
    const miniBoss = this.enemies.create(mbX, mbY, 'miniboss');
    miniBoss.health = Math.floor(miniBossData.health * healthScale);
    miniBoss.maxHealth = miniBoss.health;
    miniBoss.speed = miniBossData.speed;
    miniBoss.damage = miniBossData.damage;
    miniBoss.xpValue = miniBossData.xpValue;
    miniBoss.enemyType = 'miniboss-deadlock';
    miniBoss.isMiniBoss = true;
    miniBoss.miniBossName = miniBossData.name;
    miniBoss.miniBossColor = miniBossData.color;
    miniBoss.behavior = 'chase';
    miniBoss.ability = miniBossData.ability;
    miniBoss.lastAbilityTime = 0;

    // Mini-boss entrance
    this.cameras.main.shake(300, 0.01);

    const miniBossAnnounce = this.add.text(400, 150, `⚡ ${miniBossData.name} ⚡`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: `#${miniBossData.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: miniBossAnnounce,
      scale: 1.2,
      alpha: 0,
      duration: 2000,
      onComplete: () => miniBossAnnounce.destroy()
    });
  }

  autoAttack() {
    // Orbital weapons don't use normal attack - they're always active
    if (this.currentWeapon.type === 'orbital' || this.currentWeapon.type === 'ringoffire' ||
        this.currentWeapon.type === 'plasmaorb' || this.currentWeapon.type === 'deathaura') return;

    const now = this.time.now;
    const stats = this.getStats();
    let weapon = this.weaponTypes[this.currentWeapon.type];

    // Check evolution recipes for evolved weapons
    if (!weapon && this.evolutionRecipes) {
      for (const recipe of Object.values(this.evolutionRecipes)) {
        if (recipe.result === this.currentWeapon.type) {
          weapon = recipe;
          break;
        }
      }
    }
    if (!weapon) weapon = this.weaponTypes.basic;

    // Apply weapon's attack rate modifier
    const attackDelay = weapon.attackRate > 0 ? stats.attackRate / weapon.attackRate : 999999;
    if (now - this.lastAttackTime < attackDelay) return;

    // Handle AOE weapons (no projectiles, damage around player)
    if (weapon.special === 'aoe' || weapon.special === 'aura' || weapon.special === 'freezeAoe') {
      this.lastAttackTime = now;
      this.doAoeAttack(weapon, stats);
      return;
    }

    // Find nearest enemy
    let nearest = null;
    let nearestDist = Infinity;

    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
      if (dist < nearestDist && dist < 300) { // Attack range
        nearestDist = dist;
        nearest = enemy;
      }
    });

    if (nearest) {
      this.lastAttackTime = now;

      const baseAngle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        nearest.x, nearest.y
      );

      // Fire based on weapon type
      const projectileCount = weapon.projectiles;
      const spreadAngle = Math.PI / 6; // 30 degrees spread for spread shot

      for (let i = 0; i < projectileCount; i++) {
        let angle = baseAngle;

        // Spread shot: fan out projectiles
        if (projectileCount > 1) {
          const offset = (i - (projectileCount - 1) / 2) * spreadAngle;
          angle = baseAngle + offset;
        }

        const projectile = this.projectiles.create(this.player.x, this.player.y, 'slash');
        projectile.setRotation(angle);
        projectile.damage = Math.floor(stats.attackDamage * weapon.damage);
        projectile.pierce = weapon.pierce;
        projectile.setTint(weapon.color);

        // Mark forkbomb projectiles for chain splitting
        if (this.currentWeapon.type === 'forkbomb') {
          projectile.isForkBomb = true;
          projectile.forkDepth = 0;
        }

        // Homing projectiles track enemies
        if (weapon.special === 'homing') {
          projectile.isHoming = true;
          projectile.homingTarget = nearest;
        }

        // Bounce projectiles bounce off walls
        if (weapon.special === 'bounce') {
          projectile.isBounce = true;
          projectile.bouncesLeft = weapon.bounces || 3;
          projectile.body.setBounce(1, 1);
          projectile.body.setCollideWorldBounds(true);
          projectile.body.onWorldBounds = true;
        }

        // Freeze projectiles slow enemies
        if (weapon.special === 'freeze') {
          projectile.isFreeze = true;
          projectile.slowDuration = weapon.slowDuration || 2000;
        }

        // Set velocity
        this.physics.velocityFromRotation(angle, 400, projectile.body.velocity);

        // Pierce projectiles last longer, bounce last even longer
        let lifetime = weapon.pierce ? 2000 : 1000;
        if (weapon.special === 'bounce') lifetime = 3000;
        if (weapon.special === 'homing') lifetime = 2500;

        this.time.delayedCall(lifetime, () => {
          if (projectile.active) projectile.destroy();
        });
      }

      // Screen shake on attack (subtle)
      this.cameras.main.shake(50, 0.002);

      // Play shoot sound
      Audio.playShoot();
    }
  }

  doAoeAttack(weapon, stats) {
    const radius = weapon.radius || 100;
    const damage = Math.floor(stats.attackDamage * weapon.damage);
    const isFreeze = weapon.special === 'freezeAoe';

    // Visual effect - expanding ring
    const ring = this.add.circle(this.player.x, this.player.y, 10, weapon.color, 0.3);
    ring.setStrokeStyle(3, weapon.color, 0.8);

    this.tweens.add({
      targets: ring,
      scale: radius / 10,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy()
    });

    // Damage all enemies in radius
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
      if (dist < radius) {
        enemy.health -= damage;
        this.showDamageNumber(enemy.x, enemy.y, damage, false);

        // Freeze effect
        if (isFreeze && !enemy.isFrozen) {
          this.applyFreeze(enemy, weapon.slowDuration || 2000);
        }

        // Flash
        enemy.setTint(weapon.color);
        this.time.delayedCall(100, () => {
          if (enemy.active) enemy.clearTint();
        });

        // Check death
        if (enemy.health <= 0) {
          const xpMult = (this.xpEventMultiplier || 1) * (this.modifierEffects?.xpMult || 1);
          window.VIBE_CODER.addXP(Math.floor(enemy.xpValue * xpMult));
          window.VIBE_CODER.kills++;
          if (Math.random() < 0.1) this.spawnWeaponDrop(enemy.x, enemy.y);
          enemy.destroy();
          this.updateHUD();
        }
      }
    });

    Audio.playShoot();
  }

  applyFreeze(enemy, duration) {
    if (enemy.isFrozen) return;

    enemy.isFrozen = true;
    enemy.originalSpeed = enemy.speed;
    enemy.speed = enemy.speed * 0.3; // 70% slow
    enemy.setTint(0x88ffff);

    this.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.isFrozen = false;
        enemy.speed = enemy.originalSpeed;
        enemy.clearTint();
      }
    });
  }

  showMusicStatus(isPlaying) {
    const statusText = this.add.text(400, 500, isPlaying ? '🎵 MUSIC ON' : '🔇 MUSIC OFF', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: isPlaying ? '#00ff00' : '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: statusText,
      alpha: 0,
      duration: 1500,
      onComplete: () => statusText.destroy()
    });
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseSelectedOption = 0;

    // Pause physics
    this.physics.pause();

    // Pause all tweens
    this.tweens.pauseAll();

    // Pause timers
    if (this.spawnTimer) this.spawnTimer.paused = true;
    if (this.waveTimer) this.waveTimer.paused = true;

    // Create pause menu container (fixed to camera)
    this.pauseMenu = this.add.container(400, 300);
    this.pauseMenu.setDepth(1000);
    this.pauseMenu.setScrollFactor(0);

    // Dim overlay
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8);
    this.pauseMenu.add(overlay);

    // Pause title
    const pauseTitle = this.add.text(0, -150, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#003333',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.pauseMenu.add(pauseTitle);

    // Wave info
    const waveInfo = this.add.text(0, -90, `WAVE ${this.waveNumber} // KILLS: ${window.VIBE_CODER.kills}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
    this.pauseMenu.add(waveInfo);

    // Menu options
    this.pauseMenuOptions = ['RESUME', 'SETTINGS', 'RESTART', 'QUIT TO TITLE'];
    this.pauseMenuTexts = [];

    this.pauseMenuOptions.forEach((option, index) => {
      const text = this.add.text(0, -30 + index * 40, option, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: index === 0 ? '#00ffff' : '#666666',
        fontStyle: index === 0 ? 'bold' : 'normal'
      }).setOrigin(0.5);
      this.pauseMenu.add(text);
      this.pauseMenuTexts.push(text);
    });

    // Selector
    this.pauseSelector = this.add.text(-100, -30, '>', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pauseMenu.add(this.pauseSelector);

    // Blink selector
    this.pauseSelectorTween = this.tweens.add({
      targets: this.pauseSelector,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Control hint
    const hint = this.add.text(0, 150, '[ ARROWS/WASD TO SELECT // ENTER TO CONFIRM ]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666'
    }).setOrigin(0.5);
    this.pauseMenu.add(hint);

    // Setup pause menu input
    this.pauseUpKey = this.input.keyboard.on('keydown-UP', () => this.movePauseSelection(-1));
    this.pauseDownKey = this.input.keyboard.on('keydown-DOWN', () => this.movePauseSelection(1));
    this.pauseWKey = this.input.keyboard.on('keydown-W', () => this.movePauseSelection(-1));
    this.pauseSKey = this.input.keyboard.on('keydown-S', () => this.movePauseSelection(1));
    this.pauseEnterKey = this.input.keyboard.on('keydown-ENTER', () => this.selectPauseOption());
    this.pauseSpaceKey = this.input.keyboard.on('keydown-SPACE', () => this.selectPauseOption());
  }

  movePauseSelection(direction) {
    if (!this.isPaused || this.settingsOverlayOpen) return;

    this.pauseSelectedOption += direction;
    if (this.pauseSelectedOption < 0) this.pauseSelectedOption = this.pauseMenuOptions.length - 1;
    if (this.pauseSelectedOption >= this.pauseMenuOptions.length) this.pauseSelectedOption = 0;

    // Update visuals
    this.pauseMenuTexts.forEach((text, index) => {
      if (index === this.pauseSelectedOption) {
        text.setColor('#00ffff');
        text.setFontStyle('bold');
      } else {
        text.setColor('#666666');
        text.setFontStyle('normal');
      }
    });

    // Move selector
    this.pauseSelector.setY(-30 + this.pauseSelectedOption * 40);

    // Sound - respect SFX setting
    if (window.VIBE_SETTINGS?.sfxEnabled) {
      Audio.playXPGain();
    }
  }

  selectPauseOption() {
    if (!this.isPaused || this.settingsOverlayOpen) return;

    switch (this.pauseSelectedOption) {
      case 0: // RESUME
        this.resumeGame();
        break;

      case 1: // SETTINGS
        this.showPauseSettings();
        break;

      case 2: // RESTART
        if (window.VIBE_SETTINGS?.sfxEnabled) Audio.playWeaponPickup();
        this.destroyPauseMenu();
        this.restartGame();
        break;

      case 3: // QUIT TO TITLE
        if (window.VIBE_SETTINGS?.sfxEnabled) Audio.playWeaponPickup();
        this.destroyPauseMenu();
        this.quitToTitle();
        break;
    }
  }

  showPauseSettings() {
    // Simple settings toggle in pause menu
    const settings = window.VIBE_SETTINGS;
    this.settingsOverlayOpen = true;

    // Create settings overlay
    const settingsOverlay = this.add.container(0, 0);
    settingsOverlay.setDepth(1001);
    this.pauseMenu.add(settingsOverlay);

    // Background
    const bg = this.add.rectangle(0, 0, 350, 250, 0x000000, 0.95);
    bg.setStrokeStyle(2, 0x00ffff);
    settingsOverlay.add(bg);

    const title = this.add.text(0, -100, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    settingsOverlay.add(title);

    // Settings display
    const settingsItems = [
      { key: 'musicEnabled', label: 'MUSIC' },
      { key: 'sfxEnabled', label: 'SOUND FX' },
      { key: 'autoMove', label: 'AUTO-MOVE' }
    ];

    let selectedSetting = 0;
    const settingTexts = [];

    settingsItems.forEach((item, index) => {
      const value = settings[item.key] ? 'ON' : 'OFF';
      const text = this.add.text(0, -50 + index * 35, `${item.label}: [${value}]`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: index === 0 ? '#00ffff' : '#888888'
      }).setOrigin(0.5);
      settingsOverlay.add(text);
      settingTexts.push({ text, item });
    });

    const hint = this.add.text(0, 80, 'UP/DOWN: Select | ENTER: Toggle | ESC: Back', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666'
    }).setOrigin(0.5);
    settingsOverlay.add(hint);

    // Update display
    const updateSettingsDisplay = () => {
      settingTexts.forEach((st, index) => {
        const value = settings[st.item.key] ? 'ON' : 'OFF';
        st.text.setText(`${st.item.label}: [${value}]`);
        st.text.setColor(index === selectedSetting ? '#00ffff' : '#888888');
      });
    };

    // Input handlers
    const settingUp = () => {
      selectedSetting = (selectedSetting - 1 + settingsItems.length) % settingsItems.length;
      updateSettingsDisplay();
    };

    const settingDown = () => {
      selectedSetting = (selectedSetting + 1) % settingsItems.length;
      updateSettingsDisplay();
    };

    const settingToggle = () => {
      const key = settingsItems[selectedSetting].key;
      settings.toggle(key);
      if (key === 'musicEnabled') {
        Audio.toggleMusic();
      }
      updateSettingsDisplay();
    };

    const closeSettings = () => {
      this.settingsOverlayOpen = false;
      this.input.keyboard.off('keydown-UP', settingUp);
      this.input.keyboard.off('keydown-DOWN', settingDown);
      this.input.keyboard.off('keydown-W', settingUp);
      this.input.keyboard.off('keydown-S', settingDown);
      this.input.keyboard.off('keydown-ENTER', settingToggle);
      this.input.keyboard.off('keydown-SPACE', settingToggle);
      this.input.keyboard.off('keydown-ESC', closeSettings);
      settingsOverlay.destroy();
    };

    this.input.keyboard.on('keydown-UP', settingUp);
    this.input.keyboard.on('keydown-DOWN', settingDown);
    this.input.keyboard.on('keydown-W', settingUp);
    this.input.keyboard.on('keydown-S', settingDown);
    this.input.keyboard.on('keydown-ENTER', settingToggle);
    this.input.keyboard.on('keydown-SPACE', settingToggle);
    this.input.keyboard.on('keydown-ESC', closeSettings);
  }

  resumeGame() {
    if (!this.isPaused) return;

    Audio.playWeaponPickup();

    this.destroyPauseMenu();

    // Resume physics
    this.physics.resume();

    // Resume tweens
    this.tweens.resumeAll();

    // Resume timers
    if (this.spawnTimer) this.spawnTimer.paused = false;
    if (this.waveTimer) this.waveTimer.paused = false;

    this.isPaused = false;
  }

  destroyPauseMenu() {
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
    if (this.pauseSelectorTween) {
      this.pauseSelectorTween.stop();
    }
    this.pauseMenuTexts = [];
  }

  restartGame() {
    // Reset everything
    this.isPaused = false;

    // === FREEZE BUG FIX: Clean up weapon expiry timer ===
    if (this.weaponExpiryTimer) {
      this.weaponExpiryTimer.remove();
      this.weaponExpiryTimer = null;
    }

    // === FREEZE BUG FIX: Clean up tracked tweens on entities ===
    this.cleanupTrackedTweens();

    // Reset player
    this.player.health = this.getStats().maxHealth;
    this.player.maxHealth = this.getStats().maxHealth;
    this.player.x = this.worldWidth / 2;
    this.player.y = this.worldHeight / 2;
    this.player.clearTint();

    // Clear enemies
    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);
    this.weaponDrops.clear(true, true);

    // Reset game state
    this.waveNumber = 1;
    this.currentStage = 0;
    this.currentBoss = null;
    this.invincible = false;
    this.collectedWeapons = new Set(['basic']);
    this.currentWeapon = { type: 'basic', duration: Infinity };
    this.clearOrbitals();

    // Reset VIBE_CODER state
    window.VIBE_CODER.xp = 0;
    window.VIBE_CODER.level = 1;
    window.VIBE_CODER.kills = 0;
    window.VIBE_CODER.streak = 1;

    // Clear saved run (fresh restart)
    SaveManager.clearSave();

    // Recreate background
    this.createBackground();

    // Regenerate map obstacles
    if (this.mapManager) {
      this.mapManager.generateMap(this.currentStage);
      this.mapManager.setupCollisions(this.player, this.enemies, this.projectiles);
    }

    // Resume physics
    this.physics.resume();
    this.tweens.resumeAll();

    // Restart wave
    this.startWave();
    this.updateHUD();

    // Show restart text
    const restartText = this.add.text(400, 300, 'GAME RESTARTED', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      onComplete: () => restartText.destroy()
    });
  }

  quitToTitle() {
    this.isPaused = false;

    // Save high scores
    if (this.waveNumber > this.highWave) {
      localStorage.setItem('vibeCoderHighWave', this.waveNumber.toString());
    }

    // Stop music
    Audio.stopMusic();

    // === FREEZE BUG FIX: Clean up event listeners ===
    this.cleanupEventListeners();

    // === FREEZE BUG FIX: Clean up weapon timer ===
    if (this.weaponExpiryTimer) {
      this.weaponExpiryTimer.remove();
      this.weaponExpiryTimer = null;
    }

    // === FREEZE BUG FIX: Clean up tracked tweens ===
    this.cleanupTrackedTweens();

    // Clear map
    if (this.mapManager) {
      this.mapManager.clearMap();
    }

    // Fade out and go to title
    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      // Clean up
      this.physics.resume();
      this.tweens.resumeAll();

      // Go to title scene
      this.scene.start('TitleScene');
    });
  }

  /**
   * === FREEZE BUG FIX: Clean up event listeners ===
   */
  cleanupEventListeners() {
    if (this.xpPopupHandler) {
      window.removeEventListener('xpgained', this.xpPopupHandler);
      this.xpPopupHandler = null;
    }
    if (this.levelUpHandler) {
      window.removeEventListener('levelup', this.levelUpHandler);
      this.levelUpHandler = null;
    }
    if (this.xpHandler) {
      window.removeEventListener('xpgained', this.xpHandler);
      this.xpHandler = null;
    }
    if (this.xpServerConnectedHandler) {
      window.removeEventListener('xpserver-connected', this.xpServerConnectedHandler);
      this.xpServerConnectedHandler = null;
    }
    if (this.xpServerDisconnectedHandler) {
      window.removeEventListener('xpserver-disconnected', this.xpServerDisconnectedHandler);
      this.xpServerDisconnectedHandler = null;
    }
  }

  /**
   * Auto-save current run state at wave completion
   */
  autoSaveRun() {
    const vibeState = window.VIBE_CODER;

    const saveData = {
      wave: this.waveNumber,
      stage: this.currentStage,
      player: {
        level: vibeState.level,
        xp: vibeState.xp,
        totalXP: vibeState.totalXP,
        health: this.player.health,
        maxHealth: this.player.maxHealth || this.baseStats.maxHealth,
        kills: vibeState.kills,
        streak: vibeState.streak || 0
      },
      weapons: {
        current: this.currentWeapon,
        collected: Array.from(this.collectedWeapons || [])
      },
      // Save active modifier IDs
      modifiers: (this.activeModifiers || []).map(m => m.id)
    };

    const success = SaveManager.saveRun(saveData);
    if (success) {
      // Show subtle save indicator
      const saveIcon = this.add.text(760, 10, '💾', {
        fontSize: '16px'
      }).setScrollFactor(0);

      this.tweens.add({
        targets: saveIcon,
        alpha: 0,
        duration: 1000,
        delay: 500,
        onComplete: () => saveIcon.destroy()
      });
    }
  }

  /**
   * Show rebirth prompt when milestone is reached
   * @param {object} milestone - Rebirth milestone data
   */
  showRebirthPrompt(milestone) {
    this.rebirthPromptShown = true;
    this.isPaused = true;

    // Create overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
      .setScrollFactor(0)
      .setDepth(1000);

    // Title
    const title = this.add.text(400, 150, '⭐ REBIRTH AVAILABLE ⭐', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Milestone info
    const milestoneText = this.add.text(400, 200, `You've reached Wave ${milestone.wave}!`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Rank name
    const rankText = this.add.text(400, 235, `Unlock: ${milestone.name}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Current rebirth info
    const currentInfo = RebirthManager.getRebirthInfo();
    const newBonus = (milestone.rebirth * 5); // 5% per rebirth level

    // Bonuses explanation
    const bonusLines = [
      'REBIRTH BONUSES:',
      `• +${newBonus}% All Stats (permanent)`,
      `• +${milestone.rebirth * 10}% XP Gain (permanent)`,
      `• ${Math.min(3, milestone.rebirth)} Starting Weapon(s)`,
      '',
      'Warning: Rebirthing resets your current run!'
    ];

    const bonusText = this.add.text(400, 320, bonusLines.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Buttons
    const rebirthBtn = this.add.text(300, 450, '[ REBIRTH ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive();

    const continueBtn = this.add.text(500, 450, '[ CONTINUE ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive();

    // Store elements for cleanup
    const elements = [overlay, title, milestoneText, rankText, bonusText, rebirthBtn, continueBtn];

    // Button interactions
    rebirthBtn.on('pointerover', () => rebirthBtn.setColor('#88ff88'));
    rebirthBtn.on('pointerout', () => rebirthBtn.setColor('#00ff00'));
    rebirthBtn.on('pointerdown', () => {
      // Perform rebirth
      RebirthManager.performRebirth(this.waveNumber, window.VIBE_CODER.kills);
      elements.forEach(el => el.destroy());
      this.isPaused = false;

      // Show rebirth complete message and return to title
      const completeText = this.add.text(400, 300, `REBORN AS: ${milestone.name}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

      this.time.delayedCall(2000, () => {
        completeText.destroy();
        this.quitToTitle();
      });
    });

    continueBtn.on('pointerover', () => continueBtn.setColor('#ffff88'));
    continueBtn.on('pointerout', () => continueBtn.setColor('#ffff00'));
    continueBtn.on('pointerdown', () => {
      elements.forEach(el => el.destroy());
      this.isPaused = false;
      // Continue to next wave
      this.time.delayedCall(500, () => this.startWave());
    });
  }

  /**
   * === FREEZE BUG FIX: Clean up tracked tweens on entities ===
   */
  cleanupTrackedTweens() {
    // Stop all tracked tweens
    this.activeTweens.forEach(tween => {
      if (tween && tween.isPlaying && tween.isPlaying()) {
        tween.stop();
      }
    });
    this.activeTweens.clear();
  }

  /**
   * === FREEZE BUG FIX: Create a tracked tween that will be cleaned up ===
   * Use this for infinite tweens on entities that may be destroyed
   */
  createTrackedTween(config) {
    const tween = this.tweens.add(config);
    this.activeTweens.add(tween);

    // Store reference on target for cleanup when target is destroyed
    const target = config.targets;
    if (target && !Array.isArray(target)) {
      target.trackedTweens = target.trackedTweens || [];
      target.trackedTweens.push(tween);
    }

    return tween;
  }

  /**
   * === FREEZE BUG FIX: Destroy entity and clean up its tweens ===
   */
  destroyWithTweenCleanup(entity) {
    if (!entity) return;

    // Stop all tweens on this entity
    if (entity.trackedTweens) {
      entity.trackedTweens.forEach(tween => {
        if (tween && tween.isPlaying && tween.isPlaying()) {
          tween.stop();
        }
        this.activeTweens.delete(tween);
      });
      entity.trackedTweens = [];
    }

    // Destroy the entity
    if (entity.destroy) {
      entity.destroy();
    }
  }

  spawnWeaponDrop(x, y, forceRare = false) {
    let weaponType;
    let textureKey;
    let isMelee = false;

    // Check for JACKPOT event forcing rare drops
    const shouldForceRare = forceRare || this.forceRareDrops;

    if (shouldForceRare) {
      // Rare weapons from bosses
      const rarePool = ['rmrf', 'sudo', 'forkbomb'];
      weaponType = Phaser.Utils.Array.GetRandom(rarePool);
      textureKey = `weapon-${weaponType}`;
    } else {
      // Normal weapon drops - weighted pools
      const commonPool = ['spread', 'pierce', 'rapid', 'homing', 'bounce'];
      const uncommonPool = ['orbital', 'aoe', 'freeze'];
      const meleePool = ['sword', 'spear', 'boomerang', 'kunai'];

      // 60% common, 25% uncommon, 15% melee
      const roll = Math.random();
      if (roll < 0.6) {
        weaponType = Phaser.Utils.Array.GetRandom(commonPool);
        textureKey = `weapon-${weaponType}`;
      } else if (roll < 0.85) {
        weaponType = Phaser.Utils.Array.GetRandom(uncommonPool);
        textureKey = `weapon-${weaponType}`;
      } else {
        weaponType = Phaser.Utils.Array.GetRandom(meleePool);
        textureKey = `melee-${weaponType}`;
        isMelee = true;
      }
    }

    const drop = this.weaponDrops.create(x, y, textureKey);
    drop.weaponType = weaponType;
    drop.isRare = shouldForceRare;
    drop.isMelee = isMelee;

    // Bounce animation
    this.tweens.add({
      targets: drop,
      y: y - 20,
      duration: 300,
      yoyo: true,
      ease: 'Bounce.Out'
    });

    // Pulsing glow (more intense for rare) - === FREEZE BUG FIX: Use tracked tween ===
    this.createTrackedTween({
      targets: drop,
      scale: forceRare ? 1.5 : 1.3,
      alpha: forceRare ? 1 : 0.7,
      duration: forceRare ? 300 : 500,
      yoyo: true,
      repeat: -1
    });

    // Rare drops last longer (15 sec vs 10 sec)
    const lifetime = forceRare ? 15000 : 10000;
    this.time.delayedCall(lifetime, () => {
      if (drop.active) {
        this.tweens.add({
          targets: drop,
          alpha: 0,
          duration: 500,
          onComplete: () => drop.destroy()
        });
      }
    });

    // Special announcement for rare drops
    if (forceRare) {
      const rareNames = {
        rmrf: '💀 rm -rf',
        sudo: '👑 SUDO MODE',
        forkbomb: '💣 FORK BOMB'
      };
      const dropText = this.add.text(x, y - 40, `${rareNames[weaponType]} DROPPED!`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: dropText,
        y: dropText.y - 30,
        alpha: 0,
        duration: 2000,
        onComplete: () => dropText.destroy()
      });
    }
  }

  pickupWeapon(player, drop) {
    const weaponType = drop.weaponType;
    const isRare = drop.isRare;
    drop.destroy();

    // Handle special rare weapon effects
    if (weaponType === 'rmrf') {
      // rm -rf: INSTANT KILL ALL ENEMIES ON SCREEN
      this.activateRmRf();
      return;
    }

    if (weaponType === 'sudo') {
      // Sudo: God mode for 10 seconds
      this.activateSudoMode();
      return;
    }

    // Track collected weapons for evolution
    this.collectedWeapons.add(weaponType);

    // Check for weapon evolution!
    const evolvedWeapon = this.checkWeaponEvolution(weaponType);
    const finalWeaponType = evolvedWeapon || weaponType;

    // === Clear previous weapon timer before assigning new weapon ===
    if (this.weaponExpiryTimer) {
      this.weaponExpiryTimer.remove();
    }

    // Set new weapon with duration (rare/evolved weapons last longer, apply upgrade bonus)
    const isEvolved = evolvedWeapon !== null;
    const baseDuration = isEvolved ? 25000 : (isRare ? 20000 : 15000);
    const duration = Math.floor(baseDuration * this.getWeaponDurationBonus());
    this.currentWeapon = {
      type: finalWeaponType,
      duration: duration,
      isEvolved: isEvolved
    };

    // If orbital-type weapon, create orbital projectiles
    const orbitalWeapons = ['orbital', 'ringoffire', 'plasmaorb', 'deathaura'];
    if (orbitalWeapons.includes(finalWeaponType)) {
      this.createOrbitals();
    }

    // Show pickup text
    const weaponNames = {
      spread: '🔥 SPREAD SHOT',
      pierce: '💎 PIERCING',
      orbital: '🌀 ORBITAL',
      rapid: '⚡ RAPID FIRE',
      homing: '🎯 HOMING',
      bounce: '🏀 BOUNCE',
      aoe: '💥 AOE BLAST',
      freeze: '❄️ FREEZE',
      forkbomb: '💣 FORK BOMB'
    };

    const textColor = isRare ? '#ffd700' : '#ffffff';
    const pickupText = this.add.text(player.x, player.y - 50, (weaponNames[weaponType] || weaponType.toUpperCase()) + ` [${Math.floor(duration/1000)}s]`, {
      fontFamily: 'monospace',
      fontSize: isRare ? '20px' : '16px',
      color: textColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pickupText,
      y: pickupText.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => pickupText.destroy()
    });

    // Weapon pickup sound
    Audio.playWeaponPickup();

    // Screen flash (more dramatic for rare)
    if (isRare) {
      this.cameras.main.flash(200, 255, 215, 0);
    } else {
      this.cameras.main.flash(100, 255, 255, 0);
    }

    // Start weapon timer (tracked for cleanup)
    this.weaponExpiryTimer = this.time.delayedCall(this.currentWeapon.duration, () => {
      // Revert to basic if still using this weapon (compare evolved type, not pre-evolution)
      if (this.currentWeapon.type === finalWeaponType) {
        this.currentWeapon = { type: 'basic', duration: Infinity };
        this.clearOrbitals();
        this.weaponExpiryTimer = null;

        const revertText = this.add.text(this.player.x, this.player.y - 30, 'WEAPON EXPIRED', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ff6666'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: revertText,
          alpha: 0,
          duration: 1000,
          onComplete: () => revertText.destroy()
        });
      }
    });

    this.updateHUD();
  }

  activateRmRf() {
    // THE NUCLEAR OPTION - KILL EVERYTHING
    Audio.playNuke();

    this.cameras.main.flash(500, 255, 0, 0);
    this.cameras.main.shake(800, 0.04);

    // Big announcement
    const rmrfText = this.add.text(400, 300, '💀 rm -rf /* 💀\nEXECUTED', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ff0000',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.tweens.add({
      targets: rmrfText,
      scale: 2,
      alpha: 0,
      duration: 1500,
      onComplete: () => rmrfText.destroy()
    });

    // Kill ALL enemies
    let killCount = 0;
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;

      killCount++;
      // Apply event and modifier XP multipliers
      const xpMult = (this.xpEventMultiplier || 1) * (this.modifierEffects?.xpMult || 1);
      window.VIBE_CODER.addXP(Math.floor(enemy.xpValue * xpMult));
      window.VIBE_CODER.kills++;

      // Death particle
      for (let i = 0; i < 3; i++) {
        const particle = this.add.circle(
          enemy.x + Phaser.Math.Between(-20, 20),
          enemy.y + Phaser.Math.Between(-20, 20),
          Phaser.Math.Between(5, 12),
          0xff0000
        );
        this.tweens.add({
          targets: particle,
          alpha: 0,
          scale: 0,
          duration: 500,
          onComplete: () => particle.destroy()
        });
      }

      // Clear boss reference if needed
      if (enemy.isBoss && this.currentBoss === enemy) {
        this.currentBoss = null;
      }

      enemy.destroy();
    });

    // Show kill count
    if (killCount > 0) {
      const killText = this.add.text(400, 400, `${killCount} PROCESSES TERMINATED`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ff6666'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: killText,
        alpha: 0,
        duration: 2000,
        onComplete: () => killText.destroy()
      });
    }

    this.updateHUD();
  }

  activateSudoMode() {
    // GOD MODE - invincible + 3x damage for 10 seconds
    this.cameras.main.flash(300, 255, 215, 0);

    const sudoText = this.add.text(400, 300, '👑 SUDO MODE ACTIVATED 👑\nINVINCIBLE + 3X DAMAGE', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: sudoText,
      scale: 1.3,
      alpha: 0,
      duration: 2000,
      onComplete: () => sudoText.destroy()
    });

    // Set sudo weapon (has 3x damage)
    this.currentWeapon = {
      type: 'sudo',
      duration: 10000
    };

    // Make player invincible
    this.invincible = true;

    // Golden glow effect on player
    this.player.setTint(0xffd700);

    // End sudo after 10 seconds
    this.time.delayedCall(10000, () => {
      if (this.currentWeapon.type === 'sudo') {
        this.currentWeapon = { type: 'basic', duration: Infinity };
        this.invincible = false;
        this.player.clearTint();

        const endText = this.add.text(this.player.x, this.player.y - 30, 'SUDO EXPIRED', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ff6666'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: endText,
          alpha: 0,
          duration: 1000,
          onComplete: () => endText.destroy()
        });

        this.updateHUD();
      }
    });

    this.updateHUD();
  }

  createOrbitals() {
    this.clearOrbitals();

    const stats = this.getStats();
    const weaponType = this.currentWeapon.type;

    // Get the weapon data - check evolved weapons first
    let weapon = this.weaponTypes[weaponType];
    if (!weapon) {
      // Check evolution recipes for evolved orbital weapons
      for (const recipe of Object.values(this.evolutionRecipes)) {
        if (recipe.result === weaponType) {
          weapon = recipe;
          break;
        }
      }
    }
    if (!weapon) weapon = this.weaponTypes.orbital;

    // Determine orbital count based on weapon type
    const orbitalCount = weapon.orbitalCount || 3;
    const angleStep = 360 / orbitalCount;

    // Create orbiting projectiles
    for (let i = 0; i < orbitalCount; i++) {
      const orbital = this.add.circle(0, 0, 12, weapon.color);
      orbital.angle = (i * angleStep) * (Math.PI / 180);
      orbital.damage = Math.floor(stats.attackDamage * weapon.damage);
      this.orbitals.add(orbital);
    }
  }

  clearOrbitals() {
    this.orbitals.clear(true, true);
  }

  checkWeaponEvolution(newWeapon) {
    // Check if we can evolve by combining collected weapons
    for (const [combo, evolved] of Object.entries(this.evolutionRecipes)) {
      const [weapon1, weapon2] = combo.split('+');

      // Check if we have both weapons AND just picked up one of them
      if (this.collectedWeapons.has(weapon1) && this.collectedWeapons.has(weapon2)) {
        if (newWeapon === weapon1 || newWeapon === weapon2) {
          // Evolution triggered!
          this.showEvolutionEffect(evolved);

          // Add evolved weapon to weaponTypes
          if (!this.weaponTypes[evolved.result]) {
            this.weaponTypes[evolved.result] = evolved;
          }

          return evolved.result;
        }
      }
    }
    return null;
  }

  showEvolutionEffect(evolved) {
    // Epic evolution sound!
    Audio.playEvolution();

    // Epic evolution visual
    this.cameras.main.flash(400, 255, 255, 255);
    this.cameras.main.shake(300, 0.02);

    const evoText = this.add.text(400, 250, `⚡ WEAPON EVOLVED! ⚡\n${evolved.name}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: `#${evolved.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.tweens.add({
      targets: evoText,
      scale: 1.5,
      alpha: 0,
      duration: 2500,
      onComplete: () => evoText.destroy()
    });

    // Particle burst
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        this.player.x + Phaser.Math.Between(-50, 50),
        this.player.y + Phaser.Math.Between(-50, 50),
        Phaser.Math.Between(5, 15),
        evolved.color
      );
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
  }

  activateXPMagnet() {
    // Magnet effect: pull all XP orbs/enemies toward player briefly, then kill them
    // For now, give bonus XP and create visual magnet effect
    Audio.playMagnet();

    const magnetText = this.add.text(400, 350, '🧲 XP MAGNET! 🧲', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: magnetText,
      scale: 1.3,
      alpha: 0,
      duration: 1500,
      onComplete: () => magnetText.destroy()
    });

    // Create magnetic pull visual on nearby enemies
    const magnetRadius = 200;
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;

      const dist = Phaser.Math.Distance.Between(
        enemy.x, enemy.y,
        this.player.x, this.player.y
      );

      if (dist < magnetRadius) {
        // Pull enemies toward player
        this.tweens.add({
          targets: enemy,
          x: this.player.x,
          y: this.player.y,
          duration: 500,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (enemy.active) {
              // Award XP for magnetized enemies
              window.VIBE_CODER.addXP(Math.floor(enemy.xpValue * 0.5));
              window.VIBE_CODER.kills++;

              // Death effect
              const particle = this.add.circle(enemy.x, enemy.y, 15, 0x00ffff, 0.8);
              this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 3,
                duration: 300,
                onComplete: () => particle.destroy()
              });

              enemy.destroy();
              this.updateHUD();
            }
          }
        });

        // Cyan tint while being pulled
        enemy.setTint(0x00ffff);
      }
    });

    // Create magnetic ring visual
    const ring = this.add.circle(this.player.x, this.player.y, magnetRadius, 0x00ffff, 0);
    ring.setStrokeStyle(3, 0x00ffff, 0.5);

    this.tweens.add({
      targets: ring,
      scale: 0,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy()
    });
  }

  updateOrbitals() {
    const orbitalWeapons = ['orbital', 'ringoffire', 'plasmaorb', 'deathaura'];
    if (!orbitalWeapons.includes(this.currentWeapon.type) || this.orbitals.getLength() === 0) return;

    const radius = 80;
    const speed = 0.05;

    this.orbitals.children.each((orbital) => {
      orbital.angle += speed;
      orbital.x = this.player.x + Math.cos(orbital.angle) * radius;
      orbital.y = this.player.y + Math.sin(orbital.angle) * radius;

      // Check collision with enemies
      this.enemies.children.each((enemy) => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(orbital.x, orbital.y, enemy.x, enemy.y);
        if (dist < 25) {
          // Hit enemy
          enemy.health -= orbital.damage;
          enemy.setTint(0xffffff);
          this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
          });

          if (enemy.health <= 0) {
            const xpMult = (this.xpEventMultiplier || 1) * (this.modifierEffects?.xpMult || 1);
            window.VIBE_CODER.addXP(Math.floor(enemy.xpValue * xpMult));
            window.VIBE_CODER.kills++;
            if (Math.random() < 0.1) this.spawnWeaponDrop(enemy.x, enemy.y);
            enemy.destroy();
            this.updateHUD();
          }
        }
      });
    });
  }

  showDamageNumber(x, y, damage, isCrit = false) {
    const color = isCrit ? '#ffff00' : '#ffffff';
    const size = isCrit ? '20px' : '14px';
    const text = isCrit ? `${damage}!` : `${damage}`;

    const dmgText = this.add.text(
      x + Phaser.Math.Between(-10, 10),
      y - 10,
      text,
      {
        fontFamily: 'monospace',
        fontSize: size,
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5);

    // Float up and fade
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 40,
      alpha: 0,
      scale: isCrit ? 1.5 : 1,
      duration: 800,
      ease: 'Power2',
      onComplete: () => dmgText.destroy()
    });
  }

  // === LEGENDARY WEAPONS ===

  spawnEquippedLegendary() {
    const legendaries = window.VIBE_LEGENDARIES;
    if (!legendaries) return;

    const equipped = legendaries.getEquipped();
    if (!equipped) return;

    const stats = this.getStats();
    const textureKey = `legendary-${equipped.key}`;

    // Create the legendary weapon sprites that orbit the player
    for (let i = 0; i < equipped.orbitalCount; i++) {
      const angle = (i / equipped.orbitalCount) * Math.PI * 2;
      const weapon = this.add.sprite(0, 0, textureKey);
      weapon.angle = angle;
      weapon.spinSpeed = equipped.spinSpeed;
      weapon.damage = Math.floor(stats.attackDamage * equipped.damage);
      weapon.radius = equipped.radius;
      weapon.legendaryKey = equipped.key;
      weapon.setDepth(10);
      this.legendaryWeapons.add(weapon);
    }

    // Show equipped notification
    const equipText = this.add.text(400, 150, `⚔️ ${equipped.name} EQUIPPED ⚔️`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00ff66',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: equipText,
      alpha: 0,
      y: 100,
      duration: 3000,
      onComplete: () => equipText.destroy()
    });
  }

  updateLegendaryWeapons() {
    if (this.legendaryWeapons.getLength() === 0) return;

    const stats = this.getStats();

    this.legendaryWeapons.children.each((weapon) => {
      // Spin around player
      weapon.angle += weapon.spinSpeed;
      weapon.x = this.player.x + Math.cos(weapon.angle) * weapon.radius;
      weapon.y = this.player.y + Math.sin(weapon.angle) * weapon.radius;

      // Rotate the sprite to face outward
      weapon.rotation = weapon.angle + Math.PI / 2;

      // Check collision with enemies
      this.enemies.children.each((enemy) => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(weapon.x, weapon.y, enemy.x, enemy.y);
        if (dist < 30) {
          // Cooldown check per enemy
          const now = this.time.now;
          if (!enemy.lastLegendaryHit || now - enemy.lastLegendaryHit > 200) {
            enemy.lastLegendaryHit = now;

            // Deal damage
            const damage = Math.floor(stats.attackDamage * 5); // Legendary damage
            enemy.health -= damage;
            this.showDamageNumber(enemy.x, enemy.y, damage, true); // Always looks like crit

            // Flash effect
            enemy.setTint(0x00ff66);
            this.time.delayedCall(50, () => {
              if (enemy.active) enemy.clearTint();
            });

            if (enemy.health <= 0) {
              // Check for legendary drop (super rare)
              this.checkLegendaryDrop(enemy.x, enemy.y);

              const xpMult = (this.xpEventMultiplier || 1) * (this.modifierEffects?.xpMult || 1);
              window.VIBE_CODER.addXP(Math.floor(enemy.xpValue * xpMult));
              window.VIBE_CODER.kills++;
              if (Math.random() < 0.15) this.spawnWeaponDrop(enemy.x, enemy.y);
              enemy.destroy();
              this.updateHUD();
            }
          }
        }
      });
    });
  }

  checkLegendaryDrop(x, y) {
    const legendaries = window.VIBE_LEGENDARIES;
    if (!legendaries) return;

    // Check each legendary for drop
    for (const [key, weapon] of Object.entries(legendaries.weapons)) {
      if (!legendaries.hasUnlocked(key) && Math.random() < weapon.dropRate) {
        // LEGENDARY DROP!
        legendaries.unlock(key);
        this.showLegendaryDrop(x, y, key, weapon);
        return; // Only one legendary per kill
      }
    }
  }

  showLegendaryDrop(x, y, key, weapon) {
    // Epic camera effects
    this.cameras.main.flash(1000, 255, 215, 0);
    this.cameras.main.shake(500, 0.03);

    // Stop time briefly
    this.physics.pause();
    this.time.delayedCall(1500, () => this.physics.resume());

    // Legendary announcement
    const announceText = this.add.text(400, 200, '⚔️ LEGENDARY WEAPON ⚔️', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const nameText = this.add.text(400, 250, weapon.name, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ff66',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const descText = this.add.text(400, 290, weapon.desc, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const equipText = this.add.text(400, 330, 'PERMANENTLY UNLOCKED!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Spawn the weapon sprite at drop location
    const textureKey = `legendary-${key}`;
    const dropSprite = this.add.sprite(x, y, textureKey);
    dropSprite.setScale(2);

    // Animate it flying to center
    this.tweens.add({
      targets: dropSprite,
      x: 400,
      y: 200,
      scale: 3,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: [dropSprite, announceText, nameText, descText, equipText],
          alpha: 0,
          duration: 2000,
          delay: 2000,
          onComplete: () => {
            dropSprite.destroy();
            announceText.destroy();
            nameText.destroy();
            descText.destroy();
            equipText.destroy();
          }
        });
      }
    });

    // Play epic sound
    Audio.playEvolution();
  }

  hitEnemy(projectile, enemy) {
    // Check for critical hit (base 10% + crit upgrade bonus)
    const critChance = this.getCritChance();
    const isCrit = Math.random() < critChance;
    const finalDamage = isCrit ? projectile.damage * 2 : projectile.damage;

    // Deal damage
    enemy.health -= finalDamage;

    // Show damage number
    this.showDamageNumber(enemy.x, enemy.y, finalDamage, isCrit);

    // Play hit sound
    Audio.playHit();

    // Fork bomb special: spawn 2 child projectiles on hit
    if (projectile.isForkBomb && !projectile.isChild && projectile.forkDepth < 2) {
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const child = this.projectiles.create(projectile.x, projectile.y, 'slash');
        child.setRotation(angle);
        child.damage = Math.floor(projectile.damage * 0.7);
        child.pierce = false;
        child.setTint(0xff00ff);
        child.isForkBomb = true;
        child.isChild = true;
        child.forkDepth = (projectile.forkDepth || 0) + 1;
        this.physics.velocityFromRotation(angle, 300, child.body.velocity);
        this.time.delayedCall(500, () => {
          if (child.active) child.destroy();
        });
      }
    }

    // Freeze special: slow enemy on hit
    if (projectile.isFreeze && !enemy.isFrozen) {
      this.applyFreeze(enemy, projectile.slowDuration || 2000);
    }

    // Only destroy non-piercing projectiles
    if (!projectile.pierce) {
      projectile.destroy();
    }

    // Flash enemy white then back
    enemy.setTint(0xffffff);
    this.time.delayedCall(100, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    // Check death
    if (enemy.health <= 0) {
      // Award XP (apply event and modifier multipliers)
      const xpMult = (this.xpEventMultiplier || 1) * (this.modifierEffects?.xpMult || 1);
      window.VIBE_CODER.addXP(Math.floor(enemy.xpValue * xpMult));
      window.VIBE_CODER.kills++;

      // GIT CONFLICT: Split into 2 smaller enemies on death
      if (enemy.behavior === 'split' && enemy.canSplit) {
        for (let i = 0; i < 2; i++) {
          const offsetX = Phaser.Math.Between(-30, 30);
          const offsetY = Phaser.Math.Between(-30, 30);
          const splitEnemy = this.enemies.create(
            enemy.x + offsetX,
            enemy.y + offsetY,
            'enemy-git-conflict'
          );
          const parentMaxHealth = enemy.maxHealth || this.enemyTypes['git-conflict'].health;
          splitEnemy.health = Math.floor(parentMaxHealth * 0.4) + 10;
          splitEnemy.maxHealth = splitEnemy.health;
          splitEnemy.speed = enemy.speed * 1.2;
          splitEnemy.damage = Math.floor(enemy.damage * 0.7);
          splitEnemy.xpValue = Math.floor(enemy.xpValue * 0.3);
          splitEnemy.enemyType = 'git-conflict';
          splitEnemy.behavior = 'split';
          splitEnemy.canSplit = false; // Can't split again
          splitEnemy.setScale(0.7);
          splitEnemy.setTint(i === 0 ? 0xff6600 : 0x0066ff);
          // Flash effect
          const splitText = this.add.text(splitEnemy.x, splitEnemy.y - 15, 'MERGE CONFLICT!', {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#ffff00'
          }).setOrigin(0.5);
          this.tweens.add({
            targets: splitText,
            y: splitText.y - 10,
            alpha: 0,
            duration: 600,
            onComplete: () => splitText.destroy()
          });
        }
      }

      // Boss death - special handling
      if (enemy.isBoss) {
        // Epic boss death sound!
        Audio.playBossDeath();

        // Guaranteed rare weapon drop!
        this.spawnWeaponDrop(enemy.x, enemy.y, true);

        // Clear current boss reference
        if (this.currentBoss === enemy) {
          this.currentBoss = null;
        }

        // Return to stage music
        Audio.setTrack(this.currentStage);

        // Epic death effect
        this.cameras.main.shake(500, 0.03);
        this.cameras.main.flash(300, 255, 255, 255);

        // Boss death announcement (fixed to camera center)
        const deathText = this.add.text(400, 300, `${enemy.bossName}\nDEFEATED!`, {
          fontFamily: 'monospace',
          fontSize: '32px',
          color: '#ffd700',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({
          targets: deathText,
          scale: 1.5,
          alpha: 0,
          duration: 2000,
          onComplete: () => deathText.destroy()
        });

        // Massive particle explosion (scale down at high waves)
        const bossParticleCount = this.waveNumber > 50 ? 3 : 5;
        for (let i = 0; i < bossParticleCount; i++) {
          const particle = this.add.circle(
            enemy.x + Phaser.Math.Between(-50, 50),
            enemy.y + Phaser.Math.Between(-50, 50),
            Phaser.Math.Between(5, 15),
            enemy.bossColor
          );
          this.tweens.add({
            targets: particle,
            x: particle.x + Phaser.Math.Between(-100, 100),
            y: particle.y + Phaser.Math.Between(-100, 100),
            alpha: 0,
            scale: 0,
            duration: 800,
            onComplete: () => particle.destroy()
          });
        }
      } else {
        // Normal enemy death sound
        Audio.playEnemyDeath();

        // Chance to drop weapon (10% base, higher for stronger enemies)
        const dropChance = enemy.enemyType === 'bug' ? 0.08 :
                           enemy.enemyType === 'glitch' ? 0.15 : 0.25;
        if (Math.random() < dropChance) {
          this.spawnWeaponDrop(enemy.x, enemy.y);
        }

        // Normal death effect
        this.cameras.main.shake(100, 0.005);

        // Particle burst (simple)
        const particleColors = {
          'bug': 0x00ff00,
          'glitch': 0xff00ff,
          'memory-leak': 0xaa00ff,
          'syntax-error': 0xff6600,
          'infinite-loop': 0x00ffff,
          'race-condition': 0xffff00,
          'miniboss-deadlock': 0xff6600
        };
        const particleCount = this.waveNumber > 50 ? 3 : 5;
        for (let i = 0; i < particleCount; i++) {
          const particle = this.add.circle(
            enemy.x + Phaser.Math.Between(-20, 20),
            enemy.y + Phaser.Math.Between(-20, 20),
            Phaser.Math.Between(3, 8),
            particleColors[enemy.enemyType] || 0x00ff00
          );
          this.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => particle.destroy()
          });
        }
      }

      enemy.destroy();
      this.updateHUD();
    }
  }

  playerHit(player, enemy) {
    // Invincibility frames - can't get hit while flashing
    if (this.invincible) return;

    // Take damage
    player.health -= enemy.damage;

    // Vampiric enemies heal 10% of damage dealt
    if (this.modifierEffects?.vampiricEnemies && enemy.active) {
      const healAmount = Math.floor(enemy.damage * 0.1);
      enemy.health = Math.min(enemy.health + healAmount, enemy.maxHealth || enemy.health);
      // Show heal effect
      const healText = this.add.text(enemy.x, enemy.y - 20, `+${healAmount}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#00ff00'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: healText,
        y: enemy.y - 40,
        alpha: 0,
        duration: 800,
        onComplete: () => healText.destroy()
      });
    }

    // Play damage sound
    Audio.playPlayerHit();

    // Become invincible for a bit
    this.invincible = true;

    // Flash red/white cycle to show i-frames (stored on this for cleanup)
    if (this.iFrameFlashTimer) this.iFrameFlashTimer.destroy();
    let flashCount = 0;
    this.iFrameFlashTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        flashCount++;
        player.setAlpha(flashCount % 2 === 0 ? 1 : 0.3);
        if (flashCount >= 10) {
          player.setAlpha(1);
          this.invincible = false;
          this.iFrameFlashTimer = null;
        }
      },
      repeat: 9
    });

    // Screen shake
    this.cameras.main.shake(100, 0.01);

    // Knockback enemy
    const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
    enemy.x += Math.cos(angle) * 50;
    enemy.y += Math.sin(angle) * 50;

    this.updateHUD();

    // Check death
    if (player.health <= 0) {
      this.invincible = false;
      this.playerDeath();
    }
  }

  playerDeath() {
    const state = window.VIBE_CODER;
    const settings = window.VIBE_SETTINGS;

    // Check for Immortal Mode - respawn without full reset
    if (settings.immortalMode) {
      this.immortalModeRespawn();
      return;
    }

    // Save high score before reset
    const isNewHighWave = this.waveNumber > this.highWave;
    const isNewHighScore = state.totalXP > this.highScore;

    if (isNewHighWave) {
      this.highWave = this.waveNumber;
      localStorage.setItem('vibeCoderHighWave', this.highWave.toString());
    }
    if (isNewHighScore) {
      this.highScore = state.totalXP;
      localStorage.setItem('vibeCoderHighScore', this.highScore.toString());
    }

    // Award currency (BITS) based on performance
    const waveBits = this.waveNumber * 5; // 5 bits per wave
    const killBits = Math.floor(state.kills * 0.5); // 0.5 bits per kill
    const xpBits = Math.floor(state.totalXP * 0.01); // 1 bit per 100 XP
    const totalBits = waveBits + killBits + xpBits;

    window.VIBE_UPGRADES.addCurrency(totalBits);

    // Show bits earned (fixed to camera center)
    const bitsText = this.add.text(400, 200, `+${totalBits} BITS EARNED!`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: bitsText,
      y: bitsText.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => bitsText.destroy()
    });

    // Game over - respawn
    this.cameras.main.fade(500, 0, 0, 0);

    this.time.delayedCall(500, () => {
      // Reset player to world center
      this.player.health = this.player.maxHealth;
      this.player.x = this.worldWidth / 2;
      this.player.y = this.worldHeight / 2;

      // Clear enemies
      this.enemies.clear(true, true);

      // Reset wave
      this.waveNumber = 1;
      this.currentStage = 0;
      this.createBackground();

      // Reset collected weapons
      this.collectedWeapons = new Set(['basic']);
      this.currentWeapon = { type: 'basic', duration: Infinity };
      this.clearOrbitals();

      // Clear saved run (player died, starting fresh)
      SaveManager.clearSave();

      // Fade back in
      this.cameras.main.fadeIn(500);

      // Show respawn text with high score info
      let respawnMessage = 'RESPAWNED';
      if (isNewHighWave) {
        respawnMessage = `NEW HIGH WAVE: ${this.highWave}!\nRESPAWNED`;
      }

      const respawnText = this.add.text(400, 300, respawnMessage, {
        fontFamily: 'monospace',
        fontSize: isNewHighWave ? '28px' : '32px',
        color: isNewHighWave ? '#ffd700' : '#00ffff',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: respawnText,
        alpha: 0,
        duration: 2000,
        onComplete: () => respawnText.destroy()
      });

      // Restart spawning
      this.startWave();
      this.updateHUD();
    });
  }

  /**
   * Immortal Mode respawn - continue wave with XP penalty
   */
  immortalModeRespawn() {
    const state = window.VIBE_CODER;
    const settings = window.VIBE_SETTINGS;

    // Apply XP penalty
    const xpLost = Math.floor(state.xp * settings.xpPenaltyOnDeath);
    state.xp = Math.max(0, state.xp - xpLost);

    // Show XP penalty
    const penaltyText = this.add.text(400, 200, `-${xpLost} XP LOST`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: penaltyText,
      y: penaltyText.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => penaltyText.destroy()
    });

    // Brief fade effect
    this.cameras.main.fade(300, 0, 0, 0);

    this.time.delayedCall(300, () => {
      // Respawn at 50% health
      this.player.health = Math.floor(this.player.maxHealth * 0.5);
      this.player.x = this.worldWidth / 2;
      this.player.y = this.worldHeight / 2;
      this.player.clearTint();

      // Push nearby enemies away (don't kill them)
      this.enemies.children.each((enemy) => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist < 200) {
          // Push enemy away
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          enemy.x += Math.cos(angle) * 200;
          enemy.y += Math.sin(angle) * 200;
        }
      });

      // Cancel any stale i-frame flash timer from playerHit() to prevent it
      // from overwriting respawn invincibility
      if (this.iFrameFlashTimer) {
        this.iFrameFlashTimer.destroy();
        this.iFrameFlashTimer = null;
      }

      // Brief invincibility
      this.invincible = true;
      this.player.setAlpha(0.5);
      this.time.delayedCall(2000, () => {
        this.invincible = false;
        this.player.setAlpha(1);
      });

      // Fade back in
      this.cameras.main.fadeIn(300);

      // Show immortal respawn message
      const respawnText = this.add.text(400, 300, '♾️ IMMORTAL RESPAWN', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#88ff88',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5).setScrollFactor(0);

      this.tweens.add({
        targets: respawnText,
        alpha: 0,
        duration: 2000,
        onComplete: () => respawnText.destroy()
      });

      this.updateHUD();
    });
  }

  update() {
    if (!this.player || !this.player.active) return;

    // Handle movement
    const stats = this.getStats();
    let vx = 0;
    let vy = 0;

    // Check for manual input first
    const manualLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const manualRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const manualUp = this.cursors.up.isDown || this.wasd.up.isDown;
    const manualDown = this.cursors.down.isDown || this.wasd.down.isDown;
    const hasManualInput = manualLeft || manualRight || manualUp || manualDown;

    if (hasManualInput) {
      // Manual input takes priority
      if (manualLeft) vx = -1;
      if (manualRight) vx = 1;
      if (manualUp) vy = -1;
      if (manualDown) vy = 1;
    } else if (window.VIBE_SETTINGS.autoMove && window.VIBE_CODER.isCodingActive()) {
      // Auto-move: find safest direction (away from enemies)
      const autoMove = this.calculateAutoMove();
      vx = autoMove.x;
      vy = autoMove.y;
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx * stats.speed, vy * stats.speed);

    // Update speech bubble position to follow player
    if (this.speechBubble && this.speechBubble.visible) {
      const bubbleX = this.player.x;
      const bubbleY = this.player.y - 40;
      this.speechBubble.clear();
      this.speechBubble.fillStyle(0xffffff, 0.9);
      this.speechBubble.lineStyle(2, 0x00ffff, 1);
      this.speechBubble.fillRoundedRect(bubbleX - 65, bubbleY - 18, 130, 36, 6);
      this.speechBubble.strokeRoundedRect(bubbleX - 65, bubbleY - 18, 130, 36, 6);
      this.speechText.setPosition(bubbleX, bubbleY);
    }

    // Update auto-move indicator position and mode emoji
    if (this.autoMoveIndicator) {
      this.autoMoveIndicator.setPosition(this.player.x + 20, this.player.y - 30);
      const isAutoMoving = !hasManualInput && window.VIBE_SETTINGS?.autoMove && window.VIBE_CODER?.isCodingActive();
      this.autoMoveIndicator.setVisible(isAutoMoving);
      // Update emoji based on mode
      if (isAutoMoving) {
        if (this.autoPlayMode === 'hunt') this.autoMoveIndicator.setText('⚔️');
        else if (this.autoPlayMode === 'evade') this.autoMoveIndicator.setText('🛡️');
        else this.autoMoveIndicator.setText('😴');
      }
    }

    // Play appropriate animation based on movement
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      // Determine primary direction
      if (Math.abs(vx) > Math.abs(vy)) {
        // Moving horizontally - use side walk animation
        this.player.play('player-walk-side', true);
        this.player.setFlipX(vx < 0);
      } else if (vy < 0) {
        // Moving up
        this.player.play('player-walk-up', true);
      } else {
        // Moving down
        this.player.play('player-walk-down', true);
      }
    } else {
      // Idle animation
      this.player.play('player-idle', true);
    }

    // Move enemies toward player with unique behaviors
    const cam = this.cameras.main;
    const cullMargin = 100; // Extra margin beyond camera view

    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;

      const angle = Phaser.Math.Angle.Between(
        enemy.x, enemy.y,
        this.player.x, this.player.y
      );

      const dist = Phaser.Math.Distance.Between(
        enemy.x, enemy.y,
        this.player.x, this.player.y
      );

      // Performance culling: off-screen enemies use simplified movement
      const isOnScreen = enemy.x > cam.scrollX - cullMargin &&
                         enemy.x < cam.scrollX + cam.width + cullMargin &&
                         enemy.y > cam.scrollY - cullMargin &&
                         enemy.y < cam.scrollY + cam.height + cullMargin;

      if (!isOnScreen) {
        // Off-screen: simplified movement at 50% speed toward player
        enemy.setVelocity(
          Math.cos(angle) * enemy.speed * 0.5,
          Math.sin(angle) * enemy.speed * 0.5
        );
        return; // Skip complex AI behaviors
      }

      // Handle different enemy behaviors (only for on-screen enemies)
      switch (enemy.behavior) {
        case 'teleport':
          // Syntax Error: teleports short distances periodically
          if (this.time.now - enemy.lastTeleport > enemy.teleportCooldown && dist < 250) {
            enemy.lastTeleport = this.time.now;
            // Teleport closer to player
            const teleportDist = Phaser.Math.Between(40, 80);
            enemy.x += Math.cos(angle) * teleportDist;
            enemy.y += Math.sin(angle) * teleportDist;
            // Teleport visual effect
            const flash = this.add.circle(enemy.x, enemy.y, 20, 0xff6600, 0.5);
            this.tweens.add({
              targets: flash,
              alpha: 0,
              scale: 2,
              duration: 200,
              onComplete: () => flash.destroy()
            });
          }
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'orbit':
          // Infinite Loop: circles around the player
          enemy.orbitAngle += 0.02 * enemy.orbitDirection;
          const targetX = this.player.x + Math.cos(enemy.orbitAngle) * enemy.orbitRadius;
          const targetY = this.player.y + Math.sin(enemy.orbitAngle) * enemy.orbitRadius;
          const orbitAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
          enemy.setVelocity(
            Math.cos(orbitAngle) * enemy.speed,
            Math.sin(orbitAngle) * enemy.speed
          );
          break;

        case 'erratic':
          // Race Condition: erratic speed changes
          if (this.time.now > enemy.nextSpeedChange) {
            enemy.currentSpeedMod = Phaser.Math.FloatBetween(0.3, 2.5);
            enemy.nextSpeedChange = this.time.now + Phaser.Math.Between(300, 1000);
            // Random direction offset
            enemy.erraticOffset = Phaser.Math.FloatBetween(-0.5, 0.5);
          }
          const erraticAngle = angle + (enemy.erraticOffset || 0);
          enemy.setVelocity(
            Math.cos(erraticAngle) * enemy.speed * enemy.currentSpeedMod,
            Math.sin(erraticAngle) * enemy.speed * enemy.currentSpeedMod
          );
          break;

        // ========== NEW ENEMY BEHAVIORS ==========

        case 'deathzone':
          // SEGFAULT: Static death zone, despawns after lifespan
          enemy.setVelocity(0, 0);
          if (this.time.now - enemy.spawnTime > enemy.lifespan) {
            // Despawn with fade effect
            this.tweens.add({
              targets: enemy,
              alpha: 0,
              duration: 300,
              onComplete: () => enemy.destroy()
            });
          }
          break;

        case 'spawner':
          // DEPENDENCY HELL: Spawns minion bugs periodically
          // === FREEZE BUG FIX: Respect global MAX_ENEMIES cap ===
          const MAX_ENEMIES = 30;
          const canSpawnMinion = this.time.now - enemy.lastSpawn > enemy.spawnInterval &&
                                  enemy.minionCount < enemy.maxMinions &&
                                  this.enemies.countActive() < MAX_ENEMIES;
          if (canSpawnMinion) {
            enemy.lastSpawn = this.time.now;
            enemy.minionCount++;
            // Spawn a bug minion nearby
            const minionAngle = Math.random() * Math.PI * 2;
            const minionX = enemy.x + Math.cos(minionAngle) * 30;
            const minionY = enemy.y + Math.sin(minionAngle) * 30;
            const minion = this.enemies.create(minionX, minionY, 'bug');
            minion.health = 8;
            minion.speed = 50;
            minion.damage = 2;
            minion.xpValue = 3;
            minion.enemyType = 'bug';
            minion.behavior = 'chase';
            minion.setTint(0x6622aa); // Tinted to match parent
            minion.play('bug-walk');
            // Spawn effect
            const spawnFlash = this.add.circle(minionX, minionY, 15, 0x6622aa, 0.6);
            this.tweens.add({
              targets: spawnFlash,
              alpha: 0,
              scale: 2,
              duration: 300,
              onComplete: () => spawnFlash.destroy()
            });
          }
          // Slow chase
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'grow':
          // STACK OVERFLOW: Grows taller over time, harder to hit
          enemy.currentScale += enemy.growRate;
          enemy.setScale(1, enemy.currentScale);
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'fake':
          // HALLUCINATION: Looks like enemy but does 0 damage, semi-transparent
          // Just chase, damage is 0 in type definition
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'growDamage':
          // TOKEN OVERFLOW: Grows larger, damage scales with size
          enemy.currentScale += enemy.growRate;
          enemy.setScale(enemy.currentScale);
          // Damage increases as it grows
          enemy.damage = Math.floor(5 * enemy.currentScale);
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'contextLoss':
          // CONTEXT LOSS: Teleports every 2.5s, 30% chance to wander aimlessly
          if (this.time.now - enemy.lastTeleport > enemy.teleportCooldown) {
            enemy.lastTeleport = this.time.now;
            // Teleport to random nearby location
            const teleportDist = Phaser.Math.Between(80, 150);
            const randomAngle = Math.random() * Math.PI * 2;
            enemy.x = Phaser.Math.Clamp(enemy.x + Math.cos(randomAngle) * teleportDist, 50, this.worldWidth - 50);
            enemy.y = Phaser.Math.Clamp(enemy.y + Math.sin(randomAngle) * teleportDist, 50, this.worldHeight - 50);
            // Teleport effect
            const ctxFlash = this.add.circle(enemy.x, enemy.y, 25, 0xaa44aa, 0.5);
            this.tweens.add({
              targets: ctxFlash,
              alpha: 0,
              scale: 2,
              duration: 300,
              onComplete: () => ctxFlash.destroy()
            });
            // 30% chance to start wandering aimlessly
            enemy.isWandering = Math.random() < enemy.wanderChance;
            if (enemy.isWandering) {
              enemy.wanderAngle = Math.random() * Math.PI * 2;
            }
          }
          if (enemy.isWandering) {
            // Wander in random direction
            enemy.setVelocity(
              Math.cos(enemy.wanderAngle) * enemy.speed * 0.5,
              Math.sin(enemy.wanderAngle) * enemy.speed * 0.5
            );
          } else {
            // Chase player
            enemy.setVelocity(
              Math.cos(angle) * enemy.speed,
              Math.sin(angle) * enemy.speed
            );
          }
          break;

        case 'hijack':
          // PROMPT INJECTION: Hijacks nearby enemies to attack each other
          if (this.time.now - enemy.lastHijack > enemy.hijackCooldown) {
            enemy.lastHijack = this.time.now;
            // Find nearby enemies to hijack
            const hijackRadius = 150;
            let hijackedCount = 0;
            this.enemies.children.each((otherEnemy) => {
              if (!otherEnemy.active || otherEnemy === enemy || hijackedCount >= 3) return;
              const hijackDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, otherEnemy.x, otherEnemy.y);
              if (hijackDist < hijackRadius && !otherEnemy.isHijacked) {
                hijackedCount++;
                otherEnemy.isHijacked = true;
                otherEnemy.hijackEndTime = this.time.now + enemy.hijackDuration;
                otherEnemy.setTint(0xff00ff); // Purple tint to show hijacked
                // Hijack visual
                const hijackLine = this.add.line(0, 0, enemy.x, enemy.y, otherEnemy.x, otherEnemy.y, 0xff00ff, 0.6);
                this.tweens.add({
                  targets: hijackLine,
                  alpha: 0,
                  duration: 500,
                  onComplete: () => hijackLine.destroy()
                });
              }
            });
            if (hijackedCount > 0) {
              // Hijack announcement
              const hijackText = this.add.text(enemy.x, enemy.y - 30, 'HIJACKED!', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#ff00ff',
                fontStyle: 'bold'
              }).setOrigin(0.5);
              this.tweens.add({
                targets: hijackText,
                y: hijackText.y - 20,
                alpha: 0,
                duration: 1000,
                onComplete: () => hijackText.destroy()
              });
            }
          }
          // Chase player
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'invisible':
          // 404 NOT FOUND: Only visible when close to player
          const visibilityDist = 100;
          enemy.setAlpha(dist < visibilityDist ? 1 : 0.1);
          // Chase normally
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'blocker':
          // CORS ERROR: Stationary damage zone that despawns
          enemy.setVelocity(0, 0);
          // Check if expired
          if (this.time.now - enemy.spawnTime > enemy.blockDuration) {
            enemy.destroy();
          }
          break;

        case 'morph':
          // TYPE ERROR: Changes tint/appearance periodically
          if (this.time.now > enemy.nextMorph) {
            enemy.nextMorph = this.time.now + enemy.morphInterval;
            // Random tint to simulate "type change"
            const morphTints = [0xff00ff, 0x00ffff, 0xffff00, 0xff8800, 0x88ff00];
            enemy.setTint(Phaser.Utils.Array.GetRandom(morphTints));
            // Briefly change speed too
            enemy.speed = Phaser.Math.Between(30, 80);
          }
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'split':
          // GIT CONFLICT: Normal chase, splits on death (handled in hitEnemy)
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'predict':
          // OVERFITTING: Predicts where player is going
          const playerVelX = this.player.x - enemy.playerLastX;
          const playerVelY = this.player.y - enemy.playerLastY;
          enemy.playerLastX = this.player.x;
          enemy.playerLastY = this.player.y;
          // Predict future position
          const predictionFactor = 15;
          const predictX = this.player.x + playerVelX * predictionFactor;
          const predictY = this.player.y + playerVelY * predictionFactor;
          const predictAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, predictX, predictY);
          enemy.setVelocity(
            Math.cos(predictAngle) * enemy.speed,
            Math.sin(predictAngle) * enemy.speed
          );
          break;

        case 'clone':
          // MODE COLLAPSE: Converts nearby enemies to clones
          if (this.time.now - enemy.lastClone > enemy.cloneCooldown) {
            enemy.lastClone = this.time.now;
            // Find nearby non-clone enemies
            this.enemies.children.each((otherEnemy) => {
              if (!otherEnemy.active || otherEnemy === enemy) return;
              if (otherEnemy.behavior === 'clone') return; // Don't convert clones
              const cloneDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, otherEnemy.x, otherEnemy.y);
              if (cloneDist < enemy.cloneRadius) {
                // Convert to mode-collapse behavior
                otherEnemy.setTint(0x8800ff);
                otherEnemy.behavior = 'clone';
                otherEnemy.lastClone = this.time.now;
                otherEnemy.cloneCooldown = 10000; // Converted clones are slower
                otherEnemy.cloneRadius = 80;
                // Show effect
                const cloneText = this.add.text(otherEnemy.x, otherEnemy.y - 20, 'COLLAPSED!', {
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: '#aa00ff'
                }).setOrigin(0.5);
                this.tweens.add({
                  targets: cloneText,
                  y: cloneText.y - 15,
                  alpha: 0,
                  duration: 800,
                  onComplete: () => cloneText.destroy()
                });
              }
            });
          }
          // Chase player
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;

        case 'chase':
        default:
          // Standard chase behavior
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
          break;
      }

      // Handle hijacked enemies (from Prompt Injection)
      if (enemy.isHijacked) {
        // Check if hijack has expired
        if (this.time.now > enemy.hijackEndTime) {
          enemy.isHijacked = false;
          enemy.clearTint();
        } else {
          // Find nearest other enemy to attack
          let nearestEnemy = null;
          let nearestDist = Infinity;
          this.enemies.children.each((otherEnemy) => {
            if (!otherEnemy.active || otherEnemy === enemy || otherEnemy.isHijacked) return;
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, otherEnemy.x, otherEnemy.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = otherEnemy;
            }
          });

          if (nearestEnemy) {
            // Move toward and attack other enemy
            const attackAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, nearestEnemy.x, nearestEnemy.y);
            enemy.setVelocity(
              Math.cos(attackAngle) * enemy.speed * 1.2,
              Math.sin(attackAngle) * enemy.speed * 1.2
            );
            // Damage other enemy if close enough
            if (nearestDist < 30) {
              nearestEnemy.health -= enemy.damage * 0.5;
              if (nearestEnemy.health <= 0) {
                nearestEnemy.destroy();
              }
            }
          }
        }
      }
    });

    // Update homing projectiles
    this.updateHomingProjectiles();

    // Auto attack
    this.autoAttack();

    // Update orbital weapons
    this.updateOrbitals();

    // Update legendary weapons (permanent spinning melee)
    this.updateLegendaryWeapons();

    // Update EventManager (timer bar, event effects)
    if (this.eventManager) {
      this.eventManager.update(this.time.now, 0);
    }

    // Update ShrineManager (proximity checks)
    if (this.shrineManager) {
      this.shrineManager.update(this.time.now, 0);
    }
  }

  updateHomingProjectiles() {
    this.projectiles.children.each((projectile) => {
      if (!projectile.active || !projectile.isHoming) return;

      // Find nearest enemy to home in on
      let target = projectile.homingTarget;

      // If target is dead, find new one
      if (!target || !target.active) {
        let nearestDist = Infinity;
        this.enemies.children.each((enemy) => {
          if (!enemy.active) return;
          const dist = Phaser.Math.Distance.Between(
            projectile.x, projectile.y,
            enemy.x, enemy.y
          );
          if (dist < nearestDist) {
            nearestDist = dist;
            target = enemy;
          }
        });
        projectile.homingTarget = target;
      }

      if (target && target.active) {
        // Gradually turn toward target
        const targetAngle = Phaser.Math.Angle.Between(
          projectile.x, projectile.y,
          target.x, target.y
        );

        const currentAngle = Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x);
        const turnSpeed = 0.08;

        // Interpolate angle
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const newAngle = currentAngle + angleDiff * turnSpeed;
        const speed = 350;

        projectile.setVelocity(
          Math.cos(newAngle) * speed,
          Math.sin(newAngle) * speed
        );
        projectile.setRotation(newAngle);
      }
    });
  }
}
