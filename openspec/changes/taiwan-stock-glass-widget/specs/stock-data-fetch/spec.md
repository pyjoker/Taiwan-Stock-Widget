## ADDED Requirements

### Requirement: 透過 IPC 在 main process 呼叫 TWSE API
系統 SHALL 在 Electron main process 執行 TWSE API HTTP 請求，並透過 IPC channel `fetch-stocks` 將結果回傳至 renderer process，以繞過 CORS 限制，同時保持 contextIsolation 啟用。

#### Scenario: 成功取得股票資料
- **WHEN** renderer 呼叫 `window.api.fetchStocks(symbols)`
- **THEN** main process 向 TWSE API 發送帶有正確 Referer header 的請求，解析 msgArray，回傳 `StockInfo[]`

#### Scenario: API 請求逾時或失敗
- **WHEN** TWSE API 在 5 秒內未回應或回傳錯誤
- **THEN** IPC 呼叫回傳空陣列，renderer 保留上一次有效資料並顯示錯誤指示器，不得 crash

#### Scenario: 部分股票無資料
- **WHEN** msgArray 中某支股票的資料缺失或欄位無效
- **THEN** 該股票被跳過，其餘正常股票仍正確顯示

### Requirement: 正確建構 TWSE API 請求
系統 SHALL 依據以下規格建構 TWSE API URL 與 HTTP headers：
- URL：`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=<symbols>&json=1&delay=0`
- symbols 格式：`tse_XXXX.tw|otc_XXXX.tw`（用 `|` 分隔，上市用 `tse_`，上櫃用 `otc_`）
- 必要 Headers：`Referer: https://mis.twse.com.tw/`、`User-Agent: <合理的瀏覽器 UA>`

#### Scenario: 建構多股查詢 URL
- **WHEN** 輸入 symbols 為 `[{code:'2330',market:'tse'},{code:'6488',market:'otc'}]`
- **THEN** 建構 URL 為 `...?ex_ch=tse_2330.tw|otc_6488.tw&json=1&delay=0`

### Requirement: 解析 TWSE API 回應
系統 SHALL 正確解析 API 回應的 `msgArray` 欄位，對應欄位如下：
- `c` → 股票代碼
- `n` → 股票名稱
- `z` → 成交價（可能為 "-"）
- `y` → 昨收價
- `v` → 成交量
- `ex` → 市場別（`tse` / `otc`）

#### Scenario: 解析有效 msgArray
- **WHEN** API 回應包含有效 msgArray
- **THEN** 每筆資料轉換為 `StockInfo` 物件，漲跌幅以 `(parseFloat(z) - parseFloat(y)) / parseFloat(y) * 100` 計算

#### Scenario: 空 msgArray 或格式錯誤
- **WHEN** API 回應不含 msgArray 或格式非預期
- **THEN** 回傳空陣列，不拋出例外

### Requirement: 支援上市/上櫃自動偵測
系統 SHALL 在使用者僅輸入股票代碼（未指定市場別）時，先嘗試 `tse_`，若回傳資料為空則 fallback 嘗試 `otc_`。

#### Scenario: 上市股票自動偵測
- **WHEN** 輸入代碼 "2330"，未指定市場別
- **THEN** 先以 tse_2330.tw 查詢，回傳有效資料，市場別記錄為 tse

#### Scenario: 上櫃股票 fallback
- **WHEN** 輸入代碼 "6488"，tse_ 查詢回傳空陣列
- **THEN** 自動以 otc_6488.tw 再次查詢，回傳有效資料，市場別記錄為 otc
