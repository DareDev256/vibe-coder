import Phaser from 'phaser';
import * as Audio from '../utils/audio.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
    this.selectedOption = 0;
    this.menuOptions = ['START GAME', 'UPGRADES', 'WEAPONS', 'SETTINGS', 'CONTROLS'];
    this.isMusicOn = false;
    this.settingsMenuOpen = false;
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

    // Idle character on title screen
    this.createIdleCharacter();
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

  createIdleCharacter() {
    // Floating Warglaive decoration in bottom right
    this.warglaiveDecor = this.add.sprite(680, 480, 'legendary-huntersWarglaive');
    this.warglaiveDecor.setScale(3); // Scaled up since sprite is now 32x32
    this.warglaiveDecor.setAlpha(0.95);

    // Gentle floating animation - no rotation, just hovering
    this.tweens.add({
      targets: this.warglaiveDecor,
      y: 470,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtle glow pulse
    this.tweens.add({
      targets: this.warglaiveDecor,
      alpha: 0.75,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Player character
    this.idlePlayer = this.add.sprite(150, 500, 'player');
    this.idlePlayer.setScale(2);
    this.idlePlayer.play('player-idle');

    // Speech bubble (hidden initially)
    this.speechBubble = this.add.graphics();
    this.speechText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 140 }
    }).setOrigin(0.5);
    this.speechBubble.setVisible(false);
    this.speechText.setVisible(false);

    // Character state
    this.charState = 'idle';
    this.charTarget = null;
    this.speechTimer = null;
    this.nearWarglaive = false;

    // Title screen enemies (for defense demo)
    this.titleEnemies = [];
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 4000; // Spawn every 4 seconds
    this.titleProjectiles = [];

    // Start title screen defense
    this.startTitleDefense();

    // Random quotes
    this.idleQuotes = [
      "Start game bro\nlets get coding",
      "...",
      "*stretches*",
      "Ready to debug\nsome bugs?",
      "Ctrl+S everything",
      "git push --force\njk jk",
      "Bugs fear me",
      "Coffee break?",
      "npm install\n*infinite*"
    ];

    this.warglaiveQuotes = [
      // Luu - artwork credit
      "Artwork by Luu\n*absolute masterpiece*",
      // DareDev256 - the almighty
      "DareDev256...\nthe ALMIGHTY",
      "ALL HAIL\nDareDev256",
      "DareDev256\nblessed this game",
      "DareDev256 is\nbuilt different",
      // Raw references
      "Can't wait to swing\nthe RAWGLAIVE",
      "Raw mode\nACTIVATED",
      "Raw's watching...\n*no pressure*",
      // Claude
      "Claude coded this\nwith me btw",
      "Opus-powered\ngameplay",
      // General hype
      "0.01% drop rate\nworth it tho"
    ];

    // Coding activity quotes
    this.codingQuotes = [
      "Okay okay let me\ngo you coding maniac",
      "TASK IN PROGRESS",
      "Check your terminal!\nPrompt is done",
      "Yooo you're on fire!",
      "Code go brrrr",
      "Stack overflow who?",
      "Ship it ship it!",
      "Clean code detected",
      "*watching intensely*",
      "10x developer mode"
    ];

    this.xpConnectedQuotes = [
      "XP SERVER LIVE!\nLets get this bread",
      "We're connected!\nTime to grind",
      "Live mode activated"
    ];

    this.xpDisconnectedQuotes = [
      "XP server down...\nPress SPACE manually",
      "Connection lost\n*sad beep*"
    ];

    // Time-based easter egg quotes
    this.lateNightQuotes = [
      "Coding at this hour?\n*respect*",
      "Sleep is for the weak",
      "3am coding\nhits different",
      "Night owl mode\nACTIVATED",
      "The bugs come out\nat night..."
    ];

    this.earlyMorningQuotes = [
      "Early bird\ngets the bugs!",
      "Morning grind\nlet's go",
      "Coffee + code\n= productivity"
    ];

    this.workHoursQuotes = [
      "Work mode?\nI see you",
      "Meeting in 5?\nOne more wave",
      "Standup can wait"
    ];

    this.eveningQuotes = [
      "After hours grind!",
      "Off the clock\nstill coding",
      "Side project time?"
    ];

    this.nightQuotes = [
      "Late night session",
      "One more commit...",
      "Debug o'clock"
    ];

    this.weekendQuotes = [
      "Weekend warrior!",
      "No rest for\nthe dedicated",
      "Saturday deploy?\nBold move"
    ];

    // CLI source-specific quotes
    this.claudeQuotes = [
      "Claude cooking!",
      "Opus mode\nactivated",
      "Claude Code\ngoes hard"
    ];

    this.codexQuotes = [
      "Codex in the house!",
      "OpenAI assist!"
    ];

    this.geminiQuotes = [
      "Gemini vibes!",
      "Google AI\non the scene"
    ];

    this.cursorQuotes = [
      "Cursor flow!",
      "Tab-tab-tab\nCursor magic"
    ];

    // Track last XP event time to avoid spam
    this.lastXPReaction = 0;
    this.shownTimeQuote = false;
    this.xpReactionCooldown = 5000; // 5 second cooldown

    // Listen for coding activity events
    this.setupCodingListeners();

    // Start idle behavior loop
    this.startIdleBehavior();
  }

  setupCodingListeners() {
    // XP gained from coding
    this.xpGainedHandler = (event) => {
      const now = Date.now();
      if (now - this.lastXPReaction > this.xpReactionCooldown) {
        this.lastXPReaction = now;
        // React to coding!
        this.reactToCoding();
      }
    };

    // XP server connected
    this.xpConnectedHandler = () => {
      this.time.delayedCall(500, () => {
        this.sayQuote(Phaser.Utils.Array.GetRandom(this.xpConnectedQuotes));
      });
    };

    // XP server disconnected
    this.xpDisconnectedHandler = () => {
      this.sayQuote(Phaser.Utils.Array.GetRandom(this.xpDisconnectedQuotes));
    };

    // Level up event
    this.levelUpHandler = (event) => {
      this.sayQuote(`LEVEL ${event.detail.level}!\nLET'S GOOO`);
    };

    // Add the listeners
    window.addEventListener('xpgained', this.xpGainedHandler);
    window.addEventListener('xpserver-connected', this.xpConnectedHandler);
    window.addEventListener('xpserver-disconnected', this.xpDisconnectedHandler);
    window.addEventListener('levelup', this.levelUpHandler);
  }

  reactToCoding() {
    // Don't react if menu is open
    if (this.upgradeMenuOpen || this.weaponMenuOpen) return;

    // Check for CLI-specific reactions
    const source = window.VIBE_CODER?.lastXPSource?.name?.toLowerCase();
    let quotePool = this.codingQuotes;

    if (source === 'claude') {
      // 50% chance to use Claude-specific quote
      if (Math.random() < 0.5) {
        quotePool = this.claudeQuotes;
      }
    } else if (source === 'codex') {
      if (Math.random() < 0.5) {
        quotePool = this.codexQuotes;
      }
    } else if (source === 'gemini') {
      if (Math.random() < 0.5) {
        quotePool = this.geminiQuotes;
      }
    } else if (source === 'cursor') {
      if (Math.random() < 0.5) {
        quotePool = this.cursorQuotes;
      }
    }

    // Get excited!
    this.sayQuote(Phaser.Utils.Array.GetRandom(quotePool));

    // Maybe jump or react physically
    if (Phaser.Math.Between(0, 2) === 0) {
      // Little hop animation
      this.tweens.add({
        targets: this.idlePlayer,
        y: this.idlePlayer.y - 15,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }
  }

  startIdleBehavior() {
    // Random behavior every 3-8 seconds
    this.time.addEvent({
      delay: Phaser.Math.Between(3000, 6000),
      callback: () => this.doRandomAction(),
      loop: true
    });

    // Initial action after short delay
    this.time.delayedCall(1500, () => this.doRandomAction());
  }

  doRandomAction() {
    // Don't interrupt if any menu is open
    if (this.upgradeMenuOpen || this.weaponMenuOpen || this.settingsMenuOpen) return;

    // Show time-based quote on first idle action (personalized if name set)
    if (!this.shownTimeQuote) {
      this.shownTimeQuote = true;
      const name = window.VIBE_SETTINGS?.playerName;
      if (name) {
        this.sayQuote(`Hey ${name}!\n${this.getTimeBasedQuote()}`);
      } else {
        this.sayQuote(this.getTimeBasedQuote());
      }
      return;
    }

    const action = Phaser.Math.Between(0, 12);

    if (action < 3) {
      // Walk to random position
      this.walkTo(Phaser.Math.Between(80, 300), 500);
    } else if (action < 5) {
      // Walk toward warglaive
      this.walkTo(600, 490, true);
    } else if (action < 7) {
      // Say random idle quote
      this.sayQuote(Phaser.Utils.Array.GetRandom(this.idleQuotes));
    } else if (action < 9) {
      // Say time-based quote (occasionally)
      this.sayQuote(this.getTimeBasedQuote());
    } else {
      // Just chill, play idle
      this.idlePlayer.play('player-idle');
    }
  }

  walkTo(targetX, targetY, goingToWarglaive = false) {
    if (this.charState === 'walking') return;

    this.charState = 'walking';
    this.charTarget = { x: targetX, y: targetY };

    // Face the right direction
    const dx = targetX - this.idlePlayer.x;
    this.idlePlayer.setFlipX(dx < 0);

    // Play walk animation
    this.idlePlayer.play('player-walk-side');

    // Tween to target
    this.tweens.add({
      targets: this.idlePlayer,
      x: targetX,
      y: targetY,
      duration: Math.abs(dx) * 8 + 500,
      ease: 'Linear',
      onComplete: () => {
        this.charState = 'idle';
        this.idlePlayer.play('player-idle');

        // Check if near warglaive
        const distToWarglaive = Phaser.Math.Distance.Between(
          this.idlePlayer.x, this.idlePlayer.y,
          this.warglaiveDecor.x, this.warglaiveDecor.y
        );

        if (distToWarglaive < 150 && goingToWarglaive) {
          this.nearWarglaive = true;
          // Face the warglaive
          this.idlePlayer.setFlipX(false);
          // Say warglaive quote
          this.time.delayedCall(300, () => {
            this.sayQuote(Phaser.Utils.Array.GetRandom(this.warglaiveQuotes));
          });
        } else {
          this.nearWarglaive = false;
        }
      }
    });
  }

  sayQuote(text) {
    // Clear existing speech
    if (this.speechTimer) {
      this.speechTimer.remove();
    }

    // Position bubble above player
    const bubbleX = this.idlePlayer.x;
    const bubbleY = this.idlePlayer.y - 50;

    // Draw speech bubble
    this.speechBubble.clear();
    this.speechBubble.fillStyle(0xffffff, 0.95);
    this.speechBubble.lineStyle(2, 0x00ffff, 1);

    // Bubble shape
    const bubbleWidth = 150;
    const bubbleHeight = 45;
    this.speechBubble.fillRoundedRect(
      bubbleX - bubbleWidth/2,
      bubbleY - bubbleHeight/2,
      bubbleWidth,
      bubbleHeight,
      8
    );
    this.speechBubble.strokeRoundedRect(
      bubbleX - bubbleWidth/2,
      bubbleY - bubbleHeight/2,
      bubbleWidth,
      bubbleHeight,
      8
    );

    // Little triangle pointer
    this.speechBubble.fillTriangle(
      bubbleX - 8, bubbleY + bubbleHeight/2,
      bubbleX + 8, bubbleY + bubbleHeight/2,
      bubbleX, bubbleY + bubbleHeight/2 + 10
    );
    this.speechBubble.lineStyle(2, 0x00ffff, 1);
    this.speechBubble.lineBetween(bubbleX - 8, bubbleY + bubbleHeight/2, bubbleX, bubbleY + bubbleHeight/2 + 10);
    this.speechBubble.lineBetween(bubbleX + 8, bubbleY + bubbleHeight/2, bubbleX, bubbleY + bubbleHeight/2 + 10);

    // Set text
    this.speechText.setPosition(bubbleX, bubbleY);
    this.speechText.setText(text);

    // Show
    this.speechBubble.setVisible(true);
    this.speechText.setVisible(true);

    // Hide after delay
    this.speechTimer = this.time.delayedCall(3000, () => {
      this.speechBubble.setVisible(false);
      this.speechText.setVisible(false);
    });
  }

  getTimeBasedQuote() {
    const hour = new Date().getHours();
    const day = new Date().getDay(); // 0 = Sunday

    // Weekend special (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) {
      return Phaser.Utils.Array.GetRandom(this.weekendQuotes);
    }

    // Late night (12am - 5am)
    if (hour >= 0 && hour < 5) {
      return Phaser.Utils.Array.GetRandom(this.lateNightQuotes);
    }

    // Early morning (5am - 9am)
    if (hour >= 5 && hour < 9) {
      return Phaser.Utils.Array.GetRandom(this.earlyMorningQuotes);
    }

    // Work hours (9am - 5pm)
    if (hour >= 9 && hour < 17) {
      return Phaser.Utils.Array.GetRandom(this.workHoursQuotes);
    }

    // Evening (5pm - 9pm)
    if (hour >= 17 && hour < 21) {
      return Phaser.Utils.Array.GetRandom(this.eveningQuotes);
    }

    // Night (9pm - 12am)
    return Phaser.Utils.Array.GetRandom(this.nightQuotes);
  }

  startTitleDefense() {
    // Spawn enemies periodically on title screen
    this.time.addEvent({
      delay: this.enemySpawnInterval,
      callback: () => this.spawnTitleEnemy(),
      loop: true
    });

    // Update loop for title defense
    this.time.addEvent({
      delay: 50, // 20fps update
      callback: () => this.updateTitleDefense(),
      loop: true
    });

    // Character auto-attacks nearby enemies
    this.time.addEvent({
      delay: 800, // Attack every 800ms
      callback: () => this.titleAttack(),
      loop: true
    });
  }

  spawnTitleEnemy() {
    // Don't spawn if menus are open
    if (this.upgradeMenuOpen || this.weaponMenuOpen || this.settingsMenuOpen) return;

    // Spawn from right side of screen
    const x = 850;
    const y = Phaser.Math.Between(420, 550);

    // Create enemy sprite (use bug texture)
    const enemy = this.add.sprite(x, y, 'bug');
    enemy.setScale(1.5);
    enemy.play('bug-walk');
    enemy.setAlpha(0.8);
    enemy.health = 1;
    enemy.speed = Phaser.Math.Between(15, 30);

    this.titleEnemies.push(enemy);

    // Character reacts
    if (Math.random() < 0.3) {
      this.sayQuote(Phaser.Utils.Array.GetRandom([
        "Incoming!",
        "Not on my watch",
        "Bug spotted!",
        "Defending the code",
        "*combat mode*"
      ]));
    }
  }

  updateTitleDefense() {
    // Move enemies toward player
    this.titleEnemies = this.titleEnemies.filter(enemy => {
      if (!enemy.active) return false;

      // Move toward player
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.idlePlayer.x, this.idlePlayer.y);
      enemy.x += Math.cos(angle) * enemy.speed * 0.05;
      enemy.y += Math.sin(angle) * enemy.speed * 0.05;

      // Face movement direction
      enemy.setFlipX(Math.cos(angle) < 0);

      // Remove if off screen left
      if (enemy.x < -50) {
        enemy.destroy();
        return false;
      }

      return true;
    });

    // Update projectiles
    this.titleProjectiles = this.titleProjectiles.filter(proj => {
      if (!proj.active) return false;

      // Move projectile
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Check collision with enemies
      for (let i = this.titleEnemies.length - 1; i >= 0; i--) {
        const enemy = this.titleEnemies[i];
        if (!enemy.active) continue;

        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y);
        if (dist < 25) {
          // Hit!
          this.killTitleEnemy(enemy);
          this.titleEnemies.splice(i, 1);
          proj.destroy();
          return false;
        }
      }

      // Remove if off screen
      if (proj.x < -20 || proj.x > 820 || proj.y < -20 || proj.y > 620) {
        proj.destroy();
        return false;
      }

      return true;
    });
  }

  titleAttack() {
    // Don't attack if menus are open or walking
    if (this.upgradeMenuOpen || this.weaponMenuOpen || this.settingsMenuOpen) return;
    if (this.charState === 'walking') return;

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = 400; // Max attack range

    this.titleEnemies.forEach(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.idlePlayer.x, this.idlePlayer.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });

    if (nearestEnemy) {
      // Face the enemy
      this.idlePlayer.setFlipX(nearestEnemy.x < this.idlePlayer.x);

      // Fire projectile
      const angle = Phaser.Math.Angle.Between(
        this.idlePlayer.x, this.idlePlayer.y,
        nearestEnemy.x, nearestEnemy.y
      );

      const proj = this.add.rectangle(
        this.idlePlayer.x + Math.cos(angle) * 20,
        this.idlePlayer.y + Math.sin(angle) * 20,
        12, 4, 0x00ffff
      );
      proj.setRotation(angle);
      proj.vx = Math.cos(angle) * 8;
      proj.vy = Math.sin(angle) * 8;

      // Glow effect
      proj.setAlpha(0.9);

      this.titleProjectiles.push(proj);

      // Play sound if SFX enabled
      if (window.VIBE_SETTINGS?.sfxEnabled) {
        Audio.playShoot();
      }
    }
  }

  killTitleEnemy(enemy) {
    // Death effect
    const x = enemy.x;
    const y = enemy.y;

    // Particles
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(x, y, 3, 0x00ff00, 0.8);
      const angle = (i / 6) * Math.PI * 2;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }

    // XP text
    const xpText = this.add.text(x, y - 10, '+5 XP', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: xpText,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => xpText.destroy()
    });

    enemy.destroy();

    // Play sound if SFX enabled
    if (window.VIBE_SETTINGS?.sfxEnabled) {
      Audio.playHit();
    }

    // Occasionally react
    if (Math.random() < 0.2) {
      this.sayQuote(Phaser.Utils.Array.GetRandom([
        "Got one!",
        "Squashed!",
        "DEBUG COMPLETE",
        "Next?",
        "*ez*"
      ]));
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

      case 3: // SETTINGS
        this.showSettings();
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

  showSettings() {
    this.settingsMenuOpen = true;
    this.settingsSelectedIndex = 0;

    const settings = window.VIBE_SETTINGS;
    const overlay = this.add.rectangle(400, 300, 600, 450, 0x000000, 0.95);
    overlay.setStrokeStyle(2, 0x00ffff);

    const title = this.add.text(400, 80, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Settings options
    const settingsData = [
      { key: 'music', label: 'MUSIC', type: 'toggle', getValue: () => settings.musicEnabled, toggle: () => { settings.toggle('musicEnabled'); Audio.toggleMusic(); }},
      { key: 'sfx', label: 'SOUND FX', type: 'toggle', getValue: () => settings.sfxEnabled, toggle: () => settings.toggle('sfxEnabled') },
      { key: 'autoMove', label: 'AUTO-MOVE', type: 'toggle', getValue: () => settings.autoMove, toggle: () => settings.toggle('autoMove') },
      { key: 'masterVol', label: 'MASTER VOL', type: 'slider', getValue: () => settings.masterVolume, setValue: (v) => settings.setVolume('master', v) },
      { key: 'playerName', label: 'NAME', type: 'input', getValue: () => settings.playerName || '[NOT SET]', setValue: (v) => settings.setPlayerName(v) }
    ];

    const startY = 140;
    const spacing = 55;
    const settingTexts = [];

    settingsData.forEach((setting, index) => {
      let valueStr = '';
      if (setting.type === 'toggle') {
        valueStr = setting.getValue() ? '[ON]' : '[OFF]';
      } else if (setting.type === 'slider') {
        const val = Math.round(setting.getValue() * 100);
        const bars = Math.round(val / 10);
        valueStr = '█'.repeat(bars) + '░'.repeat(10 - bars) + ` ${val}%`;
      } else if (setting.type === 'input') {
        valueStr = setting.getValue();
      }

      const text = this.add.text(400, startY + index * spacing,
        `${setting.label}\n${valueStr}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: index === 0 ? '#00ffff' : '#888888',
        align: 'center',
        lineSpacing: 4
      }).setOrigin(0.5);

      settingTexts.push({ text, setting });
    });

    // Selector
    const selector = this.add.text(200, startY, '>', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffff00'
    }).setOrigin(0.5);

    // Help text
    const helpText = this.add.text(400, 420, 'UP/DOWN: Select | LEFT/RIGHT: Adjust | ENTER: Toggle/Edit', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#666666'
    }).setOrigin(0.5);

    const closeHint = this.add.text(400, 450, '[ ESC TO CLOSE ]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);

    // Update visuals
    const updateVisuals = () => {
      settingTexts.forEach((item, index) => {
        let valueStr = '';
        if (item.setting.type === 'toggle') {
          valueStr = item.setting.getValue() ? '[ON]' : '[OFF]';
        } else if (item.setting.type === 'slider') {
          const val = Math.round(item.setting.getValue() * 100);
          const bars = Math.round(val / 10);
          valueStr = '█'.repeat(bars) + '░'.repeat(10 - bars) + ` ${val}%`;
        } else if (item.setting.type === 'input') {
          valueStr = item.setting.getValue();
        }
        item.text.setText(`${item.setting.label}\n${valueStr}`);
        item.text.setColor(index === this.settingsSelectedIndex ? '#00ffff' : '#888888');
      });
      selector.setY(startY + this.settingsSelectedIndex * spacing);
    };

    // Input handlers
    const moveUp = () => {
      this.settingsSelectedIndex--;
      if (this.settingsSelectedIndex < 0) this.settingsSelectedIndex = settingsData.length - 1;
      updateVisuals();
      Audio.playXPGain();
    };

    const moveDown = () => {
      this.settingsSelectedIndex++;
      if (this.settingsSelectedIndex >= settingsData.length) this.settingsSelectedIndex = 0;
      updateVisuals();
      Audio.playXPGain();
    };

    const adjustLeft = () => {
      const item = settingsData[this.settingsSelectedIndex];
      if (item.type === 'slider') {
        item.setValue(Math.max(0, item.getValue() - 0.1));
        updateVisuals();
      }
    };

    const adjustRight = () => {
      const item = settingsData[this.settingsSelectedIndex];
      if (item.type === 'slider') {
        item.setValue(Math.min(1, item.getValue() + 0.1));
        updateVisuals();
      }
    };

    const select = () => {
      const item = settingsData[this.settingsSelectedIndex];
      if (item.type === 'toggle') {
        item.toggle();
        updateVisuals();
        Audio.playHit();
      } else if (item.type === 'input') {
        // Prompt for name input using browser prompt
        const newName = prompt('Enter your name (max 20 characters):', item.getValue() === '[NOT SET]' ? '' : item.getValue());
        if (newName !== null) {
          item.setValue(newName);
          updateVisuals();
        }
      }
    };

    const close = () => {
      this.input.keyboard.off('keydown-UP', moveUp);
      this.input.keyboard.off('keydown-DOWN', moveDown);
      this.input.keyboard.off('keydown-W', moveUp);
      this.input.keyboard.off('keydown-S', moveDown);
      this.input.keyboard.off('keydown-LEFT', adjustLeft);
      this.input.keyboard.off('keydown-RIGHT', adjustRight);
      this.input.keyboard.off('keydown-A', adjustLeft);
      this.input.keyboard.off('keydown-D', adjustRight);
      this.input.keyboard.off('keydown-ENTER', select);
      this.input.keyboard.off('keydown-SPACE', select);
      this.input.keyboard.off('keydown-ESC', close);

      overlay.destroy();
      title.destroy();
      selector.destroy();
      helpText.destroy();
      closeHint.destroy();
      settingTexts.forEach(item => item.text.destroy());
      this.settingsMenuOpen = false;
    };

    this.input.keyboard.on('keydown-UP', moveUp);
    this.input.keyboard.on('keydown-DOWN', moveDown);
    this.input.keyboard.on('keydown-W', moveUp);
    this.input.keyboard.on('keydown-S', moveDown);
    this.input.keyboard.on('keydown-LEFT', adjustLeft);
    this.input.keyboard.on('keydown-RIGHT', adjustRight);
    this.input.keyboard.on('keydown-A', adjustLeft);
    this.input.keyboard.on('keydown-D', adjustRight);
    this.input.keyboard.on('keydown-ENTER', select);
    this.input.keyboard.on('keydown-SPACE', select);
    this.input.keyboard.on('keydown-ESC', close);
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
