import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { fetchStocksFromYahoo, autoDetectMarket } from './yahooFinanceService'
import type { StockSymbol } from '../../src/types/stock'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 520,
    minWidth: 200,
    minHeight: 100,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    // Windows 上透明視窗必須關閉 skipTaskbar 才能從工作列還原
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 在預設瀏覽器開啟外部連結，而非在 Electron 視窗內
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 開發模式：連接 Vite dev server；正式模式：載入打包後的 HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

/** 取得股票行情 */
ipcMain.handle('fetch-stocks', async (_event, symbols: StockSymbol[]) => {
  return fetchStocksFromYahoo(symbols)
})

/** 自動偵測市場別 */
ipcMain.handle('detect-market', async (_event, code: string) => {
  return autoDetectMarket(code)
})

/** 最小化視窗 */
ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize()
})

/** 關閉應用程式 */
ipcMain.handle('close-window', () => {
  app.quit()
})

/** 調整視窗大小（同時更新最小尺寸限制） */
ipcMain.handle('set-window-size', (_event, width: number, height: number) => {
  const w = Math.round(width)
  const h = Math.round(height)
  // 先更新最小尺寸，否則 Electron 會把 setSize 的值 clamp 到 minWidth
  mainWindow?.setMinimumSize(Math.min(w, 280), 50)
  mainWindow?.setSize(w, h)
})

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // 設定 app user model id（Windows 工作列識別）
  electronApp.setAppUserModelId('com.pyjoker.taiwan-stock-widget')

  // 開發模式下按 F12 開啟 DevTools；正式模式忽略
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    // macOS：點 Dock icon 時若無視窗則重新建立
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 所有視窗關閉時退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
