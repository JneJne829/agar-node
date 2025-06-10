// server.js
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static('public'));

// ───── 遊戲參數 ──────────────────────
const TICK_RATE = 120;  // 伺服器更新頻率
const SPEED     = 2;    // 每 tick 移動距離 (px)

// 玩家狀態：包含位置與當前方向向量
const players = {};

io.on('connection', socket => {
  console.log(`玩家 ${socket.id} 已連線`);

  // 初始化位置與方向
  const startX = Math.random() * 800 - 400;
  const startY = Math.random() * 800 - 400;
  players[socket.id] = {
    x: startX,
    y: startY,
    dirX: 0,
    dirY: 0,
    size: 20
  };

  // 首次推送所有玩家狀態
  socket.emit('state', players);

  // 接收前端每幀正規化後的方向向量
  socket.on('move', ({ dx, dy }) => {
    const p = players[socket.id];
    if (p) {
      p.dirX = dx;
      p.dirY = dy;
    }
  });

  socket.on('disconnect', () => {
    console.log(`玩家 ${socket.id} 已斷線`);
    delete players[socket.id];
  });
});

// ───── 伺服器主迴圈 (120 FPS) ─────────
setInterval(() => {
  for (const id in players) {
    const p = players[id];
    // 只要方向不為 (0,0)，就持續移動
    if (p.dirX !== 0 || p.dirY !== 0) {
      p.x += p.dirX * SPEED;
      p.y += p.dirY * SPEED;
    }
  }
  io.emit('state', players);
}, 1000 / TICK_RATE);

// ───── 啟動伺服器 ─────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
