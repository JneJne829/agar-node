// server.js
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');

const config          = require('./config');
const Feed            = require('./models/Feed');
const startGameLoop   = require('./logic/gameLoop');
const setupSockets    = require('./network/socketHandler');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static('public'));

/* 遊戲狀態容器 */
const players = {};
const feeds   = Array.from({ length: config.FEED_COUNT }, () => new Feed());

/* 建立 Socket.io 事件 */
setupSockets(io, players, feeds);

/* 啟動主迴圈 */
startGameLoop(io, players, feeds, Feed);

/* 啟動伺服器 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
