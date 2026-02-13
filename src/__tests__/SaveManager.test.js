import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SaveManager from '../systems/SaveManager.js';

describe('SaveManager', () => {
  describe('getTimeAgo', () => {
    it('returns "just now" for timestamps less than 60 seconds ago', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 30000)).toBe('just now');
    });

    it('returns minutes for timestamps less than 1 hour ago', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 5 * 60 * 1000)).toBe('5m ago');
    });

    it('returns hours for timestamps less than 24 hours ago', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 3 * 60 * 60 * 1000)).toBe('3h ago');
    });

    it('returns days for timestamps more than 24 hours ago', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago');
    });

    it('handles edge at exactly 60 seconds', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 60 * 1000)).toBe('1m ago');
    });

    it('handles edge at exactly 1 hour', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 3600 * 1000)).toBe('1h ago');
    });

    it('handles edge at exactly 24 hours', () => {
      const now = Date.now();
      expect(SaveManager.getTimeAgo(now - 86400 * 1000)).toBe('1d ago');
    });
  });

  describe('SAVE_KEY', () => {
    it('has expected storage key', () => {
      expect(SaveManager.SAVE_KEY).toBe('vibeCoderRunSave');
    });
  });

  // ── localStorage-backed persistence tests ──
  describe('persistence lifecycle', () => {
    let store;

    beforeEach(() => {
      // Mock localStorage as a simple in-memory store
      store = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, val) => { store[key] = val; }),
        removeItem: vi.fn((key) => { delete store[key]; })
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // Helper: valid save data matching SaveManager.saveRun's expected shape
    const validRunData = () => ({
      wave: 12,
      stage: 1,
      player: {
        level: 8, xp: 350, totalXP: 4200,
        health: 150, maxHealth: 200, kills: 47, streak: 5
      },
      weapons: {
        current: { type: 'spread', duration: 15000, isEvolved: false },
        collected: ['basic', 'spread', 'pierce']
      },
      modifiers: ['glass_cannon']
    });

    describe('saveRun', () => {
      it('returns true on successful save', () => {
        expect(SaveManager.saveRun(validRunData())).toBe(true);
      });

      it('stores data under the correct key', () => {
        SaveManager.saveRun(validRunData());
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'vibeCoderRunSave',
          expect.any(String)
        );
      });

      it('saved data includes timestamp and version', () => {
        SaveManager.saveRun(validRunData());
        const saved = JSON.parse(store['vibeCoderRunSave']);
        expect(saved.timestamp).toBeGreaterThan(0);
        expect(saved.version).toBe(2);
      });

      it('preserves wave and stage', () => {
        SaveManager.saveRun(validRunData());
        const saved = JSON.parse(store['vibeCoderRunSave']);
        expect(saved.wave).toBe(12);
        expect(saved.stage).toBe(1);
      });

      it('preserves player stats', () => {
        SaveManager.saveRun(validRunData());
        const saved = JSON.parse(store['vibeCoderRunSave']);
        expect(saved.player.level).toBe(8);
        expect(saved.player.kills).toBe(47);
        expect(saved.player.health).toBe(150);
        expect(saved.player.maxHealth).toBe(200);
      });

      it('converts collected weapons Set-like array to plain array', () => {
        SaveManager.saveRun(validRunData());
        const saved = JSON.parse(store['vibeCoderRunSave']);
        expect(Array.isArray(saved.weapons.collected)).toBe(true);
        expect(saved.weapons.collected).toContain('spread');
      });

      it('returns false when localStorage throws', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem.mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });
        expect(SaveManager.saveRun(validRunData())).toBe(false);
        expect(spy).toHaveBeenCalledWith('Failed to save run:', expect.any(Error));
        spy.mockRestore();
      });
    });

    describe('loadRun', () => {
      it('returns null when no save exists', () => {
        expect(SaveManager.loadRun()).toBeNull();
      });

      it('returns saved data when valid save exists', () => {
        SaveManager.saveRun(validRunData());
        const loaded = SaveManager.loadRun();
        expect(loaded).not.toBeNull();
        expect(loaded.wave).toBe(12);
      });

      it('returns null for expired saves (>24h)', () => {
        // Manually store an old save
        const oldSave = { ...validRunData(), timestamp: Date.now() - 25 * 60 * 60 * 1000, version: 2 };
        store['vibeCoderRunSave'] = JSON.stringify(oldSave);
        expect(SaveManager.loadRun()).toBeNull();
      });

      it('clears expired saves from storage', () => {
        const oldSave = { ...validRunData(), timestamp: Date.now() - 25 * 60 * 60 * 1000, version: 2 };
        store['vibeCoderRunSave'] = JSON.stringify(oldSave);
        SaveManager.loadRun();
        expect(localStorage.removeItem).toHaveBeenCalledWith('vibeCoderRunSave');
      });

      it('returns null for corrupted JSON', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        store['vibeCoderRunSave'] = '{invalid json!!!';
        expect(SaveManager.loadRun()).toBeNull();
        expect(spy).toHaveBeenCalledWith('Failed to load run:', expect.any(SyntaxError));
        spy.mockRestore();
      });
    });

    describe('hasSave', () => {
      it('returns false when no save exists', () => {
        expect(SaveManager.hasSave()).toBe(false);
      });

      it('returns true when valid save exists', () => {
        SaveManager.saveRun(validRunData());
        expect(SaveManager.hasSave()).toBe(true);
      });
    });

    describe('clearSave', () => {
      it('removes save from storage', () => {
        SaveManager.saveRun(validRunData());
        SaveManager.clearSave();
        expect(localStorage.removeItem).toHaveBeenCalledWith('vibeCoderRunSave');
      });

      it('hasSave returns false after clear', () => {
        SaveManager.saveRun(validRunData());
        SaveManager.clearSave();
        expect(SaveManager.hasSave()).toBe(false);
      });
    });

    describe('getSaveSummary', () => {
      it('returns null when no save exists', () => {
        expect(SaveManager.getSaveSummary()).toBeNull();
      });

      it('returns summary with expected fields', () => {
        SaveManager.saveRun(validRunData());
        const summary = SaveManager.getSaveSummary();
        expect(summary).toHaveProperty('wave', 12);
        expect(summary).toHaveProperty('stage', 1);
        expect(summary).toHaveProperty('level', 8);
        expect(summary).toHaveProperty('kills', 47);
        expect(summary).toHaveProperty('timestamp');
        expect(summary).toHaveProperty('timeAgo');
      });

      it('timeAgo is "just now" for fresh save', () => {
        SaveManager.saveRun(validRunData());
        const summary = SaveManager.getSaveSummary();
        expect(summary.timeAgo).toBe('just now');
      });
    });
  });
});
