import { describe, it, expect } from 'vitest';
import EventManager from '../systems/EventManager.js';

describe('EventManager', () => {
  describe('EVENTS', () => {
    it('has 5 event types', () => {
      expect(Object.keys(EventManager.EVENTS)).toHaveLength(5);
    });

    it('each event has required fields', () => {
      Object.values(EventManager.EVENTS).forEach(event => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('desc');
        expect(event).toHaveProperty('icon');
        expect(event).toHaveProperty('color');
        expect(event).toHaveProperty('duration');
        expect(event).toHaveProperty('effects');
        expect(typeof event.duration).toBe('number');
        expect(event.duration).toBeGreaterThan(0);
      });
    });

    it('each event has a unique id', () => {
      const ids = Object.values(EventManager.EVENTS).map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('DOUBLE_XP has correct xp multiplier', () => {
      expect(EventManager.EVENTS.DOUBLE_XP.effects.xpMultiplier).toBe(2);
    });

    it('CURSE has correct speed modifier', () => {
      expect(EventManager.EVENTS.CURSE.effects.enemySpeedMod).toBe(1.5);
    });
  });

  describe('instance methods', () => {
    function createManager(overrides = {}) {
      const scene = { time: { now: 0 }, ...overrides };
      return new EventManager(scene);
    }

    describe('constructor', () => {
      it('initializes with no active event', () => {
        const mgr = createManager();
        expect(mgr.activeEvent).toBeNull();
        expect(mgr.isEventActive()).toBe(false);
      });

      it('sets default trigger chance and min wave', () => {
        const mgr = createManager();
        expect(mgr.eventTriggerChance).toBe(0.15);
        expect(mgr.minWaveForEvents).toBe(5);
      });
    });

    describe('getActiveEffects', () => {
      it('returns defaults when no event active', () => {
        const mgr = createManager();
        const effects = mgr.getActiveEffects();
        expect(effects.xpMultiplier).toBe(1);
        expect(effects.enemySpeedMod).toBe(1);
        expect(effects.forceRareDrops).toBe(false);
      });

      it('returns event effects when event is active', () => {
        const mgr = createManager();
        mgr.activeEvent = EventManager.EVENTS.DOUBLE_XP;
        const effects = mgr.getActiveEffects();
        expect(effects.xpMultiplier).toBe(2);
      });

      it('returns defaults for effects not in active event', () => {
        const mgr = createManager();
        mgr.activeEvent = EventManager.EVENTS.DOUBLE_XP;
        const effects = mgr.getActiveEffects();
        expect(effects.enemySpeedMod).toBe(1);
        expect(effects.forceRareDrops).toBe(false);
      });
    });

    describe('isEventActive', () => {
      it('returns false initially', () => {
        const mgr = createManager();
        expect(mgr.isEventActive()).toBe(false);
      });

      it('returns true when event is set', () => {
        const mgr = createManager();
        mgr.activeEvent = EventManager.EVENTS.CURSE;
        expect(mgr.isEventActive()).toBe(true);
      });
    });

    describe('tryTriggerEvent', () => {
      it('returns false if event already active', () => {
        const mgr = createManager();
        mgr.activeEvent = EventManager.EVENTS.CURSE;
        expect(mgr.tryTriggerEvent(10)).toBe(false);
      });

      it('returns false for waves below minimum', () => {
        const mgr = createManager();
        expect(mgr.tryTriggerEvent(3)).toBe(false);
      });
    });

    describe('clearEventEffects', () => {
      it('resets scene multipliers to defaults', () => {
        const scene = {
          time: { now: 0 },
          xpEventMultiplier: 2,
          eventEnemySpeedMod: 1.5,
          forceRareDrops: true
        };
        const mgr = new EventManager(scene);
        mgr.clearEventEffects();
        expect(scene.xpEventMultiplier).toBe(1);
        expect(scene.eventEnemySpeedMod).toBe(1);
        expect(scene.forceRareDrops).toBe(false);
      });
    });

    describe('applyEventEffects', () => {
      it('applies xp multiplier to scene', () => {
        const scene = { time: { now: 0 }, xpEventMultiplier: 1 };
        const mgr = new EventManager(scene);
        mgr.applyEventEffects(EventManager.EVENTS.DOUBLE_XP);
        expect(scene.xpEventMultiplier).toBe(2);
      });

      it('applies enemy speed mod to scene', () => {
        const scene = { time: { now: 0 }, eventEnemySpeedMod: 1 };
        const mgr = new EventManager(scene);
        mgr.applyEventEffects(EventManager.EVENTS.CURSE);
        expect(scene.eventEnemySpeedMod).toBe(1.5);
      });

      it('applies force rare drops to scene', () => {
        const scene = { time: { now: 0 }, forceRareDrops: false };
        const mgr = new EventManager(scene);
        mgr.applyEventEffects(EventManager.EVENTS.JACKPOT);
        expect(scene.forceRareDrops).toBe(true);
      });

      it('handles event with no effects', () => {
        const scene = { time: { now: 0 } };
        const mgr = new EventManager(scene);
        // Should not throw
        mgr.applyEventEffects({ effects: null });
      });
    });
  });
});
