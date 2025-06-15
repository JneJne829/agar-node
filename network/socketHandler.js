// network/socketHandler.js
const Player  = require('../models/Player');
const config  = require('../config');

/* 隨機顏色 */
function randomColor() {
  const pool = config.PLAYER_COLOR_POOL;
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  return (
    '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
  );
}

/**
 * @param {import('socket.io').Server} io
 * @param {Object<string, Player>}     players
 * @param {Map<number, import('../models/Feed')>} feeds
 */
function setupSockets(io, players, feeds) {
  io.on('connection', socket => {
    /* 建立玩家（預設隨機色與匿名名稱） */
    const p = new Player(
      socket.id,
      Math.random() * 800 - 400,
      Math.random() * 800 - 400,
      undefined,
      randomColor(),
      config.DEFAULT_PLAYER_NAME
    );
    players[socket.id] = p;

    /* 傳給新連線者的初始資料 */
    socket.emit('init', {
      players: Object.fromEntries(
        Object.entries(players).map(([id, pl]) => [
          id,
          {
            id   : pl.id,
            name : pl.name,
            color: pl.color,
            cells: pl.cells.map(c => ({ id: c.id, x: c.x, y: c.y, size: c.size }))
          }
        ])
      ),
      feeds: Array.from(feeds.values())
    });

    /* 取得滑鼠目標 (20 ms 節流) */
    let last = 0;
    socket.on('moveTo', ({ mx, my }) => {
      const now = Date.now();
      if (now - last < 20) return;
      last = now;
      p.setTarget(mx, my);
    });

    /* 分裂 */
    socket.on('split', ({ tx, ty }) => p.split(tx, ty));

    /* 投餵 (W) */
    socket.on('eject', ({ tx, ty }) => p.requestEject(tx, ty));

    /* 更新個人名稱 / 顏色 */
    socket.on('setProfile', ({ name, color }) => {
      p.setProfile({ name, color });

      /* 立即同步名稱 / 顏色，免等下一個 update tick */
      io.emit('profileUpdated', {
        id: p.id,
        name: p.name,
        color: p.color
      });
    });

    /* 斷線清理 */
    socket.on('disconnect', () => delete players[socket.id]);
  });
}

module.exports = setupSockets;