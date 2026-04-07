## Why

目前沒有任何適合台灣股市投資人的輕量桌面懸浮小工具，能讓使用者在工作時隨時一眼掌握持股動態，而不需要切換到瀏覽器或開啟笨重的看盤軟體。本工具以毛玻璃風格懸浮於桌面，提供極簡、美觀的即時行情顯示，解決「看盤干擾工作流程」的痛點。

## What Changes

- 全新建立 Electron + React 18 + TypeScript 桌面應用程式（從零開始）
- 使用 electron-vite 整合 Vite 建置工具
- 導入 Tailwind CSS v4（CSS-first 模式，@tailwindcss/vite plugin）
- 實作透明毛玻璃懸浮視窗（frameless、alwaysOnTop、transparent）
- 實作台灣證交所（TWSE）官方 API 串接，在 Electron main process 呼叫以繞過 CORS
- 支援上市（tse_）與上櫃（otc_）股票查詢
- 實作自訂標題列（拖曳、最小化、關閉）
- 實作股票清單的 CRUD（新增/刪除）與 localStorage 持久化
- 實作每 10 秒自動更新與最後更新時間顯示
- 提供 Windows .exe 打包設定（electron-builder NSIS）

## Capabilities

### New Capabilities

- `stock-display`: 即時顯示股票行情列表，包含代碼、名稱、股價、漲跌%、漲跌額、成交量；台灣配色（漲紅跌綠）；盤後顯示昨收
- `stock-data-fetch`: 透過 Electron IPC 在 main process 呼叫 TWSE API，解析 msgArray，支援 tse/otc 市場
- `stock-management`: 使用者新增（支援逗號分隔多股）/刪除股票；清單以 localStorage 持久化；預設 5 支熱門股
- `glass-window`: 透明毛玻璃視窗（backdrop-filter:blur）、frameless、alwaysOnTop、可拖曳、可調整大小
- `auto-refresh`: 每 10 秒自動 fetch 並更新資料，顯示最後更新時間

### Modified Capabilities

（無現有規格，全為新建）

## Impact

- **新增依賴**：electron、electron-vite、@electron-toolkit/preload、@electron-toolkit/utils、react 18、tailwindcss v4、@tailwindcss/vite、electron-builder
- **新增所有原始碼**：`electron/`、`src/` 目錄下所有檔案
- **打包輸出**：`dist-electron/` 目錄，Windows NSIS 安裝檔
- **無破壞性變更**（全新專案，無現有 API 或程式碼）
