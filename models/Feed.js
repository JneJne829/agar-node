// models/Feed.js
const { FEED_SIZE, WORLD_SIZE } = require('../config');

class Feed {
  constructor() {
    this.reset();
  }

  /** 重新隨機定位 feed */
  reset() {
    this.x = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.y = Math.random() * WORLD_SIZE - WORLD_SIZE / 2;
    this.size = FEED_SIZE;
  }
}

module.exports = Feed;
