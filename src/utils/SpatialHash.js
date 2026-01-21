/**
 * Spatial Hash Grid for efficient nearby-entity queries
 * Reduces O(n²) collision checks to O(n) average case
 */
export default class SpatialHash {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Get the cell key for a position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {string} Cell key in format "x,y"
   */
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Clear the entire grid
   */
  clear() {
    this.grid.clear();
  }

  /**
   * Insert an entity into the grid
   * @param {object} entity - Entity with x, y properties
   */
  insert(entity) {
    if (!entity || !entity.active) return;

    const key = this.getCellKey(entity.x, entity.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }

  /**
   * Insert multiple entities from a Phaser group
   * @param {Phaser.GameObjects.Group} group - Phaser group of entities
   */
  insertGroup(group) {
    if (!group) return;

    group.children.each((entity) => {
      if (entity.active) {
        this.insert(entity);
      }
    });
  }

  /**
   * Get all entities near a position within a radius
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Search radius
   * @returns {Array} Array of nearby entities
   */
  getNearby(x, y, radius) {
    const nearby = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    // Check all cells within radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.grid.get(key);

        if (cell) {
          for (const entity of cell) {
            if (entity.active) {
              // Precise distance check
              const dist = Math.sqrt(
                Math.pow(entity.x - x, 2) +
                Math.pow(entity.y - y, 2)
              );
              if (dist <= radius) {
                nearby.push(entity);
              }
            }
          }
        }
      }
    }

    return nearby;
  }

  /**
   * Get all entities in a specific cell
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Array} Array of entities in the cell
   */
  getCell(x, y) {
    const key = this.getCellKey(x, y);
    return this.grid.get(key) || [];
  }

  /**
   * Check collision between two groups using spatial hashing
   * Much faster than O(n²) naive approach
   * @param {Phaser.GameObjects.Group} groupA - First group
   * @param {Phaser.GameObjects.Group} groupB - Second group
   * @param {number} collisionRadius - Distance for collision
   * @param {Function} callback - Called with (entityA, entityB) on collision
   */
  checkGroupCollision(groupA, groupB, collisionRadius, callback) {
    // Build grid from groupB
    this.clear();
    this.insertGroup(groupB);

    // Check each entity in groupA against nearby entities in groupB
    groupA.children.each((entityA) => {
      if (!entityA.active) return;

      const nearby = this.getNearby(entityA.x, entityA.y, collisionRadius);
      for (const entityB of nearby) {
        if (!entityB.active) continue;

        const dist = Math.sqrt(
          Math.pow(entityA.x - entityB.x, 2) +
          Math.pow(entityA.y - entityB.y, 2)
        );

        if (dist <= collisionRadius) {
          callback(entityA, entityB);
        }
      }
    });
  }
}
