/**
 * MapManager - Handles biome generation, obstacles, and interactive elements
 * Creates procedurally generated maps with walls, hazards, and interactives
 */
export default class MapManager {
  constructor(scene) {
    this.scene = scene;

    // Physics groups for different collision types
    this.walls = null;      // Block movement + projectiles
    this.furniture = null;  // Block movement only
    this.hazards = null;    // Damage zones
    this.destructibles = null; // Can be destroyed
    this.teleporters = null;   // Paired teleport pads
    this.spawners = null;      // Pickup spawn points

    // Biome definitions with hybrid visual style
    this.biomes = {
      0: { // DEBUG ZONE
        name: 'DEBUG ZONE',
        wallTint: 0x00ffff,
        hazardDamage: 5,
        obstacles: ['codeBlock', 'terminal'],
        hazardTypes: ['bugSwarm'],
        interactives: ['crate', 'monitor'],
        density: 0.3
      },
      1: { // MEMORY BANKS
        name: 'MEMORY BANKS',
        wallTint: 0xaa00ff,
        hazardDamage: 8,
        obstacles: ['serverRack', 'memoryStick'],
        hazardTypes: ['memoryLeak'],
        interactives: ['crate', 'dataCore'],
        density: 0.4
      },
      2: { // NETWORK LAYER
        name: 'NETWORK LAYER',
        wallTint: 0x00ff00,
        hazardDamage: 10,
        obstacles: ['routerBox', 'cableBundle'],
        hazardTypes: ['packetStorm'],
        interactives: ['crate', 'signalBoost'],
        density: 0.35
      },
      3: { // KERNEL SPACE
        name: 'KERNEL SPACE',
        wallTint: 0xff4400,
        hazardDamage: 15,
        obstacles: ['cpuCore', 'registerBlock'],
        hazardTypes: ['kernelPanic', 'thermal'],
        interactives: ['crate', 'processNode'],
        density: 0.45
      },
      4: { // CLOUD CLUSTER
        name: 'CLOUD CLUSTER',
        wallTint: 0x4488ff,
        hazardDamage: 12,
        obstacles: ['cloudServer', 'apiPortal'],
        hazardTypes: ['latencySpike'],
        interactives: ['crate', 'containerPod'],
        density: 0.4
      },
      5: { // SINGULARITY
        name: 'SINGULARITY',
        wallTint: 0xffd700,
        hazardDamage: 20,
        obstacles: ['voidFragment', 'eventHorizon'],
        hazardTypes: ['blackHole', 'entropyField'],
        interactives: ['crate', 'quantumCache'],
        density: 0.5
      }
    };

    // Teleporter pairs (for connecting distant areas)
    this.teleporterPairs = [];
    this.teleportCooldown = 2000; // ms
  }

  /**
   * Initialize physics groups
   */
  init() {
    this.walls = this.scene.physics.add.staticGroup();
    this.furniture = this.scene.physics.add.staticGroup();
    this.hazards = this.scene.physics.add.staticGroup();
    this.destructibles = this.scene.physics.add.group();
    this.teleporters = this.scene.add.group();
    this.spawners = this.scene.add.group();
  }

  /**
   * Generate map obstacles for a given stage
   * @param {number} stage - Current stage index (0-5)
   */
  generateMap(stage) {
    this.clearMap();

    const biome = this.biomes[stage] || this.biomes[0];
    const worldWidth = this.scene.worldWidth;
    const worldHeight = this.scene.worldHeight;

    // Calculate number of obstacles based on density
    const numWalls = Math.floor(8 * biome.density);
    const numFurniture = Math.floor(12 * biome.density);
    const numHazards = Math.floor(4 * biome.density);
    const numDestructibles = Math.floor(15 * biome.density);
    const numTeleporters = Math.floor(2); // Always 2 pairs

    // Safe zone around center (spawn area)
    const safeRadius = 300;
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;

    // Generate walls (block everything)
    for (let i = 0; i < numWalls; i++) {
      const pos = this.getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius);
      if (pos) {
        this.createWall(pos.x, pos.y, biome);
      }
    }

    // Generate furniture (block movement)
    for (let i = 0; i < numFurniture; i++) {
      const pos = this.getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius);
      if (pos) {
        this.createFurniture(pos.x, pos.y, biome);
      }
    }

    // Generate hazards (damage zones)
    for (let i = 0; i < numHazards; i++) {
      const pos = this.getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius + 100);
      if (pos) {
        this.createHazard(pos.x, pos.y, biome);
      }
    }

    // Generate destructibles
    for (let i = 0; i < numDestructibles; i++) {
      const pos = this.getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius);
      if (pos) {
        this.createDestructible(pos.x, pos.y, biome);
      }
    }

    // Generate teleporter pairs
    for (let i = 0; i < numTeleporters; i++) {
      this.createTeleporterPair(worldWidth, worldHeight, centerX, centerY, safeRadius);
    }

    console.log(`Map generated for ${biome.name}: ${numWalls} walls, ${numFurniture} furniture, ${numHazards} hazards, ${numDestructibles} destructibles`);
  }

  /**
   * Get random position avoiding safe zone
   */
  getRandomPosition(worldWidth, worldHeight, centerX, centerY, safeRadius) {
    const margin = 100;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const x = Phaser.Math.Between(margin, worldWidth - margin);
      const y = Phaser.Math.Between(margin, worldHeight - margin);

      // Check if outside safe zone
      const dist = Phaser.Math.Distance.Between(x, y, centerX, centerY);
      if (dist > safeRadius) {
        return { x, y };
      }
      attempts++;
    }

    return null;
  }

  /**
   * Create a wall obstacle (blocks movement + projectiles)
   */
  createWall(x, y, biome) {
    const width = Phaser.Math.Between(60, 120);
    const height = Phaser.Math.Between(60, 120);

    const wall = this.scene.add.rectangle(x, y, width, height, biome.wallTint, 0.6);
    wall.setStrokeStyle(2, biome.wallTint, 1);
    this.scene.physics.add.existing(wall, true);
    this.walls.add(wall);

    // Add visual detail
    const innerGlow = this.scene.add.rectangle(x, y, width - 8, height - 8, 0x000000, 0.3);
    innerGlow.setStrokeStyle(1, biome.wallTint, 0.3);

    // Pulse animation
    this.scene.tweens.add({
      targets: wall,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return wall;
  }

  /**
   * Create furniture (blocks movement only)
   */
  createFurniture(x, y, biome) {
    const size = Phaser.Math.Between(30, 50);

    const furniture = this.scene.add.rectangle(x, y, size, size, 0x333333, 0.7);
    furniture.setStrokeStyle(1, biome.wallTint, 0.5);
    this.scene.physics.add.existing(furniture, true);
    this.furniture.add(furniture);

    return furniture;
  }

  /**
   * Create hazard zone (damages player and enemies)
   */
  createHazard(x, y, biome) {
    const radius = Phaser.Math.Between(40, 80);

    const hazard = this.scene.add.circle(x, y, radius, 0xff0000, 0.3);
    hazard.setStrokeStyle(2, 0xff0000, 0.6);
    this.scene.physics.add.existing(hazard, true);
    hazard.body.setCircle(radius);
    hazard.damage = biome.hazardDamage;
    hazard.lastDamageTime = 0;
    hazard.damageCooldown = 500; // Damage every 500ms
    this.hazards.add(hazard);

    // Pulse animation
    this.scene.tweens.add({
      targets: hazard,
      scale: { from: 0.9, to: 1.1 },
      alpha: { from: 0.2, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return hazard;
  }

  /**
   * Create destructible object (can be destroyed for drops)
   */
  createDestructible(x, y, biome) {
    const size = Phaser.Math.Between(24, 40);

    const crate = this.scene.add.rectangle(x, y, size, size, 0x8b4513, 0.8);
    crate.setStrokeStyle(2, 0xdaa520, 1);
    this.scene.physics.add.existing(crate);
    crate.body.setImmovable(true);

    crate.health = 20;
    crate.maxHealth = 20;
    crate.isDestructible = true;
    crate.dropType = Math.random() < 0.3 ? 'weapon' : 'xp';

    this.destructibles.add(crate);

    return crate;
  }

  /**
   * Create a pair of linked teleporters
   */
  createTeleporterPair(worldWidth, worldHeight, centerX, centerY, safeRadius) {
    // Generate two positions in opposite quadrants
    const quadrants = [
      { x: worldWidth * 0.25, y: worldHeight * 0.25 },
      { x: worldWidth * 0.75, y: worldHeight * 0.25 },
      { x: worldWidth * 0.25, y: worldHeight * 0.75 },
      { x: worldWidth * 0.75, y: worldHeight * 0.75 }
    ];

    // Pick two random different quadrants
    const shuffled = Phaser.Utils.Array.Shuffle([...quadrants]);
    const pos1 = shuffled[0];
    const pos2 = shuffled[1];

    // Add some randomness
    pos1.x += Phaser.Math.Between(-200, 200);
    pos1.y += Phaser.Math.Between(-200, 200);
    pos2.x += Phaser.Math.Between(-200, 200);
    pos2.y += Phaser.Math.Between(-200, 200);

    // Create teleporter A
    const teleA = this.createTeleporter(pos1.x, pos1.y, 0x00ffff);
    const teleB = this.createTeleporter(pos2.x, pos2.y, 0xff00ff);

    // Link them
    teleA.linkedTeleporter = teleB;
    teleB.linkedTeleporter = teleA;

    this.teleporterPairs.push({ a: teleA, b: teleB });
  }

  /**
   * Create single teleporter pad
   */
  createTeleporter(x, y, color) {
    const radius = 35;

    // Outer ring
    const outer = this.scene.add.circle(x, y, radius, 0x000000, 0.5);
    outer.setStrokeStyle(3, color, 0.8);

    // Inner pad
    const inner = this.scene.add.circle(x, y, radius - 10, color, 0.3);

    // Center icon
    const icon = this.scene.add.text(x, y, '⟲', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: Phaser.Display.Color.IntegerToColor(color).rgba
    }).setOrigin(0.5);

    // Container
    const container = this.scene.add.container(0, 0, [outer, inner, icon]);
    container.teleporterX = x;
    container.teleporterY = y;
    container.lastUsedTime = 0;
    container.cooldown = this.teleportCooldown;
    container.isReady = true;

    this.teleporters.add(container);

    // Rotation animation
    this.scene.tweens.add({
      targets: icon,
      angle: 360,
      duration: 3000,
      repeat: -1
    });

    // Pulse when ready
    this.scene.tweens.add({
      targets: inner,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.2, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    return container;
  }

  /**
   * Handle teleporter usage
   * @param {Phaser.GameObjects.Sprite} player - Player sprite
   * @param {Phaser.GameObjects.Container} teleporter - Teleporter container
   */
  useTeleporter(player, teleporter) {
    const now = this.scene.time.now;

    // Check cooldown
    if (now - teleporter.lastUsedTime < teleporter.cooldown) {
      return false;
    }

    const linked = teleporter.linkedTeleporter;
    if (!linked) return false;

    // Teleport!
    teleporter.lastUsedTime = now;
    linked.lastUsedTime = now;

    // Visual effect at origin
    this.createTeleportEffect(player.x, player.y, 0x00ffff);

    // Move player
    player.x = linked.teleporterX;
    player.y = linked.teleporterY;

    // Visual effect at destination
    this.createTeleportEffect(player.x, player.y, 0xff00ff);

    return true;
  }

  /**
   * Create teleport visual effect
   */
  createTeleportEffect(x, y, color) {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(
        x + Math.cos(angle) * 20,
        y + Math.sin(angle) * 20,
        5,
        color,
        0.8
      );
      particles.push(particle);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }

    // Flash
    this.scene.cameras.main.flash(100, 255, 255, 255, false);
  }

  /**
   * Handle hazard damage
   * @param {Phaser.GameObjects.Sprite} entity - Player or enemy
   * @param {Phaser.GameObjects.Circle} hazard - Hazard zone
   */
  handleHazardDamage(entity, hazard) {
    const now = this.scene.time.now;

    if (now - hazard.lastDamageTime < hazard.damageCooldown) {
      return 0;
    }

    hazard.lastDamageTime = now;

    // Apply damage
    if (entity.health !== undefined) {
      entity.health -= hazard.damage;
    }

    // Visual feedback
    entity.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (entity.active) entity.clearTint();
    });

    return hazard.damage;
  }

  /**
   * Handle destructible hit
   * @param {Phaser.GameObjects.Rectangle} destructible - Destructible object
   * @param {number} damage - Damage dealt
   */
  hitDestructible(destructible, damage) {
    destructible.health -= damage;

    // Flash white
    destructible.setFillStyle(0xffffff, 1);
    this.scene.time.delayedCall(50, () => {
      if (destructible.active) {
        destructible.setFillStyle(0x8b4513, 0.8);
      }
    });

    // Destroy if dead
    if (destructible.health <= 0) {
      this.destroyDestructible(destructible);
    }
  }

  /**
   * Destroy a destructible and spawn drops
   */
  destroyDestructible(destructible) {
    const x = destructible.x;
    const y = destructible.y;

    // Particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.rectangle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        8, 8,
        0x8b4513
      );
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-40, 40),
        y: y + Phaser.Math.Between(-40, 40),
        alpha: 0,
        rotation: Math.random() * Math.PI * 2,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }

    // Spawn drop
    if (destructible.dropType === 'weapon') {
      // Let ArenaScene handle weapon drop
      if (this.scene.spawnWeaponDrop) {
        this.scene.spawnWeaponDrop(x, y);
      }
    } else {
      // XP burst
      window.VIBE_CODER.addXP(Phaser.Math.Between(5, 15));
    }

    destructible.destroy();
  }

  /**
   * Setup all collision handlers
   * @param {Phaser.GameObjects.Sprite} player - Player sprite
   * @param {Phaser.GameObjects.Group} enemies - Enemy group
   * @param {Phaser.GameObjects.Group} projectiles - Projectile group
   */
  setupCollisions(player, enemies, projectiles) {
    // Walls block everything
    this.scene.physics.add.collider(player, this.walls);
    this.scene.physics.add.collider(enemies, this.walls);
    this.scene.physics.add.collider(projectiles, this.walls, (proj) => {
      proj.destroy();
    });

    // Furniture blocks movement only
    this.scene.physics.add.collider(player, this.furniture);
    this.scene.physics.add.collider(enemies, this.furniture);

    // Hazards damage on overlap
    this.scene.physics.add.overlap(player, this.hazards, (p, hazard) => {
      const damage = this.handleHazardDamage(p, hazard);
      if (damage > 0 && !this.scene.invincible) {
        p.health -= damage;
        this.scene.updateHUD();
      }
    });

    this.scene.physics.add.overlap(enemies, this.hazards, (enemy, hazard) => {
      this.handleHazardDamage(enemy, hazard);
    });

    // Destructibles can be hit by projectiles
    this.scene.physics.add.overlap(projectiles, this.destructibles, (proj, dest) => {
      this.hitDestructible(dest, proj.damage || 10);
      if (!proj.pierce) {
        proj.destroy();
      }
    });

    // Teleporter overlap
    this.teleporters.children.each((teleporter) => {
      // Create overlap zone
      const zone = this.scene.add.zone(
        teleporter.teleporterX,
        teleporter.teleporterY,
        50, 50
      );
      this.scene.physics.add.existing(zone, true);

      this.scene.physics.add.overlap(player, zone, () => {
        this.useTeleporter(player, teleporter);
      });
    });
  }

  /**
   * Clear all map elements
   */
  clearMap() {
    if (this.walls) this.walls.clear(true, true);
    if (this.furniture) this.furniture.clear(true, true);
    if (this.hazards) this.hazards.clear(true, true);
    if (this.destructibles) this.destructibles.clear(true, true);
    if (this.teleporters) this.teleporters.clear(true, true);
    if (this.spawners) this.spawners.clear(true, true);
    this.teleporterPairs = [];
  }

  /**
   * Update loop (call from scene update)
   */
  update(time, delta) {
    // Update teleporter ready states
    this.teleporters.children.each((teleporter) => {
      const isReady = time - teleporter.lastUsedTime >= teleporter.cooldown;
      if (teleporter.isReady !== isReady) {
        teleporter.isReady = isReady;
        // Visual feedback for cooldown state could go here
      }
    });
  }
}
