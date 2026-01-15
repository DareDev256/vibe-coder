import Phaser from 'phaser';
import * as Audio from '../utils/audio.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
    this.selectedOption = 0;
    this.menuOptions = ['START GAME', 'MUSIC: OFF', 'CONTROLS'];
    this.isMusicOn = false;
  }

  create() {
    // Initialize audio on first interaction
    this.input.once('pointerdown', () => {
      Audio.initAudio();
      Audio.resumeAudio();
    });
    this.input.keyboard.once('keydown', () => {
      Audio.initAudio();
      Audio.resumeAudio();
    });

    // Create animated background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create menu
    this.createMenu();

    // Create footer info
    this.createFooter();

    // Setup input
    this.setupInput();

    // Floating code particles
    this.createCodeParticles();
  }

  createBackground() {
    const graphics = this.add.graphics();

    // Gradient background
    for (let y = 0; y < 600; y += 2) {
      const ratio = y / 600;
      const r = Math.floor(10 + ratio * 5);
      const g = Math.floor(10 + ratio * 15);
      const b = Math.floor(25 + ratio * 10);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      graphics.fillRect(0, y, 800, 2);
    }

    // Grid lines
    graphics.lineStyle(1, 0x00ffff, 0.1);
    for (let x = 0; x < 800; x += 50) {
      graphics.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y < 600; y += 50) {
      graphics.lineBetween(0, y, 800, y);
    }

    // Animated scanlines
    this.scanlines = this.add.graphics();
    this.scanlines.setAlpha(0.03);

    this.time.addEvent({
      delay: 50,
      callback: () => {
        this.scanlines.clear();
        this.scanlines.fillStyle(0xffffff, 1);
        for (let y = (this.time.now / 20) % 4; y < 600; y += 4) {
          this.scanlines.fillRect(0, y, 800, 1);
        }
      },
      loop: true
    });
  }

  createTitle() {
    // Main title with glitch effect
    this.titleText = this.add.text(400, 120, 'VIBE CODER', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#003333',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Glitch effect on title
    this.time.addEvent({
      delay: 3000,
      callback: () => this.glitchTitle(),
      loop: true
    });

    // Subtitle
    this.add.text(400, 180, 'CODE TO CONQUER', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ff00ff'
    }).setOrigin(0.5);

    // Animated underline
    const underline = this.add.graphics();
    underline.lineStyle(2, 0x00ffff, 0.8);
    underline.lineBetween(200, 200, 600, 200);

    this.tweens.add({
      targets: underline,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Version
    this.add.text(400, 215, 'v1.0 // POWERED BY CLAUDE CODE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  glitchTitle() {
    const originalX = 400;
    const originalColor = '#00ffff';

    // Quick glitch
    this.titleText.setX(originalX + Phaser.Math.Between(-5, 5));
    this.titleText.setColor('#ff0000');

    this.time.delayedCall(50, () => {
      this.titleText.setX(originalX + Phaser.Math.Between(-3, 3));
      this.titleText.setColor('#00ff00');
    });

    this.time.delayedCall(100, () => {
      this.titleText.setX(originalX);
      this.titleText.setColor(originalColor);
    });
  }

  createMenu() {
    this.menuTexts = [];
    const startY = 300;
    const spacing = 50;

    this.menuOptions.forEach((option, index) => {
      const text = this.add.text(400, startY + index * spacing, option, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: index === 0 ? '#00ffff' : '#666666',
        fontStyle: index === 0 ? 'bold' : 'normal'
      }).setOrigin(0.5);

      this.menuTexts.push(text);
    });

    // Selection indicator
    this.selector = this.add.text(280, startY, '>', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Blink selector
    this.tweens.add({
      targets: this.selector,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Prompt text
    this.promptText = this.add.text(400, 480, '[ PRESS ENTER TO SELECT // ARROWS TO NAVIGATE ]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  createFooter() {
    // High score display
    const highWave = localStorage.getItem('vibeCoderHighWave') || '0';
    this.add.text(400, 540, `HIGH WAVE: ${highWave}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Credits
    this.add.text(400, 570, 'A VAMPIRE SURVIVORS-STYLE IDLE GAME', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#444444'
    }).setOrigin(0.5);
  }

  createCodeParticles() {
    // Floating code symbols
    const codeSymbols = ['{ }', '( )', '< >', '[ ]', '//', '/*', '*/', '=>', '&&', '||', '!=', '==', '++', '--', '::'];

    for (let i = 0; i < 15; i++) {
      const symbol = Phaser.Utils.Array.GetRandom(codeSymbols);
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(250, 550);

      const particle = this.add.text(x, y, symbol, {
        fontFamily: 'monospace',
        fontSize: Phaser.Math.Between(10, 16) + 'px',
        color: '#00ffff'
      }).setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));

      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-50, 50),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        onComplete: () => {
          particle.setPosition(Phaser.Math.Between(50, 750), Phaser.Math.Between(250, 550));
          particle.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
          this.tweens.add({
            targets: particle,
            y: particle.y + Phaser.Math.Between(-50, 50),
            alpha: 0,
            duration: Phaser.Math.Between(3000, 6000),
            repeat: -1,
            yoyo: false
          });
        }
      });
    }
  }

  setupInput() {
    // Arrow keys
    this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard.on('keydown-W', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-S', () => this.moveSelection(1));

    // Enter/Space to select
    this.input.keyboard.on('keydown-ENTER', () => this.selectOption());
    this.input.keyboard.on('keydown-SPACE', () => this.selectOption());

    // Click on menu items
    this.menuTexts.forEach((text, index) => {
      text.setInteractive({ useHandCursor: true });
      text.on('pointerover', () => {
        this.selectedOption = index;
        this.updateMenuVisuals();
      });
      text.on('pointerdown', () => {
        this.selectedOption = index;
        this.selectOption();
      });
    });
  }

  moveSelection(direction) {
    Audio.initAudio();

    this.selectedOption += direction;
    if (this.selectedOption < 0) this.selectedOption = this.menuOptions.length - 1;
    if (this.selectedOption >= this.menuOptions.length) this.selectedOption = 0;

    this.updateMenuVisuals();

    // Play blip sound
    Audio.playXPGain();
  }

  updateMenuVisuals() {
    const startY = 300;
    const spacing = 50;

    this.menuTexts.forEach((text, index) => {
      if (index === this.selectedOption) {
        text.setColor('#00ffff');
        text.setFontStyle('bold');
      } else {
        text.setColor('#666666');
        text.setFontStyle('normal');
      }
    });

    // Move selector
    this.selector.setY(startY + this.selectedOption * spacing);
  }

  selectOption() {
    Audio.initAudio();

    switch (this.selectedOption) {
      case 0: // START GAME
        Audio.playLevelUp();
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.start('ArenaScene');
        });
        break;

      case 1: // MUSIC TOGGLE
        this.isMusicOn = Audio.toggleMusic();
        this.menuTexts[1].setText(`MUSIC: ${this.isMusicOn ? 'ON' : 'OFF'}`);
        break;

      case 2: // CONTROLS
        this.showControls();
        break;
    }
  }

  showControls() {
    // Create overlay
    const overlay = this.add.rectangle(400, 300, 600, 400, 0x000000, 0.9);
    overlay.setStrokeStyle(2, 0x00ffff);

    const controlsTitle = this.add.text(400, 150, 'CONTROLS', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const controls = [
      'WASD / ARROWS - Move',
      'SPACE - Manual XP (when offline)',
      'M - Toggle Music',
      'ESC / P - Pause Game',
      '',
      'AUTO-ATTACK is always active!',
      'Collect weapons to power up!',
      '',
      'Connect XP server for LIVE mode:',
      'npm run server'
    ];

    // Store all control text elements for cleanup
    const controlTexts = [];
    controls.forEach((line, index) => {
      const text = this.add.text(400, 200 + index * 25, line, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: line.includes('npm') ? '#ffff00' : '#ffffff'
      }).setOrigin(0.5);
      controlTexts.push(text);
    });

    const closeText = this.add.text(400, 480, '[ PRESS ANY KEY OR CLICK TO CLOSE ]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);

    // Cleanup function
    const closeControls = () => {
      overlay.destroy();
      controlsTitle.destroy();
      closeText.destroy();
      controlTexts.forEach(t => t.destroy());
    };

    // Close on any key
    this.input.keyboard.once('keydown', closeControls);
    this.input.once('pointerdown', closeControls);
  }
}
