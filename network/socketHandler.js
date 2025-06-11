// network/socketHandler.js
const Player = require('../models/Player');

/**
 * 建立 Socket.io 事件處理
 * @param {import('socket.io').Server} io
 * @param {Object.<string, Player>} players
 * @param {Array} feeds
 */
function setupSockets(io, players, feeds) {
  io.on('connection', socket => {
    // 建立新玩家
    const p = new Player(
      socket.id,
      Math.random() * 800 - 400,
      Math.random() * 800 - 400
    );
    players[socket.id] = p;

    // 傳送初始狀態
    socket.emit('state', { players, feeds });

    // 更新玩家方向
    socket.on('move', ({ dx, dy }) => {
      p.dirX = dx;
      p.dirY = dy;
    });

    socket.on('disconnect', () => {
      delete players[socket.id];
    });
  });
}

module.exports = setupSockets;
