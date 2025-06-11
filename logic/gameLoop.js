const { TICK_RATE, SPEED, FEED_COUNT } = require('../config');
const config            = require('../config');
const { playerEatsFeed} = require('./collision');
const SpatialGrid       = require('./spatialGrid');

const SPAWN_PER_TICK = 1;   // 固定每 tick 最多補 1 顆 feed

function startGameLoop(io, players, feeds, FeedClass) {

  /* ---------- 建立一次網格並插入現有 feed ---------- */
  const initMaxRadius = Object.values(players)
    .reduce((m, p) => Math.max(m, p.size), 20);
  let cellSize  = (initMaxRadius + config.FEED_SIZE) * 2;
  let grid      = new SpatialGrid(cellSize);
  feeds.forEach(f => grid.insert(f));

  setInterval(() => {
    /* 1. 玩家移動 + 邊界限制 */
    Object.values(players).forEach(p => {
      if (p.dirX || p.dirY) p.move(SPEED);
      const half = config.WORLD_SIZE / 2;
      const r    = p.size;
      p.x = Math.min(half - r, Math.max(-half + r, p.x));
      p.y = Math.min(half - r, Math.max(-half + r, p.y));
    });

    /* 2. 如玩家變得更大 → 放大格子並重新索引 feed */
    const maxPlayerRadius = Object.values(players)
      .reduce((m, p) => Math.max(m, p.size), 20);
    const neededSize = (maxPlayerRadius + config.FEED_SIZE) * 2;

    if (neededSize > cellSize) {
      cellSize = neededSize;
      grid     = new SpatialGrid(cellSize);
      feeds.forEach(f => grid.insert(f));   // 重建一次索引
    }

    /* 3. 玩家吃 feed（增量移除） */
    Object.values(players).forEach(p => {
      const near = grid.queryNearby(p.x, p.y);
      for (const f of near) {
        if (playerEatsFeed(p, f)) {
          p.grow();
          grid.remove(f);                   // 從格子移除
          const idx = feeds.indexOf(f);     // 從主陣列移除
          if (idx >= 0) feeds.splice(idx, 1);
        }
      }
    });

    /* 4. 固定速率補 feed（增量插入） */
    if (feeds.length < FEED_COUNT) {
      const spawnCount = Math.min(SPAWN_PER_TICK, FEED_COUNT - feeds.length);
      for (let i = 0; i < spawnCount; i++) {
        const f = new FeedClass();
        f.x = (Math.random() - 0.5) * config.WORLD_SIZE;
        f.y = (Math.random() - 0.5) * config.WORLD_SIZE;
        feeds.push(f);
        grid.insert(f);                     // 新 feed 直接插入格子
      }
    }

    /* 5. 廣播最新狀態 */
    io.emit('state', { players, feeds });
  }, 1000 / TICK_RATE);
}

module.exports = startGameLoop;
