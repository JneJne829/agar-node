// config/index.js
module.exports = {
  /* ───── 伺服器更新 ───── */
  TICK_RATE: 120,
  SPEED: 2,

  /* ───── Feed ───── */
  FEED_COUNT: 10_000,
  FEED_SIZE: 5,

  /* ───── 世界 ───── */
  WORLD_SIZE: 6000,
  GRID_CELL_SIZE: 50,

  /* ───── 分裂 / 合併 ───── */
  MIN_SPLIT_SIZE: 30,
  SPLIT_BOOST: 15,          // ← 可自由調整「分裂衝刺速度」
  MAX_CELLS: 16,
  MERGE_COOLDOWN: 15.0,      // s（改為浮點秒數）
  MERGE_OVERLAP_RATIO: 0.7, // ≥ 50 % 面積可合併

  /* ───── 吞噬 ───── */
  EAT_SIZE_RATIO: 1.2,      // 半徑需大於對手 20 %
  EAT_OVERLAP_RATIO: 0.7,   // ≥ 50 % 面積才判定吞噬

  /* ───── 速度衰減 ───── */
  BASE_CELL_SIZE: 20,
  SPEED_EXP: 0.5,
  MIN_SPEED_FACTOR: 0.15,

  /* ───── 顏色設定 ───── */
  PLAYER_COLOR_POOL: [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722'
  ],
  FEED_COLOR_POOL: [
    '#ffeb3b', '#cddc39', '#8bc34a', '#4caf50',
    '#009688', '#00bcd4', '#03a9f4', '#2196f3'
  ],

  /* ───── 投餵 (W) ───── */
  EJECT_SIZE: 10,           // 投餵小球半徑
  EJECT_SPEED: 35,         // 初速 (px / tick)
  EJECT_FRICTION: 0.90,    // 每 tick 動能衰減
  EJECT_OFFSET: 2,          // 與細胞表面保持的安全間隔 (px)

  /* ───── 自然衰減 ───── */
  DECAY_RATE: 0.002,       // 每秒流失 0.2 % 質量

  /* ───── 其他 ───── */
  MIN_CELL_SIZE: 10,        // 最小半徑（避免負值）

  /* ───── 名稱設定 ───── */
  DEFAULT_PLAYER_NAME: 'An unnamed cell'
};