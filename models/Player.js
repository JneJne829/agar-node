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
  MERGE_OVERLAP_RATIO
} = require('../config');

let nextCellId = 1;

/* ───── Cell ───── */
class Cell {
  constructor(x, y, size, mergeClock = 0) {
    this.id    = nextCellId++;
    this.x     = x;
    this.y     = y;
    this.size  = size;     // 半徑
    this.vx    = 0;
    this.vy    = 0;
    this.mergeClock = mergeClock;
  }
  get area() { return this.size * this.size; }
}

/* ───── Player ───── */
class Player {
  /**
   * @param {string} id     socket id
   * @param {number} x      初始 x
   * @param {number} y      初始 y
   * @param {number} size   初始半徑
   * @param {string} color  HEX 顏色
   */
  constructor(id, x, y, size = BASE_CELL_SIZE, color = '#ffffff') {
    this.id      = id;
    this.color   = color;
    this.cells   = [new Cell(x, y, size)];
    this.targetX = x;
    this.targetY = y;
  }

  setTarget(x, y) { this.targetX = x; this.targetY = y; }

  /* 每 tick 更新 */
  update(baseSpeed, dtMs) {
    /* A. 冷卻倒數 */
    for (const c of this.cells)
      if (c.mergeClock) c.mergeClock = Math.max(0, c.mergeClock - dtMs);

    /* B. 移動 */
    for (const c of this.cells) {
      const dx   = this.targetX - c.x,
            dy   = this.targetY - c.y;
      const dist = Math.hypot(dx, dy);
      const v    = baseSpeed * Math.max(
        MIN_SPEED_FACTOR,
        Math.pow(BASE_CELL_SIZE / c.size, SPEED_EXP)
      );
      const ux = dist ? dx / dist : 0,
            uy = dist ? dy / dist : 0;

      c.x += ux * v + c.vx;
      c.y += uy * v + c.vy;

      /* 邊界 */
      const half = WORLD_SIZE / 2, r = c.size;
      c.x = Math.min(half - r, Math.max(-half + r, c.x));
      c.y = Math.min(half - r, Math.max(-half + r, c.y));

      /* 阻尼 */
      c.vx *= 0.9;
      c.vy *= 0.9;
    }

    /* C. 冷卻期間互斥避免重疊 */
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

    /* D. 自動合併 */
    this._merge();
  }

  grow(c) { c.size = Math.sqrt(c.size * c.size + FEED_SIZE * FEED_SIZE); }

  /** 分裂 */
  split(tx, ty) {
    if (this.cells.length >= MAX_CELLS) return;

    const originals = [...this.cells];
    for (const c of originals) {
      if (this.cells.length >= MAX_CELLS) break;
      if (c.size < MIN_SPLIT_SIZE) continue;

      const dx = tx - c.x, dy = ty - c.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;

      /* 面積平均 → 半徑 ÷ √2 */
      const newR = c.size / Math.sqrt(2);
      c.size       = newR;
      c.mergeClock = MERGE_COOLDOWN;

      const nc = new Cell(c.x, c.y, newR, MERGE_COOLDOWN);
      nc.vx = ux * SPLIT_BOOST;
      nc.vy = uy * SPLIT_BOOST;
      this.cells.push(nc);
    }
  }

  /* ---------- 合併 ---------- */
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

        /* 判斷重疊面積比例 */
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

    /* 由近到遠處理，避免階層式合併錯亂 */
    pairs.sort((p, q) => p.d - q.d);

    const used = new Set();
    for (const { a, b } of pairs) {
      if (used.has(a.id) || used.has(b.id)) continue;

      /* 確保「大吞小」 */
      const big   = a.area >= b.area ? a : b;
      const small = big === a ? b : a;

      const newArea = big.area + small.area;
      big.vx   = (big.vx * big.area + small.vx * small.area) / newArea;
      big.vy   = (big.vy * big.area + small.vy * small.area) / newArea;
      big.size = Math.sqrt(newArea);

      const idx = this.cells.indexOf(small);
      if (idx !== -1) this.cells.splice(idx, 1);
      used.add(small.id);
    }
  }
}

module.exports = Player;