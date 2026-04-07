## ADDED Requirements

### Requirement: 每 10 秒自動更新股票資料
系統 SHALL 在應用程式啟動後，每 10 秒自動呼叫一次 IPC `fetch-stocks`，更新所有已顯示股票的行情資料，不需要使用者手動觸發。

#### Scenario: 自動更新觸發
- **WHEN** 距離上次 fetch 已達 10 秒
- **THEN** 系統自動呼叫 `window.api.fetchStocks()`，成功後更新 UI 中所有股票資料

#### Scenario: 更新期間的 Loading 狀態
- **WHEN** fetch 請求進行中
- **THEN** 顯示輕微 loading 指示（如標題列小圓點動畫或底部狀態列），不隱藏現有股票資料

#### Scenario: 應用程式關閉時清除定時器
- **WHEN** 應用程式關閉或 React 元件 unmount
- **THEN** setInterval 定時器被清除，不產生記憶體洩漏

### Requirement: 顯示最後更新時間
系統 SHALL 在視窗底部顯示最後成功更新的時間，格式為 `HH:mm:ss`（24 小時制）。

#### Scenario: 首次成功 fetch
- **WHEN** 應用程式啟動後第一次 fetch 成功
- **THEN** 底部顯示「最後更新：HH:mm:ss」

#### Scenario: 每次自動更新後
- **WHEN** 10 秒自動更新成功完成
- **THEN** 底部時間戳記更新為最新的成功時間

#### Scenario: Fetch 失敗時
- **WHEN** 某次自動 fetch 失敗（網路錯誤、API 錯誤）
- **THEN** 保留上次成功更新的時間戳記，額外顯示「更新失敗」或錯誤圖示

### Requirement: 首次啟動立即 Fetch
系統 SHALL 在應用程式首次渲染後，立即執行一次 fetch（不等待 10 秒），讓使用者一開啟就能看到最新資料。

#### Scenario: 應用程式啟動
- **WHEN** 應用程式首次渲染完成
- **THEN** 立即執行第一次 fetch，10 秒後再次自動執行（不得有 0-10 秒的資料空白期）
