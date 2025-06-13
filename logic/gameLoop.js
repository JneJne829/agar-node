// logic/gameLoop.js
const {
  TICK_RATE,
  SPEED,
  FEED_COUNT,
  FEED_SIZE,
  WORLD_SIZE,
  GRID_CELL_SIZE
} = require('../config');

const { cellEatsFeed } = require('./collision');
const SpatialGrid      = require('./spatialGrid');

const SPAWN_PER_TICK = 1;
const MS_PER_TICK    = 1000 / TICK_RATE;

/* ----------- 序列化 ----------- */
function serializePlayers(players) {
  const out = {};
  for (const [id, p] of Object.entries(players)) {
    out[id] = {
      id: p.id,
      cells: p.cells.map(c => ({
        id:   c.id,
        x:    c.x,
        y:    c.y,
        size: c.size
      }))
    };
  }
  return out;
}

function startGameLoop(io, players, feeds, FeedClass) {
  const grid = new SpatialGrid(GRID_CELL_SIZE);
  for (const f of feeds.values()) grid.insert(f);

  let last = Date.now();
  setInterval(() => {
    const now = Date.now();
    let lag   = now - last;
    while (lag >= MS_PER_TICK) {
      step();
      lag  -= MS_PER_TICK;
      last += MS_PER_TICK;
    }
  }, MS_PER_TICK / 2);

  /* 單步邏輯 ------------------------------------------------ */
  function step() {
    const removed = [];
    const added   = [];

    /* 1. 玩家更新（傳入 Δt ms） */
    for (const p of Object.values(players)) p.update(SPEED, MS_PER_TICK);

    /* 2. 吃 feed */
    for (const p of Object.values(players)) {
      for (const c of p.cells) {
        const near = grid.queryRange(c.x, c.y, c.size + FEED_SIZE);
        for (const f of near) {
          if (cellEatsFeed(c, f)) {
            p.grow(c);
            grid.remove(f);
            feeds.delete(f.id);
            removed.push(f.id);
          }
        }
      }
    }

    /* 3. 補 feed */
    if (feeds.size < FEED_COUNT) {
      const spawn = Math.min(SPAWN_PER_TICK, FEED_COUNT - feeds.size);
      for (let i = 0; i < spawn; i++) {
        const f = new FeedClass();
        f.x = (Math.random() - 0.5) * WORLD_SIZE;
        f.y = (Math.random() - 0.5) * WORLD_SIZE;
        feeds.set(f.id, f);
        grid.insert(f);
        added.push(f);
      }
    }

    /* 4. 廣播 */
    io.emit('update', {
      players: serializePlayers(players),
      feedsAdded:   added,
      feedsRemoved: removed
    });
  }
}

module.exports = startGameLoop;
