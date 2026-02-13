import { describe, it, expect, beforeEach, vi } from 'vitest';
import RebirthManager from '../systems/RebirthManager.js';

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: vi.fn(key => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = val; }),
  removeItem: vi.fn(key => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); })
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('RebirthManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('MILESTONES', () => {
    it('has 5 milestones', () => {
      expect(RebirthManager.MILESTONES).toHaveLength(5);
    });

    it('milestones are in ascending wave order', () => {
      for (let i = 1; i < RebirthManager.MILESTONES.length; i++) {
        expect(RebirthManager.MILESTONES[i].wave).toBeGreaterThan(
          RebirthManager.MILESTONES[i - 1].wave
        );
      }
    });

    it('each milestone has required fields', () => {
      RebirthManager.MILESTONES.forEach(m => {
        expect(m).toHaveProperty('wave');
        expect(m).toHaveProperty('rebirth');
        expect(m).toHaveProperty('name');
        expect(typeof m.wave).toBe('number');
        expect(typeof m.rebirth).toBe('number');
        expect(typeof m.name).toBe('string');
      });
    });

    it('rebirth levels are sequential 1-5', () => {
      const levels = RebirthManager.MILESTONES.map(m => m.rebirth);
      expect(levels).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('load', () => {
    it('returns default state when nothing saved', () => {
      const data = RebirthManager.load();
      expect(data).toEqual({
        rebirthLevel: 0,
        highestWave: 0,
        totalRebirths: 0,
        lifetimeKills: 0
      });
    });

    it('loads saved data from localStorage', () => {
      const saved = { rebirthLevel: 3, highestWave: 160, totalRebirths: 5, lifetimeKills: 999 };
      store[RebirthManager.STORAGE_KEY] = JSON.stringify(saved);

      const data = RebirthManager.load();
      expect(data).toEqual(saved);
    });

    it('returns defaults on corrupted JSON', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      store[RebirthManager.STORAGE_KEY] = '{broken';
      const data = RebirthManager.load();
      expect(data.rebirthLevel).toBe(0);
      expect(spy).toHaveBeenCalledWith('Failed to load rebirth data:', expect.any(SyntaxError));
      spy.mockRestore();
    });
  });

  describe('save', () => {
    it('persists data to localStorage', () => {
      const data = { rebirthLevel: 2, highestWave: 110, totalRebirths: 3, lifetimeKills: 500 };
      RebirthManager.save(data);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        RebirthManager.STORAGE_KEY,
        JSON.stringify(data)
      );
    });
  });

  describe('canRebirth', () => {
    it('returns first milestone when no rebirths and wave >= 50', () => {
      const milestone = RebirthManager.canRebirth(50);
      expect(milestone).not.toBeNull();
      expect(milestone.rebirth).toBe(1);
      expect(milestone.name).toBe('JUNIOR DEV');
    });

    it('returns null when wave is too low', () => {
      expect(RebirthManager.canRebirth(10)).toBeNull();
      expect(RebirthManager.canRebirth(49)).toBeNull();
    });

    it('returns highest available milestone for high waves', () => {
      const milestone = RebirthManager.canRebirth(250);
      expect(milestone.rebirth).toBe(5);
      expect(milestone.name).toBe('ARCHITECT');
    });

    it('returns null when already at max rebirth level', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 5, highestWave: 300, totalRebirths: 10, lifetimeKills: 5000
      });
      expect(RebirthManager.canRebirth(300)).toBeNull();
    });

    it('returns next available milestone after current rebirth', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 2, highestWave: 100, totalRebirths: 2, lifetimeKills: 200
      });
      const milestone = RebirthManager.canRebirth(150);
      expect(milestone.rebirth).toBe(3);
      expect(milestone.name).toBe('SENIOR DEV');
    });
  });

  describe('performRebirth', () => {
    it('updates rebirth level to milestone', () => {
      const result = RebirthManager.performRebirth(50, 100);
      expect(result.rebirthLevel).toBe(1);
      expect(result.totalRebirths).toBe(1);
      expect(result.lifetimeKills).toBe(100);
    });

    it('tracks highest wave', () => {
      const result = RebirthManager.performRebirth(75, 50);
      expect(result.highestWave).toBe(75);
    });

    it('does not lower highest wave on subsequent rebirth', () => {
      // First rebirth at wave 75
      RebirthManager.performRebirth(75, 50);
      // Second rebirth at wave 100 (lower than stored highest could hypothetically be higher)
      const result = RebirthManager.performRebirth(100, 80);
      expect(result.highestWave).toBe(100);
    });

    it('returns unchanged data when no milestone available', () => {
      const result = RebirthManager.performRebirth(10, 5);
      expect(result.rebirthLevel).toBe(0);
      expect(result.totalRebirths).toBe(0);
    });

    it('accumulates lifetime kills', () => {
      RebirthManager.performRebirth(50, 100);
      const result = RebirthManager.performRebirth(100, 200);
      expect(result.lifetimeKills).toBe(300);
    });
  });

  describe('getAllStatsMultiplier', () => {
    it('returns 1.0 with no rebirths', () => {
      expect(RebirthManager.getAllStatsMultiplier()).toBe(1);
    });

    it('returns 1.05 at rebirth level 1', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 1, highestWave: 50, totalRebirths: 1, lifetimeKills: 0
      });
      expect(RebirthManager.getAllStatsMultiplier()).toBeCloseTo(1.05);
    });

    it('returns 1.25 at rebirth level 5', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 5, highestWave: 250, totalRebirths: 5, lifetimeKills: 0
      });
      expect(RebirthManager.getAllStatsMultiplier()).toBeCloseTo(1.25);
    });
  });

  describe('getXPMultiplier', () => {
    it('returns 1.0 with no rebirths', () => {
      expect(RebirthManager.getXPMultiplier()).toBe(1);
    });

    it('scales by 10% per rebirth level', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 3, highestWave: 150, totalRebirths: 3, lifetimeKills: 0
      });
      expect(RebirthManager.getXPMultiplier()).toBeCloseTo(1.3);
    });
  });

  describe('getStartingWeaponCount', () => {
    it('returns 0 with no rebirths', () => {
      expect(RebirthManager.getStartingWeaponCount()).toBe(0);
    });

    it('returns rebirth level up to cap of 3', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 2, highestWave: 100, totalRebirths: 2, lifetimeKills: 0
      });
      expect(RebirthManager.getStartingWeaponCount()).toBe(2);
    });

    it('caps at 3 for high rebirth levels', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 5, highestWave: 250, totalRebirths: 5, lifetimeKills: 0
      });
      expect(RebirthManager.getStartingWeaponCount()).toBe(3);
    });
  });

  describe('getStartingWeapons', () => {
    it('returns empty array with no rebirths', () => {
      expect(RebirthManager.getStartingWeapons()).toEqual([]);
    });

    it('returns correct number of weapons', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 2, highestWave: 100, totalRebirths: 2, lifetimeKills: 0
      });
      const weapons = RebirthManager.getStartingWeapons();
      expect(weapons).toHaveLength(2);
    });

    it('returns weapons from the valid pool', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 3, highestWave: 150, totalRebirths: 3, lifetimeKills: 0
      });
      const validPool = ['spread', 'pierce', 'rapid', 'homing', 'bounce', 'aoe', 'freeze'];
      const weapons = RebirthManager.getStartingWeapons();
      weapons.forEach(w => {
        expect(validPool).toContain(w);
      });
    });

    it('returns no duplicate weapons', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 5, highestWave: 250, totalRebirths: 5, lifetimeKills: 0
      });
      const weapons = RebirthManager.getStartingWeapons();
      expect(new Set(weapons).size).toBe(weapons.length);
    });
  });

  describe('getRebirthInfo', () => {
    it('returns INTERN name at level 0', () => {
      const info = RebirthManager.getRebirthInfo();
      expect(info.name).toBe('INTERN');
      expect(info.level).toBe(0);
    });

    it('returns correct milestone name', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 3, highestWave: 160, totalRebirths: 4, lifetimeKills: 800
      });
      const info = RebirthManager.getRebirthInfo();
      expect(info.name).toBe('SENIOR DEV');
      expect(info.level).toBe(3);
    });

    it('calculates bonus percentages correctly', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 2, highestWave: 110, totalRebirths: 3, lifetimeKills: 500
      });
      const info = RebirthManager.getRebirthInfo();
      expect(info.allStatsBonus).toBe(10); // 2 * 5%
      expect(info.xpBonus).toBe(20);       // 2 * 10%
    });

    it('includes next milestone info', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 2, highestWave: 100, totalRebirths: 2, lifetimeKills: 0
      });
      const info = RebirthManager.getRebirthInfo();
      expect(info.nextMilestone).toBeDefined();
      expect(info.nextMilestone.rebirth).toBe(3);
    });

    it('has no next milestone at max level', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 5, highestWave: 300, totalRebirths: 10, lifetimeKills: 5000
      });
      const info = RebirthManager.getRebirthInfo();
      expect(info.nextMilestone).toBeUndefined();
    });

    it('includes lifetime stats', () => {
      store[RebirthManager.STORAGE_KEY] = JSON.stringify({
        rebirthLevel: 1, highestWave: 55, totalRebirths: 2, lifetimeKills: 300
      });
      const info = RebirthManager.getRebirthInfo();
      expect(info.totalRebirths).toBe(2);
      expect(info.lifetimeKills).toBe(300);
      expect(info.highestWave).toBe(55);
    });
  });
});
