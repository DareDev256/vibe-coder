/**
 * ShrineManager - Interactive risk/reward objects on the map
 * Spawns shrines that players can interact with for buffs/effects
 */
export default class ShrineManager {
  constructor(scene) {
    this.scene = scene;
    this.shrines = [];
    this.activeBuffs = {};
    this.interactKey = null;
    this.nearbyShrine = null;
    this.interactPrompt = null;
    this.shrinesPerMap = 2;
    this.interactRadius = 60;
  }

  // Shrine definitions
  static SHRINES = {
    POWER: {
      id: 'power',
      name: 'SHRINE OF POWER',
      desc: '+50% damage for 30s',
      icon: '⚔️',
      color: 0xff4400,
      cost: { type: 'health', amount: 0.25 }, // 25% HP
      effect: {
        type: 'buff',
        buff: 'damage',
        multiplier: 1.5,
        duration: 30000
      }
    },
    GAMBLE: {
      id: 'gamble',
      name: 'SHRINE OF FORTUNE',
      desc: 'Random outcome...',
      icon: '🎲',
      color: 0xffd700,
      cost: { type: 'free' },
      effect: {
        type: 'random'
      }
    },
    XP: {
      id: 'xp',
      name: 'SHRINE OF WISDOM',
      desc: 'Instant level up',
      icon: '📚',
      color: 0x00ff88,
      cost: { type: 'xp', amount: 500 },
      effect: {
        type: 'levelup'
      }
    },
    SHIELD: {
      id: 'shield',
      name: 'SHRINE OF PROTECTION',
      desc: '10s invincibility',
      icon: '🛡️',
      color: 0x4488ff,
      cost: { type: 'weapon' }, // Lose current weapon
      effect: {
        type: 'invincibility',
        duration: 10000
      }
    },
    CHAOS: {
      id: 'chaos',
      name: 'SHRINE OF CHAOS',
      desc: 'Unknown random effect',
      icon: '🌀',
      color: 0xff00ff,
      cost: { type: 'health', amount: 0.10 }, // 10% HP
      effect: {
        type: 'chaos'
      }
    }
  };

  // Random outcomes for GAMBLE shrine
  static GAMBLE_OUTCOMES = [
    { name: 'JACKPOT', weight: 10, effect: 'jackpot_xp' },
    { name: 'WEAPON DROP', weight: 20, effect: 'weapon_drop' },
    { name: 'FULL HEAL', weight: 15, effect: 'full_heal' },
    { name: 'CURSE', weight: 25, effect: 'curse' },
    { name: 'NOTHING', weight: 30, effect: 'nothing' }
  ];

  // Random effects for CHAOS shrine
  static CHAOS_EFFECTS = [
    { name: 'DOUBLE XP', effect: 'double_xp' },
    { name: 'SPEED BOOST', effect: 'speed_boost' },
    { name: 'INVINCIBILITY', effect: 'invincibility' },
    { name: 'ENEMY FREEZE', effect: 'freeze_enemies' },
    { name: 'RANDOM CURSE', effect: 'random_curse' },
    { name: 'SPAWN BOSS', effect: 'spawn_boss' }
  ];

  /**
   * Initialize the shrine system
   */
  init() {
    // Setup E key for interaction
    this.interactKey = this.scene.input.keyboard.addKey('E');
    this.interactKey.on('down', () => this.tryInteract());

    // Create interaction prompt (hidden initially)
    this.createInteractPrompt();
  }

  /**
   * Create the [E] interaction prompt
   */
  createInteractPrompt() {
    this.interactPrompt = this.scene.add.container(0, 0);
    this.interactPrompt.setDepth(100);
    this.interactPrompt.setVisible(false);

    const bg = this.scene.add.rectangle(0, 0, 120, 30, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0xffffff);

    const text = this.scene.add.text(0, 0, '[E] INTERACT', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.interactPrompt.add([bg, text]);

    // Pulse animation — store reference for cleanup in destroy()
    this.promptPulseTween = this.scene.tweens.add({
      targets: this.interactPrompt,
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Spawn shrines on the map
   */
  spawnShrines() {
    this.clearShrines();

    const shrineTypes = Object.values(ShrineManager.SHRINES);
    const availableTypes = [...shrineTypes];
    const worldWidth = this.scene.worldWidth;
    const worldHeight = this.scene.worldHeight;
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;
    const safeRadius = 400; // Keep away from spawn

    for (let i = 0; i < this.shrinesPerMap && availableTypes.length > 0; i++) {
      // Pick random shrine type
      const index = Math.floor(Math.random() * availableTypes.length);
      const shrineType = availableTypes.splice(index, 1)[0];

      // Find valid position
      const pos = this.getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius);
      if (pos) {
        this.createShrine(pos.x, pos.y, shrineType);
      }
    }

    console.log(`Spawned ${this.shrines.length} shrines`);
  }

  /**
   * Get random position avoiding safe zone
   */
  getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius) {
    const margin = 150;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const x = Phaser.Math.Between(margin, worldWidth - margin);
      const y = Phaser.Math.Between(margin, worldHeight - margin);

      // Check if outside safe zone
      const dist = Phaser.Math.Distance.Between(x, y, centerX, centerY);
      if (dist > safeRadius) {
        // Also check distance from other shrines
        let tooClose = false;
        this.shrines.forEach(shrine => {
          const shrineDist = Phaser.Math.Distance.Between(x, y, shrine.x, shrine.y);
          if (shrineDist < 300) tooClose = true;
        });

        if (!tooClose) {
          return { x, y };
        }
      }
      attempts++;
    }

    return null;
  }

  /**
   * Create a shrine at position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} shrineType - Shrine definition
   */
  createShrine(x, y, shrineType) {
    // Container for all shrine elements
    const container = this.scene.add.container(x, y);
    container.shrineType = shrineType;
    container.isUsed = false;

    // Base pedestal
    const pedestal = this.scene.add.rectangle(0, 20, 60, 20, 0x333333, 0.9);
    pedestal.setStrokeStyle(2, shrineType.color);

    // Glowing orb
    const orb = this.scene.add.circle(0, -10, 25, shrineType.color, 0.6);
    orb.setStrokeStyle(3, 0xffffff, 0.8);

    // Icon text
    const icon = this.scene.add.text(0, -12, shrineType.icon, {
      fontSize: '24px'
    }).setOrigin(0.5);

    // Name label
    const label = this.scene.add.text(0, 45, shrineType.name, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([pedestal, orb, icon, label]);
    container.orb = orb;

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: orb,
      scale: { from: 0.9, to: 1.2 },
      alpha: { from: 0.4, to: 0.8 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Floating animation
    this.scene.tweens.add({
      targets: [orb, icon],
      y: '-=5',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.shrines.push(container);
    return container;
  }

  /**
   * Update loop - check for nearby shrines
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    if (!this.scene.player) return;

    const px = this.scene.player.x;
    const py = this.scene.player.y;

    // Find closest usable shrine
    let closestShrine = null;
    let closestDist = Infinity;

    this.shrines.forEach(shrine => {
      if (shrine.isUsed) return;

      const dist = Phaser.Math.Distance.Between(px, py, shrine.x, shrine.y);
      if (dist < this.interactRadius && dist < closestDist) {
        closestDist = dist;
        closestShrine = shrine;
      }
    });

    // Update prompt visibility and position
    if (closestShrine) {
      this.nearbyShrine = closestShrine;
      this.interactPrompt.setVisible(true);
      this.interactPrompt.x = closestShrine.x;
      this.interactPrompt.y = closestShrine.y - 60;
    } else {
      this.nearbyShrine = null;
      this.interactPrompt.setVisible(false);
    }

    // Update active buff timers
    this.updateBuffs(time);
  }

  /**
   * Try to interact with nearby shrine
   */
  tryInteract() {
    if (!this.nearbyShrine || this.nearbyShrine.isUsed) return;

    const shrine = this.nearbyShrine;
    const shrineType = shrine.shrineType;

    // Check if player can pay the cost
    if (!this.canPayCost(shrineType.cost)) {
      this.showMessage('Cannot pay cost!', shrine.x, shrine.y, '#ff0000');
      return;
    }

    // Pay the cost
    this.payCost(shrineType.cost);

    // Apply the effect
    this.applyEffect(shrineType, shrine);

    // Mark shrine as used
    shrine.isUsed = true;

    // Visual feedback - fade out shrine
    this.scene.tweens.add({
      targets: shrine,
      alpha: 0.3,
      scale: 0.8,
      duration: 500
    });

    // Dim the orb
    if (shrine.orb) {
      shrine.orb.setFillStyle(0x333333, 0.3);
    }
  }

  /**
   * Check if player can pay shrine cost
   * @param {object} cost - Cost object
   * @returns {boolean}
   */
  canPayCost(cost) {
    if (!cost || cost.type === 'free') return true;

    const player = this.scene.player;
    const vibeState = window.VIBE_CODER;

    switch (cost.type) {
      case 'health':
        return player.health > player.maxHealth * cost.amount;
      case 'xp':
        return vibeState.totalXP >= cost.amount;
      case 'weapon':
        return this.scene.currentWeapon && this.scene.currentWeapon.type !== 'basic';
      default:
        return true;
    }
  }

  /**
   * Pay shrine cost
   * @param {object} cost - Cost object
   */
  payCost(cost) {
    if (!cost || cost.type === 'free') return;

    const player = this.scene.player;
    const vibeState = window.VIBE_CODER;

    switch (cost.type) {
      case 'health':
        player.health -= Math.floor(player.maxHealth * cost.amount);
        this.scene.updateHUD();
        break;
      case 'xp':
        vibeState.totalXP -= cost.amount;
        break;
      case 'weapon':
        this.scene.currentWeapon = { type: 'basic' };
        break;
    }
  }

  /**
   * Apply shrine effect
   * @param {object} shrineType - Shrine definition
   * @param {object} shrine - Shrine container
   */
  applyEffect(shrineType, shrine) {
    const effect = shrineType.effect;

    switch (effect.type) {
      case 'buff':
        this.applyBuff(effect.buff, effect.multiplier, effect.duration, shrine);
        break;
      case 'random':
        this.applyGambleEffect(shrine);
        break;
      case 'levelup':
        this.applyLevelUp(shrine);
        break;
      case 'invincibility':
        this.applyInvincibility(effect.duration, shrine);
        break;
      case 'chaos':
        this.applyChaosEffect(shrine);
        break;
    }
  }

  /**
   * Apply a timed buff
   */
  applyBuff(buffType, multiplier, duration, shrine) {
    const endTime = this.scene.time.now + duration;

    this.activeBuffs[buffType] = {
      multiplier,
      endTime
    };

    this.showMessage(`+${Math.round((multiplier - 1) * 100)}% ${buffType.toUpperCase()}!`, shrine.x, shrine.y, '#00ff00');

    // Apply to scene
    if (buffType === 'damage') {
      this.scene.shrineDamageBuff = multiplier;
    }
  }

  /**
   * Apply gamble shrine effect
   */
  applyGambleEffect(shrine) {
    // Weighted random selection
    const totalWeight = ShrineManager.GAMBLE_OUTCOMES.reduce((sum, o) => sum + o.weight, 0);
    let roll = Math.random() * totalWeight;
    let outcome = ShrineManager.GAMBLE_OUTCOMES[0];

    for (const o of ShrineManager.GAMBLE_OUTCOMES) {
      roll -= o.weight;
      if (roll <= 0) {
        outcome = o;
        break;
      }
    }

    // Show dramatic reveal
    this.showMessage(`🎲 ${outcome.name}!`, shrine.x, shrine.y, '#ffd700');

    // Apply outcome
    switch (outcome.effect) {
      case 'jackpot_xp':
        window.VIBE_CODER.addXP(500);
        break;
      case 'weapon_drop':
        this.scene.spawnWeaponDrop(shrine.x, shrine.y, true);
        break;
      case 'full_heal':
        this.scene.player.health = this.scene.player.maxHealth;
        this.scene.updateHUD();
        break;
      case 'curse':
        // Spawn extra enemies
        for (let i = 0; i < 10; i++) {
          this.scene.time.delayedCall(i * 200, () => this.scene.spawnEnemy());
        }
        break;
      case 'nothing':
        // Just the message
        break;
    }
  }

  /**
   * Apply level up effect
   */
  applyLevelUp(shrine) {
    const vibeState = window.VIBE_CODER;
    vibeState.level++;
    vibeState.xp = 0;

    this.showMessage('LEVEL UP!', shrine.x, shrine.y, '#00ff88');

    // Show level up effects
    if (this.scene.showLevelUp) {
      this.scene.showLevelUp(vibeState.level);
    }
  }

  /**
   * Apply invincibility effect
   */
  applyInvincibility(duration, shrine) {
    this.scene.invincible = true;

    // Visual effect - golden glow
    const player = this.scene.player;
    player.setTint(0xffd700);

    this.showMessage('INVINCIBLE!', shrine.x, shrine.y, '#4488ff');

    // End invincibility after duration
    this.scene.time.delayedCall(duration, () => {
      this.scene.invincible = false;
      player.clearTint();
      this.showMessage('Protection ended', player.x, player.y - 40, '#888888');
    });
  }

  /**
   * Apply chaos shrine random effect
   */
  applyChaosEffect(shrine) {
    const effect = Phaser.Utils.Array.GetRandom(ShrineManager.CHAOS_EFFECTS);

    this.showMessage(`🌀 ${effect.name}!`, shrine.x, shrine.y, '#ff00ff');

    switch (effect.effect) {
      case 'double_xp':
        // Trigger via event manager if available
        if (this.scene.eventManager) {
          this.scene.eventManager.forceEvent('double_xp');
        }
        break;
      case 'speed_boost':
        this.scene.player.speed = (this.scene.player.speed || 200) * 1.5;
        this.scene.time.delayedCall(10000, () => {
          this.scene.player.speed = (this.scene.player.speed || 300) / 1.5;
        });
        break;
      case 'invincibility':
        this.applyInvincibility(5000, shrine);
        break;
      case 'freeze_enemies':
        this.freezeAllEnemies(5000);
        break;
      case 'random_curse':
        if (this.scene.eventManager) {
          this.scene.eventManager.forceEvent('curse');
        }
        break;
      case 'spawn_boss':
        if (this.scene.spawnMiniBoss) {
          this.scene.spawnMiniBoss();
        }
        break;
    }
  }

  /**
   * Freeze all enemies for duration
   */
  freezeAllEnemies(duration) {
    const frozenEnemies = [];

    this.scene.enemies.children.each(enemy => {
      if (!enemy.active) return;

      enemy.originalSpeed = enemy.speed;
      enemy.speed = 0;
      enemy.setTint(0x00ffff);
      frozenEnemies.push(enemy);
    });

    this.scene.time.delayedCall(duration, () => {
      frozenEnemies.forEach(enemy => {
        if (enemy.active) {
          enemy.speed = enemy.originalSpeed || 80;
          enemy.clearTint();
        }
      });
    });
  }

  /**
   * Update active buffs and remove expired ones
   */
  updateBuffs(time) {
    Object.keys(this.activeBuffs).forEach(buffType => {
      const buff = this.activeBuffs[buffType];
      if (time >= buff.endTime) {
        // Remove buff
        delete this.activeBuffs[buffType];

        // Reset scene values
        if (buffType === 'damage') {
          this.scene.shrineDamageBuff = 1;
        }

        this.showMessage(`${buffType.toUpperCase()} buff ended`, this.scene.player.x, this.scene.player.y - 40, '#888888');
      }
    });
  }

  /**
   * Show floating message at position
   */
  showMessage(text, x, y, color) {
    const message = this.scene.add.text(x, y - 30, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: message,
      y: y - 80,
      alpha: 0,
      duration: 2000,
      onComplete: () => message.destroy()
    });
  }

  /**
   * Clear all shrines
   */
  clearShrines() {
    this.shrines.forEach(shrine => shrine.destroy());
    this.shrines = [];
    this.nearbyShrine = null;
  }

  /**
   * Get current buff multiplier for a type
   * @param {string} buffType - Buff type (e.g., 'damage')
   * @returns {number} Multiplier (1 if no buff)
   */
  getBuffMultiplier(buffType) {
    if (this.activeBuffs[buffType]) {
      return this.activeBuffs[buffType].multiplier;
    }
    return 1;
  }

  /**
   * Clean up on scene shutdown
   */
  destroy() {
    this.clearShrines();
    if (this.promptPulseTween) {
      this.promptPulseTween.stop();
      this.promptPulseTween = null;
    }
    if (this.interactPrompt) {
      this.interactPrompt.destroy();
    }
    this.activeBuffs = {};
  }
}
