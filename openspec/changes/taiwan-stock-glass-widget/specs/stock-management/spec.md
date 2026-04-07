## ADDED Requirements

### Requirement: 預設股票清單
系統 SHALL 在初次啟動（localStorage 無資料）時，預設顯示以下 5 支股票：台積電（2330，tse）、元大台灣50（0050，tse）、鴻海（2317，tse）、聯發科（2454，tse）、國泰金（2882，tse）。

#### Scenario: 首次啟動無 localStorage 資料
- **WHEN** 使用者首次開啟應用程式，localStorage 中無股票清單
- **THEN** 自動載入 5 支預設股票並立即 fetch 行情

#### Scenario: 非首次啟動有 localStorage 資料
- **WHEN** localStorage 中已有使用者自訂股票清單
- **THEN** 載入使用者清單，忽略預設清單

### Requirement: 新增股票
系統 SHALL 提供「+」按鈕，點擊後開啟輸入框，讓使用者輸入一個或多個股票代碼（以逗號分隔），新增至清單。

#### Scenario: 新增單一股票
- **WHEN** 使用者在輸入框輸入 "2412" 並確認
- **THEN** 系統查詢 2412 的市場別，新增至清單末尾，立即更新 localStorage，並 fetch 該股票資料

#### Scenario: 以逗號分隔新增多股
- **WHEN** 使用者在輸入框輸入 "2412, 6488, 3008" 並確認
- **THEN** 系統依序新增 3 支股票（去除空白），重複的代碼不重複新增

#### Scenario: 新增已存在的股票
- **WHEN** 使用者輸入清單中已存在的股票代碼
- **THEN** 系統忽略該重複代碼，不顯示錯誤

#### Scenario: 輸入無效股票代碼
- **WHEN** 使用者輸入不存在的代碼，API 回傳空資料
- **THEN** 系統不新增該股票，顯示「找不到股票代碼」的提示

### Requirement: 刪除股票
系統 SHALL 在每支股票列的右側顯示刪除按鈕（×），點擊後從清單移除該股票，並立即更新 localStorage。

#### Scenario: 刪除單支股票
- **WHEN** 使用者點擊某支股票的刪除按鈕
- **THEN** 該股票立即從列表移除，localStorage 同步更新

#### Scenario: 刪除最後一支股票
- **WHEN** 清單只剩一支股票且使用者點擊刪除
- **THEN** 清單變為空，顯示空白提示（如「點擊 + 新增股票」），localStorage 儲存空陣列

### Requirement: localStorage 持久化
系統 SHALL 使用 localStorage 儲存股票清單（`key: 'tsw-stocks'`），格式為 JSON 序列化的 `StockSymbol[]`，每次清單變更時立即同步寫入。

#### Scenario: 清單變更後持久化
- **WHEN** 使用者新增或刪除股票
- **THEN** localStorage 立即更新，重新開啟應用後清單保持一致

#### Scenario: localStorage 資料損毀
- **WHEN** localStorage 中的資料無法 JSON.parse
- **THEN** 系統回退至預設股票清單，不 crash

### Requirement: 開機自動啟動 UI（Placeholder）
系統 SHALL 在設定區域顯示「開機自動啟動」開關，UI 可互動（顯示開/關狀態），但實際功能標記為 TODO，點擊開關僅更新 UI 狀態。

#### Scenario: 點擊自動啟動開關
- **WHEN** 使用者切換「開機自動啟動」開關
- **THEN** UI 狀態改變（開/關），但不實際呼叫 `app.setLoginItemSettings()`（TODO 標記）
