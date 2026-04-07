## 1. 專案初始化與基礎設定

- [x] 1.1 使用 `npm create @quick-start/electron@latest` 以 react-ts 模板初始化專案（在現有目錄中），保留 git history
- [x] 1.2 安裝 Tailwind CSS v4：`npm install -D @tailwindcss/vite tailwindcss`
- [x] 1.3 安裝 electron-builder：`npm install -D electron-builder`
- [x] 1.4 修改 `electron.vite.config.ts`：在 renderer plugins 加入 `tailwindcss()` from `@tailwindcss/vite`
- [x] 1.5 建立 `src/index.css`：加入 `@import "tailwindcss"`，定義 `.glass`、`.drag-region`、`.no-drag` utilities
- [x] 1.6 建立 `electron-builder.yml`：設定 Windows NSIS 打包，appId `com.pyjoker.taiwan-stock-widget`
- [x] 1.7 在 `package.json` 的 scripts 加入 `"build:win": "npm run build && electron-builder --win"`

## 2. TypeScript 型別定義

- [x] 2.1 建立 `src/types/stock.ts`：定義 `StockSymbol`（code, market）、`StockInfo`（code, name, price, change, changePercent, volume, isAfterHours, market）、`RawTWSEItem` 介面
- [x] 2.2 建立 `src/types/electron.d.ts`：擴充 `Window` 介面，宣告 `window.api.fetchStocks`、`window.api.minimizeWindow`、`window.api.closeWindow` 的型別

## 3. Electron Main Process

- [x] 3.1 建立 `electron/main/stockApi.ts`：實作 `buildTWSEUrl(symbols: StockSymbol[]): string`，正確組合 `tse_XXXX.tw|otc_XXXX.tw` 格式
- [x] 3.2 在 `stockApi.ts` 實作 `fetchStocksFromTWSE(symbols: StockSymbol[]): Promise<StockInfo[]>`：使用 Node.js `https` 模組，設定 `Referer: https://mis.twse.com.tw/` header，timeout 5 秒
- [x] 3.3 在 `stockApi.ts` 實作 `parseMsgArray(raw: RawTWSEItem[]): StockInfo[]`：處理 z="-" 的盤後情況，計算漲跌幅
- [x] 3.4 在 `stockApi.ts` 實作 `autoDetectMarket(code: string): Promise<'tse' | 'otc'>`：先嘗試 tse，失敗 fallback otc
- [x] 3.5 修改 `electron/main/index.ts`：建立 BrowserWindow（transparent, frame:false, alwaysOnTop, 380×520，minWidth:320, minHeight:400）
- [x] 3.6 在 `electron/main/index.ts` 註冊 IPC handlers：`ipcMain.handle('fetch-stocks', ...)`, `ipcMain.handle('minimize-window', ...)`, `ipcMain.handle('close-window', ...)`

## 4. Electron Preload Script

- [x] 4.1 修改 `electron/preload/index.ts`：使用 `contextBridge.exposeInMainWorld('api', {...})` 暴露 `fetchStocks`、`minimizeWindow`、`closeWindow` 三個方法給 renderer

## 5. React 元件 — 核心

- [x] 5.1 建立 `src/hooks/useStockData.ts`：從 localStorage 讀取股票清單（含預設 5 支），首次渲染後立即 fetch，每 10 秒自動 fetch，unmount 時清除 timer
- [x] 5.2 在 `useStockData.ts` 實作 `addStock(codes: string)`、`removeStock(code: string)`，含 localStorage 寫入和 auto-detect 市場別
- [x] 5.3 建立 `src/components/StockItem.tsx`：顯示單支股票（代碼、名稱、股價、漲跌%、漲跌額、成交量），套用漲跌顏色、hover scale 效果，右側含刪除按鈕（no-drag）
- [x] 5.4 建立 `src/components/StockList.tsx`：渲染 `StockInfo[]`，空清單時顯示提示文字，loading 狀態顯示指示

## 6. React 元件 — UI

- [x] 6.1 建立 `src/components/TitleBar.tsx`：應用名稱作為 drag-region，最小化/關閉按鈕（no-drag），loading 動畫點（fetch 進行中時）
- [x] 6.2 建立 `src/components/AddStockModal.tsx`：「+」按鈕觸發，輸入框支援逗號分隔多股，確認/取消按鈕，Enter 鍵確認，ESC 鍵關閉
- [x] 6.3 在 `AddStockModal.tsx` 加入「開機自動啟動」toggle UI（placeholder，功能 TODO）
- [x] 6.4 建立 `src/App.tsx`：整合 TitleBar、StockList、AddStockModal，底部顯示最後更新時間（HH:mm:ss）和更新失敗狀態

## 7. 樣式與視覺

- [x] 7.1 完成 `src/index.css` 毛玻璃樣式：`.glass { backdrop-filter: blur(20px); background: rgba(15,15,25,0.55); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }`
- [x] 7.2 確認 `src/main.tsx` 引入 `index.css`，並移除 electron-vite 模板預設樣式
- [x] 7.3 確認所有可點擊元素在 drag-region 內都加有 `no-drag` class
- [x] 7.4 設定 `html`, `body`, `#root` 為 `background: transparent`，確保透明視窗效果

## 8. 驗證與測試

- [ ] 8.1 執行 `npm run dev`，確認透明懸浮視窗正常顯示，毛玻璃效果可見
- [ ] 8.2 確認 5 支預設股票行情顯示（或盤後正確顯示昨收）
- [ ] 8.3 測試新增股票（tse 和 otc 各一支）、逗號分隔多股新增
- [ ] 8.4 測試刪除股票，重啟 app 確認 localStorage 持久化正確
- [ ] 8.5 測試拖曳移動視窗、調整大小、最小化、關閉
- [ ] 8.6 測試斷網情況：確認顯示錯誤狀態而非 crash
- [ ] 8.7 執行 `npm run build:win`，確認產生可安裝的 `.exe` 檔案
