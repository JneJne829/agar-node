# 更動日誌

記錄所有重要變更。

## [Unreleased]
### 新增
- 

### 變更
- 

### 修復
- 


## [0.6.0] – 2025-06-16
### 新增
- **投餵機制（W）**  
  - 玩家可按 **W** 沿滑鼠方向噴出小球（eject）；產生的投餵球具有動量並逐漸減速  
  - `Player` 新增 `_ejectQ`／`requestEject()`／`popEjectedFeeds()`；伺服器於每 tick 轉成可移動 `Feed`  
  - `config/index.js` 新增  
    - `EJECT_SIZE`、`EJECT_SPEED`、`EJECT_FRICTION`、`EJECT_OFFSET` 四個參數  

- **可移動 Feed 與增量同步**  
  - `Feed` 物件新增 `vx` / `vy`；`gameLoop` 每 tick 更新位置與摩擦阻尼  
  - `update` 封包新增 `feedsMoved`，僅傳實際移動之 feed，節省頻寬  

- **玩家個人化**  
  - `Player` 增加 `name` 屬性與 `setProfile()`，可動態修改名稱 / 顏色  
  - `socketHandler` 新增  
    - `setProfile`（client→server）  
    - `profileUpdated`（server→all）立即同步其他玩家  
  - 前端加入入場選單：暱稱、顏色調色盤、顯示選項（格線 / 名稱 / 質量）  

- **Leaderboard**  
  - 右上角固定寬度排行榜，顯示 TOP 10 質量，自己的名字以黃色凸顯  

- **自然質量衰減**  
  - `DECAY_RATE`（0.2 %／s）防止過大玩家無限膨脹  
  - `MIN_CELL_SIZE` 保障最小半徑，避免因衰減或投餵出現負值  

### 變更
- **合併／吞噬規則調整**  
  - `MERGE_COOLDOWN` 改為「秒」；在程式內轉換為 `ms` 倒數  
  - `MERGE_OVERLAP_RATIO`、`EAT_OVERLAP_RATIO` 由 **0.5 → 0.7**，降低誤吃機率  
  - `SPLIT_BOOST` 下修為 **15**，分裂衝刺較易控  

- **Socket 封包**  
  - `update` 新增 `feedsMoved`；如同一 id 同時出現在 `feedsRemoved`，將被過濾避免前端殘影  
  - `players` 物件新增 `name` 欄位  

- **伺服器邏輯**  
  - `gameLoop` 新增 `STOP_EPS`，速度低於 0.01 視為靜止  
  - `MAX_FEED_SIZE = max(FEED_SIZE, EJECT_SIZE)`，確保碰撞半徑正確  

### 修復
- **同 tick 移動＋刪除殘影**  
  - 廣播前以 `removedSet` 過濾 `added` / `moved`，杜絕前端幽靈小球  

- **名稱／顏色更新延遲**  
  - 即時 `profileUpdated` 廣播，前端立刻刷新  

- **投餵球長時間低速漂移**  
  - 當速度低於閾值即歸零，避免無限抖動  

- **極端投餵導致負半徑**  
  - 引入 `MIN_CELL_SIZE` 下限，確保計算安全  


## [0.5.0] – 2025-06-14
### 新增
- **顏色系統**  
  - 伺服器端於玩家重生時，從 `PLAYER_COLOR_POOL` 隨機指派顏色並同步給所有用戶端  
  - Feed 物件新增 `color` 欄位；生成時從 `FEED_COLOR_POOL` 隨機取色  
  - `config/index.js` 增加 `PLAYER_COLOR_POOL`、`FEED_COLOR_POOL` 兩組參數，方便動態調整  

### 變更
- **Socket 資料格式**  
  - `init` / `update` 封包中的 `players` 物件多帶 `color` 欄位  
  - Feed 增量同步同時攜帶 `color`  
- **前端渲染**  
  - 玩家細胞顏色改為使用伺服器提供的 `player.color`，移除原本固定「自己紅、他人藍」邏輯  
  - Feed 改以各自 `color` 繪製  

### 修復
- **細胞合併方向錯誤**  
  - 修正同一玩家多細胞合併時的問題  
  - 現在始終由「大球吞小球」，面積與動量正確保留


## [0.4.0] – 2025-06-13
### 新增
- **多細胞分裂／合併系統**  
  - 玩家可按 `Space` 沿滑鼠方向瞬間分裂；最多 **16** 顆細胞  
  - 分裂後 **15 s (可自訂)** 冷卻，兩顆細胞互相覆蓋面積 ≥ 50 % (可自訂) 時自動融合  
- **質量-速度衰減模型**：細胞半徑越大移動越慢，速度 ≈ `size^-0.5`，並設最小 15 % 下限  
- **固定尺寸 Spatial Hash Grid**  
  - `GRID_CELL_SIZE = 50 px`，使用 `Map<string, Set>`；插入／移除 O(1)，不再因巨大玩家而重建  
- **Feed 增量同步**  
  - `Feed` 具遞增 `id`，伺服器僅傳 `feedsAdded` / `feedsRemoved`，前端合併本地狀態  
- **淡出動畫**：被吃掉的細胞於前端保留 200 ms 逐漸縮小並透明消失  

### 變更
- **Socket 事件**  
  - 狀態訊息拆分為 `init`（完整）與 `update`（增量）  
  - 移動事件改為 `moveTo {mx, my}`（世界座標），並以 20 ms 節流  
  - 新增 `split {dx, dy}` 事件  
- **資料結構**  
  - Feed 容器由 `Array` → `Map<id, Feed>`  
  - `SpatialGrid` bucket 改用 `Set`；查詢 API 由 `queryNearby` → `queryRange(x, y, r)`  
- **遊戲迴圈**  
  - 採固定步長 while-loop（lag compensation）取代單次 `setInterval`  
  - `Player.update()` 內整合冷卻倒數、速度阻尼、細胞互斥與自動合併  
- **前端繪製優化**  
  - 鏡頭中心改為所有細胞面積加權平均  
  - 僅渲染視口 + 100 px 內的 feed，降低繪製負載  
  - 多細胞半徑緩動速率調整為 5 %，並加入淡出效果  

### 修復
- 修正動態放大網格時偶發卡頓（改用固定格）  
- 修正高頻 `move` 封包造成網路壅塞（加入節流）  
- 修正細胞分裂後於邊界卡牆的問題（速度阻尼＋邊界矯正）  
- 修正 feed 刪除後仍殘留於畫面的問題（加入 `feedsRemoved` 增量同步）  


## [0.3.0] – 2025-06-12
### 新增
- **動態鏡頭縮放**：玩家細胞越大，鏡頭視野越廣，並以緩動方式平滑變化  
- **平滑成長效果**：前端為每位玩家維護 `smoothSize`，細胞半徑以 10 % 緩動逼近實際大小  
- **增量更新空間網格**  
  - 初次插入所有 feed 後，每 tick 只對「新生成 / 被吃掉」的 feed 做 `insert` / `remove`  
  - 當偵測到更大的玩家尺寸時，動態放大 `cellSize` 並重建索引  

### 變更
- `gameLoop.js`：  
  - 玩家移動後夾在邊界內；鏡頭夾取邏輯考慮縮放後視口大小  
  - 移除每 tick 全量重灌 feed 的操作，改為增量更新  
- 前端 `index.html`：  
  - 改寫 `draw()`：`ctx.scale` 處理縮放、格線線寬隨縮放調整  
  - 滑鼠方向向量改以「世界座標 → 玩家座標」計算，支援縮放  
  - 加入 `MIN_ZOOM` / `MAX_ZOOM` 參數限制最大最小視野  

### 修復
- 修正巨大細胞與 feed 重疊卻無法吃掉的問題（動態調整 `cellSize`）  
- 修正縮放後鏡頭仍可看到地圖外的問題  


## [0.2.0] – 2025-06-11
### 新增
- Feed 系統：場上啟動時全圖隨機生成既定數量的 feed，之後以固定速率持續補充  
- 空間網格（Spatial Grid）碰撞優化：加速玩家與 feed 的鄰域偵測  
- 地圖邊界限制：  
  - 伺服器端限制玩家位置於邊界內  
  - 前端鏡頭偏移鎖定於地圖範圍內  
- 暗黑主題：前端背景與格線改為深色配色  
- 後端模組化重構：拆分 `config`、`models`、`logic`、`network` 等目錄，關注分離  

### 變更
- `gameLoop.js`：重構補 feed 邏輯為固定速率及全圖隨機生成  
- 前端方向向量與鏡頭偏移計算更新，改以玩家螢幕座標為基準  

### 修復
- 過快生成 feed 的問題  
- 玩家與鏡頭可超出地圖邊界的問題  


## [0.1.0] – 2025-06-11
### 新增
- 初始專案結構：  
  - `server.js`：Express + Socket.io 伺服器（120 FPS 更新）  
  - `package.json`、`package-lock.json`：依賴管理  
  - `public/index.html`：Canvas + Socket.io 客戶端  
- 背景格線繪製  
- 滑鼠相對畫面中心計算正規化移動向量  
- 前端使用 `requestAnimationFrame` 進行渲染  

### 變更
- 無  

### 修復
- 細胞到達目標後停頓問題  
