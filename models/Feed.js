// models/Feed.js
const {
  FEED_SIZE,
  WORLD_SIZE,
  FEED_COLOR_POOL
} = require('../config');

let nextId = 1;

/** 由顏色池隨機取色；若池為空則產生隨機色 */
function randomColor(pool) {
  if (Array.isArray(pool) && pool.length) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  );
}

class Feed {
  constructor() {
    this.id = nextId++;
    this.reset();
  }

  /** 隨機定位 & 指定顏色 */
  reset() {
    this.x     = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.y     = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.size  = FEED_SIZE;
    this.color = randomColor(FEED_COLOR_POOL);
  }
}

module.exports = Feed;