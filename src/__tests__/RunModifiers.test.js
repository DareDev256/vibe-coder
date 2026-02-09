import { describe, it, expect } from 'vitest';
import RunModifiers from '../systems/RunModifiers.js';

describe('RunModifiers', () => {
  describe('MODIFIERS', () => {
    it('has 5 defined modifiers', () => {
      expect(Object.keys(RunModifiers.MODIFIERS)).toHaveLength(5);
    });

    it('each modifier has required fields', () => {
      Object.values(RunModifiers.MODIFIERS).forEach(mod => {
        expect(mod).toHaveProperty('id');
        expect(mod).toHaveProperty('name');
        expect(mod).toHaveProperty('desc');
        expect(mod).toHaveProperty('icon');
        expect(mod).toHaveProperty('color');
        expect(mod).toHaveProperty('effects');
      });
    });

    it('each modifier has a unique id', () => {
      const ids = Object.values(RunModifiers.MODIFIERS).map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('selectModifiers', () => {
    it('selects the requested number of modifiers', () => {
      const selected = RunModifiers.selectModifiers(2);
      expect(selected).toHaveLength(2);
    });

    it('selects 1 modifier by default', () => {
      const selected = RunModifiers.selectModifiers();
      expect(selected).toHaveLength(1);
    });

    it('does not select duplicates', () => {
      const selected = RunModifiers.selectModifiers(5);
      const ids = selected.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('caps at total number of available modifiers', () => {
      const selected = RunModifiers.selectModifiers(100);
      expect(selected).toHaveLength(5);
    });

    it('returns valid modifier objects', () => {
      const selected = RunModifiers.selectModifiers(3);
      selected.forEach(mod => {
        expect(mod).toHaveProperty('id');
        expect(mod).toHaveProperty('effects');
      });
    });
  });

  describe('getCombinedEffects', () => {
    it('returns defaults with no modifiers', () => {
      const effects = RunModifiers.getCombinedEffects([]);
      expect(effects.damageMultiplier).toBe(1);
      expect(effects.healthMultiplier).toBe(1);
      expect(effects.vampiricEnemies).toBe(false);
    });

    it('applies single modifier effects', () => {
      const effects = RunModifiers.getCombinedEffects([
        RunModifiers.MODIFIERS.GLASS_CANNON
      ]);
      expect(effects.damageMultiplier).toBe(2);
      expect(effects.healthMultiplier).toBe(0.5);
    });

    it('multiplies numeric effects across modifiers', () => {
      const effects = RunModifiers.getCombinedEffects([
        RunModifiers.MODIFIERS.GLASS_CANNON,
        RunModifiers.MODIFIERS.BULLET_HELL
      ]);
      // GLASS_CANNON: damageMultiplier = 2, BULLET_HELL: projectileCount = 2
      expect(effects.damageMultiplier).toBe(2);
      expect(effects.projectileCount).toBe(2);
      expect(effects.healthMultiplier).toBe(0.5);
      expect(effects.enemyCountMult).toBe(1.5);
    });

    it('ORs boolean flags together', () => {
      const effects = RunModifiers.getCombinedEffects([
        RunModifiers.MODIFIERS.VAMPIRIC_ENEMIES,
        RunModifiers.MODIFIERS.MARATHON
      ]);
      expect(effects.vampiricEnemies).toBe(true);
      expect(effects.xpMult).toBe(1.25);
    });

    it('handles modifiers with no effects gracefully', () => {
      const effects = RunModifiers.getCombinedEffects([
        { id: 'test', name: 'test', effects: null }
      ]);
      expect(effects.damageMultiplier).toBe(1);
    });

    it('combines all 5 modifiers without error', () => {
      const allMods = Object.values(RunModifiers.MODIFIERS);
      const effects = RunModifiers.getCombinedEffects(allMods);
      expect(effects.vampiricEnemies).toBe(true);
      expect(effects.damageMultiplier).toBe(2);
      expect(effects.healthMultiplier).toBe(0.5);
    });
  });

  describe('getById', () => {
    it('finds modifier by id', () => {
      const mod = RunModifiers.getById('glass_cannon');
      expect(mod).toBeDefined();
      expect(mod.name).toBe('GLASS CANNON');
    });

    it('returns null for unknown id', () => {
      expect(RunModifiers.getById('nonexistent')).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns all modifiers', () => {
      const all = RunModifiers.getAll();
      expect(all).toHaveLength(5);
    });

    it('returns modifier objects with ids', () => {
      RunModifiers.getAll().forEach(mod => {
        expect(typeof mod.id).toBe('string');
      });
    });
  });
});
