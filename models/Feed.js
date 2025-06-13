// models/Feed.js
const { FEED_SIZE, WORLD_SIZE } = require('../config');

let nextId = 1;          // 🔸 全域遞增 ID，用於增量同步

class Feed {
  constructor() {
    this.id = nextId++;  // 唯一識別碼
    this.reset();
  }

  /** 隨機定位 feed */
  reset() {
    this.x    = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.y    = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.size = FEED_SIZE;
  }
}

module.exports = Feed;
