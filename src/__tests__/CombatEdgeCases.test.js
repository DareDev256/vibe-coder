import { describe, it, expect } from 'vitest';

/**
 * Combat edge-case tests — validates weapon damage pipelines, enemy health
 * scaling boundaries, split/fork recursion guards, XP reward stacking,
 * boss selection tiers, and spawn capping.
 *
 * Targets the functions most likely to regress based on changelog:
 *   v0.7.2 — empty spawn pool crash
 *   v0.6.8 — missing XP multipliers on kill paths, i-frame overlap
 *   Recent — git-conflict split stats, fork bomb depth cap
 */

// ── Mirrored formulas from ArenaScene ──

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

function buildSpawnPool(wave) {
  const pool = [];
  for (const [type, data] of Object.entries(ENEMY_TYPES)) {
    const waveMin = data.waveMin ?? 0;
    if (wave >= waveMin) {
      const weight = data.spawnWeight ?? 1;
      for (let i = 0; i < weight; i++) pool.push(type);
    }
  }
  return pool;
}

// Enemy health scaling (mirrors ArenaScene.spawnEnemy)
function enemyHealthScale(playerLevel) {
  return 1 + Math.min(playerLevel * 0.05, 2); // Cap at 3x
}

// Boss health scaling (mirrors ArenaScene.spawnBoss)
function bossHealthScale(waveNumber) {
  return 1 + Math.floor(waveNumber / 20) * 0.5;
}

// Mini-boss health scaling (mirrors ArenaScene.spawnMiniBoss)
function miniBossHealthScale(waveNumber) {
  return 1 + Math.floor(waveNumber / 20) * 0.3;
}

// Boss selection by wave (mirrors ArenaScene.spawnBoss)
function selectBoss(waveNumber) {
  if (waveNumber >= 80) return 'boss-kernelpanic';
  if (waveNumber >= 60) return 'boss-memoryleakprime';
  if (waveNumber >= 40) return 'boss-nullpointer';
  return 'boss-stackoverflow';
}

// Crit damage pipeline (mirrors ArenaScene.hitEnemy)
function computeHitDamage(baseDamage, isCrit) {
  return isCrit ? baseDamage * 2 : baseDamage;
}

// Fork bomb child damage (mirrors ArenaScene.hitEnemy fork logic)
function forkChildDamage(parentDamage) {
  return Math.floor(parentDamage * 0.7);
}

// Git-conflict split stats (mirrors ArenaScene.hitEnemy split logic)
function splitEnemyStats(parentHealth, parentSpeed, parentDamage, parentXP) {
  return {
    health: Math.floor(parentHealth * 0.4) + 10,
    speed: parentSpeed * 1.2,
    damage: Math.floor(parentDamage * 0.7),
    xpValue: Math.floor(parentXP * 0.3)
  };
}

// Vampiric heal (mirrors ArenaScene.playerHit vampiric logic)
function vampiricHeal(enemyHealth, maxHealth, damageDealt) {
  const healAmount = Math.floor(damageDealt * 0.1);
  return Math.min(enemyHealth + healAmount, maxHealth);
}

// Wave XP reward (mirrors ArenaScene.checkWaveComplete)
function waveCompleteXP(waveNumber, xpEventMult, modXpMult) {
  const wasBossWave = (waveNumber - 1) % 20 === 0;
  return Math.floor(waveNumber * (wasBossWave ? 100 : 25) * xpEventMult * modXpMult);
}

// Spawn count cap (mirrors ArenaScene.startWave)
function spawnCount(basePerWave, waveNumber) {
  return Math.min(basePerWave + (waveNumber * 2), 25);
}

// ========= TESTS =========

describe('Enemy Health Scaling', () => {
  it('level 0 gives 1x health (no scaling)', () => {
    expect(enemyHealthScale(0)).toBe(1);
  });

  it('level 10 gives 1.5x health', () => {
    expect(enemyHealthScale(10)).toBe(1.5);
  });

  it('caps at 3x health regardless of level', () => {
    expect(enemyHealthScale(40)).toBe(3);
    expect(enemyHealthScale(100)).toBe(3);
    expect(enemyHealthScale(999)).toBe(3);
  });

  it('cap boundary: level 40 is exactly 3x', () => {
    expect(enemyHealthScale(40)).toBe(1 + 2);
  });

  it('produces integer health when applied to bug (HP 15)', () => {
    for (let lvl = 0; lvl <= 50; lvl++) {
      const hp = Math.floor(15 * enemyHealthScale(lvl));
      expect(Number.isInteger(hp)).toBe(true);
      expect(hp).toBeGreaterThan(0);
    }
  });
});

describe('Boss Health Scaling', () => {
  it('wave 20 gives 1.5x', () => {
    expect(bossHealthScale(20)).toBe(1.5);
  });

  it('wave 40 gives 2x', () => {
    expect(bossHealthScale(40)).toBe(2);
  });

  it('wave 100 gives 3.5x', () => {
    expect(bossHealthScale(100)).toBe(3.5);
  });

  it('scales slower than enemy health scaling at equivalent values', () => {
    // At wave 20, boss scale = 1.5; mini-boss = 1.3
    expect(miniBossHealthScale(20)).toBeLessThan(bossHealthScale(20));
  });
});

describe('Boss Selection by Wave', () => {
  it('wave 20 spawns stackoverflow (default)', () => {
    expect(selectBoss(20)).toBe('boss-stackoverflow');
  });

  it('wave 39 still spawns stackoverflow', () => {
    expect(selectBoss(39)).toBe('boss-stackoverflow');
  });

  it('wave 40 spawns nullpointer', () => {
    expect(selectBoss(40)).toBe('boss-nullpointer');
  });

  it('wave 60 spawns memoryleakprime', () => {
    expect(selectBoss(60)).toBe('boss-memoryleakprime');
  });

  it('wave 80+ spawns kernelpanic', () => {
    expect(selectBoss(80)).toBe('boss-kernelpanic');
    expect(selectBoss(100)).toBe('boss-kernelpanic');
    expect(selectBoss(200)).toBe('boss-kernelpanic');
  });

  it('boundary: wave 59 is still nullpointer', () => {
    expect(selectBoss(59)).toBe('boss-nullpointer');
  });
});

describe('Crit Damage Pipeline', () => {
  it('non-crit returns base damage', () => {
    expect(computeHitDamage(50, false)).toBe(50);
  });

  it('crit doubles damage', () => {
    expect(computeHitDamage(50, true)).toBe(100);
  });

  it('crit on 0 damage stays 0', () => {
    expect(computeHitDamage(0, true)).toBe(0);
  });

  it('crit on 1 damage gives 2', () => {
    expect(computeHitDamage(1, true)).toBe(2);
  });
});

describe('Fork Bomb Child Damage Decay', () => {
  it('first generation: 100 → 70', () => {
    expect(forkChildDamage(100)).toBe(70);
  });

  it('second generation: 70 → 49', () => {
    expect(forkChildDamage(70)).toBe(49);
  });

  it('floors correctly on odd parent damage', () => {
    expect(forkChildDamage(33)).toBe(23); // floor(33 * 0.7) = floor(23.1)
  });

  it('damage of 1 decays to 0 (prevents infinite fork value)', () => {
    expect(forkChildDamage(1)).toBe(0);
  });

  it('damage of 0 stays 0', () => {
    expect(forkChildDamage(0)).toBe(0);
  });
});

describe('Git-Conflict Split Enemy Stats', () => {
  const parent = { health: 45, speed: 40, damage: 4, xp: 35 };
  const split = splitEnemyStats(parent.health, parent.speed, parent.damage, parent.xp);

  it('child health is 40% of parent + 10 (prevents zero-HP children)', () => {
    expect(split.health).toBe(Math.floor(45 * 0.4) + 10); // 28
  });

  it('child speed is 20% faster than parent', () => {
    expect(split.speed).toBe(48); // 40 * 1.2
  });

  it('child damage is 70% of parent', () => {
    expect(split.damage).toBe(2); // floor(4 * 0.7)
  });

  it('child XP is 30% of parent (prevents XP farming via splits)', () => {
    expect(split.xpValue).toBe(10); // floor(35 * 0.3)
  });

  it('two children give less total XP than parent', () => {
    expect(split.xpValue * 2).toBeLessThan(parent.xp);
  });

  it('child with 1 damage still has positive HP from +10 floor', () => {
    const tiny = splitEnemyStats(1, 40, 1, 1);
    expect(tiny.health).toBe(10); // floor(1*0.4)+10 = 10
    expect(tiny.health).toBeGreaterThan(0);
  });
});

describe('Vampiric Enemy Healing', () => {
  it('heals 10% of damage dealt', () => {
    expect(vampiricHeal(50, 100, 20)).toBe(52); // 50 + floor(20*0.1)
  });

  it('does not exceed max health', () => {
    expect(vampiricHeal(99, 100, 50)).toBe(100); // 99 + 5 = 104, capped at 100
  });

  it('heal amount floors (no fractional HP)', () => {
    expect(vampiricHeal(50, 100, 3)).toBe(50); // floor(3*0.1) = 0
  });

  it('zero damage means zero heal', () => {
    expect(vampiricHeal(50, 100, 0)).toBe(50);
  });
});

describe('Wave Complete XP Reward', () => {
  it('non-boss wave gives wave# * 25', () => {
    expect(waveCompleteXP(5, 1, 1)).toBe(125);
  });

  it('boss wave (wave after 20) gives wave# * 100', () => {
    // Wave 21: (21-1)%20 === 0, so wasBossWave = true
    expect(waveCompleteXP(21, 1, 1)).toBe(2100);
  });

  it('wave 41 is also a boss-wave reward', () => {
    expect(waveCompleteXP(41, 1, 1)).toBe(4100);
  });

  it('XP multipliers stack multiplicatively', () => {
    const base = waveCompleteXP(10, 1, 1);
    const doubled = waveCompleteXP(10, 2, 1);
    const tripled = waveCompleteXP(10, 1, 3);
    const both = waveCompleteXP(10, 2, 3);
    expect(doubled).toBe(base * 2);
    expect(tripled).toBe(base * 3);
    expect(both).toBe(base * 6);
  });

  it('floors result (no fractional XP)', () => {
    const xp = waveCompleteXP(7, 1.5, 1.3);
    expect(Number.isInteger(xp)).toBe(true);
  });
});

describe('Spawn Count Capping', () => {
  it('wave 1 spawns base + 2', () => {
    expect(spawnCount(5, 1)).toBe(7);
  });

  it('caps at 25 enemies per wave', () => {
    expect(spawnCount(5, 50)).toBe(25);
    expect(spawnCount(5, 100)).toBe(25);
  });

  it('cap boundary: exact 25 at correct wave', () => {
    // 5 + wave*2 = 25 → wave = 10
    expect(spawnCount(5, 10)).toBe(25);
  });

  it('wave 0 just uses base count', () => {
    expect(spawnCount(5, 0)).toBe(5);
  });
});

describe('Spawn Pool Edge Cases', () => {
  it('negative wave returns empty pool', () => {
    // Defensive: waveMin 0 means wave >= 0, so -1 should exclude everything
    const pool = buildSpawnPool(-1);
    expect(pool).toHaveLength(0);
  });

  it('extremely high wave includes all enemy types', () => {
    const pool = buildSpawnPool(9999);
    const unique = [...new Set(pool)];
    expect(unique.length).toBe(Object.keys(ENEMY_TYPES).length);
  });

  it('weighted types appear more often than unweighted', () => {
    const pool = buildSpawnPool(50);
    const bugCount = pool.filter(t => t === 'bug').length;
    const memLeakCount = pool.filter(t => t === 'memory-leak').length;
    expect(bugCount).toBe(3); // spawnWeight: 3
    expect(memLeakCount).toBe(1); // default spawnWeight: 1
  });

  it('total pool size at wave 50 equals sum of all weights', () => {
    const pool = buildSpawnPool(50);
    const expectedSize = Object.values(ENEMY_TYPES)
      .filter(e => e.waveMin <= 50)
      .reduce((sum, e) => sum + (e.spawnWeight ?? 1), 0);
    expect(pool.length).toBe(expectedSize);
  });
});
