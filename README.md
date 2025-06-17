# Agar

一個 **100 % JavaScript**、零編譯、可離線執行的 Agar.io 模擬版  
後端使用 **Express + Socket.IO**、前端僅需一支 HTML，在本機即可體驗多人即時吞噬的樂趣。  

> 目前版本：**v0.6.0** – 2025-06-16  
> Node.js ≥ 16.0 建議  

---

## 功能特色
* 即時多人：120 Hz 伺服器迴圈 + 空間哈希格，數千顆 feed 也能流暢運行  
* 完整核心玩法  
  * 滑鼠移動、`Space` 分裂、`W` 投餵、質量衰減、合併冷卻  
  * 可自訂暱稱 / 顏色，支援排行榜  
* 漂亮而精簡的前端  
  * 平滑放大縮小、淡出動畫、暗黑 / 亮色背景、自訂 UI 開關  
* 完全開源易改：所有參數皆集中於 `config/index.js`，可 3 秒完成魔改  

---

## 快速開始 (Quick Start)

```bash
# 1. 下載
git clone https://github.com/your-name/agar-lite.git
cd agar-lite

# 2. 安裝相依
npm install     # 僅 express + socket.io

# 3. 執行
node server.js  # 或 PORT=8080 node server.js

# 4. 遊玩
# 開啟瀏覽器 http://localhost:3000
```

> 如果看不到畫面，請檢查瀏覽器 Console 是否有 WebSocket 連線失敗訊息，以及 Node.js 版本。

---

## 使用說明

### 控制

| 操作               | 鍵 / 滑鼠 | 說明 |
|--------------------|-----------|------|
| 移動               | 滑鼠      | 指向滑鼠位置移動 |
| 分裂               | Space     | 沿滑鼠方向分裂，最⾼ 16 顆 |
| 投餵 / 噴質 (Eject) | **W**     | 噴出同色小球，可被他人或自己吃 |
| 取名 / 選色        | 進入遊戲前| 入場選單可自訂 |
| UI 開關           | Checkbox  | 格線 / 名稱 / 質量  |

### 介面

* 右上角：Leaderboard（前 10 名，自己高亮）  
* 左下角：當前分數（質量總和）  
* 遊戲外框以世界大小 (`WORLD_SIZE`) 為界，鏡頭自動阻擋超出部份  

---

## 專案結構

```
agar-lite
├─ server.js            # Express + Socket.IO 入口
├─ config/
│  └─ index.js          # 全部遊戲參數
├─ logic/               # 伺服器邏輯
│  ├─ gameLoop.js
│  ├─ collision.js
│  └─ spatialGrid.js
├─ models/              # 資料模型
│  ├─ Player.js
│  └─ Feed.js
├─ network/
│  └─ socketHandler.js  # 所有 socket 事件
└─ public/
   └─ index.html        # 前端（零打包、立即開啟）
```

> 修改任何檔案後，重啟伺服器即可；前端為純 HTML/JS，F5 重新整理立即生效。

---

## 進階設定

所有參數集中於 `config/index.js`，常見可調整項目：

| 變數                  | 預設 | 說明 |
|-----------------------|------|------|
| `TICK_RATE`           | 120  | 伺服器邏輯更新頻率 (Hz) |
| `WORLD_SIZE`          | 6000 | 世界方形邊長 (px) |
| `FEED_COUNT`          | 10 000 | 場上維持的靜態 feed 數 |
| `EJECT_SIZE` / `EJECT_SPEED` | 10 / 35 | 投餵球半徑與初速 |
| `MERGE_COOLDOWN`      | 15 s | 分裂後幾秒才能再次合併 |
| `DECAY_RATE`          | 0.002 | 自然質量衰減 (0.2 % / s) |
| `PLAYER_COLOR_POOL`   | …    | 隨機顏色池 |

想要 **加速遊戲**？提高 `SPEED` 或降低 `WORLD_SIZE`  
想要 **大亂鬥**？提高 `FEED_COUNT` / `EJECT_SPEED`，並縮短 `MERGE_COOLDOWN`  
改完存檔 → `node server.js` 重啟即可

---

## 部署到雲端

```bash
# 部署範例 (Railway / Render / Heroku)
# 只需兩個步驟：
# 1. 建立 Node 服務，指令 = `node server.js`
# 2. 新增環境變數 PORT (平台自訂)；程式會自動抓取
```

> 服務器採用 WebSocket，請確認平台開放對應 port。

---

## 常見問題 (FAQ)

| 問題 | 解答 |
|------|------|
| 連線進不去 / 無法看到其他人 | 確認防火牆是否封鎖 WebSocket；若部署於 HTTPS 請將 `io()` 換成 `io('/', { secure: true })` |
| FPS 偏低 / 延遲高 | 減少 `FEED_COUNT` 或降至 60 Hz；亦可將 `GRID_CELL_SIZE` 調大以降低碰撞查詢次數 |
| 想要加入 AI 機器人？ | 在 `server.js` 建立新的 `Player` 實例並手動設定 `targetX/Y` 即可 |

---
