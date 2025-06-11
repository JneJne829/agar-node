// config/index.js
module.exports = {
  TICK_RATE: 120,        // 伺服器更新率 (FPS)
  SPEED: 2,              // 玩家每 tick 位移 (px)
  FEED_COUNT: 10000,       // 基準場上 feed 數量
  FEED_SIZE: 5,          // feed 半徑
  WORLD_SIZE: 6000,      // feed 隨機生成範圍 (±WORLD_SIZE/2)
};
