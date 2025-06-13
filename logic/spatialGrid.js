// logic/spatialGrid.js
/**
 * 固定大小的空間哈希格 (Spatial Hash Grid)
 * - cellSize 固定，**不會因玩家變大而重建**。
 * - 使用 Map<string, Set<Feed>>，插入/移除 O(1)。
 */
class SpatialGrid {
  /**
   * @param {number} cellSize 每格邊長
   */
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells    = new Map();       // key: "i,j"  value: Set<Feed>
  }

  _indices(x, y) {
    return [
      Math.floor(x / this.cellSize),
      Math.floor(y / this.cellSize)
    ];
  }

  _key(i, j) {
    return `${i},${j}`;
  }

  /** 插入 feed */
  insert(feed) {
    const [i, j] = this._indices(feed.x, feed.y);
    const key = this._key(i, j);
    if (!this.cells.has(key)) this.cells.set(key, new Set());
    this.cells.get(key).add(feed);
  }

  /** 從格子中移除 feed */
  remove(feed) {
    const [i, j] = this._indices(feed.x, feed.y);
    const key = this._key(i, j);
    const bucket = this.cells.get(key);
    if (bucket) bucket.delete(feed);
  }

  /**
   * 取得 (x,y) 半徑 radius 內可能碰撞的 feed
   * @returns {Feed[]}
   */
  queryRange(x, y, radius) {
    const minI = Math.floor((x - radius) / this.cellSize);
    const maxI = Math.floor((x + radius) / this.cellSize);
    const minJ = Math.floor((y - radius) / this.cellSize);
    const maxJ = Math.floor((y + radius) / this.cellSize);

    const result = [];
    for (let i = minI; i <= maxI; i++) {
      for (let j = minJ; j <= maxJ; j++) {
        const key = this._key(i, j);
        const bucket = this.cells.get(key);
        if (bucket) result.push(...bucket);
      }
    }
    return result;
  }
}

module.exports = SpatialGrid;
