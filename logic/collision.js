// logic/collision.js
/** 判斷 player 是否吃到 feed */
function playerEatsFeed(player, feed) {
  const dx = feed.x - player.x;
  const dy = feed.y - player.y;
  const r  = player.size + feed.size;
  return dx * dx + dy * dy < r * r;
}

module.exports = { playerEatsFeed };
