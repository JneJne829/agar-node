// network/socketHandler.js
const Player = require('../models/Player');

/**
 * @param {import('socket.io').Server} io
 * @param {Object.<string, Player>}    players
 * @param {Map<number, import('../models/Feed')>} feeds
 */
function setupSockets(io, players, feeds) {
  io.on('connection', socket => {
    const p = new Player(
      socket.id,
      Math.random() * 800 - 400,
      Math.random() * 800 - 400
    );
    players[socket.id] = p;

    /* 初始狀態 */
    socket.emit('init', {
      players: Object.fromEntries(
        Object.entries(players).map(([id, pl]) => [
          id,
          {
            id: pl.id,
            cells: pl.cells.map(c => ({
              id: c.id,
              x:  c.x,
              y:  c.y,
              size: c.size
            }))
          }
        ])
      ),
      feeds: Array.from(feeds.values())
    });

    /* 20 ms 節流目標更新 */
    let last = 0;
    socket.on('moveTo', ({ mx, my }) => {
      const now = Date.now();
      if (now - last < 20) return;
      last = now;
      p.setTarget(mx, my);
    });

    /* 分裂 */
    socket.on('split', ({ dx, dy }) => {
      p.split(dx, dy);
    });

    /* 斷線 */
    socket.on('disconnect', () => { delete players[socket.id]; });
  });
}

module.exports = setupSockets;
