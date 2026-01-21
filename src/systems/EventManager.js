/**
 * EventManager - Mid-wave chaos events that add tension and variety
 * Instance class with update loop for timer-based events
 */
export default class EventManager {
  constructor(scene) {
    this.scene = scene;
    this.activeEvent = null;
    this.eventEndTime = 0;
    this.eventHUD = null;
    this.eventTimer = null;
    this.eventTriggerChance = 0.15; // 15% chance per wave
    this.minWaveForEvents = 5; // Events start after wave 5
  }

  // Event definitions
  static EVENTS = {
    BOSS_INCOMING: {
      id: 'boss_incoming',
      name: 'BOSS INCOMING',
      desc: 'Mini-boss spawns after countdown!',
      icon: '💀',
      color: 0xff0000,
      duration: 30000, // 30s countdown then spawn
      effects: {
        type: 'boss_spawn'
      }
    },
    DOUBLE_XP: {
      id: 'double_xp',
      name: 'DOUBLE XP',
      desc: '2x XP from all sources!',
      icon: '⭐',
      color: 0xffff00,
      duration: 20000,
      effects: {
        xpMultiplier: 2
      }
    },
    CURSE: {
      id: 'curse',
      name: 'CURSE',
      desc: 'All enemies +50% speed!',
      icon: '😈',
      color: 0x8800ff,
      duration: 60000,
      effects: {
        enemySpeedMod: 1.5
      }
    },
    JACKPOT: {
      id: 'jackpot',
      name: 'JACKPOT',
      desc: 'Only rare weapon drops!',
      icon: '🎰',
      color: 0xffd700,
      duration: 30000,
      effects: {
        forceRareDrops: true
      }
    },
    SWARM: {
      id: 'swarm',
      name: 'SWARM',
      desc: 'Rapid enemy spawn incoming!',
      icon: '🐛',
      color: 0x00ff00,
      duration: 15000,
      effects: {
        type: 'swarm'
      }
    }
  };

  /**
   * Try to trigger a random event (called at wave start)
   * @param {number} waveNumber - Current wave number
   * @returns {boolean} True if event triggered
   */
  tryTriggerEvent(waveNumber) {
    // Don't trigger if already in an event
    if (this.activeEvent) return false;

    // Check minimum wave requirement
    if (waveNumber < this.minWaveForEvents) return false;

    // Random chance
    if (Math.random() > this.eventTriggerChance) return false;

    // Select random event
    const eventKeys = Object.keys(EventManager.EVENTS);
    const selectedKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const event = EventManager.EVENTS[selectedKey];

    this.startEvent(event);
    return true;
  }

  /**
   * Start an event
   * @param {object} event - Event object from EVENTS
   */
  startEvent(event) {
    this.activeEvent = event;
    this.eventEndTime = this.scene.time.now + event.duration;

    // Apply immediate effects
    this.applyEventEffects(event);

    // Show event HUD
    this.showEventHUD(event);

    // Handle special event types
    if (event.effects.type === 'swarm') {
      this.triggerSwarm();
    }

    // Set up boss spawn for BOSS_INCOMING
    if (event.effects.type === 'boss_spawn') {
      this.scene.time.delayedCall(event.duration, () => {
        if (this.activeEvent && this.activeEvent.id === 'boss_incoming') {
          this.spawnEventBoss();
        }
      });
    }

    console.log(`Event started: ${event.name}`);
  }

  /**
   * Apply event effects to scene state
   * @param {object} event - Event object
   */
  applyEventEffects(event) {
    if (!event.effects) return;

    const effects = event.effects;

    // XP multiplier
    if (effects.xpMultiplier) {
      this.scene.xpEventMultiplier = effects.xpMultiplier;
    }

    // Enemy speed modifier
    if (effects.enemySpeedMod) {
      this.scene.eventEnemySpeedMod = effects.enemySpeedMod;
    }

    // Force rare drops
    if (effects.forceRareDrops) {
      this.scene.forceRareDrops = true;
    }
  }

  /**
   * Remove event effects from scene state
   */
  clearEventEffects() {
    this.scene.xpEventMultiplier = 1;
    this.scene.eventEnemySpeedMod = 1;
    this.scene.forceRareDrops = false;
  }

  /**
   * Trigger swarm event - rapid enemy spawning
   */
  triggerSwarm() {
    let spawned = 0;
    const toSpawn = 20;

    this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        if (spawned < toSpawn && this.activeEvent) {
          this.scene.spawnEnemy();
          spawned++;
        }
      },
      repeat: toSpawn - 1
    });
  }

  /**
   * Spawn event mini-boss
   */
  spawnEventBoss() {
    if (!this.scene || !this.scene.spawnMiniBoss) return;

    // Create warning flash
    this.scene.cameras.main.flash(500, 255, 0, 0);

    // Spawn mini-boss
    this.scene.spawnMiniBoss();

    // Show announcement
    const bossText = this.scene.add.text(
      this.scene.cameras.main.scrollX + 400,
      this.scene.cameras.main.scrollY + 200,
      '💀 EVENT BOSS SPAWNED! 💀',
      {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ff0000',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setScrollFactor(0);

    this.scene.tweens.add({
      targets: bossText,
      scale: 1.5,
      alpha: 0,
      duration: 2000,
      onComplete: () => bossText.destroy()
    });
  }

  /**
   * Show event HUD banner with timer
   * @param {object} event - Event object
   */
  showEventHUD(event) {
    // Remove existing HUD if any
    this.hideEventHUD();

    const cam = this.scene.cameras.main;

    // Create container for HUD elements
    this.eventHUD = this.scene.add.container(0, 0);
    this.eventHUD.setScrollFactor(0);
    this.eventHUD.setDepth(1000);

    // Background banner
    const banner = this.scene.add.rectangle(400, 30, 300, 40, 0x000000, 0.8);
    banner.setStrokeStyle(2, event.color);

    // Event icon and name
    const eventText = this.scene.add.text(400, 25, `${event.icon} ${event.name}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: `#${event.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Timer bar background
    const timerBg = this.scene.add.rectangle(400, 45, 280, 8, 0x333333);

    // Timer bar fill
    this.eventTimerBar = this.scene.add.rectangle(260, 45, 280, 8, event.color);
    this.eventTimerBar.setOrigin(0, 0.5);

    this.eventHUD.add([banner, eventText, timerBg, this.eventTimerBar]);

    // Entrance animation
    this.eventHUD.y = -60;
    this.scene.tweens.add({
      targets: this.eventHUD,
      y: 0,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Hide and destroy event HUD
   */
  hideEventHUD() {
    if (this.eventHUD) {
      this.scene.tweens.add({
        targets: this.eventHUD,
        y: -60,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.eventHUD) {
            this.eventHUD.destroy();
            this.eventHUD = null;
          }
        }
      });
    }
    this.eventTimerBar = null;
  }

  /**
   * End the current event
   */
  endEvent() {
    if (!this.activeEvent) return;

    console.log(`Event ended: ${this.activeEvent.name}`);

    // Show end message
    const endText = this.scene.add.text(
      400, 80,
      `${this.activeEvent.icon} ${this.activeEvent.name} ENDED`,
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#888888',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setScrollFactor(0);

    this.scene.tweens.add({
      targets: endText,
      alpha: 0,
      y: 60,
      duration: 1500,
      onComplete: () => endText.destroy()
    });

    // Clear effects
    this.clearEventEffects();

    // Hide HUD
    this.hideEventHUD();

    this.activeEvent = null;
    this.eventEndTime = 0;
  }

  /**
   * Update loop - check event timer and update HUD
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    if (!this.activeEvent) return;

    // Check if event should end
    if (time >= this.eventEndTime) {
      this.endEvent();
      return;
    }

    // Update timer bar
    if (this.eventTimerBar && this.activeEvent) {
      const totalDuration = this.activeEvent.duration;
      const remaining = this.eventEndTime - time;
      const progress = remaining / totalDuration;
      this.eventTimerBar.setScale(progress, 1);
    }
  }

  /**
   * Get current event effects
   * @returns {object} Current effects or default values
   */
  getActiveEffects() {
    if (!this.activeEvent) {
      return {
        xpMultiplier: 1,
        enemySpeedMod: 1,
        forceRareDrops: false
      };
    }

    return {
      xpMultiplier: this.activeEvent.effects.xpMultiplier || 1,
      enemySpeedMod: this.activeEvent.effects.enemySpeedMod || 1,
      forceRareDrops: this.activeEvent.effects.forceRareDrops || false
    };
  }

  /**
   * Check if an event is active
   * @returns {boolean}
   */
  isEventActive() {
    return this.activeEvent !== null;
  }

  /**
   * Force trigger a specific event (for testing or shrine use)
   * @param {string} eventId - Event ID to trigger
   */
  forceEvent(eventId) {
    const event = Object.values(EventManager.EVENTS).find(e => e.id === eventId);
    if (event) {
      this.startEvent(event);
    }
  }

  /**
   * Clean up on scene shutdown
   */
  destroy() {
    this.hideEventHUD();
    this.clearEventEffects();
    this.activeEvent = null;
  }
}
