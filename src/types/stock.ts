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

/** TWSE API 回應原始結構（msgArray 中的每筆） */
export interface RawTWSEItem {
  /** 股票代碼 */
  c: string
  /** 股票名稱 */
  n: string
  /** 成交價（盤後為 "-"） */
  z: string
  /** 昨收價 */
  y: string
  /** 漲跌額（帶正負號） */
  ch: string
  /** 成交量（張） */
  v: string
  /** 市場別 "tse" | "otc" */
  ex: string
  /** 開盤價 */
  o: string
  /** 最高價 */
  h: string
  /** 最低價 */
  l: string
}

/** TWSE API 完整回應 */
export interface TWSEApiResponse {
  msgArray: RawTWSEItem[]
  referer: string
  userDelay: number
  rtcode: string
  queryTime: {
    sysDate: string
    stockInfoItem: number
    stockInfo: number
    sessionStr: string
    sysTime: string
    showChart: boolean
    sessionFromTime: number
    sessionLatestTime: number
  }
  rtmessage: string
  exKey: string
  cachedAlive: number
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
