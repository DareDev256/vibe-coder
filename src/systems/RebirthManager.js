/**
 * RebirthManager - Prestige/Rebirth system for permanent progression
 * Milestones grant permanent bonuses that persist across all runs
 */
export default class RebirthManager {
  static STORAGE_KEY = 'vibeCoderRebirth';

  // Rebirth milestones
  static MILESTONES = [
    { wave: 50, rebirth: 1, name: 'JUNIOR DEV' },
    { wave: 100, rebirth: 2, name: 'MID-LEVEL' },
    { wave: 150, rebirth: 3, name: 'SENIOR DEV' },
    { wave: 200, rebirth: 4, name: 'TECH LEAD' },
    { wave: 250, rebirth: 5, name: 'ARCHITECT' }
  ];

  // Bonuses per rebirth level
  static BONUSES = {
    allStats: 0.05,      // +5% all stats per rebirth
    xpGain: 0.10,        // +10% XP gain per rebirth
    startingWeapons: 1   // +1 starting weapon per rebirth (max 3)
  };

  /**
   * Load rebirth data from localStorage
   * @returns {object} Rebirth state
   */
  static load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load rebirth data:', e);
    }

    return {
      rebirthLevel: 0,
      highestWave: 0,
      totalRebirths: 0,
      lifetimeKills: 0
    };
  }

  /**
   * Save rebirth data to localStorage
   * @param {object} data - Rebirth state to save
   */
  static save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save rebirth data:', e);
    }
  }

  /**
   * Check if player can rebirth at current wave
   * @param {number} currentWave - Current wave number
   * @returns {object|null} Available milestone or null
   */
  static canRebirth(currentWave) {
    const data = this.load();

    // Find the highest milestone the player qualifies for
    for (let i = this.MILESTONES.length - 1; i >= 0; i--) {
      const milestone = this.MILESTONES[i];
      if (currentWave >= milestone.wave && milestone.rebirth > data.rebirthLevel) {
        return milestone;
      }
    }

    return null;
  }

  /**
   * Perform rebirth - reset progress but grant permanent bonuses
   * @param {number} currentWave - Wave at which rebirth is triggered
   * @param {number} kills - Kills in this run
   * @returns {object} New rebirth state
   */
  static performRebirth(currentWave, kills) {
    const data = this.load();
    const milestone = this.canRebirth(currentWave);

    if (!milestone) {
      return data;
    }

    // Update rebirth level
    data.rebirthLevel = milestone.rebirth;
    data.totalRebirths++;
    data.lifetimeKills += kills;

    // Update highest wave if applicable
    if (currentWave > data.highestWave) {
      data.highestWave = currentWave;
    }

    this.save(data);
    return data;
  }

  /**
   * Get all stat multiplier from rebirth bonuses
   * @returns {number} Multiplier (1.0 = no bonus)
   */
  static getAllStatsMultiplier() {
    const data = this.load();
    return 1 + (data.rebirthLevel * this.BONUSES.allStats);
  }

  /**
   * Get XP gain multiplier from rebirth bonuses
   * @returns {number} Multiplier (1.0 = no bonus)
   */
  static getXPMultiplier() {
    const data = this.load();
    return 1 + (data.rebirthLevel * this.BONUSES.xpGain);
  }

  /**
   * Get number of starting weapons from rebirth bonuses
   * @returns {number} Number of weapons (0-3)
   */
  static getStartingWeaponCount() {
    const data = this.load();
    return Math.min(3, data.rebirthLevel * this.BONUSES.startingWeapons);
  }

  /**
   * Get current rebirth info for display
   * @returns {object} Rebirth info
   */
  static getRebirthInfo() {
    const data = this.load();
    const currentMilestone = this.MILESTONES.find(m => m.rebirth === data.rebirthLevel);
    const nextMilestone = this.MILESTONES.find(m => m.rebirth === data.rebirthLevel + 1);

    return {
      level: data.rebirthLevel,
      name: currentMilestone?.name || 'INTERN',
      nextMilestone: nextMilestone,
      allStatsBonus: Math.round(data.rebirthLevel * this.BONUSES.allStats * 100),
      xpBonus: Math.round(data.rebirthLevel * this.BONUSES.xpGain * 100),
      startingWeapons: this.getStartingWeaponCount(),
      totalRebirths: data.totalRebirths,
      lifetimeKills: data.lifetimeKills,
      highestWave: data.highestWave
    };
  }

  /**
   * Get random starting weapons based on rebirth level
   * @returns {Array} Array of weapon type strings
   */
  static getStartingWeapons() {
    const count = this.getStartingWeaponCount();
    if (count === 0) return [];

    const weaponPool = ['spread', 'pierce', 'rapid', 'homing', 'bounce', 'aoe', 'freeze'];
    const selected = [];

    for (let i = 0; i < count && weaponPool.length > 0; i++) {
      const index = Math.floor(Math.random() * weaponPool.length);
      selected.push(weaponPool.splice(index, 1)[0]);
    }

    return selected;
  }
}
