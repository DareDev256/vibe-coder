import { describe, it, expect, beforeEach } from 'vitest';
import SpatialHash from '../utils/SpatialHash.js';

describe('SpatialHash', () => {
  let hash;

  beforeEach(() => {
    hash = new SpatialHash(100);
  });

  describe('constructor', () => {
    it('uses provided cell size', () => {
      const h = new SpatialHash(50);
      expect(h.cellSize).toBe(50);
    });

    it('defaults to cell size 100', () => {
      const h = new SpatialHash();
      expect(h.cellSize).toBe(100);
    });

    it('starts with empty grid', () => {
      expect(hash.grid.size).toBe(0);
    });
  });

  describe('getCellKey', () => {
    it('maps position to cell coordinates', () => {
      expect(hash.getCellKey(150, 250)).toBe('1,2');
    });

    it('handles origin', () => {
      expect(hash.getCellKey(0, 0)).toBe('0,0');
    });

    it('handles negative coordinates', () => {
      expect(hash.getCellKey(-50, -150)).toBe('-1,-2');
    });

    it('maps positions within same cell to same key', () => {
      expect(hash.getCellKey(10, 10)).toBe(hash.getCellKey(99, 99));
    });

    it('maps positions in different cells to different keys', () => {
      expect(hash.getCellKey(50, 50)).not.toBe(hash.getCellKey(150, 150));
    });
  });

  describe('insert', () => {
    it('inserts active entity into correct cell', () => {
      const entity = { x: 150, y: 250, active: true };
      hash.insert(entity);
      expect(hash.grid.get('1,2')).toContain(entity);
    });

    it('ignores inactive entities', () => {
      hash.insert({ x: 0, y: 0, active: false });
      expect(hash.grid.size).toBe(0);
    });

    it('ignores null/undefined', () => {
      hash.insert(null);
      hash.insert(undefined);
      expect(hash.grid.size).toBe(0);
    });

    it('adds multiple entities to the same cell', () => {
      const a = { x: 10, y: 10, active: true };
      const b = { x: 20, y: 20, active: true };
      hash.insert(a);
      hash.insert(b);
      const cell = hash.grid.get('0,0');
      expect(cell).toHaveLength(2);
      expect(cell).toContain(a);
      expect(cell).toContain(b);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      hash.insert({ x: 0, y: 0, active: true });
      hash.insert({ x: 200, y: 200, active: true });
      expect(hash.grid.size).toBe(2);
      hash.clear();
      expect(hash.grid.size).toBe(0);
    });
  });

  describe('getCell', () => {
    it('returns entities in the cell at position', () => {
      const entity = { x: 50, y: 50, active: true };
      hash.insert(entity);
      expect(hash.getCell(50, 50)).toContain(entity);
    });

    it('returns empty array for empty cells', () => {
      expect(hash.getCell(999, 999)).toEqual([]);
    });
  });

  describe('getNearby', () => {
    it('finds entities within radius', () => {
      const entity = { x: 50, y: 50, active: true };
      hash.insert(entity);
      const nearby = hash.getNearby(60, 60, 50);
      expect(nearby).toContain(entity);
    });

    it('excludes entities outside radius', () => {
      const entity = { x: 500, y: 500, active: true };
      hash.insert(entity);
      const nearby = hash.getNearby(0, 0, 50);
      expect(nearby).toHaveLength(0);
    });

    it('excludes inactive entities', () => {
      const entity = { x: 50, y: 50, active: true };
      hash.insert(entity);
      entity.active = false;
      const nearby = hash.getNearby(50, 50, 100);
      expect(nearby).toHaveLength(0);
    });

    it('finds entities across cell boundaries', () => {
      // Entity in cell (0,0), query from cell (1,0) with large radius
      const entity = { x: 95, y: 50, active: true };
      hash.insert(entity);
      const nearby = hash.getNearby(105, 50, 50);
      expect(nearby).toContain(entity);
    });

    it('returns empty array with no entities', () => {
      expect(hash.getNearby(0, 0, 100)).toEqual([]);
    });

    it('uses precise distance check, not just cell membership', () => {
      // Entity at corner of cell — should only match within actual radius
      const entity = { x: 0, y: 0, active: true };
      hash.insert(entity);
      // Distance from (0,0) to (70,70) ≈ 99, which is within 100
      expect(hash.getNearby(70, 70, 100)).toContain(entity);
      // Distance from (0,0) to (80,80) ≈ 113, which is outside 100
      expect(hash.getNearby(80, 80, 100)).toHaveLength(0);
    });
  });
});
