import { useState, useEffect, useCallback, useRef } from 'react'
import type { StockSymbol, StockInfo } from '../types/stock'
import { DEFAULT_SYMBOLS, STORAGE_KEY } from '../types/stock'

const REFRESH_INTERVAL_MS = 10_000 // 10 秒

/** 從 localStorage 讀取已儲存的股票清單，解析失敗時回傳預設值 */
function loadSymbols(): StockSymbol[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SYMBOLS
    const parsed = JSON.parse(raw) as StockSymbol[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return DEFAULT_SYMBOLS
  } catch {
    return DEFAULT_SYMBOLS
  }
}

/** 儲存股票清單至 localStorage */
function saveSymbols(symbols: StockSymbol[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols))
}

export interface UseStockDataReturn {
  stocks: StockInfo[]
  symbols: StockSymbol[]
  priceHistory: Map<string, number[]>
  isLoading: boolean
  isError: boolean
  lastUpdated: Date | null
  addStock: (codes: string) => Promise<void>
  removeStock: (code: string) => void
  refresh: () => Promise<void>
}

const MAX_HISTORY = 30 // 最多保留 30 個價格點

export function useStockData(): UseStockDataReturn {
  const [symbols, setSymbols] = useState<StockSymbol[]>(loadSymbols)
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 用 ref 追蹤最新 symbols，避免 setInterval 閉包問題
  const symbolsRef = useRef<StockSymbol[]>(symbols)
  symbolsRef.current = symbols

  // 累積價格歷史（不需觸發 re-render，用 ref 存）
  const priceHistoryRef = useRef<Map<string, number[]>>(new Map())
  // 用 state 讓元件能拿到最新的 Map 參考（shallow copy 觸發 re-render）
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map())

  const fetchData = useCallback(async (syms: StockSymbol[]) => {
    if (syms.length === 0) {
      setStocks([])
      return
    }

    setIsLoading(true)
    setIsError(false)

    try {
      const result = await window.api.fetchStocks(syms)
      setStocks(result)
      setLastUpdated(new Date())

      // 累積價格歷史
      const map = priceHistoryRef.current
      for (const stock of result) {
        if (stock.isAfterHours || stock.price === 0) continue
        const history = map.get(stock.code) ?? []
        history.push(stock.price)
        if (history.length > MAX_HISTORY) history.shift()
        map.set(stock.code, history)
      }
      setPriceHistory(new Map(map))
    } catch (err) {
      console.error('[useStockData] fetch error:', err)
      setIsError(true)
      // 保留上次資料，不清空
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchData(symbolsRef.current)
  }, [fetchData])

  // 初次渲染立即 fetch
  useEffect(() => {
    fetchData(symbols)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 每 10 秒自動 refresh
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(symbolsRef.current)
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(timer) // unmount 時清除，避免記憶體洩漏
  }, [fetchData])

  /** 新增股票：支援逗號分隔多股，自動偵測市場別 */
  const addStock = useCallback(
    async (codes: string) => {
      const codeList = codes
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)

      if (codeList.length === 0) return

      const currentCodes = new Set(symbolsRef.current.map((s) => s.code))
      const newSymbols: StockSymbol[] = []

      for (const code of codeList) {
        if (currentCodes.has(code)) continue // 跳過重複

        // 自動偵測市場別
        const market = await window.api.detectMarket(code)
        if (market === null) {
          console.warn(`[useStockData] 找不到股票代碼: ${code}`)
          continue
        }

        newSymbols.push({ code, market })
        currentCodes.add(code)
      }

      if (newSymbols.length === 0) return

      const updated = [...symbolsRef.current, ...newSymbols]
      setSymbols(updated)
      saveSymbols(updated)
      await fetchData(updated)
    },
    [fetchData]
  )

  /** 刪除股票 */
  const removeStock = useCallback((code: string) => {
    const updated = symbolsRef.current.filter((s) => s.code !== code)
    setSymbols(updated)
    saveSymbols(updated)
    setStocks((prev) => prev.filter((s) => s.code !== code))
  }, [])

  return {
    stocks,
    symbols,
    priceHistory,
    isLoading,
    isError,
    lastUpdated,
    addStock,
    removeStock,
    refresh
  }
}
