import { describe, it, expect, vi } from 'vitest';
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
});
