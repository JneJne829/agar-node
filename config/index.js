// config/index.js
module.exports = {
  /* ───── 伺服器更新 ───── */
  TICK_RATE: 120,
  SPEED: 2,

  /* ───── Feed ───── */
  FEED_COUNT: 10000,
  FEED_SIZE: 5,

  /* ───── 世界 ───── */
  WORLD_SIZE: 6000,
  GRID_CELL_SIZE: 50,

  /* ───── 分裂 / 合併 ───── */
  MIN_SPLIT_SIZE: 30,
  SPLIT_BOOST: 25,
  MAX_CELLS: 16,
  MERGE_COOLDOWN: 1_000,      // 分裂後 5 s 才能融合
  MERGE_OVERLAP_RATIO: 0.5,   // 🔸 至少覆蓋小球面積的 50 %

  /* ───── 速度衰減 ───── */
  BASE_CELL_SIZE: 20,
  SPEED_EXP: 0.5,
  MIN_SPEED_FACTOR: 0.15
};
