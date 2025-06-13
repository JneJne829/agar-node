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
    this.id = nextCellId++;
    this.x = x;
    this.y = y;
    this.size = size;      // 半徑
    this.vx = 0;
    this.vy = 0;
    this.mergeClock = mergeClock; // ms
  }
  get area() { return this.size * this.size; }
}

/* ───── Player ───── */
class Player {
  constructor(id, x, y, size = BASE_CELL_SIZE) {
    this.id = id;
    this.cells = [new Cell(x, y, size)];
    this.targetX = x;
    this.targetY = y;
  }

  setTarget(x, y) { this.targetX = x; this.targetY = y; }

  /* 每 tick 更新 */
  update(baseSpeed, dtMs) {
    /* A. 冷卻倒數 */
    for (const c of this.cells)
      if (c.mergeClock > 0) c.mergeClock = Math.max(0, c.mergeClock - dtMs);

    /* B. 移動 */
    for (const c of this.cells) {
      const dx = this.targetX - c.x, dy = this.targetY - c.y;
      const dist = Math.hypot(dx, dy);
      const v = baseSpeed * Math.max(
        MIN_SPEED_FACTOR,
        Math.pow(BASE_CELL_SIZE / c.size, SPEED_EXP)
      );
      const ux = dist ? dx / dist : 0, uy = dist ? dy / dist : 0;

      c.x += ux * v + c.vx;
      c.y += uy * v + c.vy;

      const half = WORLD_SIZE / 2, r = c.size;
      c.x = Math.min(half - r, Math.max(-half + r, c.x));
      c.y = Math.min(half - r, Math.max(-half + r, c.y));

      c.vx *= 0.9; c.vy *= 0.9;
    }

    /* C. 互斥：僅在冷卻期內阻擋重疊 */
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const a = this.cells[i], b = this.cells[j];
        if (a.mergeClock === 0 && b.mergeClock === 0) continue; // 已可融合，允許重疊
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minD = a.size + b.size;
        if (dist < minD) {
          const ov = (minD - dist) / 2, ux = dx / dist, uy = dy / dist;
          a.x -= ux * ov; a.y -= uy * ov;
          b.x += ux * ov; b.y += uy * ov;
        }
      }
    }

    /* D. 合併 */
    this._merge();
  }

  grow(c) { c.size = Math.sqrt(c.size * c.size + FEED_SIZE * FEED_SIZE); }

  split(dx, dy) {
    if (this.cells.length >= MAX_CELLS) return;
    const len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    for (const c of [...this.cells]) {
      if (this.cells.length >= MAX_CELLS) break;
      if (c.size < MIN_SPLIT_SIZE) continue;

      const ns = c.size / Math.sqrt(2);
      c.size = ns; c.mergeClock = MERGE_COOLDOWN;

      const nc = new Cell(c.x, c.y, ns, MERGE_COOLDOWN);
      nc.vx = ux * SPLIT_BOOST; nc.vy = uy * SPLIT_BOOST;
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
        if (a.mergeClock > 0 || b.mergeClock > 0) continue;

        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy);
        const r1 = a.size, r2 = b.size;

        if (d >= r1 + r2) continue; // 無交集

        /* 計算兩圓重疊面積 */
        const minR = Math.min(r1, r2);
        let overlapArea;

        if (d <= Math.abs(r1 - r2)) {
          overlapArea = Math.PI * minR * minR; // 小圓完全被包住
        } else {
          const alpha = Math.acos((d*d + r1*r1 - r2*r2) / (2*d*r1));
          const beta  = Math.acos((d*d + r2*r2 - r1*r1) / (2*d*r2));
          const part1 = r1*r1*alpha + r2*r2*beta;
          const part2 = 0.5 * Math.sqrt(
            (-d + r1 + r2) *
            ( d + r1 - r2) *
            ( d - r1 + r2) *
            ( d + r1 + r2)
          );
          overlapArea = part1 - part2;
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

      const newArea = a.area + b.area;
      const newR    = Math.sqrt(newArea);

      a.vx = (a.vx * a.area + b.vx * b.area) / newArea;
      a.vy = (a.vy * a.area + b.vy * b.area) / newArea;
      a.size = newR;

      const idx = this.cells.indexOf(b);
      if (idx !== -1) this.cells.splice(idx, 1);
      used.add(b.id);
    }
  }
}

module.exports = Player;
