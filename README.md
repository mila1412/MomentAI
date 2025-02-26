## Setup

```bash
npm install
npm run dev
npm run build
```

## 使用開源工具

Vue3、Nuxt3、VueUse、PDF.js
樣式：Sass

## 解決需求

1. 能夠使用 MomentX 提供的客製 API 並達成抽換模型的功能。
   將模型名稱放在 Select，搭配 Vue Ref 獲取響應式資料。

2. 能夠儲存歷史對話紀錄，點擊對話紀錄時可以看到歷史對話紀錄，並且網址列要使用 uuid 來做 route ，以進行切換。
   使用 Nuxt 動態路由，路由名稱為 API 回傳的 id，再根據此 id 比對 localStorage 的資料，將對應 id 之內容顯示在 [id].vue。

3. 能夠使用 MomentX 提供的客製 API 完成與 AI 對話的功能，要設定 Stream 模式為 True。
   使用 Nuxt $fetch 串接 MomentX API，添加 .env 環境變數，處理流式數據後顯示在頁面上。
   判斷若該頁有對話紀錄，將後續對話存於同一頁；若無對話紀錄，會在左側新增一筆。

4. 能夠上傳 PDF 檔，解析 PDF 檔文字部份的內容，塞入 system prompt 中，以進行對話問答。
   使用 PDF.js 解析檔案，並將文字回傳給 AI 生成兩個關鍵字問題，再放到提示框中。

5. 儲存對話紀錄和 PDF 檔的方式不設限，要自己架 DB 或是只存 local 都可以。
   使用 useStorage 將對話紀錄存在 localStorage。

## TODO

拆分 composable、RWD、部分功能優化(EX：上傳重複 PDF 錯誤處理、loading 處理)
