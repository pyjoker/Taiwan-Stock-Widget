/** 股票市場別 */
export type StockMarket = 'tse' | 'otc'

/** 股票識別符（清單儲存用） */
export interface StockSymbol {
  code: string
  market: StockMarket
}

/** 解析後的股票行情資料 */
export interface StockInfo {
  code: string
  name: string
  /** 即時成交價（盤後則為昨收） */
  price: number
  /** 上個交易日收盤價 */
  yesterdayClose: number
  /** 漲跌金額 = price - yesterdayClose（正負）*/
  change: number
  /** 漲跌幅 % = change / yesterdayClose * 100 */
  changePercent: number
  /** 當日最高價 */
  high: number
  /** 當日最低價 */
  low: number
  /** 成交量（張） */
  volume: number
  /** 是否為盤後/非交易時間（z="-" 情況） */
  isAfterHours: boolean
  market: StockMarket
}

/** localStorage 儲存的 key */
export const STORAGE_KEY = 'tsw-stocks'

/** 預設顯示的股票清單 */
export const DEFAULT_SYMBOLS: StockSymbol[] = [
  { code: '2330', market: 'tse' }, // 台積電
  { code: '0050', market: 'tse' }, // 元大台灣50
  { code: '2317', market: 'tse' }, // 鴻海
  { code: '2454', market: 'tse' }, // 聯發科
  { code: '2882', market: 'tse' } // 國泰金
]
