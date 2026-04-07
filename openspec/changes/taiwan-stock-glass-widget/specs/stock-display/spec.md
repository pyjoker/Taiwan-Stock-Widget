## ADDED Requirements

### Requirement: 顯示股票行情列表
系統 SHALL 以列表方式顯示所有已新增股票的即時行情，每支股票顯示：股票代碼、股票名稱、即時股價、漲跌幅（%）、漲跌金額、成交量。

#### Scenario: 正常交易時間顯示
- **WHEN** 取得 TWSE API 回應且 z 欄位有效數值
- **THEN** 顯示即時成交價、計算漲跌幅 `(z - y) / y * 100`、顯示漲跌金額 `z - y`

#### Scenario: 盤後或未開盤時間
- **WHEN** z 欄位值為 "-"（無成交價）
- **THEN** 股價欄位顯示昨收價（y 欄位）並標示「昨收」，漲跌欄位顯示 "--"，不得 crash

### Requirement: 漲跌顏色標示
系統 SHALL 使用台灣股市慣例配色：股價上漲顯示紅色（`text-red-400`），股價下跌顯示綠色（`text-green-400`），平盤顯示灰色（`text-gray-400`）。

#### Scenario: 股價上漲
- **WHEN** 漲跌金額大於 0
- **THEN** 股價、漲跌幅、漲跌金額均以紅色顯示，漲跌幅前綴 "+"

#### Scenario: 股價下跌
- **WHEN** 漲跌金額小於 0
- **THEN** 股價、漲跌幅、漲跌金額均以綠色顯示

#### Scenario: 平盤
- **WHEN** 漲跌金額等於 0
- **THEN** 以灰色顯示，漲跌幅顯示 "0.00%"

### Requirement: Hover 互動效果
系統 SHALL 在滑鼠懸停於單支股票列時，顯示輕微放大（scale）與亮度提升效果。

#### Scenario: 滑鼠移入股票列
- **WHEN** 使用者將滑鼠移入任一股票列
- **THEN** 該列以 CSS transition 放大至 `scale(1.02)` 並提升背景亮度

#### Scenario: 滑鼠移出股票列
- **WHEN** 使用者將滑鼠移出股票列
- **THEN** 該列恢復原始大小，transition 平滑
