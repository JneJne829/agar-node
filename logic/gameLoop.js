// logic/gameLoop.js
const {
  TICK_RATE,
  SPEED,
  FEED_COUNT,
  FEED_SIZE,
  WORLD_SIZE,
  GRID_CELL_SIZE,
  EAT_SIZE_RATIO,
  EAT_OVERLAP_RATIO
} = require('../config');

const { cellEatsFeed } = require('./collision');
const SpatialGrid      = require('./spatialGrid');

const SPAWN_PER_TICK = 1;
const MS_PER_TICK    = 1000 / TICK_RATE;

/* ---------- 工具 ---------- */
function overlapArea(r1, r2, d) {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;

  const alpha = Math.acos((d*d + r1*r1 - r2*r2) / (2*d*r1));
  const beta  = Math.acos((d*d + r2*r2 - r1*r1) / (2*d*r2));
  return r1*r1*alpha + r2*r2*beta -
         0.5*Math.sqrt(
           (-d + r1 + r2) *
           ( d + r1 - r2) *
           ( d - r1 + r2) *
           ( d + r1 + r2)
         );
}

/* ----------- 序列化 ----------- */
function serializePlayers(players) {
  const out = {};
  for (const [id, p] of Object.entries(players)) {
    out[id] = {
      id:    p.id,
      color: p.color,
      cells: p.cells.map(c => ({
        id: c.id, x: c.x, y: c.y, size: c.size
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
    let lag = now - last;
    while (lag >= MS_PER_TICK) {
      step();
      lag  -= MS_PER_TICK;
      last += MS_PER_TICK;
    }
  }, MS_PER_TICK / 2);

  /* ---------------- 每一步 ---------------- */
  function step() {
    const removed = [];
    const added   = [];

    /* 1. 玩家移動 & 合併 */
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

    /* 3. 玩家互吃 */
    playerEatPlayer();

    /* 4. 補 feed */
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

    /* 5. 廣播增量 */
    io.emit('update', {
      players: serializePlayers(players),
      feedsAdded:   added,
      feedsRemoved: removed
    });
  }

  /* ---------- 玩家吞玩家 ---------- */
  function playerEatPlayer() {
    const list = Object.values(players);
    for (let i = 0; i < list.length; i++) {
      const hunter = list[i];
      for (const hc of hunter.cells) {
        for (let j = 0; j < list.length; j++) {
          if (i === j) continue;
          const prey = list[j];

          for (let k = prey.cells.length - 1; k >= 0; k--) {
            const pc = prey.cells[k];
            if (hc.size < pc.size * EAT_SIZE_RATIO) continue;

            const dx = pc.x - hc.x, dy = pc.y - hc.y;
            const d  = Math.hypot(dx, dy);
            if (d >= hc.size + pc.size) continue;

            if (overlapArea(hc.size, pc.size, d) >=
                EAT_OVERLAP_RATIO * pc.area * Math.PI) {

              const newArea = hc.area + pc.area;
              hc.vx = (hc.vx * hc.area + pc.vx * pc.area) / newArea;
              hc.vy = (hc.vy * hc.area + pc.vy * pc.area) / newArea;
              hc.size = Math.sqrt(newArea);

              prey.cells.splice(k, 1);
              if (!prey.cells.length) delete players[prey.id];
            }
          }
        }
      }
    }
  }
}

module.exports = startGameLoop;