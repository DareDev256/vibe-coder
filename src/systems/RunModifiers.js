/**
 * RunModifiers - Run-start mutators that add variety and challenge
 * Selected at run start, provides multipliers and flags for ArenaScene
 */
export default class RunModifiers {
  // Available modifiers with their effects
  static MODIFIERS = {
    VAMPIRIC_ENEMIES: {
      id: 'vampiric',
      name: 'VAMPIRIC ENEMIES',
      desc: 'Enemies heal 10% of damage dealt',
      icon: '🧛',
      color: 0xff0044,
      effects: {
        vampiricEnemies: true
      }
    },
    GLASS_CANNON: {
      id: 'glass_cannon',
      name: 'GLASS CANNON',
      desc: '2x damage, 50% max health',
      icon: '💀',
      color: 0xff6600,
      effects: {
        damageMultiplier: 2,
        healthMultiplier: 0.5
      }
    },
    WEAPON_FRENZY: {
      id: 'weapon_frenzy',
      name: 'WEAPON FRENZY',
      desc: 'Weapons 50% shorter, +50% drop rate',
      icon: '⚔️',
      color: 0xffaa00,
      effects: {
        weaponDurationMult: 0.5,
        weaponDropRate: 1.5
      }
    },
    BULLET_HELL: {
      id: 'bullet_hell',
      name: 'BULLET HELL',
      desc: '+100% projectiles, +50% enemies',
      icon: '🔥',
      color: 0xff00ff,
      effects: {
        projectileCount: 2,
        enemyCountMult: 1.5
      }
    },
    MARATHON: {
      id: 'marathon',
      name: 'MARATHON',
      desc: 'Waves 50% longer, +25% XP',
      icon: '🏃',
      color: 0x00ffaa,
      effects: {
        waveLengthMult: 1.5,
        xpMult: 1.25
      }
    }
  };

  // Storage key for persisting active modifiers
  static STORAGE_KEY = 'vibeCoderModifiers';

  /**
   * Select random modifiers for a new run
   * @param {number} count - Number of modifiers to select (default 1, 2 after wave 25)
   * @returns {Array} Array of modifier objects
   */
  static selectModifiers(count = 1) {
    const modifierKeys = Object.keys(this.MODIFIERS);
    const selected = [];
    const availableKeys = [...modifierKeys];

    for (let i = 0; i < count && availableKeys.length > 0; i++) {
      const index = Math.floor(Math.random() * availableKeys.length);
      const key = availableKeys.splice(index, 1)[0];
      selected.push(this.MODIFIERS[key]);
    }

    return selected;
  }

  /**
   * Get combined effects from multiple modifiers
   * @param {Array} modifiers - Array of modifier objects
   * @returns {object} Combined effects object with all multipliers/flags
   */
  static getCombinedEffects(modifiers) {
    const combined = {
      // Multipliers (default 1)
      damageMultiplier: 1,
      healthMultiplier: 1,
      weaponDurationMult: 1,
      weaponDropRate: 1,
      projectileCount: 1,
      enemyCountMult: 1,
      waveLengthMult: 1,
      xpMult: 1,
      // Flags (default false)
      vampiricEnemies: false
    };

    modifiers.forEach(mod => {
      if (!mod.effects) return;

      Object.entries(mod.effects).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          // Flags: OR them together
          combined[key] = combined[key] || value;
        } else {
          // Multipliers: multiply together
          combined[key] *= value;
        }
      });
    });

    return combined;
  }

  /**
   * Save active modifiers to localStorage
   * @param {Array} modifiers - Active modifier objects
   */
  static save(modifiers) {
    try {
      const ids = modifiers.map(m => m.id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save modifiers:', e);
    }
  }

  /**
   * Load saved modifiers from localStorage
   * @returns {Array} Array of modifier objects
   */
  static load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];

      const ids = JSON.parse(saved);
      const modifiers = [];

      Object.values(this.MODIFIERS).forEach(mod => {
        if (ids.includes(mod.id)) {
          modifiers.push(mod);
        }
      });

      return modifiers;
    } catch (e) {
      console.error('Failed to load modifiers:', e);
      return [];
    }
  }

  /**
   * Clear saved modifiers
   */
  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get modifier by ID
   * @param {string} id - Modifier ID
   * @returns {object|null} Modifier object or null
   */
  static getById(id) {
    return Object.values(this.MODIFIERS).find(m => m.id === id) || null;
  }

  /**
   * Get all available modifiers
   * @returns {Array} Array of all modifier objects
   */
  static getAll() {
    return Object.values(this.MODIFIERS);
  }
}
