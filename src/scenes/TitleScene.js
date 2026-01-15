import Phaser from 'phaser';
import * as Audio from '../utils/audio.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
    this.selectedOption = 0;
    this.menuOptions = ['START GAME', 'UPGRADES', 'WEAPONS', 'MUSIC: OFF', 'CONTROLS'];
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
    this.add.text(300, 540, `HIGH WAVE: ${highWave}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Currency display
    const currency = window.VIBE_UPGRADES?.currency || 0;
    this.add.text(500, 540, `BITS: ${currency}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ffff'
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
          window.VIBE_CODER.reset();
          this.scene.start('ArenaScene');
        });
        break;

      case 1: // UPGRADES
        this.showUpgrades();
        break;

      case 2: // WEAPONS
        this.showWeapons();
        break;

      case 3: // MUSIC TOGGLE
        this.isMusicOn = Audio.toggleMusic();
        this.menuTexts[3].setText(`MUSIC: ${this.isMusicOn ? 'ON' : 'OFF'}`);
        break;

      case 4: // CONTROLS
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

  showUpgrades() {
    // Pause main menu interaction
    this.upgradeMenuOpen = true;
    this.upgradeSelectedIndex = 0;

    // Create overlay
    const overlay = this.add.rectangle(400, 300, 700, 500, 0x000000, 0.95);
    overlay.setStrokeStyle(2, 0x00ffff);

    const title = this.add.text(400, 80, 'UPGRADES', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Currency display
    const currencyText = this.add.text(400, 115, `BITS: ${window.VIBE_UPGRADES.currency}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Upgrade list
    const upgradeKeys = Object.keys(window.VIBE_UPGRADES.upgrades);
    const upgradeTexts = [];
    const startY = 160;
    const spacing = 42;

    upgradeKeys.forEach((key, index) => {
      const upgrade = window.VIBE_UPGRADES.upgrades[key];
      const level = window.VIBE_UPGRADES.levels[key] || 0;
      const cost = window.VIBE_UPGRADES.getCost(key);
      const maxed = level >= upgrade.maxLevel;

      const levelBar = '█'.repeat(level) + '░'.repeat(upgrade.maxLevel - level);
      const costStr = maxed ? 'MAXED' : `${cost} BITS`;
      const canAfford = window.VIBE_UPGRADES.currency >= cost && !maxed;

      const text = this.add.text(400, startY + index * spacing,
        `${upgrade.name} [${levelBar}]\n${upgrade.desc}\nCost: ${costStr}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: index === 0 ? '#00ffff' : '#888888',
        align: 'center',
        lineSpacing: 2
      }).setOrigin(0.5);

      if (!canAfford && !maxed) {
        text.setColor(index === 0 ? '#ff6666' : '#666666');
      }

      upgradeTexts.push({ text, key, canAfford, maxed });
    });

    // Selector
    const selector = this.add.text(120, startY, '>', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ffff',
      fontStyle: 'bold'
    });

    // Instructions
    const instructions = this.add.text(400, 530, '[ UP/DOWN: Select | ENTER: Purchase | ESC: Close ]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#666666'
    }).setOrigin(0.5);

    // Update visuals function
    const updateVisuals = () => {
      upgradeTexts.forEach((item, index) => {
        const upgrade = window.VIBE_UPGRADES.upgrades[item.key];
        const level = window.VIBE_UPGRADES.levels[item.key] || 0;
        const cost = window.VIBE_UPGRADES.getCost(item.key);
        const maxed = level >= upgrade.maxLevel;
        item.canAfford = window.VIBE_UPGRADES.currency >= cost && !maxed;
        item.maxed = maxed;

        const levelBar = '█'.repeat(level) + '░'.repeat(upgrade.maxLevel - level);
        const costStr = maxed ? 'MAXED' : `${cost} BITS`;

        item.text.setText(`${upgrade.name} [${levelBar}]\n${upgrade.desc}\nCost: ${costStr}`);

        if (index === this.upgradeSelectedIndex) {
          item.text.setColor(item.canAfford || maxed ? '#00ffff' : '#ff6666');
        } else {
          item.text.setColor(item.canAfford || maxed ? '#888888' : '#555555');
        }
      });

      selector.setY(startY + this.upgradeSelectedIndex * spacing);
      currencyText.setText(`BITS: ${window.VIBE_UPGRADES.currency}`);
    };

    // Input handlers
    const moveUp = () => {
      this.upgradeSelectedIndex--;
      if (this.upgradeSelectedIndex < 0) this.upgradeSelectedIndex = upgradeKeys.length - 1;
      updateVisuals();
      Audio.playXPGain();
    };

    const moveDown = () => {
      this.upgradeSelectedIndex++;
      if (this.upgradeSelectedIndex >= upgradeKeys.length) this.upgradeSelectedIndex = 0;
      updateVisuals();
      Audio.playXPGain();
    };

    const purchase = () => {
      const item = upgradeTexts[this.upgradeSelectedIndex];
      if (item.canAfford) {
        window.VIBE_UPGRADES.purchase(item.key);
        Audio.playLevelUp();
        updateVisuals();
      } else {
        // Flash red on failed purchase
        const originalColor = item.text.style.color;
        item.text.setColor('#ff0000');
        this.time.delayedCall(100, () => {
          updateVisuals();
        });
      }
    };

    const close = () => {
      // Cleanup
      this.input.keyboard.off('keydown-UP', moveUp);
      this.input.keyboard.off('keydown-DOWN', moveDown);
      this.input.keyboard.off('keydown-W', moveUp);
      this.input.keyboard.off('keydown-S', moveDown);
      this.input.keyboard.off('keydown-ENTER', purchase);
      this.input.keyboard.off('keydown-SPACE', purchase);
      this.input.keyboard.off('keydown-ESC', close);

      overlay.destroy();
      title.destroy();
      currencyText.destroy();
      selector.destroy();
      instructions.destroy();
      upgradeTexts.forEach(item => item.text.destroy());

      this.upgradeMenuOpen = false;
    };

    // Bind inputs
    this.input.keyboard.on('keydown-UP', moveUp);
    this.input.keyboard.on('keydown-DOWN', moveDown);
    this.input.keyboard.on('keydown-W', moveUp);
    this.input.keyboard.on('keydown-S', moveDown);
    this.input.keyboard.on('keydown-ENTER', purchase);
    this.input.keyboard.on('keydown-SPACE', purchase);
    this.input.keyboard.on('keydown-ESC', close);
  }

  showWeapons() {
    // Pause main menu interaction
    this.weaponMenuOpen = true;
    this.weaponSelectedIndex = 0;
    this.weaponTab = 'legendary'; // 'legendary', 'melee', 'ranged'

    // Create overlay
    const overlay = this.add.rectangle(400, 300, 750, 550, 0x000000, 0.95);
    overlay.setStrokeStyle(2, 0x00ffff);

    const title = this.add.text(400, 40, 'WEAPON GALLERY', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Tab buttons
    const tabs = ['LEGENDARY', 'MELEE', 'RANGED'];
    const tabTexts = [];
    const tabStartX = 200;
    const tabSpacing = 180;

    tabs.forEach((tab, index) => {
      const tabText = this.add.text(tabStartX + index * tabSpacing, 75, tab, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: index === 0 ? '#ffd700' : '#666666',
        fontStyle: index === 0 ? 'bold' : 'normal'
      }).setOrigin(0.5);
      tabText.setInteractive({ useHandCursor: true });
      tabTexts.push(tabText);
    });

    // Content container
    const contentElements = [];

    // Get weapon data
    const legendaries = window.VIBE_LEGENDARIES;
    const melee = window.VIBE_MELEE;

    // Ranged weapons from ArenaScene weaponTypes
    const rangedWeapons = {
      basic: { name: 'SYNTAX SHOT', desc: 'Basic projectile. Fires straight ahead.', color: '#00ffff' },
      spread: { name: 'SPREAD SHOT', desc: 'Fires 3 projectiles in a spread pattern.', color: '#00ff00' },
      pierce: { name: 'PIERCE SHOT', desc: 'Pierces through multiple enemies.', color: '#ff00ff' },
      rapid: { name: 'RAPID FIRE', desc: 'High fire rate, lower damage.', color: '#ffff00' },
      orbital: { name: 'ORBITAL', desc: 'Spinning shields orbit around you.', color: '#ff6600' },
      homing: { name: 'HOMING', desc: 'Projectiles seek nearest enemy.', color: '#ff0066' },
      bounce: { name: 'BOUNCE', desc: 'Projectiles bounce off screen edges.', color: '#66ff66' },
      aoe: { name: 'EXPLOSION', desc: 'Projectiles explode on impact.', color: '#ff3300' },
      freeze: { name: 'FREEZE RAY', desc: 'Slows enemies on hit.', color: '#66ffff' }
    };

    // Evolved weapons
    const evolvedWeapons = {
      laserbeam: { name: 'LASER BEAM', desc: 'Evolved RAPID + PIERCE. Continuous beam.', color: '#ff00ff', rare: true },
      plasmaorb: { name: 'PLASMA ORB', desc: 'Evolved ORBITAL + AOE. Explosive shields.', color: '#ff6600', rare: true },
      chainlightning: { name: 'CHAIN LIGHTNING', desc: 'Evolved HOMING + SPREAD. Chains to enemies.', color: '#00ffff', rare: true },
      bullethell: { name: 'BULLET HELL', desc: 'Evolved SPREAD + RAPID. Massive spray.', color: '#ffff00', rare: true },
      ringoffire: { name: 'RING OF FIRE', desc: 'Evolved ORBITAL + RAPID. Fire ring.', color: '#ff3300', rare: true },
      seekingmissile: { name: 'SEEKING MISSILE', desc: 'Evolved HOMING + AOE. Explosive homing.', color: '#ff0066', rare: true },
      chaosbounce: { name: 'CHAOS BOUNCE', desc: 'Evolved BOUNCE + SPREAD. Multi-bounce.', color: '#66ff66', rare: true },
      deathaura: { name: 'DEATH AURA', desc: 'Evolved ORBITAL + FREEZE. Slowing ring.', color: '#9900ff', rare: true },
      icelance: { name: 'ICE LANCE', desc: 'Evolved FREEZE + PIERCE. Freezing pierce.', color: '#00ffff', rare: true },
      blizzard: { name: 'BLIZZARD', desc: 'Evolved FREEZE + SPREAD. Area slow.', color: '#aaddff', rare: true }
    };

    // Render functions for each tab
    const renderLegendary = () => {
      clearContent();
      const startY = 120;
      const spacing = 80;
      const legendaryKeys = Object.keys(legendaries.weapons);

      legendaryKeys.forEach((key, index) => {
        const weapon = legendaries.weapons[key];
        const unlocked = legendaries.hasUnlocked(key);
        const equipped = legendaries.equipped === key;

        // Weapon icon box
        const boxX = 150;
        const boxY = startY + index * spacing;
        const box = this.add.rectangle(boxX, boxY, 60, 60, unlocked ? 0x222222 : 0x111111);
        box.setStrokeStyle(2, unlocked ? 0xffd700 : 0x333333);
        contentElements.push(box);

        // Weapon sprite if unlocked
        if (unlocked && this.textures.exists(`legendary-${key}`)) {
          const sprite = this.add.sprite(boxX, boxY, `legendary-${key}`);
          sprite.setScale(1.2);
          contentElements.push(sprite);
        } else {
          // Lock icon
          const lock = this.add.text(boxX, boxY, '?', {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#333333'
          }).setOrigin(0.5);
          contentElements.push(lock);
        }

        // Weapon name
        const nameColor = equipped ? '#ffd700' : (unlocked ? '#ffffff' : '#444444');
        const name = this.add.text(220, boxY - 20, unlocked ? weapon.name : '???', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: nameColor,
          fontStyle: equipped ? 'bold' : 'normal'
        });
        contentElements.push(name);

        // Description
        const desc = this.add.text(220, boxY, unlocked ? weapon.desc : 'Locked - Find in game (0.01% drop)', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: unlocked ? '#888888' : '#444444'
        });
        contentElements.push(desc);

        // Stats or status
        if (unlocked) {
          const stats = this.add.text(220, boxY + 18, `DMG: ${weapon.damage} | RADIUS: ${weapon.radius} | COUNT: ${weapon.orbitalCount}`, {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#666666'
          });
          contentElements.push(stats);

          // Equip button
          const equipBtn = this.add.text(620, boxY, equipped ? '[EQUIPPED]' : '[EQUIP]', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: equipped ? '#ffd700' : '#00ffff',
            fontStyle: 'bold'
          }).setOrigin(0.5);
          equipBtn.setInteractive({ useHandCursor: true });
          equipBtn.on('pointerover', () => equipBtn.setColor('#ffffff'));
          equipBtn.on('pointerout', () => equipBtn.setColor(equipped ? '#ffd700' : '#00ffff'));
          equipBtn.on('pointerdown', () => {
            if (equipped) {
              legendaries.unequip();
            } else {
              legendaries.equip(key);
            }
            renderLegendary(); // Re-render
            Audio.playLevelUp();
          });
          contentElements.push(equipBtn);
        } else {
          const dropRate = this.add.text(620, boxY, `${(weapon.dropRate * 100).toFixed(2)}% DROP`, {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#ff6666'
          }).setOrigin(0.5);
          contentElements.push(dropRate);
        }
      });

      // Info text
      const info = this.add.text(400, 520, 'Legendary weapons persist forever once unlocked!', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffd700'
      }).setOrigin(0.5);
      contentElements.push(info);
    };

    const renderMelee = () => {
      clearContent();
      const startY = 120;
      const spacing = 70;
      const meleeKeys = Object.keys(melee);

      meleeKeys.forEach((key, index) => {
        const weapon = melee[key];
        const boxX = 150;
        const boxY = startY + index * spacing;

        // Weapon icon box
        const box = this.add.rectangle(boxX, boxY, 60, 60, 0x222222);
        box.setStrokeStyle(2, weapon.color);
        contentElements.push(box);

        // Weapon sprite
        if (this.textures.exists(`melee-${key}`)) {
          const sprite = this.add.sprite(boxX, boxY, `melee-${key}`);
          sprite.setScale(1.2);
          contentElements.push(sprite);
        }

        // Weapon name
        const name = this.add.text(220, boxY - 15, weapon.name, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff'
        });
        contentElements.push(name);

        // Stats
        const stats = this.add.text(220, boxY + 5, `DMG: ${weapon.damage} | RATE: ${weapon.attackRate} | RANGE: ${weapon.range}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#888888'
        });
        contentElements.push(stats);

        // Type
        const typeText = this.add.text(620, boxY, weapon.type.toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: Phaser.Display.Color.IntegerToColor(weapon.color).rgba
        }).setOrigin(0.5);
        contentElements.push(typeText);
      });

      // Info text
      const info = this.add.text(400, 520, 'Melee weapons have 15% drop chance from enemies', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#00ffff'
      }).setOrigin(0.5);
      contentElements.push(info);
    };

    const renderRanged = () => {
      clearContent();

      // Base weapons
      const baseTitle = this.add.text(100, 110, 'BASE WEAPONS', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#00ffff',
        fontStyle: 'bold'
      });
      contentElements.push(baseTitle);

      let y = 135;
      const rangedKeys = Object.keys(rangedWeapons);
      rangedKeys.forEach((key, index) => {
        const weapon = rangedWeapons[key];
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 100 + col * 320;
        const itemY = y + row * 35;

        const text = this.add.text(x, itemY, `${weapon.name}`, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: weapon.color
        });
        contentElements.push(text);

        const desc = this.add.text(x + 120, itemY, weapon.desc.substring(0, 30), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#666666'
        });
        contentElements.push(desc);
      });

      // Evolved weapons
      const evolvedTitle = this.add.text(100, 310, 'EVOLVED WEAPONS (Combine 2 weapons!)', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ff00ff',
        fontStyle: 'bold'
      });
      contentElements.push(evolvedTitle);

      y = 335;
      const evolvedKeys = Object.keys(evolvedWeapons);
      evolvedKeys.forEach((key, index) => {
        const weapon = evolvedWeapons[key];
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 100 + col * 320;
        const itemY = y + row * 32;

        const text = this.add.text(x, itemY, `${weapon.name}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: weapon.color
        });
        contentElements.push(text);

        const desc = this.add.text(x + 130, itemY, weapon.desc.substring(0, 28), {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#555555'
        });
        contentElements.push(desc);
      });

      // Info text
      const info = this.add.text(400, 520, 'Ranged weapons drop from enemies during gameplay', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#00ffff'
      }).setOrigin(0.5);
      contentElements.push(info);
    };

    const clearContent = () => {
      contentElements.forEach(el => el.destroy());
      contentElements.length = 0;
    };

    const switchTab = (tabIndex) => {
      tabTexts.forEach((t, i) => {
        t.setColor(i === tabIndex ? '#ffd700' : '#666666');
        t.setFontStyle(i === tabIndex ? 'bold' : 'normal');
      });

      if (tabIndex === 0) {
        this.weaponTab = 'legendary';
        renderLegendary();
      } else if (tabIndex === 1) {
        this.weaponTab = 'melee';
        renderMelee();
      } else {
        this.weaponTab = 'ranged';
        renderRanged();
      }
    };

    // Tab click handlers
    tabTexts.forEach((t, i) => {
      t.on('pointerdown', () => {
        switchTab(i);
        Audio.playXPGain();
      });
    });

    // Instructions
    const instructions = this.add.text(400, 555, '[ LEFT/RIGHT: Switch Tab | ESC: Close ]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#666666'
    }).setOrigin(0.5);

    // Initial render
    renderLegendary();

    // Input handlers
    let currentTab = 0;

    const tabLeft = () => {
      currentTab--;
      if (currentTab < 0) currentTab = 2;
      switchTab(currentTab);
      Audio.playXPGain();
    };

    const tabRight = () => {
      currentTab++;
      if (currentTab > 2) currentTab = 0;
      switchTab(currentTab);
      Audio.playXPGain();
    };

    const close = () => {
      this.input.keyboard.off('keydown-LEFT', tabLeft);
      this.input.keyboard.off('keydown-RIGHT', tabRight);
      this.input.keyboard.off('keydown-A', tabLeft);
      this.input.keyboard.off('keydown-D', tabRight);
      this.input.keyboard.off('keydown-ESC', close);

      clearContent();
      overlay.destroy();
      title.destroy();
      instructions.destroy();
      tabTexts.forEach(t => t.destroy());

      this.weaponMenuOpen = false;
    };

    // Bind inputs
    this.input.keyboard.on('keydown-LEFT', tabLeft);
    this.input.keyboard.on('keydown-RIGHT', tabRight);
    this.input.keyboard.on('keydown-A', tabLeft);
    this.input.keyboard.on('keydown-D', tabRight);
    this.input.keyboard.on('keydown-ESC', close);
  }
}
