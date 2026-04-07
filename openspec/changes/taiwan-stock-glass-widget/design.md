## Context

全新 Electron 桌面應用程式，從空白儲存庫建立。目標是讓使用者在工作時以最小干擾查看台灣股市即時行情。核心挑戰：台灣證交所 TWSE API 有 CORS 限制，瀏覽器（含 Electron renderer）無法直接呼叫；視窗需完全透明以呈現毛玻璃效果；UI 更新需每 10 秒輪詢而不阻塞主執行緒。

## Goals / Non-Goals

**Goals:**
- 以 electron-vite（react-ts 模板）快速建立可維護的 Electron + React + TypeScript 架構
- 透過 Electron main process + IPC 安全繞過 CORS，不犧牲 contextIsolation 安全設定
- 實作毛玻璃透明視窗，在 Windows 10/11 上正確顯示
- 實作完整的股票清單 CRUD、持久化、即時更新
- 提供 Windows NSIS 安裝檔打包

**Non-Goals:**
- macOS / Linux 打包（未來可加，不在本次範圍）
- 後端伺服器或資料庫
- K 線圖、技術分析等進階圖表功能
- 帳號登入、雲端同步
- 開機自動啟動的實際實作（僅 UI placeholder）

## Decisions

### 決策 1：使用 electron-vite 而非手動整合

**選擇**：`npm create @quick-start/electron@latest` 使用 react-ts 模板  
**理由**：electron-vite 提供開箱即用的 HMR、main/preload/renderer 分離建置、TypeScript 路徑解析。手動整合需處理多個 vite 設定和複雜的模組解析，維護成本高。  
**替代方案**：Electron Forge（較重、設定繁瑣）、手動整合（彈性高但複雜）

### 決策 2：TWSE API 在 main process 呼叫（IPC 架構）

**選擇**：`ipcMain.handle('fetch-stocks', handler)` + `contextBridge.exposeInMainWorld`  
**理由**：
- Renderer 直接 fetch 會碰到 CORS（TWSE 未設 Access-Control-Allow-Origin）
- `webSecurity: false` 不安全，且在 Electron 新版有其他限制
- Main process 使用 Node.js `https` 模組，可自訂 Referer header，完全繞過 CORS
- contextIsolation 保持開啟，安全性不妥協

**IPC 介面**：
```typescript
// Renderer 呼叫
window.api.fetchStocks(symbols: StockSymbol[]) → Promise<StockInfo[]>

// Main process handler
ipcMain.handle('fetch-stocks', (_, symbols) => stockApi.fetchStocks(symbols))
```

**替代方案**：session.webRequest 攔截修改 headers（較複雜，難除錯）

### 決策 3：Tailwind CSS v4 CSS-first 模式

**選擇**：`@import "tailwindcss"` 於 index.css，Vite plugin 方式整合  
**理由**：v4 不使用 tailwind.config.js，改為 CSS 變數和 `@layer utilities` 自訂。@tailwindcss/vite plugin 提供最佳 Vite 整合，建置速度快。  
**毛玻璃 utilities**：
```css
@layer utilities {
  .glass { backdrop-filter: blur(20px); background: rgba(15,15,25,0.55); ... }
  .drag-region { -webkit-app-region: drag; }
  .no-drag { -webkit-app-region: no-drag; }
}
```

### 決策 4：視窗透明 + 毛玻璃

**選擇**：`transparent: true` + `frame: false` + `backgroundColor: '#00000000'`  
**理由**：Windows 上實現真正透明視窗的唯一方式。backdrop-filter 需要視窗本身透明才能透出桌面壁紙。  
**注意**：`resizable: true` 與 `transparent: true` 在某些 Windows 版本有邊框殘影，需測試。

### 決策 5：localStorage 持久化（renderer 端）

**選擇**：股票清單存於 renderer 的 localStorage  
**理由**：簡單直接，無需 IPC，符合「所有資料在前端處理」的原則。Electron renderer 的 localStorage 在同一個 app profile 下跨次啟動持久保留。  
**替代方案**：electron-store（main process 端 JSON 檔案）— 過度設計，localStorage 足夠。

### 決策 6：TWSE API 上市/上櫃自動偵測

**選擇**：預設嘗試 `tse_`，若 API 回傳資料為空則 fallback 嘗試 `otc_`  
**理由**：使用者輸入股票代碼時不需要知道市場別，系統自動判斷，體驗更友善。

## Risks / Trade-offs

- **TWSE API 不穩定** → Mitigation：加入 timeout（5s）、catch 錯誤、顯示 loading/error 狀態，不 crash
- **盤後 z="-"** → Mitigation：z 為 "-" 時改顯示 y（昨收），標示「昨收」，漲跌欄位顯示 "--"
- **Windows 透明視窗渲染問題** → Mitigation：測試 Windows 10/11，若有問題可改用半透明 rgba 背景取代完全透明
- **10 秒輪詢 API 速率限制** → Mitigation：TWSE 官方 API 無明確速率限制文件，但不應過於頻繁；10 秒間隔在合理範圍
- **electron-vite 版本相依性** → Mitigation：鎖定 package.json 版本，不使用 `latest` wildcards
- **-webkit-app-region 與互動元素衝突** → Mitigation：所有可點擊元素加 `.no-drag` class

## Open Questions

- TWSE API 是否需要 Cookie 才能取得資料？（觀察：有些時段需先訪問首頁才能取得）→ 可在 main process session 預先設定 Cookie 或先 GET 首頁取 session
- 盤中更新頻率 10 秒是否足夠？→ 可讓使用者設定（v2 功能）
