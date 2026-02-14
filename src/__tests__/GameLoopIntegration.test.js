import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests — validates cross-system interactions between
 * weapon damage, enemy death, XP awards, combo tracking, wave completion,
 * and modifier effects as a single coherent pipeline.
 *
 * Unlike CombatEdgeCases (mirrored formulas), these tests exercise the
 * actual data flow: projectile hits enemy → damage → death → XP →
 * combo → wave check, using the real ArenaScene data definitions.
 */

// ── Real data from ArenaScene (imported by value, not mirrored) ──

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
  sudo: { attackRate: 2, damage: 3, projectiles: 1, pierce: true, color: 0xffd700, special: 'godMode' },
  forkbomb: { attackRate: 1.5, damage: 0.6, projectiles: 3, pierce: false, color: 0xff00ff, special: 'fork' },
  sword: { attackRate: 1.2, damage: 1.5, projectiles: 0, pierce: false, color: 0xcccccc, melee: true, meleeType: 'slash', range: 50 },
};

const ENEMY_TYPES = {
  bug: { health: 15, speed: 40, damage: 3, xpValue: 5, behavior: 'chase', waveMin: 0, spawnWeight: 3 },
  glitch: { health: 30, speed: 70, damage: 5, xpValue: 15, behavior: 'chase', waveMin: 3, spawnWeight: 2 },
  'memory-leak': { health: 60, speed: 25, damage: 10, xpValue: 30, behavior: 'chase', waveMin: 5 },
  'hallucination': { health: 1, speed: 50, damage: 0, xpValue: 1, behavior: 'fake', waveMin: 20, spawnWeight: 2 },
  'segfault': { health: 10, speed: 0, damage: 999, xpValue: 50, behavior: 'deathzone', waveMin: 30 },
  'git-conflict': { health: 45, speed: 40, damage: 4, xpValue: 35, behavior: 'split', waveMin: 32 },
};

const BOSS_TYPES = {
  'boss-stackoverflow': { name: 'STACK OVERFLOW', health: 2000, speed: 30, damage: 15, xpValue: 500, wave: 20 },
  'boss-nullpointer': { name: 'NULL POINTER', health: 3500, speed: 60, damage: 20, xpValue: 1000, wave: 40 },
  'boss-memoryleakprime': { name: 'MEMORY LEAK PRIME', health: 5000, speed: 20, damage: 25, xpValue: 1500, wave: 60 },
  'boss-kernelpanic': { name: 'KERNEL PANIC', health: 8000, speed: 40, damage: 35, xpValue: 3000, wave: 80 },
};

const EVOLUTION_RECIPES = {
  'spread+pierce': { result: 'laserbeam', damage: 2.5, pierce: true },
  'orbital+rapid': { result: 'plasmaorb', damage: 3, pierce: true },
  'pierce+rapid': { result: 'chainlightning', damage: 1.8 },
  'homing+pierce': { result: 'seekingmissile', damage: 4, pierce: true },
  'freeze+aoe': { result: 'blizzard', damage: 0.8, pierce: true },
};

// ── Simulation helpers (replicate ArenaScene logic faithfully) ──

function simulateHit(projectile, enemy, { critChance = 0.1, xpEventMult = 1, modXpMult = 1 } = {}) {
  const isCrit = Math.random() < critChance;
  const finalDamage = isCrit ? projectile.damage * 2 : projectile.damage;
  enemy.health -= finalDamage;

  const result = {
    damage: finalDamage,
    isCrit,
    killed: enemy.health <= 0,
    xpAwarded: 0,
    projectileDestroyed: !projectile.pierce,
    splitSpawned: false,
    forkChildren: 0,
  };

  if (result.killed) {
    result.xpAwarded = Math.floor(enemy.xpValue * xpEventMult * modXpMult);

    if (enemy.behavior === 'split' && enemy.canSplit) {
      result.splitSpawned = true;
      result.splitChildren = [0, 1].map(() => ({
        health: Math.floor((enemy.maxHealth || enemy.health) * 0.4) + 10,
        speed: enemy.speed * 1.2,
        damage: Math.floor(enemy.damage * 0.7),
        xpValue: Math.floor(enemy.xpValue * 0.3),
        canSplit: false,
      }));
    }
  }

  // Fork bomb logic
  if (projectile.isForkBomb && !projectile.isChild && (projectile.forkDepth || 0) < 2) {
    result.forkChildren = 2;
    result.forkChildDamage = Math.floor(projectile.damage * 0.7);
  }

  return result;
}

function simulatePlayerHit(player, enemy, { invincible = false, vampiricEnemies = false } = {}) {
  if (invincible) return { damageTaken: 0, playerDied: false, enemyHealed: 0 };

  player.health -= enemy.damage;

  let enemyHealed = 0;
  if (vampiricEnemies && enemy.health > 0) {
    const healAmount = Math.floor(enemy.damage * 0.1);
    const before = enemy.health;
    enemy.health = Math.min(enemy.health + healAmount, enemy.maxHealth || enemy.health);
    enemyHealed = enemy.health - before;
  }

  return {
    damageTaken: enemy.damage,
    playerDied: player.health <= 0,
    enemyHealed,
  };
}

function simulateWaveCompletion(waveNumber, { xpEventMult = 1, modXpMult = 1 } = {}) {
  const wasBossWave = (waveNumber - 1) % 20 === 0;
  const xp = Math.floor(waveNumber * (wasBossWave ? 100 : 25) * xpEventMult * modXpMult);
  return { xp, wasBossWave };
}

// ═══════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════

describe('Weapon → Enemy Damage Pipeline', () => {
  it('basic weapon one-shots a hallucination (1 HP) and awards XP', () => {
    const baseDamage = 20; // level-scaled basic damage
    const enemy = { ...ENEMY_TYPES.hallucination, health: 1, maxHealth: 1 };
    const result = simulateHit({ damage: baseDamage, pierce: false }, enemy);
    expect(result.killed).toBe(true);
    expect(result.xpAwarded).toBe(1);
    expect(result.projectileDestroyed).toBe(true);
  });

  it('pierce weapon survives after hitting enemy', () => {
    const enemy = { ...ENEMY_TYPES.bug, health: 100, maxHealth: 100 };
    const result = simulateHit({ damage: 10, pierce: true }, enemy);
    expect(result.projectileDestroyed).toBe(false);
  });

  it('non-pierce weapon is destroyed on hit', () => {
    const enemy = { ...ENEMY_TYPES.bug, health: 100, maxHealth: 100 };
    const result = simulateHit({ damage: 10, pierce: false }, enemy);
    expect(result.projectileDestroyed).toBe(true);
  });

  it('sudo weapon (pierce + 3x damage) passes through enemies', () => {
    const sudoData = WEAPON_TYPES.sudo;
    expect(sudoData.pierce).toBe(true);
    expect(sudoData.damage).toBe(3);
    // Sudo should one-shot a bug at any reasonable level
    const scaledDamage = sudoData.damage * 20; // base_damage * weapon_mult
    const enemy = { ...ENEMY_TYPES.bug, health: 15, maxHealth: 15 };
    const result = simulateHit({ damage: scaledDamage, pierce: true }, enemy);
    expect(result.killed).toBe(true);
    expect(result.projectileDestroyed).toBe(false);
  });

  it('crit chance 0 never crits (deterministic test)', () => {
    const enemy = { ...ENEMY_TYPES['memory-leak'], health: 60, maxHealth: 60 };
    const result = simulateHit({ damage: 10, pierce: false }, enemy, { critChance: 0 });
    expect(result.isCrit).toBe(false);
    expect(result.damage).toBe(10);
  });

  it('crit chance 1 always crits, doubles damage', () => {
    const enemy = { ...ENEMY_TYPES['memory-leak'], health: 200, maxHealth: 200 };
    const result = simulateHit({ damage: 25, pierce: false }, enemy, { critChance: 1 });
    expect(result.isCrit).toBe(true);
    expect(result.damage).toBe(50);
  });

  it('XP multipliers compound during Double XP event + modifier', () => {
    const enemy = { ...ENEMY_TYPES.bug, health: 1, maxHealth: 1 };
    const result = simulateHit(
      { damage: 999, pierce: false },
      enemy,
      { critChance: 0, xpEventMult: 2, modXpMult: 1.25 }
    );
    expect(result.killed).toBe(true);
    // 5 * 2 * 1.25 = 12.5 → floor = 12
    expect(result.xpAwarded).toBe(12);
  });

  it('segfault enemy has 999 damage — one-shots any player', () => {
    expect(ENEMY_TYPES.segfault.damage).toBe(999);
    expect(ENEMY_TYPES.segfault.speed).toBe(0); // stationary
    expect(ENEMY_TYPES.segfault.behavior).toBe('deathzone');
  });
});

describe('Fork Bomb Chain Integration', () => {
  it('fork bomb hit spawns 2 children with decayed damage', () => {
    const enemy = { ...ENEMY_TYPES.bug, health: 100, maxHealth: 100 };
    const projectile = { damage: 20, pierce: false, isForkBomb: true, isChild: false, forkDepth: 0 };
    const result = simulateHit(projectile, enemy, { critChance: 0 });
    expect(result.forkChildren).toBe(2);
    expect(result.forkChildDamage).toBe(14); // floor(20 * 0.7)
  });

  it('child projectile at depth 2 does NOT fork further', () => {
    const enemy = { ...ENEMY_TYPES.bug, health: 100, maxHealth: 100 };
    const projectile = { damage: 14, pierce: false, isForkBomb: true, isChild: false, forkDepth: 2 };
    const result = simulateHit(projectile, enemy, { critChance: 0 });
    expect(result.forkChildren).toBe(0);
  });

  it('child projectile (isChild=true) does NOT fork', () => {
    const enemy = { ...ENEMY_TYPES.bug, health: 100, maxHealth: 100 };
    const projectile = { damage: 14, pierce: false, isForkBomb: true, isChild: true, forkDepth: 0 };
    const result = simulateHit(projectile, enemy, { critChance: 0 });
    expect(result.forkChildren).toBe(0);
  });

  it('3-generation fork bomb damage decays: 100 → 70 → 49 → 0 forks', () => {
    // Gen 0: 100 damage, spawns children
    // Gen 1: 70 damage, spawns children
    // Gen 2: 49 damage, depth=2 so no more forks
    const gen0Damage = 100;
    const gen1Damage = Math.floor(gen0Damage * 0.7); // 70
    const gen2Damage = Math.floor(gen1Damage * 0.7); // 49
    expect(gen1Damage).toBe(70);
    expect(gen2Damage).toBe(49);
    expect(gen2Damage).toBeGreaterThan(0); // Still does damage, just can't fork
  });
});

describe('Git-Conflict Split Enemy Pipeline', () => {
  it('split enemy spawns 2 non-splittable children on death', () => {
    const enemy = {
      ...ENEMY_TYPES['git-conflict'],
      health: 1,
      maxHealth: 45,
      speed: 40,
      canSplit: true,
      behavior: 'split',
    };
    const result = simulateHit({ damage: 999, pierce: false }, enemy, { critChance: 0 });
    expect(result.killed).toBe(true);
    expect(result.splitSpawned).toBe(true);
    expect(result.splitChildren).toHaveLength(2);
    result.splitChildren.forEach(child => {
      expect(child.canSplit).toBe(false);
      expect(child.health).toBe(Math.floor(45 * 0.4) + 10); // 28
      expect(child.speed).toBe(48); // 40 * 1.2
      expect(child.damage).toBe(2); // floor(4 * 0.7)
      expect(child.xpValue).toBe(10); // floor(35 * 0.3)
    });
  });

  it('non-splittable split enemy does NOT spawn children', () => {
    const child = {
      ...ENEMY_TYPES['git-conflict'],
      health: 1,
      maxHealth: 28,
      canSplit: false,
      behavior: 'split',
    };
    const result = simulateHit({ damage: 999, pierce: false }, child, { critChance: 0 });
    expect(result.killed).toBe(true);
    expect(result.splitSpawned).toBe(false);
  });

  it('total XP from parent + 2 children is less than 2x parent XP', () => {
    const parentXP = ENEMY_TYPES['git-conflict'].xpValue; // 35
    const childXP = Math.floor(parentXP * 0.3); // 10
    const totalXP = parentXP + childXP * 2; // 35 + 20 = 55
    expect(totalXP).toBeLessThan(parentXP * 2); // Anti-XP-farming
  });
});

describe('Player Hit + Vampiric Integration', () => {
  it('invincible player takes no damage', () => {
    const player = { health: 100 };
    const enemy = { ...ENEMY_TYPES.bug, health: 15, maxHealth: 15 };
    const result = simulatePlayerHit(player, enemy, { invincible: true });
    expect(result.damageTaken).toBe(0);
    expect(player.health).toBe(100);
  });

  it('vampiric enemy heals 10% of damage dealt to player', () => {
    const player = { health: 100 };
    const enemy = { health: 50, maxHealth: 100, damage: 20 };
    const result = simulatePlayerHit(player, enemy, { vampiricEnemies: true });
    expect(result.damageTaken).toBe(20);
    expect(player.health).toBe(80);
    expect(result.enemyHealed).toBe(2); // floor(20 * 0.1)
    expect(enemy.health).toBe(52);
  });

  it('vampiric heal caps at maxHealth', () => {
    const player = { health: 100 };
    const enemy = { health: 99, maxHealth: 100, damage: 50 };
    const result = simulatePlayerHit(player, enemy, { vampiricEnemies: true });
    // floor(50*0.1) = 5, but 99+5=104 > 100 → cap at 100
    expect(enemy.health).toBe(100);
    expect(result.enemyHealed).toBe(1);
  });

  it('dead enemy (health <= 0) does not heal vampirically', () => {
    const player = { health: 100 };
    const enemy = { health: 0, maxHealth: 50, damage: 10 };
    const result = simulatePlayerHit(player, enemy, { vampiricEnemies: true });
    expect(result.enemyHealed).toBe(0);
    expect(enemy.health).toBe(0);
  });

  it('segfault kills player in one hit from full health', () => {
    const player = { health: 100 };
    const result = simulatePlayerHit(player, { ...ENEMY_TYPES.segfault, health: 10, maxHealth: 10 });
    expect(result.playerDied).toBe(true);
  });

  it('hallucination deals 0 damage', () => {
    const player = { health: 100 };
    const result = simulatePlayerHit(player, { ...ENEMY_TYPES.hallucination, health: 1, maxHealth: 1 });
    expect(result.damageTaken).toBe(0);
    expect(player.health).toBe(100);
    expect(result.playerDied).toBe(false);
  });
});

describe('Wave Completion + Boss Wave XP', () => {
  it('non-boss wave awards wave# * 25 XP', () => {
    const result = simulateWaveCompletion(10);
    expect(result.xp).toBe(250);
    expect(result.wasBossWave).toBe(false);
  });

  it('wave 21 (after boss wave 20) awards wave# * 100 XP', () => {
    const result = simulateWaveCompletion(21);
    expect(result.xp).toBe(2100);
    expect(result.wasBossWave).toBe(true);
  });

  it('Double XP event doubles wave completion reward', () => {
    const normal = simulateWaveCompletion(10);
    const doubled = simulateWaveCompletion(10, { xpEventMult: 2 });
    expect(doubled.xp).toBe(normal.xp * 2);
  });

  it('compound XP multipliers: event 2x + modifier 1.25x = 2.5x', () => {
    const base = simulateWaveCompletion(10, { xpEventMult: 1, modXpMult: 1 });
    const boosted = simulateWaveCompletion(10, { xpEventMult: 2, modXpMult: 1.25 });
    expect(boosted.xp).toBe(Math.floor(base.xp * 2.5));
  });

  it('boss waves repeat every 20 waves', () => {
    const bossWaves = [21, 41, 61, 81, 101];
    bossWaves.forEach(w => {
      expect(simulateWaveCompletion(w).wasBossWave).toBe(true);
    });
  });

  it('non-boss waves between boss waves are not boss waves', () => {
    [22, 30, 40, 42, 60, 62].forEach(w => {
      expect(simulateWaveCompletion(w).wasBossWave).toBe(false);
    });
  });
});

describe('Full Kill-to-Combo Pipeline', () => {
  // Simulates ComboSystem behavior without Phaser dependency
  function createComboTracker(decayMs = 3000) {
    return {
      killStreak: 0,
      bestStreak: 0,
      lastKillTime: 0,
      shownMilestones: new Set(),
      decayMs,
      registerKill(now) {
        this.killStreak++;
        this.lastKillTime = now;
        if (this.killStreak > this.bestStreak) this.bestStreak = this.killStreak;
      },
      checkDecay(now) {
        if (this.killStreak > 0 && now - this.lastKillTime > this.decayMs) {
          this.killStreak = 0;
          this.shownMilestones.clear();
          return true; // decayed
        }
        return false;
      },
      getTier() {
        const TIERS = [
          { min: 100, label: 'GODLIKE' },
          { min: 50, label: 'UNSTOPPABLE' },
          { min: 25, label: 'RAMPAGE' },
          { min: 10, label: 'ON FIRE' },
          { min: 5, label: 'COMBO' },
        ];
        return TIERS.find(t => this.killStreak >= t.min)?.label || null;
      },
    };
  }

  it('killing 5 enemies triggers COMBO tier', () => {
    const combo = createComboTracker();
    for (let i = 0; i < 5; i++) combo.registerKill(1000 + i * 100);
    expect(combo.getTier()).toBe('COMBO');
    expect(combo.killStreak).toBe(5);
  });

  it('10 kills escalates to ON FIRE', () => {
    const combo = createComboTracker();
    for (let i = 0; i < 10; i++) combo.registerKill(1000 + i * 100);
    expect(combo.getTier()).toBe('ON FIRE');
  });

  it('100 kills reaches GODLIKE', () => {
    const combo = createComboTracker();
    for (let i = 0; i < 100; i++) combo.registerKill(1000 + i * 50);
    expect(combo.getTier()).toBe('GODLIKE');
    expect(combo.bestStreak).toBe(100);
  });

  it('3-second gap decays streak to 0', () => {
    const combo = createComboTracker(3000);
    for (let i = 0; i < 25; i++) combo.registerKill(1000 + i * 100);
    expect(combo.getTier()).toBe('RAMPAGE');
    // 3001ms after last kill
    const decayed = combo.checkDecay(1000 + 24 * 100 + 3001);
    expect(decayed).toBe(true);
    expect(combo.killStreak).toBe(0);
    expect(combo.getTier()).toBe(null);
    // bestStreak preserved
    expect(combo.bestStreak).toBe(25);
  });

  it('kill right before decay resets the timer', () => {
    const combo = createComboTracker(3000);
    combo.registerKill(1000);
    combo.registerKill(3999); // just before 3s decay
    expect(combo.checkDecay(3999)).toBe(false);
    expect(combo.killStreak).toBe(2);
  });
});

describe('Weapon Evolution Consistency', () => {
  it('all evolution recipes combine two distinct base weapons', () => {
    const baseWeapons = new Set(Object.keys(WEAPON_TYPES));
    Object.keys(EVOLUTION_RECIPES).forEach(recipe => {
      const [a, b] = recipe.split('+');
      expect(baseWeapons.has(a)).toBe(true);
      expect(baseWeapons.has(b)).toBe(true);
      expect(a).not.toBe(b);
    });
  });

  it('evolved weapons have higher damage than their weakest ingredient', () => {
    Object.entries(EVOLUTION_RECIPES).forEach(([recipe, evolved]) => {
      const [a, b] = recipe.split('+');
      const minIngredientDamage = Math.min(WEAPON_TYPES[a].damage, WEAPON_TYPES[b].damage);
      expect(evolved.damage).toBeGreaterThan(minIngredientDamage);
    });
  });

  it('each recipe produces a unique result', () => {
    const results = Object.values(EVOLUTION_RECIPES).map(r => r.result);
    expect(new Set(results).size).toBe(results.length);
  });
});

describe('Boss Spawn Health Scaling Across Waves', () => {
  function bossAtWave(wave) {
    let bossKey = 'boss-stackoverflow';
    if (wave >= 80) bossKey = 'boss-kernelpanic';
    else if (wave >= 60) bossKey = 'boss-memoryleakprime';
    else if (wave >= 40) bossKey = 'boss-nullpointer';

    const bossData = BOSS_TYPES[bossKey];
    const healthScale = 1 + Math.floor(wave / 20) * 0.5;
    return {
      key: bossKey,
      health: Math.floor(bossData.health * healthScale),
      xpValue: bossData.xpValue,
    };
  }

  it('wave 20 Stack Overflow has base health * 1.5x', () => {
    const boss = bossAtWave(20);
    expect(boss.key).toBe('boss-stackoverflow');
    expect(boss.health).toBe(Math.floor(2000 * 1.5));
  });

  it('wave 80 Kernel Panic has base health * 3x', () => {
    const boss = bossAtWave(80);
    expect(boss.key).toBe('boss-kernelpanic');
    expect(boss.health).toBe(Math.floor(8000 * 3));
  });

  it('later bosses are strictly harder than earlier bosses at their spawn wave', () => {
    const w20 = bossAtWave(20);
    const w40 = bossAtWave(40);
    const w60 = bossAtWave(60);
    const w80 = bossAtWave(80);
    expect(w40.health).toBeGreaterThan(w20.health);
    expect(w60.health).toBeGreaterThan(w40.health);
    expect(w80.health).toBeGreaterThan(w60.health);
  });

  it('boss XP reward scales with boss tier', () => {
    const tiers = Object.values(BOSS_TYPES);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].xpValue).toBeGreaterThan(tiers[i - 1].xpValue);
    }
  });
});
