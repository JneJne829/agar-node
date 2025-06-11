// models/Player.js
class Player {
  constructor(id, x, y, size = 20) {
    this.id   = id;
    this.x    = x;
    this.y    = y;
    this.dirX = 0;
    this.dirY = 0;
    this.size = size;
  }

  /** 依目前方向移動一格 */
  move(speed) {
    this.x += this.dirX * speed;
    this.y += this.dirY * speed;
  }

  /** 吃到 feed 後變大 */
  grow(amount = 0.5) {
    this.size += amount;
  }
}

module.exports = Player;
