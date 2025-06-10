# 更動日誌

記錄所有重要變更。

## [Unreleased]
### 新增
- 

### 變更
- 

### 修復
- 

## [0.1.0] – 2025-06-11
### 新增
- 初始專案結構：
  - `server.js`：Express 與 Socket.io 伺服器邏輯，120 FPS 更新率、玩家狀態管理
  - `package.json`、`package-lock.json`：依賴管理（`express`、`socket.io`）
  - `public/index.html`：Canvas 渲染與 Socket.io 客戶端實現即時細胞移動
- 背景格線繪製
- 滑鼠相對畫面中心計算正規化移動向量
- 前端使用 `requestAnimationFrame` 進行渲染循環

### 變更
- 無

### 修復
- 修正細胞到達目標後停頓問題
