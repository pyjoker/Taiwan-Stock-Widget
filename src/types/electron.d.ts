import type { StockSymbol, StockInfo } from './stock'

/** contextBridge 暴露的 API 介面 */
export interface ElectronAPI {
  /** 透過 IPC 呼叫 TWSE API 取得股票資料 */
  fetchStocks: (symbols: StockSymbol[]) => Promise<StockInfo[]>
  /** 最小化視窗 */
  minimizeWindow: () => Promise<void>
  /** 關閉應用程式 */
  closeWindow: () => Promise<void>
  /** 自動偵測股票市場別（tse / otc / us） */
  detectMarket: (code: string) => Promise<'tse' | 'otc' | 'us' | null>
  /** 調整視窗大小 */
  setWindowSize: (width: number, height: number) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
