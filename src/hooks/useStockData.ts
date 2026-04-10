import { useState, useEffect, useCallback, useRef } from 'react'
import type { StockSymbol, StockInfo } from '../types/stock'
import { DEFAULT_SYMBOLS, STORAGE_KEY, getGroupStorageKey } from '../types/stock'

const REFRESH_INTERVAL_MS = 10_000 // 10 秒

/** 從 localStorage 讀取已儲存的股票清單；群組 1 解析失敗時回傳預設值，其他群組回傳空陣列 */
function loadSymbols(key: string): StockSymbol[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return key === STORAGE_KEY ? DEFAULT_SYMBOLS : []
    const parsed = JSON.parse(raw) as StockSymbol[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return key === STORAGE_KEY ? DEFAULT_SYMBOLS : []
  } catch {
    return key === STORAGE_KEY ? DEFAULT_SYMBOLS : []
  }
}

export interface UseStockDataReturn {
  stocks: StockInfo[]
  symbols: StockSymbol[]
  priceHistory: Map<string, number[]>
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  lastUpdated: Date | null
  /** 新增股票；回傳找不到的代碼清單 */
  addStock: (codes: string) => Promise<string[]>
  removeStock: (code: string) => void
  /** 拖曳排序：將 fromIndex 的股票移到 toIndex */
  reorderStocks: (fromIndex: number, toIndex: number) => void
  refresh: () => Promise<void>
}

const MAX_HISTORY = 30 // 最多保留 30 個價格點

export function useStockData(groupId: number): UseStockDataReturn {
  // 用 ref 追蹤當前 storageKey，讓 addStock / removeStock callback 永遠拿到最新值
  const storageKeyRef = useRef(getGroupStorageKey(groupId))
  storageKeyRef.current = getGroupStorageKey(groupId)

  const [symbols, setSymbols] = useState<StockSymbol[]>(() => loadSymbols(getGroupStorageKey(groupId)))
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
    setErrorMessage(null)

    try {
      const { stocks: result, error } = await window.api.fetchStocks(syms)

      if (error) {
        console.error('[useStockData] fetch error from main:', error)
        setIsError(true)
        setErrorMessage(error)
        // 保留上次資料（result 可能是 stale cache），不清空
        if (result.length > 0) {
          const ordered = syms
            .map((sym) => result.find((r) => r.code === sym.code))
            .filter((r): r is StockInfo => r !== undefined)
          setStocks(ordered)
        }
        return
      }

      // 依 syms 順序排列結果，確保拖曳排序不被 API 回傳順序覆蓋
      const ordered = syms
        .map((sym) => result.find((r) => r.code === sym.code))
        .filter((r): r is StockInfo => r !== undefined)
      setStocks(ordered)
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
      const message = err instanceof Error ? err.message : String(err)
      console.error('[useStockData] IPC error:', message)
      setIsError(true)
      setErrorMessage(message)
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

  // 切換群組時重新載入該群組的股票清單並立即 fetch
  useEffect(() => {
    const key = getGroupStorageKey(groupId)
    const newSymbols = loadSymbols(key)
    setSymbols(newSymbols)
    symbolsRef.current = newSymbols
    priceHistoryRef.current = new Map()
    setPriceHistory(new Map())
    setStocks([])
    setLastUpdated(null)
    setIsError(false)
    setErrorMessage(null)
    fetchData(newSymbols)
  }, [groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 每 10 秒自動 refresh
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(symbolsRef.current)
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(timer) // unmount 時清除，避免記憶體洩漏
  }, [fetchData])

  /** 新增股票：支援逗號分隔多股，自動偵測市場別；回傳找不到的代碼清單 */
  const addStock = useCallback(
    async (codes: string): Promise<string[]> => {
      const codeList = codes
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)

      if (codeList.length === 0) return []

      const currentCodes = new Set(symbolsRef.current.map((s) => s.code))
      const newSymbols: StockSymbol[] = []
      const notFound: string[] = []

      for (const code of codeList) {
        if (currentCodes.has(code)) continue // 跳過重複

        // 自動偵測市場別（tse / otc / us）
        const market = await window.api.detectMarket(code)
        if (market === null) {
          console.warn(`[useStockData] 找不到股票代碼: ${code}`)
          notFound.push(code)
          continue
        }

        newSymbols.push({ code, market })
        currentCodes.add(code)
      }

      if (newSymbols.length > 0) {
        const updated = [...symbolsRef.current, ...newSymbols]
        setSymbols(updated)
        localStorage.setItem(storageKeyRef.current, JSON.stringify(updated))
        await fetchData(updated)
      }

      return notFound
    },
    [fetchData]
  )

  /** 刪除股票 */
  const removeStock = useCallback((code: string) => {
    const updated = symbolsRef.current.filter((s) => s.code !== code)
    setSymbols(updated)
    localStorage.setItem(storageKeyRef.current, JSON.stringify(updated))
    setStocks((prev) => prev.filter((s) => s.code !== code))
  }, [])

  /** 拖曳排序：將 fromIndex 移到 toIndex */
  const reorderStocks = useCallback((fromIndex: number, toIndex: number) => {
    const arr = [...symbolsRef.current]
    const [item] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, item)
    setSymbols(arr)
    localStorage.setItem(storageKeyRef.current, JSON.stringify(arr))
    setStocks((prev) => {
      const next = [...prev]
      const [stock] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, stock)
      return next
    })
  }, [])

  return {
    stocks,
    symbols,
    priceHistory,
    isLoading,
    isError,
    errorMessage,
    lastUpdated,
    addStock,
    removeStock,
    reorderStocks,
    refresh
  }
}
