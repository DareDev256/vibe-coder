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

    // We'll generate textures in create() instead of loading sprite sheets
    this.time.delayedCall(500, () => {
      loadingText.destroy();
    });
  }

  create() {
    // Generate all game textures programmatically
    this.generatePlayerTexture();
    this.generateBugTexture();
    this.generateGlitchTexture();
    this.generateMemoryLeakTexture();
    this.generateSlashTexture();

    // Weapon pickup textures
    this.generateSpreadWeaponTexture();
    this.generatePierceWeaponTexture();
    this.generateOrbitalWeaponTexture();
    this.generateRapidWeaponTexture();

    // Rare weapon textures
    this.generateRmRfWeaponTexture();
    this.generateSudoWeaponTexture();
    this.generateForkBombWeaponTexture();

    // New enemy types
    this.generateSyntaxErrorTexture();
    this.generateInfiniteLoopTexture();
    this.generateRaceConditionTexture();

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

    console.log('Textures generated! Starting title...');
    this.scene.start('TitleScene');
  }

  generatePlayerTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 48;

    // Outer glow
    g.fillStyle(0x00ffff, 0.2);
    g.fillCircle(size/2, size/2, size/2);

    // Body (dark purple)
    g.fillStyle(0x1a0a2e, 1);
    g.fillRoundedRect(size/2 - 12, size/2 - 8, 24, 28, 4);

    // Hood
    g.fillStyle(0x2d1b4e, 1);
    g.fillTriangle(
      size/2, size/2 - 16,    // top
      size/2 - 14, size/2,    // bottom left
      size/2 + 14, size/2     // bottom right
    );

    // Cyan tron lines
    g.lineStyle(2, 0x00ffff, 1);
    g.lineBetween(size/2 - 8, size/2 + 2, size/2 - 8, size/2 + 16);
    g.lineBetween(size/2 + 8, size/2 + 2, size/2 + 8, size/2 + 16);
    g.lineBetween(size/2 - 6, size/2 + 16, size/2 + 6, size/2 + 16);

    // Glowing eyes
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(size/2 - 5, size/2 - 4, 3);
    g.fillCircle(size/2 + 5, size/2 - 4, 3);

    // Inner eye glow
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2 - 5, size/2 - 4, 1);
    g.fillCircle(size/2 + 5, size/2 - 4, 1);

    g.generateTexture('player', size, size);
    g.destroy();
  }

  generateBugTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    // Body segments
    g.fillStyle(0x0a4a0a, 1);
    g.fillEllipse(size/2, size/2, 20, 24);

    // Shell
    g.fillStyle(0x1a8a1a, 1);
    g.fillEllipse(size/2, size/2 - 2, 16, 18);

    // Shell line
    g.lineStyle(2, 0x0a4a0a, 1);
    g.lineBetween(size/2, size/2 - 10, size/2, size/2 + 8);

    // Glowing segments
    g.fillStyle(0x00ff00, 0.8);
    g.fillCircle(size/2, size/2 - 4, 3);
    g.fillCircle(size/2, size/2 + 2, 2);
    g.fillCircle(size/2, size/2 + 6, 2);

    // Legs
    g.lineStyle(2, 0x0a3a0a, 1);
    g.lineBetween(size/2 - 8, size/2 - 4, size/2 - 14, size/2 - 8);
    g.lineBetween(size/2 + 8, size/2 - 4, size/2 + 14, size/2 - 8);
    g.lineBetween(size/2 - 8, size/2, size/2 - 14, size/2);
    g.lineBetween(size/2 + 8, size/2, size/2 + 14, size/2);
    g.lineBetween(size/2 - 8, size/2 + 4, size/2 - 14, size/2 + 8);
    g.lineBetween(size/2 + 8, size/2 + 4, size/2 + 14, size/2 + 8);

    // Antennae
    g.lineStyle(1, 0x00ff00, 1);
    g.lineBetween(size/2 - 4, size/2 - 10, size/2 - 6, size/2 - 16);
    g.lineBetween(size/2 + 4, size/2 - 10, size/2 + 6, size/2 - 16);

    g.generateTexture('bug', size, size);
    g.destroy();
  }

  generateGlitchTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 36;

    // Glitchy body - multiple offset shapes
    g.fillStyle(0xff00ff, 0.3);
    g.fillRect(size/2 - 10 - 2, size/2 - 12, 20, 24);

    g.fillStyle(0x00ffff, 0.3);
    g.fillRect(size/2 - 10 + 2, size/2 - 12, 20, 24);

    // Main body
    g.fillStyle(0xff00ff, 0.8);
    g.fillRect(size/2 - 10, size/2 - 12, 20, 24);

    // Static noise lines
    g.lineStyle(1, 0x00ffff, 0.8);
    for (let i = 0; i < 6; i++) {
      const y = size/2 - 10 + i * 4;
      const offset = (i % 2) * 4 - 2;
      g.lineBetween(size/2 - 8 + offset, y, size/2 + 8 + offset, y);
    }

    // Creepy eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(size/2 - 6, size/2 - 6, 4, 6);
    g.fillRect(size/2 + 2, size/2 - 6, 4, 6);

    // Glitch artifacts
    g.fillStyle(0x00ffff, 0.6);
    g.fillRect(size/2 - 14, size/2 - 2, 4, 2);
    g.fillRect(size/2 + 10, size/2 + 4, 4, 2);

    g.generateTexture('glitch', size, size);
    g.destroy();
  }

  generateMemoryLeakTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 44;

    // Outer ooze
    g.fillStyle(0x6600aa, 0.4);
    g.fillCircle(size/2, size/2, size/2 - 2);

    // Main blob body
    g.fillStyle(0x8800cc, 0.8);
    g.fillCircle(size/2, size/2, size/2 - 6);

    // Inner glow
    g.fillStyle(0xaa00ff, 1);
    g.fillCircle(size/2, size/2, size/2 - 12);

    // Core
    g.fillStyle(0xff00ff, 1);
    g.fillCircle(size/2, size/2, 6);

    // Bright center
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(size/2, size/2, 3);

    // Dripping tendrils
    g.fillStyle(0x8800cc, 0.6);
    g.fillEllipse(size/2 - 10, size/2 + 14, 6, 10);
    g.fillEllipse(size/2 + 10, size/2 + 12, 5, 8);
    g.fillEllipse(size/2, size/2 + 16, 4, 8);

    g.generateTexture('memory-leak', size, size);
    g.destroy();
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

  generateSyntaxErrorTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 28;

    // Fast, small, red - like a compiler error
    g.fillStyle(0xff3333, 0.8);
    g.fillTriangle(size/2, size/2 - 10, size/2 - 10, size/2 + 8, size/2 + 10, size/2 + 8);

    // Exclamation mark
    g.fillStyle(0xffffff, 1);
    g.fillRect(size/2 - 2, size/2 - 6, 4, 8);
    g.fillCircle(size/2, size/2 + 5, 2);

    // Glow
    g.lineStyle(2, 0xff0000, 0.5);
    g.strokeTriangle(size/2, size/2 - 10, size/2 - 10, size/2 + 8, size/2 + 10, size/2 + 8);

    g.generateTexture('syntax-error', size, size);
    g.destroy();
  }

  generateInfiniteLoopTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 36;

    // Infinity symbol / spinning loop - yellow
    g.fillStyle(0xffaa00, 0.3);
    g.fillCircle(size/2, size/2, size/2 - 4);

    // Two connected circles (infinity)
    g.lineStyle(4, 0xffdd00, 1);
    g.strokeCircle(size/2 - 6, size/2, 8);
    g.strokeCircle(size/2 + 6, size/2, 8);

    // Center connection
    g.fillStyle(0xffff00, 1);
    g.fillCircle(size/2, size/2, 4);

    // Arrows suggesting rotation
    g.fillStyle(0xffffff, 0.8);
    g.fillTriangle(size/2 - 12, size/2 - 6, size/2 - 8, size/2 - 10, size/2 - 8, size/2 - 2);
    g.fillTriangle(size/2 + 12, size/2 + 6, size/2 + 8, size/2 + 10, size/2 + 8, size/2 + 2);

    g.generateTexture('infinite-loop', size, size);
    g.destroy();
  }

  generateRaceConditionTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 34;

    // Two overlapping shapes - representing competing threads
    // Shape 1 - cyan
    g.fillStyle(0x00ffff, 0.6);
    g.fillCircle(size/2 - 5, size/2, 10);

    // Shape 2 - magenta
    g.fillStyle(0xff00ff, 0.6);
    g.fillCircle(size/2 + 5, size/2, 10);

    // Collision sparks in middle
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size/2, size/2, 4);

    // Lightning bolt effect
    g.lineStyle(2, 0xffff00, 1);
    g.lineBetween(size/2, size/2 - 8, size/2 - 3, size/2);
    g.lineBetween(size/2 - 3, size/2, size/2 + 3, size/2);
    g.lineBetween(size/2 + 3, size/2, size/2, size/2 + 8);

    // Speed lines
    g.lineStyle(1, 0x00ffff, 0.5);
    g.lineBetween(size/2 - 14, size/2 - 4, size/2 - 18, size/2 - 4);
    g.lineBetween(size/2 - 14, size/2, size/2 - 20, size/2);
    g.lineBetween(size/2 - 14, size/2 + 4, size/2 - 18, size/2 + 4);

    g.generateTexture('race-condition', size, size);
    g.destroy();
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
}
