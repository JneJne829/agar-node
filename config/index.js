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
  MERGE_COOLDOWN: 1_000,          // 分裂後冷卻 (ms)
  MERGE_OVERLAP_RATIO: 0.5,       // ≥ 50 % 面積可合併

  /* ───── 吞噬 ───── */
  EAT_SIZE_RATIO: 1.2,            // 半徑需大於對手 20 %
  EAT_OVERLAP_RATIO: 0.5,         // ≥ 50 % 面積才判定吞噬

  /* ───── 速度衰減 ───── */
  BASE_CELL_SIZE: 20,
  SPEED_EXP: 0.5,
  MIN_SPEED_FACTOR: 0.15,

  /* ───── 顏色設定 ───── */
  // 玩家顏色池（可自由增刪）
  PLAYER_COLOR_POOL: [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722'
  ],

  // Feed 顏色池
  FEED_COLOR_POOL: [
    '#ffeb3b', '#cddc39', '#8bc34a', '#4caf50', '#009688',
    '#00bcd4', '#03a9f4', '#2196f3'
  ]
};