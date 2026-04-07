## ADDED Requirements

### Requirement: 透明毛玻璃視窗
系統 SHALL 使用 Electron BrowserWindow 的 `transparent: true`、`frame: false`、`backgroundColor: '#00000000'` 建立完全透明視窗，在 CSS 層以 `backdrop-filter: blur(20px)` 和半透明深色背景實現毛玻璃效果，讓桌面壁紙透出。

#### Scenario: 視窗啟動呈現毛玻璃效果
- **WHEN** 應用程式啟動
- **THEN** 視窗背景為透明，內容區域顯示模糊的桌面背景透視效果，配合半透明深色遮罩

#### Scenario: 視窗在深色桌面上的可讀性
- **WHEN** 視窗顯示於任何桌面背景
- **THEN** 文字內容清晰可讀，對比度符合 WCAG AA 標準

### Requirement: 視窗基本設定
系統 SHALL 以以下參數啟動 BrowserWindow：預設寬 380px、高 520px；`alwaysOnTop: true`；`resizable: true`；`minWidth: 320`；`minHeight: 400`。

#### Scenario: 視窗預設大小
- **WHEN** 首次啟動應用程式
- **THEN** 視窗大小為 380×520 像素

#### Scenario: 視窗永遠置頂
- **WHEN** 使用者切換至其他應用程式視窗
- **THEN** 股票小工具仍顯示於所有視窗之上

### Requirement: 自訂標題列與視窗控制
系統 SHALL 在視窗頂部提供自訂標題列，包含：應用程式名稱（可作為拖曳區）、最小化按鈕（IPC 呼叫 `win.minimize()`）、關閉按鈕（IPC 呼叫 `app.quit()`）。標題列整體為 `-webkit-app-region: drag`，按鈕為 `-webkit-app-region: no-drag`。

#### Scenario: 拖曳移動視窗
- **WHEN** 使用者按住標題列拖曳
- **THEN** 視窗跟隨滑鼠移動到新位置

#### Scenario: 點擊最小化按鈕
- **WHEN** 使用者點擊最小化按鈕
- **THEN** 視窗最小化至工作列，不關閉應用程式

#### Scenario: 點擊關閉按鈕
- **WHEN** 使用者點擊關閉按鈕
- **THEN** 應用程式完全退出（app.quit()）

### Requirement: 視窗可調整大小
系統 SHALL 允許使用者透過拖曳視窗邊緣調整大小，最小寬度 320px、最小高度 400px。調整大小時股票列表應響應式調整，不出現水平捲軸。

#### Scenario: 縮小視窗
- **WHEN** 使用者將視窗縮小至接近最小尺寸
- **THEN** 股票列表項目自動調整，文字截斷但不溢出，視窗不小於 320×400

#### Scenario: 放大視窗
- **WHEN** 使用者放大視窗
- **THEN** 股票列表利用額外空間顯示更多股票，不出現空白區塊異常

### Requirement: 安全的 WebPreferences 設定
系統 SHALL 使用以下 webPreferences：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: false`（electron-vite preload 需要）。Preload script 透過 contextBridge 限制暴露的 API 範圍。

#### Scenario: Renderer 無法直接存取 Node.js API
- **WHEN** renderer process 嘗試存取 `require` 或 `process`
- **THEN** 存取被拒絕，只能透過 `window.api` 暴露的有限 API 互動
