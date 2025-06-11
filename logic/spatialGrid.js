// logic/spatialGrid.js

/**
 * 空間網格 (Spatial Grid) 用於加速碰撞檢測
 * 將所有 feed 分配到格子裡，再只檢索鄰近格子的 feed 做精確檢測
 */
class SpatialGrid {
  /**
   * @param {number} cellSize 每格邊長，建議設定為最大碰撞距離 (player.size + feed.size) 的兩倍
   */
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();  // key: "i,j" (格子座標), value: Array of feed
  }

  _key(x, y) {
    const i = Math.floor(x / this.cellSize);
    const j = Math.floor(y / this.cellSize);
    return `${i},${j}`;
  }

  /** 清空所有格子 */
  clear() {
    this.cells.clear();
  }

  /**
   * 把一個 feed 插入到對應格子
   * @param {{x:number,y:number,size:number}} feed
   */
  insert(feed) {
    const key = this._key(feed.x, feed.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push(feed);
  }

  /**
   * 查詢 (x,y) 位置及其周圍 8 格的所有 feed
   * @param {number} x
   * @param {number} y
   * @returns {Array} feed 列表
   */
  queryNearby(x, y) {
    const ci = Math.floor(x / this.cellSize);
    const cj = Math.floor(y / this.cellSize);
    const result = [];
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const key = `${ci + di},${cj + dj}`;
        if (this.cells.has(key)) {
          result.push(...this.cells.get(key));
        }
      }
    }
    return result;
  }
}

module.exports = SpatialGrid;
