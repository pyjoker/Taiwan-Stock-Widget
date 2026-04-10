# 股票小工具

桌面懸浮毛玻璃股票小工具，支援台股（上市／上櫃）與美股即時報價。

## 功能

- **即時報價**：透過 Yahoo Finance 每 10 秒自動更新，顯示股價、漲跌幅、最高／最低價、成交量（張）
- **多群組管理**：最多 7 個獨立群組，各自儲存不同的股票清單，一鍵切換
- **自動偵測市場**：新增股票代碼時自動判斷上市（TSE）、上櫃（TPEx）或美股
- **K 線迷你圖（Sparkline）**：每支股票保留最近 30 個價格點的走勢圖
- **極簡模式**：只顯示代碼與股價的極小懸浮視窗，視窗大小自動調整
- **灰色模式**：將所有漲跌顏色改為灰色，適合低調場合
- **拖曳排序**：直接拖拉調整股票顯示順序
- **置頂切換**：可關閉「永遠置頂」讓其他視窗覆蓋其上
- **透明毛玻璃外觀**：無邊框透明視窗，不影響桌面美觀

## 安裝需求

- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/) 3.8+，並安裝以下套件：

```bash
pip install yahooquery requests
```

> 建議建立虛擬環境，放在專案根目錄的 `venv/` 資料夾，程式啟動時會優先使用。

```bash
python -m venv venv
venv\Scripts\activate   # Windows
pip install yahooquery requests
```

## 開發

```bash
npm install
npm run dev
```

## 打包

```bash
# Windows 安裝檔（NSIS）
npm run build:win

# macOS（需在 macOS 環境執行）
npm run build:mac
```

## 技術架構

| 層次 | 技術 |
|------|------|
| 桌面框架 | Electron 33 |
| 前端 | React 18 + TypeScript |
| 樣式 | Tailwind CSS v4 |
| 建構工具 | electron-vite + Vite 6 |
| 資料來源 | Yahoo Finance（透過 `yahooquery` Python 套件） |

股票資料由主程序（Main Process）透過 IPC 呼叫 Python 腳本取得，繞過瀏覽器 CORS 限制。中文股票名稱另從 TWSE／TPEx Open Data API 查詢補充。

## 顏色慣例

台灣股市漲跌顏色與 TradingView 台股慣例相同：

| 狀態 | 顏色 |
|------|------|
| 上漲 | 紅色 |
| 下跌 | 綠色 |
| 平盤／盤後 | 灰色 |

## 授權

Apache-2.0
