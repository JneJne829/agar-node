// logic/gameLoop.js

const { TICK_RATE, SPEED, FEED_COUNT, FEED_GROWTH_RATIO } = require('../config');
const config = require('../config');
const { playerEatsFeed }              = require('./collision');
const SpatialGrid                     = require('./spatialGrid');
const SPAWN_PER_TICK = 1;  

/**
 * 啟動遊戲主迴圈，並使用 Spatial Grid 優化碰撞檢測
 * @param {import('socket.io').Server} io
 * @param {Object.<string, import('../models/Player')>} players
 * @param {Array<import('../models/Feed')>} feeds
 * @param {Class<import('../models/Feed')>} FeedClass
 */
function startGameLoop(io, players, feeds, FeedClass) {
  // cellSize = (最大玩家半徑 + feed 半徑) * 2，確保同格覆蓋所有潛在碰撞
  const maxPlayerRadius = Object.values(players)
    .reduce((max, p) => Math.max(max, p.size), 20);
  const feedRadius = feeds.length > 0 ? feeds[0].size : 5;
  const cellSize = (maxPlayerRadius + feedRadius) * 2;

  const grid = new SpatialGrid(cellSize);

  setInterval(() => {
    // 1. 玩家移動
    Object.values(players).forEach(p => {
        if (p.dirX || p.dirY) p.move(SPEED);

        /* === 新增：邊界限制 === */
        const half = config.WORLD_SIZE / 2;   // 地圖半寬
        const r    = p.size;                  // 細胞半徑，避免卡邊
        // 將座標限制在 [-half + r, half - r] 區間內
        p.x = Math.min(half - r, Math.max(-half + r, p.x));
        p.y = Math.min(half - r, Math.max(-half + r, p.y));
    });

    // 2. 建立空間網格索引
    grid.clear();
    feeds.forEach(feed => grid.insert(feed));

    // 3. 玩家吃 feed (只檢測鄰近格子中的 feed)
    Object.values(players).forEach(p => {
      const candidates = grid.queryNearby(p.x, p.y);
      for (const feed of candidates) {
        if (playerEatsFeed(p, feed)) {
          p.grow();
          // 從 feeds 主陣列移除
          const idx = feeds.indexOf(feed);
          if (idx >= 0) feeds.splice(idx, 1);
        }
      }
    });

    // 4. 若場上 feed 少於基準值，固定速度補充
    if (feeds.length < FEED_COUNT) {
    const spawnCount = Math.min(SPAWN_PER_TICK, FEED_COUNT - feeds.length);
    for (let i = 0; i < spawnCount; i++) {
        const f = new FeedClass();
        // 在整個世界邊界內隨機產生，新 feed 均勻散佈於地圖
        f.x = (Math.random() - 0.5) * config.WORLD_SIZE;
        f.y = (Math.random() - 0.5) * config.WORLD_SIZE;
        feeds.push(f);
    }
    }

    // 5. 廣播最新狀態
    io.emit('state', { players, feeds });
  }, 1000 / TICK_RATE);
}

module.exports = startGameLoop;
