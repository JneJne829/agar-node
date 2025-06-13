// server.js
const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');

const config        = require('./config');
const Feed          = require('./models/Feed');
const startGameLoop = require('./logic/gameLoop');
const setupSockets  = require('./network/socketHandler');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static('public'));

/* ---------- 狀態容器 ---------- */
const players = {};
const feeds   = new Map();

/* 預先生成 feed */
for (let i = 0; i < config.FEED_COUNT; i++) {
  const f = new Feed();
  feeds.set(f.id, f);
}

/* Socket 事件 + 主迴圈 */
setupSockets(io, players, feeds);
startGameLoop(io, players, feeds, Feed);

/* 啟動伺服器 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
