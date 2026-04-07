import https from 'https'
import type { StockSymbol, StockInfo, RawTWSEItem, TWSEApiResponse } from '../../src/types/stock'

const TWSE_API_BASE = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp'
const FETCH_TIMEOUT_MS = 5000

/** 建構 TWSE API 查詢 URL */
export function buildTWSEUrl(symbols: StockSymbol[]): string {
  const exCh = symbols.map((s) => `${s.market}_${s.code}.tw`).join('|')
  return `${TWSE_API_BASE}?ex_ch=${encodeURIComponent(exCh)}&json=1&delay=0`
}

/** 以 Node.js https 模組發送 GET 請求（繞過 CORS，可設定自訂 headers） */
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Referer: 'https://mis.twse.com.tw/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9'
      }
    }

    const req = https.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(data))
      res.on('error', reject)
    })

    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy()
      reject(new Error(`TWSE API 請求逾時（${FETCH_TIMEOUT_MS}ms）`))
    })

    req.on('error', reject)
  })
}

/** 解析 TWSE API 回應的 msgArray，轉為 StockInfo[] */
export function parseMsgArray(rawItems: RawTWSEItem[]): StockInfo[] {
  const result: StockInfo[] = []

  for (const item of rawItems) {
    try {
      const code = item.c?.trim()
      const name = item.n?.trim()
      if (!code || !name) continue

      const market = (item.ex === 'otc' ? 'otc' : 'tse') as StockSymbol['market']
      const yesterdayClose = parseFloat(item.y)
      const isAfterHours = !item.z || item.z === '-' || item.z === '--'

      let price: number
      let change: number
      let changePercent: number

      if (isAfterHours) {
        // 盤後或未開盤：顯示昨收，漲跌為 0
        price = isNaN(yesterdayClose) ? 0 : yesterdayClose
        change = 0
        changePercent = 0
      } else {
        price = parseFloat(item.z)
        // 直接從即時價格和昨收計算，避免依賴 ch 欄位格式
        change = !isNaN(price) && !isNaN(yesterdayClose) ? price - yesterdayClose : 0
        changePercent =
          !isNaN(yesterdayClose) && yesterdayClose !== 0
            ? (change / yesterdayClose) * 100
            : 0
      }

      const volume = parseInt(item.v, 10) || 0
      const high = parseFloat(item.h)
      const low = parseFloat(item.l)

      result.push({
        code,
        name,
        price: isNaN(price) ? 0 : price,
        yesterdayClose: isNaN(yesterdayClose) ? 0 : yesterdayClose,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
        high: isNaN(high) ? 0 : high,
        low: isNaN(low) ? 0 : low,
        volume,
        isAfterHours,
        market
      })
    } catch {
      // 跳過解析失敗的個別股票，不影響其他結果
      continue
    }
  }

  return result
}

/** 主要：從 TWSE API 取得並解析股票資料 */
export async function fetchStocksFromTWSE(symbols: StockSymbol[]): Promise<StockInfo[]> {
  if (symbols.length === 0) return []

  const url = buildTWSEUrl(symbols)

  const raw = await httpsGet(url)
  const json: TWSEApiResponse = JSON.parse(raw)

  if (!json.msgArray || !Array.isArray(json.msgArray)) {
    return []
  }

  return parseMsgArray(json.msgArray)
}

/** 自動偵測股票市場別：先嘗試 tse，若無資料則 fallback 嘗試 otc */
export async function autoDetectMarket(code: string): Promise<'tse' | 'otc' | null> {
  // 先試 tse
  try {
    const tseResult = await fetchStocksFromTWSE([{ code, market: 'tse' }])
    if (tseResult.length > 0) return 'tse'
  } catch {
    // 繼續嘗試 otc
  }

  // fallback 試 otc
  try {
    const otcResult = await fetchStocksFromTWSE([{ code, market: 'otc' }])
    if (otcResult.length > 0) return 'otc'
  } catch {
    // 都失敗
  }

  return null
}
