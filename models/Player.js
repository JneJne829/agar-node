// models/Player.js
const {
  WORLD_SIZE,
  MIN_SPLIT_SIZE,
  SPLIT_BOOST,
  BASE_CELL_SIZE,
  SPEED_EXP,
  MIN_SPEED_FACTOR,
  FEED_SIZE,
  MAX_CELLS,
  MERGE_COOLDOWN,
  MERGE_OVERLAP_RATIO,
  EJECT_SIZE,
  EJECT_SPEED,
  EJECT_OFFSET,
  DECAY_RATE,
  MIN_CELL_SIZE
} = require('../config');

let nextCellId = 1;

/* ───── Cell ───── */
class Cell {
  constructor(x, y, size, mergeClock = 0) {
    this.id   = nextCellId++;
    this.x    = x;
    this.y    = y;
    this.size = size;  // 半徑
    this.vx   = 0;
    this.vy   = 0;
    this.mergeClock = mergeClock;   // ms
  }
  get area() { return this.size * this.size; }
}

/* ───── Player ───── */
class Player {
  constructor(id, x, y, size = BASE_CELL_SIZE, color = '#ffffff') {
    this.id       = id;
    this.color    = color;
    this.cells    = [new Cell(x, y, size)];
    this.targetX  = x;
    this.targetY  = y;
    this._ejectQ  = [];  // ← 投餵佇列
  }

  setTarget(x, y) { this.targetX = x; this.targetY = y; }

  /* -------- 投餵請求 (由 socketHandler 呼叫) -------- */
  requestEject(tx, ty) { this._ejectQ.push({ tx, ty }); }

  /* -------- 每 tick 更新 -------- */
  update(baseSpeed, dtMs) {
    /* A. 冷卻倒數 */
    for (const c of this.cells)
      if (c.mergeClock) c.mergeClock = Math.max(0, c.mergeClock - dtMs);

    /* B. 移動 */
    for (const c of this.cells) {
      const dx   = this.targetX - c.x,
            dy   = this.targetY - c.y;
      const dist = Math.hypot(dx, dy);
      const speed = baseSpeed * Math.max(
        MIN_SPEED_FACTOR,
        Math.pow(BASE_CELL_SIZE / c.size, SPEED_EXP)
      );
      const ux = dist ? dx / dist : 0,
            uy = dist ? dy / dist : 0;

      c.x += ux * speed + c.vx;
      c.y += uy * speed + c.vy;

      /* 邊界 */
      const half = WORLD_SIZE / 2, r = c.size;
      c.x = Math.min(half - r, Math.max(-half + r, c.x));
      c.y = Math.min(half - r, Math.max(-half + r, c.y));

      /* 動能衰減 */
      c.vx *= 0.9;
      c.vy *= 0.9;
    }

    /* C. 自然質量衰減 */
    if (DECAY_RATE > 0) {
      const factor = 1 - DECAY_RATE * (dtMs / 1000);
      for (const c of this.cells) {
        const newArea = Math.max(c.area * factor, MIN_CELL_SIZE * MIN_CELL_SIZE);
        c.size = Math.sqrt(newArea);
      }
    }

    /* D. 冷卻期間互斥 */
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const a = this.cells[i], b = this.cells[j];
        if (!a.mergeClock && !b.mergeClock) continue;

        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minD = a.size + b.size;
        if (dist < minD) {
          const ov = (minD - dist) / 2,
                ux = dx / dist,
                uy = dy / dist;
          a.x -= ux * ov; a.y -= uy * ov;
          b.x += ux * ov; b.y += uy * ov;
        }
      }
    }

    /* E. 自動合併 */
    this._merge();
  }

  /** 被 feed 吃到時成長 */
  grow(c) { c.size = Math.sqrt(c.area + FEED_SIZE * FEED_SIZE); }

  /** 分裂 (Space) */
  split(tx, ty) {
    if (this.cells.length >= MAX_CELLS) return;

    const originals = [...this.cells];
    for (const c of originals) {
      if (this.cells.length >= MAX_CELLS) break;
      if (c.size < MIN_SPLIT_SIZE) continue;

      const dx = tx - c.x, dy = ty - c.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;

      const newR = c.size / Math.SQRT2;
      c.size       = newR;
      c.mergeClock = MERGE_COOLDOWN * 1000;

      const nc = new Cell(c.x, c.y, newR, MERGE_COOLDOWN * 1000);
      nc.vx = ux * SPLIT_BOOST;
      nc.vy = uy * SPLIT_BOOST;
      this.cells.push(nc);
    }
  }

  /* ---------- 將排隊的投餵請求轉成 Feed 物件 ---------- */
  popEjectedFeeds(FeedClass) {
    if (!this._ejectQ.length) return [];

    const feeds = [];
    while (this._ejectQ.length) {
      const { tx, ty } = this._ejectQ.shift();
      for (const c of this.cells) {
        if (c.size <= EJECT_SIZE * 1.5) continue; // 避免太小還投餵

        /* 方向 */
        const dx = tx - c.x, dy = ty - c.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;

        /* 建立 feed */
        const f = new FeedClass();
        f.size = EJECT_SIZE;
        f.x    = c.x + ux * (c.size + f.size + EJECT_OFFSET);
        f.y    = c.y + uy * (c.size + f.size + EJECT_OFFSET);
        f.vx   = ux * EJECT_SPEED;
        f.vy   = uy * EJECT_SPEED;
        feeds.push(f);

        /* 扣除質量 */
        const newArea = Math.max(c.area - f.size * f.size, MIN_CELL_SIZE * MIN_CELL_SIZE);
        c.size = Math.sqrt(newArea);
      }
    }
    return feeds;
  }

  /* ---------- 合併邏輯 ---------- */
  _merge() {
    if (this.cells.length <= 1) return;

    const pairs = [];
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const a = this.cells[i], b = this.cells[j];
        if (a.mergeClock || b.mergeClock) continue;

        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy);
        if (d >= a.size + b.size) continue;

        const minR = Math.min(a.size, b.size);
        let overlapArea;
        if (d <= Math.abs(a.size - b.size)) {
          overlapArea = Math.PI * minR * minR;
        } else {
          const alpha = Math.acos((d*d + a.size*a.size - b.size*b.size) / (2*d*a.size));
          const beta  = Math.acos((d*d + b.size*b.size - a.size*a.size) / (2*d*b.size));
          overlapArea = a.size*a.size*alpha + b.size*b.size*beta -
                        0.5 * Math.sqrt(
                          (-d + a.size + b.size) *
                          ( d + a.size - b.size) *
                          ( d - a.size + b.size) *
                          ( d + a.size + b.size)
                        );
        }

        if (overlapArea >= MERGE_OVERLAP_RATIO * (minR * minR * Math.PI)) {
          pairs.push({ a, b, d });
        }
      }
    }

    pairs.sort((p, q) => p.d - q.d);
    const used = new Set();
    for (const { a, b } of pairs) {
      if (used.has(a.id) || used.has(b.id)) continue;

      const big   = a.area >= b.area ? a : b;
      const small = big === a ? b : a;
      const newArea = big.area + small.area;
      big.vx   = (big.vx * big.area + small.vx * small.area) / newArea;
      big.vy   = (big.vy * big.area + small.vy * small.area) / newArea;
      big.size = Math.sqrt(newArea);

      this.cells.splice(this.cells.indexOf(small), 1);
      used.add(small.id);
    }
  }
}

module.exports = Player;