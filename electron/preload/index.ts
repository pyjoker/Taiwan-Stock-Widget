import { contextBridge, ipcRenderer } from 'electron'
import type { StockSymbol, StockInfo } from '../../src/types/stock'

// 透過 contextBridge 將有限的 API 暴露給 renderer process
// renderer 只能呼叫這裡明確列出的方法，無法直接存取 Node.js API
contextBridge.exposeInMainWorld('api', {
  /** 向 main process 請求 TWSE 股票資料 */
  fetchStocks: (symbols: StockSymbol[]): Promise<{ stocks: StockInfo[]; error: string | null }> =>
    ipcRenderer.invoke('fetch-stocks', symbols),

  /** 自動偵測股票市場別（tse / otc / us） */
  detectMarket: (code: string): Promise<'tse' | 'otc' | 'us' | null> =>
    ipcRenderer.invoke('detect-market', code),

  /** 最小化視窗 */
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),

  /** 關閉應用程式 */
  closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),

  /** 調整視窗大小 */
  setWindowSize: (width: number, height: number): Promise<void> =>
    ipcRenderer.invoke('set-window-size', width, height),

  /** 切換視窗是否浮在所有視窗之上 */
  setAlwaysOnTop: (flag: boolean): Promise<void> =>
    ipcRenderer.invoke('set-always-on-top', flag)
})
