// logic/gameLoop.js
/* ============================================================================
 * 伺服器端主要遊戲迴圈
 * - 新增 feedsMoved 增量同步，解決「投餵小球位置僅伺服器端更新」導致
 *   用戶端畫面不同步、看似無法吃掉的問題。
 * - 當投餵小球動能衰減至極小值 (< 0.01) 時，將其 vx / vy 置 0，
 *   之後即視為靜止物件，不再列入 feedsMoved。
 * ==========================================================================*/
const {
  TICK_RATE,
  SPEED,
  FEED_COUNT,
  FEED_SIZE,
  WORLD_SIZE,
  GRID_CELL_SIZE,
  EAT_SIZE_RATIO,
  EAT_OVERLAP_RATIO,
  EJECT_FRICTION
} = require('../config');

const { cellEatsFeed } = require('./collision');
const SpatialGrid      = require('./spatialGrid');

const MS_PER_TICK    = 1000 / TICK_RATE;
const SPAWN_PER_TICK = 1;
const STOP_EPS       = 0.01;      // 🔸 vx、vy 小於此值視為「停止」

/* ---------- 圓形重疊面積 ---------- */
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

/* ---------- 序列化 ---------- */
function serializePlayers(players) {
  const o = {};
  for (const [id, p] of Object.entries(players)) {
    o[id] = {
      id: p.id,
      color: p.color,
      cells: p.cells.map(c => ({ id: c.id, x: c.x, y: c.y, size: c.size }))
    };
  }
  return o;
}

function startGameLoop(io, players, feeds, FeedClass) {
  const grid = new SpatialGrid(GRID_CELL_SIZE);
  for (const f of feeds.values()) grid.insert(f);

  let last = Date.now();
  setInterval(() => {
    const now  = Date.now();
    let lag = now - last;
    while (lag >= MS_PER_TICK) {
      step();
      lag  -= MS_PER_TICK;
      last += MS_PER_TICK;
    }
  }, MS_PER_TICK / 2);

  /* ----------- 單步 ----------- */
  function step() {
    const removed = [];
    const added   = [];
    const moved   = [];       // 🔸 新增：本 tick 有位移的 feed

    /* 0. feed 動量更新（投餵小球） */
    for (const f of feeds.values()) {
      if (!f.vx && !f.vy) continue;   // 靜止 feed 直接跳過

      grid.remove(f);

      /* 位置更新 */
      f.x += f.vx;
      f.y += f.vy;

      /* 動能衰減 */
      f.vx *= EJECT_FRICTION;
      f.vy *= EJECT_FRICTION;

      /* 如果速度極慢，視為停止 */
      if (Math.abs(f.vx) < STOP_EPS) f.vx = 0;
      if (Math.abs(f.vy) < STOP_EPS) f.vy = 0;

      /* 邊界修正 */
      const half = WORLD_SIZE / 2, r = f.size;
      f.x = Math.min(half - r, Math.max(-half + r, f.x));
      f.y = Math.min(half - r, Math.max(-half + r, f.y));

      grid.insert(f);

      /* 記錄移動，用於增量同步 */
      moved.push({
        id:   f.id,
        x:    f.x,
        y:    f.y,
        vx:   f.vx,
        vy:   f.vy,
        size: f.size,
        color: f.color
      });
    }

    /* 1. 玩家移動 / 合併 / 衰減 */
    for (const p of Object.values(players)) p.update(SPEED, MS_PER_TICK);

    /* 2. 處理投餵，將新產生的 feed 放入世界 */
    for (const p of Object.values(players)) {
      const newFeeds = p.popEjectedFeeds(FeedClass);
      for (const nf of newFeeds) {
        feeds.set(nf.id, nf);
        grid.insert(nf);
      }
      added.push(...newFeeds);
    }

    /* 3. 吃 feed */
    for (const p of Object.values(players)) {
      for (const c of p.cells) {
        const nearby = grid.queryRange(c.x, c.y, c.size + FEED_SIZE);
        for (const f of nearby) {
          if (cellEatsFeed(c, f)) {
            p.grow(c);
            grid.remove(f);
            feeds.delete(f.id);
            removed.push(f.id);
          }
        }
      }
    }

    /* 4. 玩家互吃 */
    playerEatPlayer();

    /* 5. 補 feed（保持固定數量） */
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

    /* 6. 廣播 */
    io.emit('update', {
      players: serializePlayers(players),
      feedsAdded:   added,
      feedsRemoved: removed,
      feedsMoved:   moved          // 🔸 新增
    });
  }

  /* ---------- 玩家吃玩家 ---------- */
  function playerEatPlayer() {
    const arr = Object.values(players);
    for (let i = 0; i < arr.length; i++) {
      const hunter = arr[i];
      for (const hc of hunter.cells) {
        for (let j = 0; j < arr.length; j++) {
          if (i === j) continue;
          const prey = arr[j];

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