# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Electron app in development mode
npm run build        # Build all three targets (main / preload / renderer)
npm run build:win    # Full Windows NSIS installer (runs build first)
npm run typecheck    # TypeScript type-check without emitting
npm run lint         # ESLint across all .ts/.tsx files
npm run format       # Prettier format
```

Always run `npm run build` after changes to verify there are no TypeScript errors — there are no unit tests; the build is the primary correctness gate.

## Architecture

This is an **Electron + React** desktop widget with three distinct build targets managed by `electron-vite`:

| Target | Entry | Output |
|--------|-------|--------|
| Main process | `electron/main/index.ts` | `out/main/index.js` |
| Preload | `electron/preload/index.ts` | `out/preload/index.js` |
| Renderer | `src/main.tsx` (root: `src/`) | `out/renderer/` |

### Key architectural constraint: CORS bypass via IPC

Stock data cannot be fetched from the renderer due to CORS. **All API calls must go through the main process** via IPC:

```
Renderer → window.api.fetchStocks(symbols)
         → contextBridge → ipcRenderer.invoke('fetch-stocks')
         → ipcMain.handle('fetch-stocks') → yahooFinanceService.ts
         → spawns stock_bridge.py (Python) → yahooquery → returns StockInfo[]
```

- `electron/main/yahooFinanceService.ts` — spawns `stock_bridge.py`; caches results for 15 s keyed by the exact symbol set so switching groups always triggers a fresh fetch
- `stock_bridge.py` — Python script using `yahooquery`; also fetches Chinese names from TWSE/TPEx open data APIs; must be in project root (dev) or `resources/` (prod)
- `electron/preload/index.ts` — exposes `window.api.{ fetchStocks, detectMarket, minimizeWindow, closeWindow, setWindowSize, setAlwaysOnTop }`
- `src/types/electron.d.ts` — TypeScript types for `window.api`

### Python bridge resolution

`yahooFinanceService.ts` tries Python executables in order: `venv/Scripts/python.exe` → `py` → `python` → `python3`. If a candidate exits non-zero with a "No Python at …" / "not installed" message (Windows `py` launcher pointing at another user's install), it falls through to the next candidate rather than failing immediately.

### Multi-group stock lists

Up to 7 independent groups, each persisted in `localStorage`:
- Group 1 uses key `tsw-stocks` (backward-compatible)
- Groups 2–7 use keys `tsw-stocks-g2` … `tsw-stocks-g7`
- Helper `getGroupStorageKey(groupId)` in `src/types/stock.ts`
- `useStockData(groupId)` reloads symbols and immediately fetches when `groupId` changes

### Transparent frameless window

`BrowserWindow` is configured with `transparent: true`, `frame: false`, `backgroundColor: '#00000000'`, `alwaysOnTop: true`. CSS sets `html, body, #root { background: transparent }`. Dragging is handled via `-webkit-app-region: drag` (`.drag-region`); interactive elements inside drag zones must have `.no-drag`.

### Tailwind CSS v4

Uses CSS-first config — **no `tailwind.config.js`**. Import is `@import "tailwindcss"` in `src/index.css`. Plugin is `@tailwindcss/vite` in the renderer's Vite plugins in `electron.vite.config.ts`. Custom utilities (`.glass`, `.drag-region`, `.no-drag`) are defined in `@layer utilities` in `src/index.css`.

### Stock color convention

Up (漲) → `text-red-400`, Down (跌) → `text-green-400`, Flat/after-hours → `text-gray-400`.

### Data flow in the renderer

`useStockData(groupId)` hook (`src/hooks/useStockData.ts`):
- Loads symbol list from the group's `localStorage` key; group 1 falls back to `DEFAULT_SYMBOLS`
- Fetches on mount and on `groupId` change, then every 10 seconds via `setInterval`
- Accumulates a rolling price history (max 30 points per stock) in a `Map<string, number[]>` for sparkline charts
- Uses `useRef` to track the latest symbols inside the interval callback (avoids stale closure)
- `isAfterHours` is true when `marketState !== "REGULAR"`; in that case `price = yesterdayClose` and `change`/`changePercent` are 0

### Two display modes

- **Normal mode** — full widget with title bar, stock list, group switcher, status bar
- **Compact mode** — minimal floating rows; window resizes dynamically based on stock count and longest code/price; toggled via title bar button
