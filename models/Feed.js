// models/Feed.js
const {
  FEED_SIZE,
  WORLD_SIZE,
  FEED_COLOR_POOL
} = require('../config');

let nextId = 1;

/** 從池中隨機取色；若池為空則回傳隨機 HEX */
function randomColor(pool) {
  if (Array.isArray(pool) && pool.length) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

class Feed {
  constructor() {
    this.id = nextId++;
    this.reset();
    this.vx = 0;   // 投餵用動量；一般靜止 feed 皆為 0
    this.vy = 0;
  }

  /** 隨機重置位置與顏色 */
  reset() {
    this.x     = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.y     = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.size  = FEED_SIZE;
    this.color = randomColor(FEED_COLOR_POOL);
  }
}

module.exports = Feed;