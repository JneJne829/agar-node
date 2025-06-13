// logic/collision.js
/** 判斷「細胞」是否吃到 feed */
function cellEatsFeed(cell, feed) {
  const dx = feed.x - cell.x;
  const dy = feed.y - cell.y;
  const r  = cell.size + feed.size;
  return dx * dx + dy * dy < r * r;  // 省掉 sqrt
}

module.exports = { cellEatsFeed };
