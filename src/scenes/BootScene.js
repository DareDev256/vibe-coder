import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00ffff'
    }).setOrigin(0.5);

    // Load the actual Hunter's Warglaive image
    this.load.image('legendary-huntersWarglaive', '/assets/hunters-warglaive.png');

    // We'll generate textures in create() instead of loading sprite sheets
    this.time.delayedCall(500, () => {
      loadingText.destroy();
    });
  }

  create() {
    // Generate all game textures programmatically
    // Now with animation frames!
    this.generatePlayerSpriteSheet();
    this.generateBugSpriteSheet();
    this.generateGlitchSpriteSheet();
    this.generateMemoryLeakSpriteSheet();
    this.generateSlashTexture();

    // Weapon pickup textures
    this.generateSpreadWeaponTexture();
    this.generatePierceWeaponTexture();
    this.generateOrbitalWeaponTexture();
    this.generateRapidWeaponTexture();
    // New weapon textures
    this.generateHomingWeaponTexture();
    this.generateBounceWeaponTexture();
    this.generateAoeWeaponTexture();
    this.generateFreezeWeaponTexture();

    // Rare weapon textures
    this.generateRmRfWeaponTexture();
    this.generateSudoWeaponTexture();
    this.generateForkBombWeaponTexture();

    // New enemy types (animated)
    this.generateSyntaxErrorSpriteSheet();
    this.generateInfiniteLoopSpriteSheet();
    this.generateRaceConditionSpriteSheet();

    // NEW coding + AI themed enemies
    this.generateSegfaultTexture();
    this.generateDependencyHellTexture();
    this.generateStackOverflowTexture();
    this.generateHallucinationTexture();
    this.generateTokenOverflowTexture();
    this.generateContextLossTexture();
    this.generatePromptInjectionTexture();

    // Mini-boss texture
    this.generateMiniBossTexture();

    // Boss textures
    this.generateStackOverflowBossTexture();
    this.generateNullPointerBossTexture();
    this.generateMemoryLeakPrimeBossTexture();
    this.generateKernelPanicBossTexture();

    // Evolved weapon textures
    this.generateLaserBeamWeaponTexture();
    this.generatePlasmaOrbWeaponTexture();
    this.generateChainLightningWeaponTexture();
    // New evolved weapon textures
    this.generateBulletHellWeaponTexture();
    this.generateRingOfFireWeaponTexture();
    this.generateSeekingMissileWeaponTexture();
    this.generateChaosBounceWeaponTexture();
    this.generateDeathAuraWeaponTexture();
    this.generateIceLanceWeaponTexture();
    this.generateSwarmWeaponTexture();
    this.generateBlizzardWeaponTexture();

    // Melee weapon textures
    this.generateSwordTexture();
    this.generateSpearTexture();
    this.generateBoomerangTexture();
    this.generateKunaiTexture();

    // Legendary weapon textures
    // Hunter's Warglaive loaded from actual image in preload()
    this.generateVoidReaperTexture();
    this.generateCelestialBladeTexture();

    // Register all animations
    this.registerAnimations();

    console.log('Textures and animations generated! Starting title...');
    this.scene.start('TitleScene');
  }

  registerAnimations() {
    // Player animations
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'player-walk-down',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'player-walk-up',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'player-walk-side',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1
    });

    // Bug enemy animations
    this.anims.create({
      key: 'bug-walk',
      frames: this.anims.generateFrameNumbers('bug', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // Glitch enemy animations
    this.anims.create({
      key: 'glitch-move',
      frames: this.anims.generateFrameNumbers('glitch', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1
    });

    // Memory leak animations
    this.anims.create({
      key: 'memory-leak-pulse',
      frames: this.anims.generateFrameNumbers('memory-leak', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });

    // Syntax error animations
    this.anims.create({
      key: 'syntax-error-flash',
      frames: this.anims.generateFrameNumbers('syntax-error', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    // Infinite loop animations
    this.anims.create({
      key: 'infinite-loop-spin',
      frames: this.anims.generateFrameNumbers('infinite-loop', { start: 0, end: 5 }),
      frameRate: 12,
      repeat: -1
    });

    // Race condition animations
    this.anims.create({
      key: 'race-condition-flicker',
      frames: this.anims.generateFrameNumbers('race-condition', { start: 0, end: 3 }),
      frameRate: 15,
      repeat: -1
    });
  }

  generatePlayerSpriteSheet() {
    const size = 48;
    const frames = 16; // 4 idle + 4 walk down + 4 walk up + 4 walk side
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Draw all frames in a horizontal strip
    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Animation variables
      const isIdle = f < 4;
      const isWalkDown = f >= 4 && f < 8;
      const isWalkUp = f >= 8 && f < 12;
      const isWalkSide = f >= 12;
      const frameInAnim = f % 4;

      // Breathing/bobbing effect for idle
      const breathOffset = isIdle ? Math.sin(frameInAnim * Math.PI / 2) * 2 : 0;
      // Walking bob
      const walkBob = !isIdle ? Math.sin(frameInAnim * Math.PI / 2) * 3 : 0;

      // Outer glow (pulsing for idle)
      const glowAlpha = isIdle ? 0.15 + Math.sin(frameInAnim * Math.PI / 2) * 0.1 : 0.2;
      g.fillStyle(0x00ffff, glowAlpha);
      g.fillCircle(cx, cy, size/2);

      // Body (dark purple)
      g.fillStyle(0x1a0a2e, 1);
      g.fillRoundedRect(cx - 12, cy - 8 + breathOffset + walkBob, 24, 28, 4);

      // Hood
      g.fillStyle(0x2d1b4e, 1);
      g.fillTriangle(
        cx, cy - 16 + breathOffset + walkBob,
        cx - 14, cy + breathOffset + walkBob,
        cx + 14, cy + breathOffset + walkBob
      );

      // Legs (visible when walking)
      if (!isIdle) {
        g.fillStyle(0x1a0a2e, 1);
        // Left leg
        g.fillRect(cx - 8, cy + 16 + walkBob, 6, 8 + (frameInAnim % 2 === 0 ? 2 : -2));
        // Right leg
        g.fillRect(cx + 2, cy + 16 + walkBob, 6, 8 + (frameInAnim % 2 === 1 ? 2 : -2));
      }

      // Cyan tron lines
      g.lineStyle(2, 0x00ffff, 1);
      g.lineBetween(cx - 8, cy + 2 + breathOffset + walkBob, cx - 8, cy + 16 + breathOffset + walkBob);
      g.lineBetween(cx + 8, cy + 2 + breathOffset + walkBob, cx + 8, cy + 16 + breathOffset + walkBob);
      g.lineBetween(cx - 6, cy + 16 + breathOffset + walkBob, cx + 6, cy + 16 + breathOffset + walkBob);

      // Eye position based on direction
      let eyeOffsetX = 0;
      let eyeOffsetY = 0;
      if (isWalkUp) eyeOffsetY = -1;
      if (isWalkDown) eyeOffsetY = 1;
      if (isWalkSide) eyeOffsetX = 2;

      // Glowing eyes
      g.fillStyle(0x00ffff, 1);
      g.fillCircle(cx - 5 + eyeOffsetX, cy - 4 + breathOffset + walkBob + eyeOffsetY, 3);
      g.fillCircle(cx + 5 + eyeOffsetX, cy - 4 + breathOffset + walkBob + eyeOffsetY, 3);

      // Inner eye glow
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx - 5 + eyeOffsetX, cy - 4 + breathOffset + walkBob + eyeOffsetY, 1);
      g.fillCircle(cx + 5 + eyeOffsetX, cy - 4 + breathOffset + walkBob + eyeOffsetY, 1);
    }

    // Generate to a temporary texture first
    g.generateTexture('player-temp', size * frames, size);
    g.destroy();

    // Get the canvas and add as a proper spritesheet
    const tempTexture = this.textures.get('player-temp');
    this.textures.addSpriteSheet('player', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });

    // Remove the temp texture
    this.textures.remove('player-temp');
  }

  generateBugSpriteSheet() {
    const size = 32;
    const frames = 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Leg animation offsets
      const legPhase = (f / frames) * Math.PI * 2;
      const legWave1 = Math.sin(legPhase) * 3;
      const legWave2 = Math.sin(legPhase + Math.PI * 0.66) * 3;
      const legWave3 = Math.sin(legPhase + Math.PI * 1.33) * 3;

      // Body segments
      g.fillStyle(0x0a4a0a, 1);
      g.fillEllipse(cx, cy, 20, 24);

      // Shell
      g.fillStyle(0x1a8a1a, 1);
      g.fillEllipse(cx, cy - 2, 16, 18);

      // Shell line
      g.lineStyle(2, 0x0a4a0a, 1);
      g.lineBetween(cx, cy - 10, cx, cy + 8);

      // Glowing segments (pulsing)
      const glowPulse = 0.6 + Math.sin(f * Math.PI / 2) * 0.4;
      g.fillStyle(0x00ff00, glowPulse);
      g.fillCircle(cx, cy - 4, 3);
      g.fillCircle(cx, cy + 2, 2);
      g.fillCircle(cx, cy + 6, 2);

      // Animated legs
      g.lineStyle(2, 0x0a3a0a, 1);
      g.lineBetween(cx - 8, cy - 4, cx - 14, cy - 8 + legWave1);
      g.lineBetween(cx + 8, cy - 4, cx + 14, cy - 8 - legWave1);
      g.lineBetween(cx - 8, cy, cx - 14, cy + legWave2);
      g.lineBetween(cx + 8, cy, cx + 14, cy - legWave2);
      g.lineBetween(cx - 8, cy + 4, cx - 14, cy + 8 + legWave3);
      g.lineBetween(cx + 8, cy + 4, cx + 14, cy + 8 - legWave3);

      // Antennae (twitching)
      const antennaTwitch = Math.sin(f * Math.PI) * 2;
      g.lineStyle(1, 0x00ff00, 1);
      g.lineBetween(cx - 4, cy - 10, cx - 6 + antennaTwitch, cy - 16);
      g.lineBetween(cx + 4, cy - 10, cx + 6 - antennaTwitch, cy - 16);
    }

    g.generateTexture('bug-temp', size * frames, size);
    g.destroy();

    const tempTexture = this.textures.get('bug-temp');
    this.textures.addSpriteSheet('bug', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });
    this.textures.remove('bug-temp');
  }

  generateGlitchSpriteSheet() {
    const size = 36;
    const frames = 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Glitch offset varies per frame (chromatic aberration effect)
      const glitchX = (f % 2 === 0 ? -3 : 3) + Math.sin(f * Math.PI) * 2;
      const glitchY = (f % 2 === 1 ? -2 : 2);

      // Red channel offset
      g.fillStyle(0xff0000, 0.3);
      g.fillRect(cx - 10 + glitchX, cy - 12, 20, 24);

      // Blue channel offset (opposite direction)
      g.fillStyle(0x0000ff, 0.3);
      g.fillRect(cx - 10 - glitchX, cy - 12 + glitchY, 20, 24);

      // Cyan channel
      g.fillStyle(0x00ffff, 0.3);
      g.fillRect(cx - 10 + glitchX/2, cy - 12 - glitchY, 20, 24);

      // Main body (position jitters)
      g.fillStyle(0xff00ff, 0.8);
      g.fillRect(cx - 10 + (f === 2 ? 2 : 0), cy - 12 + (f === 1 ? -1 : 0), 20, 24);

      // Static noise lines (different pattern each frame)
      g.lineStyle(1, 0x00ffff, 0.8);
      for (let i = 0; i < 6; i++) {
        const y = cy - 10 + i * 4;
        const noiseOffset = ((i + f) % 3) * 4 - 4;
        g.lineBetween(cx - 8 + noiseOffset, y, cx + 8 + noiseOffset, y);
      }

      // Creepy eyes (different heights per frame for jitter)
      const eyeJitter = f === 1 ? 1 : (f === 3 ? -1 : 0);
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 6, cy - 6 + eyeJitter, 4, 6);
      g.fillRect(cx + 2, cy - 6 - eyeJitter, 4, 6);

      // Glitch artifacts (random positions per frame)
      g.fillStyle(0x00ffff, 0.6 + f * 0.1);
      g.fillRect(cx - 14 + f * 2, cy - 2 + (f % 2) * 4, 4, 2);
      g.fillRect(cx + 10 - f, cy + 4 - (f % 2) * 3, 4, 2);
      g.fillRect(cx - 8 + f * 3, cy + 8, 6, 2);
    }

    g.generateTexture('glitch-temp', size * frames, size);
    g.destroy();

    const tempTexture = this.textures.get('glitch-temp');
    this.textures.addSpriteSheet('glitch', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });
    this.textures.remove('glitch-temp');
  }

  generateMemoryLeakSpriteSheet() {
    const size = 44;
    const frames = 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Pulsing effect
      const pulse = Math.sin(f * Math.PI / 2);
      const sizeVar = pulse * 2;

      // Outer ooze (pulsing)
      g.fillStyle(0x6600aa, 0.3 + pulse * 0.2);
      g.fillCircle(cx, cy, size/2 - 2 + sizeVar);

      // Main blob body (wobbling)
      g.fillStyle(0x8800cc, 0.8);
      g.fillCircle(cx + pulse, cy - pulse * 0.5, size/2 - 6 + sizeVar * 0.5);

      // Inner glow (counter-pulse)
      g.fillStyle(0xaa00ff, 0.8 + pulse * 0.2);
      g.fillCircle(cx - pulse * 0.5, cy + pulse * 0.5, size/2 - 12 - sizeVar * 0.3);

      // Core (brighter when pulsing out)
      g.fillStyle(0xff00ff, 1);
      g.fillCircle(cx, cy, 6 + pulse);

      // Bright center
      g.fillStyle(0xffffff, 0.6 + pulse * 0.4);
      g.fillCircle(cx, cy, 3 + pulse * 0.5);

      // Dripping tendrils (extend during pulse)
      const dripExtend = (f === 1 || f === 2) ? 4 : 0;
      g.fillStyle(0x8800cc, 0.6);
      g.fillEllipse(cx - 10 + pulse, cy + 14 + dripExtend, 6, 10 + dripExtend);
      g.fillEllipse(cx + 10 - pulse, cy + 12 + dripExtend * 0.5, 5, 8 + dripExtend * 0.5);
      g.fillEllipse(cx, cy + 16 + dripExtend * 0.75, 4, 8 + dripExtend * 0.75);
    }

    g.generateTexture('memory-leak-temp', size * frames, size);
    g.destroy();

    const tempTexture = this.textures.get('memory-leak-temp');
    this.textures.addSpriteSheet('memory-leak', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });
    this.textures.remove('memory-leak-temp');
  }

  generateSlashTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 40;

    // Outer glow
    g.lineStyle(8, 0x00ffff, 0.3);
    g.beginPath();
    g.arc(size/2, size/2, 14, -Math.PI * 0.7, Math.PI * 0.2, false);
    g.strokePath();

    // Main arc
    g.lineStyle(4, 0x00ffff, 0.8);
    g.beginPath();
    g.arc(size/2, size/2, 14, -Math.PI * 0.7, Math.PI * 0.2, false);
    g.strokePath();

    // Bright center
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.arc(size/2, size/2, 14, -Math.PI * 0.7, Math.PI * 0.2, false);
    g.strokePath();

    // Sparkle points
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2 + 10, size/2 - 10, 2);
    g.fillCircle(size/2 - 8, size/2 + 12, 2);

    g.generateTexture('slash', size, size);
    g.destroy();
  }

  generateSpreadWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    // Orange spread shot icon - three arrows spreading out
    g.fillStyle(0xff6600, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff9900, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Three arrows spreading
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size/2, size/2 - 8, size/2 - 3, size/2 + 4, size/2 + 3, size/2 + 4);
    g.fillTriangle(size/2 - 6, size/2 - 4, size/2 - 9, size/2 + 4, size/2 - 3, size/2 + 4);
    g.fillTriangle(size/2 + 6, size/2 - 4, size/2 + 3, size/2 + 4, size/2 + 9, size/2 + 4);

    g.generateTexture('weapon-spread', size, size);
    g.destroy();
  }

  generatePierceWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    // Blue pierce icon - arrow going through
    g.fillStyle(0x0066ff, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x0099ff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Long piercing arrow
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size/2, size/2 - 10, size/2 - 4, size/2 - 2, size/2 + 4, size/2 - 2);
    g.fillRect(size/2 - 2, size/2 - 2, 4, 12);

    // Through lines
    g.lineStyle(2, 0x00ffff, 0.6);
    g.lineBetween(size/2 - 8, size/2 - 2, size/2 - 8, size/2 + 6);
    g.lineBetween(size/2 + 8, size/2 - 2, size/2 + 8, size/2 + 6);

    g.generateTexture('weapon-pierce', size, size);
    g.destroy();
  }

  generateOrbitalWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    // Purple orbital icon - orbiting circles
    g.fillStyle(0x9900ff, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xaa44ff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Center point
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2, size/2, 3);

    // Orbiting dots
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(size/2, size/2 - 8, 3);
    g.fillCircle(size/2 + 7, size/2 + 4, 3);
    g.fillCircle(size/2 - 7, size/2 + 4, 3);

    // Orbit line
    g.lineStyle(1, 0xffffff, 0.4);
    g.strokeCircle(size/2, size/2, 8);

    g.generateTexture('weapon-orbital', size, size);
    g.destroy();
  }

  generateRapidWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    // Yellow rapid fire icon - lightning bolt
    g.fillStyle(0xffff00, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xffcc00, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Lightning bolt
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(size/2 + 2, size/2 - 10);
    g.lineTo(size/2 - 4, size/2);
    g.lineTo(size/2, size/2);
    g.lineTo(size/2 - 2, size/2 + 10);
    g.lineTo(size/2 + 4, size/2);
    g.lineTo(size/2, size/2);
    g.closePath();
    g.fillPath();

    g.generateTexture('weapon-rapid', size, size);
    g.destroy();
  }

  // === RARE WEAPONS ===

  generateRmRfWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Red danger glow
    g.fillStyle(0xff0000, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff3333, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Skull/danger symbol - X marks the spot
    g.lineStyle(3, 0xffffff, 1);
    g.lineBetween(size/2 - 6, size/2 - 6, size/2 + 6, size/2 + 6);
    g.lineBetween(size/2 + 6, size/2 - 6, size/2 - 6, size/2 + 6);

    // Outer ring
    g.lineStyle(2, 0xffff00, 0.8);
    g.strokeCircle(size/2, size/2, size/2 - 4);

    g.generateTexture('weapon-rmrf', size, size);
    g.destroy();
  }

  generateSudoWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Golden glow
    g.fillStyle(0xffd700, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xffaa00, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Crown/shield symbol
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size/2, size/2 - 8, size/2 - 8, size/2 + 4, size/2 + 8, size/2 + 4);

    // Star in center
    g.fillStyle(0xffd700, 1);
    g.fillCircle(size/2, size/2, 3);

    g.generateTexture('weapon-sudo', size, size);
    g.destroy();
  }

  generateForkBombWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Pink chaos glow
    g.fillStyle(0xff00ff, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff44ff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Branching symbol (fork)
    g.lineStyle(2, 0xffffff, 1);
    g.lineBetween(size/2, size/2 + 6, size/2, size/2 - 2);
    g.lineBetween(size/2, size/2 - 2, size/2 - 6, size/2 - 8);
    g.lineBetween(size/2, size/2 - 2, size/2 + 6, size/2 - 8);

    // Dots at ends
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(size/2 - 6, size/2 - 8, 2);
    g.fillCircle(size/2 + 6, size/2 - 8, 2);
    g.fillCircle(size/2, size/2 + 6, 2);

    g.generateTexture('weapon-forkbomb', size, size);
    g.destroy();
  }

  // === BOSSES ===

  generateStackOverflowBossTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 80;

    // Massive bug body
    g.fillStyle(0x006600, 1);
    g.fillEllipse(size/2, size/2, 50, 60);

    // Armored shell
    g.fillStyle(0x00aa00, 1);
    g.fillEllipse(size/2, size/2 - 4, 40, 48);

    // Shell segments
    g.lineStyle(3, 0x004400, 1);
    g.lineBetween(size/2, size/2 - 28, size/2, size/2 + 24);
    g.lineBetween(size/2 - 18, size/2 - 10, size/2 + 18, size/2 - 10);
    g.lineBetween(size/2 - 18, size/2 + 10, size/2 + 18, size/2 + 10);

    // Glowing core
    g.fillStyle(0x00ff00, 1);
    g.fillCircle(size/2, size/2 - 15, 8);
    g.fillCircle(size/2, size/2, 6);
    g.fillCircle(size/2, size/2 + 12, 5);

    // Menacing eyes
    g.fillStyle(0xff0000, 1);
    g.fillCircle(size/2 - 12, size/2 - 24, 6);
    g.fillCircle(size/2 + 12, size/2 - 24, 6);

    // White eye glint
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2 - 10, size/2 - 26, 2);
    g.fillCircle(size/2 + 14, size/2 - 26, 2);

    // Massive legs
    g.lineStyle(4, 0x003300, 1);
    for (let i = 0; i < 3; i++) {
      const y = size/2 - 12 + i * 14;
      g.lineBetween(size/2 - 20, y, size/2 - 36, y - 8);
      g.lineBetween(size/2 + 20, y, size/2 + 36, y - 8);
    }

    g.generateTexture('boss-stackoverflow', size, size);
    g.destroy();
  }

  generateNullPointerBossTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 70;

    // Glitchy shifting layers
    g.fillStyle(0xff00ff, 0.3);
    g.fillRect(size/2 - 24, size/2 - 30, 48, 60);

    g.fillStyle(0x00ffff, 0.3);
    g.fillRect(size/2 - 20, size/2 - 26, 48, 60);

    // Main corrupted body
    g.fillStyle(0xff00ff, 0.9);
    g.fillRect(size/2 - 22, size/2 - 28, 44, 56);

    // Glitch lines
    g.lineStyle(2, 0x00ffff, 0.8);
    for (let i = 0; i < 8; i++) {
      const y = size/2 - 24 + i * 7;
      const offset = (i % 2) * 6 - 3;
      g.lineBetween(size/2 - 18 + offset, y, size/2 + 18 + offset, y);
    }

    // Void eyes (empty circles)
    g.fillStyle(0x000000, 1);
    g.fillRect(size/2 - 14, size/2 - 18, 10, 14);
    g.fillRect(size/2 + 4, size/2 - 18, 10, 14);

    // Question mark symbol (null reference)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2, size/2 + 16, 4);
    g.lineStyle(3, 0xffffff, 1);
    g.beginPath();
    g.arc(size/2, size/2 + 4, 8, -Math.PI, 0, false);
    g.strokePath();
    g.lineBetween(size/2 + 8, size/2 + 4, size/2, size/2 + 10);

    g.generateTexture('boss-nullpointer', size, size);
    g.destroy();
  }

  generateMemoryLeakPrimeBossTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 90;

    // Massive outer ooze
    g.fillStyle(0x4400aa, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 4);

    // Main blob
    g.fillStyle(0x6600cc, 0.8);
    g.fillCircle(size/2, size/2, size/2 - 12);

    // Inner pulsing core
    g.fillStyle(0x8800ff, 1);
    g.fillCircle(size/2, size/2, size/2 - 24);

    // Bright center
    g.fillStyle(0xcc00ff, 1);
    g.fillCircle(size/2, size/2, 12);

    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(size/2, size/2, 6);

    // Multiple eyes scattered
    g.fillStyle(0xff0000, 1);
    g.fillCircle(size/2 - 18, size/2 - 12, 5);
    g.fillCircle(size/2 + 18, size/2 - 12, 5);
    g.fillCircle(size/2, size/2 - 22, 4);
    g.fillCircle(size/2 - 12, size/2 + 14, 4);
    g.fillCircle(size/2 + 12, size/2 + 14, 4);

    // Dripping tendrils
    g.fillStyle(0x6600cc, 0.7);
    g.fillEllipse(size/2 - 24, size/2 + 30, 12, 20);
    g.fillEllipse(size/2 + 24, size/2 + 28, 10, 16);
    g.fillEllipse(size/2, size/2 + 34, 14, 22);
    g.fillEllipse(size/2 - 10, size/2 + 32, 8, 14);
    g.fillEllipse(size/2 + 10, size/2 + 30, 8, 12);

    g.generateTexture('boss-memoryleakprime', size, size);
    g.destroy();
  }

  generateKernelPanicBossTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 100;

    // Chaotic red aura
    g.fillStyle(0xff0000, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    // Dark core
    g.fillStyle(0x330000, 1);
    g.fillCircle(size/2, size/2, size/2 - 14);

    // Pulsing red inner
    g.fillStyle(0x990000, 1);
    g.fillCircle(size/2, size/2, size/2 - 24);

    // Skull face
    g.fillStyle(0x220000, 1);
    g.fillCircle(size/2, size/2 - 8, 20);

    // Eye sockets
    g.fillStyle(0xff0000, 1);
    g.fillCircle(size/2 - 10, size/2 - 12, 8);
    g.fillCircle(size/2 + 10, size/2 - 12, 8);

    // Burning pupils
    g.fillStyle(0xffff00, 1);
    g.fillCircle(size/2 - 10, size/2 - 12, 4);
    g.fillCircle(size/2 + 10, size/2 - 12, 4);

    // Jagged mouth
    g.fillStyle(0x000000, 1);
    g.beginPath();
    g.moveTo(size/2 - 14, size/2 + 4);
    g.lineTo(size/2 - 8, size/2 + 10);
    g.lineTo(size/2 - 4, size/2 + 4);
    g.lineTo(size/2, size/2 + 12);
    g.lineTo(size/2 + 4, size/2 + 4);
    g.lineTo(size/2 + 8, size/2 + 10);
    g.lineTo(size/2 + 14, size/2 + 4);
    g.closePath();
    g.fillPath();

    // Flame tendrils
    g.fillStyle(0xff4400, 0.7);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = size/2 + Math.cos(angle) * 38;
      const y = size/2 + Math.sin(angle) * 38;
      g.fillTriangle(x, y, x + Math.cos(angle) * 12, y + Math.sin(angle) * 12,
                     x + Math.cos(angle + 0.3) * 8, y + Math.sin(angle + 0.3) * 8);
    }

    // "PANIC" energy ring
    g.lineStyle(3, 0xff0000, 0.6);
    g.strokeCircle(size/2, size/2, size/2 - 8);

    g.generateTexture('boss-kernelpanic', size, size);
    g.destroy();
  }

  // === NEW ENEMY TYPES ===

  generateSyntaxErrorSpriteSheet() {
    const size = 28;
    const frames = 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Flashing warning effect
      const flash = f % 2 === 0;
      const brightness = flash ? 1 : 0.6;

      // Warning triangle (flashing)
      g.fillStyle(flash ? 0xff3333 : 0xaa2222, 0.8);
      g.fillTriangle(cx, cy - 10, cx - 10, cy + 8, cx + 10, cy + 8);

      // Exclamation mark
      g.fillStyle(0xffffff, brightness);
      g.fillRect(cx - 2, cy - 6, 4, 8);
      g.fillCircle(cx, cy + 5, 2);

      // Glow (pulsing)
      g.lineStyle(2, 0xff0000, 0.3 + (flash ? 0.4 : 0));
      g.strokeTriangle(cx, cy - 10, cx - 10, cy + 8, cx + 10, cy + 8);

      // Extra flash effect on bright frames
      if (flash) {
        g.lineStyle(1, 0xffff00, 0.3);
        g.strokeTriangle(cx, cy - 12, cx - 12, cy + 10, cx + 12, cy + 10);
      }
    }

    g.generateTexture('syntax-error-temp', size * frames, size);
    g.destroy();

    const tempTexture = this.textures.get('syntax-error-temp');
    this.textures.addSpriteSheet('syntax-error', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });
    this.textures.remove('syntax-error-temp');
  }

  generateInfiniteLoopSpriteSheet() {
    const size = 36;
    const frames = 6; // More frames for smooth rotation
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Rotation angle
      const rotation = (f / frames) * Math.PI * 2;

      // Background glow
      g.fillStyle(0xffaa00, 0.3);
      g.fillCircle(cx, cy, size/2 - 4);

      // Rotating infinity symbol (two offset circles)
      const offset = 6;
      const x1 = cx + Math.cos(rotation) * offset;
      const y1 = cy + Math.sin(rotation) * offset;
      const x2 = cx + Math.cos(rotation + Math.PI) * offset;
      const y2 = cy + Math.sin(rotation + Math.PI) * offset;

      g.lineStyle(4, 0xffdd00, 1);
      g.strokeCircle(x1, y1, 8);
      g.strokeCircle(x2, y2, 8);

      // Center connection (rotating glow)
      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx, cy, 4);

      // Rotating arrows
      const arrowAngle1 = rotation + Math.PI * 0.5;
      const arrowAngle2 = rotation + Math.PI * 1.5;
      g.fillStyle(0xffffff, 0.8);

      // Arrow 1
      const ax1 = cx + Math.cos(arrowAngle1) * 12;
      const ay1 = cy + Math.sin(arrowAngle1) * 12;
      g.fillTriangle(
        ax1, ay1,
        ax1 + Math.cos(arrowAngle1 + 0.5) * 4, ay1 + Math.sin(arrowAngle1 + 0.5) * 4,
        ax1 + Math.cos(arrowAngle1 - 0.5) * 4, ay1 + Math.sin(arrowAngle1 - 0.5) * 4
      );

      // Arrow 2
      const ax2 = cx + Math.cos(arrowAngle2) * 12;
      const ay2 = cy + Math.sin(arrowAngle2) * 12;
      g.fillTriangle(
        ax2, ay2,
        ax2 + Math.cos(arrowAngle2 + 0.5) * 4, ay2 + Math.sin(arrowAngle2 + 0.5) * 4,
        ax2 + Math.cos(arrowAngle2 - 0.5) * 4, ay2 + Math.sin(arrowAngle2 - 0.5) * 4
      );
    }

    g.generateTexture('infinite-loop-temp', size * frames, size);
    g.destroy();

    const tempTexture = this.textures.get('infinite-loop-temp');
    this.textures.addSpriteSheet('infinite-loop', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });
    this.textures.remove('infinite-loop-temp');
  }

  generateRaceConditionSpriteSheet() {
    const size = 34;
    const frames = 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < frames; f++) {
      const offsetX = f * size;
      const cx = offsetX + size/2;
      const cy = size/2;

      // Alternating dominance between the two "threads"
      const cyanDominant = f % 2 === 0;
      const offset = (f === 1 || f === 3) ? 2 : 0;

      // Thread 1 - cyan (position varies)
      g.fillStyle(0x00ffff, cyanDominant ? 0.8 : 0.4);
      g.fillCircle(cx - 5 + (cyanDominant ? 2 : -2), cy + offset, 10);

      // Thread 2 - magenta (position varies)
      g.fillStyle(0xff00ff, cyanDominant ? 0.4 : 0.8);
      g.fillCircle(cx + 5 + (cyanDominant ? -2 : 2), cy - offset, 10);

      // Collision sparks (more intense when threads collide)
      const sparkSize = (f === 1 || f === 3) ? 5 : 3;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx, cy, sparkSize);

      // Lightning bolt effect (jitters)
      const jitter = (f % 2) * 2 - 1;
      g.lineStyle(2, 0xffff00, 1);
      g.lineBetween(cx + jitter, cy - 8, cx - 3 + jitter, cy);
      g.lineBetween(cx - 3 + jitter, cy, cx + 3 - jitter, cy);
      g.lineBetween(cx + 3 - jitter, cy, cx - jitter, cy + 8);

      // Speed lines (alternate sides)
      if (cyanDominant) {
        g.lineStyle(1, 0x00ffff, 0.7);
        g.lineBetween(cx - 14, cy - 4, cx - 18, cy - 4);
        g.lineBetween(cx - 14, cy, cx - 20, cy);
        g.lineBetween(cx - 14, cy + 4, cx - 18, cy + 4);
      } else {
        g.lineStyle(1, 0xff00ff, 0.7);
        g.lineBetween(cx + 14, cy - 4, cx + 18, cy - 4);
        g.lineBetween(cx + 14, cy, cx + 20, cy);
        g.lineBetween(cx + 14, cy + 4, cx + 18, cy + 4);
      }
    }

    g.generateTexture('race-condition-temp', size * frames, size);
    g.destroy();

    const tempTexture = this.textures.get('race-condition-temp');
    this.textures.addSpriteSheet('race-condition', tempTexture.getSourceImage(), {
      frameWidth: size,
      frameHeight: size
    });
    this.textures.remove('race-condition-temp');
  }

  generateMiniBossTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 56;

    // Corrupted data chunk - mini boss
    g.fillStyle(0x880088, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 4);

    // Hexagonal core
    const cx = size/2, cy = size/2, r = 16;
    g.fillStyle(0xaa00aa, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();

    // Glowing center
    g.fillStyle(0xff00ff, 1);
    g.fillCircle(size/2, size/2, 8);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(size/2, size/2, 4);

    // Orbiting dots
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(size/2, size/2 - 20, 4);
    g.fillCircle(size/2 + 17, size/2 + 10, 4);
    g.fillCircle(size/2 - 17, size/2 + 10, 4);

    // Danger symbol
    g.lineStyle(2, 0xffff00, 0.8);
    g.strokeTriangle(size/2, size/2 - 6, size/2 - 5, size/2 + 4, size/2 + 5, size/2 + 4);

    g.generateTexture('mini-boss', size, size);
    g.destroy();
  }

  // === EVOLVED WEAPON TEXTURES ===

  generateLaserBeamWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Spread + Pierce = Laser Beam (red/orange)
    g.fillStyle(0xff4400, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff6600, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Laser beam icon
    g.fillStyle(0xffffff, 1);
    g.fillRect(size/2 - 2, size/2 - 12, 4, 24);

    // Glow lines
    g.lineStyle(2, 0xffff00, 0.6);
    g.lineBetween(size/2 - 6, size/2 - 8, size/2 - 6, size/2 + 8);
    g.lineBetween(size/2 + 6, size/2 - 8, size/2 + 6, size/2 + 8);

    g.generateTexture('weapon-laser', size, size);
    g.destroy();
  }

  generatePlasmaOrbWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Orbital + Rapid = Plasma Orb (electric blue)
    g.fillStyle(0x0088ff, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x00aaff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Electric orb
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2, size/2, 6);

    // Lightning bolts around
    g.lineStyle(2, 0x00ffff, 1);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x1 = size/2 + Math.cos(angle) * 8;
      const y1 = size/2 + Math.sin(angle) * 8;
      const x2 = size/2 + Math.cos(angle) * 12;
      const y2 = size/2 + Math.sin(angle) * 12;
      g.lineBetween(x1, y1, x2, y2);
    }

    g.generateTexture('weapon-plasma', size, size);
    g.destroy();
  }

  generateChainLightningWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Fork Bomb + Any = Chain Lightning (purple/white)
    g.fillStyle(0x8800ff, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xaa44ff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Lightning chain
    g.lineStyle(3, 0xffffff, 1);
    g.beginPath();
    g.moveTo(size/2 - 8, size/2 - 8);
    g.lineTo(size/2 - 2, size/2 - 2);
    g.lineTo(size/2 + 4, size/2 - 6);
    g.lineTo(size/2 + 2, size/2 + 2);
    g.lineTo(size/2 + 8, size/2 + 8);
    g.strokePath();

    // Sparks
    g.fillStyle(0xffff00, 1);
    g.fillCircle(size/2 - 8, size/2 - 8, 2);
    g.fillCircle(size/2 + 8, size/2 + 8, 2);

    g.generateTexture('weapon-chain', size, size);
    g.destroy();
  }

  // === NEW WEAPON TEXTURES ===

  generateHomingWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    g.fillStyle(0x00aa66, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x00ff88, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Crosshair/target
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(size/2, size/2, 6);
    g.lineBetween(size/2, size/2 - 10, size/2, size/2 - 4);
    g.lineBetween(size/2, size/2 + 4, size/2, size/2 + 10);
    g.lineBetween(size/2 - 10, size/2, size/2 - 4, size/2);
    g.lineBetween(size/2 + 4, size/2, size/2 + 10, size/2);

    g.generateTexture('weapon-homing', size, size);
    g.destroy();
  }

  generateBounceWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    g.fillStyle(0x66aa00, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x88ff00, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Bouncing arrow pattern
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.moveTo(size/2 - 8, size/2 + 4);
    g.lineTo(size/2 - 4, size/2 - 4);
    g.lineTo(size/2, size/2 + 2);
    g.lineTo(size/2 + 4, size/2 - 6);
    g.lineTo(size/2 + 8, size/2 + 2);
    g.strokePath();

    g.generateTexture('weapon-bounce', size, size);
    g.destroy();
  }

  generateAoeWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    g.fillStyle(0xff2266, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff4488, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Explosion burst
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2, size/2, 4);

    // Rays
    g.lineStyle(2, 0xffff00, 0.8);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = size/2 + Math.cos(angle) * 5;
      const y1 = size/2 + Math.sin(angle) * 5;
      const x2 = size/2 + Math.cos(angle) * 10;
      const y2 = size/2 + Math.sin(angle) * 10;
      g.lineBetween(x1, y1, x2, y2);
    }

    g.generateTexture('weapon-aoe', size, size);
    g.destroy();
  }

  generateFreezeWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    g.fillStyle(0x44aaaa, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x88ffff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Snowflake pattern
    g.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = size/2 + Math.cos(angle) * 8;
      const y = size/2 + Math.sin(angle) * 8;
      g.lineBetween(size/2, size/2, x, y);
    }

    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2, size/2, 3);

    g.generateTexture('weapon-freeze', size, size);
    g.destroy();
  }

  // === NEW EVOLVED WEAPON TEXTURES ===

  generateBulletHellWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0xff4400, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff6600, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Many small dots (bullets)
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 6 + (i % 2) * 3;
      const x = size/2 + Math.cos(angle) * r;
      const y = size/2 + Math.sin(angle) * r;
      g.fillCircle(x, y, 2);
    }

    g.generateTexture('weapon-bullethell', size, size);
    g.destroy();
  }

  generateRingOfFireWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0xff2200, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff4400, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Fire ring
    g.lineStyle(3, 0xffaa00, 1);
    g.strokeCircle(size/2, size/2, 8);

    // Flames
    g.fillStyle(0xffff00, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = size/2 + Math.cos(angle) * 8;
      const y = size/2 + Math.sin(angle) * 8;
      g.fillCircle(x, y, 3);
    }

    g.generateTexture('weapon-ringoffire', size, size);
    g.destroy();
  }

  generateSeekingMissileWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0x00aa99, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x00ffcc, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Missile shape
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size/2, size/2 - 10, size/2 - 5, size/2 + 6, size/2 + 5, size/2 + 6);

    // Exhaust
    g.fillStyle(0xffaa00, 0.8);
    g.fillTriangle(size/2, size/2 + 6, size/2 - 3, size/2 + 10, size/2 + 3, size/2 + 10);

    g.generateTexture('weapon-seekingmissile', size, size);
    g.destroy();
  }

  generateChaosBounceWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0x88aa00, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xaaff00, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Chaotic bouncing lines
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.moveTo(size/2 - 10, size/2 - 6);
    g.lineTo(size/2 - 4, size/2 + 4);
    g.lineTo(size/2 + 2, size/2 - 8);
    g.lineTo(size/2 + 8, size/2 + 2);
    g.lineTo(size/2 + 4, size/2 + 8);
    g.strokePath();

    g.generateTexture('weapon-chaosbounce', size, size);
    g.destroy();
  }

  generateDeathAuraWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0xaa0088, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xff00aa, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Skull-like symbol
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(size/2, size/2 - 2, 6);

    g.fillStyle(0x000000, 1);
    g.fillCircle(size/2 - 3, size/2 - 3, 2);
    g.fillCircle(size/2 + 3, size/2 - 3, 2);

    // Aura rings
    g.lineStyle(1, 0xff00ff, 0.5);
    g.strokeCircle(size/2, size/2, 10);
    g.strokeCircle(size/2, size/2, 13);

    g.generateTexture('weapon-deathaura', size, size);
    g.destroy();
  }

  generateIceLanceWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0x0088aa, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x00ffff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Ice lance shape
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size/2, size/2 - 12, size/2 - 4, size/2 + 8, size/2 + 4, size/2 + 8);

    // Ice crystals
    g.fillStyle(0x88ffff, 0.8);
    g.fillRect(size/2 - 6, size/2 - 2, 3, 3);
    g.fillRect(size/2 + 3, size/2 + 2, 3, 3);

    g.generateTexture('weapon-icelance', size, size);
    g.destroy();
  }

  generateSwarmWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0x66aa66, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0x88ff88, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Multiple small triangles (swarm)
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size/2, size/2 - 6, size/2 - 3, size/2, size/2 + 3, size/2);
    g.fillTriangle(size/2 - 6, size/2, size/2 - 9, size/2 + 6, size/2 - 3, size/2 + 6);
    g.fillTriangle(size/2 + 6, size/2, size/2 + 3, size/2 + 6, size/2 + 9, size/2 + 6);

    g.generateTexture('weapon-swarm', size, size);
    g.destroy();
  }

  generateBlizzardWeaponTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    g.fillStyle(0x88aacc, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    g.fillStyle(0xaaffff, 1);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Swirling snow pattern
    g.lineStyle(2, 0xffffff, 0.8);
    g.beginPath();
    g.arc(size/2, size/2, 8, 0, Math.PI * 1.5, false);
    g.strokePath();

    // Snowflakes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2 - 4, size/2 - 4, 2);
    g.fillCircle(size/2 + 5, size/2 - 2, 2);
    g.fillCircle(size/2 - 2, size/2 + 5, 2);
    g.fillCircle(size/2 + 3, size/2 + 4, 1.5);

    g.generateTexture('weapon-blizzard', size, size);
    g.destroy();
  }

  // === MELEE WEAPON TEXTURES ===

  generateSwordTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Blade
    g.fillStyle(0xcccccc, 1);
    g.beginPath();
    g.moveTo(size/2, size/2 - 14);
    g.lineTo(size/2 + 4, size/2 + 4);
    g.lineTo(size/2, size/2 + 2);
    g.lineTo(size/2 - 4, size/2 + 4);
    g.closePath();
    g.fillPath();

    // Edge highlight
    g.lineStyle(1, 0xffffff, 0.8);
    g.lineBetween(size/2, size/2 - 14, size/2 - 3, size/2 + 2);

    // Guard
    g.fillStyle(0x8b4513, 1);
    g.fillRect(size/2 - 6, size/2 + 4, 12, 3);

    // Handle
    g.fillStyle(0x4a3728, 1);
    g.fillRect(size/2 - 2, size/2 + 7, 4, 8);

    // Pommel
    g.fillStyle(0xffd700, 1);
    g.fillCircle(size/2, size/2 + 14, 2);

    g.generateTexture('weapon-sword', size, size);
    g.generateTexture('melee-sword', size, size);
    g.destroy();
  }

  generateSpearTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 40;

    // Shaft
    g.fillStyle(0x8b4513, 1);
    g.fillRect(size/2 - 2, size/2 - 6, 4, 22);

    // Spearhead
    g.fillStyle(0xaaaaaa, 1);
    g.beginPath();
    g.moveTo(size/2, size/2 - 18);
    g.lineTo(size/2 + 5, size/2 - 6);
    g.lineTo(size/2 - 5, size/2 - 6);
    g.closePath();
    g.fillPath();

    // Highlight
    g.lineStyle(1, 0xffffff, 0.6);
    g.lineBetween(size/2, size/2 - 18, size/2 - 3, size/2 - 8);

    // Binding
    g.fillStyle(0x4a3728, 1);
    g.fillRect(size/2 - 3, size/2 - 6, 6, 4);

    g.generateTexture('weapon-spear', size, size);
    g.generateTexture('melee-spear', size, size);
    g.destroy();
  }

  generateBoomerangTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Boomerang body
    g.fillStyle(0xdaa520, 1);
    g.beginPath();
    g.arc(size/2, size/2, 10, -Math.PI * 0.7, Math.PI * 0.2, false);
    g.lineTo(size/2 + 8, size/2 + 6);
    g.arc(size/2, size/2, 6, Math.PI * 0.2, -Math.PI * 0.7, true);
    g.closePath();
    g.fillPath();

    // Wood grain
    g.lineStyle(1, 0xb8860b, 0.5);
    g.beginPath();
    g.arc(size/2, size/2, 8, -Math.PI * 0.6, Math.PI * 0.1, false);
    g.strokePath();

    // Highlight
    g.lineStyle(1, 0xffd700, 0.4);
    g.beginPath();
    g.arc(size/2, size/2, 9, -Math.PI * 0.5, 0, false);
    g.strokePath();

    g.generateTexture('weapon-boomerang', size, size);
    g.generateTexture('melee-boomerang', size, size);
    g.destroy();
  }

  generateKunaiTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 24;

    // Blade
    g.fillStyle(0x3a3a3a, 1);
    g.beginPath();
    g.moveTo(size/2, size/2 - 10);
    g.lineTo(size/2 + 4, size/2 + 2);
    g.lineTo(size/2, size/2);
    g.lineTo(size/2 - 4, size/2 + 2);
    g.closePath();
    g.fillPath();

    // Edge
    g.lineStyle(1, 0x666666, 0.8);
    g.lineBetween(size/2, size/2 - 10, size/2, size/2);

    // Handle/ring
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(size/2 - 2, size/2 + 2, 4, 6);

    // Ring at end
    g.lineStyle(2, 0x4a4a4a, 1);
    g.strokeCircle(size/2, size/2 + 10, 3);

    g.generateTexture('weapon-kunai', size, size);
    g.generateTexture('melee-kunai', size, size);
    g.destroy();
  }

  // === LEGENDARY WEAPON TEXTURES ===

  generateHuntersWarglaiveTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 48;

    // Pixel-perfect recreation of reference Hunter's Warglaive
    // Reference: curved hook blade top-left, handle bottom-right
    // Dark black/charcoal coloring with pixel art style

    const px = (x, y, color = 0x1a1a1a) => {
      g.fillStyle(color, 1);
      g.fillRect(x, y, 2, 2);
    };

    // Main blade color - very dark charcoal
    const dark = 0x1a1a1a;
    const mid = 0x2a2a2a;
    const light = 0x3a3a3a;
    const outline = 0x0a0a0a;

    // Top hook curve (going up and left)
    px(8, 4, outline);
    px(10, 4, dark);
    px(6, 6, outline);
    px(8, 6, dark);
    px(10, 6, dark);
    px(12, 6, mid);

    px(4, 8, outline);
    px(6, 8, dark);
    px(8, 8, dark);
    px(10, 8, mid);

    px(4, 10, outline);
    px(6, 10, dark);
    px(8, 10, dark);

    px(6, 12, outline);
    px(8, 12, dark);
    px(10, 12, dark);

    // Middle blade section (diagonal)
    px(10, 14, outline);
    px(12, 14, dark);
    px(14, 14, dark);

    px(14, 16, outline);
    px(16, 16, dark);
    px(18, 16, dark);

    px(18, 18, outline);
    px(20, 18, dark);
    px(22, 18, mid);

    // Handle section (going down-right)
    px(22, 20, outline);
    px(24, 20, dark);
    px(26, 20, mid);

    px(26, 22, outline);
    px(28, 22, dark);
    px(30, 22, mid);

    px(28, 24, outline);
    px(30, 24, dark);
    px(32, 24, mid);

    px(30, 26, outline);
    px(32, 26, dark);
    px(34, 26, mid);

    // Lower hook/blade extension
    px(32, 28, outline);
    px(34, 28, dark);
    px(36, 28, dark);

    px(34, 30, outline);
    px(36, 30, dark);
    px(38, 30, mid);

    px(36, 32, outline);
    px(38, 32, dark);
    px(40, 32, light);

    px(38, 34, outline);
    px(40, 34, dark);

    px(40, 36, outline);
    px(42, 36, mid);

    // Inner curve details
    px(12, 10, light);
    px(14, 12, mid);
    px(16, 14, mid);
    px(20, 16, light);
    px(24, 18, light);

    // Add some pixel highlights for that pixel art look
    px(8, 4, light);
    px(6, 10, light);
    px(38, 32, light);

    g.generateTexture('legendary-huntersWarglaive', size, size);
    g.destroy();
  }

  generateVoidReaperTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 48;

    // Scythe blade
    g.fillStyle(0x330033, 1);
    g.beginPath();
    g.moveTo(size/2 + 6, size/2 - 16);  // Top of blade
    g.lineTo(size/2 + 20, size/2 - 8);   // Outer curve
    g.lineTo(size/2 + 18, size/2 + 2);   // Blade tip
    g.lineTo(size/2 + 4, size/2 - 4);    // Inner curve
    g.closePath();
    g.fillPath();

    // Blade edge
    g.lineStyle(2, 0x660066, 1);
    g.beginPath();
    g.moveTo(size/2 + 18, size/2 + 2);
    g.lineTo(size/2 + 20, size/2 - 8);
    g.lineTo(size/2 + 6, size/2 - 16);
    g.strokePath();

    // Staff
    g.fillStyle(0x1a1a2a, 1);
    g.fillRect(size/2 - 2, size/2 - 8, 4, 24);

    // Void energy
    g.fillStyle(0x9900ff, 0.5);
    g.fillCircle(size/2 + 14, size/2 - 4, 4);

    // Soul wisps
    g.fillStyle(0xcc00ff, 0.6);
    g.fillCircle(size/2 + 10, size/2 - 10, 2);
    g.fillCircle(size/2 + 16, size/2, 2);

    g.generateTexture('legendary-voidReaper', size, size);
    g.destroy();
  }

  generateCelestialBladeTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 48;

    // Glowing aura
    g.fillStyle(0xffd700, 0.2);
    g.fillCircle(size/2, size/2, 20);

    // Blade
    g.fillStyle(0xffeedd, 1);
    g.beginPath();
    g.moveTo(size/2, size/2 - 20);
    g.lineTo(size/2 + 6, size/2 + 4);
    g.lineTo(size/2, size/2);
    g.lineTo(size/2 - 6, size/2 + 4);
    g.closePath();
    g.fillPath();

    // Golden edge
    g.lineStyle(2, 0xffd700, 1);
    g.lineBetween(size/2, size/2 - 20, size/2 - 5, size/2 + 2);
    g.lineBetween(size/2, size/2 - 20, size/2 + 5, size/2 + 2);

    // Guard - wings
    g.fillStyle(0xffd700, 1);
    g.beginPath();
    g.moveTo(size/2 - 4, size/2 + 4);
    g.lineTo(size/2 - 14, size/2);
    g.lineTo(size/2 - 10, size/2 + 6);
    g.closePath();
    g.fillPath();

    g.beginPath();
    g.moveTo(size/2 + 4, size/2 + 4);
    g.lineTo(size/2 + 14, size/2);
    g.lineTo(size/2 + 10, size/2 + 6);
    g.closePath();
    g.fillPath();

    // Handle
    g.fillStyle(0xddccaa, 1);
    g.fillRect(size/2 - 2, size/2 + 6, 4, 10);

    // Star gems
    g.fillStyle(0xffffaa, 1);
    g.fillCircle(size/2, size/2 - 10, 2);
    g.fillCircle(size/2, size/2 + 4, 3);

    g.generateTexture('legendary-celestialBlade', size, size);
    g.destroy();
  }

  // ========== NEW ENEMY TEXTURES ==========

  generateSegfaultTexture() {
    // Death zone - skull with red warning
    const size = 32;
    const g = this.add.graphics();

    // Red pulsing circle background
    g.fillStyle(0xff0000, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 2);

    // Skull shape
    g.fillStyle(0xff3333, 1);
    g.fillCircle(size/2, size/2 - 2, 10); // Head
    g.fillRect(size/2 - 6, size/2 + 6, 12, 6); // Jaw

    // Eye sockets
    g.fillStyle(0x000000, 1);
    g.fillCircle(size/2 - 4, size/2 - 3, 3);
    g.fillCircle(size/2 + 4, size/2 - 3, 3);

    // Nose hole
    g.fillTriangle(size/2, size/2 + 2, size/2 - 2, size/2 + 5, size/2 + 2, size/2 + 5);

    g.generateTexture('enemy-segfault', size, size);
    g.destroy();
  }

  generateDependencyHellTexture() {
    // Mother spider-like bug with web
    const size = 40;
    const g = this.add.graphics();

    // Web pattern
    g.lineStyle(1, 0x666666, 0.5);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      g.lineBetween(size/2, size/2, size/2 + Math.cos(angle) * 18, size/2 + Math.sin(angle) * 18);
    }

    // Body (dark purple)
    g.fillStyle(0x6622aa, 1);
    g.fillCircle(size/2, size/2, 12);

    // Legs (8 spider legs)
    g.lineStyle(2, 0x4411aa, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      g.lineBetween(size/2, size/2, size/2 + Math.cos(angle) * 16, size/2 + Math.sin(angle) * 16);
    }

    // Eyes (multiple like a spider)
    g.fillStyle(0xff0000, 1);
    g.fillCircle(size/2 - 4, size/2 - 3, 2);
    g.fillCircle(size/2 + 4, size/2 - 3, 2);
    g.fillCircle(size/2 - 2, size/2 - 6, 1.5);
    g.fillCircle(size/2 + 2, size/2 - 6, 1.5);

    g.generateTexture('enemy-dependency-hell', size, size);
    g.destroy();
  }

  generateStackOverflowTexture() {
    // Stacking blocks that grow taller
    const size = 32;
    const g = this.add.graphics();

    // Stack of orange blocks
    const colors = [0xff6600, 0xff8800, 0xffaa00, 0xffcc00];
    for (let i = 0; i < 4; i++) {
      g.fillStyle(colors[i], 1);
      g.fillRect(size/2 - 8, size - 8 - (i * 6), 16, 5);
      g.lineStyle(1, 0x000000, 0.5);
      g.strokeRect(size/2 - 8, size - 8 - (i * 6), 16, 5);
    }

    // Arrow pointing up
    g.fillStyle(0xffffff, 0.8);
    g.fillTriangle(size/2, 2, size/2 - 4, 8, size/2 + 4, 8);

    g.generateTexture('enemy-stack-overflow', size, size);
    g.destroy();
  }

  generateHallucinationTexture() {
    // Ghost-like semi-transparent enemy
    const size = 28;
    const g = this.add.graphics();

    // Ghostly body (semi-transparent)
    g.fillStyle(0x88aaff, 0.4);
    g.fillCircle(size/2, size/2 - 3, 10);
    g.fillRect(size/2 - 8, size/2, 16, 10);

    // Wavy bottom
    g.fillCircle(size/2 - 5, size/2 + 8, 4);
    g.fillCircle(size/2, size/2 + 10, 4);
    g.fillCircle(size/2 + 5, size/2 + 8, 4);

    // Hollow eyes
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(size/2 - 4, size/2 - 4, 3);
    g.fillCircle(size/2 + 4, size/2 - 4, 3);

    g.generateTexture('enemy-hallucination', size, size);
    g.destroy();
  }

  generateTokenOverflowTexture() {
    // Growing blob of text tokens
    const size = 32;
    const g = this.add.graphics();

    // Blob body (blue-ish)
    g.fillStyle(0x0088ff, 0.8);
    g.fillCircle(size/2, size/2, 12);

    // Token symbols inside
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(size/2 - 6, size/2 - 4, 3, 8);
    g.fillRect(size/2 - 1, size/2 - 6, 3, 12);
    g.fillRect(size/2 + 4, size/2 - 3, 3, 6);

    // Overflow effect (dripping)
    g.fillStyle(0x0066cc, 0.6);
    g.fillCircle(size/2 - 4, size/2 + 12, 3);
    g.fillCircle(size/2 + 4, size/2 + 10, 2);

    g.generateTexture('enemy-token-overflow', size, size);
    g.destroy();
  }

  generateContextLossTexture() {
    // Confused entity with ??? symbols
    const size = 32;
    const g = this.add.graphics();

    // Body (purple/pink confused)
    g.fillStyle(0xaa44aa, 1);
    g.fillCircle(size/2, size/2, 11);

    // Spiral confusion
    g.lineStyle(2, 0xff88ff, 0.8);
    g.strokeCircle(size/2, size/2 - 8, 4);
    g.lineBetween(size/2 + 3, size/2 - 6, size/2 + 5, size/2 - 4);

    // Question marks
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(size/2 - 6, size/2 - 3, 2);
    g.fillCircle(size/2 + 6, size/2 - 3, 2);

    // Dizzy eyes
    g.lineStyle(1, 0xffffff, 0.8);
    g.strokeCircle(size/2 - 4, size/2 + 2, 3);
    g.strokeCircle(size/2 + 4, size/2 + 2, 3);

    g.generateTexture('enemy-context-loss', size, size);
    g.destroy();
  }

  generatePromptInjectionTexture() {
    // Manipulator with control symbols
    const size = 36;
    const g = this.add.graphics();

    // Body (dark red/maroon - sinister)
    g.fillStyle(0x881144, 1);
    g.fillCircle(size/2, size/2, 13);

    // Control strings/tendrils
    g.lineStyle(2, 0xff4488, 0.8);
    g.lineBetween(size/2, size/2, size/2 - 14, size/2 - 10);
    g.lineBetween(size/2, size/2, size/2 + 14, size/2 - 10);
    g.lineBetween(size/2, size/2, size/2 - 12, size/2 + 12);
    g.lineBetween(size/2, size/2, size/2 + 12, size/2 + 12);

    // Hypnotic eyes
    g.fillStyle(0xff00ff, 1);
    g.fillCircle(size/2 - 4, size/2 - 2, 4);
    g.fillCircle(size/2 + 4, size/2 - 2, 4);

    // Inner eyes (spiral)
    g.fillStyle(0x000000, 1);
    g.fillCircle(size/2 - 4, size/2 - 2, 2);
    g.fillCircle(size/2 + 4, size/2 - 2, 2);

    // Injection symbol (syringe icon simplified)
    g.fillStyle(0xffff00, 0.8);
    g.fillRect(size/2 - 1, size/2 + 4, 2, 6);

    g.generateTexture('enemy-prompt-injection', size, size);
    g.destroy();
  }
}
