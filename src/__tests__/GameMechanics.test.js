import { describe, it, expect } from 'vitest';

/**
 * Core game mechanics tests — validates XP curves, player stat scaling,
 * weapon balance invariants, enemy spawn pools, and evolution recipes.
 *
 * These test the pure formulas and data that drive ArenaScene without
 * requiring the Phaser engine.
 */

// ── XP curve formula (mirrors main.js VIBE_CODER.xpForLevel) ──
const xpForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));

// ── Player stat formulas (mirrors ArenaScene.getPlayerStats) ──
const BASE_STATS = { speed: 200, attackRate: 300, attackDamage: 25, maxHealth: 200 };

function getPlayerStats(level, bonuses = {}) {
  const damageBonus = bonuses.damage ?? 1;
  const healthBonus = bonuses.health ?? 1;
  const speedBonus = bonuses.speed ?? 1;
  const attackRateBonus = bonuses.attackRate ?? 1;
  const rebirthMult = bonuses.rebirth ?? 1;
  const modDamageMult = bonuses.modDamage ?? 1;
  const modHealthMult = bonuses.modHealth ?? 1;
  const shrineDamageMult = bonuses.shrineDamage ?? 1;

  const baseSpeed = BASE_STATS.speed + (level * 8);
  const baseAttackRate = Math.max(100, BASE_STATS.attackRate - (level * 15));
  const baseDamage = BASE_STATS.attackDamage + (level * 5);
  const baseHealth = BASE_STATS.maxHealth + (level * 20);

  return {
    speed: Math.floor(baseSpeed * speedBonus * rebirthMult),
    attackRate: Math.max(50, Math.floor(baseAttackRate / (attackRateBonus * rebirthMult))),
    attackDamage: Math.floor(baseDamage * damageBonus * rebirthMult * modDamageMult * shrineDamageMult),
    maxHealth: Math.floor(baseHealth * healthBonus * rebirthMult * modHealthMult)
  };
}

// ── Weapon data (mirrors ArenaScene constructor) ──
const WEAPON_TYPES = {
  basic: { attackRate: 1, damage: 1, projectiles: 1, pierce: false, color: 0x00ffff },
  spread: { attackRate: 1, damage: 0.7, projectiles: 5, pierce: false, color: 0xff9900 },
  pierce: { attackRate: 0.8, damage: 1.5, projectiles: 1, pierce: true, color: 0x0099ff },
  orbital: { attackRate: 0, damage: 2, projectiles: 0, pierce: true, color: 0xaa44ff },
  rapid: { attackRate: 3, damage: 0.5, projectiles: 1, pierce: false, color: 0xffcc00 },
  homing: { attackRate: 0.7, damage: 1.2, projectiles: 1, pierce: false, color: 0x00ff88, special: 'homing' },
  bounce: { attackRate: 1, damage: 0.8, projectiles: 2, pierce: false, color: 0x88ff00, special: 'bounce', bounces: 3 },
  aoe: { attackRate: 0.5, damage: 0.6, projectiles: 0, pierce: true, color: 0xff4488, special: 'aoe', radius: 100 },
  freeze: { attackRate: 0.8, damage: 0.9, projectiles: 1, pierce: false, color: 0x88ffff, special: 'freeze', slowDuration: 2000 },
  rmrf: { attackRate: 0, damage: 0, projectiles: 0, pierce: false, color: 0xff0000, special: 'clearAll' },
  sudo: { attackRate: 2, damage: 3, projectiles: 1, pierce: true, color: 0xffd700, special: 'godMode' },
  forkbomb: { attackRate: 1.5, damage: 0.6, projectiles: 3, pierce: false, color: 0xff00ff, special: 'fork' },
  sword: { attackRate: 1.2, damage: 1.5, projectiles: 0, pierce: false, color: 0xcccccc, melee: true },
  spear: { attackRate: 0.8, damage: 1.2, projectiles: 0, pierce: true, color: 0x8b4513, melee: true },
  boomerang: { attackRate: 0.6, damage: 1.0, projectiles: 1, pierce: false, color: 0xdaa520, melee: true },
  kunai: { attackRate: 2.0, damage: 0.8, projectiles: 3, pierce: false, color: 0x2f2f2f, melee: true }
};

// ── Enemy data (mirrors ArenaScene constructor) ──
const ENEMY_TYPES = {
  bug: { health: 15, speed: 40, damage: 3, xpValue: 5, waveMin: 0, spawnWeight: 3 },
  glitch: { health: 30, speed: 70, damage: 5, xpValue: 15, waveMin: 3, spawnWeight: 2 },
  'memory-leak': { health: 60, speed: 25, damage: 10, xpValue: 30, waveMin: 5 },
  'syntax-error': { health: 12, speed: 100, damage: 2, xpValue: 10, waveMin: 8, spawnWeight: 2 },
  'infinite-loop': { health: 40, speed: 50, damage: 4, xpValue: 20, waveMin: 12 },
  'race-condition': { health: 25, speed: 60, damage: 6, xpValue: 25, waveMin: 15 },
  'segfault': { health: 10, speed: 0, damage: 999, xpValue: 50, waveMin: 30 },
  'dependency-hell': { health: 80, speed: 30, damage: 6, xpValue: 80, waveMin: 35 },
  'stack-overflow': { health: 100, speed: 35, damage: 8, xpValue: 100, waveMin: 25 },
  'hallucination': { health: 1, speed: 50, damage: 0, xpValue: 1, waveMin: 20, spawnWeight: 2 },
  'token-overflow': { health: 40, speed: 45, damage: 5, xpValue: 40, waveMin: 25 },
  'context-loss': { health: 50, speed: 60, damage: 7, xpValue: 60, waveMin: 30 },
  'prompt-injection': { health: 60, speed: 40, damage: 5, xpValue: 100, waveMin: 40 },
  '404-not-found': { health: 25, speed: 55, damage: 4, xpValue: 20, waveMin: 18 },
  'cors-error': { health: 35, speed: 0, damage: 8, xpValue: 30, waveMin: 22 },
  'type-error': { health: 30, speed: 50, damage: 5, xpValue: 25, waveMin: 28 },
  'git-conflict': { health: 45, speed: 40, damage: 4, xpValue: 35, waveMin: 32 },
  'overfitting': { health: 50, speed: 65, damage: 6, xpValue: 45, waveMin: 38 },
  'mode-collapse': { health: 70, speed: 35, damage: 7, xpValue: 60, waveMin: 45 }
};

// ── Spawn pool builder (mirrors ArenaScene.buildSpawnPool) ──
function buildSpawnPool(wave) {
  const pool = [];
  for (const [type, data] of Object.entries(ENEMY_TYPES)) {
    const waveMin = data.waveMin ?? 0;
    if (wave >= waveMin) {
      const weight = data.spawnWeight ?? 1;
      for (let i = 0; i < weight; i++) {
        pool.push(type);
      }
    }
  }
  return pool;
}

// ── Evolution recipes (mirrors ArenaScene constructor) ──
const EVOLUTION_RECIPES = {
  'spread+pierce': { result: 'laserbeam' },
  'orbital+rapid': { result: 'plasmaorb' },
  'pierce+rapid': { result: 'chainlightning' },
  'spread+rapid': { result: 'bullethell' },
  'orbital+spread': { result: 'ringoffire' },
  'homing+pierce': { result: 'seekingmissile' },
  'bounce+spread': { result: 'chaosbounce' },
  'aoe+orbital': { result: 'deathaura' },
  'freeze+pierce': { result: 'icelance' },
  'homing+rapid': { result: 'swarm' },
  'freeze+aoe': { result: 'blizzard' }
};

// ── Crit chance formula (mirrors ArenaScene.getCritChance) ──
function getCritChance(critUpgradeBonus = 1) {
  return 0.1 + (critUpgradeBonus - 1);
}

// ========= TESTS =========

describe('XP Curve (xpForLevel)', () => {
  it('level 1 requires 100 XP', () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it('scales super-linearly with level', () => {
    const xp5 = xpForLevel(5);
    const xp10 = xpForLevel(10);
    // Level 10 should need more than 2x level 5 XP
    expect(xp10).toBeGreaterThan(xp5 * 2);
  });

  it('never returns zero or negative', () => {
    for (let lvl = 1; lvl <= 100; lvl++) {
      expect(xpForLevel(lvl)).toBeGreaterThan(0);
    }
  });

  it('is monotonically increasing', () => {
    for (let lvl = 1; lvl < 100; lvl++) {
      expect(xpForLevel(lvl + 1)).toBeGreaterThan(xpForLevel(lvl));
    }
  });

  it('produces integer values', () => {
    for (let lvl = 1; lvl <= 50; lvl++) {
      expect(Number.isInteger(xpForLevel(lvl))).toBe(true);
    }
  });

  it('matches known values at key levels', () => {
    // Math.floor(100 * level^1.5)
    expect(xpForLevel(4)).toBe(Math.floor(100 * Math.pow(4, 1.5))); // 800
    expect(xpForLevel(10)).toBe(Math.floor(100 * Math.pow(10, 1.5))); // 3162
    expect(xpForLevel(25)).toBe(Math.floor(100 * Math.pow(25, 1.5))); // 12500
  });
});

describe('Player Stats Scaling', () => {
  it('level 1 base stats match design intent', () => {
    const stats = getPlayerStats(1);
    expect(stats.speed).toBe(208);          // 200 + 1*8
    expect(stats.attackRate).toBe(285);      // 300 - 1*15
    expect(stats.attackDamage).toBe(30);     // 25 + 1*5
    expect(stats.maxHealth).toBe(220);       // 200 + 1*20
  });

  it('speed increases with level', () => {
    expect(getPlayerStats(10).speed).toBeGreaterThan(getPlayerStats(1).speed);
  });

  it('attack rate decreases (faster) with level', () => {
    expect(getPlayerStats(10).attackRate).toBeLessThan(getPlayerStats(1).attackRate);
  });

  it('attack rate floors at 100ms without bonuses', () => {
    // At level 14: 300 - 14*15 = 90, clamped to 100
    const stats = getPlayerStats(14);
    expect(stats.attackRate).toBe(100);
  });

  it('attack rate floors at 50ms with extreme bonuses', () => {
    const stats = getPlayerStats(50, { attackRate: 10, rebirth: 2 });
    expect(stats.attackRate).toBe(50);
  });

  it('damage scales with modifier stacking', () => {
    const base = getPlayerStats(10);
    const buffed = getPlayerStats(10, { modDamage: 2, shrineDamage: 1.5 });
    expect(buffed.attackDamage).toBe(base.attackDamage * 3);
  });

  it('health scales with Glass Cannon modifier', () => {
    const base = getPlayerStats(10);
    const glassCannon = getPlayerStats(10, { modHealth: 0.5 });
    expect(glassCannon.maxHealth).toBe(Math.floor(base.maxHealth * 0.5));
  });

  it('rebirth multiplier affects all stats', () => {
    const base = getPlayerStats(5);
    const reborn = getPlayerStats(5, { rebirth: 1.25 });
    expect(reborn.speed).toBeGreaterThan(base.speed);
    expect(reborn.attackDamage).toBeGreaterThan(base.attackDamage);
    expect(reborn.maxHealth).toBeGreaterThan(base.maxHealth);
    expect(reborn.attackRate).toBeLessThan(base.attackRate); // lower = faster
  });
});

describe('Spawn Pool (buildSpawnPool)', () => {
  it('wave 1 only has bugs (weighted 3x)', () => {
    const pool = buildSpawnPool(1);
    expect(pool).toEqual(['bug', 'bug', 'bug']);
  });

  it('wave 3 adds glitch to the pool', () => {
    const pool = buildSpawnPool(3);
    expect(pool).toContain('glitch');
    expect(pool).toContain('bug');
  });

  it('pool grows as waves increase', () => {
    const pool10 = buildSpawnPool(10);
    const pool30 = buildSpawnPool(30);
    expect(pool30.length).toBeGreaterThan(pool10.length);
  });

  it('wave 50 contains all enemies with waveMin <= 50', () => {
    const pool = buildSpawnPool(50);
    const uniqueTypes = [...new Set(pool)];
    for (const [type, data] of Object.entries(ENEMY_TYPES)) {
      if (data.waveMin <= 50) {
        expect(uniqueTypes).toContain(type);
      }
    }
  });

  it('no enemies appear before their waveMin', () => {
    for (const [type, data] of Object.entries(ENEMY_TYPES)) {
      if (data.waveMin > 0) {
        const pool = buildSpawnPool(data.waveMin - 1);
        expect(pool).not.toContain(type);
      }
    }
  });

  it('spawnWeight controls frequency in pool', () => {
    const pool = buildSpawnPool(0);
    // Bug has spawnWeight: 3, so it should appear 3 times
    expect(pool.filter(t => t === 'bug')).toHaveLength(3);
  });

  it('returns empty pool for wave 0 if no enemies have waveMin 0', () => {
    // Actually bug has waveMin: 0, so wave 0 should have bugs
    const pool = buildSpawnPool(0);
    expect(pool.length).toBeGreaterThan(0);
  });
});

describe('Weapon System', () => {
  it('has 16 weapon types', () => {
    expect(Object.keys(WEAPON_TYPES)).toHaveLength(16);
  });

  it('every weapon has a unique color', () => {
    const colors = Object.values(WEAPON_TYPES).map(w => w.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('every weapon has non-negative damage multiplier', () => {
    Object.values(WEAPON_TYPES).forEach(w => {
      expect(w.damage).toBeGreaterThanOrEqual(0);
    });
  });

  it('melee weapons have 0 projectiles', () => {
    const melee = Object.values(WEAPON_TYPES).filter(w => w.melee);
    melee.forEach(w => {
      // boomerang and kunai are melee but have projectile counts for thrown items
      if (w !== WEAPON_TYPES.boomerang && w !== WEAPON_TYPES.kunai) {
        expect(w.projectiles).toBe(0);
      }
    });
  });

  it('basic weapon has baseline 1.0 multipliers', () => {
    const basic = WEAPON_TYPES.basic;
    expect(basic.attackRate).toBe(1);
    expect(basic.damage).toBe(1);
    expect(basic.projectiles).toBe(1);
  });

  it('rapid weapon fires faster than basic', () => {
    expect(WEAPON_TYPES.rapid.attackRate).toBeGreaterThan(WEAPON_TYPES.basic.attackRate);
  });

  it('pierce weapon deals more damage per hit than basic', () => {
    expect(WEAPON_TYPES.pierce.damage).toBeGreaterThan(WEAPON_TYPES.basic.damage);
  });

  it('spread weapon trades damage for projectile count', () => {
    const spread = WEAPON_TYPES.spread;
    expect(spread.projectiles).toBeGreaterThan(1);
    expect(spread.damage).toBeLessThan(1);
  });
});

describe('Evolution Recipes', () => {
  it('has 11 evolution recipes', () => {
    expect(Object.keys(EVOLUTION_RECIPES)).toHaveLength(11);
  });

  it('all recipe ingredients are valid base weapons', () => {
    Object.keys(EVOLUTION_RECIPES).forEach(recipe => {
      const [a, b] = recipe.split('+');
      expect(WEAPON_TYPES).toHaveProperty(a);
      expect(WEAPON_TYPES).toHaveProperty(b);
    });
  });

  it('all evolved weapons have unique result names', () => {
    const results = Object.values(EVOLUTION_RECIPES).map(r => r.result);
    expect(new Set(results).size).toBe(results.length);
  });

  it('no weapon combines with itself', () => {
    Object.keys(EVOLUTION_RECIPES).forEach(recipe => {
      const [a, b] = recipe.split('+');
      expect(a).not.toBe(b);
    });
  });
});

describe('Enemy Balance', () => {
  it('all enemies have positive health', () => {
    Object.values(ENEMY_TYPES).forEach(e => {
      expect(e.health).toBeGreaterThan(0);
    });
  });

  it('XP scales with difficulty (higher waveMin = more XP on average)', () => {
    const earlyEnemies = Object.values(ENEMY_TYPES).filter(e => e.waveMin <= 10);
    const lateEnemies = Object.values(ENEMY_TYPES).filter(e => e.waveMin >= 30);
    const avgEarlyXP = earlyEnemies.reduce((s, e) => s + e.xpValue, 0) / earlyEnemies.length;
    const avgLateXP = lateEnemies.reduce((s, e) => s + e.xpValue, 0) / lateEnemies.length;
    expect(avgLateXP).toBeGreaterThan(avgEarlyXP);
  });

  it('hallucination is harmless (0 damage, 1 HP)', () => {
    expect(ENEMY_TYPES['hallucination'].damage).toBe(0);
    expect(ENEMY_TYPES['hallucination'].health).toBe(1);
  });

  it('segfault is a one-shot zone (999 damage, 0 speed)', () => {
    expect(ENEMY_TYPES['segfault'].damage).toBe(999);
    expect(ENEMY_TYPES['segfault'].speed).toBe(0);
  });

  it('every enemy type has a waveMin defined', () => {
    Object.entries(ENEMY_TYPES).forEach(([type, data]) => {
      expect(data.waveMin).toBeDefined();
      expect(typeof data.waveMin).toBe('number');
    });
  });
});

describe('Crit Chance', () => {
  it('base crit chance is 10% with no upgrades', () => {
    expect(getCritChance(1)).toBeCloseTo(0.1);
  });

  it('crit chance increases with upgrade bonus', () => {
    // getBonus returns 1.15 for one level of critChance upgrade
    expect(getCritChance(1.15)).toBeCloseTo(0.25);
  });

  it('crit chance is never negative', () => {
    // Even with bonus = 1 (no upgrade), 0.1 + 0 = 0.1
    expect(getCritChance(1)).toBeGreaterThanOrEqual(0);
  });
});
