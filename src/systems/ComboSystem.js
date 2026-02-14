import * as Audio from '../utils/audio.js';

/**
 * ComboSystem — Tracks kill streaks and renders combo HUD.
 *
 * Tier thresholds:
 *   5+  COMBO        cyan
 *  10+  ON FIRE      yellow
 *  25+  RAMPAGE      orange
 *  50+  UNSTOPPABLE  red
 * 100+  GODLIKE      magenta
 *
 * Milestones at 10x/25x/50x/100x trigger a punch-in popup,
 * camera shake, and audio cue.  Streak resets after 3 s of no kills.
 */

const TIERS = [
  { min: 100, color: '#ff00ff', label: 'GODLIKE' },
  { min: 50, color: '#ff4444', label: 'UNSTOPPABLE' },
  { min: 25, color: '#ffaa00', label: 'RAMPAGE' },
  { min: 10, color: '#ffff00', label: 'ON FIRE' },
  { min: 5, color: '#00ffff', label: 'COMBO' },
];

const MILESTONES = [
  { threshold: 10, label: 'KILL STREAK!', color: '#00ff88' },
  { threshold: 25, label: 'RAMPAGE!', color: '#ffaa00' },
  { threshold: 50, label: 'UNSTOPPABLE!', color: '#ff4444' },
  { threshold: 100, label: 'G O D L I K E', color: '#ff00ff' },
];

export default class ComboSystem {
  /**
   * @param {Phaser.Scene} scene  – owning scene (tweens, cameras, add)
   * @param {{ decayMs?: number }} opts
   */
  constructor(scene, { decayMs = 3000 } = {}) {
    this.scene = scene;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.bestStreak = 0;
    this.decayMs = decayMs;
    this.shownMilestones = new Set();

    // HUD references (created in createHUD)
    this.comboText = null;
    this.comboLabel = null;
    this.pulseTween = null;
  }

  // ─── HUD ────────────────────────────────────

  /** Create the on-screen combo counter + label. Call once after scene HUD setup. */
  createHUD(x = 400, y = 95) {
    this.comboText = this.scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(100);

    this.comboLabel = this.scene.add.text(x, y + 20, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(100);
  }

  // ─── Public API ─────────────────────────────

  /** Call on every enemy kill. Updates streak, HUD, and fires milestones. */
  registerKill() {
    this.killStreak++;
    this.lastKillTime = Date.now();
    window.VIBE_CODER.streak = this.killStreak;

    if (this.killStreak > this.bestStreak) {
      this.bestStreak = this.killStreak;
    }

    this._updateDisplay();
    this._checkMilestone();
  }

  /** Call from scene.update() — decays streak after idle period. */
  checkDecay() {
    if (this.killStreak > 0 && Date.now() - this.lastKillTime > this.decayMs) {
      this.killStreak = 0;
      window.VIBE_CODER.streak = 0;
      this.shownMilestones.clear();
      this._fadeOut();
    }
  }

  /** Reset all state (e.g. on player death / restart). */
  reset() {
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.shownMilestones.clear();
    window.VIBE_CODER.streak = 0;
    if (this.comboText) this.comboText.setAlpha(0);
    if (this.comboLabel) this.comboLabel.setAlpha(0);
  }

  /** Best streak achieved this session. */
  getBestStreak() {
    return this.bestStreak;
  }

  // ─── Internal ───────────────────────────────

  /** @private */
  _updateDisplay() {
    if (!this.comboText || !this.comboLabel) return;

    if (this.killStreak < 3) {
      this.comboText.setAlpha(0);
      this.comboLabel.setAlpha(0);
      return;
    }

    const tier = TIERS.find(t => this.killStreak >= t.min) || { color: '#ffffff', label: 'COMBO' };

    this.comboText.setText(`${this.killStreak}x`);
    this.comboText.setColor(tier.color);
    this.comboText.setAlpha(1);
    this.comboLabel.setText(tier.label);
    this.comboLabel.setColor(tier.color);
    this.comboLabel.setAlpha(0.7);

    // Pulse on each kill
    if (this.pulseTween) this.pulseTween.stop();
    this.comboText.setScale(1.3);
    this.pulseTween = this.scene.tweens.add({
      targets: this.comboText,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /** @private */
  _checkMilestone() {
    for (const m of MILESTONES) {
      if (this.killStreak === m.threshold && !this.shownMilestones.has(m.threshold)) {
        this.shownMilestones.add(m.threshold);
        this._showMilestone(m.label, m.color, m.threshold);
        break;
      }
    }
  }

  /** @private */
  _showMilestone(label, color, count) {
    const popup = this.scene.add.text(400, 200, `⚡ ${count}x ${label} ⚡`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setScale(0.5).setAlpha(0);

    // Punch-in → settle → fade-out
    this.scene.tweens.add({
      targets: popup,
      scale: 1.2,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: popup,
          scale: 1,
          duration: 150,
          onComplete: () => {
            this.scene.tweens.add({
              targets: popup,
              y: 180,
              alpha: 0,
              duration: 1200,
              delay: 800,
              ease: 'Power2',
              onComplete: () => popup.destroy(),
            });
          },
        });
      },
    });

    // Camera shake scaled to milestone tier
    const intensity = Math.min(0.005 + count * 0.0002, 0.02);
    this.scene.cameras.main.shake(200, intensity);

    Audio.playLevelUp();
  }

  /** @private */
  _fadeOut() {
    if (this.comboText?.alpha > 0) {
      this.scene.tweens.add({
        targets: [this.comboText, this.comboLabel],
        alpha: 0,
        duration: 400,
        ease: 'Power2',
      });
    }
  }
}

// Re-export constants for testing
export { TIERS, MILESTONES };
