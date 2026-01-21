/**
 * SaveManager - Handles run persistence for Continue functionality
 * Auto-saves at wave completion, allows continuing from last checkpoint
 */
export default class SaveManager {
  static SAVE_KEY = 'vibeCoderRunSave';

  /**
   * Save current run state
   * @param {object} data - Run data to save
   */
  static saveRun(data) {
    const saveData = {
      wave: data.wave,
      stage: data.stage,
      player: {
        level: data.player.level,
        xp: data.player.xp,
        totalXP: data.player.totalXP,
        health: data.player.health,
        maxHealth: data.player.maxHealth,
        kills: data.player.kills,
        streak: data.player.streak
      },
      weapons: {
        current: data.weapons.current,
        collected: Array.from(data.weapons.collected)
      },
      // Save active modifiers (if any)
      modifiers: data.modifiers || [],
      timestamp: Date.now(),
      version: 2
    };

    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error('Failed to save run:', e);
      return false;
    }
  }

  /**
   * Load saved run state
   * @returns {object|null} Saved run data or null if none exists
   */
  static loadRun() {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (!saved) return null;

      const data = JSON.parse(saved);

      // Check if save is too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > maxAge) {
        this.clearSave();
        return null;
      }

      return data;
    } catch (e) {
      console.error('Failed to load run:', e);
      return null;
    }
  }

  /**
   * Check if a saved run exists
   * @returns {boolean} True if valid save exists
   */
  static hasSave() {
    const save = this.loadRun();
    return save !== null;
  }

  /**
   * Get save summary for display
   * @returns {object|null} Summary with wave, stage, timestamp
   */
  static getSaveSummary() {
    const save = this.loadRun();
    if (!save) return null;

    return {
      wave: save.wave,
      stage: save.stage,
      level: save.player.level,
      kills: save.player.kills,
      timestamp: save.timestamp,
      timeAgo: this.getTimeAgo(save.timestamp)
    };
  }

  /**
   * Clear saved run
   */
  static clearSave() {
    localStorage.removeItem(this.SAVE_KEY);
  }

  /**
   * Get human-readable time ago string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Human-readable time ago
   */
  static getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Apply saved state to game objects
   * @param {object} save - Saved data from loadRun()
   * @param {object} scene - ArenaScene instance
   */
  static applySaveToScene(save, scene) {
    if (!save) return false;

    // Restore wave and stage
    scene.waveNumber = save.wave;
    scene.currentStage = save.stage;

    // Restore player stats
    const vibeState = window.VIBE_CODER;
    vibeState.level = save.player.level;
    vibeState.xp = save.player.xp;
    vibeState.totalXP = save.player.totalXP;
    vibeState.kills = save.player.kills;
    vibeState.streak = save.player.streak;

    // Restore player health
    scene.player.health = save.player.health;

    // Restore collected weapons
    scene.collectedWeapons = new Set(save.weapons.collected);

    // Restore current weapon if not basic
    if (save.weapons.current && save.weapons.current.type !== 'basic') {
      scene.currentWeapon = {
        type: save.weapons.current.type,
        duration: save.weapons.current.duration || 15000,
        isEvolved: save.weapons.current.isEvolved || false
      };
    }

    // Note: Modifiers are restored in ArenaScene.create() via RunModifiers.load()
    // The save.modifiers array is just for data persistence

    return true;
  }
}
